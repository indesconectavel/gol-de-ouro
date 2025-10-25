// SISTEMA DE ENVIO DE EMAILS - GOL DE OURO v1.2.0
// ================================================
// Data: 24/10/2025
// Status: SISTEMA DE EMAILS IMPLEMENTADO
// Versão: v1.2.0-email-system
// GPT-4o Auto-Fix: Sistema completo de envio de emails

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  // Inicializar transporter de email
  initializeTransporter() {
    try {
      // Configurações do Gmail (pode ser alterado para outros provedores)
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'goldeouro.game@gmail.com',
          pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verificar configuração
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ [EMAIL] Erro na configuração do email:', error);
          this.isConfigured = false;
        } else {
          console.log('✅ [EMAIL] Servidor de email configurado com sucesso');
          this.isConfigured = true;
        }
      });

    } catch (error) {
      console.error('❌ [EMAIL] Erro ao inicializar email service:', error);
      this.isConfigured = false;
    }
  }

  // Enviar email de recuperação de senha
  async sendPasswordResetEmail(email, username, resetToken) {
    if (!this.isConfigured) {
      console.warn('⚠️ [EMAIL] Serviço de email não configurado, apenas logando token');
      console.log(`📧 [EMAIL] Token para ${email}: ${resetToken}`);
      return { success: true, message: 'Email simulado (serviço não configurado)' };
    }

    try {
      const resetLink = `https://goldeouro.lol/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Gol de Ouro" <${process.env.SMTP_USER || 'goldeouro.game@gmail.com'}>`,
        to: email,
        subject: '🔐 Recuperação de Senha - Gol de Ouro',
        html: this.generatePasswordResetHTML(username, resetLink),
        text: this.generatePasswordResetText(username, resetLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL] Email de recuperação enviado para ${email}:`, result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Email de recuperação enviado com sucesso'
      };

    } catch (error) {
      console.error('❌ [EMAIL] Erro ao enviar email de recuperação:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Erro ao enviar email de recuperação'
      };
    }
  }

  // Enviar email de verificação de conta
  async sendVerificationEmail(email, username, verificationToken) {
    if (!this.isConfigured) {
      console.warn('⚠️ [EMAIL] Serviço de email não configurado, apenas logando token');
      console.log(`📧 [EMAIL] Token de verificação para ${email}: ${verificationToken}`);
      return { success: true, message: 'Email simulado (serviço não configurado)' };
    }

    try {
      const verificationLink = `https://goldeouro.lol/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: `"Gol de Ouro" <${process.env.SMTP_USER || 'goldeouro.game@gmail.com'}>`,
        to: email,
        subject: '✅ Verifique sua conta - Gol de Ouro',
        html: this.generateVerificationHTML(username, verificationLink),
        text: this.generateVerificationText(username, verificationLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL] Email de verificação enviado para ${email}:`, result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Email de verificação enviado com sucesso'
      };

    } catch (error) {
      console.error('❌ [EMAIL] Erro ao enviar email de verificação:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Erro ao enviar email de verificação'
      };
    }
  }

  // Gerar HTML para email de recuperação de senha
  generatePasswordResetHTML(username, resetLink) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Gol de Ouro</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #059669; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚽ Gol de Ouro</h1>
                <h2>Recuperação de Senha</h2>
            </div>
            <div class="content">
                <p>Olá <strong>${username}</strong>,</p>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no Gol de Ouro.</p>
                
                <p>Para criar uma nova senha, clique no botão abaixo:</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">🔐 Redefinir Senha</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este link é válido por apenas <strong>1 hora</strong></li>
                        <li>Se você não solicitou esta recuperação, ignore este email</li>
                        <li>Não compartilhe este link com outras pessoas</li>
                    </ul>
                </div>
                
                <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace;">${resetLink}</p>
                
                <p>Se você não solicitou esta recuperação, pode ignorar este email com segurança.</p>
                
                <p>Atenciosamente,<br>Equipe Gol de Ouro</p>
            </div>
            <div class="footer">
                <p>Este é um email automático, não responda a esta mensagem.</p>
                <p>© 2025 Gol de Ouro. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Gerar texto para email de recuperação de senha
  generatePasswordResetText(username, resetLink) {
    return `
⚽ Gol de Ouro - Recuperação de Senha

Olá ${username},

Recebemos uma solicitação para redefinir a senha da sua conta no Gol de Ouro.

Para criar uma nova senha, acesse o link abaixo:
${resetLink}

IMPORTANTE:
- Este link é válido por apenas 1 hora
- Se você não solicitou esta recuperação, ignore este email
- Não compartilhe este link com outras pessoas

Se você não solicitou esta recuperação, pode ignorar este email com segurança.

Atenciosamente,
Equipe Gol de Ouro

---
Este é um email automático, não responda a esta mensagem.
© 2025 Gol de Ouro. Todos os direitos reservados.
    `;
  }

  // Gerar HTML para email de verificação
  generateVerificationHTML(username, verificationLink) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificação de Conta - Gol de Ouro</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #059669; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚽ Gol de Ouro</h1>
                <h2>Verificação de Conta</h2>
            </div>
            <div class="content">
                <p>Olá <strong>${username}</strong>,</p>
                
                <p>Bem-vindo ao Gol de Ouro! 🎉</p>
                
                <p>Para ativar sua conta e começar a jogar, clique no botão abaixo:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationLink}" class="button">✅ Verificar Conta</a>
                </div>
                
                <p>Após a verificação, você poderá:</p>
                <ul>
                    <li>🎮 Jogar e apostar no Gol de Ouro</li>
                    <li>💰 Recarregar seu saldo via PIX</li>
                    <li>🏆 Participar do ranking de jogadores</li>
                    <li>🎁 Receber prêmios e bônus</li>
                </ul>
                
                <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace;">${verificationLink}</p>
                
                <p>Boa sorte e que vença o melhor! ⚽</p>
                
                <p>Atenciosamente,<br>Equipe Gol de Ouro</p>
            </div>
            <div class="footer">
                <p>Este é um email automático, não responda a esta mensagem.</p>
                <p>© 2025 Gol de Ouro. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Gerar texto para email de verificação
  generateVerificationText(username, verificationLink) {
    return `
⚽ Gol de Ouro - Verificação de Conta

Olá ${username},

Bem-vindo ao Gol de Ouro! 🎉

Para ativar sua conta e começar a jogar, acesse o link abaixo:
${verificationLink}

Após a verificação, você poderá:
- 🎮 Jogar e apostar no Gol de Ouro
- 💰 Recarregar seu saldo via PIX
- 🏆 Participar do ranking de jogadores
- 🎁 Receber prêmios e bônus

Boa sorte e que vença o melhor! ⚽

Atenciosamente,
Equipe Gol de Ouro

---
Este é um email automático, não responda a esta mensagem.
© 2025 Gol de Ouro. Todos os direitos reservados.
    `;
  }

  // Verificar se o serviço está configurado
  isEmailConfigured() {
    return this.isConfigured;
  }

  // Obter estatísticas do serviço
  getStats() {
    return {
      configured: this.isConfigured,
      service: 'gmail',
      user: process.env.SMTP_USER || 'goldeouro.game@gmail.com'
    };
  }
}

// Instância global do serviço de email
const emailService = new EmailService();

module.exports = emailService;
