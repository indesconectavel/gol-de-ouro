// WebSocket Server - Gol de Ouro v1.1.1
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { supabase } = require('../database/supabase-config');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Configuração inválida: JWT_SECRET não definido no ambiente');
}

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.rooms = new Map();
    this.gameRooms = new Map();
    this.queues = new Map();
    
    this.setupWebSocket();
    this.setupHeartbeat();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 Nova conexão WebSocket estabelecida');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
          ws.send(JSON.stringify({ error: 'Mensagem inválida' }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ Erro WebSocket:', error);
        this.removeClient(ws);
      });

      // Enviar mensagem de boas-vindas
      ws.send(JSON.stringify({ 
        type: 'welcome', 
        message: 'Conectado ao Gol de Ouro WebSocket',
        timestamp: new Date().toISOString()
      }));
    });
  }

  setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      });
    }, 30000); // Ping a cada 30 segundos
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'auth':
        await this.authenticateClient(ws, data.token);
        break;
      case 'join_room':
        this.joinRoom(ws, data.room);
        break;
      case 'leave_room':
        this.leaveRoom(ws, data.room);
        break;
      case 'join_queue':
        this.joinQueue(ws, data.queueType);
        break;
      case 'leave_queue':
        this.leaveQueue(ws);
        break;
      case 'game_action':
        this.handleGameAction(ws, data);
        break;
      case 'chat_message':
        this.handleChatMessage(ws, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({ error: 'Tipo de mensagem não reconhecido' }));
    }
  }

  async authenticateClient(ws, token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verificar se o usuário existe no banco
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nome, ativo, saldo')
        .eq('id', decoded.id)
        .single();

      if (error || !user || !user.ativo) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Usuário não encontrado ou inativo' 
        }));
        return;
      }

      this.clients.set(ws, { 
        userId: decoded.id, 
        user: user,
        authenticated: true,
        lastActivity: Date.now()
      });
      
      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        userId: decoded.id,
        user: user
      }));

      console.log(`✅ Usuário ${user.nome} autenticado via WebSocket`);
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Token inválido' 
      }));
    }
  }

  joinRoom(ws, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(ws);
    ws.roomId = roomId;
    
    ws.send(JSON.stringify({ type: 'room_joined', roomId }));
    this.broadcastToRoom(roomId, { 
      type: 'user_joined', 
      roomId,
      userId: this.clients.get(ws)?.userId
    });

    console.log(`👥 Usuário entrou na sala ${roomId}`);
  }

  leaveRoom(ws, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      ws.roomId = null;
      ws.send(JSON.stringify({ type: 'room_left', roomId }));
      this.broadcastToRoom(roomId, { 
        type: 'user_left', 
        roomId,
        userId: this.clients.get(ws)?.userId
      });
    }
  }

  joinQueue(ws, queueType = 'normal') {
    if (!this.queues.has(queueType)) {
      this.queues.set(queueType, new Set());
    }
    
    this.queues.get(queueType).add(ws);
    ws.queueType = queueType;
    
    const queueSize = this.queues.get(queueType).size;
    ws.send(JSON.stringify({ 
      type: 'queue_joined', 
      queueType,
      position: queueSize,
      totalInQueue: queueSize
    }));

    // Verificar se há jogadores suficientes para iniciar uma partida
    if (queueSize >= 10) {
      this.startGame(queueType);
    }

    console.log(`🎮 Usuário entrou na fila ${queueType} (posição: ${queueSize})`);
  }

  leaveQueue(ws) {
    if (ws.queueType && this.queues.has(ws.queueType)) {
      this.queues.get(ws.queueType).delete(ws);
      ws.queueType = null;
      ws.send(JSON.stringify({ type: 'queue_left' }));
    }
  }

  startGame(queueType) {
    const queue = this.queues.get(queueType);
    if (!queue || queue.size < 10) return;

    // Selecionar 10 jogadores da fila
    const players = Array.from(queue).slice(0, 10);
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Remover jogadores da fila
    players.forEach(ws => {
      queue.delete(ws);
      ws.queueType = null;
    });

    // Criar sala de jogo
    this.gameRooms.set(gameId, {
      players: players,
      status: 'waiting',
      createdAt: Date.now(),
      currentPlayer: 0,
      scores: new Array(10).fill(0),
      kicks: new Array(10).fill(null)
    });

    // Notificar jogadores
    players.forEach((ws, index) => {
      ws.send(JSON.stringify({
        type: 'game_started',
        gameId: gameId,
        playerIndex: index,
        totalPlayers: 10
      }));
    });

    console.log(`🎯 Partida ${gameId} iniciada com 10 jogadores`);
  }

  handleGameAction(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.authenticated) {
      ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado' }));
      return;
    }

    const { gameId, action, payload } = data;
    const gameRoom = this.gameRooms.get(gameId);
    
    if (!gameRoom) {
      ws.send(JSON.stringify({ type: 'error', message: 'Partida não encontrada' }));
      return;
    }

    switch (action) {
      case 'kick':
        this.handleKick(ws, gameRoom, payload);
        break;
      case 'ready':
        this.handleReady(ws, gameRoom);
        break;
      case 'vote':
        this.handleVote(ws, gameRoom, payload);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Ação não reconhecida' }));
    }
  }

  handleKick(ws, gameRoom, payload) {
    const { zone, power, angle } = payload;
    const playerIndex = gameRoom.players.indexOf(ws);
    
    if (playerIndex === -1) {
      ws.send(JSON.stringify({ type: 'error', message: 'Jogador não está nesta partida' }));
      return;
    }

    // Simular resultado do chute
    const result = this.simulateKick(zone, power, angle);
    gameRoom.kicks[playerIndex] = {
      zone,
      power,
      angle,
      result,
      timestamp: Date.now()
    };

    // Notificar todos os jogadores
    this.broadcastToGameRoom(gameRoom, {
      type: 'kick_result',
      playerIndex,
      kick: gameRoom.kicks[playerIndex]
    });

    // Verificar se todos chutaram
    if (gameRoom.kicks.every(kick => kick !== null)) {
      this.finishGame(gameRoom);
    }
  }

  simulateKick(zone, power, angle) {
    // Simulação simples do resultado do chute
    const baseSuccess = 0.7;
    const zoneMultiplier = {
      'center': 0.8,
      'left': 0.6,
      'right': 0.6,
      'top': 0.4,
      'bottom': 0.5
    };
    
    const successRate = baseSuccess * zoneMultiplier[zone] * (power / 100);
    const isGoal = Math.random() < successRate;
    
    return {
      isGoal,
      score: isGoal ? 1 : 0,
      details: {
        zone,
        power,
        angle,
        successRate
      }
    };
  }

  finishGame(gameRoom) {
    const totalGoals = gameRoom.kicks.reduce((sum, kick) => sum + kick.result.score, 0);
    const winners = gameRoom.kicks
      .map((kick, index) => ({ index, score: kick.result.score }))
      .filter(player => player.score > 0);

    gameRoom.status = 'finished';
    gameRoom.finalScore = totalGoals;
    gameRoom.winners = winners;

    // Notificar todos os jogadores
    this.broadcastToGameRoom(gameRoom, {
      type: 'game_finished',
      finalScore: totalGoals,
      winners: winners,
      results: gameRoom.kicks
    });

    console.log(`🏆 Partida finalizada - ${totalGoals} gols marcados`);
  }

  handleChatMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.authenticated) return;

    const message = {
      type: 'chat_message',
      userId: client.userId,
      username: client.user.nome,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    if (ws.roomId) {
      this.broadcastToRoom(ws.roomId, message);
    } else {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastToRoom(roomId, message) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  broadcastToGameRoom(gameRoom, message) {
    gameRoom.players.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  broadcastToAll(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  removeClient(ws) {
    const client = this.clients.get(ws);
    if (client) {
      // Remover de salas
      if (ws.roomId) {
        this.leaveRoom(ws, ws.roomId);
      }
      
      // Remover de filas
      if (ws.queueType) {
        this.leaveQueue(ws);
      }
      
      // Remover de partidas
      this.gameRooms.forEach((gameRoom, gameId) => {
        const playerIndex = gameRoom.players.indexOf(ws);
        if (playerIndex !== -1) {
          gameRoom.players.splice(playerIndex, 1);
          if (gameRoom.players.length === 0) {
            this.gameRooms.delete(gameId);
          }
        }
      });
      
      this.clients.delete(ws);
    }
  }

  getStats() {
    return {
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      totalGameRooms: this.gameRooms.size,
      totalQueues: Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.size, 0)
    };
  }
}

module.exports = WebSocketManager;