const jwt = require('jsonwebtoken');
const env = require('../config/env');

console.log('🧪 TESTANDO WEBHOOK DO MERCADO PAGO...');

// Simular webhook do Mercado Pago
const testWebhook = async () => {
  try {
    // Dados simulados de um webhook do Mercado Pago
    const webhookData = {
      id: 123456789,
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      application_id: 123456789,
      user_id: 123456789,
      version: 1,
      api_version: 'v1',
      action: 'payment.created',
      data: {
        id: '468718642-e8eb56c4-76a0-47d2-b739-c09f0e0fbe5e' // ID da preferência criada
      }
    };

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
      console.log('✅ Webhook processado com sucesso!');
      return true;
    } else {
      console.log('❌ Erro ao processar webhook');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
};

// Testar consulta de status após webhook
const testStatusAfterWebhook = async () => {
  try {
    console.log('\n🔍 Testando consulta de status...');
    
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
      console.log('✅ Consulta de status funcionando!');
      return true;
    } else {
      console.log('❌ Erro na consulta de status');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
};

// Executar testes
(async () => {
  console.log('🔍 Testando webhook...');
  const webhookOk = await testWebhook();
  
  if (webhookOk) {
    console.log('\n🔍 Testando consulta de status...');
    const statusOk = await testStatusAfterWebhook();
    
    if (statusOk) {
      console.log('\n🎉 SISTEMA DE WEBHOOK FUNCIONANDO!');
    } else {
      console.log('\n⚠️ Webhook OK, mas consulta de status com problemas');
    }
  } else {
    console.log('\n❌ PROBLEMA COM WEBHOOK');
  }
})();
