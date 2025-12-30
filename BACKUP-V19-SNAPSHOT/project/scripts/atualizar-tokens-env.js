#!/usr/bin/env node
/**
 * 🔐 ATUALIZADOR DE TOKENS NO .env.local
 * 
 * Este script atualiza o arquivo .env.local com os tokens fornecidos
 */

const fs = require('fs');
const path = require('path');

// Tokens devem ser fornecidos via argumentos de linha de comando ou variáveis de ambiente
// Formato: node scripts/atualizar-tokens-env.js VERCEL_TOKEN=xxx GITHUB_TOKEN=xxx SUPABASE_SERVICE_ROLE_KEY=xxx
const TOKENS = {};

// Processar argumentos da linha de comando
process.argv.slice(2).forEach(arg => {
  const [key, value] = arg.split('=');
  if (key && value) {
    TOKENS[key] = value;
  }
});

const envLocalPath = path.join(__dirname, '..', '.env.local');

function updateEnvFile() {
  console.log('🔐 Atualizando arquivo .env.local com os tokens fornecidos...\n');

  // Ler arquivo existente ou criar novo
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
    console.log('✅ Arquivo .env.local encontrado\n');
  } else {
    console.log('⚠️ Arquivo .env.local não encontrado, criando novo...\n');
    envContent = `# Gol de Ouro - Variáveis de Ambiente para MCPs
# Gerado em: ${new Date().toISOString()}
# ⚠️ IMPORTANTE: Este arquivo contém secrets. NÃO commite no Git!

# ============================================
# VERCEL
# ============================================
VERCEL_TOKEN=
VERCEL_ORG_ID=goldeouro-admins-projects
VERCEL_PROJECT_ID=goldeouro-player

# ============================================
# FLY.IO
# ============================================
FLY_API_TOKEN=

# ============================================
# SUPABASE
# ============================================
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# ============================================
# GITHUB ACTIONS
# ============================================
GITHUB_TOKEN=

# ============================================
# SENTRY (Opcional)
# ============================================
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# ============================================
# POSTGRES
# ============================================
DATABASE_URL=

# ============================================
# MERCADO PAGO
# ============================================
MERCADOPAGO_ACCESS_TOKEN=
`;
  }

  // Atualizar tokens
  let updated = false;
  for (const [key, value] of Object.entries(TOKENS)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      const oldValue = envContent.match(regex)[0];
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✅ ${key} atualizado`);
      updated = true;
    } else {
      // Adicionar se não existir
      envContent += `\n${key}=${value}`;
      console.log(`✅ ${key} adicionado`);
      updated = true;
    }
  }

  // Salvar arquivo
  fs.writeFileSync(envLocalPath, envContent, 'utf8');
  console.log(`\n✅ Arquivo .env.local atualizado: ${envLocalPath}`);

  return updated;
}

// Executar
if (require.main === module) {
  try {
    updateEnvFile();
    console.log('\n📋 Tokens atualizados com sucesso!');
    console.log('\n🔍 Execute: node scripts/verificar-mcps.js para verificar');
  } catch (error) {
    console.error('❌ Erro ao atualizar tokens:', error.message);
    process.exit(1);
  }
}

module.exports = { updateEnvFile, TOKENS };

