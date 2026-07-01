# Modelo de resiliência de produção (V1.5)

## Classificação (score 0–100)

| Score | Classe | Significado |
|------:|--------|-------------|
| ≥92 | **HARDENED** | MTTR &lt;1h; rollback documentado |
| 85–91 | **RESILIENT** | Recuperação estruturada |
| 70–84 | **STABLE** | Operação OK com ressalvas |
| &lt;70 | **FRAGILE** | NO-GO operacional |

## Domínios

| Domínio | Peso no score |
|---------|---------------|
| Runtime resilience | 25% |
| Financial resilience | 30% |
| Operational resilience | 25% |
| Recovery readiness | 20% |

## Recovery targets

| Classe | MTTR estimado | Blast radius |
|--------|---------------|--------------|
| HARDENED | &lt;1h | low |
| RESILIENT | 1–2h | low |
| STABLE | 2–4h | medium |
| FRAGILE | 4–8h | high |

## Rollback capability

- Fly v461 + SHA `a83c3cf` + bundle `index-B6M2smS9.js`
- Simulado em `freeze-governance-simulator.js`
- SQL/RPC: somente com snapshot PRE-APPLY aprovado

## Freeze governance

Ver [freeze/FREEZE-GOVERNANCE-POLICY.md](freeze/FREEZE-GOVERNANCE-POLICY.md).

## Script

```bash
node scripts/resilience/production-resilience-engine.js
```
