// Response Helper - Gol de Ouro v1.3.0
// Helper functions para respostas padronizadas
// Compatível com ResponseHandler mas como funções standalone

const ResponseHandler = require('../middlewares/response-handler');

/**
 * Helper functions para facilitar uso do ResponseHandler
 * Pode ser usado diretamente nos controllers sem precisar instanciar
 */

module.exports = {
  success: (res, data = null, message = null, statusCode = 200) => {
    return ResponseHandler.success(res, data, message, statusCode);
  },

  error: (res, error, statusCode = 400, details = null) => {
    return ResponseHandler.error(res, error, statusCode, details);
  },

  validationError: (res, errors) => {
    return ResponseHandler.validationError(res, errors);
  },

  unauthorized: (res, message = 'Não autorizado') => {
    return ResponseHandler.unauthorized(res, message);
  },

  forbidden: (res, message = 'Acesso negado') => {
    return ResponseHandler.forbidden(res, message);
  },

  notFound: (res, resource = 'Recurso não encontrado') => {
    return ResponseHandler.notFound(res, resource);
  },

  conflict: (res, message = 'Conflito') => {
    return ResponseHandler.conflict(res, message);
  },

  serverError: (res, error = null, message = 'Erro interno do servidor') => {
    return ResponseHandler.serverError(res, error, message);
  },

  serviceUnavailable: (res, service = 'Serviço temporariamente indisponível') => {
    return ResponseHandler.serviceUnavailable(res, service);
  },

  rateLimit: (res, message = 'Muitas requisições', retryAfter = 60) => {
    return ResponseHandler.rateLimit(res, message, retryAfter);
  },

  paginated: (res, data, pagination, message = null) => {
    return ResponseHandler.paginated(res, data, pagination, message);
  }
};

