// Configuração CORRIGIDA - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: '', // Usar proxy do Vite (relativo)
    USE_MOCKS: false,
    USE_SANDBOX: false,
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
const ENVIRONMENT_CACHE_DURATION = 0; // 0 = Sem cache (para desenvolvimento)

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
  
  // ✅ CORREÇÃO CRÍTICA: Verificar bootstrap primeiro (última linha de defesa)
  // MAS só usar se realmente estiver em produção
  if (typeof window !== 'undefined' && window.__FORCED_BACKEND__) {
    const hostname = window.location.hostname;
    const isProductionDomain = hostname.includes('goldeouro.lol') || 
                               hostname.includes('goldeouro.com') ||
                               hostname === 'www.goldeouro.lol' ||
                               hostname === 'goldeouro.lol';
    
    // Só usar backend forçado se estiver em produção
    if (isProductionDomain) {
      const forcedBackend = window.__API_BASE_URL__;
      if (forcedBackend) {
        console.log('[ENV] Usando backend forçado pelo bootstrap (PRODUÇÃO):', forcedBackend);
        return {
          ...environments.production,
          API_BASE_URL: forcedBackend,
          USE_MOCKS: false,
          USE_SANDBOX: false,
          IS_PRODUCTION: true
        };
      }
    } else {
      console.log('[ENV] Modo desenvolvimento - ignorando backend forçado, usando proxy');
    }
  }
  
  // CORREÇÃO CRÍTICA: Usar sessionStorage para persistir flags
  hasLoggedOnce = getSessionFlag('env_hasLoggedOnce');
  isInitialized = getSessionFlag('env_isInitialized');
  
  // Log apenas uma vez por sessão - ULTRA OTIMIZADO PARA PRODUÇÃO
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProductionDomain = hostname.includes('goldeouro.lol') || 
                             hostname.includes('goldeouro.com') ||
                             hostname === 'www.goldeouro.lol' ||
                             hostname === 'goldeouro.lol';
  const isProduction = isProductionDomain;
  const shouldLog = isDevelopment || (!hasLoggedOnce && !isProduction);
  
  // CORREÇÃO CRÍTICA: SEMPRE limpar cache em produção se estiver usando backend antigo
  // Forçar revalidação em produção para evitar cache incorreto
  if (isProductionDomain) {
    // SEMPRE limpar cache em produção para garantir backend correto
    if (environmentCache && environmentCache.API_BASE_URL && 
        environmentCache.API_BASE_URL.includes('goldeouro-backend.fly.dev') && 
        !environmentCache.API_BASE_URL.includes('goldeouro-backend-v2.fly.dev')) {
      // Cache inválido - forçar revalidação
      environmentCache = null;
      isInitialized = false;
      // Limpar sessionStorage também
      try {
        sessionStorage.removeItem('env_isInitialized');
        sessionStorage.removeItem('env_hasLoggedOnce');
      } catch (e) {
        // Ignorar erros
      }
    }
    // Em produção, SEMPRE ignorar cache para garantir configuração correta
    environmentCache = null;
    isInitialized = false;
  }
  
  // Usar cache se ainda válido E se já foi inicializado E NÃO for produção
  if (!isProductionDomain && environmentCache && (now - lastEnvironmentCheck) < ENVIRONMENT_CACHE_DURATION && isInitialized) {
    return environmentCache;
  }
  
  if (shouldLog) {
    console.log('🔧 Detectando ambiente atual...');
    console.log('🔧 URL atual:', window.location.href);
    console.log('🔧 Hostname:', window.location.hostname);
    hasLoggedOnce = true; // Marcar como logado
    setSessionFlag('env_hasLoggedOnce', true);
  }
  
  let result;
  
  // Detectar ambiente baseado no hostname
  // CORREÇÃO CRÍTICA: Verificar produção PRIMEIRO para evitar fallback incorreto
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (shouldLog) console.log('🔧 Ambiente: DESENVOLVIMENTO LOCAL');
    result = environments.development;
  } else if (isProductionDomain) {
    // PRODUÇÃO REAL - FORÇAR CONFIGURAÇÕES DE PRODUÇÃO
    if (shouldLog) console.log('🔧 Ambiente: PRODUÇÃO REAL - FORÇANDO CONFIGURAÇÕES REAIS');
    result = {
      ...environments.production,
      USE_MOCKS: false, // FORÇAR SEM MOCKS
      USE_SANDBOX: false, // FORÇAR SEM SANDBOX
      IS_PRODUCTION: true // FORÇAR PRODUÇÃO
    };
  } else if (hostname.includes('staging') || hostname.includes('test')) {
    if (shouldLog) console.log('🔧 Ambiente: STAGING');
    result = environments.staging;
  } else {
    // FALLBACK: Se não for desenvolvimento nem staging, assumir produção
    if (shouldLog) console.log('🔧 Ambiente: FALLBACK PARA PRODUÇÃO');
    result = {
      ...environments.production,
      USE_MOCKS: false,
      USE_SANDBOX: false,
      IS_PRODUCTION: true
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