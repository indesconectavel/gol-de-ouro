// Script de diagnóstico para investigar problema de saldo
require('dotenv').config({ path: '.env' });
const path = require('path');
const { supabaseAdmin } = require(path.join(__dirname, '../../database/supabase-unified-config'));

async function diagnosticar() {
  try {
    console.log('\n🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA DE SALDO\n');
    console.log('='.repeat(70));

    const userId = '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'; // free10signer@gmail.com

    // 1. Verificar último PIX criado
    console.log('\n📱 1. ÚLTIMO PIX CRIADO:');
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

    console.log(`   ID: ${ultimoPix.id}`);
    console.log(`   Payment ID: ${ultimoPix.payment_id}`);
    console.log(`   Valor (valor): R$ ${ultimoPix.valor}`);
    console.log(`   Valor (amount): R$ ${ultimoPix.amount}`);
    console.log(`   Status: ${ultimoPix.status}`);
    console.log(`   Criado em: ${ultimoPix.created_at}`);

    // 2. Verificar saldo atual
    console.log('\n💰 2. SALDO ATUAL DO USUÁRIO:');
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, saldo')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    console.log(`   Email: ${usuario.email}`);
    console.log(`   Saldo atual: R$ ${usuario.saldo}`);

    // 3. Verificar eventos de webhook
    console.log('\n📝 3. EVENTOS DE WEBHOOK:');
    const { data: eventos, error: eventosError } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .eq('payment_id', String(ultimoPix.payment_id))
      .order('created_at', { ascending: false });

    if (eventosError) {
      console.log(`   ⚠️ Erro ao buscar eventos: ${eventosError.message}`);
    } else if (!eventos || eventos.length === 0) {
      console.log('   ⚠️ NENHUM EVENTO ENCONTRADO - Webhook não passou pelo sistema de idempotência!');
      console.log('   💡 Isso significa que o webhook pode estar sendo processado por outro caminho');
    } else {
      console.log(`   Total de eventos: ${eventos.length}`);
      eventos.forEach((evento, index) => {
        console.log(`\n   Evento ${index + 1}:`);
        console.log(`      ID: ${evento.id}`);
        console.log(`      Payment ID: ${evento.payment_id}`);
        console.log(`      Processado: ${evento.processed ? '✅ SIM' : '❌ NÃO'}`);
        if (evento.result) {
          const result = typeof evento.result === 'string' ? JSON.parse(evento.result) : evento.result;
          console.log(`      Valor creditado: R$ ${result.amount || 'N/A'}`);
        }
        console.log(`      Criado em: ${evento.created_at}`);
      });
    }

    // 4. Verificar transações financeiras
    console.log('\n💳 4. TRANSAÇÕES FINANCEIRAS:');
    const { data: transacoes, error: transError } = await supabaseAdmin
      .from('transacoes')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transError) {
      console.log(`   ⚠️ Erro ao buscar transações: ${transError.message}`);
    } else if (!transacoes || transacoes.length === 0) {
      console.log('   ⚠️ NENHUMA TRANSAÇÃO ENCONTRADA');
    } else {
      console.log(`   Total de transações: ${transacoes.length}`);
      let totalCreditado = 0;
      transacoes.forEach((trans, index) => {
        if (trans.tipo === 'credito') {
          totalCreditado += parseFloat(trans.valor || 0);
        }
        console.log(`\n   Transação ${index + 1}:`);
        console.log(`      Tipo: ${trans.tipo}`);
        console.log(`      Valor: R$ ${trans.valor}`);
        console.log(`      Descrição: ${trans.descricao}`);
        console.log(`      Saldo anterior: R$ ${trans.saldo_anterior}`);
        console.log(`      Saldo posterior: R$ ${trans.saldo_posterior}`);
        console.log(`      Criado em: ${trans.created_at}`);
      });
      console.log(`\n   💰 Total creditado nas transações: R$ ${totalCreditado.toFixed(2)}`);
    }

    // 5. Análise final
    console.log('\n📊 5. ANÁLISE FINAL:');
    const valorEsperado = ultimoPix.valor || ultimoPix.amount || 0;
    const saldoAtual = parseFloat(usuario.saldo || 0);
    
    console.log(`   Valor do PIX: R$ ${valorEsperado}`);
    console.log(`   Saldo atual: R$ ${saldoAtual}`);
    
    if (saldoAtual === valorEsperado) {
      console.log('   ✅ Saldo está correto!');
    } else {
      const diferenca = saldoAtual - valorEsperado;
      const vezesProcessado = saldoAtual / valorEsperado;
      console.log(`   ❌ PROBLEMA: Saldo incorreto!`);
      console.log(`      Diferença: R$ ${diferenca.toFixed(2)}`);
      console.log(`      Possível causa: Webhook processado ${vezesProcessado.toFixed(0)} vezes`);
      
      if (!eventos || eventos.length === 0) {
        console.log(`\n   🔍 CAUSA PROVÁVEL:`);
        console.log(`      • Webhook não está passando pelo sistema de idempotência`);
        console.log(`      • Pode estar sendo processado por código legado ou outro caminho`);
        console.log(`      • Verificar logs do servidor para identificar qual código está processando`);
      }
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

diagnosticar();

