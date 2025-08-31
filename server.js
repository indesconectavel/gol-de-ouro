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

// Suporte a JSON
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

// Rota protegida de teste
app.get('/admin/test', (req, res) => {
  const token = req.headers['x-admin-token'];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'Header x-admin-token é obrigatório'
    });
  }
  
  if (token !== env.ADMIN_TOKEN) {
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Acesso negado'
    });
  }
  
  res.json({
    message: '✅ Rota protegida acessada com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
app.listen(env.PORT, () => {
  console.log(`✅ Servidor rodando na porta ${env.PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 CORS configurado para: ${corsOrigins.join(', ')}`);
});
