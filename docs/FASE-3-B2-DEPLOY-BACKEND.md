# 📋 FASE 3 — BLOCO B2: DEPLOY BACKEND
## Deploy Controlado da Engine V19

**Data:** 19/12/2025  
**Hora:** 16:01:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

---

## 🎯 OBJETIVO

Executar deploy controlado do backend (Engine V19) sem migrations automáticas, validando healthcheck, conexão com Supabase e endpoints críticos.

---

## ⚠️ REGRAS ABSOLUTAS

- ❌ **NÃO executar migrations automáticas**
- ✅ **Validar cada etapa antes de prosseguir**
- ✅ **Registrar timestamps e hashes**
- ✅ **Capacidade de rollback imediato**

---

## 📋 PROCEDIMENTO DE DEPLOY

### **ETAPA 1: Preparação Pré-Deploy**

#### **1.1. Confirmar Estado Atual**

```bash
# Verificar branch atual
git branch --show-current

# Verificar último commit
git log -1 --oneline

# Verificar tag
git tag -l | grep v1.0.0-pre-deploy
```

**Validação:**
- ✅ Deve estar no branch `release-v1.0.0`
- ✅ Tag `v1.0.0-pre-deploy` deve existir
- ✅ Último commit deve conter alterações da FASE 2.6

---

#### **1.2. Verificar Variáveis de Ambiente**

```bash
# Listar secrets do Fly.io
fly secrets list

# Verificar variáveis críticas (sem exibir valores)
fly secrets list | grep -E "JWT_SECRET|SUPABASE|MERCADOPAGO|NODE_ENV"
```

**Validação:**
- ✅ Todas as variáveis obrigatórias devem estar definidas
- ✅ `NODE_ENV` deve ser `production`
- ✅ Tokens devem estar configurados

---

### **ETAPA 2: Deploy do Backend**

#### **2.1. Executar Deploy**

**⚠️ IMPORTANTE:** Não executar migrations automáticas

```bash
# Deploy no Fly.io
fly deploy --no-migrations

# OU se não houver flag --no-migrations:
fly deploy
# ⚠️ Cancelar se tentar executar migrations automaticamente
```

**Registrar:**
- ✅ Timestamp do deploy: `_____________`
- ✅ Hash do commit deployado: `_____________`
- ✅ Versão deployada: `v1.0.0-pre-deploy`

---

#### **2.2. Monitorar Deploy**

**Acompanhar logs durante deploy:**
```bash
# Monitorar logs em tempo real
fly logs

# OU
fly logs --app goldeouro-backend-v2
```

**Validação:**
- ✅ Deploy deve completar sem erros
- ✅ Servidor deve iniciar corretamente
- ✅ Nenhum erro crítico nos logs

---

### **ETAPA 3: Validação Pós-Deploy**

#### **3.1. Healthcheck**

**Endpoint:** `GET /health`  
**URL:** `https://goldeouro-backend-v2.fly.dev/health`

**Validação:**
```bash
# Testar healthcheck
curl https://goldeouro-backend-v2.fly.dev/health

# OU via PowerShell
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method GET
```

**Resposta Esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T16:01:00.000Z",
  "version": "1.2.0",
  "database": "connected",
  "mercadoPago": "connected"
}
```

**Validação:**
- ✅ Status deve ser `ok`
- ✅ Database deve estar `connected`
- ✅ Mercado Pago deve estar `connected`
- ✅ Response time < 2 segundos

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

#### **3.2. Conexão com Supabase**

**Validação:**
- ✅ Healthcheck deve mostrar `database: "connected"`
- ✅ Verificar logs para mensagem "Conectado ao Supabase"
- ✅ Testar query simples (via endpoint de teste)

**Endpoint de Teste (se existir):**
```bash
# Testar conexão com Supabase
curl https://goldeouro-backend-v2.fly.dev/api/test/db
```

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

#### **3.3. Endpoints Críticos**

**3.3.1. Login**

**Endpoint:** `POST /api/auth/login`  
**Método:** POST  
**Body:**
```json
{
  "email": "teste@example.com",
  "password": "senha123"
}
```

**Validação:**
- ✅ Deve retornar 200 ou 401 (não 500)
- ✅ Se 200, deve retornar token e refreshToken
- ✅ Response time < 3 segundos

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.3.2. Saldo**

**Endpoint:** `GET /api/user/profile`  
**Método:** GET  
**Headers:** `Authorization: Bearer <token>`

**Validação:**
- ✅ Deve retornar 200 com dados do usuário
- ✅ Deve incluir campo `saldo`
- ✅ Response time < 2 segundos

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.3.3. Chute**

**Endpoint:** `POST /api/games/shoot`  
**Método:** POST  
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "direcao": "C",
  "valor_aposta": 1.00
}
```

**Validação:**
- ✅ Deve retornar 200 ou 400 (não 500)
- ✅ Se 400, deve ser por saldo insuficiente (esperado)
- ✅ Response time < 3 segundos

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.3.4. Criação de PIX**

**Endpoint:** `POST /api/payments/pix/criar`  
**Método:** POST  
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "amount": 10.00
}
```

**Validação:**
- ✅ Deve retornar 200 com dados do PIX
- ✅ Deve incluir `qr_code` ou `qr_code_base64`
- ✅ Deve incluir `payment_id`
- ✅ Response time < 5 segundos

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

## 📊 REGISTRO DE DEPLOY

### **Informações do Deploy:**

| Item | Valor |
|------|-------|
| **Timestamp** | `_____________` |
| **Commit Hash** | `_____________` |
| **Tag** | `v1.0.0-pre-deploy` |
| **Branch** | `release-v1.0.0` |
| **Versão** | `1.2.0` |
| **Ambiente** | `production` |

---

### **Validações Realizadas:**

| Validação | Status | Timestamp | Observações |
|-----------|--------|-----------|-------------|
| Healthcheck | ⏸️ | - | - |
| Conexão Supabase | ⏸️ | - | - |
| Login | ⏸️ | - | - |
| Saldo | ⏸️ | - | - |
| Chute | ⏸️ | - | - |
| Criação PIX | ⏸️ | - | - |

---

## ⚠️ GATES DE SEGURANÇA

### **Gate 1: Healthcheck**

**Condição:** Healthcheck deve retornar `ok`  
**Ação se falhar:** ⛔ **ABORTAR E EXECUTAR ROLLBACK**

---

### **Gate 2: Conexão Supabase**

**Condição:** Database deve estar `connected`  
**Ação se falhar:** ⛔ **ABORTAR E EXECUTAR ROLLBACK**

---

### **Gate 3: Endpoints Críticos**

**Condição:** Todos os endpoints críticos devem funcionar  
**Ação se falhar:** ⛔ **ABORTAR E EXECUTAR ROLLBACK**

---

## ✅ CONCLUSÃO DO DEPLOY BACKEND

**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

**Próximo Passo:** BLOCO B3 - Deploy UI (se aplicável)

**Observações:**
- ⚠️ Deploy requer execução manual
- ✅ Procedimentos claros definidos
- ✅ Validações obrigatórias documentadas

---

**Documento gerado em:** 2025-12-19T16:01:00.000Z  
**Status:** ✅ **BLOCO B2 DOCUMENTADO - PRONTO PARA EXECUÇÃO**

