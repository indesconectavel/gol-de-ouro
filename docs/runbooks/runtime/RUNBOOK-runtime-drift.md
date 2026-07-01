# RUNBOOK — Runtime drift (SHA / Fly / baseline)

**Área:** Runtime · **Alertas:** V1.2B C-05 · V1.2C DA-03, DC-01, DC-02

---

## Sintomas

- `/meta.gitCommit` ≠ baseline `a83c3cf…`.
- Fly release ≠ **v461**.
- V1.2C **DA-03** (main `0f4202c` vs runtime `a83c3cf` — documentado).
- Drift não justificado (`V12C_DEPLOY_JUSTIFICATION` ausente).

## Severidade

| Situação | Nível |
|----------|-------|
| Drift documentado PR #99 (main ahead, runtime certificado) | **P3** |
| SHA/Fly divergente **sem** relatório deploy | **P0** |
| Main ahead com mudança `server-fly.js` não deployada | **P1** |

## Possíveis causas

- Deploy controlado não executado após merge.
- Path filter `backend-deploy.yml` (só paths funcionais).
- Deploy manual Fly fora do workflow.
- Rollback parcial.

## Queries (read-only)

```bash
curl -s https://goldeouro-backend-v2.fly.dev/meta | jq .gitCommit
curl -s https://goldeouro-backend-v2.fly.dev/health
flyctl releases -a goldeouro-backend-v2 --json | head
node scripts/v1-2c-runtime-drift-deploy-integrity.js
gh run list --workflow backend-deploy.yml --limit 3
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Runtime = baseline certificado V1.1G | SHA ou Fly ≠ certificado sem justificativa |
| Drift main documentado; webhooks 401 | `/health` não ok |

## Ações permitidas

- Comparar com [V1.1F deploy](../../relatorios/V1-1F-DEPLOY-CONTROLADO-WEBHOOK-PAYOUT-2026-05-18.md).
- Registrar `V12C_DEPLOY_JUSTIFICATION` se drift intencional.
- Planejar `workflow_dispatch` com `release_sha` certificado.

## Ações proibidas

- Deploy “rápido” sem gate V1.2C.
- Validar fix financeiro só em `main` sem confirmar `/meta`.

## Rollback

- Ver [RUNBOOK-fly-release-inesperada](RUNBOOK-fly-release-inesperada.md).

## Escalonamento

Ops → release manager → engenharia se drift não documentado.
