# 💰 GUIA: APLICAR RPCs FINANCEIRAS (rpc_add_balance e rpc_deduct_balance)
## Complemento da Migration V19

---

## ⚠️ IMPORTANTE

As RPCs `rpc_add_balance` e `rpc_deduct_balance` são **NECESSÁRIAS** para o funcionamento do sistema financeiro da ENGINE V19. Elas não estão incluídas na Migration V19 principal e precisam ser aplicadas separadamente.

**Arquivo:** `database/rpc-financial-acid.sql`

---

## 📋 PASSO A PASSO

### PASSO 1: Abrir o Arquivo

No seu computador, abra o arquivo:
```
E:\Chute de Ouro\goldeouro-backend\database\rpc-financial-acid.sql
```

---

### PASSO 2: Copiar o Conteúdo

1. Selecione **TODO o conteúdo** (`Ctrl+A`)
2. Copie (`Ctrl+C`)
3. Verifique que o arquivo contém:
   - `CREATE OR REPLACE FUNCTION public.rpc_add_balance(...)`
   - `CREATE OR REPLACE FUNCTION public.rpc_deduct_balance(...)`

---

### PASSO 3: Colar no Supabase SQL Editor

1. Volte para o Supabase Dashboard → SQL Editor
2. Abra uma nova query (`Ctrl+N`)
3. Cole o conteúdo (`Ctrl+V`)

---

### PASSO 4: Executar

1. Clique em **"Run"** (`Ctrl+Enter`)
2. Aguarde a execução

**Resultado esperado:**
```
Success. No rows returned
```

---

### PASSO 5: Validar

Execute esta query para confirmar que as RPCs foram criadas:

```sql
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ SEM search_path'
    WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN '✅ COM search_path'
    ELSE '⚠️ Config diferente'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
  'rpc_add_balance',
  'rpc_deduct_balance'
)
ORDER BY p.proname;
```

**Resultado esperado:**
- ✅ 2 linhas retornadas
- ✅ Ambas com `✅ COM search_path` (ou pelo menos existentes)

---

## ⚠️ NOTA SOBRE search_path

Se as RPCs forem criadas sem `search_path`, você pode corrigir executando:

```sql
-- Corrigir rpc_add_balance
ALTER FUNCTION rpc_add_balance(UUID, DECIMAL, TEXT, INTEGER, VARCHAR(50))
SET search_path = public;

-- Corrigir rpc_deduct_balance
ALTER FUNCTION rpc_deduct_balance(UUID, DECIMAL, TEXT, INTEGER, VARCHAR(50), BOOLEAN)
SET search_path = public;
```

---

## ✅ CHECKLIST FINAL

Após aplicar as RPCs financeiras:

- [ ] Arquivo `rpc-financial-acid.sql` executado com sucesso
- [ ] `rpc_add_balance` existe no banco
- [ ] `rpc_deduct_balance` existe no banco
- [ ] Ambas têm `search_path` configurado (ou corrigido)
- [ ] Query de validação retorna 2 linhas

---

## 🎯 CONCLUSÃO

Após aplicar estas RPCs:

1. ✅ Migration V19 completa
2. ✅ RPCs de lotes funcionando
3. ✅ RPCs financeiras funcionando
4. ✅ ENGINE V19 100% operacional

---

**Arquivo:** `database/rpc-financial-acid.sql`  
**Status:** Necessário para sistema financeiro completo

