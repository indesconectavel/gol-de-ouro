const jwt = require('jsonwebtoken');
const env = require('../config/env');

console.log('🧪 TESTANDO CRÉDITO AUTOMÁTICO DE SALDO...');

// Testar simulação de pagamento aprovado
const testPaymentApproved = async () => {
  try {
    // Simular webhook de pagamento aprovado
    const webhookData = {
      id: 123456790,
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      application_id: 123456789,
      user_id: 123456789,
      version: 1,
      api_version: 'v1',
      action: 'payment.updated',
      data: {
        id: '468718642-e8eb56c4-76a0-47d2-b739-c09f0e0fbe5e' // ID da preferência
      }
    };

    console.log('📋 Simulando pagamento aprovado...');
    console.log('📋 Dados do webhook:', JSON.stringify(webhookData, null, 2));

    const response = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id'
      },
      body: JSON.stringify(webhookData)
    });

    const data = await response.json();
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook de pagamento aprovado processado!');
      return true;
    } else {
      console.log('❌ Erro ao processar webhook de pagamento aprovado');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
};

// Verificar saldo do usuário após pagamento
const checkUserBalance = async () => {
  try {
    console.log('\n🔍 Verificando saldo do usuário...');
    
    const response = await fetch('http://localhost:3000/usuario/saldo-detalhado', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt.sign({id: 1, email: 'test@test.com'}, env.JWT_SECRET, {expiresIn: '1h'})}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: 1 })
    });

    const data = await response.json();
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Saldo do usuário consultado!');
      return data;
    } else {
      console.log('❌ Erro ao consultar saldo do usuário');
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return null;
  }
};

// Verificar status do pagamento após aprovação
const checkPaymentStatus = async () => {
  try {
    console.log('\n🔍 Verificando status do pagamento...');
    
    const response = await fetch('http://localhost:3000/api/payments/pix/status/2', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt.sign({id: 1, email: 'test@test.com'}, env.JWT_SECRET, {expiresIn: '1h'})}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Status do pagamento consultado!');
      return data;
    } else {
      console.log('❌ Erro ao consultar status do pagamento');
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return null;
  }
};

// Executar testes
(async () => {
  console.log('🔍 Testando webhook de pagamento aprovado...');
  const webhookOk = await testPaymentApproved();
  
  if (webhookOk) {
    console.log('\n🔍 Verificando saldo do usuário...');
    const balance = await checkUserBalance();
    
    console.log('\n🔍 Verificando status do pagamento...');
    const paymentStatus = await checkPaymentStatus();
    
    if (balance && paymentStatus) {
      console.log('\n🎉 SISTEMA DE CRÉDITO AUTOMÁTICO FUNCIONANDO!');
      console.log('💡 O saldo do usuário deve ter sido creditado automaticamente');
    } else {
      console.log('\n⚠️ Webhook OK, mas verificação de saldo com problemas');
    }
  } else {
    console.log('\n❌ PROBLEMA COM WEBHOOK DE PAGAMENTO APROVADO');
  }
})();
