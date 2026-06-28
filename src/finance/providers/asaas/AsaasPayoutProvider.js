'use strict';

const {
  isAsaasConfigured,
  isAsaasPixOutHttpEnabled,
  isAsaasPixOutEnabled,
  isAsaasSandboxPixOutAllowed,
  isAsaasPixInHttpEnabled,
  isAsaasTransferAuthHttpEnabled,
  maskPixKeyPreview,
  asaasLog
} = require('./asaas-config');
const {
  fetchAccountBalance,
  createPixTransfer,
  getTransfer,
  createSandboxCustomer,
  createPixPayment,
  confirmSandboxPayment
} = require('./asaas-http-client');
const AsaasProvider = require('./AsaasProvider');

/** Chave Pix fictícia BACEN — docs.asaas.com/docs/testing-transfers */
const SANDBOX_BACEN_PIX_KEY = 'cliente-a00001@pix.bcb.gov.br';
const SANDBOX_BACEN_PIX_KEY_TYPE = 'EMAIL';
const PIX_OUT_CAPABILITY_PHASE = 'pix_out_sandbox_capability_v1';
const PIX_OUT_FUNDING_PHASE = 'pix_out_sandbox_funding_v1';
const TRANSFER_AUTH_INVESTIGATION_PHASE = 'transfer_auth_investigation_v1';
const SANDBOX_DEFAULT_PIX_OUT_VALUE = 1;
const SANDBOX_DEFAULT_FUNDING_VALUE = 5;
const SANDBOX_MAX_PIX_OUT_VALUE = 10;

function classifyTransferAuthStatus(transfer) {
  if (!transfer) {
    return 'UNKNOWN';
  }
  if (transfer.status === 'DONE' && transfer.authorized === true) {
    return 'AUTHORIZED_AND_DONE';
  }
  if (transfer.status === 'FAILED') {
    return 'FAILED';
  }
  if (transfer.status === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (transfer.authorized === false && transfer.status === 'PENDING') {
    return 'PENDING_REQUIRES_2FA';
  }
  if (transfer.status === 'BANK_PROCESSING') {
    return 'PENDING_ASYNC_PROCESSING';
  }
  if (transfer.status === 'PENDING') {
    return 'PENDING_ASYNC_PROCESSING';
  }
  return 'UNKNOWN';
}

function classifyFinalAuthInvestigation(transfer, authEndpointDocumented) {
  if (!transfer) {
    return 'UNKNOWN';
  }
  if (transfer.status === 'DONE' && transfer.authorized === true) {
    return 'AUTHORIZED_AND_DONE';
  }
  if (transfer.authorized === false && transfer.status === 'PENDING') {
    return authEndpointDocumented ? 'PENDING_REQUIRES_2FA' : 'PENDING_REQUIRES_2FA';
  }
  if (transfer.status === 'PENDING' || transfer.status === 'BANK_PROCESSING') {
    return 'PENDING_ASYNC_PROCESSING';
  }
  if (transfer.status === 'FAILED' || transfer.status === 'CANCELLED') {
    return 'SANDBOX_LIMITATION';
  }
  return 'UNKNOWN';
}

/**
 * Adapter Asaas → contrato PayoutProvider (PIX OUT).
 * F4.3C — adapter PIX OUT; resolução via FinanceProviderFactory (PSP primário Asaas).
 */
const AsaasPayoutProvider = {
  name: 'asaas',

  isConfigured() {
    return isAsaasConfigured();
  },

  isPixOutSandboxReady() {
    return isAsaasPixOutHttpEnabled() && isAsaasConfigured();
  },

  /**
   * Funding oficial Sandbox — cobrança Pix + confirmação via API.
   * @see https://docs.asaas.com/docs/adding-balance-to-a-sandbox-account
   * @see https://docs.asaas.com/reference/confirmar-pagamento
   */
  async fundSandboxViaOfficialProcedure(input = {}) {
    if (!isAsaasPixOutHttpEnabled()) {
      return {
        success: false,
        error: 'ASAAS_SANDBOX_FUNDING_DISABLED',
        message: 'Funding sandbox bloqueado: guards PIX OUT sandbox ausentes',
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_FUNDING_PHASE
      };
    }

    if (!isAsaasPixInHttpEnabled()) {
      return {
        success: false,
        error: 'ASAAS_PIX_IN_HTTP_DISABLED',
        message:
          'Funding requer PIX IN sandbox habilitado para criar cobrança (ASAAS_PIX_IN_ENABLED + ALLOW_ASAAS_SANDBOX_PIX_IN)',
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_FUNDING_PHASE
      };
    }

    const value = Number(input.value ?? SANDBOX_DEFAULT_FUNDING_VALUE);
    if (!Number.isFinite(value) || value < SANDBOX_DEFAULT_FUNDING_VALUE) {
      return {
        success: false,
        error: 'ASAAS_SANDBOX_FUNDING_INVALID_VALUE',
        message: `Valor mínimo de funding sandbox: R$ ${SANDBOX_DEFAULT_FUNDING_VALUE.toFixed(2)}`,
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_FUNDING_PHASE
      };
    }

    const balanceBeforeResult = await fetchAccountBalance();
    const balanceBefore = balanceBeforeResult.success
      ? balanceBeforeResult.balance?.balance ?? null
      : null;

    const customerResult = await createSandboxCustomer({
      name: 'Gol de Ouro Sandbox Funding F4.2G.1',
      externalReference: input.customerExternalReference || `goldeouro-funding-${Date.now()}`
    });
    if (!customerResult.success) {
      return {
        ...customerResult,
        balanceBefore,
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_FUNDING_PHASE
      };
    }

    const paymentResult = await createPixPayment({
      customerId: customerResult.customerId,
      value,
      description: input.description || 'Gol de Ouro F4.2G.1 Sandbox Funding',
      externalReference: input.externalReference || `goldeouro-funding-pay-${Date.now()}`
    });
    if (!paymentResult.success) {
      return {
        ...paymentResult,
        balanceBefore,
        customerId: customerResult.customerId,
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_FUNDING_PHASE
      };
    }

    const paymentId = paymentResult.payment?.id;
    const confirmResult = await confirmSandboxPayment(paymentId);
    if (!confirmResult.success) {
      return {
        ...confirmResult,
        balanceBefore,
        paymentId: paymentId ? String(paymentId).slice(0, 24) : null,
        paymentStatus: paymentResult.payment?.status ?? null,
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_FUNDING_PHASE
      };
    }

    const balanceAfterResult = await fetchAccountBalance();
    const balanceAfter = balanceAfterResult.success
      ? balanceAfterResult.balance?.balance ?? null
      : null;

    asaasLog('sandbox_funding_complete', {
      paymentId: paymentId ? String(paymentId).slice(0, 24) : null,
      balanceBefore,
      balanceAfter,
      fundingValue: value
    });

    return {
      success: true,
      fundingMethod: 'official_sandbox_confirm_payment',
      fundingEndpoint: 'POST /sandbox/payment/{id}/confirm',
      balanceBefore,
      balanceAfter,
      fundingValue: value,
      paymentId: paymentId ? String(paymentId).slice(0, 24) : null,
      paymentStatus: confirmResult.payment?.status ?? null,
      customerId: customerResult.customerId
        ? String(customerResult.customerId).slice(0, 24)
        : null,
      httpStatus: confirmResult.httpStatus,
      financialEffect: false,
      capabilityOnly: true,
      integratedInGolDeOuro: false,
      phase: PIX_OUT_FUNDING_PHASE
    };
  },

  /**
   * Validação de capacidade PIX OUT sandbox — sem integração ao Gol de Ouro.
   * @see https://docs.asaas.com/docs/transferencia-para-contas-de-outra-instituicao-pix-ted
   */
  async createSandboxPixTransfer(input = {}) {
    if (!isAsaasPixOutEnabled()) {
      asaasLog('pix_out_blocked_disabled', { method: 'createSandboxPixTransfer' });
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_DISABLED',
        message: 'PIX OUT Asaas bloqueado: ASAAS_PIX_OUT_ENABLED=false',
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_CAPABILITY_PHASE
      };
    }

    if (!isAsaasSandboxPixOutAllowed()) {
      asaasLog('pix_out_blocked_sandbox_flag', { method: 'createSandboxPixTransfer' });
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_SANDBOX_BLOCKED',
        message: 'PIX OUT Asaas bloqueado: ALLOW_ASAAS_SANDBOX_PIX_OUT=0',
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_CAPABILITY_PHASE
      };
    }

    if (!isAsaasPixOutHttpEnabled()) {
      asaasLog('pix_out_blocked_http', { method: 'createSandboxPixTransfer' });
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_HTTP_DISABLED',
        message:
          'HTTP PIX OUT bloqueado: verifique ASAAS_ENABLED, ALLOW_ASAAS_SANDBOX_AUTH, ASAAS_ENV=sandbox',
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_CAPABILITY_PHASE
      };
    }

    const value = Number(input.value ?? SANDBOX_DEFAULT_PIX_OUT_VALUE);
    if (!Number.isFinite(value) || value <= 0 || value > SANDBOX_MAX_PIX_OUT_VALUE) {
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_INVALID_VALUE',
        message: `Valor de teste inválido. Use 0 < value <= ${SANDBOX_MAX_PIX_OUT_VALUE}`,
        financialEffect: false,
        capabilityOnly: true,
        phase: PIX_OUT_CAPABILITY_PHASE
      };
    }

    const pixAddressKey = input.pixAddressKey || SANDBOX_BACEN_PIX_KEY;
    const pixAddressKeyType = input.pixAddressKeyType || SANDBOX_BACEN_PIX_KEY_TYPE;

    let balanceBefore = null;
    if (input.checkBalance !== false) {
      const balanceResult = await fetchAccountBalance();
      balanceBefore = balanceResult.success
        ? { balance: balanceResult.balance?.balance ?? null, httpStatus: balanceResult.httpStatus }
        : {
            error: balanceResult.error,
            message: balanceResult.message,
            httpStatus: balanceResult.httpStatus ?? null
          };
    }

    const transferResult = await createPixTransfer({
      value,
      pixAddressKey,
      pixAddressKeyType,
      description: input.description || 'Gol de Ouro F4.2G PIX OUT Sandbox Capability',
      externalReference: input.externalReference || `goldeouro-f4.2g-${Date.now()}`
    });

    let transferStatus = null;
    if (transferResult.success && transferResult.transfer?.id && input.fetchStatus !== false) {
      transferStatus = await getTransfer(transferResult.transfer.id);
    }

    asaasLog('pix_out_capability_result', {
      transferSuccess: transferResult.success,
      transferId: transferResult.transfer?.id
        ? String(transferResult.transfer.id).slice(0, 24)
        : null,
      transferStatus: transferResult.transfer?.status ?? null,
      pixKeyPreview: maskPixKeyPreview(pixAddressKey)
    });

    return {
      success: transferResult.success,
      error: transferResult.error ?? null,
      message: transferResult.message ?? null,
      httpStatus: transferResult.httpStatus ?? null,
      errorCode: transferResult.errorCode ?? null,
      balanceBefore,
      transfer: transferResult.transfer ?? null,
      transferDetail: transferStatus?.transfer ?? null,
      pixKeyPreview: maskPixKeyPreview(pixAddressKey),
      pixAddressKeyType,
      value,
      financialEffect: false,
      capabilityOnly: true,
      integratedInGolDeOuro: false,
      phase: PIX_OUT_CAPABILITY_PHASE
    };
  },

  /**
   * Consulta transferência sandbox para investigação de autorização — F4.2G.2.
   */
  async inspectSandboxTransfer(transferId, options = {}) {
    if (!isAsaasTransferAuthHttpEnabled() && !isAsaasPixOutHttpEnabled()) {
      return {
        success: false,
        error: 'ASAAS_TRANSFER_AUTH_HTTP_DISABLED',
        message: 'Consulta bloqueada: verifique ASAAS_TRANSFER_AUTH_TEST=1 e guards sandbox',
        financialEffect: false,
        capabilityOnly: true,
        phase: TRANSFER_AUTH_INVESTIGATION_PHASE
      };
    }

    if (!transferId) {
      return {
        success: false,
        error: 'ASAAS_TRANSFER_ID_REQUIRED',
        message: 'transferId é obrigatório',
        financialEffect: false,
        capabilityOnly: true,
        phase: TRANSFER_AUTH_INVESTIGATION_PHASE
      };
    }

    const httpGate = isAsaasTransferAuthHttpEnabled() ? 'transferAuth' : 'pixOut';
    const result = await getTransfer(transferId, { httpGate });

    if (!result.success) {
      return {
        ...result,
        transferId: String(transferId).slice(0, 36),
        financialEffect: false,
        capabilityOnly: true,
        phase: TRANSFER_AUTH_INVESTIGATION_PHASE
      };
    }

    const transfer = result.transfer;
    const authStatus = classifyTransferAuthStatus(transfer);

    asaasLog('transfer_auth_inspection', {
      transferId: transfer?.id ? String(transfer.id).slice(0, 24) : null,
      status: transfer?.status ?? null,
      authorized: transfer?.authorized ?? null,
      authStatus
    });

    return {
      success: true,
      httpStatus: result.httpStatus,
      transferId: transfer?.id ? String(transfer.id).slice(0, 36) : String(transferId).slice(0, 36),
      transfer,
      authStatus,
      authorized: transfer?.authorized ?? null,
      financialEffect: false,
      capabilityOnly: true,
      integratedInGolDeOuro: false,
      phase: TRANSFER_AUTH_INVESTIGATION_PHASE
    };
  },

  classifyTransferAuthStatus,
  classifyFinalAuthInvestigation,

  async requestPixPayout(input) {
    return AsaasProvider.createPixWithdraw({
      netAmount: input.netAmount,
      pixKey: input.pixKey,
      pixType: input.pixType,
      userId: input.userId,
      saqueId: input.saqueId,
      correlationId: input.correlationId,
      payoutExternalReference: input.payoutExternalReference,
      idempotencyKey: input.idempotencyKey,
      notificationUrl: input.notificationUrl,
      ownerIdentification: input.ownerIdentification,
      authToken: input.authToken
    });
  },

  async getPayoutStatus(providerRef) {
    const result = await AsaasProvider.getTransactionStatus(providerRef, { kind: 'payout' });
    if (!result.success) {
      return { success: false, error: result.error || result.message };
    }
    return { success: true, data: result.data };
  },

  async handlePayoutWebhook(req) {
    const validation = AsaasProvider.validateWebhook(req);
    if (!validation.valid) {
      return validation;
    }
    return AsaasProvider.handleWebhook(req);
  }
};

module.exports = AsaasPayoutProvider;
