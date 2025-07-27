const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados goldeouro!');

    const result = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public';`
    );

    console.log('📦 Tabelas existentes:');
    result.rows.forEach(row => console.log('➡️', row.table_name));
  } catch (err) {
    console.error('❌ Erro ao conectar no banco ou listar tabelas:', err.message);
  } finally {
    await client.end();
  }
})();
