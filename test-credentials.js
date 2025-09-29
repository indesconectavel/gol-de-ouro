// Teste de credenciais no Fly.io
console.log('🔍 VERIFICANDO CREDENCIAIS NO FLY.IO');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');

if (process.env.SUPABASE_URL) {
  console.log('URL completa:', process.env.SUPABASE_URL);
}

if (process.env.SUPABASE_ANON_KEY) {
  console.log('ANON_KEY (primeiros 20 chars):', process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

if (process.env.SUPABASE_SERVICE_KEY) {
  console.log('SERVICE_KEY (primeiros 20 chars):', process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
}

// Testar conexão se as credenciais existem
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  supabase.from('users').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Erro na conexão:', error.message);
      } else {
        console.log('✅ Conexão com Supabase funcionando!');
      }
    })
    .catch(err => {
      console.log('❌ Erro na conexão:', err.message);
    });
} else {
  console.log('⚠️ Credenciais não encontradas - usando fallback');
}
