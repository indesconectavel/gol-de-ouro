# 🚀 Próximos Passos para Resolver o Problema do Jogo

## 📊 Status Atual

### ✅ Concluído:
- ✅ Tabela `transacoes` corrigida (todas as colunas adicionadas)
- ✅ Endpoints GET do jogo funcionando (`/status`, `/stats`, `/history`)
- ✅ Login funcionando
- ✅ Criação de PIX funcionando

### ❌ Pendente:
- ❌ Endpoint `POST /api/games/shoot` falhando (Status 500)
- ⚠️ RPC `rpc_deduct_balance` precisa ser verificada/instalada

## 🎯 Próximos Passos (Ordem de Execução)

### 1️⃣ Verificar se RPC `rpc_deduct_balance` Existe

**Ação:** Execute no Supabase SQL Editor:

```sql
-- Verificar se a RPC existe
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'rpc_deduct_balance';
```

**Resultado Esperado:**
- Se retornar uma linha → RPC existe ✅
- Se não retornar nada → RPC não existe ❌ (pular para passo 2)

---

### 2️⃣ Instalar RPC `rpc_deduct_balance` (Se Não Existir)

**Ação:** Execute no Supabase SQL Editor o arquivo:
- `database/rpc-financial-acid.sql`

**Ou execute apenas a função específica:**

```sql
-- Copiar a função rpc_deduct_balance do arquivo
-- database/rpc-financial-acid.sql (linhas 148-258)
```

**Verificar:**
- ✅ Script executado sem erros
- ✅ Mensagem "CREATE FUNCTION" ou "CREATE OR REPLACE FUNCTION"

---

### 3️⃣ Testar RPC Diretamente

**Ação:** Execute no Supabase SQL Editor:

```sql
-- Testar RPC com usuário de teste
SELECT public.rpc_deduct_balance(
  '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'::UUID,  -- User ID de teste
  5.00::DECIMAL,                                   -- Valor
  'Teste de débito'::TEXT,                        -- Descrição
  NULL::INTEGER,                                   -- Reference ID
  'aposta'::VARCHAR,                              -- Reference Type
  false::BOOLEAN                                   -- Allow Negative
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

**Se der erro:**
- Verificar mensagem de erro específica
- Verificar se usuário existe
- Verificar se usuário tem saldo suficiente

---

### 4️⃣ Verificar Permissões da RPC

**Ação:** Execute no Supabase SQL Editor:

```sql
-- Verificar permissões da RPC
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as config
FROM pg_proc p
WHERE p.proname = 'rpc_deduct_balance';
```

**Verificar:**
- ✅ `security_definer` deve ser `true` (ou `t`)
- ✅ `config` deve incluir `search_path` se necessário

---

### 5️⃣ Verificar Políticas RLS da Tabela `transacoes`

**Ação:** Execute no Supabase SQL Editor:

```sql
-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'transacoes';
```

**Verificar:**
- ✅ Deve haver política que permite inserção via RPC
- ✅ Ou RLS deve estar desabilitado para a tabela (não recomendado)

---

### 6️⃣ Retestar Endpoint `/api/games/shoot`

**Ação:** Execute no terminal:

```bash
node src/scripts/testar_funcionalidades_principais.js
```

**Ou teste manualmente:**

```bash
# 1. Fazer login
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free10signer@gmail.com","password":"Free10signer"}'

# 2. Fazer chute (usar token do passo 1)
curl -X POST https://goldeouro-backend-v2.fly.dev/api/games/shoot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"direction":"left","amount":5.00}'
```

**Resultado Esperado:**
- ✅ Status 200
- ✅ Resposta com resultado do chute
- ✅ Saldo debitado corretamente

---

### 7️⃣ Verificar Logs do Servidor (Se Ainda Houver Erro)

**Ação:** No Fly.io Dashboard:
1. Acesse: https://fly.io/apps/goldeouro-backend-v2/monitoring
2. Vá em "Logs & Errors"
3. Procure por: `[SHOOT]`, `[FINANCIAL]`, `rpc_deduct_balance`
4. Verifique mensagens de erro específicas

**O que procurar:**
- Erros de "function does not exist"
- Erros de "permission denied"
- Erros de "column does not exist"
- Erros de tipos de dados

---

### 8️⃣ Validar Funcionamento Completo

**Ação:** Execute teste completo:

```bash
node src/scripts/testar_funcionalidades_principais.js
```

**Verificar:**
- ✅ Login funcionando
- ✅ PIX criando
- ✅ **Jogo debitando saldo corretamente** ⭐
- ✅ Prêmios sendo creditados quando há gol

---

## 🚨 Se Ainda Houver Problemas

### Problema: RPC não executa
- Verificar se `SECURITY DEFINER` está configurado
- Verificar se `search_path` está configurado
- Verificar permissões do usuário `postgres`

### Problema: Erro de tipos de dados
- Verificar se tipos dos parâmetros estão corretos
- Verificar se UUID está sendo passado corretamente
- Verificar se DECIMAL está sendo passado corretamente

### Problema: Erro de permissões
- Verificar políticas RLS
- Verificar se RPC tem permissão para inserir em `transacoes`
- Verificar se RPC tem permissão para atualizar `usuarios`

---

## 📝 Checklist de Validação

- [ ] RPC `rpc_deduct_balance` existe no Supabase
- [ ] RPC executa sem erros quando testada diretamente
- [ ] RPC tem `SECURITY DEFINER` configurado
- [ ] Políticas RLS permitem inserção via RPC
- [ ] Endpoint `/api/games/shoot` retorna Status 200
- [ ] Saldo é debitado corretamente após chute
- [ ] Transações são registradas na tabela `transacoes`
- [ ] Logs do servidor não mostram erros

---

## 🎯 Objetivo Final

**Status Esperado:**
- ✅ Todos os endpoints funcionando
- ✅ Débito de saldo funcionando corretamente
- ✅ Sistema financeiro ACID garantido
- ✅ Jogo 100% funcional

---

**Data:** 2025-12-10 11:40 UTC  
**Status:** ⚠️ AGUARDANDO VERIFICAÇÃO/INSTALAÇÃO DA RPC  
**Próximo passo:** Verificar se RPC existe no Supabase

