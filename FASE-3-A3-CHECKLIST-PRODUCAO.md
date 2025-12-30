# ✅ FASE 3 — CHECKLIST DE PRODUÇÃO
## BLOCO A — ETAPA A3: Validação Final Pré-Deploy

**Data:** 19/12/2025  
**Hora:** 01:40:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** 🔍 **VALIDAÇÃO EM ANDAMENTO**

---

## 🎯 OBJETIVO

Validar todos os aspectos críticos antes do deploy em produção:
- ✅ Variáveis de ambiente
- ✅ Tokens e credenciais
- ✅ URLs e endpoints
- ✅ CORS configurado
- ✅ Rate limit configurado
- ✅ Logs ativos
- ✅ Monitoramento disponível

**⛔ SE QUALQUER ITEM FALHAR → ABORTAR FASE 3**

---

## 📋 CHECKLIST DE VALIDAÇÃO

### **1. VARIÁVEIS DE AMBIENTE**

#### **1.1. Backend (Fly.io)**

**Variáveis Obrigatórias:**

- [ ] `JWT_SECRET` - Definida e não vazia
- [ ] `SUPABASE_URL` - URL correta do Supabase produção
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Chave válida
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Token válido (produção)
- [ ] `ADMIN_TOKEN` - Token definido
- [ ] `NODE_ENV=production` - Ambiente correto
- [ ] `PORT` - Porta definida (padrão: 8080)
- [ ] `CORS_ORIGIN` - Origens permitidas configuradas

**Validação:**
```powershell
# Listar secrets do Fly.io
fly secrets list

# Verificar cada variável crítica
# ⚠️ NÃO exibir valores completos por segurança
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **1.2. Frontend Player (Vercel)**

**Variáveis Obrigatórias:**

- [ ] `VITE_BACKEND_URL` - URL do backend produção
- [ ] `VITE_API_BASE_URL` - URL base da API
- [ ] `VITE_ENVIRONMENT=production` - Ambiente correto

**Validação:**
```powershell
# Acessar Vercel Dashboard
# Projeto: goldeouro-player
# Settings → Environment Variables
# Verificar todas as variáveis acima
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **1.3. Frontend Admin (Vercel)**

**Variáveis Obrigatórias:**

- [ ] `VITE_BACKEND_URL` - URL do backend produção
- [ ] `VITE_API_BASE_URL` - URL base da API
- [ ] `VITE_ADMIN_TOKEN` - Token admin (se necessário)
- [ ] `VITE_ENVIRONMENT=production` - Ambiente correto

**Validação:**
```powershell
# Acessar Vercel Dashboard
# Projeto: goldeouro-admin
# Settings → Environment Variables
# Verificar todas as variáveis acima
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

### **2. TOKENS E CREDENCIAIS**

#### **2.1. JWT Secret**

- [ ] Token definido e não vazio
- [ ] Token diferente de desenvolvimento/staging
- [ ] Token com complexidade adequada (mínimo 32 caracteres)

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **2.2. Supabase Service Role Key**

- [ ] Chave válida e ativa
- [ ] Chave com permissões adequadas
- [ ] Chave não expirada

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **2.3. Mercado Pago Access Token**

- [ ] Token de produção (não sandbox)
- [ ] Token válido e ativo
- [ ] Token com permissões adequadas

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **2.4. Admin Token**

- [ ] Token definido
- [ ] Token diferente de desenvolvimento/staging
- [ ] Token com complexidade adequada

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

### **3. URLs E ENDPOINTS**

#### **3.1. Backend API**

**URLs de Produção:**

- [ ] Backend URL: `https://goldeouro-backend-v2.fly.dev` (ou equivalente)
- [ ] Health Check: `https://[BACKEND_URL]/health` - Responde 200
- [ ] API Base: `https://[BACKEND_URL]/api` - Acessível

**Validação:**
```powershell
# Testar health check
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method GET

# Deve retornar: {"status":"ok"} ou similar
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **3.2. Frontend Player**

**URLs de Produção:**

- [ ] Player URL: `https://goldeouro.lol` (ou equivalente)
- [ ] URL acessível e carregando
- [ ] Sem erros de console críticos

**Validação:**
```powershell
# Testar acesso
Invoke-WebRequest -Uri "https://goldeouro.lol" -Method GET

# Verificar status code (deve ser 200)
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **3.3. Frontend Admin**

**URLs de Produção:**

- [ ] Admin URL: `https://admin.goldeouro.lol` (ou equivalente)
- [ ] URL acessível e carregando
- [ ] Sem erros de console críticos

**Validação:**
```powershell
# Testar acesso
Invoke-WebRequest -Uri "https://admin.goldeouro.lol" -Method GET

# Verificar status code (deve ser 200)
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

### **4. CORS CONFIGURADO**

#### **4.1. Backend CORS**

**Origens Permitidas:**

- [ ] `https://goldeouro.lol` - Permitida
- [ ] `https://www.goldeouro.lol` - Permitida
- [ ] `https://admin.goldeouro.lol` - Permitida
- [ ] Origens de desenvolvimento **NÃO** permitidas em produção

