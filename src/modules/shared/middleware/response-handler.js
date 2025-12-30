// Response Handler Middleware - Gol de Ouro v1.3.0
// Padroniza todas as respostas da API

/**
 * Middleware para padronizar respostas da API
 * Todas as respostas seguem o formato:
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: string,
 *   message?: string,
 *   timestamp: string
 * }
 */

class ResponseHandler {
  /**
   * Resposta de sucesso
   * @param {Object} res - Express response object
   * @param {*} data - Dados a serem retornados
   * @param {string} message - Mensagem de sucesso
   * @param {number} statusCode - Código HTTP (padrão: 200)
   */
  static success(res, data = null, message = null, statusCode = 200) {
    const response = {
      success: true,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de erro
   * @param {Object} res - Express response object
   * @param {string} error - Mensagem de erro
   * @param {number} statusCode - Código HTTP (padrão: 400)
   * @param {*} details - Detalhes adicionais do erro
   */
  static error(res, error, statusCode = 400, details = null) {
    const response = {
      success: false,
      error: error,
      timestamp: new Date().toISOString()
    };

    if (details !== null) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de erro de validação
   * @param {Object} res - Express response object
   * @param {Array|Object} errors - Erros de validação
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      errors: Array.isArray(errors) ? errors : [errors],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro não autorizado
   * @param {Object} res - Express response object
   * @param {string} message - Mensagem de erro
   */
  static unauthorized(res, message = 'Não autorizado') {
    return res.status(401).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro de permissão
   * @param {Object} res - Express response object
   * @param {string} message - Mensagem de erro
   */
  static forbidden(res, message = 'Acesso negado') {
    return res.status(403).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro não encontrado
   * @param {Object} res - Express response object
   * @param {string} resource - Recurso não encontrado
   */
  static notFound(res, resource = 'Recurso não encontrado') {
    return res.status(404).json({
      success: false,
      error: resource,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro de conflito
   * @param {Object} res - Express response object
   * @param {string} message - Mensagem de erro
   */
  static conflict(res, message = 'Conflito') {
    return res.status(409).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro interno do servidor
   * @param {Object} res - Express response object
   * @param {Error} error - Objeto de erro
   * @param {string} message - Mensagem personalizada
   */
  static serverError(res, error = null, message = 'Erro interno do servidor') {
    const response = {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    };

    // Em desenvolvimento, incluir detalhes do erro
    if (process.env.NODE_ENV !== 'production' && error) {
      response.details = {
        message: error.message,
        stack: error.stack
      };
    }

    return res.status(500).json(response);
  }

  /**
   * Resposta de serviço indisponível
   * @param {Object} res - Express response object
   * @param {string} service - Nome do serviço indisponível
   */
  static serviceUnavailable(res, service = 'Serviço temporariamente indisponível') {
    return res.status(503).json({
      success: false,
      error: service,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de rate limit
   * @param {Object} res - Express response object
   * @param {string} message - Mensagem de erro
   * @param {number} retryAfter - Segundos até poder tentar novamente
   */
  static rateLimit(res, message = 'Muitas requisições', retryAfter = 60) {
    return res.status(429).json({
      success: false,
      error: message,
      retryAfter: retryAfter,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta paginada
   * @param {Object} res - Express response object
   * @param {Array} data - Dados paginados
   * @param {Object} pagination - Informações de paginação
   * @param {string} message - Mensagem opcional
   */
  static paginated(res, data, pagination, message = null) {
    const response = {
      success: true,
      data: data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
      },
      timestamp: new Date().toISOString()
    };

    if (message) {
      response.message = message;
    }

    return res.status(200).json(response);
  }
}

module.exports = ResponseHandler;

