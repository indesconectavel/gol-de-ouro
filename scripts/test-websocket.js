const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Configurações
const SERVER_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'goldeouro_jwt_secret_key_2025_super_segura_minimo_32_chars';

// Criar token JWT para teste (usando o mesmo formato do sistema)
const testUser = {
  id: 1,
  email: 'teste@exemplo.com',
  name: 'Usuário Teste'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('🧪 Iniciando teste do sistema WebSocket...');
console.log(`🔗 Conectando ao servidor: ${SERVER_URL}`);
console.log(`🔑 Token gerado: ${token.substring(0, 20)}...`);

// Criar conexão Socket.io
const socket = io(SERVER_URL, {
  auth: {
    token: token
  },
  transports: ['websocket', 'polling']
});

// Eventos de conexão
socket.on('connect', () => {
  console.log('✅ Conectado ao servidor WebSocket!');
  console.log(`🆔 Socket ID: ${socket.id}`);
  
  // Testar eventos
  testSocketEvents();
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do servidor WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
});

socket.on('auth_error', (error) => {
  console.error('❌ Erro de autenticação:', error.message);
});

// Função para testar eventos
function testSocketEvents() {
  console.log('\n🧪 Testando eventos do WebSocket...');
  
  // Teste 1: Entrar na fila
  console.log('1️⃣ Testando: join-queue');
  socket.emit('join-queue');
  
  // Teste 2: Escutar atualizações da fila
  socket.on('queue-updated', (data) => {
    console.log('📢 Fila atualizada:', data);
  });
  
  // Teste 3: Entrar em uma partida
  setTimeout(() => {
    console.log('2️⃣ Testando: join-game');
    socket.emit('join-game', 'test-game-123');
  }, 2000);
  
  // Teste 4: Notificar chute
  setTimeout(() => {
    console.log('3️⃣ Testando: shot-taken');
    socket.emit('shot-taken', {
      gameId: 'test-game-123',
      shotResult: 'goal',
      isGoldenGoal: false
    });
  }, 4000);
  
  // Teste 5: Escutar resultado de chute
  socket.on('shot-result', (data) => {
    console.log('⚽ Resultado de chute recebido:', data);
  });
  
  // Teste 6: Sair da fila
  setTimeout(() => {
    console.log('4️⃣ Testando: leave-queue');
    socket.emit('leave-queue');
  }, 6000);
  
  // Teste 7: Sair da partida
  setTimeout(() => {
    console.log('5️⃣ Testando: leave-game');
    socket.emit('leave-game', 'test-game-123');
  }, 8000);
  
  // Finalizar teste
  setTimeout(() => {
    console.log('\n✅ Teste do WebSocket concluído!');
    console.log('🔌 Desconectando...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
}

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Finalizando teste');
  socket.disconnect();
  process.exit(1);
}, 15000);
