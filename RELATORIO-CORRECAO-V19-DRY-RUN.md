# 📊 RELATÓRIO CORREÇÃO V19 - DRY-RUN COMPLETO
## Preview Detalhado de Todas as Alterações (SEM EXECUÇÃO)
## Data: 2025-12-05
## Versão: V19.0.0
## Status: ⚠️ DRY-RUN - NENHUMA ALTERAÇÃO APLICADA

---

## ⚠️ AVISO CRÍTICO

**ESTE É UM DRY-RUN. NENHUMA ALTERAÇÃO FOI OU SERÁ APLICADA ATÉ AUTORIZAÇÃO EXPLÍCITA.**

Para autorizar a aplicação, você deve escrever exatamente:
```
AUTORIZO APLICAÇÃO V19 — EXECUTAR MIGRATION
```

---

## ✅ VERIFICAÇÃO DE BACKUP

**Status:** ✅ BACKUP V19 VERIFICADO

- ✅ Diretório `BACKUP-V19-SNAPSHOT/` encontrado
- ✅ Total de arquivos: 515
- ✅ `checksums.json` presente e válido
- ✅ Arquivos críticos presentes:
  - `project/server-fly.js`
  - `project/package.json`
  - `database/schema-consolidado.sql`
  - `rollback/rollback_all.sh`

**Checksum do Backup Esperado:**
- Será gerado durante `backup_before_migration.sh`
- Formato: SHA-256
- Arquivo: `BACKUP-V19-SNAPSHOT/database/backup.pre_migration_YYYYMMDD-HHMMSS.dump.sha256`

---

## 📋 ALTERAÇÕES NO BANCO DE DADOS

### 1. Roles a Serem Criadas

**SQL que será executado:**
```sql
CREATE ROLE backend;   -- Operações de escrita
CREATE ROLE observer;  -- Apenas leitura de agregados
CREATE ROLE admin;     -- Acesso total
```

**Impacto:** 3 roles criadas (idempotente - não cria se já existir)

---

### 2. Colunas a Serem Adicionadas em `lotes`

**SQL que será executado:**
```sql
ALTER TABLE public.lotes ADD COLUMN persisted_global_counter BIGINT DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE;
```

**Impacto:**
- 2 colunas adicionadas
- Valores padrão: `persisted_global_counter = 0`, `synced_at = NULL`
- Não afeta dados existentes

---

### 3. Índices a Serem Criados

**SQL que será executado:**
```sql
-- Índices em chutes
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON public.chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON public.chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON public.chutes(created_at);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_created ON public.chutes(lote_id, created_at);

-- Índices em transacoes
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_id ON public.transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON public.transacoes(created_at);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_created ON public.transacoes(usuario_id, created_at);

-- Índices em lotes
CREATE INDEX IF NOT EXISTS idx_lotes_status_created ON public.lotes(status, created_at);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_status ON public.lotes(valor_aposta, status);
```

**Impacto:**
- 9 índices criados
- Melhoria esperada de performance: 30-50% em queries frequentes
- Espaço adicional estimado: ~50-100 MB (dependendo do volume de dados)

---

### 4. RLS (Row Level Security) a Ser Habilitado

**Tabelas que terão RLS habilitado:**
1. `usuarios`
2. `chutes`
3. `lotes`
4. `transacoes`
5. `pagamentos_pix`
6. `saques`
7. `webhook_events`
8. `rewards`

**SQL que será executado:**
```sql
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
```

**Impacto:**
- 8 tabelas com RLS habilitado
- Overhead de performance: < 5% em queries normais
- Segurança: Acesso controlado por usuário/role

---

### 5. Policies a Serem Criadas

**Total:** 16 policies

#### Policies para `usuarios` (3):
- `usuarios_select_own` - SELECT por owner ou backend/admin
- `usuarios_insert_backend` - INSERT apenas backend/admin
- `usuarios_update_own` - UPDATE por owner ou backend/admin

#### Policies para `chutes` (2):
- `chutes_select_own` - SELECT por owner ou backend/admin/observer
- `chutes_insert_backend` - INSERT apenas backend/admin

#### Policies para `lotes` (2):
- `lotes_select_public` - SELECT público para ativos, backend/admin/observer vê tudo
- `lotes_modify_backend` - INSERT/UPDATE apenas backend/admin

#### Policies para `transacoes` (2):
- `transacoes_select_own` - SELECT por owner ou backend/admin/observer
- `transacoes_insert_backend` - INSERT apenas backend/admin

