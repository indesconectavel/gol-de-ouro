// WebSocket Service - Gol de Ouro Mobile v2.0.0
// CORRIGIDO PARA COMPATIBILIDADE COM BACKEND REAL
// Data: 17/11/2025
// Status: FASE 1 - Correção Crítica
//
// Este WebSocket é compatível com o backend real:
// - Autenticação via mensagem 'auth' após conexão
// - Eventos básicos: welcome, auth_success, auth_error, reconnect, pong
// - Sistema de salas: join_room, leave_room
// - Chat: chat_message
// - Reconexão automática com token
// - Heartbeat com ping/pong
//
// ⚠️ IMPORTANTE: Sistema de jogo usa HTTP POST /api/games/shoot, NÃO WebSocket
// ⚠️ IMPORTANTE: Não há eventos de fila/partidas no backend real
import { WS_BASE_URL } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Começa com 1 segundo
    this.maxReconnectDelay = 30000; // Máximo de 30 segundos
    this.isConnecting = false;
    this.isConnected = false;
    this.isAuthenticated = false; // Estado de autenticação separado
    this.listeners = new Map();
    this.messageQueue = [];
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.reconnectToken = null; // Token de reconexão do backend
    this.userId = null; // ID do usuário autenticado
    this.user = null; // Dados do usuário
  }

  // Conectar ao WebSocket
  async connect() {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    try {
      this.isConnecting = true;
      
      // URL do WebSocket SEM token na query string
      // Backend não autentica via URL, espera mensagem 'auth'
      let wsUrl = WS_BASE_URL;
      if (WS_BASE_URL.startsWith('wss://') || WS_BASE_URL.startsWith('ws://')) {
        // Se já tem protocolo, usar diretamente
        wsUrl = `${WS_BASE_URL}/ws`;
      } else {
        // Construir URL manualmente
        const protocol = WS_BASE_URL.startsWith('https') ? 'wss' : 'ws';
        const host = WS_BASE_URL.replace(/^https?:\/\//, '');
        wsUrl = `${protocol}://${host}/ws`;
      }
      
      console.log('🔌 [WS] Conectando ao WebSocket:', wsUrl);

      // React Native WebSocket
      this.ws = new WebSocket(wsUrl);

      // Eventos do WebSocket
      this.ws.onopen = async () => {
        console.log('✅ [WS] Conectado com sucesso');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Aguardar mensagem 'welcome' antes de autenticar
        // A autenticação será feita após receber 'welcome'
        
        // Iniciar heartbeat
        this.startHeartbeat();
        
        // Notificar listeners
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [WS] Mensagem recebida:', data.type);
          
          // Processar mensagem
          this.handleMessage(data);
          
          // Notificar listeners específicos pelo tipo
          if (data.type) {
            this.emit(data.type, data);
          }
          
          // Notificar listener genérico
          this.emit('message', data);
        } catch (error) {
          console.error('❌ [WS] Erro ao processar mensagem:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ [WS] Erro no WebSocket:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onclose = (event) => {
        console.log('🔌 [WS] Conexão fechada:', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();
        
        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
        
        this.emit('disconnected', event);
      };

      // Tratar pong nativo do WebSocket
      this.ws.on('pong', () => {
        console.log('🏓 [WS] Pong recebido (nativo)');
        // Backend também pode enviar pong via JSON, mas tratamos o nativo aqui
      });

    } catch (error) {
      console.error('❌ [WS] Erro ao conectar:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Desconectar
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexão intencional');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.reconnectToken = null;
    this.userId = null;
    this.user = null;
  }

  // Agendar reconexão
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ [WS] Máximo de tentativas de reconexão atingido');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`🔄 [WS] Reconectando em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Enviar mensagem
  send(type, data = {}) {
    const message = {
      type,
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 [WS] Mensagem enviada:', type);
      } catch (error) {
        console.error('❌ [WS] Erro ao enviar mensagem:', error);
        // Adicionar à fila para tentar novamente depois
        this.messageQueue.push(message);
      }
    } else {
      // Adicionar à fila se não estiver conectado
      console.warn('⚠️ [WS] Não conectado, adicionando à fila:', type);
      this.messageQueue.push(message);
    }
  }

  // Enviar mensagens na fila
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 [WS] Mensagem da fila enviada:', message.type);
      } catch (error) {
        console.error('❌ [WS] Erro ao enviar mensagem da fila:', error);
        // Recolocar na fila
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  // Processar mensagem recebida
  handleMessage(data) {
    switch (data.type) {
      case 'welcome':
        // Mensagem de boas-vindas - agora podemos autenticar
        console.log('👋 [WS] Bem-vindo:', data.message);
        this.authenticate();
        break;
      
      case 'auth_success':
        // Autenticação bem-sucedida
        console.log('✅ [WS] Autenticado com sucesso');
        this.isAuthenticated = true;
        this.userId = data.userId;
        this.user = data.user;
        this.reconnectToken = data.reconnectToken;
        
        // Salvar token de reconexão
        if (data.reconnectToken) {
          AsyncStorage.setItem('wsReconnectToken', data.reconnectToken);
        }
        
        // Enviar mensagens na fila
        this.flushMessageQueue();
        
        this.emit('authenticated', data);
        break;
      
      case 'auth_error':
        // Erro de autenticação
        console.error('❌ [WS] Erro de autenticação:', data.message);
        this.isAuthenticated = false;
        this.emit('authError', data);
        break;
      
      case 'reconnect_success':
        // Reconexão bem-sucedida
        console.log('✅ [WS] Reconectado com sucesso');
        this.isAuthenticated = true;
        this.userId = data.userId;
        this.user = data.user;
        this.reconnectToken = data.reconnectToken;
        
        // Salvar novo token de reconexão
        if (data.reconnectToken) {
          AsyncStorage.setItem('wsReconnectToken', data.reconnectToken);
        }
        
        this.emit('reconnected', data);
        break;
      
      case 'reconnect_error':
        // Erro na reconexão - tentar autenticação normal
        console.error('❌ [WS] Erro na reconexão:', data.message);
        this.authenticate();
        break;
      
      case 'room_joined':
        // Entrou em uma sala
        console.log('🚪 [WS] Entrou na sala:', data.roomId);
        this.emit('roomJoined', data);
        break;
      
      case 'room_left':
        // Saiu de uma sala
        console.log('🚪 [WS] Saiu da sala:', data.roomId);
        this.emit('roomLeft', data);
        break;
      
      case 'user_joined':
        // Usuário entrou na sala
        console.log('👤 [WS] Usuário entrou:', data.userId);
        this.emit('userJoined', data);
        break;
      
      case 'user_left':
        // Usuário saiu da sala
        console.log('👤 [WS] Usuário saiu:', data.userId);
        this.emit('userLeft', data);
        break;
      
      case 'chat_message':
        // Mensagem de chat
        console.log('💬 [WS] Mensagem de chat:', data.message);
        this.emit('chatMessage', data);
        break;
      
      case 'pong':
        // Resposta ao ping (JSON)
        console.log('🏓 [WS] Pong recebido (JSON)');
        this.emit('pong', data);
        break;
      
      case 'stats':
        // Estatísticas do servidor
        console.log('📊 [WS] Estatísticas recebidas');
        this.emit('stats', data);
        break;
      
      case 'error':
        // Erro do servidor
        console.error('❌ [WS] Erro do servidor:', data.message || data.error);
        this.emit('serverError', data);
        break;
      
      default:
        // Mensagem desconhecida - apenas logar, não bloquear
        console.warn('⚠️ [WS] Tipo de mensagem desconhecido:', data.type);
        this.emit('unknownMessage', data);
    }
  }

  // Autenticar após conexão
  async authenticate() {
    try {
      // Tentar usar token de reconexão primeiro
      const reconnectToken = await AsyncStorage.getItem('wsReconnectToken');
      
      if (reconnectToken) {
        console.log('🔄 [WS] Tentando reconexão com token...');
        this.send('reconnect', { token: reconnectToken });
        return;
      }
      
      // Se não tem token de reconexão, usar token JWT normal
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.warn('⚠️ [WS] Token de autenticação não encontrado');
        this.emit('authError', { message: 'Token não encontrado' });
        return;
      }
      
      console.log('🔐 [WS] Autenticando com token JWT...');
      this.send('auth', { token: authToken });
    } catch (error) {
      console.error('❌ [WS] Erro ao autenticar:', error);
      this.emit('authError', { message: error.message });
    }
  }

  // Heartbeat para manter conexão viva
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Enviar ping via JSON (backend responde com pong JSON)
        this.send('ping');
      }
    }, 30000); // A cada 30 segundos (mesmo intervalo do backend)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Sistema de eventos/listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [WS] Erro no listener de ${event}:`, error);
        }
      });
    }
  }

  // Métodos específicos do backend real
  
  // Entrar em uma sala
  joinRoom(roomId) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ [WS] Não autenticado, não é possível entrar na sala');
      return;
    }
    this.send('join_room', { room: roomId });
  }

  // Sair de uma sala
  leaveRoom(roomId) {
    this.send('leave_room', { room: roomId });
  }

  // Enviar mensagem de chat
  sendChatMessage(message, roomId) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ [WS] Não autenticado, não é possível enviar mensagem');
      return;
    }
    this.send('chat_message', { message, room: roomId });
  }

  // Obter estatísticas do servidor
  getStats() {
    if (!this.isAuthenticated) {
      console.warn('⚠️ [WS] Não autenticado, não é possível obter estatísticas');
      return;
    }
    this.send('get_stats');
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get connecting() {
    return this.isConnecting;
  }

  get authenticated() {
    return this.isAuthenticated;
  }

  get currentUser() {
    return this.user;
  }

  get currentUserId() {
    return this.userId;
  }
}

export default new WebSocketService();
