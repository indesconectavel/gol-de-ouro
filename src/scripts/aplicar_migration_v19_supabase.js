/**
 * APLICAR MIGRATION V19 NO SUPABASE - Modo Seguro e Auditável
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LOG_DIR = path.join(__dirname, '..', '..', 'logs', 'migration_v19');

async function logar(arquivo, conteudo) {
  const caminho = path.join(LOG_DIR, arquivo);
  await fs.appendFile(caminho, conteudo + '\n', 'utf8');
}

async function aplicarMigration() {
  console.log('============================================================');
  console.log(' APLICAÇÃO MIGRATION V19 NO SUPABASE');
  console.log('============================================================\n');
  
  // Ler arquivo da migration
  const migrationPath = path.join(LOG_DIR, 'MIGRATION-V19.sql');
  let migrationSQL;
  
  try {
    migrationSQL = await fs.readFile(migrationPath, 'utf8');
    if (!migrationSQL || migrationSQL.trim().length === 0) {
      console.error('❌ Arquivo MIGRATION-V19.sql está vazio');
      console.error('   Por favor, cole o conteúdo da migration no arquivo');
      await logar('02_migration_erros.txt', `[${new Date().toISOString()}] ERRO: Arquivo migration vazio`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ Erro ao ler arquivo migration: ${e.message}`);
    await logar('02_migration_erros.txt', `[${new Date().toISOString()}] ERRO: ${e.message}`);
    process.exit(1);
  }
  
  console.log(`✅ Migration lida: ${migrationSQL.length} caracteres\n`);
  
  // Registrar SQL raw
  await logar('01_migration_execucao.txt', `[${new Date().toISOString()}] INÍCIO DA MIGRATION`);
  await logar('01_migration_execucao.txt', '='.repeat(80));
  await logar('01_migration_execucao.txt', migrationSQL);
  await logar('01_migration_execucao.txt', '='.repeat(80));
  
  // IMPORTANTE: Supabase REST API não permite execução direta de SQL complexo
  // A migration deve ser executada manualmente via Supabase Dashboard SQL Editor
  console.log('⚠️  ATENÇÃO: Supabase REST API não permite execução direta de SQL complexo');
  console.log('   A migration deve ser executada manualmente via Supabase Dashboard SQL Editor\n');
  
  console.log('📋 INSTRUÇÕES PARA APLICAÇÃO MANUAL:');
  console.log('   1. Acesse: https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/sql/new');
  console.log('   2. Abra o arquivo: logs/migration_v19/MIGRATION-V19.sql');
  console.log('   3. Copie TODO o conteúdo');
  console.log('   4. Cole no SQL Editor');
  console.log('   5. Execute (Run)\n');
  
  await logar('01_migration_execucao.txt', `[${new Date().toISOString()}] MIGRATION DEVE SER APLICADA MANUALMENTE VIA SUPABASE DASHBOARD`);
  await logar('01_migration_execucao.txt', 'Ver instruções acima');
  
  return { sucesso: true, modo: 'manual' };
}

if (require.main === module) {
  aplicarMigration()
    .then(result => {
      if (result.sucesso) {
        console.log('✅ Preparação concluída');
        console.log('   Aguardando aplicação manual da migration...\n');
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { aplicarMigration };



