// Testes de API - Saques
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const testConfig = require('../config/testConfig');

/**
 * Testes de Saques
 */
class WithdrawTests {
  async runAll() {
    testHelpers.log('Iniciando testes de saques...', 'info');

    const results = [];

    // Garantir que temos token válido
    await authHelper.getPlayerToken();

    // Teste 1: Validar saldo antes de saque
    results.push(await this.testValidateBalanceBeforeWithdraw());

    // Teste 2: Saque com saldo suficiente
    results.push(await this.testWithdrawWithBalance());

    // Teste 3: Saque sem saldo suficiente
    results.push(await this.testWithdrawWithoutBalance());

    return results;
  }

  /**
   * Teste 1: Validar saldo antes de saque
   */
  async testValidateBalanceBeforeWithdraw() {
    const testName = 'API-WITHDRAW-001: Validar saldo antes de saque';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Obter saldo atual
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      
      if (!profileValidation.valid) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter saldo para validação'
        });
      }

      const currentBalance = testHelpers.normalizeNumber(profileValidation.data.saldo);
      const withdrawAmount = testConfig.testValues.testWithdrawAmount;

      // Validar saldo
      const validation = testHelpers.validateBalance(currentBalance, withdrawAmount);

      testHelpers.log(`✅ ${testName} - PASSOU (Saldo: R$ ${currentBalance.toFixed(2)}, Saque: R$ ${withdrawAmount.toFixed(2)})`, 'success');
      return testHelpers.createTestResult(testName, true, null, {
        currentBalance,
        withdrawAmount,
        sufficient: validation.sufficient,
        difference: validation.difference
      });
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 2: Saque com saldo suficiente
   */
  async testWithdrawWithBalance() {
    const testName = 'API-WITHDRAW-002: Saque com saldo suficiente';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Obter saldo atual
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      
      if (!profileValidation.valid) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter saldo para validação'
        });
      }

      const currentBalance = testHelpers.normalizeNumber(profileValidation.data.saldo);
      const withdrawAmount = Math.min(testConfig.testValues.testWithdrawAmount, currentBalance);

      if (withdrawAmount <= 0 || withdrawAmount < 10) {
        testHelpers.log(`⚠️ ${testName} - BLOQUEADO (saldo insuficiente)`, 'warning');
        return testHelpers.createTestResult(testName, false, {
          message: 'Saldo insuficiente para teste de saque',
          severity: 'low'
        });
      }

      // Criar saque
      const response = await apiClient.post('/api/withdraw', {
        amount: withdrawAmount,
        pixKey: testConfig.testValues.testPixKey,
        pixType: 'CPF'
      });

      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          withdrawAmount,
          withdrawId: validation.data.withdraw_id || validation.data.id,
          status: validation.data.status || 'pending',
          novoSaldo: validation.data.novo_saldo || validation.data.novoSaldo
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${validation.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: validation.error || 'Resposta inválida'
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 3: Saque sem saldo suficiente
   */
  async testWithdrawWithoutBalance() {
    const testName = 'API-WITHDRAW-003: Saque sem saldo suficiente';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Obter saldo atual
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      
      if (!profileValidation.valid) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter saldo para validação'
        });
      }

      const currentBalance = testHelpers.normalizeNumber(profileValidation.data.saldo);
      const withdrawAmount = currentBalance + 100; // Valor maior que o saldo

      // Tentar criar saque
      try {
        const response = await apiClient.post('/api/withdraw', {
          amount: withdrawAmount,
          pixKey: testConfig.testValues.testPixKey,
          pixType: 'CPF'
        });

        // Não deveria funcionar
        testHelpers.log(`❌ ${testName} - FALHOU (deveria ter retornado erro)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Saque com saldo insuficiente foi aceito incorretamente'
        });
      } catch (error) {
        // Erro é esperado
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            errorHandled: true,
            status: error.response.status,
            message: error.response.data?.message
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
}

module.exports = new WithdrawTests();

