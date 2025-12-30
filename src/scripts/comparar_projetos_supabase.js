/**
 * 🔍 COMPARAR DOIS PROJETOS SUPABASE
 * ===================================
 * Objetivo: Comparar goldeouro-db e goldeouro-production
 * 
 * USO:
 * 1. Definir credenciais do projeto 1:
 *    export SUPABASE_URL_1="https://projeto1.supabase.co"
 *    export SUPABASE_SERVICE_KEY_1="key1"
 * 
 * 2. Definir credenciais do projeto 2:
 *    export SUPABASE_URL_2="https://projeto2.supabase.co"
 *    export SUPABASE_SERVICE_KEY_2="key2"
 * 
 * 3. Executar: node src/scripts/comparar_projetos_supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function compararProjetos() {
  console.log('\n🔍 COMPARAÇÃO DE PROJETOS SUPABASE\n');
  console.log('='.repeat(70));

  const resultados = {
    timestamp: new Date().toISOString(),
    projeto1: null,
    projeto2: null,
    comparacao: {}
  };

  // Verificar se credenciais estão definidas
  const url1 = process.env.SUPABASE_URL_1;
  const key1 = process.env.SUPABASE_SERVICE_KEY_1;
  const url2 = process.env.SUPABASE_URL_2;
  const key2 = process.env.SUPABASE_SERVICE_KEY_2;

  if (!url1 || !key1) {
    console.log('\n⚠️  Credenciais do Projeto 1 não definidas!');
    console.log('   Defina: SUPABASE_URL_1 e SUPABASE_SERVICE_KEY_1');
    return;
  }

  if (!url2 || !key2) {
    console.log('\n⚠️  Credenciais do Projeto 2 não definidas!');
    console.log('   Defina: SUPABASE_URL_2 e SUPABASE_SERVICE_KEY_2');
    return;
  }

  // Criar clientes
  const supabase1 = createClient(url1, key1, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const supabase2 = createClient(url2, key2, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Função para verificar projeto
  async function verificarProjeto(supabase, nome) {
    console.log(`\n📊 Verificando ${nome}...`);
    console.log('-'.repeat(70));

    const resultado = {
      nome,
      conexao: false,
      usuario: null,
      rpcs: [],
      tabelas: [],
      problemas: []
    };

    // Testar conexão
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .limit(1);
      
      if (error) {
        resultado.problemas.push(`Erro na conexão: ${error.message}`);
        return resultado;
      }
      
      resultado.conexao = true;
      console.log('   ✅ Conexão OK');
    } catch (error) {
      resultado.problemas.push(`Erro fatal: ${error.message}`);
      return resultado;
    }

    // Verificar usuário de teste
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, saldo')
        .eq('email', 'free10signer@gmail.com')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        resultado.usuario = data[0];
        console.log(`   ✅ Usuário encontrado: ${data[0].id}`);
      } else {
        console.log('   ⚠️  Usuário não encontrado');
      }
    } catch (error) {
      resultado.problemas.push(`Erro ao buscar usuário: ${error.message}`);
    }

    // Verificar RPCs
    const rpcs = ['rpc_add_balance', 'rpc_deduct_balance', 'rpc_transfer_balance', 'rpc_get_balance'];
    for (const rpc of rpcs) {
      try {
        const { error } = await supabase.rpc(rpc, {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_amount: 0.01
        });
        
        if (error) {
          if (error.message.includes('does not exist')) {
            // RPC não existe
          } else {
            // RPC existe (erro esperado)
            resultado.rpcs.push(rpc);
            console.log(`   ✅ RPC ${rpc} encontrada`);
          }
        } else {
          resultado.rpcs.push(rpc);
          console.log(`   ✅ RPC ${rpc} encontrada`);
        }
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          resultado.rpcs.push(rpc);
        }
      }
    }

    // Verificar tabelas
    const tabelas = ['usuarios', 'transacoes', 'lotes', 'chutes', 'premios', 'pagamentos_pix', 'system_heartbeat'];
    for (const tabela of tabelas) {
      try {
        const { error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1);
        
        if (!error) {
          resultado.tabelas.push(tabela);
          console.log(`   ✅ Tabela ${tabela} encontrada`);
        }
      } catch (error) {
        // Tabela não existe
      }
    }

    return resultado;
  }

  // Verificar ambos os projetos
  resultados.projeto1 = await verificarProjeto(supabase1, 'Projeto 1');
  resultados.projeto2 = await verificarProjeto(supabase2, 'Projeto 2');

  // Comparar
  console.log('\n📊 COMPARAÇÃO\n');
  console.log('='.repeat(70));

  console.log(`\n✅ Usuário de Teste:`);
  console.log(`   Projeto 1: ${resultados.projeto1.usuario ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  console.log(`   Projeto 2: ${resultados.projeto2.usuario ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

  console.log(`\n✅ RPCs Instaladas:`);
  console.log(`   Projeto 1: ${resultados.projeto1.rpcs.length}/4`);
  console.log(`   Projeto 2: ${resultados.projeto2.rpcs.length}/4`);

  console.log(`\n✅ Tabelas Encontradas:`);
  console.log(`   Projeto 1: ${resultados.projeto1.tabelas.length}/7`);
  console.log(`   Projeto 2: ${resultados.projeto2.tabelas.length}/7`);

  // Salvar resultados
  const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, '28_comparacao_projetos_supabase.json');
  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
  console.log(`\n📝 Resultados salvos em: ${logFile}`);

  console.log('\n' + '='.repeat(70) + '\n');
}

compararProjetos()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  });

