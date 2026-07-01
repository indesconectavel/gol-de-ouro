#!/usr/bin/env node
/**
 * F4.3A — E2E Asaas Primary PSP Sandbox (fluxo financeiro V1 controlado).
 *
 * Live: ASAAS_TEST_LIVE=1 + ASAAS_API_KEY no .env
 * Usa ledger in-memory — não toca produção.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyAsaasPrimarySandboxProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';
import { AsaasSandboxLedger, maskId } from './helpers/asaas-sandbox-ledger.mjs';

const require = createRequire(import.meta.url);

const DEPOSIT_VALUE = 5;
const WITHDRAW_VALUE = 1;
const BACEN_PIX_KEY = 'cliente-a00001@pix.bcb.gov.br';
const BACEN_PIX_KEY_TYPE = 'EMAIL';
const WEBHOOK_TOKEN = 'whsec_goldeouro_f43a_e2e';

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const mpFetchUrls = [];
const originalFetch = globalThis.fetch;

function installMpGuard() {
  globalThis.fetch = async (url, init) => {
    const href = typeof url === 'string' ? url : url?.url ?? String(url);
    if (/mercadopago\.com|mercadolibre\.com/i.test(href)) {
      mpFetchUrls.push(href);
      throw new Error(`Mercado Pago bloqueado neste E2E: ${href}`);
    }
    return originalFetch(url, init);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function printStep(step, data) {
  console.log(JSON.stringify({ step, phase: 'F4.3A', ...data }, null, 2));
}

function finishSkip(message, extra = {}) {
  printStep('skip', { result: 'SKIP', ok: false, message, liveMode, ...extra });
  restoreFetch();
  restoreEnv();
  process.exit(0);
}

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

if (liveMode) {
  applyAsaasPrimarySandboxProfile({ webhookToken: WEBHOOK_TOKEN });
}

installMpGuard();
clearAsaasModuleCache(require);

// compat carrega factory no import — recarregar após env
delete require.cache[require.resolve('../src/finance/compat/createPixWithdrawCompat.js')];

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip('Modo determinístico: ASAAS_TEST_LIVE≠1.', { guards });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente.', { guards });
}

if (!guards.primarySandboxMode) {
  finishSkip('Profile primary sandbox incompleto (PAYMENT/PAYOUT_PROVIDER=asaas).', { guards });
}

const factory = require('../src/finance/factory/FinanceProviderFactory');
const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');
const { confirmSandboxPayment, getTransfer, fetchAccountBalance } = require('../src/finance/providers/asaas/asaas-http-client');
const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');

const health = factory.getHealthSnapshot();
printStep('health_snapshot', {
  health,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
  mercadoPagoBlocked: true
});

assertOk(health.asaasPrimarySandboxMode === true, 'asaasPrimarySandboxMode deve ser true');
assertOk(health.paymentProvider === 'asaas', 'paymentProvider deve ser asaas');
assertOk(health.payoutProvider === 'asaas', 'payoutProvider deve ser asaas');
assertOk(health.paymentProviderEnv === 'asaas', 'PAYMENT_PROVIDER env deve ser asaas');
assertOk(health.payoutProviderEnv === 'asaas', 'PAYOUT_PROVIDER env deve ser asaas');

const paymentProvider = factory.resolvePaymentProvider();
const payoutProvider = factory.resolvePayoutProvider();
assertOk(paymentProvider?.name === 'asaas', 'resolvePaymentProvider deve retornar asaas');
assertOk(payoutProvider?.name === 'asaas', 'resolvePayoutProvider deve retornar asaas');

const ledger = new AsaasSandboxLedger();
const user = ledger.createTestUser();
const correlation = `goldeouro-f43a-e2e-${Date.now()}`;

printStep('test_user_created', {
  userIdPreview: maskId(user.id),
  saldoInicial: user.saldo
});

// --- PIX IN ---
const depositResult = await AsaasPaymentProvider.createPixDeposit({
  amount: DEPOSIT_VALUE,
  userId: user.id,
  userEmail: user.email,
  idempotencyKey: correlation,
  notificationUrl: 'http://localhost/sandbox/asaas/webhook'
});

assertOk(depositResult.success === true, `PIX IN falhou: ${depositResult.error || depositResult.message}`);
const paymentId = depositResult.providerRef;
assertOk(paymentId, 'providerRef (paymentId) ausente');

ledger.recordPixDepositPending({
  userId: user.id,
  providerPaymentId: paymentId,
  amount: DEPOSIT_VALUE,
  externalReference: correlation
});

printStep('pix_in_created', {
  paymentIdPreview: maskId(paymentId),
  status: depositResult.status ?? null,
  qrAvailable: Boolean(depositResult.copyPaste || depositResult.qrCodeBase64)
});

const confirmResult = await confirmSandboxPayment(paymentId);
assertOk(confirmResult.success === true, `Confirmação sandbox falhou: ${confirmResult.message}`);

printStep('pix_in_confirmed_sandbox', {
  paymentIdPreview: maskId(paymentId),
  paymentStatus: confirmResult.payment?.status ?? null
});

const paymentWebhook = await handleAsaasWebhook({
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
  body: {
    id: `evt_f43a_pay_${Date.now()}`,
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: paymentId,
      status: 'RECEIVED',
      value: DEPOSIT_VALUE,
      externalReference: correlation
    }
  }
});

assertOk(paymentWebhook.success === true, `Webhook PIX IN inválido: ${paymentWebhook.decision}`);

const creditResult = ledger.creditDepositFromWebhook({
  providerPaymentId: paymentId,
  event: paymentWebhook.event,
  amount: DEPOSIT_VALUE
});

assertOk(creditResult.ok === true && creditResult.credited === true, 'Wallet não creditada');
assertOk(ledger.getSaldo(user.id) === DEPOSIT_VALUE, `Saldo esperado ${DEPOSIT_VALUE}`);

printStep('wallet_credited', {
  saldo: ledger.getSaldo(user.id),
  ledgerDepositId: creditResult.ledgerId,
  webhookDecision: paymentWebhook.decision,
  webhookFinancialEffect: paymentWebhook.financialEffect
});

// --- SAQUE ---
const withdrawRequest = ledger.requestWithdraw({
  userId: user.id,
  amount: WITHDRAW_VALUE,
  pixKey: BACEN_PIX_KEY,
  pixType: BACEN_PIX_KEY_TYPE
});

assertOk(withdrawRequest.ok === true, `Solicitação saque falhou: ${withdrawRequest.reason}`);
const saque = withdrawRequest.saque;
const approveResult = ledger.approveWithdraw(saque.id);
assertOk(approveResult.ok === true, 'Aprovação saque falhou');

printStep('withdraw_requested', {
  saqueIdPreview: maskId(saque.id),
  saldoAposDebito: withdrawRequest.saldo,
  ledgerSaqueId: withdrawRequest.ledgerSaqueId
});

// Funding conta Asaas se necessário para PIX OUT
const balanceCheck = await fetchAccountBalance();
const asaasBalance = balanceCheck.success ? balanceCheck.balance?.balance ?? 0 : 0;
if (Number(asaasBalance) < WITHDRAW_VALUE) {
  const funding = await AsaasPayoutProvider.fundSandboxViaOfficialProcedure({ value: DEPOSIT_VALUE });
  printStep('asaas_account_funding', {
    success: funding.success,
    balanceBefore: funding.balanceBefore ?? null,
    balanceAfter: funding.balanceAfter ?? null
  });
  assertOk(funding.success === true, `Funding Asaas falhou: ${funding.message}`);
}

const payoutResult = await createPixWithdrawCompat(
  WITHDRAW_VALUE,
  BACEN_PIX_KEY,
  BACEN_PIX_KEY_TYPE,
  user.id,
  saque.id,
  correlation,
  { payoutExternalReference: saque.id }
);

assertOk(payoutResult.success === true, `PIX OUT falhou: ${payoutResult.error || payoutResult.message}`);
const transferId = payoutResult.providerRef || payoutResult.transfer?.id;
assertOk(transferId, 'transferId ausente no payout');

ledger.attachTransferToSaque({
  saqueId: saque.id,
  transferId,
  status: payoutResult.transfer?.status ?? 'PENDING',
  authorized: payoutResult.transfer?.authorized ?? null
});

const transferStatus = await getTransfer(transferId, { httpGate: 'pixOut' });
assertOk(transferStatus.success === true, 'Consulta transferência falhou');

const transferEvent =
  transferStatus.transfer?.status === 'DONE' ? 'TRANSFER_DONE' : 'TRANSFER_PENDING';

const transferWebhook = await handleAsaasWebhook({
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
  body: {
    id: `evt_f43a_tr_${Date.now()}`,
    event: transferEvent,
    transfer: {
      id: transferId,
      status: transferStatus.transfer?.status ?? 'PENDING',
      value: WITHDRAW_VALUE,
      authorized: transferStatus.transfer?.authorized ?? null
    }
  }
});

assertOk(transferWebhook.success === true, `Webhook transfer inválido: ${transferWebhook.decision}`);

const saqueUpdate = ledger.applyTransferWebhook({
  saqueId: saque.id,
  event: transferWebhook.event,
  transfer: transferStatus.transfer
});

assertOk(saqueUpdate.ok === true, 'Atualização saque via webhook falhou');

const finalSnapshot = ledger.snapshot();
const transferFinalStatus = transferStatus.transfer?.status ?? 'UNKNOWN';
const transferAuthorized = transferStatus.transfer?.authorized ?? null;
const passPixIn = creditResult.credited === true && ledger.getSaldo(user.id) === DEPOSIT_VALUE - WITHDRAW_VALUE;
const passPixOut = payoutResult.success === true && Boolean(transferId);
const passNoMp = mpFetchUrls.length === 0;

const pass =
  passPixIn &&
  passPixOut &&
  passNoMp &&
  health.asaasPrimarySandboxMode === true;

printStep('e2e_final', {
  result: pass ? 'PASS' : 'FAIL',
  ok: pass,
  pixIn: {
    paymentIdPreview: maskId(paymentId),
    confirmed: confirmResult.success,
    walletSaldo: ledger.getSaldo(user.id),
    ledgerDeposit: creditResult.ledgerId
  },
  webhook: {
    paymentDecision: paymentWebhook.decision,
    transferDecision: transferWebhook.decision,
    transferEvent
  },
  pixOut: {
    transferIdPreview: maskId(transferId),
    status: transferFinalStatus,
    authorized: transferAuthorized,
    saqueStatus: saqueUpdate.saque?.status ?? null
  },
  ledger: finalSnapshot,
  mercadoPagoFetchAttempts: mpFetchUrls.length,
  mercadoPagoUsed: false,
  productionTouched: false,
  integratedInGolDeOuro: true,
  primarySandboxMode: true,
  limitations:
    transferFinalStatus !== 'DONE'
      ? [
          'Transferência pode permanecer PENDING por autorização crítica Sandbox (F4.2G.3)',
          'Ledger/wallet E2E usa store in-memory — não persiste em Supabase prod'
        ]
      : []
});

restoreFetch();
restoreEnv();
process.exit(pass ? 0 : 2);
