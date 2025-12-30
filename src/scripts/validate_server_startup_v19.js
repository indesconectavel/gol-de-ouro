/**
 * VALIDATE SERVER STARTUP V19 - Valida logs de inicialização do servidor
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'server_startup_v19.log');
const REQUIRED_MESSAGES = [
  'HEARTBEAT',
  'ENGINE V19',
  'USE_DB_QUEUE',
  'Supabase',
  'Conectado'
];

async function monitorServerStartup() {
  console.log('🚀 Iniciando servidor...');
  console.log('   Comando: npm start\n');
  
  // Criar diretório de logs
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  
  const serverProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '..', '..'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  const foundMessages = new Set();
  let logContent = '';
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      serverProcess.kill();
      reject(new Error('Timeout: Servidor não iniciou em 30 segundos'));
    }, 30000);
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      logContent += output;
      process.stdout.write(output);
      
      // Verificar mensagens requeridas
      REQUIRED_MESSAGES.forEach(msg => {
        if (output.includes(msg) && !foundMessages.has(msg)) {
          foundMessages.add(msg);
          console.log(`\n✅ Mensagem encontrada: "${msg}"`);
        }
      });
      
      // Verificar se todas as mensagens foram encontradas
      if (foundMessages.size === REQUIRED_MESSAGES.length) {
        clearTimeout(timeout);
        console.log('\n✅ Todas as mensagens de inicialização encontradas!');
        resolve({ success: true, foundMessages: Array.from(foundMessages) });
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      logContent += output;
      process.stderr.write(output);
    });
    
    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    serverProcess.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && foundMessages.size < REQUIRED_MESSAGES.length) {
        reject(new Error(`Servidor encerrou com código ${code}. Mensagens encontradas: ${foundMessages.size}/${REQUIRED_MESSAGES.length}`));
      }
    });
  });
}

if (require.main === module) {
  monitorServerStartup()
    .then(result => {
      console.log('\n✅ Servidor iniciado com sucesso');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro ao iniciar servidor:', error.message);
      process.exit(1);
    });
}

module.exports = { monitorServerStartup };

