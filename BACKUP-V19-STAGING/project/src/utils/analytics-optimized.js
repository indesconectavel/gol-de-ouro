/**
 * Sistema de Analytics Otimizado - Sem Vazamentos de Memória
 * ETAPA 5 - Analytics e Monitoramento (Versão Otimizada)
 */

const { analytics, business } = require('./logger');
const { recordBusinessMetric } = require('./metrics');

class OptimizedAnalyticsCollector {
  constructor() {
    // Limitar tamanho dos Maps para evitar vazamentos
    this.maxEvents = 1000; // Máximo de eventos em memória
    this.maxSessions = 500; // Máximo de sessões em memória
    
    this.events = new Map();
    this.sessionData = new Map();
    
    this.realTimeMetrics = {
      activeUsers: 0,
      activeGames: 0,
      totalBets: 0,
      totalRevenue: 0,
      averageGameDuration: 0,
      conversionRate: 0
    };
    
    // Iniciar limpeza automática
    this.startCleanup();
  }

  // ===== LIMPEZA AUTOMÁTICA DE MEMÓRIA =====
  
  startCleanup() {
    // Limpeza a cada 5 minutos
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);
    
    // Limpeza de emergência se memória estiver alta
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (memPercent > 80) {
        console.log(`🧹 Limpeza de emergência - Memória: ${memPercent.toFixed(2)}%`);
        this.emergencyCleanup();
      }
    }, 30 * 1000); // Verificar a cada 30 segundos
  }

  cleanupOldData() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos
    
    // Limpar eventos antigos
    for (const [key, event] of this.events.entries()) {
      if (now - new Date(event.timestamp).getTime() > maxAge) {
        this.events.delete(key);
      }
    }
    
    // Limpar sessões antigas
    for (const [key, session] of this.sessionData.entries()) {
      if (now - new Date(session.lastActivity).getTime() > maxAge) {
        this.sessionData.delete(key);
      }
    }
    
    // Limitar tamanho dos Maps
    if (this.events.size > this.maxEvents) {
      const entries = Array.from(this.events.entries());
      entries.sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));
      
      this.events.clear();
      entries.slice(0, this.maxEvents).forEach(([key, value]) => {
        this.events.set(key, value);
      });
    }
    
    if (this.sessionData.size > this.maxSessions) {
      const entries = Array.from(this.sessionData.entries());
      entries.sort((a, b) => new Date(b[1].lastActivity) - new Date(a[1].lastActivity));
      
      this.sessionData.clear();
      entries.slice(0, this.maxSessions).forEach(([key, value]) => {
        this.sessionData.set(key, value);
      });
    }
  }

  emergencyCleanup() {
    // Limpeza agressiva em caso de memória alta
    this.events.clear();
    this.sessionData.clear();
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    console.log('🚨 Limpeza de emergência executada');
  }

  // ===== EVENTOS DE USUÁRIO (OTIMIZADOS) =====
  
  trackUserRegistration(userData) {
    const event = {
      type: 'user_registration',
      userId: userData.id,
      email: userData.email,
      timestamp: new Date().toISOString(),
      metadata: {
        source: userData.source || 'direct'
      }
    };
    
    this.logEvent(event);
    this.updateRealTimeMetrics('user_registration');
  }

  trackUserLogin(userData) {
    const event = {
      type: 'user_login',
      userId: userData.id,
      email: userData.email,
      timestamp: new Date().toISOString(),
      metadata: {
        loginMethod: userData.method || 'email'
      }
    };
    
    this.logEvent(event);
    this.updateRealTimeMetrics('user_login');
  }

  trackUserLogout(userData) {
    const event = {
      type: 'user_logout',
      userId: userData.id,
      timestamp: new Date().toISOString()
    };
    
    this.logEvent(event);
    this.updateRealTimeMetrics('user_logout');
  }

  // ===== EVENTOS DE JOGO (OTIMIZADOS) =====
  
  trackGameCreated(gameData) {
    const event = {
      type: 'game_created',
      gameId: gameData.id,
      userId: gameData.userId,
      timestamp: new Date().toISOString(),
      metadata: {
        gameType: gameData.type || 'standard',
        betAmount: gameData.betAmount
      }
    };
    
    this.logEvent(event);
    recordBusinessMetric('game_created', {
      gameType: gameData.type,
      status: 'created'
    });
    
    this.updateRealTimeMetrics('game_created');
  }

  trackGameJoined(gameData) {
    const event = {
      type: 'game_joined',
      gameId: gameData.gameId,
      userId: gameData.userId,
      timestamp: new Date().toISOString(),
      metadata: {
        playerCount: gameData.playerCount
      }
    };
    
    this.logEvent(event);
    this.updateRealTimeMetrics('game_joined');
  }

  trackGameFinished(gameData) {
    const event = {
      type: 'game_finished',
      gameId: gameData.id,
      timestamp: new Date().toISOString(),
      metadata: {
        duration: gameData.duration,
        winner: gameData.winner,
        totalPayout: gameData.totalPayout
      }
    };
    
    this.logEvent(event);
    this.updateRealTimeMetrics('game_finished', {
      duration: gameData.duration,
      totalPayout: gameData.totalPayout
    });
  }

  // ===== EVENTOS DE APOSTAS (OTIMIZADOS) =====
  
  trackBetPlaced(betData) {
    const event = {
      type: 'bet_placed',
      betId: betData.id,
      userId: betData.userId,
      gameId: betData.gameId,
      timestamp: new Date().toISOString(),
      metadata: {
        amount: betData.amount,
        betType: betData.type,
        prediction: betData.prediction
      }
    };
    
    this.logEvent(event);
    recordBusinessMetric('bet_placed', {
      betType: betData.type,
      result: 'placed'
    });
    
    this.updateRealTimeMetrics('bet_placed', {
      amount: betData.amount
    });
  }

  // ===== EVENTOS DE PAGAMENTO (OTIMIZADOS) =====
  
  trackPaymentCompleted(paymentData) {
    const event = {
      type: 'payment_completed',
      paymentId: paymentData.id,
      userId: paymentData.userId,
      timestamp: new Date().toISOString(),
      metadata: {
        amount: paymentData.amount,
        method: paymentData.method
      }
    };
    
    this.logEvent(event);
    recordBusinessMetric('payment_processed', {
      paymentMethod: paymentData.method,
      status: 'completed'
    });
    
    this.updateRealTimeMetrics('payment_completed', {
      amount: paymentData.amount
    });
  }

  // ===== EVENTOS DE SEGURANÇA (OTIMIZADOS) =====
  
  trackSecurityEvent(securityData) {
    const event = {
      type: 'security_event',
      timestamp: new Date().toISOString(),
      metadata: {
        eventType: securityData.eventType,
        severity: securityData.severity,
        ip: securityData.ip,
        userId: securityData.userId
      }
    };
    
    this.logEvent(event);
    recordBusinessMetric('error', {
      errorType: 'security',
      component: securityData.eventType
    });
  }

  // ===== MÉTRICAS EM TEMPO REAL (OTIMIZADAS) =====
  
  updateRealTimeMetrics(eventType, data = {}) {
    switch (eventType) {
      case 'user_login':
        this.realTimeMetrics.activeUsers++;
        break;
        
      case 'user_logout':
        this.realTimeMetrics.activeUsers = Math.max(0, this.realTimeMetrics.activeUsers - 1);
        break;
        
      case 'game_created':
        this.realTimeMetrics.activeGames++;
        break;
        
      case 'game_finished':
        this.realTimeMetrics.activeGames = Math.max(0, this.realTimeMetrics.activeGames - 1);
        if (data.duration) {
          this.updateAverageGameDuration(data.duration);
        }
        if (data.totalPayout) {
          this.realTimeMetrics.totalRevenue += data.totalPayout;
        }
        break;
        
      case 'bet_placed':
        this.realTimeMetrics.totalBets++;
        break;
        
      case 'payment_completed':
        if (data.amount) {
          this.realTimeMetrics.totalRevenue += data.amount;
        }
        break;
    }
    
    this.updateConversionRate();
  }

  updateAverageGameDuration(newDuration) {
    const currentAvg = this.realTimeMetrics.averageGameDuration;
    const gameCount = this.realTimeMetrics.totalBets || 1;
    
    this.realTimeMetrics.averageGameDuration = 
      (currentAvg * (gameCount - 1) + newDuration) / gameCount;
  }

  updateConversionRate() {
    const totalUsers = this.realTimeMetrics.activeUsers;
    const totalBets = this.realTimeMetrics.totalBets;
    
    if (totalUsers > 0) {
      this.realTimeMetrics.conversionRate = (totalBets / totalUsers) * 100;
    }
  }

  // ===== FUNÇÕES UTILITÁRIAS (OTIMIZADAS) =====
  
  logEvent(event) {
    // Usar ID único baseado em timestamp para evitar colisões
    const eventId = `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Verificar se precisa limpar antes de adicionar
    if (this.events.size >= this.maxEvents) {
      this.cleanupOldData();
    }
    
    this.events.set(eventId, event);
    analytics(event.type, event);
  }

  getRealTimeMetrics() {
    return {
      ...this.realTimeMetrics,
      timestamp: new Date().toISOString(),
      memoryUsage: {
        events: this.events.size,
        sessions: this.sessionData.size,
        maxEvents: this.maxEvents,
        maxSessions: this.maxSessions
      }
    };
  }

  getEventHistory(eventType, limit = 50) {
    // Reduzir limite padrão para economizar memória
    const events = Array.from(this.events.values())
      .filter(event => !eventType || event.type === eventType)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return events;
  }

  // ===== RELATÓRIOS OTIMIZADOS =====
  
  generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = Array.from(this.events.values())
      .filter(event => event.timestamp.startsWith(today));
    
    const report = {
      date: today,
      totalEvents: todayEvents.length,
      uniqueUsers: new Set(todayEvents.map(e => e.userId)).size,
      gamesCreated: todayEvents.filter(e => e.type === 'game_created').length,
      betsPlaced: todayEvents.filter(e => e.type === 'bet_placed').length,
      paymentsCompleted: todayEvents.filter(e => e.type === 'payment_completed').length,
      totalRevenue: todayEvents
        .filter(e => e.type === 'payment_completed')
        .reduce((sum, e) => sum + (e.metadata.amount || 0), 0),
      memoryStats: {
        eventsInMemory: this.events.size,
        sessionsInMemory: this.sessionData.size
      }
    };
    
    business('daily_report', report);
    return report;
  }

  // ===== FUNÇÕES DE DIAGNÓSTICO =====
  
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      heapPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      eventsInMemory: this.events.size,
      sessionsInMemory: this.sessionData.size,
      maxEvents: this.maxEvents,
      maxSessions: this.maxSessions
    };
  }

  forceCleanup() {
    this.cleanupOldData();
    if (global.gc) {
      global.gc();
    }
    return this.getMemoryStats();
  }
}

// Instância singleton otimizada
const analyticsCollector = new OptimizedAnalyticsCollector();

module.exports = analyticsCollector;
