# 🗄️ DIFF BANCO V19
## Comparação: Banco de Dados Atual vs Padrão Oficial ENGINE V19

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Auditor:** AUDITOR SUPREMO V19 - STATE SCAN

---

## 📋 SUMÁRIO EXECUTIVO

Este documento compara o estado atual do banco de dados com o padrão oficial da ENGINE V19, identificando:
- Tabelas esperadas vs existentes
- Colunas esperadas vs existentes
- Constraints esperados vs existentes
- RPCs esperadas vs existentes
- RLS e Policies esperadas vs existentes

---

## 📊 TABELAS

### ✅ TABELAS ESPERADAS V19

| Tabela | Esperada | Status | Observações |
|--------|----------|--------|-------------|
| `usuarios` | ✅ Sim | ⚠️ Requer verificação | Tabela base do sistema |
| `lotes` | ✅ Sim | ⚠️ Requer verificação | Sistema de lotes |
| `chutes` | ✅ Sim | ⚠️ Requer verificação | Registro de chutes |
| `transacoes` | ✅ Sim | ⚠️ Requer verificação | Histórico financeiro |
| `pagamentos_pix` | ✅ Sim | ⚠️ Requer verificação | Pagamentos PIX |
| `saques` | ✅ Sim | ⚠️ Requer verificação | Saques |
| `webhook_events` | ✅ Sim | ⚠️ Requer verificação | Idempotência webhook |
| `rewards` | ✅ Sim | ⚠️ Requer verificação | Sistema de recompensas |
| `system_heartbeat` | ✅ Sim | ⚠️ Requer verificação | Monitoramento V19 |

**Status:** ⚠️ **REQUER VERIFICAÇÃO REAL NO BANCO**

---

## 📋 COLUNAS CRÍTICAS

### ✅ COLUNAS ESPERADAS EM `lotes`

| Coluna | Tipo | Default | Status | Migration |
|--------|------|---------|--------|-----------|
| `persisted_global_counter` | BIGINT | 0 | ⚠️ Requer verificação | V19 linha 65 |
| `synced_at` | TIMESTAMP WITH TIME ZONE | NULL | ⚠️ Requer verificação | V19 linha 76 |
| `posicao_atual` | INTEGER | 0 | ⚠️ Requer verificação | V19 linha 87 |

**Status:** ⚠️ **REQUER VERIFICAÇÃO REAL**

---

### ✅ COLUNAS ESPERADAS EM `transacoes`

| Coluna | Tipo | Status | Observações |
|--------|------|--------|-------------|
| `referencia_id` | INTEGER | ⚠️ Requer verificação | Corrigido 2025-12-10 |
| `referencia_tipo` | VARCHAR(50) | ⚠️ Requer verificação | Corrigido 2025-12-10 |
| `saldo_anterior` | DECIMAL(10,2) | ⚠️ Requer verificação | Corrigido 2025-12-10 |
| `saldo_posterior` | DECIMAL(10,2) | ⚠️ Requer verificação | Corrigido 2025-12-10 |
| `metadata` | JSONB | ⚠️ Requer verificação | Corrigido 2025-12-10 |
| `processed_at` | TIMESTAMP WITH TIME ZONE | ⚠️ Requer verificação | Corrigido 2025-12-10 |

**Status:** ⚠️ **REQUER VERIFICAÇÃO REAL** (correções aplicadas recentemente)

---

### ✅ COLUNAS ESPERADAS EM `system_heartbeat`

| Coluna | Tipo | Status | Migration |
|--------|------|--------|-----------|
| `id` | SERIAL PRIMARY KEY | ⚠️ Requer verificação | V19 linha 119 |
| `instance_id` | VARCHAR(255) UNIQUE NOT NULL | ⚠️ Requer verificação | V19 linha 120 |
| `last_seen` | TIMESTAMP WITH TIME ZONE | ⚠️ Requer verificação | V19 linha 121 |
| `metadata` | JSONB | ⚠️ Requer verificação | V19 linha 122 |
| `created_at` | TIMESTAMP WITH TIME ZONE | ⚠️ Requer verificação | V19 linha 123 |

