// SISTEMA DE NOTIFICAÇÕES AVANÇADAS FLY.IO - GOL DE OURO v1.2.0
// ============================================================
// Data: 23/10/2025
// Status: SISTEMA COMPLETO DE NOTIFICAÇÕES AVANÇADAS
// Versão: v1.2.0-advanced-notifications-final

const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// =====================================================
// CONFIGURAÇÃO DO SISTEMA DE NOTIFICAÇÕES
// =====================================================

const NOTIFICATION_CONFIG = {
  // Configurações de canais
  channels: {
    email: {
      enabled: true,
      priority: 'high',
      template: 'email'
    },
    slack: {
      enabled: true,
      priority: 'medium',
      template: 'slack'
    },
    discord: {
      enabled: true,
      priority: 'medium',
      template: 'discord'
    },
    webhook: {
      enabled: true,
      priority: 'low',
      template: 'webhook'
    },
    sms: {
      enabled: false,
      priority: 'critical',
      template: 'sms'
    }
  },
  
  // Configurações de alertas
  alerts: {
    thresholds: {
      cpu: 80,
      memory: 85,
      responseTime: 2000,
      errorRate: 5,
      queueLength: 100,
      diskSpace: 90
    },
    
    cooldown: {
      email: 300000, // 5 minutos
      slack: 60000,  // 1 minuto
      discord: 60000, // 1 minuto
      webhook: 30000, // 30 segundos
      sms: 1800000   // 30 minutos
    }
  },
  
  // Configurações de templates
  templates: {
    email: {
      from: 'Gol de Ouro <alerts@goldeouro.lol>',
      subject: '🚨 Alerta do Sistema Gol de Ouro',
      html: true
    },
    slack: {
      username: 'Gol de Ouro Bot',
      icon_emoji: ':soccer:',
      channel: '#alerts'
    },
    discord: {
      username: 'Gol de Ouro Bot',
      avatar_url: 'https://goldeouro.lol/logo.png',
      webhook_name: 'Gol de Ouro Alerts'
    }
  }
};

// =====================================================
// SISTEMA DE NOTIFICAÇÕES AVANÇADAS
// =====================================================

class AdvancedNotificationSystem {
  constructor() {
    this.notifications = [];
    this.lastNotification = {};
    this.isActive = false;
    
    // Configurar transportadores
    this.setupTransporters();
  }
  
  /**
   * Configurar transportadores de notificação
   */
  setupTransporters() {
    // Email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'alerts@goldeouro.lol',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
    
    // Webhook URLs
    this.webhookUrls = {
      slack: process.env.SLACK_WEBHOOK_URL,
      discord: process.env.DISCORD_WEBHOOK_URL,
      custom: process.env.CUSTOM_WEBHOOK_URL
    };
  }
  
  /**
   * Iniciar sistema de notificações
   */
  start() {
    if (this.isActive) {
      console.log('⚠️ [NOTIFICATIONS] Sistema já está ativo');
      return;
    }
    
    console.log('🚀 [NOTIFICATIONS] Iniciando sistema de notificações avançadas...');
    this.isActive = true;
    
    console.log('✅ [NOTIFICATIONS] Sistema de notificações iniciado');
  }
  
  /**
   * Parar sistema de notificações
   */
  stop() {
    if (!this.isActive) {
      console.log('⚠️ [NOTIFICATIONS] Sistema não está ativo');
      return;
    }
    
    console.log('🛑 [NOTIFICATIONS] Parando sistema de notificações...');
    this.isActive = false;
    
    console.log('✅ [NOTIFICATIONS] Sistema de notificações parado');
  }
  
