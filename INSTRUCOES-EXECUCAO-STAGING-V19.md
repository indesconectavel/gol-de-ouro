# 📋 INSTRUÇÕES PARA EXECUÇÃO V19 EM STAGING
## Guia Passo a Passo Completo
## Data: 2025-12-05

---

## ⚠️ PRÉ-REQUISITOS

Antes de executar, verifique:

1. **DATABASE_URL configurada:**
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   # OU
   echo $DATABASE_URL  # Deve mostrar a connection string
   ```

2. **Node.js >= 18.0.0:**
   ```bash
   node --version
   ```

3. **PostgreSQL tools (psql, pg_dump):**
   ```bash
   psql --version
   pg_dump --version
   ```

4. **Backup V19 presente:**
   ```bash
   ls -la BACKUP-V19-SNAPSHOT/
   ```

---

## 🚀 EXECUÇÃO AUTOMÁTICA (RECOMENDADO)

### Opção 1: Script Completo

```bash
# Verificar ambiente primeiro
node src/scripts/execute_v19_staging_safe.js

# Se OK, executar completo
node src/scripts/execute_v19_staging.js
```

**O script executará automaticamente:**
1. ✅ Verificação de backup
2. 💾 Backup pré-migration
3. 📋 Migration SQL
4. 🔄 Migração memória → DB
5. 🧪 Testes completos
6. ⚙️ Ativação USE_DB_QUEUE
7. 📊 Monitoramento
8. ✅ Validação checklist
9. 📄 Relatório final

**Em caso de falha:** Rollback automático será executado

---

## 🔧 EXECUÇÃO MANUAL (PASSO A PASSO)

### ETAPA 1: Verificar Backup

```bash
node src/scripts/verify_backup_and_proceed.js
```

**Critério de sucesso:** ✅ Backup encontrado e validado

---

### ETAPA 2: Backup Pré-Migration

```bash
bash src/scripts/backup_before_migration.sh
```

**Critério de sucesso:** 
- ✅ Arquivo `BACKUP-V19-SNAPSHOT/database/backup.pre_migration_*.dump` criado
- ✅ Checksum SHA-256 gerado

---

### ETAPA 3: Aplicar Migration SQL

```bash
bash src/migrations/apply_migration.sh
```

**OU manualmente:**
```bash
psql "$DATABASE_URL" -f prisma/migrations/20251205_v19_rls_indexes_migration.sql
```

**Critério de sucesso:**
- ✅ Migration executada sem erros
- ✅ RLS habilitado em 8 tabelas
- ✅ 9 índices criados
- ✅ 16 policies criadas

**Verificação:**
```sql
-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes');

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

---

### ETAPA 4: Migrar Memória → DB

```bash
node src/scripts/migrate_memory_lotes_to_db.js
```

**Critério de sucesso:**
- ✅ Lotes migrados sem erros
- ✅ Relatório em `logs/migration_report_*.json`
- ✅ Confirmação em `BACKUP-V19-SNAPSHOT/migration_confirmations/`

---

### ETAPA 5: Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- rls.policies.test.js
npm test -- concurrency.fila.test.js
npm test -- migration.integration.test.js
npm test -- smoke.test.js
```

**Critério de sucesso:** ✅ Todos os testes passam

---

### ETAPA 6: Ativar USE_DB_QUEUE

```bash
# Adicionar ao .env ou .env.staging
echo "USE_DB_QUEUE=true" >> .env.staging

# Reiniciar servidor
npm start
```

**Critério de sucesso:** ✅ Servidor inicia sem erros

---

### ETAPA 7: Monitoramento

```bash
# Verificar endpoint /monitor
curl http://localhost:8080/monitor | jq .

# Verificar endpoint /metrics
curl http://localhost:8080/metrics | head -20
```

**Monitoramento contínuo (10-15 minutos):**
```bash
# Em outro terminal
watch -n 5 'curl -s http://localhost:8080/monitor | jq .metrics'
```

---

### ETAPA 8: Validação Checklist

```bash
node src/scripts/post_migration_checks.js
```

**Critério de sucesso:**
- ✅ RLS habilitado em 8 tabelas
- ✅ 9 índices criados
- ✅ 16 policies criadas
- ✅ 2 colunas adicionadas
- ✅ Tabela system_heartbeat presente
- ✅ RPC functions válidas
- ✅ Testes OK
- ✅ /monitor OK
- ✅ Latência < 600ms
- ✅ Heartbeat ativo

---

### ETAPA 9: Gerar Relatório

O relatório será gerado automaticamente em: `RELATORIO-STAGING-V19.md`

---

## 🔄 ROLLBACK (SE NECESSÁRIO)

Se qualquer etapa falhar, execute rollback:

```bash
bash BACKUP-V19-SNAPSHOT/rollback/rollback_all.sh
```

**OU manualmente:**
```bash
# Rollback do banco
psql "$DATABASE_URL" -f prisma/migrations/20251205_v19_rollback.sql

# Restaurar backup
pg_restore -c "$DATABASE_URL" BACKUP-V19-SNAPSHOT/database/backup.pre_migration_*.dump
```

---

## 📊 VALIDAÇÃO FINAL

Após execução completa, verificar:

1. **RLS habilitado:**
   ```sql
   SELECT COUNT(*) FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = true 
   AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards');
   -- Deve retornar 8
   ```

2. **Índices criados:**
   ```sql
   SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND indexname LIKE 'idx_chutes%' OR indexname LIKE 'idx_transacoes%' OR indexname LIKE 'idx_lotes%';
   -- Deve retornar pelo menos 9
   ```

3. **Policies criadas:**
   ```sql
   SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public';
   -- Deve retornar pelo menos 16
   ```

4. **Monitoramento:**
   ```bash
   curl http://localhost:8080/monitor
   curl http://localhost:8080/metrics
   ```

5. **Heartbeat:**
   ```sql
   SELECT * FROM system_heartbeat ORDER BY last_seen DESC LIMIT 5;
   ```

---

## ✅ CRITÉRIOS DE SUCESSO

A execução será considerada bem-sucedida se:

- ✅ Todas as 9 etapas completadas sem erros
- ✅ Todos os testes passando
- ✅ Validação checklist OK
- ✅ Score de risco < 20
- ✅ Recomendação: GO ou GO_COM_RESERVAS

---

## 📝 LOGS GERADOS

Durante a execução, os seguintes logs serão criados:

- `logs/staging-v19-*.log` - Log completo da execução
- `logs/migration_staging_*.log` - Log da migration SQL
- `logs/migrate-memory-staging.log` - Log da migração de memória
- `logs/migration_report_staging.json` - Relatório JSON
- `logs/monitor-staging-latest.json` - Últimas métricas
- `RELATORIO-STAGING-V19.md` - Relatório final

---

## 🎯 PRÓXIMOS PASSOS APÓS STAGING

Se staging for bem-sucedido:

1. ✅ Revisar `RELATORIO-STAGING-V19.md`
2. ✅ Validar métricas e performance
3. ✅ Aguardar aprovação para produção
4. ✅ Executar em produção seguindo `IMPLEMENTATION_MANIFEST.md`

---

**Gerado em:** 2025-12-05  
**Versão:** V19.0.0  
**Status:** ✅ Instruções completas

