// 💾 SISTEMA DE BACKUP AUTOMÁTICO - GOL DE OURO
// Data: 16 de Outubro de 2025
// Objetivo: Backup automático e seguro do sistema

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SistemaBackup {
  constructor() {
    this.config = {
      backupDir: path.join(__dirname, '..', 'backups'),
      maxBackups: 10,
      interval: 24 * 60 * 60 * 1000, // 24 horas
      filesToBackup: [
        'server-fly.js',
        'server.js',
        'package.json',
        'Dockerfile',
        '.env',
        'goldeouro-player',
        'database',
        'services',
        'routes',
        'controllers'
      ],
      excludePatterns: [
        'node_modules',
        '.git',
        'BACKUP-*',
        'backups',
        'logs',
        '*.log'
      ]
    };
    
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  generateBackupName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + 
                     now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `BACKUP-AUTO-${timestamp}`;
  }

  shouldExclude(filePath) {
    return this.config.excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  async copyFile(src, dest) {
    return new Promise((resolve, reject) => {
      const destDir = path.dirname(dest);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      if (fs.statSync(src).isDirectory()) {
        this.copyDirectory(src, dest)
          .then(resolve)
          .catch(reject);
      } else {
        fs.copyFile(src, dest, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  }

  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (this.shouldExclude(srcPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await this.copyFile(srcPath, destPath);
      }
    }
  }

  async createBackup() {
    const backupName = this.generateBackupName();
    const backupPath = path.join(this.config.backupDir, backupName);
    
    this.log(`💾 [BACKUP] Iniciando backup: ${backupName}`);
    
    try {
      // Criar diretório do backup
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Copiar arquivos
      for (const file of this.config.filesToBackup) {
        const srcPath = path.join(process.cwd(), file);
        
        if (fs.existsSync(srcPath)) {
          const destPath = path.join(backupPath, file);
          await this.copyFile(srcPath, destPath);
          this.log(`✅ [BACKUP] Copiado: ${file}`);
        } else {
          this.log(`⚠️ [BACKUP] Arquivo não encontrado: ${file}`, 'WARN');
        }
      }

      // Criar arquivo de metadados
      const metadata = {
        name: backupName,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        files: this.config.filesToBackup,
        size: await this.getDirectorySize(backupPath)
      };

      fs.writeFileSync(
        path.join(backupPath, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      this.log(`🎉 [BACKUP] Backup criado com sucesso: ${backupName}`);
      
      // Limpar backups antigos
      await this.cleanupOldBackups();
      
      return {
        success: true,
        backupName,
        backupPath,
        metadata
      };

    } catch (error) {
      this.log(`❌ [BACKUP] Erro ao criar backup: ${error.message}`, 'ERROR');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const getSize = (itemPath) => {
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(itemPath);
        files.forEach(file => {
          getSize(path.join(itemPath, file));
        });
      } else {
        totalSize += stats.size;
      }
    };
    
    getSize(dirPath);
    return totalSize;
  }

  async cleanupOldBackups() {
    try {
      const backups = fs.readdirSync(this.config.backupDir)
        .filter(item => item.startsWith('BACKUP-AUTO-'))
        .map(item => ({
          name: item,
          path: path.join(this.config.backupDir, item),
          stats: fs.statSync(path.join(this.config.backupDir, item))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      if (backups.length > this.config.maxBackups) {
        const toDelete = backups.slice(this.config.maxBackups);
        
        for (const backup of toDelete) {
          fs.rmSync(backup.path, { recursive: true, force: true });
          this.log(`🗑️ [BACKUP] Backup antigo removido: ${backup.name}`);
        }
      }
    } catch (error) {
      this.log(`⚠️ [BACKUP] Erro ao limpar backups antigos: ${error.message}`, 'WARN');
    }
  }

  async restoreBackup(backupName) {
    const backupPath = path.join(this.config.backupDir, backupName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup não encontrado: ${backupName}`);
    }

    this.log(`🔄 [RESTORE] Iniciando restauração: ${backupName}`);

    try {
      // Ler metadados
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      // Restaurar arquivos
      for (const file of metadata.files) {
        const srcPath = path.join(backupPath, file);
        const destPath = path.join(process.cwd(), file);

        if (fs.existsSync(srcPath)) {
          if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
          }
          
          await this.copyFile(srcPath, destPath);
          this.log(`✅ [RESTORE] Restaurado: ${file}`);
        }
      }

      this.log(`🎉 [RESTORE] Restauração concluída: ${backupName}`);
      return { success: true, metadata };

    } catch (error) {
      this.log(`❌ [RESTORE] Erro na restauração: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async listBackups() {
    try {
      const backups = fs.readdirSync(this.config.backupDir)
        .filter(item => item.startsWith('BACKUP-AUTO-'))
        .map(item => {
          const backupPath = path.join(this.config.backupDir, item);
          const metadataPath = path.join(backupPath, 'backup-metadata.json');
          
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            return metadata;
          }
          
          return {
            name: item,
            timestamp: fs.statSync(backupPath).mtime.toISOString(),
            version: 'unknown'
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return backups;
    } catch (error) {
      this.log(`❌ [BACKUP] Erro ao listar backups: ${error.message}`, 'ERROR');
      return [];
    }
  }

  async start() {
    this.log('🚀 [BACKUP] Sistema de backup automático iniciado');
    
    // Backup inicial
    await this.createBackup();
    
    // Backups periódicos
    setInterval(async () => {
      await this.createBackup();
    }, this.config.interval);
  }
}

// Inicializar sistema de backup
const backup = new SistemaBackup();
backup.start().catch(console.error);

module.exports = SistemaBackup;
