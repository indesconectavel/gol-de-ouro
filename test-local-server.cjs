// Teste local do servidor
const express = require('express');
const app = express();

// Simular as rotas do servidor
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Health check' });
});

app.get('/meta', (req, res) => {
  res.json({ ok: true, message: 'Meta route' });
});

app.get('/api/user/me', (req, res) => {
  res.json({ ok: true, message: 'User me route' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  
  // Testar as rotas
  setTimeout(async () => {
    try {
      console.log('\n🔍 Testando rotas localmente...');
      
      const healthResponse = await fetch(`http://localhost:${PORT}/health`);
      console.log('Health:', healthResponse.status);
      
      const metaResponse = await fetch(`http://localhost:${PORT}/meta`);
      console.log('Meta:', metaResponse.status);
      
      const userResponse = await fetch(`http://localhost:${PORT}/api/user/me`);
      console.log('User Me:', userResponse.status);
      
      process.exit(0);
    } catch (error) {
      console.error('Erro:', error.message);
      process.exit(1);
    }
  }, 1000);
});
