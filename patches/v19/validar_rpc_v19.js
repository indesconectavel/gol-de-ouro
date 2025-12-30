// Script de Validação de RPCs V19
// =================================
// Data: 2025-12-10
// Versão: V19.0.0

require('dotenv').config();
const { supabaseAdmin } = require('../../database/supabase-unified-config');

const RPCS_V19 = [
  // Financeiras
  'rpc_add_balance',
  'rpc_deduct_balance',
  'rpc_transfer_balance',
  'rpc_get_balance',
  // Lotes
  'rpc_get_or_create_lote',
  'rpc_update_lote_after_shot',
  'rpc_get_active_lotes',
  // Recompensas
  'rpc_register_reward',
  'rpc_mark_reward_credited',
  'rpc_get_user_rewards',
  // Webhook
  'rpc_register_webhook_event',
  'rpc_check_webhook_event_processed',
  'rpc_mark_webhook_event_processed',
  // Adicional
  'rpc_expire_stale_pix'
];

async function validarRPCs() {
  console.log('🔍 Validando RPCs V19...\n');

  const resultados = {
    encontradas: [],
    faltando: []
  };

  for (const rpc of RPCS_V19) {
    try {
      // Tentar chamar RPC (mesmo que falhe, confirma que existe)
      const { error } = await supabaseAdmin.rpc(rpc, {});
      
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        resultados.faltando.push(rpc);
        console.log(`❌ ${rpc} - NÃO ENCONTRADA`);
      } else {
        resultados.encontradas.push(rpc);
        console.log(`✅ ${rpc} - ENCONTRADA`);
      }
    } catch (err) {
      // Se erro não for "não existe", RPC existe
      if (err.message && err.message.includes('does not exist')) {
        resultados.faltando.push(rpc);
        console.log(`❌ ${rpc} - NÃO ENCONTRADA`);
      } else {
        resultados.encontradas.push(rpc);
        console.log(`✅ ${rpc} - ENCONTRADA`);
      }
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`  ✅ Encontradas: ${resultados.encontradas.length}/${RPCS_V19.length}`);
  console.log(`  ❌ Faltando: ${resultados.faltando.length}/${RPCS_V19.length}`);

  if (resultados.faltando.length > 0) {
    console.log(`\n⚠️ RPCs faltando:`);
    resultados.faltando.forEach(rpc => console.log(`  - ${rpc}`));
    console.log(`\n💡 Execute a Migration V19 para criar as RPCs faltantes.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todas as RPCs V19 estão presentes!`);
    process.exit(0);
  }
}

validarRPCs().catch(err => {
  console.error('\n❌ Erro na validação:', err.message);
  process.exit(1);
});

