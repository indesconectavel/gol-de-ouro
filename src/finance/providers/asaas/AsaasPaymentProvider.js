'use strict';

const {
  isAsaasConfigured,
  isAsaasPixInHttpEnabled,
  isAsaasPixInEnabled,
  isAsaasSandboxPixInAllowed,
  maskApiKeyPreview,
  asaasLog
} = require('./asaas-config');
const {
  createSandboxCustomer,
  createPixPayment,
  getPaymentPixQrCode,
  getPayment,
  SANDBOX_DEFAULT_PIX_VALUE,
  SANDBOX_MAX_PIX_VALUE
} = require('./asaas-http-client');
const AsaasProvider = require('./AsaasProvider');

const PIX_IN_PHASE = 'pix_in_sandbox_v1';

/**
 * Adapter Asaas → contrato PaymentProvider (PIX IN).
 * F4.2D: createPixChargeSandbox isolado — não wired na factory como default.
 */
const AsaasPaymentProvider = {
  name: 'asaas',

  isConfigured() {
    return isAsaasConfigured();
  },

  isPixInSandboxReady() {
    return isAsaasPixInHttpEnabled() && isAsaasConfigured();
  },

  async createPixChargeSandbox(input = {}) {
    if (!isAsaasPixInEnabled()) {
      asaasLog('pix_in_blocked_disabled', { method: 'createPixChargeSandbox' });
      return {
        success: false,
        error: 'ASAAS_PIX_IN_DISABLED',
        message: 'PIX IN Asaas bloqueado: ASAAS_PIX_IN_ENABLED=false',
        financialEffect: false
      };
    }

    if (!isAsaasSandboxPixInAllowed()) {
      asaasLog('pix_in_blocked_sandbox_flag', { method: 'createPixChargeSandbox' });
      return {
        success: false,
        error: 'ASAAS_PIX_IN_SANDBOX_BLOCKED',
        message: 'PIX IN Asaas bloqueado: ALLOW_ASAAS_SANDBOX_PIX_IN=0',
        financialEffect: false
      };
    }

    if (!isAsaasPixInHttpEnabled()) {
      asaasLog('pix_in_blocked_http', { method: 'createPixChargeSandbox' });
      return {
        success: false,
        error: 'ASAAS_PIX_IN_HTTP_DISABLED',
        message:
          'HTTP PIX IN bloqueado: verifique ASAAS_ENABLED, ALLOW_ASAAS_SANDBOX_AUTH, ASAAS_ENV=sandbox',
        financialEffect: false
      };
    }

    const value = Number(input.value ?? SANDBOX_DEFAULT_PIX_VALUE);
    if (!Number.isFinite(value) || value < 5 || value > SANDBOX_MAX_PIX_VALUE) {
      return {
        success: false,
        error: 'ASAAS_PIX_IN_INVALID_VALUE',
        message: `Valor de teste inválido. Sandbox Asaas exige mínimo R$ 5,00; máximo R$ ${SANDBOX_MAX_PIX_VALUE.toFixed(2)}`,
        financialEffect: false
      };
    }

    let customerId = input.customerId || null;
    let customerEphemeral = false;

    if (!customerId) {
      const customerResult = await createSandboxCustomer({
        externalReference: input.customerExternalReference
      });
      if (!customerResult.success) {
        return { ...customerResult, financialEffect: false, phase: PIX_IN_PHASE };
      }
      customerId = customerResult.customerId;
      customerEphemeral = customerResult.ephemeral === true;
    }

    const paymentResult = await createPixPayment({
      customerId,
      value,
      description: input.description,
      externalReference: input.externalReference,
      dueDate: input.dueDate
    });

    if (!paymentResult.success) {
      return { ...paymentResult, financialEffect: false, phase: PIX_IN_PHASE };
    }

    const paymentId = paymentResult.payment?.id;
    let qrResult = null;
    if (paymentId) {
      qrResult = await getPaymentPixQrCode(paymentId);
    }

    let statusResult = null;
    if (paymentId) {
      statusResult = await getPayment(paymentId);
    }

    asaasLog('pix_in_charge_created', {
      phase: PIX_IN_PHASE,
      paymentId: paymentId ? String(paymentId).slice(0, 24) : null,
      status: paymentResult.payment?.status ?? null,
      value,
      externalReference: paymentResult.payment?.externalReference ?? null,
      customerEphemeral,
      qrAvailable: qrResult?.success === true && qrResult?.pixQrCode?.hasPayload === true
    });

    return {
      success: true,
      financialEffect: false,
      phase: PIX_IN_PHASE,
      customer: {
        id: customerId,
        ephemeral: customerEphemeral,
        persistedInGolDeOuro: false
      },
      payment: paymentResult.payment,
      pixQrCode: qrResult?.success ? qrResult.pixQrCode : null,
      pixQrCodeRaw: qrResult?.success ? qrResult.data : null,
      paymentStatus: statusResult?.success ? statusResult.payment : paymentResult.payment,
      httpStatus: paymentResult.httpStatus,
      baseUrl: paymentResult.baseUrl,
      apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY)
    };
  },

  mapAsaasStatus(status) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'PENDING' || normalized === 'AWAITING_PAYMENT') {
      return 'pending';
    }
    if (normalized === 'RECEIVED' || normalized === 'CONFIRMED') {
      return 'approved';
    }
    return String(status || 'pending').toLowerCase();
  },

  async createPixDepositCharge(input = {}) {
    return this.createPixDeposit(input);
  },

  async createPixDeposit(input = {}) {
    if (!isAsaasPixInHttpEnabled()) {
      return AsaasProvider.createPixDeposit(input);
    }

    const amount = Number(input.amount);
    const externalReference =
      input.externalReference || input.idempotencyKey || `goldeouro_${input.userId}_${Date.now()}`;

    const result = await this.createPixChargeSandbox({
      value: amount,
      description: input.description || 'Depósito Gol de Ouro',
      externalReference,
      customerId: input.customerId,
      customerExternalReference: input.userId ? `goldeouro_user_${input.userId}` : undefined,
      dueDate: input.dueDate
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        message: result.message,
        provider: 'asaas',
        financialEffect: false
      };
    }

    const payload = result.pixQrCodeRaw?.payload ?? null;
    const encodedImage = result.pixQrCodeRaw?.encodedImage ?? null;

    if (!result.payment?.id || !payload) {
      return {
        success: false,
        error: 'ASAAS_PIX_IN_QR_UNAVAILABLE',
        message: 'Cobrança criada, mas QR/Copia e Cola indisponível',
        provider: 'asaas',
        providerRef: result.payment?.id ?? null,
        financialEffect: false
      };
    }

    return {
      success: true,
      provider: 'asaas',
      providerRef: String(result.payment.id),
      amount: Number(result.payment.value ?? amount),
      status: this.mapAsaasStatus(result.payment.status),
      qrCode: payload,
      qrCodeBase64: encodedImage || null,
      pixCopyPaste: payload,
      externalReference: result.payment.externalReference || externalReference,
      idempotencyKey: input.idempotencyKey || externalReference,
      financialEffect: false
    };
  },

  async getPixDepositStatus(providerRef) {
    if (!isAsaasPixInHttpEnabled()) {
      const result = await AsaasProvider.getTransactionStatus(providerRef, { kind: 'deposit' });
      if (!result.success) {
        return { success: false, error: result.error || result.message };
      }
      return {
        success: true,
        status: result.data?.status,
        statusDetail: result.data?.statusDetail,
        amount: result.data?.amount
      };
    }

    const result = await getPayment(providerRef);
    if (!result.success) {
      return { success: false, error: result.error || result.message };
    }

    return {
      success: true,
      status: result.payment?.status,
      amount: result.payment?.value
    };
  },

  async handleDepositWebhook(req) {
    const validation = AsaasProvider.validateWebhook(req);
    if (!validation.valid) {
      return validation;
    }
    return AsaasProvider.handleWebhook(req);
  }
};

module.exports = AsaasPaymentProvider;
