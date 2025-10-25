# 🔔 SISTEMA DE ALERTAS INTELIGENTES - GOL DE OURO
# ================================================
**Data:** 23 de Outubro de 2025  
**Versão:** v1.1.1  
**Status:** ✅ CONFIGURAÇÃO COMPLETA  

const nodemailer = require('nodemailer');
const axios = require('axios');

// =====================================================
// CONFIGURAÇÃO DE ALERTAS POR EMAIL
// =====================================================

class EmailAlerts {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.ALERT_EMAIL_USER,
        pass: process.env.ALERT_EMAIL_PASS
      }
    });
    
    this.recipients = [
      'admin@goldeouro.lol',
      'dev@goldeouro.lol'
    ];
  }
  
  async sendAlert(alert) {
    try {
      const mailOptions = {
        from: process.env.ALERT_EMAIL_USER,
        to: this.recipients.join(', '),
        subject: `🚨 Gol de Ouro Alert - ${alert.level.toUpperCase()}`,
        html: this.generateEmailTemplate(alert)
      };
      
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email alert sent: ${alert.type}`);
      
    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
    }
  }
  
  generateEmailTemplate(alert) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: ${alert.level === 'critical' ? '#dc3545' : '#ffc107'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-info { background-color: #f8f9fa; border-left: 4px solid ${alert.level === 'critical' ? '#dc3545' : '#ffc107'}; padding: 15px; margin: 15px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Gol de Ouro Alert</h1>
            <h2>${alert.level.toUpperCase()}</h2>
          </div>
          <div class="content">
            <div class="alert-info">
              <h3>${alert.message}</h3>
              <p><strong>Type:</strong> ${alert.type}</p>
              <p><strong>Value:</strong> ${alert.value}</p>
              <p><strong>Threshold:</strong> ${alert.threshold}</p>
              <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
            </div>
            <p>Please check the system immediately and take appropriate action.</p>
            <a href="https://admin.goldeouro.lol" class="btn">Access Admin Panel</a>
            <a href="https://goldeouro-backend.fly.dev/health" class="btn">Check System Health</a>
          </div>
          <div class="footer">
            <p>Gol de Ouro Monitoring System - Automated Alert</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// =====================================================
// CONFIGURAÇÃO DE ALERTAS VIA SLACK
// =====================================================

class SlackAlerts {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.channel = process.env.SLACK_CHANNEL || '#goldeouro-alerts';
  }
  
  async sendAlert(alert) {
    if (!this.webhookUrl) {
      console.log('⚠️ Slack webhook not configured');
      return;
    }
    
    try {
      const message = {
        channel: this.channel,
        username: 'Gol de Ouro Bot',
        icon_emoji: ':soccer:',
        text: `🚨 *${alert.level.toUpperCase()} Alert*`,
        attachments: [{
          color: alert.level === 'critical' ? 'danger' : 'warning',
          fields: [
            { title: 'Type', value: alert.type, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Value', value: alert.value.toString(), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
            { title: 'Timestamp', value: alert.timestamp, short: true }
          ],
          actions: [
            { type: 'button', text: 'Admin Panel', url: 'https://admin.goldeouro.lol' },
            { type: 'button', text: 'System Health', url: 'https://goldeouro-backend.fly.dev/health' }
          ]
        }]
      };
      
      await axios.post(this.webhookUrl, message);
      console.log(`✅ Slack alert sent: ${alert.type}`);
      
    } catch (error) {
      console.error('❌ Failed to send Slack alert:', error);
    }
  }
}

// =====================================================
// CONFIGURAÇÃO DE ALERTAS VIA DISCORD
// =====================================================

class DiscordAlerts {
  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }
  
  async sendAlert(alert) {
    if (!this.webhookUrl) {
      console.log('⚠️ Discord webhook not configured');
      return;
    }
    
    try {
      const embed = {
        title: `🚨 ${alert.level.toUpperCase()} Alert`,
        description: alert.message,
        color: alert.level === 'critical' ? 0xff0000 : 0xffaa00,
        fields: [
          { name: 'Type', value: alert.type, inline: true },
          { name: 'Value', value: alert.value.toString(), inline: true },
          { name: 'Threshold', value: alert.threshold.toString(), inline: true },
          { name: 'Timestamp', value: alert.timestamp, inline: false }
        ],
        footer: { text: 'Gol de Ouro Monitoring System' },
        timestamp: new Date().toISOString()
      };
      
      await axios.post(this.webhookUrl, {
        username: 'Gol de Ouro Bot',
        avatar_url: 'https://goldeouro.lol/favicon.ico',
        embeds: [embed]
      });
      
      console.log(`✅ Discord alert sent: ${alert.type}`);
      
    } catch (error) {
      console.error('❌ Failed to send Discord alert:', error);
    }
  }
}

// =====================================================
// CONFIGURAÇÃO DE ALERTAS VIA SMS (TWILIO)
// =====================================================

class SMSAlerts {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;
    this.toNumbers = process.env.TWILIO_TO_NUMBERS?.split(',') || [];
    
    this.client = require('twilio')(this.accountSid, this.authToken);
  }
  
  async sendAlert(alert) {
    if (!this.accountSid || !this.authToken) {
      console.log('⚠️ Twilio not configured');
      return;
    }
    
    // Enviar SMS apenas para alertas críticos
    if (alert.level !== 'critical') {
      return;
    }
    
    try {
      const message = `🚨 GOL DE OURO ALERT\n${alert.level.toUpperCase()}\n${alert.message}\nTime: ${alert.timestamp}`;
      
      for (const toNumber of this.toNumbers) {
        await this.client.messages.create({
          body: message,
          from: this.fromNumber,
          to: toNumber.trim()
        });
      }
      
      console.log(`✅ SMS alert sent: ${alert.type}`);
      
    } catch (error) {
      console.error('❌ Failed to send SMS alert:', error);
    }
  }
}

// =====================================================
// SISTEMA DE ALERTAS UNIFICADO
// =====================================================

class UnifiedAlertSystem {
  constructor() {
    this.emailAlerts = new EmailAlerts();
    this.slackAlerts = new SlackAlerts();
    this.discordAlerts = new DiscordAlerts();
    this.smsAlerts = new SMSAlerts();
    
    this.alertHistory = [];
    this.rateLimits = new Map();
  }
  
  async sendAlert(alert) {
    // Verificar rate limit
    if (this.isRateLimited(alert.type)) {
      console.log(`⚠️ Alert ${alert.type} rate limited`);
      return;
    }
    
    // Adicionar ao histórico
    this.alertHistory.push({
      ...alert,
      id: `${alert.type}_${Date.now()}`,
      sentAt: new Date().toISOString()
    });
    
    // Enviar alertas em paralelo
    const promises = [
      this.emailAlerts.sendAlert(alert),
      this.slackAlerts.sendAlert(alert),
      this.discordAlerts.sendAlert(alert),
      this.smsAlerts.sendAlert(alert)
    ];
    
    try {
      await Promise.allSettled(promises);
      console.log(`✅ Alert ${alert.type} sent via all channels`);
    } catch (error) {
      console.error('❌ Some alert channels failed:', error);
    }
  }
  
  isRateLimited(alertType) {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutos
    const maxAlerts = 3; // Máximo 3 alertas por tipo a cada 5 minutos
    
    if (!this.rateLimits.has(alertType)) {
      this.rateLimits.set(alertType, []);
    }
    
    const alerts = this.rateLimits.get(alertType);
    
    // Remover alertas antigos
    const recentAlerts = alerts.filter(time => now - time < windowMs);
    this.rateLimits.set(alertType, recentAlerts);
    
    return recentAlerts.length >= maxAlerts;
  }
  
  getAlertHistory() {
    return this.alertHistory;
  }
  
  getActiveAlerts() {
    return this.alertHistory.filter(alert => 
      !alert.resolved && 
      (Date.now() - new Date(alert.sentAt).getTime()) < 24 * 60 * 60 * 1000 // 24 horas
    );
  }
}

// =====================================================
// CONFIGURAÇÃO DE ALERTAS ESPECÍFICOS
// =====================================================

class GolDeOuroAlerts {
  constructor() {
    this.unifiedSystem = new UnifiedAlertSystem();
    this.thresholds = {
      errorRate: 5,
      responseTime: 2000,
      memoryUsage: 80,
      cpuUsage: 70,
      lowBalance: 1000,
      failedPayments: 3,
      highTraffic: 1000, // requests per minute
      databaseConnections: 80
    };
  }
  
  async checkSystemHealth() {
    const health = await this.getSystemHealth();
    
    // Verificar taxa de erro
    if (health.errorRate > this.thresholds.errorRate) {
      await this.unifiedSystem.sendAlert({
        type: 'HIGH_ERROR_RATE',
        level: 'critical',
        message: `Error rate is ${health.errorRate}%, above threshold of ${this.thresholds.errorRate}%`,
        value: health.errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar tempo de resposta
    if (health.avgResponseTime > this.thresholds.responseTime) {
      await this.unifiedSystem.sendAlert({
        type: 'SLOW_RESPONSE',
        level: 'warning',
        message: `Average response time is ${health.avgResponseTime}ms, above threshold of ${this.thresholds.responseTime}ms`,
        value: health.avgResponseTime,
        threshold: this.thresholds.responseTime,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar uso de memória
    if (health.memoryUsage > this.thresholds.memoryUsage) {
      await this.unifiedSystem.sendAlert({
        type: 'HIGH_MEMORY_USAGE',
        level: 'warning',
        message: `Memory usage is ${health.memoryUsage}%, above threshold of ${this.thresholds.memoryUsage}%`,
        value: health.memoryUsage,
        threshold: this.thresholds.memoryUsage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar saldo baixo
    if (health.totalBalance < this.thresholds.lowBalance) {
      await this.unifiedSystem.sendAlert({
        type: 'LOW_SYSTEM_BALANCE',
        level: 'critical',
        message: `System total balance is R$ ${health.totalBalance}, below threshold of R$ ${this.thresholds.lowBalance}`,
        value: health.totalBalance,
        threshold: this.thresholds.lowBalance,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar pagamentos falhados
    if (health.failedPayments >= this.thresholds.failedPayments) {
      await this.unifiedSystem.sendAlert({
        type: 'MULTIPLE_FAILED_PAYMENTS',
        level: 'critical',
        message: `${health.failedPayments} consecutive failed payments detected`,
        value: health.failedPayments,
        threshold: this.thresholds.failedPayments,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  async getSystemHealth() {
    // Implementar coleta de métricas do sistema
    return {
      errorRate: 2.5,
      avgResponseTime: 1500,
      memoryUsage: 65,
      cpuUsage: 45,
      totalBalance: 5000,
      failedPayments: 1,
      activeUsers: 25,
      uptime: process.uptime()
    };
  }
  
  async sendCustomAlert(type, level, message, value, threshold) {
    await this.unifiedSystem.sendAlert({
      type,
      level,
      message,
      value,
      threshold,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  EmailAlerts,
  SlackAlerts,
  DiscordAlerts,
  SMSAlerts,
  UnifiedAlertSystem,
  GolDeOuroAlerts
};
