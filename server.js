const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Carregar e validar variáveis de ambiente
const env = require('./config/env');

const app = express();

// Configurações para Render
app.set('trust proxy', 1);

// CORS configurado dinamicamente com fallback para desenvolvimento
const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
const corsOptions = corsOrigins.length
  ? { 
      origin: (origin, cb) => !origin || corsOrigins.includes(origin) ? cb(null, true) : cb(null, false), 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
    }
  : { 
      origin: true, 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
    }; // fallback para desenvolvimento

app.use(cors(corsOptions));

// Middlewares de segurança
app.use(helmet());
app.use(rateLimit({ 
  windowMs: 60 * 1000, // 1 minuto
  max: 200 // máximo 200 requests por minuto por IP
}));

// Suporte a JSON
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ===== ROTAS PÚBLICAS (antes de qualquer autenticação) =====

// Rota de teste da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro ativa!',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota de health simples (PÚBLICA para Render)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime()
  });
});

// ===== ROTAS PROTEGIDAS =====

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
const PORT = Number(process.env.PORT) || Number(env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 CORS configurado para: ${corsOrigins.join(', ')}`);
  console.log(`🛡️ Segurança: Helmet + Rate Limit ativos`);
  console.log(`🏥 Healthcheck disponível em: /health`);
  console.log(`🚀 Pronto para produção no Render!`);
});

module.exports = app;
