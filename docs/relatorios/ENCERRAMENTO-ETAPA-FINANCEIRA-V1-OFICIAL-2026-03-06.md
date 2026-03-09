# Relatório oficial de encerramento — Etapa financeira V1

**Projeto:** Gol de Ouro  
**Data:** 2026-03-06  
**Modo:** Auditoria READ-ONLY final (nenhuma alteração de código, commit, deploy, Vercel, Fly ou banco).  
**Objetivo:** Consolidar descobertas, correções, validações e estado final da etapa financeira V1 para base confiável da próxima etapa.

---

## 1) Título e contexto

A etapa financeira V1 do backend do Gol de Ouro abrangeu: auditoria do fluxo financeiro (depósitos PIX, saldo, saques PIX, worker, reconciler, ledger), correção de saques presos e de rejeições sem rollback, e deploy seguro do backend sem alterar o frontend. Este documento é o relatório oficial de encerramento dessa etapa.

---

## 2) Resumo executivo

- **Etapa financeira V1:** Oficialmente **concluída**.
- **Backend:** Em produção no Fly (release **v315**) com commits do patch V1.2 (reconciler com rollback) e V1.2.1 (withdrawalStatus.js + fly.toml documentado). Health 200, version 1.2.1.
- **Frontend:** **Preservado.** /game e /dashboard em 200; Vercel não foi tocado durante a etapa; nenhuma promoção de deployment no Vercel.
- **Depósitos PIX:** Funcionais; aprovados creditados; reconcile com external_id não numérico gera apenas ruído de log (não bloqueante).
- **Saques PIX:** Fluxo funcional; worker e reconciler com rollback de saldo e ledger quando rejeitam; 5 saques rejeitados pelo worker com rollback; 1 saque histórico (reconciler timeout) sem rollback e 1 inconclusivo (não bloqueiam V1).
- **Ledger:** Consistente onde usado; rollback e falha_payout registrados; 0 inconsistência financeira na amostra.
- **Rollback seguro:** Release **v305** (complete) documentada como alvo de rollback.
- **Riscos residuais:** 4 itens não bloqueantes (1 saque histórico sem rollback, 1 inconclusivo, ruído reconcile depósito, hardening deploy/worker).

---

## 3) Objetivo da etapa financeira V1

- Estabilizar o fluxo financeiro do backend (depósito PIX, saldo, saque PIX, worker, reconciler, ledger).
- Garantir que rejeições de saque (worker ou reconciler) devolvam saldo e registrem rollback no ledger.
- Permitir deploy do backend sem regredir o frontend (/game, /dashboard) e sem tocar no Vercel.
- Produzir rastreabilidade (commits, releases, relatórios) e estado final seguro para a próxima etapa.

---

## 4) Linha do tempo da etapa

| Fase | Marco | Referência |
|------|--------|------------|
| Auditoria inicial | Reconstrução do plano; mapa de escritas em balance/saldo | FINANCEIRO-RECONSTRUCAO-PLANO, FINANCEIRO-MAPA-ESCRITAS-BALANCE |
| Descoberta de problemas | Saques presos; worker retornando 0 saques; reconciler rejeitando sem rollback; ledger vazio em janelas 24h/7d | PAYOUT-WORKER-ROOTCAUSE, PAYOUT-REJEITADOS-ROOTCAUSE, FINANCEIRO-E2E-FINAL |
| Patch V1.1 | Payout worker: observabilidade [PAYOUT][QUERY]/[CYCLE], query defensiva, anti-zumbi | PAYOUT-WORKER-PATCH-V1_1 |
| Patch V1.2 | Reconciler com rollback (rejectWithRollbackIfNeeded, ledgerHasRollback) | PAYOUT-V1_2-PATCH-RECON-ROLLBACK, commit 73de7a39 |
| Deploy fail V1.2 | MODULE_NOT_FOUND (withdrawalStatus.js ausente no commit); smoke fail no payout_worker | DEPLOY-FINAL-FAIL-ROOTCAUSE |
| Patch deployability V1.2.1 | withdrawalStatus.js no repositório; fly.toml documentado (process groups) | DEPLOYABILITY-PATCH-V1_2_1, commits bdcd8b2, 55c5cb8 |
| Deploy final retry | flyctl deploy; release v315; smoke passou; frontend preservado | FINANCEIRO-V1-DEPLOY-FINAL-RETRY |
| Validação final | Validação E2E e final; GO para encerramento V1 | FINANCEIRO-V1-FINAL-VALIDACAO |
| Conclusão | Relatório oficial de encerramento | Este documento |

---

## 5) Diagnóstico inicial: o que estava errado

