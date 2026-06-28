'use strict';

const axios = require('axios');

const MP_BASE_URL = 'https://api.mercadopago.com/v1/payments';

function getDepositAccessToken() {
  return process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN || null;
}

function isConfigured() {
  const token = getDepositAccessToken();
  return Boolean(token && String(token).trim());
}

function mapMpStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending' || normalized === 'in_process') {
    return 'pending';
  }
  if (normalized === 'approved') {
    return 'approved';
  }
  return normalized || 'pending';
}

/** @type {import('../../contracts/PaymentProvider').PaymentProvider} */
const MercadoPagoPaymentProvider = {
  name: 'mercadopago',

  isConfigured,

  async createPixDeposit(input = {}) {
    const accessToken = getDepositAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'MP_DEPOSIT_TOKEN_MISSING',
        message: 'MERCADOPAGO_DEPOSIT_ACCESS_TOKEN não configurado'
      };
    }

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      return {
        success: false,
        error: 'MP_PIX_IN_INVALID_AMOUNT',
        message: 'Valor inválido para cobrança PIX'
      };
    }

    const names = String(input.userName || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';
    const payerCpf = input.payerCpf
      ? String(input.payerCpf).replace(/\D/g, '')
      : '52998224725';

    const externalReference =
      input.externalReference || `goldeouro_${input.userId}_${Date.now()}`;
    const idempotencyKey =
      input.idempotencyKey || `pix_${input.userId}_${Date.now()}_legacy`;

    const paymentData = {
      transaction_amount: amount,
      description: input.description || 'Depósito Gol de Ouro',
      payment_method_id: 'pix',
      payer: {
        email: input.userEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: payerCpf
        }
      },
      external_reference: externalReference,
      statement_descriptor: 'GOL DE OURO',
      notification_url: input.notificationUrl
    };

    try {
      const response = await axios.post(MP_BASE_URL, paymentData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          Accept: 'application/json',
          'User-Agent': 'GolDeOuro/1.2.0'
        },
        timeout: 8000,
        maxRedirects: 3,
        validateStatus: (status) => status < 500
      });

      const payment = response.data;
      const qrPayload = payment?.point_of_interaction?.transaction_data?.qr_code;

      if (!payment?.id || !qrPayload) {
        return {
          success: false,
          error: 'MP_PIX_IN_INVALID_RESPONSE',
          message: 'Resposta inválida do Mercado Pago',
          httpStatus: response.status
        };
      }

      return {
        success: true,
        provider: 'mercadopago',
        providerRef: String(payment.id),
        amount,
        status: mapMpStatus(payment.status),
        qrCode: qrPayload,
        qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        pixCopyPaste: qrPayload,
        externalReference,
        idempotencyKey,
        financialEffect: false
      };
    } catch (err) {
      return {
        success: false,
        error: 'MP_PIX_IN_REQUEST_FAILED',
        message: err?.response?.data?.message || err.message,
        httpStatus: err?.response?.status ?? null
      };
    }
  },

  async createPixDepositCharge(input) {
    return this.createPixDeposit(input);
  },

  async getPixDepositStatus(providerRef) {
    const accessToken = getDepositAccessToken();
    if (!accessToken) {
      return { success: false, error: 'MP_DEPOSIT_TOKEN_MISSING' };
    }

    try {
      const response = await axios.get(`${MP_BASE_URL}/${encodeURIComponent(providerRef)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        },
        timeout: 8000
      });
      const payment = response.data;
      return {
        success: true,
        status: mapMpStatus(payment?.status),
        amount: payment?.transaction_amount
      };
    } catch (err) {
      return {
        success: false,
        error: 'MP_PIX_IN_STATUS_FAILED',
        message: err?.response?.data?.message || err.message
      };
    }
  },

  async handleDepositWebhook() {
    return {
      valid: false,
      error: 'MP_WEBHOOK_INLINE_MONOLITH',
      message: 'Webhook MP permanece no monólito nesta fatia'
    };
  }
};

module.exports = MercadoPagoPaymentProvider;
