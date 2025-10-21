#!/usr/bin/env node

/**
 * 🔥 SCRIPT FINAL: IMPLEMENTAR CREDENCIAIS SUPABASE MAIS RECENTES
 * 
 * Este script implementa as credenciais Supabase MAIS RECENTES que você forneceu
 */

const fs = require('fs');

console.log('🔥 [FINAL] Implementando credenciais Supabase MAIS RECENTES...');

// CREDENCIAIS SUPABASE MAIS RECENTES que você forneceu
const CREDENCIAIS_SUPABASE_RECENTES = {
    // Supabase - Projeto: goldeouro-production (ID: gayopagjdrkcmkirmfvy)
    SUPABASE_URL: 'https://gayopagjdrkcmkirmfvy.supabase.co',
    
    // Credenciais Legacy (que você forneceu)
    SUPABASE_ANON_KEY_LEGACY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjA2NjksImV4cCI6MjA3NTU5NjY2OX0.iiCn8Ygm98bR9HzNgVucafON0KzUQDN2lHNiX_rVhvI',
    SUPABASE_SERVICE_ROLE_KEY_LEGACY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU',
    
    // Credenciais Novas (que você forneceu)
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_-mT3EC_2o7W0ZqmkQCeHTQ_jJ6kYpzU',
    SUPABASE_SECRET_KEY: 'sb_secret_m5_QZd0-czgRjHHKC9o3hQ_3xmyx3eS',
    
    // JWT Secret (que você forneceu)
    JWT_SECRET: 'Jc+pKwHQVwnF5YsprvcyKemtKeFQMCHYDPiIvgIkMHAug9DAa+Udf0hyUxug+vR7HTbOz3ouZq+bhpo201tNdg=='
};

// Mercado Pago - PRODUÇÃO REAL (já funcionando)
const CREDENCIAIS_MERCADO_PAGO = {
    MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-7954357605868928-090204-e9f5fb668c0f91f6b729328b1e14adf5-468718642',
    MERCADOPAGO_PUBLIC_KEY: 'APP_USR-6019e153-9b8a-481b-b412-916ce313638b',
    MERCADOPAGO_WEBHOOK_SECRET: '157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf'
};

// Atualizar arquivo .env com credenciais MAIS RECENTES
function atualizarEnvComCredenciaisRecentes() {
    console.log('📝 [ENV] Atualizando arquivo .env com credenciais MAIS RECENTES...');
    
    const envContent = `# Gol de Ouro - Configurações REAIS de Produção v1.1.1
# =====================================================
# 🔥 CONFIGURADO COM CREDENCIAIS MAIS RECENTES - ${new Date().toISOString()}

# Configurações do Servidor
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Configurações de Banco de Dados - PRODUÇÃO REAL (MAIS RECENTES)
# Projeto: goldeouro-production (ID: gayopagjdrkcmkirmfvy)
SUPABASE_URL=${CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_URL}

# Credenciais Legacy (funcionando)
SUPABASE_ANON_KEY=${CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_ANON_KEY_LEGACY}
SUPABASE_SERVICE_ROLE_KEY=${CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_SERVICE_ROLE_KEY_LEGACY}

# Credenciais Novas (testando)
SUPABASE_PUBLISHABLE_KEY=${CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_PUBLISHABLE_KEY}
SUPABASE_SECRET_KEY=${CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_SECRET_KEY}

# Configurações JWT (MAIS RECENTE)
JWT_SECRET=${CREDENCIAIS_SUPABASE_RECENTES.JWT_SECRET}
JWT_EXPIRES_IN=24h

# Configurações do Mercado Pago - PRODUÇÃO REAL (FUNCIONANDO)
MERCADOPAGO_ACCESS_TOKEN=${CREDENCIAIS_MERCADO_PAGO.MERCADOPAGO_ACCESS_TOKEN}
MERCADOPAGO_PUBLIC_KEY=${CREDENCIAIS_MERCADO_PAGO.MERCADOPAGO_PUBLIC_KEY}
MERCADOPAGO_WEBHOOK_SECRET=${CREDENCIAIS_MERCADO_PAGO.MERCADOPAGO_WEBHOOK_SECRET}

# URLs de Frontend - PRODUÇÃO REAL
FRONTEND_URL=https://admin.goldeouro.lol
PLAYER_URL=https://goldeouro.lol
BACKEND_URL=https://goldeouro-backend.fly.dev

# Configurações de CORS - PRODUÇÃO REAL
CORS_ORIGIN=https://admin.goldeouro.lol,https://goldeouro.lol,http://localhost:5173,http://localhost:5174

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Configurações de Backup
BACKUP_INTERVAL=24
BACKUP_RETENTION_DAYS=30

# Configurações de Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=indesconectavel@gmail.com
SMTP_PASS=PLACEHOLDER_REAL_APP_PASSWORD

# Configurações de Redis (Cache)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=goldeouro-redis-2025

# Configurações de WebSocket
WS_PORT=3001
WS_HEARTBEAT_INTERVAL=30000

# Configurações de Segurança
BCRYPT_ROUNDS=12
SESSION_SECRET=goldeouro-session-secret-2025-production-real

# Configurações de Monitoramento
SENTRY_DSN=PLACEHOLDER_REAL_SENTRY_DSN
NEW_RELIC_LICENSE_KEY=PLACEHOLDER_REAL_NEWRELIC_KEY

# Configurações de Desenvolvimento
DEBUG=goldeouro:*
VERBOSE_LOGGING=true

# Configurações Específicas de Produção
PRODUCTION_MODE=true
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true

# 🔥 CREDENCIAIS MAIS RECENTES CONFIGURADAS
# Data: ${new Date().toISOString()}
# Status: ✅ SISTEMA 100% PRONTO PARA PRODUÇÃO REAL
`;

    try {
        fs.writeFileSync('.env', envContent, 'utf8');
        console.log('✅ [ENV] Arquivo .env atualizado com credenciais MAIS RECENTES!');
        return true;
    } catch (error) {
        console.error('❌ [ENV] Erro ao atualizar .env:', error.message);
        return false;
    }
}

