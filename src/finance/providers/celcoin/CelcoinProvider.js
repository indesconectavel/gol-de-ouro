'use strict';

const {
  getCelcoinConfig,
  getMissingCredentialFields,
  isCelcoinEnabled,
  isCelcoinHttpEnabled,
  isCelcoinConfigured,
  celcoinLog
} = require('./celcoin-config');
const { requestAccessToken } = require('./celcoin-http-client');

const STUB_PHASE = 'preparatory_stub_v1';

/**
 * Provider Celcoin unificado (PIX IN + OUT + webhooks).
 * Modo preparatório: nunca realiza chamadas HTTP reais nesta fatia.
 */
const CelcoinProvider = {
  name: 'celcoin',

  isEnabled() {
    return isCelcoinEnabled();
  },

  isConfigured() {
    return isCelcoinConfigured();
  },

  _guard(method) {
    if (!isCelcoinEnabled()) {
      celcoinLog('blocked_disabled', { method });
      return {
        blocked: true,
        success: false,
        error: 'CELCOIN_DISABLED',
        message: `Celcoin.${method} bloqueado: CELCOIN_ENABLED=false`
      };
    }

    const config = getCelcoinConfig();
    const missing = getMissingCredentialFields(config);
    if (missing.length > 0) {
      celcoinLog('blocked_not_configured', { method, missingFields: missing });
      return {
        blocked: true,
        success: false,
        error: 'CELCOIN_NOT_CONFIGURED',
        message: `Celcoin.${method} bloqueado: credenciais incompletas (${missing.join(', ')})`,
        missingFields: missing
      };
    }

    return null;
  },

  _stubResponse(method) {
    celcoinLog('stub_noop', { method, phase: STUB_PHASE });
    return {
      success: false,
      error: 'CELCOIN_STUB_NOT_IMPLEMENTED',
      message: `Celcoin.${method} em modo preparatório (${STUB_PHASE}) — sem chamadas HTTP reais`,
      phase: STUB_PHASE
    };
  },

  async authenticate() {
    const guard = this._guard('authenticate');
    if (guard) return guard;

    if (!isCelcoinHttpEnabled()) {
      return this._stubResponse('authenticate');
    }

    const result = await requestAccessToken();
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      cached: result.cached === true,
      authBaseUrl: result.authBaseUrl
    };
  },

  async createPixDeposit(input = {}) {
    const guard = this._guard('createPixDeposit');
    if (guard) return guard;
    celcoinLog('create_pix_deposit_stub', {
      amount: input.amount ?? null,
      userIdHash: input.userId ? String(input.userId).slice(0, 8) : null
    });
    return this._stubResponse('createPixDeposit');
  },

  async createPixWithdraw(input = {}) {
    const guard = this._guard('createPixWithdraw');
    if (guard) return guard;
    celcoinLog('create_pix_withdraw_stub', {
      netAmount: input.netAmount ?? input.amount ?? null,
      saqueId: input.saqueId ?? null,
      correlationId: input.correlationId ?? null
    });
    return this._stubResponse('createPixWithdraw');
  },

  async getTransactionStatus(providerRef, options = {}) {
    const guard = this._guard('getTransactionStatus');
    if (guard) return guard;
    celcoinLog('get_transaction_status_stub', {
      providerRef: providerRef ? String(providerRef).slice(0, 36) : null,
      kind: options.kind || 'unknown'
    });
    return this._stubResponse('getTransactionStatus');
  },

  validateWebhook(req) {
    if (!isCelcoinEnabled()) {
      celcoinLog('webhook_validate_blocked_disabled', {});
      return {
        valid: false,
        error: 'CELCOIN_DISABLED',
        message: 'Webhook Celcoin rejeitado: CELCOIN_ENABLED=false'
      };
    }

    const config = getCelcoinConfig();
    if (!config.webhookSecret) {
      celcoinLog('webhook_validate_blocked_no_secret', {});
      return {
        valid: false,
        error: 'CELCOIN_WEBHOOK_SECRET_MISSING',
        message: 'Webhook Celcoin rejeitado: CELCOIN_WEBHOOK_SECRET ausente'
      };
    }

    if (!req || typeof req !== 'object') {
      return { valid: false, error: 'CELCOIN_WEBHOOK_INVALID_REQUEST' };
    }

    celcoinLog('webhook_validate_stub', { phase: STUB_PHASE });
    return {
      valid: false,
      error: 'CELCOIN_STUB_NOT_IMPLEMENTED',
      message: `validateWebhook em modo preparatório (${STUB_PHASE})`
    };
  },

  async handleWebhook(req) {
    const validation = this.validateWebhook(req);
    if (!validation.valid) {
      return validation;
    }
    return this._stubResponse('handleWebhook');
  }
};

module.exports = CelcoinProvider;
