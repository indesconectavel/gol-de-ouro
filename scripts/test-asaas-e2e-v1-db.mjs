#!/usr/bin/env node
/**
 * F4.3B — E2E Asaas com Wallet/Ledger controlado (schema real V1, persistência local).
 *
 * Live: ASAAS_E2E_DB_TEST=1 ASAAS_TEST_LIVE=1 + ASAAS_API_KEY
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyAsaasE2eDbProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';
import {
  createControlledFinanceStore,
  resolveControlledDbMode,
  maskId,
  PROD_SUPABASE_REF
} from './helpers/asaas-controlled-ledger.mjs';

const require = createRequire(import.meta.url);

const DEPOSIT_VALUE = 5;
const WITHDRAW_VALUE = 1;
const BACEN_PIX_KEY = 'cliente-a00001@pix.bcb.gov.br';
const BACEN_PIX_KEY_TYPE = 'EMAIL';
const WEBHOOK_TOKEN = 'whsec_goldeouro_f43b_e2e';

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const mpFetchUrls = [];
const celcoinFetchUrls = [];
const originalFetch = globalThis.fetch;

function installProviderGuards() {
  globalThis.fetch = async (url, init) => {
    const href = typeof url === 'string' ? url : url?.url ?? String(url);
    if (/mercadopago\.com|mercadolibre\.com/i.test(href)) {
      mpFetchUrls.push(href);
      throw new Error(`Mercado Pago bloqueado neste E2E: ${href}`);
    }
    if (/celcoin|openfinance\.celcoin/i.test(href)) {
      celcoinFetchUrls.push(href);
      throw new Error(`Celcoin bloqueado neste E2E: ${href}`);
    }
    return originalFetch(url, init);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function printStep(step, data) {
  console.log(JSON.stringify({ step, phase: 'F4.3B', ...data }, null, 2));
}

function finishSkip(message, extra = {}) {
  printStep('skip', { result: 'SKIP', ok: false, message, liveMode, ...extra });
  restoreFetch();
  restoreEnv();
  process.exit(0);
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

function isProductionBlocked() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

const dbResolution = resolveControlledDbMode(process.env);

if (!liveMode) {
  finishSkip('ASAAS_TEST_LIVE≠1.', { dbResolution });
}

applyAsaasE2eDbProfile({ webhookToken: WEBHOOK_TOKEN });

if (isProductionBlocked()) {
  finishSkip('NODE_ENV=production bloqueado para F4.3B.', { dbResolution });
}

if (String(process.env.ASAAS_ENV || 'sandbox').trim().toLowerCase() !== 'sandbox') {
  finishSkip('ASAAS_ENV deve ser sandbox.', { dbResolution });
}

if (dbResolution.supabaseRef === PROD_SUPABASE_REF && dbResolution.mode === 'A') {
  finishSkip('Ref Supabase produção detectada — abortado por segurança.', { dbResolution });
}

installProviderGuards();
clearAsaasModuleCache(require);
delete require.cache[require.resolve('../src/finance/compat/createPixWithdrawCompat.js')];

const guards = readAsaasGuards();

if (!guards.e2eDbTest) {
  finishSkip('ASAAS_E2E_DB_TEST≠1 após profile.', { guards });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente.', { guards });
}

if (!guards.primarySandboxMode) {
  finishSkip('Profile primary sandbox incompleto.', { guards });
}

const { store, resolution } = await createControlledFinanceStore(process.env);

printStep('controlled_db_mode', {
  optionChosen: resolution.mode,
  backend: resolution.backend,
  reason: resolution.reason,
  prodSupabaseBlocked: true,
  supabaseProdRef: PROD_SUPABASE_REF
});

const factory = require('../src/finance/factory/FinanceProviderFactory');
const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');
const { confirmSandboxPayment, getTransfer, fetchAccountBalance } = require('../src/finance/providers/asaas/asaas-http-client');
const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

const health = factory.getHealthSnapshot();
assertOk(health.asaasPrimarySandboxMode === true, 'primary sandbox required');
assertOk(health.paymentProvider === 'asaas', 'payment provider asaas');
assertOk(health.payoutProvider === 'asaas', 'payout provider asaas');

const user = store.createTestUser();
const saldoInicial = store.getSaldo(user.id);
const correlation = `goldeouro-f43b-e2e-${Date.now()}`;

printStep('test_user_created', {
  userIdPreview: maskId(user.id),
  saldoInicial,
  persistFile: store.snapshot().persistPath
});

const depositResult = await AsaasPaymentProvider.createPixDeposit({
  amount: DEPOSIT_VALUE,
  userId: user.id,
  userEmail: user.email,
  idempotencyKey: correlation,
  notificationUrl: 'http://localhost/sandbox/asaas/webhook'
});

assertOk(depositResult.success === true, `PIX IN falhou: ${depositResult.error}`);
const paymentId = depositResult.providerRef;

store.recordPixDepositPending({
  userId: user.id,
  providerPaymentId: paymentId,
  amount: DEPOSIT_VALUE,
  externalReference: correlation
});

await confirmSandboxPayment(paymentId);

const paymentWebhook = await handleAsaasWebhook({
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
  body: {
    id: `evt_f43b_pay_${Date.now()}`,
    event: 'PAYMENT_RECEIVED',
    payment: { id: paymentId, status: 'RECEIVED', value: DEPOSIT_VALUE }
  }
});

const creditResult = store.creditDepositFromWebhook({
  providerPaymentId: paymentId,
  event: paymentWebhook.event,
  amount: DEPOSIT_VALUE
});

assertOk(creditResult.credited === true, 'wallet não creditada');
const saldoPosDeposito = store.getSaldo(user.id);
assertOk(saldoPosDeposito === DEPOSIT_VALUE, `saldo pós-depósito esperado ${DEPOSIT_VALUE}`);

const creditIdempotent = store.creditDepositFromWebhook({
  providerPaymentId: paymentId,
  event: 'PAYMENT_RECEIVED',
  amount: DEPOSIT_VALUE
});
assertOk(creditIdempotent.idempotent === true, 'idempotência depósito falhou');
assertOk(store.countLedgerByTipo('deposito') === 1, 'ledger deposito duplicado');

printStep('pix_in_wallet_ledger', {
  paymentIdPreview: maskId(paymentId),
  saldoPosDeposito,
  ledgerDeposito: store.countLedgerByTipo('deposito'),
  webhookDecision: paymentWebhook.decision,
  idempotentReplay: creditIdempotent.idempotent
});

const withdrawRequest = store.requestWithdraw({
  userId: user.id,
  amount: WITHDRAW_VALUE,
  pixKey: BACEN_PIX_KEY,
  pixType: BACEN_PIX_KEY_TYPE
});

assertOk(withdrawRequest.ok === true, `saque falhou: ${withdrawRequest.reason}`);
const saldoPosSaque = store.getSaldo(user.id);
assertOk(saldoPosSaque === DEPOSIT_VALUE - WITHDRAW_VALUE, 'saldo pós-débito saque incorreto');

store.approveWithdraw(withdrawRequest.saque.id);

const balanceCheck = await fetchAccountBalance();
const asaasBalance = balanceCheck.success ? balanceCheck.balance?.balance ?? 0 : 0;
if (Number(asaasBalance) < WITHDRAW_VALUE) {
  const funding = await AsaasPayoutProvider.fundSandboxViaOfficialProcedure({ value: DEPOSIT_VALUE });
  assertOk(funding.success === true, `Funding falhou: ${funding.message}`);
}

const payoutResult = await createPixWithdrawCompat(
  WITHDRAW_VALUE,
  BACEN_PIX_KEY,
  BACEN_PIX_KEY_TYPE,
  user.id,
  withdrawRequest.saque.id,
  correlation,
  { payoutExternalReference: withdrawRequest.saque.id }
);

assertOk(payoutResult.success === true, `PIX OUT falhou: ${payoutResult.error}`);
const transferId = payoutResult.providerRef || payoutResult.transfer?.id;

store.attachTransferToSaque({
  saqueId: withdrawRequest.saque.id,
  transferId,
  status: payoutResult.transfer?.status ?? 'PENDING',
  authorized: payoutResult.transfer?.authorized ?? null
});

const transferStatus = await getTransfer(transferId, { httpGate: 'pixOut' });
const transferEvent =
  transferStatus.transfer?.status === 'DONE' ? 'TRANSFER_DONE' : 'TRANSFER_PENDING';

const transferWebhook = await handleAsaasWebhook({
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
  body: {
    id: `evt_f43b_tr_${Date.now()}`,
    event: transferEvent,
    transfer: {
      id: transferId,
      status: transferStatus.transfer?.status ?? 'PENDING',
      value: WITHDRAW_VALUE,
      authorized: transferStatus.transfer?.authorized ?? null
    }
  }
});

store.applyTransferWebhook({
  saqueId: withdrawRequest.saque.id,
  event: transferWebhook.event,
  transfer: transferStatus.transfer
});

const saldoFinal = store.getSaldo(user.id);
const pass =
  creditResult.credited === true &&
  saldoFinal === DEPOSIT_VALUE - WITHDRAW_VALUE &&
  store.countLedgerByTipo('deposito') === 1 &&
  store.countLedgerByTipo('saque') === 1 &&
  payoutResult.success === true &&
  mpFetchUrls.length === 0 &&
  celcoinFetchUrls.length === 0;

printStep('e2e_final', {
  result: pass ? 'PASS' : 'FAIL',
  ok: pass,
  optionChosen: resolution.mode,
  saldoInicial,
  saldoPosDeposito,
  saldoFinal,
  ledger: store.snapshot(),
  pixIn: {
    paymentIdPreview: maskId(paymentId),
    status: depositResult.status
  },
  pixOut: {
    transferIdPreview: maskId(transferId),
    status: transferStatus.transfer?.status ?? null,
    authorized: transferStatus.transfer?.authorized ?? null
  },
  webhook: {
    payment: paymentWebhook.decision,
    transfer: transferWebhook.decision,
    transferEvent
  },
  mercadoPagoUsed: false,
  celcoinUsed: false,
  supabaseProdUsed: false,
  productionTouched: false,
  financialEffectScope: 'controlled_local_only',
  limitations: [
    'Opção B — persistência local com schema real; não Supabase prod',
    'Transferência pode permanecer PENDING (autorização crítica Sandbox)'
  ]
});

store.teardown();
restoreFetch();
restoreEnv();
process.exit(pass ? 0 : 2);
