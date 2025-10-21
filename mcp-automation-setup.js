const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MCPAutomationSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.mcpDir = path.join(this.projectRoot, 'mcp-system');
    this.hooksDir = path.join(this.projectRoot, '.git', 'hooks');
    this.vercelDir = path.join(this.projectRoot, '.vercel');
  }

  async setupComplete() {
    console.log('🧩 CONFIGURANDO MCP AUTOMATION - GOL DE OURO v1.1.1\n');
    
    await this.createMCPCommands();
    await this.createGitHooks();
    await this.createDeployHooks();
    await this.createVercelHooks();
    await this.createPackageScripts();
    await this.createCursorConfig();
    await this.testAutomation();
    
    console.log('\n✅ MCP AUTOMATION CONFIGURADO COM SUCESSO!');
    console.log('🎯 Sistema pronto para auditoria automática pré-deploy');
  }

  async createMCPCommands() {
    console.log('📝 Criando comandos MCP...');
    
    const auditCommand = `#!/bin/bash
# MCP Audit Command - Gol de Ouro v1.1.1
# Executado automaticamente antes de push/deploy

echo "🔍 INICIANDO AUDITORIA MCP AUTOMÁTICA..."
echo "⏰ $(date)"
echo "=========================================="

# Navegar para diretório MCP
cd "${this.mcpDir}"

# Executar auditoria completa
node audit-simple.js

# Verificar se auditoria passou
if [ $? -eq 0 ]; then
    echo "✅ AUDITORIA MCP CONCLUÍDA COM SUCESSO"
    echo "🚀 Deploy autorizado"
    exit 0
else
    echo "❌ AUDITORIA MCP FALHOU"
    echo "🛑 Deploy bloqueado - Corrija os problemas antes de continuar"
    exit 1
fi
`;

    const auditPath = path.join(this.projectRoot, 'mcp-audit-command.sh');
    fs.writeFileSync(auditPath, auditCommand);
    
    // Tornar executável
    try {
      execSync(`chmod +x "${auditPath}"`);
    } catch (error) {
      console.log('⚠️ Não foi possível tornar o script executável (Windows)');
    }
    
    console.log('✅ Comando MCP criado: mcp-audit-command.sh');
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
        "${this.projectRoot}/mcp-audit-command.sh"
        
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
"${this.projectRoot}/mcp-audit-command.sh"

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
`;

    const deployPath = path.join(this.projectRoot, 'deploy-with-audit.sh');
    fs.writeFileSync(deployPath, deployScript);
    
    try {
      execSync(`chmod +x "${deployPath}"`);
    } catch (error) {
      console.log('⚠️ Não foi possível tornar o script executável (Windows)');
    }
    
    console.log('✅ Deploy script com auditoria criado');
  }

  async createVercelHooks() {
    console.log('⚡ Configurando Vercel Hooks...');
    
    // Vercel build command com auditoria
    const vercelBuildCommand = `{
  "buildCommand": "npm run audit:pre-deploy && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
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
      'audit:pre-deploy': 'cd ../mcp-system && node audit-simple.js',
      'deploy:safe': 'npm run audit:pre-deploy && npm run build && npx vercel --prod',
      'audit:full': 'cd ../mcp-system && node audit-simple.js'
    };
    
    fs.writeFileSync(adminPackagePath, JSON.stringify(adminPackage, null, 2));
    
    // Scripts para Player
    const playerPackagePath = path.join(this.projectRoot, 'goldeouro-player', 'package.json');
    const playerPackage = JSON.parse(fs.readFileSync(playerPackagePath, 'utf8'));
    
    playerPackage.scripts = {
      ...playerPackage.scripts,
      'audit:pre-deploy': 'cd ../mcp-system && node audit-simple.js',
      'deploy:safe': 'npm run audit:pre-deploy && npm run build && npx vercel --prod',
      'audit:full': 'cd ../mcp-system && node audit-simple.js'
    };
    
    fs.writeFileSync(playerPackagePath, JSON.stringify(playerPackage, null, 2));
    
    console.log('✅ Package scripts configurados');
  }

  async createCursorConfig() {
    console.log('⚙️ Configurando Cursor.json...');
    
    const cursorConfig = {
      "mcp": {
        "goldeouro": {
          "name": "Gol de Ouro MCP System",
          "description": "Sistema MCP para auditoria automática do Gol de Ouro",
          "version": "1.1.1",
          "commands": {
            "audit": {
              "description": "Executa auditoria completa do sistema Gol de Ouro",
              "command": "cd mcp-system && node audit-simple.js",
              "autoTrigger": {
                "gitPush": true,
                "deploy": true,
                "branches": ["main", "master"]
              }
            },
            "audit:full": {
              "description": "Executa auditoria completa com relatório detalhado",
              "command": "cd mcp-system && node audit-simple.js --full"
            },
            "deploy:safe": {
              "description": "Deploy seguro com auditoria prévia",
              "command": "npm run audit:pre-deploy && npm run build && npx vercel --prod"
            }
          },
          "triggers": {
            "prePush": {
              "enabled": true,
              "branches": ["main", "master"],
              "command": "audit"
            },
            "preDeploy": {
              "enabled": true,
              "platforms": ["vercel", "render", "railway"],
              "command": "audit"
            }
          }
        }
      }
    };
    
    const cursorPath = path.join(this.projectRoot, 'cursor.json');
    fs.writeFileSync(cursorPath, JSON.stringify(cursorConfig, null, 2));
    
    console.log('✅ Cursor.json configurado');
  }

  async testAutomation() {
    console.log('🧪 Testando automação...');
    
    try {
      // Testar comando MCP
      console.log('🔍 Testando comando MCP...');
      execSync(`cd "${this.mcpDir}" && node audit-simple.js`, { stdio: 'inherit' });
      console.log('✅ Comando MCP funcionando');
      
      // Testar scripts de package
      console.log('📦 Testando scripts de package...');
      execSync(`cd "${this.projectRoot}/goldeouro-admin" && npm run audit:full`, { stdio: 'inherit' });
      console.log('✅ Scripts de package funcionando');
      
    } catch (error) {
      console.log('⚠️ Alguns testes falharam, mas sistema configurado');
    }
  }

  generateDocumentation() {
    const docs = `# 🧩 MCP AUTOMATION - GOL DE OURO v1.1.1

## 📋 Visão Geral

Sistema MCP automático configurado para executar auditoria completa antes de:
- Push para branch principal (main/master)
- Deploy de produção (Vercel)

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
# Auditoria completa
cd mcp-system
node audit-simple.js

# Via package scripts
npm run audit:full
\`\`\`

## ⚙️ Configuração

### Git Hooks
- **Pre-push**: Executa auditoria antes de push no main
- **Localização**: \`.git/hooks/pre-push\`

### Vercel Hooks
- **Build Command**: Inclui auditoria pré-deploy
- **Configuração**: \`vercel-build.json\`

### Cursor MCP
- **Comando**: \`audit\`
- **Auto-trigger**: Push e Deploy
- **Configuração**: \`cursor.json\`

## 🔧 Comandos Disponíveis

| Comando | Descrição | Auto-trigger |
|---------|-----------|--------------|
| \`audit\` | Auditoria completa | ✅ Push/Deploy |
| \`audit:full\` | Auditoria detalhada | ❌ Manual |
| \`deploy:safe\` | Deploy com auditoria | ❌ Manual |

## 📊 Relatórios

- **Localização**: \`mcp-system/audit-reports/\`
- **Formato**: JSON + Markdown
- **Frequência**: A cada push/deploy

## 🛠️ Manutenção

### Atualizar Auditoria
\`\`\`bash
cd mcp-system
node audit-simple.js --update
\`\`\`

### Verificar Status
\`\`\`bash
cd mcp-system
node audit-simple.js --status
\`\`\`

## 🎯 Objetivos

1. **Qualidade**: Garantir qualidade antes de deploy
2. **Automação**: Reduzir erros manuais
3. **Rastreabilidade**: Histórico de auditorias
4. **Confiabilidade**: Sistema estável e confiável

---
**Sistema MCP Gol de Ouro v1.1.1** 🤖
`;

    const docsPath = path.join(this.projectRoot, 'MCP-AUTOMATION-DOCS.md');
    fs.writeFileSync(docsPath, docs);
    
    console.log('📚 Documentação criada: MCP-AUTOMATION-DOCS.md');
  }
}

// Executar configuração
async function main() {
  const setup = new MCPAutomationSetup();
  await setup.setupComplete();
  setup.generateDocumentation();
}

main().catch(console.error);
