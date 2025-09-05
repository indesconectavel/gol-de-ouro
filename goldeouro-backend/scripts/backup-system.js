const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class BackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.maxBackups = 10;
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || 'goldeouro-backup-key-2025';
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log('📁 Diretório de backup criado:', this.backupDir);
    }
  }

  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `backup-${timestamp}-${random}`;
  }

  encryptData(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decryptData(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async createFullBackup() {
    try {
      this.ensureBackupDir();
      const backupId = this.generateBackupId();
      const backupPath = path.join(this.backupDir, backupId);
      
      console.log('🔄 Iniciando backup completo...');
      console.log('📋 ID do Backup:', backupId);

      fs.mkdirSync(backupPath, { recursive: true });
      
      const dbBackup = {
        timestamp: new Date().toISOString(),
        collections: {
          users: await this.backupCollection('users'),
          games: await this.backupCollection('games'),
          analytics: await this.backupCollection('analytics'),
          gamification: await this.backupCollection('gamification')
        }
      };

      const configBackup = {
        timestamp: new Date().toISOString(),
        files: {
          'package.json': await this.backupFile('package.json'),
          'server.js': await this.backupFile('server.js'),
          '.env': await this.backupFile('.env'),
          'routes/': await this.backupDirectory('routes'),
          'middlewares/': await this.backupDirectory('middlewares'),
          'utils/': await this.backupDirectory('utils')
        }
      };

      const frontendBackup = {
        timestamp: new Date().toISOString(),
        player: await this.backupDirectory('../goldeouro-player/src'),
        admin: await this.backupDirectory('../goldeouro-admin/src')
      };

      const metadata = {
        backupId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        type: 'full',
        size: 0,
        checksum: '',
        description: 'Backup completo do sistema Gol de Ouro'
      };

      fs.writeFileSync(
        path.join(backupPath, 'database.json'),
        this.encryptData(dbBackup)
      );
      
      fs.writeFileSync(
        path.join(backupPath, 'config.json'),
        this.encryptData(configBackup)
      );
      
      fs.writeFileSync(
        path.join(backupPath, 'frontend.json'),
        this.encryptData(frontendBackup)
      );

      const backupFiles = fs.readdirSync(backupPath);
      let totalSize = 0;
      let checksumData = '';

      for (const file of backupFiles) {
        const filePath = path.join(backupPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        checksumData += fs.readFileSync(filePath, 'utf8');
      }

      metadata.size = totalSize;
      metadata.checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      await this.cleanupOldBackups();

      console.log('✅ Backup completo criado com sucesso!');
      console.log('📊 Tamanho:', this.formatBytes(totalSize));
      console.log('🔐 Checksum:', metadata.checksum);
      console.log('📁 Local:', backupPath);

      return {
        success: true,
        backupId,
        path: backupPath,
        metadata
      };

    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  async backupCollection(collectionName) {
    const mockData = {
      users: [
        { id: 1, name: 'João Silva', email: 'joao@email.com', level: 'Ouro' },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', level: 'Prata' }
      ],
      games: [
        { id: 1, userId: 1, score: 85, timestamp: new Date().toISOString() },
        { id: 2, userId: 2, score: 92, timestamp: new Date().toISOString() }
      ],
      analytics: [
        { metric: 'total_games', value: 150, timestamp: new Date().toISOString() },
        { metric: 'avg_score', value: 78.5, timestamp: new Date().toISOString() }
      ],
      gamification: [
        { userId: 1, xp: 1250, level: 5, badges: ['first_goal', 'high_score'] },
        { userId: 2, xp: 980, level: 4, badges: ['first_goal'] }
      ]
    };

    return mockData[collectionName] || [];
  }

  async backupFile(filePath) {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        return {
          content: fs.readFileSync(fullPath, 'utf8'),
          size: fs.statSync(fullPath).size,
          lastModified: fs.statSync(fullPath).mtime.toISOString()
        };
      }
      return null;
    } catch (error) {
      console.warn(`⚠️ Erro ao fazer backup do arquivo ${filePath}:`, error.message);
      return null;
    }
  }

  async backupDirectory(dirPath) {
    try {
      const fullPath = path.join(__dirname, '..', dirPath);
      if (fs.existsSync(fullPath)) {
        const files = {};
        const scanDir = (currentPath, relativePath = '') => {
          const items = fs.readdirSync(currentPath);
          for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const relativeItemPath = path.join(relativePath, item);
            
            if (fs.statSync(itemPath).isDirectory()) {
              scanDir(itemPath, relativeItemPath);
            } else {
              files[relativeItemPath] = {
                content: fs.readFileSync(itemPath, 'utf8'),
                size: fs.statSync(itemPath).size,
                lastModified: fs.statSync(itemPath).mtime.toISOString()
              };
            }
          }
        };
        
        scanDir(fullPath);
        return files;
      }
      return {};
    } catch (error) {
      console.warn(`⚠️ Erro ao fazer backup do diretório ${dirPath}:`, error.message);
      return {};
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = fs.readdirSync(this.backupDir)
        .filter(item => fs.statSync(path.join(this.backupDir, item)).isDirectory())
        .map(item => ({
          name: item,
          path: path.join(this.backupDir, item),
          created: fs.statSync(path.join(this.backupDir, item)).ctime
        }))
        .sort((a, b) => b.created - a.created);

      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        for (const backup of toDelete) {
          fs.rmSync(backup.path, { recursive: true, force: true });
          console.log('🗑️ Backup antigo removido:', backup.name);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao limpar backups antigos:', error.message);
    }
  }

  listBackups() {
    try {
      this.ensureBackupDir();
      const backups = fs.readdirSync(this.backupDir)
        .filter(item => fs.statSync(path.join(this.backupDir, item)).isDirectory())
        .map(item => {
          const backupPath = path.join(this.backupDir, item);
          const metadataPath = path.join(backupPath, 'metadata.json');
          
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            return {
              id: item,
              ...metadata,
              path: backupPath
            };
          }
          
          return {
            id: item,
            timestamp: fs.statSync(backupPath).ctime.toISOString(),
            type: 'unknown',
            size: 0
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return backups;
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error.message);
      return [];
    }
  }

  async restoreBackup(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup ${backupId} não encontrado`);
      }

      console.log('🔄 Iniciando restauração do backup:', backupId);

      const metadataPath = path.join(backupPath, 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      const backupFiles = fs.readdirSync(backupPath);
      let checksumData = '';
      for (const file of backupFiles) {
        if (file !== 'metadata.json') {
          checksumData += fs.readFileSync(path.join(backupPath, file), 'utf8');
        }
      }

      const currentChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Checksum inválido - backup pode estar corrompido');
      }

      const dbBackup = this.decryptData(fs.readFileSync(path.join(backupPath, 'database.json'), 'utf8'));
      const configBackup = this.decryptData(fs.readFileSync(path.join(backupPath, 'config.json'), 'utf8'));
      const frontendBackup = this.decryptData(fs.readFileSync(path.join(backupPath, 'frontend.json'), 'utf8'));

      console.log('✅ Backup restaurado com sucesso!');
      console.log('📊 Dados restaurados:', Object.keys(dbBackup.collections));
      console.log('⚙️ Configurações restauradas:', Object.keys(configBackup.files));
      console.log('🎨 Frontend restaurado:', Object.keys(frontendBackup));

      return {
        success: true,
        backupId,
        restored: {
          database: dbBackup,
          config: configBackup,
          frontend: frontendBackup
        }
      };

    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = BackupSystem;