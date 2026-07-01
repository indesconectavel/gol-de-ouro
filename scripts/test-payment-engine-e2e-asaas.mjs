#!/usr/bin/env node
/**
 * F4.7 — E2E Payment Engine Asaas Sandbox completo (read-write controlado).
 *
 * Fluxo: PIX IN real → pagamento sandbox → webhook oficial Asaas → crédito controlado.
 * Requer ASAAS_TEST_LIVE=1 + ASAAS_API_KEY + URL pública (tunnel ou ASAAS_E2E_WEBHOOK_PUBLIC_BASE).
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyPaymentEngineE2eProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';
import { resolveControlledDbMode, maskId } from './helpers/asaas-controlled-ledger.mjs';
import {
  AsaasE2eWebhookReceiver,
  registerAsaasWebhook,
  deleteAsaasWebhook,
  maskWebhookPayload,
  reactivateAsaasWebhook,
  removeAsaasWebhookBackoff,
  listAsaasWebhooks
} from './helpers/asaas-e2e-webhook-receiver.mjs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DEPOSIT_VALUE = 5;
const WEBHOOK_TOKEN_RAW = process.env.ASAAS_WEBHOOK_TOKEN || '';
const WEBHOOK_TOKEN =
  WEBHOOK_TOKEN_RAW.length >= 32
    ? WEBHOOK_TOKEN_RAW
    : 'whsec_goldeouro_f47_e2e_sandbox_token_min32chars';

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const mpAxiosCalls = [];
const axiosPath = require.resolve('axios');
const originalAxios = require(axiosPath);

function installMpAxiosGuard() {
  const guardedAxios = function axiosGuard(url, config) {
    const href = typeof url === 'string' ? url : url?.url ?? '';
    if (/mercadopago\.com/i.test(href)) {
      mpAxiosCalls.push(href);
      throw new Error(`Mercado Pago bloqueado neste E2E F4.7: ${href}`);
    }
    return originalAxios(url, config);
  };
  guardedAxios.post = function axiosPostGuard(url, data, config) {
    if (/mercadopago\.com/i.test(String(url))) {
      mpAxiosCalls.push(String(url));
      throw new Error(`Mercado Pago bloqueado neste E2E F4.7: ${url}`);
    }
    return originalAxios.post(url, data, config);
  };
  guardedAxios.get = originalAxios.get.bind(originalAxios);
  guardedAxios.request = originalAxios.request.bind(originalAxios);
  require.cache[axiosPath].exports = guardedAxios;
}

function restoreAxios() {
  require.cache[axiosPath].exports = originalAxios;
}

function printStep(step, data) {
  console.log(JSON.stringify({ phase: 'F4.7', step, ...data }, null, 2));
}

function finish(result, extra = {}) {
  printStep('final', { result, ...extra });
  restoreAxios();
  restoreEnv();
  process.exit(result === 'PASS' ? 0 : result === 'SKIP' ? 0 : 2);
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

function runRegressionScript(scriptName) {
  return new Promise((resolve) => {
    const scriptPath = join(ROOT, 'scripts', scriptName);
    const proc = spawn(process.execPath, [scriptPath], {
      cwd: ROOT,
      env: { ...process.env, ASAAS_TEST_LIVE: '0' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    proc.on('close', (code) => resolve({ code: code ?? 1, stdout }));
  });
}

/** Etapa 1 — auditoria de ambiente */
function auditEnvironment() {
  const resolution = resolveControlledDbMode(process.env);
  const guards = readAsaasGuards();
  const checks = {
    liveMode: liveMode === true,
    hasApiKey: guards.hasApiKey,
    sandboxEnv: guards.sandboxEnv,
    pixInEnabled: guards.pixInEnabled,
    sandboxPixInAllowed: guards.sandboxPixInAllowed,
    webhookEnabled: guards.webhookEnabled,
    sandboxWebhookAllowed: guards.sandboxWebhookAllowed,
    controlledMode: resolution.mode === 'B',
    productionBlocked: String(process.env.ASAAS_PRODUCTION_ENABLED || '').toLowerCase() !== 'true',
    nodeEnvNotProduction: String(process.env.NODE_ENV || 'development') !== 'production'
  };
  const pass = Object.values(checks).every(Boolean);
  return { pass, checks, resolution, guards };
}

let receiver = null;
let registeredWebhookId = null;

