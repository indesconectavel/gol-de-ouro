// Servidor de teste simples para verificar memória
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// CORS básico
app.use(cors());

// JSON básico
app.use(bodyParser.json({ limit: '10kb' }));

// Monitor de memória
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  console.log(`📊 Memória: ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}/${heapTotalMB}MB`);
  
  if (heapPercent > 80) {
    console.log(`🚨 ALERTA: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
  }
};

// Monitorar a cada 5 segundos
setInterval(monitorMemory, 5000);

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Servidor de teste funcionando!',
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

// Iniciar servidor
const PORT = 3001; // Porta diferente para não conflitar

app.listen(PORT, () => {
  console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 Monitoramento de memória ativo`);
});

// Limpeza ao sair
process.on('SIGTERM', () => {
  console.log('🔄 Fechando servidor de teste...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Fechando servidor de teste...');
  process.exit(0);
});