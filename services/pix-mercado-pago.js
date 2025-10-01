// Serviço PIX Real - Mercado Pago - Gol de Ouro v1.1.1
const axios = require('axios');

// Configurações do Mercado Pago
const MP_CONFIG = {
  accessToken: process.env.MP_ACCESS_TOKEN,
  baseUrl: 'https://api.mercadopago.com',
  webhookUrl: process.env.PIX_WEBHOOK_URL || 'https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook'
};

// Verificar se token está configurado
const isConfigured = () => {
  return !!(MP_CONFIG.accessToken && MP_CONFIG.accessToken.startsWith('APP_USR-'));
};

// Criar PIX real no Mercado Pago
const createPixPayment = async (amount, userId, description = 'Depósito Gol de Ouro') => {
  try {
    if (!isConfigured()) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Validar valor
    const minAmount = 1.00;
    const maxAmount = 500.00;
    
    if (amount < minAmount || amount > maxAmount) {
      throw new Error(`Valor deve estar entre R$ ${minAmount} e R$ ${maxAmount}`);
    }

    // Dados do pagamento
    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: 'user@example.com' // Em produção, buscar email do usuário
      },
      external_reference: `goldeouro_${userId}_${Date.now()}`,
      notification_url: MP_CONFIG.webhookUrl
    };

    // Criar pagamento no Mercado Pago
    const response = await axios.post(
      `${MP_CONFIG.baseUrl}/v1/payments`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const payment = response.data;

    // Retornar dados do PIX
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

// Verificar status do pagamento
const getPaymentStatus = async (paymentId) => {
  try {
    if (!isConfigured()) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    const response = await axios.get(
      `${MP_CONFIG.baseUrl}/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${MP_CONFIG.accessToken}`
        },
        timeout: 5000
      }
    );

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

// Processar webhook do Mercado Pago
const processWebhook = async (webhookData) => {
  try {
    const { type, data } = webhookData;

    if (type !== 'payment') {
      return { success: false, error: 'Tipo de webhook não suportado' };
    }

    const paymentId = data.id;
    
    // Buscar dados do pagamento
    const statusResult = await getPaymentStatus(paymentId);
    
    if (!statusResult.success) {
      return statusResult;
    }

    const payment = statusResult.data;

    // Verificar se pagamento foi aprovado
    if (payment.status === 'approved') {
      // Extrair userId do external_reference
      const externalRef = payment.external_reference;
      const userId = externalRef.split('_')[1]; // goldeouro_USERID_TIMESTAMP

      return {
        success: true,
        data: {
          paymentId: payment.id,
          userId: userId,
          amount: payment.amount,
          status: 'approved',
          external_reference: externalRef
        }
      };
    }

    return {
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        message: 'Pagamento não aprovado'
      }
    };

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createPixPayment,
  getPaymentStatus,
  processWebhook,
  isConfigured
};
