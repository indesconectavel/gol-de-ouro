const cron = require('node-cron');
const BackupSystem = require('./backup-system');
const RestorePoints = require('./restore-points');
const ExternalAPIIntegration = require('./external-apis');

class AutoBackupSystem {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.restorePoints = new RestorePoints();
    this.externalAPIs = new ExternalAPIIntegration();
    this.isRunning = false;
  }

  // Iniciar sistema de backup automático
  start() {
    if (this.isRunning) {
      console.log('⚠️ Sistema de backup automático já está rodando');
      return;
    }

    console.log('🚀 Iniciando sistema de backup automático...');

    // Backup diário às 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Executando backup diário...');
      await this.createDailyBackup();
    });

    // Backup semanal aos domingos às 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('🔄 Executando backup semanal...');
      await this.createWeeklyBackup();
    });

    // Backup antes de atualizações (quando detectar mudanças no código)
    cron.schedule('*/30 * * * *', async () => {
      await this.checkForCodeChanges();
    });

    // Limpeza de backups antigos diariamente às 4:00 AM
    cron.schedule('0 4 * * *', async () => {
      console.log('🧹 Executando limpeza de backups antigos...');
      await this.cleanupOldBackups();
    });

    // Validação de integridade semanalmente
    cron.schedule('0 5 * * 1', async () => {
      console.log('🔍 Executando validação de integridade...');
      await this.validateBackups();
    });

    this.isRunning = true;
    console.log('✅ Sistema de backup automático iniciado');
  }

  // Parar sistema de backup automático
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Sistema de backup automático não está rodando');
      return;
    }

    cron.getTasks().forEach(task => task.destroy());
    this.isRunning = false;
    console.log('⏹️ Sistema de backup automático parado');
  }

  // Criar backup diário
  async createDailyBackup() {
    try {
      const result = await this.backupSystem.createFullBackup();
      
      if (result.success) {
        console.log('✅ Backup diário criado:', result.backupId);
        
        // Criar ponto de restauração automático
        await this.restorePoints.createAutomaticRestorePoint('daily-backup');
        
        // Enviar notificação de sucesso (se configurado)
        await this.sendBackupNotification('daily', result, true);
      } else {
        console.error('❌ Falha no backup diário:', result.error);
        await this.sendBackupNotification('daily', result, false);
      }
    } catch (error) {
      console.error('❌ Erro no backup diário:', error.message);
    }
  }

  // Criar backup semanal
  async createWeeklyBackup() {
    try {
      const result = await this.backupSystem.createFullBackup();
      
      if (result.success) {
        console.log('✅ Backup semanal criado:', result.backupId);
        
        // Criar ponto de restauração com nome específico
        await this.restorePoints.createRestorePoint(
          `Weekly-${new Date().toISOString().split('T')[0]}`,
          'Backup semanal automático'
        );
        
        // Enviar notificação de sucesso
        await this.sendBackupNotification('weekly', result, true);
      } else {
        console.error('❌ Falha no backup semanal:', result.error);
        await this.sendBackupNotification('weekly', result, false);
      }
    } catch (error) {
      console.error('❌ Erro no backup semanal:', error.message);
    }
  }

  // Verificar mudanças no código
  async checkForCodeChanges() {
    try {
      const fs = require('fs');
      const path = require('path');
      const lastCheckFile = path.join(__dirname, '../.last-code-check');
      
      // Verificar se houve mudanças nos arquivos principais
      const criticalFiles = [
        'server.js',
        'routes/',
        'middlewares/',
        'utils/'
      ];
      
      let hasChanges = false;
      const currentTime = Date.now();
      
      for (const file of criticalFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() > (this.lastCheckTime || 0)) {
            hasChanges = true;
            break;
          }
        }
      }
      
      if (hasChanges) {
        console.log('🔄 Detectadas mudanças no código, criando backup...');
        await this.createCodeChangeBackup();
        this.lastCheckTime = currentTime;
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar mudanças no código:', error.message);
    }
  }

  // Criar backup por mudança de código
  async createCodeChangeBackup() {
    try {
      const result = await this.backupSystem.createFullBackup();
      
      if (result.success) {
        console.log('✅ Backup por mudança de código criado:', result.backupId);
        
        // Criar ponto de restauração automático
        await this.restorePoints.createAutomaticRestorePoint('code-change');
      }
    } catch (error) {
      console.error('❌ Erro no backup por mudança de código:', error.message);
    }
  }

  // Limpar backups antigos
  async cleanupOldBackups() {
    try {
      const backups = this.backupSystem.listBackups();
      const restorePoints = await this.restorePoints.listRestorePoints();
      
      // Manter apenas os últimos 30 backups
      const maxBackups = 30;
      if (backups.length > maxBackups) {
        const toDelete = backups.slice(maxBackups);
        for (const backup of toDelete) {
          // Verificar se não está associado a um ponto de restauração
          const isInRestorePoint = restorePoints.some(rp => rp.backupId === backup.id);
          
          if (!isInRestorePoint) {
            const fs = require('fs');
            const path = require('path');
            const backupPath = path.join(__dirname, '../backups', backup.id);
            
            if (fs.existsSync(backupPath)) {
              fs.rmSync(backupPath, { recursive: true, force: true });
              console.log('🗑️ Backup antigo removido:', backup.id);
            }
          }
        }
      }
      
      console.log('✅ Limpeza de backups antigos concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza de backups antigos:', error.message);
    }
  }

  // Validar backups
  async validateBackups() {
    try {
      const validationResults = await this.restorePoints.validateRestorePoints();
      const invalidBackups = validationResults.filter(result => result.status === 'invalid');
      
      if (invalidBackups.length > 0) {
        console.warn('⚠️ Backups inválidos encontrados:', invalidBackups.length);
        
        // Enviar alerta
        await this.sendBackupNotification('validation', {
          invalidCount: invalidBackups.length,
          invalidBackups: invalidBackups.map(b => b.id)
        }, false);
      } else {
        console.log('✅ Todos os backups estão válidos');
      }
    } catch (error) {
      console.error('❌ Erro na validação de backups:', error.message);
    }
  }

  // Enviar notificação de backup
  async sendBackupNotification(type, data, success) {
    try {
      // Enviar notificação push (se configurado)
      if (process.env.ADMIN_DEVICE_TOKEN) {
        const title = success ? 
          `✅ Backup ${type} concluído` : 
          `❌ Falha no backup ${type}`;
        
        const body = success ? 
          `Backup criado com sucesso: ${data.backupId || 'N/A'}` :
          `Erro: ${data.error || 'Desconhecido'}`;

        await this.externalAPIs.sendPushNotification({
          deviceToken: process.env.ADMIN_DEVICE_TOKEN,
          title,
          body,
          data: {
            type: 'backup',
            backupType: type,
            success: success.toString()
          }
        });
      }

      // Enviar SMS (se configurado)
      if (process.env.ADMIN_PHONE_NUMBER) {
        const message = success ?
          `Gol de Ouro: Backup ${type} concluído com sucesso` :
          `Gol de Ouro: Falha no backup ${type} - ${data.error || 'Erro desconhecido'}`;

        await this.externalAPIs.sendSMS({
          phoneNumber: process.env.ADMIN_PHONE_NUMBER,
          message
        });
      }

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de backup:', error.message);
    }
  }

  // Obter status do sistema
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      cronJobs: cron.getTasks().length
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const autoBackup = new AutoBackupSystem();
  
  // Iniciar sistema
  autoBackup.start();
  
  // Manter processo rodando
  process.on('SIGINT', () => {
    console.log('\n⏹️ Parando sistema de backup automático...');
    autoBackup.stop();
    process.exit(0);
  });
  
  // Mostrar status a cada 5 minutos
  setInterval(() => {
    const status = autoBackup.getStatus();
    console.log('📊 Status do backup automático:', status);
  }, 5 * 60 * 1000);
}

module.exports = AutoBackupSystem;
