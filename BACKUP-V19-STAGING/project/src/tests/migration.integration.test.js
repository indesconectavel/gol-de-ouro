/**
 * MIGRATION INTEGRATION TEST - Testa migração de memória para DB
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const { supabaseAdmin } = require('../../database/supabase-config');
const { migrarLote } = require('../scripts/migrate_memory_lotes_to_db');

describe('Migração de Memória para DB', () => {
  let testLoteId = null;

  beforeAll(async () => {
    // Criar lote de teste
    const { data: lote } = await supabaseAdmin
      .from('lotes')
      .insert({
        id: `test_migration_${Date.now()}`,
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
    if (testLoteId) {
      await supabaseAdmin.from('chutes').delete().eq('lote_id', testLoteId);
      await supabaseAdmin.from('lotes').delete().eq('id', testLoteId);
    }
  });

  it('deve reconciliar chutes em memória com DB sem perda', async () => {
    // Simular lote em memória com chutes
    const loteMemoria = {
      id: testLoteId,
      valor: 1.00,
      ativo: true,
      chutes: [
        { id: 'chute1', userId: 'user1', direction: 'C', amount: 1.00, result: 'miss' },
        { id: 'chute2', userId: 'user2', direction: 'TL', amount: 1.00, result: 'miss' }
      ],
      posicao_atual: 2,
      winnerIndex: 5
    };

    // Executar migração
    const resultado = await migrarLote(loteMemoria);

    // Verificar que chutes foram inseridos
    const { data: chutes } = await supabaseAdmin
      .from('chutes')
      .select('*')
      .eq('lote_id', testLoteId);

    expect(chutes.length).toBeGreaterThanOrEqual(loteMemoria.chutes.length);

    // Verificar que posição foi atualizada
    const { data: lote } = await supabaseAdmin
      .from('lotes')
      .select('*')
      .eq('id', testLoteId)
      .single();

    expect(lote.posicao_atual).toBeGreaterThanOrEqual(loteMemoria.posicao_atual);
  });
});

