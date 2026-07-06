'use strict';

const {
  getAsaasConfig,
  getAsaasBaseUrl,
  isAsaasHttpEnabled,
  isAsaasPixInHttpEnabled,
  isAsaasPixInProductionHttpEnabled,
  isAsaasPixOutHttpEnabled,
  isAsaasTransferAuthHttpEnabled,
  isAsaasPixOutProductionHttpEnabled,
  isAsaasPayoutReconcileReadEnabled,
  maskApiKeyPreview,
  maskPixPayloadPreview,
  maskPixKeyPreview,
  USER_AGENT,
  asaasLog
} = require('./asaas-config');

const MY_ACCOUNT_PATH = '/myAccount';
const CUSTOMERS_PATH = '/customers';
const PAYMENTS_PATH = '/payments';
const TRANSFERS_PATH = '/transfers';
const FINANCE_BALANCE_PATH = '/finance/balance';

const SANDBOX_MAX_PIX_VALUE = 10;
const SANDBOX_MIN_PIX_VALUE = 5;
const SANDBOX_DEFAULT_PIX_VALUE = 5;
const PRODUCTION_MIN_PIX_VALUE = 1;
const PRODUCTION_MAX_PIX_VALUE = 1000;

function sanitizeApiError(rawData, httpStatus, fallbackMessage) {
  const firstError =
    Array.isArray(rawData?.errors) && rawData.errors.length > 0 ? rawData.errors[0] : null;
  const message =
    firstError?.description ||
    rawData?.message ||
    rawData?.error ||
    fallbackMessage ||
    'Falha na API Asaas';
  return {
    httpStatus: httpStatus ?? null,
    errorCode: firstError?.code ?? rawData?.error ?? null,
    message: String(message)
  };
}

function getAuthHeaders(config, userAgent = USER_AGENT) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': userAgent,
    access_token: config.apiKey
  };
}

