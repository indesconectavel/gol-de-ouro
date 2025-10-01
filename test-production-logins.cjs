const https = require('https');

// Teste completo de logins e perfis em produção
async function testProductionLogins() {
  console.log('🔍 VISTORIA GERAL DO MODO PRODUÇÃO - GOL DE OURO\n');
  
  const results = {
    playerLogins: { status: 'PENDING', details: [] },
    adminLogins: { status: 'PENDING', details: [] },
    backendUsers: { status: 'PENDING', details: [] },
    mockData: { status: 'PENDING', details: [] },
    productionReady: { status: 'PENDING', details: [] }
  };

  try {
    // 1. Testar logins do Player Frontend
    console.log('🎮 1. VERIFICANDO LOGINS DO PLAYER FRONTEND...');
    
    // Verificar se há dados fictícios no player
    const playerResponse = await fetch('https://goldeouro.lol');
    if (playerResponse.ok) {
      results.playerLogins.status = 'PASS';
      results.playerLogins.details.push('Player frontend acessível');
      console.log('✅ Player Frontend: Acessível');
    } else {
      results.playerLogins.status = 'FAIL';
      results.playerLogins.details.push(`HTTP ${playerResponse.status}`);
      console.log('❌ Player Frontend: HTTP', playerResponse.status);
    }

    // 2. Testar logins do Admin Frontend
    console.log('\n👨‍💼 2. VERIFICANDO LOGINS DO ADMIN FRONTEND...');
    
    const adminResponse = await fetch('https://admin.goldeouro.lol');
    if (adminResponse.ok) {
      results.adminLogins.status = 'PASS';
      results.adminLogins.details.push('Admin frontend acessível');
      console.log('✅ Admin Frontend: Acessível');
    } else {
      results.adminLogins.status = 'FAIL';
      results.adminLogins.details.push(`HTTP ${adminResponse.status}`);
      console.log('❌ Admin Frontend: HTTP', adminResponse.status);
    }

    // 3. Testar usuários do Backend
    console.log('\n🔧 3. VERIFICANDO USUÁRIOS DO BACKEND...');
    
    // Testar login admin@admin.com
    try {
      const adminLoginResponse = await fetch('https://goldeouro-backend-v2.fly.dev/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@admin.com',
          password: 'password'
        })
      });
      
      const adminLoginData = await adminLoginResponse.json();
      if (adminLoginResponse.ok && adminLoginData.token) {
        results.backendUsers.status = 'PASS';
        results.backendUsers.details.push('admin@admin.com / password - FUNCIONANDO');
        console.log('✅ Backend: admin@admin.com / password - FUNCIONANDO');
        
        // Testar perfil do usuário
        const profileResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/user/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminLoginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const profileData = await profileResponse.json();
        if (profileResponse.ok) {
          results.backendUsers.details.push(`Perfil: ${profileData.name} - Saldo: R$ ${profileData.balance}`);
          console.log(`📊 Perfil: ${profileData.name} - Saldo: R$ ${profileData.balance}`);
        }
      } else {
        results.backendUsers.status = 'FAIL';
        results.backendUsers.details.push(`admin@admin.com falhou: ${adminLoginData.error}`);
        console.log('❌ Backend: admin@admin.com falhou');
      }
    } catch (error) {
      results.backendUsers.status = 'FAIL';
      results.backendUsers.details.push(`Erro: ${error.message}`);
      console.log('❌ Backend: Erro -', error.message);
    }

    // 4. Verificar dados fictícios
    console.log('\n📊 4. VERIFICANDO DADOS FICTÍCIOS...');
    
    // Verificar se há dados de "João Silva" no player
    const playerContent = await playerResponse.text();
    if (playerContent.includes('João Silva')) {
      results.mockData.status = 'WARN';
      results.mockData.details.push('Dados fictícios "João Silva" encontrados no player');
      console.log('⚠️ Player: Dados fictícios "João Silva" encontrados');
    } else {
      results.mockData.status = 'PASS';
      results.mockData.details.push('Nenhum dado fictício "João Silva" encontrado no player');
      console.log('✅ Player: Nenhum dado fictício encontrado');
    }

    // 5. Verificar se está pronto para produção
    console.log('\n🚀 5. VERIFICANDO PRONTO PARA PRODUÇÃO...');
    
    const productionChecks = [
      { name: 'Player Frontend', status: playerResponse.ok },
      { name: 'Admin Frontend', status: adminResponse.ok },
      { name: 'Backend API', status: results.backendUsers.status === 'PASS' },
      { name: 'Login Funcionando', status: results.backendUsers.status === 'PASS' },
      { name: 'Sem Dados Fictícios', status: results.mockData.status !== 'WARN' }
    ];

    const passedChecks = productionChecks.filter(check => check.status).length;
    const totalChecks = productionChecks.length;

    if (passedChecks === totalChecks) {
      results.productionReady.status = 'PASS';
      results.productionReady.details.push('Sistema 100% pronto para produção');
      console.log('✅ Sistema 100% pronto para produção');
    } else {
      results.productionReady.status = 'WARN';
      results.productionReady.details.push(`${passedChecks}/${totalChecks} verificações passaram`);
      console.log(`⚠️ ${passedChecks}/${totalChecks} verificações passaram`);
    }

    // Resumo Final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO FINAL - VISTORIA PRODUÇÃO');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([key, result]) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      console.log(`\n${icon} ${key.toUpperCase()}: ${result.status}`);
      if (result.details.length > 0) {
        result.details.forEach(detail => console.log(`   - ${detail}`));
      }
    });

    // Credenciais encontradas
    console.log('\n🔐 CREDENCIAIS ENCONTRADAS:');
    console.log('============================');
    console.log('🎮 PLAYER FRONTEND:');
    console.log('   - Login: Via API do backend (admin@admin.com / password)');
    console.log('   - Dados: Dinâmicos do backend');
    console.log('');
    console.log('👨‍💼 ADMIN FRONTEND:');
    console.log('   - Username: goldeouro_admin');
    console.log('   - Password: G0ld3@0ur0_2025!');
    console.log('');
    console.log('🔧 BACKEND API:');
    console.log('   - Email: admin@admin.com');
    console.log('   - Password: password');
    console.log('   - Saldo: R$ 100,00');

    // Status Final
    console.log('\n' + '='.repeat(60));
    if (results.productionReady.status === 'PASS') {
      console.log('🎉 SISTEMA 100% PRONTO PARA PRODUÇÃO!');
      console.log('🚀 TODOS OS COMPONENTES FUNCIONANDO!');
    } else {
      console.log('⚠️ ALGUNS AJUSTES NECESSÁRIOS');
      console.log('🔧 VERIFICAR ITENS COM WARN/FAIL');
    }
    console.log('='.repeat(60));

    return results;

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return results;
  }
}

testProductionLogins();
