// Servidor ULTRA-OTIMIZADO para Render Free Tier
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createServer } = require('http');

// Carregar variáveis de ambiente
const env = require('./config/env');

const app = express();

// OTIMIZAÇÕES EXTREMAS DE MEMÓRIA
// Limitar listeners
process.setMaxListeners(0);

// Limpeza agressiva de memória
const aggressiveCleanup = () => {
  // Limpar cache do require
  Object.keys(require.cache).forEach(key => {
    if (key.includes('node_modules') && !key.includes('express') && !key.includes('cors')) {
      delete require.cache[key];
    }
  });
  
  // Limpar variáveis globais desnecessárias
  if (global.gc) {
    global.gc();
  }
  
  // Forçar limpeza de buffers
  if (global.Buffer) {
    global.Buffer.poolSize = 0;
  }
};

// Monitor de memória ULTRA-AGGRESSIVO
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  console.log(`📊 Memória: ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}/${heapTotalMB}MB`);
  
  if (heapPercent > 85) {
    console.log(`🚨 LIMPEZA AGRESSIVA: ${heapPercent.toFixed(2)}%`);
    aggressiveCleanup();
  }
};

// Monitorar a cada 5 segundos (mais frequente)
setInterval(monitorMemory, 5000);

// Limpeza automática a cada 30 segundos
setInterval(aggressiveCleanup, 30000);

// Middleware básico (sem compressão para economizar memória)
app.use(cors({
  origin: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

// JSON com limite MUITO pequeno
app.use(bodyParser.json({ limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100kb' }));

// Importar apenas rotas ESSENCIAIS
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Rotas principais
app.use('/auth', authRoutes);
app.use('/usuario', userRoutes);
app.use('/api/payments', paymentRoutes);

// Health check ULTRA-SIMPLES
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    memory: {
      heapPercent: Math.round(heapPercent * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024)
    }
  });
});

// Rota principal ULTRA-SIMPLES
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro ULTRA-OTIMIZADA!',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 404 ULTRA-SIMPLES
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.path} não existe`
  });
});

// Iniciar servidor
const PORT = Number(process.env.PORT) || Number(env.PORT) || 3000;
const httpServer = createServer(app);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor ULTRA-OTIMIZADO rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🧠 Limpeza agressiva a cada 30 segundos`);
  console.log(`📊 Monitoramento a cada 5 segundos`);
});

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
