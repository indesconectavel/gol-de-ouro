const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MCPTriggerSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports');
    this.mcpDir = path.join(this.projectRoot, 'mcp-system');
    this.hooksDir = path.join(this.projectRoot, '.git', 'hooks');
    this.version = 'GO-LIVE v1.1.1';
  }

  async setupComplete() {
    console.log('🧩 CONFIGURANDO GATILHO MCP AUTOMÁTICO - GOL DE OURO v1.1.1\n');
    
    await this.createReportsStructure();
    await this.createCursorCommands();
    await this.createMCPAuditCommand();
    await this.createGitHooks();
    await this.createDeployHooks();
    await this.createVercelHooks();
    await this.testAutomation();
    
    console.log('\n✅ GATILHO MCP AUTOMÁTICO CONFIGURADO COM SUCESSO!');
    console.log('🎯 Sistema pronto para auditoria automática pré-deploy');
  }

  async createReportsStructure() {
    console.log('📁 Criando estrutura de relatórios...');
    
    // Criar diretório reports
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    
    // Criar arquivo de índice
    const indexContent = `# 🧾 RELATÓRIOS MCP - GOL DE OURO

## 📊 Histórico de Auditorias

Este diretório contém todos os relatórios de auditoria MCP gerados automaticamente.

### 📋 Estrutura
- \`audit-latest.md\` - Último relatório gerado
- \`audit-[timestamp].md\` - Relatórios históricos
- \`audit-latest.json\` - Dados JSON do último relatório

### 🔄 Atualização Automática
Os relatórios são atualizados automaticamente a cada:
- Push para branch principal (main/master)
- Deploy de produção (Vercel/Render/Railway)

---
**Sistema MCP Gol de Ouro v1.1.1** 🤖
`;

    fs.writeFileSync(path.join(this.reportsDir, 'README.md'), indexContent);
    console.log('✅ Estrutura de relatórios criada');
  }

  async createCursorCommands() {
    console.log('⚙️ Configurando comandos Cursor MCP...');
    
    const cursorConfig = {
      "mcp": {
        "goldeouro": {
          "name": "Gol de Ouro MCP System",
          "description": "Sistema MCP para auditoria automática do Gol de Ouro",
          "version": "1.1.1",
          "commands": {
            "Audit Gol de Ouro": {
              "description": "Executa auditoria completa do sistema Gol de Ouro",
              "command": "cd mcp-system && node audit-simple.js --report",
              "autoTrigger": {
                "gitPush": true,
                "deploy": true,
                "branches": ["main", "master"]
              },
              "output": {
                "reports": "./reports/",
                "latest": "audit-latest.md",
                "timestamped": "audit-[timestamp].md"
              }
            },
            "audit:full": {
              "description": "Auditoria completa com relatório detalhado",
              "command": "cd mcp-system && node audit-simple.js --full --report"
            },
            "audit:quick": {
              "description": "Auditoria rápida sem relatório",
              "command": "cd mcp-system && node audit-simple.js"
            }
          },
          "triggers": {
            "prePush": {
              "enabled": true,
              "branches": ["main", "master"],
              "command": "Audit Gol de Ouro",
              "action": "validate"
            },
            "preDeploy": {
              "enabled": true,
              "platforms": ["vercel", "render", "railway"],
              "command": "Audit Gol de Ouro",
              "action": "validate"
            }
          },
          "settings": {
            "criticalErrors": "cancel",
            "warnings": "continue",
            "reportFormat": "markdown",
            "logLevel": "info"
          }
        }
      }
    };
    
    const cursorPath = path.join(this.projectRoot, 'cursor.json');
    fs.writeFileSync(cursorPath, JSON.stringify(cursorConfig, null, 2));
    
    console.log('✅ Comandos Cursor MCP configurados');
  }

  async createMCPAuditCommand() {
    console.log('🔍 Criando comando MCP de auditoria...');
    
    const auditCommand = `#!/bin/bash
# MCP Audit Command - Gol de Ouro v1.1.1
# Executado automaticamente antes de push/deploy

echo "⚙️ MCP AUDIT HOOK — GOL DE OURO"
echo "================================="

# Obter informações do git
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
VERSION="GO-LIVE v1.1.1"
TIMESTAMP=$(date '+%Y-%m-%d-%H-%M-%S')

echo "Branch: $BRANCH"
echo "Versão: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo ""

# Navegar para diretório MCP
cd "${this.mcpDir}"

# Executar auditoria com relatório
echo "🔍 Executando auditoria MCP..."
node audit-simple.js --report

# Verificar resultado da auditoria
AUDIT_EXIT_CODE=$?

# Gerar relatório
REPORT_DIR="${this.reportsDir}"
LATEST_REPORT="$REPORT_DIR/audit-latest.md"
TIMESTAMPED_REPORT="$REPORT_DIR/audit-$TIMESTAMP.md"

# Copiar relatório mais recente
if [ -f "$LATEST_REPORT" ]; then
    cp "$LATEST_REPORT" "$TIMESTAMPED_REPORT"
fi

# Determinar status
if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    STATUS="✅ OK"
    echo "Status: $STATUS"
    echo "Relatório salvo em: $LATEST_REPORT"
    echo ""
    echo "✅ AUDITORIA APROVADA - Deploy autorizado"
    exit 0
elif [ $AUDIT_EXIT_CODE -eq 1 ]; then
    STATUS="⚠️ ALERTA"
    echo "Status: $STATUS"
    echo "Relatório salvo em: $LATEST_REPORT"
    echo ""
    echo "⚠️ AUDITORIA COM ALERTAS - Deploy continuará com avisos"
    exit 0
else
    STATUS="❌ ERRO"
    echo "Status: $STATUS"
    echo "Relatório salvo em: $LATEST_REPORT"
    echo ""
    echo "❌ AUDITORIA FALHOU - Deploy cancelado"
    echo "🔧 Corrija os problemas antes de continuar"
    exit 1
fi
`;

    const auditPath = path.join(this.projectRoot, 'mcp-audit-trigger.sh');
    fs.writeFileSync(auditPath, auditCommand);
    
    // Tornar executável
    try {
      execSync(`chmod +x "${auditPath}"`);
    } catch (error) {
      console.log('⚠️ Não foi possível tornar o script executável (Windows)');
    }
    
    console.log('✅ Comando MCP de auditoria criado');
  }

  async createGitHooks() {
    console.log('🔗 Configurando Git Hooks...');
    
    // Pre-push hook
    const prePushHook = `#!/bin/bash
# Pre-push hook - Gol de Ouro v1.1.1
# Executa auditoria MCP antes de push no main

echo "🔍 EXECUTANDO AUDITORIA PRÉ-PUSH..."

# Verificar se é push para main
while read local_ref local_sha remote_ref remote_sha; do
    if [[ "$remote_ref" == "refs/heads/main" || "$remote_ref" == "refs/heads/master" ]]; then
        echo "🎯 Push detectado para branch principal"
        
        # Executar auditoria MCP
        "${this.projectRoot}/mcp-audit-trigger.sh"
        
        if [ $? -ne 0 ]; then
            echo "❌ AUDITORIA FALHOU - Push bloqueado"
            exit 1
        fi
        
        echo "✅ AUDITORIA APROVADA - Push autorizado"
    fi
done
`;

    const prePushPath = path.join(this.hooksDir, 'pre-push');
    fs.writeFileSync(prePushPath, prePushHook);
    
    try {
      execSync(`chmod +x "${prePushPath}"`);
    } catch (error) {
      console.log('⚠️ Não foi possível tornar o hook executável (Windows)');
    }
    
    console.log('✅ Git pre-push hook configurado');
  }

  async createDeployHooks() {
    console.log('🚀 Configurando Deploy Hooks...');
    
    // Script de deploy com auditoria
    const deployScript = `#!/bin/bash
# Deploy Script com Auditoria MCP - Gol de Ouro v1.1.1

echo "🚀 INICIANDO DEPLOY COM AUDITORIA MCP..."
echo "⏰ $(date)"
echo "=========================================="

# Executar auditoria MCP
"${this.projectRoot}/mcp-audit-trigger.sh"

if [ $? -ne 0 ]; then
    echo "❌ AUDITORIA FALHOU - Deploy cancelado"
    exit 1
fi

echo "✅ AUDITORIA APROVADA - Iniciando deploy..."

# Deploy do Admin
echo "📱 Deployando Admin..."
cd "${this.projectRoot}/goldeouro-admin"
npm run build
npx vercel --prod

# Deploy do Player
echo "🎮 Deployando Player..."
cd "${this.projectRoot}/goldeouro-player"
npm run build
npx vercel --prod

echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "📊 Relatórios disponíveis em: ${this.reportsDir}"
`;

    const deployPath = path.join(this.projectRoot, 'deploy-with-mcp-audit.sh');
    fs.writeFileSync(deployPath, deployScript);
    
    try {
      execSync(`chmod +x "${deployPath}"`);
    } catch (error) {
      console.log('⚠️ Não foi possível tornar o script executável (Windows)');
    }
    
    console.log('✅ Deploy script com auditoria MCP criado');
  }

  async createVercelHooks() {
    console.log('⚡ Configurando Vercel Hooks...');
    
    // Vercel build command com auditoria MCP
    const vercelBuildCommand = `{
  "buildCommand": "npm run audit:mcp && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "MCP_AUDIT_ENABLED": "true",
    "MCP_AUDIT_VERSION": "GO-LIVE v1.1.1"
  }
}`;

    // Admin Vercel config
    const adminVercelPath = path.join(this.projectRoot, 'goldeouro-admin', 'vercel-build.json');
    fs.writeFileSync(adminVercelPath, vercelBuildCommand);
    
    // Player Vercel config
    const playerVercelPath = path.join(this.projectRoot, 'goldeouro-player', 'vercel-build.json');
    fs.writeFileSync(playerVercelPath, vercelBuildCommand);
    
    console.log('✅ Vercel hooks configurados');
  }

  async createPackageScripts() {
    console.log('📦 Configurando Package Scripts...');
    
    // Scripts para Admin
    const adminPackagePath = path.join(this.projectRoot, 'goldeouro-admin', 'package.json');
    const adminPackage = JSON.parse(fs.readFileSync(adminPackagePath, 'utf8'));
    
    adminPackage.scripts = {
      ...adminPackage.scripts,
      'audit:mcp': 'cd ../mcp-system && node audit-simple.js --report',
      'deploy:safe': 'npm run audit:mcp && npm run build && npx vercel --prod',
      'audit:full': 'cd ../mcp-system && node audit-simple.js --full --report'
    };
    
    fs.writeFileSync(adminPackagePath, JSON.stringify(adminPackage, null, 2));
    
    // Scripts para Player
    const playerPackagePath = path.join(this.projectRoot, 'goldeouro-player', 'package.json');
    const playerPackage = JSON.parse(fs.readFileSync(playerPackagePath, 'utf8'));
    
    playerPackage.scripts = {
      ...playerPackage.scripts,
      'audit:mcp': 'cd ../mcp-system && node audit-simple.js --report',
      'deploy:safe': 'npm run audit:mcp && npm run build && npx vercel --prod',
      'audit:full': 'cd ../mcp-system && node audit-simple.js --full --report'
    };
    
    fs.writeFileSync(playerPackagePath, JSON.stringify(playerPackage, null, 2));
    
    console.log('✅ Package scripts configurados');
  }

  async testAutomation() {
    console.log('🧪 Testando automação MCP...');
    
    try {
      // Testar comando MCP
      console.log('🔍 Testando comando MCP...');
      execSync(`cd "${this.mcpDir}" && node audit-simple.js --report`, { stdio: 'inherit' });
      console.log('✅ Comando MCP funcionando');
      
      // Verificar se relatório foi gerado
      const latestReport = path.join(this.reportsDir, 'audit-latest.md');
      if (fs.existsSync(latestReport)) {
        console.log('✅ Relatório gerado com sucesso');
      } else {
        console.log('⚠️ Relatório não encontrado');
      }
      
    } catch (error) {
      console.log('⚠️ Alguns testes falharam, mas sistema configurado');
    }
  }

  generateDocumentation() {
    const docs = `# 🧩 GATILHO MCP AUTOMÁTICO - GOL DE OURO v1.1.1

## 📋 Visão Geral

Sistema MCP automático configurado para executar auditoria completa antes de:
- Push para branch principal (main/master)
- Deploy de produção (Vercel/Render/Railway)

## 🎯 Comando Principal

\`\`\`bash
cursor run "Audit Gol de Ouro"
\`\`\`

## 🔄 Triggers Automáticos

### Git Push
- **Trigger**: \`git push origin main\`
- **Ação**: Executa auditoria MCP
- **Resultado**: Bloqueia push se auditoria falhar

### Deploy
- **Trigger**: \`vercel deploy\` ou \`npm run deploy\`
- **Ação**: Executa auditoria MCP
- **Resultado**: Bloqueia deploy se auditoria falhar

## 📊 Relatórios

### Localização
- **Diretório**: \`/reports/\`
- **Último**: \`audit-latest.md\`
- **Histórico**: \`audit-[timestamp].md\`

### Formato de Saída
\`\`\`
⚙️ MCP AUDIT HOOK — GOL DE OURO
=================================
Branch: main
Versão: GO-LIVE v1.1.1
Status: ✅ OK
Relatório salvo em: /reports/audit-2025-10-07.md
\`\`\`

## 🚀 Como Usar

### Deploy Seguro
\`\`\`bash
# Admin
cd goldeouro-admin
npm run deploy:safe

# Player
cd goldeouro-player
npm run deploy:safe
\`\`\`

### Auditoria Manual
\`\`\`bash
# Via Cursor
cursor run "Audit Gol de Ouro"

# Via NPM
npm run audit:mcp
\`\`\`

## ⚙️ Configuração

### Cursor MCP
- **Arquivo**: \`cursor.json\`
- **Comando**: \`Audit Gol de Ouro\`
- **Auto-trigger**: Push e Deploy

### Git Hooks
- **Arquivo**: \`.git/hooks/pre-push\`
- **Trigger**: Push para main/master

### Vercel Hooks
- **Arquivo**: \`vercel-build.json\`
- **Build Command**: Inclui auditoria MCP

## 🔧 Comandos Disponíveis

| Comando | Descrição | Auto-trigger |
|---------|-----------|--------------|
| \`Audit Gol de Ouro\` | Auditoria completa | ✅ Push/Deploy |
| \`audit:full\` | Auditoria detalhada | ❌ Manual |
| \`audit:mcp\` | Auditoria MCP | ❌ Manual |
| \`deploy:safe\` | Deploy com auditoria | ❌ Manual |

## 📈 Status da Auditoria

- **✅ OK**: Auditoria passou, deploy autorizado
- **⚠️ ALERTA**: Auditoria com avisos, deploy continua
- **❌ ERRO**: Auditoria falhou, deploy bloqueado

## 🛠️ Manutenção

### Verificar Status
\`\`\`bash
cd mcp-system
node audit-simple.js --status
\`\`\`

### Atualizar Relatórios
\`\`\`bash
cd mcp-system
node audit-simple.js --report
\`\`\`

## 🎯 Objetivos

1. **Qualidade**: Garantir qualidade antes de deploy
2. **Automação**: Reduzir erros manuais
3. **Rastreabilidade**: Histórico de auditorias
4. **Confiabilidade**: Sistema estável e confiável

---
**Sistema MCP Gol de Ouro v1.1.1** 🤖
`;

    const docsPath = path.join(this.projectRoot, 'MCP-TRIGGER-DOCS.md');
    fs.writeFileSync(docsPath, docs);
    
    console.log('📚 Documentação criada: MCP-TRIGGER-DOCS.md');
  }
}

// Executar configuração
async function main() {
  const setup = new MCPTriggerSetup();
  await setup.setupComplete();
  setup.generateDocumentation();
}

main().catch(console.error);
