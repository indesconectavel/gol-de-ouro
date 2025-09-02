const { MercadoPagoConfig, Preference } = require('mercadopago');
const { Pool } = require('pg');
const env = require('../config/env');

console.log('🧪 DEBUG - CONTROLLER PIX...');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'debug'
  }
});

const preference = new Preference(client);

// Configurar banco
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Simular exatamente o que o controller faz
const testControllerLogic = async () => {
  try {
    const user_id = 1;
    const amount = 10.00;
    const description = 'Teste Debug';

    console.log('🔍 Passo 1: Verificar usuário...');
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', user.name);

    console.log('🔍 Passo 2: Criar preferência no Mercado Pago...');
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
      auto_return: 'approved'
    };

    console.log('📋 Dados da preferência:', JSON.stringify(preferenceData, null, 2));
    
    const preferenceResponse = await preference.create({ body: preferenceData });
    console.log('✅ Preferência criada!');
    console.log('📋 Resposta:', JSON.stringify(preferenceResponse, null, 2));

    console.log('🔍 Passo 3: Salvar no banco...');
    const paymentResult = await pool.query(
      `INSERT INTO pix_payments (user_id, mercado_pago_id, amount, status, expires_at)
       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '30 minutes')
       RETURNING *`,
      [user_id, preferenceResponse.id, amount]
    );

    const savedPayment = paymentResult.rows[0];
    console.log('✅ Pagamento salvo no banco!');
    console.log('📋 Pagamento salvo:', JSON.stringify(savedPayment, null, 2));

    console.log('🔍 Passo 4: Preparar resposta...');
    const response = {
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
    };

    console.log('✅ Resposta preparada!');
    console.log('📋 Resposta final:', JSON.stringify(response, null, 2));

    return response;

  } catch (error) {
    console.log('❌ Erro no debug:', error.message);
    console.log('📋 Stack trace:', error.stack);
    return null;
  } finally {
    await pool.end();
  }
};

// Executar debug
(async () => {
  const result = await testControllerLogic();
  
  if (result) {
    console.log('\n🎉 DEBUG CONCLUÍDO - SISTEMA FUNCIONANDO!');
  } else {
    console.log('\n❌ DEBUG FALHOU - PROBLEMA IDENTIFICADO!');
  }
})();
