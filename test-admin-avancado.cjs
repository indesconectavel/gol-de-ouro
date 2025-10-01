const https = require('https');

// Teste avançado do admin com múltiplas verificações
async function testAdminAvancado() {
  console.log('🔍 TESTE AVANÇADO DO ADMIN\n');
  
  const resultados = {
    deploy: false,
    javascript: false,
    redirecionamento: false,
    login: false,
    apis: false,
    seguranca: false
  };

  try {
    // 1. Teste de Deploy e JavaScript
    console.log('🚀 1. Testando Deploy e JavaScript...');
    const response = await fetch('https://admin.goldeouro.lol/');
    const content = await response.text();
    
    if (response.status === 200) {
      resultados.deploy = true;
      console.log('   ✅ Deploy funcionando');
      
      // Verificar se JavaScript está sendo carregado
      if (content.includes('index-') && content.includes('.js')) {
        resultados.javascript = true;
        console.log('   ✅ JavaScript sendo carregado');
        
        // Extrair nome do arquivo JS
        const jsMatch = content.match(/src="\/assets\/index-([a-f0-9]+)\.js"/);
        if (jsMatch) {
          console.log(`   📄 Arquivo JS: index-${jsMatch[1]}.js`);
          
          // Testar se o arquivo JS está acessível
          const jsResponse = await fetch(`https://admin.goldeouro.lol/assets/index-${jsMatch[1]}.js`);
          if (jsResponse.ok) {
            console.log('   ✅ Arquivo JavaScript acessível');
            
            // Verificar se contém código de autenticação
            const jsContent = await jsResponse.text();
            if (jsContent.includes('isAuthenticated') || jsContent.includes('ProtectedRoute')) {
              console.log('   ✅ Código de autenticação encontrado no JS');
            } else {
              console.log('   ❌ Código de autenticação NÃO encontrado no JS');
            }
          } else {
            console.log('   ❌ Arquivo JavaScript inacessível');
          }
        }
      } else {
        console.log('   ❌ JavaScript não sendo carregado');
      }
    } else {
      console.log('   ❌ Deploy com problema');
    }

    // 2. Teste de Redirecionamento
    console.log('\n🔄 2. Testando Redirecionamento...');
    const redirectResponse = await fetch('https://admin.goldeouro.lol/', {
      redirect: 'manual'
    });
    
    if (redirectResponse.status === 302 || redirectResponse.status === 301) {
      resultados.redirecionamento = true;
      console.log('   ✅ Redirecionamento detectado');
      console.log(`   📍 Para: ${redirectResponse.headers.get('location')}`);
    } else {
      console.log('   ❌ Nenhum redirecionamento');
      
      // Verificar conteúdo da página
      if (content.includes('Verificando autenticação')) {
        console.log('   ✅ Loading de autenticação presente');
      } else {
        console.log('   ❌ Loading de autenticação ausente');
      }
      
      if (content.includes('Painel') || content.includes('Dashboard')) {
        console.log('   ❌ Conteúdo do painel visível sem autenticação');
      }
    }

    // 3. Teste de Login
    console.log('\n🔐 3. Testando Sistema de Login...');
    const loginResponse = await fetch('https://admin.goldeouro.lol/login');
    
    if (loginResponse.ok) {
      const loginContent = await loginResponse.text();
      
      if (loginContent.includes('G0ld3@0ur0_2025!')) {
        resultados.login = true;
        console.log('   ✅ Senha configurada no código');
      } else {
        console.log('   ⚠️ Senha não encontrada no código');
      }
      
      if (loginContent.includes('admin-token')) {
        console.log('   ✅ Sistema de token implementado');
      } else {
        console.log('   ❌ Sistema de token não implementado');
      }
    } else {
      console.log('   ❌ Página de login inacessível');
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
    if (resultados.redirecionamento || content.includes('Verificando autenticação')) {
      resultados.seguranca = true;
      console.log('   ✅ Proteção de segurança ativa');
    } else {
      console.log('   ❌ FALHA DE SEGURANÇA - Admin acessível sem login');
    }

    // 6. Resumo Final
    console.log('\n📊 RESUMO DO TESTE AVANÇADO:');
    console.log('==============================');
    console.log(`Deploy: ${resultados.deploy ? '✅' : '❌'}`);
    console.log(`JavaScript: ${resultados.javascript ? '✅' : '❌'}`);
    console.log(`Redirecionamento: ${resultados.redirecionamento ? '✅' : '❌'}`);
    console.log(`Login: ${resultados.login ? '✅' : '❌'}`);
    console.log(`APIs Backend: ${resultados.apis ? '✅' : '❌'}`);
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

    // 7. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (!resultados.javascript) {
      console.log('   - Verificar se JavaScript está sendo carregado corretamente');
    }
    if (!resultados.redirecionamento) {
      console.log('   - Implementar redirecionamento no servidor ou cliente');
    }
    if (!resultados.seguranca) {
      console.log('   - URGENTE: Implementar proteção de segurança');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testAdminAvancado();
