# ✅ CHECKLIST PARA PRODUÇÃO V19
## Gol de Ouro Backend - Liberação para Produção

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Status:** ⚠️ **PENDENTE VALIDAÇÕES**

---

## 🔴 SEÇÃO 1: CONFIGURAÇÃO (CRÍTICO - BLOQUEIA PRODUÇÃO)

### 1.1 Variáveis de Ambiente

- [ ] **CRÍTICO:** `USE_ENGINE_V19=true` adicionado ao `.env` de produção
- [ ] **CRÍTICO:** `ENGINE_HEARTBEAT_ENABLED=true` adicionado ao `.env` de produção
- [ ] **CRÍTICO:** `ENGINE_MONITOR_ENABLED=true` adicionado ao `.env` de produção
- [ ] **CRÍTICO:** `USE_DB_QUEUE=false` adicionado ao `.env` de produção
- [ ] **CRÍTICO:** Variáveis V19 adicionadas ao `env.example`
- [ ] **CRÍTICO:** Validação V19 implementada em `config/required-env.js`
- [ ] `SUPABASE_URL` configurado corretamente (produção)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado corretamente (produção)
- [ ] `SUPABASE_ANON_KEY` configurado corretamente (produção)
- [ ] `JWT_SECRET` configurado corretamente (produção)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado corretamente (produção)

### 1.2 Banco de Dados

- [ ] **CRÍTICO:** Banco Supabase identificado (produção ou goldeouro-db)
- [ ] **CRÍTICO:** Conexão com banco de produção testada
- [ ] **CRÍTICO:** Migration V19 aplicada no banco de produção
- [ ] **CRÍTICO:** Todas as tabelas essenciais existem no banco
- [ ] **CRÍTICO:** Todas as RPCs financeiras existem no banco
- [ ] **CRÍTICO:** Todas as RPCs de lotes existem no banco
- [ ] **CRÍTICO:** Todas as RPCs de recompensas existem no banco
- [ ] **CRÍTICO:** Todas as RPCs de webhook existem no banco
- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Policies criadas e funcionando

---

## 🔴 SEÇÃO 2: MIGRATION V19 (CRÍTICO - BLOQUEIA PRODUÇÃO)

### 2.1 Tabelas Essenciais

- [ ] Tabela `usuarios` existe com todas as colunas
- [ ] Tabela `lotes` existe com todas as colunas (`persisted_global_counter`, `synced_at`, `posicao_atual`)
- [ ] Tabela `chutes` existe com todas as colunas
- [ ] Tabela `transacoes` existe com todas as colunas (`referencia_id`, `referencia_tipo`, `saldo_anterior`, `saldo_posterior`)
- [ ] Tabela `pagamentos_pix` existe com todas as colunas
- [ ] Tabela `saques` existe com todas as colunas
- [ ] Tabela `rewards` existe com todas as colunas
- [ ] Tabela `webhook_events` existe com todas as colunas
- [ ] Tabela `system_heartbeat` existe

### 2.2 RPCs Financeiras

- [ ] `rpc_add_balance` existe e funciona
- [ ] `rpc_deduct_balance` existe e funciona
- [ ] `rpc_transfer_balance` existe e funciona
- [ ] `rpc_get_balance` existe e funciona
- [ ] Todas as RPCs financeiras testadas com dados reais

### 2.3 RPCs de Lotes

- [ ] `rpc_get_or_create_lote` existe e funciona
- [ ] `rpc_update_lote_after_shot` existe e funciona
- [ ] `rpc_get_active_lotes` existe e funciona
- [ ] Todas as RPCs de lotes testadas com dados reais

### 2.4 RPCs de Recompensas

- [ ] `rpc_register_reward` existe e funciona
- [ ] `rpc_mark_reward_credited` existe e funciona
- [ ] `rpc_get_user_rewards` existe e funciona (se aplicável)
- [ ] Todas as RPCs de recompensas testadas com dados reais

### 2.5 RPCs de Webhook

- [ ] `rpc_register_webhook_event` existe e funciona
- [ ] `rpc_check_webhook_event_processed` existe e funciona
- [ ] `rpc_mark_webhook_event_processed` existe e funciona
- [ ] Todas as RPCs de webhook testadas com dados reais

### 2.6 Índices e Constraints

- [ ] Índices em `chutes` criados
- [ ] Índices em `transacoes` criados
- [ ] Índices em `lotes` criados
- [ ] Índices em `usuarios` criados
- [ ] Constraint `transacoes_status_check` atualizado (inclui 'concluido')

---

## 🟡 SEÇÃO 3: CÓDIGO E ESTRUTURA (IMPORTANTE)

### 3.1 Código Legacy

