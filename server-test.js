// SERVIDOR TESTE - Gol de Ouro
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Health check - TESTE' });
});

app.get('/meta', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Meta route - TESTE',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/user/me', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'User me route - TESTE',
    user: { id: 1, email: 'test@test.com' }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor TESTE rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
