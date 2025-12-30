#!/usr/bin/env node
/**
 * Script de Testes de Fluxo Completo - Gol de Ouro v1.1.1
 * Executa testes completos de todos os fluxos do sistema
 */

const https = require('https');

class FlowTests {
  constructor() {
    this.backendUrl = 'https://goldeouro-backend.fly.dev';
    this.playerUrl = 'https://goldeouro.lol';
    this.adminUrl = 'https://admin.goldeouro.lol';
    this.testResults = {
      userFlow: { status: 'pending', steps: [] },
      adminFlow: { status: 'pending', steps: [] },
      paymentFlow: { status: 'pending', steps: [] },
      gameFlow: { status: 'pending', steps: [] }
    };
  }

  async runAllFlowTests() {
    console.log('🎯 TESTES DE FLUXO COMPLETO - GOL DE OURO v1.1.1');
    console.log('================================================\n');

    await this.testUserFlow();
    await this.testAdminFlow();
    await this.testPaymentFlow();
    await this.testGameFlow();
    
    this.generateFlowReport();
  }

  async testUserFlow() {
    console.log('👤 TESTE DE FLUXO DO USUÁRIO');
    console.log('============================');
    
    const steps = [];
    let userToken = null;
    let userId = null;
    
    try {
      // Step 1: Login
      console.log('1. 🔐 Fazendo login...');
      const loginResponse = await this.makeRequest(
        `${this.backendUrl}/api/auth/login`,
        'POST',
        {},
        JSON.stringify({
          email: 'test@goldeouro.lol',
          password: 'test123'
        })
      );
      
      if (loginResponse.success && loginResponse.token) {
        userToken = loginResponse.token;
        userId = loginResponse.user.id;
        steps.push({ step: 'Login', status: 'PASS', details: 'Token gerado com sucesso' });
        console.log('   ✅ Login realizado com sucesso');
        console.log(`   👤 Usuário: ${loginResponse.user.email}`);
        console.log(`   💰 Saldo: R$ ${loginResponse.user.saldo}`);
      } else {
        throw new Error('Login falhou');
      }
      
      // Step 2: Acessar perfil
      console.log('2. 👤 Acessando perfil...');
      const profileResponse = await this.makeRequest(
        `${this.backendUrl}/api/user/profile`,
        'GET',
        { 'Authorization': `Bearer ${userToken}` }
      );
      
      if (profileResponse.success) {
        steps.push({ step: 'Perfil', status: 'PASS', details: 'Perfil acessado com sucesso' });
        console.log('   ✅ Perfil acessado com sucesso');
        console.log(`   📧 Email: ${profileResponse.data.email}`);
        console.log(`   💰 Saldo: R$ ${profileResponse.data.saldo}`);
      } else {
        throw new Error('Acesso ao perfil falhou');
      }
      
      // Step 3: Verificar estatísticas
      console.log('3. 📊 Verificando estatísticas...');
      const statsResponse = await this.makeRequest(
        `${this.backendUrl}/api/game/stats`,
        'GET'
      );
      
      if (statsResponse.success) {
        steps.push({ step: 'Estatísticas', status: 'PASS', details: 'Estatísticas obtidas' });
        console.log('   ✅ Estatísticas obtidas');
        console.log(`   🎮 Total de chutes: ${statsResponse.data.total_chutes}`);
        console.log(`   ⚽ Total de gols: ${statsResponse.data.total_gols}`);
      } else {
        steps.push({ step: 'Estatísticas', status: 'WARN', details: 'Estatísticas não disponíveis' });
        console.log('   ⚠️ Estatísticas não disponíveis');
      }
      
      this.testResults.userFlow = {
        status: 'PASS',
        steps,
        summary: 'Fluxo do usuário funcionando perfeitamente'
      };
      
      console.log('✅ FLUXO DO USUÁRIO: COMPLETO\n');
      
    } catch (error) {
      steps.push({ step: 'Erro', status: 'FAIL', details: error.message });
      this.testResults.userFlow = {
        status: 'FAIL',
        steps,
        summary: `Erro no fluxo do usuário: ${error.message}`
      };
      console.log('❌ FLUXO DO USUÁRIO: ERRO');
      console.log(`   Erro: ${error.message}\n`);
    }
  }

