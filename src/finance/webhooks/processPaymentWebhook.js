'use strict';

const axios = require('axios');
const { isPaymentWebhookEngineEnabled } = require('../config/payment-webhook-config');
const { isProductionRuntime, isAsaasProductionEnabled } = require('../config/primary-psp');
const {
  isAsaasWebhookEnabled,
  isAsaasSandboxWebhookAllowed
} = require('../providers/asaas/asaas-config');
const { validateMercadoPagoDepositWebhook } = require('../providers/mercadopago/mercadopago-webhook-validator');
const {
  normalizeMercadoPagoPaymentResourceId,
  normalizeMercadoPagoPaymentWebhook
} = require('../providers/mercadopago/mercadopago-webhook-normalizer');
const { validateAsaasWebhook, DECISION } = require('../providers/asaas/asaas-webhook-validator');
const { normalizeAsaasPaymentWebhook } = require('../providers/asaas/asaas-webhook-normalizer');
const { checkSupabaseDepositIdempotency } = require('./paymentWebhookIdempotency');
const { defaultStore } = require('./paymentWebhookDryRunStore');
const {
  isAsaasControlledCreditEnabled,
  isAsaasProductionWebhookCreditEnabled,
  getControlledCreditBlockReason
} = require('../config/payment-webhook-config');

function isAsaasWebhookRouteAllowed() {
  if (!isAsaasWebhookEnabled()) return false;
  if (!isAsaasSandboxWebhookAllowed() && !isAsaasProductionEnabled()) return false;
  if (isProductionRuntime() && !isAsaasProductionEnabled()) return false;
  return true;
}

async function fetchMercadoPagoPayment(paymentIdNum, accessToken) {
  if (!accessToken) {
    return { success: false, error: 'MP_DEPOSIT_TOKEN_MISSING' };
  }
  try {
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentIdNum}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (err) {
    return {
      success: false,
      error: 'MP_PAYMENT_FETCH_FAILED',
      message: err?.response?.data?.message || err.message
    };
  }
}

/**
 * Processa webhook financeiro provider-agnostic (F4.5).
 * @param {object} input
 * @param {'mercadopago'|'asaas'} input.provider
 * @param {import('express').Request} [input.req]
 * @param {object} [input.body]
 * @param {object} [input.headers]
 * @param {object} [input.deps]
 */
