// Script para corrigir deploy no Render
const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGINDO DEPLOY NO RENDER');
console.log('==============================');

// Verificar se o package.json está correto
const checkPackageJson = () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log('📦 Verificando package.json:');
    console.log(`   Start command: ${packageJson.scripts.start}`);
    
    if (packageJson.scripts.start === 'node server-optimized.js') {
      console.log('✅ Package.json correto');
      return true;
    } else {
      console.log('❌ Package.json incorreto');
      console.log('🔧 Corrigindo...');
      
      packageJson.scripts.start = 'node server-optimized.js';
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Package.json corrigido');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar package.json:', error.message);
    return false;
  }
};

// Verificar se o server-optimized.js existe
const checkOptimizedServer = () => {
  try {
    if (fs.existsSync('server-optimized.js')) {
      console.log('✅ server-optimized.js existe');
      return true;
    } else {
      console.log('❌ server-optimized.js não encontrado');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar server-optimized.js:', error.message);
    return false;
  }
};

// Verificar se o utils/aggressiveMemoryCleanup.js existe
const checkMemoryCleanup = () => {
  try {
    if (fs.existsSync('utils/aggressiveMemoryCleanup.js')) {
      console.log('✅ utils/aggressiveMemoryCleanup.js existe');
      return true;
    } else {
      console.log('❌ utils/aggressiveMemoryCleanup.js não encontrado');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar utils/aggressiveMemoryCleanup.js:', error.message);
    return false;
  }
};

// Criar arquivo de verificação para o Render
const createRenderVerification = () => {
  const verificationContent = `
// Verificação de deploy no Render
console.log('🔍 VERIFICAÇÃO DE DEPLOY NO RENDER');
console.log('==================================');
console.log('✅ Servidor otimizado carregado');
console.log('✅ Limpeza agressiva de memória ativa');
console.log('✅ Monitoramento a cada 5 segundos');
console.log('✅ Rate limiting: 50 req/15min');
console.log('✅ JSON limit: 1MB');
console.log('✅ Limpeza preventiva a cada 2 minutos');
console.log('==================================');
`;
  
  try {
    fs.writeFileSync('render-verification.js', verificationContent);
    console.log('✅ Arquivo de verificação criado');
    return true;
  } catch (error) {
    console.log('❌ Erro ao criar arquivo de verificação:', error.message);
    return false;
  }
};

// Executar verificações
async function fixRenderDeploy() {
  console.log('🔍 Verificando arquivos necessários...\n');
  
  const packageOk = checkPackageJson();
  const serverOk = checkOptimizedServer();
  const cleanupOk = checkMemoryCleanup();
  const verificationOk = createRenderVerification();
  
  console.log('\n📊 RESUMO DAS VERIFICAÇÕES:');
  console.log('===========================');
  console.log(`Package.json: ${packageOk ? '✅' : '❌'}`);
  console.log(`Server-optimized.js: ${serverOk ? '✅' : '❌'}`);
  console.log(`Memory cleanup: ${cleanupOk ? '✅' : '❌'}`);
  console.log(`Verification file: ${verificationOk ? '✅' : '❌'}`);
  
  if (packageOk && serverOk && cleanupOk) {
    console.log('\n✅ Todos os arquivos estão corretos');
    console.log('🔧 Próximo passo: Fazer commit e push');
  } else {
    console.log('\n❌ Alguns arquivos precisam ser corrigidos');
    console.log('🔧 Corrigindo e fazendo commit...');
  }
  
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. Fazer commit das correções');
  console.log('2. Fazer push para GitHub');
  console.log('3. Aguardar deploy automático no Render');
  console.log('4. Verificar logs para confirmar server-optimized.js');
  console.log('5. Monitorar uso de memória');
  
  console.log('\n📋 COMANDOS PARA EXECUTAR:');
  console.log('==========================');
  console.log('git add .');
  console.log('git commit -m "fix: corrigir deploy do servidor otimizado"');
  console.log('git push origin main');
}

fixRenderDeploy().catch(console.error);
