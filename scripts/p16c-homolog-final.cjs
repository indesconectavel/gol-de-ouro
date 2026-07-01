#!/usr/bin/env node
'use strict';
/**
 * P1.6C / P1.6E / P1.6W / P1.6ZA — Homologação end-to-end.
 * P1.6W: webhook financeiro desacoplado; openGates habilita auth webhook na janela.
 *
 * Fases (P16C_PHASE):
 *   auth-preflight — valida JWT admin apenas (sem gates, sem approve-and-send)
 *   homolog        — janela PIX OUT completa (default)
 *
 * Requer: P16C_ALLOW_REAL=1, P16C_SAQUE_ID
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  maskId,
  resolveProductionJwtSecret,
  resolveAdminActor,
  signAdminJwt,
  verifyAdminJwtLocally,
  probeAdminAuth
} = require('./lib/p16c-admin-auth.cjs');

const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, 'tmp');
const APP = 'goldeouro-backend-v2';
const BASE = `https://${APP}.fly.dev`;
const SAQUE_ID = process.env.P16C_SAQUE_ID || 'd0313dfe-b08a-4334-a3ca-d9e7011af38a';
const PHASE = (process.env.P16C_PHASE || 'homolog').toLowerCase();

const R = {
  tag: 'P1.6E.HOMOLOG',
  phase: PHASE,
  saqueId: SAQUE_ID,
  startedAt: new Date().toISOString(),
  gates: {},
  timeline: [],
  logs: [],
  auth: null
};

function ts() {
  return new Date().toISOString();
}
function log(m) {
  const l = `[${ts()}] ${m}`;
  R.logs.push(l);
  console.log(l);
  fs.mkdirSync(TMP, { recursive: true });
  fs.appendFileSync(path.join(TMP, 'p16c-homolog.log'), `${l}\n`);
}
function timeline(p, d) {
  R.timeline.push({ at: ts(), phase: p, detail: d });
  log(`${p}: ${d}`);
}
function save() {
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(path.join(TMP, 'p16c-homolog-state.json'), JSON.stringify(R, null, 2));
}

function fly(args, timeout = 300000) {
  log(`$ fly ${args.join(' ')}`);
  const r = spawnSync('fly', args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout,
    shell: process.platform === 'win32',
    maxBuffer: 25 * 1024 * 1024
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (out) log(out.slice(0, 14000));
  return { code: r.status ?? 1, out };
}

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function snapshot(sb) {
  const { data: saque } = await sb
    .from('saques')
    .select(
      'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, payout_external_reference, asaas_transfer_id, asaas_transfer_status, asaas_payout_raw, last_asaas_sync_at, pix_key, chave_pix, created_at, updated_at'
    )
    .eq('id', SAQUE_ID)
    .maybeSingle();
  let ledger = [];
  let walletSaldo = null;
  if (saque?.correlation_id) {
    const { data: rows } = await sb
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, correlation_id, created_at')
      .eq('correlation_id', saque.correlation_id)
      .order('created_at', { ascending: true });
    ledger = rows || [];
  }
  if (saque?.usuario_id) {
    const { data: u } = await sb.from('usuarios').select('saldo, email').eq('id', saque.usuario_id).maybeSingle();
    walletSaldo = u?.saldo ?? null;
  }
  return { saque, walletSaldo, ledger };
}

function openGates() {
  R.gates.openedAt = ts();
  timeline('open-gates', 'janela PIX OUT + webhook auth (P1.6W/P1.6ZA)');
  const r = fly([
    'secrets', 'set',
    'ASAAS_PIX_OUT_PRODUCTION_ENABLED=true',
    'PAYMENT_ENGINE_PIXOUT_ENABLED=true',
    'ASAAS_PIX_OUT_ENABLED=true',
    'ASAAS_PRODUCTION_ENABLED=true',
    'PAYOUT_PIX_ENABLED=true',
    'PAYOUT_PROVIDER=asaas',
    'ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED=true',
    '-a', APP
  ]);
  if (r.code !== 0) throw new Error('open gates failed');
}

function closeGates() {
  if (!R.gates.openedAt) return;
  timeline('close-gates', 'restaurando gates OFF (incl. ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED=false)');
  fly([
    'secrets', 'set',
    'ASAAS_PIX_OUT_PRODUCTION_ENABLED=false',
    'PAYMENT_ENGINE_PIXOUT_ENABLED=false',
    'ASAAS_PRODUCTION_ENABLED=false',
    'PAYOUT_PIX_ENABLED=false',
    'ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED=false',
    '-a', APP
  ]);
  fly(['secrets', 'unset', 'PAYOUT_PROVIDER', 'ASAAS_PIX_OUT_ENABLED', '-a', APP]);
  R.gates.closedAt = ts();
  save();
}

function captureFlyLogs() {
  const r = fly(['logs', '-a', APP, '--no-tail'], 180000);
  const lines = r.out.split('\n').filter((l) =>
    /TRANSFER_AUTH|transfer-validation|pix_transfer|TRANSFER_DONE|approve_and_send|PAYOUT|SMS/i.test(l)
  );
  R.flyLogs = lines.slice(-150);
  R.authLogLines = lines.filter((l) => /TRANSFER_AUTH|transfer-validation/i.test(l)).slice(-40);
}

async function queryAsaasTransfer(transferId) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey || !transferId) return null;
  const base = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');
  const res = await fetch(`${base}/transfers/${encodeURIComponent(transferId)}`, {
    headers: { Accept: 'application/json', access_token: apiKey },
    signal: AbortSignal.timeout(25000)
  });
  const data = await res.json().catch(() => null);
  return {
    httpStatus: res.status,
    id: data?.id,
    status: data?.status,
    value: data?.value,
    authorized: data?.authorized,
    failReason: data?.failReason,
    transactionReceiptUrl: data?.transactionReceiptUrl ? '(present)' : null
  };
}

/**
 * Monta e valida JWT administrativo (P1.6E).
 * @returns {Promise<{ actor, secretSource, tokenPreview, probe }>}
 */
