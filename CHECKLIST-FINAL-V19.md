# ✅ CHECKLIST FINAL DE VALIDAÇÃO V19
## Projeto: Gol de Ouro Backend
## Data: 2025-12-07
## Versão: V19.0.0
## Status: ⚠️ **VALIDAÇÃO COMPLETA - AGUARDANDO CONFIRMAÇÃO**

---

## 📋 INSTRUÇÕES DE USO

Este checklist deve ser executado **APÓS** a aplicação da Migration V19 no Supabase.

**Ordem de Execução:**
1. Aplicar Migration V19 no Supabase
2. Executar scripts de validação
3. Verificar cada item deste checklist
4. Marcar como ✅ (aprovado) ou ❌ (rejeitado)
5. Documentar problemas encontrados

---

## 🔴 SEÇÃO 1: VALIDAÇÃO DA MIGRATION V19

### 1.1 Executar Script de Validação Completa

- [ ] Executar: `node src/scripts/validar_migration_v19_completa.js`
- [ ] Verificar que não há erros críticos
- [ ] Documentar resultados

**Resultado Esperado:**
```
✅ Migration V19 validada com sucesso
✅ Todas as estruturas criadas
✅ Todas as RPCs funcionando
```

---

### 1.2 Validação de Tabelas

#### Tabela `system_heartbeat`
- [ ] Tabela existe no banco
- [ ] Coluna `id` (SERIAL PRIMARY KEY)
- [ ] Coluna `instance_id` (VARCHAR UNIQUE)
- [ ] Coluna `last_seen` (TIMESTAMP)
- [ ] Coluna `metadata` (JSONB)
- [ ] Índice `idx_system_heartbeat_last_seen` existe
- [ ] Índice `idx_system_heartbeat_instance` existe

**Comando de Validação:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'system_heartbeat';
```

#### Tabela `lotes` - Colunas Adicionadas
- [ ] Coluna `persisted_global_counter` (BIGINT DEFAULT 0) existe
- [ ] Coluna `synced_at` (TIMESTAMP WITH TIME ZONE) existe
- [ ] Coluna `posicao_atual` (INTEGER DEFAULT 0) existe

**Comando de Validação:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'lotes' 
AND column_name IN ('persisted_global_counter', 'synced_at', 'posicao_atual');
```

---

### 1.3 Validação de RLS (Row Level Security)

#### Tabelas com RLS Habilitado
- [ ] `usuarios` - RLS habilitado
- [ ] `chutes` - RLS habilitado
- [ ] `lotes` - RLS habilitado
- [ ] `transacoes` - RLS habilitado
- [ ] `pagamentos_pix` - RLS habilitado
- [ ] `saques` - RLS habilitado
- [ ] `webhook_events` - RLS habilitado
- [ ] `rewards` - RLS habilitado

**Comando de Validação:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards');
```

**Resultado Esperado:** Todas as tabelas com `rowsecurity = true`

---

### 1.4 Validação de Policies

#### Policies para `usuarios`
- [ ] `usuarios_select_own` - SELECT próprio ou backend/admin
- [ ] `usuarios_insert_backend` - INSERT apenas backend/admin
- [ ] `usuarios_update_own` - UPDATE próprio ou backend/admin

#### Policies para `chutes`
- [ ] `chutes_select_own` - SELECT próprio ou backend/admin/observer
- [ ] `chutes_insert_backend` - INSERT apenas backend/admin

#### Policies para `lotes`
- [ ] `lotes_select_public` - SELECT público (ativos) ou backend/admin/observer
- [ ] `lotes_modify_backend` - ALL apenas backend/admin

#### Policies para `transacoes`
- [ ] `transacoes_select_own` - SELECT próprio ou backend/admin/observer
- [ ] `transacoes_insert_backend` - INSERT apenas backend/admin

#### Policies para outras tabelas
- [ ] `pagamentos_pix_select_own` - SELECT próprio ou backend/admin
- [ ] `pagamentos_pix_modify_backend` - ALL apenas backend/admin
- [ ] `saques_select_own` - SELECT próprio ou backend/admin
- [ ] `saques_modify_backend` - ALL apenas backend/admin
- [ ] `webhook_events_backend` - ALL apenas backend/admin
- [ ] `rewards_select_own` - SELECT próprio ou backend/admin/observer
- [ ] `rewards_modify_backend` - ALL apenas backend/admin

**Comando de Validação:**
```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

---

### 1.5 Validação de Roles

- [ ] Role `backend` existe
- [ ] Role `observer` existe
- [ ] Role `admin` existe

**Comando de Validação:**
```sql
SELECT rolname 
FROM pg_roles 
WHERE rolname IN ('backend', 'observer', 'admin');
```

---

### 1.6 Validação de Índices

