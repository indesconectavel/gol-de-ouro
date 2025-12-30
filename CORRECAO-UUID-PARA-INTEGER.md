# 🔧 CORREÇÃO - UUID SENDO PASSADO COMO INTEGER

## ❌ ERRO IDENTIFICADO

**Erro:**
```json
{
  "success": false,
  "error": "invalid input syntax for type integer: \"7942b74a-f601-4acf-80e1-0051af8c2201\""
}
```

**Causa:**
A RPC `rpc_deduct_balance` espera `p_reference_id` como INTEGER, mas em algum lugar está recebendo um UUID.

**Observação:**
O UUID no erro (`7942b74a-f601-4acf-80e1-0051af8c2201`) é diferente do UUID do usuário passado (`4ddf8330-ae94-4e92-a010-bdc7fa254ad5`), o que sugere que pode haver algum problema interno na RPC ou em algum trigger.

---

## ✅ SOLUÇÃO

### Opção 1: Verificar se o Código Está Passando UUID como referenceId

**Verificar no código JavaScript:**

O código em `GameController.shoot` está passando:
```javascript
const deductResult = await FinancialService.deductBalance(
  req.user.userId,  // UUID - correto
  amount,
  {
    description: `Aposta no jogo - Chute ${direction}`,
    referenceType: 'aposta',
    // referenceId não está sendo passado - correto (será NULL)
  }
);
```

**Isso está correto** - não está passando `referenceId`, então será NULL.

### Opção 2: Verificar se Há Trigger ou Função que Está Convertendo

**No Supabase SQL Editor, execute:**

```sql
-- Verificar triggers na tabela transacoes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'transacoes';
```

### Opção 3: Corrigir a RPC para Aceitar NULL Corretamente

**O problema pode estar na RPC quando `p_reference_id` é NULL mas há algum código tentando usar outro valor.**

**Verificar a RPC diretamente:**

```sql
-- Ver código completo da RPC
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'rpc_deduct_balance';
```

---

## 🔍 DIAGNÓSTICO

### Passo 1: Verificar o que está sendo passado

**No código JavaScript, adicionar log temporário:**

```javascript
// Em FinancialService.deductBalance, antes da chamada RPC
console.log('🔍 [DEBUG] Parâmetros para RPC:');
console.log('  userId:', userId);
console.log('  amount:', amount);
console.log('  options.referenceId:', options.referenceId);
console.log('  options.referenceType:', options.referenceType);
```

### Passo 2: Testar com referenceId Explícito NULL

**No SQL Editor, testar:**

```sql
SELECT public.rpc_deduct_balance(
  '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'::UUID,
  5.00::DECIMAL,
  'Teste de débito'::TEXT,
  NULL::INTEGER,  -- ← Garantir que é NULL
  'aposta'::VARCHAR,
  false::BOOLEAN
);
```

### Passo 3: Verificar se Há Problema na RPC

**O UUID no erro (`7942b74a-f601-4acf-80e1-0051af8c2201`) pode ser:**
- Um ID de transação anterior sendo usado incorretamente
- Um trigger tentando usar `usuario_id` como `referencia_id`
- Algum código dentro da RPC tentando converter UUID para INTEGER

---

## 🛠️ CORREÇÃO TEMPORÁRIA

### Se o Problema For no Código JavaScript

**Garantir que referenceId seja sempre NULL ou INTEGER:**

```javascript
// Em FinancialService.deductBalance
const { data, error } = await supabaseAdmin.rpc('rpc_deduct_balance', {
  p_user_id: userId,
  p_amount: parseFloat(amount),
  p_description: options.description || null,
  p_reference_id: options.referenceId ? parseInt(options.referenceId) : null, // ← Garantir INTEGER ou NULL
  p_reference_type: options.referenceType || null,
  p_allow_negative: options.allowNegative || false
});
```

### Se o Problema For na RPC

**Pode ser necessário modificar a RPC para validar melhor o `p_reference_id`:**

```sql
-- Adicionar validação na RPC
IF p_reference_id IS NOT NULL AND p_reference_id::TEXT ~ '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' THEN
  -- Se parece com UUID, converter para NULL ou rejeitar
  p_reference_id := NULL;
END IF;
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Verificar código JavaScript - está passando UUID como referenceId?
- [ ] Verificar triggers na tabela transacoes
- [ ] Verificar código completo da RPC
- [ ] Testar com referenceId explícito NULL
- [ ] Verificar logs do servidor para ver o que está sendo passado

---

## 🎯 PRÓXIMOS PASSOS

1. **Verificar código JavaScript** - garantir que não está passando UUID como referenceId
2. **Verificar triggers** - pode haver trigger convertendo valores
3. **Testar RPC diretamente** - com referenceId NULL explícito
4. **Se necessário, corrigir RPC** - adicionar validação

---

**Data:** 2025-12-10 12:45 UTC  
**Status:** 🔍 DIAGNÓSTICO EM ANDAMENTO  
**Prioridade:** 🔴 ALTA - Bloqueia funcionamento da RPC

