# ✅ CHECKLIST DE AÇÕES - ENGINE V19
## Data: 2025-12-07
## Versão: V19.0.0

---

## ⚠️ IMPORTANTE

**Execute estas ações na ordem apresentada.**

**Modo:** READ-ONLY até autorização explícita com comando "APLICAR CORREÇÕES"

---

## 📋 FASE 1: PREPARAÇÃO (ANTES DE QUALQUER MODIFICAÇÃO)

### ✅ 1.1 Backup do Banco de Dados

- [ ] Criar backup completo do Supabase
- [ ] Verificar backup antes de prosseguir
- [ ] Documentar localização do backup

**Comando Sugerido:**
```bash
# Via Supabase Dashboard: Settings > Database > Backups
# Ou via CLI:
supabase db dump > backup-pre-v19-$(date +%Y%m%d).sql
```

### ✅ 1.2 Verificar Ambiente

- [ ] Confirmar acesso ao Supabase Dashboard
- [ ] Confirmar acesso ao projeto correto
- [ ] Verificar permissões de Service Role Key

### ✅ 1.3 Documentar Estado Atual

- [ ] Executar `src/scripts/validate_engine_v19_final.js`
- [ ] Salvar output em `logs/pre-migration-state.json`
- [ ] Documentar versão atual do código

---

## 📋 FASE 2: APLICAÇÃO DA MIGRATION V19 (CRÍTICO)

### ✅ 2.1 Aplicar Migration Principal

**Arquivo:** `logs/migration_v19/MIGRATION-V19.sql`

**Passos:**
1. [ ] Acessar Supabase Dashboard
2. [ ] Abrir SQL Editor
3. [ ] Copiar TODO o conteúdo de `logs/migration_v19/MIGRATION-V19.sql`
4. [ ] Colar no SQL Editor
5. [ ] Executar (RUN)
6. [ ] Verificar mensagens de sucesso
7. [ ] Verificar se não há erros

**Validação:**
- [ ] Verificar se tabela `system_heartbeat` foi criada
- [ ] Verificar se colunas em `lotes` foram adicionadas
- [ ] Verificar se RLS foi habilitado

**Query de Validação:**
```sql
-- Verificar system_heartbeat
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'system_heartbeat';

-- Verificar colunas em lotes
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'lotes' 
AND column_name IN ('persisted_global_counter', 'synced_at', 'posicao_atual');

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards');
```

### ✅ 2.2 Aplicar RPCs de Lotes (se necessário)

**Arquivo:** `database/schema-lotes-persistencia.sql`

**Passos:**
1. [ ] Verificar se RPCs de lotes já existem
2. [ ] Se não existirem, aplicar `database/schema-lotes-persistencia.sql`
3. [ ] Verificar criação das funções

**Query de Validação:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('rpc_get_or_create_lote', 'rpc_update_lote_after_shot', 'rpc_get_active_lotes');
```

### ✅ 2.3 Aplicar RPCs Financeiras (se necessário)

**Arquivo:** `database/rpc-financial-acid.sql`

**Passos:**
1. [ ] Verificar se RPCs financeiras já existem
2. [ ] Se não existirem, aplicar `database/rpc-financial-acid.sql`
3. [ ] Verificar criação das funções

**Query de Validação:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('rpc_add_balance', 'rpc_deduct_balance', 'rpc_transfer_balance', 'rpc_get_balance');
```

---

## 📋 FASE 3: VALIDAÇÃO PÓS-MIGRATION

### ✅ 3.1 Validar Estruturas do Banco

**Script:** `src/scripts/validate_engine_v19_final.js`

- [ ] Executar script de validação
- [ ] Verificar se todas as estruturas foram criadas
- [ ] Documentar resultados

**Comando:**
```bash
node src/scripts/validate_engine_v19_final.js
```

### ✅ 3.2 Validar Heartbeat

**Script:** `src/scripts/validate_heartbeat_v19.js`

- [ ] Executar script de validação
- [ ] Verificar se heartbeat está funcionando
- [ ] Verificar se registros estão sendo criados

**Comando:**
```bash
node src/scripts/validate_heartbeat_v19.js
```

### ✅ 3.3 Validar Endpoints

**Scripts:**
- `src/scripts/validate_monitor_endpoint.js`
- `src/scripts/validate_metrics_endpoint.js`

- [ ] Executar validação do endpoint `/monitor`
- [ ] Executar validação do endpoint `/metrics`
- [ ] Verificar se retornam HTTP 200

**Comandos:**
```bash
node src/scripts/validate_monitor_endpoint.js
node src/scripts/validate_metrics_endpoint.js
```

### ✅ 3.4 Validar Servidor

**Script:** `src/scripts/validate_server_startup_v19.js`

- [ ] Executar validação de startup
- [ ] Verificar se servidor inicia corretamente
- [ ] Verificar se heartbeat inicia automaticamente

**Comando:**
```bash
node src/scripts/validate_server_startup_v19.js
```

---

## 📋 FASE 4: CONFIGURAÇÃO DE AMBIENTE

### ✅ 4.1 Configurar Variáveis de Ambiente

**Arquivo:** `.env` ou `.env.local`

**Variáveis Necessárias:**
```env
USE_DB_QUEUE=true
USE_ENGINE_V19=true
ENGINE_VERSION=V19
HEARTBEAT_ENABLED=true
HEARTBEAT_INTERVAL_MS=5000
```

- [ ] Adicionar variáveis ao `.env`
- [ ] Verificar se variáveis estão sendo lidas
- [ ] Reiniciar servidor para aplicar mudanças

