# Modelo de certificação contínua (V1.3)

Certificação read-only do estado operacional Gol de Ouro, alinhada a V1.1G–V1.2E.

## Estados de certificação runtime

| Estado | Critérios |
|--------|-----------|
| **CERTIFIED** | SHA = baseline · Fly v461 · health OK · webhooks 401 · bundle OK · sem falhas críticas |
| **DEGRADED** | Falha não-crítica (ex. drift local, bundle secundário, logs workers inconclusivos) |
| **INVALID** | SHA/runtime errado sem justificativa · health fail · webhook ≠ 401 · saldo negativo |

Script: `node scripts/reliability/runtime-certification.js`

## Estados de prova financeira

| Estado | Critérios |
|--------|-----------|
| **VALID** | FP-01..09 pass · sem spike rollback/falha_payout |
| **DEGRADED** | Backlog estável mas acima baseline documentado · pending antigos estáveis |
| **INVALID** | dups > 0 · saldo_negativo > 0 · spike não contido |

Script: `node scripts/reliability/financial-proof-engine.js`

## Classificação operacional (score)

| Score | Cor | Certificação contínua |
|------:|-----|------------------------|
| 90–100 | GREEN | Elegível **CERTIFIED** se runtime + finance VALID |
| 70–89 | YELLOW | **DEGRADED** — PASS COM RESSALVAS |
| &lt;70 | RED | **INVALID** — NO-GO |

## Matriz de decisão

```
SE critical_issues > 0        → INVALID / CRITICAL / NO-GO
SENÃO SE score >= 90
  E runtime CERTIFIED
  E proof VALID               → CERTIFIED / HEALTHY / PASS
SENÃO SE score >= 70          → DEGRADED / DEGRADED / PASS COM RESSALVAS
SENÃO                         → INVALID / CRITICAL / NO-GO
```

## Sinais por domínio

| Domínio | GREEN | YELLOW | RED |
|---------|-------|--------|-----|
| Drift | SHA + Fly match | local ≠ live | SHA live ≠ cert |
| Duplicatas | 0 | — | &gt;0 |
| Health | ok | degraded deps | down |
| Webhooks | 401 probes | — | ≠401 |
| Payout | estável | confirmado=0 doc | spike + stuck |
| Workers | heartbeat &gt;0 | amostra curta | enabled + 0 hb longo |

## Relação V1.2 → V1.3

| V1.2 | V1.3 |
|------|------|
| V1.2A baseline | financial-proof delta |
| V1.2B alertas | incident heuristics |
| V1.2C drift | runtime-certification |
| V1.2E score | reliability-score-engine |
| — | autonomous-reliability-check |

## Frequência recomendada (quando CI ativo)

| Job | Intervalo |
|-----|-----------|
| Continuous verification | 6h |
| Financial proof | 6h |
| Runtime certification | 12h |
| Autonomous check | 6h (orquestrador) |
