# 📋 FASE 3 — BLOCO C1: VALIDAÇÃO IMEDIATA PÓS-DEPLOY
## Checklist de Fumaça (15 Minutos)

**Data:** 19/12/2025  
**Hora:** 16:03:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **CHECKLIST PREPARADO**

---

## 🎯 OBJETIVO

Executar smoke tests reais imediatamente após deploy, validando funcionalidades críticas. Se qualquer falha crítica ocorrer → abortar.

---

## ⚠️ REGRA CRÍTICA

**⛔ SE QUALQUER FALHA CRÍTICA → ABORTAR E EXECUTAR ROLLBACK IMEDIATO**

---

## 📋 CHECKLIST DE FUMAÇA (15 MINUTOS)

### **TESTE 1: Autenticação (2 minutos)**

#### **1.1. Login Player**

**Endpoint:** `POST /api/auth/login`  
**URL:** `https://goldeouro-backend-v2.fly.dev/api/auth/login`

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123"}'
```

**Validação:**
- ✅ Deve retornar 200 ou 401 (não 500)
- ✅ Se 200, deve retornar `token` e `refreshToken`
- ✅ Response time < 3 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **1.2. Login Admin**

**Endpoint:** `POST /api/auth/login` (com token admin)  
**OU:** Header `x-admin-token`

**Validação:**
- ✅ Deve retornar 200 ou 401 (não 500)
- ✅ Se 200, deve retornar token válido
- ✅ Response time < 3 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

### **TESTE 2: Saldo (1 minuto)**

#### **2.1. Obter Saldo**

**Endpoint:** `GET /api/user/profile`  
**Headers:** `Authorization: Bearer <token>`

**Teste:**
```bash
curl -X GET https://goldeouro-backend-v2.fly.dev/api/user/profile \
  -H "Authorization: Bearer <token>"
```

**Validação:**
- ✅ Deve retornar 200 com dados do usuário
- ✅ Deve incluir campo `saldo` (numérico)
- ✅ Response time < 2 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

### **TESTE 3: Jogo (3 minutos)**

#### **3.1. Chute com Saldo**

**Endpoint:** `POST /api/games/shoot`  
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
- ✅ Se 200, deve retornar resultado do chute
- ✅ Response time < 3 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **3.2. Chute sem Saldo**

**Endpoint:** `POST /api/games/shoot`  
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "direcao": "C",
  "valor_aposta": 1000.00
}
```

**Validação:**
- ✅ Deve retornar 400 (saldo insuficiente)
- ✅ Mensagem de erro deve ser clara
- ✅ Response time < 3 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **3.3. Métricas Globais**

**Endpoint:** `GET /api/metrics`  
**OU:** `GET /api/games/metrics`

**Validação:**
- ✅ Deve retornar 200 com métricas
- ✅ Deve incluir contador global
- ✅ Response time < 2 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

### **TESTE 4: Criação de PIX (5 minutos)**

#### **4.1. Criar Pagamento PIX**

**Endpoint:** `POST /api/payments/pix/criar`  
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
- ✅ Deve incluir `status: "pending"`
- ✅ Response time < 5 segundos

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **4.2. Validar PIX no Banco**

**Query SQL:**
```sql
SELECT id, usuario_id, amount, status, payment_id, created_at
FROM pagamentos_pix
ORDER BY created_at DESC
LIMIT 1;
```

**Validação:**
- ✅ PIX deve estar registrado no banco
- ✅ Status deve ser `pending`
- ✅ Dados devem corresponder ao retornado pela API

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

### **TESTE 5: UI Player (2 minutos)**

#### **5.1. Acessar Página**

**URL:** `https://app.goldeouro.lol` ou `https://player.goldeouro.lol`

**Validação:**
- ✅ Página deve carregar sem erros
- ✅ Nenhum erro no console do navegador
- ✅ Login deve estar acessível

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **5.2. Login na UI**

**Fluxo:**
1. Acessar página de login
2. Inserir credenciais
3. Clicar em "Entrar"
4. Validar redirecionamento

**Validação:**
- ✅ Login deve funcionar
- ✅ Redirecionamento deve ocorrer
- ✅ Dashboard deve carregar

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **5.3. Fluxo Completo**

**Etapas:**
1. Dashboard carrega saldo
2. Jogo permite chute
3. PIX permite criar pagamento

**Validação:**
- ✅ Todas as etapas devem funcionar
- ✅ Nenhum erro visível
- ✅ Fluxo completo funcional

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

### **TESTE 6: UI Admin (2 minutos)**

#### **6.1. Acessar Página**

**URL:** `https://admin.goldeouro.lol`

**Validação:**
- ✅ Página deve carregar sem erros
- ✅ Nenhum erro no console do navegador
- ✅ Login deve estar acessível

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

#### **6.2. Login Admin**

**Validação:**
- ✅ Login deve funcionar
- ✅ Dashboard deve carregar
- ✅ Estatísticas devem ser exibidas

**Status:** ⏸️ **AGUARDANDO TESTE**

**Resultado:** `_____________`

---

## 📊 RESUMO DE VALIDAÇÃO

### **Resultados dos Testes:**

| Teste | Status | Tempo | Observações |
|-------|--------|-------|-------------|
| **Login Player** | ⏸️ | - | - |
| **Login Admin** | ⏸️ | - | - |
| **Saldo** | ⏸️ | - | - |
| **Chute com Saldo** | ⏸️ | - | - |
| **Chute sem Saldo** | ⏸️ | - | - |
| **Métricas Globais** | ⏸️ | - | - |
| **Criar PIX** | ⏸️ | - | - |
| **PIX no Banco** | ⏸️ | - | - |
| **UI Player - Página** | ⏸️ | - | - |
| **UI Player - Login** | ⏸️ | - | - |
| **UI Player - Fluxo** | ⏸️ | - | - |
| **UI Admin - Página** | ⏸️ | - | - |
| **UI Admin - Login** | ⏸️ | - | - |

---

## ⚠️ CRITÉRIOS DE ABORTE

### **Falhas Críticas (Abortar Imediatamente):**

1. ❌ **Healthcheck falha** → ⛔ **ABORTAR**
2. ❌ **Login não funciona** → ⛔ **ABORTAR**
3. ❌ **Saldo não carrega** → ⛔ **ABORTAR**
4. ❌ **Chute retorna 500** → ⛔ **ABORTAR**
5. ❌ **PIX não cria** → ⛔ **ABORTAR**
6. ❌ **UI não carrega** → ⛔ **ABORTAR**
7. ❌ **Erro crítico no console** → ⛔ **ABORTAR**

---

## ✅ CONCLUSÃO DA VALIDAÇÃO IMEDIATA

**Status:** ✅ **CHECKLIST PREPARADO**

**Próximo Passo:** 
- ✅ Se todos os testes passarem → Continuar para monitoramento
- ❌ Se qualquer teste crítico falhar → Executar rollback imediato

**Tempo Estimado:** 15 minutos

---

**Documento gerado em:** 2025-12-19T16:03:00.000Z  
**Status:** ✅ **BLOCO C1 PREPARADO - PRONTO PARA EXECUÇÃO**

