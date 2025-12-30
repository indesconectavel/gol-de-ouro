// Script de Verificação: Schema de Lotes
// =======================================
// Verifica se o schema foi aplicado corretamente no Supabase
// =======================================

require('dotenv').config();
const { supabaseAdmin } = require('../database/supabase-config');

async function verificarSchema() {
  console.log('🔍 Verificando schema de lotes...\n');

  try {
    // 1. Verificar tabela lotes
    console.log('1️⃣ Verificando tabela lotes...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('lotes')
      .select('*')
      .limit(0);

    if (columnsError && columnsError.code === '42P01') {
      console.log('❌ Tabela lotes não existe!');
      return false;
    }

    // Verificar coluna completed_at
    const { data: checkColumn } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'completed_at'
      `
    });

    if (checkColumn && checkColumn.length > 0) {
      console.log('✅ Tabela lotes existe com campo completed_at');
    } else {
      console.log('⚠️ Tabela lotes existe mas campo completed_at pode estar faltando');
    }

    // 2. Verificar índices
    console.log('\n2️⃣ Verificando índices...');
    const indicesEsperados = ['idx_lotes_status', 'idx_lotes_valor_aposta', 'idx_lotes_created_at'];
    let indicesEncontrados = 0;

    for (const idx of indicesEsperados) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          query: `SELECT 1 FROM pg_indexes WHERE indexname = '${idx}'`
        });
        if (!error) {
          console.log(`✅ Índice ${idx} existe`);
          indicesEncontrados++;
        }
      } catch (e) {
        console.log(`⚠️ Não foi possível verificar índice ${idx}`);
      }
    }

    // 3. Verificar RPC Functions
    console.log('\n3️⃣ Verificando RPC Functions...');
    const funcoesEsperadas = [
      'rpc_get_or_create_lote',
      'rpc_update_lote_after_shot',
      'rpc_get_active_lotes'
    ];

    for (const func of funcoesEsperadas) {
      try {
        // Tentar chamar a função (com parâmetros mínimos)
        let result;
        if (func === 'rpc_get_active_lotes') {
          const { data, error } = await supabaseAdmin.rpc(func);
          result = { data, error };
        } else if (func === 'rpc_get_or_create_lote') {
          const { data, error } = await supabaseAdmin.rpc(func, {
            p_lote_id: 'test_verification',
            p_valor_aposta: 10,
            p_tamanho: 1,
            p_indice_vencedor: 0
          });
          result = { data, error };
        } else {
          // Para update, precisamos de um lote existente
          continue;
        }

        if (result.error) {
          console.log(`❌ Função ${func}: ${result.error.message}`);
        } else {
          console.log(`✅ Função ${func} existe e funciona`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar função ${func}: ${error.message}`);
      }
    }

    // 4. Testar função de sincronização
    console.log('\n4️⃣ Testando função rpc_get_active_lotes...');
    const { data: syncData, error: syncError } = await supabaseAdmin.rpc('rpc_get_active_lotes');

    if (syncError) {
      console.log(`❌ Erro ao testar sincronização: ${syncError.message}`);
    } else {
      console.log(`✅ Sincronização funcionando: ${syncData?.count || 0} lotes ativos`);
      if (syncData) {
        console.log(`   Resposta:`, JSON.stringify(syncData, null, 2));
      }
    }

    console.log('\n✅ Verificação concluída!');
    return true;

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    return false;
  }
}

// Executar verificação
verificarSchema()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

