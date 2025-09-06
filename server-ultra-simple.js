// SERVIDOR ULTRA-SIMPLIFICADO PARA RENDER
// SEM DEPENDÊNCIAS EXTERNAS - APENAS EXPRESS E CORS

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS básico
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Dados em memória (simulação)
const users = new Map();
const games = new Map();
const payments = new Map();
let nextId = 1;

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro - ULTRA SIMPLIFICADA',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// === ROTAS DE AUTENTICAÇÃO ===
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  if (users.has(username)) {
    return res.status(400).json({ message: 'Usuário já existe' });
  }
  
  const user = {
    id: nextId++,
    username,
    password,
    balance: 1000,
    isAdmin: false
  };
  
  users.set(username, user);
  
  res.status(201).json({
    message: 'Usuário registrado com sucesso',
    user: { id: user.id, username: user.username, balance: user.balance }
  });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.get(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  
  res.json({
    message: 'Login bem-sucedido',
    user: { id: user.id, username: user.username, balance: user.balance, isAdmin: user.isAdmin }
  });
});

// === ROTAS DE USUÁRIO ===
app.get('/usuario/perfil', (req, res) => {
  const username = req.headers['x-username'] || 'testuser';
  const user = users.get(username);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    balance: user.balance,
    isAdmin: user.isAdmin
  });
});

// === ROTAS DE JOGO ===
app.post('/api/games/fila/entrar', (req, res) => {
  const { betAmount } = req.body;
  const username = req.headers['x-username'] || 'testuser';
  const user = users.get(username);
  
  if (!user || user.balance < betAmount) {
    return res.status(400).json({ message: 'Saldo insuficiente' });
  }
  
  user.balance -= betAmount;
  
  const game = {
    id: nextId++,
    userId: user.id,
    username: user.username,
    betAmount,
    status: 'waiting',
    result: null,
    timestamp: new Date()
  };
  
  games.set(game.id, game);
  
  res.json({
    message: 'Entrou na fila com sucesso',
    gameId: game.id,
    currentBalance: user.balance
  });
});

app.get('/api/games/status/:gameId', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ message: 'Jogo não encontrado' });
  }
  
  res.json(game);
});

app.post('/api/games/chutar/:gameId', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const { position } = req.body;
  const game = games.get(gameId);
  
  if (!game || game.status !== 'waiting') {
    return res.status(400).json({ message: 'Jogo inválido' });
  }
  
  // Simular resultado
  const winningPosition = Math.floor(Math.random() * 3) + 1;
  game.result = { winningPosition, userShot: position };
  game.status = 'finished';
  
  const user = users.get(game.username);
  
  if (position === winningPosition) {
    const winnings = game.betAmount * 2;
    user.balance += winnings;
    game.message = `Parabéns! Você ganhou R$${winnings.toFixed(2)}!`;
  } else {
    game.message = 'Que pena! Você perdeu.';
  }
  
  res.json({
    message: game.message,
    game,
    currentBalance: user.balance
  });
});

// === ROTAS DE PAGAMENTO ===
app.post('/api/payments/pix/criar', (req, res) => {
  const { amount } = req.body;
  const username = req.headers['x-username'] || 'testuser';
  const user = users.get(username);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  const payment = {
    id: nextId++,
    userId: user.id,
    username: user.username,
    amount,
    status: 'pending',
    qrCode: `mock_qr_${nextId}`,
    qrCodeText: `mock_text_${nextId}`,
    timestamp: new Date()
  };
  
  payments.set(payment.id, payment);
  
  res.status(201).json({
    message: 'Pagamento PIX criado com sucesso',
    payment
  });
});

app.get('/api/payments/pix/status/:paymentId', (req, res) => {
  const paymentId = parseInt(req.params.paymentId);
  const payment = payments.get(paymentId);
  
  if (!payment) {
    return res.status(404).json({ message: 'Pagamento não encontrado' });
  }
  
  res.json(payment);
});

app.get('/api/payments/pix/usuario', (req, res) => {
  const username = req.headers['x-username'] || 'testuser';
  const user = users.get(username);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  const userPayments = Array.from(payments.values())
    .filter(p => p.userId === user.id);
  
  res.json(userPayments);
});

// === ROTAS DE ADMIN ===
app.get('/admin/analytics', (req, res) => {
  const totalUsers = users.size;
  const totalRevenue = Array.from(payments.values())
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalGames = games.size;
  
  res.json({
    totalUsers,
    totalRevenue,
    totalGames,
    averageBet: totalGames > 0 ? Array.from(games.values()).reduce((sum, g) => sum + g.betAmount, 0) / totalGames : 0,
    activeUsers24h: Math.floor(Math.random() * totalUsers),
    newUsers7d: Math.floor(Math.random() * totalUsers / 2)
  });
});

app.get('/admin/users', (req, res) => {
  const allUsers = Array.from(users.values()).map(u => ({
    id: u.id,
    username: u.username,
    balance: u.balance,
    isAdmin: u.isAdmin,
    status: 'active'
  }));
  
  res.json(allUsers);
});

app.get('/admin/payments', (req, res) => {
  res.json(Array.from(payments.values()));
});

app.get('/admin/games', (req, res) => {
  res.json(Array.from(games.values()));
});

// === WEBHOOK MOCK ===
app.post('/api/mercadopago/webhook', (req, res) => {
  console.log('Webhook Mercado Pago recebido (mock):', req.body);
  res.status(200).send('OK');
});

// === NOTIFICAÇÕES ===
app.get('/api/notifications', (req, res) => {
  res.json([
    {
      id: 1,
      title: 'Bem-vindo ao Gol de Ouro!',
      message: 'Seu saldo inicial é R$ 1000,00',
      read: false,
      timestamp: new Date()
    }
  ]);
});

// === DASHBOARD ===
app.get('/api/dashboard', (req, res) => {
  const username = req.headers['x-username'] || 'testuser';
  const user = users.get(username);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
      balance: user.balance
    },
    stats: {
      totalGames: Array.from(games.values()).filter(g => g.userId === user.id).length,
      totalWins: Array.from(games.values()).filter(g => g.userId === user.id && g.result && g.result.userShot === g.result.winningPosition).length,
      totalBets: Array.from(games.values()).filter(g => g.userId === user.id).reduce((sum, g) => sum + g.betAmount, 0)
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor ULTRA-SIMPLIFICADO rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log('📊 Sem dependências externas - 100% compatível com Render');
});

// Lidar com encerramento
process.on('SIGINT', () => {
  console.log('🔄 Recebido SIGINT, fechando servidor...');
  process.exit(0);
});
