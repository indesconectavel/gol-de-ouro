// Script de Validação de Variáveis de Ambiente V19
// ===================================================
// Data: 2025-12-10
// Versão: V19.0.0

require('dotenv').config();
const { assertRequiredEnv, assertV19Env } = require('../../config/required-env');

console.log('🔍 Validando variáveis de ambiente V19...\n');

try {
  // Validar variáveis base
  console.log('✅ Validando variáveis base...');
  assertRequiredEnv(
    ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] }
  );
  console.log('✅ Variáveis base OK\n');

  // Validar variáveis V19
  if (process.env.USE_ENGINE_V19 === 'true') {
    console.log('✅ Validando variáveis V19...');
    assertV19Env();
    console.log('✅ Variáveis V19 OK\n');
  } else {
    console.log('⚠️ Engine V19 não ativada (USE_ENGINE_V19 != true)\n');
  }

  // Mostrar variáveis críticas (sem valores sensíveis)
  console.log('📋 Variáveis configuradas:');
  console.log(`  USE_ENGINE_V19: ${process.env.USE_ENGINE_V19 || 'não definido'}`);
  console.log(`  ENGINE_HEARTBEAT_ENABLED: ${process.env.ENGINE_HEARTBEAT_ENABLED || 'não definido'}`);
  console.log(`  ENGINE_MONITOR_ENABLED: ${process.env.ENGINE_MONITOR_ENABLED || 'não definido'}`);
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? 'configurado' : 'não definido'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configurado' : 'não definido'}`);

  console.log('\n✅ Validação concluída com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro na validação:');
  console.error(error.message);
  process.exit(1);
}

