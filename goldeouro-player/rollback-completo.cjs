const { execSync } = require('child_process');
const path = require('path');

const PLAYER_DIR = path.join(__dirname); // Assuming script is in goldeouro-player

function rollbackCompleto() {
  console.log('🔄 Iniciando rollback completo do Modo Jogador...');
  try {
    // Navegar para o diretório do player
    execSync(`cd ${PLAYER_DIR}`, { stdio: 'inherit' });

    // Voltar para o backup completo
    execSync('git checkout BACKUP-MODO-JOGADOR-2025-09-21-23-45', { stdio: 'inherit' });

    console.log('✅ Rollback completo concluído com sucesso!');
    console.log('📅 Data do backup restaurado: 21 de Setembro de 2025 - 23:45');
    console.log('🎯 Estado: Modo Jogador antes das correções');
    console.log('\n📋 Para verificar o status:');
    console.log('   git log --oneline -5');
    console.log('   git tag -l | grep BACKUP');
  } catch (error) {
    console.error('❌ Erro durante o rollback:', error.message);
    console.error('Certifique-se de que você está no diretório correto e que o git está configurado.');
  }
}

rollbackCompleto();
