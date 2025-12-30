# 📋 IMPLEMENTATION MANIFEST V19
## Correção Total V19 - Passos Exatos de Implementação
## Data: 2025-12-05
## Versão: V19.0.0

---

## ⚠️ PRÉ-REQUISITOS OBRIGATÓRIOS

Antes de iniciar, verifique:

1. ✅ **Backup V19 existe:** `BACKUP-V19-SNAPSHOT/` com pelo menos 515 arquivos
2. ✅ **Node.js >= 18.0.0:** `node --version`
3. ✅ **PostgreSQL >= 13.0:** `psql --version`
4. ✅ **DATABASE_URL configurada:** `echo $DATABASE_URL`
5. ✅ **Variáveis de ambiente:** Verificar `.env` ou variáveis do sistema

---

## 📋 PASSOS DE IMPLEMENTAÇÃO (ORDEM EXATA)

### ETAPA 1: Verificação de Backup

**Comando:**
```bash
node src/scripts/verify_backup_and_proceed.js
```

**Critério de Sucesso:**
- ✅ Backup encontrado e validado
- ✅ Checksums verificados
- ✅ Arquivos críticos presentes

**Se falhar:** Abortar e reportar erro.

---

### ETAPA 2: Backup Adicional Antes da Migration

**Comando:**
```bash
bash src/scripts/backup_before_migration.sh
```

**Critério de Sucesso:**
- ✅ Backup criado em `BACKUP-V19-SNAPSHOT/database/backup.pre_migration_*.dump`
- ✅ Checksum SHA-256 gerado
- ✅ Tamanho do backup > 0

**Se falhar:** Abortar e reportar erro.

---

### ETAPA 3: Aplicar Migration SQL

**Comando:**
```bash
bash src/migrations/apply_migration.sh
```

**OU manualmente:**
```bash
psql "$DATABASE_URL" -f prisma/migrations/20251205_v19_rls_indexes_migration.sql
```

**Critério de Sucesso:**
- ✅ Migration executada sem erros
- ✅ RLS habilitado em 8 tabelas críticas
- ✅ Índices criados (pelo menos 7 novos)
- ✅ Policies criadas (pelo menos 15)
- ✅ Tabela system_heartbeat criada
- ✅ Colunas adicionadas em lotes (persisted_global_counter, synced_at)

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

**Se falhar:** Executar rollback automático.

---

### ETAPA 4: Migrar Lotes de Memória para DB

**Comando:**
```bash
node src/scripts/migrate_memory_lotes_to_db.js
```

**Critério de Sucesso:**
- ✅ Lotes migrados sem erros
- ✅ Chutes reconciliados
- ✅ Relatório gerado em `logs/migration_report_*.json`
- ✅ Confirmação salva em `BACKUP-V19-SNAPSHOT/migration_confirmations/`

**Verificação:**
```sql
-- Verificar lotes sincronizados
SELECT id, posicao_atual, synced_at FROM lotes 
WHERE status = 'ativo' AND synced_at IS NOT NULL;
```

**Se falhar:** Verificar logs e tentar novamente (máximo 3 tentativas).

---

### ETAPA 5: Executar Testes

**Comando:**
```bash
npm test
```

**OU testes específicos:**
```bash
npm test -- rls.policies.test.js
npm test -- concurrency.fila.test.js
npm test -- migration.integration.test.js
npm test -- smoke.test.js
```

**Critério de Sucesso:**
- ✅ Todos os testes passam
- ✅ RLS policies funcionando
- ✅ Concorrência validada
- ✅ Migração integrada

**Se falhar:** Abortar e executar rollback.

---

### ETAPA 6: Ativar USE_DB_QUEUE e Monitorar

**Configuração:**
```bash
# Adicionar ao .env
echo "USE_DB_QUEUE=true" >> .env
```

**Reiniciar servidor:**
```bash
npm start
```

