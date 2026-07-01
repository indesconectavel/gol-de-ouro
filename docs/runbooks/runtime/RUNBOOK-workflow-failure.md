# RUNBOOK — Workflow deploy failure

**Área:** Deploy · **Alerta V1.2C:** DC-03, DA-01

---

## Sintomas

- `gh run list --workflow backend-deploy.yml` → `failure` no HEAD ou pós-merge.
- Deploy parcial: workflow fail mas Fly já atualizado (raro).
- **DC-03** no SHA runtime certificado.

## Severidade

| Situação | Nível |
|----------|-------|
| Failure em PR (não main) | **P3** |
| Failure em `main` / dispatch produção | **P1** |
| Runtime live ≠ artefacto workflow failed | **P0** |

## Possíveis causas

- Testes backend falhando.
- Secret Fly/Supabase expirado.
- Concurrency cancel (PR #99 fix).
- Timeout npm audit.

## Queries (read-only)

```bash
gh run list --workflow backend-deploy.yml --limit 5
gh run view <RUN_ID> --log-failed
gh run list --workflow main-pipeline.yml --limit 3
gh run list --workflow frontend-deploy.yml --limit 3
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Último deploy prod **success** (ex. 26065827870) | Último prod run **failure** |
| `/meta` alinhado ao SHA do success | `/meta` no SHA do failed run |

## Ações permitidas

- Re-run job após fix causa.
- `workflow_dispatch` com `release_sha` explícito.
- Freeze deploy até verde.

## Ações proibidas

- Merge bypass checks.
- Deploy local Fly para “consertar CI”.

## Rollback

- Se failure após deploy parcial: rollback Fly + re-run workflow.

## Escalonamento

Ops → CI owner → engenharia plataforma.
