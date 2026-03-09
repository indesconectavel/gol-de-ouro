# Auditoria final mestre — Sistema financeiro V1 (READ-ONLY)

**Data:** 2026-03-06  
**Tipo:** Auditoria READ-ONLY absoluta (backend, frontend, pagamentos, operações).  
**Objetivo:** Consolidar o estado real do sistema financeiro V1 e responder, com evidência: o que está correto, o que falta corrigir/publicar, o que está validado no backend e no frontend, o que ainda não está em produção, e se o sistema está PRONTO, PRONTO COM RESSALVAS ou NÃO PRONTO.

**Regras:** Nenhuma alteração de código, commit, push, deploy, Vercel, Fly, banco ou pipeline. Nenhum segredo impresso.

---

## 1) Resumo executivo

O **backend financeiro V1** está **correto, validado e em produção** (Fly release v315): depósitos PIX, saques PIX (POST/GET withdraw/request e history), worker, reconciler com rollback, ledger e saldo. O **frontend no repositório** está **correto**: tela de saque usa `withdrawService` (POST /api/withdraw/request, GET /api/withdraw/history), tela de depósito usa endpoints PIX e foi simplificada (remoção de "Verificar Status"). A **ressalva** é o **estado do frontend em produção**: a baseline oficial FyKKeg6zb (bundle index-qIGutT6K.js) e outros deployments (ex.: ez1oc96t1 com index-DVt6EjKW.js) **não** contêm as correções de saque nem a simplificação do depósito; o bundle que as contém (index-CHnRaMxK.js) foi documentado como publicado após merge (FRONTEND-PLAYER-POSTMERGE-VERIFICACAO-2026-03-06), mas o deployment/cache atual pode variar. Portanto, o sistema financeiro V1 é classificado como **PRONTO COM RESSALVAS**: concluído no backend e no código do frontend; falta **confirmar** (e, se necessário, garantir) que o frontend em produção está servindo o bundle com saque correto e depósito simplificado.

---

## 2) Estado do backend financeiro

| Componente | Está correto? | Validado? | Em produção? | Observação |
|------------|----------------|------------|--------------|-------------|
| Depósitos PIX | Sim | Sim | Sim | POST /api/payments/pix/criar, webhook, reconcile, claim atômico |
| Saques PIX | Sim | Sim | Sim | POST /api/withdraw/request, GET /api/withdraw/history, débito saldo, ledger |
| Worker | Sim | Sim | Sim | processPendingWithdrawals, createPixWithdraw, rollbackWithdraw |
| Reconciler | Sim | Sim | Sim | reconcilePendingPayments (depósito); reconcileProcessingWithdrawals (saques); rejectWithRollbackIfNeeded (V1.2) |
| Rollback | Sim | Sim | Sim | rollbackWithdraw; ledgerHasRollback; release v305 documentada como rollback seguro |
| Ledger | Sim | Sim | Sim | createLedgerEntry (user_id/usuario_id); tipos withdraw_request, rollback, falha_payout |
| Saldo | Sim | Sim | Sim | usuarios.saldo; crédito/débito e rollback consistentes |

**Release Fly:** v315 (ENCERRAMENTO-ETAPA-FINANCEIRA-V1-OFICIAL-2026-03-06). Riscos residuais: 1 saque histórico sem rollback, 1 inconclusivo; não bloqueantes.

Registro: `docs/relatorios/financeiro-v1-auditoria-final-backend.json`.

---

## 3) Estado do frontend financeiro

| Item | Correto no código? | Correto em produção? | Observação |
|------|---------------------|----------------------|------------|
| Tela de depósito | Sim | Depende do bundle | Pagamentos.jsx: createPix, GET /api/payments/pix/usuario; simplificação (sem "Verificar Status") em 8c020af |
| Tela de saque | Sim | Depende do bundle | Withdraw.jsx: requestWithdraw, getWithdrawHistory; POST /api/withdraw/request, GET /api/withdraw/history |
| Histórico (saque/depósito) | Sim | Depende do bundle | getWithdrawHistory; GET /api/payments/pix/usuario |
| Saldo visível | Sim | Sim (backend) | Profile, Withdraw, Dashboard via GET /api/user/profile (data.data.saldo) |
| Integração endpoints | Sim | Depende do bundle | api.js: WITHDRAW_REQUEST, WITHDRAW_HISTORY; withdrawService.js presente no repo |

**O que ainda pode faltar publicar:** Se produção estiver servindo bundle antigo (index-qIGutT6K.js ou index-DVt6EjKW.js), a tela de saque chama createPix (errado) e o depósito tem "Verificar Status". O bundle com correções é index-CHnRaMxK.js (documentado pós-merge). É necessário que o deployment em produção sirva esse bundle para o frontend financeiro estar "correto em produção".

Registro: `docs/relatorios/financeiro-v1-auditoria-final-frontend.json`.

---

## 4) Estado da produção

| Aspecto | Situação |
|---------|----------|
| **Baseline oficial FyKKeg6zb** | Bundle index-qIGutT6K.js; **não** contém /api/withdraw/request; saque incorreto (createPix); depósito com "Verificar Status". |
| **Frontend atual em produção** | Pode ser qIGutT6K (em algumas verificações), CHnRaMxK (pós-merge) ou outro; documentação indica deployment ez1oc96t1 em listagens e, em comparação, bundle DVt6EjKW sem withdraw/request. |
| **Bundle com financeiro V1 correto** | index-CHnRaMxK.js (withdraw/request, withdraw/history, depósito simplificado) — documentado em FRONTEND-PLAYER-POSTMERGE-VERIFICACAO-2026-03-06. |
| **Backend produção** | goldeouro-backend-v2.fly.dev, release v315; depósitos e saques funcionais; worker e reconciler com rollback. |
| **Estado financeiro visível ao usuário** | Se bundle antigo: saque errado (createPix), depósito com "Verificar Status". Se bundle CHnRaMxK: saque correto, depósito simplificado. |

