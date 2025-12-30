// Script de Validação da Engine V19
// ===================================
// Data: 2025-12-10
// Versão: V19.0.0

require('dotenv').config();
const { validateSupabaseCredentials, testSupabaseConnection } = require('../../database/supabase-unified-config');
const { assertV19Env } = require('../../config/required-env');

async function validarEngineV19() {
  console.log('🔍 Validando Engine V19...\n');

  // 1. Validar variáveis V19
  console.log('1️⃣ Validando variáveis V19...');
  try {
    if (process.env.USE_ENGINE_V19 === 'true') {
      assertV19Env();
      console.log('   ✅ Variáveis V19 OK');
    } else {
      console.log('   ⚠️ Engine V19 não ativada');
      process.exit(1);
    }
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}`);
    process.exit(1);
  }

  // 2. Validar credenciais Supabase
  console.log('\n2️⃣ Validando credenciais Supabase...');
  const validation = validateSupabaseCredentials();
  if (!validation.valid) {
    console.log('   ❌ Credenciais inválidas:');
    validation.errors.forEach(err => console.log(`      - ${err}`));
    process.exit(1);
  }
  console.log('   ✅ Credenciais OK');

  // 3. Testar conexão
  console.log('\n3️⃣ Testando conexão com Supabase...');
  const connection = await testSupabaseConnection();
  if (!connection.success) {
    console.log(`   ❌ Erro na conexão: ${connection.error}`);
    process.exit(1);
  }
  console.log('   ✅ Conexão OK');

  // 4. Resumo
  console.log('\n✅ Engine V19 validada com sucesso!');
  console.log('\n📋 Status:');
  console.log(`   USE_ENGINE_V19: ${process.env.USE_ENGINE_V19}`);
  console.log(`   ENGINE_HEARTBEAT_ENABLED: ${process.env.ENGINE_HEARTBEAT_ENABLED}`);
  console.log(`   ENGINE_MONITOR_ENABLED: ${process.env.ENGINE_MONITOR_ENABLED}`);
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'configurado' : 'não definido'}`);

  process.exit(0);
}

validarEngineV19().catch(err => {
  console.error('\n❌ Erro na validação:', err.message);
  process.exit(1);
});

