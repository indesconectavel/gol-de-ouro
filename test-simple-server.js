const express = require('express');
const app = express();
const PORT = 3001; // Usar porta diferente

app.get('/', (req, res) => {
  res.json({ message: 'Teste OK', timestamp: new Date().toISOString() });
});

app.get('/test-db', async (req, res) => {
  try {
    const pool = require('./db');
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      ok: true, 
      message: "DB Test OK",
      current_time: result.rows[0].current_time 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
});
