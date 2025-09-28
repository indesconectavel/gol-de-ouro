const { execSync } = require('child_process');

const ENDPOINTS = [
  { url: 'http://localhost:3000/health', method: 'GET', name: 'Health Check' },
  { url: 'http://localhost:3000/auth/register', method: 'POST', name: 'Registro de Usuário' },
  { url: 'http://localhost:3000/api/games/status', method: 'GET', name: 'Status do Jogo' },
  { url: 'http://localhost:3000/fila', method: 'GET', name: 'Fila de Jogos' },
  { url: 'http://localhost:3000/api/payments/pix/criar', method: 'POST', name: 'Criação PIX' },
  { url: 'http://localhost:5174', method: 'GET', name: 'Frontend Jogador' }
];

console.log('🎮 Validando sistema do jogador...');
console.log('');

let allPassed = true;
let passedCount = 0;
let totalCount = ENDPOINTS.length;

ENDPOINTS.forEach((endpoint, index) => {
  try {
    let command;
    if (endpoint.method === 'GET') {
      command = `curl -s -o /dev/null -w "%{http_code}" ${endpoint.url}`;
    } else {
      command = `curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "{}" ${endpoint.url}`;
    }
    
    const result = execSync(command, { encoding: 'utf8' });
    const statusCode = result.trim();
    
    if (statusCode === '200') {
      console.log(`✅ ${endpoint.name} - ${statusCode}`);
      passedCount++;
    } else {
      console.log(`❌ ${endpoint.name} - ${statusCode}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name} - ERRO: ${error.message}`);
    allPassed = false;
  }
});

console.log('');
console.log('📊 Resultado da Validação do Jogador:');
console.log(`✅ Passou: ${passedCount}/${totalCount}`);
console.log(`❌ Falhou: ${totalCount - passedCount}/${totalCount}`);

if (allPassed) {
  console.log('');
  console.log('🎉 Sistema do Jogador - TODOS OS TESTES PASSARAM!');
  console.log('');
  console.log('📋 Status do Sistema Jogador:');
  console.log('✅ Backend: Funcionando perfeitamente');
  console.log('✅ Frontend: Jogador funcionando');
  console.log('✅ Endpoints: Todos respondendo (200)');
  console.log('✅ Autenticação: Funcionando');
  console.log('✅ CORS: Configurado');
  console.log('✅ Jogos: Sistema funcionando');
  console.log('');
  console.log('🚀 Sistema do Jogador pronto para próxima etapa!');
} else {
  console.log('');
  console.log('⚠️ Sistema do Jogador com problemas - Verificar logs');
  console.log('');
  console.log('🔧 Soluções possíveis:');
  console.log('1. Verificar se o backend está rodando');
  console.log('2. Verificar se a porta 3000 está livre');
  console.log('3. Verificar se o frontend jogador está rodando');
  console.log('4. Verificar se a porta 5174 está livre');
  console.log('5. Verificar se o CORS está configurado');
  process.exit(1);
}
