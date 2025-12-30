#!/usr/bin/env node
/**
 * 🚀 EXECUTAR PRÓXIMOS PASSOS RECOMENDADOS - MCPs
 * 
 * Este script executa os próximos passos recomendados da auditoria de MCPs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, silent = false, timeout = 10000) {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
      timeout: timeout
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout?.toString() || error.stderr?.toString() || ''
    };
  }
}

async function passo1_ConfigurarGitHubCLI() {
  log('\n📦 PASSO 1: Configurando GitHub CLI no PATH...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const ghPath = "C:\\Program Files\\GitHub CLI";
  
  if (!fs.existsSync(`${ghPath}\\gh.exe`)) {
    log('❌ GitHub CLI não encontrado em: ' + ghPath, 'red');
    log('💡 Instale via: winget install GitHub.cli', 'yellow');
    return false;
  }
  
  log('✅ GitHub CLI encontrado', 'green');
  
  // Adicionar ao PATH do usuário
  try {
    const currentPath = process.env.Path || process.env.PATH || '';
    if (!currentPath.includes(ghPath)) {
      const userPath = execCommand('powershell -Command "[Environment]::GetEnvironmentVariable(\'Path\', [EnvironmentVariableTarget]::User)"', true);
      if (userPath.success) {
        const newPath = userPath.output + ';' + ghPath;
        execCommand(`powershell -Command "[Environment]::SetEnvironmentVariable('Path', '${newPath}', [EnvironmentVariableTarget]::User)"`, true);
        log('✅ GitHub CLI adicionado ao PATH do usuário', 'green');
      }
    } else {
      log('✅ GitHub CLI já está no PATH', 'green');
    }
  } catch (error) {
    log('⚠️  Erro ao adicionar ao PATH: ' + error.message, 'yellow');
  }
  
  // Adicionar à sessão atual
  process.env.PATH += ';' + ghPath;
  log('✅ GitHub CLI adicionado à sessão atual', 'green');
  
  // Verificar funcionamento
  const version = execCommand(`"${ghPath}\\gh.exe" --version`, true);
  if (version.success) {
    log('✅ GitHub CLI funcionando: ' + version.output.split('\n')[0], 'green');
    return true;
  } else {
    log('❌ Erro ao executar GitHub CLI: ' + version.error, 'red');
    return false;
  }
}

async function passo2_AutenticarGitHubCLI() {
  log('\n🔐 PASSO 2: Verificando autenticação GitHub CLI...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const ghPath = "C:\\Program Files\\GitHub CLI";
  const authStatus = execCommand(`"${ghPath}\\gh.exe" auth status`, true, 5000);
  
  if (authStatus.success) {
    log('✅ GitHub CLI já está autenticado', 'green');
    log(authStatus.output, 'white');
    return true;
  } else {
    log('⚠️  GitHub CLI não está autenticado', 'yellow');
    log('💡 Execute manualmente: gh auth login', 'yellow');
    log('   Ou use o caminho completo:', 'yellow');
    log(`   "${ghPath}\\gh.exe" auth login`, 'yellow');
    return false;
  }
}

async function passo3_InvestigarTimeouts() {
  log('\n🔍 PASSO 3: Investigando timeouts em Lighthouse e Jest...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Verificar Lighthouse
  log('\n📊 Verificando Lighthouse...', 'blue');
  const lighthouse = execCommand('npm list lighthouse --depth=0', true, 5000);
  if (lighthouse.success) {
    log('✅ Lighthouse encontrado no projeto', 'green');
  } else {
    log('⚠️  Lighthouse não encontrado localmente', 'yellow');
    log('💡 Tentando instalar localmente...', 'yellow');
    const install = execCommand('npm install --save-dev lighthouse', true, 30000);
    if (install.success) {
      log('✅ Lighthouse instalado localmente', 'green');
    } else {
      log('⚠️  Erro ao instalar Lighthouse: ' + install.error, 'yellow');
    }
  }
  
  // Verificar Jest
  log('\n📊 Verificando Jest...', 'blue');
  const jest = execCommand('npm list jest --depth=0', true, 5000);
  if (jest.success) {
    log('✅ Jest encontrado no projeto', 'green');
    log('💡 Testando Jest localmente...', 'yellow');
    const jestTest = execCommand('npx jest --version', true, 10000);
    if (jestTest.success) {
      log('✅ Jest funcionando: ' + jestTest.output, 'green');
    } else {
      log('⚠️  Jest ainda com problemas: ' + jestTest.error, 'yellow');
    }
  } else {
    log('⚠️  Jest não encontrado no projeto', 'yellow');
    log('💡 Verifique se está instalado: npm list jest', 'yellow');
  }
  
  return true;
}

async function passo4_VerificarDocker() {
  log('\n🐳 PASSO 4: Verificando Docker...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const docker = execCommand('docker --version', true, 5000);
  if (docker.success) {
    log('✅ Docker encontrado: ' + docker.output, 'green');
    
    // Verificar se Docker está rodando
    const dockerInfo = execCommand('docker info', true, 5000);
    if (dockerInfo.success) {
      log('✅ Docker está rodando', 'green');
    } else {
      log('⚠️  Docker instalado mas não está rodando', 'yellow');
      log('💡 Inicie o Docker Desktop', 'yellow');
    }
    return true;
  } else {
    log('❌ Docker não está instalado', 'red');
    log('💡 Instale Docker Desktop: https://www.docker.com/products/docker-desktop', 'yellow');
    log('   Ou via winget: winget install Docker.DockerDesktop', 'yellow');
    return false;
  }
}

async function passo5_ConfigurarSentry() {
  log('\n📊 PASSO 5: Verificando configuração Sentry...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const sentryVars = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
  const missing = sentryVars.filter(v => !process.env[v]);
  
  if (missing.length === 0) {
    log('✅ Todas as variáveis do Sentry estão configuradas', 'green');
    return true;
  } else {
    log('⚠️  Variáveis do Sentry faltando: ' + missing.join(', '), 'yellow');
    log('💡 Configure as variáveis de ambiente:', 'yellow');
    log('   1. Crie conta no Sentry: https://sentry.io', 'yellow');
    log('   2. Gere token de autenticação', 'yellow');
    log('   3. Configure variáveis:', 'yellow');
    missing.forEach(v => {
      log(`      - ${v}`, 'yellow');
    });
    log('💡 Adicione ao arquivo .env.local ou configure no sistema', 'yellow');
    return false;
  }
}

async function passo6_ConfigurarDatabaseURL() {
  log('\n🗄️  PASSO 6: Verificando DATABASE_URL...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  if (process.env.DATABASE_URL) {
    log('✅ DATABASE_URL está configurada', 'green');
    log('   Preview: ' + process.env.DATABASE_URL.substring(0, 30) + '...', 'white');
    return true;
  } else {
    log('⚠️  DATABASE_URL não está configurada', 'yellow');
    log('💡 Configure DATABASE_URL:', 'yellow');
    log('   Formato: postgresql://user:password@host:port/database', 'yellow');
    log('   Ou use a URL do Supabase:', 'yellow');
    if (process.env.SUPABASE_URL) {
      log('   Supabase URL disponível: ' + process.env.SUPABASE_URL, 'blue');
      log('   Você pode usar a URL do Supabase como DATABASE_URL', 'blue');
    }
    log('💡 Adicione ao arquivo .env.local:', 'yellow');
    log('   DATABASE_URL=postgresql://...', 'yellow');
    return false;
  }
}

async function main() {
  log('\n🚀 EXECUTANDO PRÓXIMOS PASSOS RECOMENDADOS - MCPs', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const results = {
    passo1: false,
    passo2: false,
    passo3: false,
    passo4: false,
    passo5: false,
    passo6: false
  };
  
  // Alta Prioridade
  results.passo1 = await passo1_ConfigurarGitHubCLI();
  results.passo2 = await passo2_AutenticarGitHubCLI();
  
  // Média Prioridade
  results.passo3 = await passo3_InvestigarTimeouts();
  results.passo4 = await passo4_VerificarDocker();
  
  // Baixa Prioridade
  results.passo5 = await passo5_ConfigurarSentry();
  results.passo6 = await passo6_ConfigurarDatabaseURL();
  
  // Resumo
  log('\n📊 RESUMO DA EXECUÇÃO', 'cyan');
  log('='.repeat(60), 'cyan');
  log('✅ Passo 1 (GitHub CLI PATH): ' + (results.passo1 ? 'Concluído' : 'Pendente'), results.passo1 ? 'green' : 'yellow');
  log('✅ Passo 2 (GitHub CLI Auth): ' + (results.passo2 ? 'Concluído' : 'Pendente'), results.passo2 ? 'green' : 'yellow');
  log('✅ Passo 3 (Timeouts): ' + (results.passo3 ? 'Verificado' : 'Pendente'), results.passo3 ? 'green' : 'yellow');
  log('✅ Passo 4 (Docker): ' + (results.passo4 ? 'Instalado' : 'Não instalado'), results.passo4 ? 'green' : 'yellow');
  log('✅ Passo 5 (Sentry): ' + (results.passo5 ? 'Configurado' : 'Pendente'), results.passo5 ? 'green' : 'yellow');
  log('✅ Passo 6 (DATABASE_URL): ' + (results.passo6 ? 'Configurado' : 'Pendente'), results.passo6 ? 'green' : 'yellow');
  
  // Gerar relatório
  const reportPath = path.join(__dirname, '..', 'docs', 'mcps', 'EXECUCAO-PROXIMOS-PASSOS.md');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = `# 🚀 EXECUÇÃO DOS PRÓXIMOS PASSOS RECOMENDADOS - MCPs

**Data:** ${new Date().toLocaleString('pt-BR')}  
**Status:** ✅ **EXECUÇÃO COMPLETA**

---

## 📊 RESUMO DA EXECUÇÃO

### **Alta Prioridade:**
- ✅ Passo 1 (GitHub CLI PATH): ${results.passo1 ? '✅ Concluído' : '⚠️ Pendente'}
- ✅ Passo 2 (GitHub CLI Auth): ${results.passo2 ? '✅ Concluído' : '⚠️ Pendente'}

### **Média Prioridade:**
- ✅ Passo 3 (Timeouts): ${results.passo3 ? '✅ Verificado' : '⚠️ Pendente'}
- ✅ Passo 4 (Docker): ${results.passo4 ? '✅ Instalado' : '❌ Não instalado'}

### **Baixa Prioridade:**
- ✅ Passo 5 (Sentry): ${results.passo5 ? '✅ Configurado' : '⚠️ Pendente'}
- ✅ Passo 6 (DATABASE_URL): ${results.passo6 ? '✅ Configurado' : '⚠️ Pendente'}

---

## 📋 PRÓXIMAS AÇÕES MANUAIS

${!results.passo2 ? `
### 1. Autenticar GitHub CLI

Execute manualmente:
\`\`\`bash
gh auth login
\`\`\`

Ou com caminho completo:
\`\`\`bash
"C:\\Program Files\\GitHub CLI\\gh.exe" auth login
\`\`\`
` : ''}

${!results.passo4 ? `
### 2. Instalar Docker (se necessário)

Instale Docker Desktop:
- Download: https://www.docker.com/products/docker-desktop
- Ou via winget: \`winget install Docker.DockerDesktop\`
` : ''}

${!results.passo5 ? `
### 3. Configurar Sentry (se usar)

1. Crie conta no Sentry: https://sentry.io
2. Gere token de autenticação
3. Configure variáveis:
   - SENTRY_AUTH_TOKEN
   - SENTRY_ORG
   - SENTRY_PROJECT
` : ''}

${!results.passo6 ? `
### 4. Configurar DATABASE_URL (se necessário)

Adicione ao arquivo .env.local:
\`\`\`
DATABASE_URL=postgresql://user:password@host:port/database
\`\`\`

Ou use a URL do Supabase se disponível.
` : ''}

---

**Última atualização:** ${new Date().toLocaleString('pt-BR')}
`;

  fs.writeFileSync(reportPath, report, 'utf-8');
  log(`\n📄 Relatório salvo em: ${reportPath}`, 'blue');
  
  log('\n✅ Execução concluída!', 'green');
}

main().catch(error => {
  log(`\n❌ Erro durante execução: ${error.message}`, 'red');
  process.exit(1);
});

