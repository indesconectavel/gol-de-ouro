// SISTEMA DE ENVIO DE EMAILS - GOL DE OURO v1.2.0
// ================================================
// Data: 24/10/2025
// Status: SMTP SAFE MODE — dependência opcional e resiliente
// Versão: v1.2.0-email-system
// Hardening 2026-03-09: estado explícito, ensureReady, verify não fatal, getStatus

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const FRONTEND_BASE_URL = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || 'https://goldeouro.lol';

const DEFAULT_FROM = process.env.SMTP_USER || 'goldeouro.game@gmail.com';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.isVerified = false;
    this.lastVerifyError = null;
    this.lastVerifyAt = null;
    this.lastSendError = null;
    this._verifyPromise = null;
    this.initializeTransporter();
  }

  // Inicializar transporter (não bloqueia boot; verify em background com catch)
  initializeTransporter() {
    try {
      const hasCredentials = !!(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD);
      if (!hasCredentials) {
        console.warn('⚠️ [EMAIL] SMTP não configurado (SMTP_PASS ou GMAIL_APP_PASSWORD ausente). Servidor continuará rodando.');
        this.isConfigured = false;
        this.isVerified = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'goldeouro.game@gmail.com',
          pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
        },
        tls: { rejectUnauthorized: false }
      });

      // Verificação em background: nunca bloqueia startup; nunca deixa unhandled rejection
      this._verifyPromise = new Promise((resolve, reject) => {
        this.transporter.verify((err) => {
          this.lastVerifyAt = Date.now();
          if (err) {
            this.lastVerifyError = err && err.message ? err.message : String(err);
            this.isConfigured = false;
            this.isVerified = false;
            console.error('❌ [EMAIL] Verificação SMTP falhou (servidor continuará rodando):', this.lastVerifyError);
            reject(err);
          } else {
            this.lastVerifyError = null;
            this.isConfigured = true;
            this.isVerified = true;
            console.log('✅ [EMAIL] SMTP verificado e pronto para envio');
            resolve();
          }
        });
      }).catch((err) => {
        this.lastVerifyError = err && err.message ? err.message : String(err);
        this.isConfigured = false;
        this.isVerified = false;
        return undefined;
      });
    } catch (error) {
      const msg = error && error.message ? error.message : String(error);
      console.error('❌ [EMAIL] Erro ao inicializar email service:', msg);
      this.isConfigured = false;
      this.isVerified = false;
      this.lastVerifyError = msg;
    }
  }

  /**
   * Garante que o serviço está pronto para envio. Não lança exceção.
   * @returns {{ ready: boolean, error?: string }}
   */
  async ensureReady() {
    if (!this.transporter) {
      return { ready: false, error: 'Serviço de e-mail não configurado. Configure SMTP_USER e SMTP_PASS (ou GMAIL_APP_PASSWORD).' };
    }
    if (this._verifyPromise) {
      try {
        await this._verifyPromise;
      } catch (_) {
        return { ready: false, error: 'Serviço de e-mail indisponível (verificação SMTP falhou).' };
      }
    }
    if (!this.isConfigured || !this.isVerified) {
      return {
        ready: false,
        error: this.lastVerifyError || 'Serviço de e-mail não configurado ou indisponível.'
      };
    }
    return { ready: true };
  }

  // Enviar email de recuperação de senha (retorno padronizado; nunca throw)
  async sendPasswordResetEmail(email, username, resetToken) {
    const ready = await this.ensureReady();
    if (!ready.ready) {
      if (process.env.NODE_ENV !== 'production') {
        const truncated = typeof resetToken === 'string' ? resetToken.substring(0, 12) + '...' : '***';
        console.log('📧 [EMAIL] Reset não enviado (SMTP indisponível). Link (dev):', `${FRONTEND_BASE_URL}/reset-password?token=${truncated}`);
      } else {
        console.warn('⚠️ [EMAIL] SMTP indisponível; recuperação de senha não enviada para', email ? `${email.substring(0, 3)}***` : 'destinatário');
      }
      return { success: false, error: ready.error || 'Serviço de e-mail não configurado ou indisponível.' };
    }

    try {
      const resetLink = `${FRONTEND_BASE_URL.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: `"Gol de Ouro" <${DEFAULT_FROM}>`,
        to: email,
        subject: '🔐 Recuperação de Senha - Gol de Ouro',
        html: this.generatePasswordResetHTML(username, resetLink),
        text: this.generatePasswordResetText(username, resetLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.lastSendError = null;
      console.log('✅ [EMAIL] Recuperação de senha enviada para', email ? `${email.substring(0, 5)}***` : 'destinatário', 'messageId:', result.messageId || '-');

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de recuperação enviado com sucesso'
      };
    } catch (error) {
      const msg = error && error.message ? error.message : String(error);
      this.lastSendError = msg;
      console.error('❌ [EMAIL] Falha ao enviar recuperação de senha:', msg);
      return {
        success: false,
        error: msg,
        message: 'Erro ao enviar email de recuperação'
      };
    }
  }

  // Enviar email de verificação de conta (retorno padronizado; nunca throw)
  async sendVerificationEmail(email, username, verificationToken) {
    const ready = await this.ensureReady();
    if (!ready.ready) {
      console.warn('⚠️ [EMAIL] SMTP indisponível; verificação de conta não enviada.');
      return { success: false, error: ready.error || 'Serviço de e-mail não configurado ou indisponível.' };
    }

    try {
      const verificationLink = `${FRONTEND_BASE_URL.replace(/\/+$/, '')}/verify-email?token=${verificationToken}`;
      const mailOptions = {
        from: `"Gol de Ouro" <${DEFAULT_FROM}>`,
        to: email,
        subject: '✅ Verifique sua conta - Gol de Ouro',
        html: this.generateVerificationHTML(username, verificationLink),
        text: this.generateVerificationText(username, verificationLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.lastSendError = null;
      console.log('✅ [EMAIL] Verificação de conta enviada para', email ? `${email.substring(0, 5)}***` : 'destinatário', 'messageId:', result.messageId || '-');

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de verificação enviado com sucesso'
      };
    } catch (error) {
      const msg = error && error.message ? error.message : String(error);
      this.lastSendError = msg;
      console.error('❌ [EMAIL] Falha ao enviar verificação de conta:', msg);
      return {
        success: false,
        error: msg,
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

  // Verificar se o serviço está configurado (compatibilidade)
  isEmailConfigured() {
    return this.isConfigured;
  }

  /**
   * Estado do serviço para auditoria e debug. Não lança exceção.
   * @returns {{ configured: boolean, verified: boolean, provider: string, fromAddress: string, frontendBaseUrl: string, lastVerifyError: string|null, lastSendError: string|null, lastVerifyAt: number|null }}
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      verified: this.isVerified,
      provider: 'gmail',
      fromAddress: DEFAULT_FROM,
      frontendBaseUrl: FRONTEND_BASE_URL,
      lastVerifyError: this.lastVerifyError || null,
      lastSendError: this.lastSendError || null,
      lastVerifyAt: this.lastVerifyAt || null
    };
  }

  // Compatibilidade: getStats mantém shape anterior e acrescenta campos de status
  getStats() {
    const status = this.getStatus();
    return {
      ...status,
      service: status.provider,
      user: status.fromAddress
    };
  }
}

// Instância global do serviço de email
const emailService = new EmailService();

module.exports = emailService;
