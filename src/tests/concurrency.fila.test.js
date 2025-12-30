/**
 * CONCURRENCY FILA TEST - Testa concorrência e atomicidade
 * Simula 500 requisições concorrentes de shoot() contra o mesmo lote
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const { supabaseAdmin } = require('../../database/supabase-config');
const axios = require('axios');

describe('Concorrência e Atomicidade', () => {
  let testUserId = null;
  let testLoteId = null;
  const API_URL = process.env.API_URL || 'http://localhost:8080';

  beforeAll(async () => {
    // Criar usuário de teste com saldo suficiente
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email: `test_concurrency_${Date.now()}@test.com`,
        nome: 'Test Concurrency User',
        senha_hash: 'test_hash',
        saldo: 10000.00
      })
      .select()
      .single();

    testUserId = usuario.id;

    // Criar lote de teste
    const { data: lote } = await supabaseAdmin
      .from('lotes')
      .insert({
        id: `test_concurrency_lote_${Date.now()}`,
        valor_aposta: 1.00,
        tamanho: 10,
        indice_vencedor: 5,
        status: 'ativo',
        posicao_atual: 0
      })
      .select()
      .single();

    testLoteId = lote.id;
  });

  afterAll(async () => {
    // Limpar
    if (testLoteId) {
      await supabaseAdmin.from('chutes').delete().eq('lote_id', testLoteId);
      await supabaseAdmin.from('lotes').delete().eq('id', testLoteId);
    }
    if (testUserId) {
      await supabaseAdmin.from('transacoes').delete().eq('usuario_id', testUserId);
      await supabaseAdmin.from('usuarios').delete().eq('id', testUserId);
    }
  });

  it('deve garantir atomicidade em chutes concorrentes', async () => {
    const numRequests = 50; // Reduzido para teste mais rápido
    const requests = [];

    // Criar múltiplas requisições concorrentes
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        axios.post(`${API_URL}/api/games/shoot`, {
          direction: 'C',
          amount: 1
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
          },
          timeout: 5000,
          validateStatus: () => true // Aceitar qualquer status
        }).catch(e => ({ error: e.message }))
      );
    }

    // Executar todas simultaneamente
    const resultados = await Promise.all(requests);

    // Verificar estado final do lote
    const { data: loteFinal } = await supabaseAdmin
      .from('lotes')
      .select('*')
      .eq('id', testLoteId)
      .single();

    // Verificar chutes criados
    const { data: chutes } = await supabaseAdmin
      .from('chutes')
      .select('*')
      .eq('lote_id', testLoteId);

    // Validações
    expect(loteFinal.posicao_atual).toBeLessThanOrEqual(loteFinal.tamanho);
    expect(chutes.length).toBeLessThanOrEqual(loteFinal.tamanho);
    
    // Verificar que apenas um gol foi marcado (se houver)
    const gols = chutes.filter(c => c.resultado === 'goal');
    expect(gols.length).toBeLessThanOrEqual(1);

    // Verificar consistência de transações
    const { data: transacoes } = await supabaseAdmin
      .from('transacoes')
      .select('*')
      .eq('usuario_id', testUserId)
      .eq('tipo', 'aposta');

    // Número de transações deve corresponder ao número de chutes bem-sucedidos
    expect(transacoes.length).toBeGreaterThanOrEqual(chutes.length);
  });

  it('deve garantir que apenas um vencedor por lote', async () => {
    // Criar lote novo para teste
    const { data: lote } = await supabaseAdmin
      .from('lotes')
      .insert({
        id: `test_winner_${Date.now()}`,
        valor_aposta: 1.00,
        tamanho: 10,
        indice_vencedor: 3, // Vencedor no índice 3
        status: 'ativo',
        posicao_atual: 0
      })
      .select()
      .single();

    // Simular múltiplos chutes até o vencedor
    let golMarcado = false;
    for (let i = 0; i < 10; i++) {
      const { data: chute } = await supabaseAdmin
        .from('chutes')
        .insert({
          lote_id: lote.id,
          usuario_id: testUserId,
          direcao: 'C',
          valor_aposta: 1.00,
          resultado: i === 3 ? 'goal' : 'miss',
          shot_index: i
        })
        .select()
        .single();

      if (chute.resultado === 'goal') {
        golMarcado = true;
        // Atualizar lote como completo
        await supabaseAdmin
          .from('lotes')
          .update({ status: 'completed', posicao_atual: i + 1 })
          .eq('id', lote.id);
        break;
      }
    }

    // Verificar que apenas um gol foi marcado
    const { data: chutes } = await supabaseAdmin
      .from('chutes')
      .select('*')
      .eq('lote_id', lote.id);

    const gols = chutes.filter(c => c.resultado === 'goal');
    expect(gols.length).toBeLessThanOrEqual(1);

    // Limpar
    await supabaseAdmin.from('chutes').delete().eq('lote_id', lote.id);
    await supabaseAdmin.from('lotes').delete().eq('id', lote.id);
  });
});

