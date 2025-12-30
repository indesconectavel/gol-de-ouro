/**
 * PRECHECKS V19 - Validação pré-migration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

async function prechecks() {
  console.log('============================================================');
  console.log(' PRECHECKS V19');
  console.log('============================================================\n');
  
  const resultado = {
    timestamp: new Date().toISOString(),
    env: {},
    connection: {},
    erros: [],
    warnings: []
  };
  
  // 1. Validar variáveis de ambiente
  console.log('1️⃣ Validando variáveis de ambiente...');
  
  if (!SUPABASE_URL) {
    resultado.erros.push('SUPABASE_URL não configurada');
    console.log('   ❌ SUPABASE_URL não configurada');
  } else {
    resultado.env.SUPABASE_URL = 'OK';
    console.log('   ✅ SUPABASE_URL configurada');
  }
  
  if (!SUPABASE_KEY) {
    resultado.erros.push('SUPABASE_SERVICE_ROLE_KEY não configurada');
    console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  } else {
    resultado.env.SUPABASE_SERVICE_ROLE_KEY = 'OK';
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY configurada');
  }
  
  if (!DATABASE_URL) {
    resultado.warnings.push('DATABASE_URL não configurada (opcional para Supabase REST)');
    console.log('   ⚠️  DATABASE_URL não configurada');
  } else {
    resultado.env.DATABASE_URL = 'OK';
    console.log('   ✅ DATABASE_URL configurada');
  }
  
  if (resultado.erros.length > 0) {
    console.log('\n❌ ERROS CRÍTICOS ENCONTRADOS');
    console.log('   Abortando execução...');
    return resultado;
  }
  
  // 2. Testar conexão Supabase
  console.log('\n2️⃣ Testando conexão Supabase...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('usuarios').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        resultado.warnings.push('Tabela usuarios não existe (pode ser normal)');
        console.log('   ⚠️  Tabela usuarios não existe');
      } else {
        resultado.erros.push(`Erro ao conectar: ${error.message}`);
        console.log(`   ❌ Erro: ${error.message}`);
      }
    } else {
      resultado.connection.supabase = 'OK';
      console.log('   ✅ Conexão Supabase OK');
    }
  } catch (e) {
    resultado.erros.push(`Exceção: ${e.message}`);
    console.log(`   ❌ Exceção: ${e.message}`);
  }
  
  // Salvar resultado
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'v19_cursor_run', 'prechecks.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n📄 Resultado salvo em: ${reportPath}`);
  
  return resultado;
}

if (require.main === module) {
  prechecks()
    .then(result => {
      if (result.erros.length > 0) {
        console.log('\n❌ Prechecks falharam. Corrija os erros antes de continuar.');
        process.exit(1);
      } else {
        console.log('\n✅ Prechecks OK');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { prechecks };



