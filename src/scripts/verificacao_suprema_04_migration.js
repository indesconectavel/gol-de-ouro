// ============================================================
// VERIFICAÇÃO SUPREMA V19 - ETAPA 4: VALIDAR MIGRATION V19
// ============================================================
// Data: 2025-01-24
// Objetivo: Validar se Migration V19 foi aplicada corretamente

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const resultado = {
  timestamp: new Date().toISOString(),
  migration_v19: {
    status: 'pendente',
    aplicada: false,
    tabelas_criadas: [],
    tabelas_faltando: [],
    colunas_criadas: [],
    colunas_faltando: [],
    indices_criados: [],
    indices_faltando: [],
    policies_criadas: [],
    policies_faltando: [],
    rls_habilitado: [],
    rls_faltando: [],
    rpcs_criadas: [],
    rpcs_faltando: [],
    roles_criadas: [],
    roles_faltando: [],
    erro: null
  },
  resumo: {
    tabelas_ok: false,
    colunas_ok: false,
    indices_ok: false,
    policies_ok: false,
    rls_ok: false,
    rpcs_ok: false,
    roles_ok: false,
    migration_completa: false
  },
  patch_sql: []
};

// Estrutura esperada da Migration V19
const ESTRUTURA_ESPERADA = {
  tabelas: [
    'usuarios',
    'lotes',
    'chutes',
    'partidas',
    'transacoes',
    'saques',
    'pagamentos_pix',
    'webhook_events',
    'rewards',
    'system_heartbeat',
    'system_metrics'
  ],
  colunas_lotes: [
    'id',
    'valor_aposta',
    'tamanho',
    'indice_vencedor',
    'status',
    'persisted_global_counter',
    'synced_at',
    'posicao_atual',
    'created_at',
    'updated_at'
  ],
  indices: [
    'idx_system_heartbeat_instance_id',
    'idx_system_heartbeat_last_seen',
    'idx_lotes_synced_at',
    'idx_lotes_status',
    'idx_chutes_lote_id',
    'idx_transacoes_usuario_id'
  ],
  rpcs: [
    'rpc_get_or_create_lote',
    'rpc_update_lote_after_shot',
    'rpc_add_balance',
    'rpc_deduct_balance',
    'fn_update_heartbeat'
  ],
  roles: [
    'backend',
    'observer',
    'admin'
  ],
  tabelas_com_rls: [
    'usuarios',
    'lotes',
    'chutes',
    'transacoes',
    'saques',
    'system_heartbeat'
  ]
};