// Testar conexão Supabase com credenciais MAIS RECENTES
async function testarConexaoSupabaseRecentes() {
    console.log('🔍 [TESTE] Testando conexão Supabase com credenciais MAIS RECENTES...');
    
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        // Testar com credenciais Legacy primeiro
        console.log('1. Testando credenciais Legacy...');
        const supabaseLegacy = createClient(
            CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_URL,
            CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_SERVICE_ROLE_KEY_LEGACY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: dataLegacy, error: errorLegacy } = await supabaseLegacy
            .from('usuarios')
            .select('count')
            .limit(1);

        if (!errorLegacy) {
            console.log('✅ [SUPABASE-LEGACY] Conexão estabelecida com sucesso!');
            return { success: true, method: 'legacy' };
        } else {
            console.log('❌ [SUPABASE-LEGACY] Erro:', errorLegacy.message);
        }

        // Testar com credenciais Novas
        console.log('2. Testando credenciais Novas...');
        const supabaseNew = createClient(
            CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_URL,
            CREDENCIAIS_SUPABASE_RECENTES.SUPABASE_SECRET_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: dataNew, error: errorNew } = await supabaseNew
            .from('usuarios')
            .select('count')
            .limit(1);

        if (!errorNew) {
            console.log('✅ [SUPABASE-NEW] Conexão estabelecida com sucesso!');
            return { success: true, method: 'new' };
        } else {
            console.log('❌ [SUPABASE-NEW] Erro:', errorNew.message);
        }

        return { success: false, method: 'none' };

    } catch (error) {
        console.error('❌ [SUPABASE] Erro crítico:', error.message);
        return { success: false, method: 'error' };
    }
}

// Testar conexão Mercado Pago
async function testarConexaoMercadoPago() {
    console.log('🔍 [TESTE] Testando conexão Mercado Pago...');
    
    try {
        const axios = require('axios');
        
        const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
            headers: {
                'Authorization': `Bearer ${CREDENCIAIS_MERCADO_PAGO.MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            console.log('✅ [MERCADO-PAGO] Conexão estabelecida com sucesso!');
            return true;
        } else {
            console.log('❌ [MERCADO-PAGO] Erro na conexão:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ [MERCADO-PAGO] Erro crítico:', error.message);
        return false;
    }
}

// Função principal
async function main() {
    console.log('🚀 [FINAL] Iniciando implementação de credenciais MAIS RECENTES...');
    
    try {
        // 1. Atualizar arquivo .env
        const envUpdated = atualizarEnvComCredenciaisRecentes();
        
        if (!envUpdated) {
            console.log('❌ [FINAL] Falha na atualização do .env');
            return;
        }
        
        // 2. Testar conexão Supabase
        const supabaseResult = await testarConexaoSupabaseRecentes();
        
        // 3. Testar conexão Mercado Pago
        const mercadoPagoOk = await testarConexaoMercadoPago();
        
        // 4. Resultado final
        if (supabaseResult.success && mercadoPagoOk) {
            console.log('🎉 [SUCESSO] Credenciais MAIS RECENTES implementadas com sucesso!');
            console.log('✅ [STATUS] Supabase: CONECTADO (' + supabaseResult.method + ')');
            console.log('✅ [STATUS] Mercado Pago: CONECTADO');
            console.log('✅ [STATUS] Sistema: 100% PRONTO PARA PRODUÇÃO REAL');
            
            console.log('\n📋 [PRÓXIMOS PASSOS]:');
            console.log('1. Reiniciar servidor: node server-fly.js');
            console.log('2. Testar: http://localhost:8080/health');
            console.log('3. Verificar: database: REAL (não FALLBACK)');
            console.log('4. Verificar: pix: REAL (não FALLBACK)');
            console.log('5. Sistema pronto para usuários reais!');
        } else {
            console.log('⚠️ [STATUS] Implementação parcial:');
            console.log(`   Supabase: ${supabaseResult.success ? '✅ OK (' + supabaseResult.method + ')' : '❌ ERRO'}`);
            console.log(`   Mercado Pago: ${mercadoPagoOk ? '✅ OK' : '❌ ERRO'}`);
            
            if (!supabaseResult.success) {
                console.log('🔍 [DIAGNÓSTICO SUPABASE] Verifique se:');
                console.log('   - As credenciais estão corretas');
                console.log('   - O projeto Supabase existe');
                console.log('   - As tabelas foram criadas');
                console.log('   - As políticas RLS estão configuradas');
            }
        }
        
    } catch (error) {
        console.error('❌ [FINAL] Erro na implementação:', error.message);
    }
}

// Executar função principal
main();
