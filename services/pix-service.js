// Serviço PIX para Produção - Gol de Ouro v1.1.1
const { supabase } = require('../database/supabase-config');

// Configurações do gateway PIX (Mercado Pago)
const PIX_CONFIG = {
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  baseUrl: 'https://api.mercadopago.com',
  webhookUrl: process.env.PIX_WEBHOOK_URL || 'https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook'
};

// Criar PIX
const createPix = async (amount, userId, description = 'Depósito Gol de Ouro') => {
  try {
    if (!PIX_CONFIG.accessToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Validar valor do PIX
    const minPix = 1.00;
    const maxPix = 500.00;
    
    if (amount < minPix || amount > maxPix) {
      throw new Error(`Valor do PIX deve estar entre R$ ${minPix} e R$ ${maxPix}`);
    }

    // Dados do PIX
    const pixData = {
      transaction_amount: parseFloat(amount),
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: 'user@example.com' // Buscar email do usuário
      },
      external_reference: `goldeouro_${userId}_${Date.now()}`,
      notification_url: PIX_CONFIG.webhookUrl
    };

    // Criar transação no banco
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        type: 'credit',
        amount: parseFloat(amount),
        description: description,
        status: 'pending'
      }])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Simular criação do PIX (implementar integração real)
    const pixResponse = {
      id: `pix_${Date.now()}`,
      qr_code: `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${amount}5802BR5913Gol de Ouro6009Sao Paulo62070503***6304`,
      qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      external_reference: pixData.external_reference,
      status: 'pending',
      transaction_id: transaction.id
    };

    return {
      success: true,
      data: pixResponse
    };
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Processar webhook do PIX
const processPixWebhook = async (webhookData) => {
  try {
    const { data, type } = webhookData;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar transação pelo external_reference
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('pix_id', paymentId)
        .single();

      if (transactionError) {
        console.error('Transação não encontrada:', transactionError);
        return { success: false };
      }

      // Atualizar status da transação
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      // Atualizar saldo do usuário
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          balance: supabase.raw(`balance + ${transaction.amount}`),
          total_credits: supabase.raw(`total_credits + ${transaction.amount}`)
        })
        .eq('id', transaction.user_id);

      if (balanceError) throw balanceError;

      console.log(`PIX processado com sucesso: ${paymentId}`);
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao processar webhook PIX:', error);
    return { success: false, error: error.message };
  }
};

// Verificar status do PIX
const checkPixStatus = async (pixId) => {
  try {
    // Buscar transação
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('pix_id', pixId)
      .single();

    if (error) throw error;

    return {
      success: true,
      status: transaction.status,
      amount: transaction.amount
    };
  } catch (error) {
    console.error('Erro ao verificar status PIX:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createPix,
  processPixWebhook,
  checkPixStatus
};
