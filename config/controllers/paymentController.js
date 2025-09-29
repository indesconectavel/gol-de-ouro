// Controller de pagamentos PIX - Gol de Ouro
const axios = require('axios');
const { query, transaction } = require('../database/connection');
const { generateToken } = require('../middlewares/auth');

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

// Criar pagamento PIX
const createPixPayment = async (req, res) => {
  try {
    const { user_id, amount, description } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido (mínimo R$ 1,00)'
      });
    }

    // Criar pagamento no banco
    const paymentResult = await query(`
      INSERT INTO payments (user_id, amount, description, status, created_at, expires_at)
      VALUES ($1, $2, $3, 'pending', NOW(), NOW() + INTERVAL '30 minutes')
      RETURNING id
    `, [userId, amount, description || `Recarga de saldo - R$ ${amount}`]);

    const paymentId = paymentResult.rows[0].id;

    // Criar pagamento no Mercado Pago
    const mpPayment = {
      transaction_amount: parseFloat(amount),
      description: description || `Recarga Gol de Ouro - R$ ${amount}`,
      payment_method_id: 'pix',
      payer: {
        email: req.user.email,
        identification: {
          type: 'CPF',
          number: '00000000000' // Em produção, coletar CPF
        }
      },
      external_reference: `goldeouro_${paymentId}`,
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
    };

    const mpResponse = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      mpPayment,
      {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const mpPaymentData = mpResponse.data;

    // Atualizar pagamento com dados do Mercado Pago
    await query(`
      UPDATE payments 
      SET mercadopago_id = $1, qr_code = $2, pix_code = $3
      WHERE id = $4
    `, [
      mpPaymentData.id,
      mpPaymentData.point_of_interaction?.transaction_data?.qr_code,
      mpPaymentData.point_of_interaction?.transaction_data?.qr_code_base64,
      paymentId
    ]);

    // Buscar pagamento atualizado
    const updatedPayment = await query(`
      SELECT * FROM payments WHERE id = $1
    `, [paymentId]);

    res.json({
      success: true,
      message: 'Pagamento PIX criado com sucesso',
      data: updatedPayment.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Consultar status do pagamento
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await query(`
      SELECT * FROM payments 
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (payment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }

    const paymentData = payment.rows[0];

    // Se tem ID do Mercado Pago, consultar status atual
    if (paymentData.mercadopago_id) {
      try {
        const mpResponse = await axios.get(
          `https://api.mercadopago.com/v1/payments/${paymentData.mercadopago_id}`,
          {
            headers: {
              'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
            }
          }
        );

        const mpStatus = mpResponse.data.status;
        
        // Atualizar status se mudou
        if (mpStatus !== paymentData.status) {
          await query(`
            UPDATE payments 
            SET status = $1, approved_at = $2
            WHERE id = $3
          `, [
            mpStatus === 'approved' ? 'approved' : mpStatus,
            mpStatus === 'approved' ? new Date() : null,
            id
          ]);

          // Se aprovado, creditar saldo
          if (mpStatus === 'approved') {
            await query(`
              UPDATE users 
              SET balance = balance + $1
              WHERE id = $2
            `, [paymentData.amount, userId]);

            // Criar notificação
            await query(`
              INSERT INTO notifications (user_id, title, message, type)
              VALUES ($1, $2, $3, 'success')
            `, [
              userId,
              'Pagamento Aprovado!',
              `Seu pagamento de R$ ${paymentData.amount} foi aprovado e creditado em sua conta.`
            ]);
          }
        }
      } catch (mpError) {
        console.error('Erro ao consultar Mercado Pago:', mpError);
      }
    }

    // Buscar pagamento atualizado
    const updatedPayment = await query(`
      SELECT * FROM payments WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      data: updatedPayment.rows[0]
    });

  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Webhook do Mercado Pago
const webhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar pagamento no banco
      const payment = await query(`
        SELECT * FROM payments WHERE mercadopago_id = $1
      `, [paymentId]);

      if (payment.rows.length > 0) {
        const paymentData = payment.rows[0];

        // Consultar status no Mercado Pago
        const mpResponse = await axios.get(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
            }
          }
        );

        const mpStatus = mpResponse.data.status;

        // Atualizar status
        await query(`
          UPDATE payments 
          SET status = $1, approved_at = $2
          WHERE mercadopago_id = $3
        `, [
          mpStatus === 'approved' ? 'approved' : mpStatus,
          mpStatus === 'approved' ? new Date() : null,
          paymentId
        ]);

        // Se aprovado, creditar saldo
        if (mpStatus === 'approved') {
          await query(`
            UPDATE users 
            SET balance = balance + $1
            WHERE id = $2
          `, [paymentData.amount, paymentData.user_id]);

          // Criar notificação
          await query(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, 'success')
          `, [
            paymentData.user_id,
            'Pagamento Aprovado!',
            `Seu pagamento de R$ ${paymentData.amount} foi aprovado e creditado em sua conta.`
          ]);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Listar pagamentos do usuário
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const payments = await query(`
      SELECT * FROM payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const total = await query(`
      SELECT COUNT(*) FROM payments WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      data: {
        payments: payments.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.rows[0].count),
          pages: Math.ceil(total.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createPixPayment,
  getPaymentStatus,
  webhook,
  getUserPayments
};