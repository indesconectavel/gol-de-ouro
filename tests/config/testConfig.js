// Configuração de Testes - Gol de Ouro
// FASE 2.5 - Testes Automatizados em Staging

// Carregar variáveis de ambiente do arquivo .env se existir
try {
  require('../scripts/load-env');
} catch (error) {
  // Ignorar se não conseguir carregar
}

/**
 * Configuração centralizada para testes automatizados
 * NÃO altera código de produção
 */

const testConfig = {
  // URLs de staging
  staging: {
    baseURL: process.env.STAGING_BASE_URL || 'https://goldeouro-backend-v2.fly.dev',
    playerWebURL: process.env.STAGING_PLAYER_URL || 'https://staging-player.goldeouro.lol',
    adminWebURL: process.env.STAGING_ADMIN_URL || 'https://staging-admin.goldeouro.lol',
  },

  // Credenciais de teste (NÃO usar em produção)
  testCredentials: {
    player: {
      email: process.env.TEST_PLAYER_EMAIL || 'teste.player@example.com',
      password: process.env.TEST_PLAYER_PASSWORD || 'senha123',
      username: 'teste_player'
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      token: process.env.TEST_ADMIN_TOKEN || 'goldeouro123'
    }
  },

  // Timeouts
  timeouts: {
    api: 30000, // 30 segundos
    polling: 60000, // 1 minuto para polling
    stress: 120000 // 2 minutos para testes de stress
  },

  // Configurações de retry
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1 segundo
    backoffMultiplier: 2
  },

  // Valores de teste
  testValues: {
    minBetAmount: 1,
    maxBetAmount: 10,
    testPixAmount: 10.00,
    testWithdrawAmount: 5.00,
    testPixKey: '12345678900' // CPF de teste
  },

  // Flags de ambiente
  environment: process.env.NODE_ENV || 'test',
  verbose: process.env.VERBOSE === 'true',
  saveEvidence: process.env.SAVE_EVIDENCE !== 'false'
};

module.exports = testConfig;

