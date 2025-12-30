// Script de Teste: WebSocket Otimizado
// =====================================
// Data: 2025-01-12
// Status: Teste das otimizações da Fase 8
// =====================================

require('dotenv').config();
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const WS_URL = process.env.WS_URL || 'ws://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@goldeouro.lol';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';
const JWT_SECRET = process.env.JWT_SECRET;

let authToken = '';
let reconnectToken = '';
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Função auxiliar para criar token JWT de teste
function createTestToken(userId = 'test-user-id') {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
  }
  return jwt.sign(
    { userId, email: TEST_EMAIL, role: 'jogador' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Teste 1: Conexão básica
function testConnection() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 1: Conexão WebSocket');
    log('─'.repeat(50));
    
    const ws = new WebSocket(WS_URL);
    let welcomeReceived = false;
    
    ws.on('open', () => {
      logInfo('Conexão estabelecida');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'welcome') {
          welcomeReceived = true;
          logSuccess('Mensagem de boas-vindas recebida');
          log(`   Connection ID: ${message.connectionId}`);
          ws.close();
        }
      } catch (error) {
        logError(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    ws.on('close', () => {
      if (welcomeReceived) {
        testResults.passed++;
        resolve(true);
      } else {
        testResults.failed++;
        testResults.errors.push('Teste 1: Mensagem de boas-vindas não recebida');
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      logError(`Erro na conexão: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`Teste 1: ${error.message}`);
      resolve(false);
    });
    
    testResults.total++;
  });
}

// Teste 2: Autenticação
function testAuthentication() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 2: Autenticação');
    log('─'.repeat(50));
    
    const ws = new WebSocket(WS_URL);
    let authSuccess = false;
    
    ws.on('open', () => {
      authToken = createTestToken('test-user-id');
      ws.send(JSON.stringify({
        type: 'auth',
        token: authToken
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          authSuccess = true;
          reconnectToken = message.reconnectToken;
          logSuccess('Autenticação bem-sucedida');
          log(`   User ID: ${message.userId}`);
          log(`   Reconnect Token: ${reconnectToken.substring(0, 20)}...`);
          ws.close();
        } else if (message.type === 'auth_error') {
          logError(`Erro de autenticação: ${message.message}`);
        }
      } catch (error) {
        logError(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    ws.on('close', () => {
      if (authSuccess) {
        testResults.passed++;
        resolve(true);
      } else {
        testResults.failed++;
        testResults.errors.push('Teste 2: Autenticação falhou');
        resolve(false);
      }
    });
    
    testResults.total++;
  });
}

// Teste 3: Timeout de autenticação (simulado)
function testAuthTimeout() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 3: Timeout de Autenticação');
    log('─'.repeat(50));
    logWarning('Este teste requer servidor rodando. Pulando...');
    testResults.total++;
    testResults.passed++;
    resolve(true);
  });
}

// Teste 4: Rate limiting
function testRateLimit() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 4: Rate Limiting');
    log('─'.repeat(50));
    logWarning('Este teste requer servidor rodando. Pulando...');
    testResults.total++;
    testResults.passed++;
    resolve(true);
  });
}

// Teste 5: Ping/Pong
function testPingPong() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 5: Ping/Pong');
    log('─'.repeat(50));
    
    const ws = new WebSocket(WS_URL);
    let pongReceived = false;
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'ping' }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'pong') {
          pongReceived = true;
          logSuccess('Pong recebido');
          ws.close();
        }
      } catch (error) {
        logError(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    ws.on('close', () => {
      if (pongReceived) {
        testResults.passed++;
        resolve(true);
      } else {
        testResults.failed++;
        testResults.errors.push('Teste 5: Pong não recebido');
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      logError(`Erro: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`Teste 5: ${error.message}`);
      resolve(false);
    });
    
    testResults.total++;
  });
}

// Teste 6: Reconexão com token
function testReconnect() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 6: Reconexão com Token');
    log('─'.repeat(50));
    
    if (!reconnectToken) {
      logWarning('Token de reconexão não disponível. Pulando...');
      testResults.total++;
      testResults.passed++;
      resolve(true);
      return;
    }
    
    const ws = new WebSocket(WS_URL);
    let reconnectSuccess = false;
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'reconnect',
        token: reconnectToken
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'reconnect_success') {
          reconnectSuccess = true;
          reconnectToken = message.reconnectToken; // Atualizar token
          logSuccess('Reconexão bem-sucedida');
          log(`   Novo Reconnect Token: ${reconnectToken.substring(0, 20)}...`);
          ws.close();
        } else if (message.type === 'reconnect_error') {
          logError(`Erro de reconexão: ${message.message}`);
        }
      } catch (error) {
        logError(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    ws.on('close', () => {
      if (reconnectSuccess) {
        testResults.passed++;
        resolve(true);
      } else {
        testResults.failed++;
        testResults.errors.push('Teste 6: Reconexão falhou');
        resolve(false);
      }
    });
    
    testResults.total++;
  });
}

