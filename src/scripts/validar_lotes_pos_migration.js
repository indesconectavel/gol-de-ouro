/**
 * VALIDAR CONTEÚDO DA TABELA LOTES PÓS-MIGRATION V19
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

async function validarLotes() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE CONTEÚDO DA TABELA LOTES');
  console.log('============================================================\n');
  
  const resultado = {
    timestamp: new Date().toISOString(),
    total: 0,
    preview: [],
    erros: []
  };
  
  // Contar total de lotes
  console.log('1️⃣ Contando total de lotes...');
  try {
    const { count, error } = await supabase
      .from('lotes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      resultado.erros.push(`count: ${error.message}`);
    } else {
      resultado.total = count || 0;
      console.log(`   ✅ Total de lotes: ${resultado.total}`);
    }
  } catch (e) {
    console.log(`   ❌ Exceção: ${e.message}`);
    resultado.erros.push(`count: ${e.message}`);
  }
  
  // Buscar preview de lotes
  console.log('\n2️⃣ Buscando preview de lotes...');
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .order('id', { ascending: true })
      .limit(20);
    
    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      resultado.erros.push(`preview: ${error.message}`);
    } else {
      resultado.preview = data || [];
      console.log(`   ✅ ${resultado.preview.length} lote(s) encontrado(s) no preview`);
      
      if (resultado.preview.length > 0) {
        console.log('\n   📊 Primeiros 5 lotes:');
        resultado.preview.slice(0, 5).forEach((lote, index) => {
          console.log(`      ${index + 1}. ID: ${lote.id}, Status: ${lote.status || 'N/A'}, Posição: ${lote.posicao_atual || 0}`);
        });
      }
    }
  } catch (e) {
    console.log(`   ❌ Exceção: ${e.message}`);
    resultado.erros.push(`preview: ${e.message}`);
  }
  
  // Salvar resultado
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'validacao_v19', 'lotes_preview.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n📄 Resultado salvo em: ${reportPath}`);
  
  return resultado;
}

if (require.main === module) {
  validarLotes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarLotes };



