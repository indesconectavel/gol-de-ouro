// Adaptador de Tratamento de Erros
// Base para tratamento centralizado de erros sem alterar UI
// Gol de Ouro Player - Engine V19 Integration
// Data: 18/12/2025

/**
 * Adaptador para tratamento centralizado de erros
 * Garante que erros sejam tratados de forma consistente
 * SEM alterar a UI - apenas normaliza e classifica erros
 */
class ErrorAdapter {
  /**
   * Classificar erro por tipo e severidade
   */
  classifyError(error) {
    // Erro de rede
    if (!error.response && error.message) {
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network Error') ||
          error.message.includes('CORS')) {
        return {
          type: 'network',
          severity: 'high',
          userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
          retryable: true
        };
      }

      if (error.message.includes('timeout')) {
        return {
          type: 'timeout',
          severity: 'medium',
          userMessage: 'Tempo de espera esgotado. Tente novamente.',
          retryable: true
        };
      }
    }

    // Erro HTTP
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};

      switch (status) {
        case 400:
          return {
            type: 'validation',
            severity: 'medium',
            userMessage: data.message || 'Dados inválidos. Verifique as informações e tente novamente.',
            retryable: false
          };

        case 401:
          return {
            type: 'authentication',
            severity: 'critical',
            userMessage: 'Sessão expirada. Faça login novamente.',
            retryable: false,
            requiresAuth: true
          };

        case 403:
          return {
            type: 'authorization',
            severity: 'high',
            userMessage: 'Acesso negado. Você não tem permissão para esta ação.',
            retryable: false
          };

        case 404:
          return {
            type: 'not_found',
            severity: 'medium',
            userMessage: 'Recurso não encontrado.',
            retryable: false
          };

        case 429:
          return {
            type: 'rate_limit',
            severity: 'medium',
            userMessage: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
            retryable: true,
            retryAfter: this.extractRetryAfter(error.response.headers)
          };

        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'server',
            severity: 'high',
            userMessage: 'Erro no servidor. Tente novamente em alguns instantes.',
            retryable: true
          };

        default:
          return {
            type: 'unknown',
            severity: 'medium',
            userMessage: data.message || 'Erro inesperado. Tente novamente.',
            retryable: true
          };
      }
    }

    // Erro desconhecido
    return {
      type: 'unknown',
      severity: 'low',
      userMessage: 'Erro inesperado. Tente novamente.',
      retryable: true
    };
  }

  /**
   * Extrair mensagem de retry-after do header
   */
  extractRetryAfter(headers) {
    const retryAfter = headers?.['retry-after'] || headers?.['Retry-After'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? null : seconds;
    }
    return null;
  }

  /**
   * Criar objeto de erro padronizado
   */
  createError(error, context = {}) {
    const classification = this.classifyError(error);
    const responseData = error.response?.data || {};

    return {
      ...classification,
      originalError: error,
      status: error.response?.status || null,
      code: responseData.code || null,
      message: responseData.message || error.message || classification.userMessage,
      context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verificar se erro é retryable
   */
  isRetryable(error) {
    const classification = this.classifyError(error);
    return classification.retryable === true;
  }

  /**
   * Verificar se erro requer autenticação
   */
  requiresAuth(error) {
    const classification = this.classifyError(error);
    return classification.requiresAuth === true;
  }

  /**
   * Verificar se erro é crítico (bloqueador)
   */
  isCritical(error) {
    const classification = this.classifyError(error);
    return classification.severity === 'critical';
  }

  /**
   * Obter mensagem amigável para o usuário
   */
  getUserMessage(error) {
    const classification = this.classifyError(error);
    return classification.userMessage;
  }

  /**
   * Log de erro (apenas em desenvolvimento)
   */
  logError(error, context = {}) {
    if (import.meta.env.DEV) {
      console.error('❌ [ErrorAdapter] Erro classificado:', {
        classification: this.classifyError(error),
        context,
        error
      });
    }
  }
}

export default new ErrorAdapter();

