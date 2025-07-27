require('dotenv').config();
const express = require('express');
const app = express();

require('./db'); // conexão com banco

// Importação de rotas
const filaRoutes = require('./routes/filaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ✅ body parser DEVE vir antes das rotas
app.use(express.json());

// ✅ registro das rotas
app.use('/fila', filaRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/admin', adminRoutes); // rota registrada

// ✅ inicialização do servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