**Status:** ⚠️ **REQUER VERIFICAÇÃO REAL**

---

## 🔒 CONSTRAINTS

### ✅ CONSTRAINT ESPERADO EM `transacoes`

**Constraint:** `transacoes_status_check`

**Valores Esperados:**
- `pendente`
- `processado`
- `cancelado`
- `falhou`
- `concluido` ✅ (adicionado 2025-12-10)
- `processando`

**Status:** ✅ **CORRIGIDO 2025-12-10**

---

## 🔧 RPC FUNCTIONS

### ✅ RPCs ESPERADAS V19

#### RPCs de Lotes
| RPC | Status | Arquivo SQL | Migration V19 |
|-----|--------|-------------|----------------|
| `rpc_get_or_create_lote` | ⚠️ Requer verificação | `schema-lotes-persistencia.sql` | ✅ Criada (linha 366) |
| `rpc_update_lote_after_shot` | ⚠️ Requer verificação | `schema-lotes-persistencia.sql` | ✅ Criada (linha 440) |
| `rpc_get_active_lotes` | ⚠️ Requer verificação | `schema-lotes-persistencia.sql` | ❌ Não na migration |

**Status:** ⚠️ **PARCIALMENTE NA MIGRATION**

---

#### RPCs Financeiras
| RPC | Status | Arquivo SQL | Migration V19 |
|-----|--------|-------------|----------------|
| `rpc_add_balance` | ⚠️ Requer verificação | `rpc-financial-acid.sql` | ❌ Apenas verifica (linha 516) |
| `rpc_deduct_balance` | ⚠️ Requer verificação | `rpc-financial-acid.sql` | ❌ Apenas verifica (linha 523) |
| `rpc_transfer_balance` | ⚠️ Requer verificação | `rpc-financial-acid.sql` | ❌ Não na migration |
| `rpc_get_balance` | ⚠️ Requer verificação | `rpc-financial-acid.sql` | ❌ Não na migration |

**Status:** ❌ **NÃO INCLUÍDAS NA MIGRATION** - Requer aplicação separada

---

#### RPCs de Recompensas
| RPC | Status | Arquivo SQL | Migration V19 |
|-----|--------|-------------|----------------|
| `rpc_register_reward` | ⚠️ Requer verificação | `schema-rewards.sql` | ❌ Não na migration |
| `rpc_mark_reward_credited` | ⚠️ Requer verificação | `schema-rewards.sql` | ❌ Não na migration |
| `rpc_get_user_rewards` | ⚠️ Requer verificação | `schema-rewards.sql` | ❌ Não na migration |

**Status:** ❌ **NÃO INCLUÍDAS NA MIGRATION** - Requer aplicação separada

---

#### RPCs de Webhook
| RPC | Status | Arquivo SQL | Migration V19 |
|-----|--------|-------------|----------------|
| `rpc_register_webhook_event` | ⚠️ Requer verificação | `schema-webhook-events.sql` | ❌ Não na migration |
| `rpc_check_webhook_event_processed` | ⚠️ Requer verificação | `schema-webhook-events.sql` | ❌ Não na migration |
| `rpc_mark_webhook_event_processed` | ⚠️ Requer verificação | `schema-webhook-events.sql` | ❌ Não na migration |

**Status:** ❌ **NÃO INCLUÍDAS NA MIGRATION** - Requer aplicação separada

---

## 🔐 RLS (Row Level Security)

### ✅ RLS ESPERADO V19

**Tabelas com RLS Habilitado (Migration V19):**
1. ✅ `usuarios` - Linha 133
2. ✅ `chutes` - Linha 134
3. ✅ `lotes` - Linha 135
4. ✅ `transacoes` - Linha 136
5. ✅ `pagamentos_pix` - Linha 137
6. ✅ `saques` - Linha 138
7. ✅ `webhook_events` - Linha 139
8. ✅ `rewards` - Linha 140

**Status:** ✅ **DEFINIDO NA MIGRATION** - Requer verificação real

---

