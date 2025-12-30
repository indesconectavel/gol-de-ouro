# ✅ CHECKLIST PÓS-MIGRATION V19
## Comandos e Validações Após Aplicar Migration V19

---

## ⚠️ IMPORTANTE

Execute estes comandos **APENAS APÓS** aplicar a migration V19 no Supabase Dashboard.

**Ordem de execução:** Execute na ordem apresentada abaixo.

---

## 📋 CHECKLIST DE VALIDAÇÃO

### ✅ 1. Verificar Servidor Rodando

**Antes de tudo, certifique-se de que o servidor está rodando:**

```bash
# Verificar se servidor responde
curl http://localhost:8080/health
```

**Resultado esperado:**
```json
{"success":true,"timestamp":"...","data":{"status":"ok",...}}
```

**Se não estiver rodando:**
```bash
node server-fly.js
```

**Aguarde mensagens:**
- ✅ "ENGINE V19 ATIVA"
- ✅ "HEARTBEAT iniciado"
- ✅ "Conectado ao Supabase"

---

### ✅ 2. Validar Heartbeat

**Comando:**
```bash
node src/scripts/validate_heartbeat_v19.js
```

**Resultado esperado:**
- ✅ Tabela system_heartbeat existe
- ✅ Registros de heartbeat encontrados
- ✅ Heartbeat sendo atualizado (< 60 segundos)
- ✅ Instance ID consistente

**Se falhar:**
- Verifique se migration foi aplicada corretamente
- Verifique se servidor está rodando
- Verifique logs do servidor

---

### ✅ 3. Validar Endpoint /monitor

**Comando:**
```bash
node src/scripts/validate_monitor_endpoint.js
```

**Resultado esperado:**
- ✅ HTTP 200
- ✅ JSON válido com:
  - `status: "ok"`
  - `engineVersion: "V19"`
  - `dbQueue: true`
  - `heartbeat: true`
  - `metricsCount > 0`

**Se falhar:**
- Verifique se migration foi aplicada
- Verifique logs do servidor
- Verifique se tabela system_heartbeat existe

---

### ✅ 4. Validar Endpoint /metrics

**Comando:**
```bash
node src/scripts/validate_metrics_endpoint.js
```

**Resultado esperado:**
- ✅ HTTP 200
- ✅ Content-Type: text/plain
- ✅ Métricas Prometheus válidas
- ✅ `engine_v19_active 1` presente
- ✅ `process_cpu_user_seconds_total` presente
- ✅ `http_request_duration_seconds` presente

**Se falhar:**
- Verifique se migration foi aplicada
- Verifique logs do servidor
- Verifique se prom-client está instalado

---

### ✅ 5. Validação Final ENGINE V19

**Comando:**
```bash
node src/scripts/validate_engine_v19_final.js
```

**Resultado esperado:**
- ✅ Migration: OK
- ✅ RLS: OK
- ✅ Policies: OK
- ✅ Heartbeat: OK
- ✅ DB Queue: OK
- ✅ Monitor: OK

**Total:** 6/6 componentes OK

**Se falhar:**
- Verifique quais componentes falharam
- Consulte logs detalhados
- Verifique se migration foi aplicada completamente

---

### ✅ 6. Migração de Lotes (Opcional)

**⚠️ IMPORTANTE:** Execute apenas se:
- ✅ Servidor está rodando
- ✅ Migration V19 foi aplicada
- ✅ Heartbeat está funcionando

**Comando:**
```bash
node src/scripts/migrate_memory_lotes_to_db.js
```

**Resultado esperado:**
- ✅ Migração iniciada
- ✅ Lotes em memória lidos
- ✅ Lotes inseridos/atualizados no banco
- ✅ Consistência verificada
- ✅ Relatório gerado

**Se falhar:**
- Verifique se servidor está rodando
- Verifique se endpoint interno está disponível
- Verifique logs do servidor

---

## 📊 VALIDAÇÕES MANUAIS ADICIONAIS

### Verificar Tabela system_heartbeat

**No Supabase SQL Editor, execute:**
```sql
SELECT * 
FROM public.system_heartbeat 
ORDER BY last_seen DESC 
LIMIT 5;
```

**Resultado esperado:**
- ✅ Query executa sem erro
- ✅ Retorna registros recentes (< 60 segundos)
- ✅ Instance ID consistente

---

### Verificar Coluna persisted_global_counter

**No Supabase SQL Editor, execute:**
```sql
SELECT id, status, persisted_global_counter
FROM public.lotes
ORDER BY id DESC
LIMIT 10;
```

**Resultado esperado:**
- ✅ Query executa sem erro
- ✅ Coluna `persisted_global_counter` presente
- ✅ Valores retornados (pode ser NULL inicialmente)

---

### Verificar RLS Habilitado

**No Supabase SQL Editor, execute:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'system_heartbeat');
```

**Resultado esperado:**
- ✅ Todas as tabelas com `rowsecurity = true`

---

### Verificar Policies Criadas

**No Supabase SQL Editor, execute:**
```sql
SELECT policyname, tablename, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Resultado esperado:**
- ✅ Múltiplas policies listadas
- ✅ Policies para backend, observer, admin
- ✅ Policies para SELECT, INSERT, UPDATE conforme necessário

---

### Verificar RPC Functions

**No Supabase SQL Editor, execute:**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'rpc_get_or_create_lote',
  'rpc_update_lote_after_shot',
  'rpc_add_balance',
  'rpc_deduct_balance'
)
ORDER BY routine_name;
```

**Resultado esperado:**
- ✅ 4 RPC functions listadas
- ✅ Todas com `routine_type = 'FUNCTION'`

---

## 🎯 RESUMO DE VALIDAÇÃO

Após executar todos os comandos acima, você deve ter:

- ✅ Servidor rodando
- ✅ Heartbeat funcionando
- ✅ Endpoint /monitor funcionando (HTTP 200)
- ✅ Endpoint /metrics funcionando (HTTP 200)
- ✅ Validação final ENGINE V19: 6/6 OK
- ✅ Migração de lotes executada (se aplicável)

---

## 📄 RELATÓRIOS GERADOS

Após executar as validações, os seguintes arquivos serão gerados:

- `logs/validation_heartbeat_v19.json`
- `logs/validation_monitor_endpoint.json`
- `logs/validation_metrics_endpoint.json`
- `logs/validation_final_v19.json`
- `logs/migration_lotes_execution.log` (se migração executada)

---

## 🚨 TROUBLESHOOTING

### Problema: Heartbeat não está sendo atualizado

**Solução:**
- Verifique se `HEARTBEAT_ENABLED=true` no `.env.local`
- Verifique se `startHeartbeat()` está sendo chamado no `server-fly.js`
- Verifique logs do servidor para erros

---

### Problema: Endpoints retornam HTTP 500

**Solução:**
- Verifique se migration foi aplicada completamente
- Verifique se tabela `system_heartbeat` existe
- Verifique logs do servidor para erros específicos
- Reinicie o servidor após aplicar migration

---

### Problema: Validação final mostra componentes faltando

**Solução:**
- Verifique se migration foi aplicada completamente
- Verifique se todas as estruturas foram criadas
- Execute queries SQL manuais para verificar estruturas
- Consulte logs detalhados de cada validação

---

## ✅ CONCLUSÃO

Após executar todos os comandos e validações acima:

**ENGINE V19 ESTÁ 100% ATIVA E VALIDADA**

**Próximos passos:**
1. Executar testes finais manuais
2. Validar funcionalidades críticas
3. Aprovar para produção (se aplicável)

---

**Gerado em:** 2025-12-05T22:00:00Z  
**Versão:** V19.0.0

