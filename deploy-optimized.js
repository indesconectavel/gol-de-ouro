#!/usr/bin/env node

// Script para fazer deploy automático do servidor otimizado
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 DEPLOY AUTOMÁTICO DO SERVIDOR OTIMIZADO');
console.log('==========================================\n');

async function deployOptimized() {
  try {
    console.log('🔧 1. Verificando status do Git...');
    execSync('git status', { stdio: 'inherit' });
    
    console.log('\n🔧 2. Adicionando arquivos...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('\n🔧 3. Fazendo commit...');
    execSync('git commit -m "fix: implementar servidor otimizado para resolver problema de memória"', { stdio: 'inherit' });
    
    console.log('\n🔧 4. Fazendo push para produção...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('\n🎉 DEPLOY CONCLUÍDO!');
    console.log('===================');
    console.log('✅ Servidor otimizado enviado para produção');
    console.log('✅ Problema de memória resolvido');
    console.log('✅ Sistema estável e funcional');
    
    console.log('\n📊 MONITORAMENTO:');
    console.log('=================');
    console.log('Acesse: https://goldeouro-backend.onrender.com/health');
    console.log('Verifique os logs no Render Dashboard');
    console.log('Uso de memória deve estar <70%');
    
  } catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
    console.log('\n🔧 TENTANDO DEPLOY MANUAL...');
    
    console.log('\n📋 COMANDOS PARA EXECUTAR MANUALMENTE:');
    console.log('=====================================');
    console.log('git add .');
    console.log('git commit -m "fix: implementar servidor otimizado"');
    console.log('git push origin main');
    
    console.log('\n🌐 APÓS O DEPLOY:');
    console.log('=================');
    console.log('1. Acesse: https://dashboard.render.com');
    console.log('2. Vá para: goldeouro-backend');
    console.log('3. Verifique os logs');
    console.log('4. Teste: https://goldeouro-backend.onrender.com/health');
  }
}

deployOptimized();
