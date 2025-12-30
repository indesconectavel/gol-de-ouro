# ✅ SOLUÇÃO DEFINITIVA - CORRIGIR RPC DEDUCT BALANCE

## 🎯 PROBLEMA IDENTIFICADO

**Erro:**
```json
{
  "success": false,
  "error": "invalid input syntax for type integer: \"7942b74a-f601-4acf-80e1-0051af8c2201\""
}
```

**Causa Raiz:**
- ✅ Tabela `transacoes` tem `id` como **UUID** (confirmado no print)
- ❌ RPC declara `v_transaction_id` como **INTEGER** (linha 163)
- ❌ RPC faz `RETURNING id INTO v_transaction_id` (linha 238)
- ❌ **Resultado:** Tentando colocar UUID em variável INTEGER → ERRO!

---

## ✅ SOLUÇÃO

### Aplicar Correção no Supabase SQL Editor

**Projeto:** `goldeouro-production` (gayopagjdrkcmkirmfvy)

**Script:** `database/corrigir-rpc-deduct-balance-uuid.sql`

**O que o script faz:**
1. ✅ Altera `v_transaction_id` de INTEGER para UUID
2. ✅ Adiciona `SET search_path = public` (segurança)
3. ✅ Converte UUID para TEXT no retorno JSON (compatibilidade)

---

## 🧪 APÓS APLICAR A CORREÇÃO

### Retestar a RPC:

```sql
SELECT public.rpc_deduct_balance(
  '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'::UUID,
  5.00::DECIMAL,
  'Teste de débito'::TEXT,
  NULL::INTEGER,
  'aposta'::VARCHAR,
  false::BOOLEAN
);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "old_balance": 50.00,
  "new_balance": 45.00,
  "transaction_id": "7942b74a-f601-4acf-80e1-0051af8c2201",  // UUID como TEXT
  "amount": 5.00
}
```

---

## 📋 CHECKLIST FINAL

- [x] Identificar problema (UUID vs INTEGER)
- [x] Criar script de correção
- [ ] **Aplicar script no Supabase** ← PRÓXIMO PASSO
- [ ] Retestar RPC
- [ ] Retestar endpoint `/api/games/shoot`
- [ ] Validar que jogo está funcionando

---

## 🎯 PRÓXIMOS PASSOS

1. **Copiar script** de `database/corrigir-rpc-deduct-balance-uuid.sql`
2. **Executar no Supabase SQL Editor** (projeto goldeouro-production)
3. **Retestar RPC** com a query acima
4. **Se funcionar**, retestar endpoint do jogo

---

**Data:** 2025-12-10 13:10 UTC  
**Status:** ✅ SOLUÇÃO IDENTIFICADA - ⏳ AGUARDANDO APLICAÇÃO  
**Prioridade:** 🔴 ALTA - Correção crítica para funcionamento da RPC

