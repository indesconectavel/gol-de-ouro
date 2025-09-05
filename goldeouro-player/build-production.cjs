#!/usr/bin/env node

/**
 * Script de Build para Produção - Frontend Jogador
 * Gol de Ouro - Sistema de Apostas Esportivas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO BUILD DE PRODUÇÃO - FRONTEND JOGADOR');
console.log('=' .repeat(60));

try {
  // 1. Limpar build anterior
  console.log('🧹 1. Limpando build anterior...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('   ✅ Build anterior removido');
  }

  // 2. Instalar dependências
  console.log('📦 2. Verificando dependências...');
  execSync('npm ci --production=false', { stdio: 'inherit' });
  console.log('   ✅ Dependências verificadas');

  // 3. Build de produção
  console.log('🔨 3. Executando build de produção...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✅ Build de produção concluído');

  // 4. Verificar arquivos gerados
  console.log('📁 4. Verificando arquivos gerados...');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`   ✅ ${files.length} arquivos gerados em /dist`);
    
    // Listar arquivos principais
    const mainFiles = files.filter(file => 
      file.endsWith('.html') || 
      file.endsWith('.js') || 
      file.endsWith('.css')
    );
    
    console.log('   📄 Arquivos principais:');
    mainFiles.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`      - ${file} (${size} KB)`);
    });
  }

  // 5. Criar arquivo de configuração para deploy
  console.log('⚙️ 5. Criando configuração para deploy...');
  const deployConfig = {
    name: 'goldeouro-player',
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    platform: 'vercel',
    config: {
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm ci',
      framework: 'vite'
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'deploy-config.json'),
    JSON.stringify(deployConfig, null, 2)
  );
  console.log('   ✅ Configuração de deploy criada');

  // 6. Criar vercel.json
  console.log('🌐 6. Configurando Vercel...');
  const vercelConfig = {
    version: 2,
    builds: [
      {
        src: 'package.json',
        use: '@vercel/static-build',
        config: {
          distDir: 'dist'
        }
      }
    ],
    routes: [
      {
        src: '/(.*)',
        dest: '/index.html'
      }
    ]
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  console.log('   ✅ Configuração Vercel criada');

  console.log('');
  console.log('🎉 BUILD DE PRODUÇÃO CONCLUÍDO COM SUCESSO!');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('   1. ✅ Build gerado em /dist');
  console.log('   2. ✅ Configuração Vercel criada');
  console.log('   3. 🔄 Fazer deploy no Vercel');
  console.log('   4. 🔄 Configurar domínio personalizado');
  console.log('   5. 🔄 Testar em produção');
  console.log('');
  console.log('🚀 Para fazer deploy:');
  console.log('   npx vercel --prod');
  console.log('');

} catch (error) {
  console.error('❌ ERRO NO BUILD:', error.message);
  process.exit(1);
}
