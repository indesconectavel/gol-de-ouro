#!/usr/bin/env node

// Script de monitoramento de memória
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function monitorMemory() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    const data = response.data;
    
    console.log('📊 STATUS DO SERVIDOR:');
    console.log(`   Status: ${data.status}`);
    console.log(`   Uptime: ${data.uptime}s`);
    console.log(`   Memória: ${data.memory.heapPercent}%`);
    console.log(`   RSS: ${data.memory.rss}MB`);
    console.log(`   Heap: ${data.memory.heapUsed}/${data.memory.heapTotal}MB`);
    
    if (data.memory.heapPercent > 85) {
      console.log('🚨 ALERTA: Uso de memória alto!');
    } else {
      console.log('✅ Uso de memória normal');
    }
  } catch (error) {
    console.error('❌ Erro ao monitorar servidor:', error.message);
  }
}

// Monitorar a cada 30 segundos
setInterval(monitorMemory, 30000);

// Monitorar imediatamente
monitorMemory();

console.log('🔍 Monitoramento de memória iniciado...');
console.log('Pressione Ctrl+C para parar');
