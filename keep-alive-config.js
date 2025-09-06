/**
 * CONFIGURAÇÃO DO KEEP-ALIVE - Gol de Ouro Backend
 * 
 * Este arquivo contém configurações para diferentes ambientes
 * e facilita a manutenção das URLs e intervalos.
 */

const configs = {
  // Configuração para desenvolvimento local
  local: {
    backendUrl: 'http://localhost:3000',
    pingInterval: 2 * 60 * 1000, // 2 minutos para desenvolvimento
    requestTimeout: 10 * 1000,   // 10 segundos
    maxRetries: 2,
    retryDelay: 15 * 1000,       // 15 segundos
    logLevel: 'debug'
  },
  
  // Configuração para produção
  production: {
    backendUrl: 'https://goldeouro-backend.onrender.com',
    pingInterval: 5 * 60 * 1000, // 5 minutos para produção
    requestTimeout: 30 * 1000,   // 30 segundos
    maxRetries: 3,
    retryDelay: 30 * 1000,       // 30 segundos
    logLevel: 'info'
  },
  
  // Configuração para teste
  test: {
    backendUrl: 'https://goldeouro-backend.onrender.com',
    pingInterval: 1 * 60 * 1000, // 1 minuto para teste
    requestTimeout: 15 * 1000,   // 15 segundos
    maxRetries: 1,
    retryDelay: 10 * 1000,       // 10 segundos
    logLevel: 'debug'
  }
};

/**
 * Função para obter configuração baseada no ambiente
 */
function getConfig(environment = 'production') {
  const env = environment.toLowerCase();
  
  if (!configs[env]) {
    console.warn(`⚠️  Ambiente '${env}' não encontrado. Usando configuração de produção.`);
    return configs.production;
  }
  
  return configs[env];
}

/**
 * Função para validar configuração
 */
function validateConfig(config) {
  const required = ['backendUrl', 'pingInterval', 'requestTimeout', 'maxRetries', 'retryDelay'];
  
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Campo obrigatório '${field}' não encontrado na configuração`);
    }
  }
  
  if (!config.backendUrl.startsWith('http')) {
    throw new Error('backendUrl deve começar com http:// ou https://');
  }
  
  if (config.pingInterval < 60000) {
    console.warn('⚠️  Intervalo de ping muito baixo (< 1 minuto). Pode causar spam.');
  }
  
  return true;
}

module.exports = {
  configs,
  getConfig,
  validateConfig
};
