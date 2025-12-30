#!/usr/bin/env node
/**
 * Script para testar todos os endpoints de autenticação
 */

async function testAllAuthEndpoints() {
  console.log('🔍 TESTANDO TODOS OS ENDPOINTS DE AUTENTICAÇÃO');
  console.log('==============================================\n');

  const baseUrl = 'https://goldeouro.lol';
  const testUser = {
    email: 'free10signer@gmail.com',
    password: 'Free10signer'
  };

  const endpoints = [
    '/api/auth/login',
    '/auth/login',
    '/api/health',
    '/health'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testando: ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });

      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      console.log('');

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('');
    }
  }

  // Testar também o backend direto
  console.log('🔍 Testando backend direto:');
  try {
    const response = await fetch('https://goldeouro-backend.fly.dev/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAllAuthEndpoints().catch(console.error);
}

module.exports = testAllAuthEndpoints;
