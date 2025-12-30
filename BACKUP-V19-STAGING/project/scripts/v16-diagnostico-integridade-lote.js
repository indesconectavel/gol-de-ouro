/**
 * 🔍 V16 DIAGNÓSTICO DE INTEGRIDADE DE LOTE
 * Verifica o que está causando o erro de integridade
 */

const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
const USER_PASSWORD = 'Test123456!';

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO DE INTEGRIDADE DE LOTE\n');
  
  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginR = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    
    const token = loginR.data?.token || loginR.data?.data?.token;
    if (!token) {
      console.error('❌ Falha ao obter token');
      return;
    }
    console.log('✅ Login realizado\n');
    
    // 2. Tentar um chute e capturar resposta detalhada
    console.log('2. Tentando chute com direção TL...');
    try {
      const shootR = await axios.post(
        `${BACKEND_URL}/api/games/shoot`,
        {
          direction: 'TL',
          amount: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: () => true
        }
      );
      
      console.log(`Status: ${shootR.status}`);
      console.log(`Response:`, JSON.stringify(shootR.data, null, 2));
      
      if (shootR.status === 400 && shootR.data?.message?.includes('integridade')) {
        console.log('\n❌ Erro de integridade detectado');
        console.log('Mensagem:', shootR.data.message);
        console.log('Detalhes:', shootR.data.details || 'N/A');
      }
    } catch (e) {
      console.error('❌ Erro ao executar chute:', e.message);
      if (e.response) {
        console.log('Status:', e.response.status);
        console.log('Data:', JSON.stringify(e.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  }
}

diagnosticar();