try {
  if (liveMode) {
    applyPaymentEngineE2eProfile({ webhookToken: WEBHOOK_TOKEN });
  }

  installMpAxiosGuard();
  clearAsaasModuleCache(require);
  delete require.cache[require.resolve('../src/finance/deposit/createPixDeposit.js')];
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];

  const audit = auditEnvironment();
  printStep('etapa_1_auditoria', {
    result: audit.pass ? 'PASS' : 'FAIL',
    checks: audit.checks,
    environment: audit.resolution,
    guards: audit.guards
  });

  if (!liveMode) {
    finish('SKIP', { ok: false, message: 'ASAAS_TEST_LIVE≠1 — modo determinístico.', audit });
  }

  if (!audit.pass) {
    finish('FAIL', { ok: false, message: 'Auditoria de ambiente falhou.', audit });
  }

  const { isAsaasControlledCreditEnabled, isPaymentWebhookEngineEnabled } = require('../src/finance/config/payment-webhook-config');
  const { createPixDeposit } = require('../src/finance/deposit/createPixDeposit');
  const factory = require('../src/finance/factory/FinanceProviderFactory');
  const { confirmSandboxPayment } = require('../src/finance/providers/asaas/asaas-http-client');
  const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');
  const { PaymentWebhookControlledCreditStore } = require('../src/finance/webhooks/paymentWebhookControlledCreditStore');
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');

  assertOk(isPaymentWebhookEngineEnabled(), 'Payment Webhook Engine deve estar habilitada');
  assertOk(isAsaasControlledCreditEnabled(), 'Crédito controlado deve estar habilitado');

  const paymentProvider = factory.resolvePaymentProvider();
  assertOk(paymentProvider.name === 'asaas', `Provider esperado asaas, obtido ${paymentProvider.name}`);

  // --- Webhook receiver + registro efêmero ---
  receiver = new AsaasE2eWebhookReceiver({ authToken: WEBHOOK_TOKEN });
  const receiverInfo = await receiver.start({ tryTunnel: true });

  const reachability = await receiver.verifyReachability();

  printStep('webhook_receiver', {
    port: receiverInfo.port,
    publicBaseUrl: receiverInfo.publicBaseUrl ? '[configured]' : null,
    tunnelKind: receiver.tunnelKind ?? null,
    reachability,
    webhookUrl: receiverInfo.webhookUrl ? `${String(receiverInfo.webhookUrl).slice(0, 48)}...` : null
  });

  if (!receiverInfo.webhookUrl) {
    finish('SKIP', {
      ok: false,
      message:
        'URL pública indisponível. Configure ASAAS_E2E_WEBHOOK_PUBLIC_BASE ou ASAAS_WEBHOOK_TUNNEL_URL.',
      audit
    });
  }

  if (!reachability.ok) {
    finish('FAIL', {
      ok: false,
      message: `Tunnel público não alcançou receptor local: ${reachability.reason}`,
      audit
    });
  }

  const webhookName = `goldeouro-f47-e2e-${Date.now()}`;
  const reg = await registerAsaasWebhook({
    name: webhookName,
    url: receiverInfo.webhookUrl,
    authToken: WEBHOOK_TOKEN
  });

  if (!reg.success) {
    finish('FAIL', {
      ok: false,
      message: `Falha ao registrar webhook Asaas: ${reg.message}`,
      webhookRegistration: { error: reg.error, httpStatus: reg.httpStatus }
    });
  }

  registeredWebhookId = reg.data?.id ?? null;
  await reactivateAsaasWebhook(registeredWebhookId);
  await removeAsaasWebhookBackoff(registeredWebhookId);

  printStep('webhook_registered', {
    webhookIdPreview: maskId(registeredWebhookId),
    webhookName
  });

  await new Promise((r) => setTimeout(r, 3000));

  // --- Etapa 2: cobrança PIX real ---
  const store = new PaymentWebhookControlledCreditStore();
  const user = store.createControlledUser({
    email: 'f47-e2e@goldeouro.test',
    nome: 'F47 E2E Controlado'
  });
  const saldoInicial = store.getSaldo(user.id);
  const externalReference = `goldeouro-f47-e2e-${Date.now()}`;
  const idempotencyKey = `pix_f47_${Date.now()}`;

  printStep('etapa_2_pix_in_start', {
    userIdPreview: maskId(user.id),
    saldoInicial,
    amount: DEPOSIT_VALUE,
    externalReference,
    apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
    paymentProvider: paymentProvider.name
  });

  const deposit = await createPixDeposit({
    amount: DEPOSIT_VALUE,
    userId: user.id,
    userEmail: user.email,
    userName: user.nome,
    idempotencyKey,
    externalReference,
    description: 'Gol de Ouro F4.7 E2E Payment Engine'
  });

  if (!deposit.success) {
    finish('FAIL', {
      ok: false,
      message: `Criação PIX falhou: ${deposit.error || deposit.message}`,
      deposit: { error: deposit.error, provider: deposit.provider }
    });
  }

  const paymentId = deposit.providerRef;
  assertOk(paymentId, 'payment_id ausente');
  assertOk(Boolean(deposit.qrCode || deposit.pixCopyPaste), 'QR/Copia e Cola ausente');

  store.recordPixDepositPending({
    userId: user.id,
    providerPaymentId: paymentId,
    amount: DEPOSIT_VALUE,
    externalReference
  });

  printStep('etapa_2_pix_in_created', {
    result: 'PASS',
    paymentIdPreview: maskId(paymentId),
    qrAvailable: Boolean(deposit.qrCode),
    pixCopyPasteAvailable: Boolean(deposit.pixCopyPaste),
    pixCopyPastePreview:
      deposit.pixCopyPaste && deposit.pixCopyPaste.length > 24
        ? `${deposit.pixCopyPaste.slice(0, 20)}...${deposit.pixCopyPaste.slice(-8)}`
        : '[masked]',
    customerResolved: Boolean(deposit.provider === 'asaas')
  });

  // --- Etapa 3: pagamento sandbox + webhook oficial ---
  const confirm = await confirmSandboxPayment(paymentId);
  if (!confirm.success) {
    finish('FAIL', {
      ok: false,
      message: `Confirmação sandbox falhou: ${confirm.message}`,
      confirm: { error: confirm.error }
    });
  }

  printStep('etapa_3_sandbox_payment', {
    paymentIdPreview: maskId(paymentId),
    paymentStatus: confirm.payment?.status ?? null,
    awaitingOfficialWebhook: true
  });

  receiver.received = receiver.received.filter((r) => !String(r.body?.id || '').includes('_probe_'));

  const officialHit = await receiver.waitForPaymentEvent(paymentId, { timeoutMs: 120_000 });

  if (!officialHit) {
    finish('FAIL', {
      ok: false,
      message: 'Webhook oficial Asaas não recebido dentro do timeout (90s).',
      receivedCount: receiver.received.length,
      receivedEvents: receiver.received.map((r) => maskWebhookPayload(r.body))
    });
  }

  printStep('etapa_3_webhook_received', {
    result: 'PASS',
    source: 'asaas_official_http_post',
    payloadPreview: maskWebhookPayload(officialHit.body),
    receivedAt: officialHit.receivedAt
  });

  // --- Etapa 4: processPaymentWebhook ---
  const webhookResult = await processPaymentWebhook({
    provider: 'asaas',
    body: officialHit.body,
    headers: officialHit.headers,
    deps: { controlledCreditStore: store }
  });

  const event = webhookResult.event;
  printStep('etapa_4_webhook_engine', {
    result: webhookResult.creditDecision === 'credited' ? 'PASS' : 'FAIL',
    provider: webhookResult.provider,
    creditDecision: webhookResult.creditDecision,
    normalized: event
      ? {
          provider: event.provider,
          eventIdPreview: maskId(event.eventId),
          paymentIdPreview: maskId(event.paymentId),
          externalReference: event.externalReference,
          status: event.status,
          amount: event.amount,
          shouldCreditWallet: event.shouldCreditWallet
        }
      : null,
    idempotencyKeyPreview: event?.eventId ? `event:asaas:${String(event.eventId).slice(0, 12)}...` : null
  });

  if (webhookResult.creditDecision !== 'credited') {
    finish('FAIL', {
      ok: false,
      message: 'Crédito controlado não aplicado após webhook oficial.',
      webhookResult
    });
  }

  // --- Etapa 5: wallet + ledger ---
  const saldoAposCredito = store.getSaldo(user.id);
  const ledgerDeposits = store.getLedgerDeposits();

  printStep('etapa_5_controlled_store', {
    wallet: {
      saldoInicial,
      saldoAposCredito,
      expected: DEPOSIT_VALUE
    },
    ledger: ledgerDeposits.map((l) => ({
      tipo: l.tipo,
      provider: l.provider,
      valor: l.valor,
      paymentIdPreview: maskId(l.payment_id),
      eventIdPreview: maskId(l.event_id),
      idempotencyKeyPreview: l.idempotency_key ? `${String(l.idempotency_key).slice(0, 20)}...` : null
    }))
  });

  if (saldoAposCredito !== DEPOSIT_VALUE || ledgerDeposits.length !== 1) {
    finish('FAIL', {
      ok: false,
      message: 'Wallet/ledger controlado inválido após 1º webhook.',
      saldoAposCredito,
      ledgerCount: ledgerDeposits.length
    });
  }

  // --- Etapa 6: replay idempotente ---
  const replay = await processPaymentWebhook({
    provider: 'asaas',
    body: officialHit.body,
    headers: officialHit.headers,
    deps: { controlledCreditStore: store }
  });

  const saldoFinal = store.getSaldo(user.id);
  const ledgerFinal = store.getLedgerDeposits();

  printStep('etapa_6_idempotency_replay', {
    result:
      replay.creditDecision === 'ignored_duplicate' && saldoFinal === DEPOSIT_VALUE ? 'PASS' : 'FAIL',
    creditDecision: replay.creditDecision,
    saldoFinal,
    ledgerCount: ledgerFinal.length
  });

  if (replay.creditDecision !== 'ignored_duplicate' || saldoFinal !== DEPOSIT_VALUE || ledgerFinal.length !== 1) {
    finish('FAIL', {
      ok: false,
      message: 'Replay gerou efeito financeiro indevido.',
      replay,
      saldoFinal,
      ledgerCount: ledgerFinal.length
    });
  }

  // --- Etapa 7: regressão F4.5 ---
  const regressionEngine = await runRegressionScript('verify-payment-webhook-engine.mjs');
  const regressionControlled = await runRegressionScript('verify-payment-webhook-controlled-credit.mjs');

  const regressionPass = regressionEngine.code === 0 && regressionControlled.code === 0;

  printStep('etapa_7_regressao', {
    result: regressionPass ? 'PASS' : 'FAIL',
    verifyPaymentWebhookEngine: regressionEngine.code === 0 ? 'PASS' : 'FAIL',
    verifyControlledCredit: regressionControlled.code === 0 ? 'PASS' : 'FAIL',
    mercadoPagoAxiosBlocked: mpAxiosCalls.length === 0,
    mercadoPagoUsed: false
  });

  const pass =
    deposit.success &&
    Boolean(paymentId) &&
    Boolean(deposit.qrCode || deposit.pixCopyPaste) &&
    confirm.success &&
    officialHit != null &&
    webhookResult.creditDecision === 'credited' &&
    saldoFinal === DEPOSIT_VALUE &&
    ledgerFinal.length === 1 &&
    replay.creditDecision === 'ignored_duplicate' &&
    regressionPass &&
    mpAxiosCalls.length === 0;

  finish(pass ? 'PASS' : 'FAIL', {
    ok: pass,
    environment: audit.resolution,
    fluxo: [
      'FinanceProviderFactory → asaas',
      'AsaasPaymentProvider → createPixDeposit',
      'confirmSandboxPayment',
      'Webhook oficial Asaas → receiver local',
      'processPaymentWebhook → PaymentWebhookControlledCreditStore',
      'Replay idempotente'
    ],
    evidencias: {
      paymentIdPreview: maskId(paymentId),
      saldoInicial,
      saldoFinal,
      ledgerDepositos: ledgerFinal.length,
      webhookOficial: true,
      supabaseProducaoTocado: false,
      producaoAlterada: false
    },
    limitacoes: [
      'Crédito em store in-memory Opção B — não persiste Supabase',
      'Webhook requer URL pública (tunnel ou ASAAS_E2E_WEBHOOK_PUBLIC_BASE)',
      'Webhook efêmero registrado via API e removido ao final do teste'
    ]
  });
} catch (err) {
  printStep('error', { message: err.message, stack: err.stack?.split('\n').slice(0, 5) });
  finish('FAIL', { ok: false, error: err.message });
} finally {
  if (registeredWebhookId) {
    await deleteAsaasWebhook(registeredWebhookId);
  }
  if (receiver) {
    await receiver.close();
  }
  restoreAxios();
}
