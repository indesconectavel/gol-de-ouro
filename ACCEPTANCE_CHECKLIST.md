# ✅ ACCEPTANCE CHECKLIST V19
## Lista de Verificação para Aceitação da Correção V19
## Data: 2025-12-05

---

## 🔍 VERIFICAÇÕES PRÉ-MIGRATION

### Backup
- [ ] `BACKUP-V19-SNAPSHOT/` existe e contém 515+ arquivos
- [ ] `checksums.json` válido e completo
- [ ] Arquivos críticos presentes (server-fly.js, package.json, schema-consolidado.sql)
- [ ] Backup adicional criado antes da migration

**Comando de Verificação:**
```bash
ls -la BACKUP-V19-SNAPSHOT/ | wc -l
node src/scripts/verify_backup_and_proceed.js
```

**Critério:** ✅ Backup válido e completo

---

## 🗄️ VERIFICAÇÕES DE BANCO DE DADOS

### RLS (Row Level Security)
- [ ] RLS habilitado em `usuarios`
- [ ] RLS habilitado em `chutes`
- [ ] RLS habilitado em `lotes`
- [ ] RLS habilitado em `transacoes`
- [ ] RLS habilitado em `pagamentos_pix`
- [ ] RLS habilitado em `saques`
- [ ] RLS habilitado em `webhook_events`
- [ ] RLS habilitado em `rewards`

**Comando de Verificação:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards');
```

**Critério:** ✅ Todas as 8 tabelas com `rowsecurity = true`

### Policies
- [ ] Policy `usuarios_select_own` criada
- [ ] Policy `chutes_select_own` criada
- [ ] Policy `lotes_select_public` criada
- [ ] Policy `transacoes_select_own` criada
- [ ] Policies de INSERT apenas para backend
- [ ] Policies de UPDATE apenas para backend/owner

**Comando de Verificação:**
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes');
```

**Critério:** ✅ Pelo menos 15 policies criadas

### Índices
- [ ] `idx_chutes_usuario_id` criado
- [ ] `idx_chutes_lote_id` criado
- [ ] `idx_chutes_created_at` criado
- [ ] `idx_transacoes_usuario_id` criado
- [ ] `idx_transacoes_created_at` criado
- [ ] `idx_lotes_status_created` criado
- [ ] `idx_lotes_valor_status` criado

**Comando de Verificação:**
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

**Critério:** ✅ Pelo menos 7 novos índices criados

### Colunas Adicionadas
- [ ] `lotes.persisted_global_counter` existe
- [ ] `lotes.synced_at` existe
- [ ] `lotes.posicao_atual` existe

