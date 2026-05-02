// Serviço PIX Real - Mercado Pago - Gol de Ouro v1.1.1 + SIMPLE_MVP
// Payout (Money Out): POST /v1/transaction-intents/process — doc oficial Payouts BR
const axios = require('axios');
const crypto = require('crypto');

const MP_CONFIG = {
  accessToken: process.env.MERCADOPAGO_PAYOUT_ACCESS_TOKEN,
  baseUrl: 'https://api.mercadopago.com',
  webhookUrl: process.env.PIX_WEBHOOK_URL || 'https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook'
};

const isConfigured = () => {
  return !!(
    MP_CONFIG.accessToken &&
    (MP_CONFIG.accessToken.startsWith('APP_USR-') || MP_CONFIG.accessToken.startsWith('APP_USR_'))
  );
};

const loadPayoutPrivateKeyPem = () => {
  const raw = process.env.MP_PAYOUT_PRIVATE_KEY;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  return raw.trim().replace(/\\n/g, '\n');
};

const signPayoutBodyEd25519 = (bodyUtf8, pem) => {
  const privateKey = crypto.createPrivateKey(pem);
  const sig = crypto.sign(null, Buffer.from(bodyUtf8, 'utf8'), privateKey);
  return sig.toString('base64');
};

const sanitizePayoutResponse = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id,
    status: raw.status,
    status_detail: raw.status_detail,
    external_reference: raw.external_reference,
    last_updated_date: raw.last_updated_date,
    created_date: raw.created_date,
    transaction: raw.transaction
      ? {
          total_amount: raw.transaction.total_amount,
          paid_amount: raw.transaction.paid_amount,
          refunded_amount: raw.transaction.refunded_amount
        }
      : undefined
  };
};

const maskDocumentDigits = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return value;
  if (digits.length <= 4) return `***${digits}`;
  return `***${digits.slice(-4)}`;
};

const sanitizeForLogs = (input) => {
  const SENSITIVE_KEYS = new Set([
    'authorization',
    'access_token',
    'token',
    'x-signature',
    'signature',
    'private_key'
  ]);
  const DOCUMENT_KEYS = new Set([
    'cpf',
    'cnpj',
    'document',
    'documento',
    'number'
  ]);

  const walk = (value, keyName = '') => {
    if (value == null) return value;

    if (Array.isArray(value)) {
      return value.map((item) => walk(item));
    }

    if (typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        const keyLower = String(k).toLowerCase();
        if (SENSITIVE_KEYS.has(keyLower)) {
          out[k] = '[REDACTED]';
          continue;
        }
        if (DOCUMENT_KEYS.has(keyLower) && (typeof v === 'string' || typeof v === 'number')) {
          out[k] = maskDocumentDigits(v);
          continue;
        }
        out[k] = walk(v, keyLower);
      }
      return out;
    }

    // Mask plain document-like values when key indicates identification.
    if (
      (keyName === 'number' || keyName === 'document' || keyName === 'documento' || keyName === 'cpf' || keyName === 'cnpj') &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return maskDocumentDigits(value);
    }

    return value;
  };

  return walk(input);
};

/**
 * Consulta transaction intent no MP (confirmação / reconciliação).
 * @param {string} intentId
 */