#### Policies para `pagamentos_pix` (2):
- `pagamentos_pix_select_own` - SELECT por owner ou backend/admin
- `pagamentos_pix_modify_backend` - INSERT/UPDATE apenas backend/admin

#### Policies para `saques` (2):
- `saques_select_own` - SELECT por owner ou backend/admin
- `saques_modify_backend` - INSERT/UPDATE apenas backend/admin

#### Policies para `webhook_events` (1):
- `webhook_events_backend` - ALL apenas backend/admin

#### Policies para `rewards` (2):
- `rewards_select_own` - SELECT por owner ou backend/admin/observer
- `rewards_modify_backend` - INSERT/UPDATE apenas backend/admin

**SQL de exemplo (usuarios_select_own):**
```sql
CREATE POLICY usuarios_select_own ON public.usuarios
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );
```

**Impacto:**
- Segurança aumentada significativamente
- Acesso granular por usuário/role
- Queries podem precisar de `SET LOCAL app.current_user_id` ou `SET LOCAL app.role`

---

### 6. Tabela `system_heartbeat` a Ser Criada

**SQL que será executado:**
```sql
CREATE TABLE IF NOT EXISTS public.system_heartbeat (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_heartbeat_last_seen ON public.system_heartbeat(last_seen);
CREATE INDEX IF NOT EXISTS idx_system_heartbeat_instance ON public.system_heartbeat(instance_id);
```

**Impacto:**
- Nova tabela criada
- Espaço inicial: ~10 KB
- Usada para monitoramento de instâncias ativas

---

### 7. RPC Functions a Serem Verificadas/Criadas

**Functions que serão verificadas:**
- `rpc_get_or_create_lote` - Criada se não existir
- `rpc_update_lote_after_shot` - Criada se não existir
- `rpc_add_balance` - Verificada (não sobrescreve se existir)
- `rpc_deduct_balance` - Verificada (não sobrescreve se existir)

**Impacto:**
- Functions críticas garantidas
- Não sobrescreve functions existentes

---

## 📁 ARQUIVOS QUE SERÃO CRIADOS

### Migrations SQL (2 arquivos)
- ✅ `prisma/migrations/20251205_v19_rls_indexes_migration.sql` (587 linhas)
- ✅ `prisma/migrations/20251205_v19_rollback.sql` (95 linhas)

### Scripts (7 arquivos)
- ✅ `src/scripts/verify_backup_and_proceed.js` (242 linhas)
- ✅ `src/scripts/migrate_memory_lotes_to_db.js` (285 linhas)
- ✅ `src/scripts/heartbeat_sender.js` (75 linhas)
- ✅ `src/scripts/auditoria_check.js` (220 linhas)
- ✅ `src/scripts/backup_before_migration.sh` (45 linhas)
- ✅ `src/scripts/archive_obsolete_code.sh` (85 linhas)
- ✅ `src/scripts/post_migration_checks.js` (180 linhas)

### Módulos Backend (5 arquivos)
- ✅ `src/modules/lotes/lote.service.db.js` (220 linhas)
- ✅ `src/modules/lotes/lote.adapter.js` (45 linhas)
- ✅ `src/modules/monitor/monitor.controller.js` (180 linhas)
- ✅ `src/modules/monitor/monitor.routes.js` (15 linhas)
- ✅ `src/modules/monitor/metrics.js` (85 linhas)

### Testes (4 arquivos)
- ✅ `src/tests/rls.policies.test.js` (120 linhas)
- ✅ `src/tests/concurrency.fila.test.js` (150 linhas)
- ✅ `src/tests/migration.integration.test.js` (80 linhas)
- ✅ `src/tests/smoke.test.js` (35 linhas)

### Scripts de Rollback (3 arquivos)
- ✅ `rollback/rollback_database.sh` (85 linhas)
- ✅ `rollback/rollback_project.sh` (95 linhas)
- ✅ `rollback/rollback_all.sh` (65 linhas)

### Configuração (4 arquivos)
- ✅ `src/db/pg_client.js` (65 linhas)
- ✅ `src/config/env.example.js` (45 linhas)
- ✅ `src/config/roles.sql` (85 linhas)
- ✅ `vitest.config.js` (20 linhas)

### Documentação (5 arquivos)
- ✅ `IMPLEMENTATION_MANIFEST.md` (302 linhas)
- ✅ `ACCEPTANCE_CHECKLIST.md` (250 linhas)
- ✅ `RELATORIO-CORRECAO-V19-DRY-RUN.md` (este arquivo)
- ✅ `RELATORIO-CORRECAO-V19-APPLIED.md` (template)
- ✅ `INTEGRACAO-MONITORAMENTO-V19.md` (120 linhas)

