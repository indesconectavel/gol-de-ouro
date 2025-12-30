#!/usr/bin/env node
/**
 * 🔌 INSTALADOR DE MCPs - GOL DE OURO
 * 
 * Este script instala e configura todos os MCPs solicitados
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MCPs_TO_INSTALL = [
  { name: 'vercel', package: '@vercel/mcp', type: 'npm' },
  { name: 'flyio', package: '@flyio/mcp', type: 'npm' },
  { name: 'supabase', package: '@supabase/mcp', type: 'npm' },
  { name: 'github-actions', package: '@github/mcp-actions', type: 'npm' },
  { name: 'lighthouse', package: '@lighthouse/mcp', type: 'npm' },
  { name: 'docker', package: '@docker/mcp', type: 'npm' },
  { name: 'sentry', package: '@sentry/mcp', type: 'npm' },
  { name: 'postgres', package: '@postgres/mcp', type: 'npm' },
  { name: 'mercado-pago', package: '@mercadopago/mcp', type: 'npm' },
  { name: 'jest', package: '@jest/mcp', type: 'npm' },
  { name: 'eslint', package: '@eslint/mcp', type: 'npm' }
];

// MCPs que podem não ter pacotes npm oficiais - usar wrappers
const MCP_WRAPPERS = {
  'vercel': {
    command: 'npx vercel',
    env: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID']
  },
  'flyio': {
    command: 'flyctl',
    env: ['FLY_API_TOKEN']
  },
  'supabase': {
    command: 'npx supabase',
    env: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  },
  'github-actions': {
    command: 'gh',
    env: ['GITHUB_TOKEN']
  },
  'lighthouse': {
    command: 'npx lighthouse',
    env: []
  },
  'docker': {
    command: 'docker',
    env: []
  },
  'sentry': {
    command: 'npx @sentry/cli',
    env: ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']
  },
  'postgres': {
    command: 'psql',
    env: ['DATABASE_URL']
  },
  'mercado-pago': {
    command: 'node',
    env: ['MERCADOPAGO_ACCESS_TOKEN']
  },
  'jest': {
    command: 'npx jest',
    env: []
  },
  'eslint': {
    command: 'npx eslint',
    env: []
  }
};

class MCPInstaller {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.cursorConfigPath = path.join(this.projectRoot, 'cursor.json');
    this.mcpConfigPath = path.join(this.projectRoot, '.cursor', 'mcp.json');
    this.installed = [];
    this.failed = [];
  }

  async install() {
    console.log('🔌 Iniciando instalação de MCPs...\n');

    // Criar diretório .cursor se não existir
    const cursorDir = path.join(this.projectRoot, '.cursor');
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
      console.log('✅ Diretório .cursor criado');
    }

    // Ler configuração atual do cursor.json
    let cursorConfig = {};
    if (fs.existsSync(this.cursorConfigPath)) {
      cursorConfig = JSON.parse(fs.readFileSync(this.cursorConfigPath, 'utf8'));
    }

    // Instalar cada MCP
    for (const mcp of MCPs_TO_INSTALL) {
      try {
        await this.installMCP(mcp, cursorConfig);
      } catch (error) {
        console.error(`❌ Erro ao instalar ${mcp.name}:`, error.message);
        this.failed.push({ mcp: mcp.name, error: error.message });
      }
    }

    // Salvar configuração atualizada
    await this.saveConfig(cursorConfig);

    // Gerar relatório
    this.generateReport();
  }

  async installMCP(mcp, cursorConfig) {
    console.log(`\n📦 Instalando ${mcp.name}...`);

    // Tentar instalar via npm (pode falhar se não existir)
    let npmInstalled = false;
    if (mcp.type === 'npm') {
      try {
        console.log(`  Tentando instalar ${mcp.package}...`);
        execSync(`npm install -g ${mcp.package}`, { stdio: 'ignore' });
        npmInstalled = true;
        console.log(`  ✅ ${mcp.package} instalado via npm`);
      } catch (error) {
        console.log(`  ⚠️ ${mcp.package} não encontrado no npm, usando wrapper`);
      }
    }

    // Configurar wrapper no cursor.json
    const wrapper = MCP_WRAPPERS[mcp.name];
    if (wrapper) {
      const mcpConfig = {
        name: mcp.name,
        type: npmInstalled ? 'npm' : 'wrapper',
        command: wrapper.command,
        env: wrapper.env,
        description: `MCP para ${mcp.name}`,
        enabled: true
      };

      if (!cursorConfig.mcp) {
        cursorConfig.mcp = {};
      }
      if (!cursorConfig.mcp[mcp.name]) {
        cursorConfig.mcp[mcp.name] = {};
      }
      
      cursorConfig.mcp[mcp.name] = {
        ...cursorConfig.mcp[mcp.name],
        ...mcpConfig
      };

      this.installed.push(mcp.name);
      console.log(`  ✅ ${mcp.name} configurado`);
    } else {
      throw new Error(`Wrapper não encontrado para ${mcp.name}`);
    }
  }

  async saveConfig(cursorConfig) {
    // Salvar cursor.json
    fs.writeFileSync(
      this.cursorConfigPath,
      JSON.stringify(cursorConfig, null, 2),
      'utf8'
    );
    console.log('\n✅ Configuração salva em cursor.json');

    // Criar arquivo de configuração adicional para MCPs
    const mcpConfig = {
      version: '1.0.0',
      mcps: cursorConfig.mcp || {},
      settings: {
        autoEnable: true,
        logLevel: 'info'
      }
    };

    fs.writeFileSync(
      this.mcpConfigPath,
      JSON.stringify(mcpConfig, null, 2),
      'utf8'
    );
    console.log('✅ Configuração MCP salva em .cursor/mcp.json');
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO DE INSTALAÇÃO\n');
    console.log('✅ MCPs Instalados:');
    this.installed.forEach(mcp => {
      console.log(`  - ${mcp}`);
    });

    if (this.failed.length > 0) {
      console.log('\n❌ MCPs com Problemas:');
      this.failed.forEach(({ mcp, error }) => {
        console.log(`  - ${mcp}: ${error}`);
      });
    }

    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar variáveis de ambiente necessárias');
    console.log('2. Configurar tokens e credenciais');
    console.log('3. Testar cada MCP individualmente');
    console.log('\n📄 Configuração salva em:');
    console.log(`  - ${this.cursorConfigPath}`);
    console.log(`  - ${this.mcpConfigPath}`);
  }
}

// Executar instalação
if (require.main === module) {
  const installer = new MCPInstaller();
  installer.install().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = MCPInstaller;

