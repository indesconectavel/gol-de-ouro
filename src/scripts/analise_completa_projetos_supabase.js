/**
 * 🔍 ANÁLISE COMPLETA - DOIS PROJETOS SUPABASE
 * ============================================
 * 
 * Objetivo: Analisar profundamente os dois projetos e identificar:
 * - Qual projeto está configurado no código
 * - Qual projeto tem os dados corretos
 * - Diferenças entre os projetos
 * - Parâmetros de cada projeto
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// IDs dos projetos identificados nos prints
const PROJETOS = {
  'goldeouro-db': {
    nome: 'goldeouro-db',
    id: 'uatszaqzdqcwnfbipoxg',
    url: 'https://uatszaqzdqcwnfbipoxg.supabase.co',
    descricao: 'Desenvolvimento local + Engine V19',
    tipo: 'desenvolvimento'
  },
  'goldeouro-production': {
    nome: 'goldeouro-production',
    id: 'gayopagjdrkcmkirmfvy',
    url: 'https://gayopagjdrkcmkirmfvy.supabase.co',
    descricao: 'Produção do jogo',
    tipo: 'producao'
  }
};

async function analiseCompleta() {
  console.log('\n🔍 ANÁLISE COMPLETA - DOIS PROJETOS SUPABASE\n');
  console.log('='.repeat(70));

  const resultados = {
    timestamp: new Date().toISOString(),
    projetoConfigurado: null,
    projetos: {},
    comparacao: {},
    problemas: [],
    recomendacoes: []
  };

  // 1. VERIFICAR CONFIGURAÇÃO ATUAL NO CÓDIGO
  console.log('\n1️⃣ VERIFICANDO CONFIGURAÇÃO ATUAL NO CÓDIGO\n');
  console.log('-'.repeat(70));

  const SUPABASE_URL = process.env.SUPABASE_URL;
  
  if (!SUPABASE_URL) {
    console.log('   ❌ SUPABASE_URL não configurada no .env');
    resultados.problemas.push('SUPABASE_URL não configurada');
  } else {
    console.log(`   URL Configurada: ${SUPABASE_URL.substring(0, 50)}...`);
    
    // Identificar qual projeto está configurado
    let projetoIdentificado = null;
    for (const [key, projeto] of Object.entries(PROJETOS)) {
      if (SUPABASE_URL.includes(projeto.id) || SUPABASE_URL.includes(key)) {
        projetoIdentificado = projeto;
        break;
      }
    }

    if (projetoIdentificado) {
      console.log(`   ✅ Projeto Identificado: ${projetoIdentificado.nome}`);
      console.log(`      Tipo: ${projetoIdentificado.tipo}`);
      console.log(`      Descrição: ${projetoIdentificado.descricao}`);
      resultados.projetoConfigurado = projetoIdentificado;
    } else {
      console.log(`   ⚠️  Projeto não identificado nos projetos conhecidos`);
      resultados.problemas.push(`Projeto configurado não corresponde a goldeouro-db ou goldeouro-production`);
    }
  }

  // 2. VERIFICAR ARQUIVOS DE CONFIGURAÇÃO
  console.log('\n2️⃣ VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO\n');
  console.log('-'.repeat(70));

  const arquivosConfig = [
    'database/supabase-unified-config.js',
    'database/supabase-config.js',
    'server-fly.js',
    'fly.toml'
  ];

  const referenciasEncontradas = {
    'goldeouro-db': [],
    'goldeouro-production': [],
    'gayopagjdrkcmkirmfvy': [],
    'uatszaqzdqcwnfbipoxg': []
  };

  for (const arquivo of arquivosConfig) {
    const caminhoArquivo = path.join(__dirname, '../../..', arquivo);
    if (fs.existsSync(caminhoArquivo)) {
      const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
      
      for (const [key, valores] of Object.entries(referenciasEncontradas)) {
        if (conteudo.includes(key)) {
          valores.push(arquivo);
        }
      }
    }
  }

  console.log('   Referências encontradas:');
  for (const [key, arquivos] of Object.entries(referenciasEncontradas)) {
    if (arquivos.length > 0) {
      console.log(`      ${key}: ${arquivos.join(', ')}`);
    }
  }

  resultados.referenciasArquivos = referenciasEncontradas;

  // 3. ANÁLISE BASEADA NOS PRINTS
  console.log('\n3️⃣ ANÁLISE BASEADA NOS PRINTS ENVIADOS\n');
  console.log('-'.repeat(70));

  // goldeouro-production (gayopagjdrkcmkirmfvy)
  console.log('\n   📊 goldeouro-production (gayopagjdrkcmkirmfvy):');
  console.log('      - 26 tabelas');
  console.log('      - 1 função');
  console.log('      - RPCs instaladas: rpc_add_balance, rpc_deduct_balance, rpc_get_balance, rpc_transfer_balance');
  console.log('      - 125 issues (5 security, 120 performance)');
  console.log('      - Security Advisor: RPCs sem search_path');
  console.log('      - Tipo: PRODUÇÃO');

  resultados.projetos['goldeouro-production'] = {
    id: 'gayopagjdrkcmkirmfvy',
    tabelas: 26,
    funcoes: 1,
    rpcs: ['rpc_add_balance', 'rpc_deduct_balance', 'rpc_get_balance', 'rpc_transfer_balance'],
    issues: { security: 5, performance: 120, total: 125 },
    problemas: ['RPCs sem search_path'],
    tipo: 'producao'
  };

  // goldeouro-db (uatszaqzdqcwnfbipoxg)
  console.log('\n   📊 goldeouro-db (uatszaqzdqcwnfbipoxg):');
  console.log('      - 20 tabelas');
  console.log('      - 0 funções');
  console.log('      - RPCs instaladas: rpc_add_balance, rpc_deduct_balance, rpc_get_balance, rpc_transfer_balance');
  console.log('      - 236 issues (5 security, 231 performance)');
  console.log('      - Security Advisor: RPCs sem search_path');
  console.log('      - Tipo: DESENVOLVIMENTO + Engine V19');

  resultados.projetos['goldeouro-db'] = {
    id: 'uatszaqzdqcwnfbipoxg',
    tabelas: 20,
    funcoes: 0,
    rpcs: ['rpc_add_balance', 'rpc_deduct_balance', 'rpc_get_balance', 'rpc_transfer_balance'],
    issues: { security: 5, performance: 231, total: 236 },
    problemas: ['RPCs sem search_path'],
    tipo: 'desenvolvimento'
  };

  // 4. COMPARAÇÃO
  console.log('\n4️⃣ COMPARAÇÃO ENTRE OS PROJETOS\n');
  console.log('='.repeat(70));

  const comparacao = {
    tabelas: {
      'goldeouro-production': 26,
      'goldeouro-db': 20,
      diferenca: 6
    },
    funcoes: {
      'goldeouro-production': 1,
      'goldeouro-db': 0,
      diferenca: 1
    },
    rpcs: {
      ambos: true,
      lista: ['rpc_add_balance', 'rpc_deduct_balance', 'rpc_get_balance', 'rpc_transfer_balance']
    },
    issues: {
      'goldeouro-production': 125,
      'goldeouro-db': 236,
      diferenca: 111
    },
    problemasComuns: ['RPCs sem search_path']
  };

  console.log(`\n   📊 Tabelas:`);
  console.log(`      goldeouro-production: ${comparacao.tabelas['goldeouro-production']}`);
  console.log(`      goldeouro-db: ${comparacao.tabelas['goldeouro-db']}`);
  console.log(`      Diferença: ${comparacao.tabelas.diferenca} tabelas a mais em produção`);

  console.log(`\n   📊 Funções:`);
  console.log(`      goldeouro-production: ${comparacao.funcoes['goldeouro-production']}`);
  console.log(`      goldeouro-db: ${comparacao.funcoes['goldeouro-db']}`);
  console.log(`      Diferença: ${comparacao.funcoes.diferenca} função a mais em produção`);

  console.log(`\n   📊 RPCs:`);
  console.log(`      Ambos têm as 4 RPCs financeiras instaladas ✅`);

  console.log(`\n   📊 Issues:`);
  console.log(`      goldeouro-production: ${comparacao.issues['goldeouro-production']}`);
  console.log(`      goldeouro-db: ${comparacao.issues['goldeouro-db']}`);
  console.log(`      goldeouro-db tem ${comparacao.issues.diferenca} issues a mais`);

  resultados.comparacao = comparacao;

  // 5. CONCLUSÕES E RECOMENDAÇÕES
  console.log('\n5️⃣ CONCLUSÕES E RECOMENDAÇÕES\n');
  console.log('='.repeat(70));

  console.log(`\n   📌 Projeto Configurado no Código:`);
  if (resultados.projetoConfigurado) {
    console.log(`      ${resultados.projetoConfigurado.nome} (${resultados.projetoConfigurado.tipo})`);
  } else {
    console.log(`      ⚠️  Não identificado ou não configurado`);
  }

  console.log(`\n   💡 Recomendações:`);
  
  if (resultados.projetoConfigurado?.nome === 'goldeouro-production') {
    console.log(`      ✅ Código está apontando para PRODUÇÃO (correto para deploy)`);
    resultados.recomendacoes.push('Código está configurado para produção - correto para deploy');
  } else if (resultados.projetoConfigurado?.nome === 'goldeouro-db') {
    console.log(`      ⚠️  Código está apontando para DESENVOLVIMENTO`);
    console.log(`      ⚠️  Para produção, deve apontar para goldeouro-production`);
    resultados.recomendacoes.push('Código está configurado para desenvolvimento - considerar mudar para produção');
  } else {
    console.log(`      ❌ Projeto não identificado - verificar configuração`);
    resultados.recomendacoes.push('Verificar qual projeto deve ser usado e atualizar configuração');
  }

  console.log(`\n   🔍 Próximos Passos:`);
  console.log(`      1. Verificar qual projeto tem o usuário free10signer@gmail.com`);
  console.log(`      2. Verificar qual projeto tem as migrations V19 aplicadas`);
  console.log(`      3. Decidir qual projeto usar baseado nos dados`);
  console.log(`      4. Atualizar configuração se necessário`);

  // 6. SALVAR RESULTADOS
  const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, '29_analise_completa_projetos_supabase.json');
  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
  console.log(`\n   📝 Resultados salvos em: ${logFile}`);

  console.log('\n' + '='.repeat(70) + '\n');

  return resultados;
}

analiseCompleta()
  .then(resultados => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

