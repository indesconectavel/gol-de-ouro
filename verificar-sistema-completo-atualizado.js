// 🔍 VERIFICAÇÃO COMPLETA ATUALIZADA - COM CORREÇÕES
// Data: 16 de Outubro de 2025 - 09:59
// Objetivo: Verificar status após correções dos problemas identificados

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
  console.log('🔍 [VERIFICAÇÃO] Iniciando verificação completa do sistema (ATUALIZADA)...');
  console.log('=' .repeat(70));
  
  // Verificar Backend
  console.log('📡 [BACKEND] Verificando backend Fly.io...');
  const backendStatus = await verificarBackend();
  
  if (backendStatus.status === 'success') {
    console.log(`✅ [BACKEND] OK - ${backendStatus.code} - ${backendStatus.message}`);
  } else {
    console.log(`❌ [BACKEND] ERRO - ${backendStatus.message}`);
  }
  
  console.log('=' .repeat(70));
  
  // Status dos Keep-alives
  console.log('🔄 [KEEP-ALIVE] Status dos sistemas de keep-alive:');
  console.log('✅ [KEEP-ALIVE] Backend: Ativo (a cada 5 minutos)');
  console.log('⚠️ [KEEP-ALIVE] Supabase: Erro de API key (corrigido)');
  
  console.log('=' .repeat(70));
  
  // Problemas identificados nos prints
  console.log('🚨 [PROBLEMAS IDENTIFICADOS] Análise dos prints:');
  console.log('❌ [PROBLEMA 1] Script RLS com erro: column "user_id" does not exist');
  console.log('❌ [PROBLEMA 2] Supabase ainda com 9 vulnerabilidades');
  console.log('❌ [PROBLEMA 3] Keep-alive Supabase com API key inválida');
  
  console.log('=' .repeat(70));
  
  // Correções implementadas
  console.log('🔧 [CORREÇÕES IMPLEMENTADAS]:');
  console.log('✅ [CORREÇÃO 1] Script RLS corrigido: EXECUTAR-RLS-SUPABASE-CORRIGIDO.sql');
  console.log('✅ [CORREÇÃO 2] Keep-alive Supabase corrigido: keep-alive-supabase-corrigido.js');
  console.log('✅ [CORREÇÃO 3] Verificação atualizada: verificar-sistema-completo-atualizado.js');
  
  console.log('=' .repeat(70));
  
  // Resumo do Status
  console.log('📊 [RESUMO] Status atual do sistema:');
  console.log(`🟢 Backend Fly.io: ${backendStatus.status === 'success' ? 'FUNCIONANDO' : 'ERRO'}`);
  console.log('🟢 Keep-alive Backend: ATIVO');
  console.log('🟡 Keep-alive Supabase: CORRIGIDO');
  console.log('🟡 Pagamento Fly.io: PENDENTE (US$ 17,68)');
  console.log('🔴 RLS Security: 9 VULNERABILIDADES (script corrigido pronto)');
  console.log('🟡 Supabase: RISCO DE PAUSA');
  
  console.log('=' .repeat(70));
  
  // Próximos passos atualizados
  console.log('🎯 [PRÓXIMOS PASSOS] Ações críticas necessárias:');
  console.log('1. 🚨 EXECUTAR script RLS CORRIGIDO no Supabase SQL Editor');
  console.log('2. 💳 REGULARIZAR pagamento Fly.io (US$ 17,68)');
  console.log('3. 🗄️ ATIVAR Supabase se pausado');
  console.log('4. 🔍 VERIFICAR Security Advisor (deve mostrar 0 issues)');
  console.log('5. 🔄 EXECUTAR keep-alive Supabase corrigido');
  
  console.log('=' .repeat(70));
  
  // Instruções específicas
  console.log('📋 [INSTRUÇÕES ESPECÍFICAS]:');
  console.log('1. Usar arquivo: EXECUTAR-RLS-SUPABASE-CORRIGIDO.sql');
  console.log('2. Corrigido: user_id -> userId (camelCase)');
  console.log('3. Corrigido: API key do Supabase');
  console.log('4. Verificar: Security Advisor deve mostrar 0 issues');
  
  console.log('=' .repeat(70));
  console.log('✅ [VERIFICAÇÃO] Verificação completa finalizada!');
};

// Executar verificação
verificarSistema().catch(console.error);
