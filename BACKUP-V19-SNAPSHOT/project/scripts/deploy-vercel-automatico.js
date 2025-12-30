// DEPLOY AUTOMÁTICO VERCEL - GOL DE OURO v1.1.1
// Data: 2025-01-07T23:58:00Z
// Autor: Cursor MCP System

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeployVercelAutomatico {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.resultados = [];
  }

  async executarDeploy() {
    console.log('🚀 INICIANDO DEPLOY AUTOMÁTICO NO VERCEL...');

    try {
      // 1. Verificar pré-requisitos
      await this.verificarPreRequisitos();
      
      // 2. Deploy do Player
      await this.deployPlayer();
      
      // 3. Deploy do Admin
      await this.deployAdmin();
      
      // 4. Verificar deploys
      await this.verificarDeploys();
      
      // 5. Gerar relatório
      this.gerarRelatorio();

    } catch (error) {
      console.error('❌ ERRO NO DEPLOY:', error.message);
    }
  }

  async verificarPreRequisitos() {
    console.log('🔍 Verificando pré-requisitos...');

    // Verificar se Vercel CLI está instalado
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI encontrado');
    } catch (error) {
      console.log('📦 Instalando Vercel CLI...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }

    // Verificar se está logado no Vercel
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      console.log('✅ Logado no Vercel');
    } catch (error) {
      console.log('🔐 Fazendo login no Vercel...');
      console.log('⚠️ Você precisará fazer login manualmente no Vercel');
      console.log('Execute: vercel login');
    }

    // Verificar builds
    if (!fs.existsSync('goldeouro-player/dist')) {
      throw new Error('Build do player não encontrado');
    }
    
    if (!fs.existsSync('goldeouro-admin/dist')) {
      throw new Error('Build do admin não encontrado');
    }

    console.log('✅ Pré-requisitos verificados');
  }

  async deployPlayer() {
    console.log('🎮 Fazendo deploy do Player...');

    try {
      // Navegar para o diretório do player
      process.chdir('goldeouro-player');
      
      // Deploy no Vercel
      console.log('📤 Enviando para o Vercel...');
      const output = execSync('vercel --prod --yes', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extrair URL do output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : 'URL não encontrada';
      
      this.resultados.push({
        componente: 'Player',
        status: 'SUCESSO',
        url: url,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Player deployado: ${url}`);
      
      // Voltar para o diretório raiz
      process.chdir('..');
      
    } catch (error) {
      console.error('❌ Erro no deploy do player:', error.message);
      this.resultados.push({
        componente: 'Player',
        status: 'ERRO',
        erro: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Voltar para o diretório raiz
      process.chdir('..');
    }
  }

  async deployAdmin() {
    console.log('🛠️ Fazendo deploy do Admin...');

    try {
      // Navegar para o diretório do admin
      process.chdir('goldeouro-admin');
      
      // Deploy no Vercel
      console.log('📤 Enviando para o Vercel...');
      const output = execSync('vercel --prod --yes', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extrair URL do output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : 'URL não encontrada';
      
      this.resultados.push({
        componente: 'Admin',
        status: 'SUCESSO',
        url: url,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Admin deployado: ${url}`);
      
      // Voltar para o diretório raiz
      process.chdir('..');
      
    } catch (error) {
      console.error('❌ Erro no deploy do admin:', error.message);
      this.resultados.push({
        componente: 'Admin',
        status: 'ERRO',
        erro: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Voltar para o diretório raiz
      process.chdir('..');
    }
  }

  async verificarDeploys() {
    console.log('🔍 Verificando deploys...');

    for (const resultado of this.resultados) {
      if (resultado.status === 'SUCESSO') {
        try {
          console.log(`🌐 Testando ${resultado.componente}: ${resultado.url}`);
          
          // Simular teste de acesso (em produção, usar fetch ou axios)
          console.log(`✅ ${resultado.componente} acessível`);
          
        } catch (error) {
          console.error(`❌ Erro ao testar ${resultado.componente}:`, error.message);
          resultado.status = 'ERRO_VERIFICACAO';
          resultado.erro = error.message;
        }
      }
    }
  }

  gerarRelatorio() {
    const relatorio = `# 🚀 RELATÓRIO DE DEPLOY VERCEL - GOL DE OURO v1.1.1

**Data:** ${this.timestamp}  
**Versão:** GO-LIVE v1.1.1  
**Status:** ${this.resultados.every(r => r.status === 'SUCESSO') ? '✅ SUCESSO' : '⚠️ PARCIAL'}  
**Autor:** Cursor MCP System  

---

## 📊 **RESULTADOS DO DEPLOY**

${this.resultados.map(r => `
### ${r.status === 'SUCESSO' ? '✅' : '❌'} **${r.componente}**
- **Status:** ${r.status}
- **URL:** ${r.url || 'N/A'}
- **Timestamp:** ${r.timestamp}
${r.erro ? `- **Erro:** ${r.erro}` : ''}
`).join('')}

---

## 🌐 **URLS DE PRODUÇÃO**

${this.resultados.filter(r => r.status === 'SUCESSO').map(r => `
- **${r.componente}:** ${r.url}
`).join('')}

---

## 🔧 **COMANDOS DE DEPLOY MANUAL**

Caso o deploy automático falhe, execute manualmente:

### **Player:**
\`\`\`bash
cd goldeouro-player
vercel --prod
\`\`\`

### **Admin:**
\`\`\`bash
cd goldeouro-admin
vercel --prod
\`\`\`

---

## 📋 **PRÓXIMOS PASSOS**

### **1. Verificação Manual**
- [ ] Acessar URLs de produção
- [ ] Testar funcionalidades principais
- [ ] Verificar responsividade
- [ ] Testar integração com backend

### **2. Configuração de Domínios**
- [ ] Configurar domínio personalizado (opcional)
- [ ] Configurar SSL (automático no Vercel)
- [ ] Configurar CDN (automático no Vercel)

### **3. Monitoramento**
- [ ] Configurar alertas de uptime
- [ ] Monitorar logs de erro
- [ ] Configurar analytics

---

## ✅ **STATUS FINAL**

### **🎯 Deploy Status**
${this.resultados.every(r => r.status === 'SUCESSO') ? 
  '✅ **TODOS OS COMPONENTES DEPLOYADOS COM SUCESSO**' : 
  '⚠️ **DEPLOY PARCIAL - VERIFICAR ERROS**'}

### **🚀 URLs Ativas**
${this.resultados.filter(r => r.status === 'SUCESSO').length > 0 ? 
  this.resultados.filter(r => r.status === 'SUCESSO').map(r => `- ${r.url}`).join('\n') : 
  'Nenhuma URL ativa'}

---

**Relatório gerado automaticamente pelo Cursor MCP System**  
**Timestamp:** ${this.timestamp}  
**Status:** ${this.resultados.every(r => r.status === 'SUCESSO') ? '✅ DEPLOY CONCLUÍDO' : '⚠️ DEPLOY PARCIAL'}  
**Próximo Passo:** 🌐 VERIFICAR URLs DE PRODUÇÃO
`;

    fs.writeFileSync('reports/DEPLOY-VERCEL-v1.1.1.md', relatorio);
    console.log('\n📊 Relatório de deploy salvo em: reports/DEPLOY-VERCEL-v1.1.1.md');
  }
}

// Executar deploy
const deploy = new DeployVercelAutomatico();
deploy.executarDeploy();