#### Índices em `chutes`
- [ ] `idx_chutes_usuario_id` existe
- [ ] `idx_chutes_lote_id` existe
- [ ] `idx_chutes_created_at` existe
- [ ] `idx_chutes_lote_created` existe

#### Índices em `transacoes`
- [ ] `idx_transacoes_usuario_id` existe
- [ ] `idx_transacoes_created_at` existe
- [ ] `idx_transacoes_usuario_created` existe

#### Índices em `lotes`
- [ ] `idx_lotes_status_created` existe
- [ ] `idx_lotes_valor_status` existe

#### Índices em `usuarios`
- [ ] `idx_usuarios_email` existe

**Comando de Validação:**
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%' 
ORDER BY tablename, indexname;
```

---

## 🔴 SEÇÃO 2: VALIDAÇÃO DE RPC FUNCTIONS

### 2.1 RPCs de Lotes

#### `rpc_get_or_create_lote`
- [ ] Função existe no banco
- [ ] Assinatura correta:
  - `p_lote_id` (VARCHAR)
  - `p_valor_aposta` (DECIMAL)
  - `p_tamanho` (INTEGER)
  - `p_indice_vencedor` (INTEGER)
- [ ] Retorna JSON com `success` e `lote`
- [ ] Teste funcional: Criar lote novo
- [ ] Teste funcional: Obter lote existente

**Comando de Validação:**
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'rpc_get_or_create_lote';
```

**Teste Funcional:**
```sql
SELECT rpc_get_or_create_lote('test_lote_001', 1.00, 10, 5);
```

#### `rpc_update_lote_after_shot`
- [ ] Função existe no banco
- [ ] Assinatura correta:
  - `p_lote_id` (VARCHAR)
  - `p_valor_aposta` (DECIMAL)
  - `p_premio` (DECIMAL)
  - `p_premio_gol_de_ouro` (DECIMAL)
  - `p_is_goal` (BOOLEAN)
- [ ] Retorna JSON com `success` e `lote`
- [ ] Teste funcional: Atualizar lote após chute
- [ ] Teste funcional: Marcar lote como completo quando cheio

**Comando de Validação:**
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'rpc_update_lote_after_shot';
```

---

### 2.2 RPCs Financeiras

#### `rpc_add_balance`
- [ ] Função existe no banco
- [ ] Assinatura correta:
  - `p_user_id` (UUID)
  - `p_amount` (DECIMAL)
  - `p_description` (VARCHAR)
  - `p_reference_id` (UUID)
  - `p_reference_type` (VARCHAR)
- [ ] Retorna JSON com `success`, `old_balance`, `new_balance`
- [ ] Teste funcional: Adicionar saldo
- [ ] Teste funcional: Criar transação associada

**Comando de Validação:**
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'rpc_add_balance';
```

#### `rpc_deduct_balance`
- [ ] Função existe no banco
- [ ] Assinatura correta:
  - `p_user_id` (UUID)
  - `p_amount` (DECIMAL)
  - `p_description` (VARCHAR)
  - `p_reference_id` (UUID)
  - `p_reference_type` (VARCHAR)
  - `p_allow_negative` (BOOLEAN)
- [ ] Retorna JSON com `success`, `old_balance`, `new_balance`
- [ ] Teste funcional: Deduzir saldo com saldo suficiente
- [ ] Teste funcional: Rejeitar débito com saldo insuficiente (sem allow_negative)

