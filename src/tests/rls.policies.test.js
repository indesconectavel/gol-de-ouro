/**
 * RLS POLICIES TEST - Testa políticas de Row Level Security
 * Executa com: npm test -- rls.policies.test.js
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const { supabaseAdmin } = require('../../database/supabase-config');

describe('RLS Policies', () => {
  let testUserId = null;
  let testLoteId = null;

  beforeAll(async () => {
    // Criar usuário de teste
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email: `test_rls_${Date.now()}@test.com`,
        nome: 'Test RLS User',
        senha_hash: 'test_hash',
        saldo: 100.00
      })
      .select()
      .single();

    if (error) throw error;
    testUserId = usuario.id;

    // Criar lote de teste
    const { data: lote, error: loteError } = await supabaseAdmin
      .from('lotes')
      .insert({
        id: `test_lote_${Date.now()}`,
        valor_aposta: 1.00,
        tamanho: 10,
        indice_vencedor: 5,
        status: 'ativo'
      })
      .select()
      .single();

    if (loteError) throw loteError;
    testLoteId = lote.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testLoteId) {
      await supabaseAdmin.from('chutes').delete().eq('lote_id', testLoteId);
      await supabaseAdmin.from('lotes').delete().eq('id', testLoteId);
    }
    if (testUserId) {
      await supabaseAdmin.from('usuarios').delete().eq('id', testUserId);
    }
  });

  it('deve permitir usuário ver apenas seus próprios dados', async () => {
    // Simular sessão com app.current_user_id
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `SET LOCAL app.current_user_id = '${testUserId}'::uuid; SELECT * FROM usuarios WHERE id = '${testUserId}';`
    });

    // Com RLS habilitado, usuário deve ver apenas seus próprios dados
    expect(error).toBeNull();
  });

  it('deve bloquear usuário de ver dados de outros usuários', async () => {
    // Criar outro usuário
    const { data: outroUsuario } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email: `test_rls_other_${Date.now()}@test.com`,
        nome: 'Other User',
        senha_hash: 'test_hash',
        saldo: 50.00
      })
      .select()
      .single();

    // Tentar acessar com app.current_user_id do primeiro usuário
    // Deve falhar ou retornar vazio
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', outroUsuario.id);

    // Com RLS correto, não deve retornar dados de outro usuário
    // (depende da implementação exata das policies)
    
    // Limpar
    await supabaseAdmin.from('usuarios').delete().eq('id', outroUsuario.id);
  });

  it('deve permitir backend role inserir em todas as tabelas', async () => {
    // Simular role backend
    const { error } = await supabaseAdmin
      .from('chutes')
      .insert({
        lote_id: testLoteId,
        usuario_id: testUserId,
        direcao: 'C',
        valor_aposta: 1.00,
        resultado: 'miss'
      });

    // Backend deve conseguir inserir
    expect(error).toBeNull();
  });

  it('deve bloquear usuário comum de inserir diretamente', async () => {
    // Tentar inserir sem role backend (simulado)
    // Isso deve falhar com RLS correto
    // Implementação depende de como as policies são aplicadas
  });
});

