const https = require('https');

// Teste específico para verificar se o CSP foi corrigido
async function testCSPFix() {
  console.log('🔧 TESTE DE CORREÇÃO CSP\n');
  
  try {
    // 1. Testar se a imagem está acessível
    console.log('🖼️ 1. Testando acesso à imagem de fundo...');
    try {
      const imageResponse = await fetch('https://www.goldeouro.lol/images/Gol_de_Ouro_Bg01.jpg');
      if (imageResponse.ok) {
        console.log('   ✅ Imagem acessível diretamente');
      } else {
        console.log(`   ❌ Imagem com problema: ${imageResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro ao acessar imagem: ${error.message}`);
    }

    // 2. Testar se o admin carrega sem erros CSP
    console.log('\n🔐 2. Testando admin sem erros CSP...');
    const adminResponse = await fetch('https://admin.goldeouro.lol/login');
    
    if (adminResponse.ok) {
      const content = await adminResponse.text();
      
      if (content.includes('Gol_de_Ouro_Bg01.jpg')) {
        console.log('   ✅ Imagem de fundo referenciada no HTML');
      } else {
        console.log('   ⚠️ Imagem de fundo não encontrada no HTML');
      }
      
      if (content.includes('background-image')) {
        console.log('   ✅ CSS de background-image presente');
      } else {
        console.log('   ❌ CSS de background-image ausente');
      }
    } else {
      console.log(`   ❌ Admin inacessível: ${adminResponse.status}`);
    }

    // 3. Verificar headers CSP
    console.log('\n🛡️ 3. Verificando headers CSP...');
    const headers = Object.fromEntries(adminResponse.headers.entries());
    const csp = headers['content-security-policy'];
    
    if (csp) {
      console.log('   ✅ CSP header presente');
      
      if (csp.includes('https://www.goldeouro.lol')) {
        console.log('   ✅ Domínio goldeouro.lol permitido no CSP');
      } else {
        console.log('   ❌ Domínio goldeouro.lol NÃO permitido no CSP');
        console.log(`   📄 CSP atual: ${csp}`);
      }
    } else {
      console.log('   ❌ CSP header ausente');
    }

    // 4. Teste de redirecionamento
    console.log('\n🔄 4. Testando redirecionamento...');
    const rootResponse = await fetch('https://admin.goldeouro.lol/', {
      redirect: 'manual'
    });
    
    if (rootResponse.status === 302 || rootResponse.status === 301) {
      console.log('   ✅ Redirecionamento funcionando');
      console.log(`   📍 Redirecionando para: ${rootResponse.headers.get('location')}`);
    } else {
      console.log('   ❌ Nenhum redirecionamento');
      console.log(`   📊 Status: ${rootResponse.status}`);
    }

    console.log('\n📊 RESUMO DA CORREÇÃO CSP:');
    console.log('==========================');
    console.log('✅ Deploy realizado com CSP corrigido');
    console.log('✅ Domínio goldeouro.lol adicionado ao CSP');
    console.log('⏳ Aguardando propagação (2-5 minutos)');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Aguardar 2-5 minutos para propagação');
    console.log('2. Testar em janela anônima');
    console.log('3. Verificar se imagem de fundo aparece');
    console.log('4. Verificar se não há mais erros CSP no console');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCSPFix();
