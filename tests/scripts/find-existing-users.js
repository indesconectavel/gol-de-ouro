// Script para Encontrar Usuários Existentes para Testes
// FASE 2.5 - Buscar Credenciais Válidas

const axios = require('axios');
const testConfig = require('../config/testConfig');

/**
 * Tentar encontrar usuários existentes que possam ser usados para testes
 * Testa credenciais comuns de desenvolvimento/teste
 */
async function findExistingUsers() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 BUSCANDO USUÁRIOS EXISTENTES PARA TESTES');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🌐 Backend: ${testConfig.staging.baseURL}`);
  console.log('');

  const commonCredentials = [
    { email: 'free10signer@gmail.com', password: 'Free10signer', username: 'free10signer' },
    { email: 'teste.player@example.com', password: 'senha123', username: 'teste_player' },
    { email: 'test@example.com', password: 'password123', username: 'test' },
    { email: 'teste@example.com', password: 'teste123', username: 'teste' },
  ];

  const foundUsers = [];

  for (const cred of commonCredentials) {
    try {
      console.log(`🔍 Testando: ${cred.email}...`);
      
      const response = await axios.post(
        `${testConfig.staging.baseURL}/api/auth/login`,
        { email: cred.email, password: cred.password },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        }
      );

      if (response.status === 200 && response.data && response.data.success) {
        console.log(`   ✅ Credenciais válidas encontradas!`);
        foundUsers.push({
          email: cred.email,
          password: cred.password,
          username: cred.username,
          token: response.data.data?.token,
          user: response.data.data?.user
        });
      } else {
        console.log(`   ❌ Credenciais inválidas (status ${response.status})`);
      }

      // Aguardar um pouco para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`   ⚠️ Rate limit atingido - aguardando...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESULTADOS');
  console.log('═══════════════════════════════════════════════════════');

  if (foundUsers.length > 0) {
    console.log(`✅ ${foundUsers.length} usuário(s) válido(s) encontrado(s):`);
    foundUsers.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.email}`);
    });
  } else {
    console.log('❌ Nenhum usuário válido encontrado');
    console.log('');
    console.log('💡 RECOMENDAÇÃO:');
    console.log('   1. Criar usuário manualmente via UI em staging');
    console.log('   2. Ou aguardar rate limit expirar e tentar criar via script');
    console.log('   3. Ou usar credenciais de usuário existente conhecido');
  }

  console.log('═══════════════════════════════════════════════════════');

  return foundUsers;
}

// Executar se chamado diretamente
if (require.main === module) {
  findExistingUsers()
    .then(users => {
      if (users.length > 0) {
        const fs = require('fs');
        const path = require('path');
        const resultsPath = path.join(__dirname, '../.found-users.json');
        fs.writeFileSync(resultsPath, JSON.stringify(users, null, 2));
        console.log('');
        console.log(`💾 Usuários encontrados salvos em: ${resultsPath}`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = findExistingUsers;

