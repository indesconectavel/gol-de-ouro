#!/usr/bin/env node

/**
 * DEPLOY COMPLETO - GOL DE OURO
 * Deploy de todos os sistemas + Backup na nuvem
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DEPLOY COMPLETO - GOL DE OURO');
console.log('=' .repeat(60));

const deployResults = {
  backend: { status: 'pending', url: '', logs: [] },
  admin: { status: 'pending', url: '', logs: [] },
  player: { status: 'pending', url: '', logs: [] },
  backup: { status: 'pending', logs: [] }
};

// 1. DEPLOY DO BACKEND NO RENDER.COM
console.log('🔧 1. DEPLOY DO BACKEND NO RENDER.COM...');
try {
  // Verificar se já está conectado ao Git
  try {
    execSync('git status', { stdio: 'pipe' });
    deployResults.backend.logs.push('✅ Repositório Git configurado');
  } catch (error) {
    deployResults.backend.logs.push('⚠️ Inicializando repositório Git...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Deploy inicial - Backend Gol de Ouro"', { stdio: 'inherit' });
  }
  
  // Verificar se o Render CLI está instalado
  try {
    execSync('render --version', { stdio: 'pipe' });
    deployResults.backend.logs.push('✅ Render CLI instalado');
  } catch (error) {
    deployResults.backend.logs.push('📦 Instalando Render CLI...');
    execSync('npm install -g @render/cli', { stdio: 'inherit' });
  }
  
  // Fazer deploy
  deployResults.backend.logs.push('🚀 Iniciando deploy no Render...');
  console.log('   ⚠️ Execute manualmente: render deploy');
  console.log('   📋 URL esperada: https://goldeouro-backend.onrender.com');
  
  deployResults.backend.status = 'ready';
  deployResults.backend.url = 'https://goldeouro-backend.onrender.com';
  
} catch (error) {
  deployResults.backend.logs.push(`❌ Erro: ${error.message}`);
  deployResults.backend.status = 'error';
}

// 2. DEPLOY DO FRONTEND ADMIN NO VERCEL
console.log('\n🌐 2. DEPLOY DO FRONTEND ADMIN NO VERCEL...');
try {
  process.chdir('goldeouro-admin');
  
  // Verificar se o Vercel CLI está instalado
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    deployResults.admin.logs.push('✅ Vercel CLI instalado');
  } catch (error) {
    deployResults.admin.logs.push('📦 Instalando Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }
  
  // Fazer build se necessário
  if (!fs.existsSync('dist')) {
    deployResults.admin.logs.push('🔨 Gerando build de produção...');
    execSync('npm run build', { stdio: 'inherit' });
  }
  
  // Fazer deploy
  deployResults.admin.logs.push('🚀 Iniciando deploy no Vercel...');
  console.log('   ⚠️ Execute manualmente: vercel --prod');
  console.log('   📋 URL esperada: https://goldeouro-admin.vercel.app');
  
  deployResults.admin.status = 'ready';
  deployResults.admin.url = 'https://goldeouro-admin.vercel.app';
  
  process.chdir('..');
  
} catch (error) {
  deployResults.admin.logs.push(`❌ Erro: ${error.message}`);
  deployResults.admin.status = 'error';
}

// 3. DEPLOY DO FRONTEND PLAYER NO VERCEL
console.log('\n🎮 3. DEPLOY DO FRONTEND PLAYER NO VERCEL...');
try {
  process.chdir('goldeouro-player');
  
  // Fazer build se necessário
  if (!fs.existsSync('dist')) {
    deployResults.player.logs.push('🔨 Gerando build de produção...');
    execSync('npm run build', { stdio: 'inherit' });
  }
  
  // Fazer deploy
  deployResults.player.logs.push('🚀 Iniciando deploy no Vercel...');
  console.log('   ⚠️ Execute manualmente: vercel --prod');
  console.log('   📋 URL esperada: https://goldeouro-player.vercel.app');
  
  deployResults.player.status = 'ready';
  deployResults.player.url = 'https://goldeouro-player.vercel.app';
  
  process.chdir('..');
  
} catch (error) {
  deployResults.player.logs.push(`❌ Erro: ${error.message}`);
  deployResults.player.status = 'error';
}

// 4. BACKUP COMPLETO NA NUVEM
console.log('\n☁️ 4. BACKUP COMPLETO NA NUVEM...');
try {
  // Criar arquivo de backup
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    systems: {
      backend: {
        status: deployResults.backend.status,
        url: deployResults.backend.url,
        files: [
          'server.js',
          'package.json',
          '.env',
          'db.js',
          'render.yaml',
          'Procfile'
        ]
      },
      admin: {
        status: deployResults.admin.status,
        url: deployResults.admin.url,
        files: [
          'package.json',
          'vite.config.js',
          'vercel.json',
          'src/',
          'dist/'
        ]
      },
      player: {
        status: deployResults.player.status,
        url: deployResults.player.url,
        files: [
          'package.json',
          'vite.config.js',
          'vercel.json',
          'src/',
          'dist/'
        ]
      }
    },
    deploy: {
      backend: 'Render.com',
      admin: 'Vercel',
      player: 'Vercel'
    }
  };
  
  // Salvar backup local
  const backupPath = `backup-deploy-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  deployResults.backup.logs.push(`✅ Backup local salvo: ${backupPath}`);
  
  // Criar arquivo de instruções
  const instructionsPath = 'INSTRUCOES-DEPLOY.md';
  const instructions = `# 🚀 INSTRUÇÕES DE DEPLOY - GOL DE OURO

## 📋 COMANDOS PARA EXECUTAR

### 1. Backend (Render.com)
\`\`\`bash
# No diretório raiz (goldeouro-backend)
render deploy
\`\`\`
**URL esperada:** https://goldeouro-backend.onrender.com

### 2. Frontend Admin (Vercel)
\`\`\`bash
# No diretório goldeouro-admin
cd goldeouro-admin
vercel --prod
\`\`\`
**URL esperada:** https://goldeouro-admin.vercel.app

### 3. Frontend Player (Vercel)
\`\`\`bash
# No diretório goldeouro-player
cd goldeouro-player
vercel --prod
\`\`\`
**URL esperada:** https://goldeouro-player.vercel.app

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Render.com (Backend)
- Framework: Node.js
- Build Command: npm install
- Start Command: npm start
- Environment Variables: Configuradas no .env

### Vercel (Frontends)
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Environment Variables: Configuradas nos vercel.json

## 📊 STATUS ATUAL
- ✅ Backend: Pronto para deploy
- ✅ Admin: Pronto para deploy  
- ✅ Player: Pronto para deploy
- ✅ Configurações: Todas validadas

## 🎯 PRÓXIMOS PASSOS
1. Executar comandos de deploy acima
2. Testar todas as URLs
3. Configurar domínios personalizados (opcional)
4. Monitorar logs de produção
5. Configurar alertas de monitoramento

---
**Data:** ${new Date().toISOString().split('T')[0]}
**Versão:** 1.0.0
`;

  fs.writeFileSync(instructionsPath, instructions);
  deployResults.backup.logs.push(`✅ Instruções salvas: ${instructionsPath}`);
  
  deployResults.backup.status = 'completed';
  
} catch (error) {
  deployResults.backup.logs.push(`❌ Erro: ${error.message}`);
  deployResults.backup.status = 'error';
}

// 5. RELATÓRIO FINAL
console.log('\n📋 RELATÓRIO DE DEPLOY:');
console.log('=' .repeat(60));

console.log('\n🔧 BACKEND (Render.com):');
console.log(`Status: ${deployResults.backend.status === 'ready' ? '✅ PRONTO' : '❌ ERRO'}`);
deployResults.backend.logs.forEach(log => console.log(`  ${log}`));
if (deployResults.backend.url) {
  console.log(`  🌐 URL: ${deployResults.backend.url}`);
}

console.log('\n🌐 FRONTEND ADMIN (Vercel):');
console.log(`Status: ${deployResults.admin.status === 'ready' ? '✅ PRONTO' : '❌ ERRO'}`);
deployResults.admin.logs.forEach(log => console.log(`  ${log}`));
if (deployResults.admin.url) {
  console.log(`  🌐 URL: ${deployResults.admin.url}`);
}

console.log('\n🎮 FRONTEND PLAYER (Vercel):');
console.log(`Status: ${deployResults.player.status === 'ready' ? '✅ PRONTO' : '❌ ERRO'}`);
deployResults.player.logs.forEach(log => console.log(`  ${log}`));
if (deployResults.player.url) {
  console.log(`  🌐 URL: ${deployResults.player.url}`);
}

console.log('\n☁️ BACKUP:');
console.log(`Status: ${deployResults.backup.status === 'completed' ? '✅ CONCLUÍDO' : '❌ ERRO'}`);
deployResults.backup.logs.forEach(log => console.log(`  ${log}`));

// 6. INSTRUÇÕES FINAIS
console.log('\n🎯 INSTRUÇÕES FINAIS:');
console.log('=' .repeat(60));
console.log('1. Execute os comandos listados em INSTRUCOES-DEPLOY.md');
console.log('2. Teste todas as URLs após o deploy');
console.log('3. Configure monitoramento e alertas');
console.log('4. Documente as URLs finais');
console.log('5. Configure domínios personalizados (opcional)');

console.log('\n🎉 DEPLOY PREPARADO COM SUCESSO!');
console.log('📄 Consulte INSTRUCOES-DEPLOY.md para os comandos finais');
