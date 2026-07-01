# RUNBOOK — Validação de código live vs GitHub

**Área:** Governança · **V1.2C:** risco `medio` validar código não-live

---

## Sintomas

- `origin/main` (`0f4202c`) ≠ `/meta` (`a83c3cf`).
- Repo local `d11906d` ≠ runtime.
- Fixes em `main` que não tocam paths do `backend-deploy.yml`.
- Auditoria/teste contra branch errada.

## Severidade

| Situação | Nível |
|----------|-------|
| Drift documentado (PR #99 workflow only) | **P3** |
| Mudança `server-fly.js` em main não deployada | **P1** |
| Incidente financeiro investigado só no código local | **P0** risco |

## Possíveis causas

- Path filters workflows (H3.6C).
- Desenvolvimento local à frente do deploy.
- Múltiplos merges docs/scripts sem Fly.

## Queries (read-only)

```bash
git rev-parse HEAD origin/main
curl -s https://goldeouro-backend-v2.fly.dev/meta | jq -r .gitCommit
node scripts/v1-2c-runtime-drift-deploy-integrity.js
gh api repos/indesconectavel/gol-de-ouro/commits/main --jq '.sha'
```

**Regra de ouro:** verdade operacional = **`GET /meta`** + métricas V1.2A, não `main` HEAD.

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Testes de regressão no SHA live | Certificar fix só porque está em `main` |
| Relatório cita SHA live | Deploy assumido sem `/meta` |

## Ações permitidas

- Checkout do SHA live para reprodução read-only.
- `workflow_dispatch` `release_sha=<SHA aprovado>`.
- Atualizar baseline pós-deploy certificado.

## Ações proibidas

- Fechar incidente financeiro sem confirmar runtime SHA.
- Aplicar patch SQL baseado só em `main`.

## Rollback

N/A (processo); deploy se código errado já foi publicado.

## Escalonamento

Ops → release manager → auditoria se decisão financeira baseada em código errado.
