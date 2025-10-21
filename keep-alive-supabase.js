// 🔄 KEEP-ALIVE SUPABASE - EVITAR PAUSA POR INATIVIDADE
// Data: 16 de Outubro de 2025
// Objetivo: Manter Supabase ativo para evitar pausa por inatividade

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://uatszaqzdqcwnfbipoxg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdHN6YXF6ZHFjd25mYmlwb3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ4MDAsImV4cCI6MjA1MjU1MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

const keepAliveSupabase = async () => {
  try {
    console.log('🔄 [SUPABASE-KEEP-ALIVE] Executando keep-alive...');
    
    // Fazer uma consulta simples para manter o banco ativo
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro: ${error.message} - ${new Date().toISOString()}`);
      
      // Tentar consulta alternativa se a primeira falhar
      try {
        const { data: altData, error: altError } = await supabase
          .from('system_config')
          .select('key')
          .limit(1);
        
        if (altError) {
          console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro alternativo: ${altError.message}`);
        } else {
          console.log(`✅ [SUPABASE-KEEP-ALIVE] Consulta alternativa OK - ${new Date().toISOString()}`);
        }
      } catch (altErr) {
        console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro na consulta alternativa: ${altErr.message}`);
      }
    } else {
      console.log(`✅ [SUPABASE-KEEP-ALIVE] Supabase OK - ${data ? 'Dados encontrados' : 'Sem dados'} - ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro geral: ${err.message} - ${new Date().toISOString()}`);
  }
};

// Executar a cada 10 minutos (600000ms)
const interval = setInterval(keepAliveSupabase, 10 * 60 * 1000);

// Executar imediatamente
console.log('🔄 [SUPABASE-KEEP-ALIVE] Iniciando keep-alive do Supabase...');
keepAliveSupabase();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 [SUPABASE-KEEP-ALIVE] Parando keep-alive...');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 [SUPABASE-KEEP-ALIVE] Parando keep-alive...');
  clearInterval(interval);
  process.exit(0);
});

console.log('✅ [SUPABASE-KEEP-ALIVE] Keep-alive ativo - Supabase será mantido ativo a cada 10 minutos');