const getTransactionIntent = async (intentId) => {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'Token do Mercado Pago não configurado' };
    }
    if (!intentId || String(intentId).length > 128) {
      return { success: false, error: 'intentId inválido' };
    }
    const response = await axios.get(`${MP_CONFIG.baseUrl}/v1/transaction-intents/${encodeURIComponent(intentId)}`, {
      headers: {
        Authorization: `Bearer ${MP_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    return {
      success: true,
      data: response.data,
      sanitized: sanitizePayoutResponse(response.data)
    };
  } catch (error) {
    console.error('❌ [PIX][MP] Erro GET transaction-intent:', error.response?.status, error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Criar PIX real no Mercado Pago (HARDENED)
const createPixPayment = async (amount, userId, description = 'Depósito Gol de Ouro') => {
  try {
    if (!isConfigured()) {
      throw new Error('Token de payout do Mercado Pago não configurado');
    }

    const minAmount = 1.0;
    const maxAmount = 1000.0;

    if (amount < minAmount || amount > maxAmount) {
      throw new Error(`Valor deve estar entre R$ ${minAmount} e R$ ${maxAmount}`);
    }

    if (!userId || typeof userId !== 'string' || userId.length > 100) {
      throw new Error('UserId inválido');
    }

    const paymentId = crypto.randomUUID();
    const externalReference = `goldeouro_${userId}_${paymentId}`;

    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description.substring(0, 100),
      payment_method_id: 'pix',
      payer: {
        email: 'user@example.com'
      },
      external_reference: externalReference,
      notification_url: MP_CONFIG.webhookUrl,
      metadata: {
        user_id: userId,
        payment_id: paymentId,
        created_at: new Date().toISOString()
      }
    };

    const response = await axios.post(`${MP_CONFIG.baseUrl}/v1/payments`, paymentData, {
      headers: {
        Authorization: `Bearer ${MP_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const payment = response.data;

    return {
      success: true,
      data: {
        id: payment.id,
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        external_reference: payment.external_reference,
        amount: payment.transaction_amount,
        created_at: payment.date_created
      }
    };
  } catch (error) {
    console.error('Erro ao criar PIX no Mercado Pago:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

const getPaymentStatus = async (paymentId) => {
  try {
    if (!isConfigured()) {
      throw new Error('Token de payout do Mercado Pago não configurado');
    }

    const response = await axios.get(`${MP_CONFIG.baseUrl}/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MP_CONFIG.accessToken}`
      },
      timeout: 5000
    });

    const payment = response.data;

    return {
      success: true,
      data: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference
      }
    };
  } catch (error) {
    console.error('Erro ao verificar status do PIX:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

const processWebhook = async (webhookData) => {
  try {
    const { type, data } = webhookData;

    if (type !== 'payment') {
      console.log(`⚠️ [PIX] Webhook tipo não suportado: ${type}`);
      return { success: false, error: 'Tipo de webhook não suportado' };
    }

    if (!data || !data.id) {
      console.log('❌ [PIX] Webhook sem payment ID');
      return { success: false, error: 'Payment ID não fornecido' };
    }

    const paymentId = data.id;

    const statusResult = await getPaymentStatus(paymentId);

    if (!statusResult.success) {
      console.log(`❌ [PIX] Erro ao buscar status do pagamento ${paymentId}:`, statusResult.error);
      return statusResult;
    }

    const payment = statusResult.data;

    if (payment.status === 'approved') {
      const externalRef = payment.external_reference;
      if (!externalRef || !externalRef.startsWith('goldeouro_')) {
        console.log(`❌ [PIX] External reference inválido: ${externalRef}`);
        return { success: false, error: 'External reference inválido' };
      }

      const parts = externalRef.split('_');
      if (parts.length < 3) {
        console.log(`❌ [PIX] External reference malformado: ${externalRef}`);
        return { success: false, error: 'External reference malformado' };
      }

      const userId = parts[1];
      const amount = payment.amount;

      console.log(`✅ [PIX] Pagamento aprovado: ${paymentId} - Usuário: ${userId} - Valor: R$ ${amount}`);

      return {
        success: true,
        data: {
          paymentId: payment.id,
          userId: userId,
          amount: amount,
          status: 'approved',
          external_reference: externalRef,
          processed_at: new Date().toISOString()
        }
      };
    }

    console.log(`ℹ️ [PIX] Pagamento ${paymentId} status: ${payment.status}`);

    return {
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        message: 'Pagamento não aprovado'
      }
    };
  } catch (error) {
    console.error('❌ [PIX] Erro ao processar webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const formatPixPhoneValue = (phone) => {
  const d = String(phone).replace(/\D/g, '');
  if (d.startsWith('55') && d.length >= 12) return `+${d}`;
  if (d.length === 11) return `+55${d}`;
  if (d.length > 0) return `+${d}`;
  return String(phone);
};

/**
 * Saque Pix via Money Out oficial (transaction-intents/process).
 * @param {number} amount valor líquido (net)
 * @param {string} pixKey
 * @param {string} pixKeyType cpf|cnpj|email|phone|random|telefone|aleatoria
 * @param {string} userId
 * @param {string} saqueId
 * @param {string} correlationId
 * @param {{
 *   payoutExternalReference: string,
 *   idempotencyKey: string,
 *   notificationUrl?: string,
 *   ownerIdentification: { type: 'CPF'|'CNPJ', number: string }
 * }} options
 */
const createPixWithdraw = async (amount, pixKey, pixKeyType, userId, saqueId, correlationId, options = {}) => {
  try {
    if (!isConfigured()) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    const minAmount = 0.5;
    const maxAmount = 1000.0;

    if (amount < minAmount || amount > maxAmount) {
      throw new Error(`Valor deve estar entre R$ ${minAmount} e R$ ${maxAmount}`);
    }

    if (!pixKey || !pixKeyType) {
      throw new Error('Chave PIX e tipo são obrigatórios');
    }

    const tipo = String(pixKeyType).toLowerCase();
    const normalizedTipo = tipo === 'telefone' ? 'phone' : tipo === 'aleatoria' ? 'random' : tipo;

    const validKeyTypes = ['cpf', 'cnpj', 'email', 'phone', 'random'];
    if (!validKeyTypes.includes(normalizedTipo)) {
      throw new Error('Tipo de chave PIX inválido');
    }

    if (normalizedTipo === 'cpf' && !/^\d{11}$/.test(String(pixKey).replace(/\D/g, ''))) {
      throw new Error('CPF deve ter 11 dígitos');
    }
    if (normalizedTipo === 'cnpj' && !/^\d{14}$/.test(String(pixKey).replace(/\D/g, ''))) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }
    if (normalizedTipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
      throw new Error('Email inválido');
    }

    if (!saqueId || !correlationId) {
      throw new Error('saqueId e correlationId são obrigatórios para payout');
    }

    const { payoutExternalReference, idempotencyKey, notificationUrl, ownerIdentification } = options;
    if (!payoutExternalReference || typeof payoutExternalReference !== 'string') {
      throw new Error('options.payoutExternalReference é obrigatório');
    }
    if (payoutExternalReference.length > 64) {
      throw new Error('payoutExternalReference excede 64 caracteres (limite MP)');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(payoutExternalReference)) {
      throw new Error('payoutExternalReference contém caracteres não permitidos pelo MP');
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new Error('options.idempotencyKey é obrigatório');
    }
    if (!ownerIdentification?.type || !ownerIdentification?.number) {
      throw new Error('options.ownerIdentification (type, number) é obrigatório');
    }

    const ownerIdDigits = String(ownerIdentification.number).replace(/\D/g, '');
    if (ownerIdentification.type === 'CPF' && ownerIdDigits.length !== 11) {
      throw new Error('ownerIdentification CPF inválido');
    }
    if (ownerIdentification.type === 'CNPJ' && ownerIdDigits.length !== 14) {
      throw new Error('ownerIdentification CNPJ inválido');
    }

    const keyTypeToMp = {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      email: 'EMAIL',
      phone: 'PHONE',
      random: 'PIX_CODE'
    };
    const mpChaveType = keyTypeToMp[normalizedTipo];
    let mpChaveValue = pixKey;
    if (normalizedTipo === 'cpf' || normalizedTipo === 'cnpj') {
      mpChaveValue = String(pixKey).replace(/\D/g, '');
    } else if (normalizedTipo === 'phone') {
      mpChaveValue = formatPixPhoneValue(pixKey);
    }

    const total = parseFloat(amount);
    const payload = {
      external_reference: payoutExternalReference,
      point_of_interaction: { type: 'PSP_TRANSFER' },
      transaction: {
        from: {
          accounts: [{ amount: total }]
        },
        to: {
          accounts: [
            {
              type: 'current',
              amount: total,
              chave: {
                type: mpChaveType,
                value: mpChaveValue
              },
              owner: {
                identification: {
                  type: ownerIdentification.type,
                  number: ownerIdDigits
                }
              }
            }
          ]
        },
        total_amount: total
      }
    };

    if (notificationUrl && String(notificationUrl).length <= 500) {
      payload.seller_configuration = {
        notification_info: {
          notification_url: String(notificationUrl)
        }
      };
    }

    const bodyStr = JSON.stringify(payload);

    const testToken = String(process.env.MP_PAYOUT_TEST_TOKEN || '').toLowerCase() === 'true';
    const enforceSig = String(process.env.MP_PAYOUT_ENFORCE_SIGNATURE || '').toLowerCase() === 'true';
    const pem = loadPayoutPrivateKeyPem();

    if (enforceSig && !pem) {
      throw new Error('MP_PAYOUT_ENFORCE_SIGNATURE=true exige MP_PAYOUT_PRIVATE_KEY (Ed25519 PEM)');
    }

    const headers = {
      Authorization: `Bearer ${MP_CONFIG.accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
      'X-Test-Token': testToken ? 'true' : 'false',
      'X-Enforce-Signature': enforceSig ? 'true' : 'false'
    };

    // Assinatura Ed25519 só quando explícito (enforce + PEM). Sem isso: Bearer + payload iguais, sem X-signature.
    if (enforceSig && pem) {
      try {
        headers['X-signature'] = signPayoutBodyEd25519(bodyStr, pem);
      } catch (e) {
        console.error('❌ [PIX][MP] Falha ao assinar payout (Ed25519):', e.message);
        throw new Error('Falha ao assinar requisição de payout');
      }
    }

    const response = await axios.post(`${MP_CONFIG.baseUrl}/v1/transaction-intents/process`, bodyStr, {
      headers,
      timeout: 30000,
      transformRequest: [(d) => d]
    });

    const data = response.data;
    const httpStatus = response.status;

    console.log(`🎯 [PIX][MP] transaction-intent enviado`, {
      saqueId,
      userId,
      correlationId,
      mpId: data?.id,
      httpStatus,
      status: data?.status
    });

    return {
      success: true,
      data: {
        id: data?.id,
        status: data?.status,
        status_detail: data?.status_detail,
        external_reference: data?.external_reference,
        created_at: data?.created_date,
        http_status: httpStatus,
        raw: data,
        sanitized: sanitizePayoutResponse(data)
      }
    };
  } catch (error) {
    const httpStatus = error.response?.status || null;
    const rawData = error.response?.data || null;
    const msg = rawData?.message || error.message;
    const safeData = sanitizeForLogs(rawData);
    const safeCause = sanitizeForLogs(rawData?.cause || null);

    console.error('❌ [PIX][MP][PAYOUT][ERRO_BRUTO_SANITIZADO]', {
      http_status: httpStatus,
      code: rawData?.code || null,
      message: msg || null,
      cause: safeCause,
      response_data: safeData,
      payout_external_reference: options?.payoutExternalReference || null,
      saqueId: saqueId || null,
      correlation_id: correlationId || null
    });

    return {
      success: false,
      error: msg
    };
  }
};

module.exports = {
  createPixPayment,
  getPaymentStatus,
  processWebhook,
  createPixWithdraw,
  getTransactionIntent,
  isConfigured
};
