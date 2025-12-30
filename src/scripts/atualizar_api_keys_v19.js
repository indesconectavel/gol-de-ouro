// Script para Atualizar API Keys V19
// ==================================
const fs = require('fs');
const path = require('path');

console.log('🔐 [ATUALIZAÇÃO] Atualizando API Keys V19...\n');

const rootPath = path.join(__dirname, '..', '..');
const envPath = path.join(rootPath, '.env');

// API Keys fornecidas
const API_KEYS = {
  // Service Role Key (JWT) - Para operações administrativas
  SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdHN6YXF6ZHFjd25mYmlwb3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY2NDcyMSwiZXhwIjoyMDY5MjQwNzIxfQ.g3nkaT7-eFCnUc66hLwPUx2sCgiUXfsvCZw1ncHHeIY',
  
  // Anon Key (JWT) - Para operações públicas
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdHN6YXF6ZHFjd25mYmlwb3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NjQ3MjEsImV4cCI6MjA2OTI0MDcyMX0.bX_-O7a7qjVhiIE6ethc7yl6iGr6TM9W3bmT3xqjXAc',
  
  // Publishable Key (Nova API)
  PUBLISHABLE_KEY: 'sb_publishable_L4F6RNXqOk8YURbZMBpXUQ_ttymssoV',
  
  // Secret Key (Nova API)
  SECRET_KEY: 'sb_secret_wyF1tfHA_Btxf__WToUuSA_wllQ_nCF'
};

// Ler .env atual
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('⚠️  Arquivo .env não encontrado, criando novo...');
}

// Atualizar ou adicionar variáveis
function atualizarVariavel(nome, valor) {
  const regex = new RegExp(`^${nome}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${nome}=${valor}`);
    console.log(`  ✅ Atualizado: ${nome}`);
  } else {
    envContent += `\n${nome}=${valor}`;
    console.log(`  ➕ Adicionado: ${nome}`);
  }
}

// Atualizar todas as keys
console.log('📝 Atualizando variáveis no .env...\n');

atualizarVariavel('SUPABASE_SERVICE_ROLE_KEY', API_KEYS.SERVICE_ROLE_KEY);
atualizarVariavel('SUPABASE_ANON_KEY', API_KEYS.ANON_KEY);

// Salvar .env atualizado
fs.writeFileSync(envPath, envContent);
console.log(`\n✅ Arquivo .env atualizado em: ${envPath}`);

// Criar arquivo de backup das keys (sem expor valores completos)
const keysInfo = {
  timestamp: new Date().toISOString(),
  projeto: 'goldeouro-db',
  ref: 'uatszaqzdqcwnfbipoxg',
  keys_configuradas: {
    service_role_key: `${API_KEYS.SERVICE_ROLE_KEY.substring(0, 20)}...`,
    anon_key: `${API_KEYS.ANON_KEY.substring(0, 20)}...`,
    publishable_key: API_KEYS.PUBLISHABLE_KEY,
    secret_key: `${API_KEYS.SECRET_KEY.substring(0, 15)}...`
  }
};

const keysPath = path.join(rootPath, 'logs', 'v19', 'api_keys_info.json');
fs.writeFileSync(keysPath, JSON.stringify(keysInfo, null, 2));
console.log(`✅ Informações das keys salvas em: ${keysPath}`);

console.log('\n✅ API Keys atualizadas com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Executar: node src/scripts/validar_migration_v19_final.js');
console.log('2. Executar SQL de correções: logs/v19/correcoes_seguranca_v19.sql');

process.exit(0);