## 🛡️ POLICIES RLS

### ✅ POLICIES ESPERADAS V19

**Total:** 16 policies

**Por Tabela:**
- `usuarios`: 3 policies (SELECT, INSERT, UPDATE)
- `chutes`: 2 policies (SELECT, INSERT)
- `lotes`: 2 policies (SELECT, ALL)
- `transacoes`: 2 policies (SELECT, INSERT)
- `pagamentos_pix`: 2 policies (SELECT, ALL)
- `saques`: 2 policies (SELECT, ALL)
- `webhook_events`: 1 policy (ALL)
- `rewards`: 2 policies (SELECT, ALL)

**Status:** ✅ **DEFINIDAS NA MIGRATION** - Requer verificação real

---

## 📈 ÍNDICES

### ✅ ÍNDICES ESPERADOS V19

**Total:** 11 índices

**Por Tabela:**
- `chutes`: 4 índices
- `transacoes`: 3 índices
- `lotes`: 2 índices
- `usuarios`: 1 índice
- `system_heartbeat`: 2 índices

**Status:** ✅ **DEFINIDOS NA MIGRATION** - Requer verificação real

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. RPCs Financeiras Não Incluídas na Migration
**Severidade:** 🔴 CRÍTICO  
**Impacto:** Sistema financeiro não funcionará  
**Solução:** Aplicar `database/rpc-financial-acid.sql` separadamente

### 2. RPCs de Recompensas Não Incluídas na Migration
**Severidade:** 🔴 CRÍTICO  
**Impacto:** Sistema de recompensas não funcionará  
**Solução:** Aplicar `database/schema-rewards.sql` separadamente

### 3. RPCs de Webhook Não Incluídas na Migration
**Severidade:** 🔴 CRÍTICO  
**Impacto:** Idempotência de webhook não funcionará  
**Solução:** Aplicar `database/schema-webhook-events.sql` separadamente

### 4. RPC `rpc_get_active_lotes` Não Incluída na Migration
**Severidade:** 🟡 ALTO  
**Impacto:** Sincronização de lotes pode não funcionar  
**Solução:** Adicionar à migration ou aplicar separadamente

---

## 📊 RESUMO DO DIFF BANCO

| Categoria | Esperado | Status | Problemas |
|-----------|----------|--------|-----------|
| **Tabelas** | 9 | ⚠️ Requer verificação | Nenhum identificado |
| **Colunas lotes** | 3 | ⚠️ Requer verificação | Nenhum identificado |
| **Colunas transacoes** | 6 | ⚠️ Requer verificação | Corrigidas recentemente |
| **Constraints** | 1 | ✅ Corrigido | Nenhum |
| **RPCs Lotes** | 3 | ⚠️ Parcial | 1 faltando |
| **RPCs Financeiras** | 4 | ❌ Separadas | Todas separadas |
| **RPCs Recompensas** | 3 | ❌ Separadas | Todas separadas |
| **RPCs Webhook** | 3 | ❌ Separadas | Todas separadas |
| **RLS** | 8 tabelas | ⚠️ Requer verificação | Nenhum identificado |
| **Policies** | 16 | ⚠️ Requer verificação | Nenhum identificado |
| **Índices** | 11 | ⚠️ Requer verificação | Nenhum identificado |

---

## 🎯 CONCLUSÃO

### ✅ O QUE ESTÁ CORRETO
- Migration V19 bem estruturada
- Constraints corrigidos recentemente
- Colunas corrigidas recentemente
- RLS e Policies definidas

### ⚠️ O QUE ESTÁ INCOMPLETO
- RPCs financeiras separadas da migration
- RPCs de recompensas separadas da migration
- RPCs de webhook separadas da migration
- RPC `rpc_get_active_lotes` não incluída

### ❌ O QUE ESTÁ FALTANDO
- Validação real do banco (requer conexão)
- Aplicação das RPCs separadas
- Verificação de existência de todas as estruturas

---

**Gerado em:** 2025-12-10  
**Versão:** V19.0.0  
**Status:** ✅ DIFF BANCO COMPLETO

