// Script de Validação Final - Engine V19
// ======================================
// Valida toda a estrutura V19 após refactor
// Data: 2025-01-24

const fs = require('fs');
const path = require('path');

const results = {
  imports: { valid: 0, invalid: 0, errors: [] },
  modules: { valid: 0, invalid: 0, errors: [] },
  routes: { valid: 0, invalid: 0, errors: [] },
  services: { valid: 0, invalid: 0, errors: [] },
  controllers: { valid: 0, invalid: 0, errors: [] }
};

console.log('🔍 [V19] Iniciando validação completa da Engine V19...\n');

// Validar estrutura de módulos
function validateModuleStructure() {
  console.log('📁 Validando estrutura de módulos...');
  
  const modules = [
    'game',
    'admin',
    'auth',
    'financial',
    'rewards',
    'lotes',
    'monitor',
    'health',
    'shared'
  ];

  modules.forEach(module => {
    const modulePath = path.join(__dirname, '..', 'modules', module);
    if (fs.existsSync(modulePath)) {
      results.modules.valid++;
      console.log(`  ✅ Módulo ${module} existe`);
    } else {
      results.modules.invalid++;
      results.modules.errors.push(`Módulo ${module} não encontrado`);
      console.log(`  ❌ Módulo ${module} não encontrado`);
    }
  });
}

// Validar arquivos principais
function validateMainFiles() {
  console.log('\n📄 Validando arquivos principais...');
  
  const mainFiles = [
    'server-fly.js',
    'package.json',
    'database/supabase-unified-config.js'
  ];

  mainFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file} existe`);
    } else {
      console.log(`  ❌ ${file} não encontrado`);
    }
  });
}

// Validar imports críticos
function validateCriticalImports() {
  console.log('\n🔗 Validando imports críticos...');
  
  try {
    // Testar import do server-fly
    const serverPath = path.join(__dirname, '..', '..', 'server-fly.js');
    if (fs.existsSync(serverPath)) {
      console.log('  ✅ server-fly.js encontrado');
      
      // Tentar carregar módulos críticos
      const modulesToTest = [
        { name: 'GameController', path: '../modules/game/controllers/game.controller' },
        { name: 'LoteService', path: '../modules/lotes/services/lote.service' },
        { name: 'FinancialService', path: '../modules/financial/services/financial.service' },
        { name: 'RewardService', path: '../modules/rewards/services/reward.service' }
      ];

      modulesToTest.forEach(({ name, modulePath }) => {
        try {
          const fullPath = path.join(__dirname, '..', modulePath);
          if (fs.existsSync(fullPath + '.js')) {
            console.log(`  ✅ ${name} encontrado`);
            results.imports.valid++;
          } else {
            console.log(`  ❌ ${name} não encontrado em ${modulePath}`);
            results.imports.invalid++;
            results.imports.errors.push(`${name} não encontrado`);
          }
        } catch (error) {
          console.log(`  ⚠️ Erro ao validar ${name}: ${error.message}`);
          results.imports.invalid++;
          results.imports.errors.push(`${name}: ${error.message}`);
        }
      });
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar imports: ${error.message}`);
  }
}

// Validar rotas
function validateRoutes() {
  console.log('\n🛣️  Validando rotas...');
  
  const routes = [
    { module: 'game', file: 'game.routes.js' },
    { module: 'admin', file: 'admin.routes.js' },
    { module: 'auth', file: 'auth.routes.js' },
    { module: 'auth', file: 'usuario.routes.js' },
    { module: 'financial', file: 'payment.routes.js' },
    { module: 'financial', file: 'withdraw.routes.js' },
    { module: 'monitor', file: 'system.routes.js' },
    { module: 'health', file: 'health.routes.js' }
  ];

  routes.forEach(({ module, file }) => {
    const routePath = path.join(__dirname, '..', 'modules', module, 'routes', file);
    if (fs.existsSync(routePath)) {
      console.log(`  ✅ ${module}/${file} existe`);
      results.routes.valid++;
    } else {
      console.log(`  ❌ ${module}/${file} não encontrado`);
      results.routes.invalid++;
      results.routes.errors.push(`${module}/${file} não encontrado`);
    }
  });
}

