# Modelo de activation gates (V1.5)

**Modo:** dry-run — `activation-gate-engine.js` não bloqueia CI/deploy real.

## Decisões

| Decisão | Significado |
|---------|-------------|
| **ALLOW** | Todos os gates críticos OK; deploy permitido (simulado) |
| **REVIEW** | 1 warning ou score 85–89; sign-off humano |
| **FREEZE** | 2+ warnings ou tendência degradação; congelar mudanças |
| **BLOCK** | Gate crítico falhou; NO-GO deploy |

## Gates obrigatórios

| ID | Critério | Bloqueio |
|----|----------|----------|
| G1 | operational_score ≥ 85 | BLOCK |
| G2 | financial_proof === VALID | BLOCK |
| G3 | external_certification === EXTERNALLY_CERTIFIED | BLOCK |
| G4 | anomaly_score ≤ 35 | WARNING |
| G5 | availability ≥ 95% | BLOCK |
| G6 | P0 alerts === 0 | BLOCK |
| G7 | runtime_certification === CERTIFIED | WARNING |

## Freeze triggers

- `FREEZE` decision
- 2+ warnings simultâneos
- `trend.degradation === true`

## Deploy blockers

- Qualquer gate G1/G2/G3/G5/G6 em falha
- `financial_proof` INVALID
- `external_certification` !== EXTERNALLY_CERTIFIED

## Rollback blockers (recomendação)

- G2 ou G6 falha → rollback simulado documentado
- Não executar rollback automático (V1.5)

## Override policy

| Quem | Quando |
|------|--------|
| ops-lead + finance | REVIEW → ALLOW com `V15_GATE_OVERRIDE` documentado |
| incident commander | P0 contenção — override proibido para deploy |
| — | BLOCK nunca overridden sem postmortem |

## Script

```bash
node scripts/activation/activation-gate-engine.js
```
