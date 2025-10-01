const https = require('https');

// Teste específico do login do admin
async function testAdminLogin() {
  console.log('🔐 TESTANDO LOGIN DO ADMIN\n');
  
  try {
    // 1. Testar acesso direto ao admin
    console.log('🌐 1. Testando acesso direto ao admin...');
    
    const adminResponse = await fetch('https://admin.goldeouro.lol/');
    console.log(`📊 Status: ${adminResponse.status}`);
    
    const content = await adminResponse.text();
    console.log(`📄 Tamanho da resposta: ${content.length} caracteres`);
    
    if (content.includes('login') || content.includes('Login') || content.includes('senha')) {
      console.log('✅ Admin exige login!');
    } else if (content.includes('Painel') || content.includes('Dashboard')) {
      console.log('❌ Admin ainda permite acesso direto sem login');
    } else {
      console.log('⚠️ Resposta inesperada do admin');
    }

    // 2. Testar página de login específica
    console.log('\n🔑 2. Testando página de login...');
    
    const loginResponse = await fetch('https://admin.goldeouro.lol/login');
    console.log(`📊 Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      console.log('✅ Página de login acessível');
    } else {
      console.log('❌ Página de login não acessível');
    }

    // 3. Verificar se há redirecionamento
    console.log('\n🔄 3. Verificando redirecionamentos...');
    
    const redirectResponse = await fetch('https://admin.goldeouro.lol/', {
      redirect: 'manual'
    });
    
    console.log(`📊 Status: ${redirectResponse.status}`);
    if (redirectResponse.status === 302 || redirectResponse.status === 301) {
      console.log('✅ Redirecionamento detectado');
      console.log(`📍 Para: ${redirectResponse.headers.get('location')}`);
    } else {
      console.log('❌ Nenhum redirecionamento');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAdminLogin();
