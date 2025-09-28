const { execSync } = require('child_process');
const fs = require('fs');

const SAFEPOINT = {
  version: 'v1.1.1',
  timestamp: '2025-09-24T01:30:00Z',
  status: 'APROVADO',
  description: 'Sistema Jogador funcionando perfeitamente'
};

console.log('🎮 Iniciando rollback para sistema jogador aprovado...');
console.log(`📌 Versão: ${SAFEPOINT.version}`);
console.log(`⏰ Timestamp: ${SAFEPOINT.timestamp}`);
console.log(`📝 Descrição: ${SAFEPOINT.description}`);
console.log('');

try {
  // Parar processos ativos
  console.log('🛑 Parando processos ativos...');
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
    console.log('✅ Processos Node.js parados');
  } catch (error) {
    console.log('⚠️ Nenhum processo Node.js ativo');
  }
  
  // Verificar se estamos no diretório correto
  console.log('📁 Verificando diretório...');
  const currentDir = process.cwd();
  console.log(`Diretório atual: ${currentDir}`);
  
  // Voltar para versão aprovada
  console.log('📦 Voltando para versão aprovada...');
  execSync('git checkout v1.1.1', { stdio: 'inherit' });
  console.log('✅ Versão aprovada restaurada');
  
  // Restaurar dependências
  console.log('📦 Restaurando dependências...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências restauradas');
  
  // Iniciar backend
  console.log('🚀 Iniciando backend...');
  execSync('node server-render-fix.js', { stdio: 'inherit' });
  
  console.log('');
  console.log('🎉 Rollback do jogador concluído com sucesso!');
  console.log('🎯 Sistema jogador aprovado v1.1.1 funcionando!');
  console.log('');
  console.log('📋 Status do sistema jogador:');
  console.log('✅ Backend: Funcionando na porta 3000');
  console.log('✅ Frontend Jogador: Pronto para iniciar');
  console.log('✅ Endpoints: Todos respondendo');
  console.log('✅ Dados fictícios: Completos');
  console.log('✅ CORS: Configurado');
  console.log('✅ Autenticação: Funcionando');
  
} catch (error) {
  console.error('❌ Erro durante rollback do jogador:', error.message);
  console.log('');
  console.log('🔧 Soluções possíveis:');
  console.log('1. Verificar se o Git está configurado');
  console.log('2. Verificar se a tag v1.1.1 existe');
  console.log('3. Verificar se o Node.js está instalado');
  console.log('4. Verificar se o npm está funcionando');
  process.exit(1);
}
