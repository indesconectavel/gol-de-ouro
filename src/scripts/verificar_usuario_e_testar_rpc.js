/**
 * SCRIPT PARA VERIFICAR USUÁRIO E TESTAR RPC
 */

require('dotenv').config();
const { supabaseAdmin } = require('../../database/supabase-unified-config');

async function main() {
  console.log('\n🔍 VERIFICAÇÃO DE USUÁRIO E TESTE DA RPC\n');
  console.log('='.repeat(70));

  const emailTeste = 'free10signer@gmail.com';

  try {
    // 1. Buscar usuário por email
    console.log(`\n1️⃣ Buscando usuário por email: ${emailTeste}`);
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, saldo')
      .eq('email', emailTeste)
      .limit(1);

    if (usuariosError) {
      console.error(`❌ Erro ao buscar usuário: ${usuariosError.message}`);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.error(`❌ Usuário não encontrado com email: ${emailTeste}`);
      console.log('\n💡 Solução: Criar usuário ou usar email diferente');
      return;
    }

    const usuario = usuarios[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Saldo: R$ ${usuario.saldo || 0}`);

    // 2. Testar RPC com UUID correto
    console.log(`\n2️⃣ Testando RPC rpc_deduct_balance com UUID correto...`);
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('rpc_deduct_balance', {
      p_user_id: usuario.id,
      p_amount: 5.00,
      p_description: 'Teste de débito',
      p_reference_id: null,
      p_reference_type: 'aposta',
      p_allow_negative: false
    });

    if (rpcError) {
      console.error(`\n❌ ERRO NA RPC:`);
      console.error(`   Código: ${rpcError.code}`);
      console.error(`   Mensagem: ${rpcError.message}`);
      console.error(`   Detalhes: ${rpcError.details}`);
      console.error(`   Hint: ${rpcError.hint}`);
      return;
    }

    console.log(`\n📊 Resposta da RPC:`);
    console.log(JSON.stringify(rpcResult, null, 2));

    if (rpcResult && rpcResult.success) {
      console.log(`\n✅ RPC executada com sucesso!`);
      console.log(`   Saldo anterior: R$ ${rpcResult.old_balance}`);
      console.log(`   Saldo novo: R$ ${rpcResult.new_balance}`);
      console.log(`   Transaction ID: ${rpcResult.transaction_id}`);
      
      // 3. Verificar saldo atualizado
      console.log(`\n3️⃣ Verificando saldo atualizado no banco...`);
      const { data: usuarioAtualizado } = await supabaseAdmin
        .from('usuarios')
        .select('saldo')
        .eq('id', usuario.id)
        .single();
      
      console.log(`   Saldo no banco: R$ ${usuarioAtualizado?.saldo || 0}`);
      
      if (Math.abs(parseFloat(usuarioAtualizado?.saldo || 0) - parseFloat(rpcResult.new_balance)) < 0.01) {
        console.log(`   ✅ Saldo está consistente!`);
      } else {
        console.log(`   ⚠️  Saldo não está consistente!`);
      }

      // 4. Verificar transação criada
      console.log(`\n4️⃣ Verificando transação criada...`);
      const { data: transacoes } = await supabaseAdmin
        .from('transacoes')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (transacoes && transacoes.length > 0) {
        console.log(`   ✅ Transação criada:`);
        console.log(`      ID: ${transacoes[0].id}`);
        console.log(`      Tipo: ${transacoes[0].tipo}`);
        console.log(`      Valor: R$ ${transacoes[0].valor}`);
        console.log(`      Status: ${transacoes[0].status}`);
      } else {
        console.log(`   ⚠️  Nenhuma transação encontrada`);
      }

    } else {
      console.log(`\n❌ RPC retornou erro:`);
      console.log(`   Erro: ${rpcResult?.error || 'Erro desconhecido'}`);
    }

  } catch (error) {
    console.error(`\n❌ ERRO FATAL:`);
    console.error(error);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

main();

