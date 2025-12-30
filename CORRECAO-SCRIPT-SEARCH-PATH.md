# ✅ CORREÇÃO - Script Search Path

## ⚠️ PROBLEMA IDENTIFICADO

Ao executar o script `database/aplicar-search-path-todas-rpcs-financeiras.sql`, ocorreu o erro:

```
ERROR: 42883: function public.rpc_get_balance(uuid) does not exist
```

## 🔍 CAUSA

A função `rpc_get_balance` tem **2 parâmetros**, não apenas 1:
- `p_user_id UUID`
- `p_with_lock BOOLEAN DEFAULT false`

O script estava usando apenas `UUID` como assinatura, mas precisa incluir ambos os parâmetros.

## ✅ CORREÇÃO APLICADA

O script foi corrigido para incluir o segundo parâmetro `BOOLEAN`:

```sql
ALTER FUNCTION public.rpc_get_balance(
  UUID,
  BOOLEAN  -- ✅ Adicionado segundo parâmetro
) SET search_path = public;
```

## 📝 ASSINATURAS CORRETAS DAS RPCs

### 1. rpc_add_balance
```sql
ALTER FUNCTION public.rpc_add_balance(
  UUID,
  DECIMAL(10,2),
  TEXT,
  INTEGER,
  VARCHAR(50)
) SET search_path = public;
```

### 2. rpc_deduct_balance
```sql
ALTER FUNCTION public.rpc_deduct_balance(
  UUID,
  DECIMAL(10,2),
  TEXT,
  INTEGER,
  VARCHAR(50),
  BOOLEAN
) SET search_path = public;
```

### 3. rpc_transfer_balance
```sql
ALTER FUNCTION public.rpc_transfer_balance(
  UUID,
  UUID,
  DECIMAL(10,2),
  TEXT
) SET search_path = public;
```

### 4. rpc_get_balance ✅ CORRIGIDO
```sql
ALTER FUNCTION public.rpc_get_balance(
  UUID,
  BOOLEAN  -- ✅ Segundo parâmetro adicionado
) SET search_path = public;
```

## 🎯 PRÓXIMO PASSO

1. **Executar o script corrigido** no Supabase SQL Editor
2. **Verificar** que todas as 4 RPCs foram atualizadas
3. **Confirmar** que a query de verificação mostra `{search_path=public}` para todas

---

**Status:** ✅ Script corrigido e pronto para execução

