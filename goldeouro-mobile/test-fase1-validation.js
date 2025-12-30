// Teste de Validação Fase 1 - Mobile
// Validação básica das correções implementadas
// Data: 17/11/2025

console.log('🧪 TESTE DE VALIDAÇÃO - FASE 1 MOBILE\n');

// Teste 1: Verificar se WebSocketService existe e tem métodos corretos
console.log('1️⃣ Testando WebSocketService.js...');
try {
  const WebSocketService = require('./src/services/WebSocketService').default;
  
  const requiredMethods = [
    'connect',
    'disconnect',
    'send',
    'authenticate',
    'joinRoom',
    'leaveRoom',
    'sendChatMessage',
    'getStats'
  ];
  
  const removedMethods = [
    'joinQueue',
    'leaveQueue',
    'kick'
  ];
  
  let allMethodsExist = true;
  requiredMethods.forEach(method => {
    if (typeof WebSocketService[method] !== 'function') {
      console.log(`   ❌ Método '${method}' não encontrado`);
      allMethodsExist = false;
    } else {
      console.log(`   ✅ Método '${method}' existe`);
    }
  });
  
  removedMethods.forEach(method => {
    if (typeof WebSocketService[method] === 'function') {
      console.log(`   ⚠️ Método '${method}' ainda existe (deveria ter sido removido)`);
    } else {
      console.log(`   ✅ Método '${method}' removido corretamente`);
    }
  });
  
  if (allMethodsExist) {
    console.log('   ✅ WebSocketService.js - OK\n');
  } else {
    console.log('   ❌ WebSocketService.js - FALHOU\n');
  }
} catch (error) {
  console.log(`   ❌ Erro ao testar WebSocketService: ${error.message}\n`);
}

// Teste 2: Verificar se GameService tem método shoot
console.log('2️⃣ Testando GameService.js...');
try {
  const GameService = require('./src/services/GameService').default;
  
  const requiredMethods = [
    'shoot',
    'createPixPayment',
    'getPixPaymentStatus',
    'listPixPayments',
    'cancelPixPayment',
    'getBalance',
    'getStatement'
  ];
  
  let allMethodsExist = true;
  requiredMethods.forEach(method => {
    if (typeof GameService[method] !== 'function') {
      console.log(`   ❌ Método '${method}' não encontrado`);
      allMethodsExist = false;
    } else {
      console.log(`   ✅ Método '${method}' existe`);
    }
  });
  
  if (allMethodsExist) {
    console.log('   ✅ GameService.js - OK\n');
  } else {
    console.log('   ❌ GameService.js - FALHOU\n');
  }
} catch (error) {
  console.log(`   ❌ Erro ao testar GameService: ${error.message}\n`);
}

// Teste 3: Verificar se AuthService tem método updateUser
console.log('3️⃣ Testando AuthService.js...');
try {
  // AuthService é um contexto React, então vamos apenas verificar se o arquivo existe
  const fs = require('fs');
  const authServicePath = './src/services/AuthService.js';
  
  if (fs.existsSync(authServicePath)) {
    const content = fs.readFileSync(authServicePath, 'utf8');
    
    if (content.includes('updateUser')) {
      console.log('   ✅ Método updateUser encontrado');
      console.log('   ✅ AuthService.js - OK\n');
    } else {
      console.log('   ❌ Método updateUser não encontrado');
      console.log('   ❌ AuthService.js - FALHOU\n');
    }
  } else {
    console.log('   ❌ Arquivo AuthService.js não encontrado\n');
  }
} catch (error) {
  console.log(`   ❌ Erro ao testar AuthService: ${error.message}\n`);
}

// Teste 4: Verificar se GameScreen existe e não usa eventos inexistentes
console.log('4️⃣ Testando GameScreen.js...');
try {
  const fs = require('fs');
  const gameScreenPath = './src/screens/GameScreen.js';
  
  if (fs.existsSync(gameScreenPath)) {
    const content = fs.readFileSync(gameScreenPath, 'utf8');
    
    // Verificar se não usa eventos inexistentes
    const removedEvents = [
      'joinQueue',
      'leaveQueue',
      'kick',
      'queueUpdate',
      'gameStarted',
      'gameEnded',
      'playerKicked'
    ];
    
    let usesRemovedEvents = false;
    removedEvents.forEach(event => {
      if (content.includes(event)) {
        console.log(`   ⚠️ Ainda usa evento '${event}' (deveria ter sido removido)`);
        usesRemovedEvents = true;
      }
    });
    
    // Verificar se usa HTTP POST para chute
    if (content.includes('GameService.shoot')) {
      console.log('   ✅ Usa GameService.shoot (HTTP POST)');
    } else {
      console.log('   ❌ Não usa GameService.shoot');
    }
    
    // Verificar se usa direction e amount
    if (content.includes('selectedDirection') && content.includes('selectedAmount')) {
      console.log('   ✅ Usa direction e amount (parâmetros corretos)');
    } else {
      console.log('   ❌ Não usa direction e amount');
    }
    
    if (!usesRemovedEvents) {
      console.log('   ✅ GameScreen.js - OK\n');
    } else {
      console.log('   ⚠️ GameScreen.js - AVISOS\n');
    }
  } else {
    console.log('   ❌ Arquivo GameScreen.js não encontrado\n');
  }
} catch (error) {
  console.log(`   ❌ Erro ao testar GameScreen: ${error.message}\n`);
}

console.log('✅ TESTES DE VALIDAÇÃO CONCLUÍDOS\n');
console.log('📝 Próximos passos:');
console.log('   1. Testar integração real com backend');
console.log('   2. Criar telas de PIX');
console.log('   3. Criar telas de saldo/extrato');
console.log('   4. Criar tela de histórico\n');

