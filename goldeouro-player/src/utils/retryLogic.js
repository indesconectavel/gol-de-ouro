// Utilitário de Retry Logic - Gol de Ouro v1.2.0
// ================================================
// Data: 24/10/2025
// Status: IMPLEMENTAÇÃO COMPLETA
// Versão: v1.2.0-retry-logic
// GPT-4o Auto-Fix: Sistema de retry robusto

/**
 * Executa uma função com retry automático em caso de falha
 * @param {Function} requestFn - Função que faz a requisição
 * @param {Object} options - Opções de configuração
 * @param {number} options.maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} options.baseDelay - Delay base em ms (padrão: 1000)
 * @param {number} options.maxDelay - Delay máximo em ms (padrão: 10000)
 * @param {Function} options.shouldRetry - Função para determinar se deve tentar novamente
 * @param {Function} options.onRetry - Callback chamado a cada retry
 * @returns {Promise} Promise que resolve com o resultado ou rejeita após todas as tentativas
 */
export const retryRequest = async (requestFn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Retry para erros de rede, timeout e 5xx
      return (
        !error.response || 
        error.response.status >= 500 || 
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT'
      );
    },
    onRetry = (attempt, error, delay) => {
      console.warn(`🔄 [RETRY] Tentativa ${attempt}/${maxRetries} em ${delay}ms. Erro:`, error.message);
    }
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Se não deve tentar novamente ou é a última tentativa
      if (!shouldRetry(error) || attempt === maxRetries) {
        break;
      }
      
      // Calcular delay com backoff exponencial
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      
      // Callback de retry
      onRetry(attempt, error, delay);
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError;
};

/**
 * Wrapper para requisições HTTP com retry automático
 * @param {Function} httpRequest - Função de requisição HTTP
 * @param {Object} retryOptions - Opções de retry
 * @returns {Promise} Promise com retry automático
 */
export const withRetry = (httpRequest, retryOptions = {}) => {
  return retryRequest(httpRequest, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    shouldRetry: (error) => {
      // Retry para erros específicos
      const retryableErrors = [
        'NETWORK_ERROR',
        'TIMEOUT',
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED'
      ];
      
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      
      return (
        retryableErrors.includes(error.code) ||
        (error.response && retryableStatusCodes.includes(error.response.status))
      );
    },
    onRetry: (attempt, error, delay) => {
      const isDevelopment = import.meta.env.DEV;
      if (isDevelopment) {
        console.warn(`🔄 [RETRY] Tentativa ${attempt}/3 em ${delay}ms para ${error.config?.url || 'request'}`);
      }
    },
    ...retryOptions
  });
};

/**
 * Retry específico para endpoints críticos
 * @param {Function} requestFn - Função de requisição
 * @returns {Promise} Promise com retry otimizado para endpoints críticos
 */
export const retryCriticalRequest = (requestFn) => {
  return retryRequest(requestFn, {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 3000,
    shouldRetry: (error) => {
      // Retry mais agressivo para endpoints críticos
      return (
        !error.response || 
        error.response.status >= 400 ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT'
      );
    },
    onRetry: (attempt, error, delay) => {
      console.warn(`🚨 [CRITICAL RETRY] Tentativa ${attempt}/5 em ${delay}ms. Erro:`, error.message);
    }
  });
};

/**
 * Retry específico para endpoints de dados
 * @param {Function} requestFn - Função de requisição
 * @returns {Promise} Promise com retry otimizado para dados
 */
export const retryDataRequest = (requestFn) => {
  return retryRequest(requestFn, {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 2000,
    shouldRetry: (error) => {
      // Retry mais conservador para dados
      return (
        error.response?.status >= 500 ||
        error.code === 'NETWORK_ERROR'
      );
    },
    onRetry: (attempt, error, delay) => {
      console.warn(`📊 [DATA RETRY] Tentativa ${attempt}/2 em ${delay}ms. Erro:`, error.message);
    }
  });
};

export default {
  retryRequest,
  withRetry,
  retryCriticalRequest,
  retryDataRequest
};
