const jwt = require('jsonwebtoken');
const env = require('../config/env');

console.log('🧪 TESTE SIMPLES - SISTEMA PIX...');

// Verificar se as variáveis de ambiente estão configuradas
console.log('📋 Verificando configuração:');
console.log(`   MERCADOPAGO_ACCESS_TOKEN: ${env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado' : 'Não configurado'}`);
console.log(`   JWT_SECRET: ${env.JWT_SECRET ? 'Configurado' : 'Não configurado'}`);
console.log(`   DATABASE_URL: ${env.DATABASE_URL ? 'Configurado' : 'Não configurado'}`);

// Criar token JWT válido
const payload = {
  id: 1,
  email: 'teste@goldeouro.com',
  role: 'user'
};

const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
console.log('✅ Token JWT criado');

// Testar endpoint de listagem (que sabemos que funciona)
const testListPayments = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/payments/admin/todos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-admin-token': env.ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Endpoint admin funcionando!');
      console.log(`📋 Total de pagamentos: ${data.data.total}`);
      return true;
    } else {
      console.log('❌ Erro no endpoint admin:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
};

// Testar criação com dados mínimos
const testCreateMinimal = async () => {
  try {
    const paymentData = {
      user_id: 1,
      amount: 10.00
    };

    console.log('🔍 Tentando criar pagamento com dados mínimos...');
    console.log('📋 Dados:', JSON.stringify(paymentData, null, 2));

    const response = await fetch('http://localhost:3000/api/payments/pix/criar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Pagamento criado com sucesso!');
      return data.data;
    } else {
      console.log('❌ Erro ao criar pagamento');
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return null;
  }
};

// Executar testes
(async () => {
  console.log('\n🔍 Testando endpoint admin...');
  const adminOk = await testListPayments();
  
  if (adminOk) {
    console.log('\n🔍 Testando criação de pagamento...');
    const payment = await testCreateMinimal();
    
    if (payment) {
      console.log('\n🎉 Sistema PIX funcionando!');
    } else {
      console.log('\n⚠️ Sistema PIX com problemas na criação');
    }
  } else {
    console.log('\n❌ Sistema com problemas básicos');
  }
})();