async function asaasApiRequest({ method, path, body, httpGate = 'read' }) {
  const httpEnabled =
    httpGate === 'pixIn'
      ? isAsaasPixInHttpEnabled()
      : httpGate === 'pixInProduction'
        ? isAsaasPixInProductionHttpEnabled()
        : httpGate === 'pixOutProduction'
          ? isAsaasPixOutProductionHttpEnabled()
          : httpGate === 'pixOut'
            ? isAsaasPixOutHttpEnabled()
            : httpGate === 'sandboxFunding'
              ? isAsaasPixOutHttpEnabled()
              : httpGate === 'transferAuth'
                ? isAsaasTransferAuthHttpEnabled()
                : httpGate === 'payoutReconcile'
                  ? isAsaasPayoutReconcileReadEnabled()
                  : isAsaasHttpEnabled();
  if (!httpEnabled) {
    const error =
      httpGate === 'pixIn'
        ? 'ASAAS_PIX_IN_HTTP_DISABLED'
        : httpGate === 'pixInProduction'
          ? 'ASAAS_PIX_IN_PRODUCTION_HTTP_DISABLED'
          : httpGate === 'pixOutProduction'
            ? 'ASAAS_PIX_OUT_PRODUCTION_HTTP_DISABLED'
            : httpGate === 'pixOut'
              ? 'ASAAS_PIX_OUT_HTTP_DISABLED'
              : httpGate === 'sandboxFunding'
                ? 'ASAAS_SANDBOX_FUNDING_DISABLED'
                : httpGate === 'transferAuth'
                  ? 'ASAAS_TRANSFER_AUTH_HTTP_DISABLED'
                  : httpGate === 'payoutReconcile'
                    ? 'ASAAS_PAYOUT_RECONCILE_READ_DISABLED'
                    : 'ASAAS_HTTP_DISABLED';
    const message =
      httpGate === 'pixIn'
        ? 'HTTP PIX IN bloqueado: verifique ASAAS_PIX_IN_ENABLED, ALLOW_ASAAS_SANDBOX_PIX_IN e guards sandbox'
        : httpGate === 'pixInProduction'
          ? 'HTTP PIX IN produção bloqueado: verifique ASAAS_ENABLED, ASAAS_ENV=production, ASAAS_PIX_IN_ENABLED, ASAAS_API_KEY e ASAAS_PRODUCTION_ENABLED'
          : httpGate === 'pixOutProduction'
            ? 'HTTP PIX OUT produção bloqueado: verifique ASAAS_PIX_OUT_ENABLED, ASAAS_PIX_OUT_PRODUCTION_ENABLED, PAYMENT_ENGINE_PIXOUT_ENABLED, ASAAS_API_KEY e wiring P1.5C'
            : httpGate === 'pixOut'
              ? 'HTTP PIX OUT bloqueado: verifique ASAAS_PIX_OUT_ENABLED, ALLOW_ASAAS_SANDBOX_PIX_OUT e guards sandbox'
              : httpGate === 'sandboxFunding'
                ? 'Funding sandbox bloqueado: verifique guards PIX OUT sandbox (F4.2G.1)'
                : httpGate === 'transferAuth'
                  ? 'Investigação auth transfer bloqueada: ASAAS_TRANSFER_AUTH_TEST=1 + guards PIX OUT'
                  : httpGate === 'payoutReconcile'
                    ? 'Recovery PIX OUT bloqueado: ASAAS_ENABLED, ASAAS_API_KEY ou ASAAS_PAYOUT_RECOVERY_ENABLED=false'
                    : 'HTTP Asaas bloqueado: ASAAS_ENABLED=false, ALLOW_ASAAS_SANDBOX_AUTH=0 ou ASAAS_ENV≠sandbox';
    asaasLog('http_blocked_disabled', { method, path, httpGate });
    return { success: false, error, message };
  }

  const config = getAsaasConfig();
  if (!config.apiKey) {
    asaasLog('http_blocked_missing_credentials', { method, path, missingApiKey: true });
    return {
      success: false,
      error: 'ASAAS_NOT_CONFIGURED',
      message: 'Requisição Asaas bloqueada: ASAAS_API_KEY ausente'
    };
  }

  const baseUrl = getAsaasBaseUrl();
  const url = `${baseUrl}${path}`;

  asaasLog('api_request_start', {
    method,
    baseUrl,
    path,
    httpGate,
    apiKeyPreview: maskApiKeyPreview(config.apiKey)
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: getAuthHeaders(config),
      body: body != null ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    asaasLog('api_request_network_error', {
      method,
      baseUrl,
      path,
      error: err?.message || 'network_error'
    });
    return {
      success: false,
      error: 'ASAAS_NETWORK_ERROR',
      message: err?.message || 'Erro de rede na API Asaas'
    };
  }

  let rawData = null;
  try {
    rawData = await response.json();
  } catch {
    rawData = null;
  }

  if (!response.ok) {
    const sanitized = sanitizeApiError(rawData, response.status, 'Falha na API Asaas');
    asaasLog('api_request_failed', {
      method,
      baseUrl,
      path,
      httpStatus: response.status,
      errorCode: sanitized.errorCode
    });
    return {
      success: false,
      error: 'ASAAS_API_REQUEST_FAILED',
      ...sanitized
    };
  }

  asaasLog('api_request_success', {
    method,
    baseUrl,
    path,
    httpStatus: response.status
  });

  return {
    success: true,
    httpStatus: response.status,
    baseUrl,
    data: rawData
  };
}

function summarizeMyAccountResponse(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return { hasBody: false };
  }
  return {
    hasBody: true,
    id: rawData.id ?? null,
    name: rawData.name ?? null,
    email: rawData.email ?? null,
    personType: rawData.personType ?? null
  };
}

function summarizePayment(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }
  return {
    id: rawData.id ?? null,
    status: rawData.status ?? null,
    billingType: rawData.billingType ?? null,
    value: rawData.value ?? null,
    dueDate: rawData.dueDate ?? null,
    externalReference: rawData.externalReference ?? null,
    customer: rawData.customer ?? null
  };
}

function summarizePixQrCode(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return {
      hasQrCode: false,
      hasPayload: false,
      payloadPreview: null,
      expirationDate: null
    };
  }
  const payload = rawData.payload ?? null;
  return {
    hasQrCode: Boolean(rawData.encodedImage),
    hasPayload: Boolean(payload),
    payloadPreview: maskPixPayloadPreview(payload),
    expirationDate: rawData.expirationDate ?? null
  };
}

function formatDueDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * GET {baseUrl}/myAccount — endpoint seguro de leitura (sandbox).
 */
