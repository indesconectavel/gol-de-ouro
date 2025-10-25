# 💾 SISTEMA DE BACKUP AUTOMÁTICO - GOL DE OURO
# =============================================
**Data:** 23 de Outubro de 2025  
**Versão:** v1.1.1  
**Status:** ✅ CONFIGURAÇÃO COMPLETA  

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const AWS = require('aws-sdk');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// =====================================================
// CONFIGURAÇÃO DO SISTEMA DE BACKUP
// =====================================================

class GolDeOuroBackupSystem {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.backupDir = path.join(__dirname, 'backups');
    this.maxBackups = 30; // Manter últimos 30 backups
    
    // Configuração AWS S3 (opcional)
    if (process.env.AWS_ACCESS_KEY_ID) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.s3Bucket = process.env.AWS_S3_BUCKET || 'goldeouro-backups';
    }
    
    this.initializeBackupDirectory();
  }
  
  async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('✅ Backup directory initialized');
    } catch (error) {
      console.error('❌ Failed to initialize backup directory:', error);
    }
  }
  
  // =====================================================
  // BACKUP COMPLETO DO SISTEMA
  // =====================================================
  
  async performFullBackup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    
    try {
      console.log(`🔄 Starting ${type} backup: ${backupId}`);
      
      // 1. Backup do banco de dados
      const databaseBackup = await this.backupDatabase(backupId);
      
      // 2. Backup dos arquivos de configuração
      const configBackup = await this.backupConfiguration(backupId);
      
      // 3. Backup dos logs
      const logsBackup = await this.backupLogs(backupId);
      
      // 4. Backup das métricas
      const metricsBackup = await this.backupMetrics(backupId);
      
      // 5. Criar arquivo de manifesto
      const manifest = await this.createManifest(backupId, {
        database: databaseBackup,
        config: configBackup,
        logs: logsBackup,
        metrics: metricsBackup
      });
      
      // 6. Compactar backup
      const compressedBackup = await this.compressBackup(backupId);
      
      // 7. Upload para cloud (se configurado)
      if (this.s3) {
        await this.uploadToS3(compressedBackup, backupId);
      }
      
      // 8. Limpar backups antigos
      await this.cleanupOldBackups();
      
      console.log(`✅ ${type} backup completed: ${backupId}`);
      
      return {
        success: true,
        backupId,
        type,
        timestamp: new Date().toISOString(),
        size: await this.getBackupSize(compressedBackup),
        components: {
          database: databaseBackup,
          config: configBackup,
          logs: logsBackup,
          metrics: metricsBackup
        }
      };
      
    } catch (error) {
      console.error(`❌ Backup failed: ${backupId}`, error);
      throw error;
    }
  }
  
  // =====================================================
  // BACKUP DO BANCO DE DADOS
  // =====================================================
  
  async backupDatabase(backupId) {
    try {
      console.log('📊 Backing up database...');
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.1.1',
        tables: {}
      };
      
      // Lista de tabelas para backup
      const tables = [
        'usuarios',
        'jogos', 
        'pagamentos_pix',
        'saques',
        'metricas_globais',
        'chutes',
        'lotes'
      ];
      
      // Backup de cada tabela
      for (const tableName of tables) {
        try {
          const { data, error } = await this.supabase
            .from(tableName)
            .select('*');
          
          if (error) {
            console.warn(`⚠️ Failed to backup table ${tableName}:`, error.message);
            backupData.tables[tableName] = { error: error.message };
          } else {
            backupData.tables[tableName] = data || [];
            console.log(`✅ Table ${tableName}: ${data?.length || 0} records`);
          }
        } catch (error) {
          console.warn(`⚠️ Error backing up table ${tableName}:`, error.message);
          backupData.tables[tableName] = { error: error.message };
        }
      }
      
      // Salvar backup do banco
      const dbBackupPath = path.join(this.backupDir, `${backupId}_database.json`);
      await fs.writeFile(dbBackupPath, JSON.stringify(backupData, null, 2));
      
      return {
        path: dbBackupPath,
        records: Object.values(backupData.tables).reduce((total, table) => 
          Array.isArray(table) ? total + table.length : total, 0
        ),
        tables: Object.keys(backupData.tables).length
      };
      
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // BACKUP DE CONFIGURAÇÕES
  // =====================================================
  
  async backupConfiguration(backupId) {
    try {
      console.log('⚙️ Backing up configuration...');
      
      const configFiles = [
        'package.json',
        'package-lock.json',
        'fly.toml',
        'Dockerfile',
        '.env.example',
        'server-fly.js'
      ];
      
      const configBackup = {
        timestamp: new Date().toISOString(),
        files: {}
      };
      
      for (const file of configFiles) {
        try {
          const filePath = path.join(__dirname, file);
          const content = await fs.readFile(filePath, 'utf8');
          configBackup.files[file] = content;
        } catch (error) {
          console.warn(`⚠️ Failed to backup config file ${file}:`, error.message);
          configBackup.files[file] = { error: error.message };
        }
      }
      
      // Salvar backup de configuração
      const configBackupPath = path.join(this.backupDir, `${backupId}_config.json`);
      await fs.writeFile(configBackupPath, JSON.stringify(configBackup, null, 2));
      
      return {
        path: configBackupPath,
        files: Object.keys(configBackup.files).length
      };
      
    } catch (error) {
      console.error('❌ Configuration backup failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // BACKUP DE LOGS
  // =====================================================
  
  async backupLogs(backupId) {
    try {
      console.log('📝 Backing up logs...');
      
      const logsDir = path.join(__dirname, 'logs');
      const logsBackupPath = path.join(this.backupDir, `${backupId}_logs`);
      
      try {
        await fs.mkdir(logsBackupPath, { recursive: true });
        
        // Copiar arquivos de log
        const logFiles = await fs.readdir(logsDir);
        let copiedFiles = 0;
        
        for (const file of logFiles) {
          if (file.endsWith('.log')) {
            try {
              const sourcePath = path.join(logsDir, file);
              const destPath = path.join(logsBackupPath, file);
              await fs.copyFile(sourcePath, destPath);
              copiedFiles++;
            } catch (error) {
              console.warn(`⚠️ Failed to backup log file ${file}:`, error.message);
            }
          }
        }
        
        return {
          path: logsBackupPath,
          files: copiedFiles
        };
        
      } catch (error) {
        console.warn('⚠️ Logs directory not found, skipping logs backup');
        return {
          path: null,
          files: 0,
          error: 'Logs directory not found'
        };
      }
      
    } catch (error) {
      console.error('❌ Logs backup failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // BACKUP DE MÉTRICAS
  // =====================================================
  
  async backupMetrics(backupId) {
    try {
      console.log('📊 Backing up metrics...');
      
      const metricsBackup = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'not configured',
          MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'configured' : 'not configured'
        }
      };
      
      // Salvar backup de métricas
      const metricsBackupPath = path.join(this.backupDir, `${backupId}_metrics.json`);
      await fs.writeFile(metricsBackupPath, JSON.stringify(metricsBackup, null, 2));
      
      return {
        path: metricsBackupPath,
        system: metricsBackup.system,
        environment: Object.keys(metricsBackup.environment).length
      };
      
    } catch (error) {
      console.error('❌ Metrics backup failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // CRIAÇÃO DE MANIFESTO
  // =====================================================
  
  async createManifest(backupId, components) {
    try {
      const manifest = {
        backupId,
        timestamp: new Date().toISOString(),
        version: '1.1.1',
        type: 'full_backup',
        components: {
          database: {
            path: components.database.path,
            records: components.database.records,
            tables: components.database.tables
          },
          config: {
            path: components.config.path,
            files: components.config.files
          },
          logs: {
            path: components.logs.path,
            files: components.logs.files
          },
          metrics: {
            path: components.metrics.path,
            system: components.metrics.system,
            environment: components.metrics.environment
          }
        },
        checksum: await this.calculateChecksum(components)
      };
      
      const manifestPath = path.join(this.backupDir, `${backupId}_manifest.json`);
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      return manifestPath;
      
    } catch (error) {
      console.error('❌ Manifest creation failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // COMPRESSÃO DO BACKUP
  // =====================================================
  
  async compressBackup(backupId) {
    try {
      console.log('🗜️ Compressing backup...');
      
      const backupFolder = path.join(this.backupDir, backupId);
      const compressedFile = path.join(this.backupDir, `${backupId}.tar.gz`);
      
      // Criar diretório do backup
      await fs.mkdir(backupFolder, { recursive: true });
      
      // Mover arquivos para o diretório do backup
      const files = await fs.readdir(this.backupDir);
      for (const file of files) {
        if (file.startsWith(backupId) && file !== backupId) {
          const sourcePath = path.join(this.backupDir, file);
          const destPath = path.join(backupFolder, file);
          await fs.rename(sourcePath, destPath);
        }
      }
      
      // Comprimir usando tar
      const command = `tar -czf "${compressedFile}" -C "${this.backupDir}" "${backupId}"`;
      await execAsync(command);
      
      // Remover diretório temporário
      await fs.rmdir(backupFolder, { recursive: true });
      
      console.log(`✅ Backup compressed: ${compressedFile}`);
      return compressedFile;
      
    } catch (error) {
      console.error('❌ Backup compression failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // UPLOAD PARA S3
  // =====================================================
  
  async uploadToS3(backupFile, backupId) {
    if (!this.s3) {
      console.log('⚠️ S3 not configured, skipping cloud upload');
      return;
    }
    
    try {
      console.log('☁️ Uploading to S3...');
      
      const fileContent = await fs.readFile(backupFile);
      const key = `backups/${backupId}.tar.gz`;
      
      const params = {
        Bucket: this.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/gzip',
        Metadata: {
          'backup-id': backupId,
          'timestamp': new Date().toISOString(),
          'version': '1.1.1'
        }
      };
      
      await this.s3.upload(params).promise();
      console.log(`✅ Uploaded to S3: s3://${this.s3Bucket}/${key}`);
      
      return {
        bucket: this.s3Bucket,
        key: key,
        url: `s3://${this.s3Bucket}/${key}`
      };
      
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // LIMPEZA DE BACKUPS ANTIGOS
  // =====================================================
  
  async cleanupOldBackups() {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.endsWith('.tar.gz'))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          return {
            name: f,
            path: filePath,
            stats: fs.stat(filePath)
          };
        });
      
      // Aguardar stats de todos os arquivos
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => ({
          ...file,
          stats: await file.stats
        }))
      );
      
      // Ordenar por data de criação (mais recente primeiro)
      filesWithStats.sort((a, b) => b.stats.birthtime - a.stats.birthtime);
      
      // Manter apenas os últimos N backups
      if (filesWithStats.length > this.maxBackups) {
        const filesToDelete = filesWithStats.slice(this.maxBackups);
        
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
            console.log(`🗑️ Deleted old backup: ${file.name}`);
          } catch (error) {
            console.warn(`⚠️ Failed to delete ${file.name}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Cleanup completed. Kept ${Math.min(filesWithStats.length, this.maxBackups)} backups`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
  
  // =====================================================
  // RESTAURAÇÃO DE BACKUP
  // =====================================================
  
  async restoreBackup(backupId) {
    try {
      console.log(`🔄 Restoring backup: ${backupId}`);
      
      // Verificar se backup existe
      const backupFile = path.join(this.backupDir, `${backupId}.tar.gz`);
      const manifestFile = path.join(this.backupDir, `${backupId}_manifest.json`);
      
      try {
        await fs.access(backupFile);
        await fs.access(manifestFile);
      } catch (error) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Ler manifesto
      const manifestContent = await fs.readFile(manifestFile, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Extrair backup
      const extractCommand = `tar -xzf "${backupFile}" -C "${this.backupDir}"`;
      await execAsync(extractCommand);
      
      // Restaurar banco de dados
      await this.restoreDatabase(backupId, manifest);
      
      // Restaurar configurações
      await this.restoreConfiguration(backupId, manifest);
      
      console.log(`✅ Backup restored: ${backupId}`);
      
      return {
        success: true,
        backupId,
        timestamp: manifest.timestamp,
        components: manifest.components
      };
      
    } catch (error) {
      console.error(`❌ Restore failed: ${backupId}`, error);
      throw error;
    }
  }
  
  async restoreDatabase(backupId, manifest) {
    try {
      console.log('📊 Restoring database...');
      
      const dbBackupPath = path.join(this.backupDir, backupId, `${backupId}_database.json`);
      const dbBackupContent = await fs.readFile(dbBackupPath, 'utf8');
      const dbBackup = JSON.parse(dbBackupContent);
      
      // Restaurar cada tabela
      for (const [tableName, data] of Object.entries(dbBackup.tables)) {
        if (Array.isArray(data) && data.length > 0) {
          try {
            // Limpar tabela atual
            await this.supabase.from(tableName).delete().neq('id', '');
            
            // Inserir dados do backup
            const { error } = await this.supabase
              .from(tableName)
              .insert(data);
            
            if (error) {
              console.warn(`⚠️ Failed to restore table ${tableName}:`, error.message);
            } else {
              console.log(`✅ Table ${tableName} restored: ${data.length} records`);
            }
          } catch (error) {
            console.warn(`⚠️ Error restoring table ${tableName}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }
  
  async restoreConfiguration(backupId, manifest) {
    try {
      console.log('⚙️ Restoring configuration...');
      
      const configBackupPath = path.join(this.backupDir, backupId, `${backupId}_config.json`);
      const configBackupContent = await fs.readFile(configBackupPath, 'utf8');
      const configBackup = JSON.parse(configBackupContent);
      
      // Restaurar arquivos de configuração
      for (const [fileName, content] of Object.entries(configBackup.files)) {
        if (typeof content === 'string') {
          try {
            const filePath = path.join(__dirname, fileName);
            await fs.writeFile(filePath, content);
            console.log(`✅ Config file restored: ${fileName}`);
          } catch (error) {
            console.warn(`⚠️ Failed to restore config file ${fileName}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Configuration restore failed:', error);
      throw error;
    }
  }
  
  // =====================================================
  // UTILITÁRIOS
  // =====================================================
  
  async getBackupSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
  
  async calculateChecksum(components) {
    // Implementar cálculo de checksum para verificação de integridade
    return 'checksum_placeholder';
  }
  
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.endsWith('.tar.gz'))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          return {
            name: f,
            path: filePath,
            stats: fs.stat(filePath)
          };
        });
      
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => ({
          ...file,
          stats: await file.stats
        }))
      );
      
      return filesWithStats
        .sort((a, b) => b.stats.birthtime - a.stats.birthtime)
        .map(file => ({
          name: file.name,
          size: file.stats.size,
          created: file.stats.birthtime,
          modified: file.stats.mtime
        }));
      
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }
  
  // =====================================================
  // AGENDAMENTO AUTOMÁTICO
  // =====================================================
  
  startScheduledBackups() {
    console.log('⏰ Starting scheduled backups...');
    
    // Backup diário às 2:00 AM
    cron.schedule('0 2 * * *', () => {
      this.performFullBackup('daily').catch(error => {
        console.error('❌ Scheduled daily backup failed:', error);
      });
    });
    
    // Backup semanal aos domingos às 3:00 AM
    cron.schedule('0 3 * * 0', () => {
      this.performFullBackup('weekly').catch(error => {
        console.error('❌ Scheduled weekly backup failed:', error);
      });
    });
    
    // Backup mensal no dia 1 às 4:00 AM
    cron.schedule('0 4 1 * *', () => {
      this.performFullBackup('monthly').catch(error => {
        console.error('❌ Scheduled monthly backup failed:', error);
      });
    });
    
    console.log('✅ Scheduled backups configured');
  }
}

module.exports = GolDeOuroBackupSystem;
