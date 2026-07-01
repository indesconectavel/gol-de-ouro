# Modelo de persistência de reliability (V1.5)

## Armazenamento (local apenas)

| Artefato | Local |
|----------|-------|
| Histórico append-only | `docs/resilience/persistence/history/reliability-evolution.jsonl` |
| Snapshots | `docs/resilience/persistence/**/LATEST.json` |
| Relatórios | `docs/relatorios/V1-5-*.json` |

## Retenção recomendada

| Tipo | Retenção |
|------|----------|
| JSONL history | 90 dias (rotação manual) |
| LATEST snapshots | sobrescreve |
| Timestamped snapshots | últimos 30 por tipo |

## Campos por entrada

```json
{
  "timestamp": "ISO",
  "operational_score": 0,
  "resilience_score": 0,
  "resilience_class": "RESILIENT",
  "external_certification": "EXTERNALLY_CERTIFIED",
  "activation_decision": "ALLOW",
  "anomaly_score": 0,
  "availability": 100,
  "trend_direction": "stable"
}
```

## Baseline evolution

- Baseline financeiro fixo V1.2A até novo relatório de certificação
- Scores evoluem; baseline métricas alterado só com change control

## Degradation tracking

- `degradation_trend`: último score &lt; anterior - 3
- `stabilization_trend`: variância últimos 3 pontos ≤ 5

## Script

```bash
node scripts/resilience/reliability-persistence-engine.js
```
