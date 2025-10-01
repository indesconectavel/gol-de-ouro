// SERVIDOR SIMPLES PARA TESTE - Gol de Ouro
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware básico
app.use(cors());
app.use(express.json());

// Rota de health
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Health check' });
});

// Rota de meta
app.get('/meta', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Meta route',
    timestamp: new Date().toISOString()
  });
});

// Rota de usuário
app.get('/api/user/me', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'User me route',
    user: { id: 1, email: 'test@test.com' }
  });
});

// Rota de PIX
app.get('/api/payments/pix/status', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'PIX status route',
    status: 'pending'
  });
});

// Rota de saque
app.get('/api/withdraw/estimate', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Withdraw estimate route',
    amount: 100
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor SIMPLES rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
