// ✅ HARDENING FINAL: WebSocket Server - Gol de Ouro v1.2.0
// ============================================================
// Data: 2025-01-24
// Status: LIMPO - Apenas chat e salas
//
// ✅ REMOVIDO: Sistema de fila/partidas
// ✅ REMOVIDO: Métodos de jogo via WebSocket
// ✅ MANTIDO: Chat e sistema de salas
// ✅ CONFIRMADO: Sistema de jogo usa REST API exclusivamente
// ============================================================

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../database/supabase-unified-config');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Configuração inválida: JWT_SECRET não definido no ambiente');
}

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Clientes conectados
    this.rooms = new Map(); // Salas de chat
    
    this.setupWebSocket();
    this.setupHeartbeat();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 [WS] Nova conexão WebSocket estabelecida');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('❌ [WS] Erro ao processar mensagem:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Mensagem inválida' }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 [WS] Conexão fechada');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ [WS] Erro:', error);
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
      case 'chat_message':
        this.handleChatMessage(ws, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'get_stats':
        this.sendStats(ws);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensagem não reconhecido' }));
    }
  }

  async authenticateClient(ws, token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verificar se o usuário existe no banco
      const { data: user, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, username, ativo, saldo')
        .eq('id', decoded.userId || decoded.id)
        .eq('ativo', true)
        .single();

      if (error || !user || !user.ativo) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Usuário não encontrado ou inativo' 
        }));
        return;
      }

      this.clients.set(ws, { 
        userId: user.id, 
        user: user,
        authenticated: true,
        lastActivity: Date.now()
      });
      
      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      }));

      console.log(`✅ [WS] Usuário ${user.username} autenticado`);
    } catch (error) {
      console.error('❌ [WS] Erro de autenticação:', error);
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Token inválido' 
      }));
    }
  }

  joinRoom(ws, roomId) {
    const client = this.clients.get(ws);
    if (!client || !client.authenticated) {
      ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado' }));
      return;
    }

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(ws);
    ws.roomId = roomId;
    
    ws.send(JSON.stringify({ type: 'room_joined', roomId }));
    this.broadcastToRoom(roomId, { 
      type: 'user_joined', 
      roomId,
      userId: client.userId,
      username: client.user.username
    });

    console.log(`👥 [WS] Usuário ${client.user.username} entrou na sala ${roomId}`);
  }

  leaveRoom(ws, roomId) {
    const client = this.clients.get(ws);
    if (!client) return;

    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      ws.roomId = null;
      ws.send(JSON.stringify({ type: 'room_left', roomId }));
      this.broadcastToRoom(roomId, { 
        type: 'user_left', 
        roomId,
        userId: client.userId,
        username: client.user.username
      });
      console.log(`👥 [WS] Usuário ${client.user.username} saiu da sala ${roomId}`);
    }
  }

  handleChatMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.authenticated) {
      ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado' }));
      return;
    }

    const message = {
      type: 'chat_message',
      userId: client.userId,
      username: client.user.username,
      message: data.message,
      roomId: ws.roomId || null,
      timestamp: new Date().toISOString()
    };

    if (ws.roomId) {
      this.broadcastToRoom(ws.roomId, message);
    } else {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Você precisa estar em uma sala para enviar mensagens' 
      }));
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

  sendStats(ws) {
    const stats = {
      type: 'stats',
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.keys())
    };
    ws.send(JSON.stringify(stats));
  }

  removeClient(ws) {
    const client = this.clients.get(ws);
    if (client) {
      // Remover de salas
      if (ws.roomId) {
        this.leaveRoom(ws, ws.roomId);
      }
      
      this.clients.delete(ws);
      console.log(`🔌 [WS] Cliente removido: ${client.user?.username || 'desconhecido'}`);
    }
  }

  getStats() {
    return {
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.keys())
    };
  }
}

module.exports = WebSocketManager;
