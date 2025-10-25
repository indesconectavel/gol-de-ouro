// Teste de Carregamento do Dashboard - Gol de Ouro v1.2.0
// ======================================================
// Data: 24/10/2025
// Status: TESTE IMPLEMENTADO
// Versão: v1.2.0-dashboard-test
// GPT-4o Auto-Fix: Teste automatizado do Dashboard

import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { retryDataRequest } from '../utils/retryLogic';

/**
 * Testa o carregamento completo do Dashboard
 * @returns {Promise<Object>} Resultado do teste
 */
export const testDashboardLoading = async () => {
  const results = {
    success: true,
    errors: [],
    warnings: [],
    metrics: {
      startTime: Date.now(),
      endTime: null,
      duration: null,
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0
    },
    tests: {
      profile: { success: false, error: null, duration: 0 },
      pix: { success: false, error: null, duration: 0 },
      meta: { success: false, error: null, duration: 0 }
    }
  };

  console.log('🧪 [DASHBOARD TEST] Iniciando teste de carregamento...');

  try {
    // Teste 1: Endpoint /meta
    console.log('🧪 [DASHBOARD TEST] Testando endpoint /meta...');
    const metaStart = Date.now();
    try {
      const metaResponse = await retryDataRequest(() => 
        apiClient.get(API_ENDPOINTS.META)
      );
      results.tests.meta.success = true;
      results.tests.meta.duration = Date.now() - metaStart;
      results.metrics.successfulRequests++;
      console.log('✅ [DASHBOARD TEST] /meta OK');
    } catch (error) {
      results.tests.meta.error = error.message;
      results.tests.meta.duration = Date.now() - metaStart;
      results.metrics.failedRequests++;
      results.warnings.push(`Meta endpoint falhou: ${error.message}`);
      console.warn('⚠️ [DASHBOARD TEST] /meta FALHOU:', error.message);
    }
    results.metrics.requests++;

    // Teste 2: Endpoint de perfil
    console.log('🧪 [DASHBOARD TEST] Testando endpoint de perfil...');
    const profileStart = Date.now();
    try {
      const profileResponse = await retryDataRequest(() => 
        apiClient.get(API_ENDPOINTS.PROFILE)
      );
      results.tests.profile.success = true;
      results.tests.profile.duration = Date.now() - profileStart;
      results.metrics.successfulRequests++;
      console.log('✅ [DASHBOARD TEST] Perfil OK');
    } catch (error) {
      results.tests.profile.error = error.message;
      results.tests.profile.duration = Date.now() - profileStart;
      results.metrics.failedRequests++;
      results.errors.push(`Perfil endpoint falhou: ${error.message}`);
      console.error('❌ [DASHBOARD TEST] Perfil FALHOU:', error.message);
    }
    results.metrics.requests++;

    // Teste 3: Endpoint PIX
    console.log('🧪 [DASHBOARD TEST] Testando endpoint PIX...');
    const pixStart = Date.now();
    try {
      const pixResponse = await retryDataRequest(() => 
        apiClient.get(API_ENDPOINTS.PIX_USER)
      );
      results.tests.pix.success = true;
      results.tests.pix.duration = Date.now() - pixStart;
      results.metrics.successfulRequests++;
      console.log('✅ [DASHBOARD TEST] PIX OK');
    } catch (error) {
      results.tests.pix.error = error.message;
      results.tests.pix.duration = Date.now() - pixStart;
      results.metrics.failedRequests++;
      results.warnings.push(`PIX endpoint falhou: ${error.message}`);
      console.warn('⚠️ [DASHBOARD TEST] PIX FALHOU:', error.message);
    }
    results.metrics.requests++;

  } catch (error) {
    results.success = false;
    results.errors.push(`Erro geral no teste: ${error.message}`);
    console.error('❌ [DASHBOARD TEST] Erro geral:', error);
  }

  // Finalizar métricas
  results.metrics.endTime = Date.now();
  results.metrics.duration = results.metrics.endTime - results.metrics.startTime;

  // Determinar sucesso geral
  const criticalTests = ['profile'];
  const criticalFailures = criticalTests.filter(test => !results.tests[test].success);
  
  if (criticalFailures.length > 0) {
    results.success = false;
  }

  // Log do resultado
  console.log('🧪 [DASHBOARD TEST] Resultado do teste:');
  console.log('📊 [DASHBOARD TEST] Sucesso:', results.success);
  console.log('📊 [DASHBOARD TEST] Duração:', `${results.metrics.duration}ms`);
  console.log('📊 [DASHBOARD TEST] Requests:', `${results.metrics.successfulRequests}/${results.metrics.requests} bem-sucedidos`);
  console.log('📊 [DASHBOARD TEST] Erros:', results.errors.length);
  console.log('📊 [DASHBOARD TEST] Avisos:', results.warnings.length);

  return results;
};

/**
 * Teste rápido do Dashboard (apenas endpoints críticos)
 * @returns {Promise<Object>} Resultado do teste rápido
 */
export const quickDashboardTest = async () => {
  console.log('⚡ [DASHBOARD TEST] Teste rápido iniciado...');
  
  try {
    // Apenas teste do perfil (crítico)
    const profileResponse = await retryDataRequest(() => 
      apiClient.get(API_ENDPOINTS.PROFILE)
    );
    
    console.log('⚡ [DASHBOARD TEST] Teste rápido OK');
    return { success: true, message: 'Dashboard carregando corretamente' };
    
  } catch (error) {
    console.error('⚡ [DASHBOARD TEST] Teste rápido FALHOU:', error.message);
    return { success: false, message: `Erro: ${error.message}` };
  }
};

export default {
  testDashboardLoading,
  quickDashboardTest
};
