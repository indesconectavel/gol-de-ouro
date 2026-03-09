# Deploy seguro PAYOUT V1.1 — Relatório

**Data:** 2026-03-06  
**Objetivo:** Deploy controlado do commit `0f09038` (patch V1.1 payout_worker) somente no Fly/backend, sem tocar no Vercel/frontend.

---

## Resultado: **FAIL (ABORTADO)**

O deploy **não foi executado**. O pipeline foi **abortado** no **PASSO 3 (Backup)** conforme regra: *Se backup falhar, ABORTAR.*

---

## Commit alvo

- **Hash:** `0f09038dea8363fd986763107bb07c580a748226`
- **Mensagem:** fix(payout): patch V1.1 observabilidade e anti-zumbi worker
- **Arquivos alterados (apenas):** `src/domain/payout/processPendingWithdrawals.js`, `src/workers/payout-worker.js`

---

## Gates e passos executados

| Passo | Descrição | Resultado |
|-------|-----------|-----------|
| 0 | Gate frontend: /game e /dashboard 200, server Vercel | **PASS** |
| 1 | Gate Git: branch, HEAD = 0f09038, sem código modificado | **PASS** |
| 2 | Snapshot Fly antes (status, machines, scale, releases) | **OK** (registrado em payout-v1_1-fly-before.json) |
| 3 | Backup pg_dump (DATABASE_URL) | **FAIL** — DATABASE_URL não definida no ambiente local |
| 4–7 | Deploy, smoke, logs, postdeploy | Não executados (abort) |

---

## Motivo do abort (PASSO 3)

- **Backup:** Script `scripts/payout-v1_1-backup-run.js` carrega `DATABASE_URL` via `dotenv` a partir de `.env` na raiz do backend.
- **Falha:** `DATABASE_URL` não estava definida (arquivo `.env` ausente ou variável não presente).
- **Regra aplicada:** *Se backup falhar, ABORTAR.* Nenhum deploy foi realizado.

---

## PASSO 0 e 1 — Evidência

- **/game:** status 200, server Vercel (payout-v1_1-vercel-freeze-check.json).
- **/dashboard:** status 200, server Vercel.
- **Git:** branch `hotfix/financeiro-v1-stabilize`, HEAD `0f09038`; modificados apenas docs (payout-v1_1-git-gate.json).

---

## PASSO 2 — Fly antes (registrado)

- **App:** goldeouro-backend-v2
- **Release atual:** v312 (status failed; máquinas rodando essa imagem)
- **Última release complete estável:** v305 (Feb 25 2026)
- **Processos:** app (2 máquinas), payout_worker (1)
- **Rollback planejado se necessário:** `flyctl releases rollback -a goldeouro-backend-v2 --version v305`

Evidência: `docs/relatorios/payout-v1_1-fly-before.json`.

---

## Artefatos

| Artefato | Caminho | Conteúdo |
|----------|---------|----------|
| Gate Vercel | `docs/relatorios/payout-v1_1-vercel-freeze-check.json` | Status/headers/sha256 /game e /dashboard |
| Gate Git | `docs/relatorios/payout-v1_1-git-gate.json` | Branch, HEAD, working tree OK |
| Fly antes | `docs/relatorios/payout-v1_1-fly-before.json` | Release atual v312, estável v305, machines |
| Backup | `docs/relatorios/payout-v1_1-backup.json` | FAIL — DATABASE_URL não set |
| Deploy result | `docs/relatorios/payout-v1_1-deploy-result.json` | Abort (não executado) |
| Smoke | `docs/relatorios/payout-v1_1-smoke.json` | Abort (não executado) |
| Worker signals | `docs/relatorios/payout-v1_1-worker-signals.json` | Abort (não executado) |
| Postdeploy status | `docs/relatorios/payout-v1_1-postdeploy-status.json` | Abort (não executado) |

- **Backup path + hash:** N/A (backup não realizado).
- **Release Fly antes/depois:** Antes = v312; depois = N/A (deploy não realizado).
- **Smoke /health, /game, /dashboard:** N/A.
- **Rollback:** Não aplicável.

---

## Decisão

- **PASS/FAIL:** **FAIL**
- **Rollback:** Não (deploy não ocorreu).
- **Frontend/jogo:** Preservado (gate 0 passou; Vercel intocado).

---

## Próximo passo recomendado

1. **Configurar DATABASE_URL** para o ambiente local (produção ou cópia):
   - Criar/ajustar `.env` na raiz do backend com `DATABASE_URL=postgresql://...` (connection string do Supabase/Postgres).
   - Não commitar `.env`; não imprimir o valor em logs.
2. **Reexecutar** o pipeline de deploy seguro a partir do **PASSO 3** (backup). Passos 0, 1 e 2 já passaram e o snapshot Fly já está registrado.
3. Opcional: validar backup localmente com `node scripts/payout-v1_1-backup-run.js` antes de rodar o pipeline completo.
