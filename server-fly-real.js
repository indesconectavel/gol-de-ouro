// SERVIDOR REAL COM BANCO DE DADOS E MERCADO PAGO - Gol de Ouro v1.1.1
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { supabase, supabaseAdmin, testConnection } = require('./database/supabase-config');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Trust proxy (Fly.io)
app.set('trust proxy', 1);

// 2) Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://goldeouro-backend-v2.fly.dev", "wss://goldeouro-backend-v2.fly.dev"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      scriptSrcAttr: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// 3) Compressão
app.use(compression());

// 4) CORS
const corsOptions = {
  origin: [
    'https://goldeouro.lol',
    'https://admin.goldeouro.lol',
    'https://app.goldeouro.lol',
    'http://localhost:5174',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
};
app.use(cors(corsOptions));

// 5) Body parser
app.use(express.json({ limit: '1mb' }));

// 6) Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { error: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// 7) Configurar Mercado Pago
const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

// 8) Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// 9) Health checks
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      database: dbConnected ? 'connected' : 'disconnected',
      version: '1.1.1',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 10) Rota de readiness
app.get('/readiness', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      return res.status(503).json({
        status: 'not ready',
        error: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 11) Rotas de autenticação REAL
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário no banco
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        balance: 0.00,
        account_status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        balance: newUser.balance,
        created_at: newUser.created_at
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        account_status: user.account_status
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 12) Rotas de PIX REAL
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

    // Criar pagamento no Mercado Pago
    const payment = new Payment(mercadoPago);
    
    const paymentData = {
      transaction_amount: pixAmount,
      description: `Depósito Gol de Ouro - Usuário ${user_id}`,
      payment_method_id: 'pix',
      payer: {
        email: 'test@example.com' // Em produção, buscar email do usuário
      }
    };

    const result = await payment.create({ body: paymentData });

    // Salvar transação no banco
    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user_id,
        amount: pixAmount,
        type: 'deposit',
        status: 'pending',
        external_id: result.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar transação:', dbError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.status(200).json({
      message: 'PIX criado com sucesso',
      transaction_id: transaction.id,
      external_id: result.id,
      amount: pixAmount,
      status: 'pending',
      qr_code: result.point_of_interaction?.transaction_data?.qr_code || '',
      init_point: result.init_point || ''
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 13) Rota de jogo REAL
app.post('/api/games/shoot', authenticateToken, async (req, res) => {
  try {
    const { amount, direction } = req.body;
    const userId = req.user.id;

    if (!amount || !direction) {
      return res.status(400).json({ error: 'Valor e direção são obrigatórios' });
    }

    // Verificar saldo do usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Simular resultado do jogo (10% de chance de gol)
    const isGoal = Math.random() < 0.1;
    const prize = isGoal ? amount * 2 : 0;
    const newBalance = user.balance - amount + prize;

    // Atualizar saldo do usuário
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar saldo:', updateError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Salvar tentativa de chute
    const { error: shotError } = await supabaseAdmin
      .from('shot_attempts')
      .insert({
        user_id: userId,
        amount: amount,
        direction: direction,
        is_goal: isGoal,
        prize: prize,
        created_at: new Date().toISOString()
      });

    if (shotError) {
      console.error('Erro ao salvar chute:', shotError);
    }

    res.status(200).json({
      success: true,
      isGoal,
      direction,
      amount: parseFloat(amount),
      prize: prize,
      newBalance: newBalance,
      message: isGoal ? 'GOL! Você ganhou!' : 'Defesa! Tente novamente.'
    });
  } catch (error) {
    console.error('Erro no jogo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 14) Dashboard público
app.get('/api/public/dashboard', async (req, res) => {
  try {
    // Buscar estatísticas do banco
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id');

    const { data: shots, error: shotsError } = await supabaseAdmin
      .from('shot_attempts')
      .select('is_goal, amount');

    if (usersError || shotsError) {
      console.error('Erro ao buscar dados:', usersError || shotsError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    const totalUsers = users.length;
    const totalShots = shots.length;
    const totalGoals = shots.filter(shot => shot.is_goal).length;
    const totalPrizes = shots
      .filter(shot => shot.is_goal)
      .reduce((sum, shot) => sum + shot.amount, 0);

    res.status(200).json({
      totalUsers,
      totalShots,
      totalGoals,
      totalPrizes,
      recentShots: shots.slice(-5).map(shot => ({
        id: shot.id,
        amount: shot.amount,
        isGoal: shot.is_goal,
        timestamp: shot.created_at
      }))
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 15) Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gol de Ouro Backend API - PRODUÇÃO REAL',
    version: '1.1.1',
    timestamp: new Date().toISOString(),
    status: 'running',
    environment: 'production',
    features: {
      database: 'Supabase',
      payments: 'Mercado Pago',
      authentication: 'JWT',
      security: 'Helmet + Rate Limit'
    }
  });
});

// 16) Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro não capturado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 17) Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com banco
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Falha na conexão com banco de dados');
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor REAL rodando na porta ${PORT}`);
      console.log(`🌐 Acesse: http://localhost:${PORT}`);
      console.log(`🗄️ Banco: Supabase conectado`);
      console.log(`💳 Pagamentos: Mercado Pago configurado`);
      console.log(`🔐 Autenticação: JWT ativo`);
      console.log(`🛡️ Segurança: Helmet + Rate Limit`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
