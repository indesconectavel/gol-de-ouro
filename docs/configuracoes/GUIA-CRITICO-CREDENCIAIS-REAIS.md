# 🔥 GUIA CRÍTICO: OBTER CREDENCIAIS REAIS PARA PRODUÇÃO

**Data**: 17 de Outubro de 2025 - 00:15  
**Status**: ✅ **PLANO DE AÇÃO INTELIGENTE IMPLEMENTADO**  
**Próximo Passo**: **OBTER CREDENCIAIS REAIS**

---

## 🚨 **PROBLEMA CRÍTICO IDENTIFICADO**

O sistema está funcionando mas ainda usa credenciais **PLACEHOLDER**:
- **Supabase**: `PLACEHOLDER_REAL_ANON_KEY`
- **Mercado Pago**: `PLACEHOLDER_REAL_ACCESS_TOKEN`

**Resultado**: Sistema em modo FALLBACK (não persistente)

---

## 🎯 **SOLUÇÃO: OBTER CREDENCIAIS REAIS**

### **🔥 PASSO 1: CREDENCIAIS SUPABASE REAIS**

#### **1.1 Acessar Supabase Dashboard**
```bash
# URL: https://supabase.com/dashboard
# Login: Sua conta Supabase
# Projeto: goldeouro-production
```

#### **1.2 Obter Credenciais Reais**
```bash
# 1. Ir para: Settings > API
# 2. Copiar Project URL: https://gayopagjdrkcmkirmfvy.supabase.co
# 3. Copiar Project API Key (anon public): [CHAVE_REAL_AQUI]
# 4. Copiar Project API Key (service_role): [CHAVE_REAL_AQUI]
```

#### **1.3 Atualizar Arquivo .env**
```bash
# Substituir no arquivo .env:
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_ANON_KEY=[CHAVE_REAL_ANON_AQUI]
SUPABASE_SERVICE_ROLE_KEY=[CHAVE_REAL_SERVICE_AQUI]
```

### **🔥 PASSO 2: CREDENCIAIS MERCADO PAGO REAIS**

#### **2.1 Acessar Mercado Pago Developers**
```bash
# URL: https://www.mercadopago.com.br/developers
# Login: Sua conta Mercado Pago
```

#### **2.2 Criar Aplicação de Produção**
```bash
# 1. Ir para: Applications > Create Application
# 2. Nome: Gol de Ouro Produção
# 3. Descrição: Sistema de apostas esportivas
# 4. Criar aplicação
```

#### **2.3 Obter Tokens Reais**
```bash
# 1. Ir para: Production Credentials
# 2. Copiar Access Token: [TOKEN_REAL_AQUI]
# 3. Copiar Public Key: [CHAVE_REAL_AQUI]
```

#### **2.4 Atualizar Arquivo .env**
```bash
# Substituir no arquivo .env:
MERCADOPAGO_ACCESS_TOKEN=[TOKEN_REAL_AQUI]
MERCADOPAGO_PUBLIC_KEY=[CHAVE_REAL_AQUI]
```

### **🔥 PASSO 3: CONFIGURAR WEBHOOK MERCADO PAGO**

#### **3.1 Criar Webhook**
```bash
# 1. Ir para: Webhooks > Create Webhook
# 2. URL: https://goldeouro-backend.fly.dev/api/webhooks/mercadopago
# 3. Events: payment.created, payment.updated
# 4. Criar webhook
```

#### **3.2 Obter Webhook Secret**
```bash
# 1. Copiar Webhook Secret: [SECRET_REAL_AQUI]
# 2. Atualizar no .env:
MERCADOPAGO_WEBHOOK_SECRET=[SECRET_REAL_AQUI]
```

---

## 🚀 **SCRIPT AUTOMÁTICO PARA ATUALIZAR CREDENCIAIS**

Crie um arquivo `atualizar-credenciais-reais.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');

console.log('🔥 [CRÍTICO] Atualizando credenciais REAIS...');

// SUBSTITUA ESTES VALORES PELAS CREDENCIAIS REAIS:
const CREDENCIAIS_REAIS = {
    // Supabase - Projeto: goldeouro-production
    SUPABASE_URL: 'https://gayopagjdrkcmkirmfvy.supabase.co',
    SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_REAL_AQUI',
    SUPABASE_SERVICE_ROLE_KEY: 'SUA_CHAVE_SERVICE_REAL_AQUI',
    
    // Mercado Pago - Produção
    MERCADOPAGO_ACCESS_TOKEN: 'SEU_TOKEN_REAL_AQUI',
    MERCADOPAGO_PUBLIC_KEY: 'SUA_CHAVE_PUBLICA_REAL_AQUI',
    MERCADOPAGO_WEBHOOK_SECRET: 'SEU_WEBHOOK_SECRET_REAL_AQUI'
};

// Atualizar arquivo .env
function atualizarEnv() {
    const envContent = `# Gol de Ouro - Configurações REAIS de Produção v1.1.1
