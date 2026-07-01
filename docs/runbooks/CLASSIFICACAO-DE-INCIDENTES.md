# Classificação de incidentes — Gol de Ouro

**Versão:** V1.2D · 2026-05-19  
**Relacionado:** V1.2B alertas · V1.2C drift · [INCIDENT-RESPONSE-FLOW.md](INCIDENT-RESPONSE-FLOW.md)

---

## Níveis

### P0 — CRÍTICO

| Condição | Alerta / runbook |
|----------|------------------|
| Saldo negativo em produção | C-01 · [RUNBOOK-saldo-negativo](financeiro/RUNBOOK-saldo-negativo.md) |
| Duplicata ledger `(correlation_id, tipo)` | C-02 · [RUNBOOK-duplicata-ledger](financeiro/RUNBOOK-duplicata-ledger.md) |
| Payout indevido / crédito duplicado suspeito | Escalonar imediato + freeze financeiro |
| Deploy incorreto live (SHA/Fly/bundle não certificado) | DC-* · [RUNBOOK-runtime-drift](runtime/RUNBOOK-runtime-drift.md) |
| Webhook sem HMAC aceitando tráfego (≠ 401) | C-04 · [RUNBOOK-hmac-failure](seguranca/RUNBOOK-hmac-failure.md) |
| `/health` indisponível ou DB desconectado | C-03 |

**SLA recomendado:** resposta **&lt; 15 min** · mitigação **&lt; 1 h**  
**Owner:** ops on-call + responsável financeiro  
**Rollback:** **sim** se deploy recente correlacionado  
**Freeze deploy:** **sim** até contenção

---

### P1 — ALTO

| Condição | Alerta / runbook |
|----------|------------------|
| Runtime drift vs baseline/main não documentado | DA-03 · [RUNBOOK-runtime-drift](runtime/RUNBOOK-runtime-drift.md) |
| Worker payout offline (env on, sem heartbeat) | A-06 · [RUNBOOK-payout-worker-offline](workers/RUNBOOK-payout-worker-offline.md) |
| Reconcile PIX parado / backlog pending crescendo | A-02 · [RUNBOOK-reconcile-parado](workers/RUNBOOK-reconcile-parado.md) |
| Payout/saque preso `processando` | A-03 · [RUNBOOK-backlog-growth](workers/RUNBOOK-backlog-growth.md) |
| `approved` sem ledger **crescendo** vs baseline 34 | A-01 · [RUNBOOK-approved-sem-ledger](financeiro/RUNBOOK-approved-sem-ledger.md) |
| Workflow deploy failed no SHA live | DC-03 · [RUNBOOK-workflow-failure](runtime/RUNBOOK-workflow-failure.md) |

**SLA recomendado:** resposta **&lt; 1 h** · mitigação **&lt; 4 h**  
**Owner:** ops on-call  
**Rollback:** **avaliar** se deploy &lt; 24 h  
**Freeze deploy:** **recomendado** até validação

---

### P2 — MÉDIO

| Condição | Alerta / runbook |
|----------|------------------|
| Backlog legado estável mas monitorado | B-01 · [RUNBOOK-approved-sem-ledger](financeiro/RUNBOOK-approved-sem-ledger.md) |
| Pending antigos estáveis (54) ou crescimento lento | B-02 / A-02 · [RUNBOOK-pending-antigos](financeiro/RUNBOOK-pending-antigos.md) |
| Ausência prolongada de novos PIX | M-04 |
| Webhook rejected spike | A-05 · [RUNBOOK-webhook-rejected-spike](seguranca/RUNBOOK-webhook-rejected-spike.md) |
| `falha_payout` spike | A-04 · [RUNBOOK-rollback-spike](financeiro/RUNBOOK-rollback-spike.md) |
| Drift local vs runtime | M-01 · [RUNBOOK-validacao-codigo-live](runtime/RUNBOOK-validacao-codigo-live.md) |

**SLA recomendado:** resposta **&lt; 4 h** · plano **&lt; 24 h**  
**Owner:** ops diurno  
**Rollback:** **não** salvo P0/P1 emergente  
**Freeze deploy:** **não** obrigatório

---

### P3 — BAIXO

| Condição | Nota |
|----------|------|
| Drift documental main vs runtime (PR #99) | DB-01 · esperado pós-V1.1G |
| Baselines históricos cacc127/v460 | DB-02 |
| U1–U4 runbook manual | Ver [U1–U4](../../relatorios/V1-1B-M1-RUNBOOK-U1-U4-PIX-SUSPEITOS-2026-05-17.md) |
| `payout_confirmado` histórico zero | R-G03 V1.1G |

**SLA recomendado:** backlog de melhoria **&lt; 5 dias úteis**  
**Owner:** produto/engenharia  
**Rollback:** **não**  
**Freeze deploy:** **não**

---

## Matriz resumo

| Nível | SLA resposta | Rollback | Freeze deploy |
|-------|-------------|----------|---------------|
| P0 | &lt; 15 min | Sim | Sim |
| P1 | &lt; 1 h | Avaliar | Recomendado |
| P2 | &lt; 4 h | Não* | Não |
| P3 | dias úteis | Não | Não |

\*Exceto se evoluir para P0/P1.

---

## Mapeamento V1.2B → severidade

| V1.2B | Incidente |
|-------|-----------|
| CRITICO | P0 |
| ALTO | P1 |
| MEDIO | P2 |
| BAIXO | P3 |
