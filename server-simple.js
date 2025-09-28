// server-simple.js - Servidor simples para testar
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Cadastro simples
app.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }
  
  res.status(201).json({ 
    message: 'Usuário registrado com sucesso', 
    user: { 
      id: Date.now(), 
      email, 
      name,
      created_at: new Date().toISOString()
    }
  });
});

// Login simples
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  res.status(200).json({ 
    message: 'Login realizado com sucesso',
    token: 'temp_token_' + Date.now(),
    user: { 
      id: 1, 
      email, 
      name: 'Usuário Teste'
    }
  });
});

// PIX simples
app.post('/api/payments/pix/criar', (req, res) => {
  const { amount, user_id } = req.body;
  
  if (!amount || !user_id) {
    return res.status(400).json({ error: 'Valor e ID do usuário são obrigatórios' });
  }
  
  res.status(200).json({
    message: 'PIX criado com sucesso',
    transaction_id: `pix_${Date.now()}`,
    amount: parseFloat(amount),
    status: 'pending',
    qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=temp_pref_' + Date.now()
  });
});

// Jogo simples
app.post('/api/games/shoot', (req, res) => {
  const { amount, direction } = req.body;
  
  if (!amount || !direction) {
    return res.status(400).json({ error: 'Valor e direção são obrigatórios' });
  }
  
  const isGoal = Math.random() < 0.1; // 10% de chance de gol
  
  res.status(200).json({
    success: true,
    isGoal,
    direction,
    amount: parseFloat(amount),
    prize: isGoal ? parseFloat(amount) * 2 : 0,
    message: isGoal ? 'GOL! Você ganhou!' : 'Defesa! Tente novamente.'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gol de Ouro Backend API - SIMPLES',
    version: '1.1.1',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor simples rodando na porta ${PORT}`);
});

module.exports = app;