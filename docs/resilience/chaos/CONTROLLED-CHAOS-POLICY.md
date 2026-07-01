# Política de chaos controlado (V1.5)

**Somente documentação e tabletop** — sem injeção de falhas em produção.

## Limites

| Regra | Valor |
|-------|-------|
| Ambiente prod | **proibido** injeção ativa |
| Ambiente staging | drills com aprovação |
| Duração máx drill | 2h |
| Participantes mínimos | 2 ops |

## Rollback

- Plano obrigatório antes do drill
- Targets: Fly v461, bundle certificado
- Abort se P0 real durante exercício

## Observabilidade mínima

- `continuous-verification.js` antes/depois
- `external-certification-engine.js` pós-drill
- Snapshots em `docs/resilience/persistence/`

## Abort conditions

- P0 real em produção
- `financial_proof` INVALID
- Score &lt; 70
- Comando manual incident commander

## Script readiness

```bash
node scripts/resilience/controlled-chaos-readiness.js
```

Drills: `docs/chaos/drills/` + `docs/reliability/chaos/` (V1.4/V1.5)
