// 🚀 SISTEMA DE DEPLOY AUTOMATIZADO - GOL DE OURO
// Data: 16 de Outubro de 2025
// Objetivo: Deploy seguro e automatizado do sistema

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class SistemaDeploy {
  constructor() {
    this.config = {
      backend: {
        app: 'goldeouro-backend',
        platform: 'fly.io',
        healthCheck: 'https://goldeouro-backend.fly.dev/health'
      },
      frontend: {
        player: {
          platform: 'vercel',
          url: 'https://goldeouro.lol'
        },
        admin: {
          platform: 'vercel',
          url: 'https://admin.goldeouro.lol'
        }
      },
      timeout: 300000, // 5 minutos
      retries: 3
    };
    
    this.logFile = path.join(__dirname, '..', 'logs', 'deploy.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async executeCommand(command, retries = 0) {
    try {
      this.log(`🔧 [DEPLOY] Executando: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeout,
        cwd: process.cwd()
      });

      if (stderr && !stderr.includes('warning')) {
        this.log(`⚠️ [DEPLOY] Stderr: ${stderr}`, 'WARN');
      }

      this.log(`✅ [DEPLOY] Comando executado com sucesso`);
      return { success: true, stdout, stderr };
      
    } catch (error) {
      this.log(`❌ [DEPLOY] Erro no comando: ${error.message}`, 'ERROR');
      
      if (retries < this.config.retries) {
        this.log(`🔄 [DEPLOY] Tentativa ${retries + 1}/${this.config.retries}`, 'WARN');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5 segundos
        return this.executeCommand(command, retries + 1);
      }
      
      return { success: false, error: error.message };
    }
  }

  async checkHealth(url, name) {
    try {
      const https = require('https');
      
      return new Promise((resolve) => {
        const req = https.request(url, { timeout: 10000 }, (res) => {
          const isHealthy = res.statusCode === 200;
          this.log(`${isHealthy ? '✅' : '❌'} [HEALTH] ${name}: ${res.statusCode}`);
          resolve({ success: isHealthy, status: res.statusCode });
        });

        req.on('error', (error) => {
          this.log(`❌ [HEALTH] ${name}: ${error.message}`, 'ERROR');
          resolve({ success: false, error: error.message });
        });

        req.on('timeout', () => {
          this.log(`⏰ [HEALTH] ${name}: Timeout`, 'WARN');
          req.destroy();
          resolve({ success: false, error: 'Timeout' });
        });

        req.end();
      });
    } catch (error) {
      this.log(`❌ [HEALTH] ${name}: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async preDeployChecks() {
    this.log('🔍 [DEPLOY] Executando verificações pré-deploy...');
    
    const checks = [
      this.checkHealth(this.config.backend.healthCheck, 'Backend'),
      this.checkHealth(this.config.frontend.player.url, 'Frontend Player'),
      this.checkHealth(this.config.frontend.admin.url, 'Frontend Admin')
    ];

    const results = await Promise.all(checks);
    const allHealthy = results.every(r => r.success);
    
    if (allHealthy) {
      this.log('✅ [DEPLOY] Todas as verificações passaram');
    } else {
      this.log('⚠️ [DEPLOY] Algumas verificações falharam, mas continuando...', 'WARN');
    }
    
    return allHealthy;
  }

  async deployBackend() {
    this.log('🚀 [DEPLOY] Iniciando deploy do backend...');
    
    try {
      // Verificar se fly CLI está instalado
      const flyCheck = await this.executeCommand('fly version');
      if (!flyCheck.success) {
        throw new Error('Fly CLI não encontrado');
      }

      // Deploy do backend
      const deployResult = await this.executeCommand(`fly deploy --app ${this.config.backend.app}`);
      
      if (!deployResult.success) {
        throw new Error(`Deploy do backend falhou: ${deployResult.error}`);
      }

      // Aguardar deploy finalizar
      this.log('⏳ [DEPLOY] Aguardando deploy finalizar...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos

      // Verificar saúde do backend
      const healthCheck = await this.checkHealth(this.config.backend.healthCheck, 'Backend Deploy');
      
      if (healthCheck.success) {
        this.log('✅ [DEPLOY] Backend deployado com sucesso');
        return { success: true };
      } else {
        throw new Error('Backend não está saudável após deploy');
      }
      
    } catch (error) {
      this.log(`❌ [DEPLOY] Erro no deploy do backend: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async deployFrontend() {
    this.log('🚀 [DEPLOY] Iniciando deploy do frontend...');
    
    try {
      // Verificar se Vercel CLI está instalado
      const vercelCheck = await this.executeCommand('vercel --version');
      if (!vercelCheck.success) {
        this.log('⚠️ [DEPLOY] Vercel CLI não encontrado, pulando deploy do frontend', 'WARN');
        return { success: true, skipped: true };
      }

      // Deploy do frontend player
      if (fs.existsSync('goldeouro-player')) {
        this.log('🚀 [DEPLOY] Deployando frontend player...');
        const playerDeploy = await this.executeCommand('cd goldeouro-player && vercel --prod --yes');
        
        if (!playerDeploy.success) {
          this.log(`⚠️ [DEPLOY] Deploy do player falhou: ${playerDeploy.error}`, 'WARN');
        } else {
          this.log('✅ [DEPLOY] Frontend player deployado');
        }
      }

      // Deploy do frontend admin
      if (fs.existsSync('goldeouro-admin')) {
        this.log('🚀 [DEPLOY] Deployando frontend admin...');
        const adminDeploy = await this.executeCommand('cd goldeouro-admin && vercel --prod --yes');
        
        if (!adminDeploy.success) {
          this.log(`⚠️ [DEPLOY] Deploy do admin falhou: ${adminDeploy.error}`, 'WARN');
        } else {
          this.log('✅ [DEPLOY] Frontend admin deployado');
        }
      }

      return { success: true };
      
    } catch (error) {
      this.log(`❌ [DEPLOY] Erro no deploy do frontend: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async postDeployChecks() {
    this.log('🔍 [DEPLOY] Executando verificações pós-deploy...');
    
    // Aguardar um pouco para os serviços estabilizarem
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minuto

    const checks = [
      this.checkHealth(this.config.backend.healthCheck, 'Backend'),
      this.checkHealth(this.config.frontend.player.url, 'Frontend Player'),
      this.checkHealth(this.config.frontend.admin.url, 'Frontend Admin')
    ];

    const results = await Promise.all(checks);
    const allHealthy = results.every(r => r.success);
    
    if (allHealthy) {
      this.log('🎉 [DEPLOY] Deploy concluído com sucesso!');
    } else {
      this.log('⚠️ [DEPLOY] Deploy concluído, mas alguns serviços não estão saudáveis', 'WARN');
    }
    
    return {
      success: allHealthy,
      results
    };
  }

  async fullDeploy() {
    this.log('🚀 [DEPLOY] Iniciando deploy completo do sistema...');
    
    const startTime = Date.now();
    
    try {
      // Verificações pré-deploy
      await this.preDeployChecks();
      
      // Deploy do backend
      const backendResult = await this.deployBackend();
      if (!backendResult.success) {
        throw new Error(`Deploy do backend falhou: ${backendResult.error}`);
      }
      
      // Deploy do frontend
      const frontendResult = await this.deployFrontend();
      if (!frontendResult.success && !frontendResult.skipped) {
        this.log(`⚠️ [DEPLOY] Deploy do frontend falhou: ${frontendResult.error}`, 'WARN');
      }
      
      // Verificações pós-deploy
      const postDeployResult = await this.postDeployChecks();
      
      const duration = Date.now() - startTime;
      const durationMinutes = Math.floor(duration / 60000);
      const durationSeconds = Math.floor((duration % 60000) / 1000);
      
      this.log(`⏱️ [DEPLOY] Deploy concluído em ${durationMinutes}m ${durationSeconds}s`);
      
      return {
        success: postDeployResult.success,
        duration: `${durationMinutes}m ${durationSeconds}s`,
        backend: backendResult.success,
        frontend: frontendResult.success || frontendResult.skipped,
        healthChecks: postDeployResult.results
      };
      
    } catch (error) {
      this.log(`❌ [DEPLOY] Deploy falhou: ${error.message}`, 'ERROR');
      return {
        success: false,
        error: error.message,
        duration: `${Math.floor((Date.now() - startTime) / 60000)}m ${Math.floor(((Date.now() - startTime) % 60000) / 1000)}s`
      };
    }
  }
}

// Executar deploy se chamado diretamente
if (require.main === module) {
  const deploy = new SistemaDeploy();
  deploy.fullDeploy().then(result => {
    if (result.success) {
      console.log('🎉 Deploy concluído com sucesso!');
      process.exit(0);
    } else {
      console.log('❌ Deploy falhou!');
      process.exit(1);
    }
  }).catch(console.error);
}

module.exports = SistemaDeploy;