**Comando de Verificação:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes' 
AND column_name IN ('persisted_global_counter', 'synced_at', 'posicao_atual');
```

**Critério:** ✅ Todas as 3 colunas existem

### Tabela system_heartbeat
- [ ] Tabela `system_heartbeat` criada
- [ ] Índices em `system_heartbeat` criados

**Comando de Verificação:**
```sql
SELECT * FROM system_heartbeat LIMIT 1;
```

**Critério:** ✅ Tabela existe e pode ser consultada

---

## 💾 VERIFICAÇÕES DE MIGRAÇÃO DE MEMÓRIA

### Lotes Migrados
- [ ] Lotes ativos migrados para DB
- [ ] `synced_at` preenchido em lotes ativos
- [ ] `posicao_atual` atualizado corretamente

**Comando de Verificação:**
```sql
SELECT COUNT(*) FROM lotes 
WHERE status = 'ativo' AND synced_at IS NOT NULL;
```

**Critério:** ✅ Pelo menos 1 lote sincronizado

### Chutes Reconciliados
- [ ] Chutes em memória inseridos no DB
- [ ] Nenhum chute duplicado
- [ ] `created_at` preservado

**Comando de Verificação:**
```sql
SELECT lote_id, COUNT(*) as total_chutes 
FROM chutes 
GROUP BY lote_id 
ORDER BY total_chutes DESC;
```

**Critério:** ✅ Chutes consistentes com lotes

---

## 🧪 VERIFICAÇÕES DE TESTES

### Testes RLS
- [ ] `rls.policies.test.js` passa
- [ ] Usuário vê apenas seus dados
- [ ] Backend pode inserir/atualizar

**Comando:**
```bash
npm test -- rls.policies.test.js
```

**Critério:** ✅ Todos os testes passam

### Testes de Concorrência
- [ ] `concurrency.fila.test.js` passa
- [ ] Atomicidade garantida
- [ ] Apenas um vencedor por lote

**Comando:**
```bash
npm test -- concurrency.fila.test.js
```

**Critério:** ✅ Testes passam sem race conditions

### Testes de Migração
- [ ] `migration.integration.test.js` passa
- [ ] Reconciliação sem perda de dados

**Comando:**
```bash
npm test -- migration.integration.test.js
```

**Critério:** ✅ Migração validada

### Smoke Tests
- [ ] `smoke.test.js` passa
- [ ] Endpoints respondem corretamente

**Comando:**
```bash
npm test -- smoke.test.js
```

**Critério:** ✅ Todos os endpoints funcionando

---

## 📊 VERIFICAÇÕES DE MONITORAMENTO

### Endpoint /monitor
- [ ] Responde com status 200
- [ ] Retorna JSON válido
- [ ] Contém métricas: `lotes_ativos_count`, `chutes_por_minuto`, `latencia_media_chute_ms`

**Comando:**
```bash
curl http://localhost:8080/monitor | jq .
```

**Critério:** ✅ JSON válido com todas as métricas

### Endpoint /metrics
- [ ] Responde com status 200
- [ ] Content-Type: `text/plain`
- [ ] Formato Prometheus válido
- [ ] Contém métricas: `goldeouro_lotes_ativos`, `goldeouro_chutes_total`

**Comando:**
```bash
curl http://localhost:8080/metrics | head -20
```

**Critério:** ✅ Formato Prometheus válido

### Heartbeat
- [ ] Heartbeat sendo enviado a cada 5s
- [ ] Registros em `system_heartbeat`
- [ ] `last_seen` atualizado recentemente

**Comando:**
```sql
SELECT instance_id, last_seen, 
       EXTRACT(EPOCH FROM (NOW() - last_seen)) as seconds_ago
FROM system_heartbeat 
ORDER BY last_seen DESC 
LIMIT 5;
```

**Critério:** ✅ Último heartbeat < 15 segundos atrás

---

## 🔄 VERIFICAÇÕES DE FUNCIONALIDADE

### Sistema de Lotes
- [ ] Lotes sendo criados via DB
- [ ] Chutes sendo processados corretamente
- [ ] Prêmios sendo creditados
- [ ] Lotes sendo fechados corretamente

**Comando de Verificação:**
```bash
# Fazer um chute de teste e verificar
curl -X POST http://localhost:8080/api/games/shoot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direction": "C", "amount": 1}'
```

**Critério:** ✅ Chute processado sem erros

### Sistema Financeiro
- [ ] Transações sendo criadas via RPC
- [ ] Saldo sendo atualizado corretamente
- [ ] Histórico de transações completo

**Comando de Verificação:**
```sql
SELECT tipo, COUNT(*) as total, SUM(valor) as total_valor
FROM transacoes
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY tipo;
```

**Critério:** ✅ Transações sendo registradas

---

## 📝 VERIFICAÇÕES DE ARQUIVAMENTO

### Código Obsoleto
- [ ] Arquivos movidos para `archive/legacy/`
- [ ] Relatório de arquivamento gerado
- [ ] Arquivos originais ainda existem (não deletados)

**Comando:**
```bash
ls -la archive/legacy/
cat archive/legacy/archive_report_*.json | jq .
```

**Critério:** ✅ Arquivos arquivados e relatório gerado

---

## 🔍 VERIFICAÇÕES DE AUDITORIA

### Auditoria Contínua
- [ ] Script `auditoria_check.js` executando
- [ ] Relatório em `docs/audit/latest-audit.json`
- [ ] Webhook configurado (se aplicável)

**Comando:**
```bash
node src/scripts/auditoria_check.js
cat docs/audit/latest-audit.json | jq .
```

**Critério:** ✅ Auditoria executando sem erros

---

## ✅ CRITÉRIO FINAL DE ACEITAÇÃO

**TODAS as verificações acima devem passar para considerar a migration V19 como bem-sucedida.**

**Se alguma verificação falhar:**
1. Documentar o problema
2. Executar rollback se necessário
3. Corrigir e tentar novamente

---

**Gerado em:** 2025-12-05  
**Versão:** V19.0.0  
**Status:** ✅ Checklist completo

