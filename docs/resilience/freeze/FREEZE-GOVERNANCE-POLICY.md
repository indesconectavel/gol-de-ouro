# Política de freeze governance (V1.5)

**Simulação apenas** — `freeze-governance-simulator.js` não altera env ou workflows.

## Quando congelar

| Trigger | Escopo freeze |
|---------|---------------|
| activation-gate `FREEZE` ou `BLOCK` | deploy + runtime_changes |
| P0 financeiro | payout + deploy |
| `financial_proof` INVALID | payout + reconcile monitor |
| anomaly &gt; 35 | workers pause_recommended |
| 2+ warnings V1.5 gates | deploy |

## Quem aprova saída do freeze

| Nível | Aprovadores |
|-------|-------------|
| Deploy freeze | ops-lead + deploy-owner |
| Payout freeze | ops-lead + finance |
| Full freeze | incident commander |

## Critérios de saída

1. `activation-gate-engine` → **ALLOW**
2. `external_certification` → **EXTERNALLY_CERTIFIED**
3. Zero alertas P0
4. Re-run `external-certification-engine.js`
5. Sign-off documentado em relatório `docs/relatorios/`

## Rollback obrigatório

Se freeze por G2/G6:

- Rollback Fly/Vercel conforme [ROLLBACK-CHECKLIST](../../operational/templates/ROLLBACK-CHECKLIST.md)
- **Não** auto-executar em V1.5

## Certification invalidation

| Evento | Efeito |
|--------|--------|
| FREEZE ativado | cert pending até revalidação |
| BLOCK | invalidate_pending_deploy |
| Recovery | nova certificação + hash |

## Script

```bash
node scripts/resilience/freeze-governance-simulator.js
```