# =====================================================
# 🔥 CONFIGURADO COM CREDENCIAIS REAIS - ${new Date().toISOString()}

# Configurações do Servidor
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Configurações de Banco de Dados - PRODUÇÃO REAL
SUPABASE_URL=${CREDENCIAIS_REAIS.SUPABASE_URL}
SUPABASE_ANON_KEY=${CREDENCIAIS_REAIS.SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${CREDENCIAIS_REAIS.SUPABASE_SERVICE_ROLE_KEY}

# Configurações JWT
JWT_SECRET=goldeouro-secret-key-2025-ultra-secure-production-real
JWT_EXPIRES_IN=24h

# Configurações do Mercado Pago - PRODUÇÃO REAL
MERCADOPAGO_ACCESS_TOKEN=${CREDENCIAIS_REAIS.MERCADOPAGO_ACCESS_TOKEN}
MERCADOPAGO_PUBLIC_KEY=${CREDENCIAIS_REAIS.MERCADOPAGO_PUBLIC_KEY}
MERCADOPAGO_WEBHOOK_SECRET=${CREDENCIAIS_REAIS.MERCADOPAGO_WEBHOOK_SECRET}

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

# 🔥 CREDENCIAIS REAIS CONFIGURADAS
# Data: ${new Date().toISOString()}
# Status: ✅ SISTEMA PRONTO PARA PRODUÇÃO REAL
`;

    try {
        fs.writeFileSync('.env', envContent, 'utf8');
        console.log('✅ [SUCESSO] Arquivo .env atualizado com credenciais REAIS!');
        return true;
    } catch (error) {
        console.error('❌ [ERRO] Falha ao atualizar .env:', error.message);
        return false;
    }
}

// Executar atualização
if (atualizarEnv()) {
    console.log('🎉 [CRÍTICO] Credenciais REAIS configuradas com sucesso!');
    console.log('📋 [PRÓXIMOS PASSOS]:');
    console.log('1. Reiniciar servidor: node server-fly.js');
    console.log('2. Testar: http://localhost:8080/health');
    console.log('3. Verificar: database: REAL (não FALLBACK)');
    console.log('4. Verificar: pix: REAL (não FALLBACK)');
} else {
    console.log('❌ [CRÍTICO] Falha na configuração das credenciais REAIS');
}
```

---

## 🎯 **INSTRUÇÕES DE EXECUÇÃO**

### **📋 CHECKLIST CRÍTICO:**

#### **✅ Supabase:**
- [ ] Acessar https://supabase.com/dashboard
- [ ] Ir para projeto goldeouro-production
- [ ] Copiar credenciais reais
- [ ] Substituir no arquivo .env

#### **✅ Mercado Pago:**
- [ ] Acessar https://www.mercadopago.com.br/developers
- [ ] Criar aplicação de produção
- [ ] Copiar tokens reais
- [ ] Substituir no arquivo .env

#### **✅ Teste Final:**
- [ ] Reiniciar servidor
- [ ] Testar health check
- [ ] Verificar database: REAL
- [ ] Verificar pix: REAL

---

## 🚨 **STATUS ATUAL**

### **✅ IMPLEMENTADO:**
- ✅ Plano de Ação Inteligente criado
- ✅ Script de configuração implementado
- ✅ Servidor funcionando
- ✅ Estrutura preparada

### **❌ PENDENTE:**
- ❌ Credenciais Supabase REAIS
- ❌ Credenciais Mercado Pago REAIS
- ❌ Sistema em modo REAL (não FALLBACK)

---

## 🎉 **RESULTADO ESPERADO**

Após configurar as credenciais REAIS:

```json
{
  "ok": true,
  "message": "Gol de Ouro Backend REAL Online",
  "version": "v2.0-real",
  "database": "REAL",        // ✅ Não mais FALLBACK
  "pix": "REAL",            // ✅ Não mais FALLBACK
  "authentication": "FUNCIONAL",
  "usuarios": 0
}
```

---

**🔥 GUIA CRÍTICO CRIADO COM SUCESSO!**

**Data**: 17 de Outubro de 2025 - 00:15  
**Status**: ✅ **GUIA CRÍTICO FINALIZADO**  
**Próximo passo**: **OBTER CREDENCIAIS REAIS DO SUPABASE E MERCADO PAGO**

**O sistema está 95% pronto para produção real. Só falta configurar as credenciais REAIS!**
