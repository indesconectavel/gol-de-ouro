/**
 * Script de teste de chutes - V16+
 */
const axios = require('axios');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzA0ZjJkMC0xMTk1LTQ0MTYtOWY4Zi1kNzQwMzgwMDYyZWUiLCJlbWFpbCI6InRlc3RfdjE2X2RpYWdfMTc2NDg2NTA3NzczNkBleGFtcGxlLmNvbSIsInJvbGUiOiJqb2dhZG9yIiwiaWF0IjoxNzY0ODY1MDc3LCJleHAiOjE3NjQ5NTE0Nzd9.voFBN39GbfRt_IYQwHL6RMRpPjY0kSMhHGgJNbDr1XE';

async function testShoots() {
  const resultados = [];
  
  for (let i = 0; i < 10; i++) {
    try {
      const startTime = Date.now();
      const r = await axios.post(`${BACKEND_URL}/api/games/shoot`, {
        direction: ['left', 'center', 'right'][i % 3],
        amount: 1
      }, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        validateStatus: () => true
      });
      
      const latency = Date.now() - startTime;
      
      resultados.push({
        index: i + 1,
        status: r.status,
        success: r.status === 200 || r.status === 201,
        latency: latency,
        data: r.data,
        timestamp: new Date().toISOString()
      });
      
      if (r.status === 200 || r.status === 201) {
        console.log(`✅ Chute ${i + 1}: OK`);
      } else {
        console.log(`❌ Chute ${i + 1}: ${r.status} - ${JSON.stringify(r.data)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (e) {
      resultados.push({
        index: i + 1,
        error: e.message,
        response: e.response?.data,
        statusCode: e.response?.status,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Chute ${i + 1}: ERRO - ${e.message}`);
    }
  }
  
  return resultados;
}

testShoots().then(resultados => {
  require('fs').writeFileSync('logs/test-shoots-log.json', JSON.stringify(resultados, null, 2));
  console.log('\n✅ Teste concluído. Resultados salvos em logs/test-shoots-log.json');
}).catch(e => {
  console.error('Erro:', e);
  process.exit(1);
});
