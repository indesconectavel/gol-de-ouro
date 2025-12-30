/**
 * 🧪 TESTE DA RPC COM USUÁRIO REAL
 * =================================
 * Testa rpc_deduct_balance com o UUID real do usuário encontrado
 */

require('dotenv').config();
const { supabaseAdmin } = require('../../database/supabase-unified-config');

async function testarRPC() {
  console.log('\n🧪 TESTE DA RPC COM USUÁRIO REAL\n');
  console.log('='.repeat(70));

  // UUID real do usuário encontrado no print
  const userId = '4ddf8330-ae94-4e92-a010-bdc7fa254ad5';
  const email = 'free10signer@gmail.com';
  const amount = 5.00;

  try {
    // 1. Verificar usuário primeiro
    console.log(`\n1️⃣ Verificando usuário: ${email}`);
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, saldo')
      .eq('id', userId)
      .single();

    if (usuarioError) {
      console.error(`❌ Erro ao buscar usuário: ${usuarioError.message}`);
      return;
    }

    if (!usuario) {
      console.error(`❌ Usuário não encontrado com ID: ${userId}`);
      return;
    }

    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Saldo atual: R$ ${usuario.saldo || 0}`);

    // 2. Testar RPC
    console.log(`\n2️⃣ Testando RPC rpc_deduct_balance...`);
    console.log(`   Parâmetros:`);
    console.log(`   - userId: ${userId}`);
    console.log(`   - amount: R$ ${amount}`);
    console.log(`   - description: Teste de débito`);
    console.log(`   - referenceType: aposta`);

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('rpc_deduct_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_description: 'Teste de débito',
      p_reference_id: null,
      p_reference_type: 'aposta',
      p_allow_negative: false
    });

    if (rpcError) {
      console.error(`\n❌ ERRO NA RPC:`);
      console.error(`   Código: ${rpcError.code}`);
      console.error(`   Mensagem: ${rpcError.message}`);
      console.error(`   Detalhes: ${rpcError.details || 'N/A'}`);
      console.error(`   Hint: ${rpcError.hint || 'N/A'}`);
      return;
    }

    console.log(`\n📊 Resposta da RPC:`);
    console.log(JSON.stringify(rpcResult, null, 2));

    if (rpcResult && rpcResult.success) {
      console.log(`\n✅ RPC executada com sucesso!`);
      console.log(`   Saldo anterior: R$ ${rpcResult.old_balance}`);
      console.log(`   Saldo novo: R$ ${rpcResult.new_balance}`);
      console.log(`   Valor debitado: R$ ${rpcResult.amount}`);
      console.log(`   Transaction ID: ${rpcResult.transaction_id}`);

      // 3. Verificar saldo atualizado
      console.log(`\n3️⃣ Verificando saldo atualizado no banco...`);
      const { data: usuarioAtualizado } = await supabaseAdmin
        .from('usuarios')
        .select('saldo')
        .eq('id', userId)
        .single();

      console.log(`   Saldo no banco: R$ ${usuarioAtualizado?.saldo || 0}`);

      if (Math.abs(parseFloat(usuarioAtualizado?.saldo || 0) - parseFloat(rpcResult.new_balance)) < 0.01) {
        console.log(`   ✅ Saldo está consistente!`);
      } else {
        console.log(`   ⚠️  Saldo não está consistente!`);
        console.log(`      Esperado: R$ ${rpcResult.new_balance}`);
        console.log(`      Encontrado: R$ ${usuarioAtualizado?.saldo || 0}`);
      }

      // 4. Verificar transação criada
      console.log(`\n4️⃣ Verificando transação criada...`);
      const { data: transacoes } = await supabaseAdmin
        .from('transacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (transacoes && transacoes.length > 0) {
        console.log(`   ✅ Transação criada:`);
        console.log(`      ID: ${transacoes[0].id}`);
        console.log(`      Tipo: ${transacoes[0].tipo}`);
        console.log(`      Valor: R$ ${transacoes[0].valor}`);
        console.log(`      Status: ${transacoes[0].status}`);
        console.log(`      Criada em: ${transacoes[0].created_at}`);
      } else {
        console.log(`   ⚠️  Nenhuma transação encontrada`);
      }

    } else {
      console.log(`\n❌ RPC retornou erro:`);
      console.log(`   Erro: ${rpcResult?.error || 'Erro desconhecido'}`);
      console.log(`   Resposta completa:`, JSON.stringify(rpcResult, null, 2));
    }

  } catch (error) {
    console.error(`\n❌ ERRO FATAL:`);
    console.error(error);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

testarRPC()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

