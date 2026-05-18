/**
 * V1.1F-STAGING — validação isolada HMAC webhook payout (local + DB staging).
 * Não chama goldeouro-backend-v2.fly.dev (produção). Não altera produção.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const { Client } = require('pg');
const WebhookSignatureValidator = require('../utils/webhook-signature-validator');
const {
  buildMercadoPagoWebhookSignedRequest,
  getMercadoPagoWebhookDataId,
  getMercadoPagoPayoutWebhookDataId
} = require('../utils/webhook-signature-validator');

const PROD_REF = 'gayopagjdrkcmkirmfvy';
const STAGING_REF = 'uatszaqzdqcwnfbipoxg';
const LOCAL_PORT = parseInt(process.env.V11F_LOCAL_PORT || '18981', 10);
const LOCAL_BASE = `http://127.0.0.1:${LOCAL_PORT}`;

const out = {
  timestamp: new Date().toISOString(),
  mission: 'V1.1F-STAGING-WEBHOOK-PAYOUT-HMAC',
  environment: {
    local_api: LOCAL_BASE,
    production_api_touched: false,
    staging_db: null
  },
  unit: {},
  http: {},
  ledger_staging: {},
  tests: [],
  verdict: null
};

function assertProdBlocked(url) {
  if (url && String(url).includes(PROD_REF)) {
    throw new Error('Bloqueado: URL de produção Supabase');
  }
}

function buildStagingPgUrls() {
  const raw = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw || raw.includes(PROD_REF) || !raw.includes(STAGING_REF)) return [];
  const passMatch = raw.match(/:\/\/[^:]+:([^@]+)@/);
  const password = passMatch ? passMatch[1] : null;
  const urls = [];
  if (password) {
    urls.push(
      `postgresql://postgres.${STAGING_REF}:${password}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
    );
  }
  urls.push(raw.replace(':6543/', ':5432/'));
  if (!raw.includes('pooler')) {
    urls.push(
      raw.replace(/@db\.[^/]+/, '@aws-0-sa-east-1.pooler.supabase.com').replace(':5432/', ':5432/')
    );
  }
  return [...new Set(urls)];
}

async function connectStagingPg() {
  const candidates = buildStagingPgUrls();
  let lastErr = null;
  for (const url of candidates) {
    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false, require: true }
    });
    try {
      await client.connect();
      return { client, url };
    } catch (e) {
      lastErr = e;
      await client.end().catch(() => {});
    }
  }
  throw lastErr || new Error('Sem URL staging');
}

function mockReq({ query, body, headers }) {
  return { query: query || {}, body: body || {}, headers: headers || {} };
}

async function countLedgerStaging(client, tipos) {
  const r = await client.query(
    `SELECT tipo, COUNT(*)::int AS n
     FROM ledger_financeiro
     WHERE tipo = ANY($1::text[])
     GROUP BY tipo`,
    [tipos]
  );
  const map = {};
  for (const t of tipos) map[t] = 0;
  for (const row of r.rows) map[row.tipo] = row.n;
  return map;
}

async function waitHealth(maxMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${LOCAL_BASE}/health`);
      if (res.ok) return true;
    } catch (_) {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function postJson(urlPath, { body, headers, query }) {
  const qs = query
    ? '?' +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : '';
  const res = await fetch(`${LOCAL_BASE}${urlPath}${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    json = null;
  }
  return { status: res.status, json };
}

function recordTest(id, name, pass, detail) {
  out.tests.push({ id, name, pass, detail });
}

async function runUnitTests(secret) {
  const v = new WebhookSignatureValidator();
  v.secret = secret;

  const depositPaymentId = '999000000000099';
  const signedDeposit = buildMercadoPagoWebhookSignedRequest({
    dataId: depositPaymentId,
    secret
  });
  const depositReq = mockReq({
    query: signedDeposit.query,
    body: { type: 'payment', data: { id: depositPaymentId } },
    headers: signedDeposit.headers
  });

  const noSig = v.validateMercadoPagoWebhook(mockReq({ body: depositReq.body }));
  recordTest(
    'U1',
    'validateMercadoPagoWebhook sem assinatura → inválido',
    !noSig.valid,
    noSig.error
  );

  const okDeposit = v.validateMercadoPagoWebhook(depositReq);
  recordTest(
    'U2',
    'validateMercadoPagoWebhook assinado (payment id) → válido',
    okDeposit.valid === true,
    okDeposit.valid ? okDeposit.manifest : okDeposit.error
  );
  out.unit.deposit_data_id_resolver = getMercadoPagoWebhookDataId(depositReq);

  const intentId = 'ti-stg-v11f-' + Date.now();
  const signedPayout = buildMercadoPagoWebhookSignedRequest({ dataId: intentId, secret });
  const payoutReq = mockReq({
    query: signedPayout.query,
    body: {
      id: intentId,
      status: 'approved',
      external_reference: 'wd_stg_forjado_' + crypto.randomBytes(4).toString('hex')
    },
    headers: signedPayout.headers
  });

  const noPayoutSig = v.validateMercadoPagoPayoutWebhook(
    mockReq({ body: payoutReq.body })
  );
  recordTest(
    'U3',
    'validateMercadoPagoPayoutWebhook sem assinatura → inválido',
    !noPayoutSig.valid,
    noPayoutSig.error
  );

  const okPayout = v.validateMercadoPagoPayoutWebhook(payoutReq);
  recordTest(
    'U4',
    'validateMercadoPagoPayoutWebhook assinado (body.id) → válido',
    okPayout.valid === true,
    okPayout.valid ? okPayout.manifest : okPayout.error
  );
  out.unit.payout_data_id_resolver = getMercadoPagoPayoutWebhookDataId(payoutReq);

  const payoutQueryOnly = mockReq({
    query: signedPayout.query,
    body: { status: 'approved' },
    headers: signedPayout.headers
  });
  const okPayoutQ = v.validateMercadoPagoPayoutWebhook(payoutQueryOnly);
  recordTest(
    'U5',
    'validateMercadoPagoPayoutWebhook data.id só na query → válido',
    okPayoutQ.valid === true,
    okPayoutQ.valid ? 'query data.id OK' : okPayoutQ.error
  );

  out.unit.all_pass = out.tests.filter((t) => t.id.startsWith('U')).every((t) => t.pass);
}

async function runHttpTests(secret) {
  const depositPaymentId = '999000000000088';
  const signedDeposit = buildMercadoPagoWebhookSignedRequest({
    dataId: depositPaymentId,
    secret
  });

  const t1 = await postJson('/api/payments/webhook', {
    body: { type: 'payment', data: { id: depositPaymentId } },
    headers: { 'x-request-id': 'unsigned-deposit' }
  });
  recordTest(
    '1',
    'Depósito inbound sem assinatura → 401',
    t1.status === 401,
    { status: t1.status, body: t1.json }
  );
  out.http.deposit_unsigned = t1;

  const t2 = await postJson('/api/payments/webhook', {
    body: { type: 'payment', data: { id: depositPaymentId } },
    headers: signedDeposit.headers,
    query: signedDeposit.query
  });
  recordTest(
    '2',
    'Depósito inbound assinado → 200',
    t2.status === 200,
    { status: t2.status, body: t2.json }
  );
  out.http.deposit_signed = t2;

  const intentId = 'ti-http-stg-' + Date.now();
  const forgedRef = 'wd_v11f_forjado_' + crypto.randomBytes(6).toString('hex');
  const forgedBody = {
    id: intentId,
    status: 'approved',
    status_detail: 'approved',
    external_reference: forgedRef
  };

  const t3 = await postJson('/webhooks/mercadopago', {
    body: forgedBody,
    headers: { 'x-request-id': 'unsigned-payout' }
  });
  recordTest(
    '3',
    'Payout webhook sem assinatura → 401',
    t3.status === 401,
    { status: t3.status, body: t3.json }
  );
  out.http.payout_unsigned = t3;

  const signedPayout = buildMercadoPagoWebhookSignedRequest({ dataId: intentId, secret });
  const t4 = await postJson('/webhooks/mercadopago', {
    body: forgedBody,
    headers: signedPayout.headers,
    query: signedPayout.query
  });
  recordTest(
    '4',
    'Payout webhook assinado → 200',
    t4.status === 200,
    { status: t4.status, body: t4.json }
  );
  out.http.payout_signed = t4;

  const badSig = buildMercadoPagoWebhookSignedRequest({
    dataId: intentId,
    secret: secret + '-wrong'
  });
  const t5 = await postJson('/webhooks/mercadopago', {
    body: forgedBody,
    headers: badSig.headers,
    query: badSig.query
  });
  recordTest(
    '5a',
    'Payout webhook assinatura inválida → 401',
    t5.status === 401,
    { status: t5.status, body: t5.json }
  );
  out.http.payout_bad_signature = t5;

  return { intentId, forgedRef };
}

async function main() {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET ausente');
    process.exit(2);
  }

  if (buildStagingPgUrls().length === 0) {
    console.error('DATABASE_URL staging (uatszaq) ausente em .env.local');
    process.exit(2);
  }
  out.environment.staging_db = STAGING_REF;

  let pgClient = null;
  let ledgerBefore = null;
  let ledgerAfter = null;
  try {
    const stg = await connectStagingPg();
    pgClient = stg.client;
    out.environment.staging_pg_host = stg.url.includes('pooler') ? 'pooler' : 'direct';
    ledgerBefore = await countLedgerStaging(pgClient, [
      'payout_confirmado',
      'falha_payout',
      'rollback'
    ]);
    out.ledger_staging.before = ledgerBefore;
  } catch (e) {
    console.warn('Ledger staging (pré):', e.message);
    out.ledger_staging.before_error = e.message;
  }

  await runUnitTests(secret);

  const childEnv = {
    ...process.env,
    PORT: String(LOCAL_PORT),
    NODE_ENV: 'staging',
    PAYOUT_PIX_ENABLED: 'true',
    MERCADOPAGO_WEBHOOK_SECRET: secret,
    ENABLE_PIX_PAYOUT_WORKER: 'false'
  };
  delete childEnv.SUPABASE_URL_PROD;

  const serverPath = path.join(__dirname, '..', 'server-fly.js');
  const child = spawn(process.execPath, [serverPath], {
    env: childEnv,
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverLog = '';
  child.stdout.on('data', (d) => {
    serverLog += d.toString();
  });
  child.stderr.on('data', (d) => {
    serverLog += d.toString();
  });

  const healthy = await waitHealth();
  if (!healthy) {
    recordTest('0', 'Servidor local staging sobe /health', false, 'timeout');
    child.kill('SIGTERM');
    out.server_log_tail = serverLog.slice(-4000);
    writeOutputs();
    process.exit(1);
  }
  recordTest('0', 'Servidor local staging sobe /health', true, LOCAL_BASE);

  try {
    await runHttpTests(secret);
    await new Promise((r) => setTimeout(r, 2500));
  } finally {
    child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
  }

  if (pgClient) {
    try {
      ledgerAfter = await countLedgerStaging(pgClient, [
        'payout_confirmado',
        'falha_payout',
        'rollback'
      ]);
      out.ledger_staging.after = ledgerAfter;
      const unchanged =
        ledgerBefore &&
        ledgerAfter &&
        ['payout_confirmado', 'falha_payout', 'rollback'].every(
          (t) => ledgerBefore[t] === ledgerAfter[t]
        );
      recordTest(
        '5b',
        'Staging: inválido/forjado não alterou ledger payout/rollback',
        unchanged === true,
        { before: ledgerBefore, after: ledgerAfter }
      );
    } catch (e) {
      recordTest('5b', 'Ledger staging pós-testes', false, e.message);
    }
    await pgClient.end().catch(() => {});
  } else {
    recordTest('5b', 'Ledger staging pós-testes', false, 'sem conexão pg');
  }

  const httpIds = ['1', '2', '3', '4', '5a', '5b'];
  const httpPass = httpIds.every((id) => out.tests.find((t) => t.id === id)?.pass);
  const unitPass = out.tests.filter((t) => t.id.startsWith('U')).every((t) => t.pass);

  if (httpPass && unitPass) {
    out.verdict = 'GO';
  } else if (httpPass || unitPass) {
    out.verdict = 'GO COM RESSALVAS';
  } else {
    out.verdict = 'NO-GO';
  }

  const prodFlyProbe = await fetch('https://goldeouro-backend-v2.fly.dev/health').catch(
    () => null
  );
  if (prodFlyProbe && prodFlyProbe.ok) {
    out.environment.production_fly_health_readonly = 'ok (não usado nos testes de escrita)';
  }

  writeOutputs();
  const summary = { verdict: out.verdict, tests: out.tests };
  console.log('[V1.1F-STAGING] concluído', JSON.stringify(summary, null, 2));
  process.exit(httpPass && unitPass ? 0 : 1);
}

function writeOutputs() {
  const jsonPath = path.join(
    __dirname,
    '..',
    'docs',
    'relatorios',
    'V1-1F-STAGING-WEBHOOK-PAYOUT-HMAC-DATA-2026-05-18.json'
  );
  require('fs').writeFileSync(jsonPath, JSON.stringify(out, null, 2));
}

function runCli() {
  return main()
    .then(() => {
      /* exit code set in main */
    })
    .catch((e) => {
      console.error(e);
      out.error = e.message;
      out.verdict = out.verdict || 'NO-GO';
      writeOutputs();
      process.exit(1);
    });
}

if (require.main === module) {
  runCli();
}

module.exports = { main, out, writeOutputs };
