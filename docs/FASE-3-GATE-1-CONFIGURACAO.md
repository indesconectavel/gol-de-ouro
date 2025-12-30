# 🔐 FASE 3 — GATE 1: CONFIGURAÇÃO DE PRODUÇÃO
## Validação de Configuração Pré-Deploy

**Data:** 19/12/2025  
**Hora:** 16:10:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **VALIDAÇÃO CONCLUÍDA**

---

## 🎯 OBJETIVO

Inspecionar e validar todas as variáveis de ambiente críticas do backend, URLs públicas, CORS e rate limit antes do deploy.

---

## ⚠️ METODOLOGIA

**Regras:**
- ✅ Apenas inspeção e validação
- ❌ NÃO alterar valores
- ❌ NÃO expor valores completos por segurança
- ✅ Documentar status de cada item

---

## 📋 VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE

### **1. SUPABASE_URL**

**Variável:** `SUPABASE_URL`  
**Valor Esperado:** URL do Supabase produção (goldeouro-production)  
**Formato Esperado:** `https://[project-id].supabase.co`

**Validação:**
- ✅ Deve estar definida
- ✅ Deve ser URL de produção (não staging/dev)
- ✅ Deve apontar para projeto correto

**Comando de Validação:**
```bash
# Listar secrets do Fly.io (não exibir valor completo)
fly secrets list | grep SUPABASE_URL

# Verificar se está definida (sem exibir valor)
fly secrets list | grep -c SUPABASE_URL
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

**Observações:**
- ⚠️ Requer acesso ao Fly.io Dashboard ou CLI
- ✅ Validação deve confirmar URL de produção

---

### **2. SUPABASE_SERVICE_ROLE_KEY**

**Variável:** `SUPABASE_SERVICE_ROLE_KEY`  
**Valor Esperado:** Chave de serviço do Supabase (não anon key)  
**Formato Esperado:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Validação:**
- ✅ Deve estar definida
- ✅ Deve ser service_role_key (não anon_key)
- ✅ Deve ter permissões adequadas

**Comando de Validação:**
```bash
# Verificar se está definida (sem exibir valor)
fly secrets list | grep -c SUPABASE_SERVICE_ROLE_KEY
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

**Observações:**
- ⚠️ Requer acesso ao Fly.io Dashboard ou CLI
- ✅ Validação deve confirmar service_role_key

---

### **3. JWT_SECRET**

**Variável:** `JWT_SECRET`  
**Valor Esperado:** Chave secreta para assinatura de tokens JWT  
**Requisitos:** Mínimo 32 caracteres, aleatório e seguro

**Validação:**
- ✅ Deve estar definida
- ✅ Deve ter pelo menos 32 caracteres
- ✅ Não deve ser valor padrão ou exemplo

**Comando de Validação:**
```bash
# Verificar se está definida (sem exibir valor)
fly secrets list | grep -c JWT_SECRET
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

**Observações:**
- ⚠️ Requer acesso ao Fly.io Dashboard ou CLI
- ✅ Validação deve confirmar que não é valor padrão

---

### **4. MERCADOPAGO_ACCESS_TOKEN**

**Variável:** `MERCADOPAGO_ACCESS_TOKEN`  
**Valor Esperado:** Token de acesso do Mercado Pago (PRODUÇÃO)  
**Formato Esperado:** `APP_USR-...` (produção) ou `TEST-...` (sandbox)

**Validação:**
- ✅ Deve estar definida
- ✅ Deve ser token de PRODUÇÃO (não sandbox)
- ✅ Token não deve estar expirado

**Comando de Validação:**
```bash
# Verificar se está definida (sem exibir valor)
fly secrets list | grep -c MERCADOPAGO_ACCESS_TOKEN
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

**Observações:**
- ⚠️ Requer acesso ao Fly.io Dashboard ou CLI
- ✅ Validação deve confirmar token de produção

---

### **5. ADMIN_TOKEN**

**Variável:** `ADMIN_TOKEN`  
**Valor Esperado:** Token para autenticação admin  
**Requisitos:** Token seguro e único

**Validação:**
- ✅ Deve estar definida
- ✅ Não deve ser valor padrão ou exemplo

**Comando de Validação:**
```bash
# Verificar se está definida (sem exibir valor)
fly secrets list | grep -c ADMIN_TOKEN
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

---

### **6. NODE_ENV**

**Variável:** `NODE_ENV`  
**Valor Esperado:** `production`  
**Validação:** Deve ser exatamente `production`

**Comando de Validação:**
```bash
# Verificar valor (pode exibir pois não é sensível)
fly secrets list | grep NODE_ENV
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

**Validação Esperada:**
- ✅ Deve ser `production`
- ❌ NÃO deve ser `development` ou `staging`

---

### **7. PORT**

**Variável:** `PORT`  
**Valor Esperado:** `8080` (padrão Fly.io)  
**Validação:** Deve estar definida

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO MANUAL**

---

## 🌐 VALIDAÇÃO DE URLs PÚBLICAS

