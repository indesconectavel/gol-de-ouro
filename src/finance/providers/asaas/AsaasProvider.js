'use strict';

const {
  getAsaasConfig,
  isAsaasEnabled,
  isAsaasHttpEnabled,
  isAsaasConfigured,
  isAsaasPrimarySandboxMode,
  maskApiKeyPreview,
  maskPixKeyPreview,
  asaasLog
} = require('./asaas-config');
const { fetchMyAccount, createPixTransfer, getTransfer } = require('./asaas-http-client');
const { handleAsaasWebhook } = require('./asaas-webhook-handler');
const { validateAsaasWebhook, DECISION } = require('./asaas-webhook-validator');

const STUB_PHASE = 'preparatory_stub_v1';
const PRIMARY_SANDBOX_PAYOUT_PHASE = 'primary_sandbox_payout_v1';

/**
 * Provider Asaas unificado (PIX IN + OUT + webhooks) — F4.2B stub.
 * Autenticação por API Key (header access_token), não OAuth.
 */
const AsaasProvider = {
  name: 'asaas',

  getName() {
    return this.name;
  },

  isEnabled() {
    return isAsaasEnabled();
  },

  isConfigured() {
    return isAsaasConfigured();
  },

  _guard(method) {
    if (!isAsaasEnabled()) {
      asaasLog('blocked_disabled', { method });
      return {
        blocked: true,
        success: false,
        error: 'ASAAS_DISABLED',
        message: `Asaas.${method} bloqueado: ASAAS_ENABLED=false`
      };
    }

    const config = getAsaasConfig();
    if (!config.apiKey) {
      asaasLog('blocked_not_configured', { method, missingApiKey: true });
      return {
        blocked: true,
        success: false,
        error: 'ASAAS_NOT_CONFIGURED',
        message: `Asaas.${method} bloqueado: ASAAS_API_KEY ausente`
      };
    }

    return null;
  },

  _paymentStub(method) {
    asaasLog('payment_stub', { method, phase: STUB_PHASE });
    return {
      success: false,
      error: 'ASAAS_PAYMENT_NOT_IMPLEMENTED',
      message: `Asaas.${method} não implementado (${STUB_PHASE}) — sem cobrança/PIX IN`,
      phase: STUB_PHASE
    };
  },

  _payoutStub(method) {
    asaasLog('payout_stub', { method, phase: STUB_PHASE });
    return {
      success: false,
      error: 'ASAAS_PAYOUT_NOT_IMPLEMENTED',
      message: `Asaas.${method} não implementado (${STUB_PHASE}) — sem saque/PIX OUT`,
      phase: STUB_PHASE
    };
  },

  /**
   * Autenticação Asaas — validação de API Key (sem OAuth).
   * HTTP real somente com guards sandbox (F4.2A).
   */
  async authenticate() {
    const guard = this._guard('authenticate');
    if (guard) return guard;

    const config = getAsaasConfig();
    const base = {
      success: true,
      authType: 'api_key',
      configured: true,
      env: config.env,
      baseUrl: config.baseUrl,
      apiKeyPreview: maskApiKeyPreview(config.apiKey)
    };

    if (!isAsaasHttpEnabled()) {
      asaasLog('authenticate_local_only', { httpVerified: false });
      return {
        ...base,
        httpVerified: false,
        message: 'API Key presente; HTTP bloqueado por guards sandbox'
      };
    }

    const result = await fetchMyAccount();
    if (!result.success) {
      return result;
    }

    return {
      ...base,
      httpVerified: true,
      httpStatus: result.httpStatus,
      account: result.account
    };
  },

  /**
   * Health check — GET /myAccount quando HTTP sandbox autorizado.
   */
  async health() {
    const guard = this._guard('health');
    if (guard) {
      return { ...guard, ok: false };
    }

    const config = getAsaasConfig();

    if (!isAsaasHttpEnabled()) {
      asaasLog('health_local_only', { httpVerified: false });
      return {
        success: true,
        ok: true,
        provider: this.name,
        authType: 'api_key',
        configured: true,
        httpVerified: false,
        env: config.env,
        baseUrl: config.baseUrl,
        apiKeyPreview: maskApiKeyPreview(config.apiKey),
        message: 'Provider configurado; HTTP bloqueado por guards sandbox'
      };
    }

    const result = await fetchMyAccount();
    return {
      success: result.success,
      ok: result.success,
      provider: this.name,
      authType: 'api_key',
      configured: true,
      httpVerified: result.success,
      httpStatus: result.httpStatus ?? null,
      baseUrl: result.baseUrl ?? config.baseUrl,
      account: result.account ?? null,
      apiKeyPreview: maskApiKeyPreview(config.apiKey),
      error: result.error,
      message: result.message
    };
  },

  async createPixDeposit(input = {}) {
    const guard = this._guard('createPixDeposit');
    if (guard) return guard;
    asaasLog('create_pix_deposit_blocked_stub', {
      amount: input.amount ?? null,
      userIdHash: input.userId ? String(input.userId).slice(0, 8) : null
    });
    return this._paymentStub('createPixDeposit');
  },

  async createPixWithdraw(input = {}) {
    const guard = this._guard('createPixWithdraw');
    if (guard) return guard;

    if (!isAsaasPrimarySandboxMode()) {
      asaasLog('create_pix_withdraw_blocked_stub', {
        netAmount: input.netAmount ?? input.amount ?? null,
        saqueId: input.saqueId ?? null
      });
      return this._payoutStub('createPixWithdraw');
    }

    const netAmount = Number(input.netAmount ?? input.amount);
    const pixKey = input.pixKey;
    const pixType = String(input.pixType || 'EMAIL').trim().toUpperCase();

    if (!Number.isFinite(netAmount) || netAmount <= 0) {
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_INVALID_VALUE',
        message: 'Valor líquido de saque inválido',
        phase: PRIMARY_SANDBOX_PAYOUT_PHASE
      };
    }

    if (!pixKey) {
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_KEY_REQUIRED',
        message: 'Chave Pix obrigatória',
        phase: PRIMARY_SANDBOX_PAYOUT_PHASE
      };
    }

    const transferResult = await createPixTransfer({
      value: netAmount,
      pixAddressKey: pixKey,
      pixAddressKeyType: pixType,
      description: input.description || `Gol de Ouro sandbox saque ${input.saqueId || 'test'}`,
      externalReference: input.payoutExternalReference || input.saqueId || input.correlationId,
      authToken: input.authToken || process.env.ASAAS_SANDBOX_CRITICAL_TOKEN || '000000'
    });

    if (!transferResult.success) {
      return {
        ...transferResult,
        phase: PRIMARY_SANDBOX_PAYOUT_PHASE,
        integratedInGolDeOuro: true,
        provider: 'asaas'
      };
    }

    asaasLog('primary_sandbox_pix_withdraw_created', {
      saqueId: input.saqueId ? String(input.saqueId).slice(0, 36) : null,
      transferId: transferResult.transfer?.id
        ? String(transferResult.transfer.id).slice(0, 24)
        : null,
      status: transferResult.transfer?.status ?? null,
      pixKeyPreview: maskPixKeyPreview(pixKey)
    });

    return {
      success: true,
      provider: 'asaas',
      providerRef: transferResult.transfer?.id ?? null,
      transfer: transferResult.transfer,
      httpStatus: transferResult.httpStatus,
      phase: PRIMARY_SANDBOX_PAYOUT_PHASE,
      integratedInGolDeOuro: true,
      financialEffect: false
    };
  },

  async getTransactionStatus(providerRef, options = {}) {
    const guard = this._guard('getTransactionStatus');
    if (guard) return guard;

    if (!isAsaasPrimarySandboxMode() || options.kind !== 'payout') {
      asaasLog('get_transaction_status_stub', {
        providerRef: providerRef ? String(providerRef).slice(0, 36) : null,
        kind: options.kind || 'unknown'
      });
      const errorCode =
        options.kind === 'payout'
          ? 'ASAAS_PAYOUT_NOT_IMPLEMENTED'
          : 'ASAAS_PAYMENT_NOT_IMPLEMENTED';
      return {
        success: false,
        error: errorCode,
        message: `Asaas.getTransactionStatus não implementado (${STUB_PHASE})`,
        phase: STUB_PHASE
      };
    }

    const result = await getTransfer(providerRef, { httpGate: 'pixOut' });
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        status: result.transfer?.status ?? null,
        authorized: result.transfer?.authorized ?? null,
        amount: result.transfer?.value ?? null,
        providerRef: result.transfer?.id ?? providerRef
      },
      phase: PRIMARY_SANDBOX_PAYOUT_PHASE
    };
  },

  validateWebhook(req) {
    const result = validateAsaasWebhook({ req, headers: req?.headers, body: req?.body });
    return {
      valid: result.valid === true,
      decision: result.decision,
      error: result.error,
      message: result.message,
      event: result.event,
      eventId: result.eventId
    };
  },

  async handleWebhook(req) {
    const result = await handleAsaasWebhook({ req, headers: req?.headers, body: req?.body });
    return {
      ...result,
      valid: result.decision === DECISION.VALID_SIMULATED_EVENT
    };
  }
};

module.exports = AsaasProvider;