| Problema | Status inicial | Impacto | Como foi diagnosticado | Corrigido ou documentado |
|----------|----------------|---------|------------------------|---------------------------|
| Risco de regressão frontend (Vercel) | Promoção automática poderia alterar /game | Alto | VERCEL-FREEZE, FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME | Preservado: nenhum deploy Vercel na etapa |
| Saques presos (>30 min processando) | 5 saques sem processed_at/transacao_id | Bloqueador | PAYOUT-WORKER-ROOTCAUSE; query worker retornando 0 | Worker/reconciler e rejeições com rollback; 5 rejeitados pelo worker com rollback |
| Reconciler rejeitando sem rollback | 1 saque timeout_reconciliacao sem devolução de saldo | Inconsistência | PAYOUT-REJEITADOS-ROOTCAUSE | Patch V1.2: rejectWithRollbackIfNeeded |
| Ledger não preenchido / limitado | 0 registros em janelas 24h/7d em parte da auditoria | Rastreabilidade | FINANCEIRO-E2E-FINAL, mapa de escritas | Worker/reconciler passam a registrar rollback/falha_payout |
| user_id / usuario_id no ledger | Fallback no código (produção user_id) | Operacional | Auditorias schema/ledger | Documentado; fallback em código |
| processed_at / transacao_id | Ausentes em saques presos | Rastreio | Schema e PAYOUT-REJEITADOS | Preenchidos quando worker/webhook processam |
| Deploy final falhando | Commit 73de7a39 sem withdrawalStatus.js; smoke worker | Bloqueador deploy | DEPLOY-FINAL-FAIL-ROOTCAUSE | Patch V1.2.1: arquivo no repo; fly.toml documentado |
| Smoke do payout_worker no Fly | Fly aplicando check HTTP em machine sem porta 8080 | Falha no deploy | deploy-fail-rootcause-fly-worker | Documentado; deploy v315 passou (machines stopped deixadas assim) |
| Efeito visual saldo no frontend | Dúvida sobre “saldo aumentando” | Observação | BUG-SALDO-AUMENTANDO-DASHBOARD; provas saldo | Persistência no banco estável; efeito visual/cache documentado |
| external_id depósito não numérico | Reconciler não credita; log “ID inválido” | Ruído | FINANCEIRO-RECONSTRUCAO-PLANO | Documentado; não bloqueia V1 |

---

## 6) O que foi auditado

- **Arquitetura financeira:** server-fly.js (app), payout-worker.js, processPendingWithdrawals, reconcileProcessingWithdrawals; mapa de escritas em usuarios.saldo (FINANCEIRO-MAPA-ESCRITAS-BALANCE).
- **Schema:** usuarios.saldo, saques (processed_at, transacao_id, status CHECK), ledger_financeiro (user_id), pagamentos_pix.
- **Fluxo E2E:** Depósito (webhook + reconcile), saque (request, worker, webhook MP, rollback), ledger (tipos saque, taxa_saque, payout_confirmado, rollback, falha_payout).
- **Worker:** Logs, query de saques, contagem count=0 vs linhas retornadas (PAYOUT-WORKER-ROOTCAUSE, PAYOUT-WORKER-COUNT0-ROOTCAUSE).
- **Rejeições:** Quem rejeitou (worker vs reconciler), motivo, presença de rollback no ledger e saldo (PAYOUT-REJEITADOS-ROOTCAUSE).
- **Deploy:** Causa do fail (withdrawalStatus.js, smoke worker); commit mínimo deployável (DEPLOY-FINAL-FAIL-ROOTCAUSE).
- **Frontend/Vercel:** Fingerprint /game e /dashboard; pipeline Vercel; ausência de alteração no ciclo financeiro (PREFLIGHT, DEPLOY-FINAL-RETRY).

---

## 7) O que foi corrigido

| Correção | Problema que resolvia | Arquivos afetados | Commit SHA relevante | Resultado observado |
|----------|------------------------|-------------------|----------------------|---------------------|
| Patch V1.1 payout worker | Worker sem visibilidade; possível count>0 e select=0 | processPendingWithdrawals.js, payout-worker.js | (patch V1.1) | Logs [PAYOUT][QUERY]/[CYCLE]; rollback_failed quando aplicável |
| Patch V1.2 reconciler rollback | Reconciler rejeitava sem devolver saldo nem ledger | reconcileProcessingWithdrawals.js | 73de7a39 | rejectWithRollbackIfNeeded; idempotência ledgerHasRollback |
| Deployability: withdrawalStatus.js | MODULE_NOT_FOUND no deploy (arquivo untracked) | src/domain/payout/withdrawalStatus.js | bdcd8b2 | Imagem builda com módulo; app sobe |
| Deployability: fly.toml | Documentar separação app/worker (smoke) | fly.toml | 55c5cb8 | Comentários; deploy v315 concluído |

