/**
 * Script completo: Alterar senha e executar teste PIX
 * Uso: node scripts/alterar-senha-e-testar-pix.js [email] [senha] [valor]
 */

const { execSync } = require('child_process');
const path = require('path');

const EMAIL = process.argv[2];
const SENHA = process.argv[3];
const VALOR = parseFloat(process.argv[4]) || 1.00;

if (!EMAIL || !SENHA) {
  console.log('');
  console.log('❌ ERRO: Email e senha são obrigatórios');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/alterar-senha-e-testar-pix.js [email] [senha] [valor]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node scripts/alterar-senha-e-testar-pix.js usuario@email.com senha123 1.00');
  console.log('');
  process.exit(1);
}

async function executar() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 ALTERAR SENHA E TESTAR PIX');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`👤 Email: ${EMAIL}`);
  console.log(`💰 Valor: R$ ${VALOR.toFixed(2)}`);
  console.log('');

  try {
    // 1. Alterar senha
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1️⃣  ALTERANDO SENHA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    try {
      execSync(`node scripts/alterar-senha-usuario.js "${EMAIL}" "${SENHA}"`, {
        stdio: 'inherit',
        cwd: __dirname + '/..'
      });
    } catch (error) {
      console.log('');
      console.log('⚠️  Erro ao alterar senha. Continuando com teste PIX...');
      console.log('');
    }

    // Aguardar um pouco para garantir que a senha foi atualizada
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Executar teste PIX
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('2️⃣  EXECUTANDO TESTE PIX');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    try {
      execSync(`node scripts/testar-criar-pix.js "${EMAIL}" "${SENHA}" ${VALOR}`, {
        stdio: 'inherit',
        cwd: __dirname + '/..'
      });
    } catch (error) {
      console.log('');
      console.log('❌ Erro ao executar teste PIX');
      console.log('');
      process.exit(1);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ PROCESSO CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('❌ Erro:', error.message);
    console.log('');
    process.exit(1);
  }
}

executar();

