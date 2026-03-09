# Checklist — Patch de deployabilidade V1.2.1 (2026-03-06)

Use este checklist antes e durante o próximo deploy do backend (Fly) após o patch V1.2.1.

---

## Pré-deploy (local/repo)

- [ ] Branch atual contém os commits do patch: `bdcd8b2` (withdrawalStatus.js) e `55c5cb8` (fly.toml).
- [ ] `git log -2 --oneline` mostra os dois commits acima.
- [ ] Arquivos presentes: `src/domain/payout/withdrawalStatus.js`, `src/domain/payout/processPendingWithdrawals.js`, `src/domain/payout/reconcileProcessingWithdrawals.js`.
- [ ] Nenhuma alteração não commitada em código de produção (opcional: `git status` limpo em `src/` e `fly.toml`).

---

## Build / imagem

- [ ] Build local ou CI usa o commit **55c5cb8** (ou posterior) para gerar a imagem.
- [ ] `.dockerignore` não exclui `src/domain/payout/withdrawalStatus.js`.

---

## Deploy no Fly

- [ ] Comando de deploy: a partir do diretório do backend, `fly deploy` (ou o fluxo CI que faz deploy do app `goldeouro-backend-v2`).
- [ ] Se o deploy falhar com smoke check na machine do **payout_worker** (não escuta em 8080):
  1. Tentar deploy em dois passos:  
     `fly deploy --process-groups app`  
     Depois: `fly deploy --process-groups payout_worker`  
     (Smoke deve rodar apenas nas machines do grupo atual.)
  2. Ou consultar a documentação Fly para desabilitar smoke checks por process group / por máquina, se disponível.

---

## Pós-deploy

- [ ] App (process group `app`) responde em `/health` (porta 8080).
- [ ] Payout worker (process group `payout_worker`) aparece como running em `fly status` (sem exigir HTTP em 8080).
- [ ] Nenhuma alteração em frontend, Vercel ou `/game` foi feita por este patch.

---

## Rollback (se necessário)

- [ ] Rollback de release no Fly: `fly releases rollback` (ou selecionar release anterior).
- [ ] Rollback de código: reverter os commits `55c5cb8` e `bdcd8b2` (ver relatório DEPLOYABILITY-PATCH-V1_2_1-2026-03-06.md, seção 6).

---

## Referências

- Relatório: `docs/relatorios/DEPLOYABILITY-PATCH-V1_2_1-2026-03-06.md`
- Root cause do fail V1.2: `docs/relatorios/DEPLOY-FINAL-FAIL-ROOTCAUSE-READONLY-2026-03-06.md`
