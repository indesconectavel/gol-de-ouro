// Teste PIX Real R$1,00 - Gol de Ouro v1.1.1
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
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
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

// Teste PIX Real R$1,00
async function testPixReal1Real() {
  console.log('💳 TESTE PIX REAL R$1,00 - GOL DE OURO');
  console.log('=====================================');
  
  try {
    // 1. Criar PIX de R$1,00
    console.log('📝 Criando PIX de R$1,00...');
    
    const pixData = {
      amount: 1.00,
      description: 'Teste PIX Real R$1,00',
      user_id: 'test_real_user_123'
    };
    
    const response = await httpRequest(`${BACKEND_URL}/api/payments/pix/criar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixData)
    });
    
    console.log('📊 Resposta do PIX:');
    console.log('   Status:', response.status);
    console.log('   ID:', response.data.id);
    console.log('   Valor:', response.data.amount);
    console.log('   Status:', response.data.status);
    console.log('   Mensagem:', response.data.message);
    
    if (response.data.external_reference) {
      console.log('   External Reference:', response.data.external_reference);
    }
    
    if (response.data.qr_code) {
      console.log('   QR Code:', response.data.qr_code.substring(0, 50) + '...');
    }
    
    // 2. Verificar se é Mercado Pago real
    if (response.data.message && response.data.message.includes('Mercado Pago')) {
      console.log('🎉 PIX REAL ATIVO! Mercado Pago integrado.');
      
      // 3. Simular webhook de aprovação
      console.log('🔗 Simulando webhook de aprovação...');
      
      const webhookData = {
        type: 'payment',
        data: {
          id: response.data.id
        }
      };
      
      const webhookResponse = await httpRequest(`${BACKEND_URL}/api/payments/pix/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });
      
      console.log('📊 Webhook Response:');
      console.log('   Status:', webhookResponse.status);
      console.log('   Data:', webhookResponse.data);
      
      // 4. Verificar logs do backend
      console.log('📋 Verificando logs do backend...');
      console.log('   Acesse: https://goldeouro-backend-v2.fly.dev/health');
      console.log('   Verifique logs para:');
      console.log('   - PIX Creation Request');
      console.log('   - PIX aprovado');
      console.log('   - External reference');
      console.log('   - Crédito no saldo');
      
    } else {
      console.log('⚠️  PIX em modo simulação. Para ativar PIX real:');
      console.log('   1. Configure MP_ACCESS_TOKEN no Fly.io');
      console.log('   2. Configure webhook no Mercado Pago');
      console.log('   3. Redeploy do backend');
    }
    
    console.log('');
    console.log('✅ TESTE PIX CONCLUÍDO');
    console.log('======================');
    
  } catch (error) {
    console.error('❌ Erro no teste PIX:', error.message);
  }
}

// Executar teste
testPixReal1Real().catch(console.error);