**Comando de Validação:**
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'rpc_deduct_balance';
```

---

### 2.3 RPCs de Recompensas (Opcional)

#### `rpc_register_reward`
- [ ] Função existe no banco (pode estar em outro schema)
- [ ] Assinatura correta
- [ ] Teste funcional: Registrar recompensa

#### `rpc_mark_reward_credited`
- [ ] Função existe no banco (pode estar em outro schema)
- [ ] Assinatura correta
- [ ] Teste funcional: Marcar recompensa como creditada

**Nota:** Essas RPCs podem não estar na Migration V19. Verificar se existem em outros schemas.

---

## 🔴 SEÇÃO 3: VALIDAÇÃO DA ENGINE V19

### 3.1 Endpoints de Monitoramento

#### `GET /monitor`
- [ ] Endpoint responde HTTP 200
- [ ] Retorna JSON válido
- [ ] Contém campo `success: true`
- [ ] Contém campo `metrics` com dados
- [ ] Métricas incluem:
  - `lotes_ativos_count`
  - `chutes_por_minuto`
  - `latencia_media_chute_ms`
  - `transacoes_pendentes`
  - `ultimo_heartbeat`
  - `memory_usage_mb`
  - `engine_v19.enabled`
  - `rpc_status`
  - `lotes_status`

**Teste:**
```bash
curl http://localhost:8080/monitor
```

#### `GET /metrics`
- [ ] Endpoint responde HTTP 200
- [ ] Retorna formato Prometheus válido
- [ ] Contém métricas:
  - `goldeouro_lotes_ativos`
  - `goldeouro_chutes_total`
  - `goldeouro_premios_total`
  - `goldeouro_errors_5xx`
  - `goldeouro_latencia_chute_ms`

**Teste:**
```bash
curl http://localhost:8080/metrics
```

---

### 3.2 Heartbeat Sender

#### Inicialização
- [ ] Heartbeat sender inicia ao iniciar servidor
- [ ] Log mostra: `✅ [V19] Heartbeat sender iniciado`
- [ ] Instance ID é gerado corretamente

#### Funcionamento
- [ ] Heartbeat é enviado a cada 5 segundos (ou intervalo configurado)
- [ ] Registros aparecem em `system_heartbeat`
- [ ] Campo `last_seen` é atualizado
- [ ] Campo `metadata` contém informações corretas

**Comando de Validação:**
```sql
SELECT * FROM system_heartbeat 
ORDER BY last_seen DESC 
LIMIT 5;
```

#### Correção Necessária
- [ ] Arquivo `src/scripts/heartbeat_sender.js` linha 5 corrigida
- [ ] Usa `supabase-unified-config` ao invés de `supabase-config`
- [ ] Teste após correção: Heartbeat funciona corretamente

---

### 3.3 Sincronização de Lotes

#### Ao Iniciar Servidor
- [ ] Sincronização de lotes é executada
- [ ] Log mostra: `🔄 [LOTES] Sincronizando lotes do banco de dados...`
- [ ] Lotes ativos são carregados do banco
- [ ] Lotes são recriados em memória corretamente

**Validação:**
- Verificar logs do servidor ao iniciar
- Verificar que lotes ativos do banco são carregados

---

### 3.4 Sistema de LOTES

#### Confirmação de Uso
- [ ] `GameController.shoot()` usa sistema de LOTES
- [ ] `LoteService.getOrCreateLote()` é chamado
- [ ] `LoteService.updateLoteAfterShot()` é chamado
- [ ] Não há referências ao sistema de fila antigo no código ativo

#### Persistência
- [ ] Lotes são persistidos no banco ao criar
- [ ] Lotes são atualizados no banco após chute
- [ ] Colunas `persisted_global_counter`, `synced_at`, `posicao_atual` são atualizadas

**Teste Funcional:**
1. Criar chute via `POST /api/games/shoot`
2. Verificar que lote é criado/atualizado no banco
3. Verificar que colunas são atualizadas

---

## 🔴 SEÇÃO 4: VALIDAÇÃO DE CÓDIGO

### 4.1 Correções Necessárias

#### Heartbeat Sender
- [ ] Arquivo `src/scripts/heartbeat_sender.js` linha 5 corrigida
- [ ] Import alterado de `supabase-config` para `supabase-unified-config`
- [ ] Teste após correção: Heartbeat funciona

#### Monitor Controller
- [ ] Tratamento de erro adicionado para `system_heartbeat` inexistente
- [ ] Endpoint `/monitor` não retorna erro 500 se tabela não existir
- [ ] Mensagem de erro apropriada se tabela não existir

---

### 4.2 Código Obsoleto

#### Arquivos Obsoletos Identificados
- [ ] `routes/filaRoutes.js` - Movido para arquivo ou removido
- [ ] `services/queueService.js` - Movido para arquivo ou removido
- [ ] `routes/analyticsRoutes*.js` - Consolidado ou removido

**Ação Recomendada:**
- Mover para `_archived_legacy_routes/` ou `_archived_legacy_services/`
- Ou remover completamente se não necessário

---

### 4.3 Duplicações

#### Arquivos Duplicados
- [ ] `routes/analyticsRoutes.js` - Versão principal mantida
- [ ] `routes/analyticsRoutes_v1.js` - Removido ou arquivado
- [ ] `routes/analyticsRoutes_fixed.js` - Removido ou arquivado
- [ ] `routes/analyticsRoutes_optimized.js` - Removido ou arquivado
- [ ] `routes/analyticsRoutes.js.backup` - Removido

---

## 🔴 SEÇÃO 5: VALIDAÇÃO DE TESTES

### 5.1 Testes Automatizados

#### Executar Testes V19
- [ ] `npm test` ou `vitest run` executa sem erros
- [ ] `src/tests/v19/test_engine_v19.spec.js` - Todos os testes passam
- [ ] `src/tests/v19/test_lotes.spec.js` - Todos os testes passam
- [ ] `src/tests/v19/test_financial.spec.js` - Todos os testes passam
- [ ] `src/tests/v19/test_monitoramento.spec.js` - Todos os testes passam

**Comando:**
```bash
npm test
# ou
vitest run src/tests/v19/
```

---

### 5.2 Testes Manuais

#### Teste de Chute Completo
- [ ] Criar usuário de teste
- [ ] Adicionar saldo ao usuário
- [ ] Fazer chute via `POST /api/games/shoot`
- [ ] Verificar que lote é criado/atualizado no banco
- [ ] Verificar que chute é registrado
- [ ] Verificar que saldo é deduzido
- [ ] Se gol: Verificar que prêmio é creditado

#### Teste de Monitoramento
- [ ] Acessar `GET /monitor`
- [ ] Verificar que métricas são retornadas
- [ ] Verificar que heartbeat aparece nas métricas
- [ ] Acessar `GET /metrics`
- [ ] Verificar formato Prometheus

---

## 🔴 SEÇÃO 6: VALIDAÇÃO DE CONFIGURAÇÃO

### 6.1 Variáveis de Ambiente

#### Variáveis Obrigatórias
- [ ] `JWT_SECRET` - Configurada
- [ ] `SUPABASE_URL` - Configurada
- [ ] `SUPABASE_ANON_KEY` - Configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Configurada

#### Variáveis Opcionais V19
- [ ] `USE_ENGINE_V19` - Configurada (recomendado: `true`)
- [ ] `USE_DB_QUEUE` - Configurada (recomendado: `true`)
- [ ] `ENGINE_HEARTBEAT_ENABLED` - Configurada (recomendado: `true`)
- [ ] `ENGINE_MONITOR_ENABLED` - Configurada (recomendado: `true`)
- [ ] `HEARTBEAT_INTERVAL_MS` - Configurada (padrão: `5000`)
- [ ] `INSTANCE_ID` - Configurada ou gerada automaticamente

**Validação:**
```bash
# Verificar variáveis
echo $USE_ENGINE_V19
echo $USE_DB_QUEUE
echo $ENGINE_HEARTBEAT_ENABLED
```

---

### 6.2 Configuração do Servidor

#### Inicialização
- [ ] Servidor inicia sem erros
- [ ] Conexão com Supabase estabelecida
- [ ] Sincronização de lotes executada
- [ ] Heartbeat sender iniciado (se habilitado)

**Logs Esperados:**
```
✅ [SUPABASE] Conectado com sucesso
✅ [LOTES] X lotes ativos encontrados no banco
✅ [V19] Heartbeat sender iniciado
🚀 [SERVER] Servidor iniciado na porta 8080
```

---

## 🔴 SEÇÃO 7: VALIDAÇÃO DE SEGURANÇA

### 7.1 RLS e Policies

#### Validação de Acesso
- [ ] Usuário comum não pode acessar dados de outros usuários
- [ ] Usuário comum não pode modificar dados de outros usuários
- [ ] Backend pode acessar todos os dados (via service role)
- [ ] Observer pode apenas ler agregados

**Teste:**
- Tentar acessar dados de outro usuário sem autenticação
- Verificar que acesso é negado

---

### 7.2 Validação de Operações ACID

#### Operações Financeiras
- [ ] `rpc_add_balance` garante atomicidade
- [ ] `rpc_deduct_balance` garante atomicidade
- [ ] Transações são criadas corretamente
- [ ] Saldo é atualizado corretamente

**Teste:**
- Executar múltiplas operações simultâneas
- Verificar que saldo está correto
- Verificar que transações são criadas

---

## 📊 RESUMO DA VALIDAÇÃO

### Estatísticas

**Total de Itens:** ___ / ___

**Seção 1 - Migration V19:** ___ / ___
**Seção 2 - RPC Functions:** ___ / ___
**Seção 3 - Engine V19:** ___ / ___
**Seção 4 - Código:** ___ / ___
**Seção 5 - Testes:** ___ / ___
**Seção 6 - Configuração:** ___ / ___
**Seção 7 - Segurança:** ___ / ___

### Status Final

- [ ] ✅ **APROVADO** - Todos os itens críticos validados
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Alguns itens não críticos pendentes
- [ ] ❌ **REJEITADO** - Itens críticos falharam

### Problemas Identificados

**Problemas Críticos:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Problemas Não Críticos:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Próximos Passos

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## 📝 OBSERVAÇÕES FINAIS

**Data da Validação:** ___ / ___ / ___

**Validado Por:** _________________________________

**Observações Adicionais:**

_________________________________________________
_________________________________________________
_________________________________________________

---

**Checklist gerado em:** 2025-12-07  
**Versão:** V19.0.0  
**Status:** ⚠️ **VALIDAÇÃO COMPLETA - AGUARDANDO CONFIRMAÇÃO**

