// SERVIDOR CORRIGIDO - AUTENTICAÇÃO FUNCIONAL PARA NOVOS USUÁRIOS
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['https://goldeouro.lol', 'https://www.goldeouro.lol'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});
app.use(limiter);

// Dados em memória (fallback)
const usuarios = [];

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Gol de Ouro Backend CORRIGIDO Online',
    timestamp: new Date().toISOString(),
    version: 'v1.1.1-corrigido',
    usuarios: usuarios.length,
    sistema: 'AUTENTICAÇÃO FUNCIONAL'
  });
});

// REGISTRO CORRIGIDO - Com hash de senha
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    console.log('🔐 [REGISTRO] Tentativa:', { email, username });

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, senha e nome de usuário são obrigatórios.'
      });
    }

    // Verificar se usuário já existe
    const usuarioExistente = usuarios.find(u => u.email === email);
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado.'
      });
    }

    // Hash da senha com bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário com senha hasheada
    const novoUsuario = {
      id: usuarios.length + 1,
      email,
      password_hash: passwordHash,
      username,
      saldo: 0.00,
      role: 'player',
      account_status: 'active',
      created_at: new Date().toISOString()
    };

    usuarios.push(novoUsuario);

    // Gerar token JWT
    const token = jwt.sign(
      { id: novoUsuario.id, email: novoUsuario.email },
      process.env.JWT_SECRET || 'goldeouro-secret-key-2025',
      { expiresIn: '24h' }
    );

    console.log('✅ [REGISTRO] Usuário criado:', { email, id: novoUsuario.id });

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        username: novoUsuario.username,
        saldo: novoUsuario.saldo,
        role: novoUsuario.role
      }
    });

  } catch (error) {
    console.error('❌ [REGISTRO] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.'
    });
  }
});

// LOGIN CORRIGIDO - Com validação bcrypt
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 [LOGIN] Tentativa:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios.'
      });
    }

    // Buscar usuário
    const usuario = usuarios.find(u => u.email === email);
    
    if (!usuario) {
      console.log('❌ [LOGIN] Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Verificar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);

    if (!isPasswordValid) {
      console.log('❌ [LOGIN] Senha inválida:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'goldeouro-secret-key-2025',
      { expiresIn: '24h' }
    );

    console.log('✅ [LOGIN] Login realizado:', { email, id: usuario.id });

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        saldo: usuario.saldo,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.'
    });
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'goldeouro-secret-key-2025');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Endpoint de perfil
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const usuario = usuarios.find(u => u.id === req.user.id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  res.json({
    id: usuario.id,
    email: usuario.email,
    username: usuario.username,
    saldo: usuario.saldo,
    role: usuario.role
  });
});

// PIX endpoints (simplificados)
app.post('/api/payments/pix/criar', authenticateToken, (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount < 1) {
    return res.status(400).json({
      success: false,
      message: 'Valor inválido'
    });
  }

  // Simular criação de PIX
  const pixData = {
    id: `pix_${Date.now()}`,
    amount: parseFloat(amount),
    qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'PIX criado com sucesso!',
    data: pixData
  });
});

// Webhook PIX (simplificado)
app.post('/api/payments/pix/webhook', (req, res) => {
  console.log('📨 [WEBHOOK] PIX recebido:', req.body);
  res.status(200).json({ received: true });
});

// Jogo endpoints (simplificados)
app.post('/api/games/shoot', authenticateToken, (req, res) => {
  const { zone, betAmount } = req.body;
  
  const usuario = usuarios.find(u => u.id === req.user.id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (usuario.saldo < betAmount) {
    return res.status(400).json({
      success: false,
      message: 'Saldo insuficiente'
    });
  }

  // Simular jogo
  const isGoal = Math.random() > 0.4; // 60% chance de gol
  const multiplier = 1.5;
  const winAmount = isGoal ? betAmount * multiplier : 0;

  // Atualizar saldo
  usuario.saldo = usuario.saldo - betAmount + winAmount;

  res.json({
    success: true,
    result: {
      zone,
      isGoal,
      betAmount,
      winAmount,
      newBalance: usuario.saldo
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor CORRIGIDO rodando na porta ${PORT}`);
  console.log(`📱 Sistema de autenticação funcional para novos usuários`);
  console.log(`🔐 Hash de senha: bcrypt`);
  console.log(`🎯 JWT: Funcionando`);
});
