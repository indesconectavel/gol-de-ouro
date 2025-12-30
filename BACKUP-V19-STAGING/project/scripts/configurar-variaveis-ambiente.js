#!/usr/bin/env node
/**
 * 🔐 CONFIGURADOR DE VARIÁVEIS DE AMBIENTE - GOL DE OURO
 * 
 * Este script ajuda a configurar as variáveis de ambiente críticas para os MCPs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Informações já conhecidas
const KNOWN_CONFIG = {
  SUPABASE_URL: 'https://gayopagjdrkcmkirmfvy.supabase.co',
  VERCEL_ORG_ID: 'goldeouro-admins-projects',
  VERCEL_PROJECT_ID: 'goldeouro-player',
  FLY_APP_NAME: 'goldeouro-backend-v2'
};

// Variáveis que precisam ser obtidas
const REQUIRED_VARS = {
  VERCEL_TOKEN: {
    description: 'Token de autenticação do Vercel',
    howToGet: '1. Acesse: https://vercel.com/account/tokens\n2. Crie um novo token\n3. Copie o token',
    url: 'https://vercel.com/account/tokens'
  },
  FLY_API_TOKEN: {
    description: 'Token de autenticação do Fly.io',
    howToGet: '1. Execute: flyctl auth token\n2. Ou acesse: https://fly.io/user/personal_access_tokens',
    command: 'flyctl auth token'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Service Role Key do Supabase',
    howToGet: '1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api\n2. Copie a Service Role Key (secret)',
    url: 'https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api'
  },
  GITHUB_TOKEN: {
    description: 'Token de autenticação do GitHub',
    howToGet: '1. Acesse: https://github.com/settings/tokens\n2. Crie um novo token (classic)\n3. Selecione escopos: repo, workflow',
    url: 'https://github.com/settings/tokens'
  }
};

class EnvConfigurator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.envLocalPath = path.join(this.projectRoot, '.env.local');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  async checkExistingSecrets() {
    console.log('🔍 Verificando secrets existentes...\n');

    // Verificar GitHub Secrets (via API se possível)
    console.log('📋 Secrets no GitHub Actions:');
    console.log('   Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions\n');

    // Verificar Fly.io secrets
    try {
      console.log('📋 Secrets no Fly.io:');
      const output = execSync(`flyctl secrets list --app ${KNOWN_CONFIG.FLY_APP_NAME}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(output);
    } catch (error) {
      console.log('   ⚠️ Não foi possível verificar secrets do Fly.io');
      console.log('   Execute: flyctl secrets list --app goldeouro-backend-v2\n');
    }
  }

  async createEnvFile() {
    console.log('📝 Criando arquivo .env.local...\n');

    let envContent = `# Gol de Ouro - Variáveis de Ambiente para MCPs
# Gerado em: ${new Date().toISOString()}
# ⚠️ IMPORTANTE: Este arquivo contém secrets. NÃO commite no Git!

# ============================================
# VERCEL
# ============================================
VERCEL_TOKEN=${process.env.VERCEL_TOKEN || ''}
VERCEL_ORG_ID=${KNOWN_CONFIG.VERCEL_ORG_ID}
VERCEL_PROJECT_ID=${KNOWN_CONFIG.VERCEL_PROJECT_ID}

# ============================================
# FLY.IO
# ============================================
FLY_API_TOKEN=${process.env.FLY_API_TOKEN || ''}

# ============================================
# SUPABASE
# ============================================
SUPABASE_URL=${KNOWN_CONFIG.SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}

# ============================================
# GITHUB ACTIONS
# ============================================
GITHUB_TOKEN=${process.env.GITHUB_TOKEN || ''}

# ============================================
# SENTRY (Opcional)
# ============================================
SENTRY_AUTH_TOKEN=${process.env.SENTRY_AUTH_TOKEN || ''}
SENTRY_ORG=${process.env.SENTRY_ORG || ''}
SENTRY_PROJECT=${process.env.SENTRY_PROJECT || ''}

# ============================================
# POSTGRES
# ============================================
DATABASE_URL=${process.env.DATABASE_URL || ''}

# ============================================
# MERCADO PAGO
# ============================================
MERCADOPAGO_ACCESS_TOKEN=${process.env.MERCADOPAGO_ACCESS_TOKEN || ''}
`;

    fs.writeFileSync(this.envLocalPath, envContent, 'utf8');
    console.log(`✅ Arquivo criado: ${this.envLocalPath}\n`);
  }

  async promptForSecrets() {
    console.log('🔐 Configuração de Variáveis de Ambiente\n');
    console.log('Vou te ajudar a configurar as variáveis que faltam.\n');

    const secrets = {};

    for (const [key, info] of Object.entries(REQUIRED_VARS)) {
      console.log(`\n📋 ${key}`);
      console.log(`   Descrição: ${info.description}`);
      console.log(`   Como obter:`);
      console.log(`   ${info.howToGet}`);
      if (info.url) {
        console.log(`   URL: ${info.url}`);
      }
      if (info.command) {
        console.log(`   Comando: ${info.command}`);
      }
      
      const value = await this.question(`\n   Digite o valor (ou pressione Enter para pular): `);
      
      if (value.trim()) {
        secrets[key] = value.trim();
        console.log(`   ✅ ${key} configurado`);
      } else {
        console.log(`   ⚠️ ${key} não configurado (será necessário configurar depois)`);
      }
    }

    return secrets;
  }

  async updateEnvFile(secrets) {
    let envContent = fs.readFileSync(this.envLocalPath, 'utf8');

    for (const [key, value] of Object.entries(secrets)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Adicionar se não existir
        envContent += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(this.envLocalPath, envContent, 'utf8');
    console.log(`\n✅ Arquivo .env.local atualizado`);
  }

  async generateInstructions() {
    const instructionsPath = path.join(this.projectRoot, 'docs', 'mcps', 'GUIA-CONFIGURAR-VARIAVEIS-AMBIENTE.md');
    const instructionsDir = path.dirname(instructionsPath);
    
    if (!fs.existsSync(instructionsDir)) {
      fs.mkdirSync(instructionsDir, { recursive: true });
    }

    const instructions = `# 🔐 GUIA PARA CONFIGURAR VARIÁVEIS DE AMBIENTE - MCPs

**Data:** ${new Date().toLocaleString('pt-BR')}  
**Versão:** 1.2.0

---

## 📋 VARIÁVEIS JÁ CONHECIDAS

Estas variáveis já estão configuradas ou são conhecidas:

\`\`\`bash
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
VERCEL_ORG_ID=goldeouro-admins-projects
VERCEL_PROJECT_ID=goldeouro-player
FLY_APP_NAME=goldeouro-backend-v2
\`\`\`

---

## 🔐 VARIÁVEIS QUE PRECISAM SER CONFIGURADAS

### **1. VERCEL_TOKEN** 🔴 **CRÍTICO**

**Como Obter:**
1. Acesse: https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Dê um nome ao token (ex: "Gol de Ouro MCP")
4. Copie o token gerado

**Onde Configurar:**
- **Local:** Adicione ao arquivo \`.env.local\`
- **GitHub Actions:** Adicione como secret \`VERCEL_TOKEN\`

---

### **2. FLY_API_TOKEN** 🔴 **CRÍTICO**

**Como Obter:**

**Opção 1: Via CLI**
\`\`\`bash
flyctl auth token
\`\`\`

**Opção 2: Via Dashboard**
1. Acesse: https://fly.io/user/personal_access_tokens
2. Clique em "Create Token"
3. Copie o token gerado

**Onde Configurar:**
- **Local:** Adicione ao arquivo \`.env.local\`
- **GitHub Actions:** Já deve estar configurado como secret \`FLY_API_TOKEN\`

---

### **3. SUPABASE_SERVICE_ROLE_KEY** 🔴 **CRÍTICO**

**Como Obter:**
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api
2. Role até "Project API keys"
3. Copie a **Service Role Key** (secret) - ⚠️ **NÃO** a anon key

**Onde Configurar:**
- **Local:** Adicione ao arquivo \`.env.local\`
- **Fly.io:** Já deve estar configurado como secret
- **GitHub Actions:** Opcional (para monitoramento)

---

### **4. GITHUB_TOKEN** 🔴 **CRÍTICO**

**Como Obter:**
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome ao token (ex: "Gol de Ouro MCP")
4. Selecione escopos:
   - ✅ \`repo\` (Full control of private repositories)
   - ✅ \`workflow\` (Update GitHub Action workflows)
5. Clique em "Generate token"
6. **Copie o token imediatamente** (não será mostrado novamente)

**Onde Configurar:**
- **Local:** Adicione ao arquivo \`.env.local\`
- **GitHub Actions:** Não necessário (já tem acesso)

---

## 📝 CONFIGURAR LOCALMENTE

### **Opção 1: Usar o Script**

Execute o script de configuração:

\`\`\`bash
node scripts/configurar-variaveis-ambiente.js
\`\`\`

### **Opção 2: Criar Manualmente**

Crie o arquivo \`.env.local\` na raiz do projeto:

\`\`\`bash
# Vercel
VERCEL_TOKEN=seu_token_aqui
VERCEL_ORG_ID=goldeouro-admins-projects
VERCEL_PROJECT_ID=goldeouro-player

# Fly.io
FLY_API_TOKEN=seu_token_aqui

# Supabase
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# GitHub Actions
GITHUB_TOKEN=seu_token_aqui
\`\`\`

**⚠️ IMPORTANTE:** Certifique-se de que \`.env.local\` está no \`.gitignore\`!

---

## ✅ VERIFICAR CONFIGURAÇÃO

Após configurar, execute:

\`\`\`bash
node scripts/verificar-mcps.js
\`\`\`

Isso verificará se todas as variáveis estão configuradas corretamente.

---

## 🔒 SEGURANÇA

- ⚠️ **NUNCA** commite arquivos \`.env\` ou \`.env.local\` no Git
- ⚠️ **NUNCA** exponha tokens em documentação pública
- ✅ Use secrets do GitHub Actions para CI/CD
- ✅ Use secrets do Fly.io para produção
- ✅ Mantenha tokens locais apenas para desenvolvimento

---

**Guia criado em:** ${new Date().toLocaleString('pt-BR')}
`;

    fs.writeFileSync(instructionsPath, instructions, 'utf8');
    console.log(`\n📄 Guia criado: ${instructionsPath}`);
  }

  async run() {
    console.log('🔐 Configurador de Variáveis de Ambiente - Gol de Ouro\n');
    console.log('Este script vai te ajudar a configurar as variáveis de ambiente críticas.\n');

    // Verificar secrets existentes
    await this.checkExistingSecrets();

    // Criar arquivo .env.local
    await this.createEnvFile();

    // Perguntar se quer configurar agora
    const configureNow = await this.question('\nDeseja configurar as variáveis agora? (s/n): ');
    
    if (configureNow.toLowerCase() === 's') {
      const secrets = await this.promptForSecrets();
      if (Object.keys(secrets).length > 0) {
        await this.updateEnvFile(secrets);
      }
    } else {
      console.log('\n📋 Você pode configurar depois editando o arquivo .env.local');
      console.log('   Ou executando este script novamente');
    }

    // Gerar guia de instruções
    await this.generateInstructions();

    console.log('\n✅ Configuração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure as variáveis que faltam no arquivo .env.local');
    console.log('2. Execute: node scripts/verificar-mcps.js');
    console.log('3. Consulte: docs/mcps/GUIA-CONFIGURAR-VARIAVEIS-AMBIENTE.md');

    this.rl.close();
  }
}

// Executar
if (require.main === module) {
  const configurator = new EnvConfigurator();
  configurator.run().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
}

module.exports = EnvConfigurator;

