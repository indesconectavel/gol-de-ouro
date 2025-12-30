// ETAPA 1 - Validar e Corrigir .env
// ==================================
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');
const envPath = path.join(rootPath, '.env');
const envExamplePath = path.join(rootPath, '.env.example');

console.log('🔍 [ETAPA 1] Validando e corrigindo .env...\n');

// Variáveis V19 obrigatórias
const variaveisV19 = {
  'USE_ENGINE_V19': 'true',
  'ENGINE_HEARTBEAT_ENABLED': 'true',
  'ENGINE_MONITOR_ENABLED': 'true',
  'USE_DB_QUEUE': 'false'
};

// Variáveis Supabase obrigatórias
const variaveisSupabase = {
  'SUPABASE_URL': '',
  'SUPABASE_SERVICE_ROLE_KEY': '',
  'SUPABASE_ANON_KEY': ''
};

// Variáveis de segurança
const variaveisSeguranca = {
  'JWT_SECRET': '',
  'ADMIN_TOKEN': ''
};

// Variáveis de monitoramento
const variaveisMonitoramento = {
  'NODE_ENV': 'production',
  'PORT': '8080',
  'LOG_LEVEL': 'info'
};

// Variáveis Mercado Pago
const variaveisMercadoPago = {
  'MERCADOPAGO_ACCESS_TOKEN': '',
  'MERCADOPAGO_WEBHOOK_SECRET': ''
};

// Variáveis Email
const variaveisEmail = {
  'EMAIL_HOST': '',
  'EMAIL_PORT': '587',
  'EMAIL_USER': '',
  'EMAIL_PASS': ''
};

// Todas as variáveis
const todasVariaveis = {
  ...variaveisV19,
  ...variaveisSupabase,
  ...variaveisSeguranca,
  ...variaveisMonitoramento,
  ...variaveisMercadoPago,
  ...variaveisEmail
};

// Ler .env existente
function lerEnv() {
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    console.log(`  ✅ .env encontrado com ${Object.keys(env).length} variáveis`);
  } else {
    console.log('  ⚠️  .env não encontrado, será criado');
  }
  
  return env;
}

// Adicionar variáveis faltantes
function adicionarVariaveisFaltantes(env) {
  let adicionadas = 0;
  const novasLinhas = [];
  
  Object.entries(todasVariaveis).forEach(([key, defaultValue]) => {
    if (!env[key]) {
      env[key] = defaultValue || '';
      novasLinhas.push(`${key}=${defaultValue || ''}`);
      adicionadas++;
      console.log(`  ➕ Adicionada: ${key}=${defaultValue || '(vazio)'}`);
    }
  });
  
  return { env, adicionadas, novasLinhas };
}

// Salvar .env
function salvarEnv(env) {
  const linhas = [];
  
  // Cabeçalho
  linhas.push('# ============================================');
  linhas.push('# GOL DE OURO BACKEND - VARIÁVEIS DE AMBIENTE');
  linhas.push('# Engine V19');
  linhas.push('# ============================================\n');
  
  // Variáveis V19
  linhas.push('# ============================================');
  linhas.push('# ENGINE V19');
  linhas.push('# ============================================');
  Object.entries(variaveisV19).forEach(([key, defaultValue]) => {
    linhas.push(`${key}=${env[key] || defaultValue}`);
  });
  linhas.push('');
  
  // Variáveis Supabase
  linhas.push('# ============================================');
  linhas.push('# SUPABASE');
  linhas.push('# ============================================');
  Object.entries(variaveisSupabase).forEach(([key]) => {
    linhas.push(`${key}=${env[key] || ''}`);
  });
  linhas.push('');
  
  // Variáveis Segurança
  linhas.push('# ============================================');
  linhas.push('# SEGURANÇA');
  linhas.push('# ============================================');
  Object.entries(variaveisSeguranca).forEach(([key]) => {
    linhas.push(`${key}=${env[key] || ''}`);
  });
  linhas.push('');
  
  // Variáveis Monitoramento
  linhas.push('# ============================================');
  linhas.push('# MONITORAMENTO');
  linhas.push('# ============================================');
  Object.entries(variaveisMonitoramento).forEach(([key, defaultValue]) => {
    linhas.push(`${key}=${env[key] || defaultValue}`);
  });
  linhas.push('');
  
  // Variáveis Mercado Pago
  linhas.push('# ============================================');
  linhas.push('# MERCADO PAGO');
  linhas.push('# ============================================');
  Object.entries(variaveisMercadoPago).forEach(([key]) => {
    linhas.push(`${key}=${env[key] || ''}`);
  });
  linhas.push('');
  
  // Variáveis Email
  linhas.push('# ============================================');
  linhas.push('# EMAIL');
  linhas.push('# ============================================');
  Object.entries(variaveisEmail).forEach(([key, defaultValue]) => {
    linhas.push(`${key}=${env[key] || defaultValue}`);
  });
  
  fs.writeFileSync(envPath, linhas.join('\n'));
  console.log(`\n✅ .env salvo em: ${envPath}`);
}