async function prepareAdminAuth(sb) {
  log('Obtendo JWT_SECRET de produção…');
  const { secret, source } = resolveProductionJwtSecret({ cwd: ROOT, log });
  log('JWT_SECRET obtido (valor omitido).');

  log('Resolvendo usuário administrativo…');
  const actor = await resolveAdminActor(sb);
  if (String(actor.tipo || '').toLowerCase() !== 'admin') {
    throw new Error(`perfil administrativo inválido: tipo=${actor.tipo || '?'}`);
  }
  log(`Perfil administrativo confirmado: userId=${maskId(actor.id)} tipo=admin`);

  log('Assinando JWT (HS256, 15m)…');
  const token = signAdminJwt(actor, secret);
  log('JWT assinado (token omitido).');

  log('Validando claims localmente…');
  const claims = verifyAdminJwtLocally(token, secret, actor);
  log(`Claims OK: userId=${maskId(claims.userId)} exp=${claims.exp || '?'}`);

  log('Pré-validação remota: GET /api/admin/withdraw/list (read-only)…');
  const probe = await probeAdminAuth(BASE, token);
  R.auth = {
    secretSource: source,
    actorId: actor.id,
    actorEmailMasked: actor.email ? `${String(actor.email).slice(0, 3)}***` : null,
    tokenLength: token.length,
    claimsExp: claims.exp,
    probeStatus: probe.status,
    probeOk: probe.ok,
    probeMessage: probe.body?.message || null
  };
  save();

  if (probe.status === 403 && /token inválido/i.test(String(probe.body?.message || ''))) {
    throw new Error('pré-validação remota: invalid signature — JWT_SECRET incompatível com produção');
  }
  if (probe.status === 403 && /administrador/i.test(String(probe.body?.message || ''))) {
    throw new Error('pré-validação remota: usuário sem privilégio administrativo');
  }
  if (!probe.ok) {
    throw new Error(
      `pré-validação admin falhou: HTTP ${probe.status} — ${probe.body?.message || 'sem mensagem'}`
    );
  }
  log('Pré-validação administrativa OK (HTTP ' + probe.status + ').');

  return { actor, secret, source, token, probe };
}

