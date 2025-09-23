// Network Smoke Test - Gol de Ouro Player
const baseUrl = process.env.VITE_API_URL || 'http://localhost:3000';

const runNetworkSmoke = async () => {
  console.log('🚀 Iniciando Network Smoke Test...');
  console.log('⏰', new Date().toISOString());
  console.log(`🌐 Backend URL: ${baseUrl}`);
  
  try {
    console.log('🔍 Testando conectividade com o backend...');
    
    // Test health endpoint
    console.log(`📡 Testando ${baseUrl}/health...`);
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.ok ? '✅' : '❌'}`);
    
    // Test readiness endpoint
    console.log(`📡 Testando ${baseUrl}/readiness...`);
    const readinessResponse = await fetch(`${baseUrl}/readiness`);
    console.log(`   Status: ${readinessResponse.status} ${readinessResponse.ok ? '✅' : '❌'}`);
    
    // Test version endpoint
    console.log(`📡 Testando ${baseUrl}/health/version...`);
    const versionResponse = await fetch(`${baseUrl}/health/version`);
    console.log(`   Status: ${versionResponse.status} ${versionResponse.ok ? '✅' : '❌'}`);
    
    // Test game endpoints
    console.log(`📡 Testando ${baseUrl}/api/games/status...`);
    const gamesResponse = await fetch(`${baseUrl}/api/games/status`);
    console.log(`   Status: ${gamesResponse.status} ${gamesResponse.ok ? '✅' : '❌'}`);
    
    if (healthResponse.ok && readinessResponse.ok) {
      console.log('✅ Todos os endpoints críticos estão respondendo!');
      console.log('🎉 Network smoke test passou!');
      process.exit(0);
    } else {
      console.log('❌ Alguns endpoints críticos não estão respondendo!');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Erro durante network smoke test:', error);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runNetworkSmoke();
}

export default runNetworkSmoke;