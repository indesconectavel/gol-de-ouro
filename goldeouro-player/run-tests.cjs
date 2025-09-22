const { execSync } = require('child_process');
const path = require('path');

const PLAYER_DIR = path.join(__dirname);

function runTests() {
  console.log('🧪 Iniciando execução dos testes E2E...');
  console.log('=====================================');
  
  try {
    // Navegar para o diretório do player
    execSync(`cd ${PLAYER_DIR}`, { stdio: 'inherit' });

    console.log('📦 Verificando dependências...');
    execSync('npm list cypress', { stdio: 'inherit' });

    console.log('🚀 Iniciando servidor de desenvolvimento...');
    // Iniciar servidor em background
    const serverProcess = execSync('npm run dev', { 
      stdio: 'pipe',
      detached: true 
    });

    // Aguardar servidor inicializar
    console.log('⏳ Aguardando servidor inicializar...');
    execSync('timeout 10', { stdio: 'inherit' });

    console.log('🧪 Executando testes Cypress...');
    execSync('npx cypress run --spec "cypress/e2e/**/*.cy.js"', { 
      stdio: 'inherit',
      cwd: PLAYER_DIR
    });

    console.log('✅ Todos os testes foram executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante execução dos testes:', error.message);
    
    if (error.message.includes('cypress')) {
      console.log('💡 Dica: Certifique-se de que o Cypress está instalado: npm install cypress --save-dev');
    }
    
    if (error.message.includes('server')) {
      console.log('💡 Dica: Certifique-se de que o servidor de desenvolvimento está rodando em http://localhost:5174');
    }
  }
}

runTests();
