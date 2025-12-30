# 🔧 PATCH ENV - Sugestões de Correção
## Correções Necessárias para env.example e Validação V19

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Auditor:** AUDITOR SUPREMO V19

---

## 🔴 CORREÇÕES CRÍTICAS NECESSÁRIAS

### 1. Adicionar Variáveis V19 ao `env.example`

**Arquivo:** `env.example`

**Adicionar após a linha 12 (após SUPABASE_SERVICE_ROLE_KEY):**

```env
# ================================================
# Configurações ENGINE V19
# ================================================
USE_ENGINE_V19=true
ENGINE_HEARTBEAT_ENABLED=true
ENGINE_MONITOR_ENABLED=true
USE_DB_QUEUE=false

# Configurações de Heartbeat V19 (Opcional)
HEARTBEAT_INTERVAL_MS=5000
INSTANCE_ID=auto-generated
```

**Arquivo completo atualizado:**

```env
# Gol de Ouro - Configurações de Ambiente v1.2.0
# ================================================

# Configurações do Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Configurações de Banco de Dados
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ================================================
# Configurações ENGINE V19
# ================================================
USE_ENGINE_V19=true
ENGINE_HEARTBEAT_ENABLED=true
ENGINE_MONITOR_ENABLED=true
USE_DB_QUEUE=false

# Configurações de Heartbeat V19 (Opcional)
HEARTBEAT_INTERVAL_MS=5000
INSTANCE_ID=auto-generated

# Configurações JWT
JWT_SECRET=goldeouro-secret-key-2025-ultra-secure
JWT_EXPIRES_IN=24h

# Configurações do Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-access-token
MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# URLs de Frontend
FRONTEND_URL=https://admin.goldeouro.lol
PLAYER_URL=https://player.goldeouro.lol
BACKEND_URL=https://goldeouro-backend-v2.fly.dev

# Configurações de CORS
CORS_ORIGIN=https://admin.goldeouro.lol,https://player.goldeouro.lol

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
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configurações de Redis (Cache)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Configurações de WebSocket
WS_PORT=3001
WS_HEARTBEAT_INTERVAL=30000

# Configurações de Segurança
BCRYPT_ROUNDS=12
SESSION_SECRET=goldeouro-session-secret-2025

# Configurações de Monitoramento
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Configurações de Desenvolvimento
DEBUG=goldeouro:*
VERBOSE_LOGGING=true
```

---

### 2. Atualizar Validação em `config/required-env.js`

**Arquivo:** `config/required-env.js`

**Adicionar validação de variáveis V19:**

```javascript
// Validação de variáveis de ambiente obrigatórias
// Uso: assertRequiredEnv(['JWT_SECRET', 'SUPABASE_URL', ...], { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] })

'use strict';

function isProduction() {
  return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function assertRequiredEnv(requiredKeys = [], options = {}) {
  const { onlyInProduction = [] } = options || {};

  const missing = [];

  for (const key of requiredKeys) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      missing.push(key);
    }
  }

  if (isProduction()) {
    for (const key of onlyInProduction) {
      if (!process.env[key] || String(process.env[key]).trim() === '') {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
}

// ✅ NOVO: Validação específica para ENGINE V19
function assertV19Env() {
  const v19Required = [
    'USE_ENGINE_V19',
    'ENGINE_HEARTBEAT_ENABLED',
    'ENGINE_MONITOR_ENABLED'
  ];

  const missing = [];
  const incorrect = [];

  for (const key of v19Required) {
    const value = process.env[key];
    
    if (!value || String(value).trim() === '') {
      missing.push(key);
    } else {
      // Validar valores esperados
      if (key === 'USE_ENGINE_V19' && value !== 'true') {
        incorrect.push(`${key}=${value} (esperado: true)`);
      }
      if (key === 'ENGINE_HEARTBEAT_ENABLED' && value !== 'true') {
        incorrect.push(`${key}=${value} (esperado: true)`);
      }
      if (key === 'ENGINE_MONITOR_ENABLED' && value !== 'true') {
        incorrect.push(`${key}=${value} (esperado: true)`);
      }
    }
  }

  if (missing.length > 0) {
    console.warn(`⚠️ [V19] Variáveis V19 faltando: ${missing.join(', ')}`);
  }

  if (incorrect.length > 0) {
    console.warn(`⚠️ [V19] Variáveis V19 com valores incorretos: ${incorrect.join(', ')}`);
  }

  return {
    valid: missing.length === 0 && incorrect.length === 0,
    missing,
    incorrect
  };
}

module.exports = { 
  assertRequiredEnv, 
  isProduction,
  assertV19Env  // ✅ NOVO
};
```

