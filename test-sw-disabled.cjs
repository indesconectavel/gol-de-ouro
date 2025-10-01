const https = require('https');

// Teste com Service Worker desabilitado
async function testSWDisabled() {
  console.log('🔍 TESTE COM SERVICE WORKER DESABILITADO\n');
  
  try {
    // Testar página principal
    console.log('📡 Testando página principal...');
    const response = await fetch('https://admin.goldeouro.lol/login');
    const headers = Object.fromEntries(response.headers.entries());
    
    console.log('📊 Status:', response.status);
    console.log('📄 CSP:', headers['content-security-policy']);
    console.log('🔧 SW-Allowed:', headers['service-worker-allowed']);
    
    // Testar Service Worker
    console.log('\n📡 Testando Service Worker...');
    try {
      const swResponse = await fetch('https://admin.goldeouro.lol/sw.js');
      console.log('📊 SW Status:', swResponse.status);
      const swHeaders = Object.fromEntries(swResponse.headers.entries());
      console.log('🔧 SW Headers:', swHeaders);
    } catch (swError) {
      console.log('❌ SW Erro:', swError.message);
    }
    
    // Testar imagem diretamente
    console.log('\n🖼️ Testando imagem diretamente...');
    try {
      const imgResponse = await fetch('https://www.goldeouro.lol/images/Gol_de_Ouro_Bg01.jpg');
      console.log('✅ Imagem Status:', imgResponse.status);
    } catch (imgError) {
      console.log('❌ Imagem Erro:', imgError.message);
    }
    
    console.log('\n🔄 INSTRUÇÕES PARA O USUÁRIO:');
    console.log('1. Abra uma janela anônima/privada');
    console.log('2. Acesse: https://admin.goldeouro.lol/login');
    console.log('3. Pressione Ctrl+F5 (hard refresh)');
    console.log('4. Abra DevTools > Application > Service Workers');
    console.log('5. Se houver SW ativo, clique em "Unregister"');
    console.log('6. Recarregue a página');
    console.log('7. Verifique se a imagem de fundo aparece');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSWDisabled();
