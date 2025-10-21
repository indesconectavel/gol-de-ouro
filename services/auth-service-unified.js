// SISTEMA DE AUTENTICAÇÃO UNIFICADO - GOL DE OURO v2.0
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

class AuthService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.jwtConfig = {
      secret: process.env.JWT_SECRET || 'goldeouro-secret-key-2025',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };
    
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  }

  // Validar configuração
  validateConfig() {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Configuração de autenticação faltando: ${missing.join(', ')}`);
    }
    
    return true;
  }

  // Registrar usuário
  async register(email, password, username) {
    try {
      this.validateConfig();
      
      // Validar dados de entrada
      if (!email || !password || !username) {
        throw new Error('Email, senha e nome de usuário são obrigatórios');
      }

      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      if (!this.isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      // Verificar se usuário já existe
      const { data: existingUser, error: checkError } = await this.supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, this.bcryptRounds);

      // Criar usuário no Supabase
      const { data: newUser, error: createError } = await this.supabase
        .from('usuarios')
        .insert({
          email: email.toLowerCase().trim(),
          senha_hash: passwordHash,
          username: username.trim(),
          saldo: 0.00,
          tipo: 'jogador',
          ativo: true,
          email_verificado: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email, username, saldo, tipo, ativo, created_at')
        .single();

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        throw new Error('Erro interno do servidor');
      }

      // Gerar token JWT
      const token = this.generateToken(newUser);

      // Log de auditoria
      await this.logAuthEvent('register', newUser.id, {
        email: newUser.email,
        username: newUser.username,
        ip: 'unknown' // TODO: Implementar captura de IP
      });

      return {
        success: true,
        message: 'Usuário registrado com sucesso',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          balance: newUser.balance,
          role: newUser.role,
          account_status: newUser.account_status,
          created_at: newUser.created_at
        }
      };

    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Login do usuário
  async login(email, password) {
    try {
      this.validateConfig();
      
      // Validar dados de entrada
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      // Buscar usuário no Supabase
      const { data: user, error } = await this.supabase
        .from('usuarios')
        .select('id, email, username, senha_hash, saldo, tipo, ativo, email_verificado, last_login')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar status da conta
      if (user.ativo !== true) {
        throw new Error('Conta inativa. Entre em contato com o suporte');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.senha_hash);
      if (!isPasswordValid) {
        // Log de tentativa de login inválida
        await this.logAuthEvent('login_failed', user.id, {
          email: user.email,
          reason: 'invalid_password',
          ip: 'unknown'
        });
        
        throw new Error('Credenciais inválidas');
      }

      // Atualizar último login
      const { error: updateError } = await this.supabase
        .from('usuarios')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar último login:', updateError);
      }

      // Gerar token JWT
      const token = this.generateToken(user);

      // Log de auditoria
      await this.logAuthEvent('login', user.id, {
        email: user.email,
        ip: 'unknown'
      });

      return {
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          balance: user.balance,
          role: user.role,
          account_status: user.account_status,
          email_verified: user.email_verified,
          last_login: user.last_login
        }
      };

    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verificar token JWT
  async verifyToken(token) {
    try {
      this.validateConfig();
      
      const decoded = jwt.verify(token, this.jwtConfig.secret);
      
      // Buscar usuário no Supabase
      const { data: user, error } = await this.supabase
        .from('usuarios')
        .select('id, email, username, saldo, tipo, ativo, email_verificado')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.ativo !== true) {
        throw new Error('Conta inativa');
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          saldo: user.saldo,
          role: user.tipo,
          ativo: user.ativo,
          email_verified: user.email_verificado
        }
      };

    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Alterar senha
  async changePassword(userId, currentPassword, newPassword) {
    try {
      this.validateConfig();
      
      if (!currentPassword || !newPassword) {
        throw new Error('Senha atual e nova senha são obrigatórias');
      }

      if (newPassword.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }

      // Buscar usuário
      const { data: user, error } = await this.supabase
        .from('usuarios')
        .select('senha_hash')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.senha_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Hash da nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

      // Atualizar senha
      const { error: updateError } = await this.supabase
        .from('usuarios')
        .update({
          senha_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Erro ao atualizar senha');
      }

      // Log de auditoria
      await this.logAuthEvent('password_change', userId, {
        ip: 'unknown'
      });

      return {
        success: true,
        message: 'Senha alterada com sucesso'
      };

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Recuperar senha
  async resetPassword(email) {
    try {
      this.validateConfig();
      
      if (!email) {
        throw new Error('Email é obrigatório');
      }

      // Buscar usuário
      const { data: user, error } = await this.supabase
        .from('usuarios')
        .select('id, email, username')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !user) {
        // Por segurança, não revelar se o email existe ou não
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
        };
      }

      // Gerar token de recuperação
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        this.jwtConfig.secret,
        { expiresIn: '1h' }
      );

      // Salvar token de recuperação
      const { error: tokenError } = await this.supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token: resetToken,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
          created_at: new Date().toISOString()
        });

      if (tokenError) {
        console.error('Erro ao salvar token de recuperação:', tokenError);
      }

      // TODO: Enviar email com link de recuperação
      console.log(`Token de recuperação para ${user.email}: ${resetToken}`);

      // Log de auditoria
      await this.logAuthEvent('password_reset_request', user.id, {
        email: user.email,
        ip: 'unknown'
      });

      return {
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
      };

    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Gerar token JWT
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      this.jwtConfig.secret,
      { expiresIn: this.jwtConfig.expiresIn }
    );
  }

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Log de eventos de autenticação
  async logAuthEvent(event, userId, metadata = {}) {
    try {
      const { error } = await this.supabase
        .from('auth_logs')
        .insert({
          user_id: userId,
          event: event,
          metadata: metadata,
          ip_address: metadata.ip || 'unknown',
          user_agent: metadata.user_agent || 'unknown',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar log de autenticação:', error);
      }
    } catch (error) {
      console.error('Erro ao criar log de autenticação:', error);
    }
  }

  // Middleware de autenticação para Express
  authenticateToken() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'Token de acesso necessário'
          });
        }

        const result = await this.verifyToken(token);
        
        if (!result.success) {
          return res.status(401).json({
            success: false,
            message: result.message
          });
        }

        req.user = result.user;
        next();

      } catch (error) {
        return res.status(403).json({
          success: false,
          message: 'Token inválido'
        });
      }
    };
  }
}

module.exports = AuthService;
