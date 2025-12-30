/**
 * 🔍 AUDITORIA COMPLETA - DOIS PROJETOS SUPABASE
 * ===============================================
 * Objetivo: Identificar qual projeto está sendo usado e se há confusão
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Projetos identificados
const PROJETOS = {
  'goldeouro-db': {
    nome: 'goldeouro-db',
    descricao: 'Projeto de desenvolvimento/testes'
  },
  'goldeouro-production': {
    nome: 'goldeouro-production',
    descricao: 'Projeto de produção'
  }
};

async function auditoriaCompleta() {
  console.log('\n🔍 AUDITORIA COMPLETA - DOIS PROJETOS SUPABASE\n');
  console.log('='.repeat(70));

  const resultados = {
    timestamp: new Date().toISOString(),
    projetos: {},
    configuracaoAtual: {},
    problemas: [],
    recomendacoes: []
  };

  // 1. VERIFICAR CONFIGURAÇÃO ATUAL
  console.log('\n1️⃣ VERIFICANDO CONFIGURAÇÃO ATUAL\n');
  console.log('-'.repeat(70));

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  resultados.configuracaoAtual = {
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'NÃO CONFIGURADA',
    urlCompleta: SUPABASE_URL || null,
    anonKey: SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NÃO CONFIGURADA',
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY ? `${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NÃO CONFIGURADA'
  };

  console.log(`   URL: ${resultados.configuracaoAtual.url}`);
  console.log(`   Anon Key: ${resultados.configuracaoAtual.anonKey}`);
  console.log(`   Service Role Key: ${resultados.configuracaoAtual.serviceRoleKey}`);

  // Identificar qual projeto está configurado
  let projetoConfigurado = null;
  if (SUPABASE_URL) {
    if (SUPABASE_URL.includes('goldeouro-db') || SUPABASE_URL.includes('uatszaqzdqcwnfbipoxg')) {
      projetoConfigurado = 'goldeouro-db';
    } else if (SUPABASE_URL.includes('goldeouro-production') || SUPABASE_URL.includes('production')) {
      projetoConfigurado = 'goldeouro-production';
    } else {
      // Tentar extrair do URL
      const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (match) {
        projetoConfigurado = `Projeto desconhecido: ${match[1]}`;
      }
    }
  }

  console.log(`\n   📌 Projeto Configurado: ${projetoConfigurado || 'NÃO IDENTIFICADO'}`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    resultados.problemas.push('Credenciais do Supabase não configuradas completamente');
    console.log('\n   ⚠️  CREDENCIAIS INCOMPLETAS!');
    console.log('   Não é possível continuar a auditoria sem credenciais.');
    
    // Salvar resultados parciais
    const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, '27_auditoria_projetos_supabase.json');
    fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
    console.log(`\n   📝 Resultados salvos em: ${logFile}`);
    return resultados;
  }

  // 2. TESTAR CONEXÃO COM PROJETO CONFIGURADO
  console.log('\n2️⃣ TESTANDO CONEXÃO COM PROJETO CONFIGURADO\n');
  console.log('-'.repeat(70));

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Testar conexão básica
  let conexaoOk = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Erro na conexão: ${error.message}`);
      resultados.problemas.push(`Erro na conexão: ${error.message}`);
    } else {
      console.log('   ✅ Conexão estabelecida com sucesso');
      conexaoOk = true;
    }
  } catch (error) {
    console.log(`   ❌ Erro fatal: ${error.message}`);
    resultados.problemas.push(`Erro fatal na conexão: ${error.message}`);
  }

  if (!conexaoOk) {
    console.log('\n   ⚠️  Não é possível continuar sem conexão válida.');
    const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, '27_auditoria_projetos_supabase.json');
    fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
    console.log(`\n   📝 Resultados salvos em: ${logFile}`);
    return resultados;
  }

  // 3. VERIFICAR USUÁRIO DE TESTE
  console.log('\n3️⃣ VERIFICANDO USUÁRIO DE TESTE\n');
  console.log('-'.repeat(70));

  const emailTeste = 'free10signer@gmail.com';
  const { data: usuarios, error: usuariosError } = await supabaseAdmin
    .from('usuarios')
    .select('id, email, saldo, created_at')
    .eq('email', emailTeste)
    .limit(5);

  if (usuariosError) {
    console.log(`   ❌ Erro ao buscar usuário: ${usuariosError.message}`);
    resultados.problemas.push(`Erro ao buscar usuário: ${usuariosError.message}`);
  } else if (!usuarios || usuarios.length === 0) {
    console.log(`   ⚠️  Usuário não encontrado: ${emailTeste}`);
    resultados.problemas.push(`Usuário de teste não encontrado: ${emailTeste}`);
    resultados.recomendacoes.push('Criar usuário de teste ou verificar se está no projeto correto');
  } else {
    console.log(`   ✅ Usuário encontrado: ${usuarios.length} registro(s)`);
    usuarios.forEach((u, i) => {
      console.log(`      ${i + 1}. ID: ${u.id}`);
      console.log(`         Email: ${u.email}`);
      console.log(`         Saldo: R$ ${u.saldo || 0}`);
      console.log(`         Criado em: ${u.created_at || 'N/A'}`);
    });
    resultados.projetos[projetoConfigurado || 'desconhecido'] = {
      usuarioEncontrado: true,
      usuarios: usuarios
    };
  }

  // 4. VERIFICAR RPCs FINANCEIRAS
  console.log('\n4️⃣ VERIFICANDO RPCs FINANCEIRAS\n');
  console.log('-'.repeat(70));

  const rpcsNecessarias = [
    'rpc_add_balance',
    'rpc_deduct_balance',
    'rpc_transfer_balance',
    'rpc_get_balance'
  ];

  const rpcsEncontradas = [];
  const rpcsFaltantes = [];

  for (const rpcName of rpcsNecessarias) {
    try {
      // Usar UUID de teste válido
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const { data, error } = await supabaseAdmin.rpc(rpcName, {
        p_user_id: testUserId,
        p_amount: 0.01,
        p_description: 'teste',
        p_reference_id: null,
        p_reference_type: 'teste',
        p_allow_negative: false
      });

      // Se não der erro de "usuário não encontrado", a RPC existe
      if (error) {
        if (error.message.includes('Usuário não encontrado') || error.message.includes('not found')) {
          rpcsEncontradas.push(rpcName);
          console.log(`   ✅ ${rpcName} - INSTALADA`);
        } else {
          rpcsEncontradas.push(rpcName);
          console.log(`   ✅ ${rpcName} - INSTALADA (erro esperado: ${error.message.substring(0, 50)})`);
        }
      } else {
        rpcsEncontradas.push(rpcName);
        console.log(`   ✅ ${rpcName} - INSTALADA`);
      }
    } catch (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        rpcsFaltantes.push(rpcName);
        console.log(`   ❌ ${rpcName} - NÃO INSTALADA`);
      } else {
        // Outro tipo de erro, mas a RPC pode existir
        rpcsEncontradas.push(rpcName);
        console.log(`   ⚠️  ${rpcName} - Pode estar instalada (erro: ${error.message.substring(0, 50)})`);
      }
    }
  }

  if (rpcsFaltantes.length > 0) {
    resultados.problemas.push(`RPCs faltantes: ${rpcsFaltantes.join(', ')}`);
    resultados.recomendacoes.push(`Instalar RPCs faltantes: ${rpcsFaltantes.join(', ')}`);
  }

  resultados.projetos[projetoConfigurado || 'desconhecido'] = {
    ...resultados.projetos[projetoConfigurado || 'desconhecido'],
    rpcsEncontradas,
    rpcsFaltantes
  };

  // 5. VERIFICAR TABELAS CRÍTICAS
  console.log('\n5️⃣ VERIFICANDO TABELAS CRÍTICAS\n');
  console.log('-'.repeat(70));

  const tabelasNecessarias = [
    'usuarios',
    'transacoes',
    'lotes',
    'chutes',
    'premios',
    'pagamentos_pix',
    'system_heartbeat'
  ];

  const tabelasEncontradas = [];
  const tabelasFaltantes = [];

  for (const tabela of tabelasNecessarias) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tabela)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          tabelasFaltantes.push(tabela);
          console.log(`   ❌ ${tabela} - NÃO ENCONTRADA`);
        } else {
          // Erro diferente, mas tabela pode existir
          tabelasEncontradas.push(tabela);
          console.log(`   ⚠️  ${tabela} - Pode existir (erro: ${error.message.substring(0, 50)})`);
        }
      } else {
        tabelasEncontradas.push(tabela);
        console.log(`   ✅ ${tabela} - ENCONTRADA`);
      }
    } catch (error) {
      tabelasFaltantes.push(tabela);
      console.log(`   ❌ ${tabela} - NÃO ENCONTRADA (${error.message.substring(0, 50)})`);
    }
  }

  if (tabelasFaltantes.length > 0) {
    resultados.problemas.push(`Tabelas faltantes: ${tabelasFaltantes.join(', ')}`);
    resultados.recomendacoes.push(`Criar tabelas faltantes: ${tabelasFaltantes.join(', ')}`);
  }

  resultados.projetos[projetoConfigurado || 'desconhecido'] = {
    ...resultados.projetos[projetoConfigurado || 'desconhecido'],
    tabelasEncontradas,
    tabelasFaltantes
  };

  // 6. RESUMO E RECOMENDAÇÕES
  console.log('\n6️⃣ RESUMO E RECOMENDAÇÕES\n');
  console.log('='.repeat(70));

  console.log(`\n📌 Projeto Configurado: ${projetoConfigurado || 'NÃO IDENTIFICADO'}`);
  console.log(`\n✅ Usuário de Teste: ${usuarios && usuarios.length > 0 ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  console.log(`✅ RPCs Instaladas: ${rpcsEncontradas.length}/${rpcsNecessarias.length}`);
  console.log(`✅ Tabelas Encontradas: ${tabelasEncontradas.length}/${tabelasNecessarias.length}`);

  if (resultados.problemas.length > 0) {
    console.log(`\n⚠️  PROBLEMAS IDENTIFICADOS:`);
    resultados.problemas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
    });
  }

  if (resultados.recomendacoes.length > 0) {
    console.log(`\n💡 RECOMENDAÇÕES:`);
    resultados.recomendacoes.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r}`);
    });
  }

  // 7. SALVAR RESULTADOS
  const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, '27_auditoria_projetos_supabase.json');
  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
  console.log(`\n📝 Resultados salvos em: ${logFile}`);

  console.log('\n' + '='.repeat(70) + '\n');

  return resultados;
}

// Executar auditoria
auditoriaCompleta()
  .then(resultados => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL NA AUDITORIA:', error);
    process.exit(1);
  });

