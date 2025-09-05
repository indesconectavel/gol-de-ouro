const fs = require('fs');
const path = require('path');

// Script para adicionar rotas de backup ao server.js
function addBackupRoutes() {
  try {
    const serverPath = path.join(__dirname, '../server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Verificar se as rotas já foram adicionadas
    if (serverContent.includes('backupRoutes')) {
      console.log('✅ Rotas de backup já estão configuradas no server.js');
      return;
    }
    
    // Encontrar a seção de importação de rotas
    const routesImportRegex = /(const\s+\w+Routes\s*=\s*require\(['"][^'"]+['"]\);)/g;
    const routesImportMatch = serverContent.match(routesImportRegex);
    
    if (routesImportMatch) {
      // Adicionar importação das rotas de backup
      const backupImport = "const backupRoutes = require('./routes/backupRoutes');";
      const lastImport = routesImportMatch[routesImportMatch.length - 1];
      serverContent = serverContent.replace(lastImport, `${lastImport}\n${backupImport}`);
    }
    
    // Encontrar a seção de registro de rotas
    const routesRegisterRegex = /(app\.use\(['"][^'"]+['"],\s*\w+Routes\);)/g;
    const routesRegisterMatch = serverContent.match(routesRegisterRegex);
    
    if (routesRegisterMatch) {
      // Adicionar registro das rotas de backup
      const backupRegister = "app.use('/api/backup', backupRoutes);";
      const lastRegister = routesRegisterMatch[routesRegisterMatch.length - 1];
      serverContent = serverContent.replace(lastRegister, `${lastRegister}\n${backupRegister}`);
    }
    
    // Salvar arquivo atualizado
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Rotas de backup adicionadas ao server.js');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar rotas de backup:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addBackupRoutes();
}

module.exports = addBackupRoutes;
