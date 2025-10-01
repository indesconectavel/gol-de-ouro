// Teste PIX Real - Gol de Ouro v1.1.1
const https = require('https');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';

// Função para fazer requisição HTTP
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Teste 1: Verificar se backend está online
async function testBackendHealth() {
  console.log('🔍 Testando saúde do backend...');
  
  try {
    const response = await httpRequest(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Backend online:', response.data);
      return true;
    } else {
      console.log('❌ Backend com problemas:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar backend:', error.message);
    return false;
  }
}

// Teste 2: Criar PIX
async function testCreatePix() {
  console.log('💳 Testando criação de PIX...');
  
  const pixData = {
    amount: 10.00,
    description: 'Teste PIX Real',
    user_id: 'test_user_123'
  };
  
  try {
    const response = await httpRequest(`${BACKEND_URL}/api/payments/pix/criar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixData)
    });
    
    if (response.status === 200) {
      console.log('✅ PIX criado com sucesso:');
      console.log('   ID:', response.data.id);
      console.log('   Status:', response.data.status);
      console.log('   QR Code:', response.data.qr_code ? 'Gerado' : 'Não gerado');
      console.log('   Mensagem:', response.data.message);
      
      return response.data;
    } else {
      console.log('❌ Erro ao criar PIX:', response.status, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição PIX:', error.message);
    return null;
  }
}

// Teste 3: Verificar status do PIX
async function testPixStatus(paymentId) {
  if (!paymentId) return;
  
  console.log('📊 Testando status do PIX...');
  
  try {
    const response = await httpRequest(`${BACKEND_URL}/api/payments/pix/status?id=${paymentId}`);
    
    if (response.status === 200) {
      console.log('✅ Status do PIX:', response.data);
    } else {
      console.log('❌ Erro ao verificar status:', response.status, response.data);
    }
  } catch (error) {
    console.log('❌ Erro na verificação de status:', error.message);
  }
}

// Teste 4: Testar webhook (simulação)
async function testWebhook() {
  console.log('🔗 Testando webhook PIX...');
  
  const webhookData = {
    type: 'payment',
    data: {
      id: 'test_payment_123'
    }
  };
  
  try {
    const response = await httpRequest(`${BACKEND_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    
    if (response.status === 200) {
      console.log('✅ Webhook processado:', response.data);
    } else {
      console.log('❌ Erro no webhook:', response.status, response.data);
    }
  } catch (error) {
    console.log('❌ Erro na requisição webhook:', error.message);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 INICIANDO TESTES PIX REAL - GOL DE OURO');
  console.log('==========================================');
  
  // Teste 1: Backend
  const backendOk = await testBackendHealth();
  if (!backendOk) {
    console.log('❌ Backend offline. Parando testes.');
    return;
  }
  
  console.log('');
  
  // Teste 2: Criar PIX
  const pixResult = await testCreatePix();
  
  console.log('');
  
  // Teste 3: Status PIX
  if (pixResult && pixResult.id) {
    await testPixStatus(pixResult.id);
  }
  
  console.log('');
  
  // Teste 4: Webhook
  await testWebhook();
  
  console.log('');
  console.log('✅ TESTES CONCLUÍDOS');
  console.log('====================');
  
  if (pixResult && pixResult.message && pixResult.message.includes('Mercado Pago')) {
    console.log('🎉 PIX REAL FUNCIONANDO! Mercado Pago integrado.');
  } else {
    console.log('⚠️  PIX em modo simulação. Configure MP_ACCESS_TOKEN para ativar PIX real.');
  }
}

// Executar
runAllTests().catch(console.error);