**Monitorar por 10+ minutos:**
```bash
# Em outro terminal
watch -n 5 'curl -s http://localhost:8080/monitor | jq .'
```

**Critério de Sucesso:**
- ✅ Servidor inicia sem erros
- ✅ Endpoint `/monitor` responde
- ✅ Métricas atualizando corretamente
- ✅ Nenhum erro crítico nos logs
- ✅ Heartbeat funcionando

**Se falhar:** Reverter `USE_DB_QUEUE=false` e investigar.

---

### ETAPA 7: Arquivar Código Obsoleto

**Comando:**
```bash
bash src/scripts/archive_obsolete_code.sh
```

**Critério de Sucesso:**
- ✅ Arquivos movidos para `archive/legacy/`
- ✅ Relatório gerado em `archive/legacy/archive_report_*.json`
- ✅ Arquivos originais ainda existem (não deletados)

**Verificação:**
```bash
ls -la archive/legacy/
cat archive/legacy/archive_report_*.json | jq .
```

**Se falhar:** Continuar (não crítico).

---

### ETAPA 8: Configurar Auditoria Contínua

**Configurar cron (Linux/Mac):**
```bash
# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd) && node src/scripts/auditoria_check.js >> logs/audit.log 2>&1") | crontab -
```

**OU Windows Task Scheduler:**
```powershell
# Criar tarefa agendada para executar a cada 5 minutos
```

**Critério de Sucesso:**
- ✅ Cron configurado
- ✅ Primeira execução bem-sucedida
- ✅ Relatório em `docs/audit/latest-audit.json`

---

### ETAPA 9: Configurar Heartbeat

**Adicionar ao server-fly.js:**
```javascript
const { startHeartbeat } = require('./src/scripts/heartbeat_sender');
startHeartbeat();
```

**Critério de Sucesso:**
- ✅ Heartbeat sendo enviado a cada 5s
- ✅ Registros em `system_heartbeat`
- ✅ Sem erros nos logs

---

### ETAPA 10: Gerar Relatório Final

**Comando:**
```bash
node -e "
const fs = require('fs');
const report = {
  timestamp: new Date().toISOString(),
  version: 'V19.0.0',
  status: 'APPLIED',
  etapas: {
    backup: 'OK',
    migration: 'OK',
    testes: 'OK',
    monitoramento: 'OK'
  }
};
fs.writeFileSync('RELATORIO-CORRECAO-V19-APPLIED.md', JSON.stringify(report, null, 2));
"
```

---

## 🔄 ROLLBACK AUTOMÁTICO

Se qualquer etapa falhar, o sistema executa rollback automaticamente:

**Script de Rollback:**
```bash
bash BACKUP-V19-SNAPSHOT/rollback/rollback_all.sh
```

**OU manualmente:**
```bash
# Rollback do banco
psql "$DATABASE_URL" -f prisma/migrations/20251205_v19_rollback.sql

# Rollback do código
bash BACKUP-V19-SNAPSHOT/rollback/rollback_project.sh
```

---

## ✅ CHECKLIST DE VALIDAÇÃO PÓS-MIGRATION

Execute estas verificações após aplicar a migration:

- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Índices criados e funcionando
- [ ] Policies criadas e testadas
- [ ] Lotes migrados para DB
- [ ] Endpoint `/monitor` funcionando
- [ ] Endpoint `/metrics` funcionando
- [ ] Heartbeat enviando corretamente
- [ ] Testes passando
- [ ] Nenhum erro crítico nos logs
- [ ] Backup adicional criado

---

## 📞 SUPORTE

Em caso de problemas:

1. Verificar logs em `logs/migration-*.log`
2. Verificar relatório em `logs/migration_report_*.json`
3. Executar rollback se necessário
4. Consultar `ACCEPTANCE_CHECKLIST.md`

---

**Gerado em:** 2025-12-05  
**Versão:** V19.0.0  
**Status:** ✅ Pronto para execução

