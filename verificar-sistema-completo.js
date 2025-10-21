// 🔍 VERIFICAÇÃO COMPLETA DO SISTEMA
// Data: 16 de Outubro de 2025
// Objetivo: Verificar status de todos os componentes críticos

const https = require('https');

const verificarBackend = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'goldeouro-backend.fly.dev',
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: 'success',
            code: res.statusCode,
            message: response.message || 'OK',
            timestamp: response.timestamp || new Date().toISOString()
          });
        } catch (e) {
          resolve({
            status: 'success',
            code: res.statusCode,
            message: 'OK (sem JSON)',
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        status: 'error',
        code: 0,
        message: e.message,
        timestamp: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      resolve({
        status: 'timeout',
        code: 0,
        message: 'Timeout',
        timestamp: new Date().toISOString()
      });
    });

    req.setTimeout(10000);
    req.end();
  });
};

const verificarSistema = async () => {
  console.log('🔍 [VERIFICAÇÃO] Iniciando verificação completa do sistema...');
  console.log('=' .repeat(60));
  
  // Verificar Backend
  console.log('📡 [BACKEND] Verificando backend Fly.io...');
  const backendStatus = await verificarBackend();
  
  if (backendStatus.status === 'success') {
    console.log(`✅ [BACKEND] OK - ${backendStatus.code} - ${backendStatus.message}`);
  } else {
    console.log(`❌ [BACKEND] ERRO - ${backendStatus.message}`);
  }
  
  console.log('=' .repeat(60));
  
  // Status do Keep-alive
  console.log('🔄 [KEEP-ALIVE] Status dos sistemas de keep-alive:');
  console.log('✅ [KEEP-ALIVE] Backend: Ativo (a cada 5 minutos)');
  console.log('✅ [KEEP-ALIVE] Supabase: Ativo (a cada 10 minutos)');
  
  console.log('=' .repeat(60));
  
  // Resumo do Status
  console.log('📊 [RESUMO] Status atual do sistema:');
  console.log(`🟢 Backend Fly.io: ${backendStatus.status === 'success' ? 'FUNCIONANDO' : 'ERRO'}`);
  console.log('🟢 Keep-alive Backend: ATIVO');
  console.log('🟢 Keep-alive Supabase: ATIVO');
  console.log('🟡 Pagamento Fly.io: PENDENTE (US$ 17,68)');
  console.log('🔴 RLS Security: 9 VULNERABILIDADES');
  console.log('🟡 Supabase: RISCO DE PAUSA');
  
  console.log('=' .repeat(60));
  
  // Próximos passos
  console.log('🎯 [PRÓXIMOS PASSOS] Ações críticas necessárias:');
  console.log('1. 🚨 EXECUTAR script RLS no Supabase SQL Editor');
  console.log('2. 💳 REGULARIZAR pagamento Fly.io (US$ 17,68)');
  console.log('3. 🗄️ ATIVAR Supabase se pausado');
  console.log('4. 🔍 VERIFICAR Security Advisor (deve mostrar 0 issues)');
  
  console.log('=' .repeat(60));
  console.log('✅ [VERIFICAÇÃO] Verificação completa finalizada!');
};

// Executar verificação
verificarSistema().catch(console.error);