async function fetchMyAccount(options = {}) {
  const result = await asaasApiRequest({
    method: 'GET',
    path: MY_ACCOUNT_PATH,
    httpGate: 'read'
  });

  if (!result.success) {
    if (result.error === 'ASAAS_HTTP_DISABLED') {
      return { ...result, error: 'ASAAS_HTTP_DISABLED' };
    }
    return result;
  }

  const summary = summarizeMyAccountResponse(result.data);
  asaasLog('my_account_request_success', {
    baseUrl: result.baseUrl,
    httpStatus: result.httpStatus,
    accountId: summary.id,
    apiKeyPreview: maskApiKeyPreview(getAsaasConfig().apiKey)
  });

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    account: summary,
    data: result.data
  };
}

/**
 * POST /customers — customer sandbox efêmero (somente Asaas, não persiste no Gol de Ouro).
 */
async function createSandboxCustomer(input = {}) {
  const body = {
    name: input.name || 'Gol de Ouro Sandbox PIX IN',
    cpfCnpj: input.cpfCnpj || '24971563792',
    email: input.email || 'sandbox-pix-in@goldeouro.test',
    externalReference: input.externalReference || `goldeouro-sandbox-customer-${Date.now()}`
  };

  const result = await asaasApiRequest({
    method: 'POST',
    path: CUSTOMERS_PATH,
    body,
    httpGate: 'pixIn'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    customerId: result.data?.id ?? null,
    customer: {
      id: result.data?.id ?? null,
      name: result.data?.name ?? body.name,
      externalReference: result.data?.externalReference ?? body.externalReference
    },
    ephemeral: true,
    persistedInGolDeOuro: false
  };
}

/**
 * POST /payments — cobrança PIX sandbox.
 */
async function createPixPayment(input = {}) {
  const value = Number(input.value ?? SANDBOX_DEFAULT_PIX_VALUE);
  if (!Number.isFinite(value) || value < SANDBOX_MIN_PIX_VALUE || value > SANDBOX_MAX_PIX_VALUE) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_INVALID_VALUE',
      message: `Valor de teste inválido. Use ${SANDBOX_MIN_PIX_VALUE} <= value <= ${SANDBOX_MAX_PIX_VALUE}`
    };
  }

  if (!input.customerId) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_CUSTOMER_REQUIRED',
      message: 'customerId é obrigatório para criar cobrança PIX no Asaas'
    };
  }

  const body = {
    customer: input.customerId,
    billingType: 'PIX',
    value,
    dueDate: input.dueDate || formatDueDate(),
    description: input.description || 'Gol de Ouro F4.2D PIX IN Sandbox',
    externalReference: input.externalReference || `goldeouro-f4.2d-${Date.now()}`
  };

  const result = await asaasApiRequest({
    method: 'POST',
    path: PAYMENTS_PATH,
    body,
    httpGate: 'pixIn'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    payment: summarizePayment(result.data),
    data: result.data
  };
}

/**
 * POST /customers — produção (dados do jogador; não persiste customer no Gol de Ouro).
 */
async function createProductionCustomer(input = {}) {
  const cpfCnpj = String(input.cpfCnpj || input.payerCpf || '').replace(/\D/g, '');
  if (!cpfCnpj || cpfCnpj.length < 11) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_CUSTOMER_CPF_REQUIRED',
      message: 'CPF/CNPJ do pagador é obrigatório para PIX IN Asaas produção',
      financialEffect: false
    };
  }

  const body = {
    name: input.name || input.userName || 'Cliente Gol de Ouro',
    cpfCnpj,
    email: input.email || input.userEmail || 'deposito@goldeouro.app',
    externalReference: input.externalReference || `goldeouro_user_${input.userId || 'unknown'}`
  };

  const result = await asaasApiRequest({
    method: 'POST',
    path: CUSTOMERS_PATH,
    body,
    httpGate: 'pixInProduction'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    customerId: result.data?.id ?? null,
    customer: {
      id: result.data?.id ?? null,
      name: result.data?.name ?? body.name,
      externalReference: result.data?.externalReference ?? body.externalReference
    },
    ephemeral: true,
    persistedInGolDeOuro: false
  };
}

/**
 * POST /payments — cobrança PIX produção.
 */
