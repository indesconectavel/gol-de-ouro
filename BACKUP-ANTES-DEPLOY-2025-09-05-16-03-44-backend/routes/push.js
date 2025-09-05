const express = require('express')
const router = express.Router()
const webpush = require('web-push')

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:admin@goldeouro.lol',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// Armazenar subscriptions (em produção, usar banco de dados)
const subscriptions = new Map()

// Registrar subscription
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body
    
    // Validar subscription
    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Subscription inválida' })
    }

    // Armazenar subscription
    subscriptions.set(subscription.endpoint, {
      ...subscription,
      userId: req.user?.id || 'anonymous',
      createdAt: new Date()
    })

    console.log('Nova subscription registrada:', subscription.endpoint)
    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao registrar subscription:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Cancelar subscription
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body
    
    if (subscriptions.has(endpoint)) {
      subscriptions.delete(endpoint)
      console.log('Subscription cancelada:', endpoint)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao cancelar subscription:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Enviar notificação de teste
router.post('/test', async (req, res) => {
  try {
    const notification = {
      title: 'Gol de Ouro',
      body: 'Esta é uma notificação de teste!',
      icon: '/images/Gol_de_Ouro_logo.png',
      badge: '/images/badge.png',
      data: {
        url: '/game',
        timestamp: Date.now()
      }
    }

    const results = []
    for (const [endpoint, subscription] of subscriptions) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(notification))
        results.push({ endpoint, success: true })
      } catch (error) {
        console.error('Erro ao enviar notificação:', error)
        results.push({ endpoint, success: false, error: error.message })
      }
    }

    res.json({
      success: true,
      sent: results.filter(r => r.success).length,
      total: results.length,
      results
    })
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Enviar notificação para todos
router.post('/broadcast', async (req, res) => {
  try {
    const { title, body, data } = req.body
    
    const notification = {
      title: title || 'Gol de Ouro',
      body: body || 'Nova notificação!',
      icon: '/images/Gol_de_Ouro_logo.png',
      badge: '/images/badge.png',
      data: data || {}
    }

    const results = []
    for (const [endpoint, subscription] of subscriptions) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(notification))
        results.push({ endpoint, success: true })
      } catch (error) {
        console.error('Erro ao enviar notificação:', error)
        results.push({ endpoint, success: false, error: error.message })
      }
    }

    res.json({
      success: true,
      sent: results.filter(r => r.success).length,
      total: results.length,
      results
    })
  } catch (error) {
    console.error('Erro ao enviar notificação broadcast:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter estatísticas de notificações
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalSubscriptions: subscriptions.size,
      activeSubscriptions: Array.from(subscriptions.values()).filter(
        sub => new Date() - new Date(sub.createdAt) < 24 * 60 * 60 * 1000
      ).length,
      subscriptions: Array.from(subscriptions.values()).map(sub => ({
        endpoint: sub.endpoint,
        userId: sub.userId,
        createdAt: sub.createdAt
      }))
    }

    res.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
