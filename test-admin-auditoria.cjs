const https = require('https');

// Script de auditoria específica do admin
async function auditoriaAdmin() {
  console.log('🔍 AUDITORIA ESPECÍFICA DO ADMIN\n');
  
  const resultados = {
    deploy: false,
    login: false,
    redirecionamento: false,
    apis: false,
    dados: false,
    seguranca: false
  };

  try {
    // 1. Teste de Deploy
    console.log('🚀 1. Testando Deploy...');
    const adminResponse = await fetch('https://admin.goldeouro.lol/');
    console.log(`   Status: ${adminResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(adminResponse.headers.entries()))}`);
    
    if (adminResponse.status === 200) {
      resultados.deploy = true;
      console.log('   ✅ Deploy funcionando');
    } else {
      console.log('   ❌ Problema no deploy');
    }

    // 2. Teste de Login
    console.log('\n🔐 2. Testando Sistema de Login...');
    const loginResponse = await fetch('https://admin.goldeouro.lol/login');
    if (loginResponse.ok) {
      const loginContent = await loginResponse.text();
      if (loginContent.includes('G0ld3@0ur0_2025!')) {
        resultados.login = true;
        console.log('   ✅ Página de login acessível');
        console.log('   ✅ Senha configurada corretamente');
      } else {
        console.log('   ⚠️ Página de login sem senha configurada');
      }
    } else {
      console.log('   ❌ Página de login inacessível');
    }

    // 3. Teste de Redirecionamento
    console.log('\n🔄 3. Testando Redirecionamento...');
    const redirectResponse = await fetch('https://admin.goldeouro.lol/', {
      redirect: 'manual'
    });
    
    if (redirectResponse.status === 302 || redirectResponse.status === 301) {
      resultados.redirecionamento = true;
      console.log('   ✅ Redirecionamento funcionando');
      console.log(`   📍 Redirecionando para: ${redirectResponse.headers.get('location')}`);
    } else {
      console.log('   ❌ Nenhum redirecionamento detectado');
      console.log(`   📊 Status: ${redirectResponse.status}`);
    }

    // 4. Teste de APIs Backend
    console.log('\n🔧 4. Testando APIs do Backend...');
    try {
      const backendLogin = await fetch('https://goldeouro-backend-v2.fly.dev/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@admin.com',
          password: 'password'
        })
      });
      
      if (backendLogin.ok) {
        const loginData = await backendLogin.json();
        const token = loginData.token;
        
        // Testar API de estatísticas
        const statsResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (statsResponse.ok) {
          resultados.apis = true;
          console.log('   ✅ APIs do backend funcionando');
          
          const stats = await statsResponse.json();
          console.log('   📊 Dados atuais:');
          console.log(`      - Usuários: ${stats.totalUsers}`);
          console.log(`      - Ativos: ${stats.activeUsers}`);
          console.log(`      - Jogos: ${stats.totalGames}`);
          console.log(`      - Receita: R$ ${stats.totalRevenue}`);
          
          if (stats.totalUsers === 1 && stats.totalGames === 0) {
            resultados.dados = true;
            console.log('   ✅ Dados zerados corretamente');
          } else {
            console.log('   ⚠️ Dados não estão zerados como esperado');
          }
        } else {
          console.log('   ❌ APIs do backend com problema');
        }
      } else {
        console.log('   ❌ Login no backend falhou');
      }
    } catch (error) {
      console.log(`   ❌ Erro nas APIs: ${error.message}`);
    }

    // 5. Teste de Segurança
    console.log('\n🛡️ 5. Testando Segurança...');
    const adminContent = await fetch('https://admin.goldeouro.lol/').then(r => r.text());
    
    if (adminContent.includes('login') || adminContent.includes('Login')) {
      resultados.seguranca = true;
      console.log('   ✅ Admin exige autenticação');
    } else if (adminContent.includes('Painel') || adminContent.includes('Dashboard')) {
      console.log('   ❌ Admin permite acesso direto - FALHA DE SEGURANÇA');
    } else {
      console.log('   ⚠️ Resposta inesperada do admin');
    }

    // 6. Teste de Imagem de Fundo
    console.log('\n🖼️ 6. Testando Imagem de Fundo...');
    try {
      const imageResponse = await fetch('https://www.goldeouro.lol/images/Gol_de_Ouro_Bg01.jpg');
      if (imageResponse.ok) {
        console.log('   ✅ Imagem de fundo acessível');
      } else {
        console.log('   ❌ Imagem de fundo inacessível');
      }
    } catch (error) {
      console.log(`   ❌ Erro ao testar imagem: ${error.message}`);
    }

    // 7. Resumo Final
    console.log('\n📊 RESUMO DA AUDITORIA:');
    console.log('========================');
    console.log(`Deploy: ${resultados.deploy ? '✅' : '❌'}`);
    console.log(`Login: ${resultados.login ? '✅' : '❌'}`);
    console.log(`Redirecionamento: ${resultados.redirecionamento ? '✅' : '❌'}`);
    console.log(`APIs Backend: ${resultados.apis ? '✅' : '❌'}`);
    console.log(`Dados Zerados: ${resultados.dados ? '✅' : '❌'}`);
    console.log(`Segurança: ${resultados.seguranca ? '✅' : '❌'}`);

    const totalPassou = Object.values(resultados).filter(Boolean).length;
    const totalTestes = Object.keys(resultados).length;
    const percentual = Math.round((totalPassou / totalTestes) * 100);

    console.log(`\n🎯 RESULTADO FINAL: ${percentual}% (${totalPassou}/${totalTestes})`);
    
    if (percentual >= 80) {
      console.log('✅ ADMIN FUNCIONANDO BEM');
    } else if (percentual >= 60) {
      console.log('⚠️ ADMIN COM PROBLEMAS MENORES');
    } else {
      console.log('❌ ADMIN COM PROBLEMAS CRÍTICOS');
    }

  } catch (error) {
    console.error('❌ Erro geral na auditoria:', error.message);
  }
}

auditoriaAdmin();
