# Deploy seguro do frontend player — Auditoria READ-ONLY

**Data:** 2026-03-06  
**Modo:** Somente leitura. Nenhuma alteração de código, commit, deploy, Vercel ou Fly.

---

## 1) Resumo executivo

- **Produção atual:** Deployment **ez1oc96t1** (Vercel), projeto goldeouro-player, domínio www.goldeouro.lol.
- **Correção da tela de saque:** **Não** está em produção (deploy atual é anterior ao commit 258b0cd).
- **Commit recomendado para deploy:** **8f51edc** (ou 258b0cd), branch `hotfix/financeiro-v1-stabilize`.
- **Deployment a preservar para rollback:** **ez1oc96t1**.
- **Conclusão:** **GO** para deploy seguro do player, com checks pós-deploy e plano de rollback.

---

## 2) Estado atual do frontend em produção

| Item | Valor |
|------|--------|
| Deployment ID | ez1oc96t1 |
| Projeto Vercel | goldeouro-player |
| Domínio | https://www.goldeouro.lol (e app.goldeouro.lol, goldeouro.lol) |
| Status | Ready |
| Server | Vercel |
| Fonte snapshot | vercel-deployments-snapshot.json (2026-03-06 01:03 UTC) |

/game e /dashboard retornam 200, HTML SPA com bundle `/assets/index-qIGutT6K.js`. Fingerprint (sha256 do HTML) está documentado em `frontend-player-deploy-safe-fingerprint.json`.

---

## 3) Commit correto do player para deploy

| Item | Valor |
|------|--------|
| Branch | hotfix/financeiro-v1-stabilize |
| HEAD atual | 8f51edc04fa293ee06c25a21b499ca8e29b04ed3 |
| Commit da correção de saque | 258b0cd624a251f6f64b0c8e7d9582c1ab41e888 |
| Commit recomendado para deploy | **8f51edc** (inclui 258b0cd e doc do checklist) |

Arquivos da correção no commit 258b0cd: `withdrawService.js`, `config/api.js`, `Withdraw.jsx`, mais relatório e checklist em docs/relatorios.

---

## 4) A correção da tela de saque já está em produção?

**Não.**

O deployment de produção (ez1oc96t1) tem idade “1d” no snapshot de 06/03 01:03 UTC, portanto foi gerado antes de 06/03. O commit 258b0cd é de 06/03 14:45 -0300. O código em produção não contém `withdrawService` nem as alterações em Withdraw.jsx/config.api.js. A tela de saque em produção ainda usa createPix/getUserPix (endpoints de depósito). Deploy do commit recomendado é necessário para passar a usar POST /api/withdraw/request e GET /api/withdraw/history.

---

## 5) Fingerprint do frontend atual

- **/game:** status 200, server Vercel, bundle `/assets/index-qIGutT6K.js`, sha256 do HTML: `bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0`.
- **/dashboard:** idem.
- **Referência:** `docs/relatorios/frontend-player-deploy-safe-fingerprint.json`.

Usar esse fingerprint para comparar após deploy ou rollback (status, bundle e sha256).

---

## 6) Riscos de um deploy do frontend agora

| Risco | Nível | Mitigação |
|-------|--------|-----------|
| Regressão /game | Baixo | Correção não altera /game; validar /game após deploy. |
| Regressão login | Baixo | Nenhuma alteração em auth; validar login após deploy. |
| Current apontar para deployment errado | Médio | Deploy explícito do commit 8f51edc; preservar ez1oc96t1 para rollback. |
| Tela de saque continuar antiga (cache/deploy falho) | Médio | Validar em produção chamada a /api/withdraw/request; limpar cache se necessário. |
| Pipeline promover build indesejado | Baixo | Confirmar branch/commit do pipeline; não promover production sem validação. |

Detalhes em `frontend-player-deploy-safe-risks.json`.

---

## 7) Plano seguro de rollback

- **Deployment a preservar:** ez1oc96t1 (produção atual).
- **Ação de rollback:** No Vercel, promover novamente o deployment **ez1oc96t1** para Production.
- **Checks pós-deploy:** (1) / e /game e /dashboard 200; (2) login funcional; (3) /withdraw logado: submeter e confirmar POST /api/withdraw/request na rede.
- **Critério de rollback imediato:** /game ou /dashboard 5xx ou página em branco; login quebrado; erros críticos em console/rede. Em qualquer um desses casos, promover de volta ez1oc96t1.

Detalhes em `frontend-player-deploy-safe-rollback.json`.

---

## 8) Conclusão

- **GO** para deploy seguro do frontend player.
- **Recomendação:** Fazer deploy da branch `hotfix/financeiro-v1-stabilize` no commit **8f51edc** (ou 258b0cd). Executar os checks pós-deploy; em caso de problema, promover de volta o deployment **ez1oc96t1** para Production.

---

## Tabela final

| Item | Status | Risco | Recomendação |
|------|--------|--------|--------------|
| Correção da tela de saque em produção | Não | — | Deployar commit 8f51edc/258b0cd |
| Current (ez1oc96t1) estável | Sim | — | Preservar ID para rollback |
| Commit recomendado | 8f51edc | — | Deploy explícito desta ref |
| Regressão /game | N/A | Baixo | Validar /game após deploy |
| Regressão login | N/A | Baixo | Validar login após deploy |
| Rollback | Plano definido | — | Promover ez1oc96t1 se necessário |
| **GO / NO-GO** | **GO** | — | Deploy seguro com checks e rollback prontos |

---

*Auditoria READ-ONLY. Nenhum deploy nem alteração em produção foi executado. JSONs em docs/relatorios/frontend-player-deploy-safe-*.json.*
