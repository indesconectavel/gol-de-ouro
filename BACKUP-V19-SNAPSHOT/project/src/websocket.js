// WebSocket Server - Gol de Ouro v4.0 - Sistema de Lotes - OTIMIZADO
// ====================================================================
// Data: 2025-01-12
// Status: FASE 8 - Otimização isolada do WebSocket
//
// Este WebSocket fornece funcionalidades básicas otimizadas:
// - Autenticação com timeout
// - Salas (rooms) com limpeza automática
// - Chat com rate limiting
// - Ping/Pong com detecção de clientes mortos
// - Reconexão com token
// - Logging estruturado
// - Métricas de performance
// ====================================================================
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../database/supabase-config');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Configuração inválida: JWT_SECRET não definido no ambiente');
}

// Configurações
const CONFIG = {
  AUTH_TIMEOUT: 30000, // 30 segundos para autenticar
  PING_INTERVAL: 30000, // Ping a cada 30 segundos
  PONG_TIMEOUT: 10000, // 10 segundos para responder ao ping
  MAX_MESSAGE_SIZE: 64 * 1024, // 64KB máximo
  MAX_MESSAGES_PER_SECOND: 10, // Rate limit
  CLEANUP_INTERVAL: 60000, // Limpeza a cada 60 segundos
  MAX_PING_FAILURES: 2 // Remover após 2 pings sem resposta
};

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      maxPayload: CONFIG.MAX_MESSAGE_SIZE,
      perMessageDeflate: false // Desabilitar compressão para melhor performance
    });
    this.clients = new Map();
    this.rooms = new Map();
    this.reconnectTokens = new Map(); // Tokens temporários para reconexão
    
    // Intervalos e timers
    this.heartbeatInterval = null;
    this.cleanupInterval = null;
    
    // Métricas
    this.metrics = {
      totalConnections: 0,
      totalDisconnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      activeConnections: 0,
      authenticatedConnections: 0
    };
    
    this.setupWebSocket();
    this.setupHeartbeat();
    this.setupCleanup();
    this.setupGracefulShutdown();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = this.generateConnectionId();
      ws.connectionId = connectionId;
      ws.authenticated = false;
      ws.lastPing = null;
      ws.pingFailures = 0;
      ws.messageCount = 0;
      ws.messageWindow = Date.now();
      ws.roomId = null;
      ws.userId = null;
      
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      
      this.log('connection', { connectionId, ip: req.socket.remoteAddress });
      
      // Timeout de autenticação
      const authTimeout = setTimeout(() => {
        if (!ws.authenticated) {
          this.log('auth_timeout', { connectionId });
          ws.close(1008, 'Autenticação timeout');
        }
      }, CONFIG.AUTH_TIMEOUT);
      
      ws.on('message', (message) => {
        try {
          // Validar tamanho da mensagem
          if (message.length > CONFIG.MAX_MESSAGE_SIZE) {
            this.log('message_too_large', { connectionId, size: message.length });
            ws.close(1009, 'Mensagem muito grande');
            return;
          }
          
          // Rate limiting
          const now = Date.now();
          if (now - ws.messageWindow > 1000) {
            ws.messageCount = 0;
            ws.messageWindow = now;
          }
          
          ws.messageCount++;
          if (ws.messageCount > CONFIG.MAX_MESSAGES_PER_SECOND) {
            this.log('rate_limit_exceeded', { connectionId, count: ws.messageCount });
            ws.close(1008, 'Rate limit excedido');
            return;
          }
          
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
          this.metrics.totalMessages++;
        } catch (error) {
          this.log('message_error', { connectionId, error: error.message });
          this.metrics.totalErrors++;
          ws.send(JSON.stringify({ error: 'Mensagem inválida' }));
        }
      });

      ws.on('close', (code, reason) => {
        clearTimeout(authTimeout);
        this.log('disconnection', { connectionId, code, reason: reason?.toString() });
        this.removeClient(ws);
        this.metrics.totalDisconnections++;
        this.metrics.activeConnections--;
      });

      ws.on('error', (error) => {
        this.log('error', { connectionId, error: error.message });
        this.metrics.totalErrors++;
        this.removeClient(ws);
      });

      ws.on('pong', () => {
        ws.pingFailures = 0;
        ws.lastPing = null;
        this.log('pong_received', { connectionId });
      });

      // Enviar mensagem de boas-vindas
      ws.send(JSON.stringify({ 
        type: 'welcome', 
        message: 'Conectado ao Gol de Ouro WebSocket',
        connectionId,
        timestamp: new Date().toISOString()
      }));
    });
  }

  setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const clientsToRemove = [];
      
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          // Verificar se cliente não respondeu ao ping anterior
          if (client.lastPing && (now - client.lastPing) > CONFIG.PONG_TIMEOUT) {
            client.pingFailures++;
            this.log('ping_timeout', { 
              connectionId: client.connectionId,
              failures: client.pingFailures 
            });
            
            if (client.pingFailures >= CONFIG.MAX_PING_FAILURES) {
              clientsToRemove.push(client);
            }
          } else {
            // Enviar novo ping
            client.lastPing = now;
            client.ping();
          }
        }
      });
      
      // Remover clientes que não respondem
      clientsToRemove.forEach(client => {
        this.log('client_removed_no_response', { connectionId: client.connectionId });
        client.close(1000, 'Sem resposta ao ping');
      });
      
      this.metrics.activeConnections = this.wss.clients.size;
    }, CONFIG.PING_INTERVAL);
  }

  setupCleanup() {
    this.cleanupInterval = setInterval(() => {
      // Limpar salas vazias
      const emptyRooms = [];
      this.rooms.forEach((clients, roomId) => {
        // Remover clientes desconectados
        const activeClients = Array.from(clients).filter(ws => 
          ws.readyState === WebSocket.OPEN
        );
        
        if (activeClients.length === 0) {
          emptyRooms.push(roomId);
        } else {
          // Atualizar Set com apenas clientes ativos
          this.rooms.set(roomId, new Set(activeClients));
        }
      });
      
      // Remover salas vazias
      emptyRooms.forEach(roomId => {
        this.rooms.delete(roomId);
        this.log('room_cleaned', { roomId });
      });
      
      // Limpar tokens de reconexão expirados (mais de 5 minutos)
      const now = Date.now();
      const expiredTokens = [];
      this.reconnectTokens.forEach((data, token) => {
        if (now - data.createdAt > 5 * 60 * 1000) {
          expiredTokens.push(token);
        }
      });
      expiredTokens.forEach(token => this.reconnectTokens.delete(token));
      
      this.log('cleanup_completed', { 
        emptyRoomsRemoved: emptyRooms.length,
        expiredTokensRemoved: expiredTokens.length
      });
    }, CONFIG.CLEANUP_INTERVAL);
  }

  setupGracefulShutdown() {
    // Limpar intervals ao desligar
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    this.log('shutdown', { message: 'Iniciando shutdown graceful' });
    
    // Limpar intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Fechar todas as conexões
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1001, 'Servidor desligando');
      }
    });
    
    // Fechar servidor WebSocket
    this.wss.close(() => {
      this.log('shutdown', { message: 'Shutdown completo' });
    });
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReconnectToken(userId) {
    const token = `reconnect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.reconnectTokens.set(token, {
      userId,
      createdAt: Date.now()
    });
    return token;
  }

  async handleMessage(ws, data) {
    try {
      switch (data.type) {
        case 'auth':
          await this.authenticateClient(ws, data.token);
          break;
        case 'reconnect':
          await this.handleReconnect(ws, data.token);
          break;
        case 'join_room':
          if (ws.authenticated) {
            this.joinRoom(ws, data.room);
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Autenticação necessária' }));
          }
          break;
        case 'leave_room':
          this.leaveRoom(ws, data.room);
          break;
        case 'chat_message':
          if (ws.authenticated) {
            this.handleChatMessage(ws, data);
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Autenticação necessária' }));
          }
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'get_stats':
          if (ws.authenticated) {
            ws.send(JSON.stringify({ type: 'stats', data: this.getStats() }));
          }
          break;
        default:
          ws.send(JSON.stringify({ error: 'Tipo de mensagem não reconhecido' }));
      }
    } catch (error) {
      this.log('handle_message_error', { 
        connectionId: ws.connectionId,
        error: error.message 
      });
      this.metrics.totalErrors++;
    }
  }

  async authenticateClient(ws, token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId || decoded.id || decoded.user?.id;
      
      // ✅ CORREÇÃO: Usar supabaseAdmin para bypass de RLS e garantir acesso imediato
      // Também adicionar retry para casos de propagação
      let user = null;
      let error = null;
      const maxRetries = 5;
      let retryCount = 0;
      
      while (retryCount < maxRetries && (!user || error)) {
        if (retryCount > 0) {
          // Aguardar antes de tentar novamente (1s, 2s, 3s, 4s, 5s)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
        
        // ✅ CORREÇÃO: Usar supabaseAdmin para bypass de RLS
        const result = await supabaseAdmin
          .from('usuarios')
          .select('id, email, username, ativo, saldo')
          .eq('id', userId)
          .single();
        
        user = result.data;
        error = result.error;
        retryCount++;
        
        // Se encontrou usuário, parar retry
        if (user && !error) break;
      }

      if (error || !user || !user.ativo) {
        this.log('auth_failed', { connectionId: ws.connectionId, reason: 'user_not_found_or_inactive', retries: retryCount });
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Usuário não encontrado ou inativo' 
        }));
        return;
      }

      ws.authenticated = true;
      ws.userId = userId;
      
      this.clients.set(ws, { 
        userId,
        user: user,
        authenticated: true,
        lastActivity: Date.now(),
        connectionId: ws.connectionId
      });
      
      // Gerar token de reconexão
      const reconnectToken = this.generateReconnectToken(userId);
      
      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        userId,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          saldo: parseFloat(user.saldo || 0)
        },
        reconnectToken
      }));

      this.metrics.authenticatedConnections++;
      this.log('auth_success', { connectionId: ws.connectionId, userId });
    } catch (error) {
      this.log('auth_error', { connectionId: ws.connectionId, error: error.message });
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Token inválido' 
      }));
    }
  }

  async handleReconnect(ws, reconnectToken) {
    try {
      const tokenData = this.reconnectTokens.get(reconnectToken);
      
      if (!tokenData) {
        ws.send(JSON.stringify({ 
          type: 'reconnect_error', 
          message: 'Token de reconexão inválido' 
        }));
        return;
      }
      
      // Verificar se token não expirou
      const now = Date.now();
      if (now - tokenData.createdAt > 5 * 60 * 1000) {
        this.reconnectTokens.delete(reconnectToken);
        ws.send(JSON.stringify({ 
          type: 'reconnect_error', 
          message: 'Token de reconexão expirado' 
        }));
        return;
      }
      
      // Buscar dados do usuário
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, username, ativo, saldo')
        .eq('id', tokenData.userId)
        .single();

      if (error || !user || !user.ativo) {
        ws.send(JSON.stringify({ 
          type: 'reconnect_error', 
          message: 'Usuário não encontrado ou inativo' 
        }));
        return;
      }
      
      ws.authenticated = true;
      ws.userId = tokenData.userId;
      
      this.clients.set(ws, { 
        userId: tokenData.userId,
        user: user,
        authenticated: true,
        lastActivity: Date.now(),
        connectionId: ws.connectionId
      });
      
      // Gerar novo token de reconexão
      const newReconnectToken = this.generateReconnectToken(tokenData.userId);
      
      // Remover token antigo
      this.reconnectTokens.delete(reconnectToken);
      
      ws.send(JSON.stringify({ 
        type: 'reconnect_success', 
        userId: tokenData.userId,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          saldo: parseFloat(user.saldo || 0)
        },
        reconnectToken: newReconnectToken
      }));
      
      this.metrics.authenticatedConnections++;
      this.log('reconnect_success', { connectionId: ws.connectionId, userId: tokenData.userId });
    } catch (error) {
      this.log('reconnect_error', { connectionId: ws.connectionId, error: error.message });
      ws.send(JSON.stringify({ 
        type: 'reconnect_error', 
        message: 'Erro ao reconectar' 
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
      userId: ws.userId
    }, ws); // Não enviar para o próprio cliente

    this.log('room_joined', { connectionId: ws.connectionId, roomId, userId: ws.userId });
  }

  leaveRoom(ws, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      ws.roomId = null;
      ws.send(JSON.stringify({ type: 'room_left', roomId }));
      this.broadcastToRoom(roomId, { 
        type: 'user_left', 
        roomId,
        userId: ws.userId
      }, ws); // Não enviar para o próprio cliente
      
      this.log('room_left', { connectionId: ws.connectionId, roomId, userId: ws.userId });
    }
  }

  handleChatMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.authenticated) {
      ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado' }));
      return;
    }

    // Validar mensagem
    if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'Mensagem inválida' }));
      return;
    }

    // Limitar tamanho da mensagem
    if (data.message.length > 1000) {
      ws.send(JSON.stringify({ type: 'error', message: 'Mensagem muito longa (máximo 1000 caracteres)' }));
      return;
    }

    const message = {
      type: 'chat_message',
      userId: client.userId,
      username: client.user.username || client.user.email,
      message: data.message.trim(),
      timestamp: new Date().toISOString()
    };

    if (ws.roomId) {
      this.broadcastToRoom(ws.roomId, message);
    } else {
      ws.send(JSON.stringify({ type: 'error', message: 'Você não está em nenhuma sala' }));
    }
  }

  broadcastToRoom(roomId, message, excludeWs = null) {
    if (this.rooms.has(roomId)) {
      let sentCount = 0;
      let errorCount = 0;
      
      this.rooms.get(roomId).forEach(client => {
        if (client === excludeWs) return; // Não enviar para cliente excluído
        
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify(message));
            sentCount++;
          } catch (error) {
            this.log('broadcast_error', { connectionId: client.connectionId, error: error.message });
            errorCount++;
          }
        }
      });
      
      if (errorCount > 0) {
        this.log('broadcast_partial', { roomId, sentCount, errorCount });
      }
    }
  }

  broadcastToAll(message, excludeWs = null) {
    let sentCount = 0;
    let errorCount = 0;
    
    this.wss.clients.forEach(client => {
      if (client === excludeWs) return;
      
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          this.log('broadcast_error', { connectionId: client.connectionId, error: error.message });
          errorCount++;
        }
      }
    });
    
    if (errorCount > 0) {
      this.log('broadcast_all_partial', { sentCount, errorCount });
    }
  }

  removeClient(ws) {
    const client = this.clients.get(ws);
    if (client) {
      // ✅ AUDITORIA: Remover todos os listeners para prevenir memory leaks
      try {
        ws.removeAllListeners('message');
        ws.removeAllListeners('close');
        ws.removeAllListeners('error');
        ws.removeAllListeners('pong');
      } catch (error) {
        // Ignorar erros se WebSocket já estiver fechado
        this.log('remove_listeners_warning', { connectionId: ws.connectionId, error: error.message });
      }
      
      // Remover de salas
      if (ws.roomId) {
        this.leaveRoom(ws, ws.roomId);
      }
      
      // Remover token de reconexão se existir
      if (ws.userId) {
        this.reconnectTokens.forEach((data, token) => {
          if (data.userId === ws.userId) {
            this.reconnectTokens.delete(token);
          }
        });
      }
      
      this.clients.delete(ws);
      
      if (client.authenticated) {
        this.metrics.authenticatedConnections--;
      }
      
      this.log('client_removed', { 
        connectionId: ws.connectionId,
        userId: ws.userId,
        authenticated: client.authenticated
      });
    }
  }

  getStats() {
    return {
      ...this.metrics,
      activeConnections: this.wss.clients.size,
      authenticatedConnections: this.metrics.authenticatedConnections,
      totalRooms: this.rooms.size,
      reconnectTokens: this.reconnectTokens.size
    };
  }

  log(event, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data
    };
    
    // Log estruturado (pode ser enviado para sistema de logs)
    console.log(`[WS] ${event}:`, JSON.stringify(logEntry));
  }
}

module.exports = WebSocketManager;
