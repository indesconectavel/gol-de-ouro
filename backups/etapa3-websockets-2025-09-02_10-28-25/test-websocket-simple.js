const { io } = require('socket.io-client');

console.log('🧪 Teste simples do WebSocket...');

// Conectar sem autenticação primeiro para testar a conexão básica
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Conectado ao servidor WebSocket!');
  console.log(`🆔 Socket ID: ${socket.id}`);
  
  // Testar evento básico
  socket.emit('join-queue');
  
  setTimeout(() => {
    console.log('🔌 Desconectando...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado');
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
});

socket.on('queue-updated', (data) => {
  console.log('📢 Fila atualizada:', data);
});

// Timeout de segurança
setTimeout(() => {
  console.log('⏰ Timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);
