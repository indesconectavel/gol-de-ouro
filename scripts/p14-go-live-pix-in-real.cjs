#!/usr/bin/env node
'use strict';
/**
 * P1.4 — GO-LIVE controlado PIX IN real Asaas produção.
 *
 * Fases (P14_PHASE):
 *   audit   — valida flags (default)
 *   charge  — cria UMA cobrança + pagamentos_pix (requer P14_ALLOW_REAL_CHARGE=1)
 *   validate — pós-pagamento: wallet, ledger, webhook chain
 *   replay  — replay webhook + idempotência
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.env.P14_APP_ROOT || '/app';
const STATE_PATH = process.env.P14_STATE_PATH || '/tmp/p14-go-live-state.json';
const TECHNICAL_USER_ID = process.env.P14_USER_ID || '85872488-9e4c-42df-8978-7f9ef9f5cb00';
const AMOUNT = Number(process.env.P14_AMOUNT || 5);
const BACKEND_URL = process.env.P14_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';

function sha16(v) {
  return crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 16);
}

function readFlag(name) {
  const v = process.env[name];
  return v == null ? null : String(v).trim();
}

function emit(tag, obj) {
  console.log(`###${tag}###${JSON.stringify(obj)}`);
}

function collectAudit() {
  const apiKey = readFlag('ASAAS_API_KEY') || '';
  const webhookToken = readFlag('ASAAS_WEBHOOK_TOKEN') || '';
  return {
    at: new Date().toISOString(),
    ASAAS_ENABLED: readFlag('ASAAS_ENABLED'),
    ASAAS_ENV: readFlag('ASAAS_ENV'),
    ASAAS_PIX_IN_ENABLED: readFlag('ASAAS_PIX_IN_ENABLED'),
    PAYMENT_WEBHOOK_ENGINE_ENABLED: readFlag('PAYMENT_WEBHOOK_ENGINE_ENABLED'),
    ASAAS_WEBHOOK_ENABLED: readFlag('ASAAS_WEBHOOK_ENABLED'),
    ASAAS_PRODUCTION_ENABLED: readFlag('ASAAS_PRODUCTION_ENABLED'),
    NODE_ENV: readFlag('NODE_ENV'),
    ASAAS_API_KEY_len: apiKey.length,
    ASAAS_API_KEY_is_prod: apiKey.startsWith('$aact_prod_'),
    ASAAS_API_KEY_sha256_prefix: apiKey ? sha16(apiKey) : null,
    ASAAS_WEBHOOK_TOKEN_len: webhookToken.length,
    ASAAS_WEBHOOK_TOKEN_sha256_prefix: webhookToken ? sha16(webhookToken) : null
  };
}

function validateAudit(audit) {
  const issues = [];
  if (audit.ASAAS_ENABLED !== 'true') issues.push('ASAAS_ENABLED≠true');
  if (audit.ASAAS_ENV !== 'production') issues.push('ASAAS_ENV≠production');
  if (audit.ASAAS_PIX_IN_ENABLED !== 'true') issues.push('ASAAS_PIX_IN_ENABLED≠true');
  if (!audit.ASAAS_API_KEY_len) issues.push('ASAAS_API_KEY vazia');
  if (!audit.ASAAS_API_KEY_is_prod) issues.push('ASAAS_API_KEY não é produção');
  if (!audit.ASAAS_WEBHOOK_TOKEN_len) issues.push('ASAAS_WEBHOOK_TOKEN vazia');
  if (audit.ASAAS_WEBHOOK_ENABLED !== 'true') issues.push('ASAAS_WEBHOOK_ENABLED≠true');
  if (audit.PAYMENT_WEBHOOK_ENGINE_ENABLED !== 'true') {
    issues.push('PAYMENT_WEBHOOK_ENGINE_ENABLED≠true');
  }
  return issues;
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function fetchPixQrWithRetry(paymentId, attempts = 4, delayMs = 800) {
  const { getPaymentPixQrCode } = require(path.join(ROOT, 'src/finance/providers/asaas/asaas-http-client'));
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    last = await getPaymentPixQrCode(paymentId);
    if (last.success && last.data?.payload) return last;
  }
  return last;
}

async function phaseAudit() {
  const audit = collectAudit();
  emit('P14_AUDIT', audit);
  const issues = validateAudit(audit);
  if (issues.length) {
    emit('P14_VERDICT', { phase: 'audit', result: 'FAIL', issues });
    process.exit(1);
  }
  if (audit.ASAAS_PRODUCTION_ENABLED !== 'true') {
    emit('P14_VERDICT', {
      phase: 'audit',
      result: 'PASS_COM_RESSALVAS',
      note: 'Flags OK exceto ASAAS_PRODUCTION_ENABLED=false — abrir gate antes de charge'
    });
    return;
  }
  emit('P14_VERDICT', { phase: 'audit', result: 'PASS' });
}

async function phaseCharge() {
  if (process.env.P14_ALLOW_REAL_CHARGE !== '1') {
    emit('P14_VERDICT', {
      phase: 'charge',
      result: 'FAIL',
      error: 'P14_ALLOW_REAL_CHARGE=1 obrigatório'
    });
    process.exit(1);
  }

  const audit = collectAudit();
  const issues = validateAudit(audit);
  if (issues.length) {
    emit('P14_VERDICT', { phase: 'charge', result: 'FAIL', issues });
    process.exit(1);
  }
  if (audit.ASAAS_PRODUCTION_ENABLED !== 'true') {
    emit('P14_VERDICT', {
      phase: 'charge',
      result: 'FAIL',
      error: 'ASAAS_PRODUCTION_ENABLED deve ser true'
    });
    process.exit(1);
  }

  process.chdir(ROOT);
  const { createClient } = require('@supabase/supabase-js');
  const AsaasPaymentProvider = require(path.join(ROOT, 'src/finance/providers/asaas/AsaasPaymentProvider'));

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    emit('P14_VERDICT', { phase: 'charge', result: 'FAIL', error: 'Supabase não configurado' });
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: user, error: userErr } = await supabase
    .from('usuarios')
    .select('id, email, username, saldo')
    .eq('id', TECHNICAL_USER_ID)
    .single();

  if (userErr || !user) {
    emit('P14_VERDICT', { phase: 'charge', result: 'FAIL', error: 'usuário técnico não encontrado' });
    process.exit(1);
  }

  const ts = Date.now();
  const externalReference = `goldeouro_p14_${user.id}_${ts}`;
  const idempotencyKey = `pix_p14_${ts}`;

  let result = await AsaasPaymentProvider.createPixDeposit({
    amount: AMOUNT,
    userId: user.id,
    userEmail: user.email,
    userName: user.username || 'P14 Go-Live',
    payerCpf: '52998224725',
    idempotencyKey,
    externalReference,
    description: 'P1.4 GO-LIVE PIX IN real controlado'
  });

  let paymentId = result.providerRef ? String(result.providerRef) : null;
  let pixPayload = result.pixCopyPaste || result.qrCode || null;
  let qrBase64 = result.qrCodeBase64 || null;
  let expiration = null;
  let customerId = result.customerId || null;

  if (!result.success && paymentId && result.error === 'ASAAS_PIX_IN_QR_UNAVAILABLE') {
    const qrRetry = await fetchPixQrWithRetry(paymentId);
    if (qrRetry?.success && qrRetry.data?.payload) {
      pixPayload = qrRetry.data.payload;
      qrBase64 = qrRetry.data.encodedImage || null;
      expiration = qrRetry.data.expirationDate || null;
      result = { ...result, success: true, providerRef: paymentId };
    }
  }

  if (!result.success) {
    emit('P14_CHARGE_ERROR', {
      error: result.error,
      message: result.message,
      phase: result.phase || null,
      payment_id: paymentId
    });
    emit('P14_VERDICT', { phase: 'charge', result: 'FAIL' });
    process.exit(1);
  }

  if (!pixPayload && paymentId) {
    const qrRetry = await fetchPixQrWithRetry(paymentId);
    if (qrRetry?.success) {
      pixPayload = qrRetry.data?.payload || null;
      qrBase64 = qrRetry.data?.encodedImage || null;
      expiration = qrRetry.data?.expirationDate || null;
    }
  }

  if (!pixPayload) {
    emit('P14_CHARGE_ERROR', { error: 'ASAAS_PIX_IN_QR_UNAVAILABLE', payment_id: paymentId });
    emit('P14_VERDICT', { phase: 'charge', result: 'FAIL' });
    process.exit(1);
  }

  paymentId = String(result.providerRef || paymentId);
  const { data: pixRecord, error: insertError } = await supabase
    .from('pagamentos_pix')
    .insert({
      usuario_id: user.id,
      external_id: paymentId,
      payment_id: paymentId,
      amount: AMOUNT,
      valor: AMOUNT,
      status: 'pending',
      qr_code: pixPayload,
      qr_code_base64: qrBase64,
      pix_copy_paste: pixPayload
    })
    .select('id, status, created_at')
    .single();

  if (insertError || !pixRecord) {
    emit('P14_CHARGE_ERROR', {
      error: 'PERSIST_PIX_FAILED',
      message: insertError?.message || 'insert vazio',
      payment_id: paymentId
    });
    emit('P14_VERDICT', { phase: 'charge', result: 'FAIL' });
    process.exit(1);
  }

  const cfg = require(path.join(ROOT, 'src/finance/providers/asaas/asaas-config'));
  const chargeEvidence = {
    ts: new Date().toISOString(),
    provider: 'asaas',
    ambiente: 'production',
    amount: AMOUNT,
    payment_id: paymentId,
    customer_id: customerId,
    status: result.status || 'pending',
    external_reference: result.externalReference || externalReference,
    pagamentos_pix_id: pixRecord.id,
    usuario_id: user.id,
    saldo_antes: Number(user.saldo || 0),
    expiration: expiration,
    pix_copy_paste: pixPayload,
    invoice_url: null,
    qr_code_base64_len: qrBase64 ? String(qrBase64).length : 0,
    phase: result.phase || null
  };

  saveState({
    ...chargeEvidence,
    webhook_token_sha256_prefix: sha16(process.env.ASAAS_WEBHOOK_TOKEN || '')
  });

  emit('P14_CHARGE', chargeEvidence);
  emit('P14_PAUSE', {
    message: 'ETAPA 4 — Pagar manualmente o PIX e reexecutar com P14_PHASE=validate',
    payment_id: paymentId,
    amount_brl: AMOUNT
  });
  emit('P14_VERDICT', { phase: 'charge', result: 'PASS' });
}

async function phaseRecover() {
  const paymentId = process.env.P14_PAYMENT_ID;
  if (!paymentId) {
    emit('P14_VERDICT', { phase: 'recover', result: 'FAIL', error: 'P14_PAYMENT_ID obrigatório' });
    process.exit(1);
  }

  process.chdir(ROOT);
  const { createClient } = require('@supabase/supabase-js');
  const { getPayment } = require(path.join(ROOT, 'src/finance/providers/asaas/asaas-http-client'));
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: user } = await supabase
    .from('usuarios')
    .select('id, email, username, saldo')
    .eq('id', TECHNICAL_USER_ID)
    .single();

  const payRes = await getPayment(paymentId);
  const qrRetry = await fetchPixQrWithRetry(paymentId);
  const pixPayload = qrRetry?.data?.payload || null;
  if (!pixPayload) {
    emit('P14_VERDICT', { phase: 'recover', result: 'FAIL', error: 'QR indisponível' });
    process.exit(1);
  }

  const externalReference =
    payRes.payment?.externalReference || `goldeouro_p14_${TECHNICAL_USER_ID}_recovered`;

  const { data: existing } = await supabase
    .from('pagamentos_pix')
    .select('id, status')
    .eq('payment_id', paymentId)
    .maybeSingle();

  let pixRecord = existing;
  if (!existing) {
    const ins = await supabase
      .from('pagamentos_pix')
      .insert({
        usuario_id: user.id,
        external_id: paymentId,
        payment_id: paymentId,
        amount: AMOUNT,
        valor: AMOUNT,
        status: 'pending',
        qr_code: pixPayload,
        qr_code_base64: qrRetry.data?.encodedImage || null,
        pix_copy_paste: pixPayload
      })
      .select('id, status, created_at')
      .single();
    if (ins.error) {
      emit('P14_VERDICT', { phase: 'recover', result: 'FAIL', error: ins.error.message });
      process.exit(1);
    }
    pixRecord = ins.data;
  }

  const chargeEvidence = {
    ts: new Date().toISOString(),
    provider: 'asaas',
    ambiente: 'production',
    amount: AMOUNT,
    payment_id: paymentId,
    customer_id: payRes.payment?.customer || null,
    status: payRes.payment?.status || 'PENDING',
    external_reference: externalReference,
    pagamentos_pix_id: pixRecord.id,
    usuario_id: user.id,
    saldo_antes: Number(user.saldo || 0),
    expiration: qrRetry.data?.expirationDate || null,
    pix_copy_paste: pixPayload,
    invoice_url: payRes.data?.invoiceUrl || payRes.payment?.invoiceUrl || null,
    recovered: true
  };

  saveState(chargeEvidence);
  emit('P14_CHARGE', chargeEvidence);
  emit('P14_PAUSE', {
    message: 'ETAPA 4 — Pagar manualmente o PIX e reexecutar com P14_PHASE=validate',
    payment_id: paymentId,
    amount_brl: AMOUNT
  });
  emit('P14_VERDICT', { phase: 'recover', result: 'PASS' });
}

async function phaseValidate() {
  const state = loadState();
  if (!state?.payment_id) {
    emit('P14_VERDICT', { phase: 'validate', result: 'FAIL', error: 'state ausente — rode charge primeiro' });
    process.exit(1);
  }

  process.chdir(ROOT);
  const { createClient } = require('@supabase/supabase-js');
  const { getPayment } = require(path.join(ROOT, 'src/finance/providers/asaas/asaas-http-client'));
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const t0 = Date.now();
  const asaasStatus = await getPayment(state.payment_id);
  const tAsaas = Date.now() - t0;

  const { data: pix } = await supabase
    .from('pagamentos_pix')
    .select('id, status, amount, valor, usuario_id, payment_id, updated_at')
    .eq('payment_id', state.payment_id)
    .maybeSingle();

  const { data: user } = await supabase
    .from('usuarios')
    .select('id, saldo')
    .eq('id', state.usuario_id)
    .single();

  const { data: ledger } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo, valor, usuario_id, referencia, created_at')
    .or(`referencia.eq.${state.payment_id},referencia.eq.${state.pagamentos_pix_id}`)
    .order('created_at', { ascending: false })
    .limit(10);

  const evidence = {
    at: new Date().toISOString(),
    payment_id: state.payment_id,
    asaas_ms: tAsaas,
    asaas_status: asaasStatus.payment?.status ?? null,
    asaas_paid: ['RECEIVED', 'CONFIRMED'].includes(String(asaasStatus.payment?.status || '').toUpperCase()),
    pagamentos_pix_status: pix?.status ?? null,
    saldo_antes: state.saldo_antes,
    saldo_atual: user ? Number(user.saldo) : null,
    saldo_delta: user ? Number(user.saldo) - Number(state.saldo_antes || 0) : null,
    ledger_count: Array.isArray(ledger) ? ledger.length : 0,
    ledger_tipos: Array.isArray(ledger) ? ledger.map((r) => r.tipo) : []
  };

  emit('P14_VALIDATE', evidence);

  const ok =
    evidence.asaas_paid &&
    String(pix?.status).toLowerCase() === 'approved' &&
    evidence.saldo_delta === AMOUNT;

  emit('P14_VERDICT', {
    phase: 'validate',
    result: ok ? 'PASS' : evidence.asaas_paid ? 'PASS_COM_RESSALVAS' : 'FAIL',
    evidence
  });
  if (!evidence.asaas_paid) process.exit(1);
}

async function phaseReplay() {
  const state = loadState();
  if (!state?.payment_id) {
    emit('P14_VERDICT', { phase: 'replay', result: 'FAIL', error: 'state ausente' });
    process.exit(1);
  }

  process.chdir(ROOT);
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userBefore } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', state.usuario_id)
    .single();

  const body = {
    id: `evt_p14_replay_${Date.now()}`,
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: state.payment_id,
      status: 'RECEIVED',
      value: AMOUNT,
      externalReference: state.external_reference
    }
  };

  const headers = { 'Content-Type': 'application/json' };
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (token) headers['asaas-access-token'] = token;

  const t0 = Date.now();
  const res = await fetch(`${BACKEND_URL}/webhooks/asaas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  const tWebhook = Date.now() - t0;

  const { data: userAfter } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', state.usuario_id)
    .single();

  const { data: ledgerAfter } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo, valor')
    .or(`referencia.eq.${state.payment_id},referencia.eq.${state.pagamentos_pix_id}`);

  const saldoStable = Number(userBefore?.saldo) === Number(userAfter?.saldo);
  const idempotent = res.status === 200 && text.includes('idempotent');

  emit('P14_REPLAY', {
    webhook_ms: tWebhook,
    http_status: res.status,
    body_preview: text.slice(0, 300),
    saldo_before: Number(userBefore?.saldo),
    saldo_after: Number(userAfter?.saldo),
    saldo_stable: saldoStable,
    ledger_count: Array.isArray(ledgerAfter) ? ledgerAfter.length : 0,
    idempotent_hint: idempotent
  });

  emit('P14_VERDICT', {
    phase: 'replay',
    result: saldoStable ? 'PASS' : 'FAIL'
  });
  if (!saldoStable) process.exit(1);
}

async function main() {
  const phase = (process.env.P14_PHASE || 'audit').toLowerCase();
  if (phase === 'audit') return phaseAudit();
  if (phase === 'charge') return phaseCharge();
  if (phase === 'recover') return phaseRecover();
  if (phase === 'validate') return phaseValidate();
  if (phase === 'replay') return phaseReplay();
  emit('P14_VERDICT', { result: 'FAIL', error: `fase desconhecida: ${phase}` });
  process.exit(1);
}

main().catch((e) => {
  emit('P14_VERDICT', { result: 'FAIL', error: e.message });
  process.exit(1);
});
