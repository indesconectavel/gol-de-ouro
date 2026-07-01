#!/usr/bin/env node
'use strict';
/**
 * P1.6C.RETRY / P1.6ZA — Homologação end-to-end: webhook auth + PIX OUT (P1.6W).
 * Uma execução · fecha gates no finally · sem retry automático.
 *
 * Uso:
 *   P16C_ALLOW_REAL=1 node scripts/p16c-retry-homolog.cjs
 */
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config();

const ROOT = process.cwd();
const TMP = path.join(ROOT, 'tmp');
const APP = 'goldeouro-backend-v2';
const BACKEND = `https://${APP}.fly.dev`;
const TECH_USER_ID = process.env.P16C_TECH_USER_ID || '85872488-9e4c-42df-8978-7f9ef9f5cb00';
const PIX_KEY = process.env.P16C_PIX_KEY || 'indesconectavel@gmail.com';
const PIX_TYPE = process.env.P16C_PIX_TYPE || 'email';
const WITHDRAW_AMOUNT = Number(process.env.P16C_AMOUNT || 10);
const MIN_WAIT_MS = 90000;
const MAX_WAIT_MS = 300000;
const POLL_MS = 15000;

const R = {
  tag: 'P1.6C.RETRY',
  startedAt: new Date().toISOString(),
  saqueId: null,
  correlationId: null,
  phase: null,
  verdict: null,
  stopReason: null,
  timeline: [],
  logs: [],
  gates: {},
  createWithdraw: null,
  preflight: null,
  execute: null,
  wait: null,
  flyLogs: null,
  snapshot: null
};

function ts() {
  return new Date().toISOString();
}
function log(m) {
  const l = `[${ts()}] ${m}`;
  R.logs.push(l);
  console.log(l);
  fs.mkdirSync(TMP, { recursive: true });
  fs.appendFileSync(path.join(TMP, 'p16c-retry.log'), `${l}\n`);
}
function timeline(p, d) {
  R.timeline.push({ at: ts(), phase: p, detail: d });
  log(`${p}: ${d}`);
}
function save() {
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(path.join(TMP, 'p16c-retry-state.json'), JSON.stringify(R, null, 2));
}

function fly(args, timeout = 300000) {
  log(`$ fly ${args.join(' ')}`);
  const r = spawnSync('fly', args, { cwd: ROOT, encoding: 'utf8', timeout, shell: false, maxBuffer: 20 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (out) log(out.slice(0, 15000));
  return { code: r.status ?? 1, out };
}

function flySsh(inner, timeout = 360000) {
  const cmd = `sh -c ${JSON.stringify(inner)}`;
  return fly(['ssh', 'console', '-a', APP, '-C', cmd], timeout);
}

function getJwtSecret() {
  let secret = process.env.JWT_SECRET;
  if (String(process.env.USE_FLY_JWT || 'true').toLowerCase() === 'true') {
    const raw = fly(['ssh', 'console', '-q', '-a', APP, '-C', 'printenv JWT_SECRET'], 120000).out;
    const line = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          l.length >= 32 &&
          !l.startsWith('Connecting') &&
          !l.includes('machine specified') &&
          !l.startsWith('Error:')
      );
    secret = line[line.length - 1] || secret;
  }
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET ausente ou inválido');
  }
  return secret;
}

function closeGates() {
  if (!R.gates.openedAt) {
    timeline('close-gates', 'skip — janela nunca aberta');
    save();
    return;
  }
  timeline('close-gates', 'restaurando OFF');
  fly([
    'secrets',
    'set',
    'ASAAS_PIX_OUT_PRODUCTION_ENABLED=false',
    'PAYMENT_ENGINE_PIXOUT_ENABLED=false',
    'ASAAS_PRODUCTION_ENABLED=false',
    'PAYOUT_PIX_ENABLED=false',
    'ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED=false',
    '-a',
    APP
  ]);
  fly(['secrets', 'unset', 'PAYOUT_PROVIDER', 'ASAAS_PIX_OUT_ENABLED', '-a', APP]);
  R.gates.closedAt = ts();
  save();
}

function fail(phase, reason) {
  R.phase = phase;
  R.verdict = 'FAIL';
  R.stopReason = reason;
  timeline('FAIL', `${phase}: ${reason}`);
  closeGates();
  R.finishedAt = ts();
  save();
  process.exit(1);
}

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE credentials missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function fetchHealth() {
  try {
    const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(20000) });
    const body = await res.json();
    return { ok: res.ok && body?.database === 'connected', status: res.status, body };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function parseFlyStarted(out) {
  const rows = out.split('\n');
  for (const row of rows) {
    if (row.includes('app') && row.includes('│')) {
      return { started: /started/i.test(row), checksPass: /1 passing/i.test(row), row: row.trim() };
    }
  }
  return { started: false, checksPass: false, row: null };
}

