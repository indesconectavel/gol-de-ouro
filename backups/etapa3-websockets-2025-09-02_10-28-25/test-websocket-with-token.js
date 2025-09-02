const { io } = require('socket.io-client');
const axios = require('axios');

console.log('🧪 Teste do WebSocket com token válido...');

async function testWebSocket() {
  try {
    // Obter token válido do servidor
    console.log('🔑 Obtendo token válido do servidor...');
    const response = await axios.get('http://localhost:3000/health/test-token');
    const { token } = response.data;
    
    console.log(`✅ Token obtido: ${token.substring(0, 50)}...`);
    
    // Conectar com token válido
    const socket = io('http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket!');
      console.log(`🆔 Socket ID: ${socket.id}`);
      
      // Testar eventos
      testSocketEvents(socket);
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
    
    // Timeout de segurança
    setTimeout(() => {
      console.log('⏰ Timeout - Finalizando teste');
      socket.disconnect();
      process.exit(1);
    }, 15000);
    
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.message);
    process.exit(1);
  }
}

function testSocketEvents(socket) {
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
    console.log('\n✅ Teste do WebSocket concluído com sucesso!');
    console.log('🔌 Desconectando...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
}

// Executar teste
testWebSocket();