Registro: `docs/relatorios/financeiro-v1-auditoria-final-producao.json`.

---

## 5) Gap final

| ID | Item | Classificação | Impacto |
|----|------|----------------|---------|
| F1 | Confirmar/garantir que o frontend em produção serve o bundle com saque correto e depósito simplificado | **Bloqueante** (para "V1 concluído em produção") | Sem isso, usuário pode estar usando saque errado |
| F2 | Promover deployment com bundle CHnRaMxK se o current não o for | Bloqueante se F1 não atendido | Dependente de F1 |
| B1 | 1 saque histórico (timeout reconciler) sem rollback | Não bloqueante | Documentado; correção manual opcional |
| B2 | 1 saque inconclusivo | Não bloqueante | Revisão manual se necessário |
| O1 | Reconcile depósito: external_id não numérico (ruído de log) | Apenas operacional | Não bloqueia V1 |
| O2 | Validar em produção (browser) que /withdraw chama POST /api/withdraw/request | Apenas operacional/demo | Confirmação final para demo |

Registro: `docs/relatorios/financeiro-v1-auditoria-final-gap.json`.

---

## 6) Riscos residuais

- **Frontend:** Se o deployment atual não for o que contém withdraw/request, o fluxo de saque em produção continua incorreto (createPix) até promover o deployment correto.
- **Backend:** 1 saque histórico sem rollback e 1 inconclusivo (ENCERRAMENTO); não bloqueantes para operação V1.
- **Cache/CDN:** Diferentes usuários ou momentos podem receber bundles diferentes; validação em produção deve ser feita com cache limpo ou em aba anônima.

---

## 7) Decisão final

**Classificação do sistema financeiro V1:** **PRONTO COM RESSALVAS.**

- **O que falta para concluir:** Confirmar que o deployment de produção do player (Vercel) serve o bundle com saque correto (POST /api/withdraw/request, GET /api/withdraw/history) e depósito simplificado. Se não servir, promover o deployment correspondente (ex.: o que gera index-CHnRaMxK.js) sem regredir /game.
- **Menor próxima ação:** Verificar em https://www.goldeouro.lol (DevTools → Network) se, ao solicitar saque em /withdraw, a requisição é POST para /api/withdraw/request. Se for POST para /api/payments/pix/criar, promover deployment com o bundle correto para produção.
- **Dá para concluir sem tocar no /game?** **Sim.** Nenhuma alteração em /game é necessária; a conclusão depende apenas de garantir que o frontend em produção usa os endpoints corretos de saque e a tela de depósito simplificada.

Registro: `docs/relatorios/financeiro-v1-auditoria-final-decisao.json`.

---

## 8) Próxima ação mínima recomendada

1. **Verificar em produção:** Abrir https://www.goldeouro.lol/withdraw (logado), abrir DevTools → Network, solicitar um saque e confirmar se a requisição é **POST** para **/api/withdraw/request** (e não para /api/payments/pix/criar).
2. **Se estiver correto:** Considerar V1 concluído em produção; documentar o deployment current como referência.
3. **Se estiver errado:** No Vercel (projeto goldeouro-player), localizar o deployment que contém o bundle index-CHnRaMxK.js (ou o build do merge que inclui withdrawService e depósito simplificado) e **Promote to Production**, garantindo que /game e /dashboard permaneçam estáveis (comparar com baseline FyKKeg6zb conforme procedimento de comparação já documentado).

---

## Arquivos gerados (caminhos exatos)

| Arquivo | Descrição |
|---------|-----------|
| `docs/relatorios/FINANCEIRO-V1-AUDITORIA-FINAL-MESTRE-2026-03-06.md` | Este relatório |
| `docs/relatorios/financeiro-v1-auditoria-final-backend.json` | Estado do backend financeiro |
| `docs/relatorios/financeiro-v1-auditoria-final-frontend.json` | Estado do frontend financeiro |
| `docs/relatorios/financeiro-v1-auditoria-final-producao.json` | Estado da produção e baseline |
| `docs/relatorios/financeiro-v1-auditoria-final-gap.json` | Gap final (itens bloqueantes e não bloqueantes) |
| `docs/relatorios/financeiro-v1-auditoria-final-decisao.json` | Decisão final e próxima ação |

---

## SAÍDA FINAL

- **PRONTO / PRONTO COM RESSALVAS / NÃO PRONTO:** **PRONTO COM RESSALVAS**
- **Principal gap remanescente:** Confirmar (e, se necessário, garantir) que o frontend em produção está servindo o bundle com saque correto (POST /api/withdraw/request, GET /api/withdraw/history) e depósito simplificado. Se produção estiver com bundle antigo, promover o deployment que contém index-CHnRaMxK.js.
- **Próxima ação mínima recomendada:** Verificar em www.goldeouro.lol (DevTools → Network) se a tela de saque envia POST para /api/withdraw/request. Se não, promover no Vercel o deployment com o bundle correto.
- **Caminhos dos arquivos gerados:** listados na tabela acima.
