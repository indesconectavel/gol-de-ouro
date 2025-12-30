require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../../database/supabase-unified-config');

const API_BASE_URL = process.env.API_BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const EMAIL = 'free10signer@gmail.com';
const SENHA = 'Free10signer';

async function fazerLogin() {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email: EMAIL,
    password: SENHA
  });
  
  return response.data.token || response.data.data?.token;
}

async function verificarSaldo(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseFloat(response.data.user?.saldo || response.data.data?.saldo || 0);
  } catch (error) {
    return 0;
  }
}

async function verificarPagamentosPix() {
  try {
    // Buscar pagamentos recentes do usuário
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', EMAIL)
      .single();

    if (!usuario) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const { data: pagamentos, error } = await supabaseAdmin
      .from('pagamentos_pix')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar pagamentos:', error);
      return;
    }

    console.log('\n📋 ÚLTIMOS PAGAMENTOS PIX:\n');
    pagamentos.forEach((p, idx) => {
      console.log(`${idx + 1}. Payment ID: ${p.payment_id}`);
      console.log(`   Valor: R$ ${p.valor || p.amount || 0}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Criado em: ${p.created_at}`);
      console.log(`   Atualizado em: ${p.updated_at || 'N/A'}`);
      console.log('');
    });

    return pagamentos;
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function verificarWebhookEvents() {
  try {
    const { data: eventos, error } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar eventos de webhook:', error);
      return;
    }

    console.log('\n📋 ÚLTIMOS EVENTOS DE WEBHOOK:\n');
    eventos.forEach((e, idx) => {
      console.log(`${idx + 1}. Event ID: ${e.id}`);
      console.log(`   Tipo: ${e.event_type}`);
      console.log(`   Status: ${e.status}`);
      console.log(`   Processado: ${e.processed ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${e.created_at}`);
      console.log(`   Erro: ${e.error_message || 'Nenhum'}`);
      console.log('');
    });

    return eventos;
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function verificarTransacoes() {
  try {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', EMAIL)
      .single();

    if (!usuario) return;

    const { data: transacoes, error } = await supabaseAdmin
      .from('transacoes')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return;
    }

    console.log('\n📋 ÚLTIMAS TRANSAÇÕES:\n');
    transacoes.forEach((t, idx) => {
      console.log(`${idx + 1}. Tipo: ${t.tipo}`);
      console.log(`   Valor: R$ ${t.valor || 0}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Descrição: ${t.descricao || 'N/A'}`);
      console.log(`   Criado em: ${t.created_at}`);
      console.log('');
    });

    return transacoes;
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function main() {
  console.log('\n🔍 VERIFICANDO STATUS DO PAGAMENTO PIX\n');
  console.log('='.repeat(70));

  // 1. Login
  const token = await fazerLogin();
  if (!token) {
    console.log('❌ Erro ao fazer login');
    return;
  }

  // 2. Verificar saldo atual
  const saldoAtual = await verificarSaldo(token);
  console.log(`\n💰 Saldo atual: R$ ${saldoAtual.toFixed(2)}\n`);

  // 3. Verificar pagamentos PIX
  await verificarPagamentosPix();

  // 4. Verificar eventos de webhook
  await verificarWebhookEvents();

  // 5. Verificar transações
  await verificarTransacoes();

  // 6. Aguardar e verificar novamente
  console.log('\n⏳ Aguardando 30 segundos e verificando novamente...\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const saldoNovo = await verificarSaldo(token);
  console.log(`💰 Saldo após aguardar: R$ ${saldoNovo.toFixed(2)}`);

  if (saldoNovo > saldoAtual) {
    console.log(`\n✅ Crédito detectado! Saldo aumentou de R$ ${saldoAtual.toFixed(2)} para R$ ${saldoNovo.toFixed(2)}`);
    console.log(`\n🚀 Agora você pode executar: node src/scripts/continuar_testes_apos_pagamento_pix.js\n`);
  } else {
    console.log(`\n⚠️  Saldo ainda não foi creditado. O webhook pode estar demorando para processar.`);
    console.log(`\n💡 Tente executar novamente em alguns minutos ou verifique os logs do servidor.\n`);
  }
}

main();

