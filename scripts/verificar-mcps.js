#!/usr/bin/env node
/**
 * 🔍 VERIFICADOR DE MCPs - GOL DE OURO
 * 
 * Este script verifica se todos os MCPs estão configurados corretamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MCPs_TO_VERIFY = [
  { name: 'vercel', command: 'npx vercel --version', env: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'] },
  { name: 'flyio', command: 'flyctl version', env: ['FLY_API_TOKEN'] },
  { name: 'supabase', command: 'node test-supabase.js', env: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { name: 'github-actions', command: 'gh --version', env: ['GITHUB_TOKEN'] },
  { name: 'lighthouse', command: 'npx lighthouse --version', env: [] },
  { name: 'docker', command: 'docker --version', env: [] },
  { name: 'sentry', command: 'npx @sentry/cli --version', env: ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'] },
  { name: 'postgres', command: 'psql --version', env: ['DATABASE_URL'] },
  { name: 'jest', command: 'npx jest --version', env: [] },
  { name: 'eslint', command: 'npx eslint --version', env: [] }
];

class MCPVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      mcps: [],
      env: {},
      summary: {
        total: 0,
        working: 0,
        failed: 0,
        missingEnv: 0
      }
    };
  }

  checkEnvVars() {
    console.log('🔍 Verificando variáveis de ambiente...\n');
    
    const allEnvVars = new Set();
    MCPs_TO_VERIFY.forEach(mcp => {
      mcp.env.forEach(env => allEnvVars.add(env));
    });

    const envStatus = {};
    allEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      envStatus[envVar] = {
        set: !!value,
        length: value ? value.length : 0,
        preview: value ? `${value.substring(0, 10)}...` : 'não definida'
      };
    });

    this.results.env = envStatus;

    // Mostrar status
    console.log('📋 Variáveis de Ambiente:\n');
    Object.entries(envStatus).forEach(([key, status]) => {
      const icon = status.set ? '✅' : '❌';
      console.log(`${icon} ${key}: ${status.set ? 'Definida' : 'Não definida'}`);
      if (status.set) {
        console.log(`   Preview: ${status.preview}`);
      }
    });

    return envStatus;
  }

  async verifyMCP(mcp) {
    const result = {
      name: mcp.name,
      command: mcp.command,
      commandWorking: false,
      envVars: {},
      status: 'unknown',
      error: null
    };

    // Verificar variáveis de ambiente
    mcp.env.forEach(envVar => {
      result.envVars[envVar] = !!process.env[envVar];
    });

    const missingEnv = mcp.env.filter(env => !process.env[env]);
    if (missingEnv.length > 0) {
      result.status = 'missing_env';
      result.error = `Variáveis de ambiente faltando: ${missingEnv.join(', ')}`;
      return result;
    }

    // Testar comando
    try {
      const output = execSync(mcp.command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 10000 
      });
      result.commandWorking = true;
      result.status = 'working';
      result.output = output.substring(0, 100); // Primeiros 100 caracteres
    } catch (error) {
      result.commandWorking = false;
      result.status = 'failed';
      result.error = error.message;
    }

    return result;
  }

  async verifyAll() {
    console.log('\n🔍 Verificando MCPs...\n');

    for (const mcp of MCPs_TO_VERIFY) {
      console.log(`📦 Verificando ${mcp.name}...`);
      const result = await this.verifyMCP(mcp);
      this.results.mcps.push(result);
      this.results.summary.total++;

      if (result.status === 'working') {
        console.log(`  ✅ ${mcp.name}: Funcionando`);
        this.results.summary.working++;
      } else if (result.status === 'missing_env') {
        console.log(`  ⚠️  ${mcp.name}: Variáveis de ambiente faltando`);
        this.results.summary.missingEnv++;
      } else {
        console.log(`  ❌ ${mcp.name}: Erro - ${result.error}`);
        this.results.summary.failed++;
      }
    }
  }

  generateReport() {
    console.log('\n📊 RESUMO DA VERIFICAÇÃO\n');
    console.log(`Total de MCPs: ${this.results.summary.total}`);
    console.log(`✅ Funcionando: ${this.results.summary.working}`);
    console.log(`⚠️  Faltando variáveis: ${this.results.summary.missingEnv}`);
    console.log(`❌ Com erros: ${this.results.summary.failed}`);

    // Salvar relatório
    const reportPath = path.join(__dirname, '..', 'docs', 'mcps', 'VERIFICACAO-MCPS.json');
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2), 'utf8');
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);

    // Gerar relatório em Markdown
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = path.join(__dirname, '..', 'docs', 'mcps', 'VERIFICACAO-MCPS.md');
    fs.writeFileSync(markdownPath, markdownReport, 'utf8');
    console.log(`📄 Relatório Markdown salvo em: ${markdownPath}`);
  }

  generateMarkdownReport() {
    return `# 🔍 VERIFICAÇÃO DE MCPs - GOL DE OURO

**Data:** ${new Date().toLocaleString('pt-BR')}  
**Versão:** 1.2.0  
**Status:** ✅ **VERIFICAÇÃO COMPLETA REALIZADA**

---

## 📊 RESUMO EXECUTIVO

- **Total de MCPs:** ${this.results.summary.total}
- **✅ Funcionando:** ${this.results.summary.working}
- **⚠️ Faltando Variáveis:** ${this.results.summary.missingEnv}
- **❌ Com Erros:** ${this.results.summary.failed}

---

## 🔍 DETALHES POR MCP

${this.results.mcps.map(mcp => `
### ${mcp.name}

- **Status:** ${mcp.status === 'working' ? '✅ Funcionando' : mcp.status === 'missing_env' ? '⚠️ Faltando Variáveis' : '❌ Erro'}
- **Comando:** \`${mcp.command}\`
- **Comando Funcionando:** ${mcp.commandWorking ? '✅ Sim' : '❌ Não'}
${mcp.error ? `- **Erro:** ${mcp.error}` : ''}
${Object.keys(mcp.envVars).length > 0 ? `
**Variáveis de Ambiente:**
${Object.entries(mcp.envVars).map(([key, set]) => `- ${key}: ${set ? '✅ Definida' : '❌ Não definida'}`).join('\n')}
` : ''}
`).join('\n')}

---

## 📋 VARIÁVEIS DE AMBIENTE

${Object.entries(this.results.env).map(([key, status]) => `
### ${key}
- **Status:** ${status.set ? '✅ Definida' : '❌ Não definida'}
- **Tamanho:** ${status.length} caracteres
- **Preview:** ${status.preview}
`).join('\n')}

---

## ✅ PRÓXIMOS PASSOS

${this.results.summary.missingEnv > 0 ? `
### 1. Configurar Variáveis de Ambiente Faltando

As seguintes variáveis precisam ser configuradas:
${this.results.mcps.filter(m => m.status === 'missing_env').map(m => 
  `- **${m.name}:** ${Object.entries(m.envVars).filter(([_, set]) => !set).map(([key]) => key).join(', ')}`
).join('\n')}
` : ''}

${this.results.summary.failed > 0 ? `
### 2. Corrigir MCPs com Erros

Os seguintes MCPs precisam de correção:
${this.results.mcps.filter(m => m.status === 'failed').map(m => 
  `- **${m.name}:** ${m.error}`
).join('\n')}
` : ''}

### 3. Testar MCPs Individualmente

Teste cada MCP individualmente para garantir funcionamento completo.

---

**Relatório gerado automaticamente pelo Sistema MCP Gol de Ouro** 🚀
`;
  }

  async run() {
    console.log('🔍 Iniciando verificação de MCPs...\n');
    
    this.checkEnvVars();
    await this.verifyAll();
    this.generateReport();

    // Retornar código de saída baseado nos resultados
    if (this.results.summary.failed > 0 || this.results.summary.missingEnv > 0) {
      console.log('\n⚠️ Alguns MCPs precisam de atenção!');
      return 1;
    } else {
      console.log('\n✅ Todos os MCPs estão funcionando corretamente!');
      return 0;
    }
  }
}

// Executar verificação
if (require.main === module) {
  const verifier = new MCPVerifier();
  verifier.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = MCPVerifier;

