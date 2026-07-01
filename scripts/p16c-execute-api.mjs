#!/usr/bin/env node
'use strict';
/**
 * P1.6C / P1.6ZA — Janela PIX OUT via API (P1.6W: auth webhook na janela).
 */
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, 'tmp');
const APP = 'goldeouro-backend-v2';
const BASE = `https://${APP}.fly.dev`;
const SAQUE_ID = process.env.P16C_SAQUE_ID;

dotenv.config({ path: path.join(ROOT, '.env') });

const R = { tag: 'P1.6C.API', saqueId: SAQUE_ID, startedAt: new Date().toISOString() };

function log(m) {
  console.log(m);
  fs.mkdirSync(TMP, { recursive: true });
  fs.appendFileSync(path.join(TMP, 'p16c-api.log'), `${m}\n`);
}
function save() {
  fs.writeFileSync(path.join(TMP, 'p16c-api-state.json'), JSON.stringify(R, null, 2));
}

function fly(args) {
  log(`$ fly ${args.join(' ')}`);
  const r = spawnSync('fly', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  log((r.stdout || '') + (r.stderr || ''));
  return r.status ?? 1;
}

function getFlyJwtSecret() {
  const r = spawnSync('fly', ['ssh', 'console', '-q', '-a', APP, '-C', 'printenv JWT_SECRET'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024
  });
  const lines = `${r.stdout || ''}${r.stderr || ''}`
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 32 && !l.startsWith('Connecting') && !l.startsWith('Error'));
  return lines[lines.length - 1] || process.env.JWT_SECRET;
}

function openGates() {
  R.gates = { openedAt: new Date().toISOString() };
  fly([
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
    'ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED=false',
    '-a',
    APP
  ]);
  fly(['secrets', 'unset', 'PAYOUT_PROVIDER', 'ASAAS_PIX_OUT_ENABLED', '-a', APP]);
  R.gates.closedAt = new Date().toISOString();
}

async function queryAsaasTransfer(transferId) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey || !transferId) return null;
  const base = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/transfers/${encodeURIComponent(transferId)}`, {
      headers: { Accept: 'application/json', access_token: apiKey },
      signal: AbortSignal.timeout(20000)
    });
    const data = await res.json().catch(() => null);
    return { httpStatus: res.status, transfer: data };
  } catch (e) {
    return { error: e.message };
  }
}

async function snapshot(sb) {
  const { data: saque } = await sb.from('saques').select('*').eq('id', SAQUE_ID).maybeSingle();
  let ledger = [];
  let walletSaldo = null;
  if (saque?.correlation_id) {
    const { data: rows } = await sb
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, created_at')
      .eq('correlation_id', saque.correlation_id)
      .order('created_at', { ascending: true });
    ledger = rows || [];
  }
  if (saque?.usuario_id) {
    const { data: u } = await sb.from('usuarios').select('saldo').eq('id', saque.usuario_id).maybeSingle();
    walletSaldo = u?.saldo;
  }
  return { saque, walletSaldo, ledger };
}

function captureFlyLogs() {
  const r = spawnSync('fly', ['logs', '-a', APP, '--no-tail'], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
  const lines = `${r.stdout || ''}${r.stderr || ''}`
    .split('\n')
    .filter((l) => /TRANSFER_AUTH|pix_transfer|TRANSFER_DONE|approve_and_send|PAYOUT|transfer-validation/i.test(l));
  R.flyLogs = lines.slice(-120);
}

async function main() {
  if (process.env.P16C_ALLOW_REAL !== '1' || !SAQUE_ID) {
    console.error('P16C_ALLOW_REAL=1 and P16C_SAQUE_ID required');
    process.exit(1);
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  R.before = await snapshot(sb);
  save();

  openGates();
  log('waiting 100s for runtime...');
  await new Promise((r) => setTimeout(r, 100000));

  const secret = getFlyJwtSecret();
  const { data: admin } = await sb.from('usuarios').select('id, email').eq('tipo', 'admin').limit(1).maybeSingle();
  const token = jwt.sign({ userId: admin.id, email: admin.email }, secret, { expiresIn: '15m' });

  log('POST approve-and-send');
  const res = await fetch(`${BASE}/api/admin/withdraw/approve-and-send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saqueId: SAQUE_ID })
  });
  R.approveSend = { status: res.status, body: await res.json().catch(() => ({})) };
  save();

  if (!R.approveSend.body?.success) {
    R.verdict = 'FAIL';
    R.stopReason = 'approve-and-send failed';
    captureFlyLogs();
    closeGates();
    save();
    process.exit(1);
  }

  log('polling saque status...');
  const terminal = new Set(['processado', 'falhou', 'cancelado', 'pago_manual']);
  const started = Date.now();
  while (Date.now() - started < 240000) {
    await new Promise((r) => setTimeout(r, 15000));
    R.afterPoll = await snapshot(sb);
    save();
    const st = String(R.afterPoll.saque?.status || '').toLowerCase();
    if (terminal.has(st)) break;
  }

  captureFlyLogs();
  R.after = await snapshot(sb);
  const transferId = R.after.saque?.asaas_transfer_id;
  if (transferId) R.asaasTransfer = await queryAsaasTransfer(transferId);

  const authLines = (R.flyLogs || []).filter((l) => /TRANSFER_AUTH|transfer-validation/i.test(l));
  R.authLogLines = authLines.slice(-30);
  R.evidence = {
    authWebhookCalled: authLines.some((l) => /transfer-validation|TRANSFER_AUTH/i.test(l)),
    authApproved: authLines.some((l) => /APPROVED|"status":"APPROVED"/i.test(l)),
    smsMentioned: authLines.some((l) => /SMS|sms/i.test(l)),
    transferDone:
      (R.flyLogs || []).some((l) => /TRANSFER_DONE/i.test(l)) ||
      String(R.after.saque?.asaas_transfer_status || '').toUpperCase() === 'DONE',
    asaas_transfer_id: transferId,
    asaas_transfer_status: R.after.saque?.asaas_transfer_status,
    saqueStatus: R.after.saque?.status
  };

  closeGates();
  const ev = R.evidence;
  if (ev.authApproved && ev.transferDone && !ev.smsMentioned) R.verdict = 'PASS';
  else if (ev.authApproved && R.approveSend.body?.success) R.verdict = 'PASS_COM_RESSALVAS';
  else if (!ev.authWebhookCalled || !R.approveSend.body?.success) R.verdict = 'FAIL';
  else R.verdict = 'PASS_COM_RESSALVAS';
  R.finishedAt = new Date().toISOString();
  save();
  log(`VERDICT: ${R.verdict}`);
}

main().catch((e) => {
  R.verdict = 'FAIL';
  R.stopReason = e.message;
  save();
  closeGates();
  process.exit(1);
});
