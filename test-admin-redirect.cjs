const https = require('https');

// Teste específico para verificar redirecionamento
async function testRedirect() {
  console.log('🔄 TESTE ESPECÍFICO DE REDIRECIONAMENTO\n');
  
  try {
    // Teste 1: Acesso direto à raiz
    console.log('1. Testando acesso direto à raiz...');
    const rootResponse = await fetch('https://admin.goldeouro.lol/', {
      redirect: 'manual'
    });
    
    console.log(`   Status: ${rootResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(rootResponse.headers.entries()))}`);
    
    if (rootResponse.status === 302 || rootResponse.status === 301) {
      console.log('   ✅ Redirecionamento detectado');
      console.log(`   📍 Para: ${rootResponse.headers.get('location')}`);
    } else {
      console.log('   ❌ Nenhum redirecionamento');
      
      // Verificar conteúdo
      const content = await rootResponse.text();
      console.log(`   📄 Tamanho do conteúdo: ${content.length} caracteres`);
      
      if (content.includes('login') || content.includes('Login')) {
        console.log('   ✅ Conteúdo contém referência ao login');
      } else if (content.includes('Painel') || content.includes('Dashboard')) {
        console.log('   ❌ Conteúdo mostra painel sem autenticação');
      } else {
        console.log('   ⚠️ Conteúdo inesperado');
        console.log(`   📄 Primeiros 200 caracteres: ${content.substring(0, 200)}`);
      }
    }

    // Teste 2: Acesso à página de login
    console.log('\n2. Testando página de login...');
    const loginResponse = await fetch('https://admin.goldeouro.lol/login');
    
    if (loginResponse.ok) {
      console.log('   ✅ Página de login acessível');
      const loginContent = await loginResponse.text();
      
      if (loginContent.includes('G0ld3@0ur0_2025!')) {
        console.log('   ✅ Senha configurada no código');
      } else {
        console.log('   ⚠️ Senha não encontrada no código');
      }
      
      if (loginContent.includes('Verificando autenticação')) {
        console.log('   ✅ Loading de autenticação presente');
      } else {
        console.log('   ❌ Loading de autenticação ausente');
      }
    } else {
      console.log('   ❌ Página de login inacessível');
    }

    // Teste 3: Verificar se há JavaScript executando
    console.log('\n3. Verificando execução de JavaScript...');
    const jsResponse = await fetch('https://admin.goldeouro.lol/');
    const jsContent = await jsResponse.text();
    
    if (jsContent.includes('ProtectedRoute')) {
      console.log('   ✅ ProtectedRoute encontrado no código');
    } else {
      console.log('   ❌ ProtectedRoute não encontrado no código');
    }
    
    if (jsContent.includes('isAuthenticated')) {
      console.log('   ✅ isAuthenticated encontrado no código');
    } else {
      console.log('   ❌ isAuthenticated não encontrado no código');
    }

    // Teste 4: Verificar headers de cache
    console.log('\n4. Verificando headers de cache...');
    const cacheResponse = await fetch('https://admin.goldeouro.lol/', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`   ETag: ${cacheResponse.headers.get('etag')}`);
    console.log(`   Last-Modified: ${cacheResponse.headers.get('last-modified')}`);
    console.log(`   Cache-Control: ${cacheResponse.headers.get('cache-control')}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testRedirect();
