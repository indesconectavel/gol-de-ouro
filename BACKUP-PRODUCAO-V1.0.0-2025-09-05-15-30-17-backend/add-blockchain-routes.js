/**
 * 🔧 SCRIPT PARA ADICIONAR ROTAS BLOCKCHAIN
 * Adiciona as rotas Blockchain ao server.js de forma segura
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando rotas Blockchain ao server.js...');

try {
  // Ler o arquivo server.js
  const serverPath = path.join(__dirname, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');

  // Verificar se as rotas já existem
  if (serverContent.includes('blockchainRoutes')) {
    console.log('✅ Rotas Blockchain já existem no server.js');
    return;
  }

  // Adicionar import das rotas Blockchain
  const importLine = "const blockchainRoutes = require('./routes/blockchainRoutes');";
  const insertAfter = "const gamificationIntegration = require('./routes/gamification_integration');";
  
  if (serverContent.includes(insertAfter)) {
    serverContent = serverContent.replace(
      insertAfter,
      insertAfter + '\n' + importLine
    );
    console.log('✅ Import das rotas Blockchain adicionado');
  }

  // Adicionar registro das rotas
  const routeLine = "app.use('/api/blockchain', blockchainRoutes);";
  const insertAfterRoutes = "app.use('/api/gamification', gamificationIntegration);";
  
  if (serverContent.includes(insertAfterRoutes)) {
    serverContent = serverContent.replace(
      insertAfterRoutes,
      insertAfterRoutes + '\n' + routeLine
    );
    console.log('✅ Registro das rotas Blockchain adicionado');
  }

  // Salvar o arquivo modificado
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  
  console.log('✅ Rotas Blockchain adicionadas com sucesso!');
  console.log('🔗 Endpoints disponíveis:');
  console.log('   POST /api/blockchain/game');
  console.log('   POST /api/blockchain/payment');
  console.log('   POST /api/blockchain/ranking');
  console.log('   GET /api/blockchain/verify/:hash');
  console.log('   GET /api/blockchain/stats');
  console.log('   GET /api/blockchain/costs');
  console.log('   GET /api/blockchain/status');

} catch (error) {
  console.error('❌ Erro ao adicionar rotas Blockchain:', error);
  process.exit(1);
}
