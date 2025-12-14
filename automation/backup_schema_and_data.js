/**
 * Backup Schema e Dados V19
 * Exporta schema SQL e dumps de dados críticos
 */

const { getAdminClient } = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');
const { redactSecrets } = require('./lib/supabase-client');

const BACKUP_DIR = path.join(__dirname, '../backup');
const LOG_DIR = path.join(__dirname, '../logs/v19/automation');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `backup_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[BACKUP] ${logMessage.trim()}`);
}

/**
 * Exporta schema SQL (simulação via information_schema)
 */
async function exportSchema(client, env) {
  log(`Exportando schema para ${env}...`, 'INFO');
  
  const schemaQueries = [
    `SELECT 
      'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' || 
      string_agg(column_name || ' ' || data_type || 
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', ' ORDER BY ordinal_position
      ) || ');' as create_table
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
    ORDER BY table_name;`
  ];

  // Nota: Implementação real requer acesso direto ao PostgreSQL
  // Por enquanto, retornamos estrutura básica
  const schema = `-- Schema export for ${env}
-- Generated: ${new Date().toISOString()}
-- Note: Full schema export requires direct PostgreSQL access
-- Use Supabase SQL Editor: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
`;

  return schema;
}

/**
 * Exporta dados de tabelas críticas
 */
async function exportData(client, env) {
  log(`Exportando dados críticos para ${env}...`, 'INFO');
  
  const criticalTables = ['usuarios', 'transacoes', 'lotes', 'rewards', 'webhook_events', 'system_heartbeat'];
  const dataDumps = [];

  for (const table of criticalTables) {
    try {
      log(`Exportando dados da tabela ${table}...`, 'INFO');
      
      const { data, error } = await client
        .from(table)
        .select('*')
        .limit(10000); // Limite de segurança

      if (error) {
        log(`Erro ao exportar ${table}: ${error.message}`, 'ERROR');
        continue;
      }

      if (data && data.length > 0) {
        const insertStatements = data.map(row => {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return v;
          }).join(', ');
          return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
        });

        dataDumps.push(`-- Data dump for ${table} (${data.length} rows)\n${insertStatements.join('\n')}`);
      } else {
        dataDumps.push(`-- Table ${table} is empty`);
      }
    } catch (error) {
      log(`Erro ao processar ${table}: ${error.message}`, 'ERROR');
    }
  }

  return dataDumps.join('\n\n');
}

/**
 * Salva backup em arquivo
 */
function saveBackup(content, env, type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const envDir = path.join(BACKUP_DIR, type.toLowerCase(), env);
  
  // Criar diretório se não existir
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  const filename = `${type.toLowerCase()}_${env}_${timestamp}.sql`;
  const filepath = path.join(envDir, filename);

  fs.writeFileSync(filepath, content, 'utf8');
  log(`Backup salvo: ${filepath}`, 'SUCCESS');

  return filepath;
}

/**
 * Função principal de backup
 */
async function backupSchemaAndData(env = 'STG') {
  log(`=== INICIANDO BACKUP ${env} ===`, 'INFO');
  const startTime = Date.now();

  try {
    const client = getAdminClient(env);

    // Exportar schema
    log('Exportando schema...', 'INFO');
    const schema = await exportSchema(client, env);
    const schemaPath = saveBackup(schema, env, 'SCHEMA');

    // Exportar dados
    log('Exportando dados críticos...', 'INFO');
    const data = await exportData(client, env);
    const dataPath = saveBackup(data, env, 'DATA');

    const duration = Date.now() - startTime;
    log(`=== BACKUP ${env} CONCLUÍDO (${duration}ms) ===`, 'SUCCESS');

    return {
      success: true,
      env,
      schemaPath,
      dataPath,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    log(`Erro crítico no backup: ${redactSecrets(error.message)}`, 'ERROR');
    return {
      success: false,
      env,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const env = process.argv[2] || 'STG';
  backupSchemaAndData(env)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', redactSecrets(error.message));
      process.exit(1);
    });
}

module.exports = { backupSchemaAndData };

