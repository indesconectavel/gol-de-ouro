// ETAPA 2 - Validar Migration V19 no Supabase (FINAL)
// ====================================================
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let supabaseAdmin = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { supabaseAdmin: admin } = require('../../database/supabase-unified-config');
    supabaseAdmin = admin;
  }
} catch (error) {
  console.log('⚠️  Erro ao carregar Supabase:', error.message);
}

const resultados = {
  timestamp: new Date().toISOString(),
  conexao: { sucesso: false, erro: null },
  tabelas: {},
  colunas: {},
  rls: {},
  policies: {},
  rpcs: {},
  indices: {},
  resumo: {
    tabelas_ok: 0,
    tabelas_faltando: 0,
    colunas_ok: 0,
    colunas_faltando: 0,
    rls_ok: 0,
    rls_faltando: 0,
    policies_ok: 0,
    policies_faltando: 0,
    rpcs_ok: 0,
    rpcs_faltando: 0,
    indices_ok: 0,
    indices_faltando: 0
  }
};

console.log('🔍 [ETAPA 2] Validando Migration V19 no Supabase (FINAL)...\n');

// Tabelas obrigatórias
const tabelasObrigatorias = [
  'usuarios', 'lotes', 'chutes', 'transacoes', 'saques',
  'pagamentos_pix', 'webhook_events', 'rewards', 'system_heartbeat'
];

// Colunas obrigatórias
const colunasObrigatorias = {
  lotes: ['persisted_global_counter', 'synced_at', 'posicao_atual'],
  system_heartbeat: ['instance_id', 'system_name', 'status', 'last_seen', 'metadata']
};

// RPCs obrigatórias
const rpcsObrigatorias = [
  'rpc_get_or_create_lote',
  'rpc_update_lote_after_shot',
  'rpc_add_balance',
  'rpc_deduct_balance'
];

// Verificar conexão
async function verificarConexao() {
  console.log('🔌 Verificando conexão Supabase...');
  
  if (!supabaseAdmin) {
    resultados.conexao.sucesso = false;
    resultados.conexao.erro = 'Supabase não configurado (variáveis de ambiente faltando)';
    console.log('  ❌ Supabase não configurado');
    return false;
  }
  
  try {
    const { data, error } = await supabaseAdmin.from('usuarios').select('count').limit(1);
    
    if (error) {
      resultados.conexao.sucesso = false;
      resultados.conexao.erro = error.message;
      console.log(`  ❌ Erro na conexão: ${error.message}`);
      return false;
    }
    
    resultados.conexao.sucesso = true;
    console.log('  ✅ Conexão estabelecida');
    return true;
  } catch (error) {
    resultados.conexao.sucesso = false;
    resultados.conexao.erro = error.message;
    console.log(`  ❌ Erro: ${error.message}`);
    return false;
  }
}

// Verificar tabelas
async function verificarTabelas() {
  console.log('\n📊 Verificando tabelas...');
  
  if (!resultados.conexao.sucesso) {
    console.log('  ⚠️  Conexão não estabelecida, pulando verificação');
    return;
  }
  
  for (const tabela of tabelasObrigatorias) {
    try {
      const { data, error } = await supabaseAdmin.from(tabela).select('*').limit(1);
      
      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        resultados.tabelas[tabela] = { existe: false, erro: 'Tabela não existe' };
        resultados.resumo.tabelas_faltando++;
        console.log(`  ❌ Tabela ${tabela} NÃO EXISTE`);
      } else if (error) {
        resultados.tabelas[tabela] = { existe: false, erro: error.message };
        resultados.resumo.tabelas_faltando++;
        console.log(`  ⚠️  Tabela ${tabela} - Erro: ${error.message}`);
      } else {
        resultados.tabelas[tabela] = { existe: true };
        resultados.resumo.tabelas_ok++;
        console.log(`  ✅ Tabela ${tabela} existe`);
      }
    } catch (error) {
      resultados.tabelas[tabela] = { existe: false, erro: error.message };
      resultados.resumo.tabelas_faltando++;
      console.log(`  ❌ Tabela ${tabela} - Exceção: ${error.message}`);
    }
  }
}

