# 🔧 GUIA: APLICAR SCHEMA WEBHOOK EVENTS NO SUPABASE

**Data:** 2025-01-12  
**Prioridade:** 🔴 **CRÍTICA** - Sistema não funcionará sem isso  
**Tempo estimado:** 5 minutos

---

## ⚠️ IMPORTANTE

**O schema de webhook events DEVE ser aplicado no Supabase antes de usar o sistema de idempotência.**

Sem isso, todos os webhooks falharão ao tentar registrar eventos.

---

## 📋 PASSO A PASSO

### Passo 1: Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **goldeouro-production** (ou o projeto correto)

### Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (ou use o editor existente)

### Passo 3: Copiar e Colar SQL

1. Abra o arquivo: `database/schema-webhook-events.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase

### Passo 4: Executar SQL

1. Clique no botão **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde a execução (deve levar alguns segundos)
3. Verifique se apareceu mensagem de sucesso

### Passo 5: Verificar Criação da Tabela

Execute esta query para verificar:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'webhook_events'
ORDER BY ordinal_position;
```

**Resultado Esperado:**
Deve retornar 15 colunas:
- `id`, `idempotency_key`, `event_type`, `payment_id`, `raw_payload`, `processed`, `processed_at`, `processing_started_at`, `processing_duration_ms`, `result`, `error_message`, `retry_count`, `created_at`, `updated_at`

### Passo 6: Verificar Criação das Functions

Execute esta query:

```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'rpc_%webhook%'
ORDER BY routine_name;
```

**Resultado Esperado:**
Deve retornar 3 funções:
- `rpc_register_webhook_event`
- `rpc_mark_webhook_event_processed`
- `rpc_check_webhook_event_processed`

### Passo 7: Testar Function Manualmente (Opcional)

Teste rápido para garantir que funciona:

```sql
-- Testar registro de evento
SELECT public.rpc_register_webhook_event(
  'payment:12345:test123',
  'payment',
  '12345',
  '{"test": "data"}'::jsonb
);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "event_id": 1,
  "already_exists": false
}
```

---

## ✅ VERIFICAÇÃO FINAL

Após aplicar, verifique:

- [ ] Tabela `webhook_events` criada
- [ ] 3 funções RPC criadas
- [ ] Nenhum erro na execução do SQL
- [ ] Teste manual retorna JSON válido

---

## 🚨 TROUBLESHOOTING

### Erro: "function already exists"

**Solução:** As functions já existem. Isso é OK, elas serão atualizadas.

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando a conta com permissões de administrador do projeto.

### Erro: "relation webhook_events does not exist"

**Solução:** Verifique se o SQL foi executado completamente. Execute novamente.

### Erro: "column idempotency_key does not exist"

**Solução:** A tabela pode ter sido criada parcialmente. Execute `DROP TABLE IF EXISTS public.webhook_events;` e execute o SQL novamente.

---

## 📝 NOTAS

- A tabela `webhook_events` armazena histórico completo de webhooks
- As functions são `SECURITY DEFINER`, então executam com privilégios elevados
- Isso está correto - devem ser chamadas apenas pelo backend usando `service_role` key
- Nunca exponha essas functions diretamente ao frontend

---

## 🔗 RELAÇÃO COM FASE 1

**IMPORTANTE:** A Fase 2 depende da Fase 1!

Certifique-se de que:
- ✅ RPC functions da Fase 1 foram aplicadas (`rpc_add_balance`, etc.)
- ✅ Tabela `transacoes` existe
- ✅ Tabela `usuarios` existe

Se não aplicou a Fase 1 ainda, aplique primeiro:
1. `database/rpc-financial-acid.sql` (Fase 1)
2. `database/schema-webhook-events.sql` (Fase 2)

---

**Após aplicar, o sistema de idempotência estará 100% funcional!**

