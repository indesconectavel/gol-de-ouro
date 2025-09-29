const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha muito curta',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verifica se já existe usuário
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Usuário já existe',
        message: 'Este email já está cadastrado'
      });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Cria novo usuário
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, balance, created_at) VALUES ($1, $2, $3, 0, NOW()) RETURNING *',
      [name, email, passwordHash]
    );

    // Remove senha da resposta
    const { password_hash, ...userWithoutPassword } = newUser.rows[0];

    res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).json({ 
      error: 'Erro interno',
      message: 'Erro ao cadastrar usuário'
    });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'Email e senha são obrigatórios'
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ 
        error: 'Usuário não encontrado',
        message: 'Email ou senha incorretos'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Gera token JWT usando JWT_SECRET validado
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name
      },
      env.JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'goldeouro-backend',
        audience: 'goldeouro-admin'
      }
    );

    // Remove senha da resposta
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ 
      error: 'Erro interno',
      message: 'Erro ao processar login'
    });
  }
};
