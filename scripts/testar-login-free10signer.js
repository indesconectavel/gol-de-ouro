/**
 * Script para testar login do usuário free10signer@gmail.com
 */

const axios = require('axios');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const API_URL = `${BACKEND_URL}/api`;

async function testarLogin() {
  console.log('🧪 Testando login do usuário free10signer@gmail.com...\n');
  
  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'free10signer@gmail.com',
        password: 'Free10signer'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        validateStatus: () => true
      }
    );
    
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\nResposta:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('\n✅ Login bem-sucedido!');
      console.log('Token:', response.data.data.token.substring(0, 20) + '...');
      console.log('Usuário:', JSON.stringify(response.data.data.user, null, 2));
    } else {
      console.log('\n❌ Login falhou');
      console.log('Erro:', response.data.message || response.data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testarLogin();

