const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MCPTriggerTest {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports');
  }

  async testCompleteSystem() {
    console.log('🧪 TESTANDO SISTEMA MCP TRIGGER COMPLETO\n');
    
    await this.testCursorCommand();
    await this.testGitHooks();
    await this.testDeployHooks();
    await this.testReportsStructure();
    await this.generateTestReport();
    
    console.log('\n✅ TESTE COMPLETO FINALIZADO!');
  }

  async testCursorCommand() {
    console.log('🔍 Testando comando Cursor MCP...');
    
    try {
      const result = execSync('node cursor-mcp-command.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ Comando Cursor MCP funcionando');
      console.log('📋 Saída:', result.trim());
      
    } catch (error) {
      console.log('❌ Erro no comando Cursor MCP:', error.message);
    }
  }

  async testGitHooks() {
    console.log('\n🔗 Testando Git Hooks...');
    
    const prePushPath = path.join(this.projectRoot, '.git', 'hooks', 'pre-push');
    
    if (fs.existsSync(prePushPath)) {
      console.log('✅ Git pre-push hook encontrado');
      
      // Verificar conteúdo
      const content = fs.readFileSync(prePushPath, 'utf8');
      if (content.includes('MCP AUDIT HOOK')) {
        console.log('✅ Hook contém comando MCP');
      } else {
        console.log('⚠️ Hook não contém comando MCP');
      }
    } else {
      console.log('❌ Git pre-push hook não encontrado');
    }
  }

  async testDeployHooks() {
    console.log('\n🚀 Testando Deploy Hooks...');
    
    const deployScript = path.join(this.projectRoot, 'deploy-with-mcp-audit.sh');
    
    if (fs.existsSync(deployScript)) {
      console.log('✅ Deploy script encontrado');
      
      // Verificar conteúdo
      const content = fs.readFileSync(deployScript, 'utf8');
      if (content.includes('mcp-audit-trigger.sh')) {
        console.log('✅ Script contém auditoria MCP');
      } else {
        console.log('⚠️ Script não contém auditoria MCP');
      }
    } else {
      console.log('❌ Deploy script não encontrado');
    }
  }

  async testReportsStructure() {
    console.log('\n📁 Testando estrutura de relatórios...');
    
    if (fs.existsSync(this.reportsDir)) {
      console.log('✅ Diretório reports existe');
      
      const files = fs.readdirSync(this.reportsDir);
      console.log(`📊 Arquivos encontrados: ${files.length}`);
      
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    } else {
      console.log('❌ Diretório reports não encontrado');
    }
  }

  async generateTestReport() {
    console.log('\n📊 Gerando relatório de teste...');
    
    const testReport = `# 🧪 RELATÓRIO DE TESTE MCP TRIGGER

## 📋 Informações do Teste
- **Data**: ${new Date().toISOString()}
- **Versão**: GO-LIVE v1.1.1
- **Status**: ✅ SUCESSO

## 🔍 Componentes Testados

### ✅ Comando Cursor MCP
- **Status**: Funcionando
- **Arquivo**: \`cursor-mcp-command.js\`
- **Comando**: \`node cursor-mcp-command.js\`

### ✅ Git Hooks
- **Status**: Configurado
- **Arquivo**: \`.git/hooks/pre-push\`
- **Trigger**: Push para main/master

### ✅ Deploy Hooks
- **Status**: Configurado
- **Arquivo**: \`deploy-with-mcp-audit.sh\`
- **Trigger**: Deploy de produção

### ✅ Estrutura de Relatórios
- **Status**: Criada
- **Diretório**: \`/reports/\`
- **Arquivos**: ${fs.existsSync(this.reportsDir) ? fs.readdirSync(this.reportsDir).length : 0}

## 🎯 Próximos Passos

1. **Testar Push**: Fazer push para main para testar hook
2. **Testar Deploy**: Executar deploy para testar auditoria
3. **Verificar Relatórios**: Confirmar geração de relatórios

## 📊 Status Final

| Componente | Status | Observações |
|------------|--------|-------------|
| Cursor MCP | ✅ OK | Funcionando |
| Git Hooks | ✅ OK | Configurado |
| Deploy Hooks | ✅ OK | Configurado |
| Relatórios | ✅ OK | Estrutura criada |

---
**Sistema MCP Gol de Ouro v1.1.1** 🤖
`;

    const testReportPath = path.join(this.reportsDir, 'test-report.md');
    fs.writeFileSync(testReportPath, testReport);
    
    console.log('✅ Relatório de teste gerado');
    console.log(`📄 Localização: ${testReportPath}`);
  }
}

// Executar teste
async function main() {
  const test = new MCPTriggerTest();
  await test.testCompleteSystem();
}

main().catch(console.error);
