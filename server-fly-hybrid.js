// SERVIDOR HÍBRIDO - TENTA DADOS REAIS, FALLBACK PARA SIMULADOS - Gol de Ouro v1.1.1
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { error: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// 7) Tentar conectar com Supabase (opcional)
let supabase = null;
let supabaseAdmin = null;
let dbConnected = false;

try {
  const { supabase: supabaseClient, supabaseAdmin: supabaseAdminClient, testConnection } = require('./database/supabase-config');
  supabase = supabaseClient;
  supabaseAdmin = supabaseAdminClient;
  
  // Testar conexão em background
  testConnection().then(connected => {
    dbConnected = connected;
    console.log(dbConnected ? '✅ Supabase conectado' : '⚠️ Supabase desconectado - usando fallback');
  }).catch(() => {
    console.log('⚠️ Supabase não disponível - usando fallback');
  });
} catch (error) {
  console.log('⚠️ Supabase não configurado - usando fallback');
}

// 8) Dados em memória (fallback)
const users = new Map();
const games = new Map();
const payments = new Map();
const notifications = new Map();

// 9) Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    // Tentar primeiro com o secret real
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (realError) {
      // Se falhar, tentar com o fallback
      decoded = jwt.verify(token, 'fallback-secret');
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// 10) Health checks
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbConnected ? 'connected' : 'fallback',
      mode: 'hybrid'
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
      database: dbConnected ? 'connected' : 'fallback',
      version: '1.1.1',
      environment: process.env.NODE_ENV || 'production',
      mode: 'hybrid'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 11) Rotas de autenticação HÍBRIDAS
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Tentar usar banco real primeiro
    if (dbConnected && supabaseAdmin) {
      try {
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

        if (error) throw error;

        // Gerar token JWT
        const token = jwt.sign(
          { id: newUser.id, email: newUser.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(201).json({
          message: 'Usuário registrado com sucesso (BANCO REAL)',
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            balance: newUser.balance,
            created_at: newUser.created_at
          },
          token
        });
      } catch (dbError) {
        console.log('⚠️ Erro no banco, usando fallback:', dbError.message);
        // Continuar para fallback
      }
    }

    // Fallback: dados em memória
    if (users.has(email)) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const user = {
      id: Date.now(),
      email,
      name,
      password_hash: await bcrypt.hash(password, 10),
      balance: 0.00,
      account_status: 'active',
      created_at: new Date().toISOString()
    };

    users.set(email, user);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso (FALLBACK)',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        created_at: user.created_at
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

    // Tentar usar banco real primeiro
    if (dbConnected && supabaseAdmin) {
      try {
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user) {
          throw new Error('Usuário não encontrado');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          throw new Error('Senha inválida');
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          message: 'Login realizado com sucesso (BANCO REAL)',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            balance: user.balance,
            account_status: user.account_status
          },
          token
        });
      } catch (dbError) {
        console.log('⚠️ Erro no banco, usando fallback:', dbError.message);
        // Continuar para fallback
      }
    }

    // Fallback: dados em memória
    const user = users.get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso (FALLBACK)',
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

