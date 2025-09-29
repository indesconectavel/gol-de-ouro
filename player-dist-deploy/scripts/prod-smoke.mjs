#!/usr/bin/env node

// Script de teste de produção - Gol de Ouro
console.log('🧪 Iniciando testes de produção...\n');

const tests = [
  {
    name: 'Manifest PWA',
    url: 'https://www.goldeouro.lol/manifest.webmanifest',
    validate: (response) => {
      if (response.status !== 200) {
        throw new Error(`Status ${response.status} - esperado 200`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/manifest+json')) {
        throw new Error(`Content-Type ${contentType} - esperado application/manifest+json`);
      }
      return '✅ Manifest PWA OK';
    }
  },
  {
    name: 'API Health Check',
    url: 'https://www.goldeouro.lol/api/health',
    validate: (response) => {
      if (response.status !== 200) {
        throw new Error(`Status ${response.status} - esperado 200`);
      }
      return response.json().then(data => {
        if (!data.status || data.status !== 'healthy') {
          throw new Error(`API não está saudável: ${JSON.stringify(data)}`);
        }
        return '✅ API Health OK';
      });
    }
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const result = await test.validate(response);
      
      console.log(`   ${result}\n`);
      passed++;
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 RESUMO DOS TESTES:');
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Produção está OK.');
    process.exit(0);
  } else {
    console.log('\n💥 ALGUNS TESTES FALHARAM! Verificar configurações.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
