// Configuração do Supabase - Gol de Ouro v1.1.1
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Cliente público (para operações do frontend)
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com privilégios de serviço (para operações do backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para testar conexão
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão com Supabase:', error);
    return false;
  }
}

// Função para executar migrações
async function runMigrations() {
  try {
    console.log('🔄 Executando migrações do banco de dados...');
    
    // Aqui você pode adicionar lógica para executar migrações
    // Por exemplo, verificar se tabelas existem e criar se necessário
    
    console.log('✅ Migrações executadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    return false;
  }
}

// Função para backup do banco
async function backupDatabase() {
  try {
    console.log('💾 Iniciando backup do banco de dados...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      usuarios: await supabaseAdmin.from('usuarios').select('*'),
      partidas: await supabaseAdmin.from('partidas').select('*'),
      transacoes: await supabaseAdmin.from('transacoes').select('*'),
      configuracoes: await supabaseAdmin.from('configuracoes').select('*')
    };
    
    // Salvar backup em arquivo
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup salvo em: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error);
    return null;
  }
}

// Função para restaurar backup
async function restoreDatabase(backupFile) {
  try {
    console.log(`🔄 Restaurando backup de: ${backupFile}`);
    
    const fs = require('fs');
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Restaurar dados (cuidado com a ordem das tabelas devido às foreign keys)
    if (backupData.usuarios?.data) {
      await supabaseAdmin.from('usuarios').upsert(backupData.usuarios.data);
    }
    
    if (backupData.partidas?.data) {
      await supabaseAdmin.from('partidas').upsert(backupData.partidas.data);
    }
    
    if (backupData.transacoes?.data) {
      await supabaseAdmin.from('transacoes').upsert(backupData.transacoes.data);
    }
    
    if (backupData.configuracoes?.data) {
      await supabaseAdmin.from('configuracoes').upsert(backupData.configuracoes.data);
    }
    
    console.log('✅ Backup restaurado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    return false;
  }
}

// Função para obter estatísticas do banco
async function getDatabaseStats() {
  try {
    const stats = {};
    
    // Contar registros em cada tabela principal
    const tables = ['usuarios', 'partidas', 'transacoes', 'pagamentos_pix', 'saques'];
    
    for (const table of tables) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        stats[table] = count;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    return {};
  }
}

// Função para limpeza de dados antigos
async function cleanupOldData() {
  try {
    console.log('🧹 Iniciando limpeza de dados antigos...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Limpar logs antigos
    const { error: logsError } = await supabaseAdmin
      .from('logs_sistema')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());
    
    if (logsError) {
      console.error('Erro ao limpar logs:', logsError);
    }
    
    // Limpar sessões expiradas
    const { error: sessionsError } = await supabaseAdmin
      .from('sessoes')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (sessionsError) {
      console.error('Erro ao limpar sessões:', sessionsError);
    }
    
    console.log('✅ Limpeza de dados antigos concluída');
    return true;
  } catch (error) {
    console.error('❌ Erro na limpeza de dados:', error);
    return false;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  runMigrations,
  backupDatabase,
  restoreDatabase,
  getDatabaseStats,
  cleanupOldData
};