const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

class SimpleAudit {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async runAudit() {
    const spinner = ora('Executando auditoria completa...').start();
    
    try {
      const results = {
        timestamp: this.timestamp,
        system: await this.auditSystem(),
        backend: await this.auditBackend(),
        frontend: await this.auditFrontend(),
        security: await this.auditSecurity(),
        performance: await this.auditPerformance(),
        deployment: await this.auditDeployment(),
        recommendations: []
      };

      // Gerar recomendações
      results.recommendations = this.generateRecommendations(results);
      
      spinner.succeed('Auditoria completa finalizada!');
      
      // Gerar relatório
      await this.generateReport(results);
      
      return results;
      
    } catch (error) {
      spinner.fail('Erro na auditoria: ' + error.message);
      console.error(chalk.red(error));
      throw error;
    }
  }

  async auditSystem() {
    return {
      os: process.platform,
      node: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      issues: [],
      score: 100
    };
  }

  async auditBackend() {
    const backend = {
      status: 'unknown',
      health: 'unknown',
      memory: 'unknown',
      performance: 'unknown',
      issues: [],
      score: 100
    };

    try {
      // Verificar se o servidor está rodando
      const axios = require('axios');
      const response = await axios.get('https://goldeouro-backend-v2.fly.dev/health', { timeout: 5000 });
      
      backend.status = 'online';
      backend.health = response.data.status;
      backend.memory = response.data.memory;
      
      // Verificar uso de memória
      if (response.data.memory.heapPercent > 80) {
        backend.issues.push({
          type: 'warning',
          message: `Uso de memória alto: ${response.data.memory.heapPercent}%`,
          recommendation: 'Otimizar memória do backend'
        });
        backend.score -= 15;
      }
      
    } catch (error) {
      backend.status = 'offline';
      backend.issues.push({
        type: 'error',
        message: 'Backend offline ou inacessível',
        recommendation: 'Verificar deploy e configuração'
      });
      backend.score -= 50;
    }

    return backend;
  }

  async auditFrontend() {
    const frontend = {
      admin: { status: 'unknown', issues: [] },
      player: { status: 'unknown', issues: [] },
      score: 100
    };

    try {
      // Verificar Admin
      const axios = require('axios');
      const adminResponse = await axios.get('https://admin.goldeouro.lol/', { timeout: 5000 });
      frontend.admin.status = 'online';
    } catch (error) {
      frontend.admin.status = 'offline';
      frontend.admin.issues.push({
        type: 'error',
        message: 'Admin frontend offline',
        recommendation: 'Corrigir deploy do admin'
      });
      frontend.score -= 25;
    }

    try {
      // Verificar Player
      const playerResponse = await axios.get('https://player.goldeouro.lol/', { timeout: 5000 });
      frontend.player.status = 'online';
    } catch (error) {
      frontend.player.status = 'offline';
      frontend.player.issues.push({
        type: 'error',
        message: 'Player frontend offline',
        recommendation: 'Verificar deploy do player'
      });
      frontend.score -= 25;
    }

    return frontend;
  }

  async auditSecurity() {
    const security = {
      csp: 'unknown',
      https: 'unknown',
      headers: 'unknown',
      vulnerabilities: [],
      score: 100
    };

    // Verificar arquivos de configuração
    const vercelFiles = [
      'goldeouro-admin/vercel.json',
      'goldeouro-player/vercel.json'
    ];

    for (const file of vercelFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        if (content.includes('Content-Security-Policy')) {
          security.csp = 'configured';
        } else {
          security.csp = 'missing';
          security.vulnerabilities.push({
            type: 'warning',
            message: `CSP não configurado em ${file}`,
            recommendation: 'Configurar Content Security Policy'
          });
          security.score -= 10;
        }
      }
    }

