# 🔧 CORREÇÃO FINAL - UUID PARA INTEGER NA RPC

## ❌ ERRO IDENTIFICADO

**Erro:**
```json
{
  "success": false,
  "error": "invalid input syntax for type integer: \"7942b74a-f601-4acf-80e1-0051af8c2201\""
}
```

**Análise:**
- O código JavaScript está correto (não passa `referenceId`, será NULL)
- O UUID no erro é diferente do UUID do usuário
- Isso sugere problema interno na RPC ou em trigger

---

## 🔍 DIAGNÓSTICO

### Passo 1: Verificar Código da RPC

**No Supabase SQL Editor, execute:**

```sql
-- Ver código completo da RPC
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'rpc_deduct_balance';
```

**Verificar:**
- Se há alguma conversão de UUID para INTEGER
- Se há algum código usando `usuario_id` como `referencia_id`
- Se há algum problema na inserção

### Passo 2: Verificar Triggers

**No Supabase SQL Editor, execute:**

```sql
-- Verificar triggers na tabela transacoes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'transacoes'
AND event_object_schema = 'public';
```

**Se houver triggers:**
- Verificar se algum trigger está tentando converter UUID para INTEGER
- Verificar se algum trigger está usando `usuario_id` como `referencia_id`

### Passo 3: Verificar Estrutura da Tabela

**No Supabase SQL Editor, execute:**

```sql
-- Verificar tipos de dados
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transacoes'
AND column_name IN ('referencia_id', 'usuario_id', 'id');
```

---

## ✅ SOLUÇÃO PROVÁVEL

### Se o Problema For na RPC

**A RPC pode estar tentando usar `usuario_id` (UUID) como `referencia_id` (INTEGER) quando `p_reference_id` é NULL.**

**Correção:** Modificar a RPC para garantir que `p_reference_id` seja sempre NULL ou INTEGER válido:

```sql
-- Na RPC, antes da inserção, garantir que p_reference_id seja válido
IF p_reference_id IS NOT NULL THEN
  -- Validar que é INTEGER válido
  IF p_reference_id::TEXT ~ '^[0-9]+$' THEN
    -- É número válido, pode usar
  ELSE
    -- Não é número válido, usar NULL
    p_reference_id := NULL;
  END IF;
END IF;
```

### Se o Problema For em Trigger

**Remover ou corrigir o trigger que está causando o problema.**

---

## 🛠️ CORREÇÃO TEMPORÁRIA

### Opção 1: Garantir que referenceId seja sempre NULL no código

**Modificar `FinancialService.deductBalance`:**

```javascript
// Garantir que referenceId seja sempre NULL ou INTEGER válido
const referenceId = options.referenceId 
  ? (typeof options.referenceId === 'number' ? options.referenceId : null)
  : null;

const { data, error } = await supabaseAdmin.rpc('rpc_deduct_balance', {
  p_user_id: userId,
  p_amount: parseFloat(amount),
  p_description: options.description || null,
  p_reference_id: referenceId,  // ← Sempre NULL ou INTEGER
  p_reference_type: options.referenceType || null,
  p_allow_negative: options.allowNegative || false
});
```

### Opção 2: Reinstalar RPC com Correção

**Se necessário, reinstalar a RPC com validação adicional.**

---

## 📋 CHECKLIST

- [ ] Verificar código da RPC instalada
- [ ] Verificar triggers na tabela transacoes
- [ ] Verificar estrutura da tabela
- [ ] Testar com referenceId NULL explícito
- [ ] Corrigir problema identificado

---

## 🎯 PRÓXIMOS PASSOS

1. **Executar script de diagnóstico** (`database/diagnosticar-e-corrigir-rpc-deduct-balance.sql`)
2. **Analisar resultados** - identificar onde está o problema
3. **Aplicar correção** - baseado no diagnóstico
4. **Retestar RPC** - verificar se funciona

---

**Data:** 2025-12-10 12:50 UTC  
**Status:** 🔍 DIAGNÓSTICO NECESSÁRIO  
**Prioridade:** 🔴 ALTA - Bloqueia funcionamento da RPC

