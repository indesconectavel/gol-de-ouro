// Servidor SIMPLIFICADO para Render - SEM BANCO DE DADOS
// Resolve problema de conexão com PostgreSQL
// CORRIGIDO: Router principal incluído

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar router principal (corrige erro "Cannot find module './router'")
const mainRouter = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

// OTIMIZAÇÕES DE MEMÓRIA
process.setMaxListeners(0);

// Monitoramento de memória
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const heapUsed = memUsage.heapUsed;
  const heapTotal = memUsage.heapTotal;
  const rss = memUsage.rss;
  const heapPercent = ((heapUsed / heapTotal) * 100).toFixed(2);
  
  console.log(`📊 Memória: ${heapPercent}% | RSS: ${Math.round(rss / 1024 / 1024)}MB | Heap: ${Math.round(heapUsed / 1024 / 1024)}/${Math.round(heapTotal / 1024 / 1024)}MB`);
  
  // Limpeza agressiva se memória alta
  if (heapPercent > 85) {
    console.log('🧹 Limpeza de memória...');
    if (global.gc) {
      global.gc();
    }
  }
};

setInterval(monitorMemory, 15000);

// CORS configurado para arquitetura desacoplada
const corsOptions = {
  origin: [
    'http://localhost:5173', // Player local
    'http://localhost:5174', // Admin local
    'https://goldeouro-player.vercel.app', // Player produção
    'https://goldeouro-admin.vercel.app', // Admin produção
    'https://app.goldeouro.lol', // Player domínio customizado
    'https://admin.goldeouro.lol', // Admin domínio customizado
    'https://goldeouro.lol' // Domínio principal
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-admin-token', 'x-player-token']
};

app.use(cors(corsOptions));

// Configurações de segurança por ambiente
const ENABLE_HELMET = process.env.NODE_ENV === 'production' || process.env.ENABLE_HELMET !== 'false';
const ENABLE_RATE_LIMIT = process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true';

if (ENABLE_HELMET) {
  app.use(helmet({ 
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "http://localhost:3000", "https://api.goldeouro.lol", "https://api.staging.goldeouro.lol"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  }));
}

if (ENABLE_RATE_LIMIT) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15*60*1000);
  const max = Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 300 : 1000));
  app.use(rateLimit({ 
    windowMs, 
    max, 
    standardHeaders: true, 
    legacyHeaders: false,
    message: 'Muitas requisições a partir deste IP, por favor, tente novamente após 15 minutos.'
  }));
}

app.use(express.json({ limit: '50kb' }));

// Usar router principal
app.use('/', mainRouter);

// Dados em memória (temporário)
const users = new Map();
const games = new Map();
const payments = new Map();
const notifications = new Map();

// Usuário admin padrão
users.set('admin@goldeouro.lol', {
  id: 1,
  name: 'Admin',
  email: 'admin@goldeouro.lol',
  password_hash: '$2b$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K',
  balance: 1000.00,
  account_status: 'active',
  created_at: new Date()
});

// ROTAS BÁSICAS
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend Gol de Ouro - RENDER FIX',
    version: '1.0.0',
    status: 'online',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Rota de health para keep-alive (mais detalhada)
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// ROTAS DE AUTENTICAÇÃO
app.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (users.has(email)) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    const user = {
      id: users.size + 1,
      name,
      email,
      password_hash: password, // Em produção, usar bcrypt
      balance: 0.00,
      account_status: 'active',
      created_at: new Date()
    };
    
    users.set(email, user);
    
    res.json({ 
      message: 'Usuário criado com sucesso',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.get(email);
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    res.json({ 
      message: 'Login realizado com sucesso',
      user: { id: user.id, name: user.name, email: user.email, balance: user.balance },
      token: 'jwt_token_placeholder'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ROTAS DE USUÁRIO
app.get('/usuario/perfil', (req, res) => {
  try {
    const user = users.get('admin@goldeouro.lol'); // Mock
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      account_status: user.account_status
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ROTAS DE JOGOS
app.get('/api/games/status', (req, res) => {
  res.json({
    inQueue: 0,
    activeGames: 0,
    totalGames: games.size,
    status: 'online'
  });
});

app.post('/api/games/fila/entrar', (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = users.get('admin@goldeouro.lol'); // Mock
    
    if (user.balance < betAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    
    const game = {
      id: games.size + 1,
      user_id: user.id,
      bet_amount: betAmount,
      total_shots: 5,
      shots_taken: 0,
      status: 'active',
      created_at: new Date()
    };
    
    games.set(game.id, game);
    
    res.json({
      message: 'Entrou na fila',
      game: game
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/games/chutar', (req, res) => {
  try {
    const { gameId, zone, goalieDirection } = req.body;
    
    const game = games.get(parseInt(gameId));
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    
    // Simular resultado do chute
    const isGoal = Math.random() > 0.5;
    const result = isGoal ? 'goal' : 'miss';
    
    game.shots_taken++;
    
    res.json({
      result: result,
      shots_taken: game.shots_taken,
      total_shots: game.total_shots,
      isGoal: isGoal
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ROTAS DE PAGAMENTOS
app.post('/api/payments/pix/criar', (req, res) => {
  try {
    const { amount, description } = req.body;
    
    const payment = {
      id: payments.size + 1,
      user_id: 1,
      amount: amount,
      description: description,
      status: 'pending',
      qr_code: 'mock_qr_code',
      pix_code: 'mock_pix_code',
      created_at: new Date()
    };
    
    payments.set(payment.id, payment);
    
    res.json({
      message: 'Pagamento PIX criado',
      payment: payment
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/payments/pix/usuario', (req, res) => {
  try {
    const userPayments = Array.from(payments.values()).filter(p => p.user_id === 1);
    res.json(userPayments);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ROTAS DE NOTIFICAÇÕES
app.get('/notifications', (req, res) => {
  try {
    const userNotifications = Array.from(notifications.values()).filter(n => n.user_id === 1);
    res.json(userNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ROTAS DE ADMIN
app.get('/admin/lista-usuarios', (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      account_status: user.account_status,
      created_at: user.created_at
    }));
    
    res.json(userList);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/admin/analytics', (req, res) => {
  try {
    const analytics = {
      totalUsers: users.size,
      totalGames: games.size,
      totalRevenue: Array.from(payments.values()).reduce((sum, p) => sum + p.amount, 0),
      averageBet: 50.00,
      activeUsers24h: 1,
      newUsers7d: 1
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ROTA DE FILA
app.get('/fila', (req, res) => {
  res.json({
    position: 1,
    estimatedWait: 30,
    totalInQueue: 0
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro não capturado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`✅ Servidor RENDER FIX rodando na porta ${PORT}`);
      console.log(`🌐 Acesse: http://localhost:${PORT}`);
      console.log('📊 Monitoramento de memória ativo');
      console.log('🏗️ Arquitetura: Frontend Vercel + Backend Render');
      console.log('📊 Memória inicial:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

// FORCE REDEPLOY: 20250923-182350
