// Servidor OTIMIZADO para resolver problema de memória
const express = require('express');
const cors = require('cors');

const app = express();

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

// CORS básico
app.use(cors());

// JSON básico
app.use(express.json({ limit: '50kb' }));

// Dados em memória (simulando banco de dados)
const users = new Map();
const games = new Map();
const payments = new Map();
const queue = [];

// Contador de IDs
let userIdCounter = 1;
let gameIdCounter = 1;
let paymentIdCounter = 1;

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
app.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }
    
    // Verificar se email já existe
    for (let user of users.values()) {
      if (user.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }
    }
    
    const userId = userIdCounter++;
    const newUser = {
      id: userId,
      name,
      email,
      password, // Em produção, usar hash
      balance: 0,
      created_at: new Date().toISOString(),
      account_status: 'active'
    };
    
    users.set(userId, newUser);
    
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        id: userId,
        name,
        email,
        balance: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /auth/login - Login do usuário
app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Buscar usuário
    let foundUser = null;
    for (let user of users.values()) {
      if (user.email === email && user.password === password) {
        foundUser = user;
        break;
      }
    }
    
    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Gerar token simples (em produção, usar JWT)
    const token = `token_${foundUser.id}_${Date.now()}`;
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          balance: foundUser.balance
        }
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
// ROTAS DE USUÁRIO
// ========================================

// GET /usuario/perfil - Perfil do usuário
app.get('/usuario/perfil', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }
    
    // Extrair ID do token (simples)
    const userId = parseInt(token.split('_')[1]);
    const user = users.get(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        created_at: user.created_at,
        account_status: user.account_status
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
// ROTAS DE PAGAMENTOS PIX
// ========================================

// POST /api/payments/pix/criar - Criar pagamento PIX
app.post('/api/payments/pix/criar', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { user_id, amount, description } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }
    
    if (!user_id || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'user_id e amount são obrigatórios (amount >= 1)'
      });
    }
    
    const paymentId = paymentIdCounter++;
    const qrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`; // QR Code fake
    
    const payment = {
      id: paymentId,
      user_id: parseInt(user_id),
      amount: parseFloat(amount),
      description: description || `Recarga de saldo - R$ ${amount}`,
      status: 'pending',
      qr_code: qrCode,
      pix_code: `00020126580014br.gov.bcb.pix0136${paymentId}${Date.now()}520400005303986540${amount}5802BR5913Gol de Ouro6009Sao Paulo62070503***6304${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    };
    
    payments.set(paymentId, payment);
    
    res.json({
      success: true,
      message: 'Pagamento PIX criado com sucesso',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/payments/pix/status/:id - Status do pagamento
app.get('/api/payments/pix/status/:id', (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const payment = payments.get(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }
    
    // Simular aprovação após 30 segundos
    if (payment.status === 'pending' && Date.now() - new Date(payment.created_at).getTime() > 30000) {
      payment.status = 'approved';
      
      // Atualizar saldo do usuário
      const user = users.get(payment.user_id);
      if (user) {
        user.balance += payment.amount;
      }
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/payments/pix/usuario/:id - Pagamentos do usuário
app.get('/api/payments/pix/usuario/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userPayments = Array.from(payments.values())
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      data: {
        payments: userPayments
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
app.get('/admin/lista-usuarios', (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Token de administrador inválido'
      });
    }
    
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      account_status: user.account_status,
      created_at: user.created_at,
      balance: user.balance
    }));
    
    res.json(userList);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE FILA
// ========================================

// GET /fila - Status da fila
app.get('/fila', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        position: queue.length,
        total: queue.length,
        estimatedWait: queue.length * 30 // 30 segundos por pessoa
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.path} não existe`
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor OTIMIZADO rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 Monitoramento de memória ativo`);
});

// Limpeza ao sair
process.on('SIGTERM', () => {
  console.log('🔄 Fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Fechando servidor...');
  process.exit(0);
});
