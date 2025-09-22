// Network Smoke Test - Gol de Ouro Player
import { performHealthChecks } from '../src/utils/healthCheck.js';

const runNetworkSmoke = async () => {
  console.log('🚀 Iniciando Network Smoke Test...');
  console.log('⏰', new Date().toISOString());
  
  try {
    const results = await performHealthChecks();
    
    console.log('\n📊 Resultados dos Health Checks:');
    console.log('================================');
    
    // Health Check
    console.log(`🏥 Health: ${results.health.status}`);
    if (results.health.data) {
      console.log(`   📈 Dados:`, results.health.data);
    }
    if (results.health.error) {
      console.log(`   ❌ Erro:`, results.health.error);
    }
    
    // Readiness Check
    console.log(`✅ Readiness: ${results.readiness.status}`);
    if (results.readiness.data) {
      console.log(`   📈 Dados:`, results.readiness.data);
    }
    if (results.readiness.error) {
      console.log(`   ❌ Erro:`, results.readiness.error);
    }
    
    // Status geral
    const allHealthy = results.health.status === 'healthy' && results.readiness.status === 'ready';
    console.log(`\n🎯 Status Geral: ${allHealthy ? '✅ SAUDÁVEL' : '❌ PROBLEMAS'}`);
    
    if (allHealthy) {
      console.log('🎉 Todos os health checks passaram!');
      process.exit(0);
    } else {
      console.log('⚠️ Alguns health checks falharam!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Erro crítico no network smoke test:', error);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runNetworkSmoke();
}

export default runNetworkSmoke;