**Validação:**
```javascript
// Verificar em server-fly.js
// CORS deve estar configurado corretamente
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

### **5. RATE LIMIT CONFIGURADO**

#### **5.1. Rate Limit Global**

- [ ] Rate limit configurado (ex: 100 req/15min)
- [ ] Rate limit ativo em produção
- [ ] Mensagens de erro adequadas

**Validação:**
```javascript
// Verificar em server-fly.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  // ...
});
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **5.2. Rate Limit de Autenticação**

- [ ] Rate limit específico para `/api/auth/` (ex: 5 req/15min)
- [ ] Rate limit ativo
- [ ] Mensagens de erro adequadas

**Validação:**
```javascript
// Verificar em server-fly.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 tentativas de login
  // ...
});
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

### **6. LOGS ATIVOS**

#### **6.1. Backend Logs**

- [ ] Logs configurados e ativos
- [ ] Logs sendo enviados para destino adequado (Fly.io logs)
- [ ] Níveis de log apropriados (INFO, ERROR, WARN)

**Validação:**
```powershell
# Verificar logs do Fly.io
fly logs

# Deve mostrar logs recentes
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **6.2. Frontend Logs**

- [ ] Console logs desabilitados em produção (ou apenas erros)
- [ ] Logs de erro sendo capturados (Sentry, etc.)
- [ ] Logs não expõem informações sensíveis

**Validação:**
```javascript
// Verificar em código frontend
// console.log deve estar condicionado a desenvolvimento
if (import.meta.env.DEV) {
  console.log('...');
}
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

### **7. MONITORAMENTO DISPONÍVEL**

#### **7.1. Health Checks**

- [ ] Health check endpoint funcionando: `/health`
- [ ] Health check retorna status correto
- [ ] Health check monitorado (Fly.io, Vercel)

**Validação:**
```powershell
# Testar health check
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health"

# Deve retornar: {"status":"ok"} ou similar
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **7.2. Métricas**

- [ ] Métricas disponíveis: `/api/metrics`
- [ ] Métricas sendo coletadas
- [ ] Dashboard de monitoramento acessível (se aplicável)

**Validação:**
```powershell
# Testar endpoint de métricas
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/metrics"

# Deve retornar métricas em formato JSON
```

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

#### **7.3. Alertas**

- [ ] Alertas configurados para erros críticos
- [ ] Alertas configurados para downtime
- [ ] Canal de notificação definido (email, Slack, etc.)

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

## 🚨 GATE CRÍTICO

### **⛔ CRITÉRIOS DE ABORTAGEM**

**ABORTAR FASE 3 SE:**

1. ❌ Qualquer variável de ambiente obrigatória estiver faltando
2. ❌ Qualquer token/credencial estiver inválido ou expirado
3. ❌ URLs de produção não estiverem acessíveis
4. ❌ CORS não estiver configurado corretamente
5. ❌ Rate limit não estiver ativo
6. ❌ Logs não estiverem funcionando
7. ❌ Monitoramento não estiver disponível

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO COMPLETA**

---

## ✅ RESUMO DO CHECKLIST

| Categoria | Itens | Validados | Pendentes | Status |
|-----------|-------|-----------|-----------|--------|
| **Variáveis de Ambiente** | 8 | 0 | 8 | ⏳ Pendente |
| **Tokens e Credenciais** | 4 | 0 | 4 | ⏳ Pendente |
| **URLs e Endpoints** | 3 | 0 | 3 | ⏳ Pendente |
| **CORS** | 1 | 0 | 1 | ⏳ Pendente |
| **Rate Limit** | 2 | 0 | 2 | ⏳ Pendente |
| **Logs** | 2 | 0 | 2 | ⏳ Pendente |
| **Monitoramento** | 3 | 0 | 3 | ⏳ Pendente |
| **TOTAL** | **23** | **0** | **23** | ⏳ **PENDENTE** |

---

## 📄 EVIDÊNCIAS

**Comandos de Validação Preparados:**
- Fly.io secrets: `fly secrets list`
- Health check: `Invoke-WebRequest -Uri "https://[URL]/health"`
- Logs: `fly logs`

**Arquivos de Referência:**
- `server-fly.js` - Configuração do servidor
- `.env.example` - Exemplo de variáveis de ambiente

---

**Checklist iniciado em:** 2025-12-19T01:40:00.000Z  
**Status:** ⏳ **AGUARDANDO VALIDAÇÃO COMPLETA**

---

## 🎯 PRÓXIMOS PASSOS

**APÓS VALIDAÇÃO COMPLETA:**

1. ✅ Todos os itens validados → **PROSSEGUIR PARA BLOCO B (DEPLOY)**
2. ❌ Qualquer item falhar → **ABORTAR FASE 3 E CORRIGIR**

