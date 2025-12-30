// Cliente API para Testes
// FASE 2.5 - Testes Automatizados

const axios = require('axios');
const testConfig = require('../config/testConfig');
const authHelper = require('./authHelper');

/**
 * Cliente API configurado para testes
 * Inclui retry automático e tratamento de erros
 */
class TestAPIClient {
  constructor() {
    this.baseURL = testConfig.staging.baseURL;
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: testConfig.timeouts.api,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para adicionar token automaticamente
    this.instance.interceptors.request.use(
      async (config) => {
        // Se não tem token explícito, tentar obter do authHelper
        if (!config.headers.Authorization && !config.headers['x-admin-token']) {
          // Detectar se é requisição admin ou player
          if (config.url.includes('/admin/')) {
            const adminToken = await authHelper.getAdminToken();
            if (adminToken) {
              config.headers['x-admin-token'] = adminToken;
            }
          } else {
            const playerToken = await authHelper.getPlayerToken();
            if (playerToken) {
              config.headers.Authorization = `Bearer ${playerToken}`;
            }
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para retry automático em caso de erro de rede
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        // Se não tem _retryCount, inicializar
        if (!config._retryCount) {
          config._retryCount = 0;
        }

        // Se é erro de rede e ainda não excedeu tentativas
        if (
          (!error.response || error.code === 'ECONNABORTED') &&
          config._retryCount < testConfig.retry.maxAttempts
        ) {
          config._retryCount++;
          const delay = testConfig.retry.delay * Math.pow(testConfig.retry.backoffMultiplier, config._retryCount - 1);
          
          if (testConfig.verbose) {
            console.log(`🔄 [TestAPIClient] Retry ${config._retryCount}/${testConfig.retry.maxAttempts} após ${delay}ms`);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.instance(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get(url, config = {}) {
    return this.instance.get(url, config);
  }

  /**
   * POST request
   */
  async post(url, data = {}, config = {}) {
    return this.instance.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put(url, data = {}, config = {}) {
    return this.instance.put(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return this.instance.delete(url, config);
  }

  /**
   * Request com token explícito
   */
  async requestWithToken(method, url, data = null, token = null, isAdmin = false, extraConfig = {}) {
    const config = {
      method,
      url,
      headers: {},
      ...extraConfig
    };

    if (data) {
      config.data = data;
    }

    if (token) {
      if (isAdmin) {
        config.headers['x-admin-token'] = token;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return this.instance(config);
  }
}

module.exports = new TestAPIClient();

