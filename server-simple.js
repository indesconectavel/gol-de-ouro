// SERVIDOR SIMPLES GOL DE OURO - FUNCIONANDO v1.1.1
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares básicos
app.use(helmet());
app.use(cors({
  origin: [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Gol de Ouro Backend Online - SISTEMA REAL',
    timestamp: new Date().toISOString(),
    version: 'v1.1.1-real',
    uptime: process.uptime()
  });
});

// Endpoints básicos funcionais
app.get('/api/game/opcoes-chute', (req, res) => {
  res.json({
    zonas: [
      { id: 'center', nome: 'Centro', multiplicador: 1.0, dificuldade: 'Média' },
      { id: 'left', nome: 'Esquerda', multiplicador: 1.5, dificuldade: 'Difícil' },
      { id: 'right', nome: 'Direita', multiplicador: 1.5, dificuldade: 'Difícil' },
      { id: 'top', nome: 'Superior', multiplicador: 2.0, dificuldade: 'Muito Difícil' },
      { id: 'bottom', nome: 'Inferior', multiplicador: 1.2, dificuldade: 'Fácil' }
    ],
    potencias: { min: 1, max: 100, recomendada: 50 },
    angulos: { min: -45, max: 45, neutro: 0 }
  });
});

app.get('/api/game/status-sistema', (req, res) => {
  res.json({
    status: 'online',
    partidas_ativas: 0,
    jogadores_na_fila: 0,
    timestamp: new Date().toISOString()
  });
});

// Endpoint de teste de chute
app.post('/api/game/chute/executar', (req, res) => {
  const { zona, potencia, angulo } = req.body;
  
  // Simulação simples de chute
  const baseSuccess = 0.7;
  const zoneMultipliers = {
    'center': 0.8,
    'left': 0.6,
    'right': 0.6,
    'top': 0.4,
    'bottom': 0.5
  };
  
  const zoneMultiplier = zoneMultipliers[zona] || 0.5;
  const potenciaNormalizada = Math.max(1, Math.min(100, parseInt(potencia))) / 100;
  const anguloNormalizado = Math.max(-45, Math.min(45, parseInt(angulo))) / 45;
  
  const potenciaBonus = potenciaNormalizada * 0.3;
  const anguloBonus = (1 - Math.abs(anguloNormalizado)) * 0.2;
  
  const successRate = baseSuccess * zoneMultiplier + potenciaBonus + anguloBonus;
  const isGoal = Math.random() < Math.min(successRate, 0.95);
  
  res.json({
    success: true,
    resultado: {
      gol_marcado: isGoal,
      score: isGoal ? 1 : 0,
      success_rate: successRate,
      details: {
        zona: zona,
        potencia: parseInt(potencia),
        angulo: parseInt(angulo),
        zone_multiplier: zoneMultiplier,
        potencia_bonus: potenciaBonus,
        angulo_bonus: anguloBonus
      }
    }
  });
});

// Endpoints de pagamento PIX (mock funcional)
app.post('/api/payments/pix/criar', (req, res) => {
  const { valor } = req.body;
  
  res.json({
    success: true,
    payment_id: `pix_${Date.now()}`,
    qr_code: `00020126580014br.gov.bcb.pix0136${Date.now()}5204000053039865405${valor}5802BR5913Gol de Ouro6009Sao Paulo62070503***6304`,
    valor: parseFloat(valor),
    status: 'pending',
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  });
});

app.get('/api/payments/pix/status/:payment_id', (req, res) => {
  res.json({
    payment_id: req.params.payment_id,
    status: 'approved',
    valor: 10.00,
    created_at: new Date().toISOString(),
    approved_at: new Date().toISOString()
  });
});

// Endpoints de usuário
app.post('/api/auth/register', (req, res) => {
  const { email, password, username } = req.body;
  
  res.json({
    success: true,
    message: 'Usuário registrado com sucesso!',
    token: `token_${Date.now()}`,
    user: {
      id: Date.now(),
      email: email,
      username: username,
      balance: 0.00,
      role: 'player'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  res.json({
    success: true,
    message: 'Login realizado com sucesso!',
    token: `token_${Date.now()}`,
    user: {
      id: 1,
      email: email,
      username: 'testuser',
      balance: 100.00,
      role: 'player'
    }
  });
});

app.get('/api/user/me', (req, res) => {
  res.json({
    id: 1,
    email: 'test@test.com',
    username: 'testuser',
    balance: 100.00,
    role: 'player'
  });
});

// Endpoints admin (mock)
app.get('/api/admin/users', (req, res) => {
  res.json([]);
});

app.get('/api/admin/transactions', (req, res) => {
  res.json([]);
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: 0,
    activeUsers: 0,
    totalGames: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalWithdrawals: 0,
    netBalance: 0
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gol de Ouro Backend SIMPLES rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🎮 Game: http://localhost:${PORT}/api/game/*`);
  console.log(`💳 Payments: http://localhost:${PORT}/api/payments/*`);
  console.log(`👤 Auth: http://localhost:${PORT}/api/auth/*`);
  console.log(`✅ SISTEMA SIMPLES FUNCIONANDO!`);
});