# 🎯 Próximos Passos Finais - Resolver Problema do Jogo

## ✅ Status Atual

### Deploy Concluído:
- ✅ **Deploy #261** - Todas as correções aplicadas
- ✅ Heartbeat corrigido
- ✅ Código de débito adicionado

### Testes:
- ✅ Login funcionando
- ✅ PIX criando
- ❌ **Jogo ainda falhando** (Status 500)

## 🔍 Problema Identificado

O endpoint `/api/games/shoot` ainda está falhando porque a RPC `rpc_deduct_balance` está retornando erro.

**Baseado nos prints anteriores:**
- RPC existe e está instalada ✅
- RPC retorna: `{"success": false, "error": "Usuário não encontrado"}`

## 🎯 Solução: Verificar e Corrigir RPC

### Passo 1: Verificar Usuário no Supabase

Execute no Supabase SQL Editor:

```sql
-- Verificar se usuário existe
SELECT id, email, saldo, created_at
FROM usuarios 
WHERE email = 'free10signer@gmail.com';
```

**Se retornar resultado:**
- ✅ Usuário existe
- Anotar o UUID
- Pular para Passo 3

**Se não retornar resultado:**
- ❌ Usuário não existe
- Ir para Passo 2

---

### Passo 2: Criar Usuário ou Usar Existente

**Opção A: Criar Usuário Manualmente**

Execute no Supabase SQL Editor:

```sql
-- Criar usuário de teste
INSERT INTO usuarios (id, email, password_hash, saldo)
VALUES (
  gen_random_uuid(),
  'free10signer@gmail.com',
  '$2a$10$hash_aqui',  -- Hash da senha (ou usar função de hash)
  50.00
)
RETURNING id, email, saldo;
```

**Opção B: Usar Usuário Existente**

Execute no Supabase SQL Editor:

```sql
-- Listar usuários existentes
SELECT id, email, saldo 
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 10;
```

Escolher um usuário e usar seu UUID nos testes.

---

### Passo 3: Testar RPC com UUID Correto

Execute no Supabase SQL Editor (usando UUID do Passo 1 ou 2):

```sql
-- Testar RPC com UUID real
SELECT public.rpc_deduct_balance(
  'UUID_DO_USUARIO_AQUI'::UUID,  -- Substituir pelo UUID real
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
  "transaction_id": 123,
  "amount": 5.00
}
```

**Se ainda der erro:**
- Verificar mensagem de erro específica
- Verificar código da RPC (linhas 148-258 de `database/rpc-financial-acid.sql`)
- Verificar se usuário tem saldo suficiente

---

### Passo 4: Se RPC Estiver Funcionando, Verificar Código da RPC

Se a RPC retornar "Usuário não encontrado" mesmo com usuário válido, pode ser problema no código da RPC.

**Verificar código da RPC:**

A RPC deve fazer algo como:
```sql
SELECT saldo INTO v_old_balance
FROM public.usuarios
WHERE id = p_user_id
FOR UPDATE;
```

**Possíveis Problemas:**
1. RPC está procurando em tabela errada
2. Tipo de dados incorreto (UUID vs VARCHAR)
3. Problema de case sensitivity

**Solução:**
- Verificar código completo da RPC em `database/rpc-financial-acid.sql`
- Reinstalar RPC se necessário

---

### Passo 5: Retestar Endpoint Após Correções

Após corrigir o problema da RPC:

```bash
node src/scripts/testar_funcionalidades_principais.js
```

**Verificar:**
- ✅ Endpoint retorna Status 200
- ✅ Saldo é debitado corretamente
- ✅ Transação é criada no banco

---

## 📋 Checklist de Validação

### Verificação Inicial:
- [ ] Usuário existe no banco
- [ ] UUID do usuário anotado
- [ ] RPC testada diretamente no Supabase
- [ ] RPC retorna sucesso

### Após Correções:
- [ ] Endpoint /api/games/shoot funcionando
- [ ] Saldo sendo debitado corretamente
- [ ] Transações sendo registradas
- [ ] Prêmios sendo creditados quando há gol

---

## 🚨 Se Nada Funcionar

### Última Opção: Verificar Código da RPC

Execute no Supabase SQL Editor para ver o código completo:

```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'rpc_deduct_balance';
```

**Verificar:**
- Como a RPC busca o usuário
- Se está usando `FOR UPDATE` corretamente
- Se tipos de dados estão corretos

---

## 📝 Arquivos de Referência

- `database/rpc-financial-acid.sql` - Código completo da RPC
- `src/modules/financial/services/financial.service.js` - Service que chama RPC
- `src/modules/game/controllers/game.controller.js` - Controller do jogo

---

**Data:** 2025-12-10 11:56 UTC  
**Deploy:** #261  
**Status:** ⚠️ AGUARDANDO CORREÇÃO DA RPC  
**Próximo passo:** Verificar usuário e testar RPC no Supabase

