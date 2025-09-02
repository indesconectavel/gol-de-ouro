const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Carregar e validar variáveis de ambiente
const env = require('./config/env');

const app = express();

// Configurações de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting para prevenir abuso (mais permissivo em desenvolvimento)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'development' ? 1000 : 100, // mais permissivo em dev
  message: {
    error: 'Muitas requisições',
    message: 'Tente novamente em alguns minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logs apenas em desenvolvimento e produção (não em testes)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// CORS configurado dinamicamente
const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    if (env.NODE_ENV === 'development') {
      console.log('🚫 CORS bloqueado para origin:', origin);
    }
    return callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

// Suporte a JSON com limite de tamanho
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Importação de rotas
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const filaRoutes = require('./routes/filaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const gameRoutes = require('./routes/gameRoutes');
const healthRoutes = require('./routes/health');
const publicDashboard = require('./routes/publicDashboard');
const testRoutes = require('./routes/test');

// Registro de rotas
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/fila', filaRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/games', gameRoutes);
app.use('/health', healthRoutes);

// Registrar rota pública do dashboard
const pool = require('./db');
publicDashboard(app, pool);
testRoutes(app, pool);

// Rota de teste da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro ativa!',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Em produção, não expor detalhes do erro
  if (env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Algo deu errado'
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    availableRoutes: ['/', '/health', '/admin', '/auth', '/fila', '/usuario', '/api/payments', '/api/public/dashboard']
  });
});

// Criar servidor HTTP
const httpServer = createServer(app);

// Configurar Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware de autenticação para Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Token de autenticação necessário'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

// Eventos do Socket.io
io.on('connection', (socket) => {
  console.log(`🔌 Usuário conectado: ${socket.userEmail} (${socket.id})`);
  
  // Entrar na sala de fila
  socket.on('join-queue', () => {
    socket.join('queue');
    console.log(`👥 ${socket.userEmail} entrou na fila`);
    io.to('queue').emit('queue-updated', { message: 'Fila atualizada' });
  });
  
  // Sair da sala de fila
  socket.on('leave-queue', () => {
    socket.leave('queue');
    console.log(`👋 ${socket.userEmail} saiu da fila`);
    io.to('queue').emit('queue-updated', { message: 'Fila atualizada' });
  });
  
  // Entrar na sala de uma partida específica
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`🎮 ${socket.userEmail} entrou na partida ${gameId}`);
  });
  
  // Sair da sala de uma partida
  socket.on('leave-game', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`🚪 ${socket.userEmail} saiu da partida ${gameId}`);
  });
  
  // Notificar chute realizado
  socket.on('shot-taken', (data) => {
    const { gameId, shotResult, isGoldenGoal } = data;
    io.to(`game-${gameId}`).emit('shot-result', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      shotResult,
      isGoldenGoal
    });
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log(`🔌 Usuário desconectado: ${socket.userEmail} (${socket.id})`);
  });
});

// Inicialização do servidor
const PORT = Number(process.env.PORT) || Number(env.PORT) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 CORS configurado para: ${corsOrigins.join(', ')}`);
  console.log(`🏥 Healthcheck disponível em: /health`);
  console.log(`🛡️ Segurança: Helmet + Rate Limit ativos`);
  console.log(`🔌 Socket.io ativo para conexões em tempo real`);
});
