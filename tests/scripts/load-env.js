// Script para Carregar Variáveis de Ambiente do Arquivo .env
// FASE 2.5 - Carregamento de Configuração

const fs = require('fs');
const path = require('path');

/**
 * Carregar variáveis de ambiente do arquivo .env
 */
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️ Arquivo .env não encontrado. Usando valores padrão.');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Ignorar comentários e linhas vazias
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      
      if (key && value) {
        process.env[key] = value;
      }
    }
  });

  console.log('✅ Variáveis de ambiente carregadas do arquivo .env');
}

// Carregar automaticamente quando módulo é importado
loadEnv();

module.exports = loadEnv;

