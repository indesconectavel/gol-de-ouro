# Modelo de certificação live (V1.5)

Readiness para certificação contínua **quando** CI/alertas forem ativados.

## Critérios live

| Check | Requisito |
|-------|-----------|
| LC-01 | `external-certification-engine` existe |
| LC-02 | probes externos funcionais |
| LC-03 | alert routing simulador |
| LC-04 | CI example disponível |
| LC-05 | activation gates |
| LC-06 | persistence engine |
| LC-07 | documentação |
| Probes prod | availability ≥ 95% |
| Finance | proof VALID |

## Estados readiness

| Estado | Critério |
|--------|----------|
| **READY** | 90%+ checklist + CI ativo (futuro) |
| **PARTIAL** | scripts OK; CI/alertas dry-run |
| **BLOCKED** | artefato obrigatório ausente |

## Expiry

- Certificação válida: **6h** após último run bem-sucedido (quando CI ativo)
- Invalidação: score &lt; 85, P0, `financial_proof` !== VALID

## Revalidation

```bash
node scripts/autonomous/external-certification-engine.js
node scripts/resilience/live-certification-readiness.js
```

## Freeze interactions

- Durante FREEZE simulado: cert status `pending`
- Pós-recovery: revalidation obrigatória

## Script

```bash
node scripts/resilience/live-certification-readiness.js
```
