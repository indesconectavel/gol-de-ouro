// Sistema de Notificações Push - Gol de Ouro v1.2.0
// ================================================
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

class NotificationService {
  constructor() {
    // Configuração do Web Push
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8p7zKj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8Kj2f8jK8'
    };

    webpush.setVapidDetails(
      'mailto:contato@goldeouro.lol',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Registrar subscription do usuário
  async registerSubscription(userId, subscription) {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .upsert({
          usuario_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [NOTIFICATIONS] Erro ao registrar subscription:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ [NOTIFICATIONS] Subscription registrada para usuário ${userId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificação de depósito aprovado
  async sendDepositNotification(userId, amount) {
    const notification = {
      title: '💰 Depósito Aprovado!',
      body: `Seu depósito de R$ ${amount.toFixed(2)} foi aprovado e creditado na sua conta.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'deposit',
        amount: amount,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Saldo',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'play',
          title: 'Jogar Agora',
          icon: '/icons/play-icon.png'
        }
      ]
    };

    return await this.sendNotification(userId, notification);
  }

  // Enviar notificação de premiação
  async sendPrizeNotification(userId, prize, isGolDeOuro = false) {
    const title = isGolDeOuro ? '🏆 GOL DE OURO!' : '🎉 Prêmio Recebido!';
    const body = isGolDeOuro 
      ? `PARABÉNS! Você acertou o Gol de Ouro e ganhou R$ ${prize.toFixed(2)}!`
      : `Você ganhou R$ ${prize.toFixed(2)}! Continue jogando!`;

    const notification = {
      title: title,
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'prize',
        amount: prize,
        isGolDeOuro: isGolDeOuro,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Prêmio',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'play',
          title: 'Jogar Novamente',
          icon: '/icons/play-icon.png'
        }
      ]
    };

    return await this.sendNotification(userId, notification);
  }

  // Enviar notificação de saque processado
  async sendWithdrawNotification(userId, amount) {
    const notification = {
      title: '💸 Saque Processado!',
      body: `Seu saque de R$ ${amount.toFixed(2)} foi processado e será enviado em até 24h.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'withdraw',
        amount: amount,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Histórico',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    return await this.sendNotification(userId, notification);
  }

  // Enviar notificação de promoção especial
  async sendPromotionNotification(userId, message, actionUrl = null) {
    const notification = {
      title: '🎁 Promoção Especial!',
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'promotion',
        timestamp: Date.now(),
        actionUrl: actionUrl
      },
      actions: actionUrl ? [
        {
          action: 'view',
          title: 'Ver Promoção',
          icon: '/icons/view-icon.png'
        }
      ] : []
    };

    return await this.sendNotification(userId, notification);
  }

  // Enviar notificação genérica
  async sendNotification(userId, notification) {
    try {
      // Buscar subscriptions do usuário
      const { data: subscriptions, error } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('usuario_id', userId);

      if (error) {
        console.error('❌ [NOTIFICATIONS] Erro ao buscar subscriptions:', error);
        return { success: false, error: error.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`⚠️ [NOTIFICATIONS] Usuário ${userId} não possui subscriptions`);
        return { success: false, error: 'Usuário não possui subscriptions' };
      }

      // Enviar para todas as subscriptions do usuário
      const results = [];
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          const result = await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notification)
          );

          results.push({ success: true, subscription: subscription.id });
          console.log(`✅ [NOTIFICATIONS] Notificação enviada para usuário ${userId}`);

        } catch (error) {
          console.error(`❌ [NOTIFICATIONS] Erro ao enviar para subscription ${subscription.id}:`, error);
          
          // Se a subscription é inválida, remover do banco
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.supabase
              .from('user_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`🗑️ [NOTIFICATIONS] Subscription inválida removida: ${subscription.id}`);
          }

          results.push({ success: false, subscription: subscription.id, error: error.message });
        }
      }

      // Salvar notificação no histórico
      await this.saveNotificationHistory(userId, notification);

      return {
        success: results.some(r => r.success),
        results: results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      };

    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Salvar histórico de notificações
  async saveNotificationHistory(userId, notification) {
    try {
      const { error } = await this.supabase
        .from('notification_history')
        .insert({
          usuario_id: userId,
          title: notification.title,
          body: notification.body,
          type: notification.data?.type || 'general',
          data: notification.data,
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [NOTIFICATIONS] Erro ao salvar histórico:', error);
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Erro inesperado ao salvar histórico:', error);
    }
  }

  // Enviar notificação para múltiplos usuários
  async sendBulkNotification(userIds, notification) {
    const results = [];
    
    for (const userId of userIds) {
      const result = await this.sendNotification(userId, notification);
      results.push({ userId, ...result });
    }

    return {
      success: results.some(r => r.success),
      results: results,
      totalUsers: userIds.length,
      successfulUsers: results.filter(r => r.success).length
    };
  }

  // Obter histórico de notificações do usuário
  async getNotificationHistory(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('notification_history')
        .select('*')
        .eq('usuario_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [NOTIFICATIONS] Erro ao buscar histórico:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Estatísticas de notificações
  async getNotificationStats() {
    try {
      const { data, error } = await this.supabase
        .from('notification_history')
        .select('type, sent_at')
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('❌ [NOTIFICATIONS] Erro ao buscar estatísticas:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total: data.length,
        byType: {},
        last24h: data.length
      };

      data.forEach(notification => {
        const type = notification.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return { success: true, stats };
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationService;
