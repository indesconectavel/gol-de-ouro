// ============================================================
// VERIFICAÇÃO SUPREMA V19 - ETAPA 6: EXECUTAR TESTES
// ============================================================
// Data: 2025-01-24
// Objetivo: Executar testes completos da Engine V19

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const resultado = {
  timestamp: new Date().toISOString(),
  testes: {
    lotes: { executados: 0, passaram: 0, falharam: 0, erros: [] },
    financeiro: { executados: 0, passaram: 0, falharam: 0, erros: [] },
    premiacao: { executados: 0, passaram: 0, falharam: 0, erros: [] },
    monitoramento: { executados: 0, passaram: 0, falharam: 0, erros: [] },
    migracao: { executados: 0, passaram: 0, falharam: 0, erros: [] }
  },
  resumo: {
    total_executados: 0,
    total_passaram: 0,
    total_falharam: 0,
    taxa_sucesso: 0,
    todos_passaram: false
  }
};

// Lista de arquivos de teste
const arquivosTeste = {
  lotes: [
    'src/tests/v19/test_lotes.spec.js'
  ],
  financeiro: [
    'src/tests/v19/test_financial.spec.js'
  ],
  premiacao: [
    'src/tests/v19/test_engine_v19.spec.js'
  ],
  monitoramento: [
    'src/tests/v19/test_monitoramento.spec.js'
  ],
  migracao: [
    'src/tests/v19/test_migration.spec.js'
  ]
};

