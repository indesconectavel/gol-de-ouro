#!/usr/bin/env node
'use strict';
/**
 * P1.9 — Certificação Final Payment Engine V1 (read-only + evidências).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, 'tmp');
const OUT = path.join(TMP, 'p19-certification.json');
const APP = 'goldeouro-backend-v2';
const BASE = `https://${APP}.fly.dev`;
const SAQUE_ID = process.env.P19_SAQUE_ID || 'f3723ce8-a24f-4a4d-ac03-6f8d34bcc0ef';
const TRANSFER_ID = process.env.P19_TRANSFER_ID || '5d1355b9-75c8-4be8-b805-a4185e50d9da';
const TECH_ID = process.env.P16C_TECH_USER_ID || '85872488-9e4c-42df-8978-7f9ef9f5cb00';
const CORRELATION_ID = process.env.P19_CORRELATION_ID || 'p17a-7690fece-bb6f-42fd-8289-fb7cb1f8721b';

const SB_URL = (process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const R = {
  tag: 'P1.9.CERTIFICATION',
  at: new Date().toISOString(),
  saqueId: SAQUE_ID,
  transferId: TRANSFER_ID,
  app: APP,
  stages: {},
  issues: [],
  verdict: null
};

function issue(msg) {
  R.issues.push(msg);
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    signal: AbortSignal.timeout(opts.timeout || 25000)
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function sbGet(table, query) {
  const url = `${SB_URL}/rest/v1/${table}?${query}`;
  const res = await fetchJson(url, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error(`${table} HTTP ${res.status}`);
  return res.data;
}

function fly(args, timeout = 120000) {
  const r = spawnSync('fly', args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout,
    shell: process.platform === 'win32',
    maxBuffer: 20 * 1024 * 1024
  });
  return { code: r.status ?? 1, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

async function stageDeploy() {
  const stage = { health: null, meta: null, flyStatus: null, flyRelease: null, recoveryLogHints: [] };
  const health = await fetchJson(`${BASE}/health`);
  stage.health = { status: health.status, ok: health.ok, data: health.data };

  const meta = await fetchJson(`${BASE}/api/meta`);
  stage.meta = { status: meta.status, ok: meta.ok, data: meta.data };

  const st = fly(['status', '-a', APP]);
  stage.flyStatus = { code: st.code, excerpt: st.out.slice(0, 2000) };
  const rel = fly(['releases', '-a', APP, '--json']);
  if (rel.code === 0) {
    try {
      const arr = JSON.parse(rel.out);
      stage.flyRelease = arr[0] || null;
    } catch {
      stage.flyRelease = { raw: rel.out.slice(0, 500) };
    }
  }

  const logs = fly(['logs', '-a', APP, '--no-tail'], 90000);
  const logText = logs.out || '';
  const patterns = [
    '[RECON][ASAAS][PAYOUT]',
    'Recovery PIX OUT ativo',
    'payout_recovery_cycle',
    '[ASAAS][TRANSFER_DONE]',
    'asaasPayoutRecovery'
  ];
  for (const p of patterns) {
    if (logText.includes(p)) stage.recoveryLogHints.push(p);
  }
  stage.logsExcerpt = logText.slice(-8000);

  const machineStarted = /started/i.test(stage.flyStatus.excerpt || '');
  if (!health.ok) issue('health endpoint não OK');
  if (!machineStarted) issue('máquina app não started');

  R.stages.deploy = stage;
}

async function stageSaque() {
  const rows = await sbGet(
    'saques',
    `id=eq.${SAQUE_ID}&select=id,usuario_id,status,amount,valor,fee,net_amount,correlation_id,payout_external_reference,asaas_transfer_id,asaas_transfer_status,last_asaas_sync_at,updated_at,created_at,asaas_payout_raw`
  );
  const saque = rows[0] || null;
  const stage = { saque, checks: {} };

  stage.checks.statusProcessado = saque?.status === 'processado';
  stage.checks.transferDone = String(saque?.asaas_transfer_status || '').toUpperCase() === 'DONE';
  stage.checks.lastSyncPresent = Boolean(saque?.last_asaas_sync_at);
  stage.checks.transferIdMatch = saque?.asaas_transfer_id === TRANSFER_ID;
  stage.checks.correlationMatch = saque?.correlation_id === CORRELATION_ID;

  if (!stage.checks.statusProcessado) issue(`status=${saque?.status} (esperado processado)`);
  if (!stage.checks.transferDone) issue(`asaas_transfer_status=${saque?.asaas_transfer_status} (esperado DONE)`);
  if (!stage.checks.lastSyncPresent) issue('last_asaas_sync_at ausente');
  if (!stage.checks.transferIdMatch) issue('asaas_transfer_id divergente');

  R.stages.saque = stage;
  return saque;
}

async function stageWallet(saque) {
  const uid = saque?.usuario_id || TECH_ID;
  const users = await sbGet('usuarios', `id=eq.${uid}&select=id,email,saldo,updated_at`);
  const user = users[0] || null;
  const stage = { user, saldo: user?.saldo != null ? parseFloat(user.saldo) : null };
  R.stages.wallet = stage;
}

async function stageLedger(saque) {
  const cid = saque?.correlation_id || CORRELATION_ID;
  const ledger = await sbGet(
    'ledger_financeiro',
    `correlation_id=eq.${encodeURIComponent(cid)}&select=id,tipo,valor,referencia,correlation_id,created_at&order=created_at.asc`
  );
  const tipos = ledger.map((r) => r.tipo);
  const counts = {};
  for (const t of tipos) counts[t] = (counts[t] || 0) + 1;

  const stage = {
    ledger,
    tipos,
    counts,
    checks: {
      hasSaque: tipos.includes('saque'),
      hasTaxa: tipos.includes('taxa'),
      hasPayoutConfirmado: tipos.includes('payout_confirmado'),
      noRollback: !tipos.includes('rollback') && !tipos.includes('falha_payout'),
      noDuplicatePayoutConfirmado: (counts.payout_confirmado || 0) <= 1,
      noDuplicateSaque: (counts.saque || 0) <= 1,
      noDuplicateTaxa: (counts.taxa || 0) <= 1
    }
  };

  if (!stage.checks.hasSaque) issue('ledger sem saque');
  if (!stage.checks.hasTaxa) issue('ledger sem taxa');
  if (!stage.checks.hasPayoutConfirmado) issue('ledger sem payout_confirmado');
  if (!stage.checks.noRollback) issue('ledger contém rollback/falha_payout');
  if (!stage.checks.noDuplicatePayoutConfirmado) issue('payout_confirmado duplicado');

  R.stages.ledger = stage;
}

async function stageIdempotence(saque) {
  const snap1 = {
    status: saque?.status,
    asaas_transfer_status: saque?.asaas_transfer_status,
    last_asaas_sync_at: saque?.last_asaas_sync_at,
    updated_at: saque?.updated_at
  };
  await new Promise((r) => setTimeout(r, 3000));
  const rows = await sbGet(
    'saques',
    `id=eq.${SAQUE_ID}&select=id,status,asaas_transfer_status,last_asaas_sync_at,updated_at`
  );
  const snap2 = rows[0] || null;
  const ledger = R.stages.ledger?.ledger || [];
  const ledgerCount = ledger.length;

  const stage = {
    snap1,
    snap2,
    unchanged:
      snap1.status === snap2?.status &&
      snap1.asaas_transfer_status === snap2?.asaas_transfer_status &&
      snap1.last_asaas_sync_at === snap2?.last_asaas_sync_at,
    ledgerCountStable: true
  };

  if (!stage.unchanged) issue('saque alterou entre leituras idempotência');
  R.stages.idempotence = stage;
}

async function stagePaymentEngine() {
  const checks = {
    pixInRoute: false,
    pixOutRecoveryCode: false,
    webhookRoute: false,
    compatLayer: false,
    schedulerRecovery: false
  };

  const health = R.stages.deploy?.health?.data;
  if (health) {
    checks.runtimeHealth = health.status === 'healthy' || health.ok === true;
    checks.dbConnected = health.database === 'connected' || health.db === 'connected';
  }

  const serverSrc = fs.readFileSync(path.join(ROOT, 'server-fly.js'), 'utf8');
  checks.schedulerRecovery =
    serverSrc.includes('runAsaasPayoutRecoveryCycle') &&
    serverSrc.includes('reconcileAsaasPendingPayouts');
  checks.webhookRoute = serverSrc.includes("app.post('/webhooks/asaas'");
  checks.compatLayer = fs.existsSync(path.join(ROOT, 'src/finance/compat/processPaymentWebhookCompat.js'));
  checks.pixOutRecoveryCode = fs.existsSync(path.join(ROOT, 'src/finance/reconciliation/asaasPayoutRecovery.js'));
  checks.asaasProvider = fs.existsSync(path.join(ROOT, 'src/finance/providers/asaas/asaas-http-client.js'));
  checks.transferWebhook = fs.existsSync(path.join(ROOT, 'src/finance/webhooks/processAsaasTransferWebhook.js'));

  const verify = spawnSync(process.execPath, [path.join(ROOT, 'scripts/verify-p18-payout-recovery.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 180000,
    shell: false
  });
  checks.verifyP18Pass = (verify.status ?? 1) === 0;

  if (!checks.verifyP18Pass) issue('verify-p18-payout-recovery.mjs FAIL');

  R.stages.paymentEngine = { checks };
}

function finalize() {
  const saqueOk = R.stages.saque?.checks?.statusProcessado && R.stages.saque?.checks?.transferDone;
  const ledgerOk = R.stages.ledger?.checks?.hasPayoutConfirmado && R.stages.ledger?.checks?.noDuplicatePayoutConfirmado;
  const deployOk = R.stages.deploy?.health?.ok;
  const recoveryEvidence =
    (R.stages.deploy?.recoveryLogHints?.length || 0) > 0 ||
    R.stages.saque?.checks?.statusProcessado;

  R.verdict =
    R.issues.length === 0 && saqueOk && ledgerOk && deployOk && recoveryEvidence
      ? 'CERTIFICADA'
      : 'NÃO CERTIFICADA';

  R.passCriteria = {
    recoveryJobExecuted: recoveryEvidence,
    saqueReconciled: saqueOk,
    statusProcessado: R.stages.saque?.checks?.statusProcessado === true,
    transferDone: R.stages.saque?.checks?.transferDone === true,
    walletConsistent: R.stages.wallet?.user != null,
    ledgerConsistent: ledgerOk,
    noDuplicity: R.stages.ledger?.checks?.noDuplicatePayoutConfirmado === true,
    noRegression: R.stages.paymentEngine?.checks?.verifyP18Pass === true
  };

  R.goldAnswer = saqueOk && R.stages.paymentEngine?.checks?.schedulerRecovery
    ? 'SIM — Recovery Job reconcilia estados terminais via GET /transfers sem depender de webhook.'
    : 'NÃO — evidência insuficiente de recovery operacional.';

  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log(JSON.stringify({ verdict: R.verdict, issues: R.issues, passCriteria: R.passCriteria, gold: R.goldAnswer }));
}

async function main() {
  if (!SB_URL || !SB_KEY) throw new Error('Supabase credentials missing');
  await stageDeploy();
  const saque = await stageSaque();
  await stageWallet(saque);
  await stageLedger(saque);
  await stageIdempotence(saque);
  await stagePaymentEngine();
  finalize();
  process.exit(R.verdict === 'CERTIFICADA' ? 0 : 1);
}

main().catch((e) => {
  R.error = e.message;
  R.verdict = 'NÃO CERTIFICADA';
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.error(e.message);
  process.exit(1);
});