// Criar .env.example
function criarEnvExample() {
  const linhas = [];
  
  linhas.push('# ============================================');
  linhas.push('# GOL DE OURO BACKEND - .env.example');
  linhas.push('# Copie este arquivo para .env e preencha os valores');
  linhas.push('# ============================================\n');
  
  linhas.push('# ============================================');
  linhas.push('# ENGINE V19');
  linhas.push('# ============================================');
  Object.entries(variaveisV19).forEach(([key, defaultValue]) => {
    linhas.push(`${key}=${defaultValue}`);
  });
  linhas.push('');
  
  linhas.push('# ============================================');
  linhas.push('# SUPABASE');
  linhas.push('# ============================================');
  Object.entries(variaveisSupabase).forEach(([key]) => {
    linhas.push(`${key}=sua_chave_aqui`);
  });
  linhas.push('');
  
  linhas.push('# ============================================');
  linhas.push('# SEGURANÇA');
  linhas.push('# ============================================');
  Object.entries(variaveisSeguranca).forEach(([key]) => {
    linhas.push(`${key}=sua_chave_secreta_aqui`);
  });
  linhas.push('');
  
  linhas.push('# ============================================');
  linhas.push('# MONITORAMENTO');
  linhas.push('# ============================================');
  Object.entries(variaveisMonitoramento).forEach(([key, defaultValue]) => {
    linhas.push(`${key}=${defaultValue}`);
  });
  linhas.push('');
  
  linhas.push('# ============================================');
  linhas.push('# MERCADO PAGO');
  linhas.push('# ============================================');
  Object.entries(variaveisMercadoPago).forEach(([key]) => {
    linhas.push(`${key}=sua_chave_mercadopago_aqui`);
  });
  linhas.push('');
  
  linhas.push('# ============================================');
  linhas.push('# EMAIL');
  linhas.push('# ============================================');
  Object.entries(variaveisEmail).forEach(([key, defaultValue]) => {
    linhas.push(`${key}=${defaultValue || 'seu_valor_aqui'}`);
  });
  
  fs.writeFileSync(envExamplePath, linhas.join('\n'));
  console.log(`✅ .env.example criado em: ${envExamplePath}`);
}

// Validar variáveis no process.env
function validarProcessEnv() {
  console.log('\n🔍 Validando variáveis no process.env...');
  
  // Carregar .env atualizado
  require('dotenv').config({ path: envPath });
  
  let ok = 0;
  let faltando = 0;
  
  Object.keys(variaveisV19).forEach(key => {
    if (process.env[key]) {
      ok++;
      console.log(`  ✅ ${key} = ${process.env[key]}`);
    } else {
      faltando++;
      console.log(`  ❌ ${key} NÃO DEFINIDA`);
    }
  });
  
  console.log(`\n📊 Resultado: ${ok} OK, ${faltando} faltando`);
  
  return { ok, faltando };
}

// Executar
try {
  const env = lerEnv();
  const { env: envAtualizado, adicionadas } = adicionarVariaveisFaltantes(env);
  
  if (adicionadas > 0) {
    console.log(`\n➕ ${adicionadas} variáveis adicionadas`);
  }
  
  salvarEnv(envAtualizado);
  criarEnvExample();
  
  const validacao = validarProcessEnv();
  
  console.log('\n✅ ETAPA 1 CONCLUÍDA');
  console.log(`   Variáveis adicionadas: ${adicionadas}`);
  console.log(`   Variáveis validadas: ${validacao.ok}/${Object.keys(variaveisV19).length}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

