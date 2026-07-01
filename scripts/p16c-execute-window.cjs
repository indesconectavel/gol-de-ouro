#!/usr/bin/env node
'use strict';
/**
 * P1.6C — Executa janela PIX OUT única (saque já criado).
 * P16C_SAQUE_ID obrigatório · P16C_ALLOW_REAL=1
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config();

const ROOT = process.cwd();
const TMP = path.join(ROOT, 'tmp');
const APP = 'goldeouro-backend-v2';
const SAQUE_ID = process.env.P16C_SAQUE_ID;
const MIN_WAIT_MS = 90000;
const MAX_WAIT_MS = 300000;
const POLL_MS = 15000;

const R = { tag: 'P1.6C.EXECUTE', saqueId: SAQUE_ID, startedAt: new Date().toISOString() };

function log(m) {
  console.log(`[${new Date().toISOString()}] ${m}`);
  fs.mkdirSync(TMP, { recursive: true });
  fs.appendFileSync(path.join(TMP, 'p16c-execute.log'), `${m}\n`);
}
function save() {
  fs.writeFileSync(path.join(TMP, 'p16c-execute-state.json'), JSON.stringify(R, null, 2));
}

function fly(args, timeout = 300000) {
  log(`$ fly ${args.join(' ')}`);
  const r = spawnSync('fly', args, { cwd: ROOT, encoding: 'utf8', timeout, maxBuffer: 20 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (out) log(out.slice(0, 12000));
  return { code: r.status ?? 1, out };
}

function flySsh(inner, timeout = 360000) {
  return fly(['ssh', 'console', '-a', APP, '-C', `sh -c ${JSON.stringify(inner)}`], timeout);
}

function closeGates() {
  if (!R.gates?.openedAt) return;
  fly([
    'secrets',
    'set',
    'ASAAS_PIX_OUT_PRODUCTION_ENABLED=false',
    'PAYMENT_ENGINE_PIXOUT_ENABLED=false',
    'ASAAS_PRODUCTION_ENABLED=false',
    'PAYOUT_PIX_ENABLED=false',
    '-a',
    APP
  ]);
  fly(['secrets', 'unset', 'PAYOUT_PROVIDER', 'ASAAS_PIX_OUT_ENABLED', '-a', APP]);
  R.gates.closedAt = new Date().toISOString();
  save();
}

function fail(reason) {
  R.verdict = 'FAIL';
  R.stopReason = reason;
  save();
  closeGates();
  process.exit(1);
}

async function fetchHealth() {
  const res = await fetch(`https://${APP}.fly.dev/health`, { signal: AbortSignal.timeout(20000) });
  const body = await res.json();
  return res.ok && body?.database === 'connected';
}

async function waitRuntime() {
  const t0 = Date.now();
  while (Date.now() - t0 < MAX_WAIT_MS) {
    if (Date.now() - t0 >= MIN_WAIT_MS) {
      const st = fly(['status', '-a', APP]);
      const ok = await fetchHealth();
      if (/started/i.test(st.out) && /1 passing/i.test(st.out) && ok) return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  fail('runtime timeout');
}

function captureLogs() {
  const r = fly(['logs', '-a', APP, '--no-tail'], 120000);
  R.flyLogs = r.out
    .split('\n')
    .filter((l) => /TRANSFER_AUTH|pix_transfer|TRANSFER_DONE|approve_and_send|PAYOUT/i.test(l))
    .slice(-100);
  save();
}

async function snapshot() {
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: saque } = await sb
    .from('saques')
    .select('*')
    .eq('id', SAQUE_ID)
    .maybeSingle();
  let ledger = [];
  let walletSaldo = null;
  if (saque?.correlation_id) {
    const { data: rows } = await sb
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, created_at')
      .eq('correlation_id', saque.correlation_id);
    ledger = rows || [];
  }
  if (saque?.usuario_id) {
    const { data: u } = await sb.from('usuarios').select('saldo').eq('id', saque.usuario_id).maybeSingle();
    walletSaldo = u?.saldo;
  }
  R.snapshot = { at: new Date().toISOString(), saque, walletSaldo, ledger };
  save();
}

async function main() {
  if (process.env.P16C_ALLOW_REAL !== '1') {
    console.error('P16C_ALLOW_REAL=1 required');
    process.exit(1);
  }
  if (!SAQUE_ID) {
    console.error('P16C_SAQUE_ID required');
    process.exit(1);
  }

  R.gates = {};
  if (!(await fetchHealth())) fail('health');

  R.gates.openedAt = new Date().toISOString();
  const open = fly([
    'secrets',
    'set',
    'ASAAS_PIX_OUT_PRODUCTION_ENABLED=true',
    'PAYMENT_ENGINE_PIXOUT_ENABLED=true',
    'ASAAS_PIX_OUT_ENABLED=true',
    'ASAAS_PRODUCTION_ENABLED=true',
    'PAYOUT_PIX_ENABLED=true',
    'PAYOUT_PROVIDER=asaas',
    '-a',
    APP
  ]);
  if (open.code !== 0) fail('open gates');
  save();

  try {
    await waitRuntime();

    const pre = flySsh(`P15Y_PHASE=preflight P15Y_SAQUE_ID=${SAQUE_ID}`);
    R.preflight = { code: pre.code, out: pre.out.slice(0, 12000) };
    if (!/preflight","result":"PASS"/.test(pre.out)) fail('preflight');

    const exec = flySsh(`P15Y_PHASE=execute P15Y_ALLOW_REAL_PAYOUT=1 P15Y_SAQUE_ID=${SAQUE_ID}`, 300000);
    R.execute = { code: exec.code, out: exec.out.slice(0, 20000) };
    save();
    captureLogs();
    if (!/execute","result":"PASS"/.test(exec.out)) fail('execute');

    const wait = flySsh(`P15Y_PHASE=wait P15Y_SAQUE_ID=${SAQUE_ID} P15Y_WAIT_TIMEOUT_MS=240000`, 300000);
    R.wait = { code: wait.code, out: wait.out.slice(0, 12000) };
    captureLogs();
    await snapshot();

    R.evidence = {
      authApproved: (R.flyLogs || []).some((l) => /TRANSFER_AUTH.*APPROVED|"status":"APPROVED"/i.test(l)),
      transferDone: (R.flyLogs || []).some((l) => /TRANSFER_DONE/i.test(l))
    };

    closeGates();
    R.verdict =
      R.evidence.authApproved && /execute","result":"PASS"/.test(exec.out) ? 'PASS' : 'PASS_COM_RESSALVAS';
    R.finishedAt = new Date().toISOString();
    save();
    log(`VERDICT: ${R.verdict}`);
  } catch (e) {
    fail(e.message);
  }
}

main();
