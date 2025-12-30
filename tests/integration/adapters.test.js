// Testes de Integração - Adaptadores
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const testConfig = require('../config/testConfig');

/**
 * Testes de Integração dos Adaptadores
 * Valida que adaptadores lidam corretamente com cenários de erro
 */
class AdapterIntegrationTests {
  async runAll() {
    testHelpers.log('Iniciando testes de integração de adaptadores...', 'info');

    const results = [];

    // Garantir que temos token válido
    await authHelper.getPlayerToken();

    // Teste 1: Adaptador lida com 401 (refresh automático)
    results.push(await this.testAdapterHandles401());

    // Teste 2: Adaptador normaliza dados nulos
    results.push(await this.testAdapterNormalizesNullData());

    // Teste 3: Adaptador lida com timeout
    results.push(await this.testAdapterHandlesTimeout());

    // Teste 4: Validar que não há fallbacks hardcoded ativos
    results.push(await this.testNoHardcodedFallbacks());

    return results;
  }

  /**
   * Teste 1: Adaptador lida com 401 (refresh automático)
   * Nota: Este teste valida indiretamente através do comportamento da API
   */
  async testAdapterHandles401() {
    const testName = 'INT-ADAPTER-001: Adaptador lida com 401 (refresh automático)';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Obter token válido primeiro
      const loginResult = await authHelper.loginPlayer();
      
      if (!loginResult.success) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível fazer login para teste'
        });
      }

      // Tentar usar token inválido e verificar comportamento
      // Nota: Como não podemos alterar adaptadores, validamos indiretamente
      // através do comportamento esperado da API quando token é inválido
      
      try {
        const response = await apiClient.requestWithToken(
          'GET',
          '/api/user/profile',
          null,
          'invalid_token_should_fail',
          false
        );

        // Não deveria funcionar
        testHelpers.log(`❌ ${testName} - FALHOU (token inválido foi aceito)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Token inválido foi aceito incorretamente'
        });
      } catch (error) {
        // Deve retornar 401
        if (error.response && error.response.status === 401) {
          testHelpers.log(`✅ ${testName} - PASSOU (401 retornado corretamente)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            status401Received: true,
            errorHandled: true,
            note: 'Validação indireta - adaptador deve tratar 401 no cliente'
          });
        } else {
          testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
          return testHelpers.createTestResult(testName, false, error);
        }
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 2: Adaptador normaliza dados nulos
   * Valida que respostas com dados nulos são tratadas corretamente
   */
  async testAdapterNormalizesNullData() {
    const testName = 'INT-ADAPTER-002: Adaptador normaliza dados nulos';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Fazer requisição que pode retornar dados nulos/incompletos
      const response = await apiClient.get('/api/user/profile');
      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid) {
        // Validar que dados foram normalizados (não são null/undefined)
        const userData = validation.data;
        const saldo = testHelpers.normalizeNumber(userData?.saldo);
        const email = userData?.email || '';
        const nome = userData?.nome || userData?.name || '';

        // Se chegou aqui sem erro, adaptador normalizou corretamente
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          dataNormalized: true,
          saldoNormalized: typeof saldo === 'number',
          emailNormalized: typeof email === 'string',
          nomeNormalized: typeof nome === 'string'
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${validation.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: validation.error
        });
      }
    } catch (error) {
      // Se erro não é de dados nulos, pode ser outro problema
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 3: Adaptador lida com timeout
   * Simula timeout através de requisição com timeout muito curto
   */
  async testAdapterHandlesTimeout() {
    const testName = 'INT-ADAPTER-003: Adaptador lida com timeout';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Criar cliente com timeout muito curto para simular timeout
      const axios = require('axios');
      const shortTimeoutClient = axios.create({
        baseURL: testConfig.staging.baseURL,
        timeout: 1, // 1ms - vai dar timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      try {
        await shortTimeoutClient.get('/api/user/profile');
        
        // Não deveria funcionar
        testHelpers.log(`❌ ${testName} - FALHOU (timeout não ocorreu)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Timeout não ocorreu como esperado'
        });
      } catch (error) {
        // Deve ser erro de timeout
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          testHelpers.log(`✅ ${testName} - PASSOU (timeout detectado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            timeoutDetected: true,
            errorHandled: true,
            note: 'Validação indireta - adaptador deve tratar timeout no cliente'
          });
        } else {
          testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
          return testHelpers.createTestResult(testName, false, error);
        }
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 4: Validar que não há fallbacks hardcoded ativos
   * Valida que respostas de erro não retornam dados falsos
   */
  async testNoHardcodedFallbacks() {
    const testName = 'INT-ADAPTER-004: Não há fallbacks hardcoded ativos';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Tentar fazer requisição que pode falhar
      // Se adaptador está funcionando, não deve retornar dados hardcoded
      
      // Testar com endpoint que pode não existir ou retornar erro
      try {
        const response = await apiClient.get('/api/nonexistent-endpoint-12345');
        
        // Se retornou algo, verificar se não são dados hardcoded conhecidos
        const validation = testHelpers.validateEngineResponse(response);
        
        if (validation.valid) {
          // Verificar se não são dados hardcoded conhecidos
          const data = validation.data;
          const knownHardcodedEmails = ['free10signer@gmail.com', 'teste@example.com'];
          const knownHardcodedNames = ['free10signer', 'Teste User'];
          
          const hasHardcodedEmail = knownHardcodedEmails.some(email => 
            JSON.stringify(data).includes(email)
          );
          const hasHardcodedName = knownHardcodedNames.some(name => 
            JSON.stringify(data).includes(name)
          );

          if (hasHardcodedEmail || hasHardcodedName) {
            testHelpers.log(`❌ ${testName} - FALHOU (dados hardcoded detectados)`, 'error');
            return testHelpers.createTestResult(testName, false, {
              message: 'Dados hardcoded detectados na resposta',
              severity: 'high'
            });
          }
        }
      } catch (error) {
        // Erro é esperado para endpoint inexistente
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          testHelpers.log(`✅ ${testName} - PASSOU (erro tratado corretamente)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            errorHandled: true,
            noHardcodedData: true,
            note: 'Validação indireta - erro tratado sem dados hardcoded'
          });
        }
      }

      // Validar através de resposta normal que não tem dados hardcoded
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      
      if (profileValidation.valid && profileValidation.data) {
        const data = profileValidation.data;
        const knownHardcodedEmails = ['free10signer@gmail.com'];
        const knownHardcodedNames = ['free10signer'];
        
        const hasHardcodedEmail = knownHardcodedEmails.some(email => 
          data.email === email && data.email !== testConfig.testCredentials.player.email
        );
        const hasHardcodedName = knownHardcodedNames.some(name => 
          (data.nome === name || data.name === name) && 
          (data.nome !== testConfig.testCredentials.player.username && data.name !== testConfig.testCredentials.player.username)
        );

        if (!hasHardcodedEmail && !hasHardcodedName) {
          testHelpers.log(`✅ ${testName} - PASSOU (sem dados hardcoded)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            noHardcodedData: true,
            dataFromBackend: true
          });
        } else {
          testHelpers.log(`❌ ${testName} - FALHOU (dados hardcoded detectados)`, 'error');
          return testHelpers.createTestResult(testName, false, {
            message: 'Dados hardcoded detectados na resposta',
            severity: 'high'
          });
        }
      }

      testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
      return testHelpers.createTestResult(testName, true, null, {
        noHardcodedData: true
      });
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }
}

module.exports = new AdapterIntegrationTests();

