// Configuração CORRIGIDA - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:8080', // BACKEND LOCAL
    USE_MOCKS: true,
    USE_SANDBOX: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://goldeouro-backend.fly.dev', // BACKEND STAGING
    USE_MOCKS: false,
    USE_SANDBOX: true,
    LOG_LEVEL: 'info'
  },
  production: {
    // BACKEND CORRETO PARA PRODUÇÃO
    API_BASE_URL: 'https://goldeouro-backend.fly.dev', // BACKEND PRODUÇÃO
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'error'
  }
};

// Detectar ambiente atual - CORRIGIDO PARA PRODUÇÃO REAL
const getCurrentEnvironment = () => {
  console.log('🔧 Detectando ambiente atual...');
  console.log('🔧 URL atual:', window.location.href);
  console.log('🔧 Hostname:', window.location.hostname);
  
  // Detectar ambiente baseado no hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Ambiente: DESENVOLVIMENTO LOCAL');
    return environments.development;
  } else if (window.location.hostname.includes('staging') || window.location.hostname.includes('test')) {
    console.log('🔧 Ambiente: STAGING');
    return environments.staging;
  } else {
    // PRODUÇÃO REAL - FORÇAR CONFIGURAÇÕES DE PRODUÇÃO
    console.log('🔧 Ambiente: PRODUÇÃO REAL - FORÇANDO CONFIGURAÇÕES REAIS');
    return {
      ...environments.production,
      USE_MOCKS: false, // FORÇAR SEM MOCKS
      USE_SANDBOX: false, // FORÇAR SEM SANDBOX
      IS_PRODUCTION: true // FORÇAR PRODUÇÃO
    };
  }
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