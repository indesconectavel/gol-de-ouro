const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CursorMCPCommand {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports');
    this.mcpDir = path.join(this.projectRoot, 'mcp-system');
    this.version = 'GO-LIVE v1.1.1';
  }

  async executeAudit() {
    console.log('⚙️ MCP AUDIT HOOK — GOL DE OURO');
    console.log('=================================');
    
    // Obter informações do git
    let branch = 'unknown';
    try {
      branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.log('⚠️ Não foi possível obter branch atual');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    console.log(`Branch: ${branch}`);
    console.log(`Versão: ${this.version}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log('');
    
    // Navegar para diretório MCP e executar auditoria
    try {
      console.log('🔍 Executando auditoria MCP...');
      
      // Executar auditoria
      const result = execSync(`cd "${this.mcpDir}" && node audit-simple.js --report`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ Auditoria executada com sucesso');
      
      // Verificar se relatório foi gerado
      const latestReport = path.join(this.reportsDir, 'audit-latest.md');
      const timestampedReport = path.join(this.reportsDir, `audit-${timestamp}.md`);
      
      if (fs.existsSync(latestReport)) {
        // Copiar para relatório timestamped
        fs.copyFileSync(latestReport, timestampedReport);
        
        console.log('Status: ✅ OK');
        console.log(`Relatório salvo em: ${latestReport}`);
        console.log(`Relatório histórico: ${timestampedReport}`);
        console.log('');
        console.log('✅ AUDITORIA APROVADA - Deploy autorizado');
        
        return { success: true, status: 'OK', reportPath: latestReport };
        
      } else {
        console.log('Status: ⚠️ ALERTA');
        console.log('Relatório não encontrado, mas auditoria executada');
        console.log('');
        console.log('⚠️ AUDITORIA COM ALERTAS - Deploy continuará com avisos');
        
        return { success: true, status: 'ALERTA', reportPath: null };
      }
      
    } catch (error) {
      console.log('Status: ❌ ERRO');
      console.log(`Erro: ${error.message}`);
      console.log('');
      console.log('❌ AUDITORIA FALHOU - Deploy cancelado');
      console.log('🔧 Corrija os problemas antes de continuar');
      
      return { success: false, status: 'ERRO', reportPath: null };
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const command = new CursorMCPCommand();
  command.executeAudit().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = CursorMCPCommand;
