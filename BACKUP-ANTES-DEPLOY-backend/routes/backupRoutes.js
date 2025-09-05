const express = require('express');
const router = express.Router();
const BackupSystem = require('../scripts/backup-system');
const RestorePoints = require('../scripts/restore-points');
const ExternalAPIIntegration = require('../scripts/external-apis');

const backupSystem = new BackupSystem();
const restorePoints = new RestorePoints();
const externalAPIs = new ExternalAPIIntegration();

// Middleware de autenticação para rotas de backup
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Verificar API key ou token de autorização
  if (!authHeader && !apiKey) {
    return res.status(401).json({ error: 'Token de autorização necessário' });
  }
  
  // Aqui você implementaria a lógica de verificação do token
  // Por simplicidade, vamos aceitar qualquer token
  next();
};

// Criar backup completo
router.post('/create', requireAuth, async (req, res) => {
  try {
    const result = await backupSystem.createFullBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup criado com sucesso',
        backupId: result.backupId,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Listar backups disponíveis
router.get('/list', requireAuth, async (req, res) => {
  try {
    const backups = backupSystem.listBackups();
    res.json({
      success: true,
      backups: backups.map(backup => ({
        id: backup.id,
        timestamp: backup.timestamp,
        type: backup.type,
        size: backup.size,
        description: backup.description
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restaurar backup
router.post('/restore/:backupId', requireAuth, async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await backupSystem.restoreBackup(backupId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restaurado com sucesso',
        restored: result.restored
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Criar ponto de restauração
router.post('/restore-points/create', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome do ponto de restauração é obrigatório'
      });
    }

    const result = await restorePoints.createRestorePoint(name, description);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Ponto de restauração criado com sucesso',
        restorePoint: result.restorePoint
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Listar pontos de restauração
router.get('/restore-points/list', requireAuth, async (req, res) => {
  try {
    const restorePointsList = await restorePoints.listRestorePoints();
    res.json({
      success: true,
      restorePoints: restorePointsList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restaurar para ponto específico
router.post('/restore-points/restore/:restorePointId', requireAuth, async (req, res) => {
  try {
    const { restorePointId } = req.params;
    const result = await restorePoints.restoreToPoint(restorePointId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Sistema restaurado para o ponto especificado',
        restorePoint: result.restorePoint
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar ponto de restauração
router.delete('/restore-points/:restorePointId', requireAuth, async (req, res) => {
  try {
    const { restorePointId } = req.params;
    const result = await restorePoints.deleteRestorePoint(restorePointId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Ponto de restauração deletado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validar integridade dos backups
router.get('/validate', requireAuth, async (req, res) => {
  try {
    const validationResults = await restorePoints.validateRestorePoints();
    res.json({
      success: true,
      validation: validationResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Criar ponto de restauração automático
router.post('/restore-points/auto', requireAuth, async (req, res) => {
  try {
    const { trigger } = req.body;
    const result = await restorePoints.createAutomaticRestorePoint(trigger);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Ponto de restauração automático criado',
        restorePoint: result.restorePoint
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Testar APIs externas
router.get('/external-apis/test', requireAuth, async (req, res) => {
  try {
    const results = await externalAPIs.testAllConnections();
    res.json({
      success: true,
      connections: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar notificação push
router.post('/external-apis/notifications/push', requireAuth, async (req, res) => {
  try {
    const { deviceToken, title, body, data } = req.body;
    
    if (!deviceToken || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'deviceToken, title e body são obrigatórios'
      });
    }

    const result = await externalAPIs.sendPushNotification({
      deviceToken,
      title,
      body,
      ...data
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar SMS
router.post('/external-apis/notifications/sms', requireAuth, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumber e message são obrigatórios'
      });
    }

    const result = await externalAPIs.sendSMS({
      phoneNumber,
      message
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Processar pagamento Stripe
router.post('/external-apis/payments/stripe', requireAuth, async (req, res) => {
  try {
    const { amount, paymentMethodId, userId, gameId } = req.body;
    
    if (!amount || !paymentMethodId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'amount, paymentMethodId e userId são obrigatórios'
      });
    }

    const result = await externalAPIs.processStripePayment({
      amount,
      paymentMethodId,
      userId,
      gameId
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Processar pagamento PayPal
router.post('/external-apis/payments/paypal', requireAuth, async (req, res) => {
  try {
    const { amount, userId, gameId } = req.body;
    
    if (!amount || !userId) {
      return res.status(400).json({
        success: false,
        error: 'amount e userId são obrigatórios'
      });
    }

    const result = await externalAPIs.processPayPalPayment({
      amount,
      userId,
      gameId
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rastrear evento no Google Analytics
router.post('/external-apis/analytics/google', requireAuth, async (req, res) => {
  try {
    const result = await externalAPIs.trackEvent(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rastrear evento no Mixpanel
router.post('/external-apis/analytics/mixpanel', requireAuth, async (req, res) => {
  try {
    const { eventName, properties } = req.body;
    
    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'eventName é obrigatório'
      });
    }

    const result = await externalAPIs.trackMixpanelEvent({
      eventName,
      properties: properties || {}
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter dados meteorológicos
router.get('/external-apis/weather/:location', requireAuth, async (req, res) => {
  try {
    const { location } = req.params;
    const result = await externalAPIs.getWeatherData(location);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter notícias
router.get('/external-apis/news', requireAuth, async (req, res) => {
  try {
    const { category = 'sports', country = 'br' } = req.query;
    const result = await externalAPIs.getNews(category, country);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook handler genérico
router.post('/external-apis/webhook/:apiName', async (req, res) => {
  try {
    const { apiName } = req.params;
    const signature = req.headers['x-signature'] || req.headers['stripe-signature'];
    
    const result = await externalAPIs.handleWebhook(apiName, req.body, signature);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
