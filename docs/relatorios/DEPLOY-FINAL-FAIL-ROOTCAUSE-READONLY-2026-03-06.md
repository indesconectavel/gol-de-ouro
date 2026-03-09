# Root cause do FAIL no deploy final V1.2 — Auditoria READ-ONLY

**Data:** 2026-03-06  
**Objetivo:** Causa exata do falha no deploy (module not found + smoke fail no payout_worker) e commit mínimo para próximo deploy.

---

## 1) Resumo executivo

- **Causa 1 (module not found):** O commit **73de7a39** não inclui o arquivo **`src/domain/payout/withdrawalStatus.js`**. Esse arquivo está **untracked** no repositório (nunca foi commitado). O deploy foi feito a partir de um worktree limpo nesse commit, então a imagem foi buildada sem `withdrawalStatus.js`. Tanto `processPendingWithdrawals.js` quanto `reconcileProcessingWithdrawals.js` fazem `require('./withdrawalStatus')`, o que gera **MODULE_NOT_FOUND** ao subir o app.
- **Causa 2 (payout_worker smoke fail):** O process group **payout_worker** roda apenas `node src/workers/payout-worker.js` (loop sem HTTP). O **fly.toml** já restringe `[[services]]` a `processes = ["app"]` (porta 8080 só para app). Ainda assim, no deploy o Fly executou smoke check na machine do **payout_worker** e falhou por “not listening on 0.0.0.0:8080” / “app appears to be crashing”. Ou o Fly aplica smoke a todas as machines na fase de deploy, ou a ordem de atualização (worker primeiro) fez o rollback abortar antes de chegar ao app.
- **Commit mínimo correto:** Um commit que contenha **73de7a39 + `withdrawalStatus.js`** (ou seja, incluir `withdrawalStatus.js` no repositório e fazer o próximo deploy a partir desse novo commit).

---

## 2) Causa raiz do module not found

- **Arquivo ausente no commit:** `src/domain/payout/withdrawalStatus.js`
- **Evidência:**  
  - `git ls-tree 73de7a39 --name-only -r src/domain/payout/` → apenas `processPendingWithdrawals.js` e `reconcileProcessingWithdrawals.js`.  
  - `git status src/domain/payout/` → `?? src/domain/payout/withdrawalStatus.js` (untracked).  
- **Cadeia:** `server-fly.js` e `payout-worker.js` carregam `processPendingWithdrawals.js`; este faz `require('./withdrawalStatus')`. Sem o arquivo na imagem, o Node lança MODULE_NOT_FOUND ao iniciar.

---

## 3) Causa raiz do fail do payout_worker

- **Configuração atual:** No **fly.toml**, `[[services]]` tem `internal_port = 8080` e **`processes = ["app"]`**, ou seja, o serviço HTTP e os `http_checks` estão limitados ao processo **app**.
- **Comportamento do worker:** O **payout_worker** executa só `node src/workers/payout-worker.js` (loop com `setInterval`); não inicia servidor HTTP e não escuta em nenhuma porta.
- **O que ocorreu no deploy:** O log do Fly mostrou “Running smoke checks on machine e82794da791108” (payout_worker) e falha “the app appears to be crashing” / “not listening on the expected address 0.0.0.0:8080”. Conclusão: durante o deploy, o Fly rodou smoke check também na machine do **payout_worker**; como esse processo não escuta em 8080, o check falhou.
- **Por que isso acontece:** Ou (1) o deploy aplica um smoke padrão a todas as machines atualizadas, ou (2) a mesma imagem é usada em todos os process groups e o Fly espera que toda machine escute em 8080 após o start. Em ambos os casos, o worker (que não expõe 8080) falha no smoke.

---

## 4) O que precisa entrar no próximo commit

- **Obrigatório:** Incluir **`src/domain/payout/withdrawalStatus.js`** no repositório (atualmente untracked).
- **Sugestão:** Fazer um commit único que adicione esse arquivo (por exemplo: “chore: add withdrawalStatus.js for V1.2 deploy”) na branch atual, ou fazer um commit filho de 73de7a39 contendo apenas esse arquivo. O próximo deploy deve ser feito a partir desse novo commit (ou de um que contenha 73de7a39 + withdrawalStatus.js).

---

## 5) O que precisa mudar no Fly

- **Se o Fly continuar aplicando smoke a todas as machines:**  
  - Garantir que o **payout_worker** não receba HTTP health check. Por exemplo: configurar **checks** ou **vm** com `processes` restritos ao grupo **app**, ou usar `http_checks = []` para o worker (conforme documentação Fly para process groups).  
  - Alternativa: fazer o worker expor um endpoint mínimo em 8080 só para health (não recomendado se o objetivo é manter o worker sem HTTP).
- **Se após incluir withdrawalStatus.js o deploy passar nas machines “app” e ainda falhar só no worker:**  
  - Ajustar a configuração do Fly para que o smoke/health check **não** seja aplicado ao process group **payout_worker**, mantendo o **fly.toml** com `processes = ["app"]` no `[[services]]` e, se necessário, desabilitando ou restringindo checks por process group.

---

## 6) Próximo patch mínimo recomendado (sem implementar)

1. **Repositório:**  
   - `git add src/domain/payout/withdrawalStatus.js`  
   - `git commit -m "chore: add withdrawalStatus.js for V1.2 deploy"`  
   - Deploy a partir desse novo commit (ou do commit que contenha 73de7a39 + withdrawalStatus.js).

2. **Fly (se o smoke do worker continuar falhando):**  
   - Ajustar **fly.toml** (ou config via Fly API/dashboard) para que o process group **payout_worker** não seja alvo de HTTP health check em 8080 (ex.: seção de checks com `processes` ou equivalente para excluir o worker).

---

## 7) GO / NO-GO para o patch

- **GO** para o patch de repositório: adicionar e commitar **withdrawalStatus.js** e fazer o próximo deploy a partir desse commit é necessário e suficiente para eliminar o MODULE_NOT_FOUND.
- **GO condicional** para o patch no Fly: se, após o deploy com withdrawalStatus.js, o Fly ainda falhar no smoke do **payout_worker**, aplicar a alteração de configuração (excluir worker dos HTTP checks) conforme acima.

---

## Artefatos

| Artefato | Caminho |
|----------|----------|
| Relatório | docs/relatorios/DEPLOY-FINAL-FAIL-ROOTCAUSE-READONLY-2026-03-06.md |
| Gap de arquivos | docs/relatorios/deploy-fail-rootcause-files.json |
| Fly / worker | docs/relatorios/deploy-fail-rootcause-fly-worker.json |
| Commit gap | docs/relatorios/deploy-fail-rootcause-commit-gap.json |
