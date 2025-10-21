// Controller de Autenticação - Gol de Ouro v1.1.1
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../database/supabase-config');

const JWT_SECRET = process.env.JWT_SECRET || 'goldeouro-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
  // Registrar novo usuário
  static async register(req, res) {
    try {
      const { email, password, username } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email, senha e nome de usuário são obrigatórios.' 
        });
      }

      // Verificar se o usuário já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email já cadastrado.' 
        });
      }

      // Hash da senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const { data: newUser, error: createError } = await supabase
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
        return res.status(500).json({ 
          success: false, 
          message: 'Erro interno do servidor.' 
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email, 
          role: newUser.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso!',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          balance: newUser.balance,
          role: newUser.role
        }
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor.' 
      });
    }
  }

  // Login do usuário
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email e senha são obrigatórios.' 
        });
      }

      // Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, senha_hash, username, saldo, tipo, ativo')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas.' 
        });
      }

      // Verificar status da conta
      if (user.ativo !== true) {
        return res.status(403).json({ 
          success: false, 
          message: 'Conta desativada. Entre em contato com o suporte.' 
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.senha_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas.' 
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.tipo 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          saldo: user.saldo,
          role: user.tipo
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor.' 
      });
    }
  }
}

module.exports = AuthController;
