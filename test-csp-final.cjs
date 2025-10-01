const https = require('https');

// Teste final do CSP com cache-busting
async function testCSPFinal() {
  console.log('🔍 TESTE FINAL CSP COM CACHE-BUSTING\n');
  
  const timestamp = Date.now();
  const url = `https://admin.goldeouro.lol/login?v=${timestamp}`;
  
  try {
    console.log('📡 Fazendo requisição com cache-busting...');
    console.log('🔗 URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const headers = Object.fromEntries(response.headers.entries());
    const csp = headers['content-security-policy'];
    const cacheControl = headers['cache-control'];
    
    console.log('\n📊 RESULTADOS:');
    console.log('Status:', response.status);
    console.log('Cache-Control:', cacheControl);
    console.log('\n📄 CSP Header:');
    console.log(csp);
    
    if (csp && csp.includes('https://www.goldeouro.lol')) {
      console.log('\n✅ SUCESSO: CSP inclui goldeouro.lol');
      
      // Verificar se a imagem é acessível diretamente
      console.log('\n🖼️ Testando acesso direto à imagem...');
      try {
        const imgResponse = await fetch('https://www.goldeouro.lol/images/Gol_de_Ouro_Bg01.jpg');
        console.log('✅ Imagem acessível:', imgResponse.status);
      } catch (imgError) {
        console.log('❌ Imagem não acessível:', imgError.message);
      }
      
    } else {
      console.log('\n❌ PROBLEMA: CSP ainda não inclui goldeouro.lol');
    }
    
    console.log('\n🔄 INSTRUÇÕES PARA O USUÁRIO:');
    console.log('1. Abra uma janela anônima/privada');
    console.log('2. Acesse: https://admin.goldeouro.lol/login');
    console.log('3. Pressione Ctrl+F5 (hard refresh)');
    console.log('4. Verifique se a imagem de fundo aparece');
    console.log('5. Verifique se não há erros CSP no console');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testCSPFinal();
