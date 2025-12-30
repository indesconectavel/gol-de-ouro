# 🔧 SOLUÇÃO FINAL - CORRIGIR RPC UUID PARA INTEGER

## ✅ DIAGNÓSTICO COMPLETO

### Verificações Realizadas:
- ✅ **Tabela transacoes:** `referencia_id` é INTEGER (correto)
- ✅ **Triggers:** Nenhum trigger na tabela transacoes (0 rows)
- ✅ **Código JavaScript:** Não passa `referenceId` (correto)
- ⚠️ **RPC:** Precisa ver código completo para identificar problema

---

## 🔍 PRÓXIMO PASSO: VER CÓDIGO COMPLETO DA RPC

### No Supabase SQL Editor, execute:

```sql
-- Ver código completo da função
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'rpc_deduct_balance'
AND pronamespace = 'public'::regnamespace;
```

**Isso mostrará o código completo da RPC para identificarmos onde está o problema.**

---

## 💡 POSSÍVEIS CAUSAS

### Causa 1: RPC Está Usando `usuario_id` como `referencia_id`

**Se a RPC tiver algo como:**
```sql
p_reference_id := p_user_id;  -- ERRADO: usuario_id é UUID, referencia_id é INTEGER
```

**Correção:** Garantir que `p_reference_id` seja sempre NULL ou INTEGER válido.

### Causa 2: RPC Está Tentando Converter UUID para INTEGER

**Se a RPC tiver algo como:**
```sql
referencia_id := p_user_id::INTEGER;  -- ERRADO: Não pode converter UUID para INTEGER
```

**Correção:** Remover essa conversão ou usar NULL.

### Causa 3: RPC Está Usando ID da Transação (UUID) como referencia_id

**Se a RPC tiver algo como:**
```sql
referencia_id := v_transaction_id;  -- Se v_transaction_id for UUID, está errado
```

**Correção:** Garantir que `v_transaction_id` seja INTEGER (ID da transação criada).

---

## 🛠️ SOLUÇÃO PROVÁVEL

### Baseado no Erro:

O UUID no erro (`7942b74a-f601-4acf-80e1-0051af8c2201`) pode ser:
- Um ID de transação anterior (se a tabela `transacoes.id` for UUID)
- Um `usuario_id` sendo usado incorretamente
- Algum valor sendo convertido incorretamente

### Correção na RPC:

**A RPC deve garantir que `p_reference_id` seja sempre NULL ou INTEGER:**

```sql
-- Na RPC, antes da inserção:
-- Garantir que p_reference_id seja válido
IF p_reference_id IS NOT NULL THEN
  -- Validar que é INTEGER válido
  IF p_reference_id::TEXT !~ '^[0-9]+$' THEN
    -- Não é número válido, usar NULL
    p_reference_id := NULL;
  END IF;
END IF;
```

---

## 📋 CHECKLIST

- [x] Verificar estrutura da tabela transacoes
- [x] Verificar triggers (nenhum encontrado)
- [x] Verificar código JavaScript (correto)
- [ ] **Ver código completo da RPC** ← PRÓXIMO PASSO
- [ ] Identificar onde está o problema
- [ ] Corrigir RPC
- [ ] Retestar

---

## 🎯 AÇÃO IMEDIATA

**Execute no Supabase SQL Editor:**

```sql
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'rpc_deduct_balance'
AND pronamespace = 'public'::regnamespace;
```

**Depois, compartilhe o código completo da RPC para identificarmos exatamente onde está o problema.**

---

**Data:** 2025-12-10 13:05 UTC  
**Status:** 🔍 AGUARDANDO CÓDIGO COMPLETO DA RPC  
**Prioridade:** 🔴 ALTA - Bloqueia funcionamento da RPC

