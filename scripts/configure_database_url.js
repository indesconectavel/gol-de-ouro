/**
 * CONFIGURE DATABASE_URL - Script para configurar DATABASE_URL no .env.local
 * Uso: node scripts/configure_database_url.js [SENHA]
 */

const fs = require('fs');
const path = require('path');

const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');
const PASSWORD = process.argv[2];

if (!PASSWORD) {
  console.error('❌ ERRO: Senha não fornecida');
  console.error('   Uso: node scripts/configure_database_url.js [SENHA]');
  console.error('   Exemplo: node scripts/configure_database_url.js minhaSenha123');
  process.exit(1);
}

// Connection string completa
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(PASSWORD)}@db.uatszaqzdqcwnfbipoxg.supabase.co:5432/postgres?sslmode=require`;

console.log('🔧 Configurando DATABASE_URL...');
console.log(`   Host: db.uatszaqzdqcwnfbipoxg.supabase.co`);
console.log(`   Porta: 5432`);
console.log(`   Banco: postgres`);

// Ler .env.local se existir
let envContent = '';
if (fs.existsSync(ENV_LOCAL_PATH)) {
  envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
  console.log('✅ Arquivo .env.local encontrado');
} else {
  console.log('📝 Criando novo arquivo .env.local');
}

// Remover DATABASE_URL antiga se existir
const lines = envContent.split('\n');
const filteredLines = lines.filter(line => !line.trim().startsWith('DATABASE_URL='));

// Adicionar nova DATABASE_URL
filteredLines.push(`DATABASE_URL=${DATABASE_URL}`);

// Escrever arquivo
const newContent = filteredLines.join('\n');
fs.writeFileSync(ENV_LOCAL_PATH, newContent, 'utf8');

console.log('✅ DATABASE_URL configurada no .env.local');
console.log('');
console.log('📋 Próximo passo:');
console.log('   node scripts/test_db_connection.js');
console.log('');

