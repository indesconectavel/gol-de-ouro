const jwt = require('jsonwebtoken');
const env = require('../config/env');

console.log('🧪 TESTANDO ENDPOINTS DE PAGAMENTO PIX...');

// Criar token JWT válido
const payload = {
  id: 1,
  email: 'admin@test.com',
  role: 'admin'
};

const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
console.log('✅ Token JWT criado:', token.substring(0, 50) + '...');

// Testar endpoint admin
const testAdminEndpoint = async () => {
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
      console.log('📋 Dados:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Erro no endpoint admin:', data);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
};

// Testar endpoint de status
const testStatusEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/payments/pix/status/test_123456', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Endpoint de status funcionando!');
      console.log('📋 Dados:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Erro no endpoint de status:', data);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
};

// Executar testes
(async () => {
  console.log('\n🔍 Testando endpoint admin...');
  await testAdminEndpoint();
  
  console.log('\n🔍 Testando endpoint de status...');
  await testStatusEndpoint();
  
  console.log('\n🎉 Testes concluídos!');
})();
