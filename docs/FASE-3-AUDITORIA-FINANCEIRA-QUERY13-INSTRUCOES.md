# 🔧 FASE 3 — QUERY 13 CORRIGIDA: INSTRUÇÕES DE EXECUÇÃO
## Como Executar a Query 13 Corrigida no Supabase

**Data:** 20/12/2025  
**Hora:** 00:05:00  
**Status:** ✅ **QUERY CORRIGIDA PRONTA**

---

## 🎯 PROBLEMA IDENTIFICADO

Pelos resultados mostrados, a query no Supabase ainda está usando a versão antiga. Os resultados mostram:
- `saldo_esperado: 60.00` quando deveria ser `110.00` (60 + 50)
- `saldo_esperado: 10.00` quando deveria ser `60.00` (10 + 50)

**Causa:** Query no Supabase não foi atualizada com a correção completa.

---

## ✅ SOLUÇÃO: COPIAR QUERY CORRIGIDA

### **PASSO 1: Abrir Arquivo Corrigido**

1. Abrir arquivo: `docs/FASE-3-AUDITORIA-FINANCEIRA-QUERY13-ISOLADA.sql`
2. Selecionar todo o conteúdo: `Ctrl+A`
3. Copiar: `Ctrl+C`

---

### **PASSO 2: Colar no Supabase**

1. No Supabase SQL Editor, **LIMPAR** a query antiga completamente
2. Colar a query corrigida: `Ctrl+V`
3. Verificar que a query tem os comentários `-- CORRIGIDO` nas linhas corretas

---

### **PASSO 3: Executar**

1. Pressionar: `Ctrl+Enter`
2. OU clicar no botão verde: **"Run"**

---

## 📊 RESULTADOS ESPERADOS

### **Para Depósitos:**
- `saldo_anterior` = R$60,00
- `valor` = R$50,00
- `saldo_posterior` = R$110,00
- `saldo_esperado` = R$60,00 + R$50,00 = **R$110,00** ✅
- `diferenca` = R$110,00 - R$110,00 = **R$0,00** ✅
- `status_validacao` = **"✅ OK"** ✅

### **Para Débitos:**
- `saldo_anterior` = R$1,00
- `valor` = -R$1,00 (já negativo)
- `saldo_posterior` = R$0,00
- `saldo_esperado` = R$1,00 + (-R$1,00) = **R$0,00** ✅
- `diferenca` = R$0,00 - R$0,00 = **R$0,00** ✅
- `status_validacao` = **"✅ OK"** ✅

---

## ⚠️ IMPORTANTE

**Antes de executar:**
- ✅ Verificar que está no projeto: `goldeouro-production`
- ✅ Verificar que está no ambiente: `PRODUCTION`
- ✅ Limpar completamente a query antiga antes de colar a nova

**Após executar:**
- ✅ Verificar que `saldo_esperado` = `saldo_posterior` para depósitos
- ✅ Verificar que `diferenca` = 0 ou muito próximo de 0
- ✅ Verificar que `status_validacao` = "✅ OK" para todas as transações

---

## 🐛 SE AINDA HOUVER PROBLEMAS

Se após executar a query corrigida ainda houver inconsistências:

1. **Verificar se copiou a query completa:**
   - Deve ter 4 ocorrências de `WHEN t.tipo IN ('credito', 'deposito')`
   - Deve ter os comentários `-- CORRIGIDO` em todas as linhas relevantes

2. **Verificar se limpou a query antiga:**
   - Selecionar tudo no editor: `Ctrl+A`
   - Deletar: `Delete`
   - Colar a nova query: `Ctrl+V`

3. **Verificar se executou a query correta:**
   - Verificar que a query no editor mostra `IN ('credito', 'deposito')`
   - Não deve mostrar apenas `= 'credito'`

---

## 📄 ARQUIVOS DISPONÍVEIS

1. ✅ `docs/FASE-3-AUDITORIA-FINANCEIRA-QUERY13-ISOLADA.sql` - Query isolada e corrigida
2. ✅ `docs/FASE-3-AUDITORIA-FINANCEIRA-QUERIES.sql` - Todas as queries (linhas 338-382)

---

**Documento criado em:** 2025-12-20T00:05:00.000Z  
**Status:** ✅ **INSTRUÇÕES COMPLETAS**