    return security;
  }

  async auditPerformance() {
    const performance = {
      buildSize: 'unknown',
      loadTime: 'unknown',
      optimization: 'unknown',
      issues: [],
      score: 100
    };

    return performance;
  }

  async auditDeployment() {
    const deployment = {
      backend: 'unknown',
      frontend: 'unknown',
      cdn: 'unknown',
      issues: [],
      score: 100
    };

    // Verificar se os arquivos de deploy existem
    const deployFiles = [
      'fly.toml',
      'Dockerfile.optimized',
      'goldeouro-admin/vercel.json',
      'goldeouro-player/vercel.json'
    ];

    for (const file of deployFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!(await fs.pathExists(filePath))) {
        deployment.issues.push({
          type: 'error',
          message: `Arquivo de deploy ausente: ${file}`,
          recommendation: 'Criar arquivo de configuração'
        });
        deployment.score -= 15;
      }
    }

    return deployment;
  }

  generateRecommendations(auditResults) {
    const recommendations = [];

    // Recomendações baseadas nos resultados
    if (auditResults.backend && auditResults.backend.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'backend',
        title: 'Otimizar Backend',
        description: 'Backend com problemas de performance ou disponibilidade',
        actions: [
          'Verificar logs do Fly.io',
          'Otimizar uso de memória',
          'Implementar cache',
          'Configurar monitoramento'
        ]
      });
    }

    if (auditResults.frontend && auditResults.frontend.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'frontend',
        title: 'Corrigir Frontends',
        description: 'Frontends com problemas de deploy ou configuração',
        actions: [
          'Corrigir deploy do admin',
          'Verificar configurações do Vercel',
          'Otimizar CSP',
          'Implementar testes E2E'
        ]
      });
    }

    if (auditResults.security && auditResults.security.score < 90) {
      recommendations.push({
        priority: 'medium',
        category: 'security',
        title: 'Melhorar Segurança',
        description: 'Implementar melhorias de segurança',
        actions: [
          'Configurar CSP adequadamente',
          'Implementar headers de segurança',
          'Fazer scan de vulnerabilidades',
          'Configurar HTTPS'
        ]
      });
    }

    // Recomendações padrão
    recommendations.push({
      priority: 'medium',
      category: 'general',
      title: 'Implementar Monitoramento',
      description: 'Sistema precisa de monitoramento contínuo',
      actions: [
        'Configurar health checks',
        'Implementar logging',
        'Configurar alertas',
        'Criar dashboards'
      ]
    });

    return recommendations;
  }

  async generateReport(results) {
    const reportDir = path.join(this.projectRoot, 'audit-reports');
    await fs.ensureDir(reportDir);
    
    const reportPath = path.join(reportDir, `audit-report-${this.timestamp}.json`);
    await fs.writeJson(reportPath, results, { spaces: 2 });
    
    // Gerar relatório em Markdown
    const markdownReport = this.generateMarkdownReport(results);
    const markdownPath = path.join(reportDir, `audit-report-${this.timestamp}.md`);
    await fs.writeFile(markdownPath, markdownReport);
    
    console.log(chalk.green(`\n📊 Relatórios gerados:`));
    console.log(chalk.blue(`  JSON: ${reportPath}`));
    console.log(chalk.blue(`  Markdown: ${markdownPath}`));
  }

  generateMarkdownReport(results) {
    return `# 🔍 RELATÓRIO DE AUDITORIA COMPLETA
## Data: ${new Date().toLocaleString('pt-BR')}

---

## 📊 RESUMO EXECUTIVO

### ✅ SISTEMA
- **Status:** ${results.system.score >= 80 ? '✅ Bom' : '⚠️ Atenção'}
- **Score:** ${results.system.score}/100
- **Problemas:** ${results.system.issues.length}

### 🔧 BACKEND
- **Status:** ${results.backend.status}
- **Score:** ${results.backend.score}/100
- **Problemas:** ${results.backend.issues.length}

### 🎨 FRONTEND
- **Admin:** ${results.frontend.admin.status}
- **Player:** ${results.frontend.player.status}
- **Score:** ${results.frontend.score}/100

### 🔒 SEGURANÇA
- **CSP:** ${results.security.csp}
- **Score:** ${results.security.score}/100
- **Vulnerabilidades:** ${results.security.vulnerabilities.length}

---

## 🚨 PROBLEMAS IDENTIFICADOS

${results.system.issues.map(issue => `- **${issue.type.toUpperCase()}:** ${issue.message}`).join('\n')}
${results.backend.issues.map(issue => `- **${issue.type.toUpperCase()}:** ${issue.message}`).join('\n')}
${results.frontend.admin.issues.map(issue => `- **${issue.type.toUpperCase()}:** ${issue.message}`).join('\n')}
${results.frontend.player.issues.map(issue => `- **${issue.type.toUpperCase()}:** ${issue.message}`).join('\n')}

---

## 🎯 RECOMENDAÇÕES

${results.recommendations.map(rec => `
### ${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.title}
**Categoria:** ${rec.category}
**Descrição:** ${rec.description}

**Ações:**
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('\n')}

---

## 📈 PRÓXIMOS PASSOS

1. **IMEDIATO:** Corrigir problemas críticos
2. **CURTO PRAZO:** Implementar recomendações de alta prioridade
3. **MÉDIO PRAZO:** Melhorar segurança e performance
4. **LONGO PRAZO:** Implementar monitoramento contínuo

---

**Relatório gerado automaticamente pelo Sistema MCP Gol de Ouro** 🚀
`;
  }
}

// Executar auditoria
async function main() {
  const audit = new SimpleAudit();
  try {
    const results = await audit.runAudit();
    console.log(chalk.green('\n✅ Auditoria concluída com sucesso!'));
  } catch (error) {
    console.error(chalk.red('\n❌ Erro na auditoria:'), error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleAudit;
