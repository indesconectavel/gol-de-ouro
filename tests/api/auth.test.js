// Testes de API - Autenticação
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const reportGenerator = require('../utils/reportGenerator');
const testConfig = require('../config/testConfig');

/**
 * Testes de Autenticação
 */
class AuthTests {
  async runAll() {
    testHelpers.log('Iniciando testes de autenticação...', 'info');

    const results = [];

    // Teste 1: Login válido
    results.push(await this.testLoginValid());

    // Teste 2: Login inválido
    results.push(await this.testLoginInvalid());

    // Teste 3: Refresh token válido
    results.push(await this.testRefreshTokenValid());

    // Teste 4: Refresh token inválido
    results.push(await this.testRefreshTokenInvalid());

    // Teste 5: Token expirado (simulado)
    results.push(await this.testTokenExpired());

    return results;
  }

  /**
   * Teste 1: Login válido
   */
  async testLoginValid() {
    const testName = 'API-AUTH-001: Login válido';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      authHelper.clearTokens();
      const result = await authHelper.loginPlayer();

      if (result.success && result.token) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          tokenReceived: !!result.token,
          refreshTokenReceived: !!result.refreshToken,
          userDataReceived: !!result.user
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${result.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: result.error,
          status: result.status
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 2: Login inválido
   */
  async testLoginInvalid() {
    const testName = 'API-AUTH-002: Login inválido';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      authHelper.clearTokens();
      const result = await authHelper.loginPlayer('invalid@email.com', 'wrongpassword');

      // Deve falhar
      if (!result.success) {
        testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          errorHandled: true,
          status: result.status
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU (deveria ter falhado)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Login inválido foi aceito incorretamente'
        });
      }
    } catch (error) {
      // Erro é esperado
      testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
      return testHelpers.createTestResult(testName, true, null, {
        errorHandled: true
      });
    }
  }

  /**
   * Teste 3: Refresh token válido
   */
  async testRefreshTokenValid() {
    const testName = 'API-AUTH-003: Refresh token válido';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Primeiro fazer login para obter refresh token
      const loginResult = await authHelper.loginPlayer();
      
      if (!loginResult.success || !loginResult.refreshToken) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter refresh token para teste'
        });
      }

      // Testar refresh token
      const refreshResult = await authHelper.testRefreshToken(loginResult.refreshToken);

      if (refreshResult.success && refreshResult.token) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          newTokenReceived: !!refreshResult.token,
          newRefreshTokenReceived: !!refreshResult.refreshToken
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${refreshResult.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: refreshResult.error,
          status: refreshResult.status
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 4: Refresh token inválido
   */
  async testRefreshTokenInvalid() {
    const testName = 'API-AUTH-004: Refresh token inválido';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const result = await authHelper.testRefreshToken('invalid_refresh_token_12345');

      // Deve falhar
      if (!result.success) {
        testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          errorHandled: true,
          status: result.status
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU (deveria ter falhado)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Refresh token inválido foi aceito incorretamente'
        });
      }
    } catch (error) {
      // Erro é esperado
      testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
      return testHelpers.createTestResult(testName, true, null, {
        errorHandled: true
      });
    }
  }

  /**
   * Teste 5: Token expirado (simulado via requisição com token inválido)
   */
  async testTokenExpired() {
    const testName = 'API-AUTH-005: Token expirado (simulado)';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Tentar usar token inválido
      const response = await apiClient.requestWithToken(
        'GET',
        '/api/user/profile',
        null,
        'invalid_token_12345',
        false
      );

      // Não deve funcionar
      testHelpers.log(`❌ ${testName} - FALHOU (deveria ter retornado 401)`, 'error');
      return testHelpers.createTestResult(testName, false, {
        message: 'Token inválido foi aceito incorretamente'
      });
    } catch (error) {
      // Deve retornar 401
      if (error.response && error.response.status === 401) {
        testHelpers.log(`✅ ${testName} - PASSOU (401 retornado)`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          status401Received: true,
          errorHandled: true
        });
      } else {
        testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
        return testHelpers.createTestResult(testName, false, error);
      }
    }
  }
}

module.exports = new AuthTests();

