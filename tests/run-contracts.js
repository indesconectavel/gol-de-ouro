// tests/run-contracts.js - Executor de contratos
const fs = require('fs');
const path = require('path');

console.log('🔍 EXECUTANDO TESTES DE CONTRATO...\n');

// Verificar se existem arquivos .http
const contractsDir = path.join(__dirname, 'contracts');
const httpFiles = fs.readdirSync(contractsDir).filter(file => file.endsWith('.http'));

if (httpFiles.length === 0) {
    console.log('❌ Nenhum arquivo .http encontrado em tests/contracts/');
    console.log('💡 Use o VS Code com REST Client ou similar para executar os contratos');
    process.exit(1);
}

console.log('📋 Arquivos de contrato encontrados:');
httpFiles.forEach(file => {
    console.log(`   • ${file}`);
});

console.log('\n📝 INSTRUÇÕES:');
console.log('1. Instale a extensão REST Client no VS Code');
console.log('2. Abra o arquivo tests/contracts/games.shoot.http');
console.log('3. Execute cada caso de teste clicando em "Send Request"');
console.log('4. Verifique os status codes e respostas');

console.log('\n✅ CONTRATOS PRONTOS PARA EXECUÇÃO!');
console.log('💡 Para automação, considere usar supertest ou similar');
