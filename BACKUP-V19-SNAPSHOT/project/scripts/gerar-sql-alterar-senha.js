/**
 * Script para gerar SQL para alterar senha de usuário
 * Uso: node scripts/gerar-sql-alterar-senha.js [email] [novaSenha]
 */

const bcrypt = require('bcrypt');

const EMAIL = process.argv[2];
const NOVA_SENHA = process.argv[3];

if (!EMAIL || !NOVA_SENHA) {
  console.log('');
  console.log('❌ ERRO: Email e senha são obrigatórios');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/gerar-sql-alterar-senha.js [email] [novaSenha]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node scripts/gerar-sql-alterar-senha.js usuario@email.com senha123');
  console.log('');
  process.exit(1);
}

async function gerarSQL() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 GERANDO SQL PARA ALTERAR SENHA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`👤 Email: ${EMAIL}`);
  console.log('');

  try {
    // Gerar hash da senha
    console.log('Gerando hash da senha...');
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(NOVA_SENHA, saltRounds);
    console.log('✅ Hash gerado');
    console.log('');

    // Gerar SQL
    const sql = `-- Alterar senha do usuário: ${EMAIL}
-- Execute este SQL no Supabase SQL Editor

UPDATE usuarios
SET senha_hash = '${senhaHash}',
    updated_at = NOW()
WHERE email = '${EMAIL}';

-- Verificar se foi atualizado
SELECT id, email, username, updated_at
FROM usuarios
WHERE email = '${EMAIL}';`;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 SQL GERADO:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(sql);
    console.log('');
    console.log('💡 INSTRUÇÕES:');
    console.log('   1. Copie o SQL acima');
    console.log('   2. Abra Supabase SQL Editor');
    console.log('   3. Cole e execute o SQL');
    console.log('   4. Verifique se o usuário foi atualizado');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('❌ Erro:', error.message);
    console.log('');
    process.exit(1);
  }
}

gerarSQL();

