// ConfiguraÃ§Ã£o de Ambientes - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:8080', // Backend local funcionando
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
    API_BASE_URL: '/api', // Usar rewrite do Vercel
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

// Guarda de seguranÃ§a: erro se mocks em produÃ§Ã£o
const validateEnvironment = () => {
  const env = getCurrentEnvironment();
  if (!import.meta.env.DEV && env.USE_MOCKS) {
    throw new Error('ðŸš¨ CRÃTICO: USE_MOCKS=true em ambiente de produÃ§Ã£o!');
  }
  return env;
};

export { getCurrentEnvironment, validateEnvironment };
export default getCurrentEnvironment();


