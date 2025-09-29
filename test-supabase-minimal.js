// Teste mínimo de conexão Supabase
const { createClient } = require('@supabase/supabase-js');

// Usar credenciais de exemplo para teste
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

console.log('🧪 TESTE MÍNIMO SUPABASE');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Cliente Supabase criado com sucesso');
  
  // Testar conexão
  supabase.from('users').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Erro esperado:', error.message);
        console.log('Isso confirma que as credenciais estão incorretas');
      } else {
        console.log('✅ Conexão funcionando (inesperado)');
      }
    })
    .catch(err => {
      console.log('❌ Erro de conexão:', err.message);
    });
} catch (err) {
  console.log('❌ Erro ao criar cliente:', err.message);
}