// Validar controllers
function validateControllers() {
  console.log('\n🎮 Validando controllers...');
  
  const controllers = [
    { module: 'game', file: 'game.controller.js' },
    { module: 'admin', file: 'admin.controller.js' },
    { module: 'auth', file: 'auth.controller.js' },
    { module: 'auth', file: 'usuario.controller.js' },
    { module: 'financial', file: 'payment.controller.js' },
    { module: 'financial', file: 'withdraw.controller.js' },
    { module: 'monitor', file: 'system.controller.js' }
  ];

  controllers.forEach(({ module, file }) => {
    const controllerPath = path.join(__dirname, '..', 'modules', module, 'controllers', file);
    if (fs.existsSync(controllerPath)) {
      console.log(`  ✅ ${module}/${file} existe`);
      results.controllers.valid++;
    } else {
      console.log(`  ❌ ${module}/${file} não encontrado`);
      results.controllers.invalid++;
      results.controllers.errors.push(`${module}/${file} não encontrado`);
    }
  });
}

// Validar services
function validateServices() {
  console.log('\n⚙️  Validando services...');
  
  const services = [
    { module: 'lotes', file: 'lote.service.js' },
    { module: 'financial', file: 'financial.service.js' },
    { module: 'financial', file: 'webhook.service.js' },
    { module: 'rewards', file: 'reward.service.js' },
    { module: 'shared', file: 'email.service.js' }
  ];

  services.forEach(({ module, file }) => {
    const servicePath = path.join(__dirname, '..', 'modules', module, 'services', file);
    if (fs.existsSync(servicePath)) {
      console.log(`  ✅ ${module}/${file} existe`);
      results.services.valid++;
    } else {
      console.log(`  ❌ ${module}/${file} não encontrado`);
      results.services.invalid++;
      results.services.errors.push(`${module}/${file} não encontrado`);
    }
  });
}

// Gerar relatório
function generateReport() {
  console.log('\n📊 Gerando relatório de validação...\n');
  
  const totalValid = 
    results.modules.valid +
    results.routes.valid +
    results.services.valid +
    results.controllers.valid +
    results.imports.valid;
  
  const totalInvalid = 
    results.modules.invalid +
    results.routes.invalid +
    results.services.invalid +
    results.controllers.invalid +
    results.imports.invalid;

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 RELATÓRIO DE VALIDAÇÃO - ENGINE V19');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log(`✅ Módulos: ${results.modules.valid} válidos, ${results.modules.invalid} inválidos`);
  console.log(`✅ Rotas: ${results.routes.valid} válidas, ${results.routes.invalid} inválidas`);
  console.log(`✅ Services: ${results.services.valid} válidos, ${results.services.invalid} inválidos`);
  console.log(`✅ Controllers: ${results.controllers.valid} válidos, ${results.controllers.invalid} inválidos`);
  console.log(`✅ Imports: ${results.imports.valid} válidos, ${results.imports.invalid} inválidos`);
  
  console.log(`\n📊 TOTAL: ${totalValid} válidos, ${totalInvalid} inválidos`);
  
  if (totalInvalid === 0) {
    console.log('\n🎉 ✅ VALIDAÇÃO COMPLETA - TUDO OK!');
  } else {
    console.log('\n⚠️  VALIDAÇÃO COMPLETA COM AVISOS');
    console.log('\nErros encontrados:');
    
    Object.keys(results).forEach(key => {
      if (results[key].errors.length > 0) {
        console.log(`\n${key.toUpperCase()}:`);
        results[key].errors.forEach(error => {
          console.log(`  - ${error}`);
        });
      }
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  // Salvar relatório
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'refactor_v19', 'VALIDACAO-FINAL-V19.md');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportContent = `# 📋 RELATÓRIO DE VALIDAÇÃO - ENGINE V19
## Data: ${new Date().toISOString()}

### Resultados:
- ✅ Módulos: ${results.modules.valid} válidos, ${results.modules.invalid} inválidos
- ✅ Rotas: ${results.routes.valid} válidas, ${results.routes.invalid} inválidas
- ✅ Services: ${results.services.valid} válidos, ${results.services.invalid} inválidos
- ✅ Controllers: ${results.controllers.valid} válidos, ${results.controllers.invalid} inválidos
- ✅ Imports: ${results.imports.valid} válidos, ${results.imports.invalid} inválidos

### Total: ${totalValid} válidos, ${totalInvalid} inválidos

### Erros:
${JSON.stringify(results, null, 2)}
`;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Relatório salvo em: ${reportPath}`);
  
  return totalInvalid === 0;
}

// Executar validações
try {
  validateModuleStructure();
  validateMainFiles();
  validateCriticalImports();
  validateRoutes();
  validateControllers();
  validateServices();
  
  const isValid = generateReport();
  process.exit(isValid ? 0 : 1);
} catch (error) {
  console.error('❌ Erro durante validação:', error);
  process.exit(1);
}