async function postApproveAndSend(token) {
  log('Executando approve-and-send…');
  const res = await fetch(`${BASE}/api/admin/withdraw/approve-and-send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saqueId: SAQUE_ID })
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function computeVerdict() {
  const ev = R.evidence || {};
  if (ev.authApproved && ev.transferDone && !ev.smsMentioned) return 'PASS';
  if (ev.authApproved && R.approveSend?.body?.success) return 'PASS_COM_RESSALVAS';
  if (!ev.authWebhookCalled || !R.approveSend?.body?.success) return 'FAIL';
  return 'PASS_COM_RESSALVAS';
}

function requireEnv() {
  if (process.env.P16C_ALLOW_REAL !== '1') {
    console.error('P16C_ALLOW_REAL=1 required');
    process.exit(1);
  }
  if (!SAQUE_ID) {
    console.error('P16C_SAQUE_ID required');
    process.exit(1);
  }
}

async function runAuthPreflight() {
  requireEnv();
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(path.join(TMP, 'p16c-homolog.log'), '');

  timeline('auth-preflight', 'início — sem gates, sem approve-and-send');
  const health = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(20000) }).then((r) => r.json());
  R.health = health;
  if (health?.database !== 'connected') throw new Error('health/database');

  const sb = getSupabase();
  await prepareAdminAuth(sb);

  R.verdict = 'PASS';
  R.finishedAt = ts();
  save();
  log('VERDICT: PASS (auth-preflight)');
}

async function runHomolog() {
  requireEnv();
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(path.join(TMP, 'p16c-homolog.log'), '');

  try {
    timeline('precheck', 'health + gates OFF');
    const health = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(20000) }).then((r) => r.json());
    R.health = health;
    if (health?.database !== 'connected') throw new Error('health/database');

    const secrets = fly(['secrets', 'list', '-a', APP]);
    if (/ASAAS_PIX_OUT_PRODUCTION_ENABLED\s+true/i.test(secrets.out)) {
      throw new Error('gates PIX OUT já abertos');
    }

    const sb = getSupabase();
    R.before = await snapshot(sb);
    save();

    const st = String(R.before.saque?.status || '').toLowerCase();
    if (!['pendente', 'pending'].includes(st)) {
      throw new Error(`saque status=${st} — esperado pendente`);
    }
    timeline('precheck', `saque pendente net=${R.before.saque?.net_amount}`);

    timeline('auth', 'pré-validação administrativa antes da janela');
    const { token } = await prepareAdminAuth(sb);

    timeline('open-gates', 'janela única');
    openGates();
    save();

    timeline('wait-runtime', '100s após deploy');
    await new Promise((r) => setTimeout(r, 100000));

    timeline('execute', 'approve-and-send única tentativa');
    R.approveSend = await postApproveAndSend(token);
    save();

    if (!R.approveSend.body?.success) {
      R.stopReason = R.approveSend.body?.message || 'approve-and-send failed';
      captureFlyLogs();
      throw new Error(R.stopReason);
    }

    timeline('wait', 'polling até 240s');
    const terminal = new Set(['processado', 'falhou', 'cancelado', 'pago_manual']);
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) {
      await new Promise((r) => setTimeout(r, 15000));
      R.afterPoll = await snapshot(sb);
      save();
      const s = String(R.afterPoll.saque?.status || '').toLowerCase();
      const ts2 = String(R.afterPoll.saque?.asaas_transfer_status || '').toUpperCase();
      log(`poll status=${s} transfer=${ts2}`);
      if (terminal.has(s) || ts2 === 'DONE' || ['FAILED', 'CANCELLED', 'BLOCKED'].includes(ts2)) break;
    }

    captureFlyLogs();
    R.after = await snapshot(sb);
    const transferId = R.after.saque?.asaas_transfer_id;
    if (transferId) R.asaasTransfer = await queryAsaasTransfer(transferId);

    const authLines = R.authLogLines || [];
    R.evidence = {
      authWebhookCalled: authLines.some((l) => /transfer-validation|TRANSFER_AUTH/i.test(l)),
      authApproved: authLines.some((l) => /APPROVED|"status":"APPROVED"/i.test(l)),
      smsMentioned: authLines.some((l) => /SMS|sms|authorized.*false/i.test(l)),
      transferDone:
        (R.flyLogs || []).some((l) => /TRANSFER_DONE/i.test(l)) ||
        String(R.after.saque?.asaas_transfer_status || '').toUpperCase() === 'DONE' ||
        String(R.after.saque?.status || '').toLowerCase() === 'processado',
      asaas_transfer_id: transferId,
      asaas_transfer_status: R.after.saque?.asaas_transfer_status,
      saqueStatus: R.after.saque?.status
    };

    timeline('close-gates', 'fechamento imediato');
    closeGates();

    R.verdict = computeVerdict();
    R.finishedAt = ts();
    save();
    log(`VERDICT: ${R.verdict}`);
    if (R.verdict === 'FAIL') process.exit(1);
  } catch (e) {
    R.verdict = 'FAIL';
    R.stopReason = e.message;
    timeline('FAIL', e.message);
    closeGates();
    R.finishedAt = ts();
    save();
    process.exit(1);
  }
}

async function main() {
  if (PHASE === 'auth-preflight') {
    try {
      await runAuthPreflight();
    } catch (e) {
      R.verdict = 'FAIL';
      R.stopReason = e.message;
      timeline('FAIL', e.message);
      R.finishedAt = ts();
      save();
      process.exit(1);
    }
    return;
  }
  if (PHASE === 'homolog') {
    await runHomolog();
    return;
  }
  console.error(`P16C_PHASE desconhecida: ${PHASE} (use auth-preflight ou homolog)`);
  process.exit(1);
}

main();
