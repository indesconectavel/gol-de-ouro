// Script para Criar Usuários de Teste em Staging
// FASE 2.5 - Setup de Ambiente de Testes

const axios = require('axios');
const testConfig = require('../config/testConfig');

/**
 * Script para criar usuários de teste no ambiente de staging
 * NÃO altera código de produção
 * Usa apenas endpoints públicos
 */
class TestUserSetup {
  constructor() {
    this.baseURL = testConfig.staging.baseURL;
    this.testUsers = {
      player: {
        email: `teste.player.${Date.now()}@goldeouro-test.com`,
        password: 'Teste123!@#',
        username: `teste_player_${Date.now()}`
      },
      admin: {
        email: `teste.admin.${Date.now()}@goldeouro-test.com`,
        password: 'Admin123!@#',
        username: `teste_admin_${Date.now()}`
      }
    };
  }

  /**
   * Verificar se usuário existe tentando login
   */
  async checkUserExists(email, password) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/auth/login`,
        { email, password },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return {
        exists: true,
        valid: response.data && response.data.success,
        token: response.data?.data?.token
      };
    } catch (error) {
      if (error.response?.status === 401) {
        return { exists: false, valid: false };
      }
      return { exists: false, valid: false, error: error.message };
    }
  }

  /**
   * Criar usuário de teste
   */
  async createTestUser(userData) {
    try {
      console.log(`📝 Criando usuário de teste: ${userData.email}`);
      
      const response = await axios.post(
        `${this.baseURL}/api/auth/register`,
        {
          email: userData.email,
          password: userData.password,
          username: userData.username
        },
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data.success) {
        console.log(`✅ Usuário criado com sucesso: ${userData.email}`);
        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        };
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };
    } catch (error) {
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('já cadastrado')) {
        console.log(`⚠️ Usuário já existe: ${userData.email}`);
        return {
          success: false,
          exists: true,
          error: 'Email já cadastrado'
        };
      }

      console.error(`❌ Erro ao criar usuário ${userData.email}:`, error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Setup completo de usuários de teste
   */
  async setup() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔧 SETUP DE USUÁRIOS DE TESTE - FASE 2.5');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🌐 Backend: ${this.baseURL}`);
    console.log('');

    const results = {
      player: null,
      admin: null,
      errors: []
    };

    // Verificar conectividade
    try {
      const healthCheck = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      console.log('✅ Backend acessível');
    } catch (error) {
      console.error('❌ Backend não acessível:', error.message);
      results.errors.push('Backend não acessível');
      return results;
    }

    console.log('');

    // Tentar usar credenciais existentes primeiro
    const existingPlayerEmail = process.env.TEST_PLAYER_EMAIL || testConfig.testCredentials.player.email;
    const existingPlayerPassword = process.env.TEST_PLAYER_PASSWORD || testConfig.testCredentials.player.password;

    console.log(`🔍 Verificando usuário player existente: ${existingPlayerEmail}`);
    const playerCheck = await this.checkUserExists(existingPlayerEmail, existingPlayerPassword);

    if (playerCheck.exists && playerCheck.valid) {
      console.log('✅ Usuário player existente é válido');
      results.player = {
        email: existingPlayerEmail,
        password: existingPlayerPassword,
        exists: true,
        token: playerCheck.token
      };
    } else {
      console.log('📝 Criando novo usuário player de teste...');
      const playerResult = await this.createTestUser(this.testUsers.player);
      
      if (playerResult.success) {
        results.player = {
          email: this.testUsers.player.email,
          password: this.testUsers.player.password,
          exists: false,
          created: true,
          userId: playerResult.user?.id
        };
      } else if (playerResult.exists) {
        // Se já existe, tentar login
        const loginCheck = await this.checkUserExists(
          this.testUsers.player.email,
          this.testUsers.player.password
        );
        if (loginCheck.valid) {
          results.player = {
            email: this.testUsers.player.email,
            password: this.testUsers.player.password,
            exists: true
          };
        } else {
          results.errors.push(`Usuário player já existe mas senha incorreta: ${this.testUsers.player.email}`);
        }
      } else {
        results.errors.push(`Erro ao criar usuário player: ${playerResult.error}`);
      }
    }

    console.log('');

    // Para admin, usar credenciais existentes ou token fixo
    const existingAdminEmail = process.env.TEST_ADMIN_EMAIL || testConfig.testCredentials.admin.email;
    const existingAdminPassword = process.env.TEST_ADMIN_PASSWORD || testConfig.testCredentials.admin.password;
    const adminToken = process.env.TEST_ADMIN_TOKEN || testConfig.testCredentials.admin.token;

    console.log(`🔍 Verificando usuário admin existente: ${existingAdminEmail}`);
    const adminCheck = await this.checkUserExists(existingAdminEmail, existingAdminPassword);

    if (adminCheck.exists && adminCheck.valid) {
      console.log('✅ Usuário admin existente é válido');
      results.admin = {
        email: existingAdminEmail,
        password: existingAdminPassword,
        token: adminToken,
        exists: true
      };
    } else {
      console.log('⚠️ Usuário admin não encontrado ou inválido');
      console.log('⚠️ Usando token admin fixo para testes');
      results.admin = {
        email: existingAdminEmail,
        password: existingAdminPassword,
        token: adminToken,
        exists: false,
        note: 'Usando token fixo'
      };
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMO DO SETUP');
    console.log('═══════════════════════════════════════════════════════');

    if (results.player) {
      console.log('✅ Player:', results.player.email);
    } else {
      console.log('❌ Player: Não configurado');
    }

    if (results.admin) {
      console.log('✅ Admin:', results.admin.email || 'Token fixo');
    } else {
      console.log('❌ Admin: Não configurado');
    }

    if (results.errors.length > 0) {
      console.log('');
      console.log('⚠️ Erros encontrados:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('═══════════════════════════════════════════════════════');

    return results;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const setup = new TestUserSetup();
  setup.setup()
    .then(results => {
      // Salvar resultados em arquivo temporário para uso pelo runner
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, '../.test-users.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      console.log('');
      console.log(`💾 Resultados salvos em: ${resultsPath}`);
      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = TestUserSetup;

