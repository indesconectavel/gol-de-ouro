#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

const ports = [3000, 5174];

console.log('🔪 Matando processos nas portas 3000 e 5174...');

function killPort(port) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
      // Windows
      command = `netstat -ano | findstr :${port}`;
    } else {
      // Unix/Linux/Mac
      command = `lsof -ti:${port}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Porta ${port} já está livre`);
        resolve();
        return;
      }
      
      const pids = stdout.trim().split('\n').filter(pid => pid.trim());
      
      if (pids.length === 0) {
        console.log(`✅ Porta ${port} já está livre`);
        resolve();
        return;
      }
      
      console.log(`🔪 Matando processo(es) na porta ${port}: ${pids.join(', ')}`);
      
      if (platform === 'win32') {
        // Windows - usar taskkill
        exec(`taskkill /F /PID ${pids[0]}`, (killError) => {
          if (killError) {
            console.log(`⚠️ Erro ao matar processo na porta ${port}: ${killError.message}`);
          } else {
            console.log(`✅ Processo na porta ${port} morto`);
          }
          resolve();
        });
      } else {
        // Unix/Linux/Mac - usar kill
        exec(`kill -9 ${pids.join(' ')}`, (killError) => {
          if (killError) {
            console.log(`⚠️ Erro ao matar processo na porta ${port}: ${killError.message}`);
          } else {
            console.log(`✅ Processo na porta ${port} morto`);
          }
          resolve();
        });
      }
    });
  });
}

async function killAllPorts() {
  for (const port of ports) {
    await killPort(port);
  }
  console.log('✅ Todas as portas foram liberadas');
}

killAllPorts().catch(console.error);