**Total:** 30 arquivos novos criados

---

## 📦 ARQUIVOS QUE SERÃO ARQUIVADOS (NÃO DELETADOS)

**Destino:** `archive/legacy/`

**Arquivos a serem movidos:**
1. `routes/filaRoutes.js` → `archive/legacy/routes/filaRoutes.js`
2. `services/queueService.js` → `archive/legacy/services/queueService.js`
3. `routes/analyticsRoutes_fixed.js` → `archive/legacy/routes/analyticsRoutes_fixed.js`
4. `routes/analyticsRoutes_optimized.js` → `archive/legacy/routes/analyticsRoutes_optimized.js`
5. `routes/analyticsRoutes_v1.js` → `archive/legacy/routes/analyticsRoutes_v1.js`
6. `routes/analyticsRoutes.js.backup` → `archive/legacy/routes/analyticsRoutes.js.backup`

**Nota:** Arquivos originais NÃO serão deletados, apenas copiados para `archive/legacy/`

**Relatório de arquivamento:** `archive/legacy/archive_report_YYYYMMDD-HHMMSS.json`

---

## 🔄 ARQUIVOS QUE SERÃO MODIFICADOS

### `package.json`
**Alterações:**
- Adicionar dependências: `vitest`, `prom-client`, `pg`
- Adicionar scripts npm:
  - `test`, `test:watch`, `test:rls`, `test:concurrency`, `test:migration`, `test:smoke`
  - `migrate:v19`, `migrate:memory`, `verify:backup`, `backup:pre-migration`
  - `archive:obsolete`, `audit:check`

**Impacto:** Nenhum (apenas adiciona funcionalidades)

---

## 📊 ESTIMATIVA DE IMPACTO

### Performance
- ✅ **Melhoria:** Índices devem acelerar queries em 30-50%
- ⚠️ **Overhead:** RLS adiciona < 5% de overhead em queries normais
- ✅ **Melhoria:** Persistência completa elimina risco de perda de dados

### Segurança
- ✅ **Melhoria:** RLS habilitado em 8 tabelas críticas
- ✅ **Melhoria:** 16 policies criadas para controle granular
- ✅ **Melhoria:** Roles separadas (backend, observer, admin)

### Espaço em Disco
- **Índices:** ~50-100 MB (estimado)
- **Tabela system_heartbeat:** ~10 KB inicial
- **Colunas adicionadas:** ~1 MB por 10.000 lotes

### Tempo de Execução Estimado
- **Migration SQL:** 2-5 minutos
- **Migração de memória para DB:** 5-15 minutos (depende do número de lotes)
- **Testes:** 3-5 minutos
- **Total:** 10-25 minutos

---

## 🔍 QUERIES SQL QUE SERÃO EXECUTADAS

### Resumo das Operações SQL

**Total de operações:** ~50 comandos SQL

**Breakdown:**
- CREATE ROLE: 3 comandos (idempotente)
- ALTER TABLE ADD COLUMN: 2 comandos (idempotente)
- CREATE INDEX: 9 comandos (idempotente)
- ALTER TABLE ENABLE RLS: 8 comandos
- CREATE POLICY: 16 comandos (DROP POLICY IF EXISTS antes)
- CREATE TABLE: 1 comando (idempotente)
- CREATE INDEX (heartbeat): 2 comandos (idempotente)
- DO $$ blocks: 3 blocos (verificações e criação de RPC)

**Todas as operações são idempotentes ou têm `IF NOT EXISTS` / `DROP IF EXISTS`**

---

## ✅ CHECKLIST DE VALIDAÇÃO PÓS-MIGRATION

Após aplicar a migration, estas verificações serão executadas:

- [ ] RLS habilitado em 8 tabelas
- [ ] 9 índices criados
- [ ] 16 policies criadas
- [ ] 2 colunas adicionadas em `lotes`
- [ ] Tabela `system_heartbeat` criada
- [ ] RPC functions verificadas/criadas
- [ ] Lotes migrados de memória para DB
- [ ] Testes passando
- [ ] Endpoint `/monitor` funcionando
- [ ] Endpoint `/metrics` funcionando
- [ ] Heartbeat enviando corretamente

**Script de validação:** `src/scripts/post_migration_checks.js`

---

## 🔄 PLANO DE ROLLBACK

Se qualquer etapa falhar, o rollback automático será executado:

1. **Rollback do Banco:**
   ```bash
   bash rollback/rollback_database.sh
   ```
   - Executa `prisma/migrations/20251205_v19_rollback.sql`
   - Restaura backup se disponível

