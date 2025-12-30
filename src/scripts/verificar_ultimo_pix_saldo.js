// Script para verificar último PIX e saldo creditado
require('dotenv').config({ path: '.env' });
const path = require('path');
const { supabaseAdmin } = require(path.join(__dirname, '../../database/supabase-unified-config'));

async function verificar() {
  try {
    console.log('\n🔍 VERIFICANDO ÚLTIMO PIX E SALDO CREDITADO\n');
    console.log('='.repeat(70));

    // Buscar último PIX criado
    const { data: ultimoPix, error: pixError } = await supabaseAdmin
      .from('pagamentos_pix')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pixError) {
      console.error('❌ Erro ao buscar PIX:', pixError);
      return;
    }

    console.log('\n📱 ÚLTIMO PIX CRIADO:');
    console.log(`   ID: ${ultimoPix.id}`);
    console.log(`   Payment ID: ${ultimoPix.payment_id}`);
    console.log(`   Usuário ID: ${ultimoPix.usuario_id}`);
    console.log(`   Valor salvo (valor): R$ ${ultimoPix.valor}`);
    console.log(`   Valor salvo (amount): R$ ${ultimoPix.amount}`);
    console.log(`   Status: ${ultimoPix.status}`);
    console.log(`   Criado em: ${ultimoPix.created_at}`);

    // Buscar saldo atual do usuário
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, saldo')
      .eq('id', ultimoPix.usuario_id)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    console.log('\n👤 USUÁRIO:');
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Saldo atual: R$ ${usuario.saldo}`);

    // Buscar últimas transações financeiras
    const { data: transacoes, error: transError } = await supabaseAdmin
      .from('transacoes')
      .select('*')
      .eq('usuario_id', ultimoPix.usuario_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transError) {
      console.error('❌ Erro ao buscar transações:', transError);
      return;
    }

    console.log('\n💰 ÚLTIMAS TRANSAÇÕES FINANCEIRAS:');
    transacoes.forEach((trans, index) => {
      console.log(`\n   ${index + 1}. ${trans.tipo} - ${trans.descricao}`);
      console.log(`      Valor: R$ ${trans.valor}`);
      console.log(`      Saldo anterior: R$ ${trans.saldo_anterior}`);
      console.log(`      Saldo posterior: R$ ${trans.saldo_posterior}`);
      console.log(`      Data: ${trans.created_at}`);
    });

    // Verificar eventos de webhook processados
    const { data: eventos, error: eventosError } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .eq('payment_id', String(ultimoPix.payment_id))
      .order('created_at', { ascending: false })
      .limit(10);

    if (!eventosError && eventos && eventos.length > 0) {
      console.log(`\n📝 EVENTOS DE WEBHOOK PROCESSADOS: ${eventos.length} eventos encontrados`);
      eventos.forEach((evento, index) => {
        console.log(`\n   ${index + 1}. Evento ID: ${evento.id}`);
        console.log(`      Payment ID: ${evento.payment_id}`);
        console.log(`      Processado: ${evento.processed ? '✅ SIM' : '❌ NÃO'}`);
        if (evento.result) {
          const result = typeof evento.result === 'string' ? JSON.parse(evento.result) : evento.result;
          console.log(`      Valor creditado: R$ ${result.amount || 'N/A'}`);
          console.log(`      Saldo anterior: R$ ${result.oldBalance || result.old_balance || 'N/A'}`);
          console.log(`      Saldo posterior: R$ ${result.newBalance || result.new_balance || 'N/A'}`);
        }
        console.log(`      Data: ${evento.created_at}`);
      });
      
      // Contar eventos processados
      const eventosProcessados = eventos.filter(e => e.processed).length;
      console.log(`\n   📊 Total de eventos processados: ${eventosProcessados}`);
      if (eventosProcessados > 1) {
        console.log(`   ⚠️ PROBLEMA: Múltiplos eventos processados para o mesmo PIX!`);
      }
    } else if (eventosError) {
      console.log(`\n⚠️ Erro ao buscar eventos: ${eventosError.message}`);
    } else {
      console.log('\n⚠️ Nenhum evento de webhook encontrado');
    }

    // Análise
    console.log('\n📊 ANÁLISE:');
    if (ultimoPix.valor === 5.00 && ultimoPix.amount === 5.00) {
      console.log('   ✅ Valor salvo no PIX está correto: R$ 5,00');
    } else {
      console.log(`   ⚠️ Valor salvo no PIX está diferente: valor=${ultimoPix.valor}, amount=${ultimoPix.amount}`);
    }

    if (ultimoPix.status === 'approved') {
      console.log('   ✅ PIX foi aprovado');
      
      // Verificar se o saldo foi creditado corretamente
      const saldoEsperado = ultimoPix.valor || ultimoPix.amount || 0;
      const ultimaTransacao = transacoes[0];
      
      if (ultimaTransacao && ultimaTransacao.tipo === 'credito') {
        if (ultimaTransacao.valor === saldoEsperado) {
          console.log(`   ✅ Saldo creditado corretamente: R$ ${ultimaTransacao.valor}`);
        } else {
          console.log(`   ❌ PROBLEMA: Saldo creditado incorretamente!`);
          console.log(`      Esperado: R$ ${saldoEsperado}`);
          console.log(`      Creditado: R$ ${ultimaTransacao.valor}`);
        }
      } else {
        console.log('   ⚠️ Nenhuma transação de crédito encontrada');
      }
    } else {
      console.log(`   ⚠️ PIX ainda não foi aprovado (status: ${ultimoPix.status})`);
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

verificar();

