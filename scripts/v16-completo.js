/**
 * 🔥 V16 COMPLETO - EXECUÇÃO TOTAL
 * Executa diagnóstico, ajuste de saldo e revalidação em sequência
 */

const { run: runDiagnostico } = require('./v16-diagnostico');
const { run: runAjusteSaldo } = require('./v16-ajusta-saldo');
const { run: runRevalidacao } = require('./v16-revalidacao');

async function run() {
  console.log('🔥 INICIANDO V16 COMPLETO\n');
  console.log('='.repeat(60));
  
  try {
    console.log('\n📋 ETAPA 1: DIAGNÓSTICO\n');
    await runDiagnostico();
    
    console.log('\n📋 ETAPA 2: AJUSTE DE SALDO\n');
    await runAjusteSaldo();
    
    console.log('\n📋 ETAPA 3: REVALIDAÇÃO\n');
    await runRevalidacao();
    
    console.log('\n✅ V16 COMPLETO CONCLUÍDO\n');
    console.log('='.repeat(60));
    console.log('Relatórios gerados em: docs/GO-LIVE/');
    console.log('Logs gerados em: logs/');
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };

