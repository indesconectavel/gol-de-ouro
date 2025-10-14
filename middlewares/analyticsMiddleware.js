/**
 * Middleware de Analytics
 * ETAPA 5 - Analytics e Monitoramento
 */

const analyticsCollector = require('./src/utils/analytics');
const { recordBusinessMetric } = require('./src/utils/metrics');

// Middleware para rastrear eventos de API
const trackApiEvent = (eventType) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para registrar métricas
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Registrar métrica de API
      analyticsCollector.trackApiCall({
        userId: req.user?.id || null,
        endpoint: req.path,
        method: req.method,
        responseTime: duration,
        statusCode: res.statusCode,
        error: res.statusCode >= 400 ? 'API_ERROR' : null
      });
      
      // Registrar métrica de negócio se aplicável
      if (eventType) {
        recordBusinessMetric(eventType, {
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para rastrear eventos de usuário
const trackUserEvent = (eventType, extractData = null) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para registrar evento
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode < 400 && req.user) {
        const eventData = extractData ? extractData(req, data) : {};
        
        switch (eventType) {
          case 'user_login':
            analyticsCollector.trackUserLogin({
              id: req.user.id,
              email: req.user.email,
              method: 'api',
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              ...eventData
            });
            break;
            
          case 'user_registration':
            analyticsCollector.trackUserRegistration({
              id: req.user.id,
              email: req.user.email,
              source: 'api',
              userAgent: req.get('User-Agent'),
              ...eventData
            });
            break;
            
          case 'game_created':
            analyticsCollector.trackGameCreated({
              id: eventData.gameId || `game-${Date.now()}`,
              userId: req.user.id,
              type: eventData.gameType || 'standard',
              betAmount: eventData.betAmount || 0,
              maxPlayers: eventData.maxPlayers || 2,
              ...eventData
            });
            break;
            
          case 'bet_placed':
            analyticsCollector.trackBetPlaced({
              id: eventData.betId || `bet-${Date.now()}`,
              userId: req.user.id,
              gameId: eventData.gameId,
              amount: eventData.amount || 0,
              type: eventData.betType || 'standard',
              prediction: eventData.prediction,
              ...eventData
            });
            break;
            
          case 'payment_initiated':
            analyticsCollector.trackPaymentInitiated({
              id: eventData.paymentId || `payment-${Date.now()}`,
              userId: req.user.id,
              amount: eventData.amount || 0,
              method: eventData.method || 'unknown',
              currency: eventData.currency || 'BRL',
              ...eventData
            });
            break;
            
          case 'payment_completed':
            analyticsCollector.trackPaymentCompleted({
              id: eventData.paymentId || `payment-${Date.now()}`,
              userId: req.user.id,
              amount: eventData.amount || 0,
              method: eventData.method || 'unknown',
              transactionId: eventData.transactionId,
              processingTime: Date.now() - startTime,
              ...eventData
            });
            break;
        }
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para rastrear eventos de segurança
const trackSecurityEvent = (eventType, severity = 'warning') => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para registrar evento de segurança
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 400) {
        analyticsCollector.trackSecurityEvent({
          eventType,
          severity,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id || null,
          details: {
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            error: data.error || 'Unknown error',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para rastrear performance de banco de dados
const trackDatabaseQuery = (queryType, table) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para registrar métrica de banco
    const originalSend = res.send;
    res.send = function(data) {
      const duration = (Date.now() - startTime) / 1000; // em segundos
      
      // Registrar métrica de banco de dados
      const { recordDatabaseQuery } = require('./src/utils/metrics');
      recordDatabaseQuery(queryType, table, duration);
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  trackApiEvent,
  trackUserEvent,
  trackSecurityEvent,
  trackDatabaseQuery
};