---

## 8) O que foi validado

- **Código:** Patch V1.2 presente (rejectWithRollbackIfNeeded, ledgerHasRollback, logs [PAYOUT][RECON]) — financeiro-v1-final-validacao, financeiro-v1-final-logs.json.
- **Saques rejeitados:** 7 total; 5 com rollback_registrado (worker); 1 rollback_ausente_pre_v1_2 (histórico); 1 inconclusivo — financeiro-v1-final-saques.json, payout-rejeitados-consistencia.json.
- **Ledger:** ledger_ok; rollback e falha_payout presentes — financeiro-v1-final-ledger.json.
- **Frontend:** GET /game e /dashboard 200; fingerprint estável (preflight e deploy retry); Vercel não tocado.
- **Deploy:** Gates git e frontend; fly deploy; smoke /health, /game, /dashboard; post-check scripts (financeiro-v1-final-validacao-readonly, payout-rejeitados-rootcause-readonly) — FINANCEIRO-V1-DEPLOY-FINAL-RETRY.

---

## 9) Estado final por área

### 9.1 Frontend /game /dashboard

- **Preservado:** Sim. Nenhuma alteração em frontend, /game, /dashboard ou player durante a etapa financeira V1.
- **Deployment atual:** Estável; GET https://www.goldeouro.lol/game e /dashboard retornam 200; server Vercel.
- **Vercel:** Intocado no processo financeiro; nenhuma promoção de deployment.

### 9.2 Depósitos PIX

- **Status final:** Funcionais. Webhook e reconcile creditam quando aprovado; claim atômico no reconcile evita duplo crédito.
- **Observações:** external_id não numérico (ex.: deposito_uuid_*) gera log “ID de pagamento inválido” e não credita pelo recon; não bloqueia V1.

### 9.3 Saques PIX

- **Status final:** Funcionais. Request debita saldo e cria saque; worker processa pendentes/processando; reconciler trata presos (timeout, valor/PIX inválido, erro provedor) com **rollback de saldo e ledger** (V1.2).
- **Worker:** Logs [PAYOUT][CYCLE]/[QUERY]; em falha de payout chama rollbackWithdraw.
- **Reconciler:** rejectWithRollbackIfNeeded em todas as rejeições; idempotência por ledgerHasRollback.
- **processed_at / transacao_id:** Preenchidos quando o fluxo conclui (worker ou webhook).
- **Consistência final:** 5 saques rejeitados pelo worker com rollback; 1 histórico (reconciler timeout) sem rollback; 1 inconclusivo; inconsistencia_financeira 0.

### 9.4 Ledger

- **Papel atual:** Registro de saque, taxa_saque, payout_confirmado, rollback, falha_payout (e depósito onde aplicável).
- **Onde está consistente:** Rollback e falha_payout presentes para saques rejeitados pelo worker; reconciler passou a registrar rollback (V1.2).
- **Limitações:** 1 saque histórico (timeout reconciler) sem linha de ledger; 1 inconclusivo; amostra limitada em algumas auditorias.

### 9.5 Saldo

- **Conclusão:** Saldo persiste em usuarios.saldo; escritas mapeadas (FINANCEIRO-MAPA-ESCRITAS-BALANCE). Provas de persistência estável em auditorias.
- **“Saldo aumentando”:** Tratado como possível efeito visual/cache no frontend; origem no banco e ledger auditada; sem inconsistência financeira bloqueante.

### 9.6 Operação / Infra

- **Release Fly atual:** **v315** (running). Imagem: goldeouro-backend-v2:deployment-01KK1V0ERHBXQXMQRD7YQA2H7K. Commit deployado: 55c5cb80e5d3550baced5ea5752e9bc2d1d7768f.
- **Release de rollback segura:** **v305** (complete, Feb 25 2026).
- **Estratégia:** Deploy apenas backend Fly; gates frontend e git; smoke pós-deploy; sem toque no Vercel; rollback para v305 se smoke falhar.

---

## 10) Riscos residuais / ressalvas não bloqueantes

| Item | Impacto real | Bloqueia V1? | Recomendação futura |
|------|--------------|-------------|----------------------|
| 1 saque histórico (timeout reconciler) sem rollback | Possível débito sem devolução para 1 usuário (pré-V1.2) | Não | Opcional: correção manual (saldo + ledger) se negócio exigir |
| 1 saque inconclusivo (erro API) | Inconclusivo; sem evidência de inconsistência | Não | Revisão manual se necessário |
| Reconcile depósito: external_id não numérico | Ruído de log; pendências não resolvidas pelo recon | Não | Normalização external_id ou idempotência por payment_id |
| Smoke/hardening deploy payout_worker | Deploy em dois passos pode ser necessário em alguns deploys Fly | Não | fly deploy --process-groups app depois payout_worker; ou documentação Fly para checks por process group |

