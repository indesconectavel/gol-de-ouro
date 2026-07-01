#!/usr/bin/env node
/**
 * P1.3R — PIX IN real Asaas produção (auditoria controlada).
 * Requer ASAAS_API_KEY produção ($aact_prod_…) no ambiente.
 * NÃO altera Fly secrets. Gate Fly permanece false.
 *
 * Env:
 *   P13R_ALLOW_REAL_CHARGE=1   — cria cobrança real
 *   P13R_AMOUNT=5              — valor (default 5)
 *   P13R_PROBE_WEBHOOK=1       — simula POST webhook no backend Fly
 */
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { clearAsaasModuleCache } from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

function sha16(v) {
  return crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 16);
}

function maskId(id) {
  if (!id) return null;
  const s = String(id);
  return s.length <= 8 ? '***' : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function readFlag(name) {
  const v = process.env[name];
  return v == null ? null : String(v).trim();
}

function collectFlags() {
  const apiKey = readFlag('ASAAS_API_KEY') || '';
  return {
    ASAAS_ENABLED: readFlag('ASAAS_ENABLED'),
    ASAAS_ENV: readFlag('ASAAS_ENV'),
    ASAAS_PIX_IN_ENABLED: readFlag('ASAAS_PIX_IN_ENABLED'),
    ASAAS_API_KEY_len: apiKey.length,
    ASAAS_API_KEY_prefix: apiKey ? `${apiKey.slice(0, 12)}…` : null,
    ASAAS_API_KEY_sha256_prefix: apiKey ? sha16(apiKey) : null,
    ASAAS_API_KEY_is_prod: apiKey.startsWith('$aact_prod_'),
    ASAAS_WEBHOOK_ENABLED: readFlag('ASAAS_WEBHOOK_ENABLED'),
    PAYMENT_WEBHOOK_ENGINE_ENABLED: readFlag('PAYMENT_WEBHOOK_ENGINE_ENABLED'),
    ASAAS_PRODUCTION_ENABLED: readFlag('ASAAS_PRODUCTION_ENABLED'),
    NODE_ENV: readFlag('NODE_ENV'),
    script_gate_override: readFlag('P13R_SCRIPT_GATE_OVERRIDE') === '1'
  };
}

function validateFlags(flags) {
  const issues = [];
  if (flags.ASAAS_ENABLED !== 'true') issues.push('ASAAS_ENABLED≠true');
  if (flags.ASAAS_ENV !== 'production') issues.push('ASAAS_ENV≠production');
  if (flags.ASAAS_PIX_IN_ENABLED !== 'true') issues.push('ASAAS_PIX_IN_ENABLED≠true');
  if (!flags.ASAAS_API_KEY_len) issues.push('ASAAS_API_KEY vazia');
  if (!flags.ASAAS_API_KEY_is_prod) issues.push('ASAAS_API_KEY não é produção ($aact_prod_)');
  if (flags.ASAAS_WEBHOOK_ENABLED !== 'true') issues.push('ASAAS_WEBHOOK_ENABLED≠true');
  if (flags.PAYMENT_WEBHOOK_ENGINE_ENABLED !== 'true') {
    issues.push('PAYMENT_WEBHOOK_ENGINE_ENABLED≠true');
  }
  return issues;
}

async function probeWebhook(paymentId, webhookToken) {
  const base = readFlag('P13R_BACKEND_URL') || 'https://goldeouro-backend-v2.fly.dev';
  const body = {
    id: `evt_p13r_${Date.now()}`,
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: paymentId,
      status: 'RECEIVED',
      value: Number(process.env.P13R_AMOUNT || 5),
      externalReference: `goldeouro_p13r_${Date.now()}`
    }
  };
  const headers = { 'Content-Type': 'application/json' };
  if (webhookToken) headers['asaas-access-token'] = webhookToken;

  const res = await fetch(`${base}/webhooks/asaas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return {
    url: `${base}/webhooks/asaas`,
    status: res.status,
    body: text.slice(0, 500),
    flyRequestId: res.headers.get('fly-request-id')
  };
}

async function main() {
  const allowCharge = process.env.P13R_ALLOW_REAL_CHARGE === '1';
  const amount = Number(process.env.P13R_AMOUNT || 5);
  const flags = collectFlags();

  console.log(`###P13R_FLAGS###${JSON.stringify(flags)}`);

  const issues = validateFlags(flags);
  if (issues.length) {
    console.log('###P13R_VERDICT###FAIL');
    console.log(`###P13R_BLOCKERS###${JSON.stringify(issues)}`);
    process.exit(1);
  }

  if (!allowCharge) {
    console.log('###P13R_VERDICT###PASS_COM_RESSALVAS');
    console.log('###P13R_NOTE###Flags OK. Defina P13R_ALLOW_REAL_CHARGE=1 para criar cobrança real.');
    return;
  }

  process.env.NODE_ENV = 'production';
  process.env.ASAAS_PRODUCTION_ENABLED = 'true';
  process.env.P13R_SCRIPT_GATE_OVERRIDE = '1';
  clearAsaasModuleCache(require);

  const cfg = require('../src/finance/providers/asaas/asaas-config');
  const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');

  if (!cfg.isAsaasPixInProductionHttpEnabled()) {
    console.log('###P13R_VERDICT###FAIL');
    console.log('###P13R_ERROR###production HTTP gate not enabled in script');
    process.exit(1);
  }

  const externalRef = `goldeouro_p13r_${Date.now()}`;
  const result = await AsaasPaymentProvider.createPixDeposit({
    amount,
    userId: 'p13r-audit-user',
    userEmail: 'p13r-audit@goldeouro.app',
    userName: 'P13R Audit',
    payerCpf: '52998224725',
    idempotencyKey: `pix_p13r_${Date.now()}`,
    externalReference: externalRef,
    description: 'P1.3R PIX IN real audit'
  });

  const evidence = {
    ts: new Date().toISOString(),
    provider: result.provider || 'asaas',
    ambiente: 'production',
    success: result.success === true,
    payment_id: result.providerRef ? maskId(result.providerRef) : null,
    payment_id_raw_len: result.providerRef ? String(result.providerRef).length : 0,
    status: result.status || null,
    amount: result.amount ?? amount,
    has_qr_code: Boolean(result.qrCode),
    has_pix_copy_paste: Boolean(result.pixCopyPaste),
    qr_code_len: result.qrCode ? String(result.qrCode).length : 0,
    external_reference: externalRef,
    phase: result.phase || null,
    error: result.error || null,
    message: result.message || null,
    financialEffect: result.financialEffect === true
  };

  console.log(`###P13R_CHARGE###${JSON.stringify(evidence)}`);

  if (!result.success) {
    console.log('###P13R_VERDICT###FAIL');
    process.exit(1);
  }

  const { getPayment } = require('../src/finance/providers/asaas/asaas-http-client');
  const statusCheck = await getPayment(result.providerRef);
  console.log(
    `###P13R_STATUS###${JSON.stringify({
      success: statusCheck.success,
      status: statusCheck.payment?.status ?? null,
      payment_id: maskId(result.providerRef)
    })}`
  );

  if (process.env.P13R_PROBE_WEBHOOK === '1') {
    const token = readFlag('ASAAS_WEBHOOK_TOKEN');
    const probe = await probeWebhook(result.providerRef, token);
    console.log(`###P13R_WEBHOOK_PROBE###${JSON.stringify(probe)}`);
  }

  console.log('###P13R_PAYMENT_INSTRUCTION###Pagamento manual opcional pelo operador — script não paga automaticamente.');
  console.log('###P13R_VERDICT###PASS');
}

main().catch((e) => {
  console.log('###P13R_VERDICT###FAIL');
  console.log(`###P13R_ERROR###${e.message}`);
  process.exit(1);
});
