// Servidor Proxy para contornar CORS - Gol de Ouro
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Configurar CORS para permitir todas as origens
app.use(cors({
  origin: '*',
  credentials: false
}));

// Proxy para o backend
app.use('/api', createProxyMiddleware({
  target: 'https://goldeouro-backend.fly.dev',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Erro no proxy:', err);
    res.status(500).json({ error: 'Erro no proxy' });
  }
}));

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Proxy funcionando!',
    timestamp: new Date().toISOString(),
    target: 'https://goldeouro-backend.fly.dev'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy CORS rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`🔗 Proxy para: https://goldeouro-backend.fly.dev`);
  console.log(`✅ CORS configurado para permitir todas as origens`);
});
