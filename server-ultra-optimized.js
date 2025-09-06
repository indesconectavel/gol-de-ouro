// SERVIDOR ULTRA-OTIMIZADO PARA RENDER.COM
// Arquitetura desacoplada - Frontend Vercel + Backend Render

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// OTIMIZAÇÕES CRÍTICAS DE MEMÓRIA
process.setMaxListeners(0);
process.env.NODE_OPTIONS = '--max-old-space-size=256';

// Monitor de memória otimizado
let memoryWarnings = 0;
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  
  if (heapPercent > 80) {
    memoryWarnings++;
    console.log(`🚨 ALERTA ${memoryWarnings}: Memória ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB`);
    
    // Limpeza agressiva a cada 3 alertas
    if (memoryWarnings % 3 === 0) {
      if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection executado');
      }
    }
  } else {
    memoryWarnings = 0; // Reset contador
  }
};

// Monitorar a cada 15 segundos (menos frequente)
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware otimizado
app.use(express.json({ limit: '10kb' })); // Reduzido para economizar memória
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Dados em memória (temporário até configurar PostgreSQL)
const users = new Map();
const games = new Map();
const payments = new Map();
const notifications = new Map();

// Usuário admin padrão
users.set('admin', {
  id: 'admin',
  username: 'admin',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'admin',
  balance: 0,
  created_at: new Date()
});

// Rota principal
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Gol de Ouro Backend - Arquitetura Desacoplada',
    version: '2.0.0',
    architecture: 'Frontend Vercel + Backend Render',
    timestamp: new Date().toISOString(),
    memory: {
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    }
  });
});

// Health check otimizado
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  res.json({
    status: heapPercent < 90 ? 'healthy' : 'warning',
    timestamp: new Date().toISOString(),
    memory: {
      heap_percent: Math.round(heapPercent),
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_mb: Math.round(memUsage.heapUsed / 1024 / 1024)
    },
    uptime: process.uptime()
  });
});

// Autenticação simplificada
app.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }
    
    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificação simples de senha (em produção usar bcrypt)
    if (password === 'password' || user.password === password) {
      const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64');
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          balance: user.balance
        }
      });
    } else {
      res.status(401).json({ error: 'Senha incorreta' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registro de usuário
app.post('/auth/register', (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }
    
    if (users.has(username)) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      username,
      password, // Em produção usar hash
      email: email || '',
      role: 'user',
      balance: 0,
      created_at: new Date()
    };
    
    users.set(username, newUser);
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

// Perfil do usuário
app.get('/usuario/perfil', authenticateToken, (req, res) => {
  const user = Array.from(users.values()).find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance,
    role: user.role,
    created_at: user.created_at
  });
});

// Sistema de jogos simplificado
app.get('/api/games/status', (req, res) => {
  res.json({
    status: 'active',
    players_in_queue: 0,
    current_game: null,
    next_game_in: 30
  });
});

app.post('/api/games/fila/entrar', authenticateToken, (req, res) => {
  const user = Array.from(users.values()).find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  if (user.balance < 10) {
    return res.status(400).json({ error: 'Saldo insuficiente' });
  }
  
  res.json({
    success: true,
    message: 'Entrou na fila',
    position: 1,
    estimated_wait: 30
  });
});

// Sistema de pagamentos PIX simplificado
app.post('/api/payments/pix/criar', authenticateToken, (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount < 10) {
    return res.status(400).json({ error: 'Valor inválido' });
  }
  
  const paymentId = 'pix_' + Date.now();
  const payment = {
    id: paymentId,
    user_id: req.user.id,
    amount: parseFloat(amount),
    status: 'pending',
    pix_code: '00020126580014br.gov.bcb.pix0136' + paymentId + '520400005303986540510.005802BR5913Gol de Ouro6009Sao Paulo62070503***6304' + Math.random().toString(36).substr(2, 4),
    created_at: new Date()
  };
  
  payments.set(paymentId, payment);
  
  res.json({
    success: true,
    payment_id: paymentId,
    pix_code: payment.pix_code,
    amount: payment.amount,
    expires_in: 3600
  });
});

// Listar pagamentos do usuário
app.get('/api/payments/pix/usuario', authenticateToken, (req, res) => {
  const userPayments = Array.from(payments.values())
    .filter(p => p.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json({
    success: true,
    payments: userPayments
  });
});

// Analytics para admin
app.get('/admin/analytics', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const totalUsers = users.size;
  const totalPayments = payments.size;
  const totalRevenue = Array.from(payments.values())
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  res.json({
    success: true,
    analytics: {
      total_users: totalUsers,
      total_payments: totalPayments,
      total_revenue: totalRevenue,
      active_games: 0,
      memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    }
  });
});

// Lista de usuários para admin
app.get('/admin/lista-usuarios', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance,
    role: user.role,
    created_at: user.created_at
  }));
  
  res.json({
    success: true,
    users: userList
  });
});

// Notificações
app.get('/notifications', authenticateToken, (req, res) => {
  const userNotifications = Array.from(notifications.values())
    .filter(n => n.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json({
    success: true,
    notifications: userNotifications
  });
});

// Analytics do dashboard
app.get('/analytics/dashboard', authenticateToken, (req, res) => {
  const user = Array.from(users.values()).find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  const userPayments = Array.from(payments.values())
    .filter(p => p.user_id === req.user.id);
  
  res.json({
    success: true,
    dashboard: {
      balance: user.balance,
      total_games: 0,
      total_wins: 0,
      total_payments: userPayments.length,
      total_spent: userPayments.reduce((sum, p) => sum + p.amount, 0)
    }
  });
});

// Middleware de erro otimizado
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404 otimizada
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;

const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor ULTRA-OTIMIZADO rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log(`📊 Monitoramento de memória ativo`);
    console.log(`🏗️ Arquitetura: Frontend Vercel + Backend Render`);
    
    // Log inicial de memória
    const memUsage = process.memoryUsage();
    const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    console.log(`📊 Memória inicial: ${heapPercent.toFixed(2)}% | RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
  });
};

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recebido SIGTERM, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Recebido SIGINT, fechando servidor...');
  process.exit(0);
});

startServer();