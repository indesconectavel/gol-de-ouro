/**
 * 🔒 INTEGRAÇÃO BLOCKCHAIN SEGURA
 * Adiciona rotas Blockchain ao server.js com backup automático
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 INICIANDO INTEGRAÇÃO BLOCKCHAIN SEGURA...');

try {
  // 1. Fazer backup do server.js
  console.log('📋 Criando backup do server.js...');
  const serverPath = path.join(__dirname, 'server.js');
  const backupPath = path.join(__dirname, 'server.js.backup.' + Date.now());
  
  if (fs.existsSync(serverPath)) {
    fs.copyFileSync(serverPath, backupPath);
    console.log('✅ Backup criado:', backupPath);
  }

  // 2. Ler o arquivo server.js
  console.log('📖 Lendo server.js...');
  let serverContent = fs.readFileSync(serverPath, 'utf8');

  // 3. Verificar se as rotas já existem
  if (serverContent.includes('blockchainRoutes')) {
    console.log('⚠️ Rotas Blockchain já existem no server.js');
    console.log('✅ Integração já está ativa!');
    return;
  }

  // 4. Adicionar import das rotas Blockchain
  console.log('➕ Adicionando import das rotas Blockchain...');
  const importLine = "const blockchainRoutes = require('./routes/blockchainRoutes');";
  const insertAfterImport = "const gamificationIntegration = require('./routes/gamification_integration');";
  
  if (serverContent.includes(insertAfterImport)) {
    serverContent = serverContent.replace(
      insertAfterImport,
      insertAfterImport + '\n' + importLine
    );
    console.log('✅ Import adicionado com sucesso');
  } else {
    console.log('❌ Não foi possível encontrar local para adicionar import');
    return;
  }

  // 5. Adicionar registro das rotas
  console.log('➕ Adicionando registro das rotas Blockchain...');
  const routeLine = "app.use('/api/blockchain', blockchainRoutes);";
  const insertAfterRoutes = "app.use('/api/gamification', gamificationIntegration);";
  
  if (serverContent.includes(insertAfterRoutes)) {
    serverContent = serverContent.replace(
      insertAfterRoutes,
      insertAfterRoutes + '\n' + routeLine
    );
    console.log('✅ Registro das rotas adicionado com sucesso');
  } else {
    console.log('❌ Não foi possível encontrar local para adicionar rotas');
    return;
  }

  // 6. Salvar o arquivo modificado
  console.log('💾 Salvando server.js modificado...');
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  
  console.log('✅ INTEGRAÇÃO BLOCKCHAIN CONCLUÍDA COM SUCESSO!');
  console.log('');
  console.log('🔗 Endpoints Blockchain disponíveis:');
  console.log('   POST /api/blockchain/game');
  console.log('   POST /api/blockchain/payment');
  console.log('   POST /api/blockchain/ranking');
  console.log('   GET /api/blockchain/verify/:hash');
  console.log('   GET /api/blockchain/stats');
  console.log('   GET /api/blockchain/costs');
  console.log('   GET /api/blockchain/status');
  console.log('');
  console.log('🛡️ Backup criado em:', backupPath);
  console.log('🔄 Para restaurar: copie o backup sobre o server.js');

} catch (error) {
  console.error('❌ ERRO NA INTEGRAÇÃO BLOCKCHAIN:', error);
  console.log('🔄 Use o backup para restaurar o sistema');
  process.exit(1);
}
