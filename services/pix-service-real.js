// SERVIÇO PIX REAL COM MERCADO PAGO - GOL DE OURO v2.0
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class PixService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.mercadoPagoConfig = {
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY,
      webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
      baseUrl: 'https://api.mercadopago.com'
    };
    
    this.pixConfig = {
      minAmount: parseFloat(process.env.PIX_MIN_AMOUNT) || 1.00,
      maxAmount: parseFloat(process.env.PIX_MAX_AMOUNT) || 1000.00,
      webhookUrl: process.env.PIX_WEBHOOK_URL || 'https://goldeouro-backend.fly.dev/api/payments/pix/webhook'
    };
  }

  // Validar configuração
  validateConfig() {
    const required = [
      'MERCADO_PAGO_ACCESS_TOKEN',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Configuração faltando: ${missing.join(', ')}`);
    }
    
    return true;
  }

  // Criar PIX real
  async createPix(userId, amount, description) {
    try {
      this.validateConfig();
      
      // Validar valor
      if (amount < this.pixConfig.minAmount || amount > this.pixConfig.maxAmount) {
        throw new Error(`Valor deve estar entre R$ ${this.pixConfig.minAmount} e R$ ${this.pixConfig.maxAmount}`);
      }

      // Buscar dados do usuário
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, username')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Criar transação no banco
      const { data: transaction, error: transactionError } = await this.supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: parseFloat(amount),
          description: description || 'Depósito PIX',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error('Erro ao criar transação');
      }

      // Criar pagamento no Mercado Pago
      const paymentData = {
        transaction_amount: parseFloat(amount),
        description: description || 'Depósito Gol de Ouro',
        payment_method_id: 'pix',
        payer: {
          email: user.email,
          identification: {
            type: 'CPF',
            number: '00000000000' // TODO: Implementar coleta de CPF
          }
        },
        external_reference: `goldeouro_${userId}_${transaction.id}`,
        notification_url: this.pixConfig.webhookUrl,
        additional_info: {
          items: [{
            id: 'deposit',
            title: 'Depósito Gol de Ouro',
            description: description || 'Depósito PIX',
            quantity: 1,
            unit_price: parseFloat(amount)
          }]
        }
      };

      const response = await axios.post(
        `${this.mercadoPagoConfig.baseUrl}/v1/payments`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.mercadoPagoConfig.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const payment = response.data;

      // Atualizar transação com ID do pagamento
      const { error: updateError } = await this.supabase
        .from('transactions')
        .update({
          pix_id: payment.id.toString(),
          pix_status: payment.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Erro ao atualizar transação:', updateError);
      }

      // Retornar dados do PIX
      return {
        success: true,
        payment_id: payment.id.toString(),
        status: payment.status,
        pix_data: {
          qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url
        },
        amount: parseFloat(amount),
        description: description || 'Depósito Gol de Ouro',
        external_reference: payment.external_reference,
        created_at: payment.date_created,
        transaction_id: transaction.id
      };

    } catch (error) {
      console.error('Erro ao criar PIX:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar webhook do Mercado Pago
  async processWebhook(webhookData) {
    try {
      this.validateConfig();
      
      const { type, data } = webhookData;
      
      if (type === 'payment' && data?.id) {
        const paymentId = data.id;
        
        // Buscar pagamento no Mercado Pago
        const response = await axios.get(
          `${this.mercadoPagoConfig.baseUrl}/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.mercadoPagoConfig.accessToken}`
            },
            timeout: 10000
          }
        );

        const payment = response.data;
        
        // Buscar transação no banco
        const { data: transaction, error: transactionError } = await this.supabase
          .from('transactions')
          .select('*')
          .eq('pix_id', paymentId)
          .single();

        if (transactionError || !transaction) {
          console.error('Transação não encontrada:', paymentId);
          return { success: false, message: 'Transação não encontrada' };
        }

        // Verificar se já foi processada
        if (transaction.status === 'completed') {
          return { success: true, message: 'Transação já processada' };
        }

        // Processar baseado no status do pagamento
        if (payment.status === 'approved') {
          // Atualizar transação como concluída
          const { error: updateError } = await this.supabase
            .from('transactions')
            .update({
              status: 'completed',
              pix_status: payment.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          if (updateError) {
            throw new Error('Erro ao atualizar transação');
          }

          // Atualizar saldo do usuário
          const { error: balanceError } = await this.supabase
            .from('users')
            .update({
              balance: this.supabase.raw(`balance + ${transaction.amount}`),
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.user_id);

          if (balanceError) {
            throw new Error('Erro ao atualizar saldo');
          }

          console.log(`💰 PIX aprovado: R$ ${transaction.amount} para usuário ${transaction.user_id}`);
          
          return {
            success: true,
            message: 'Pagamento aprovado e saldo creditado',
            amount: transaction.amount,
            user_id: transaction.user_id
          };

        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          // Atualizar transação como rejeitada
          const { error: updateError } = await this.supabase
            .from('transactions')
            .update({
              status: 'failed',
              pix_status: payment.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          if (updateError) {
            throw new Error('Erro ao atualizar transação');
          }

          console.log(`❌ PIX rejeitado: R$ ${transaction.amount} para usuário ${transaction.user_id}`);
          
          return {
            success: true,
            message: 'Pagamento rejeitado',
            status: payment.status
          };
        }
      }

      return { success: true, message: 'Webhook processado' };

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar status do PIX
  async checkPixStatus(paymentId) {
    try {
      this.validateConfig();
      
      const response = await axios.get(
        `${this.mercadoPagoConfig.baseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.mercadoPagoConfig.accessToken}`
          },
          timeout: 10000
        }
      );

      const payment = response.data;
      
      // Buscar transação no banco
      const { data: transaction, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('pix_id', paymentId)
        .single();

      if (error || !transaction) {
        return {
          success: false,
          message: 'Transação não encontrada'
        };
      }

      return {
        success: true,
        payment_id: paymentId,
        status: payment.status,
        amount: transaction.amount,
        created_at: payment.date_created,
        transaction_id: transaction.id
      };

    } catch (error) {
      console.error('Erro ao verificar status PIX:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar saque PIX
  async createWithdraw(userId, amount, pixKey, pixType) {
    try {
      this.validateConfig();
      
      // Validar valor
      if (amount < this.pixConfig.minAmount || amount > this.pixConfig.maxAmount) {
        throw new Error(`Valor deve estar entre R$ ${this.pixConfig.minAmount} e R$ ${this.pixConfig.maxAmount}`);
      }

      // Verificar saldo do usuário
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.balance < amount) {
        throw new Error('Saldo insuficiente');
      }

      // Criar transação de saque
      const { data: transaction, error: transactionError } = await this.supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'withdraw',
          amount: parseFloat(amount),
          description: 'Saque PIX',
          status: 'pending',
          pix_key: pixKey,
          pix_type: pixType,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error('Erro ao criar transação de saque');
      }

      // TODO: Implementar transferência real com Mercado Pago
      // Por enquanto, simular aprovação
      const isApproved = Math.random() > 0.1; // 90% chance de aprovação

      if (isApproved) {
        // Atualizar transação como concluída
        const { error: updateError } = await this.supabase
          .from('transactions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        if (updateError) {
          throw new Error('Erro ao atualizar transação');
        }

        // Debitar saldo do usuário
        const { error: balanceError } = await this.supabase
          .from('users')
          .update({
            balance: this.supabase.raw(`balance - ${amount}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (balanceError) {
          throw new Error('Erro ao atualizar saldo');
        }

        console.log(`💰 Saque aprovado: R$ ${amount} para usuário ${userId}`);
      } else {
        // Atualizar transação como rejeitada
        const { error: updateError } = await this.supabase
          .from('transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        if (updateError) {
          throw new Error('Erro ao atualizar transação');
        }

        console.log(`❌ Saque rejeitado: R$ ${amount} para usuário ${userId}`);
      }

      return {
        success: true,
        transaction_id: transaction.id,
        amount: parseFloat(amount),
        status: isApproved ? 'approved' : 'rejected',
        pix_key: pixKey,
        pix_type: pixType
      };

    } catch (error) {
      console.error('Erro ao criar saque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PixService;