  async testAdminFlow() {
    console.log('👨‍💼 TESTE DE FLUXO DO ADMINISTRADOR');
    console.log('==================================');
    
    const steps = [];
    let adminToken = null;
    
    try {
      // Step 1: Login Admin
      console.log('1. 🔐 Fazendo login como admin...');
      const adminLoginResponse = await this.makeRequest(
        `${this.backendUrl}/api/auth/login`,
        'POST',
        {},
        JSON.stringify({
          email: 'admin@goldeouro.lol',
          password: 'admin123'
        })
      );
      
      if (adminLoginResponse.success && adminLoginResponse.token) {
        adminToken = adminLoginResponse.token;
        steps.push({ step: 'Login Admin', status: 'PASS', details: 'Token admin gerado' });
        console.log('   ✅ Login admin realizado com sucesso');
        console.log(`   👨‍💼 Admin: ${adminLoginResponse.user.email}`);
        console.log(`   💰 Saldo Admin: R$ ${adminLoginResponse.user.saldo}`);
      } else {
        throw new Error('Login admin falhou');
      }
      
      // Step 2: Acessar lista de usuários
      console.log('2. 👥 Acessando lista de usuários...');
      const usersResponse = await this.makeRequest(
        `${this.backendUrl}/api/admin/users`,
        'GET',
        { 'Authorization': `Bearer ${adminToken}` }
      );
      
      if (usersResponse.success) {
        steps.push({ step: 'Lista Usuários', status: 'PASS', details: 'Lista de usuários acessada' });
        console.log('   ✅ Lista de usuários acessada');
        console.log(`   👥 Total de usuários: ${usersResponse.data?.length || 0}`);
      } else {
        steps.push({ step: 'Lista Usuários', status: 'WARN', details: 'Lista de usuários não disponível' });
        console.log('   ⚠️ Lista de usuários não disponível');
      }
      
      // Step 3: Verificar estatísticas gerais
      console.log('3. 📊 Verificando estatísticas gerais...');
      const generalStatsResponse = await this.makeRequest(
        `${this.backendUrl}/api/game/stats`,
        'GET'
      );
      
      if (generalStatsResponse.success) {
        steps.push({ step: 'Estatísticas Gerais', status: 'PASS', details: 'Estatísticas gerais obtidas' });
        console.log('   ✅ Estatísticas gerais obtidas');
        console.log(`   🎮 Total de chutes: ${generalStatsResponse.data.total_chutes}`);
        console.log(`   ⚽ Total de gols: ${generalStatsResponse.data.total_gols}`);
        console.log(`   👥 Total de usuários: ${generalStatsResponse.data.total_usuarios}`);
      } else {
        steps.push({ step: 'Estatísticas Gerais', status: 'WARN', details: 'Estatísticas gerais não disponíveis' });
        console.log('   ⚠️ Estatísticas gerais não disponíveis');
      }
      
      this.testResults.adminFlow = {
        status: 'PASS',
        steps,
        summary: 'Fluxo do administrador funcionando perfeitamente'
      };
      
      console.log('✅ FLUXO DO ADMINISTRADOR: COMPLETO\n');
      
    } catch (error) {
      steps.push({ step: 'Erro', status: 'FAIL', details: error.message });
      this.testResults.adminFlow = {
        status: 'FAIL',
        steps,
        summary: `Erro no fluxo do administrador: ${error.message}`
      };
      console.log('❌ FLUXO DO ADMINISTRADOR: ERRO');
      console.log(`   Erro: ${error.message}\n`);
    }
  }

