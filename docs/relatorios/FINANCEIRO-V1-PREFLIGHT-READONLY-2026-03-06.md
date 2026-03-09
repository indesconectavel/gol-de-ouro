# Preflight READ-ONLY final — Deploy V1.2 sistema financeiro

**Data:** 2026-03-06  
**Objetivo:** Congelar o estado atual antes do deploy final e confirmar GO/NO-GO para o deploy do V1.2.

---

## 1) Resumo executivo

- **Frontend:** Preservado. GET /game e /dashboard retornaram 200, server=Vercel, mesmo sha256 para ambos (fingerprint estável).
- **Backend atual:** Fly app `goldeouro-backend-v2`; machines em **v313** (2 app — 1 started, 1 stopped — e 1 payout_worker started); imagem atual: deployment-01KK1G1ZJGJRZQ2K21E8VY3C26.
- **Release de rollback:** Última release com status **complete** na lista Fly: **v305** (Feb 25 2026). v313 e releases recentes aparecem como *failed*; as machines estão rodando v313. Para rollback seguro, usar **v305** (última complete) ou a release estável anterior ao deploy do V1.2.
- **Estado financeiro:** 7 saques rejeitados (5 com rollback, 2 históricos/inconclusivos); ledger_ok; 0 saques presos >30 min; bloqueios = históricos_ou_inconclusivos.
- **Git:** Branch `hotfix/financeiro-v1-stabilize`, HEAD = `73de7a39` (commit V1.2 esperado). Working tree com 311 linhas de status (não limpo).
- **GO/NO-GO:** **GO** para deploy do V1.2, com ressalva: fazer deploy a partir do commit 73de7a39; em caso de problema, rollback para release v305 ou revert do commit.

---

## 2) Frontend preservado?

**Sim.**

| Endpoint | Status | Server | SHA256 (HTML) |
|----------|--------|--------|----------------|
| https://www.goldeouro.lol/game | 200 | Vercel | bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0 |
| https://www.goldeouro.lol/dashboard | 200 | Vercel | bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0 |

- Headers principais: content-type text/html; charset=utf-8, x-vercel-cache HIT.
- Fingerprint estável: mesmo hash para /game e /dashboard (SPA ou mesma shell).

Evidência: `docs/relatorios/financeiro-v1-preflight-frontend.json`.

---

## 3) Backend e release atual

- **App Fly:** goldeouro-backend-v2  
- **Hostname:** goldeouro-backend-v2.fly.dev  
- **Machines:** 3 (app: 1 started + 1 stopped; payout_worker: 1 started). Versão nas machines: **313**.  
- **Scale:** app count=2, payout_worker count=1; região gru.  
- **Releases (Fly):** v313 mais recente, status *failed*; v312–v306 *failed*; **v305 complete** (Feb 25 2026). As machines estão em v313 apesar do status da release.

Evidência: `financeiro-v1-preflight-fly.json`, `financeiro-v1-preflight-releases.json`.

---

## 4) Estado financeiro atual

- **Saques rejeitados:** 7 total; 5 com rollback, 2 sem (1 pré-V1.2 reconciler, 1 inconclusivo).  
- **Rollback:** conclusão `rollback_parcial`.  
- **Ledger:** `ledger_ok`.  
- **Saques presos >30 min:** 0.  
- **Bloqueios remanescentes:** históricos_ou_inconclusivos (não bloqueiam deploy).

Evidência: `financeiro-v1-preflight-finance.json` (resumo gerado a partir de `financeiro-v1-final-validacao-readonly.js` e `prova-saques-presos-detalhe-readonly.js`).

---

## 5) Release de rollback identificada?

**Sim.**

- **Release estável conhecida (complete):** **v305** (Feb 25 2026).  
- Em caso de rollback após o deploy do V1.2:  
  - **Opção A:** Reverter no Fly para a release **v305** (ou outra release complete anterior estável).  
  - **Opção B:** Reverter código com `git revert 73de7a39efafe58e643f1e10207108da9098a63d --no-edit`, fazer novo deploy.

A release **segura para rollback** documentada é **v305**.

---

## 6) GO / NO-GO para deploy do V1.2

**GO.**

- Frontend preservado; backend identificado; estado financeiro sem bloqueios; commit V1.2 (73de7a39) no HEAD; release de rollback (v305) identificada.  
- Working tree não limpo (311 linhas de status): garantir que o deploy use o commit 73de7a39 (não incluir alterações não commitadas).

---

## 7) Próxima ação recomendada

1. **Deploy:** Fazer deploy do V1.2 a partir do commit `73de7a39` (branch `hotfix/financeiro-v1-stabilize`) no Fly.  
2. **Pós-deploy:** Confirmar nas machines que a nova versão (ex.: v314) está rodando e que os logs mostram `[PAYOUT][RECON]` quando o reconciler rejeitar algum saque.  
3. **Rollback (se necessário):** Usar release **v305** no Fly ou `git revert 73de7a39` + novo deploy.

---

## Respostas finais

| Pergunta | Resposta |
|----------|----------|
| **GO ou NO-GO** | **GO** |
| **Release segura para rollback** | **v305** (última release com status complete no Fly). |
| **/game está preservado?** | **Sim.** GET /game retornou 200, server=Vercel, sha256 registrado. |
| **Financeiro pronto para o deploy final?** | **Sim.** Ledger ok, 0 saques presos, bloqueios apenas históricos; patch V1.2 no HEAD. |

---

## Artefatos

| Artefato | Caminho |
|----------|----------|
| Relatório | docs/relatorios/FINANCEIRO-V1-PREFLIGHT-READONLY-2026-03-06.md |
| Frontend | docs/relatorios/financeiro-v1-preflight-frontend.json |
| Fly | docs/relatorios/financeiro-v1-preflight-fly.json |
| Releases | docs/relatorios/financeiro-v1-preflight-releases.json |
| Financeiro | docs/relatorios/financeiro-v1-preflight-finance.json |
| Git | docs/relatorios/financeiro-v1-preflight-git.json |
| Script | scripts/financeiro-v1-preflight-readonly.js |
