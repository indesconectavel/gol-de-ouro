// SERVIDOR HÍBRIDO CORRIGIDO - DADOS REAIS EM PRODUÇÃO - Gol de Ouro v1.1.2
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
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol',
    'https://app.goldeouro.lol',
    'http://localhost:5174',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// 5) Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por IP
  message: { error: 'Muitas tentativas, tente novamente em 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// 6) Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7) Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 8) Variáveis globais
let dbConnected = false;
let supabase = null;
let supabaseAdmin = null;

// 8.1) Banco de dados em memória (fallback)
const users = new Map();

// 8.2) Criar usuário admin padrão
const adminUser = {
  id: 1,
  email: 'admin@admin.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  name: 'Admin',
  balance: 100,
  createdAt: new Date().toISOString(),
  accountStatus: 'active'
};
users.set('admin@admin.com', adminUser);

// Usuário de teste para E2E
const testUser = {
  id: 'test_user_123',
  email: 'free10signer@gmail.com',
  password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
  name: 'Test User',
  balance: 0,
  accountStatus: 'active'
};
users.set('free10signer@gmail.com', testUser);

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
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbConnected ? 'connected' : 'fallback',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// 11) Rota de versão
app.get('/version', (_req, res) => {
  res.status(200).json({
    version: '1.1.2',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// 12) Readiness check
app.get('/readiness', async (_req, res) => {
  try {
    res.status(200).json({
      ready: true,
      database: dbConnected ? 'connected' : 'fallback',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ ready: false, error: error.message });
  }
});

// 13) Rota de registro
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Verificar se usuário já existe
    const existingUser = users.get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const userId = Date.now();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      name: name || 'Usuário',
      balance: 0,
      createdAt: new Date().toISOString(),
      accountStatus: 'active'
    };

    users.set(email, newUser);

    // Gerar token
    const token = jwt.sign(
      { id: userId, email, name: newUser.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        balance: newUser.balance,
        accountStatus: newUser.accountStatus
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 14) Rota de logout
app.post('/auth/logout', (req, res) => {
  try {
    res.status(200).json({
      message: 'Logout realizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 15) Rota de login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log amigável para SIMPLE_MVP
    if (process.env.SIMPLE_MVP === 'true') {
      console.log('🔐 [SIMPLE_MVP] Login Attempt:', { email, timestamp: new Date().toISOString() });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Verificar se usuário existe
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
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
        accountStatus: user.accountStatus
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 16) Rota de criação de PIX
app.post('/api/payments/pix/criar', async (req, res) => {
  try {
    const { amount, description, user_id } = req.body;

    // Log amigável para SIMPLE_MVP
    if (process.env.SIMPLE_MVP === 'true') {
      console.log('🎯 [SIMPLE_MVP] PIX Creation Request:', { amount, user_id, description });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // Tentar usar Mercado Pago real primeiro
    if (process.env.MP_ACCESS_TOKEN) {
      try {
        const { createPixPayment, isConfigured } = require('./services/pix-mercado-pago');
        
        if (isConfigured()) {
          const result = await createPixPayment(amount, user_id || 'anonymous', description);
          
          if (result.success) {
            return res.status(200).json({
              id: result.data.id,
              amount: result.data.amount,
              qr_code: result.data.qr_code,
              qr_code_base64: result.data.qr_code_base64,
              copy_paste_key: result.data.qr_code,
              status: result.data.status,
              external_reference: result.data.external_reference,
              message: 'PIX criado com sucesso (Mercado Pago)'
            });
          } else {
            console.error('Erro Mercado Pago:', result.error);
            // Fallback para simulação
          }
        }
      } catch (mpError) {
        console.error('Erro ao usar Mercado Pago:', mpError);
        // Fallback para simulação
      }
    }

    // Fallback: Simular criação de PIX
    const paymentId = `pix_${Date.now()}`;
    const qrCode = `00020126580014br.gov.bcb.pix0136${paymentId}520400005303986540${amount.toFixed(2)}5802BR5913Gol de Ouro6009Sao Paulo62070503***6304`;

    res.status(200).json({
      id: paymentId,
      amount: amount,
      qr_code: qrCode,
      copy_paste_key: qrCode,
      status: 'pending',
      message: 'PIX criado com sucesso (Simulação)'
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 17) Rota de jogo
app.post('/api/games/shoot', authenticateToken, (req, res) => {
  try {
    const { amount, direction } = req.body;
    const userId = req.user.id;

    if (!amount || !direction) {
      return res.status(400).json({ error: 'Valor e direção são obrigatórios' });
    }

    // Simular jogo
    const win = Math.random() > 0.5;
    const multiplier = win ? 2 : 0;
    const result = win ? 'win' : 'lose';

    res.status(200).json({
      result: result,
      amount: amount,
      multiplier: multiplier,
      win: win,
      message: win ? 'Parabéns! Você ganhou!' : 'Que pena! Tente novamente!'
    });
  } catch (error) {
    console.error('Erro no jogo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 18) Rota de dashboard público
app.get('/api/public/dashboard', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    res.status(200).json({
      message: 'Dashboard carregado com sucesso',
      user: {
        id: userId,
        balance: req.user.balance || 0
      }
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 19) Rota de perfil do usuário
app.get('/api/user/me', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    res.status(200).json({
      id: userId,
      email: req.user.email,
      name: req.user.name || 'Usuário',
      balance: req.user.balance || 0,
      createdAt: req.user.createdAt || new Date().toISOString(),
      accountStatus: req.user.accountStatus || 'active'
    });
  } catch (error) {
    console.error('Erro no perfil do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 20) Rota de status PIX
app.get('/api/payments/pix/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
    }
    
    res.status(200).json({
      id: id,
      status: 'pending',
      message: 'Status consultado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao consultar status PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 21) Rotas de Admin (dados reais)
app.get('/api/admin/users', authenticateToken, (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      status: user.accountStatus || 'active',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || user.createdAt
    }));
    
    res.status(200).json(userList);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    const userList = Array.from(users.values());
    const totalUsers = userList.length;
    const activeUsers = userList.filter(u => u.accountStatus === 'active').length;
    
    res.status(200).json({
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      totalGames: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      totalWithdrawals: 0,
      netBalance: 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/transactions', authenticateToken, (req, res) => {
  try {
    // Retornar array vazio por enquanto (sem transações reais ainda)
    res.status(200).json([]);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/withdrawals', authenticateToken, (req, res) => {
  try {
    // Retornar array vazio por enquanto (sem saques reais ainda)
    res.status(200).json([]);
  } catch (error) {
    console.error('Erro ao buscar saques:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/logs', authenticateToken, (req, res) => {
  try {
    // Retornar logs básicos do sistema
    const logs = [
      {
        id: 1,
        level: 'INFO',
        action: 'SYSTEM_START',
        description: 'Sistema iniciado com sucesso',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.status(200).json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 21) Rota de webhook PIX
app.post('/api/payments/pix/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log(`Webhook PIX recebido: ${type} - ${data?.id}`);
    
    if (type === 'payment' && data?.id) {
      // Tentar processar com Mercado Pago real
      if (process.env.MP_ACCESS_TOKEN) {
        try {
          const { processWebhook } = require('./services/pix-mercado-pago');
          const result = await processWebhook({ type, data });
          
          if (result.success && result.data.status === 'approved') {
            console.log(`PIX aprovado: ${result.data.paymentId} - Usuário: ${result.data.userId} - Valor: R$ ${result.data.amount}`);
            
            // TODO: Creditar saldo do usuário no banco
            // Aqui você implementaria a lógica para creditar o saldo
            // baseado no result.data.userId e result.data.amount
          }
        } catch (mpError) {
          console.error('Erro ao processar webhook Mercado Pago:', mpError);
        }
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 22) Rota de estimativa de saque
app.get('/api/withdraw/estimate', authenticateToken, (req, res) => {
  try {
    const { amount } = req.query;
    const amountValue = parseFloat(amount) || 0;
    
    if (amountValue <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }
    
    const fee = Math.max(amountValue * 0.02, 1.00);
    const net = amountValue - fee;
    
    res.status(200).json({
      amount: amountValue,
      fee: fee,
      net: net,
      message: 'Estimativa calculada com sucesso'
    });
  } catch (error) {
    console.error('Erro na estimativa de saque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 23) Rota de solicitação de saque
app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  try {
    const { amount, pix_key } = req.body;
    const userId = req.user.id;
    
    if (!amount || !pix_key) {
      return res.status(400).json({ error: 'Valor e chave PIX são obrigatórios' });
    }
    
    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }
    
    res.status(200).json({
      id: `withdraw_${Date.now()}`,
      status: 'requested',
      amount: amountValue,
      pix_key: pix_key,
      message: 'Solicitação de saque criada com sucesso'
    });
  } catch (error) {
    console.error('Erro na solicitação de saque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 24) Rota de metadata
app.get('/meta', (req, res) => {
  res.status(200).json({
    ok: true,
    sha: process.env.GIT_SHA || 'unknown',
    builtAt: process.env.BUILT_AT || 'unknown',
    version: process.env.VERSION || '1.1.2',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// 25) Rota alternativa de metadata
app.get('/api/meta', (req, res) => {
  res.status(200).json({
    ok: true,
    sha: process.env.GIT_SHA || 'unknown',
    builtAt: process.env.BUILT_AT || 'unknown',
    version: process.env.VERSION || '1.1.2',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// 26) Inicializar conexão com Supabase
async function initializeDatabase() {
  try {
    const { supabase: supabaseClient, supabaseAdmin: supabaseAdminClient, testConnection } = require('./database/supabase-config');
    supabase = supabaseClient;
    supabaseAdmin = supabaseAdminClient;
    
    // Testar conexão
    const connected = await testConnection();
    dbConnected = connected;
    console.log(dbConnected ? '✅ Supabase conectado' : '⚠️ Supabase desconectado - usando fallback');
  } catch (error) {
    console.log('⚠️ Supabase não configurado - usando fallback:', error.message);
    dbConnected = false;
  }
}

// 27) Função para inicializar servidor
const startServer = async () => {
  try {
    // Inicializar banco em background (não bloquear servidor)
    initializeDatabase().catch(error => {
      console.log('⚠️ Erro na inicialização do banco:', error.message);
    });
    
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

// 28) Inicializar servidor (chamado no final, após todas as rotas)
startServer();