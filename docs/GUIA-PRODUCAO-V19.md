# 📘 GUIA COMPLETO: APLICAR ENGINE V19 EM PRODUÇÃO
## Passo a Passo Detalhado para o Fred

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Projeto:** goldeouro-production (gayopagjdrkcmkirmfvy)  
**Status:** ✅ **PRONTO PARA APLICAÇÃO**

---

## 📋 CHECKLIST PARA O FRED

### Pré-requisitos
- [ ] Acesso ao Supabase Dashboard do projeto `goldeouro-production`
- [ ] Acesso ao SQL Editor do Supabase
- [ ] Backup do banco de dados (recomendado)
- [ ] Tempo estimado: 30-45 minutos

### Após Aplicação
- [ ] Validar criação de tabelas V19
- [ ] Validar criação de RPCs V19
- [ ] Testar funcionalidades básicas
- [ ] Verificar logs do backend

---

## 🎯 ORDEM EXATA DE APLICAÇÃO

### ⚠️ IMPORTANTE: Execute na ordem especificada!

---

## PASSO 1: Aplicar Estrutura Base V19

**Arquivo:** `database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql`

**O que faz:**
- Cria tabelas V19 (`lotes`, `rewards`, `webhook_events`, `system_heartbeat`)
- Adiciona colunas faltantes em tabelas existentes
- Cria índices V19
- Cria triggers V19
- Cria RLS policies V19

**Como executar:**
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql
2. Clique em "New query"
3. Abra o arquivo `database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em "Run" (ou pressione Ctrl+Enter)
7. Aguarde execução (pode demorar alguns segundos)
8. Verifique se apareceu: `✅ Estrutura V19 corrigida com sucesso!`

**✅ Validação:**
- Verifique se não houve erros
- Se houver erros, anote e continue (alguns podem ser esperados)

---

## PASSO 2: Aplicar RPCs Financeiras (Corrigir search_path)

**Arquivo:** `database/rpc-financial-acid.sql`

**O que faz:**
- Recria RPCs financeiras com `SET search_path` correto
- Garante segurança nas operações financeiras

**Como executar:**
1. No mesmo SQL Editor, clique em "New query"
2. Abra o arquivo `database/rpc-financial-acid.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"
6. Aguarde execução

**✅ Validação:**
- Verifique se não houve erros
- Se aparecer "Success. No rows returned", está correto

---

## PASSO 3: Aplicar RPCs de Lotes

**Arquivo:** `database/migration_v19/SCHEMA-LOTES-CORRIGIDO-FINAL.sql`

**O que faz:**
- Remove funções duplicadas (se existirem)
- Cria 3 RPCs de lotes:
  - `rpc_get_or_create_lote`
  - `rpc_update_lote_after_shot`
  - `rpc_get_active_lotes`

**Como executar:**
1. No mesmo SQL Editor, clique em "New query"
2. Abra o arquivo `database/migration_v19/SCHEMA-LOTES-CORRIGIDO-FINAL.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"
6. Aguarde execução

**✅ Validação:**
- Verifique se apareceu: `✅ Funções de lotes criadas com sucesso!`
- Se houver erro de função duplicada, ignore (já foi removida)

---

## PASSO 4: Aplicar RPCs de Recompensas

**Arquivo:** `database/schema-rewards.sql`

**O que faz:**
- Cria 3 RPCs de recompensas:
  - `rpc_register_reward`
  - `rpc_mark_reward_credited`
  - `rpc_get_user_rewards`

**Como executar:**
1. No mesmo SQL Editor, clique em "New query"
2. Abra o arquivo `database/schema-rewards.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"
6. Aguarde execução

**✅ Validação:**
- Verifique se não houve erros
- Se aparecer "Success. No rows returned", está correto

---

## PASSO 5: Aplicar RPCs de Webhook

**Arquivo:** `database/schema-webhook-events.sql`

**O que faz:**
- Cria 3 RPCs de webhook:
  - `rpc_register_webhook_event`
  - `rpc_check_webhook_event_processed`
  - `rpc_mark_webhook_event_processed`

**Como executar:**
1. No mesmo SQL Editor, clique em "New query"
2. Abra o arquivo `database/schema-webhook-events.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"
6. Aguarde execução

**✅ Validação:**
- Verifique se não houve erros
- Se aparecer "Success. No rows returned", está correto

---

## PASSO 6: Aplicar System Heartbeat

**Arquivo:** `database/criar-system-heartbeat-100-porcento.sql`

**O que faz:**
- Garante que tabela `system_heartbeat` está completa
- Cria RLS policies necessárias

**Como executar:**
1. No mesmo SQL Editor, clique em "New query"
2. Abra o arquivo `database/criar-system-heartbeat-100-porcento.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"
6. Aguarde execução

**✅ Validação:**
- Verifique se apareceu: `✅ Tabela system_heartbeat criada com sucesso!`

---

## PASSO 7: Corrigir Search Path em Todas as RPCs

