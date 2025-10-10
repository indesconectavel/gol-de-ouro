// Configuração ULTRA DEFINITIVA para produção - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:8080',
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://api.staging.goldeouro.lol',
    USE_MOCKS: false,
    USE_SANDBOX: true,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: 'https://goldeouro-backend.fly.dev/api', // SEMPRE usar backend direto
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'error'
  }
};

// Detectar ambiente atual - ULTRA DEFINITIVO
const getCurrentEnvironment = () => {
  // SEMPRE usar produção se estiver em produção
  if (import.meta.env.PROD || window.location.hostname.includes('goldeouro.lol')) {
    console.log('🔧 FORÇANDO AMBIENTE DE PRODUÇÃO - BACKEND DIRETO');
    return environments.production;
  }
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return environments[env] || environments.development;
};

// Guarda de segurança: erro se mocks em produção
const validateEnvironment = () => {
  const env = getCurrentEnvironment();
  if (!import.meta.env.DEV && env.USE_MOCKS) {
    throw new Error('🚨 CRÍTICO: USE_MOCKS=true em ambiente de produção!');
  }
  return env;
};

export { getCurrentEnvironment, validateEnvironment };
export default getCurrentEnvironment();