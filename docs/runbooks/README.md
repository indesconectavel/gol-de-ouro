# Runbooks operacionais — Gol de Ouro

**Camada:** V1.2D · pós-certificação V1.1G / observabilidade V1.2A–C  
**Modo padrão:** read-only até decisão explícita de ops

## Índice

| Área | Runbooks |
|------|----------|
| [Financeiro](financeiro/) | approved-sem-ledger, pending-antigos, rollback-spike, duplicata-ledger, saldo-negativo |
| [Runtime / Deploy](runtime/) | runtime-drift, fly-release-inesperada, workflow-failure, bundle-divergente, validacao-codigo-live |
| [Workers](workers/) | reconcile-parado, payout-worker-offline, backlog-growth |
| [Segurança](seguranca/) | webhook-rejected-spike, hmac-failure, replay-webhook, flood-payout-webhook |
| Governança | [CLASSIFICACAO-DE-INCIDENTES.md](CLASSIFICACAO-DE-INCIDENTES.md) · [INCIDENT-RESPONSE-FLOW.md](INCIDENT-RESPONSE-FLOW.md) |

## Scripts de observabilidade (read-only)

- `node scripts/v1-2a-runtime-financial-health.js`
- `node scripts/v1-2b-operational-alerts.js`
- `node scripts/v1-2c-runtime-drift-deploy-integrity.js`

## Baseline certificada (referência)

- Runtime SHA: `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634`
- Fly: **v461** · app `goldeouro-backend-v2`
- Player bundle: `index-B6M2smS9.js`
