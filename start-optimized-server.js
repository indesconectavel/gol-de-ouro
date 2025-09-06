#!/usr/bin/env node

// Script para iniciar servidor otimizado com monitoramento
const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 INICIANDO SERVIDOR OTIMIZADO COM MONITORAMENTO');
console.log('================================================\n');

// Função para monitorar memória
async function monitorMemory() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    const data = response.data;
    
    const memUsage = process.memoryUsage();
    const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    console.log(`📊 [${new Date().toLocaleTimeString()}] Memória: ${heapPercent.toFixed(2)}% | RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    
    if (heapPercent > 85) {
      console.log(`🚨 ALERTA: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
    }
  } catch (error) {
    console.log('⚠️ Servidor ainda não está respondendo...');
  }
}

// Iniciar servidor
console.log('🔧 Iniciando servidor...');
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// Monitorar a cada 15 segundos
const monitorInterval = setInterval(monitorMemory, 15000);

// Monitorar imediatamente após 5 segundos
setTimeout(monitorMemory, 5000);

// Limpeza ao sair
process.on('SIGINT', () => {
  console.log('\n🔄 Parando servidor...');
  clearInterval(monitorInterval);
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Parando servidor...');
  clearInterval(monitorInterval);
  server.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Servidor iniciado com monitoramento ativo');
console.log('📊 Monitoramento a cada 15 segundos');
console.log('🌐 Acesse: http://localhost:3000');
console.log('📋 Pressione Ctrl+C para parar');