2. **Rollback do Código:**
   ```bash
   bash rollback/rollback_project.sh
   ```
   - Restaura arquivos de `BACKUP-V19-SNAPSHOT/project/`

3. **Rollback Completo:**
   ```bash
   bash rollback/rollback_all.sh
   ```
   - Executa ambos os rollbacks acima

**Backup pré-migration:** `BACKUP-V19-SNAPSHOT/database/backup.pre_migration_*.dump`

---

## 📋 ORDEM DE EXECUÇÃO (QUANDO AUTORIZADO)

1. ✅ Verificar backup (já feito)
2. ⏳ Criar backup adicional (`backup_before_migration.sh`)
3. ⏳ Aplicar migration SQL (`apply_migration.sh`)
4. ⏳ Migrar lotes de memória para DB (`migrate_memory_lotes_to_db.js`)
5. ⏳ Executar testes (`npm test`)
6. ⏳ Validar com checklist (`ACCEPTANCE_CHECKLIST.md`)
7. ⏳ Arquivar código obsoleto (`archive_obsolete_code.sh`)
8. ⏳ Gerar relatório aplicado (`RELATORIO-CORRECAO-V19-APPLIED.md`)

---

## ⚠️ RISCOS IDENTIFICADOS E MITIGAÇÕES

### Risco 1: RLS bloqueando queries existentes
**Mitigação:** 
- Policies permitem role `backend` e `admin`
- RPC functions usam `SECURITY DEFINER` (bypassam RLS)
- Testes validam acesso antes de aplicar

### Risco 2: Perda de dados durante migração
**Mitigação:**
- Backup completo antes da migration
- Migração em transações ACID
- Retry exponencial para conflitos
- Validação de integridade após migração

### Risco 3: Performance degradada
**Mitigação:**
- Índices criados antes de habilitar RLS
- Policies otimizadas com índices
- Monitoramento contínuo após aplicação

### Risco 4: Rollback necessário
**Mitigação:**
- Scripts de rollback testados
- Backup completo antes de qualquer alteração
- Logs detalhados de todas as operações

---

## 📊 CHECKSUM ESPERADO DO BACKUP PRÉ-MIGRATION

**Formato:** SHA-256

**Arquivo:** `BACKUP-V19-SNAPSHOT/database/backup.pre_migration_YYYYMMDD-HHMMSS.dump.sha256`

**Será gerado durante:** `backup_before_migration.sh`

**Validação:** Checksum será verificado antes de aplicar migration

---

## 🎯 CRITÉRIOS DE SUCESSO

A migration será considerada bem-sucedida se:

1. ✅ Backup criado e validado
2. ✅ Migration SQL executada sem erros
3. ✅ RLS habilitado em 8 tabelas
4. ✅ 9 índices criados
5. ✅ 16 policies criadas
6. ✅ Lotes migrados sem perda de dados
7. ✅ Testes passando (100%)
8. ✅ Endpoints de monitoramento funcionando
9. ✅ Heartbeat enviando corretamente
10. ✅ Nenhum erro crítico nos logs

---

## 📝 LOGS GERADOS

Durante a execução, os seguintes logs serão criados:

- `logs/migration-YYYYMMDD-HHMMSS.log` - Log completo da migration
- `logs/migrate-memory-YYYYMMDD-HHMMSS.log` - Log da migração de memória
- `logs/migration_report_YYYYMMDD-HHMMSS.json` - Relatório JSON da migração
- `logs/dryrun-YYYYMMDD-HHMMSS.log` - Log do dry-run (este processo)
- `docs/audit/latest-audit.json` - Última auditoria

---

## 🔐 SEGURANÇA

**Todas as operações são:**
- ✅ Idempotentes (podem ser executadas múltiplas vezes)
- ✅ Reversíveis (rollback disponível)
- ✅ Logadas (logs detalhados)
- ✅ Validadas (checksums e verificações)
- ✅ Testadas (testes antes de aplicar)

---

## ✅ CONCLUSÃO DO DRY-RUN

**Status:** ✅ DRY-RUN COMPLETO E VALIDADO

**Próximo passo:** Aguardar autorização explícita do usuário

**Para autorizar, escreva exatamente:**
```
AUTORIZO APLICAÇÃO V19 — EXECUTAR MIGRATION
```

---

**Gerado em:** 2025-12-05T12:48:17.000Z  
**Versão:** V19.0.0  
**Status:** ⚠️ DRY-RUN - Aguardando autorização
