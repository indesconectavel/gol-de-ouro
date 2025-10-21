// Controller de Pagamentos - Gol de Ouro v1.1.1
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { supabase } = require('../database/supabase-config');
const crypto = require('crypto');

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'goldeouro-' + Date.now()
  }
});

const payment = new Payment(client);
const preference = new Preference(client);

class PaymentController {
  // Criar pagamento PIX
  static async criarPagamentoPix(req, res) {
    try {
      const { valor, descricao = 'Depósito Gol de Ouro' } = req.body;
      const userId = req.user.id;

      if (!valor || valor < 1) {
        return res.status(400).json({
          error: 'Valor inválido',
          code: 'INVALID_AMOUNT'
        });
      }

      // Criar preferência de pagamento
      const preferenceData = {
        items: [
          {
            title: descricao,
            quantity: 1,
            unit_price: parseFloat(valor),
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: req.user.email,
          identification: {
            type: 'CPF',
            number: '00000000000' // Será preenchido pelo usuário
          }
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 1
        },
        back_urls: {
          success: `${process.env.PLAYER_URL}/deposito/sucesso`,
          failure: `${process.env.PLAYER_URL}/deposito/erro`,
          pending: `${process.env.PLAYER_URL}/deposito/pendente`
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        external_reference: `deposito_${userId}_${Date.now()}`
      };

      const result = await preference.create({ body: preferenceData });

      // Salvar pagamento no banco
      const { data: pagamento, error } = await supabase
        .from('pagamentos_pix')
        .insert({
          usuario_id: userId,
          payment_id: result.id,
          valor: parseFloat(valor),
          status: 'pending',
          qr_code: result.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
          pix_copy_paste: result.point_of_interaction?.transaction_data?.qr_code,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar pagamento:', error);
        return res.status(500).json({
          error: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        });
      }

      res.json({
        success: true,
        payment_id: result.id,
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_copy_paste: result.point_of_interaction?.transaction_data?.qr_code,
        expires_at: pagamento.expires_at,
        init_point: result.init_point
      });

    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      res.status(500).json({
        error: 'Erro ao processar pagamento',
        code: 'PAYMENT_ERROR'
      });
    }
  }

  // Consultar status do pagamento
  static async consultarStatusPagamento(req, res) {
    try {
      const { payment_id } = req.params;

      const { data: pagamento, error } = await supabase
        .from('pagamentos_pix')
        .select('*')
        .eq('payment_id', payment_id)
        .single();

      if (error || !pagamento) {
        return res.status(404).json({
          error: 'Pagamento não encontrado',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      // Consultar status no Mercado Pago
      const paymentData = await payment.get({ id: payment_id });

      // Atualizar status no banco se necessário
      if (pagamento.status !== paymentData.status) {
        await supabase
          .from('pagamentos_pix')
          .update({
            status: paymentData.status,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', payment_id);

        // Se aprovado, creditar saldo
        if (paymentData.status === 'approved' && pagamento.status !== 'approved') {
          await this.processarPagamentoAprovado(pagamento);
        }
      }

      res.json({
        payment_id: payment_id,
        status: paymentData.status,
        valor: pagamento.valor,
        created_at: pagamento.created_at,
        approved_at: paymentData.status === 'approved' ? paymentData.date_approved : null
      });

    } catch (error) {
      console.error('Erro ao consultar status:', error);
      res.status(500).json({
        error: 'Erro ao consultar pagamento',
        code: 'QUERY_ERROR'
      });
    }
  }

  // Listar pagamentos do usuário
  static async listarPagamentosUsuario(req, res) {
    try {
      const { user_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const { data: pagamentos, error } = await supabase
        .from('pagamentos_pix')
        .select('*')
        .eq('usuario_id', user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return res.status(500).json({
          error: 'Erro ao consultar pagamentos',
          code: 'QUERY_ERROR'
        });
      }

      res.json({
        pagamentos,
        total: pagamentos.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Webhook do Mercado Pago
  static async webhookMercadoPago(req, res) {
    try {
      const { type, data } = req.body;

      if (type === 'payment') {
        const paymentId = data.id;
        
        // Consultar pagamento no Mercado Pago
        const paymentData = await payment.get({ id: paymentId });
        
        // Atualizar status no banco
        const { error } = await supabase
          .from('pagamentos_pix')
          .update({
            status: paymentData.status,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', paymentId);

        if (error) {
          console.error('Erro ao atualizar pagamento:', error);
          return res.status(500).json({ error: 'Erro ao processar webhook' });
        }

        // Se aprovado, processar pagamento
        if (paymentData.status === 'approved') {
          const { data: pagamento } = await supabase
            .from('pagamentos_pix')
            .select('*')
            .eq('payment_id', paymentId)
            .single();

          if (pagamento) {
            await this.processarPagamentoAprovado(pagamento);
          }
        }
      }

      res.status(200).json({ received: true });

    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  // Processar pagamento aprovado
  static async processarPagamentoAprovado(pagamento) {
    try {
      // Iniciar transação
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('saldo')
        .eq('id', pagamento.usuario_id)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        return;
      }

      const novoSaldo = parseFloat(usuario.saldo) + parseFloat(pagamento.valor);

      // Atualizar saldo do usuário
      await supabase
        .from('usuarios')
        .update({ saldo: novoSaldo })
        .eq('id', pagamento.usuario_id);

      // Criar transação
      await supabase
        .from('transacoes')
        .insert({
          usuario_id: pagamento.usuario_id,
          tipo: 'deposito',
          valor: parseFloat(pagamento.valor),
          saldo_anterior: parseFloat(usuario.saldo),
          saldo_posterior: novoSaldo,
          descricao: 'Depósito via PIX',
          referencia: pagamento.payment_id,
          status: 'concluida',
          processed_at: new Date().toISOString()
        });

      console.log(`✅ Pagamento processado: ${pagamento.payment_id} - R$ ${pagamento.valor}`);

    } catch (error) {
      console.error('Erro ao processar pagamento aprovado:', error);
    }
  }

  // Solicitar saque
  static async solicitarSaque(req, res) {
    try {
      const { valor, chave_pix, tipo_chave } = req.body;
      const userId = req.user.id;

      if (!valor || valor < 10) {
        return res.status(400).json({
          error: 'Valor mínimo de saque é R$ 10,00',
          code: 'MINIMUM_WITHDRAWAL'
        });
      }

      if (!chave_pix || !tipo_chave) {
        return res.status(400).json({
          error: 'Chave PIX é obrigatória',
          code: 'PIX_KEY_REQUIRED'
        });
      }

      // Verificar saldo
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('saldo')
        .eq('id', userId)
        .single();

      if (userError || !usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      if (parseFloat(usuario.saldo) < parseFloat(valor)) {
        return res.status(400).json({
          error: 'Saldo insuficiente',
          code: 'INSUFFICIENT_BALANCE'
        });
      }

      // Calcular taxa de saque
      const taxa = parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00');
      const valorLiquido = parseFloat(valor) - taxa;

      // Criar saque
      const { data: saque, error: saqueError } = await supabase
        .from('saques')
        .insert({
          usuario_id: userId,
          valor: parseFloat(valor),
          chave_pix: chave_pix,
          tipo_chave: tipo_chave,
          status: 'pendente'
        })
        .select()
        .single();

      if (saqueError) {
        return res.status(500).json({
          error: 'Erro ao criar saque',
          code: 'WITHDRAWAL_ERROR'
        });
      }

      // Criar transação
      await supabase
        .from('transacoes')
        .insert({
          usuario_id: userId,
          tipo: 'saque',
          valor: -parseFloat(valor),
          saldo_anterior: parseFloat(usuario.saldo),
          saldo_posterior: parseFloat(usuario.saldo) - parseFloat(valor),
          descricao: `Saque via PIX - Taxa: R$ ${taxa.toFixed(2)}`,
          referencia: saque.id,
          status: 'pendente'
        });

      res.json({
        success: true,
        saque_id: saque.id,
        valor: valor,
        valor_liquido: valorLiquido,
        taxa: taxa,
        status: 'pendente'
      });

    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Health check
  static async healthCheck(req, res) {
    try {
      const stats = await supabase
        .from('pagamentos_pix')
        .select('status', { count: 'exact' });

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        payments_count: stats.count || 0
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = PaymentController;
