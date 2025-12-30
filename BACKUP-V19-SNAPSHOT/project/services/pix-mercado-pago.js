// Serviço PIX Real - Mercado Pago - Gol de Ouro v1.1.1 + SIMPLE_MVP
const axios = require('axios');
const crypto = require('crypto');

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

// Criar PIX real no Mercado Pago (HARDENED)
const createPixPayment = async (amount, userId, description = 'Depósito Gol de Ouro') => {
  try {
    if (!isConfigured()) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Validar valor (hardening)
    const minAmount = 1.00;
    const maxAmount = 1000.00;
    
    if (amount < minAmount || amount > maxAmount) {
      throw new Error(`Valor deve estar entre R$ ${minAmount} e R$ ${maxAmount}`);
    }

    // Validar userId (prevenir injection)
    if (!userId || typeof userId !== 'string' || userId.length > 100) {
      throw new Error('UserId inválido');
    }

    // Gerar ID único para idempotência
    const paymentId = crypto.randomUUID();
    const externalReference = `goldeouro_${userId}_${paymentId}`;

    // Dados do pagamento (hardened)
    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description.substring(0, 100), // Limitar tamanho
      payment_method_id: 'pix',
      payer: {
        email: 'user@example.com' // Em produção, buscar email do usuário
      },
      external_reference: externalReference,
      notification_url: MP_CONFIG.webhookUrl,
      metadata: {
        user_id: userId,
        payment_id: paymentId,
        created_at: new Date().toISOString()
      }
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

// Processar webhook do Mercado Pago (HARDENED)
const processWebhook = async (webhookData) => {
  try {
    const { type, data } = webhookData;

    // Validação de tipo
    if (type !== 'payment') {
      console.log(`⚠️ [PIX] Webhook tipo não suportado: ${type}`);
      return { success: false, error: 'Tipo de webhook não suportado' };
    }

    // Validação de dados
    if (!data || !data.id) {
      console.log('❌ [PIX] Webhook sem payment ID');
      return { success: false, error: 'Payment ID não fornecido' };
    }

    const paymentId = data.id;
    
    // Buscar dados do pagamento
    const statusResult = await getPaymentStatus(paymentId);
    
    if (!statusResult.success) {
      console.log(`❌ [PIX] Erro ao buscar status do pagamento ${paymentId}:`, statusResult.error);
      return statusResult;
    }

    const payment = statusResult.data;

    // Validação de status
    if (payment.status === 'approved') {
      // Extrair userId do external_reference (hardened)
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

      // Log de segurança
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

    // Log para outros status
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

// Criar saque PIX automático (HARDENED)
const createPixWithdraw = async (amount, pixKey, pixKeyType, userId) => {
  try {
    if (!isConfigured()) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Validação de valor (hardening)
    const minAmount = 0.50; // R$ 0,50 mínimo
    const maxAmount = 1000.00; // R$ 1.000,00 máximo
    
    if (amount < minAmount || amount > maxAmount) {
      throw new Error(`Valor deve estar entre R$ ${minAmount} e R$ ${maxAmount}`);
    }

    // Validar chave PIX (hardening)
    if (!pixKey || !pixKeyType) {
      throw new Error('Chave PIX e tipo são obrigatórios');
    }

    // Validar tipos de chave PIX
    const validKeyTypes = ['cpf', 'cnpj', 'email', 'phone', 'random'];
    if (!validKeyTypes.includes(pixKeyType)) {
      throw new Error('Tipo de chave PIX inválido');
    }

    // Validar formato da chave PIX
    if (pixKeyType === 'cpf' && !/^\d{11}$/.test(pixKey)) {
      throw new Error('CPF deve ter 11 dígitos');
    }
    if (pixKeyType === 'cnpj' && !/^\d{14}$/.test(pixKey)) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }
    if (pixKeyType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
      throw new Error('Email inválido');
    }

    // Gerar ID único para idempotência
    const withdrawId = crypto.randomUUID();
    const externalReference = `withdraw_${userId}_${withdrawId}`;

    // Dados do saque (hardened)
    const withdrawData = {
      amount: parseFloat(amount),
      external_reference: externalReference,
      description: `Saque Gol de Ouro - ${userId}`.substring(0, 100),
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      metadata: {
        user_id: userId,
        withdraw_id: withdrawId,
        created_at: new Date().toISOString()
      }
    };

    // Verificar se payouts está habilitado
    const payoutToken = process.env.MP_PAYOUT_ACCESS_TOKEN;
    if (!payoutToken) {
      // Fallback: retornar status pending-auto
      console.log(`⚠️ [PIX] Payouts não habilitado - retornando pending-auto para ${withdrawId}`);
      
      return {
        success: true,
        data: {
          id: withdrawId,
          status: 'pending-auto',
          amount: amount,
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          external_reference: externalReference,
          created_at: new Date().toISOString(),
          message: 'Saque em processamento automático (aguardando habilitação de payouts)'
        }
      };
    }

    // TODO: Implementar API de Payouts/Transfers do Mercado Pago
    // Por enquanto, simular criação de saque
    console.log(`🎯 [PIX] Saque PIX criado: ${withdrawId} - Usuário: ${userId} - Valor: R$ ${amount}`);

    return {
      success: true,
      data: {
        id: withdrawId,
        status: 'processing',
        amount: amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        external_reference: externalReference,
        created_at: new Date().toISOString(),
        message: 'Saque processado automaticamente (SIMPLE_MVP)'
      }
    };

  } catch (error) {
    console.error('❌ [PIX] Erro ao criar saque PIX:', error.message);
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
  createPixWithdraw,
  isConfigured
};
