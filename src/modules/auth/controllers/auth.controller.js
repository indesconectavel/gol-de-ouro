// Controller de Autenticação - Gol de Ouro v1.3.0 - PADRONIZADO
// ✅ FASE 9: Expandido com rotas faltantes
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../../../../database/supabase-unified-config');
const response = require('../../shared/utils/response-helper');
const emailService = require('../../shared/services/email.service');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Configuração inválida: JWT_SECRET não definido no ambiente');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
  // Registrar novo usuário
  static async register(req, res) {
    try {
      const { email, password, username } = req.body;

      if (!email || !password || !username) {
        return response.validationError(res, 'Email, senha e nome de usuário são obrigatórios.');
      }

      // Verificar se o usuário já existe (usar supabaseAdmin para bypass de RLS)
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return response.conflict(res, 'Email já cadastrado.');
      }

      // Hash da senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário (usar supabaseAdmin para bypass de RLS)
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          email,
          senha_hash: passwordHash,
          username,
          saldo: 0.00,
          tipo: 'jogador',
          ativo: true
        })
        .select('id, email, username, saldo, tipo')
        .single();

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return response.serverError(res, createError, 'Erro ao criar usuário.');
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email, 
          role: newUser.tipo || 'jogador'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return response.success(
        res,
        {
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            saldo: newUser.saldo || 0,
            tipo: newUser.tipo || 'jogador'
          }
        },
        'Usuário registrado com sucesso!',
        201
      );

    } catch (error) {
      console.error('Erro no registro:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Login do usuário
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return response.validationError(res, 'Email e senha são obrigatórios.');
      }

      // Buscar usuário (usar supabaseAdmin para bypass de RLS e acesso a senha_hash)
      const { data: user, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, senha_hash, username, saldo, tipo, ativo')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return response.unauthorized(res, 'Credenciais inválidas.');
      }

      // Verificar status da conta
      if (user.ativo !== true) {
        return response.forbidden(res, 'Conta desativada. Entre em contato com o suporte.');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.senha_hash);

      if (!isPasswordValid) {
        return response.unauthorized(res, 'Credenciais inválidas.');
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.tipo || 'jogador'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return response.success(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            saldo: user.saldo || 0,
            tipo: user.tipo || 'jogador'
          }
        },
        'Login realizado com sucesso!'
      );

    } catch (error) {
      console.error('Erro no login:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Recuperação de senha - GERAR TOKEN
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return response.validationError(res, 'Email é obrigatório.');
      }

      // Verificar se email existe
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, username')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (userError || !user) {
        // Por segurança, sempre retornar sucesso mesmo se email não existir
        return response.success(
          res,
          {},
          'Se o email existir, você receberá um link de recuperação'
        );
      }

      // Gerar token de recuperação (válido por 1 hora)
      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          type: 'password_reset' 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Salvar token no banco de dados
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token: resetToken,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora
          used: false,
          created_at: new Date().toISOString()
        });

      if (tokenError) {
        console.error('❌ [FORGOT-PASSWORD] Erro ao salvar token:', tokenError);
        return response.serverError(res, tokenError, 'Erro interno do servidor');
      }

      // Enviar email com link de recuperação
      const emailResult = await emailService.sendPasswordResetEmail(email, user.username, resetToken);
      
      if (emailResult.success) {
        console.log(`📧 [FORGOT-PASSWORD] Email enviado para ${email}`);
      } else {
        console.warn(`⚠️ [FORGOT-PASSWORD] Falha ao enviar email: ${emailResult.error}`);
      }

      return response.success(
        res,
        {},
        'Se o email existir, você receberá um link de recuperação'
      );

    } catch (error) {
      console.error('❌ [FORGOT-PASSWORD] Erro:', error);
      return response.serverError(res, error, 'Erro interno do servidor');
    }
  }

  // Reset de senha - VALIDAR TOKEN E ALTERAR SENHA
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return response.validationError(res, 'Token e nova senha são obrigatórios.');
      }

      if (newPassword.length < 6) {
        return response.validationError(res, 'Nova senha deve ter pelo menos 6 caracteres.');
      }

      // Verificar se token existe e é válido
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('user_id, expires_at, used')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        return response.error(res, 'Token inválido ou expirado', 400);
      }

      // Verificar se token não expirou
      if (new Date() > new Date(tokenData.expires_at)) {
        return response.error(res, 'Token expirado', 400);
      }

      // Hash da nova senha
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha do usuário
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          senha_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.user_id);

      if (updateError) {
        console.error('❌ [RESET-PASSWORD] Erro ao atualizar senha:', updateError);
        return response.serverError(res, updateError, 'Erro ao atualizar senha');
      }

      // Marcar token como usado
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      console.log(`✅ [RESET-PASSWORD] Senha alterada com sucesso para usuário ${tokenData.user_id}`);
      
      return response.success(
        res,
        {},
        'Senha alterada com sucesso'
      );

    } catch (error) {
      console.error('❌ [RESET-PASSWORD] Erro:', error);
      return response.serverError(res, error, 'Erro interno do servidor');
    }
  }

  // Verificação de email
  static async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return response.validationError(res, 'Token é obrigatório.');
      }

      // Verificar se token existe e é válido
      const { data: tokenData, error: tokenError } = await supabase
        .from('email_verification_tokens')
        .select('user_id, expires_at, used')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        return response.error(res, 'Token de verificação inválido ou expirado', 400);
      }

      // Verificar se token não expirou
      if (new Date() > new Date(tokenData.expires_at)) {
        return response.error(res, 'Token de verificação expirado', 400);
      }

      // Marcar email como verificado
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          email_verificado: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.user_id);

      if (updateError) {
        console.error('❌ [VERIFY-EMAIL] Erro ao verificar email:', updateError);
        return response.serverError(res, updateError, 'Erro ao verificar email');
      }

      // Marcar token como usado
      await supabase
        .from('email_verification_tokens')
        .update({ used: true })
        .eq('token', token);

      console.log(`✅ [VERIFY-EMAIL] Email verificado com sucesso para usuário ${tokenData.user_id}`);
      
      return response.success(
        res,
        {},
        'Email verificado com sucesso! Sua conta está ativa.'
      );

    } catch (error) {
      console.error('❌ [VERIFY-EMAIL] Erro:', error);
      return response.serverError(res, error, 'Erro interno do servidor');
    }
  }

  // Alterar senha (após login)
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      if (!currentPassword || !newPassword) {
        return response.validationError(res, 'Senha atual e nova senha são obrigatórias.');
      }

      if (newPassword.length < 6) {
        return response.validationError(res, 'Nova senha deve ter pelo menos 6 caracteres.');
      }

      // Buscar usuário atual
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .eq('ativo', true)
        .single();

      if (userError || !user) {
        return response.notFound(res, 'Usuário não encontrado');
      }

      // Verificar senha atual
      const currentPasswordValid = await bcrypt.compare(currentPassword, user.senha_hash);
      if (!currentPasswordValid) {
        return response.unauthorized(res, 'Senha atual incorreta');
      }

      // Gerar hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha no banco
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          senha_hash: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ [CHANGE-PASSWORD] Erro ao atualizar senha:', updateError);
        return response.serverError(res, updateError, 'Erro interno do servidor');
      }

      console.log(`✅ [CHANGE-PASSWORD] Senha alterada para usuário ${user.email}`);
      
      return response.success(
        res,
        {},
        'Senha alterada com sucesso'
      );
      
    } catch (error) {
      console.error('❌ [CHANGE-PASSWORD] Erro:', error);
      return response.serverError(res, error, 'Erro interno do servidor');
    }
  }
}

module.exports = AuthController;
