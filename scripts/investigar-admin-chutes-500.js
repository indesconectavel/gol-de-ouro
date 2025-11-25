/**
 * Script para investigar erro 500 do Admin Chutes
 */

const axios = require('axios');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const API_URL = `${BACKEND_URL}/api`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'goldeouro123';

async function investigarAdminChutes() {
  console.log('🔍 Investigando erro 500 do Admin Chutes...\n');
  
  try {
    // Testar endpoint diretamente
    const response = await axios.get(
      `${API_URL}/admin/recent-shots`,
      {
        headers: { 
          'x-admin-token': ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        params: { limit: 10 },
        timeout: 30000,
        validateStatus: () => true // Aceitar qualquer status
      }
    );
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESULTADO DA INVESTIGAÇÃO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Status HTTP:', response.status);
    console.log('Status Text:', response.statusText);
    
    console.log('\n📋 Headers da Resposta:');
    console.log(JSON.stringify(response.headers, null, 2));
    
    console.log('\n📄 Corpo da Resposta:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.status === 500) {
      console.log('\n❌ ERRO 500 DETECTADO');
      console.log('Mensagem:', response.data?.error || response.data?.message || 'N/A');
      console.log('Timestamp:', response.data?.timestamp || 'N/A');
      
      // Verificar se há stack trace
      if (response.data?.stack) {
        console.log('\n📚 Stack Trace:');
        console.log(response.data.stack);
      }
    } else if (response.status === 200) {
      console.log('\n✅ SUCESSO! Endpoint funcionando corretamente');
      console.log('Chutes retornados:', Array.isArray(response.data?.data) ? response.data.data.length : 0);
    } else {
      console.log(`\n⚠️ Status inesperado: ${response.status}`);
    }
    
    // Testar também o endpoint de stats para comparar
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TESTE COMPARATIVO: Admin Stats');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const statsResponse = await axios.get(
      `${API_URL}/admin/stats`,
      {
        headers: { 'x-admin-token': ADMIN_TOKEN },
        timeout: 15000,
        validateStatus: () => true
      }
    );
    
    console.log('Status:', statsResponse.status);
    if (statsResponse.status === 200) {
      console.log('✅ Admin Stats funciona corretamente');
    } else {
      console.log('❌ Admin Stats também falhou:', statsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

investigarAdminChutes();