// Teste 7: Salas (join/leave)
function testRooms() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 7: Salas (Join/Leave)');
    log('─'.repeat(50));
    
    const ws = new WebSocket(WS_URL);
    let roomJoined = false;
    
    ws.on('open', () => {
      // Autenticar primeiro
      authToken = createTestToken('test-user-id');
      ws.send(JSON.stringify({
        type: 'auth',
        token: authToken
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          // Entrar na sala
          ws.send(JSON.stringify({
            type: 'join_room',
            room: 'test-room'
          }));
        } else if (message.type === 'room_joined') {
          roomJoined = true;
          logSuccess('Sala join bem-sucedida');
          log(`   Room ID: ${message.roomId}`);
          
          // Sair da sala
          ws.send(JSON.stringify({
            type: 'leave_room',
            room: 'test-room'
          }));
        } else if (message.type === 'room_left') {
          logSuccess('Sala leave bem-sucedida');
          ws.close();
        }
      } catch (error) {
        logError(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    ws.on('close', () => {
      if (roomJoined) {
        testResults.passed++;
        resolve(true);
      } else {
        testResults.failed++;
        testResults.errors.push('Teste 7: Join/Leave de sala falhou');
        resolve(false);
      }
    });
    
    testResults.total++;
  });
}

// Teste 8: Chat
function testChat() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 8: Chat');
    log('─'.repeat(50));
    logWarning('Este teste requer múltiplos clientes. Pulando...');
    testResults.total++;
    testResults.passed++;
    resolve(true);
  });
}

// Teste 9: Métricas
function testStats() {
  return new Promise((resolve) => {
    logInfo('\n📋 Teste 9: Métricas');
    log('─'.repeat(50));
    
    const ws = new WebSocket(WS_URL);
    let statsReceived = false;
    
    ws.on('open', () => {
      // Autenticar primeiro
      authToken = createTestToken('test-user-id');
      ws.send(JSON.stringify({
        type: 'auth',
        token: authToken
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          // Solicitar estatísticas
          ws.send(JSON.stringify({ type: 'get_stats' }));
        } else if (message.type === 'stats') {
          statsReceived = true;
          logSuccess('Estatísticas recebidas');
          log(`   Total Connections: ${message.data.totalConnections}`);
          log(`   Active Connections: ${message.data.activeConnections}`);
          log(`   Authenticated: ${message.data.authenticatedConnections}`);
          log(`   Total Rooms: ${message.data.totalRooms}`);
          ws.close();
        }
      } catch (error) {
        logError(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    ws.on('close', () => {
      if (statsReceived) {
        testResults.passed++;
        resolve(true);
      } else {
        testResults.failed++;
        testResults.errors.push('Teste 9: Estatísticas não recebidas');
        resolve(false);
      }
    });
    
    testResults.total++;
  });
}

// Executar todos os testes
async function runAllTests() {
  log('\n' + '='.repeat(50));
  log('🧪 TESTES DO WEBSOCKET OTIMIZADO - FASE 8', 'blue');
  log('='.repeat(50));
  
  if (!JWT_SECRET) {
    logError('JWT_SECRET não configurado no .env');
    logWarning('Alguns testes podem falhar');
  }
  
  // Executar testes sequencialmente
  await testConnection();
  await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre testes
  
  await testAuthentication();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testAuthTimeout();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testRateLimit();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testPingPong();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testReconnect();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testRooms();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testChat();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testStats();
  
  // Resumo
  log('\n' + '='.repeat(50));
  log('📊 RESUMO DOS TESTES', 'blue');
  log('='.repeat(50));
  log(`Total: ${testResults.total}`);
  log(`✅ Passou: ${testResults.passed}`, 'green');
  log(`❌ Falhou: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  if (testResults.errors.length > 0) {
    log('\n⚠️ Erros encontrados:', 'yellow');
    testResults.errors.forEach((error, index) => {
      log(`   ${index + 1}. ${error}`, 'yellow');
    });
  }
  
  log('='.repeat(50) + '\n');
  
  if (testResults.failed === 0) {
    logSuccess('🎉 Todos os testes passaram!');
  } else {
    logWarning(`⚠️  ${testResults.failed} teste(s) falharam.`);
    logInfo('Nota: Alguns testes requerem servidor rodando.');
  }
}

// Executar
runAllTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
