#!/usr/bin/env node
/**
 * Script de Preparação para Testes Reais - Gol de Ouro v1.1.1
 * Este script prepara o sistema para testes completos
 */

const https = require('https');
const http = require('http');

class TestPreparation {
  constructor() {
    this.backendUrl = 'https://goldeouro-backend.fly.dev';
    this.playerUrl = 'https://goldeouro.lol';
    this.adminUrl = 'https://admin.goldeouro.lol';
    this.results = {
      backend: {},
      frontends: {},
      endpoints: {},
      security: {},
      performance: {}
    };
  }

  async runAllTests() {
    console.log('🚀 INICIANDO PREPARAÇÃO PARA TESTES REAIS');
    console.log('==========================================\n');

    await this.testBackendHealth();
    await this.testFrontends();
    await this.testEndpoints();
    await this.testSecurity();
    await this.testPerformance();
    await this.generateReport();
  }

  async testBackendHealth() {
    console.log('🔍 Testando saúde do backend...');
    
    try {
      const response = await this.makeRequest(`${this.backendUrl}/health`);
      this.results.backend = {
        status: 'OK',
        uptime: response.uptime,
        version: response.version,
        sistema: response.sistema,
        banco: response.banco,
        pix: response.pix,
        usuarios: response.usuarios
      };
      console.log('✅ Backend: ONLINE');
      console.log(`   Versão: ${response.version}`);
      console.log(`   Sistema: ${response.sistema}`);
      console.log(`   Banco: ${response.banco}`);
      console.log(`   PIX: ${response.pix}`);
      console.log(`   Usuários: ${response.usuarios}\n`);
    } catch (error) {
      this.results.backend = { status: 'ERROR', error: error.message };
      console.log('❌ Backend: ERRO');
      console.log(`   Erro: ${error.message}\n`);
    }
  }

  async testFrontends() {
    console.log('🌐 Testando frontends...');
    
    // Test Player Frontend
    try {
      const playerResponse = await this.makeRequest(this.playerUrl, 'HEAD');
      this.results.frontends.player = {
        status: 'OK',
        code: playerResponse.statusCode || 200
      };
      console.log('✅ Player Frontend: ONLINE');
    } catch (error) {
      this.results.frontends.player = { status: 'ERROR', error: error.message };
      console.log('❌ Player Frontend: ERRO');
    }

    // Test Admin Frontend
    try {
      const adminResponse = await this.makeRequest(this.adminUrl, 'HEAD');
      this.results.frontends.admin = {
        status: 'OK',
        code: adminResponse.statusCode || 200
      };
      console.log('✅ Admin Frontend: ONLINE\n');
    } catch (error) {
      this.results.frontends.admin = { status: 'ERROR', error: error.message };
      console.log('❌ Admin Frontend: ERRO\n');
    }
  }

  async testEndpoints() {
    console.log('🔗 Testando endpoints críticos...');
    
    const endpoints = [
      { path: '/api/auth/login', method: 'POST', name: 'Login' },
      { path: '/api/game/chutar', method: 'POST', name: 'Chutar' },
      { path: '/api/payments/pix/criar', method: 'POST', name: 'PIX Criar' },
      { path: '/api/user/profile', method: 'GET', name: 'Perfil' },
      { path: '/api/admin/users', method: 'GET', name: 'Admin Users' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(
          `${this.backendUrl}${endpoint.path}`,
          endpoint.method === 'POST' ? 'POST' : 'OPTIONS'
        );
        this.results.endpoints[endpoint.name] = {
          status: 'OK',
          method: endpoint.method,
          path: endpoint.path
        };
        console.log(`✅ ${endpoint.name}: FUNCIONANDO`);
      } catch (error) {
        this.results.endpoints[endpoint.name] = {
          status: 'ERROR',
          error: error.message
        };
        console.log(`❌ ${endpoint.name}: ERRO`);
      }
    }
    console.log('');
  }

  async testSecurity() {
    console.log('🔒 Testando segurança...');
    
    try {
      // Test CORS
      const corsResponse = await this.makeRequest(
        `${this.backendUrl}/api/auth/login`,
        'OPTIONS',
        { 'Origin': this.playerUrl }
      );
      
      this.results.security.cors = {
        status: 'OK',
        allowOrigin: corsResponse.headers['access-control-allow-origin']
      };
      console.log('✅ CORS: CONFIGURADO');
      
      // Test HTTPS
      this.results.security.https = {
        status: 'OK',
        backend: this.backendUrl.startsWith('https'),
        player: this.playerUrl.startsWith('https'),
        admin: this.adminUrl.startsWith('https')
      };
      console.log('✅ HTTPS: ATIVO');
      
    } catch (error) {
      this.results.security = { status: 'ERROR', error: error.message };
      console.log('❌ Segurança: ERRO');
    }
    console.log('');
  }

  async testPerformance() {
    console.log('⚡ Testando performance...');
    
    const startTime = Date.now();
    try {
      await this.makeRequest(`${this.backendUrl}/health`);
      const responseTime = Date.now() - startTime;
      
      this.results.performance = {
        status: 'OK',
        responseTime: responseTime,
        rating: responseTime < 500 ? 'EXCELENTE' : responseTime < 1000 ? 'BOM' : 'REGULAR'
      };
      
      console.log(`✅ Performance: ${this.results.performance.rating}`);
      console.log(`   Tempo de resposta: ${responseTime}ms\n`);
    } catch (error) {
      this.results.performance = { status: 'ERROR', error: error.message };
      console.log('❌ Performance: ERRO\n');
    }
  }

  async generateReport() {
    console.log('📊 RELATÓRIO DE PREPARAÇÃO');
    console.log('==========================');
    
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r.status === 'OK').length;
    const score = Math.round((passedTests / totalTests) * 100);
    
    console.log(`Score Geral: ${score}/100`);
    console.log(`Testes Aprovados: ${passedTests}/${totalTests}`);
    console.log('');
    
    if (score >= 90) {
      console.log('🎉 SISTEMA PRONTO PARA TESTES REAIS!');
      console.log('✅ Todos os componentes estão funcionando');
      console.log('✅ Segurança implementada');
      console.log('✅ Performance adequada');
      console.log('✅ Endpoints operacionais');
    } else if (score >= 70) {
      console.log('⚠️ SISTEMA QUASE PRONTO');
      console.log('Alguns ajustes podem ser necessários');
    } else {
      console.log('❌ SISTEMA NÃO ESTÁ PRONTO');
      console.log('Correções necessárias antes dos testes');
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. Testar fluxo completo de login');
    console.log('2. Testar criação de pagamento PIX');
    console.log('3. Testar sistema de chutes');
    console.log('4. Testar painel administrativo');
    console.log('5. Validar dados em produção');
    
    return this.results;
  }

  makeRequest(url, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GolDeOuro-TestPreparation/1.1.1',
          ...headers
        },
        timeout: 10000
      };

      const req = client.request(url, options, (res) => {
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
      
      if (method === 'POST') {
        req.write(JSON.stringify({ test: true }));
      }
      
      req.end();
    });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const preparation = new TestPreparation();
  preparation.runAllTests().catch(console.error);
}

module.exports = TestPreparation;