async function processPaymentWebhook(input = {}) {
  if (!isPaymentWebhookEngineEnabled()) {
    return {
      success: false,
      engineEnabled: false,
      error: 'PAYMENT_WEBHOOK_ENGINE_DISABLED',
      message: 'PAYMENT_WEBHOOK_ENGINE_ENABLED=false'
    };
  }

  const provider = String(input.provider || '').toLowerCase();
  const req = input.req;
  const body = input.body ?? req?.body ?? {};
  const headers = input.headers ?? req?.headers ?? {};
  const deps = input.deps || {};
  const dryRunStore = deps.dryRunStore || defaultStore;
  const financeLog = deps.financeLog || (() => {});

  if (provider === 'mercadopago') {
    const signatureValidation =
      input.signatureValidation || validateMercadoPagoDepositWebhook(req || { body, headers });

    if (!signatureValidation.valid) {
      return {
        success: false,
        provider,
        rejected: true,
        httpStatus: 401,
        error: signatureValidation.error || 'INVALID_SIGNATURE',
        financialEffect: false
      };
    }

    const norm = normalizeMercadoPagoPaymentResourceId(body?.data?.id);
    if (!norm) {
      return {
        success: true,
        provider,
        ignored: true,
        reason: 'INVALID_PAYMENT_ID',
        financialEffect: false
      };
    }

    const idempotency = await checkSupabaseDepositIdempotency(deps.supabase, norm.idStr);
    if (idempotency.alreadyProcessed) {
      financeLog('deposit_webhook_duplicate', {
        payment_id: norm.idStr,
        tipo: 'deposito',
        status: 'idempotent',
        provider
      });
      return {
        success: true,
        provider,
        idempotent: true,
        event: {
          provider: 'mercadopago',
          eventId: `mp_payment_${norm.idStr}`,
          paymentId: norm.idStr,
          status: 'approved',
          financialEffect: false,
          shouldCreditWallet: false
        },
        financialEffect: false
      };
    }

    const mpFetch = await fetchMercadoPagoPayment(
      norm.idNum,
      deps.mercadoPagoAccessToken || process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN
    );

    if (!mpFetch.success) {
      return {
        success: false,
        provider,
        error: mpFetch.error,
        message: mpFetch.message,
        financialEffect: false
      };
    }

    const normalized = normalizeMercadoPagoPaymentWebhook({
      body,
      mpPayment: mpFetch.data
    });

    if (!normalized.success || normalized.ignored) {
      return {
        success: true,
        provider,
        ignored: true,
        reason: normalized.reason,
        financialEffect: false
      };
    }

    const event = normalized.event;

    if (!event.shouldCreditWallet) {
      financeLog('deposit_webhook_non_terminal', {
        payment_id: event.paymentId,
        tipo: 'deposito',
        status: event.rawStatus,
        provider
      });
      return {
        success: true,
        provider,
        event,
        credited: false,
        financialEffect: false
      };
    }

    if (typeof deps.claimAndCreditApprovedPixDeposit !== 'function') {
      return {
        success: false,
        provider,
        event,
        error: 'CLAIM_HANDLER_MISSING',
        financialEffect: false
      };
    }

    const credited = await deps.claimAndCreditApprovedPixDeposit(event.paymentId);
    financeLog('deposit_webhook_claim', {
      payment_id: event.paymentId,
      tipo: 'deposito',
      status: credited ? 'approved' : 'idempotent',
      provider
    });

    return {
      success: true,
      provider,
      event: { ...event, financialEffect: credited === true },
      credited: credited === true,
      idempotent: credited === false,
      financialEffect: credited === true
    };
  }

  if (provider === 'asaas') {
    const controlledCreditRequested =
      String(process.env.PAYMENT_WEBHOOK_CONTROLLED_CREDIT || '').trim() === '1' ||
      String(process.env.ASAAS_CONTROLLED_CREDIT_ENABLED || '').trim().toLowerCase() === 'true';

    if (controlledCreditRequested && isProductionRuntime() && !isAsaasProductionEnabled()) {
      return {
        success: false,
        provider,
        rejected: true,
        httpStatus: 403,
        error: 'CONTROLLED_CREDIT_BLOCKED_PROD',
        creditDecision: 'blocked_prod',
        financialEffect: false
      };
    }

    if (!isAsaasWebhookRouteAllowed()) {
      return {
        success: false,
        provider,
        rejected: true,
        httpStatus: 403,
        error: 'ASAAS_WEBHOOK_ROUTE_BLOCKED',
        message: 'Rota Asaas bloqueada por flags ou produção sem gate',
        financialEffect: false
      };
    }

    const validation = validateAsaasWebhook({ headers, body });
    const normalized = normalizeAsaasPaymentWebhook({ body, validation });

    if (normalized.rejected) {
      return {
        success: false,
        provider,
        rejected: true,
        httpStatus: 401,
        error: normalized.reason,
        validation,
        financialEffect: false
      };
    }

    if (normalized.ignored || !normalized.success || !normalized.event) {
      return {
        success: true,
        provider,
        ignored: true,
        reason: normalized.reason || validation.decision,
        validation,
        financialEffect: false
      };
    }

    const event = normalized.event;

    if (isAsaasControlledCreditEnabled()) {
      if (isProductionRuntime()) {
        return {
          success: false,
          provider,
          rejected: true,
          httpStatus: 403,
          error: 'CONTROLLED_CREDIT_BLOCKED_PROD',
          creditDecision: 'blocked_prod',
          financialEffect: false
        };
      }

      const controlledStore = deps.controlledCreditStore;
      if (!controlledStore) {
        return {
          success: false,
          provider,
          error: 'CONTROLLED_CREDIT_STORE_MISSING',
          creditDecision: 'blocked_invalid',
          financialEffect: false
        };
      }

      const creditResult = controlledStore.creditFromWebhookEvent({ event, body });
      return {
        success: creditResult.ok !== false,
        provider,
        event: {
          ...event,
          financialEffect: creditResult.financialEffect === true
        },
        controlledCredit: true,
        creditDecision: creditResult.decision,
        credited: creditResult.credited === true,
        idempotent: creditResult.idempotent === true,
        financialEffect: creditResult.financialEffect === true,
        saldo: creditResult.saldo,
        ledgerId: creditResult.ledgerId,
        store: controlledStore.snapshot()
      };
    }

    if (isAsaasProductionWebhookCreditEnabled()) {
      const lookupId = event.paymentId || event.externalReference;
      if (!lookupId) {
        return {
          success: false,
          provider,
          error: 'MISSING_PAYMENT_IDENTIFIER',
          productionCredit: true,
          financialEffect: false
        };
      }

      const idempotency = await checkSupabaseDepositIdempotency(deps.supabase, String(lookupId));
      if (idempotency.alreadyProcessed) {
        financeLog('deposit_webhook_duplicate', {
          payment_id: String(lookupId),
          tipo: 'deposito',
          status: 'idempotent',
          provider
        });
        return {
          success: true,
          provider,
          idempotent: true,
          productionCredit: true,
          event: { ...event, financialEffect: false },
          creditDecision: 'ignored_duplicate',
          financialEffect: false
        };
      }

      if (!event.shouldCreditWallet) {
        financeLog('deposit_webhook_non_terminal', {
          payment_id: String(lookupId),
          tipo: 'deposito',
          status: event.rawStatus,
          provider
        });
        return {
          success: true,
          provider,
          event,
          credited: false,
          productionCredit: true,
          creditDecision: 'skipped_not_credit_event',
          financialEffect: false
        };
      }

      if (typeof deps.claimAndCreditApprovedPixDeposit !== 'function') {
        return {
          success: false,
          provider,
          event,
          error: 'CLAIM_HANDLER_MISSING',
          productionCredit: true,
          financialEffect: false
        };
      }

      const credited = await deps.claimAndCreditApprovedPixDeposit(String(lookupId));
      financeLog('deposit_webhook_claim', {
        payment_id: String(lookupId),
        tipo: 'deposito',
        status: credited ? 'approved' : 'idempotent',
        provider
      });

      return {
        success: true,
        provider,
        event: { ...event, financialEffect: credited === true },
        credited: credited === true,
        idempotent: credited === false,
        productionCredit: true,
        creditDecision: credited ? 'credited' : 'idempotent_or_missing',
        financialEffect: credited === true
      };
    }

    const blockReason = getControlledCreditBlockReason();
    if (blockReason === 'blocked_prod') {
      return {
        success: false,
        provider,
        rejected: true,
        httpStatus: 403,
        creditDecision: 'blocked_prod',
        financialEffect: false
      };
    }

    const mark = dryRunStore.markProcessed(event, { mode: 'sandbox_dry_run' });

    if (mark.duplicate) {
      return {
        success: true,
        provider,
        event,
        idempotent: true,
        dryRun: true,
        financialEffect: false,
        store: dryRunStore.snapshot()
      };
    }

    let creditDecision = 'skipped_not_credit_event';
    if (event.shouldCreditWallet) {
      creditDecision = 'dry_run_credit_decision_only';
      dryRunStore.recordCreditDecision(event, creditDecision);
    }

    return {
      success: true,
      provider,
      event: { ...event, financialEffect: false },
      dryRun: true,
      creditDecision,
      shouldCreditWallet: event.shouldCreditWallet,
      financialEffect: false,
      store: dryRunStore.snapshot()
    };
  }

  return {
    success: false,
    error: 'UNKNOWN_WEBHOOK_PROVIDER',
    provider,
    financialEffect: false
  };
}

module.exports = {
  processPaymentWebhook,
  isAsaasWebhookRouteAllowed,
  isPaymentWebhookEngineEnabled,
  isAsaasControlledCreditEnabled,
  isAsaasProductionWebhookCreditEnabled,
  fetchMercadoPagoPayment,
  DECISION
};
