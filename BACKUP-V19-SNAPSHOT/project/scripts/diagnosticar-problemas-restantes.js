/**
 * Script de Diagnóstico - Problemas Restantes
 * 
 * Diagnostica problemas específicos identificados nos testes
 */

const axios = require('axios');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const API_URL = `${BACKEND_URL}/api`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'goldeouro123';

async function diagnosticarAdminChutes() {
  console.log('\n=== DIAGNÓSTICO: Admin Chutes Erro 500 ===\n');
  
  try {
    const response = await axios.get(
      `${API_URL}/admin/recent-shots`,
      {
        headers: { 'x-admin-token': ADMIN_TOKEN },
        params: { limit: 10 },
        timeout: 15000,
        validateStatus: () => true
      }
    );
    
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 500) {
      console.log('\n❌ Erro 500 detectado');
      console.log('Mensagem:', response.data?.message || response.data?.error || 'N/A');
      console.log('Stack:', response.data?.stack || 'N/A');
    }
  } catch (error) {
    console.log('Erro:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function diagnosticarWebSocket() {
  console.log('\n=== DIAGNÓSTICO: WebSocket Autenticação ===\n');
  
  // Criar usuário
  const email = `test_ws_diag_${Date.now()}@goldeouro.com`;
  const password = 'Test123!@#';
  const username = `testwsdiag_${Date.now()}`;
  
  try {
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      username
    }, { timeout: 15000 });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      const token = registerResponse.data.data.token;
      const userId = registerResponse.data.data.user.id;
      
      console.log('✅ Usuário criado:', userId);
      console.log('Token:', token.substring(0, 20) + '...');
      
      // Aguardar progressivamente
      for (let i = 1; i <= 5; i++) {
        console.log(`\nAguardando ${i} segundo(s)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se usuário existe no banco
        try {
          const checkResponse = await axios.get(
            `${API_URL}/user/profile`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000
            }
          );
          
          if (checkResponse.status === 200) {
            console.log(`✅ Usuário encontrado após ${i} segundo(s)`);
            break;
          }
        } catch (checkError) {
          console.log(`⚠️  Usuário ainda não disponível após ${i} segundo(s)`);
        }
      }
      
      console.log('\n✅ Usuário deve estar disponível agora para WebSocket');
    }
  } catch (error) {
    console.log('Erro ao criar usuário:', error.message);
  }
}

async function executarDiagnostico() {
  await diagnosticarAdminChutes();
  await diagnosticarWebSocket();
}

executarDiagnostico().catch(console.error);

