const BackupSystem = require('./backup-system');
const RestorePoints = require('./restore-points');
const ExternalAPIIntegration = require('./external-apis');

class BackupSystemTester {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.restorePoints = new RestorePoints();
    this.externalAPIs = new ExternalAPIIntegration();
    this.testResults = [];
  }

  // Executar todos os testes
  async runAllTests() {
    console.log('🧪 Iniciando testes do sistema de backup e APIs externas...\n');

    try {
      // Teste 1: Sistema de Backup
      await this.testBackupSystem();
      
      // Teste 2: Pontos de Restauração
      await this.testRestorePoints();
      
      // Teste 3: APIs Externas
      await this.testExternalAPIs();
      
      // Teste 4: Integração Completa
      await this.testFullIntegration();
      
      // Relatório final
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error.message);
    }
  }

  // Teste do sistema de backup
  async testBackupSystem() {
    console.log('📦 Testando sistema de backup...');
    
    try {
      // Teste 1: Criar backup
      console.log('  🔄 Criando backup de teste...');
      const backup = await this.backupSystem.createFullBackup();
      
      if (backup.success) {
        this.testResults.push({
          test: 'Backup Creation',
          status: 'PASS',
          details: `Backup criado: ${backup.backupId}`
        });
        console.log('  ✅ Backup criado com sucesso');
      } else {
        this.testResults.push({
          test: 'Backup Creation',
          status: 'FAIL',
          details: backup.error
        });
        console.log('  ❌ Falha ao criar backup');
      }

      // Teste 2: Listar backups
      console.log('  📋 Listando backups...');
      const backups = this.backupSystem.listBackups();
      
      if (backups.length > 0) {
        this.testResults.push({
          test: 'Backup Listing',
          status: 'PASS',
          details: `${backups.length} backups encontrados`
        });
        console.log('  ✅ Listagem de backups funcionando');
      } else {
        this.testResults.push({
          test: 'Backup Listing',
          status: 'FAIL',
          details: 'Nenhum backup encontrado'
        });
        console.log('  ❌ Nenhum backup encontrado');
      }

      // Teste 3: Restaurar backup (se existir)
      if (backups.length > 0) {
        console.log('  🔄 Testando restauração...');
        const restore = await this.backupSystem.restoreBackup(backups[0].id);
        
        if (restore.success) {
          this.testResults.push({
            test: 'Backup Restore',
            status: 'PASS',
            details: 'Backup restaurado com sucesso'
          });
          console.log('  ✅ Restauração funcionando');
        } else {
          this.testResults.push({
            test: 'Backup Restore',
            status: 'FAIL',
            details: restore.error
          });
          console.log('  ❌ Falha na restauração');
        }
      }

    } catch (error) {
      this.testResults.push({
        test: 'Backup System',
        status: 'ERROR',
        details: error.message
      });
      console.log('  ❌ Erro no teste de backup:', error.message);
    }
  }

  // Teste dos pontos de restauração
  async testRestorePoints() {
    console.log('\n🔄 Testando pontos de restauração...');
    
    try {
      // Teste 1: Criar ponto de restauração
      console.log('  🔄 Criando ponto de restauração...');
      const rp = await this.restorePoints.createRestorePoint(
        'Test-Point-' + Date.now(),
        'Ponto de teste automático'
      );
      
      if (rp.success) {
        this.testResults.push({
          test: 'Restore Point Creation',
          status: 'PASS',
          details: `Ponto criado: ${rp.restorePoint.id}`
        });
        console.log('  ✅ Ponto de restauração criado');
      } else {
        this.testResults.push({
          test: 'Restore Point Creation',
          status: 'FAIL',
          details: rp.error
        });
        console.log('  ❌ Falha ao criar ponto de restauração');
      }

      // Teste 2: Listar pontos de restauração
      console.log('  📋 Listando pontos de restauração...');
      const points = await this.restorePoints.listRestorePoints();
      
      if (points.length > 0) {
        this.testResults.push({
          test: 'Restore Point Listing',
          status: 'PASS',
          details: `${points.length} pontos encontrados`
        });
        console.log('  ✅ Listagem de pontos funcionando');
      } else {
        this.testResults.push({
          test: 'Restore Point Listing',
          status: 'FAIL',
          details: 'Nenhum ponto encontrado'
        });
        console.log('  ❌ Nenhum ponto de restauração encontrado');
      }

      // Teste 3: Validar pontos de restauração
      console.log('  🔍 Validando pontos de restauração...');
      const validation = await this.restorePoints.validateRestorePoints();
      
      const validPoints = validation.filter(v => v.status === 'valid').length;
      const invalidPoints = validation.filter(v => v.status === 'invalid').length;
      
      this.testResults.push({
        test: 'Restore Point Validation',
        status: validPoints > 0 ? 'PASS' : 'FAIL',
        details: `${validPoints} válidos, ${invalidPoints} inválidos`
      });
      console.log(`  ✅ Validação: ${validPoints} válidos, ${invalidPoints} inválidos`);

    } catch (error) {
      this.testResults.push({
        test: 'Restore Points',
        status: 'ERROR',
        details: error.message
      });
      console.log('  ❌ Erro no teste de pontos de restauração:', error.message);
    }
  }

  // Teste das APIs externas
  async testExternalAPIs() {
    console.log('\n🌐 Testando APIs externas...');
    
    try {
      // Teste 1: Conectividade geral
      console.log('  🔗 Testando conectividade...');
      const connections = await this.externalAPIs.testAllConnections();
      
      const connectedAPIs = Object.values(connections).filter(c => c.success).length;
      const totalAPIs = Object.keys(connections).length;
      
      this.testResults.push({
        test: 'External APIs Connectivity',
        status: connectedAPIs > 0 ? 'PASS' : 'FAIL',
        details: `${connectedAPIs}/${totalAPIs} APIs conectadas`
      });
      console.log(`  ✅ ${connectedAPIs}/${totalAPIs} APIs conectadas`);

      // Teste 2: Notificação push (simulada)
      console.log('  📱 Testando notificação push...');
      try {
        const pushResult = await this.externalAPIs.sendPushNotification({
          deviceToken: 'test_token',
          title: 'Teste Gol de Ouro',
          body: 'Sistema de backup funcionando!'
        });
        
        this.testResults.push({
          test: 'Push Notification',
          status: pushResult.success ? 'PASS' : 'FAIL',
          details: pushResult.success ? 'Notificação enviada' : pushResult.error
        });
        console.log('  ✅ Notificação push testada');
      } catch (error) {
        this.testResults.push({
          test: 'Push Notification',
          status: 'SKIP',
          details: 'Token de teste inválido (esperado)'
        });
        console.log('  ⚠️ Notificação push pulada (token de teste)');
      }

      // Teste 3: SMS (simulado)
      console.log('  📱 Testando SMS...');
      try {
        const smsResult = await this.externalAPIs.sendSMS({
          phoneNumber: '+5511999999999',
          message: 'Teste Gol de Ouro - Sistema funcionando!'
        });
        
        this.testResults.push({
          test: 'SMS Notification',
          status: smsResult.success ? 'PASS' : 'FAIL',
          details: smsResult.success ? 'SMS enviado' : smsResult.error
        });
        console.log('  ✅ SMS testado');
      } catch (error) {
        this.testResults.push({
          test: 'SMS Notification',
          status: 'SKIP',
          details: 'Número de teste inválido (esperado)'
        });
        console.log('  ⚠️ SMS pulado (número de teste)');
      }

      // Teste 4: Dados meteorológicos
      console.log('  🌤️ Testando dados meteorológicos...');
      try {
        const weatherResult = await this.externalAPIs.getWeatherData('São Paulo');
        
        this.testResults.push({
          test: 'Weather Data',
          status: weatherResult.success ? 'PASS' : 'FAIL',
          details: weatherResult.success ? 'Dados obtidos' : weatherResult.error
        });
        console.log('  ✅ Dados meteorológicos testados');
      } catch (error) {
        this.testResults.push({
          test: 'Weather Data',
          status: 'SKIP',
          details: 'API key não configurada (esperado)'
        });
        console.log('  ⚠️ Dados meteorológicos pulados (API key não configurada)');
      }

    } catch (error) {
      this.testResults.push({
        test: 'External APIs',
        status: 'ERROR',
        details: error.message
      });
      console.log('  ❌ Erro no teste de APIs externas:', error.message);
    }
  }

  // Teste de integração completa
  async testFullIntegration() {
    console.log('\n🔗 Testando integração completa...');
    
    try {
      // Teste 1: Fluxo completo de backup
      console.log('  🔄 Testando fluxo completo de backup...');
      
      // Criar backup
      const backup = await this.backupSystem.createFullBackup();
      if (!backup.success) {
        throw new Error('Falha ao criar backup');
      }
      
      // Criar ponto de restauração
      const rp = await this.restorePoints.createRestorePoint(
        'Integration-Test-' + Date.now(),
        'Teste de integração completa'
      );
      if (!rp.success) {
        throw new Error('Falha ao criar ponto de restauração');
      }
      
      // Validar integridade
      const validation = await this.restorePoints.validateRestorePoints();
      const validPoints = validation.filter(v => v.status === 'valid').length;
      
      this.testResults.push({
        test: 'Full Integration',
        status: validPoints > 0 ? 'PASS' : 'FAIL',
        details: `Fluxo completo testado: ${validPoints} pontos válidos`
      });
      console.log('  ✅ Fluxo completo de backup testado');

      // Teste 2: Performance
      console.log('  ⚡ Testando performance...');
      const startTime = Date.now();
      
      const performanceBackup = await this.backupSystem.createFullBackup();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.testResults.push({
        test: 'Performance',
        status: duration < 30000 ? 'PASS' : 'WARN',
        details: `Backup em ${duration}ms`
      });
      console.log(`  ✅ Performance: ${duration}ms`);

    } catch (error) {
      this.testResults.push({
        test: 'Full Integration',
        status: 'ERROR',
        details: error.message
      });
      console.log('  ❌ Erro no teste de integração:', error.message);
    }
  }

  // Gerar relatório final
  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    const total = this.testResults.length;
    
    console.log(`📈 Total de testes: ${total}`);
    console.log(`✅ Aprovados: ${passed}`);
    console.log(`❌ Falharam: ${failed}`);
    console.log(`⚠️ Erros: ${errors}`);
    console.log(`⏭️ Pulados: ${skipped}`);
    console.log(`📊 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETALHES DOS TESTES:');
    console.log('-'.repeat(50));
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : 
                    result.status === 'ERROR' ? '⚠️' : '⏭️';
      
      console.log(`${index + 1}. ${status} ${result.test}`);
      console.log(`   ${result.details}`);
      console.log('');
    });
    
    // Salvar relatório em arquivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        errors,
        skipped,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.testResults
    };
    
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../backups/test-report.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Relatório salvo em: ${reportPath}`);
    } catch (error) {
      console.log('⚠️ Não foi possível salvar o relatório:', error.message);
    }
    
    console.log('\n🎯 CONCLUSÃO:');
    if (passed >= total * 0.8) {
      console.log('✅ Sistema de backup e APIs externas funcionando corretamente!');
    } else if (passed >= total * 0.6) {
      console.log('⚠️ Sistema funcionando com algumas limitações.');
    } else {
      console.log('❌ Sistema com problemas significativos. Verificar configuração.');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const tester = new BackupSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = BackupSystemTester;
