const https = require('https');

// Verificar se o CSP foi atualizado
async function verificarCSP() {
  console.log('🔍 VERIFICANDO CSP APÓS DEPLOY\n');
  
  try {
    const response = await fetch('https://admin.goldeouro.lol/login');
    const headers = Object.fromEntries(response.headers.entries());
    const csp = headers['content-security-policy'];
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📄 CSP atual:');
    console.log(csp);
    
    if (csp && csp.includes('https://www.goldeouro.lol')) {
      console.log('\n✅ SUCESSO: Domínio goldeouro.lol está permitido no CSP');
      
      if (csp.includes('connect-src') && csp.includes('https://www.goldeouro.lol')) {
        console.log('✅ connect-src inclui goldeouro.lol');
      } else {
        console.log('❌ connect-src NÃO inclui goldeouro.lol');
      }
      
      if (csp.includes('img-src') && csp.includes('https://www.goldeouro.lol')) {
        console.log('✅ img-src inclui goldeouro.lol');
      } else {
        console.log('❌ img-src NÃO inclui goldeouro.lol');
      }
      
    } else {
      console.log('\n❌ PROBLEMA: Domínio goldeouro.lol NÃO está permitido no CSP');
      console.log('🔄 Aguardando propagação ou deploy não foi aplicado');
    }
    
    console.log('\n⏰ Aguarde 2-3 minutos e teste novamente no navegador');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarCSP();
