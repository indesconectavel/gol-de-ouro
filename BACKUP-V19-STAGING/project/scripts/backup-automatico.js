// Sistema de Backup Automático - Gol de Ouro v1.1.1
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { supabase } = require('./database/supabase-config');

const execAsync = promisify(exec);

class BackupAutomatico {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
    this.intervalHours = parseInt(process.env.BACKUP_INTERVAL || '24');
  }

  async iniciar() {
    console.log('🔄 Iniciando sistema de backup automático...');
    
    // Criar diretório de backup se não existir
    await fs.ensureDir(this.backupDir);
    
    // Executar backup inicial
    await this.executarBackup();
    
    // Configurar intervalo
    setInterval(async () => {
      await this.executarBackup();
    }, this.intervalHours * 60 * 60 * 1000);
    
    console.log(`✅ Sistema de backup configurado (intervalo: ${this.intervalHours}h)`);
  }

  async executarBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      console.log(`💾 Iniciando backup: ${backupName}`);
      
      // Criar diretório do backup
      await fs.ensureDir(backupPath);
      
      // 1. Backup do banco de dados
      await this.backupBancoDados(backupPath);
      
      // 2. Backup dos arquivos do sistema
      await this.backupArquivosSistema(backupPath);
      
      // 3. Backup das configurações
      await this.backupConfiguracoes(backupPath);
      
      // 4. Backup dos logs
      await this.backupLogs(backupPath);
      
      // 5. Criar arquivo de metadados
      await this.criarMetadados(backupPath, backupName);
      
      // 6. Comprimir backup
      await this.comprimirBackup(backupPath, backupName);
      
      // 7. Limpar backups antigos
      await this.limparBackupsAntigos();
      
      console.log(`✅ Backup concluído: ${backupName}`);
      
      // Salvar log do backup
      await this.salvarLogBackup(backupName, 'success');
      
    } catch (error) {
      console.error('❌ Erro no backup:', error);
      await this.salvarLogBackup('error', 'failed', error.message);
    }
  }

  async backupBancoDados(backupPath) {
    console.log('🗄️ Fazendo backup do banco de dados...');
    
    try {
      // Backup das tabelas principais
      const tabelas = [
        'usuarios',
        'partidas', 
        'partida_jogadores',
        'chutes',
        'transacoes',
        'pagamentos_pix',
        'saques',
        'fila_jogadores',
        'conquistas',
        'usuario_conquistas',
        'ranking',
        'configuracoes',
        'logs_sistema',
        'sessoes',
        'notificacoes'
      ];

      const backupData = {
        timestamp: new Date().toISOString(),
        tabelas: {}
      };

      for (const tabela of tabelas) {
        try {
          const { data, error } = await supabase
            .from(tabela)
            .select('*');
          
          if (error) {
            console.warn(`⚠️ Erro ao fazer backup da tabela ${tabela}:`, error.message);
            backupData.tabelas[tabela] = { error: error.message };
          } else {
            backupData.tabelas[tabela] = data || [];
            console.log(`✅ Tabela ${tabela}: ${data?.length || 0} registros`);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao acessar tabela ${tabela}:`, error.message);
          backupData.tabelas[tabela] = { error: error.message };
        }
      }

      // Salvar backup do banco
      const dbBackupFile = path.join(backupPath, 'database.json');
      await fs.writeJson(dbBackupFile, backupData, { spaces: 2 });
      
      console.log('✅ Backup do banco de dados concluído');
    } catch (error) {
      console.error('❌ Erro no backup do banco:', error);
      throw error;
    }
  }

  async backupArquivosSistema(backupPath) {
    console.log('📁 Fazendo backup dos arquivos do sistema...');
    
    const arquivosImportantes = [
      'package.json',
      'server-fly.js',
      'routes/',
      'controllers/',
      'middlewares/',
      'src/',
      'database/',
      'tests/',
      '.env.example'
    ];

    const systemBackupDir = path.join(backupPath, 'system');
    await fs.ensureDir(systemBackupDir);

    for (const arquivo of arquivosImportantes) {
      try {
        const srcPath = path.join(__dirname, '..', arquivo);
        const destPath = path.join(systemBackupDir, arquivo);
        
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
          console.log(`✅ Copiado: ${arquivo}`);
        } else {
          console.warn(`⚠️ Arquivo não encontrado: ${arquivo}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao copiar ${arquivo}:`, error.message);
      }
    }

    console.log('✅ Backup dos arquivos do sistema concluído');
  }

  async backupConfiguracoes(backupPath) {
    console.log('⚙️ Fazendo backup das configurações...');
    
    const configData = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      backupVersion: '1.1.1',
      configuracao: {
        backupInterval: this.intervalHours,
        retentionDays: this.retentionDays,
        backupDir: this.backupDir
      }
    };

    const configFile = path.join(backupPath, 'config.json');
    await fs.writeJson(configFile, configData, { spaces: 2 });
    
    console.log('✅ Backup das configurações concluído');
  }

  async backupLogs(backupPath) {
    console.log('📋 Fazendo backup dos logs...');
    
    const logsDir = path.join(__dirname, '..', 'logs');
    const backupLogsDir = path.join(backupPath, 'logs');
    
    if (await fs.pathExists(logsDir)) {
      await fs.copy(logsDir, backupLogsDir);
      console.log('✅ Logs copiados');
    } else {
      console.log('ℹ️ Diretório de logs não encontrado');
    }
  }

  async criarMetadados(backupPath, backupName) {
    const metadados = {
      nome: backupName,
      timestamp: new Date().toISOString(),
      versao: '1.1.1',
      tipo: 'automatico',
      tamanho: await this.calcularTamanho(backupPath),
      arquivos: await this.listarArquivos(backupPath),
      status: 'completo'
    };

    const metadadosFile = path.join(backupPath, 'metadata.json');
    await fs.writeJson(metadadosFile, metadados, { spaces: 2 });
  }

  async comprimirBackup(backupPath, backupName) {
    console.log('🗜️ Comprimindo backup...');
    
    try {
      const zipFile = path.join(this.backupDir, `${backupName}.zip`);
      
      // Usar zip se disponível, senão tar
      try {
        await execAsync(`zip -r "${zipFile}" "${backupPath}"`);
        console.log(`✅ Backup comprimido: ${zipFile}`);
        
        // Remover diretório não comprimido
        await fs.remove(backupPath);
      } catch (error) {
        console.warn('⚠️ Zip não disponível, usando tar...');
        await execAsync(`tar -czf "${zipFile.replace('.zip', '.tar.gz')}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`);
        await fs.remove(backupPath);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao comprimir backup:', error.message);
    }
  }

  async limparBackupsAntigos() {
    console.log('🧹 Limpando backups antigos...');
    
    try {
      const arquivos = await fs.readdir(this.backupDir);
      const agora = new Date();
      const limite = new Date(agora.getTime() - (this.retentionDays * 24 * 60 * 60 * 1000));
      
      let removidos = 0;
      
      for (const arquivo of arquivos) {
        const arquivoPath = path.join(this.backupDir, arquivo);
        const stats = await fs.stat(arquivoPath);
        
        if (stats.mtime < limite) {
          await fs.remove(arquivoPath);
          removidos++;
          console.log(`🗑️ Removido: ${arquivo}`);
        }
      }
      
      console.log(`✅ ${removidos} backups antigos removidos`);
    } catch (error) {
      console.error('❌ Erro ao limpar backups antigos:', error);
    }
  }

  async calcularTamanho(dirPath) {
    try {
      const { stdout } = await execAsync(`du -sh "${dirPath}"`);
      return stdout.split('\t')[0];
    } catch (error) {
      return 'N/A';
    }
  }

  async listarArquivos(dirPath) {
    try {
      const arquivos = await fs.readdir(dirPath, { recursive: true });
      return arquivos;
    } catch (error) {
      return [];
    }
  }

  async salvarLogBackup(backupName, status, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      backup: backupName,
      status: status,
      error: error
    };

    const logFile = path.join(this.backupDir, 'backup-log.json');
    
    try {
      let logs = [];
      if (await fs.pathExists(logFile)) {
        logs = await fs.readJson(logFile);
      }
      
      logs.push(logEntry);
      
      // Manter apenas os últimos 100 logs
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }
      
      await fs.writeJson(logFile, logs, { spaces: 2 });
    } catch (error) {
      console.error('❌ Erro ao salvar log de backup:', error);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const backup = new BackupAutomatico();
  backup.iniciar().catch(console.error);
}

module.exports = BackupAutomatico;
