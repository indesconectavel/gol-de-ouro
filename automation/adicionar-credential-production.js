/**
 * ADICIONAR CREDENCIAL PRODUCTION
 * Script para adicionar credencial de production ao .env
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../.env');
const PRODUCTION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk4ODExOCwiZXhwIjoyMDc4MzQ4MTE4fQ.rbKsVW3reCCXDnAwM8S2BPAc_xl9SEVheqUODIlnNLQ';

console.log('═══════════════════════════════════════════════════════════');
console.log('  CONFIGURANDO CREDENCIAL PRODUCTION');
console.log('═══════════════════════════════════════════════════════════\n');

// Ler ou criar .env
let envContent = '';
if (fs.existsSync(ENV_FILE)) {
  envContent = fs.readFileSync(ENV_FILE, 'utf8');
  console.log('✅ Arquivo .env encontrado\n');
} else {
  console.log('⚠️  Arquivo .env não encontrado. Criando novo...\n');
  // Copiar do env.example se existir
  const envExample = path.join(__dirname, '../env.example');
  if (fs.existsSync(envExample)) {
    envContent = fs.readFileSync(envExample, 'utf8');
  }
}

// Remover linha antiga se existir
envContent = envContent.replace(/SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=.*/g, '');
envContent = envContent.replace(/# Supabase Production.*\n/g, '');

// Adicionar nova credencial
if (!envContent.endsWith('\n')) {
  envContent += '\n';
}

envContent += '# Supabase Production\n';
envContent += `SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=${PRODUCTION_KEY}\n`;

// Salvar
fs.writeFileSync(ENV_FILE, envContent, 'utf8');

console.log('✅ Credencial production configurada com sucesso!');
console.log(`   Arquivo: ${ENV_FILE}\n`);

// Verificar se foi salva corretamente
const verifyContent = fs.readFileSync(ENV_FILE, 'utf8');
if (verifyContent.includes('SUPABASE_PRODUCTION_SERVICE_ROLE_KEY')) {
  console.log('✅ Validação: Credencial encontrada no arquivo\n');
} else {
  console.log('❌ Erro: Credencial não foi salva corretamente\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  PRÓXIMO PASSO: TESTAR CONEXÃO');
console.log('═══════════════════════════════════════════════════════════');
console.log('\nExecute:');
console.log('  node automation/teste_pix_v19.js production\n');

