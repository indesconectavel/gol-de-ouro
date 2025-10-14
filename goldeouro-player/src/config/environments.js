// Configuração ULTRA DEFINITIVA - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: 'https://goldeouro-backend.fly.dev', // BACKEND CORRETO
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://goldeouro-backend.fly.dev', // BACKEND CORRETO
    USE_MOCKS: false,
    USE_SANDBOX: true,
    LOG_LEVEL: 'info'
  },
  production: {
    // BACKEND CORRETO PARA PRODUÇÃO
    API_BASE_URL: 'https://goldeouro-backend.fly.dev', // BACKEND CORRETO
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'error'
  }
};

// Detectar ambiente atual - ULTRA DEFINITIVO COM FORÇA TOTAL
const getCurrentEnvironment = () => {
  // FORÇAR SEMPRE BACKEND DIRETO EM TODOS OS AMBIENTES
  console.log('🔧 FORÇANDO BACKEND DIRETO EM TODOS OS AMBIENTES');
  console.log('🔧 URL atual:', window.location.href);
  console.log('🔧 Hostname:', window.location.hostname);
  
  // SEMPRE usar backend direto
  return environments.production;
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