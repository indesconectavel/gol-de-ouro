// Configuração Supabase para Produção - Gol de Ouro v1.1.1
const { createClient } = require('@supabase/supabase-js');

// Configurações de ambiente
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

// Cliente público (para frontend)
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com privilégios de serviço (para backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Função para testar conexão
const testConnection = async () => {
  try {
    // Usar a chave de serviço para teste (mais permissiva)
    const { data, error } = await supabaseAdmin.from('User').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Conexão com Supabase estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error.message);
    return false;
  }
};

// Função para criar tabelas necessárias
const createTables = async () => {
  try {
    // Tabela de usuários
    const { error: usersError } = await supabaseAdmin.rpc('create_users_table');
    if (usersError) throw usersError;

    // Tabela de jogos
    const { error: gamesError } = await supabaseAdmin.rpc('create_games_table');
    if (gamesError) throw gamesError;

    // Tabela de transações
    const { error: transactionsError } = await supabaseAdmin.rpc('create_transactions_table');
    if (transactionsError) throw transactionsError;

    console.log('✅ Tabelas criadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  createTables
};
