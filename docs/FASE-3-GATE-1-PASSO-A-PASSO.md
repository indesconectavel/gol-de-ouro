# 🔐 FASE 3 — GATE 1: PASSO A PASSO COMPLETO
## Guia Detalhado para Validação de Configuração de Produção

**Data:** 19/12/2025  
**Hora:** 16:18:00  
**Fase:** 3 - GO-LIVE CONTROLADO  

---

## 🎯 OBJETIVO

Validar todas as variáveis de ambiente críticas, URLs públicas, CORS e Rate Limit antes do deploy.

---

## 📋 PASSO A PASSO COMPLETO

### **ETAPA 1: Acessar Fly.io Dashboard**

#### **1.1. Login no Fly.io**

1. Acesse: https://fly.io/dashboard
2. Faça login com suas credenciais
3. Confirme que está autenticado

**✅ Checkpoint:** Você deve estar logado no Fly.io Dashboard

---

#### **1.2. Selecionar Aplicação**

1. No dashboard, localize a aplicação: **`goldeouro-backend-v2`**
2. Clique na aplicação para abrir os detalhes

**✅ Checkpoint:** Você deve estar na página da aplicação `goldeouro-backend-v2`

---

### **ETAPA 2: Validar Variáveis de Ambiente**

#### **2.1. Acessar Secrets (Variáveis de Ambiente)**

1. Na página da aplicação, clique em **"Settings"** (Configurações)
2. No menu lateral, clique em **"Secrets"** (ou "Environment Variables")
3. Você verá uma lista de todas as variáveis de ambiente configuradas

**✅ Checkpoint:** Você deve ver a lista de secrets/variáveis de ambiente

---

#### **2.2. Validar Variáveis Obrigatórias**

Para cada variável abaixo, verifique:

**⚠️ IMPORTANTE:** NÃO exponha os valores completos por segurança. Apenas confirme que estão definidas e não estão vazias.

---

##### **✅ Variável 1: SUPABASE_URL**

**O que verificar:**
- [ ] Variável está presente na lista
- [ ] Valor não está vazio
- [ ] Valor começa com `https://`
- [ ] Valor contém `supabase.co` (não deve ser staging/dev)

**Valor esperado:** `https://[project-id].supabase.co`

**Como validar:**
- Verifique se o valor aponta para o projeto de produção
- Confirme que não é URL de staging ou desenvolvimento

**✅ Checkpoint:** SUPABASE_URL está definida e aponta para produção

---

##### **✅ Variável 2: SUPABASE_SERVICE_ROLE_KEY**

**O que verificar:**
- [ ] Variável está presente na lista
- [ ] Valor não está vazio
- [ ] Valor começa com `eyJ` (formato JWT)
- [ ] É `service_role_key` (não `anon_key`)

**Valor esperado:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Como validar:**
- Confirme que é a chave de serviço (não anon key)
- Verifique que tem permissões adequadas

**✅ Checkpoint:** SUPABASE_SERVICE_ROLE_KEY está definida e é service_role_key

---

##### **✅ Variável 3: JWT_SECRET**

**O que verificar:**
- [ ] Variável está presente na lista
- [ ] Valor não está vazio
- [ ] Valor tem pelo menos 32 caracteres
- [ ] Valor não é padrão/exemplo (ex: `goldeouro-secret-key-2025-ultra-secure`)

**Valor esperado:** String aleatória e segura (mínimo 32 caracteres)

**Como validar:**
- Confirme que não é valor de exemplo
- Verifique complexidade adequada

**✅ Checkpoint:** JWT_SECRET está definida e é segura

---

##### **✅ Variável 4: MERCADOPAGO_ACCESS_TOKEN**

**O que verificar:**
- [ ] Variável está presente na lista
- [ ] Valor não está vazio
- [ ] Valor começa com `APP_USR-` (produção) ou `TEST-` (sandbox)
- [ ] **IMPORTANTE:** Deve ser token de PRODUÇÃO (não sandbox)