function executarTeste(arquivo) {
  return new Promise((resolve) => {
    if (!fs.existsSync(arquivo)) {
      resolve({ sucesso: false, erro: 'Arquivo não encontrado' });
      return;
    }

    // Tentar executar com vitest ou jest
    const comandos = [
      { cmd: 'npx', args: ['vitest', 'run', arquivo] },
      { cmd: 'npx', args: ['jest', arquivo] },
      { cmd: 'node', args: [arquivo] }
    ];

    let tentativa = 0;
    
    function tentarProximo() {
      if (tentativa >= comandos.length) {
        resolve({ sucesso: false, erro: 'Não foi possível executar o teste' });
        return;
      }

      const { cmd, args } = comandos[tentativa];
      tentativa++;

      const processo = spawn(cmd, args, {
        cwd: process.cwd(),
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      processo.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      processo.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      processo.on('close', (code) => {
        if (code === 0) {
          resolve({ sucesso: true, stdout, stderr });
        } else {
          if (tentativa < comandos.length) {
            tentarProximo();
          } else {
            resolve({ sucesso: false, erro: stderr || stdout, code });
          }
        }
      });

      processo.on('error', (error) => {
        if (tentativa < comandos.length) {
          tentarProximo();
        } else {
          resolve({ sucesso: false, erro: error.message });
        }
      });

      // Timeout de 30 segundos
      setTimeout(() => {
        processo.kill();
        if (tentativa < comandos.length) {
          tentarProximo();
        } else {
          resolve({ sucesso: false, erro: 'Timeout ao executar teste' });
        }
      }, 30000);
    }

    tentarProximo();
  });
}

async function executarTodosTestes() {
  console.log('🧪 Executando testes da Engine V19...\n');

  // Executar testes de lotes
  console.log('📦 Testando lotes...');
  for (const arquivo of arquivosTeste.lotes) {
    resultado.testes.lotes.executados++;
    const resultadoTeste = await executarTeste(arquivo);
    if (resultadoTeste.sucesso) {
      resultado.testes.lotes.passaram++;
    } else {
      resultado.testes.lotes.falharam++;
      resultado.testes.lotes.erros.push({
        arquivo,
        erro: resultadoTeste.erro
      });
    }
  }

  // Executar testes financeiros
  console.log('💰 Testando financeiro...');
  for (const arquivo of arquivosTeste.financeiro) {
    resultado.testes.financeiro.executados++;
    const resultadoTeste = await executarTeste(arquivo);
    if (resultadoTeste.sucesso) {
      resultado.testes.financeiro.passaram++;
    } else {
      resultado.testes.financeiro.falharam++;
      resultado.testes.financeiro.erros.push({
        arquivo,
        erro: resultadoTeste.erro
      });
    }
  }

  // Executar testes de premiação
  console.log('🎁 Testando premiação...');
  for (const arquivo of arquivosTeste.premiacao) {
    resultado.testes.premiacao.executados++;
    const resultadoTeste = await executarTeste(arquivo);
    if (resultadoTeste.sucesso) {
      resultado.testes.premiacao.passaram++;
    } else {
      resultado.testes.premiacao.falharam++;
      resultado.testes.premiacao.erros.push({
        arquivo,
        erro: resultadoTeste.erro
      });
    }
  }

  // Executar testes de monitoramento
  console.log('📊 Testando monitoramento...');
  for (const arquivo of arquivosTeste.monitoramento) {
    resultado.testes.monitoramento.executados++;
    const resultadoTeste = await executarTeste(arquivo);
    if (resultadoTeste.sucesso) {
      resultado.testes.monitoramento.passaram++;
    } else {
      resultado.testes.monitoramento.falharam++;
      resultado.testes.monitoramento.erros.push({
        arquivo,
        erro: resultadoTeste.erro
      });
    }
  }

  // Executar testes de migração
  console.log('🔄 Testando migração...');
  for (const arquivo of arquivosTeste.migracao) {
    resultado.testes.migracao.executados++;
    const resultadoTeste = await executarTeste(arquivo);
    if (resultadoTeste.sucesso) {
      resultado.testes.migracao.passaram++;
    } else {
      resultado.testes.migracao.falharam++;
      resultado.testes.migracao.erros.push({
        arquivo,
        erro: resultadoTeste.erro
      });
    }
  }

  // Calcular resumo
  resultado.resumo.total_executados = 
    resultado.testes.lotes.executados +
    resultado.testes.financeiro.executados +
    resultado.testes.premiacao.executados +
    resultado.testes.monitoramento.executados +
    resultado.testes.migracao.executados;

  resultado.resumo.total_passaram = 
    resultado.testes.lotes.passaram +
    resultado.testes.financeiro.passaram +
    resultado.testes.premiacao.passaram +
    resultado.testes.monitoramento.passaram +
    resultado.testes.migracao.passaram;

  resultado.resumo.total_falharam = 
    resultado.testes.lotes.falharam +
    resultado.testes.financeiro.falharam +
    resultado.testes.premiacao.falharam +
    resultado.testes.monitoramento.falharam +
    resultado.testes.migracao.falharam;

  resultado.resumo.taxa_sucesso = resultado.resumo.total_executados > 0
    ? (resultado.resumo.total_passaram / resultado.resumo.total_executados * 100).toFixed(2)
    : 0;

  resultado.resumo.todos_passaram = resultado.resumo.total_falharam === 0;

  // Salvar resultado
  const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, '06_testes_resultado.json');
  fs.writeFileSync(outputFile, JSON.stringify(resultado, null, 2), 'utf8');

  console.log('\n✅ Execução de testes concluída!');
  console.log(`📊 Resumo:`);
  console.log(`   - Total executados: ${resultado.resumo.total_executados}`);
  console.log(`   - Passaram: ${resultado.resumo.total_passaram}`);
  console.log(`   - Falharam: ${resultado.resumo.total_falharam}`);
  console.log(`   - Taxa de sucesso: ${resultado.resumo.taxa_sucesso}%`);
  console.log(`\n💾 Salvo em: ${outputFile}`);

  return resultado;
}

// Executar
executarTodosTestes()
  .then(() => {
    process.exit(resultado.resumo.todos_passaram ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro ao executar testes:', error);
    resultado.erro_geral = error.message;
    
    const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, '06_testes_resultado.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultado, null, 2), 'utf8');
    
    process.exit(1);
  });

module.exports = { executarTodosTestes };