---

### 3. Atualizar `server-fly.js` para Validar V19

**Arquivo:** `server-fly.js`

**Adicionar após linha 43 (após require('dotenv').config()):**

```javascript
// ✅ VALIDAÇÃO V19: Verificar variáveis de ambiente V19
const { assertV19Env } = require('./config/required-env');
try {
  const v19Validation = assertV19Env();
  if (!v19Validation.valid) {
    console.warn('⚠️ [SERVER] Variáveis V19 não configuradas corretamente');
    console.warn('   Faltando:', v19Validation.missing.join(', '));
    console.warn('   Incorretas:', v19Validation.incorrect.join(', '));
    console.warn('   Sistema pode não funcionar corretamente sem ENGINE V19');
  } else {
    console.log('✅ [SERVER] Variáveis V19 configuradas corretamente');
  }
} catch (error) {
  console.warn('⚠️ [SERVER] Erro ao validar variáveis V19:', error.message);
}
```

---

## 📋 CHECKLIST DE APLICAÇÃO

### Passo 1: Atualizar env.example
- [ ] Adicionar seção "Configurações ENGINE V19"
- [ ] Adicionar `USE_ENGINE_V19=true`
- [ ] Adicionar `ENGINE_HEARTBEAT_ENABLED=true`
- [ ] Adicionar `ENGINE_MONITOR_ENABLED=true`
- [ ] Adicionar `USE_DB_QUEUE=false`
- [ ] Adicionar `HEARTBEAT_INTERVAL_MS=5000` (opcional)
- [ ] Adicionar comentário sobre `INSTANCE_ID` (auto-generated)

### Passo 2: Atualizar config/required-env.js
- [ ] Adicionar função `assertV19Env()`
- [ ] Exportar `assertV19Env` no module.exports
- [ ] Validar valores esperados (true para variáveis booleanas)

### Passo 3: Atualizar server-fly.js
- [ ] Importar `assertV19Env` de `config/required-env`
- [ ] Chamar `assertV19Env()` após `require('dotenv').config()`
- [ ] Adicionar logs de warning se validação falhar

### Passo 4: Verificar .env de Produção
- [ ] Verificar se `.env` de produção tem variáveis V19
- [ ] Se não tiver, adicionar manualmente ou via script
- [ ] Validar valores após adicionar

---

## ⚠️ IMPACTO DAS CORREÇÕES

### Antes das Correções:
- ❌ Engine V19 não será ativada (`USE_ENGINE_V19` não definido)
- ❌ Heartbeat não será iniciado (`ENGINE_HEARTBEAT_ENABLED` não definido)
- ❌ Monitoramento não será ativado (`ENGINE_MONITOR_ENABLED` não definido)
- ⚠️ Sistema pode não funcionar corretamente

### Depois das Correções:
- ✅ Engine V19 será ativada automaticamente
- ✅ Heartbeat será iniciado automaticamente
- ✅ Monitoramento será ativado automaticamente
- ✅ Sistema funcionará com todas as funcionalidades V19

---

## 🔍 VALIDAÇÃO PÓS-CORREÇÃO

Após aplicar as correções, executar:

```bash
# Validar variáveis V19
node src/scripts/etapa6_validar_env_v19.js

# Ou usar script de validação suprema
node src/scripts/verificacao_suprema_02_env.js
```

**Resultado Esperado:**
```
✅ USE_ENGINE_V19 = true
✅ ENGINE_HEARTBEAT_ENABLED = true
✅ ENGINE_MONITOR_ENABLED = true
✅ USE_DB_QUEUE = false
```

---

## 📝 NOTAS IMPORTANTES

1. **Variáveis V19 são OBRIGATÓRIAS** para funcionamento correto do sistema
2. **Valores devem ser exatamente `true`** (string) para variáveis booleanas
3. **USE_DB_QUEUE** deve ser `false` por padrão (sistema usa fila em memória)
4. **HEARTBEAT_INTERVAL_MS** é opcional (padrão: 5000ms)
5. **INSTANCE_ID** é gerado automaticamente se não definido

---

**Gerado em:** 2025-12-10  
**Versão:** V19.0.0  
**Status:** ✅ PRONTO PARA APLICAÇÃO

