const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

// Configurar conexão com o banco
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateDatabase() {
  try {
    console.log('🚀 Iniciando atualização do banco de dados para Fase 3...');
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '..', 'database-schema-phase3.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Executar o SQL
    await pool.query(sqlContent);
    
    console.log('✅ Banco de dados atualizado com sucesso para Fase 3!');
    console.log('📊 Novas funcionalidades implementadas:');
    console.log('   - Sistema de 5 opções de chute');
    console.log('   - Mecânica de vencedor aleatório');
    console.log('   - Sistema de apostas R$ 1,00 por partida');
    console.log('   - Distribuição de prêmios 50/50');
    console.log('   - Tabelas de animações e chutes');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar banco de dados:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateDatabase();
}

module.exports = updateDatabase;
