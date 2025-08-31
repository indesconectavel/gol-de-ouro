const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Carregar e validar variáveis de ambiente
const env = require('./config/env');

const app = express();

// CORS configurado dinamicamente
const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

// Suporte a JSON com limite de tamanho
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rota de teste da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro ativa!',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota de health simples
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
app.listen(env.PORT, () => {
  console.log(`✅ Servidor rodando na porta ${env.PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 CORS configurado para: ${corsOrigins.join(', ')}`);
});
