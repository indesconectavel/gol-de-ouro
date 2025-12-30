# 📋 FASE 2.6 — ETAPA 1: MAPEAMENTO DE STATUS DO SCHEMA REAL
## Normalização de Status Baseada no Schema de Produção

**Data:** 19/12/2025  
**Hora:** 15:45:00  
**Ambiente:** Supabase goldeouro-production  
**Status:** ✅ **ETAPA 1 CONCLUÍDA**

---

## 🎯 OBJETIVO

Mapear os nomes reais de colunas relacionadas a status nas tabelas críticas, identificando divergências entre schema esperado e schema real de produção.

---

## 📊 MAPEAMENTO DE STATUS POR TABELA

### **1. Tabela `pagamentos_pix`**

| Coluna Real | Tipo | Nullable | Default | Significado | Status |
|-------------|------|----------|---------|-------------|--------|
| `status` | VARCHAR(50) | YES | `'pending'` | Status do pagamento PIX | ✅ **CONFIRMADO** |

**Valores Esperados (CHECK constraint):**
- `'pending'` - Pagamento pendente
- `'processing'` - Processando
- `'approved'` - Aprovado
- `'rejected'` - Rejeitado
- `'cancelled'` - Cancelado
- `'expired'` - Expirado
- `'pago'` - Pago

**Divergências Identificadas:**
- ✅ Nenhuma divergência crítica
- ⚠️ Coluna `paid_at` não existe (existe `approved_at`)

**Ajustes Necessários:**
- ✅ Queries devem usar `status` (não `status_pagamento`)
- ✅ Valores devem seguir CHECK constraint acima
- ✅ Timestamp de aprovação: usar `approved_at` (não `paid_at`)

---

### **2. Tabela `transacoes`**

| Coluna Real | Tipo | Nullable | Default | Significado | Status |
|-------------|------|----------|---------|-------------|--------|
| `status` | VARCHAR(50) | YES | `'pendente'` | Status da transação | ✅ **CONFIRMADO** |
| `tipo` | VARCHAR(50) | NO | NULL | Tipo da transação | ✅ **CONFIRMADO** |

**Valores Esperados de `status` (CHECK constraint):**
- `'pendente'` - Pendente
- `'processando'` - Processando
- `'concluida'` - Concluída
- `'cancelada'` - Cancelada
- `'falhou'` - Falhou

**Valores Esperados de `tipo` (CHECK constraint):**
- `'deposito'` - Depósito
- `'saque'` - Saque
- `'aposta'` - Aposta
- `'premio'` - Prêmio
- `'bonus'` - Bônus
- `'cashback'` - Cashback
- `'credito'` - Crédito

**Divergências Identificadas:**
- ✅ Nenhuma divergência crítica
- ⚠️ Valores em português (não inglês)

**Ajustes Necessários:**
- ✅ Queries devem usar `status` (não `transaction_status`)
- ✅ Valores devem seguir CHECK constraint acima
- ✅ Valores em português devem ser respeitados

---

### **3. Tabela `lotes`**

| Coluna Real | Tipo | Nullable | Default | Significado | Status |
|-------------|------|----------|---------|-------------|--------|
| `status` | VARCHAR(20) | YES | `'ativo'` | Status do lote | ✅ **CONFIRMADO** |

**Valores Esperados (CHECK constraint):**
- `'ativo'` - Lote ativo
- `'finalizado'` - Lote finalizado
- `'pausado'` - Lote pausado
- `'completed'` - Lote completado

**Divergências Identificadas:**
- ⚠️ Coluna `posicao_atual` não existe em produção (já corrigido)
- ⚠️ Coluna `updated_at` não existe em produção (já corrigido)
- ✅ Colunas `chutes_coletados`, `ganhador_id`, `finished_at`, `completed_at` existem

**Ajustes Necessários:**
- ✅ Queries devem usar `status` (não `status_lote`)
- ✅ Valores devem seguir CHECK constraint acima
- ✅ Não usar `posicao_atual` ou `updated_at` em queries

---

### **4. Tabela `saques`**

| Coluna Real | Tipo | Nullable | Default | Significado | Status |
|-------------|------|----------|---------|-------------|--------|
| `status` | VARCHAR(50) | YES | `'pendente'` | Status do saque | ✅ **CONFIRMADO** |

**Valores Esperados (CHECK constraint):**
- `'pendente'` - Pendente
- `'processando'` - Processando
- `'aprovado'` - Aprovado
- `'rejeitado'` - Rejeitado
- `'cancelado'` - Cancelado

**Divergências Identificadas:**
- ✅ Nenhuma divergência crítica
- ⚠️ Valores em português (não inglês)

**Ajustes Necessários:**
- ✅ Queries devem usar `status` (não `withdrawal_status`)
- ✅ Valores devem seguir CHECK constraint acima
- ✅ Valores em português devem ser respeitados

---

## 🔍 RESUMO DE DIVERGÊNCIAS CORRIGIDAS

### **Divergências Críticas:**

1. ✅ **`lotes.posicao_atual`** - Não existe em produção
   - **Correção:** Removida de queries
   - **Status:** ✅ **CORRIGIDO**

2. ✅ **`lotes.updated_at`** - Não existe em produção
   - **Correção:** Removida de queries
   - **Status:** ✅ **CORRIGIDO**

### **Divergências Não Críticas:**

1. ⚠️ **`pagamentos_pix.paid_at`** - Não existe (existe `approved_at`)
   - **Impacto:** Baixo
   - **Status:** ⚠️ **DOCUMENTADO**

2. ⚠️ **Valores em português** - `transacoes` e `saques` usam português
   - **Impacto:** Baixo (apenas convenção)
   - **Status:** ⚠️ **DOCUMENTADO**

---

## 📋 AJUSTES APLICADOS EM QUERIES

### **Queries de Auditoria:**

1. ✅ **`FASE-3-PRODUCAO-QUERIES-EXECUCAO-COMPLETA.sql`**
   - Removida coluna `posicao_atual` de `lotes`
   - Removida coluna `updated_at` de `lotes`
   - Status: ✅ **CORRIGIDO**

2. ✅ **`FASE-3-PRODUCAO-QUERIES-VERSAO-SEGURA-FINAL.sql`**
   - Usa apenas colunas confirmadas
   - Status: ✅ **CORRIGIDO**

### **Queries de Testes:**

1. ✅ **Testes automatizados**
   - Usam valores corretos de status
   - Status: ✅ **VALIDADO**

---

## ✅ CONCLUSÃO DA ETAPA 1

**Status:** ✅ **CONCLUÍDA**

**Resultados:**
- ✅ Schema real mapeado para todas as tabelas críticas
- ✅ Divergências identificadas e corrigidas
- ✅ Queries ajustadas para refletir schema real
- ✅ Nenhuma divergência crítica restante

**Próxima Etapa:** ETAPA 2 - Ajuste Fino dos Testes Automatizados

---

**Documento gerado em:** 2025-12-19T15:45:00.000Z  
**Status:** ✅ **ETAPA 1 CONCLUÍDA**