**Valor esperado:** `APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Como validar:**
- Confirme que é token de PRODUÇÃO (não sandbox/teste)
- Verifique que token não está expirado

**✅ Checkpoint:** MERCADOPAGO_ACCESS_TOKEN está definida e é de produção

---

##### **✅ Variável 5: ADMIN_TOKEN**

**O que verificar:**
- [ ] Variável está presente na lista
- [ ] Valor não está vazio
- [ ] Valor não é padrão/exemplo (ex: `goldeouro123`)

**Valor esperado:** Token seguro e único

**Como validar:**
- Confirme que não é valor de exemplo
- Verifique que é único e seguro

**✅ Checkpoint:** ADMIN_TOKEN está definida e é segura

---

##### **✅ Variável 6: NODE_ENV**

**O que verificar:**
- [ ] Variável está presente na lista
- [ ] Valor é exatamente `production`
- [ ] Valor NÃO é `development` ou `staging`

**Valor esperado:** `production`

**Como validar:**
- Confirme que é exatamente `production`
- Verifique que não há espaços extras

**✅ Checkpoint:** NODE_ENV está definida como `production`

---

##### **✅ Variável 7: PORT**

**O que verificar:**
- [ ] Variável está presente na lista (ou usa padrão do Fly.io)
- [ ] Valor é `8080` (padrão Fly.io) ou outro valor válido

**Valor esperado:** `8080` (padrão Fly.io)

**Como validar:**
- Confirme que porta está definida
- Verifique que é porta válida

**✅ Checkpoint:** PORT está definida ou usa padrão

---

##### **✅ Variável 8: CORS_ORIGIN**

**O que verificar:**
- [ ] Variável está presente na lista (ou usa padrão do código)
- [ ] Valor contém URLs de produção (não localhost)
- [ ] Valor NÃO contém `*` (wildcard)

**Valor esperado:** `https://app.goldeouro.lol,https://admin.goldeouro.lol` (ou similar)

**Como validar:**
- Confirme que URLs são de produção
- Verifique que não inclui localhost em produção

**✅ Checkpoint:** CORS_ORIGIN está definida corretamente

---

### **ETAPA 3: Validar URLs Públicas**

#### **3.1. Validar Backend (Healthcheck)**

**URL:** `https://goldeouro-backend-v2.fly.dev/health`

**Como validar:**

**Opção 1: Via Navegador**
1. Abra uma nova aba no navegador
2. Acesse: `https://goldeouro-backend-v2.fly.dev/health`
3. Verifique que retorna JSON com `{"status":"ok"}` ou similar

**Opção 2: Via PowerShell**
```powershell
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method GET
```

**O que verificar:**
- [ ] URL está acessível
- [ ] Retorna status HTTP 200
- [ ] Retorna JSON válido
- [ ] Response time < 2 segundos

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "version": "1.2.0",
  "database": "connected",
  "mercadoPago": "connected"
}
```

**✅ Checkpoint:** Healthcheck do backend está funcionando

---

#### **3.2. Validar Frontend Player**

**URL:** `https://app.goldeouro.lol` ou `https://player.goldeouro.lol`

**Como validar:**

1. Abra uma nova aba no navegador
2. Acesse a URL do frontend player
3. Verifique que página carrega sem erros

**O que verificar:**
- [ ] URL está acessível
- [ ] Página carrega corretamente
- [ ] Nenhum erro crítico no console do navegador (F12)
- [ ] Assets carregam corretamente

**✅ Checkpoint:** Frontend Player está acessível

---

#### **3.3. Validar Frontend Admin**

**URL:** `https://admin.goldeouro.lol`

**Como validar:**

1. Abra uma nova aba no navegador
2. Acesse a URL do frontend admin
3. Verifique que página carrega sem erros

**O que verificar:**
- [ ] URL está acessível
- [ ] Página carrega corretamente
- [ ] Nenhum erro crítico no console do navegador (F12)
- [ ] Assets carregam corretamente

**✅ Checkpoint:** Frontend Admin está acessível

---

### **ETAPA 4: Validar CORS e Rate Limit**

#### **4.1. Validar CORS (já validado no código)**

**Status:** ✅ **VALIDADO NO CÓDIGO**

O código já está configurado corretamente em `server-fly.js`:
- CORS configurado para origens de produção
- Headers permitidos: `Content-Type`, `Authorization`, `X-Requested-With`, `X-Idempotency-Key`

**✅ Checkpoint:** CORS está configurado corretamente no código

---

#### **4.2. Validar Rate Limit (já validado no código)**

**Status:** ✅ **VALIDADO NO CÓDIGO**

O código já está configurado corretamente em `server-fly.js`:
- Janela: 15 minutos (900000ms)
- Máximo: 100 requisições por IP
- Healthcheck excluído do rate limit

