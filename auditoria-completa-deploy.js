#!/usr/bin/env node

/**
 * AUDITORIA COMPLETA PARA DEPLOY - GOL DE OURO
 * Verifica todos os sistemas antes do deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 AUDITORIA COMPLETA DO SISTEMA - GOL DE OURO');
console.log('=' .repeat(60));

const auditResults = {
  backend: { status: 'pending', issues: [], files: [] },
  admin: { status: 'pending', issues: [], files: [] },
  player: { status: 'pending', issues: [], files: [] },
  deploy: { status: 'pending', issues: [], configs: [] }
};

// 1. AUDITORIA DO BACKEND
console.log('🔧 1. AUDITORIA DO BACKEND...');
try {
  // Verificar arquivos principais
  const backendFiles = [
    'server.js',
    'package.json',
    '.env',
    'db.js',
    'render.yaml',
    'Procfile'
  ];
  
  backendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      auditResults.backend.files.push(`✅ ${file}`);
    } else {
      auditResults.backend.issues.push(`❌ ${file} não encontrado`);
    }
  });
  
  // Verificar estrutura de diretórios
  const backendDirs = ['routes', 'middlewares', 'src', 'public'];
  backendDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      auditResults.backend.files.push(`✅ ${dir}/`);
    } else {
      auditResults.backend.issues.push(`❌ ${dir}/ não encontrado`);
    }
  });
  
  // Verificar package.json
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pkg.scripts && pkg.scripts.start) {
      auditResults.backend.files.push('✅ Scripts de deploy configurados');
    } else {
      auditResults.backend.issues.push('❌ Scripts de deploy não configurados');
    }
  }
  
  auditResults.backend.status = auditResults.backend.issues.length === 0 ? 'ok' : 'issues';
  
} catch (error) {
  auditResults.backend.issues.push(`❌ Erro na auditoria: ${error.message}`);
  auditResults.backend.status = 'error';
}

// 2. AUDITORIA DO FRONTEND ADMIN
console.log('🌐 2. AUDITORIA DO FRONTEND ADMIN...');
try {
  if (fs.existsSync('goldeouro-admin')) {
    process.chdir('goldeouro-admin');
    
    const adminFiles = [
      'package.json',
      'vite.config.js',
      'vercel.json',
      'index.html'
    ];
    
    adminFiles.forEach(file => {
      if (fs.existsSync(file)) {
        auditResults.admin.files.push(`✅ ${file}`);
      } else {
        auditResults.admin.issues.push(`❌ ${file} não encontrado`);
      }
    });
    
    // Verificar estrutura src
    if (fs.existsSync('src')) {
      const srcFiles = ['main.jsx', 'App.jsx', 'index.css'];
      srcFiles.forEach(file => {
        if (fs.existsSync(`src/${file}`)) {
          auditResults.admin.files.push(`✅ src/${file}`);
        } else {
          auditResults.admin.issues.push(`❌ src/${file} não encontrado`);
        }
      });
    }
    
    // Verificar build
    if (fs.existsSync('dist')) {
      auditResults.admin.files.push('✅ Build de produção gerado');
    } else {
      auditResults.admin.issues.push('❌ Build de produção não encontrado');
    }
    
    process.chdir('..');
    auditResults.admin.status = auditResults.admin.issues.length === 0 ? 'ok' : 'issues';
  } else {
    auditResults.admin.issues.push('❌ Diretório goldeouro-admin não encontrado');
    auditResults.admin.status = 'error';
  }
} catch (error) {
  auditResults.admin.issues.push(`❌ Erro na auditoria: ${error.message}`);
  auditResults.admin.status = 'error';
}

// 3. AUDITORIA DO FRONTEND PLAYER
console.log('🎮 3. AUDITORIA DO FRONTEND PLAYER...');
try {
  if (fs.existsSync('goldeouro-player')) {
    process.chdir('goldeouro-player');
    
    const playerFiles = [
      'package.json',
      'vite.config.js',
      'vercel.json',
      'index.html'
    ];
    
    playerFiles.forEach(file => {
      if (fs.existsSync(file)) {
        auditResults.player.files.push(`✅ ${file}`);
      } else {
        auditResults.player.issues.push(`❌ ${file} não encontrado`);
      }
    });
    
    // Verificar estrutura src
    if (fs.existsSync('src')) {
      const srcFiles = ['main.jsx', 'App.jsx', 'index.css'];
      srcFiles.forEach(file => {
        if (fs.existsSync(`src/${file}`)) {
          auditResults.player.files.push(`✅ src/${file}`);
        } else {
          auditResults.player.issues.push(`❌ src/${file} não encontrado`);
        }
      });
      
      // Verificar páginas
      const pages = ['Login.jsx', 'Register.jsx', 'Dashboard.jsx', 'Game.jsx', 'Withdraw.jsx', 'Profile.jsx'];
      pages.forEach(page => {
        if (fs.existsSync(`src/pages/${page}`)) {
          auditResults.player.files.push(`✅ src/pages/${page}`);
        } else {
          auditResults.player.issues.push(`❌ src/pages/${page} não encontrado`);
        }
      });
    }
    
    // Verificar build
    if (fs.existsSync('dist')) {
      auditResults.player.files.push('✅ Build de produção gerado');
    } else {
      auditResults.player.issues.push('❌ Build de produção não encontrado');
    }
    
    process.chdir('..');
    auditResults.player.status = auditResults.player.issues.length === 0 ? 'ok' : 'issues';
  } else {
    auditResults.player.issues.push('❌ Diretório goldeouro-player não encontrado');
    auditResults.player.status = 'error';
  }
} catch (error) {
  auditResults.player.issues.push(`❌ Erro na auditoria: ${error.message}`);
  auditResults.player.status = 'error';
}

// 4. AUDITORIA DE CONFIGURAÇÕES DE DEPLOY
console.log('🚀 4. AUDITORIA DE CONFIGURAÇÕES DE DEPLOY...');
try {
  // Verificar configurações do Render
  if (fs.existsSync('render.yaml')) {
    auditResults.deploy.configs.push('✅ render.yaml configurado');
  } else {
    auditResults.deploy.issues.push('❌ render.yaml não encontrado');
  }
  
  if (fs.existsSync('Procfile')) {
    auditResults.deploy.configs.push('✅ Procfile configurado');
  } else {
    auditResults.deploy.issues.push('❌ Procfile não encontrado');
  }
  
  // Verificar configurações do Vercel
  if (fs.existsSync('goldeouro-admin/vercel.json')) {
    auditResults.deploy.configs.push('✅ Admin vercel.json configurado');
  } else {
    auditResults.deploy.issues.push('❌ Admin vercel.json não encontrado');
  }
  
  if (fs.existsSync('goldeouro-player/vercel.json')) {
    auditResults.deploy.configs.push('✅ Player vercel.json configurado');
  } else {
    auditResults.deploy.issues.push('❌ Player vercel.json não encontrado');
  }
  
  // Verificar .env
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'MERCADOPAGO_ACCESS_TOKEN'];
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        auditResults.deploy.configs.push(`✅ ${varName} configurado`);
      } else {
        auditResults.deploy.issues.push(`❌ ${varName} não configurado`);
      }
    });
  } else {
    auditResults.deploy.issues.push('❌ .env não encontrado');
  }
  
  auditResults.deploy.status = auditResults.deploy.issues.length === 0 ? 'ok' : 'issues';
  
} catch (error) {
  auditResults.deploy.issues.push(`❌ Erro na auditoria: ${error.message}`);
  auditResults.deploy.status = 'error';
}

// 5. RELATÓRIO FINAL
console.log('\n📋 RELATÓRIO DE AUDITORIA:');
console.log('=' .repeat(60));

console.log('\n🔧 BACKEND:');
console.log(`Status: ${auditResults.backend.status === 'ok' ? '✅ OK' : '❌ PROBLEMAS'}`);
auditResults.backend.files.forEach(file => console.log(`  ${file}`));
auditResults.backend.issues.forEach(issue => console.log(`  ${issue}`));

console.log('\n🌐 FRONTEND ADMIN:');
console.log(`Status: ${auditResults.admin.status === 'ok' ? '✅ OK' : '❌ PROBLEMAS'}`);
auditResults.admin.files.forEach(file => console.log(`  ${file}`));
auditResults.admin.issues.forEach(issue => console.log(`  ${issue}`));

console.log('\n🎮 FRONTEND PLAYER:');
console.log(`Status: ${auditResults.player.status === 'ok' ? '✅ OK' : '❌ PROBLEMAS'}`);
auditResults.player.files.forEach(file => console.log(`  ${file}`));
auditResults.player.issues.forEach(issue => console.log(`  ${issue}`));

console.log('\n🚀 CONFIGURAÇÕES DE DEPLOY:');
console.log(`Status: ${auditResults.deploy.status === 'ok' ? '✅ OK' : '❌ PROBLEMAS'}`);
auditResults.deploy.configs.forEach(config => console.log(`  ${config}`));
auditResults.deploy.issues.forEach(issue => console.log(`  ${issue}`));

// 6. RESUMO GERAL
const totalIssues = auditResults.backend.issues.length + 
                   auditResults.admin.issues.length + 
                   auditResults.player.issues.length + 
                   auditResults.deploy.issues.length;

console.log('\n🎯 RESUMO GERAL:');
console.log('=' .repeat(60));
console.log(`Total de problemas encontrados: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('✅ SISTEMA PRONTO PARA DEPLOY!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Deploy do Backend no Render.com');
  console.log('2. Deploy do Frontend Admin no Vercel');
  console.log('3. Deploy do Frontend Player no Vercel');
  console.log('4. Backup completo na nuvem');
  console.log('5. Testes em produção');
} else {
  console.log('❌ CORRIGIR PROBLEMAS ANTES DO DEPLOY');
  console.log('\n🔧 AÇÕES NECESSÁRIAS:');
  console.log('1. Resolver todos os problemas listados acima');
  console.log('2. Executar auditoria novamente');
  console.log('3. Proceder com o deploy');
}

// Salvar relatório
const reportPath = `auditoria-deploy-${new Date().toISOString().split('T')[0]}.json`;
fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
console.log(`\n📄 Relatório salvo em: ${reportPath}`);

process.exit(totalIssues === 0 ? 0 : 1);