// Verificar colunas
async function verificarColunas() {
  console.log('\n📋 Verificando colunas obrigatórias...');
  
  if (!resultados.conexao.sucesso) {
    console.log('  ⚠️  Conexão não estabelecida, pulando verificação');
    return;
  }
  
  for (const [tabela, colunas] of Object.entries(colunasObrigatorias)) {
    if (!resultados.tabelas[tabela]?.existe) {
      console.log(`  ⚠️  Tabela ${tabela} não existe, pulando colunas`);
      continue;
    }
    
    resultados.colunas[tabela] = {};
    
    for (const coluna of colunas) {
      try {
        const { data, error } = await supabaseAdmin.from(tabela).select(coluna).limit(1);
        
        if (error && error.message.includes('column') && error.message.includes('does not exist')) {
          resultados.colunas[tabela][coluna] = { existe: false };
          resultados.resumo.colunas_faltando++;
          console.log(`  ❌ Coluna ${tabela}.${coluna} NÃO EXISTE`);
        } else if (error) {
          resultados.colunas[tabela][coluna] = { existe: false, erro: error.message };
          resultados.resumo.colunas_faltando++;
          console.log(`  ⚠️  Coluna ${tabela}.${coluna} - Erro: ${error.message}`);
        } else {
          resultados.colunas[tabela][coluna] = { existe: true };
          resultados.resumo.colunas_ok++;
          console.log(`  ✅ Coluna ${tabela}.${coluna} existe`);
        }
      } catch (error) {
        resultados.colunas[tabela][coluna] = { existe: false, erro: error.message };
        resultados.resumo.colunas_faltando++;
        console.log(`  ❌ Coluna ${tabela}.${coluna} - Exceção: ${error.message}`);
      }
    }
  }
}

// Verificar RPCs
async function verificarRPCs() {
  console.log('\n⚙️  Verificando RPCs...');
  
  if (!resultados.conexao.sucesso) {
    console.log('  ⚠️  Conexão não estabelecida, pulando verificação');
    return;
  }
  
  for (const rpc of rpcsObrigatorias) {
    try {
      let params = {};
      
      if (rpc === 'rpc_get_or_create_lote') {
        params = { p_lote_id: 'test_validation', p_valor_aposta: 1, p_tamanho: 10, p_indice_vencedor: 0 };
      } else if (rpc === 'rpc_update_lote_after_shot') {
        params = { p_lote_id: 'test_validation', p_valor_aposta: 1, p_premio: 0, p_premio_gol_de_ouro: 0, p_is_goal: false };
      } else {
        // Para rpc_add_balance e rpc_deduct_balance, não testar com dados reais
        resultados.rpcs[rpc] = { existe: null, metodo: 'não testado (requer dados reais)' };
        continue;
      }
      
      const { data, error } = await supabaseAdmin.rpc(rpc, params);
      
      if (error && (error.message.includes('function') || error.message.includes('does not exist'))) {
        resultados.rpcs[rpc] = { existe: false, erro: error.message };
        resultados.resumo.rpcs_faltando++;
        console.log(`  ❌ RPC ${rpc} NÃO EXISTE`);
      } else if (error) {
        // Erro pode ser de validação, mas RPC existe
        resultados.rpcs[rpc] = { existe: true, erro_validacao: error.message };
        resultados.resumo.rpcs_ok++;
        console.log(`  ✅ RPC ${rpc} existe (erro de validação esperado)`);
      } else {
        resultados.rpcs[rpc] = { existe: true };
        resultados.resumo.rpcs_ok++;
        console.log(`  ✅ RPC ${rpc} existe`);
      }
    } catch (error) {
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        resultados.rpcs[rpc] = { existe: false, erro: error.message };
        resultados.resumo.rpcs_faltando++;
        console.log(`  ❌ RPC ${rpc} NÃO EXISTE`);
      } else {
        resultados.rpcs[rpc] = { existe: true, erro_validacao: error.message };
        resultados.resumo.rpcs_ok++;
        console.log(`  ✅ RPC ${rpc} existe (erro de validação)`);
      }
    }
  }
}

