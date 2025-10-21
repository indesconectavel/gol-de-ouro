// 🔄 KEEP-ALIVE SUPABASE SEM API KEY - VERSÃO FINAL
// Data: 16 de Outubro de 2025 - 10:07
// Objetivo: Manter Supabase ativo sem depender de API key
// VERSÃO FINAL: Usar apenas requisições HTTP simples

const https = require('https');

const keepAliveSupabase = async () => {
  try {
    console.log('🔄 [SUPABASE-KEEP-ALIVE] Executando keep-alive via HTTP...');
    
    // Fazer uma requisição HTTP simples para manter o banco ativo
    const options = {
      hostname: 'uatszaqzdqcwnfbipoxg.supabase.co',
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'User-Agent': 'Keep-Alive-Script/1.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          // 401 é esperado sem API key, mas mantém o banco ativo
          console.log(`✅ [SUPABASE-KEEP-ALIVE] Supabase OK - Status ${res.statusCode} - ${new Date().toISOString()}`);
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
    req.end();
    
  } catch (err) {
    console.error(`❌ [SUPABASE-KEEP-ALIVE] Erro geral: ${err.message} - ${new Date().toISOString()}`);
  }
};

// Executar a cada 10 minutos (600000ms)
const interval = setInterval(keepAliveSupabase, 10 * 60 * 1000);

// Executar imediatamente
console.log('🔄 [SUPABASE-KEEP-ALIVE] Iniciando keep-alive do Supabase (versão final)...');
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
