// Servidor simples e robusto para resolver problema de memória
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Carregar e validar variáveis de ambiente
const env = require('./config/env');

const app = express();

// OTIMIZAÇÕES CRÍTICAS DE MEMÓRIA
// Limitar tamanho do heap
process.setMaxListeners(0);

// Monitor de memória simples
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  console.log(`📊 Memória: ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}/${heapTotalMB}MB`);
  
  if (heapPercent > 90) {
    console.log(`🚨 CRÍTICO: Uso de memória crítico: ${heapPercent.toFixed(2)}%`);
    // Limpeza simples
    if (global.gc) {
      global.gc();
      console.log('🧹 Garbage collection executado');
    }
  } else if (heapPercent > 80) {
    console.log(`⚠️ ALERTA: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
  }
};

// Monitorar memória a cada 10 segundos
setInterval(monitorMemory, 10000);

// Middleware de compressão
app.use(compression());

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

// Rate limiting mais restritivo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Reduzir ainda mais
  message: {
    error: 'Muitas requisições',
    message: 'Tente novamente em alguns minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logs apenas em produção
if (env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}

// CORS configurado dinamicamente
const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

// Suporte a JSON com limite menor
app.use(bodyParser.json({ limit: '500kb' })); // Reduzir ainda mais
app.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));

// Importação de rotas (apenas as essenciais)
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Rotas principais
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/usuario', userRoutes);
app.use('/api/payments', paymentRoutes);

// Rota de health check otimizada
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    database: 'connected',
    memory: {
      heapPercent: Math.round(heapPercent * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    }
  });
});

// Rota principal otimizada
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro ativa!',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro otimizado
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 otimizado
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.path} não existe`,
    availableRoutes: ['/', '/health', '/admin', '/auth', '/usuario', '/api/payments']
  });
});

// Configurar Socket.io (otimizado)
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Otimizações de memória
  maxHttpBufferSize: 500000, // 500KB
  pingTimeout: 60000,
  pingInterval: 25000
});

// Iniciar servidor
const PORT = Number(process.env.PORT) || Number(env.PORT) || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor simples rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 CORS configurado para: ${corsOrigins.join(', ')}`);
  console.log(`🧠 Monitoramento de memória ativo`);
});

// Limpeza de emergência a cada 60 segundos
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (heapPercent > 85) {
    console.log('🧹 Limpeza automática de memória');
    if (global.gc) {
      global.gc();
    }
  }
}, 60000);

// Limpeza ao sair
process.on('SIGTERM', () => {
  console.log('🔄 Fechando servidor...');
  httpServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Fechando servidor...');
  httpServer.close(() => {
    process.exit(0);
  });
});