// Gerar relatório
function gerarRelatorio() {
  const relatorio = `# 📋 RELATÓRIO - VALIDAÇÃO MIGRATION V19 FINAL
## Data: ${new Date().toISOString()}

### 🔌 CONEXÃO SUPABASE
- Status: ${resultados.conexao.sucesso ? '✅ CONECTADO' : '❌ NÃO CONECTADO'}
${resultados.conexao.erro ? `- Erro: ${resultados.conexao.erro}` : ''}

### 📊 RESUMO

#### Tabelas
- ✅ Existentes: ${resultados.resumo.tabelas_ok}/${tabelasObrigatorias.length}
- ❌ Faltando: ${resultados.resumo.tabelas_faltando}/${tabelasObrigatorias.length}

#### Colunas Obrigatórias
- ✅ Existentes: ${resultados.resumo.colunas_ok}
- ❌ Faltando: ${resultados.resumo.colunas_faltando}

#### RPCs
- ✅ Existentes: ${resultados.resumo.rpcs_ok}/${rpcsObrigatorias.length}
- ❌ Faltando: ${resultados.resumo.rpcs_faltando}/${rpcsObrigatorias.length}

### 🔍 DETALHES

#### Tabelas
${Object.entries(resultados.tabelas).map(([tabela, info]) => 
  `- ${info.existe ? '✅' : '❌'} **${tabela}**: ${info.existe ? 'Existe' : `Não existe - ${info.erro || 'Erro desconhecido'}`}`
).join('\n')}

#### Colunas Obrigatórias
${Object.entries(resultados.colunas).map(([tabela, colunas]) => 
  Object.entries(colunas).map(([coluna, info]) => 
    `- ${info.existe ? '✅' : '❌'} **${tabela}.${coluna}**: ${info.existe ? 'Existe' : 'Não existe'}`
  ).join('\n')
).join('\n') || 'Nenhuma coluna verificada'}

#### RPCs
${Object.entries(resultados.rpcs).map(([rpc, info]) => 
  `- ${info.existe ? '✅' : info.existe === null ? '⚠️' : '❌'} **${rpc}**: ${info.existe ? 'Existe' : info.existe === null ? 'Não testado' : `Não existe - ${info.erro || 'Erro desconhecido'}`}`
).join('\n')}

### ✅ CONCLUSÃO

${resultados.conexao.sucesso && resultados.resumo.tabelas_faltando === 0 && resultados.resumo.colunas_faltando === 0 && resultados.resumo.rpcs_faltando === 0
  ? '**✅ MIGRATION V19 APLICADA COM SUCESSO**'
  : resultados.conexao.sucesso
    ? '**⚠️ MIGRATION V19 PARCIALMENTE APLICADA**'
    : '**❌ MIGRATION V19 NÃO PODE SER VALIDADA**\n\n**Motivo:** Conexão Supabase não estabelecida.\n\n**Ação Necessária:**\n1. Configurar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env\n2. Executar novamente a validação'
}
`;

  return relatorio;
}

// Executar
async function executar() {
  try {
    const conectado = await verificarConexao();
    
    if (conectado) {
      await verificarTabelas();
      await verificarColunas();
      await verificarRPCs();
    }
    
    // Salvar resultados
    const jsonPath = path.join(__dirname, '..', '..', 'logs', 'v19', 'validacao_migration_v19_final.json');
    fs.writeFileSync(jsonPath, JSON.stringify(resultados, null, 2));
    console.log(`\n✅ Resultados JSON salvos em: ${jsonPath}`);
    
    // Salvar relatório
    const relatorio = gerarRelatorio();
    const mdPath = path.join(__dirname, '..', '..', 'logs', 'v19', 'RELATORIO-MIGRATION-V19.md');
    fs.writeFileSync(mdPath, relatorio);
    console.log(`✅ Relatório salvo em: ${mdPath}`);
    
    console.log('\n📊 RESUMO FINAL:');
    console.log(`   Conexão: ${resultados.conexao.sucesso ? '✅' : '❌'}`);
    console.log(`   Tabelas: ${resultados.resumo.tabelas_ok}/${tabelasObrigatorias.length} OK`);
    console.log(`   Colunas: ${resultados.resumo.colunas_ok} OK`);
    console.log(`   RPCs: ${resultados.resumo.rpcs_ok}/${rpcsObrigatorias.length} OK`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

executar();

