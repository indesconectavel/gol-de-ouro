// 🔐 CONFIGURAÇÃO UNIFICADA DO SUPABASE - GOL DE OURO v1.2.0
// ============================================================
// Data: 23/10/2025
// Status: CONFIGURAÇÃO UNIFICADA E VALIDADA
// Versão: v1.2.0-supabase-unified

const { createClient } = require('@supabase/supabase-js');

// =====================================================
// CONFIGURAÇÕES UNIFICADAS DO SUPABASE
// =====================================================

// Credenciais ÚNICAS e VALIDADAS para produção
const SUPABASE_CONFIG = {
  // Projeto: goldeouro-production
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Configurações de conexão
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'goldeouro-backend-v1.2.0'
      }
    }
  }
};

// =====================================================
// CLIENTES SUPABASE UNIFICADOS
// =====================================================

// Cliente público (para operações do frontend)
const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  SUPABASE_CONFIG.options
);

// Cliente com privilégios de serviço (para operações do backend)
const supabaseAdmin = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.serviceRoleKey,
  {
    ...SUPABASE_CONFIG.options,
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// =====================================================
// FUNÇÕES DE VALIDAÇÃO E CONEXÃO
// =====================================================

/**
 * Valida se as credenciais do Supabase estão configuradas
 */
function validateSupabaseCredentials() {
  const errors = [];
  
  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('your-project')) {
    errors.push('SUPABASE_URL não configurada ou inválida');
  }
  
  if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey.includes('your-anon-key')) {
    errors.push('SUPABASE_ANON_KEY não configurada ou inválida');
  }
  
  if (!SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.serviceRoleKey.includes('your-service-role-key')) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY não configurada ou inválida');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Testa a conexão com o Supabase
 */
async function testSupabaseConnection() {
  try {
    console.log('🔍 [SUPABASE] Testando conexão...');
    
    // Validar credenciais primeiro
    const validation = validateSupabaseCredentials();
    if (!validation.valid) {
      console.error('❌ [SUPABASE] Credenciais inválidas:', validation.errors);
      return { success: false, error: 'Credenciais inválidas' };
    }
    
    // Testar conexão com cliente admin
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ [SUPABASE] Erro na conexão:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [SUPABASE] Conexão estabelecida com sucesso');
    return { success: true, data: data };
    
  } catch (error) {
    console.error('❌ [SUPABASE] Erro geral:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Executa migrações do schema
 */
async function runSupabaseMigrations() {
  try {
    console.log('🔄 [SUPABASE] Executando migrações...');
    
    // Verificar se as tabelas existem
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'usuarios');
    
    if (tablesError) {
      console.error('❌ [SUPABASE] Erro ao verificar tabelas:', tablesError.message);
      return { success: false, error: tablesError.message };
    }
    
    if (!tables || tables.length === 0) {
      console.log('📋 [SUPABASE] Tabelas não encontradas. Execute o schema SQL primeiro.');
      return { success: false, error: 'Schema não aplicado' };
    }
    
    console.log('✅ [SUPABASE] Migrações verificadas');
    return { success: true };
    
  } catch (error) {
    console.error('❌ [SUPABASE] Erro nas migrações:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Health check completo do Supabase
 */
async function supabaseHealthCheck() {
  try {
    console.log('🏥 [SUPABASE] Executando health check...');
    
    const startTime = Date.now();
    
    // Testar conexão
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      return {
        healthy: false,
        status: 'connection_failed',
        error: connectionTest.error,
        responseTime: Date.now() - startTime
      };
    }
    
    // Testar operações básicas
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      return {
        healthy: false,
        status: 'query_failed',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ [SUPABASE] Health check OK (${responseTime}ms)`);
    return {
      healthy: true,
      status: 'healthy',
      responseTime: responseTime,
      data: data
    };
    
  } catch (error) {
    console.error('❌ [SUPABASE] Erro no health check:', error.message);
    return {
      healthy: false,
      status: 'error',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Clientes
  supabase,
  supabaseAdmin,
  
  // Configurações
  SUPABASE_CONFIG,
  
  // Funções
  validateSupabaseCredentials,
  testSupabaseConnection,
  runSupabaseMigrations,
  supabaseHealthCheck
};
