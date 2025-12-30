// Runner Principal de Testes
// FASE 2.5 - Testes Automatizados

// Carregar variáveis de ambiente primeiro
require('./scripts/load-env');

const authHelper = require('./utils/authHelper');
const reportGenerator = require('./utils/reportGenerator');
const testHelpers = require('./utils/testHelpers');
const testConfig = require('./config/testConfig');

// Importar todos os testes
const authTests = require('./api/auth.test');
const gameTests = require('./api/game.test');
const paymentTests = require('./api/payment.test');
const withdrawTests = require('./api/withdraw.test');
const adminTests = require('./api/admin.test');
const adapterTests = require('./integration/adapters.test');
const stressTests = require('./stress/stress.test');

/**
 * Runner principal de testes
 */
class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = [];
  }

  async runAll() {
    testHelpers.log('═══════════════════════════════════════════════════════', 'info');
    testHelpers.log('🧪 INICIANDO TESTES AUTOMATIZADOS - FASE 2.5.1', 'info');
    testHelpers.log('🔒 ESTRATÉGIA ANTI-RATE-LIMIT ATIVA', 'info');
    testHelpers.log('═══════════════════════════════════════════════════════', 'info');
    testHelpers.log(`Ambiente: ${testConfig.environment}`, 'info');
    testHelpers.log(`Base URL: ${testConfig.staging.baseURL}`, 'info');
    testHelpers.log('', 'info');

    // Resetar gerador de relatórios
    reportGenerator.reset();

    try {
      // ============================================================
      // BLOCO A: TESTES SEM AUTENTICAÇÃO
      // ============================================================
      testHelpers.log('📡 BLOCO A: Testes SEM Autenticação', 'info');
      testHelpers.log('───────────────────────────────────────────────────', 'info');
      testHelpers.log('Executando testes que NÃO requerem token...', 'info');
      testHelpers.log('', 'info');

      // Testes públicos primeiro (métricas, health check)
      // Nota: Alguns testes de stress também são sem autenticação
      const stressResults = await stressTests.runAll();
      this.results.push(...stressResults);
      
      // Delay entre blocos
      await testHelpers.sleep(2000);

      // ============================================================
      // BLOCO B: TESTES AUTENTICADOS
      // ============================================================
      testHelpers.log('', 'info');
      testHelpers.log('🔐 BLOCO B: Testes COM Autenticação', 'info');
      testHelpers.log('───────────────────────────────────────────────────', 'info');
      testHelpers.log('Fazendo login único para todos os testes...', 'info');
      
      // Login único no início do bloco B
      const loginResult = await authHelper.loginPlayer();
      if (!loginResult.success) {
        testHelpers.log(`❌ ERRO CRÍTICO: Não foi possível fazer login inicial`, 'error');
        testHelpers.log(`Erro: ${loginResult.error}`, 'error');
        throw new Error(`Login inicial falhou: ${loginResult.error}`);
      }
      testHelpers.log(`✅ Login inicial bem-sucedido - Token armazenado em cache`, 'success');
      testHelpers.log('', 'info');

      // Delay após login
      await testHelpers.sleep(1000);

      // Testes de autenticação (alguns podem precisar de múltiplos logins, mas controlados)
      testHelpers.log('Executando testes de autenticação...', 'info');
      const authResults = await authTests.runAll();
      this.results.push(...authResults);
      await testHelpers.sleep(1000);

      // Testes de jogo (usam token do cache)
      testHelpers.log('Executando testes de jogo...', 'info');
      const gameResults = await gameTests.runAll();
      this.results.push(...gameResults);
      await testHelpers.sleep(1000);

      // Testes de pagamentos (usam token do cache)
      testHelpers.log('Executando testes de pagamentos...', 'info');
      const paymentResults = await paymentTests.runAll();
      this.results.push(...paymentResults);
      await testHelpers.sleep(1000);

      // Testes de saques (usam token do cache)
      testHelpers.log('Executando testes de saques...', 'info');
      const withdrawResults = await withdrawTests.runAll();
      this.results.push(...withdrawResults);
      await testHelpers.sleep(1000);

      // Testes de admin (podem precisar de token admin separado)
      testHelpers.log('Executando testes de admin...', 'info');
      const adminResults = await adminTests.runAll();
      this.results.push(...adminResults);
      await testHelpers.sleep(1000);

      // Testes de integração de adaptadores (usam token do cache)
      testHelpers.log('', 'info');
      testHelpers.log('🔗 Testes de Integração de Adaptadores', 'info');
      testHelpers.log('───────────────────────────────────────────────────', 'info');
      const adapterResults = await adapterTests.runAll();
      this.results.push(...adapterResults);

      // Adicionar todos os resultados ao gerador de relatórios
      this.results.forEach(result => {
        reportGenerator.addTestResult(result);
      });

      // Gerar relatório
      testHelpers.log('', 'info');
      testHelpers.log('📊 Gerando relatório...', 'info');
      const report = await reportGenerator.generateReport();

      // Exibir resumo
      this.displaySummary();

      return {
        success: reportGenerator.results.criticalFailures.length === 0,
        results: this.results,
        report: report
      };
    } catch (error) {
      testHelpers.log(`❌ Erro fatal ao executar testes: ${error.message}`, 'error');
      console.error(error);
      
      // Gerar relatório mesmo com erro
      await reportGenerator.generateReport();
      
      throw error;
    }
  }

  displaySummary() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    const stats = reportGenerator.results;

    testHelpers.log('', 'info');
    testHelpers.log('═══════════════════════════════════════════════════════', 'info');
    testHelpers.log('📊 RESUMO DOS TESTES', 'info');
    testHelpers.log('═══════════════════════════════════════════════════════', 'info');
    testHelpers.log(`Total de Testes: ${stats.total}`, 'info');
    testHelpers.log(`✅ Passaram: ${stats.passed}`, 'success');
    testHelpers.log(`❌ Falharam: ${stats.failed}`, stats.failed > 0 ? 'error' : 'info');
    testHelpers.log(`⏸️ Bloqueados: ${stats.blocked}`, 'info');
    testHelpers.log(`🔴 Críticas: ${stats.criticalFailures.length}`, stats.criticalFailures.length > 0 ? 'error' : 'info');
    testHelpers.log(`⚠️ Altas: ${stats.highFailures.length}`, stats.highFailures.length > 0 ? 'warning' : 'info');
    testHelpers.log(`Tempo de Execução: ${duration}s`, 'info');
    
    const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
    testHelpers.log(`Taxa de Sucesso: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
    
    testHelpers.log('', 'info');

    // Decisão
    let decision = '🟢 APTO';
    if (stats.criticalFailures.length > 0) {
      decision = '🔴 NÃO APTO';
    } else if (stats.highFailures.length > 0 || successRate < 80) {
      decision = '🟡 APTO COM RESSALVAS';
    }

    testHelpers.log(`Decisão: ${decision}`, decision.includes('NÃO') ? 'error' : decision.includes('RESSALVAS') ? 'warning' : 'success');
    testHelpers.log('═══════════════════════════════════════════════════════', 'info');
    testHelpers.log('', 'info');
    testHelpers.log(`📄 Relatório completo salvo em: tests/reports/latest-report.md`, 'info');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = TestRunner;

