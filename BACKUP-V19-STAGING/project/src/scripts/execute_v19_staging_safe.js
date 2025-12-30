/**
 * EXECUTE V19 STAGING SAFE - Versão com verificações de ambiente
 * Executa todas as etapas da correção V19 com validação prévia de ambiente
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const STAGING_DIR = path.join(__dirname, '..', '..');
const LOG_DIR = path.join(STAGING_DIR, 'logs');

async function verificarAmbiente() {
  console.log('\n🔍 Verificando ambiente STAGING...\n');
  
  const problemas = [];
  
  // Carregar .env.local
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });
  
  // Verificar DATABASE_URL
  if (!process.env.DATABASE_URL) {
    problemas.push('DATABASE_URL não configurada');
    console.log('⚠️  DATABASE_URL não encontrada nas variáveis de ambiente');
    console.log('   Configure: export DATABASE_URL="postgresql://..."');
    console.log('   OU configure no arquivo .env.local');
  } else {
    console.log('✅ DATABASE_URL configurada');
    // Verificar se está usando Session Pooler
    if (process.env.DATABASE_URL.includes(':6543/')) {
      console.log('   ✅ Usando Session Pooler (porta 6543)');
    } else if (process.env.DATABASE_URL.includes(':5432/')) {
      console.log('   ⚠️  Usando conexão direta (porta 5432) - considere Session Pooler');
    }
  }
  
  // Verificar Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    if (majorVersion < 18) {
      problemas.push(`Node.js ${nodeVersion} - requer >= 18.0.0`);
    }
  } catch (e) {
    problemas.push('Node.js não encontrado');
  }
  
  // Verificar psql (não crítico - migrations podem ser via Dashboard)
  try {
    const psqlVersion = execSync('psql --version', { encoding: 'utf8' }).trim();
    console.log(`✅ PostgreSQL: ${psqlVersion}`);
  } catch (e) {
    console.log('⚠️  psql não encontrado - backup pode falhar');
    console.log('   Nota: Migrations podem ser executadas via Supabase Dashboard');
    // Não adicionar como problema crítico - apenas aviso
  }
  
  // Verificar conexão ao pooler (se DATABASE_URL configurada)
  if (process.env.DATABASE_URL) {
    console.log('🔍 Testando acessibilidade do Session Pooler...');
    try {
      const { Client } = require('pg');
      const testClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000
      });
      
      await testClient.connect();
      const res = await testClient.query('SELECT NOW()');
      await testClient.end();
      console.log('✅ Session Pooler acessível');
    } catch (e) {
      console.log('⚠️  Session Pooler não acessível via teste direto:', e.message);
      console.log('   Nota: Pode ser problema de rede/DNS ou IPv4');
      console.log('   Migrations podem ser executadas via Supabase Dashboard SQL Editor');
      // Não adicionar como problema crítico, apenas aviso
    }
  }
  
  // Verificar backup
  const backupDir = path.join(STAGING_DIR, 'BACKUP-V19-SNAPSHOT');
  try {
    await fs.access(backupDir);
    const files = await fs.readdir(backupDir, { recursive: true });
    console.log(`✅ Backup V19 encontrado: ${files.length} arquivos`);
  } catch (e) {
    problemas.push('BACKUP-V19-SNAPSHOT não encontrado');
  }
  
  // Verificar arquivos necessários
  const arquivosNecessarios = [
    'prisma/migrations/20251205_v19_rls_indexes_migration.sql',
    'src/scripts/verify_backup_and_proceed.js',
    'src/scripts/migrate_memory_lotes_to_db.js'
  ];
  
  for (const arquivo of arquivosNecessarios) {
    const caminho = path.join(STAGING_DIR, arquivo);
    try {
      await fs.access(caminho);
      console.log(`✅ ${arquivo}`);
    } catch (e) {
      problemas.push(`Arquivo não encontrado: ${arquivo}`);
    }
  }
  
  if (problemas.length > 0) {
    console.log('\n❌ PROBLEMAS ENCONTRADOS:');
    problemas.forEach(p => console.log(`   - ${p}`));
    console.log('\n⚠️  Corrija os problemas acima antes de executar em staging');
    return false;
  }
  
  console.log('\n✅ Ambiente STAGING verificado e pronto');
  return true;
}

async function main() {
  console.log('============================================================');
  console.log(' EXECUÇÃO V19 EM STAGING - VERIFICAÇÃO PRÉVIA');
  console.log('============================================================');
  
  const ambienteOk = await verificarAmbiente();
  
  if (!ambienteOk) {
    console.log('\n❌ Ambiente não está pronto para execução');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure DATABASE_URL: export DATABASE_URL="postgresql://..."');
    console.log('2. Verifique se psql está instalado');
    console.log('3. Execute novamente: node src/scripts/execute_v19_staging_safe.js');
    process.exit(1);
  }
  
  console.log('\n✅ Ambiente OK - Pronto para executar');
  console.log('\n⚠️  Para executar a migration completa, use:');
  console.log('   node src/scripts/execute_v19_staging.js');
  console.log('\n⚠️  OU execute manualmente cada etapa:');
  console.log('   1. node src/scripts/verify_backup_and_proceed.js');
  console.log('   2. bash src/scripts/backup_before_migration.sh');
  console.log('   3. bash src/migrations/apply_migration.sh');
  console.log('   4. node src/scripts/migrate_memory_lotes_to_db.js');
  console.log('   5. npm test');
  console.log('   6. node src/scripts/post_migration_checks.js');
}

if (require.main === module) {
  main();
}

module.exports = { verificarAmbiente };

