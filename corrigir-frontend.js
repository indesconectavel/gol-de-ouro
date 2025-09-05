#!/usr/bin/env node

/**
 * CORREÇÃO DO FRONTEND - GOL DE OURO
 * Verifica e corrige problemas do frontend
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🔧 CORRIGINDO PROBLEMAS DO FRONTEND...\n');

async function corrigirFrontend() {
  try {
    // 1. Verificar se o frontend está rodando
    console.log('1. 🔍 Verificando status do frontend...');
    
    try {
      const response = await axios.get('http://localhost:5173', { timeout: 5000 });
      console.log('   ✅ Frontend respondendo na porta 5173');
      console.log('   📊 Status:', response.status);
      return true;
    } catch (error) {
      console.log('   ❌ Frontend não está respondendo');
      console.log('   🔧 Tentando iniciar o frontend...');
      
      // 2. Verificar se o diretório existe
      if (!fs.existsSync('goldeouro-admin')) {
        console.log('   ❌ Diretório goldeouro-admin não encontrado');
        return false;
      }

      // 3. Verificar package.json
      const packageJsonPath = 'goldeouro-admin/package.json';
      if (!fs.existsSync(packageJsonPath)) {
        console.log('   ❌ package.json não encontrado');
        return false;
      }

      console.log('   ✅ Estrutura do frontend OK');
      console.log('   🚀 Execute: cd goldeouro-admin && npm run dev');
      return false;
    }

  } catch (error) {
    console.error('❌ Erro ao verificar frontend:', error.message);
    return false;
  }
}

// Executar correção
corrigirFrontend().then(sucesso => {
  if (sucesso) {
    console.log('\n✅ Frontend funcionando corretamente!');
  } else {
    console.log('\n⚠️ Frontend precisa ser iniciado manualmente');
    console.log('📋 Comandos para iniciar:');
    console.log('   cd goldeouro-admin');
    console.log('   npm run dev');
  }
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
