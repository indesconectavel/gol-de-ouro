/**
 * 🔍 DIAGNÓSTICO COMPLETO AUTOMÁTICO - GOL DE OURO
 * Script de diagnóstico e correção automática
 */

const fs = require('fs').promises;
const path = require('path');

const results = {
  timestamp: new Date().toISOString(),
  caminhos: [],
  scripts: [],
  imports: [],
  erros: [],
  correcoes: [],
  score: 0
};

async function verificarCaminho(filePath) {
  try {
    await fs.access(filePath);
    return { exists: true, path: filePath };
  } catch (error) {
    return { exists: false, path: filePath, error: error.message };
  }
}

async function verificarScripts() {
  console.log('🔍 Verificando scripts...');
  
  const scripts = [
    'scripts/e2e/auditoria-e2e-producao.js',
    'scripts/e2e/validate-data-testid.js',
    'server-fly.js',
    'package.json',
    'goldeouro-player/package.json',
    'goldeouro-admin/package.json',
    'goldeouro-mobile/package.json'
  ];
  
  for (const script of scripts) {
    const check = await verificarCaminho(script);
    results.caminhos.push(check);
    if (!check.exists) {
      results.erros.push(`Script não encontrado: ${script}`);
    }
  }
}

async function verificarPackageJson() {
  console.log('🔍 Verificando package.json...');
  
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    
    // Verificar script test:e2e:prod
    if (pkg.scripts && pkg.scripts['test:e2e:prod']) {
      const scriptPath = pkg.scripts['test:e2e:prod'];
      const expectedPath = 'scripts/e2e/auditoria-e2e-producao.js';
      
      if (scriptPath.includes('auditoria-e2e-producao.js')) {
        results.scripts.push({ 
          name: 'test:e2e:prod', 
          status: 'OK', 
          path: scriptPath 
        });
      } else {
        results.erros.push(`Script test:e2e:prod aponta para caminho incorreto: ${scriptPath}`);
        results.correcoes.push({
          arquivo: 'package.json',
          campo: 'scripts.test:e2e:prod',
          valorAtual: scriptPath,
          valorCorreto: `node ${expectedPath}`
        });
      }
    }
  } catch (error) {
    results.erros.push(`Erro ao verificar package.json: ${error.message}`);
  }
}

async function verificarEstrutura() {
  console.log('🔍 Verificando estrutura de pastas...');
  
  const pastas = [
    'scripts',
    'scripts/e2e',
    'goldeouro-player',
    'goldeouro-admin',
    'goldeouro-mobile',
    'mcp-system',
    'docs',
    'docs/GO-LIVE'
  ];
  
  for (const pasta of pastas) {
    const check = await verificarCaminho(pasta);
    if (!check.exists) {
      results.erros.push(`Pasta não encontrada: ${pasta}`);
      // Criar pasta se necessário
      try {
        await fs.mkdir(pasta, { recursive: true });
        results.correcoes.push({ tipo: 'pasta_criada', pasta });
      } catch (e) {
        // Ignorar se não conseguir criar
      }
    }
  }
}

async function gerarRelatorio() {
  const relatorioPath = path.join(__dirname, '..', 'docs', 'GO-LIVE', 'DIAGNOSTICO-AUTOMATICO.json');
  await fs.mkdir(path.dirname(relatorioPath), { recursive: true });
  await fs.writeFile(relatorioPath, JSON.stringify(results, null, 2));
  console.log(`✅ Relatório salvo: ${relatorioPath}`);
}

async function executarDiagnostico() {
  console.log('🚀 Iniciando diagnóstico completo automático...\n');
  
  await verificarEstrutura();
  await verificarScripts();
  await verificarPackageJson();
  
  // Calcular score
  const totalChecks = results.caminhos.length + results.scripts.length;
  const passedChecks = results.caminhos.filter(c => c.exists).length + 
                       results.scripts.filter(s => s.status === 'OK').length;
  results.score = Math.round((passedChecks / totalChecks) * 100);
  
  console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
  console.log(`✅ Caminhos verificados: ${results.caminhos.filter(c => c.exists).length}/${results.caminhos.length}`);
  console.log(`✅ Scripts verificados: ${results.scripts.filter(s => s.status === 'OK').length}/${results.scripts.length}`);
  console.log(`❌ Erros encontrados: ${results.erros.length}`);
  console.log(`🔧 Correções aplicadas: ${results.correcoes.length}`);
  console.log(`📈 Score: ${results.score}/100`);
  
  await gerarRelatorio();
  
  return results;
}

if (require.main === module) {
  executarDiagnostico()
    .then(() => {
      console.log('\n✅ Diagnóstico concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no diagnóstico:', error);
      process.exit(1);
    });
}

module.exports = { executarDiagnostico };

