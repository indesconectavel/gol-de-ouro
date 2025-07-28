const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT * FROM usuarios LIMIT 1');
    console.log('✅ Conexão com banco funcionando!');
    console.log(res.rows);
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
  }
})();