### ✅ 4.2 Validar Configuração

- [ ] Verificar se `USE_DB_QUEUE=true` está ativo
- [ ] Verificar se heartbeat inicia automaticamente
- [ ] Verificar logs do servidor

---

## 📋 FASE 5: LIMPEZA DE CÓDIGO (APÓS VALIDAÇÃO)

### ⚠️ AGUARDAR AUTORIZAÇÃO: "APLICAR CORREÇÕES"

### ✅ 5.1 Arquivar Sistema de Fila Antigo

**Arquivos:**
- `routes/filaRoutes.js`
- `services/queueService.js`

**Ações:**
- [ ] Criar diretório `_archived_legacy_routes/` (se não existir)
- [ ] Criar diretório `_archived_legacy_services/` (se não existir)
- [ ] Mover `routes/filaRoutes.js` → `_archived_legacy_routes/filaRoutes.js`
- [ ] Mover `services/queueService.js` → `_archived_legacy_services/queueService.js`
- [ ] Verificar se nenhum código referencia esses arquivos

### ✅ 5.2 Remover Duplicações de AnalyticsRoutes

**Arquivos:**
- `routes/analyticsRoutes_v1.js`
- `routes/analyticsRoutes_fixed.js`
- `routes/analyticsRoutes_optimized.js`
- `routes/analyticsRoutes.js.backup`

**Ações:**
- [ ] Verificar se `analyticsRoutes.js` principal está sendo usado
- [ ] Se não estiver sendo usado, mover para archive também
- [ ] Remover duplicações:
  - [ ] Deletar `routes/analyticsRoutes_v1.js`
  - [ ] Deletar `routes/analyticsRoutes_fixed.js`
  - [ ] Deletar `routes/analyticsRoutes_optimized.js`
  - [ ] Deletar `routes/analyticsRoutes.js.backup`

### ✅ 5.3 Verificar Referências

- [ ] Buscar referências a `filaRoutes` no código
- [ ] Buscar referências a `queueService` no código
- [ ] Buscar referências a `analyticsRoutes` no código
- [ ] Remover imports não utilizados

**Comandos:**
```bash
grep -r "filaRoutes" .
grep -r "queueService" .
grep -r "analyticsRoutes" .
```

---

## 📋 FASE 6: TESTES FINAIS

### ✅ 6.1 Testes de Endpoints

**Endpoints a Testar:**
- [ ] `GET /health` - Deve retornar HTTP 200
- [ ] `GET /monitor` - Deve retornar HTTP 200 (após migration)
- [ ] `GET /metrics` - Deve retornar HTTP 200
- [ ] `GET /api/admin/stats` - Deve retornar HTTP 200 (com token)
- [ ] `POST /api/games/shoot` - Deve funcionar (com autenticação)

### ✅ 6.2 Testes de Funcionalidade

- [ ] Criar lote via `LoteService`
- [ ] Processar chute via `GameController.shoot`
- [ ] Verificar persistência no banco
- [ ] Verificar crédito de recompensa
- [ ] Verificar heartbeat funcionando

### ✅ 6.3 Testes de Performance

- [ ] Testar criação de múltiplos lotes
- [ ] Testar processamento de múltiplos chutes
- [ ] Verificar latência de endpoints
- [ ] Verificar uso de memória

---

## 📋 FASE 7: DOCUMENTAÇÃO

### ✅ 7.1 Documentar Mudanças

- [ ] Criar documento de changelog V19
- [ ] Documentar novas variáveis de ambiente
- [ ] Documentar novos endpoints
- [ ] Documentar estrutura do banco

### ✅ 7.2 Atualizar README

- [ ] Atualizar seção de instalação
- [ ] Atualizar seção de configuração
- [ ] Adicionar instruções de migration V19
- [ ] Adicionar troubleshooting

---

## 📋 FASE 8: MONITORAMENTO CONTÍNUO

### ✅ 8.1 Configurar Alertas

- [ ] Configurar alertas para heartbeat
- [ ] Configurar alertas para erros 5xx
- [ ] Configurar alertas para latência alta
- [ ] Configurar alertas para uso de memória

### ✅ 8.2 Dashboard de Monitoramento

- [ ] Verificar dashboard `/monitor`
- [ ] Verificar métricas Prometheus `/metrics`
- [ ] Configurar Grafana (se aplicável)
- [ ] Documentar métricas disponíveis

---

## ✅ CHECKLIST FINAL

### Antes de Considerar Completo

- [ ] Migration V19 aplicada e validada
- [ ] Todas as estruturas do banco criadas
- [ ] RPCs funcionando corretamente
- [ ] Endpoints retornando HTTP 200
- [ ] Heartbeat funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Código morto removido/arquivado
- [ ] Testes executados com sucesso
- [ ] Documentação atualizada
- [ ] Monitoramento configurado

---

## 🚨 ROLLBACK PLAN

**Se algo der errado:**

1. [ ] Parar servidor
2. [ ] Restaurar backup do banco
3. [ ] Reverter variáveis de ambiente
4. [ ] Documentar problema encontrado
5. [ ] Investigar causa raiz

**Comando de Rollback:**
```bash
# Ver rollback script em:
# rollback/rollback_v19_staging.sh
```

---

**Gerado em:** 2025-12-07T00:00:00Z  
**Versão:** V19.0.0  
**Status:** ⚠️ **AGUARDANDO APLICAÇÃO DA MIGRATION**

