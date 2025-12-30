# ✅ GUIA: Verificar Schema de Lotes Aplicado

**Data:** 2025-01-12  
**Status:** Verificação pós-aplicação

---

## ✅ VERIFICAÇÃO PASSO A PASSO

### **1. Verificar Tabela `lotes`**

Execute no Supabase SQL Editor:

```sql
-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;
```

**Resultado esperado:**
- `id` (VARCHAR)
- `valor_aposta` (DECIMAL)
- `tamanho` (INTEGER)
- `posicao_atual` (INTEGER)
- `indice_vencedor` (INTEGER)
- `status` (VARCHAR)
- `total_arrecadado` (DECIMAL)
- `premio_total` (DECIMAL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP) ✅ **NOVO**

---

### **2. Verificar Índices**

```sql
-- Verificar índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'lotes';
```

**Resultado esperado:**
- `lotes_pkey` (PRIMARY KEY)
- `idx_lotes_status` ✅
- `idx_lotes_valor_aposta` ✅
- `idx_lotes_created_at` ✅

---

### **3. Verificar RPC Functions**

```sql
-- Verificar funções RPC criadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'rpc_%lote%'
ORDER BY routine_name;
```

**Resultado esperado:**
- `rpc_get_or_create_lote` ✅
- `rpc_update_lote_after_shot` ✅
- `rpc_get_active_lotes` ✅

---

### **4. Testar Função `rpc_get_active_lotes`**

```sql
-- Testar função de sincronização
SELECT public.rpc_get_active_lotes();
```

**Resultado esperado:**
```json
{
  "success": true,
  "lotes": [],
  "count": 0
}
```

---

### **5. Testar Função `rpc_get_or_create_lote`**

```sql
-- Testar criação de lote
SELECT public.rpc_get_or_create_lote(
    'lote_teste_1',
    10.00,
    1,
    0
);
```

**Resultado esperado:**
```json
{
  "success": true,
  "lote": {
    "id": "lote_teste_1",
    "valor_aposta": 10.00,
    "tamanho": 1,
    "posicao_atual": 0,
    "indice_vencedor": 0,
    "status": "ativo",
    "total_arrecadado": 0.00,
    "premio_total": 0.00
  }
}
```

---

### **6. Testar Função `rpc_update_lote_after_shot`**

```sql
-- Testar atualização após chute (gol)
SELECT public.rpc_update_lote_after_shot(
    'lote_teste_1',
    10.00,
    5.00,  -- prêmio
    0.00,  -- prêmio gol de ouro
    true   -- is_goal
);
```

**Resultado esperado:**
```json
{
  "success": true,
  "lote": {
    "id": "lote_teste_1",
    "posicao_atual": 1,
    "status": "completed",
    "total_arrecadado": 10.00,
    "premio_total": 5.00,
    "is_complete": true
  }
}
```

---

### **7. Limpar Dados de Teste**

```sql
-- Remover lote de teste
DELETE FROM public.lotes WHERE id = 'lote_teste_1';
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Tabela `lotes` existe com campo `completed_at`
- [ ] Índices criados (`idx_lotes_status`, `idx_lotes_valor_aposta`, `idx_lotes_created_at`)
- [ ] Função `rpc_get_or_create_lote` criada e funcionando
- [ ] Função `rpc_update_lote_after_shot` criada e funcionando
- [ ] Função `rpc_get_active_lotes` criada e funcionando
- [ ] Testes de funções passaram sem erros

---

## 🎯 PRÓXIMOS PASSOS

Após verificar que tudo está funcionando:

1. ✅ **Schema aplicado** - CONCLUÍDO
2. ⏳ **Atualizar `server-fly.js`** - Próximo passo
   - Adicionar import `LoteService`
   - Atualizar `getOrCreateLoteByValue()` para persistir
   - Atualizar `/api/games/shoot` para atualizar lote
   - Adicionar sincronização ao iniciar servidor

**Ver:** `docs/IMPLEMENTACAO-PERSISTENCIA-LOTES.md` para detalhes

---

**Status:** ✅ **SCHEMA APLICADO - AGUARDANDO VERIFICAÇÃO E INTEGRAÇÃO**

