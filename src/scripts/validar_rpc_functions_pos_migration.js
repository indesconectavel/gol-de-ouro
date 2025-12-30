/**
 * VALIDAR RPC FUNCTIONS DA ENGINE V19 PÓS-MIGRATION
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

async function validarRPCFunctions() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE RPC FUNCTIONS ENGINE V19');
  console.log('============================================================\n');
  
  const resultado = {
    timestamp: new Date().toISOString(),
    functions: {},
    erros: []
  };
  
  // RPC Functions esperadas
  const rpcFunctions = [
    'rpc_get_or_create_lote',
    'rpc_update_lote_after_shot',
    'rpc_add_balance',
    'rpc_deduct_balance',
    'engine_status_v19',
    'get_dashboard_metrics_v19'
  ];
  
  for (const fnName of rpcFunctions) {
    console.log(`🔍 Verificando ${fnName}...`);
    try {
      // Tentar chamar a função (pode falhar por parâmetros, mas confirma existência)
      const { data, error } = await supabase.rpc(fnName, {});
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log(`   ❌ ${fnName}: NÃO EXISTE`);
          resultado.functions[fnName] = { existe: false, erro: error.message };
        } else {
          // Se der outro erro (ex: parâmetros inválidos), a função existe
          console.log(`   ✅ ${fnName}: EXISTE (erro de parâmetros esperado)`);
          resultado.functions[fnName] = { existe: true, erro_parametros: error.message };
        }
      } else {
        console.log(`   ✅ ${fnName}: EXISTE E FUNCIONA`);
        resultado.functions[fnName] = { existe: true, data: data };
      }
    } catch (e) {
      console.log(`   ⚠️  ${fnName}: ${e.message}`);
      resultado.functions[fnName] = { existe: false, erro: e.message };
    }
  }
  
  // Tentar executar funções específicas se existirem
  console.log('\n📊 Testando execução de funções específicas...');
  
  if (resultado.functions['engine_status_v19']?.existe) {
    try {
      const { data, error } = await supabase.rpc('engine_status_v19', {});
      if (!error) {
        console.log('   ✅ engine_status_v19 executada com sucesso');
        resultado.functions['engine_status_v19'].resultado = data;
      }
    } catch (e) {
      console.log(`   ⚠️  engine_status_v19: ${e.message}`);
    }
  }
  
  if (resultado.functions['get_dashboard_metrics_v19']?.existe) {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_metrics_v19', {});
      if (!error) {
        console.log('   ✅ get_dashboard_metrics_v19 executada com sucesso');
        resultado.functions['get_dashboard_metrics_v19'].resultado = data;
      }
    } catch (e) {
      console.log(`   ⚠️  get_dashboard_metrics_v19: ${e.message}`);
    }
  }
  
  // Salvar resultado
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'validacao_v19', 'rpcs.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n📄 Resultado salvo em: ${reportPath}`);
  
  return resultado;
}

if (require.main === module) {
  validarRPCFunctions()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarRPCFunctions };



