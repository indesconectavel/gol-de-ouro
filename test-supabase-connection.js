// Teste de conexão com Supabase
const { createClient } = require('@supabase/supabase-js');

// Credenciais atuais (vamos testar)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

console.log('🔍 TESTANDO CONEXÃO COM SUPABASE');
console.log('URL:', supabaseUrl);
console.log('ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NÃO DEFINIDA');
console.log('SERVICE_KEY:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NÃO DEFINIDA');

// Testar com chave anônima
async function testAnonKey() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro com ANON_KEY:', error.message);
      return false;
    } else {
      console.log('✅ ANON_KEY funcionando');
      return true;
    }
  } catch (err) {
    console.log('❌ Erro na conexão ANON_KEY:', err.message);
    return false;
  }
}

// Testar com chave de serviço
async function testServiceKey() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro com SERVICE_KEY:', error.message);
      return false;
    } else {
      console.log('✅ SERVICE_KEY funcionando');
      return true;
    }
  } catch (err) {
    console.log('❌ Erro na conexão SERVICE_KEY:', err.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  console.log('\n🧪 TESTANDO CONEXÕES...\n');
  
  const anonResult = await testAnonKey();
  const serviceResult = await testServiceKey();
  
  console.log('\n📊 RESULTADOS:');
  console.log('ANON_KEY:', anonResult ? '✅ OK' : '❌ FALHA');
  console.log('SERVICE_KEY:', serviceResult ? '✅ OK' : '❌ FALHA');
  
  if (!anonResult && !serviceResult) {
    console.log('\n🚨 PROBLEMA: Nenhuma chave está funcionando!');
    console.log('Verifique se as credenciais estão corretas no Fly.io');
  } else if (!serviceResult) {
    console.log('\n⚠️ AVISO: SERVICE_KEY não funciona, mas ANON_KEY sim');
    console.log('Isso pode causar problemas nas operações administrativas');
  } else {
    console.log('\n🎉 SUCESSO: Todas as chaves estão funcionando!');
  }
}

runTests().catch(console.error);
