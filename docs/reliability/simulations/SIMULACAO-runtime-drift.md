# Simulação — Runtime drift (documental)

**Tipo:** tabletop · **sem execução em produção**  
**Refs:** V1.2C · [RUNBOOK-runtime-drift](../../runbooks/runtime/RUNBOOK-runtime-drift.md)

---

## Cenário

Deploy não documentado ou commit em `main` à frente do runtime live (`/meta` SHA ≠ baseline V1.1G). Fly release v462 sem relatório V1.1F.

## Impacto esperado

| Área | Impacto |
|------|---------|
| Runtime | Código live desconhecido |
| Financeiro | Indireto se RPC alterada |
| Player | Bundle pode divergir |
| Ops | Validação de incidentes impossível |

## Alertas esperados

- C-05 / DC-01 (V1.2B/C)
- DR-01, DR-03 (V1.2E/V1.3)
- Runtime certification → **DEGRADED** ou **INVALID**

## Runbooks acionados

1. [RUNBOOK-runtime-drift](../../runbooks/runtime/RUNBOOK-runtime-drift.md)
2. [RUNBOOK-validacao-codigo-live](../../runbooks/runtime/RUNBOOK-validacao-codigo-live.md)
3. [RUNBOOK-fly-release-inesperada](../../runbooks/runtime/RUNBOOK-fly-release-inesperada.md)

## Rollback esperado

- Fly rollback para v461 (baseline certificada)
- Confirmar `/meta` = `a83c3cf…`
- Relatório deploy + `V12E_DEPLOY_JUSTIFICATION` se drift intencional

## Classificação

| Fase | P |
|------|---|
| Detecção | P2 |
| Se webhook/HMAC quebrado | P0 |
| Se só drift documental | P3 |

## Tempo de contenção esperado

| Ação | SLA |
|------|-----|
| Confirmar read-only (`continuous-verification`) | 15 min |
| Decisão rollback vs justificar | 1–4 h |
| Certificação pós-ação | 30 min |

## Validação pós-simulação

```bash
node scripts/reliability/runtime-certification.js
# Esperado após correção: CERTIFIED
```
