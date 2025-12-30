// routes/mpWebhook.js - Webhook Mercado Pago v1.1.1
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware para verificar assinatura do webhook
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  // Verificar assinatura (implementar conforme documentação do MP)
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
  //   .update(payload)
  //   .digest('hex');
  
  // if (signature !== expectedSignature) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  next();
}

// Processar webhook do Mercado Pago
router.post('/mercadopago', verifyWebhookSignature, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { type, data } = req.body;
    const eventId = `${type}_${data.id}`;
    
    // Verificar idempotência
    const idempotencyCheck = await client.query(
      'SELECT id FROM mp_events WHERE id = $1',
      [eventId]
    );
    
    if (idempotencyCheck.rows.length > 0) {
      console.log(`Evento ${eventId} já processado`);
      return res.status(200).json({ status: 'already_processed' });
    }
    
    // Registrar evento
    await client.query(
      'INSERT INTO mp_events (id, status) VALUES ($1, $2)',
      [eventId, 'processing']
    );
    
    // Processar baseado no tipo
    switch (type) {
      case 'payment':
        await processPayment(client, data.id);
        break;
      case 'plan':
        await processPlan(client, data.id);
        break;
      default:
        console.log(`Tipo de evento não suportado: ${type}`);
    }
    
    // Marcar como processado
    await client.query(
      'UPDATE mp_events SET status = $1, processed_at = NOW() WHERE id = $2',
      ['completed', eventId]
    );
    
    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('Erro no webhook:', error);
    
    // Marcar como erro
    await client.query(
      'UPDATE mp_events SET status = $1 WHERE id = $2',
      ['error', eventId]
    );
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Processar pagamento
async function processPayment(client, paymentId) {
  try {
    // Buscar detalhes do pagamento via API do MP
    const payment = await fetchPaymentDetails(paymentId);
    
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }
    
    // Atualizar transação
    await client.query(
      `UPDATE transactions 
       SET status = $1, 
           mp_payment_id = $2,
           updated_at = NOW()
       WHERE mp_payment_id = $2`,
      [payment.status, paymentId]
    );
    
    console.log(`Pagamento ${paymentId} processado: ${payment.status}`);
    
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
}

// Processar plano
async function processPlan(client, planId) {
  try {
    // Implementar lógica de planos se necessário
    console.log(`Plano ${planId} processado`);
  } catch (error) {
    console.error('Erro ao processar plano:', error);
    throw error;
  }
}

// Buscar detalhes do pagamento
async function fetchPaymentDetails(paymentId) {
  try {
    // ✅ CORREÇÃO SSRF/FORMAT STRING: Validar paymentId antes de usar na URL
    if (!paymentId || typeof paymentId !== 'string' && typeof paymentId !== 'number') {
      throw new Error('ID de pagamento inválido: tipo inválido');
    }
    
    const paymentIdStr = String(paymentId).trim();
    if (!/^\d+$/.test(paymentIdStr)) {
      throw new Error('ID de pagamento inválido: deve conter apenas dígitos');
    }
    
    const paymentIdNum = parseInt(paymentIdStr, 10);
    if (isNaN(paymentIdNum) || paymentIdNum <= 0) {
      throw new Error('ID de pagamento inválido: deve ser um número positivo');
    }
    
    // ✅ CORREÇÃO FORMAT STRING: Usar template string de forma segura (paymentIdNum já validado)
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentIdNum}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // ✅ CORREÇÃO FORMAT STRING: response.status é número HTTP válido, mas vamos ser explícitos
      const statusCode = Number(response.status);
      throw new Error(`Erro na API do MP: ${statusCode}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return null;
  }
}

module.exports = router;
