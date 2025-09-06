// Servidor OTIMIZADO para resolver problema de memória
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Importar módulos
const { initDatabase } = require('./database/connection');
const { authenticateToken, authenticateAdmin, hashPassword, comparePassword, generateToken } = require('./middlewares/auth');
const paymentController = require('./controllers/paymentController');
const notificationController = require('./controllers/notificationController');
const analyticsController = require('./controllers/analyticsController');

// OTIMIZAÇÕES DE MEMÓRIA
process.setMaxListeners(0);

// Monitor de memória
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  console.log(`📊 Memória: ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}/${heapTotalMB}MB`);
  
  if (heapPercent > 85) {
    console.log(`🚨 ALERTA: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
    
    // Limpeza agressiva
    if (global.gc) {
      global.gc();
      console.log('🧹 Garbage collection executado');
    }
  }
};

// Monitorar a cada 10 segundos
setInterval(monitorMemory, 10000);

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// JSON básico
app.use(express.json({ limit: '50kb' }));

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro OTIMIZADA!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// Health check
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapPercent: Math.round(heapPercent * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    }
  });
});

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================

// POST /auth/register - Registrar usuário
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }
    
    // Verificar se email já existe
    const { query } = require('./database/connection');
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }
    
    // Hash da senha
    const passwordHash = await hashPassword(password);
    
    // Criar usuário
    const result = await query(`
      INSERT INTO users (name, email, password_hash, balance, account_status)
      VALUES ($1, $2, $3, 0, 'active')
      RETURNING id, name, email, balance, created_at
    `, [name, email, passwordHash]);
    
    const newUser = result.rows[0];
    
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: newUser
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /auth/login - Login do usuário
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Buscar usuário
    const { query } = require('./database/connection');
    const result = await query(`
      SELECT id, name, email, password_hash, balance, account_status
      FROM users WHERE email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    if (user.account_status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }
    
    // Gerar token JWT
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          balance: user.balance
        }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE USUÁRIO
// ========================================

// GET /usuario/perfil - Perfil do usuário
app.get('/usuario/perfil', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE PAGAMENTOS PIX
// ========================================

// POST /api/payments/pix/criar - Criar pagamento PIX
app.post('/api/payments/pix/criar', authenticateToken, paymentController.createPixPayment);

// GET /api/payments/pix/status/:id - Status do pagamento
app.get('/api/payments/pix/status/:id', authenticateToken, paymentController.getPaymentStatus);

// GET /api/payments/pix/usuario - Pagamentos do usuário
app.get('/api/payments/pix/usuario', authenticateToken, paymentController.getUserPayments);

// POST /api/payments/webhook - Webhook do Mercado Pago
app.post('/api/payments/webhook', paymentController.webhook);

// ========================================
// ROTAS DE JOGOS
// ========================================

// POST /api/games/fila/entrar - Entrar na fila
app.post('/api/games/fila/entrar', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { bet } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }
    
    const userId = parseInt(token.split('_')[1]);
    const user = users.get(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    const betAmount = bet || 1;
    
    if (user.balance < betAmount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }
    
    const gameId = gameIdCounter++;
    const game = {
      id: gameId,
      user_id: userId,
      bet: betAmount,
      totalShots: 5,
      shotsTaken: 0,
      balance: user.balance - betAmount,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    games.set(gameId, game);
    user.balance -= betAmount;
    
    res.json({
      success: true,
      data: {
        id: gameId,
        totalShots: game.totalShots,
        shotsTaken: game.shotsTaken,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/games/status - Status do jogo
app.get('/api/games/status', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }
    
    const userId = parseInt(token.split('_')[1]);
    const user = users.get(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    // Buscar jogo ativo do usuário
    let activeGame = null;
    for (let game of games.values()) {
      if (game.user_id === userId && game.status === 'active') {
        activeGame = game;
        break;
      }
    }
    
    if (!activeGame) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum jogo ativo encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: activeGame.id,
        totalShots: activeGame.totalShots,
        shotsTaken: activeGame.shotsTaken,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/games/chutar - Fazer chute
app.post('/api/games/chutar', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { zone } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }
    
    const userId = parseInt(token.split('_')[1]);
    const user = users.get(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    // Buscar jogo ativo
    let activeGame = null;
    for (let game of games.values()) {
      if (game.user_id === userId && game.status === 'active') {
        activeGame = game;
        break;
      }
    }
    
    if (!activeGame) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum jogo ativo encontrado'
      });
    }
    
    if (activeGame.shotsTaken >= activeGame.totalShots) {
      return res.status(400).json({
        success: false,
        message: 'Jogo finalizado'
      });
    }
    
    // Simular resultado do chute
    const goalieZones = ['TL', 'TR', 'BL', 'BR', 'MID'];
    const goalieDirection = goalieZones[Math.floor(Math.random() * goalieZones.length)];
    const isGoal = zone !== goalieDirection && Math.random() > 0.3; // 70% de chance de gol
    
    activeGame.shotsTaken++;
    
    if (isGoal) {
      const winAmount = activeGame.bet * 1.8; // Multiplicador de vitória
      user.balance += winAmount;
    }
    
    res.json({
      success: true,
      data: {
        result: isGoal ? 'goal' : 'save',
        goalieDirection,
        shotsTaken: activeGame.shotsTaken,
        totalShots: activeGame.totalShots,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE ADMIN
// ========================================

// GET /admin/lista-usuarios - Lista de usuários (Admin)
app.get('/admin/lista-usuarios', authenticateAdmin, async (req, res) => {
  try {
    const { query } = require('./database/connection');
    const result = await query(`
      SELECT id, name, email, account_status, created_at, balance
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /admin/analytics - Analytics do admin
app.get('/admin/analytics', authenticateAdmin, analyticsController.getAdminAnalytics);

// ========================================
// ROTAS DE FILA
// ========================================

// GET /fila - Status da fila
app.get('/fila', async (req, res) => {
  try {
    const { query } = require('./database/connection');
    const result = await query(`
      SELECT COUNT(*) as total_games
      FROM games 
      WHERE status = 'active'
    `);
    
    const totalGames = parseInt(result.rows[0].total_games);
    
    res.json({
      success: true,
      data: {
        position: totalGames,
        total: totalGames,
        estimatedWait: totalGames * 30 // 30 segundos por pessoa
      }
    });
  } catch (error) {
    console.error('Erro ao consultar fila:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE NOTIFICAÇÕES
// ========================================

// GET /notifications - Listar notificações
app.get('/notifications', authenticateToken, notificationController.getUserNotifications);

// PUT /notifications/:id/read - Marcar como lida
app.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);

// PUT /notifications/read-all - Marcar todas como lidas
app.put('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);

// GET /notifications/unread-count - Contar não lidas
app.get('/notifications/unread-count', authenticateToken, notificationController.getUnreadCount);

// ========================================
// ROTAS DE ANALYTICS
// ========================================

// GET /analytics/dashboard - Dashboard do usuário
app.get('/analytics/dashboard', authenticateToken, analyticsController.getUserDashboard);

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.path} não existe`
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Inicializar banco de dados
    await initDatabase();
    console.log('✅ Banco de dados inicializado');
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor OTIMIZADO rodando na porta ${PORT}`);
      console.log(`🌐 Acesse: http://localhost:${PORT}`);
      console.log(`📊 Monitoramento de memória ativo`);
      console.log(`🔐 JWT habilitado`);
      console.log(`💳 Pagamentos PIX configurados`);
      console.log(`📱 Notificações ativas`);
      console.log(`📈 Analytics implementado`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

// Limpeza ao sair
process.on('SIGTERM', () => {
  console.log('🔄 Fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Fechando servidor...');
  process.exit(0);
});
