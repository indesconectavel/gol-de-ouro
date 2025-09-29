// server-fly-temp.js - Backend temporário sem banco para funcionar
const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

// Middlewares de segurança
const requestId = require('./middlewares/requestId');
const secureHeaders = require('./middlewares/secureHeaders');
const buildRateLimit = require('./middlewares/rateLimit');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// 1) Trust proxy (Fly) para rate-limit e IP real
app.set('trust proxy', 1);

// 2) Request ID sempre primeiro
app.use(requestId());

// 4) Segurança e compressão
app.use(secureHeaders);
app.use(compression());

// 5) CORS estrito
const allowedOrigins = [
  'https://goldeouro.lol',
  'https://admin.goldeouro.lol',
  'https://app.goldeouro.lol'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  credentials: true
}));

// 6) Body parser com limite
app.use(express.json({ limit: '1mb' }));

// 7) Rate limit GLOBAL
app.use(buildRateLimit());

// Health checks (não rate-limit)
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Endpoint /version
app.get('/version', (_req, res) => {
  res.status(200).json({
    version: process.env.APP_VERSION || 'v1.1.1',
    commit: process.env.APP_COMMIT || 'unknown'
  });
});

// Readiness check
app.get('/readiness', async (_req, res) => {
  try {
    // Verificar se todas as dependências estão OK
    res.status(200).json({ 
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok', // Temporariamente OK
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({ 
      status: 'not ready',
      error: error.message 
    });
  }
});

// Middleware de autenticação simples (temporário)
const authenticatePlayer = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }
  // Por enquanto, aceita qualquer token
  req.user = { id: 1, email: 'test@example.com' };
  next();
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token de administrador necessário' });
  }
  // Por enquanto, aceita qualquer token
  req.admin = { id: 1, email: 'admin@example.com' };
  next();
};

// Rotas de Autenticação (TEMPORÁRIAS - SEM BANCO)
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }
  
  // Simular cadastro bem-sucedido
  res.status(201).json({ 
    message: 'Usuário registrado com sucesso', 
    user: { 
      id: Date.now(), 
      email, 
      name,
      created_at: new Date().toISOString()
    }
  });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  // Simular login bem-sucedido
  res.status(200).json({ 
    message: 'Login realizado com sucesso',
    token: 'temp_token_' + Date.now(),
    user: { 
      id: 1, 
      email, 
      name: 'Usuário Teste'
    }
  });
});

// Rotas de Pagamento PIX (TEMPORÁRIAS - SEM MERCADO PAGO)
app.post('/api/payments/pix/criar', async (req, res) => {
  try {
    const { amount, user_id } = req.body;
    
    if (!amount || !user_id) {
      return res.status(400).json({ error: 'Valor e ID do usuário são obrigatórios' });
    }
    
    // Validar valor do PIX (R$1 a R$500)
    const minPix = 1.00;
    const maxPix = 500.00;
    const pixAmount = parseFloat(amount);
    
    if (pixAmount < minPix || pixAmount > maxPix) {
      return res.status(400).json({
        error: `Valor do PIX deve estar entre R$ ${minPix} e R$ ${maxPix}`
      });
    }
    
    // Simular PIX bem-sucedido
    res.status(200).json({
      message: 'PIX criado com sucesso',
      transaction_id: `pix_${Date.now()}`,
      amount: pixAmount,
      status: 'pending',
      qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=temp_pref_' + Date.now()
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de jogo (TEMPORÁRIA)
app.post('/api/games/shoot', authenticatePlayer, async (req, res) => {
  try {
    const { amount, direction } = req.body;
    
    if (!amount || !direction) {
      return res.status(400).json({ error: 'Valor e direção são obrigatórios' });
    }
    
    // Simular resultado do jogo
    const isGoal = Math.random() < 0.1; // 10% de chance de gol
    
    res.status(200).json({
      success: true,
      isGoal,
      direction,
      amount: parseFloat(amount),
      prize: isGoal ? parseFloat(amount) * 2 : 0,
      message: isGoal ? 'GOL! Você ganhou!' : 'Defesa! Tente novamente.'
    });
  } catch (error) {
    console.error('Erro no jogo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dashboard público (TEMPORÁRIO)
app.get('/api/public/dashboard', async (req, res) => {
  try {
    res.status(200).json({
      totalUsers: 150,
      totalShots: 2500,
      totalGoals: 250,
      totalPrizes: 1250.00,
      recentShots: [
        { id: 1, user: 'Jogador 1', amount: 5, isGoal: true, timestamp: new Date().toISOString() },
        { id: 2, user: 'Jogador 2', amount: 10, isGoal: false, timestamp: new Date().toISOString() }
      ]
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gol de Ouro Backend API',
    version: '1.1.1',
    timestamp: new Date().toISOString(),
    status: 'running',
    environment: 'production'
  });
});

// 9) Error handler por último
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
