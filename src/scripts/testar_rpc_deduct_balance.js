/**
 * TESTE DIRETO DA RPC rpc_deduct_balance
 */

require('dotenv').config();
const { supabaseAdmin } = require('../../database/supabase-unified-config');

async function main() {
  console.log('\n🔍 TESTE DA RPC rpc_deduct_balance\n');
  console.log('='.repeat(70));

  const userId = '4ddf8330-ae94-4e92-a010-bdc7fa254ad5';
  const amount = 5.00;

  console.log(`\n📋 Parâmetros:`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Amount: R$ ${amount}`);

  try {
    console.log(`\n1️⃣ Verificando saldo antes...`);
    const { data: userBefore } = await supabaseAdmin
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .single();
    
    console.log(`   Saldo antes: R$ ${userBefore?.saldo || 0}`);

    console.log(`\n2️⃣ Chamando RPC rpc_deduct_balance...`);
    const { data, error } = await supabaseAdmin.rpc('rpc_deduct_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_description: 'Teste de débito',
      p_reference_id: null,
      p_reference_type: 'aposta',
      p_allow_negative: false
    });

    if (error) {
      console.error(`\n❌ ERRO NA RPC:`);
      console.error(`   Código: ${error.code}`);
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Detalhes: ${error.details}`);
      console.error(`   Hint: ${error.hint}`);
      return;
    }

    console.log(`\n📊 Resposta da RPC:`);
    console.log(JSON.stringify(data, null, 2));

    if (data && data.success) {
      console.log(`\n✅ RPC executada com sucesso!`);
      console.log(`   Saldo anterior: R$ ${data.old_balance}`);
      console.log(`   Saldo novo: R$ ${data.new_balance}`);
      console.log(`   Transaction ID: ${data.transaction_id}`);
    } else {
      console.log(`\n❌ RPC retornou erro:`);
      console.log(`   Erro: ${data?.error || 'Erro desconhecido'}`);
    }

    console.log(`\n3️⃣ Verificando saldo depois...`);
    const { data: userAfter } = await supabaseAdmin
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .single();
    
    console.log(`   Saldo depois: R$ ${userAfter?.saldo || 0}`);

  } catch (error) {
    console.error(`\n❌ ERRO FATAL:`);
    console.error(error);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

main();

