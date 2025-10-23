const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const env = require('../config/env');

console.log('🧪 TESTANDO CONEXÃO COM MERCADO PAGO...');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'test'
  }
});

const payment = new Payment(client);
const preference = new Preference(client);

// Testar criação de preferência simples
const testPreferenceCreation = async () => {
  try {
    console.log('🔍 Testando criação de preferência...');
    
    const preferenceData = {
      items: [
        {
          title: 'Teste PIX',
          quantity: 1,
          unit_price: 10.00
        }
      ],
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ],
        installments: 1
      },
      notification_url: 'https://goldeouro-backend.onrender.com/api/payments/webhook',
      external_reference: 'test_' + Date.now()
    };

    console.log('📋 Dados da preferência:', JSON.stringify(preferenceData, null, 2));
    
    const result = await preference.create({ body: preferenceData });
    
    console.log('✅ Preferência criada com sucesso!');
    console.log('📋 ID da preferência:', result.id);
    console.log('📋 Status:', result.status);
    
    return result;
  } catch (error) {
    console.log('❌ Erro ao criar preferência:', error.message);
    console.log('📋 Detalhes do erro:', error);
    return null;
  }
};

// Testar consulta de pagamento
const testPaymentQuery = async () => {
  try {
    console.log('\n🔍 Testando consulta de pagamento...');
    
    // Tentar consultar um pagamento que não existe (para testar a conexão)
    const result = await payment.get({ id: '123456789' });
    
    console.log('✅ Consulta de pagamento funcionando!');
    return result;
  } catch (error) {
    if (error.status === 404) {
      console.log('✅ Consulta de pagamento funcionando (404 esperado para ID inexistente)');
      return true;
    } else {
      console.log('❌ Erro na consulta de pagamento:', error.message);
      return false;
    }
  }
};

// Executar testes
(async () => {
  console.log('📋 Configuração:');
  console.log(`   Access Token: ${env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 20)}...`);
  console.log(`   Ambiente: ${env.MERCADOPAGO_ACCESS_TOKEN.includes('TEST') ? 'Teste' : 'Produção'}`);
  
  const preference = await testPreferenceCreation();
  const query = await testPaymentQuery();
  
  if (preference && query) {
    console.log('\n🎉 MERCADO PAGO FUNCIONANDO PERFEITAMENTE!');
    console.log('💡 O problema pode estar no controller de pagamentos');
  } else {
    console.log('\n❌ PROBLEMA COM MERCADO PAGO');
    console.log('💡 Verifique as credenciais e conexão');
  }
})();
