# 📋 GUIA: Aplicar Schema de Recompensas no Supabase

**Data:** 2025-01-12  
**Status:** ⏳ **AGUARDANDO APLICAÇÃO**

---

## 🎯 OBJETIVO

Aplicar o schema de recompensas no Supabase para habilitar o sistema completo de recompensas com integridade ACID.

---

## 📋 PASSOS PARA APLICAÇÃO

### **1. Abrir Supabase SQL Editor**

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `goldeouro-production`
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New query**

---

### **2. Copiar e Colar Schema**

1. Abra o arquivo: `database/schema-rewards.sql`
2. **Selecione TODO o conteúdo** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Cole** no Supabase SQL Editor (Ctrl+V)

---

### **3. Executar Schema**

1. Clique no botão **Run** (ou pressione `CTRL + Enter`)
2. Aguarde a execução
3. Verifique se aparece: **Success. No rows returned**

---

### **4. Verificar Aplicação**

Execute no Supabase SQL Editor:

```sql
-- Verificar se tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rewards';
-- Deve retornar: rewards

-- Verificar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'rewards'
ORDER BY ordinal_position;
-- Deve retornar: id, usuario_id, lote_id, chute_id, tipo, valor, descricao, status, etc.

-- Verificar RPC Functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'rpc_%reward%'
ORDER BY routine_name;
-- Deve retornar: rpc_get_user_rewards, rpc_mark_reward_credited, rpc_register_reward

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'rewards';
-- Deve retornar vários índices (idx_rewards_usuario_id, etc.)
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Tabela `rewards` criada
- [ ] Todos os campos presentes
- [ ] RPC Function `rpc_register_reward` criada
- [ ] RPC Function `rpc_mark_reward_credited` criada
- [ ] RPC Function `rpc_get_user_rewards` criada
- [ ] Índices criados
- [ ] Schema executado sem erros

---

## 🧪 TESTE RÁPIDO

Após aplicar o schema, teste as funções:

```sql
-- Testar registro de recompensa (substituir UUID por um ID real)
SELECT public.rpc_register_reward(
    '00000000-0000-0000-0000-000000000000'::UUID, -- usuario_id
    'lote_teste_1', -- lote_id
    NULL, -- chute_id
    'gol_normal', -- tipo
    5.00, -- valor
    'Teste de recompensa' -- descricao
);
-- Deve retornar: { "success": true, "reward_id": 1, ... }

-- Testar obtenção de recompensas
SELECT public.rpc_get_user_rewards(
    '00000000-0000-0000-0000-000000000000'::UUID, -- usuario_id
    10, -- limit
    0, -- offset
    NULL, -- tipo
    NULL -- status
);
-- Deve retornar: { "success": true, "rewards": [], "total": 0, ... }
```

---

## ⚠️ IMPORTANTE

1. **Aplicar na ordem correta:**
   - ✅ Fase 1: `rpc-financial-acid.sql` (já aplicado)
   - ✅ Fase 2: `schema-webhook-events.sql` (já aplicado)
   - ✅ Fase 3: `schema-lotes-persistencia.sql` (já aplicado)
   - ⏳ **Fase 5: `schema-rewards.sql`** (aplicar agora)

2. **Não aplicar:**
   - ❌ `schema-queue-matches.sql` (OBSOLETO)

3. **Após aplicar:**
   - Testar fazendo um chute que resulte em gol
   - Verificar se recompensa foi registrada
   - Verificar se saldo foi atualizado

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `docs/FASE-5-SISTEMA-RECOMPENSAS-COMPLETO.md` - Detalhes da implementação
- `docs/PLANO-PROXIMA-FASE-SISTEMA-RECOMPENSAS.md` - Plano original

---

**Status:** ⏳ **AGUARDANDO APLICAÇÃO DO SCHEMA**

