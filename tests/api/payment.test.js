// Testes de API - Pagamentos PIX
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const testConfig = require('../config/testConfig');

/**
 * Testes de Pagamentos PIX
 */
class PaymentTests {
  async runAll() {
    testHelpers.log('Iniciando testes de pagamentos...', 'info');

    const results = [];

    // Garantir que temos token válido
    await authHelper.getPlayerToken();

    // Teste 1: Criar pagamento PIX
    results.push(await this.testCreatePixPayment());

    // Teste 2: Verificar status de pagamento
    results.push(await this.testCheckPaymentStatus());

    // Teste 3: Obter dados PIX do usuário
    results.push(await this.testGetUserPixData());

    return results;
  }

  /**
   * Teste 1: Criar pagamento PIX
   */
  async testCreatePixPayment() {
    const testName = 'API-PAYMENT-001: Criar pagamento PIX';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const amount = testConfig.testValues.testPixAmount;

      const response = await apiClient.post('/api/payments/pix/criar', {
        amount
      });

      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        const paymentId = validation.data.payment_id || validation.data.id;
        const qrCode = validation.data.qr_code || validation.data.qrCode;

        testHelpers.log(`✅ ${testName} - PASSOU (Payment ID: ${paymentId})`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          paymentId,
          qrCodeReceived: !!qrCode,
          amount,
          status: validation.data.status || 'pending'
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
   * Teste 2: Verificar status de pagamento
   */
  async testCheckPaymentStatus() {
    const testName = 'API-PAYMENT-002: Verificar status de pagamento PIX';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Primeiro criar um pagamento
      const createResponse = await apiClient.post('/api/payments/pix/criar', {
        amount: testConfig.testValues.testPixAmount
      });

      const createValidation = testHelpers.validateEngineResponse(createResponse);
      
      if (!createValidation.valid || !createValidation.data) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível criar pagamento para teste'
        });
      }

      const paymentId = createValidation.data.payment_id || createValidation.data.id;

      if (!paymentId) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Payment ID não retornado'
        });
      }

      // Verificar status
      const statusResponse = await apiClient.get('/api/payments/pix/status', {
        params: { paymentId }
      });

      const statusValidation = testHelpers.validateEngineResponse(statusResponse);

      if (statusValidation.valid && statusValidation.data) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          paymentId,
          status: statusValidation.data.status,
          statusReceived: true
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${statusValidation.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: statusValidation.error || 'Resposta inválida'
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 3: Obter dados PIX do usuário
   */
  async testGetUserPixData() {
    const testName = 'API-PAYMENT-003: Obter dados PIX do usuário';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const response = await apiClient.get('/api/payments/pix/usuario');
      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          pixKeyReceived: !!validation.data.pix_key,
          historyReceived: Array.isArray(validation.data.historico_pagamentos || validation.data.history)
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
}

module.exports = new PaymentTests();