**Arquivo:** `database/corrigir-search-path-TODAS-FUNCOES.sql`

**O que faz:**
- Adiciona `SET search_path` em todas as RPCs V19
- Corrige problemas de segurança identificados pelo Security Advisor

**Como executar:**
1. No mesmo SQL Editor, clique em "New query"
2. Abra o arquivo `database/corrigir-search-path-TODAS-FUNCOES.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"
6. Aguarde execução

**✅ Validação:**
- Verifique se não houve erros
- Se aparecer "Success. No rows returned", está correto

---

## ✅ COMO VALIDAR

### Validação Manual no Supabase

Execute estas queries no SQL Editor:

```sql
-- Verificar tabelas V19
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lotes', 'rewards', 'webhook_events', 'system_heartbeat')
ORDER BY table_name;

-- Verificar RPCs V19
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'rpc_%'
ORDER BY routine_name;

-- Verificar colunas em rewards
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'rewards'
ORDER BY ordinal_position;

-- Verificar colunas em webhook_events
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'webhook_events'
ORDER BY ordinal_position;
```

**Resultado Esperado:**
- ✅ 4 tabelas V19 criadas
- ✅ 13 RPCs criadas (4 financeiras + 9 V19)
- ✅ Colunas `lote_id` e `chute_id` em `rewards`
- ✅ Colunas `idempotency_key`, `payment_id`, `created_at` em `webhook_events`

### Validação via Scripts

Execute no terminal do projeto:

```bash
# Validar RPCs
node patches/v19/validar_rpc_v19.js

# Validar estrutura
node patches/v19/validar_migration_v19.js

# Validar Engine V19 completa
node patches/v19/validar_engine_v19.js
```

---

## 🔄 COMO REFAZER CASO DÊ ERRO

### Se algum passo falhar:

1. **Não entre em pânico!** Migrations são idempotentes
2. **Anote o erro** exato que apareceu
3. **Continue com os próximos passos** (muitos erros são esperados)
4. **Execute novamente** o passo que falhou (pode funcionar na segunda tentativa)
5. **Se persistir**, verifique:
   - Se a tabela/coluna já existe
   - Se há dados conflitantes
   - Se há constraints violadas

### Erros Comuns e Soluções:

**Erro: "column already exists"**
- ✅ **Solução:** Ignore, a coluna já existe (esperado)

**Erro: "table already exists"**
- ✅ **Solução:** Ignore, a tabela já existe (esperado)

**Erro: "function already exists"**
- ✅ **Solução:** Ignore, a função já existe (esperado)

**Erro: "constraint already exists"**
- ✅ **Solução:** Ignore, a constraint já existe (esperado)

**Erro: "index already exists"**
- ✅ **Solução:** Ignore, o índice já existe (esperado)

**Erro: "cannot add NOT NULL column"**
- ⚠️ **Solução:** Este erro pode ocorrer se a tabela tiver dados. Neste caso, a coluna será adicionada como NULL primeiro.

---

## 🧪 COMO TESTAR NO BACKEND

### Teste 1: Verificar Conexão
```bash
# No terminal do projeto
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('lotes').select('count').then(r => console.log('✅ Conexão OK:', r));"
```

### Teste 2: Testar RPC de Lotes
```sql
-- No Supabase SQL Editor
SELECT public.rpc_get_active_lotes();
```

**Resultado Esperado:**
```json
{
  "success": true,
  "lotes": [],
  "count": 0
}
```

### Teste 3: Testar RPC de Recompensas
```sql
-- No Supabase SQL Editor (substitua UUID por um UUID real)
SELECT public.rpc_get_user_rewards('UUID_DO_USUARIO'::UUID, 10, 0, NULL, NULL);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "rewards": [],
  "total": 0
}
```

### Teste 4: Verificar Backend Funcionando
```bash
# No terminal do projeto
curl http://localhost:3000/api/health
# ou
curl https://goldeouro-backend.fly.dev/api/health
```

**Resultado Esperado:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 📝 NOTAS IMPORTANTES

1. **✅ Migrations são seguras**
   - Não apagam dados existentes
   - Não alteram dados existentes
   - Apenas adicionam estrutura faltante

2. **✅ Migrations são idempotentes**
   - Podem ser executadas múltiplas vezes
   - Não causam problemas se executadas novamente

3. **⚠️ Execute na ordem especificada**
   - Estrutura primeiro
   - RPCs depois
   - Correções por último

4. **✅ Tempo estimado: 30-45 minutos**
   - Cada passo leva alguns segundos
   - Validação leva alguns minutos

---

## 🆘 SUPORTE

Se encontrar problemas:

1. **Anote o erro exato**
2. **Verifique se seguiu a ordem correta**
3. **Tente executar novamente o passo que falhou**
4. **Consulte os relatórios em `logs/v19/PRODUCTION_SCAN/`**

---

**Gerado em:** 2025-12-10T21:35:00Z  
**Status:** ✅ **PRONTO PARA USO**  
**Versão:** V19.0.0

