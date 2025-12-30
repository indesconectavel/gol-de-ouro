# 🔧 GUIA: APLICAR SCHEMA QUEUE E MATCHES NO SUPABASE

**Data:** 2025-01-12  
**Prioridade:** 🔴 **CRÍTICA** - Sistema não funcionará sem isso  
**Tempo estimado:** 5 minutos

---

## ⚠️ IMPORTANTE

**O schema de queue e matches DEVE ser aplicado no Supabase antes de usar o sistema de persistência da fila.**

Sem isso, todas as operações de fila e partidas falharão.

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

1. Abra o arquivo: `database/schema-queue-matches.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase

### Passo 4: Executar SQL

1. Clique no botão **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde a execução (deve levar alguns segundos)
3. Verifique se apareceu mensagem de sucesso

### Passo 5: Verificar Criação das Tabelas

Execute esta query para verificar:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('queue_board', 'matches', 'match_players', 'match_events')
ORDER BY table_name;
```

**Resultado Esperado:**
Deve retornar 4 tabelas:
- `queue_board` (15 colunas)
- `matches` (12 colunas)
- `match_players` (13 colunas)
- `match_events` (7 colunas)

### Passo 6: Verificar Criação das Functions

Execute esta query:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE 'rpc_%queue%' OR routine_name LIKE 'rpc_%match%')
ORDER BY routine_name;
```

**Resultado Esperado:**
Deve retornar 5 funções:
- `rpc_add_to_queue`
- `rpc_remove_from_queue`
- `rpc_get_next_players_from_queue`
- `rpc_mark_players_matched`
- `rpc_update_queue_heartbeat`

### Passo 7: Testar Function Manualmente (Opcional)

Teste rápido para garantir que funciona:

```sql
-- Substitua 'USER-UUID-AQUI' por um UUID real de usuário do seu banco
SELECT public.rpc_add_to_queue('USER-UUID-AQUI'::UUID, 'default');
```

**Resultado Esperado:**
```json
{
  "success": true,
  "queue_id": 1,
  "position": 1
}
```

---

## ✅ VERIFICAÇÃO FINAL

Após aplicar, verifique:

- [ ] 4 tabelas criadas no Supabase
- [ ] 5 funções RPC criadas
- [ ] Nenhum erro na execução do SQL
- [ ] Teste manual retorna JSON válido

---

## 🚨 TROUBLESHOOTING

### Erro: "function already exists"

**Solução:** As functions já existem. Isso é OK, elas serão atualizadas.

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando a conta com permissões de administrador do projeto.

### Erro: "relation usuarios does not exist"

**Solução:** Execute primeiro o schema completo (`SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql`).

### Erro: "constraint violation"

**Solução:** Verifique se há dados conflitantes nas tabelas. Limpe dados antigos se necessário.

---

## 📝 NOTAS

- As tabelas usam Foreign Keys com CASCADE, então deletar usuário remove automaticamente suas entradas na fila e partidas
- As functions são `SECURITY DEFINER`, então executam com privilégios elevados
- Isso está correto - devem ser chamadas apenas pelo backend usando `service_role` key
- Nunca exponha essas functions diretamente ao frontend

---

## 🔗 RELAÇÃO COM FASES ANTERIORES

**IMPORTANTE:** A Fase 3 depende das Fases 1 e 2!

Certifique-se de que:
- ✅ RPC functions da Fase 1 foram aplicadas (`rpc_add_balance`, etc.)
- ✅ Schema da Fase 2 foi aplicado (`webhook_events`)
- ✅ Tabela `usuarios` existe

Se não aplicou as fases anteriores ainda, aplique na ordem:
1. `database/rpc-financial-acid.sql` (Fase 1)
2. `database/schema-webhook-events.sql` (Fase 2)
3. `database/schema-queue-matches.sql` (Fase 3)

---

**Após aplicar, o sistema de persistência da fila estará 100% funcional!**

