const fs = require('fs');
const path = require('path');
const BackupSystem = require('./backup-system');

class RestorePoints {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.restorePointsFile = path.join(__dirname, '../backups/restore-points.json');
  }

  // Criar ponto de restauração
  async createRestorePoint(name, description = '') {
    try {
      console.log('🔄 Criando ponto de restauração:', name);
      
      // Criar backup completo
      const backup = await this.backupSystem.createFullBackup();
      
      if (!backup.success) {
        throw new Error('Falha ao criar backup para ponto de restauração');
      }

      // Criar ponto de restauração
      const restorePoint = {
        id: `rp-${Date.now()}`,
        name,
        description,
        backupId: backup.backupId,
        createdAt: new Date().toISOString(),
        createdBy: process.env.USER || 'system',
        tags: [],
        status: 'active'
      };

      // Salvar ponto de restauração
      await this.saveRestorePoint(restorePoint);

      console.log('✅ Ponto de restauração criado:', restorePoint.id);
      return {
        success: true,
        restorePoint
      };

    } catch (error) {
      console.error('❌ Erro ao criar ponto de restauração:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Salvar ponto de restauração
  async saveRestorePoint(restorePoint) {
    try {
      const restorePoints = await this.getRestorePoints();
      restorePoints.push(restorePoint);
      
      // Manter apenas os últimos 20 pontos de restauração
      if (restorePoints.length > 20) {
        restorePoints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        restorePoints.splice(20);
      }

      fs.writeFileSync(
        this.restorePointsFile,
        JSON.stringify(restorePoints, null, 2)
      );
    } catch (error) {
      console.error('❌ Erro ao salvar ponto de restauração:', error.message);
    }
  }

  // Obter pontos de restauração
  async getRestorePoints() {
    try {
      if (fs.existsSync(this.restorePointsFile)) {
        return JSON.parse(fs.readFileSync(this.restorePointsFile, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('❌ Erro ao obter pontos de restauração:', error.message);
      return [];
    }
  }

  // Restaurar para um ponto específico
  async restoreToPoint(restorePointId) {
    try {
      const restorePoints = await this.getRestorePoints();
      const restorePoint = restorePoints.find(rp => rp.id === restorePointId);
      
      if (!restorePoint) {
        throw new Error(`Ponto de restauração ${restorePointId} não encontrado`);
      }

      if (restorePoint.status !== 'active') {
        throw new Error(`Ponto de restauração ${restorePointId} não está ativo`);
      }

      console.log('🔄 Restaurando para ponto:', restorePoint.name);
      
      // Restaurar backup
      const restoreResult = await this.backupSystem.restoreBackup(restorePoint.backupId);
      
      if (!restoreResult.success) {
        throw new Error('Falha ao restaurar backup');
      }

      // Atualizar status do ponto de restauração
      restorePoint.lastRestored = new Date().toISOString();
      restorePoint.restoreCount = (restorePoint.restoreCount || 0) + 1;
      
      await this.updateRestorePoint(restorePoint);

      console.log('✅ Restauração concluída com sucesso!');
      return {
        success: true,
        restorePoint,
        restored: restoreResult.restored
      };

    } catch (error) {
      console.error('❌ Erro ao restaurar ponto:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Atualizar ponto de restauração
  async updateRestorePoint(restorePoint) {
    try {
      const restorePoints = await this.getRestorePoints();
      const index = restorePoints.findIndex(rp => rp.id === restorePoint.id);
      
      if (index !== -1) {
        restorePoints[index] = restorePoint;
        fs.writeFileSync(
          this.restorePointsFile,
          JSON.stringify(restorePoints, null, 2)
        );
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar ponto de restauração:', error.message);
    }
  }

  // Listar pontos de restauração
  async listRestorePoints() {
    try {
      const restorePoints = await this.getRestorePoints();
      return restorePoints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('❌ Erro ao listar pontos de restauração:', error.message);
      return [];
    }
  }

  // Deletar ponto de restauração
  async deleteRestorePoint(restorePointId) {
    try {
      const restorePoints = await this.getRestorePoints();
      const restorePoint = restorePoints.find(rp => rp.id === restorePointId);
      
      if (!restorePoint) {
        throw new Error(`Ponto de restauração ${restorePointId} não encontrado`);
      }

      // Deletar backup associado
      const backupPath = path.join(__dirname, '../backups', restorePoint.backupId);
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }

      // Remover ponto de restauração
      const updatedPoints = restorePoints.filter(rp => rp.id !== restorePointId);
      fs.writeFileSync(
        this.restorePointsFile,
        JSON.stringify(updatedPoints, null, 2)
      );

      console.log('✅ Ponto de restauração deletado:', restorePointId);
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao deletar ponto de restauração:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Criar ponto de restauração automático
  async createAutomaticRestorePoint(trigger) {
    const name = `Auto-${trigger}-${new Date().toISOString().split('T')[0]}`;
    const description = `Ponto de restauração automático criado por: ${trigger}`;
    
    return await this.createRestorePoint(name, description);
  }

  // Validar integridade dos pontos de restauração
  async validateRestorePoints() {
    try {
      const restorePoints = await this.getRestorePoints();
      const validationResults = [];

      for (const restorePoint of restorePoints) {
        const backupPath = path.join(__dirname, '../backups', restorePoint.backupId);
        const metadataPath = path.join(backupPath, 'metadata.json');
        
        const validation = {
          id: restorePoint.id,
          name: restorePoint.name,
          status: 'valid',
          issues: []
        };

        if (!fs.existsSync(backupPath)) {
          validation.status = 'invalid';
          validation.issues.push('Backup não encontrado');
        } else if (!fs.existsSync(metadataPath)) {
          validation.status = 'invalid';
          validation.issues.push('Metadata não encontrada');
        } else {
          try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            if (!metadata.checksum) {
              validation.status = 'warning';
              validation.issues.push('Checksum não encontrado');
            }
          } catch (error) {
            validation.status = 'invalid';
            validation.issues.push('Metadata corrompida');
          }
        }

        validationResults.push(validation);
      }

      return validationResults;

    } catch (error) {
      console.error('❌ Erro ao validar pontos de restauração:', error.message);
      return [];
    }
  }
}

module.exports = RestorePoints;