- [ ] Controllers legacy removidos ou movidos para `legacy/v19_removed/controllers/`
- [ ] Services legacy removidos ou movidos para `legacy/v19_removed/services/`
- [ ] Routes legacy removidos ou movidos para `legacy/v19_removed/routes/`
- [ ] Nenhum código legacy sendo usado no servidor principal

### 3.2 Imports e Dependências

- [ ] Todos os imports estão corretos
- [ ] Todos os módulos têm `index.js`
- [ ] Todas as rotas estão registradas em `server-fly.js`
- [ ] Nenhum import quebrado

### 3.3 Validações

- [ ] `LoteIntegrityValidator` funcionando corretamente
- [ ] `PixValidator` funcionando corretamente
- [ ] `WebhookSignatureValidator` funcionando corretamente
- [ ] Todas as validações testadas

---

## 🟡 SEÇÃO 4: FLUXOS CRÍTICOS (IMPORTANTE)

### 4.1 Fluxo PIX

- [ ] Criação de PIX funciona
- [ ] Webhook recebe e processa corretamente
- [ ] Idempotência do webhook funciona
- [ ] Saldo é creditado corretamente após pagamento
- [ ] Payment ID grande (> 2147483647) é tratado corretamente
- [ ] Reconciliação de PIX pendentes funciona

### 4.2 Fluxo de Chutes

- [ ] Criação de lote funciona
- [ ] Validação antes do chute funciona
- [ ] Validação de direção funciona
- [ ] Chutes são registrados corretamente
- [ ] Lotes são atualizados após chutes
- [ ] Lotes são completados quando cheios
- [ ] Sincronização de lotes ao iniciar servidor funciona

### 4.3 Fluxo de Premiações

- [ ] Prêmio normal (R$ 5) é creditado corretamente
- [ ] Gol de Ouro (R$ 100) é creditado corretamente
- [ ] Recompensas são registradas na tabela `rewards`
- [ ] Saldo é atualizado usando `FinancialService` (ACID)
- [ ] Status de recompensas é rastreável

---

## 🟡 SEÇÃO 5: INTEGRIDADE E SEGURANÇA (IMPORTANTE)

### 5.1 Integridade Financeira

- [ ] Operações financeiras são ACID
- [ ] Não há race conditions em operações de saldo
- [ ] Transações são registradas corretamente
- [ ] Saldo anterior e posterior são registrados
- [ ] Referências (payment_id, reward_id) são registradas

### 5.2 Idempotência

- [ ] Webhooks são idempotentes
- [ ] Eventos duplicados não são processados duas vezes
- [ ] Chave de idempotência funciona corretamente

### 5.3 Segurança

- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Policies criadas e testadas
- [ ] Validação de assinatura de webhook funciona
- [ ] Autenticação JWT funciona
- [ ] Rate limiting funciona

---

## 🟢 SEÇÃO 6: MONITORAMENTO E OBSERVABILIDADE (OPCIONAL)

### 6.1 Health Checks

- [ ] Endpoint `/health` funciona
- [ ] Endpoint `/monitor` funciona
- [ ] Endpoint `/metrics` funciona
- [ ] Health checks retornam status correto

### 6.2 Logs

- [ ] Logs estão sendo gerados corretamente
- [ ] Logs contêm informações suficientes para debug
- [ ] Logs não contêm informações sensíveis

### 6.3 Monitoramento

- [ ] Heartbeat está funcionando (se habilitado)
- [ ] Métricas estão sendo coletadas
- [ ] Alertas estão configurados (se aplicável)

---

## 📊 RESUMO DO CHECKLIST

### Status Geral

- **Total de Itens:** 80+
- **Críticos:** 25
- **Importantes:** 40+
- **Opcionais:** 15+

### Progresso

- [ ] **0%** - Nenhum item concluído
- [ ] **25%** - Itens críticos de configuração concluídos
- [ ] **50%** - Itens críticos de migration concluídos
- [ ] **75%** - Todos os itens críticos concluídos
- [ ] **100%** - Todos os itens concluídos

---

## 🚨 BLOQUEADORES PARA PRODUÇÃO

**NÃO LIBERAR PRODUÇÃO ENQUANTO:**

1. ❌ Variáveis V19 não estiverem configuradas
2. ❌ Validação V19 não estiver implementada
3. ❌ Migration V19 não estiver aplicada no banco de produção
4. ❌ RPCs críticas não estiverem criadas no banco
5. ❌ Tabelas essenciais não estiverem criadas no banco
6. ❌ RLS não estiver habilitado nas tabelas críticas

---

## ✅ APROVAÇÃO PARA PRODUÇÃO

**Aprovado por:** _________________  
**Data:** _________________  
**Versão:** V19.0.0  
**Observações:** _________________

---

**Última Atualização:** 2025-12-10T20:00:00Z