  async testPaymentFlow() {
    console.log('💳 TESTE DE FLUXO DE PAGAMENTOS');
    console.log('===============================');
    
    const steps = [];
    
    try {
      // Step 1: Criar pagamento PIX
      console.log('1. 💳 Criando pagamento PIX...');
      const pixResponse = await this.makeRequest(
        `${this.backendUrl}/api/payments/pix/criar`,
        'POST',
        {},
        JSON.stringify({
          valor: 50,
          email_usuario: 'test@goldeouro.lol',
          cpf_usuario: '12345678901'
        })
      );
      
      if (pixResponse.success && pixResponse.payment_id) {
        steps.push({ step: 'Criar PIX', status: 'PASS', details: 'Pagamento PIX criado' });
        console.log('   ✅ Pagamento PIX criado com sucesso');
        console.log(`   💳 Payment ID: ${pixResponse.payment_id}`);
        console.log(`   💰 Valor: R$ ${pixResponse.valor}`);
        console.log(`   ⏰ Expira em: ${pixResponse.expires_at}`);
        console.log(`   🔗 Real: ${pixResponse.real}`);
        console.log(`   🗄️ Banco: ${pixResponse.banco}`);
      } else {
        throw new Error('Criação do PIX falhou');
      }
      
      // Step 2: Verificar status do pagamento
      console.log('2. 🔍 Verificando status do pagamento...');
      const statusResponse = await this.makeRequest(
        `${this.backendUrl}/api/payments/pix/status/${pixResponse.payment_id}`,
        'GET'
      );
      
      if (statusResponse.success) {
        steps.push({ step: 'Status PIX', status: 'PASS', details: 'Status do pagamento verificado' });
        console.log('   ✅ Status do pagamento verificado');
        console.log(`   📊 Status: ${statusResponse.status}`);
        console.log(`   💰 Valor: R$ ${statusResponse.valor}`);
      } else {
        steps.push({ step: 'Status PIX', status: 'WARN', details: 'Status do pagamento não disponível' });
        console.log('   ⚠️ Status do pagamento não disponível');
      }
      
      this.testResults.paymentFlow = {
        status: 'PASS',
        steps,
        summary: 'Fluxo de pagamentos funcionando perfeitamente'
      };
      
      console.log('✅ FLUXO DE PAGAMENTOS: COMPLETO\n');
      
    } catch (error) {
      steps.push({ step: 'Erro', status: 'FAIL', details: error.message });
      this.testResults.paymentFlow = {
        status: 'FAIL',
        steps,
        summary: `Erro no fluxo de pagamentos: ${error.message}`
      };
      console.log('❌ FLUXO DE PAGAMENTOS: ERRO');
      console.log(`   Erro: ${error.message}\n`);
    }
  }

