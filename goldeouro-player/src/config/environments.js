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
    // BACKEND CORRETO PARA PRODUÇÃO (UNIFICADO)
    API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev', // BACKEND PRODUÇÃO
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'error'
  }
};

// Cache para evitar execuções repetitivas - ULTRA ROBUSTO
let environmentCache = null;
let lastEnvironmentCheck = 0;
let hasLoggedOnce = false; // Flag para garantir log apenas uma vez
let isInitialized = false; // Flag para evitar inicialização múltipla
const ENVIRONMENT_CACHE_DURATION = 300000; // 5 minutos (aumentado drasticamente)

// CORREÇÃO CRÍTICA: Usar sessionStorage para persistir flags entre recarregamentos
const getSessionFlag = (key) => {
  try {
    return sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

const setSessionFlag = (key, value) => {
  try {
    sessionStorage.setItem(key, value.toString());
  } catch {
    // Ignorar erros de sessionStorage
  }
};

// Detectar ambiente atual - ULTRA OTIMIZADO COM CACHE ROBUSTO
const getCurrentEnvironment = () => {
  const now = Date.now();
  
  // CORREÇÃO CRÍTICA: Usar sessionStorage para persistir flags
  hasLoggedOnce = getSessionFlag('env_hasLoggedOnce');
  isInitialized = getSessionFlag('env_isInitialized');
  
  // Usar cache se ainda válido E se já foi inicializado
  if (environmentCache && (now - lastEnvironmentCheck) < ENVIRONMENT_CACHE_DURATION && isInitialized) {
    return environmentCache;
  }
  
  // Log apenas uma vez por sessão - ULTRA OTIMIZADO PARA PRODUÇÃO
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isProduction = window.location.hostname.includes('goldeouro.lol') || window.location.hostname.includes('goldeouro.com');
  const shouldLog = isDevelopment || (!hasLoggedOnce && !isProduction);
  
  if (shouldLog) {
    console.log('🔧 Detectando ambiente atual...');
    console.log('🔧 URL atual:', window.location.href);
    console.log('🔧 Hostname:', window.location.hostname);
    hasLoggedOnce = true; // Marcar como logado
    setSessionFlag('env_hasLoggedOnce', true);
  }
  
  let result;
  
  // Detectar ambiente baseado no hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (shouldLog) console.log('🔧 Ambiente: DESENVOLVIMENTO LOCAL');
    result = environments.development;
  } else if (window.location.hostname.includes('staging') || window.location.hostname.includes('test')) {
    if (shouldLog) console.log('🔧 Ambiente: STAGING');
    result = environments.staging;
  } else {
    // PRODUÇÃO REAL - FORÇAR CONFIGURAÇÕES DE PRODUÇÃO
    if (shouldLog) console.log('🔧 Ambiente: PRODUÇÃO REAL - FORÇANDO CONFIGURAÇÕES REAIS');
    result = {
      ...environments.production,
      USE_MOCKS: false, // FORÇAR SEM MOCKS
      USE_SANDBOX: false, // FORÇAR SEM SANDBOX
      IS_PRODUCTION: true // FORÇAR PRODUÇÃO
    };
  }
  
  // Atualizar cache e marcar como inicializado
  environmentCache = result;
  lastEnvironmentCheck = now;
  isInitialized = true;
  setSessionFlag('env_isInitialized', true);
  
  return result;
};

// Guarda de segurança: erro se mocks em produção
const validateEnvironment = () => {
  const env = getCurrentEnvironment();
  if (!import.meta.env.DEV && env.USE_MOCKS) {
    throw new Error('🚨 CRÍTICO: USE_MOCKS=true em ambiente de produção!');
  }
  return env;
};

// CORREÇÃO CRÍTICA: Forçar backend direto apenas uma vez por sessão
const FORCE_BACKEND_DIRECT = true;
if (FORCE_BACKEND_DIRECT && !getSessionFlag('backend_forced')) {
  // Em produção, evitar logs verbosos para não poluir console do usuário
  const isProduction = window.location.hostname.includes('goldeouro.lol');
  if (!isProduction) {
    console.log('🔧 FORÇANDO BACKEND DIRETO EM TODOS OS AMBIENTES');
    console.log('🔧 URL atual:', window.location.href);
    console.log('🔧 Hostname:', window.location.hostname);
  }
  setSessionFlag('backend_forced', true);
}

export { getCurrentEnvironment, validateEnvironment };
export default getCurrentEnvironment();