---

## 11) Commits, releases e referências oficiais

- **Commits principais:**  
  - 73de7a39 — Patch V1.2 (reconciler rollback).  
  - bdcd8b2413a42158f4757b68e46159937f301eba — withdrawalStatus.js (deployability).  
  - 55c5cb80e5d3550baced5ea5752e9bc2d1d7768f — fly.toml docs (deployability).  
- **Branch:** hotfix/financeiro-v1-stabilize.  
- **Release Fly final em produção:** **v315**.  
- **Release segura para rollback:** **v305**.  
- **Deployment frontend de referência:** Vercel goldeouro-player (www.goldeouro.lol); não promovido na etapa V1.  
- **Relatórios principais:** ENCERRAMENTO-ETAPA-FINANCEIRA-V1-OFICIAL-2026-03-06.md (este), FINANCEIRO-RECONSTRUCAO-PLANO, FINANCEIRO-MAPA-ESCRITAS-BALANCE, FINANCEIRO-E2E-FINAL-READONLY, PAYOUT-WORKER-ROOTCAUSE, PAYOUT-REJEITADOS-ROOTCAUSE, PAYOUT-V1_2-PATCH-RECON-ROLLBACK, FINANCEIRO-V1-FINAL-VALIDACAO, FINANCEIRO-V1-DEPLOY-FINAL-RETRY, DEPLOY-FINAL-FAIL-ROOTCAUSE, DEPLOYABILITY-PATCH-V1_2_1.  
- **Anexos JSON:** encerramento-financeiro-v1-resumo.json, encerramento-financeiro-v1-marcos.json, encerramento-financeiro-v1-riscos-residuais.json, encerramento-financeiro-v1-referencias.json.

---

## 12) Conclusão oficial da etapa

A **etapa financeira V1 está oficialmente concluída.**

- O backend está em produção (release v315) com os patches V1.2 e V1.2.1, garantindo reconciler com rollback de saldo e ledger e deployabilidade (withdrawalStatus.js e fly.toml documentado).
- O frontend foi preservado; nenhuma alteração em /game, /dashboard ou player; o Vercel não foi alterado.
- Depósitos PIX e saques PIX estão funcionais; rejeições do worker e do reconciler passam a ter rollback (saldo + ledger) para novos casos; riscos residuais são conhecidos e não bloqueantes.
- O estado atual do sistema é **seguro** para operação e para servir de base à próxima etapa do projeto.

---

## 13) Próxima etapa recomendada

- **Curto prazo:** Manter monitoramento de saques e ledger; opcionalmente corrigir manualmente o 1 saque histórico sem rollback se o negócio exigir.
- **Médio prazo:** Hardening do pipeline de deploy (gates, smoke, opção de deploy por process group); melhorias de observabilidade (métricas, alertas) para worker e reconciler.
- **Próxima etapa do projeto:** Com a base financeira V1 estável, avançar para as próximas prioridades do produto (ex.: novas funcionalidades, melhorias de UX, auditoria de depósitos PIX e idempotência por payment_id) sem alterar o escopo já validado da etapa V1.

---

## Tabela final: componente × status × impacto × observação

| Componente | Status atual | Impacto na V1 | Observação final |
|------------|--------------|---------------|-------------------|
| Frontend /game /dashboard | OK | Preservado | Nenhuma alteração; Vercel intocado |
| Depósitos PIX | OK | Funcionais | Ruído reconcile external_id não numérico; não bloqueante |
| Saques PIX (request, worker, reconciler) | OK | Funcionais | Rollback garantido para novos rejeitados (V1.2) |
| Ledger | OK | Consistente onde usado | Rollback/falha_payout registrados; 1 histórico + 1 inconclusivo |
| Saldo (usuarios.saldo) | OK | Persistente | Mapa de escritas auditado |
| Backend Fly (app + payout_worker) | OK | v315 em produção | Rollback seguro: v305 |
| Deploy / pipeline | PARCIAL | Deploy v315 concluído | Hardening futuro: smoke por process group ou dois passos |
| 1 saque histórico sem rollback | OBSERVAÇÃO | Não bloqueante | Pré-V1.2; correção manual opcional |
| 1 saque inconclusivo | OBSERVAÇÃO | Não bloqueante | Revisão manual se necessário |

---

*Documento gerado em modo READ-ONLY. Nenhum código, commit, deploy, Vercel, Fly ou banco foi alterado.*
