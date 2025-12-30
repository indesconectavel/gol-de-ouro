const jwt = require('jsonwebtoken');
const env = require('../config/env');

console.log('🧪 TESTANDO CRIAÇÃO DE PAGAMENTO PIX...');

// Criar token JWT válido
const payload = {
  id: 1,
  email: 'teste@goldeouro.com',
  role: 'user'
};

const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
console.log('✅ Token JWT criado');

// Testar criação de pagamento PIX
const testCreatePixPayment = async () => {
  try {
    const paymentData = {
      user_id: 1,
      amount: 25.00,
      description: 'Teste de pagamento PIX - Sistema de Validação'
    };

    const response = await fetch('http://localhost:3000/api/payments/pix/criar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Pagamento PIX criado com sucesso!');
      console.log('📋 Dados do pagamento:');
      console.log(`   ID: ${data.data.id}`);
      console.log(`   Mercado Pago ID: ${data.data.mercado_pago_id}`);
      console.log(`   Valor: R$ ${data.data.amount}`);
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Código PIX: ${data.data.pix_code ? 'Gerado' : 'Não gerado'}`);
      console.log(`   QR Code: ${data.data.qr_code ? 'Gerado' : 'Não gerado'}`);
      console.log(`   Expira em: ${data.data.expires_at}`);
      
      return data.data;
    } else {
      console.log('❌ Erro ao criar pagamento PIX:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return null;
  }
};

// Executar teste
(async () => {
  console.log('\n🔍 Testando criação de pagamento PIX...');
  const payment = await testCreatePixPayment();
  
  if (payment) {
    console.log('\n🎉 Teste de criação concluído com sucesso!');
    console.log('💡 Próximos passos:');
    console.log('   1. Testar consulta de status');
    console.log('   2. Testar webhook do Mercado Pago');
    console.log('   3. Testar crédito automático de saldo');
  } else {
    console.log('\n❌ Teste de criação falhou!');
  }
})();
