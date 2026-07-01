# RUNBOOK — Bundle player divergente

**Área:** Deploy frontend · **Alerta V1.2C:** DC-04, DA-05

---

## Sintomas

- HTML em `www.goldeouro.lol` / `app.goldeouro.lol` sem `index-B6M2smS9.js`.
- Múltiplos bundles entre URLs.
- Alerta **DC-04**.

## Severidade

| Situação | Nível |
|----------|-------|
| Bundle novo pós-deploy Vercel documentado | **P2** |
| Bundle inesperado / cache quebrado | **P1** |
| Player carrega JS antigo com API nova (incompatível) | **P0** |

## Possíveis causas

- `frontend-deploy.yml` não rodou.
- Cache CDN/Vercel.
- Deploy manual Vercel fora do workflow.
- Rollback frontend não aplicado.

## Queries (read-only)

```bash
curl -sL https://www.goldeouro.lol | grep -o 'index-[A-Za-z0-9_-]*\.js'
curl -sL https://app.goldeouro.lol | grep -o 'index-[A-Za-z0-9_-]*\.js'
gh run list --workflow frontend-deploy.yml --limit 3
```

Baseline: **`index-B6M2smS9.js`** (V1.1G).

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Bundle = baseline ou deploy documentado | Bundle ≠ esperado sem relatório |
| Ambas URLs consistentes | URLs com bundles diferentes |

## Ações permitidas

- Purge cache Vercel (change control).
- `frontend-rollback-manual.yml` para snapshot H3-6C.
- Validar jogo smoke read-only.

## Ações proibidas

- `vercel --prod` local sem workflow.
- Alterar `vercel.json` em incidente sem PR.

## Rollback

`frontend-rollback-manual.yml` · snapshot `dpl_5CiXu7nXm…` (H3-6C).

## Escalonamento

Ops → frontend owner → produto se jogadores impactados.
