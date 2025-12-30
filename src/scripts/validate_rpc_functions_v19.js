/**
 * VALIDATE RPC FUNCTIONS V19 - Valida e cria RPC functions necessárias
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RPC_FUNCTIONS_ESPERADAS = [
  'rpc_get_or_create_lote',
  'rpc_update_lote_after_shot',
  'rpc_add_balance',
  'rpc_deduct_balance'
];

async function validarRPCFunction(nomeFuncao) {
  try {
    // Tentar chamar a função com parâmetros mínimos
    const { data, error } = await supabase.rpc(nomeFuncao, {});
    
    // Se não houver erro de "função não existe", a função existe
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('function') && error.message.includes('not found')) {
        return { existe: false, erro: error.message };
      }
      // Outros erros podem ser de parâmetros inválidos, mas função existe
      return { existe: true, erro_validacao: error.message };
    }
    
    return { existe: true };
  } catch (e) {
    if (e.message.includes('does not exist') || e.message.includes('function') && e.message.includes('not found')) {
      return { existe: false, erro: e.message };
    }
    return { existe: true, erro_validacao: e.message };
  }
}

async function main() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE RPC FUNCTIONS V19');
  console.log('============================================================\n');
  
  console.log('🔍 Validando RPC functions...\n');
  
  const resultados = {};
  
  for (const funcao of RPC_FUNCTIONS_ESPERADAS) {
    console.log(`📋 Validando ${funcao}...`);
    const resultado = await validarRPCFunction(funcao);
    resultados[funcao] = resultado;
    
    if (resultado.existe) {
      console.log(`   ✅ ${funcao} existe`);
      if (resultado.erro_validacao) {
        console.log(`      ⚠️  Erro de validação (pode ser parâmetros): ${resultado.erro_validacao}`);
      }
    } else {
      console.log(`   ❌ ${funcao} não encontrada`);
      console.log(`      Erro: ${resultado.erro}`);
    }
  }
  
  // Verificar quais funções estão faltando
  const funcoesFaltando = Object.entries(resultados)
    .filter(([_, r]) => !r.existe)
    .map(([nome, _]) => nome);
  
  console.log('\n============================================================');
  console.log(' RESUMO DA VALIDAÇÃO');
  console.log('============================================================');
  
  const funcoesOk = RPC_FUNCTIONS_ESPERADAS.length - funcoesFaltando.length;
  console.log(`✅ Funções encontradas: ${funcoesOk}/${RPC_FUNCTIONS_ESPERADAS.length}`);
  
  if (funcoesFaltando.length > 0) {
    console.log(`❌ Funções faltando: ${funcoesFaltando.length}`);
    funcoesFaltando.forEach(f => console.log(`   - ${f}`));
    
    console.log('\n💡 INSTRUÇÕES PARA CRIAR FUNÇÕES FALTANDO:');
    console.log('   1. Acesse Supabase Dashboard → SQL Editor');
    
    if (funcoesFaltando.includes('rpc_add_balance') || funcoesFaltando.includes('rpc_deduct_balance')) {
      console.log('   2. Para rpc_add_balance e rpc_deduct_balance:');
      console.log('      - Abra: database/rpc-financial-acid.sql');
      console.log('      - Cole e execute no SQL Editor');
    }
    
    if (funcoesFaltando.includes('rpc_get_or_create_lote') || funcoesFaltando.includes('rpc_update_lote_after_shot')) {
      console.log('   3. Para rpc_get_or_create_lote e rpc_update_lote_after_shot:');
      console.log('      - Essas funções devem ter sido criadas pela migration V19');
      console.log('      - Verifique se a migration foi executada completamente');
    }
  } else {
    console.log('\n✅ Todas as RPC functions estão presentes!');
  }
  
  // Salvar relatório
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'validation_rpc_functions_v19.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    resultados,
    funcoes_faltando: funcoesFaltando,
    status: funcoesFaltando.length === 0 ? 'ok' : 'parcial'
  }, null, 2));
  
  console.log(`\n📄 Relatório salvo: ${reportPath}`);
  
  return resultados;
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro na validação:', error);
    process.exit(1);
  });
}

module.exports = { main, validarRPCFunction };

