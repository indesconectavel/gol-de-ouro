// SISTEMA DE MONITORAMENTO - GOL DE OURO v4.5
// ============================================
// Data: 18/10/2025
// Status: SISTEMA DE MONITORAMENTO BÁSICO
// Versão: v4.5-monitoramento

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://goldeouro-backend.fly.dev';
const FRONTEND_URL = 'https://goldeouro.lol';
const ADMIN_URL = 'https://admin.goldeouro.lol';

// Configurações de monitoramento
const MONITOR_CONFIG = {
    interval: 300000, // 5 minutos
    logFile: 'monitoring.log',
    alertThresholds: {
        responseTime: 5000, // 5 segundos
        errorRate: 0.1, // 10%
        uptime: 0.99 // 99%
    }
};

class MonitorGolDeOuro {
    constructor() {
        this.stats = {
            totalChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            startTime: new Date(),
            lastCheck: null,
            services: {
                backend: { status: 'unknown', responseTime: 0, lastCheck: null },
                frontend: { status: 'unknown', responseTime: 0, lastCheck: null },
                admin: { status: 'unknown', responseTime: 0, lastCheck: null }
            }
        };
        
        this.startMonitoring();
    }

    async checkService(name, url, endpoint = '') {
        const startTime = Date.now();
        try {
            const response = await axios.get(`${url}${endpoint}`, { timeout: 10000 });
            const responseTime = Date.now() - startTime;
            
            this.stats.services[name] = {
                status: 'online',
                responseTime: responseTime,
                lastCheck: new Date(),
                statusCode: response.status
            };
            
            this.log(`✅ ${name.toUpperCase()}: OK (${responseTime}ms)`);
            return true;
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.stats.services[name] = {
                status: 'offline',
                responseTime: responseTime,
                lastCheck: new Date(),
                error: error.message
            };
            
            this.log(`❌ ${name.toUpperCase()}: ERRO - ${error.message}`);
            return false;
        }
    }

    async performHealthCheck() {
        this.stats.totalChecks++;
        this.stats.lastCheck = new Date();
        
        this.log(`\n🔍 === HEALTH CHECK #${this.stats.totalChecks} ===`);
        this.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
        
        // Verificar Backend
        const backendOk = await this.checkService('backend', BASE_URL, '/health');
        
        // Verificar Frontend Player
        const frontendOk = await this.checkService('frontend', FRONTEND_URL);
        
        // Verificar Frontend Admin
        const adminOk = await this.checkService('admin', ADMIN_URL);
        
        // Atualizar estatísticas
        if (backendOk && frontendOk && adminOk) {
            this.stats.successfulChecks++;
        } else {
            this.stats.failedChecks++;
        }
        
        // Verificar alertas
        this.checkAlerts();
        
        // Salvar estatísticas
        this.saveStats();
        
        this.log(`📊 Status: ${this.getUptimePercentage()}% uptime`);
    }

    checkAlerts() {
        const errorRate = this.stats.failedChecks / this.stats.totalChecks;
        
        if (errorRate > MONITOR_CONFIG.alertThresholds.errorRate) {
            this.alert(`🚨 ALERTA: Taxa de erro alta (${(errorRate * 100).toFixed(1)}%)`);
        }
        
        // Verificar serviços offline
        Object.entries(this.stats.services).forEach(([name, service]) => {
            if (service.status === 'offline') {
                this.alert(`🚨 ALERTA: ${name.toUpperCase()} está offline`);
            }
            
            if (service.responseTime > MONITOR_CONFIG.alertThresholds.responseTime) {
                this.alert(`🚨 ALERTA: ${name.toUpperCase()} lento (${service.responseTime}ms)`);
            }
        });
    }

    getUptimePercentage() {
        if (this.stats.totalChecks === 0) return 100;
        return ((this.stats.successfulChecks / this.stats.totalChecks) * 100).toFixed(1);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        console.log(logMessage);
        
        // Salvar em arquivo
        fs.appendFileSync(MONITOR_CONFIG.logFile, logMessage + '\n');
    }

    alert(message) {
        const timestamp = new Date().toISOString();
        const alertMessage = `[${timestamp}] 🚨 ALERTA: ${message}`;
        
        console.log(alertMessage);
        
        // Salvar alerta em arquivo separado
        fs.appendFileSync('alerts.log', alertMessage + '\n');
    }

    saveStats() {
        const statsFile = 'monitoring-stats.json';
        fs.writeFileSync(statsFile, JSON.stringify(this.stats, null, 2));
    }

    startMonitoring() {
        this.log('🚀 Sistema de Monitoramento Gol de Ouro iniciado');
        this.log(`⏰ Intervalo: ${MONITOR_CONFIG.interval / 1000} segundos`);
        
        // Primeira verificação imediata
        this.performHealthCheck();
        
        // Verificações periódicas
        setInterval(() => {
            this.performHealthCheck();
        }, MONITOR_CONFIG.interval);
    }

    getStatusReport() {
        const uptime = this.getUptimePercentage();
        const totalTime = Date.now() - this.stats.startTime.getTime();
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        
        return {
            uptime: `${uptime}%`,
            totalChecks: this.stats.totalChecks,
            successfulChecks: this.stats.successfulChecks,
            failedChecks: this.stats.failedChecks,
            runningTime: `${hours}h`,
            services: this.stats.services,
            lastCheck: this.stats.lastCheck
        };
    }
}

// Iniciar monitoramento
const monitor = new MonitorGolDeOuro();

// Exportar para uso em outros módulos
module.exports = MonitorGolDeOuro;