async function createProductionPixPayment(input = {}) {
  const value = Number(input.value);
  if (
    !Number.isFinite(value) ||
    value < PRODUCTION_MIN_PIX_VALUE ||
    value > PRODUCTION_MAX_PIX_VALUE
  ) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_INVALID_VALUE',
      message: `Valor inválido. Produção exige ${PRODUCTION_MIN_PIX_VALUE} <= value <= ${PRODUCTION_MAX_PIX_VALUE}`,
      financialEffect: false
    };
  }

  if (!input.customerId) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_CUSTOMER_REQUIRED',
      message: 'customerId é obrigatório para criar cobrança PIX no Asaas',
      financialEffect: false
    };
  }

  const body = {
    customer: input.customerId,
    billingType: 'PIX',
    value,
    dueDate: input.dueDate || formatDueDate(),
    description: input.description || 'Depósito Gol de Ouro',
    externalReference: input.externalReference || `goldeouro_${Date.now()}`
  };

  const result = await asaasApiRequest({
    method: 'POST',
    path: PAYMENTS_PATH,
    body,
    httpGate: 'pixInProduction'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    payment: summarizePayment(result.data),
    data: result.data
  };
}

function resolvePixInHttpGate() {
  if (isAsaasPixInProductionHttpEnabled()) {
    return 'pixInProduction';
  }
  return 'pixIn';
}

/**
 * GET /payments/{id}/pixQrCode
 */
async function getPaymentPixQrCode(paymentId) {
  if (!paymentId) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_PAYMENT_ID_REQUIRED',
      message: 'paymentId é obrigatório'
    };
  }

  const result = await asaasApiRequest({
    method: 'GET',
    path: `${PAYMENTS_PATH}/${encodeURIComponent(String(paymentId))}/pixQrCode`,
    httpGate: resolvePixInHttpGate()
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    pixQrCode: summarizePixQrCode(result.data),
    data: result.data
  };
}

/**
 * GET /payments/{id}
 */
async function getPayment(paymentId) {
  if (!paymentId) {
    return {
      success: false,
      error: 'ASAAS_PIX_IN_PAYMENT_ID_REQUIRED',
      message: 'paymentId é obrigatório'
    };
  }

  const result = await asaasApiRequest({
    method: 'GET',
    path: `${PAYMENTS_PATH}/${encodeURIComponent(String(paymentId))}`,
    httpGate: resolvePixInHttpGate()
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    payment: summarizePayment(result.data),
    data: result.data
  };
}

function summarizeBalance(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return { balance: null, hasBody: false };
  }
  return {
    hasBody: true,
    balance: rawData.balance ?? null
  };
}

function summarizeTransfer(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }
  return {
    id: rawData.id ?? null,
    status: rawData.status ?? null,
    type: rawData.type ?? rawData.operationType ?? null,
    value: rawData.value ?? null,
    netValue: rawData.netValue ?? null,
    operationType: rawData.operationType ?? null,
    externalReference: rawData.externalReference ?? null,
    failReason: rawData.failReason ?? null,
    authorized: rawData.authorized ?? null,
    dateCreated: rawData.dateCreated ?? null,
    effectiveDate: rawData.effectiveDate ?? null,
    scheduleDate: rawData.scheduleDate ?? null,
    endToEndIdentifier: rawData.endToEndIdentifier ?? null,
    transferFee: rawData.transferFee ?? null
  };
}

/**
 * GET /finance/balance — saldo disponível na conta Asaas (sandbox).
 */
async function fetchAccountBalance() {
  const result = await asaasApiRequest({
    method: 'GET',
    path: FINANCE_BALANCE_PATH,
    httpGate: 'pixOut'
  });

  if (!result.success) {
    return result;
  }

  const summary = summarizeBalance(result.data);
  asaasLog('balance_request_success', {
    baseUrl: result.baseUrl,
    httpStatus: result.httpStatus,
    balance: summary.balance
  });

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    balance: summary,
    data: result.data
  };
}

/**
 * POST /transfers — transferência PIX para chave externa (sandbox capability).
 * @see https://docs.asaas.com/reference/transfer-to-another-institution-account-or-pix-key
 */