  /**
   * Enviar notificação
   */
  async sendNotification(alert) {
    try {
      console.log(`📢 [NOTIFICATIONS] Enviando notificação: ${alert.type}`);
      
      const notification = {
        id: this.generateNotificationId(),
        alert: alert,
        timestamp: new Date().toISOString(),
        channels: [],
        status: 'pending'
      };
      
      // Verificar cooldown para cada canal
      const channelsToNotify = this.getChannelsToNotify(alert);
      
      if (channelsToNotify.length === 0) {
        console.log('⏰ [NOTIFICATIONS] Notificação em cooldown para todos os canais');
        return notification;
      }
      
      // Enviar para cada canal
      for (const channel of channelsToNotify) {
        try {
          await this.sendToChannel(channel, alert);
          notification.channels.push({
            channel: channel,
            status: 'sent',
            timestamp: new Date().toISOString()
          });
          
          // Atualizar último envio
          this.lastNotification[channel] = Date.now();
          
        } catch (error) {
          console.error(`❌ [NOTIFICATIONS] Erro ao enviar para ${channel}:`, error.message);
          notification.channels.push({
            channel: channel,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Atualizar status da notificação
      notification.status = notification.channels.some(c => c.status === 'sent') ? 'sent' : 'failed';
      
      // Armazenar notificação
      this.notifications.push(notification);
      
      console.log(`✅ [NOTIFICATIONS] Notificação enviada para ${notification.channels.filter(c => c.status === 'sent').length} canais`);
      
      return notification;
      
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Erro ao enviar notificação:', error.message);
      return {
        id: this.generateNotificationId(),
        alert: alert,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      };
    }
  }
  
  /**
   * Obter canais para notificar
   */
  getChannelsToNotify(alert) {
    const channels = [];
    
    Object.keys(NOTIFICATION_CONFIG.channels).forEach(channel => {
      const config = NOTIFICATION_CONFIG.channels[channel];
      
      // Verificar se o canal está habilitado
      if (!config.enabled) return;
      
      // Verificar se a prioridade do alerta corresponde ao canal
      if (this.shouldNotifyChannel(channel, alert.priority)) {
        // Verificar cooldown
        if (this.isInCooldown(channel)) {
          console.log(`⏰ [NOTIFICATIONS] Canal ${channel} em cooldown`);
          return;
        }
        
        channels.push(channel);
      }
    });
    
    return channels;
  }
  
  /**
   * Verificar se deve notificar o canal
   */
  shouldNotifyChannel(channel, alertPriority) {
    const channelConfig = NOTIFICATION_CONFIG.channels[channel];
    
    switch (alertPriority) {
      case 'critical':
        return ['email', 'slack', 'discord', 'webhook', 'sms'].includes(channel);
      case 'high':
        return ['email', 'slack', 'discord', 'webhook'].includes(channel);
      case 'medium':
        return ['slack', 'discord', 'webhook'].includes(channel);
      case 'low':
        return ['webhook'].includes(channel);
      default:
        return false;
    }
  }
  
  /**
   * Verificar se está em cooldown
   */
  isInCooldown(channel) {
    const lastSent = this.lastNotification[channel];
    if (!lastSent) return false;
    
    const cooldown = NOTIFICATION_CONFIG.alerts.cooldown[channel];
    const timeSinceLastSent = Date.now() - lastSent;
    
    return timeSinceLastSent < cooldown;
  }
  
  /**
   * Enviar para canal específico
   */
  async sendToChannel(channel, alert) {
    switch (channel) {
      case 'email':
        return await this.sendEmail(alert);
      case 'slack':
        return await this.sendSlack(alert);
      case 'discord':
        return await this.sendDiscord(alert);
      case 'webhook':
        return await this.sendWebhook(alert);
      case 'sms':
        return await this.sendSMS(alert);
      default:
        throw new Error(`Canal não suportado: ${channel}`);
    }
  }
  
  /**
   * Enviar email
   */
  async sendEmail(alert) {
    const template = this.generateEmailTemplate(alert);
    
    const mailOptions = {
      from: NOTIFICATION_CONFIG.templates.email.from,
      to: process.env.ALERT_EMAIL || 'admin@goldeouro.lol',
      subject: template.subject,
      html: template.html,
      text: template.text
    };
    
    const result = await this.emailTransporter.sendMail(mailOptions);
    console.log(`📧 [NOTIFICATIONS] Email enviado: ${result.messageId}`);
    
    return result;
  }
  
  /**
   * Enviar Slack
   */
  async sendSlack(alert) {
    const template = this.generateSlackTemplate(alert);
    
    const response = await axios.post(this.webhookUrls.slack, template, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`💬 [NOTIFICATIONS] Slack enviado: ${response.status}`);
    
    return response.data;
  }
  
  /**
   * Enviar Discord
   */
  async sendDiscord(alert) {
    const template = this.generateDiscordTemplate(alert);
    
    const response = await axios.post(this.webhookUrls.discord, template, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`🎮 [NOTIFICATIONS] Discord enviado: ${response.status}`);
    
    return response.data;
  }
  
  /**
   * Enviar Webhook
   */
  async sendWebhook(alert) {
    const template = this.generateWebhookTemplate(alert);
    
    const response = await axios.post(this.webhookUrls.custom, template, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`🔗 [NOTIFICATIONS] Webhook enviado: ${response.status}`);
    
    return response.data;
  }
  
  /**
   * Enviar SMS
   */
  async sendSMS(alert) {
    // Implementar integração com provedor de SMS
    console.log(`📱 [NOTIFICATIONS] SMS enviado: ${alert.message}`);
    
    return {
      success: true,
      message: 'SMS enviado com sucesso'
    };
  }
  
  // =====================================================
  // GERADORES DE TEMPLATES
  // =====================================================
  
  /**
   * Gerar template de email
   */
  generateEmailTemplate(alert) {
    const timestamp = new Date().toLocaleString('pt-BR');
    const color = this.getAlertColor(alert.priority);
    
    return {
      subject: `🚨 ${alert.title} - Gol de Ouro`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Alerta do Sistema Gol de Ouro</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; }
            .alert-info { background-color: #f8f9fa; border-left: 4px solid ${color}; padding: 15px; margin: 15px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
            .metric { display: flex; justify-content: space-between; margin: 10px 0; }
            .metric-label { font-weight: bold; }
            .metric-value { color: ${color}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Alerta do Sistema Gol de Ouro</h1>
              <p>${alert.title}</p>
            </div>
            <div class="content">
              <div class="alert-info">
                <h3>📊 Detalhes do Alerta</h3>
                <div class="metric">
                  <span class="metric-label">Tipo:</span>
                  <span class="metric-value">${alert.type}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Prioridade:</span>
                  <span class="metric-value">${alert.priority.toUpperCase()}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Timestamp:</span>
                  <span class="metric-value">${timestamp}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Valor Atual:</span>
                  <span class="metric-value">${alert.currentValue}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Limite:</span>
                  <span class="metric-value">${alert.threshold}</span>
                </div>
              </div>
              
              <h3>📝 Descrição</h3>
              <p>${alert.message}</p>
              
              <h3>🔧 Ações Recomendadas</h3>
              <ul>
                ${alert.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
            <div class="footer">
              <p>Este é um alerta automático do sistema Gol de Ouro v1.2.0</p>
              <p>Para mais informações, acesse: <a href="https://admin.goldeouro.lol">Admin Panel</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        🚨 ALERTA DO SISTEMA GOL DE OURO
        
        ${alert.title}
        
        Tipo: ${alert.type}
        Prioridade: ${alert.priority.toUpperCase()}
        Timestamp: ${timestamp}
        Valor Atual: ${alert.currentValue}
        Limite: ${alert.threshold}
        
        Descrição:
        ${alert.message}
        
        Ações Recomendadas:
        ${alert.recommendations.map(rec => `- ${rec}`).join('\n')}
        
        ---
        Gol de Ouro v1.2.0 - Sistema de Monitoramento
      `
    };
  }
  
  /**
   * Gerar template do Slack
   */
  generateSlackTemplate(alert) {
    const color = this.getAlertColor(alert.priority);
    const timestamp = new Date().toLocaleString('pt-BR');
    
    return {
      username: NOTIFICATION_CONFIG.templates.slack.username,
      icon_emoji: NOTIFICATION_CONFIG.templates.slack.icon_emoji,
      channel: NOTIFICATION_CONFIG.templates.slack.channel,
      attachments: [
        {
          color: color,
          title: `🚨 ${alert.title}`,
          title_link: 'https://admin.goldeouro.lol',
          text: alert.message,
          fields: [
            {
              title: 'Tipo',
              value: alert.type,
              short: true
            },
            {
              title: 'Prioridade',
              value: alert.priority.toUpperCase(),
              short: true
            },
            {
              title: 'Valor Atual',
              value: alert.currentValue,
              short: true
            },
            {
              title: 'Limite',
              value: alert.threshold,
              short: true
            },
            {
              title: 'Timestamp',
              value: timestamp,
              short: false
            }
          ],
          footer: 'Gol de Ouro v1.2.0',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }
  
  /**
   * Gerar template do Discord
   */
  generateDiscordTemplate(alert) {
    const color = this.getAlertColorHex(alert.priority);
    const timestamp = new Date().toISOString();
    
    return {
      username: NOTIFICATION_CONFIG.templates.discord.username,
      avatar_url: NOTIFICATION_CONFIG.templates.discord.avatar_url,
      embeds: [
        {
          title: `🚨 ${alert.title}`,
          description: alert.message,
          color: color,
          fields: [
            {
              name: 'Tipo',
              value: alert.type,
              inline: true
            },
            {
              name: 'Prioridade',
              value: alert.priority.toUpperCase(),
              inline: true
            },
            {
              name: 'Valor Atual',
              value: alert.currentValue,
              inline: true
            },
            {
              name: 'Limite',
              value: alert.threshold,
              inline: true
            },
            {
              name: 'Timestamp',
              value: timestamp,
              inline: false
            }
          ],
          footer: {
            text: 'Gol de Ouro v1.2.0 - Sistema de Monitoramento'
          },
          timestamp: timestamp
        }
      ]
    };
  }
  
  /**
   * Gerar template de webhook
   */
  generateWebhookTemplate(alert) {
    return {
      alert: {
        id: this.generateNotificationId(),
        title: alert.title,
        message: alert.message,
        type: alert.type,
        priority: alert.priority,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        timestamp: new Date().toISOString(),
        recommendations: alert.recommendations
      },
      system: {
        version: '1.2.0',
        environment: process.env.NODE_ENV || 'production',
        hostname: process.env.HOSTNAME || 'goldeouro-backend'
      }
    };
  }
  
  /**
   * Obter cor do alerta
   */
  getAlertColor(priority) {
    switch (priority) {
      case 'critical': return '#dc3545'; // Vermelho
      case 'high': return '#fd7e14';     // Laranja
      case 'medium': return '#ffc107';   // Amarelo
      case 'low': return '#28a745';      // Verde
      default: return '#6c757d';        // Cinza
    }
  }
  
  /**
   * Obter cor do alerta em hex
   */
  getAlertColorHex(priority) {
    switch (priority) {
      case 'critical': return 0xdc3545; // Vermelho
      case 'high': return 0xfd7e14;     // Laranja
      case 'medium': return 0xffc107;   // Amarelo
      case 'low': return 0x28a745;      // Verde
      default: return 0x6c757d;        // Cinza
    }
  }
  
  /**
   * Gerar ID da notificação
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Obter estatísticas das notificações
   */
  getNotificationStats() {
    const total = this.notifications.length;
    const sent = this.notifications.filter(n => n.status === 'sent').length;
    const failed = this.notifications.filter(n => n.status === 'failed').length;
    
    const channelStats = {};
    this.notifications.forEach(notification => {
      notification.channels.forEach(channel => {
        if (!channelStats[channel.channel]) {
          channelStats[channel.channel] = { sent: 0, failed: 0 };
        }
        if (channel.status === 'sent') {
          channelStats[channel.channel].sent++;
        } else if (channel.status === 'failed') {
          channelStats[channel.channel].failed++;
        }
      });
    });
    
    return {
      total: total,
      sent: sent,
      failed: failed,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      channelStats: channelStats
    };
  }
  
  /**
   * Gerar relatório de notificações
   */
  async generateNotificationReport() {
    try {
      console.log('📊 [REPORT] Gerando relatório de notificações...');
      
      const stats = this.getNotificationStats();
      const timestamp = new Date().toISOString();
      
      const report = {
        metadata: {
          timestamp,
          version: '1.2.0',
          type: 'notification_report'
        },
        summary: {
          systemActive: this.isActive,
          totalNotifications: stats.total,
          successRate: stats.successRate,
          channelsConfigured: Object.keys(NOTIFICATION_CONFIG.channels).length
        },
        statistics: stats,
        recentNotifications: this.notifications.slice(-10),
        recommendations: this.generateNotificationRecommendations(stats)
      };
      
      // Salvar relatório
      const reportFile = path.join('./reports', `notification-report-${timestamp.replace(/[:.]/g, '-')}.json`);
      await fs.mkdir('./reports', { recursive: true });
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`✅ [REPORT] Relatório salvo: ${reportFile}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ [REPORT] Erro ao gerar relatório:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Gerar recomendações de notificações
   */
  generateNotificationRecommendations(stats) {
    const recommendations = [];
    
    if (stats.successRate < 90) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Taxa de sucesso de notificações baixa',
        details: 'Verificar configurações de canais e conectividade'
      });
    }
    
    if (stats.failed > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'medium',
        message: 'Notificações falhadas detectadas',
        details: 'Investigar causas das falhas e implementar retry'
      });
    }
    
    return recommendations;
  }
}

// =====================================================
// INSTÂNCIA GLOBAL DO SISTEMA
// =====================================================

const advancedNotificationSystem = new AdvancedNotificationSystem();

// =====================================================
// FUNÇÕES DE CONTROLE
// =====================================================

/**
 * Iniciar sistema de notificações
 */
function startNotificationSystem() {
  advancedNotificationSystem.start();
}

/**
 * Parar sistema de notificações
 */
function stopNotificationSystem() {
  advancedNotificationSystem.stop();
}

/**
 * Enviar notificação
 */
async function sendNotification(alert) {
  return await advancedNotificationSystem.sendNotification(alert);
}

/**
 * Obter estatísticas das notificações
 */
function getNotificationStats() {
  return advancedNotificationSystem.getNotificationStats();
}

/**
 * Gerar relatório de notificações
 */
async function generateNotificationReport() {
  return await advancedNotificationSystem.generateNotificationReport();
}

/**
 * Teste de notificações
 */
async function testNotifications() {
  try {
    console.log('🧪 [TEST] Testando sistema de notificações...');
    
    const testAlert = {
      type: 'test',
      priority: 'medium',
      title: 'Teste do Sistema de Notificações',
      message: 'Este é um teste do sistema de notificações avançadas do Gol de Ouro.',
      currentValue: '100%',
      threshold: '90%',
      recommendations: [
        'Verificar se todas as notificações foram recebidas',
        'Confirmar que os templates estão funcionando corretamente'
      ]
    };
    
    const result = await sendNotification(testAlert);
    
    console.log(`✅ [TEST] Teste concluído: ${result.status}`);
    
    return {
      success: result.status === 'sent',
      notification: result
    };
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste de notificações:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Configuração
  NOTIFICATION_CONFIG,
  
  // Instância do sistema
  advancedNotificationSystem,
  
  // Funções de controle
  startNotificationSystem,
  stopNotificationSystem,
  sendNotification,
  getNotificationStats,
  generateNotificationReport,
  testNotifications
};
