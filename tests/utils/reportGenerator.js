// Gerador de Relatórios de Testes
// FASE 2.5 - Testes Automatizados

const fs = require('fs').promises;
const path = require('path');
const testHelpers = require('./testHelpers');

/**
 * Gerador de relatórios em Markdown
 */
class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      criticalFailures: [],
      highFailures: [],
      mediumFailures: [],
      lowFailures: [],
      tests: []
    };
  }

  /**
   * Adicionar resultado de teste
   */
  addTestResult(result) {
    this.results.total++;
    this.results.tests.push(result);

    if (result.passed) {
      this.results.passed++;
    } else {
      this.results.failed++;

      // Classificar por severidade
      if (result.error && result.error.severity) {
        const failure = {
          testName: result.testName,
          error: result.error.message,
          severity: result.error.severity
        };

        switch (result.error.severity) {
          case 'critical':
            this.results.criticalFailures.push(failure);
            break;
          case 'high':
            this.results.highFailures.push(failure);
            break;
          case 'medium':
            this.results.mediumFailures.push(failure);
            break;
          case 'low':
            this.results.lowFailures.push(failure);
            break;
        }
      }
    }
  }

  /**
   * Gerar relatório em Markdown
   */
  async generateReport() {
    const timestamp = new Date().toISOString();
    const reportDate = new Date().toLocaleDateString('pt-BR');
    const reportTime = new Date().toLocaleTimeString('pt-BR');

    // Calcular taxas
    const successRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(2)
      : 0;

    // Determinar status geral
    let status = '🟢 APTO';
    let statusColor = 'green';
    
    if (this.results.criticalFailures.length > 0) {
      status = '🔴 NÃO APTO';
      statusColor = 'red';
    } else if (this.results.highFailures.length > 0) {
      status = '🟡 APTO COM RESSALVAS';
      statusColor = 'yellow';
    }

    const report = `# 📊 RELATÓRIO DE TESTES AUTOMATIZADOS
## FASE 2.5 - Testes Funcionais em Staging

**Data:** ${reportDate}  
**Hora:** ${reportTime}  
**Timestamp:** ${timestamp}  
**Ambiente:** Staging  
**Versão:** Fase 1 Adaptadores + Engine V19

---

## 🎯 RESUMO EXECUTIVO

**Status Geral:** ${status}

**Decisão:** ${status === '🟢 APTO' ? '✅ APROVADO para FASE 3' : status === '🟡 APTO COM RESSALVAS' ? '⚠️ APROVADO COM RESSALVAS' : '❌ NÃO APROVADO'}

---

## 📊 ESTATÍSTICAS

| Métrica | Valor | Percentual |
|---------|-------|------------|
| **Total de Testes** | ${this.results.total} | 100% |
| **Testes Passados** | ${this.results.passed} | ${successRate}% |
| **Testes Falhados** | ${this.results.failed} | ${(100 - successRate).toFixed(2)}% |
| **Testes Bloqueados** | ${this.results.blocked} | - |

---

## ⚠️ FALHAS POR SEVERIDADE

### 🔴 Críticas (${this.results.criticalFailures.length})

${this.results.criticalFailures.length > 0 
  ? this.results.criticalFailures.map(f => `- **${f.testName}**: ${f.error}`).join('\n')
  : 'Nenhuma falha crítica encontrada ✅'}

### ⚠️ Altas (${this.results.highFailures.length})

${this.results.highFailures.length > 0 
  ? this.results.highFailures.map(f => `- **${f.testName}**: ${f.error}`).join('\n')
  : 'Nenhuma falha alta encontrada ✅'}

### ⚠️ Médias (${this.results.mediumFailures.length})

${this.results.mediumFailures.length > 0 
  ? this.results.mediumFailures.map(f => `- **${f.testName}**: ${f.error}`).join('\n')
  : 'Nenhuma falha média encontrada ✅'}

### ⚠️ Baixas (${this.results.lowFailures.length})

${this.results.lowFailures.length > 0 
  ? this.results.lowFailures.map(f => `- **${f.testName}**: ${f.error}`).join('\n')
  : 'Nenhuma falha baixa encontrada ✅'}

---

## 📋 DETALHAMENTO DE TESTES

${this.generateTestDetails()}

---

## 🔍 ANÁLISE DE RISCOS

${this.generateRiskAnalysis()}

---

## ✅ VALIDAÇÕES REALIZADAS

### **Adaptadores Validados**

${this.generateAdapterValidation()}

### **Fluxos Críticos Validados**

${this.generateFlowValidation()}

---

## 📝 RECOMENDAÇÕES

${this.generateRecommendations()}

---

## 🚀 PRÓXIMOS PASSOS

${this.generateNextSteps()}

---

## 📄 CONCLUSÃO

${this.generateConclusion()}

---

**Relatório gerado automaticamente em:** ${timestamp}  
**Status Final:** ${status}

`;

    // Garantir que diretório existe
    await fs.mkdir(this.reportsDir, { recursive: true });

    // Salvar relatório
    const filename = `test-report-${Date.now()}.md`;
    const filepath = path.join(this.reportsDir, filename);
    await fs.writeFile(filepath, report, 'utf-8');

    // Também salvar como latest
    const latestPath = path.join(this.reportsDir, 'latest-report.md');
    await fs.writeFile(latestPath, report, 'utf-8');

    testHelpers.log(`Relatório salvo em: ${filepath}`, 'success');

    return {
      filepath,
      filename,
      report
    };
  }

  generateTestDetails() {
    if (this.results.tests.length === 0) {
      return 'Nenhum teste executado.';
    }

    return this.results.tests.map(test => {
      const status = test.passed ? '✅' : '❌';
      const errorInfo = test.error 
        ? `\n  - **Erro:** ${test.error.message}\n  - **Severidade:** ${test.error.severity}\n  - **Status:** ${test.error.status || 'N/A'}`
        : '';
      
      return `### ${status} ${test.testName}

- **Status:** ${test.passed ? 'PASSOU' : 'FALHOU'}
- **Timestamp:** ${test.timestamp}${errorInfo}
`;
    }).join('\n');
  }

  generateRiskAnalysis() {
    const risks = [];

    if (this.results.criticalFailures.length > 0) {
      risks.push(`🔴 **CRÍTICO:** ${this.results.criticalFailures.length} falha(s) crítica(s) bloqueiam produção`);
    }

    if (this.results.highFailures.length > 0) {
      risks.push(`⚠️ **ALTO:** ${this.results.highFailures.length} falha(s) de alta severidade requerem atenção`);
    }

    if (this.results.passed / this.results.total < 0.8) {
      risks.push(`⚠️ **ALTO:** Taxa de sucesso abaixo de 80% (${((this.results.passed / this.results.total) * 100).toFixed(2)}%)`);
    }

    if (risks.length === 0) {
      return '✅ Nenhum risco crítico identificado.';
    }

    return risks.map(r => `- ${r}`).join('\n');
  }

  generateAdapterValidation() {
    const adapters = ['authAdapter', 'dataAdapter', 'errorAdapter', 'gameAdapter', 'paymentAdapter', 'withdrawAdapter', 'adminAdapter'];
    
    const adapterTests = this.results.tests.filter(t => 
      t.testName.toLowerCase().includes('adapter') || 
      adapters.some(a => t.testName.toLowerCase().includes(a.toLowerCase()))
    );

    const passed = adapterTests.filter(t => t.passed).length;
    const total = adapterTests.length;

    return `- **Testes de Adaptadores:** ${passed}/${total} passaram
- **Taxa de Sucesso:** ${total > 0 ? ((passed / total) * 100).toFixed(2) : 0}%`;
  }

  generateFlowValidation() {
    const flows = ['Autenticação', 'Jogo', 'Pagamentos', 'Saques', 'Admin'];
    
    const flowTests = flows.map(flow => {
      const tests = this.results.tests.filter(t => 
        t.testName.toLowerCase().includes(flow.toLowerCase())
      );
      const passed = tests.filter(t => t.passed).length;
      return `- **${flow}:** ${passed}/${tests.length} testes passaram`;
    });

    return flowTests.join('\n');
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.criticalFailures.length > 0) {
      recommendations.push('🔴 **CRÍTICO:** Corrigir todas as falhas críticas antes de avançar para FASE 3');
    }

    if (this.results.highFailures.length > 0) {
      recommendations.push('⚠️ **ALTO:** Revisar e corrigir falhas de alta severidade');
    }

    if (this.results.passed / this.results.total < 0.8) {
      recommendations.push('⚠️ **ALTO:** Melhorar taxa de sucesso para pelo menos 80%');
    }

    if (recommendations.length === 0) {
      return '✅ Nenhuma recomendação crítica. Sistema pronto para FASE 3.';
    }

    return recommendations.map(r => `- ${r}`).join('\n');
  }

  generateNextSteps() {
    const steps = [];

    if (this.results.criticalFailures.length > 0) {
      steps.push('1. Corrigir falhas críticas identificadas');
      steps.push('2. Re-executar testes após correções');
      steps.push('3. Validar que todas as falhas críticas foram resolvidas');
    } else if (this.results.highFailures.length > 0) {
      steps.push('1. Revisar falhas de alta severidade');
      steps.push('2. Decidir se são bloqueadores ou podem ser tratados na FASE 3');
      steps.push('3. Documentar riscos conhecidos');
    } else {
      steps.push('1. ✅ Testes automatizados concluídos com sucesso');
      steps.push('2. Executar testes manuais complementares (se necessário)');
      steps.push('3. Avançar para FASE 3 - Preparação para Deploy');
    }

    return steps.map(s => `- ${s}`).join('\n');
  }

  generateConclusion() {
    const successRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(2)
      : 0;

    if (this.results.criticalFailures.length > 0) {
      return `❌ **NÃO APTO para FASE 3**

Sistema apresenta ${this.results.criticalFailures.length} falha(s) crítica(s) que bloqueiam o avanço para produção. É necessário corrigir todas as falhas críticas antes de prosseguir.

**Taxa de Sucesso:** ${successRate}%  
**Falhas Críticas:** ${this.results.criticalFailures.length}  
**Status:** 🔴 BLOQUEADO`;
    }

    if (this.results.highFailures.length > 0 || successRate < 80) {
      return `🟡 **APTO COM RESSALVAS para FASE 3**

Sistema está funcional, mas apresenta ${this.results.highFailures.length} falha(s) de alta severidade. Recomenda-se revisar e corrigir antes do deploy em produção.

**Taxa de Sucesso:** ${successRate}%  
**Falhas Altas:** ${this.results.highFailures.length}  
**Status:** 🟡 APROVADO COM RESSALVAS`;
    }

    return `✅ **APTO para FASE 3**

Todos os testes automatizados passaram com sucesso. Sistema está pronto para avançar para a FASE 3 - Preparação para Deploy.

**Taxa de Sucesso:** ${successRate}%  
**Falhas Críticas:** 0  
**Status:** 🟢 APROVADO`;
  }

  /**
   * Resetar resultados
   */
  reset() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      criticalFailures: [],
      highFailures: [],
      mediumFailures: [],
      lowFailures: [],
      tests: []
    };
  }
}

module.exports = new ReportGenerator();

