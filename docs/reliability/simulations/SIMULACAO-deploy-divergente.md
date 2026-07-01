# Simulação — Deploy divergente (documental)

**Refs:** V1.1F · [RUNBOOK-bundle-divergente](../../runbooks/runtime/RUNBOOK-bundle-divergente.md)

---

## Cenário

Backend v461 certificado mas Vercel player serve `index-XXXX.js` ≠ `index-B6M2smS9.js`. Ou workflow `frontend-deploy` verde com bundle errado.

## Impacto

- UX/API mismatch
- Webhooks OK no backend; player quebrado
- runtime certification → **DEGRADED** (bundle check fail)

## Alertas

- DC-04 (V1.2C)
- RT-06 (V1.2E)

## Runbooks

1. [RUNBOOK-bundle-divergente](../../runbooks/runtime/RUNBOOK-bundle-divergente.md)
2. [RUNBOOK-workflow-failure](../../runbooks/runtime/RUNBOOK-workflow-failure.md)
3. [DEPLOY-CHECKLIST](../operational/templates/DEPLOY-CHECKLIST.md)

## Rollback

- `vercel rollback` para deploy com bundle certificado
- Revalidar 3 URLs player

## Classificação

| Sintoma | P |
|---------|---|
| Só bundle | P2 |
| API + player down | P0 |

## Contenção

| Etapa | Tempo |
|-------|-------|
| `watchdog-runtime-health.js` | 10 min |
| Rollback Vercel | 30–60 min |
| Certificação | 15 min |
