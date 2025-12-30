# 🔍 TROUBLESHOOTING - Function Search Path Mutable
## Problema: Warnings persistem após correções
## Data: 2025-12-09

---

## ⚠️ SITUAÇÃO ATUAL

Mesmo após executar SQLs de correção, as funções RPC ainda aparecem como warnings:
- `rpc_update_lote_after_shot`
- `rpc_get_or_create_lote`
- `fn_update_heartbeat`

---

## 🔍 DIAGNÓSTICO PASSO A PASSO

### **PASSO 1: Verificar se search_path foi aplicado**

Execute no Supabase SQL Editor:

```sql
SELECT 
  proname as function_name,
  proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN (
  'rpc_update_lote_after_shot',
  'rpc_get_or_create_lote',
  'fn_update_heartbeat'
);
```

**Resultado esperado:**
- `proconfig` deve conter `{search_path=public}` para cada função

**Se não contiver:**
- O search_path não foi aplicado
- Execute o SQL alternativo: `logs/v19/correcoes_seguranca_v19_ultima_tentativa.sql`

---

### **PASSO 2: Verificar definição completa**

Execute para ver a definição completa:

```sql
SELECT 
  proname,
  pg_get_functiondef(oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN (
  'rpc_update_lote_after_shot',
  'rpc_get_or_create_lote',
  'fn_update_heartbeat'
);
```

**Verificar se contém:** `SET search_path = public` na definição

---

### **PASSO 3: Tentar ALTER FUNCTION manualmente**

Se o search_path não foi aplicado, tente manualmente para cada função:

```sql
-- Para rpc_update_lote_after_shot
ALTER FUNCTION rpc_update_lote_after_shot(TEXT, DECIMAL, DECIMAL, DECIMAL, BOOLEAN) 
SET search_path = public;

-- Para rpc_get_or_create_lote
ALTER FUNCTION rpc_get_or_create_lote(TEXT, DECIMAL, INTEGER, INTEGER) 
SET search_path = public;

-- Para fn_update_heartbeat
ALTER FUNCTION fn_update_heartbeat(TEXT, TEXT, TEXT, JSONB) 
SET search_path = public;
```

**Verificar novamente** com a query do Passo 1.

---

### **PASSO 4: Se ALTER não funcionar, fazer DROP manual**

Execute cada função separadamente:

```sql
-- 1. rpc_update_lote_after_shot
DROP FUNCTION IF EXISTS rpc_update_lote_after_shot(TEXT, DECIMAL, DECIMAL, DECIMAL, BOOLEAN) CASCADE;

CREATE FUNCTION rpc_update_lote_after_shot(
  p_lote_id TEXT,
  p_valor_aposta DECIMAL,
  p_premio DECIMAL,
  p_premio_gol_de_ouro DECIMAL,
  p_is_goal BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote JSONB;
BEGIN
  UPDATE lotes
  SET 
    valor_aposta = valor_aposta + p_valor_aposta,
    premio_total = premio_total + p_premio,
    premio_gol_de_ouro = premio_gol_de_ouro + p_premio_gol_de_ouro,
    updated_at = NOW()
  WHERE id = p_lote_id
  RETURNING row_to_json(lotes.*)::JSONB INTO v_lote;
  
  RETURN COALESCE(v_lote, '{}'::JSONB);
END;
$$;

-- 2. rpc_get_or_create_lote
DROP FUNCTION IF EXISTS rpc_get_or_create_lote(TEXT, DECIMAL, INTEGER, INTEGER) CASCADE;

CREATE FUNCTION rpc_get_or_create_lote(
  p_lote_id TEXT,
  p_valor_aposta DECIMAL,
  p_tamanho INTEGER,
  p_indice_vencedor INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote JSONB;
BEGIN
  SELECT row_to_json(l.*)::JSONB INTO v_lote
  FROM lotes l
  WHERE l.id = p_lote_id;
  
  IF v_lote IS NULL THEN
    INSERT INTO lotes (id, valor_aposta, tamanho, indice_vencedor, status, created_at)
    VALUES (p_lote_id, p_valor_aposta, p_tamanho, p_indice_vencedor, 'ativo', NOW())
    RETURNING row_to_json(lotes.*)::JSONB INTO v_lote;
  END IF;
  
  RETURN COALESCE(v_lote, '{}'::JSONB);
END;
$$;

-- 3. fn_update_heartbeat
DROP FUNCTION IF EXISTS fn_update_heartbeat(TEXT, TEXT, TEXT, JSONB) CASCADE;

CREATE FUNCTION fn_update_heartbeat(
  p_instance_id TEXT,
  p_system_name TEXT DEFAULT 'gol-de-ouro-backend',
  p_status TEXT DEFAULT 'active',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_heartbeat JSONB;
BEGIN
  INSERT INTO system_heartbeat (instance_id, system_name, status, last_seen, metadata)
  VALUES (p_instance_id, p_system_name, p_status, NOW(), p_metadata)
  ON CONFLICT (instance_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = NOW(),
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING row_to_json(system_heartbeat.*)::JSONB INTO v_heartbeat;
  
  RETURN COALESCE(v_heartbeat, '{}'::JSONB);
END;
$$;
```

---

### **PASSO 5: Verificar novamente**

Após executar os DROPs e CREATEs, verifique novamente:

```sql
SELECT 
  proname,
  proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN (
  'rpc_update_lote_after_shot',
  'rpc_get_or_create_lote',
  'fn_update_heartbeat'
);
```

**Deve mostrar:** `{search_path=public}` para cada função

---

### **PASSO 6: Reexecutar Security Advisor**

1. **Acessar Security Advisor**
2. **Clicar em "Reset suggestions"** (IMPORTANTE!)
3. **Aguardar alguns segundos**
4. **Clicar em "Rerun linter"**
5. **Aguardar análise completa** (pode levar alguns minutos)

---

## ⚠️ POSSÍVEIS PROBLEMAS

### Problema 1: Security Advisor usando cache
**Solução:** Sempre clicar em "Reset suggestions" antes de "Rerun linter"

### Problema 2: Assinatura da função incorreta
**Solução:** Verificar assinatura exata antes de fazer DROP:
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'rpc_update_lote_after_shot';
```

### Problema 3: Dependências impedindo DROP
**Solução:** Usar `CASCADE` no DROP:
```sql
DROP FUNCTION ... CASCADE;
```

### Problema 4: Security Advisor não atualiza imediatamente
**Solução:** Aguardar alguns minutos após executar SQL

---

## 📊 CHECKLIST COMPLETO

- [ ] Verificado se search_path foi aplicado (query do Passo 1)
- [ ] Se não aplicado, executado ALTER FUNCTION manualmente
- [ ] Se ALTER falhar, executado DROP + CREATE manualmente
- [ ] Verificado novamente se search_path foi aplicado
- [ ] Security Advisor resetado ("Reset suggestions")
- [ ] Security Advisor reexecutado ("Rerun linter")
- [ ] Aguardado tempo suficiente (5-10 minutos)
- [ ] Verificado resultado final

---

## 🎯 CONCLUSÃO

**Arquivos disponíveis:**
1. `logs/v19/correcoes_seguranca_v19_ultima_tentativa.sql` - SQL alternativo
2. `logs/v19/verificar_search_path_funcoes.sql` - Script de verificação

**Estratégia recomendada:**
1. Executar script de verificação primeiro
2. Se search_path não estiver aplicado, executar SQL alternativo
3. Verificar novamente
4. Reset + Rerun Security Advisor

---

**Guia criado em:** 2025-12-09  
**Status:** 🔍 **TROUBLESHOOTING ATIVO**

