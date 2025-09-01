const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Teste servidor funcionando!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
});
