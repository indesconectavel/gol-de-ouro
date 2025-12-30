/**
 * VALIDAR ESTRUTURAS DB PÓS-MIGRATION V19 - Modo Seguro
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validarEstruturas() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE ESTRUTURAS DB PÓS-MIGRATION V19');
  console.log('============================================================\n');
  
  const resultado = {
    timestamp: new Date().toISOString(),
    tabelas: {},
    colunas: {},
    erros: []
  };
  
  // 1. Validar tabela system_heartbeat
  console.log('1️⃣ Validando tabela system_heartbeat...');
  try {
    const { data, error } = await supabase
      .from('system_heartbeat')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('   ❌ Tabela system_heartbeat NÃO EXISTE');
        resultado.tabelas.system_heartbeat = { existe: false, erro: error.message };
      } else {
        console.log(`   ⚠️  Erro: ${error.message}`);
        resultado.tabelas.system_heartbeat = { existe: false, erro: error.message };
      }
    } else {
      console.log('   ✅ Tabela system_heartbeat EXISTE');
      resultado.tabelas.system_heartbeat = { existe: true };
    }
  } catch (e) {
    console.log(`   ❌ Exceção: ${e.message}`);
    resultado.erros.push(`system_heartbeat: ${e.message}`);
  }
  
  // 2. Validar colunas em lotes
  console.log('\n2️⃣ Validando colunas em lotes...');
  const colunasEsperadas = ['persisted_global_counter', 'synced_at', 'posicao_atual'];
  
  for (const coluna of colunasEsperadas) {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select(`id, ${coluna}`)
        .limit(1);
      
      if (error) {
        if (error.message.includes(coluna) && error.message.includes('does not exist')) {
          console.log(`   ❌ Coluna ${coluna} NÃO EXISTE`);
          resultado.colunas[coluna] = { existe: false, erro: error.message };
        } else {
          console.log(`   ⚠️  ${coluna}: ${error.message}`);
          resultado.colunas[coluna] = { existe: false, erro: error.message };
        }
      } else {
        console.log(`   ✅ Coluna ${coluna} EXISTE`);
        resultado.colunas[coluna] = { existe: true };
      }
    } catch (e) {
      console.log(`   ❌ ${coluna}: ${e.message}`);
      resultado.colunas[coluna] = { existe: false, erro: e.message };
    }
  }
  
  // Salvar resultado
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'validacao_v19', 'db_struct.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n📄 Resultado salvo em: ${reportPath}`);
  
  return resultado;
}

if (require.main === module) {
  validarEstruturas()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarEstruturas };



