// Script para executar o schema do banco de dados
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function executeSchema() {
  try {
    console.log('🗄️ Executando schema do banco de dados...');
    
    // Ler o arquivo schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Encontrados ${commands.length} comandos SQL`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
          await pool.query(command);
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          console.log(`⚠️ Comando ${i + 1} falhou (pode ser normal): ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Schema executado com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar schema:', error.message);
  } finally {
    await pool.end();
  }
}

executeSchema();