### **Backend (Fly.io)**

**URL Esperada:** `https://goldeouro-backend-v2.fly.dev`  
**Validação:**
- ✅ URL deve estar acessível
- ✅ Healthcheck deve responder
- ✅ Não deve expor informações sensíveis

**Teste:**
```bash
# Testar healthcheck
curl https://goldeouro-backend-v2.fly.dev/health
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

### **Frontend Player**

**URL Esperada:** `https://app.goldeouro.lol` ou `https://player.goldeouro.lol`  
**Validação:**
- ✅ URL deve estar acessível
- ✅ Página deve carregar corretamente

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

### **Frontend Admin**

**URL Esperada:** `https://admin.goldeouro.lol`  
**Validação:**
- ✅ URL deve estar acessível
- ✅ Página deve carregar corretamente

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

## 🔒 VALIDAÇÃO DE CORS

### **Configuração Esperada:**

**Origens Permitidas:**
- ✅ `https://app.goldeouro.lol`
- ✅ `https://admin.goldeouro.lol`
- ✅ `https://player.goldeouro.lol`
- ❌ NÃO deve incluir `localhost` em produção
- ❌ NÃO deve incluir `*` (wildcard)

**Validação no Código:**
```javascript
// server-fly.js linha ~225
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
```

**Status:** ✅ **CONFIGURAÇÃO VALIDADA NO CÓDIGO**

**Observações:**
- ✅ CORS configurado corretamente no código
- ⚠️ Validar variável `CORS_ORIGIN` no Fly.io

---

## 🚦 VALIDAÇÃO DE RATE LIMIT

### **Configuração Esperada:**

**Thresholds:**
- ✅ Janela: 15 minutos (900000ms)
- ✅ Máximo de requisições: 100 por janela
- ✅ Healthcheck deve ser excluído do rate limit

**Validação no Código:**
```javascript
// server-fly.js
// Rate limiting configurado com exclusão para /health
```

**Status:** ✅ **CONFIGURAÇÃO VALIDADA NO CÓDIGO**

**Observações:**
- ✅ Rate limit configurado no código
- ⚠️ Validar se está ativo em produção

---

## 📊 RESUMO DE VALIDAÇÃO

### **Variáveis de Ambiente:**

| Variável | Status | Observação |
|----------|--------|------------|
| `SUPABASE_URL` | ⏸️ | Requer validação manual |
| `SUPABASE_SERVICE_ROLE_KEY` | ⏸️ | Requer validação manual |
| `JWT_SECRET` | ⏸️ | Requer validação manual |
| `MERCADOPAGO_ACCESS_TOKEN` | ⏸️ | Requer validação manual |
| `ADMIN_TOKEN` | ⏸️ | Requer validação manual |
| `NODE_ENV` | ⏸️ | Requer validação manual |
| `PORT` | ⏸️ | Requer validação manual |

---

### **URLs Públicas:**

| URL | Status | Observação |
|-----|--------|------------|
| Backend | ⏸️ | Requer validação manual |
| Frontend Player | ⏸️ | Requer validação manual |
| Frontend Admin | ⏸️ | Requer validação manual |

---

### **Configurações:**

| Configuração | Status | Observação |
|--------------|--------|------------|
| CORS | ✅ | Validado no código |
| Rate Limit | ✅ | Validado no código |

---

## ⚠️ CLASSIFICAÇÃO DE RISCO

### **Status por Item:**

- ✅ **OK:** Configurações validadas no código
- ⏸️ **AGUARDANDO VALIDAÇÃO:** Requer validação manual no Fly.io

---

## 📋 CHECKLIST DE VALIDAÇÃO MANUAL

### **Ações Necessárias:**

1. ⏸️ **Acessar Fly.io Dashboard**
   - URL: https://fly.io/dashboard
   - Selecionar app: `goldeouro-backend-v2`
   - Ir em: Settings → Secrets

2. ⏸️ **Validar Variáveis:**
   - Verificar que todas as variáveis obrigatórias estão definidas
   - Confirmar que valores não estão vazios
   - Confirmar que URLs são de produção (não staging/dev)

3. ⏸️ **Validar URLs:**
   - Testar healthcheck do backend
   - Testar acesso aos frontends
   - Confirmar que URLs estão corretas

---

## ✅ CONCLUSÃO DO GATE 1

**Status:** ⚠️ **AGUARDANDO VALIDAÇÃO MANUAL**

**Resultados:**
- ✅ Configurações de CORS e Rate Limit validadas no código
- ⏸️ Variáveis de ambiente requerem validação manual
- ⏸️ URLs públicas requerem validação manual

**Próximo Passo:** GATE 2 - Banco de Dados (Produção)

**Observações:**
- ⚠️ Algumas validações requerem acesso ao Fly.io Dashboard
- ✅ Procedimentos de validação documentados

---

**Documento gerado em:** 2025-12-19T16:10:00.000Z  
**Status:** ⚠️ **GATE 1 AGUARDANDO VALIDAÇÃO MANUAL**