async function waitForRuntime() {
  const t0 = Date.now();
  timeline('wait-runtime', `min ${MIN_WAIT_MS / 1000}s`);
  let stable = false;
  while (Date.now() - t0 < MAX_WAIT_MS) {
    const elapsed = Date.now() - t0;
    if (elapsed >= MIN_WAIT_MS) {
      const st = fly(['status', '-a', APP], 120000);
      const health = await fetchHealth();
      const parsed = parseFlyStarted(st.out);
      log(`poll ${Math.round(elapsed / 1000)}s started=${parsed.started} health=${health.ok}`);
      if (parsed.started && parsed.checksPass && health.ok) {
        stable = true;
        R.runtimeStable = { at: ts(), parsed, health: health.body };
        break;
      }
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  if (!stable) fail('wait-runtime', 'runtime não estabilizou');
}

async function ensureTechUserCpf(sb) {
  const { data: user } = await sb.from('usuarios').select('id, email, saldo, cpf_cnpj').eq('id', TECH_USER_ID).maybeSingle();
  if (!user?.id) fail('create-withdraw', 'conta técnica não encontrada');
  const digits = String(user.cpf_cnpj || '').replace(/\D/g, '');
  if (PIX_TYPE === 'email' && ![11, 14].includes(digits.length)) {
    const placeholder = process.env.P16C_OWNER_CPF || '39053344705';
    const { error } = await sb.from('usuarios').update({ cpf_cnpj: placeholder }).eq('id', TECH_USER_ID);
    if (error) fail('create-withdraw', `cpf_cnpj update: ${error.message}`);
    timeline('create-withdraw', `cpf_cnpj definido para chave email (${placeholder.slice(0, 3)}***)`);
  }
  if (parseFloat(user.saldo) < WITHDRAW_AMOUNT) {
    fail('create-withdraw', `saldo wallet insuficiente: ${user.saldo}`);
  }
  return user;
}

async function createTechnicalWithdraw() {
  const sb = getSupabase();
  const user = await ensureTechUserCpf(sb);

  const { data: pending } = await sb
    .from('saques')
    .select('id, status')
    .eq('usuario_id', TECH_USER_ID)
    .in('status', ['pendente', 'pending'])
    .limit(1);
  if (pending?.length) {
    R.saqueId = pending[0].id;
    timeline('create-withdraw', `reutilizando pendente existente ${R.saqueId}`);
    save();
    return;
  }

  R.correlationId = `p16c-${crypto.randomUUID()}`;
  const walletBefore = parseFloat(user.saldo);

  let secret;
  try {
    secret = getJwtSecret();
  } catch (e) {
    fail('create-withdraw', e.message);
  }

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: TECH_USER_ID, email: user.email }, secret, { expiresIn: '15m' });

  const res = await fetch(`${BACKEND}/api/withdraw/request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-idempotency-key': R.correlationId
    },
    body: JSON.stringify({
      valor: WITHDRAW_AMOUNT,
      chave_pix: PIX_KEY,
      tipo_chave: PIX_TYPE
    })
  });
  const body = await res.json().catch(() => ({}));
  const parsed = { status: res.status, body };

  R.createWithdraw = {
    via: 'production_api',
    jwtFromFly: String(process.env.USE_FLY_JWT || 'true').toLowerCase() === 'true',
    parsed,
    correlationId: R.correlationId,
    walletBefore
  };
  save();

  const httpStatus = parsed?.status;
  const respBody = parsed?.body || {};
  if (![200, 201].includes(httpStatus) || !respBody?.success) {
    fail('create-withdraw', respBody?.message || `HTTP ${httpStatus}`);
  }

  R.saqueId = respBody.data?.id;
  if (!R.saqueId) fail('create-withdraw', 'saque id ausente na resposta remota');

  const bundle = await readSaqueBundle(sb, R.saqueId);
  R.createWithdraw.after = bundle;
  timeline('create-withdraw', `saque ${R.saqueId} net=${bundle.saque?.net_amount}`);
  save();
}

async function readSaqueBundle(sb, saqueId) {
  const { data: saque } = await sb
    .from('saques')
    .select(
      'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, payout_external_reference, asaas_transfer_id, asaas_transfer_status, asaas_payout_raw, last_asaas_sync_at, pix_key, chave_pix, created_at, updated_at'
    )
    .eq('id', saqueId)
    .maybeSingle();

  let walletSaldo = null;
  let ledger = [];
  if (saque?.usuario_id) {
    const { data: user } = await sb.from('usuarios').select('saldo').eq('id', saque.usuario_id).maybeSingle();
    walletSaldo = user?.saldo ?? null;
    if (saque.correlation_id) {
      const { data: rows } = await sb
        .from('ledger_financeiro')
        .select('id, tipo, valor, referencia, correlation_id, created_at')
        .eq('correlation_id', saque.correlation_id)
        .order('created_at', { ascending: true });
      ledger = rows || [];
    }
  }
  return { saque, walletSaldo, ledger };
}

function captureFlyLogs() {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const r = fly(['logs', '-a', APP, '--no-tail'], 120000);
  const lines = r.out.split('\n');
  const filtered = lines.filter(
    (l) =>
      /TRANSFER_AUTH|pix_transfer|approve_and_send|PAYOUT|\/transfers|transfer-validation|TRANSFER_DONE/i.test(l)
  );
  R.flyLogs = { capturedAt: ts(), lineCount: filtered.length, lines: filtered.slice(-80) };
  save();
  return filtered;
}

async function main() {
  if (process.env.P16C_ALLOW_REAL !== '1') {
    console.error('P16C_ALLOW_REAL=1 obrigatório');
    process.exit(1);
  }

  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(path.join(TMP, 'p16c-retry.log'), '');

  try {
    R.phase = 'precheck';
    const health0 = await fetchHealth();
    if (!health0.ok) fail('precheck', 'health pré-janela');
    const secrets = fly(['secrets', 'list', '-a', APP]);
    if (/ASAAS_PIX_OUT_PRODUCTION_ENABLED.*true/i.test(secrets.out)) {
      fail('precheck', 'gates PIX OUT já abertos');
    }
    timeline('precheck', 'health OK, gates OFF');

    R.phase = 'create-withdraw';
    await createTechnicalWithdraw();

    R.phase = 'open-gates';
    R.gates.openedAt = ts();
    const open = fly([
      'secrets',
      'set',
      'ASAAS_PIX_OUT_PRODUCTION_ENABLED=true',
      'PAYMENT_ENGINE_PIXOUT_ENABLED=true',
      'ASAAS_PIX_OUT_ENABLED=true',
      'ASAAS_PRODUCTION_ENABLED=true',
      'PAYOUT_PIX_ENABLED=true',
      'PAYOUT_PROVIDER=asaas',
      'ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED=true',
      '-a',
      APP
    ]);
    if (open.code !== 0) fail('open-gates', 'fly secrets set');
    timeline('open-gates', 'janela aberta');
    save();

    await waitForRuntime();

    R.phase = 'preflight';
    const pre = flySsh(`P15Y_PHASE=preflight P15Y_SAQUE_ID=${R.saqueId}`, 300000);
    R.preflight = { code: pre.code, out: pre.out.slice(0, 15000) };
    save();
    const prePass = /preflight","result":"PASS"/.test(pre.out);
    if (!prePass && pre.code !== 0) fail('preflight', 'preflight remoto falhou');

    R.phase = 'execute';
    const exec = flySsh(
      `P15Y_PHASE=execute P15Y_ALLOW_REAL_PAYOUT=1 P15Y_SAQUE_ID=${R.saqueId}`,
      300000
    );
    R.execute = { code: exec.code, out: exec.out.slice(0, 25000) };
    save();

    const execPass = /execute","result":"PASS"/.test(exec.out);
    if (!execPass) {
      captureFlyLogs();
      fail('execute', 'approve-and-send / PIX OUT falhou');
    }

    timeline('execute', 'PIX OUT HTTP OK');
    captureFlyLogs();

    R.phase = 'wait';
    const wait = flySsh(
      `P15Y_PHASE=wait P15Y_SAQUE_ID=${R.saqueId} P15Y_WAIT_TIMEOUT_MS=180000`,
      240000
    );
    R.wait = { code: wait.code, out: wait.out.slice(0, 15000) };
    save();
    captureFlyLogs();

    const sb = getSupabase();
    R.snapshot = await readSaqueBundle(sb, R.saqueId);
    R.snapshot.at = ts();

    R.phase = 'close-gates';
    closeGates();

    const authInLogs = (R.flyLogs?.lines || []).some((l) => /TRANSFER_AUTH.*APPROVED|status.*APPROVED/i.test(l));
    const transferDone = (R.flyLogs?.lines || []).some((l) => /TRANSFER_DONE/i.test(l));
    const waitOk = wait.code === 0 || /wait","result":"PASS"/.test(wait.out);

    if (execPass && authInLogs && waitOk) R.verdict = 'PASS';
    else if (execPass && (authInLogs || /asaas_transfer_id/.test(exec.out))) R.verdict = 'PASS_COM_RESSALVAS';
    else R.verdict = 'FAIL';

    R.evidence = {
      authWebhookSeen: authInLogs,
      transferDoneSeen: transferDone,
      asaas_transfer_id: R.snapshot?.saque?.asaas_transfer_id,
      asaas_transfer_status: R.snapshot?.saque?.asaas_transfer_status,
      saqueStatus: R.snapshot?.saque?.status
    };

    R.finishedAt = ts();
    save();
    log(`VERDICT: ${R.verdict}`);
    if (R.verdict === 'FAIL') process.exit(1);
  } catch (e) {
    fail(R.phase || 'bootstrap', e.message);
  }
}

main();