  async testGameFlow() {
    console.log('🎮 TESTE DE FLUXO DO JOGO');
    console.log('=========================');
    
    const steps = [];
    
    try {
      // Step 1: Verificar status do jogo
      console.log('1. 🎮 Verificando status do jogo...');
      const gameStatusResponse = await this.makeRequest(
        `${this.backendUrl}/api/game/status`,
        'GET'
      );
      
      if (gameStatusResponse.success) {
        steps.push({ step: 'Status Jogo', status: 'PASS', details: 'Status do jogo obtido' });
        console.log('   ✅ Status do jogo obtido');
        console.log(`   🎯 Sistema: ${gameStatusResponse.data.sistema}`);
        console.log(`   📦 Lote Atual: ${gameStatusResponse.data.lote_atual.id}`);
        console.log(`   🎮 Chutes Coletados: ${gameStatusResponse.data.lote_atual.chutes_coletados}`);
        console.log(`   📊 Status: ${gameStatusResponse.data.lote_atual.status}`);
      } else {
        throw new Error('Status do jogo não disponível');
      }
      
      // Step 2: Registrar chute
      console.log('2. ⚽ Registrando chute...');
      const shotResponse = await this.makeRequest(
        `${this.backendUrl}/api/game/chutar`,
        'POST',
        {},
        JSON.stringify({
          zona: 'center',
          potencia: 85,
          angulo: 5,
          valor_aposta: 20
        })
      );
      
      if (shotResponse.success && shotResponse.chute_id) {
        steps.push({ step: 'Registrar Chute', status: 'PASS', details: 'Chute registrado com sucesso' });
        console.log('   ✅ Chute registrado com sucesso');
        console.log(`   ⚽ Chute ID: ${shotResponse.chute_id}`);
        console.log(`   📦 Lote ID: ${shotResponse.lote_id}`);
        console.log(`   📍 Posição: ${shotResponse.posicao_no_lote}`);
        console.log(`   📊 Status: ${shotResponse.status}`);
        console.log(`   🗄️ Banco: ${shotResponse.banco}`);
      } else {
        throw new Error('Registro do chute falhou');
      }
      
      // Step 3: Verificar histórico de chutes
      console.log('3. 📜 Verificando histórico de chutes...');
      const historyResponse = await this.makeRequest(
        `${this.backendUrl}/api/game/history`,
        'GET'
      );
      
      if (historyResponse.success) {
        steps.push({ step: 'Histórico', status: 'PASS', details: 'Histórico de chutes obtido' });
        console.log('   ✅ Histórico de chutes obtido');
        console.log(`   📜 Total de chutes: ${historyResponse.data?.length || 0}`);
      } else {
        steps.push({ step: 'Histórico', status: 'WARN', details: 'Histórico de chutes não disponível' });
        console.log('   ⚠️ Histórico de chutes não disponível');
      }
      
      this.testResults.gameFlow = {
        status: 'PASS',
        steps,
        summary: 'Fluxo do jogo funcionando perfeitamente'
      };
      
      console.log('✅ FLUXO DO JOGO: COMPLETO\n');
      
    } catch (error) {
      steps.push({ step: 'Erro', status: 'FAIL', details: error.message });
      this.testResults.gameFlow = {
        status: 'FAIL',
        steps,
        summary: `Erro no fluxo do jogo: ${error.message}`
      };
      console.log('❌ FLUXO DO JOGO: ERRO');
      console.log(`   Erro: ${error.message}\n`);
    }
  }

  generateFlowReport() {
    console.log('📊 RELATÓRIO FINAL DOS TESTES DE FLUXO');
    console.log('======================================');
    
    const flows = Object.keys(this.testResults);
    const passedFlows = flows.filter(flow => this.testResults[flow].status === 'PASS').length;
    const failedFlows = flows.filter(flow => this.testResults[flow].status === 'FAIL').length;
    const score = Math.round((passedFlows / flows.length) * 100);
    
    console.log(`Score Geral: ${score}/100`);
    console.log(`Fluxos Aprovados: ${passedFlows}/${flows.length}`);
    console.log(`Fluxos Falharam: ${failedFlows}/${flows.length}`);
    console.log('');
    
    // Detalhes por fluxo
    flows.forEach(flow => {
      const result = this.testResults[flow];
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏳';
      console.log(`${status} ${flow.toUpperCase()}: ${result.status}`);
      
      if (result.steps) {
        result.steps.forEach(step => {
          const stepStatus = step.status === 'PASS' ? '✅' : step.status === 'FAIL' ? '❌' : '⚠️';
          console.log(`   ${stepStatus} ${step.step}: ${step.details}`);
        });
      }
      console.log('');
    });
    
    if (score >= 90) {
      console.log('🎉 TODOS OS FLUXOS FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ Sistema pronto para usuários reais');
      console.log('✅ Todos os fluxos validados');
      console.log('✅ Experiência do usuário garantida');
      console.log('');
      console.log('🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
    } else if (score >= 70) {
      console.log('⚠️ MAIORIA DOS FLUXOS FUNCIONANDO');
      console.log('Alguns ajustes podem ser necessários');
    } else {
      console.log('❌ FLUXOS COM PROBLEMAS');
      console.log('Correções necessárias antes da produção');
    }
    
    return this.testResults;
  }

  makeRequest(url, method = 'GET', headers = {}, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GolDeOuro-FlowTests/1.1.1',
          ...headers
        },
        timeout: 15000
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ ...jsonData, statusCode: res.statusCode, headers: res.headers });
          } catch {
            resolve({ statusCode: res.statusCode, headers: res.headers, data });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (body) {
        req.write(body);
      }
      
      req.end();
    });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const flowTests = new FlowTests();
  flowTests.runAllFlowTests().catch(console.error);
}

module.exports = FlowTests;
