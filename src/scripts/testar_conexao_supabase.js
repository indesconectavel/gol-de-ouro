// Script para Testar Conexão Supabase
// ===================================
const fs = require('fs');
const path = require('path');

// Carregar .env manualmente
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 [TESTE] Testando conexão Supabase...\n');

// Verificar variáveis de ambiente
console.log('📋 Variáveis de Ambiente:');
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Definida' : '❌ Não definida'}`);
console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Definida (' + process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...)' : '❌ Não definida'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Definida (' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : '❌ Não definida'}`);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

// Função assíncrona para testar
async function testarConexao() {
  // Tentar com Service Role Key (JWT)
  console.log('\n🔐 Testando com Service Role Key (JWT)...');
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Testar conexão
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ Erro: ${error.message}`);
      console.log(`  Código: ${error.code}`);
      console.log(`  Detalhes: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log('  ✅ Conexão estabelecida com sucesso!');
      console.log(`  Dados: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`  ❌ Exceção: ${error.message}`);
  }
  
  // Tentar com Anon Key (JWT)
  if (process.env.SUPABASE_ANON_KEY) {
    console.log('\n🔐 Testando com Anon Key (JWT)...');
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`  ⚠️  Erro (esperado para anon key): ${error.message}`);
      } else {
        console.log('  ✅ Conexão estabelecida com Anon Key!');
      }
    } catch (error) {
      console.log(`  ⚠️  Exceção: ${error.message}`);
    }
  }
}

testarConexao().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