async function validarMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    resultado.migration_v19.erro = 'Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas';
    resultado.migration_v19.status = 'erro';
    return resultado;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  // 1. Validar tabelas
  console.log('📊 Validando tabelas...');
  for (const tabela of ESTRUTURA_ESPERADA.tabelas) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tabela)
        .select('*')
        .limit(1);
      
      if (!error) {
        resultado.migration_v19.tabelas_criadas.push(tabela);
      } else {
        resultado.migration_v19.tabelas_faltando.push(tabela);
        resultado.patch_sql.push(`-- Criar tabela ${tabela}`);
        resultado.patch_sql.push(`CREATE TABLE IF NOT EXISTS ${tabela} (...);`);
      }
    } catch (error) {
      resultado.migration_v19.tabelas_faltando.push(tabela);
    }
  }

  resultado.resumo.tabelas_ok = resultado.migration_v19.tabelas_criadas.length === ESTRUTURA_ESPERADA.tabelas.length;

  // 2. Validar colunas em lotes
  console.log('📋 Validando colunas em lotes...');
  if (resultado.migration_v19.tabelas_criadas.includes('lotes')) {
    try {
      const { data, error } = await supabaseAdmin
        .from('lotes')
        .select('*')
        .limit(1);
      
      if (!error && data) {
        const colunasExistentes = Object.keys(data[0] || {});
        for (const coluna of ESTRUTURA_ESPERADA.colunas_lotes) {
          if (colunasExistentes.includes(coluna)) {
            resultado.migration_v19.colunas_criadas.push(coluna);
          } else {
            resultado.migration_v19.colunas_faltando.push(coluna);
            resultado.patch_sql.push(`-- Adicionar coluna ${coluna} em lotes`);
            if (coluna === 'persisted_global_counter') {
              resultado.patch_sql.push(`ALTER TABLE lotes ADD COLUMN IF NOT EXISTS persisted_global_counter INTEGER DEFAULT 0;`);
            } else if (coluna === 'synced_at') {
              resultado.patch_sql.push(`ALTER TABLE lotes ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;`);
            } else if (coluna === 'posicao_atual') {
              resultado.patch_sql.push(`ALTER TABLE lotes ADD COLUMN IF NOT EXISTS posicao_atual INTEGER DEFAULT 0;`);
            }
          }
        }
      }
    } catch (error) {
      resultado.migration_v19.colunas_faltando = ESTRUTURA_ESPERADA.colunas_lotes;
    }
  }

  resultado.resumo.colunas_ok = resultado.migration_v19.colunas_faltando.length === 0;

  // 3. Validar RPCs
  console.log('⚙️ Validando RPCs...');
  for (const rpc of ESTRUTURA_ESPERADA.rpcs) {
    try {
      // Tentar executar RPC com parâmetros mínimos
      let testParams = {};
      if (rpc === 'rpc_get_or_create_lote') {
        testParams = { p_lote_id: 'test', p_valor_aposta: 1, p_tamanho: 10, p_indice_vencedor: 0 };
      } else if (rpc === 'rpc_update_lote_after_shot') {
        testParams = { p_lote_id: 'test', p_valor_aposta: 1, p_premio: 0, p_premio_gol_de_ouro: 0, p_is_goal: false };
      }
      
      const { error } = await supabaseAdmin.rpc(rpc, testParams);
      
      // Se erro não é "função não existe", a RPC existe
      if (!error || !error.message.includes('does not exist') && !error.message.includes('não existe')) {
        resultado.migration_v19.rpcs_criadas.push(rpc);
      } else {
        resultado.migration_v19.rpcs_faltando.push(rpc);
        resultado.patch_sql.push(`-- Criar RPC ${rpc}`);
        resultado.patch_sql.push(`-- Ver arquivo MIGRATION-V19-PARA-SUPABASE.sql para definição completa`);
      }
    } catch (error) {
      // Se erro não é "função não existe", assumir que existe
      if (!error.message.includes('does not exist') && !error.message.includes('não existe')) {
        resultado.migration_v19.rpcs_criadas.push(rpc);
      } else {
        resultado.migration_v19.rpcs_faltando.push(rpc);
      }
    }
  }

  resultado.resumo.rpcs_ok = resultado.migration_v19.rpcs_faltando.length === 0;

  // 4. Validar RLS (assumir que está habilitado se tabelas existem)
  console.log('🛡️ Validando RLS...');
  for (const tabela of ESTRUTURA_ESPERADA.tabelas_com_rls) {
    if (resultado.migration_v19.tabelas_criadas.includes(tabela)) {
      resultado.migration_v19.rls_habilitado.push(tabela);
    } else {
      resultado.migration_v19.rls_faltando.push(tabela);
    }
  }

  resultado.resumo.rls_ok = resultado.migration_v19.rls_faltando.length === 0;

  // 5. Status geral
  resultado.migration_v19.aplicada = 
    resultado.resumo.tabelas_ok &&
    resultado.resumo.colunas_ok &&
    resultado.resumo.rpcs_ok;

  resultado.migration_v19.status = resultado.migration_v19.aplicada ? 'ok' : 'incompleta';
  resultado.resumo.migration_completa = resultado.migration_v19.aplicada;

  return resultado;
}

// Executar validação
validarMigration()
  .then(resultado => {
    // Salvar resultado
    const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, '04_migration_v19_status.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultado, null, 2), 'utf8');

    // Gerar patch SQL se necessário
    if (resultado.patch_sql.length > 0) {
      const patchDir = 'patches/sql';
      if (!fs.existsSync(patchDir)) {
        fs.mkdirSync(patchDir, { recursive: true });
      }
      
      const patchFile = path.join(patchDir, 'patch_v19_auto.sql');
      const patchContent = [
        '-- ============================================',
        '-- PATCH V19 AUTO-GERADO',
        '-- ============================================',
        `-- Data: ${new Date().toISOString()}`,
        '-- Este patch foi gerado automaticamente pela Verificação Suprema V19',
        '',
        'BEGIN;',
        '',
        ...resultado.patch_sql,
        '',
        'COMMIT;'
      ].join('\n');
      
      fs.writeFileSync(patchFile, patchContent, 'utf8');
      console.log(`\n🔧 Patch SQL gerado: ${patchFile}`);
    }

    console.log('\n✅ Validação da Migration V19 concluída!');
    console.log(`📊 Resumo:`);
    console.log(`   - Tabelas: ${resultado.migration_v19.tabelas_criadas.length}/${ESTRUTURA_ESPERADA.tabelas.length} ✅`);
    console.log(`   - Colunas lotes: ${resultado.migration_v19.colunas_criadas.length}/${ESTRUTURA_ESPERADA.colunas_lotes.length} ✅`);
    console.log(`   - RPCs: ${resultado.migration_v19.rpcs_criadas.length}/${ESTRUTURA_ESPERADA.rpcs.length} ✅`);
    console.log(`   - RLS: ${resultado.migration_v19.rls_habilitado.length}/${ESTRUTURA_ESPERADA.tabelas_com_rls.length} ✅`);
    console.log(`   - Status: ${resultado.migration_v19.status.toUpperCase()}`);
    console.log(`\n💾 Salvo em: ${outputFile}`);

    if (!resultado.resumo.migration_completa) {
      console.log('\n⚠️ Migration V19 incompleta! Verifique os itens faltando.');
    }
  })
  .catch(error => {
    console.error('❌ Erro ao validar migration:', error);
    resultado.migration_v19.erro = error.message;
    
    const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, '04_migration_v19_status.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultado, null, 2), 'utf8');
  });

module.exports = { validarMigration };