**✅ Checkpoint:** Rate Limit está configurado corretamente no código

---

### **ETAPA 5: Registrar Resultados**

#### **5.1. Preencher Checklist**

Use o documento `docs/FASE-3-GATE-1-CONFIGURACAO.md` para registrar:

- ✅ Status de cada variável (OK / Atenção / Bloqueador)
- ✅ Observações sobre valores encontrados
- ✅ Problemas identificados (se houver)

---

#### **5.2. Classificar Riscos**

**Para cada item, classifique:**

- ✅ **OK:** Tudo correto
- ⚠️ **ATENÇÃO:** Problema não crítico (ex: valor padrão)
- ❌ **BLOQUEADOR:** Problema crítico que impede deploy

---

## 📊 CHECKLIST DE VALIDAÇÃO

### **Variáveis de Ambiente:**

- [ ] SUPABASE_URL - OK / Atenção / Bloqueador
- [ ] SUPABASE_SERVICE_ROLE_KEY - OK / Atenção / Bloqueador
- [ ] JWT_SECRET - OK / Atenção / Bloqueador
- [ ] MERCADOPAGO_ACCESS_TOKEN - OK / Atenção / Bloqueador
- [ ] ADMIN_TOKEN - OK / Atenção / Bloqueador
- [ ] NODE_ENV - OK / Atenção / Bloqueador
- [ ] PORT - OK / Atenção / Bloqueador
- [ ] CORS_ORIGIN - OK / Atenção / Bloqueador

### **URLs Públicas:**

- [ ] Backend Healthcheck - OK / Atenção / Bloqueador
- [ ] Frontend Player - OK / Atenção / Bloqueador
- [ ] Frontend Admin - OK / Atenção / Bloqueador

### **Configurações:**

- [ ] CORS - OK (validado no código)
- [ ] Rate Limit - OK (validado no código)

---

## ⚠️ CRITÉRIOS DE DECISÃO

### **✅ APTO:**

- ✅ Todas as variáveis obrigatórias estão definidas
- ✅ Nenhum valor está vazio
- ✅ URLs são de produção (não staging/dev)
- ✅ Tokens são de produção (não sandbox)
- ✅ NODE_ENV é `production`

---

### **⚠️ APTO COM RESSALVAS:**

- ⚠️ Algumas variáveis têm valores padrão (mas funcionais)
- ⚠️ Algumas URLs podem estar em staging (mas funcionais)
- ⚠️ Algumas configurações podem ser melhoradas

---

### **❌ NÃO APTO:**

- ❌ Variável obrigatória não definida
- ❌ Valor crítico está vazio
- ❌ Token de sandbox em produção
- ❌ NODE_ENV não é `production`
- ❌ URL de staging em produção

---

## 📝 TEMPLATE DE REGISTRO

Copie e preencha:

```markdown
## Resultados da Validação GATE 1

**Data:** _____________
**Hora:** _____________

### Variáveis de Ambiente:

| Variável | Status | Observação |
|----------|--------|------------|
| SUPABASE_URL | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| SUPABASE_SERVICE_ROLE_KEY | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| JWT_SECRET | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| MERCADOPAGO_ACCESS_TOKEN | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| ADMIN_TOKEN | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| NODE_ENV | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| PORT | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| CORS_ORIGIN | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |

### URLs Públicas:

| URL | Status | Observação |
|-----|--------|------------|
| Backend Healthcheck | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| Frontend Player | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |
| Frontend Admin | ⬜ OK / ⬜ Atenção / ⬜ Bloqueador | |

### Decisão Final:

⬜ ✅ APTO PARA DEPLOY
⬜ ⚠️ APTO COM RESSALVAS
⬜ ❌ NÃO APTO

**Observações:**
_________________________________________________
_________________________________________________
```

---

## ✅ CONCLUSÃO

Após completar todas as etapas:

1. ✅ Todas as variáveis validadas
2. ✅ Todas as URLs validadas
3. ✅ CORS e Rate Limit validados
4. ✅ Resultados registrados
5. ✅ Decisão final tomada

**Próximo Passo:** Atualizar `docs/FASE-3-GATE-1-CONFIGURACAO.md` com os resultados

---

**Documento gerado em:** 2025-12-19T16:18:00.000Z  
**Status:** ✅ **PASSO A PASSO COMPLETO**

