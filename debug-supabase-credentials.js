// Debug das credenciais do Supabase
console.log('🔍 DEBUG DAS CREDENCIAIS SUPABASE');
console.log('================================');

// Verificar variáveis de ambiente
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');

// Mostrar valores (parcialmente mascarados)
if (process.env.SUPABASE_URL) {
  console.log('URL:', process.env.SUPABASE_URL);
} else {
  console.log('❌ SUPABASE_URL não definida');
}

if (process.env.SUPABASE_ANON_KEY) {
  const key = process.env.SUPABASE_ANON_KEY;
  console.log('ANON_KEY:', key.substring(0, 20) + '...' + key.substring(key.length - 10));
  console.log('ANON_KEY length:', key.length);
} else {
  console.log('❌ SUPABASE_ANON_KEY não definida');
}

if (process.env.SUPABASE_SERVICE_KEY) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  console.log('SERVICE_KEY:', key.substring(0, 20) + '...' + key.substring(key.length - 10));
  console.log('SERVICE_KEY length:', key.length);
} else {
  console.log('❌ SUPABASE_SERVICE_KEY não definida');
}

// Testar conexão se as credenciais existem
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  console.log('\n🧪 TESTANDO CONEXÃO...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // Testar conexão simples
    supabase.from('users').select('count').limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Erro na conexão:', error.message);
          console.log('Código do erro:', error.code);
          console.log('Detalhes:', error.details);
        } else {
          console.log('✅ Conexão com Supabase funcionando!');
          console.log('Dados retornados:', data);
        }
      })
      .catch(err => {
        console.log('❌ Erro na conexão:', err.message);
        console.log('Stack:', err.stack);
      });
  } catch (err) {
    console.log('❌ Erro ao criar cliente Supabase:', err.message);
  }
} else {
  console.log('\n⚠️ Credenciais incompletas - não é possível testar conexão');
  console.log('Verifique se todas as variáveis estão definidas no Fly.io');
}
