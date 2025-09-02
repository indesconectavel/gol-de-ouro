const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const pool = require('../db');
const env = require('../config/env');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

const payment = new Payment(client);
const preference = new Preference(client);

class PaymentController {
  // Criar pagamento PIX
  static async criarPagamentoPix(req, res) {
    try {
      const { user_id, amount, description } = req.body;

      // Validar dados
      if (!user_id || !amount || amount <= 0) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'user_id e amount são obrigatórios e amount deve ser maior que 0'
        });
      }

      // Verificar se usuário existe
      const userResult = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'O usuário especificado não existe'
        });
      }

      const user = userResult.rows[0];

      // Criar preferência no Mercado Pago
      const preferenceData = {
        items: [
          {
            title: description || `Recarga de saldo - ${user.name}`,
            quantity: 1,
            unit_price: parseFloat(amount),
            currency_id: 'BRL'
          }
        ],
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'bank_transfer' }
          ],
          included_payment_types: [
            { id: 'pix' }
          ]
        },
        notification_url: `${env.NODE_ENV === 'production' ? 'https://goldeouro-backend.onrender.com' : 'http://localhost:3000'}/api/payments/webhook`,
        external_reference: `user_${user_id}_${Date.now()}`,
        back_urls: {
          success: `${env.NODE_ENV === 'production' ? 'https://goldeouro-admin.vercel.app' : 'http://localhost:5173'}/pagamentos`,
          failure: `${env.NODE_ENV === 'production' ? 'https://goldeouro-admin.vercel.app' : 'http://localhost:5173'}/pagamentos`,
          pending: `${env.NODE_ENV === 'production' ? 'https://goldeouro-admin.vercel.app' : 'http://localhost:5173'}/pagamentos`
        },
        auto_return: 'approved'
      };

      const preferenceResponse = await preference.create({ body: preferenceData });

      // Salvar pagamento no banco
      const paymentResult = await pool.query(
        `INSERT INTO pix_payments (user_id, mercado_pago_id, amount, status, expires_at)
         VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '30 minutes')
         RETURNING *`,
        [user_id, preferenceResponse.id, amount]
      );

      const savedPayment = paymentResult.rows[0];

      res.status(201).json({
        success: true,
        message: 'Pagamento PIX criado com sucesso',
        data: {
          payment_id: savedPayment.id,
          mercado_pago_id: savedPayment.mercado_pago_id,
          amount: savedPayment.amount,
          status: savedPayment.status,
          pix_code: preferenceResponse.point_of_interaction?.transaction_data?.qr_code,
          qr_code: preferenceResponse.point_of_interaction?.transaction_data?.qr_code_base64,
          expires_at: savedPayment.expires_at,
          payment_url: preferenceResponse.init_point
        }
      });

    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível criar o pagamento PIX'
      });
    }
  }

  // Consultar status do pagamento
  static async consultarStatusPagamento(req, res) {
    try {
      const { payment_id } = req.params;

      // Buscar pagamento no banco
      const paymentResult = await pool.query(
        'SELECT * FROM pix_payments WHERE id = $1',
        [payment_id]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Pagamento não encontrado',
          message: 'O pagamento especificado não existe'
        });
      }

      const payment = paymentResult.rows[0];

      // Consultar status no Mercado Pago
      try {
        const mpPayment = await payment.get({ id: payment.mercado_pago_id });
        
        // Atualizar status no banco se necessário
        if (mpPayment.status !== payment.status) {
          await pool.query(
            'UPDATE pix_payments SET status = $1, updated_at = NOW() WHERE id = $2',
            [mpPayment.status, payment_id]
          );
          payment.status = mpPayment.status;
        }

        res.json({
          success: true,
          data: {
            payment_id: payment.id,
            mercado_pago_id: payment.mercado_pago_id,
            amount: payment.amount,
            status: payment.status,
            created_at: payment.created_at,
            expires_at: payment.expires_at,
            paid_at: payment.paid_at
          }
        });

      } catch (mpError) {
        console.error('Erro ao consultar Mercado Pago:', mpError);
        res.json({
          success: true,
          data: {
            payment_id: payment.id,
            mercado_pago_id: payment.mercado_pago_id,
            amount: payment.amount,
            status: payment.status,
            created_at: payment.created_at,
            expires_at: payment.expires_at,
            paid_at: payment.paid_at
          }
        });
      }

    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível consultar o status do pagamento'
      });
    }
  }

  // Listar pagamentos do usuário
  static async listarPagamentosUsuario(req, res) {
    try {
      const { user_id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const result = await pool.query(
        `SELECT * FROM pix_payments 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM pix_payments WHERE user_id = $1',
        [user_id]
      );

      res.json({
        success: true,
        data: {
          payments: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível listar os pagamentos'
      });
    }
  }

  // Webhook do Mercado Pago
  static async webhookMercadoPago(req, res) {
    try {
      const { type, data } = req.body;

      console.log('Webhook recebido:', { type, data });

      // Verificar se já processamos este webhook
      const webhookResult = await pool.query(
        'SELECT id FROM mercado_pago_webhooks WHERE webhook_id = $1',
        [data.id]
      );

      if (webhookResult.rows.length > 0) {
        return res.status(200).json({ message: 'Webhook já processado' });
      }

      // Salvar webhook
      await pool.query(
        `INSERT INTO mercado_pago_webhooks (webhook_id, event_type, payment_id, payload)
         VALUES ($1, $2, $3, $4)`,
        [data.id, type, data.id, JSON.stringify(req.body)]
      );

      // Processar apenas eventos de pagamento
      if (type === 'payment') {
        await PaymentController.processarPagamento(data.id);
      }

      res.status(200).json({ message: 'Webhook processado com sucesso' });

    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar webhook'
      });
    }
  }

  // Processar pagamento confirmado
  static async processarPagamento(mercadoPagoId) {
    try {
      // Buscar pagamento no banco
      const paymentResult = await pool.query(
        'SELECT * FROM pix_payments WHERE mercado_pago_id = $1',
        [mercadoPagoId]
      );

      if (paymentResult.rows.length === 0) {
        console.log('Pagamento não encontrado no banco:', mercadoPagoId);
        return;
      }

      const payment = paymentResult.rows[0];

      // Se já foi processado, não processar novamente
      if (payment.status === 'approved') {
        return;
      }

      // Consultar status no Mercado Pago
      const mpPayment = await payment.get({ id: mercadoPagoId });

      if (mpPayment.status === 'approved') {
        // Iniciar transação
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');

          // Atualizar status do pagamento
          await client.query(
            'UPDATE pix_payments SET status = $1, paid_at = NOW(), updated_at = NOW() WHERE id = $2',
            ['approved', payment.id]
          );

          // Adicionar saldo ao usuário
          await client.query(
            'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
            [payment.amount, payment.user_id]
          );

          // Registrar transação
          await client.query(
            'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)',
            [payment.user_id, payment.amount, 'deposit']
          );

          await client.query('COMMIT');
          console.log(`Pagamento ${payment.id} processado com sucesso. Saldo adicionado: R$ ${payment.amount}`);

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  }

  // Listar todos os pagamentos (admin)
  static async listarTodosPagamentos(req, res) {
    try {
      const { status, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT pp.*, u.name as user_name, u.email as user_email
        FROM pix_payments pp
        JOIN users u ON pp.user_id = u.id
      `;
      
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` WHERE pp.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY pp.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Contar total
      let countQuery = 'SELECT COUNT(*) FROM pix_payments pp JOIN users u ON pp.user_id = u.id';
      const countParams = [];
      paramCount = 0;

      if (status) {
        paramCount++;
        countQuery += ` WHERE pp.status = $${paramCount}`;
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);

      res.json({
        success: true,
        data: {
          payments: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('Erro ao listar todos os pagamentos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível listar os pagamentos'
      });
    }
  }
}

module.exports = PaymentController;
