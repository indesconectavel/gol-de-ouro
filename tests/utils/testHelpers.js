// Helpers Gerais para Testes
// FASE 2.5 - Testes Automatizados

const testConfig = require('../config/testConfig');

/**
 * Helpers gerais para testes
 */
class TestHelpers {
  /**
   * Classificar severidade de erro
   */
  classifySeverity(error, context = {}) {
    // Erros críticos
    if (error.status === 500 || error.status === 503) {
      return 'critical';
    }

    // Erros de autenticação são críticos
    if (error.status === 401 || error.status === 403) {
      return 'critical';
    }

    // Erros de validação são altos
    if (error.status === 400) {
      return 'high';
    }

    // Erros de não encontrado são médios
    if (error.status === 404) {
      return 'medium';
    }

    // Erros de rede são altos
    if (!error.response && error.code) {
      return 'high';
    }

    return 'low';
  }

  /**
   * Criar resultado de teste padronizado
   */
  createTestResult(testName, passed, error = null, evidence = {}) {
    const result = {
      testName,
      passed,
      timestamp: new Date().toISOString(),
      evidence
    };

    if (error) {
      result.error = {
        message: error.message || error,
        status: error.status,
        severity: this.classifySeverity(error),
        stack: error.stack
      };
    }

    return result;
  }

  /**
   * Aguardar delay
   * FASE 2.5.1 - Função sleep para controle de rate limit
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sleep - alias para delay (mais legível)
   * FASE 2.5.1 - Delay controlado entre testes
   */
  async sleep(ms) {
    return this.delay(ms);
  }

  /**
   * Validar estrutura de resposta da Engine V19
   */
  validateEngineResponse(response) {
    if (!response || !response.data) {
      return {
        valid: false,
        error: 'Resposta vazia'
      };
    }

    const data = response.data;

    // Validar formato padrão da Engine V19
    if (typeof data === 'object' && 'success' in data) {
      return {
        valid: true,
        data: data.data,
        message: data.message,
        success: data.success
      };
    }

    return {
      valid: false,
      error: 'Formato de resposta inválido'
    };
  }

  /**
   * Normalizar número (garantir que seja número válido)
   */
  normalizeNumber(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  }

  /**
   * Validar saldo suficiente
   */
  validateBalance(balance, amount) {
    const normalizedBalance = this.normalizeNumber(balance);
    const normalizedAmount = this.normalizeNumber(amount);

    return {
      sufficient: normalizedBalance >= normalizedAmount,
      balance: normalizedBalance,
      amount: normalizedAmount,
      difference: normalizedBalance - normalizedAmount
    };
  }

  /**
   * Gerar ID único para testes
   */
  generateTestId(prefix = 'test') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log formatado para testes
   */
  log(message, type = 'info') {
    if (!testConfig.verbose && type === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🔍'
    }[type] || 'ℹ️';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }
}

module.exports = new TestHelpers();

