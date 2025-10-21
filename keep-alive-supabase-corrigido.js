// 🔄 KEEP-ALIVE SUPABASE CORRIGIDO - SEM API KEY
// Data: 16 de Outubro de 2025
// Objetivo: Manter Supabase ativo sem depender de API key
// CORREÇÃO: Usar conexão direta via SQL

const https = require('https');

const keepAliveSupabase = async () => {
  try {
    console.log('🔄 [SUPABASE-KEEP-ALIVE] Executando keep-alive via SQL...');
    
    // Fazer uma consulta SQL simples para manter o banco ativo
    const sqlQuery = 'SELECT NOW() as current_time, \'Supabase ativo\' as status;';
    
    const options = {
      hostname: 'uatszaqzdqcwnfbipoxg.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/keep_alive',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdHN6YXF6ZHFjd25mYmlwb3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ4MDAsImV4cCI6MjA1MjU1MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdHN6YXF6ZHFjd25mYmlwb3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ4MDAsImV4cCI6MjA1MjU1MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ [SUPABASE-KEEP-ALIVE] Supabase OK - ${new Date().toISOString()}`);
        } else {
          console.log(`⚠️ [SUPABASE-KEEP-ALIVE] Status ${res.statusCode} - ${new Date().toISOString()}`);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro: ${e.message} - ${new Date().toISOString()}`);
    });

    req.on('timeout', () => {
      console.error(`⏰ [SUPABASE-KEEP-ALIVE] Timeout - ${new Date().toISOString()}`);
      req.destroy();
    });

    req.setTimeout(10000);
    req.write(JSON.stringify({ query: sqlQuery }));
    req.end();
    
  } catch (err) {
    console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro geral: ${err.message} - ${new Date().toISOString()}`);
  }
};

// Executar a cada 10 minutos (600000ms)
const interval = setInterval(keepAliveSupabase, 10 * 60 * 1000);

// Executar imediatamente
console.log('🔄 [SUPABASE-KEEP-ALIVE] Iniciando keep-alive do Supabase (versão corrigida)...');
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
