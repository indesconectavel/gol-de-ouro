/**
 * Executor Principal - MISSÃO C
 * Executa testes e gera relatório completo
 */

const { main } = require('./missao-c-automated-test');
const { gerarRelatorio } = require('./gerar-relatorio-missao-c');
const fs = require('fs');
const path = require('path');

async function executarMissaoC() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 INICIANDO MISSÃO C - TESTES AUTOMATIZADOS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Executar testes
    const resultados = await main();

    // Salvar resultados em JSON
    const resultadosPath = path.join(__dirname, 'missao-c-resultados.json');
    fs.writeFileSync(resultadosPath, JSON.stringify(resultados, null, 2), 'utf8');
    console.log(`\n✅ Resultados salvos em: ${resultadosPath}`);

    // Gerar relatório
    const relatorio = gerarRelatorio(resultados);
    const relatorioPath = path.join(__dirname, '..', 'RELATORIO-MISSAO-C-AUTOMATIZADA.md');
    fs.writeFileSync(relatorioPath, relatorio, 'utf8');
    console.log(`✅ Relatório gerado: ${relatorioPath}`);

    // Resumo final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMO FINAL');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Status: ${resultados.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}`);
    console.log(`BLOCO 1: ${resultados.resultados.bloco1.aprovado ? '✅' : '❌'}`);
    console.log(`BLOCO 2: ${resultados.resultados.bloco2.aprovado ? '✅' : '❌'}`);
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(resultados.aprovado ? 0 : 1);

  } catch (error) {
    console.error('❌ Erro fatal na execução:', error);
    process.exit(1);
  }
}

// Executar
executarMissaoC();