async function createPixTransfer(input = {}) {
  const httpGate = input.httpGate || 'pixOut';
  const value = Number(input.value);
  const isProductionGate = httpGate === 'pixOutProduction';

  if (!Number.isFinite(value) || value <= 0) {
    return {
      success: false,
      error: 'ASAAS_PIX_OUT_INVALID_VALUE',
      message: 'Valor de transferência inválido'
    };
  }

  if (isProductionGate) {
    if (value < PRODUCTION_MIN_PIX_VALUE || value > PRODUCTION_MAX_PIX_VALUE) {
      return {
        success: false,
        error: 'ASAAS_PIX_OUT_INVALID_VALUE',
        message: `Valor produção inválido. Use ${PRODUCTION_MIN_PIX_VALUE}–${PRODUCTION_MAX_PIX_VALUE}`
      };
    }
  }

  const pixAddressKey = input.pixAddressKey;
  const pixAddressKeyType = input.pixAddressKeyType;
  if (!pixAddressKey || !pixAddressKeyType) {
    return {
      success: false,
      error: 'ASAAS_PIX_OUT_KEY_REQUIRED',
      message: 'pixAddressKey e pixAddressKeyType são obrigatórios para PIX OUT via chave'
    };
  }

  const body = {
    value,
    operationType: 'PIX',
    pixAddressKey: String(pixAddressKey).trim(),
    pixAddressKeyType: String(pixAddressKeyType).trim().toUpperCase(),
    description:
      input.description ||
      (isProductionGate
        ? 'Gol de Ouro PIX OUT Produção'
        : 'Gol de Ouro F4.2G PIX OUT Sandbox Capability'),
    externalReference:
      input.externalReference ||
      (isProductionGate
        ? `goldeouro-pixout-prod-${Date.now()}`
        : `goldeouro-f4.2g-${Date.now()}`)
  };

  if (input.authToken && !isProductionGate) {
    body.authToken = String(input.authToken);
  }

  asaasLog('pix_transfer_request_start', {
    value,
    pixKeyPreview: maskPixKeyPreview(body.pixAddressKey),
    pixAddressKeyType: body.pixAddressKeyType,
    externalReference: body.externalReference,
    httpGate
  });

  const result = await asaasApiRequest({
    method: 'POST',
    path: TRANSFERS_PATH,
    body,
    httpGate
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    transfer: summarizeTransfer(result.data),
    data: result.data
  };
}

/**
 * POST /sandbox/payment/{id}/confirm — confirma pagamento sandbox (gera saldo virtual).
 * @see https://docs.asaas.com/reference/confirmar-pagamento
 */
async function confirmSandboxPayment(paymentId) {
  if (!paymentId) {
    return {
      success: false,
      error: 'ASAAS_SANDBOX_PAYMENT_ID_REQUIRED',
      message: 'paymentId é obrigatório para confirmar pagamento sandbox'
    };
  }

  asaasLog('sandbox_payment_confirm_start', {
    paymentId: String(paymentId).slice(0, 24)
  });

  const result = await asaasApiRequest({
    method: 'POST',
    path: `/sandbox/payment/${encodeURIComponent(String(paymentId))}/confirm`,
    body: {},
    httpGate: 'sandboxFunding'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    payment: summarizePayment(result.data),
    data: result.data
  };
}

/**
 * GET /transfers/{id}
 */
async function getTransfer(transferId, options = {}) {
  if (!transferId) {
    return {
      success: false,
      error: 'ASAAS_PIX_OUT_TRANSFER_ID_REQUIRED',
      message: 'transferId é obrigatório'
    };
  }

  const result = await asaasApiRequest({
    method: 'GET',
    path: `${TRANSFERS_PATH}/${encodeURIComponent(String(transferId))}`,
    httpGate: options.httpGate || 'payoutReconcile'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    httpStatus: result.httpStatus,
    baseUrl: result.baseUrl,
    transfer: summarizeTransfer(result.data),
    data: result.data
  };
}

module.exports = {
  MY_ACCOUNT_PATH,
  CUSTOMERS_PATH,
  PAYMENTS_PATH,
  TRANSFERS_PATH,
  FINANCE_BALANCE_PATH,
  SANDBOX_DEFAULT_PIX_VALUE,
  SANDBOX_MIN_PIX_VALUE,
  SANDBOX_MAX_PIX_VALUE,
  PRODUCTION_MIN_PIX_VALUE,
  PRODUCTION_MAX_PIX_VALUE,
  maskApiKeyPreview,
  maskPixPayloadPreview,
  fetchMyAccount,
  createSandboxCustomer,
  createProductionCustomer,
  createPixPayment,
  createProductionPixPayment,
  getPaymentPixQrCode,
  getPayment,
  fetchAccountBalance,
  createPixTransfer,
  getTransfer,
  confirmSandboxPayment,
  summarizeTransfer,
  summarizeBalance
};
