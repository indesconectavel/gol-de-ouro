// Configuração de Ambientes - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: 'http://192.168.1.100:3000', // IP local do desenvolvedor
    USE_MOCKS: true,
    USE_SANDBOX: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://api.staging.goldeouro.lol',
    USE_MOCKS: false,
    USE_SANDBOX: true,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: 'https://goldeouro-backend.onrender.com',
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'error'
  }
};

// Detectar ambiente atual
const getCurrentEnvironment = () => {
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

