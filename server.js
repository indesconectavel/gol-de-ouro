const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS para produção e desenvolvimento local
app.use(cors({
  origin: [
    'https://goldeouro-admin.vercel.app', // produção
    'http://localhost:5173',              // dev vite padrão
    'http://localhost:5174'               // porta alternativa do Vite
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-admin-token']
}));

// ✅ Suporte a JSON
app.use(bodyParser.json());

// ✅ Importação de rotas
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const filaRoutes = require('./routes/filaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

// ✅ Registro de rotas
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/fila', filaRoutes);
app.use('/usuario', usuarioRoutes);

// ✅ Rota de teste da API
app.get('/', (req, res) => {
  res.send('🚀 API Gol de Ouro ativa!');
});

// ✅ Inicialização do servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
