# 💸 FASE 3 — GATE 4: FLUXO FINANCEIRO (PIX)
## Validação do Fluxo de Pagamento PIX com Máximo Cuidado

**Data:** 19/12/2025  
**Hora:** 16:13:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

---

## 🎯 OBJETIVO

Criar 1 PIX de teste (valor mínimo possível) para validar endpoint, registro no banco e status inicial. NÃO é obrigatório pagar o PIX.

---

## ⚠️ REGRAS CRÍTICAS

- ✅ **MÁXIMO CUIDADO** com operações financeiras
- ✅ Usar valor **MÍNIMO POSSÍVEL** (ex: R$ 1,00)
- ✅ Validar criação e persistência apenas
- ❌ NÃO é obrigatório pagar o PIX
- ⚠️ Se houver qualquer risco financeiro → **INTERROMPER E DOCUMENTAR**

---

## 📋 VALIDAÇÃO DO FLUXO FINANCEIRO

### **TESTE 1: Criar PIX de Teste**

#### **1.1. Preparação**

**Endpoint:** `POST /api/payments/pix/criar`  
**URL:** `https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar`  
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "amount": 1.00
}
```

**⚠️ IMPORTANTE:**
- ✅ Usar valor mínimo (R$ 1,00)
- ✅ Usar token válido obtido no GATE 3
- ✅ Documentar tudo

---

#### **1.2. Execução**

**Comando de Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":1.00}'
```

**Validação:**
- ✅ Deve retornar 200 (sucesso)
- ✅ NÃO deve retornar 500 (erro do servidor)
- ✅ Response time < 5 segundos

**Status:** ⏸️ **AGUARDANDO EXECUÇÃO**

**Resultado:** `_____________`

---

#### **1.3. Validação da Resposta**

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "payment_id": "138604034392",
    "qr_code": "00020126...",
    "qr_code_base64": "data:image/png;base64,...",
    "pix_copy_paste": "00020126...",
    "status": "pending",
    "amount": 1.00
  }
}
```

**Validações:**
- ✅ Campo `payment_id` deve estar presente
- ✅ Campo `qr_code` ou `qr_code_base64` deve estar presente
- ✅ Campo `status` deve ser `pending`
- ✅ Campo `amount` deve corresponder ao valor enviado

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

### **TESTE 2: Validar Registro no Banco**

#### **2.1. Preparação**

**Query SQL:**
```sql
SELECT 
    id,
    usuario_id,
    payment_id,
    amount,
    status,
    created_at
FROM pagamentos_pix
WHERE payment_id = '<payment_id_obtido_no_teste_1>'
ORDER BY created_at DESC
LIMIT 1;
```

**Payment ID:** Obter do TESTE 1

---

#### **2.2. Execução**

**Local:** Supabase SQL Editor (goldeouro-production)

**Validação:**
- ✅ Registro deve existir na tabela `pagamentos_pix`
- ✅ `payment_id` deve corresponder ao retornado pela API
- ✅ `amount` deve corresponder ao valor enviado
- ✅ `status` deve ser `pending`
- ✅ `usuario_id` deve corresponder ao usuário logado

**Status:** ⏸️ **AGUARDANDO EXECUÇÃO**

**Resultado:** `_____________`

---

#### **2.3. Validação da Integridade**

**Validações:**
- ✅ Registro deve estar completo
- ✅ Dados devem corresponder ao retornado pela API
- ✅ Timestamp `created_at` deve ser recente
- ✅ Nenhum campo crítico deve estar NULL

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

### **TESTE 3: Validar Status Inicial**

#### **3.1. Preparação**

**Validação:** Status inicial deve ser consistente

**Status Esperado:** `pending`

---

#### **3.2. Validação**

**Validações:**
- ✅ Status inicial deve ser `pending`
- ✅ `expires_at` deve estar definido (se coluna existir)
- ✅ QR Code deve estar presente
- ✅ Dados devem estar completos

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

## ⚠️ CRITÉRIOS DE INTERRUPÇÃO

### **Se Qualquer Um Destes Ocorrer → INTERROMPER:**

1. ❌ **Erro 500** ao criar PIX
2. ❌ **Registro não criado** no banco
3. ❌ **Dados inconsistentes** entre API e banco
4. ❌ **Valor incorreto** registrado
5. ❌ **Status inconsistente**

**Ação:** ⛔ **INTERROMPER E DOCUMENTAR**

---

## 📊 RESUMO DE VALIDAÇÃO

### **Resultados dos Testes:**

| Teste | Status | Resultado | Observações |
|-------|--------|-----------|-------------|
| **Criar PIX** | ⏸️ | - | - |
| **Registro no Banco** | ⏸️ | - | - |
| **Status Inicial** | ⏸️ | - | - |

---

## 📋 EVIDÊNCIA TÉCNICA

### **Dados do PIX Criado:**

| Campo | Valor |
|-------|-------|
| **Payment ID** | `_____________` |
| **Amount** | `R$ 1,00` |
| **Status** | `pending` |
| **Usuario ID** | `_____________` |
| **Created At** | `_____________` |
| **QR Code Presente** | `Sim / Não` |

---

## ⚠️ CLASSIFICAÇÃO DE RISCO

### **Riscos Identificados:**

- ⏸️ **Aguardando execução** para identificar riscos

---

## ✅ CONCLUSÃO DO GATE 4

**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

**Próximo Passo:** CONSOLIDAÇÃO FINAL

**Observações:**
- ⚠️ Teste requer execução manual com máximo cuidado
- ✅ Procedimentos claros definidos
- ✅ Critérios de interrupção estabelecidos

---

**Documento gerado em:** 2025-12-19T16:13:00.000Z  
**Status:** ✅ **GATE 4 PREPARADO - AGUARDANDO EXECUÇÃO**