// 12) Rotas de PIX HÍBRIDAS
app.post('/api/payments/pix/criar', async (req, res) => {
  try {
    const { amount, user_id } = req.body;

    if (!amount || !user_id) {
      return res.status(400).json({ error: 'Valor e ID do usuário são obrigatórios' });
    }

    const minPix = 1.00;
    const maxPix = 500.00;
    const pixAmount = parseFloat(amount);

    if (pixAmount < minPix || pixAmount > maxPix) {
      return res.status(400).json({
        error: `Valor do PIX deve estar entre R$ ${minPix} e R$ ${maxPix}`
      });
    }

    // Tentar usar Mercado Pago real primeiro
    if (process.env.MP_ACCESS_TOKEN) {
      try {
        const { MercadoPagoConfig, Payment } = require('mercadopago');
        const mercadoPago = new MercadoPagoConfig({
          accessToken: process.env.MP_ACCESS_TOKEN,
          options: { timeout: 5000 }
        });

        const payment = new Payment(mercadoPago);
        const paymentData = {
          transaction_amount: pixAmount,
          description: `Depósito Gol de Ouro - Usuário ${user_id}`,
          payment_method_id: 'pix',
          payer: { email: 'test@example.com' }
        };

        const result = await payment.create({ body: paymentData });

        // Salvar no banco se disponível
        if (dbConnected && supabaseAdmin) {
          await supabaseAdmin.from('transactions').insert({
            user_id: user_id,
            amount: pixAmount,
            type: 'deposit',
            status: 'pending',
            external_id: result.id,
            created_at: new Date().toISOString()
          });
        }

        return res.status(200).json({
          message: 'PIX criado com sucesso (MERCADO PAGO REAL)',
          transaction_id: `pix_${Date.now()}`,
          external_id: result.id,
          amount: pixAmount,
          status: 'pending',
          qr_code: result.point_of_interaction?.transaction_data?.qr_code || '',
          init_point: result.init_point || ''
        });
      } catch (mpError) {
        console.log('⚠️ Erro no Mercado Pago, usando fallback:', mpError.message);
        // Continuar para fallback
      }
    }

    // Fallback: PIX simulado
    const payment = {
      id: payments.size + 1,
      user_id: user_id,
      amount: pixAmount,
      status: 'pending',
      qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=temp_pref_' + Date.now(),
      created_at: new Date()
    };

    payments.set(payment.id, payment);

    res.status(200).json({
      message: 'PIX criado com sucesso (FALLBACK)',
      transaction_id: `pix_${Date.now()}`,
      amount: pixAmount,
      status: 'pending',
      qr_code: payment.qr_code,
      init_point: payment.init_point
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 13) Rota de jogo HÍBRIDA
app.post('/api/games/shoot', authenticateToken, async (req, res) => {
  try {
    const { amount, direction } = req.body;
    const userId = req.user.id;

    if (!amount || !direction) {
      return res.status(400).json({ error: 'Valor e direção são obrigatórios' });
    }

    // Tentar usar banco real primeiro
    if (dbConnected && supabaseAdmin) {
      try {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          throw new Error('Usuário não encontrado');
        }

        if (user.balance < amount) {
          return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        const isGoal = Math.random() < 0.1;
        const prize = isGoal ? amount * 2 : 0;
        const newBalance = user.balance - amount + prize;

        await supabaseAdmin
          .from('users')
          .update({ balance: newBalance })
          .eq('id', userId);

        await supabaseAdmin
          .from('shot_attempts')
          .insert({
            user_id: userId,
            amount: amount,
            direction: direction,
            is_goal: isGoal,
            prize: prize,
            created_at: new Date().toISOString()
          });

        return res.status(200).json({
          success: true,
          isGoal,
          direction,
          amount: parseFloat(amount),
          prize: prize,
          newBalance: newBalance,
          message: isGoal ? 'GOL! Você ganhou! (BANCO REAL)' : 'Defesa! Tente novamente. (BANCO REAL)'
        });
      } catch (dbError) {
        console.log('⚠️ Erro no banco, usando fallback:', dbError.message);
        // Continuar para fallback
      }
    }

    // Fallback: dados em memória
    const user = Array.from(users.values()).find(u => u.id == userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const isGoal = Math.random() < 0.1;
    const prize = isGoal ? amount * 2 : 0;
    user.balance = user.balance - amount + prize;

    const game = {
      id: games.size + 1,
      user_id: userId,
      amount: amount,
      direction: direction,
      is_goal: isGoal,
      prize: prize,
      created_at: new Date()
    };

    games.set(game.id, game);

    res.status(200).json({
      success: true,
      isGoal,
      direction,
      amount: parseFloat(amount),
      prize: prize,
      newBalance: user.balance,
      message: isGoal ? 'GOL! Você ganhou! (FALLBACK)' : 'Defesa! Tente novamente. (FALLBACK)'
    });
  } catch (error) {
    console.error('Erro no jogo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 14) Dashboard público HÍBRIDO
app.get('/api/public/dashboard', async (req, res) => {
  try {
    if (dbConnected && supabaseAdmin) {
      try {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id');

        const { data: shots, error: shotsError } = await supabaseAdmin
          .from('shot_attempts')
          .select('is_goal, amount, created_at');

        if (!usersError && !shotsError) {
          const totalUsers = users.length;
          const totalShots = shots.length;
          const totalGoals = shots.filter(shot => shot.is_goal).length;
          const totalPrizes = shots
            .filter(shot => shot.is_goal)
            .reduce((sum, shot) => sum + shot.amount, 0);

          return res.status(200).json({
            totalUsers,
            totalShots,
            totalGoals,
            totalPrizes,
            recentShots: shots.slice(-5).map(shot => ({
              id: shot.id,
              amount: shot.amount,
              isGoal: shot.is_goal,
              timestamp: shot.created_at
            })),
            source: 'BANCO REAL'
          });
        }
      } catch (dbError) {
        console.log('⚠️ Erro no banco, usando fallback para dashboard');
      }
    }

    // Fallback: dados em memória
    const totalUsers = users.size;
    const totalShots = games.size;
    const totalGoals = Array.from(games.values()).filter(g => g.is_goal).length;
    const totalPrizes = Array.from(games.values())
      .filter(g => g.is_goal)
      .reduce((sum, g) => sum + g.prize, 0);

    res.status(200).json({
      totalUsers,
      totalShots,
      totalGoals,
      totalPrizes,
      recentShots: Array.from(games.values()).slice(-5).map(game => ({
        id: game.id,
        amount: game.amount,
        isGoal: game.is_goal,
        timestamp: game.created_at
      })),
      source: 'FALLBACK'
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 15) Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gol de Ouro Backend API - HÍBRIDO',
    version: '1.1.1',
    timestamp: new Date().toISOString(),
    status: 'running',
    environment: 'production',
    mode: 'hybrid',
    features: {
      database: dbConnected ? 'Supabase (REAL)' : 'Memória (FALLBACK)',
      payments: process.env.MP_ACCESS_TOKEN ? 'Mercado Pago (REAL)' : 'Simulado (FALLBACK)',
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
const startServer = () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor HÍBRIDO rodando na porta ${PORT}`);
      console.log(`🌐 Acesse: http://localhost:${PORT}`);
      console.log(`🗄️ Banco: ${dbConnected ? 'Supabase conectado' : 'Fallback ativo'}`);
      console.log(`💳 Pagamentos: ${process.env.MP_ACCESS_TOKEN ? 'Mercado Pago configurado' : 'Fallback ativo'}`);
      console.log(`🔐 Autenticação: JWT ativo`);
      console.log(`🛡️ Segurança: Helmet + Rate Limit`);
      console.log(`📊 Modo: Híbrido (Real + Fallback)`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
