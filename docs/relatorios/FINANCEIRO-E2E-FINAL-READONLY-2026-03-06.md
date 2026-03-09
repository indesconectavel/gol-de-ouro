# Relatório Master Final — Validação E2E Financeiro (READ-ONLY)

**Data:** 2026-03-06  
**Modo:** Somente leitura absoluto (nenhuma alteração de código, commit, push, merge, deploy, Vercel, Fly, Supabase, envs ou workflows).  
**Objetivo:** Varredura final e profunda do sistema financeiro como pacote completo; validar fluxo real ponta a ponta sem alterar nada; gerar relatório final com estado real e decisão GO/NO-GO.

---

## 1) Resumo executivo

- **Frontend (Vercel):** Servido em https://www.goldeouro.lol (server: Vercel). Fingerprint atual: status 200 em /game e /dashboard; SHA256 HTML `bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0`; bundle principal `index-qIGutT6K.js`. Conforme relatório anterior (FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06), deployment de produção atual do projeto **goldeouro-player** é **ez1oc96t1**; FyKKeg6zb não aparece na lista de prod. Esta auditoria **não executa nenhuma ação no Vercel**; qualquer deploy backend futuro deve preservar o frontend atual.
- **Backend (Fly):** App **goldeouro-backend-v2** em execução; 3 máquinas (2 app: 1 started, 1 stopped; 1 payout_worker started); releases v306–v312 **failed**; último **complete** v305 (Feb 25 2026). Máquinas rodando imagem v312.
- **Schema:** Coluna oficial de saldo: **saldo** (usuarios). Ledger: coluna usuário **user_id** (ledger_financeiro com 0 registros nas janelas 24h/7d/30d, logo amostra vazia). Saques: **processed_at** e **transacao_id** presentes. CHECK/UNIQUE documentados no schema SQL; não verificados via API REST.
- **Depósitos PIX:** Funcionam; 23 approved, 40 pending, 258 expired; 1 duplicidade por external_id (count 2); 264 external_id não numérico (ruído conhecido, reconcile “ID inválido”). Não bloqueia V1.
- **Saques:** **Parcialmente funcionais / bloqueados.** 5 saques em “processando” há mais de 30 min; 7 com processed_at null; 9 com transacao_id null. Worker reporta `payouts_falha: 5` e “Nenhum saque processado neste ciclo”. Causa: falha no fluxo de payout (Mercado Pago ou atualização de status). Patch V1 local (se existir) deve cobrir atualização de status/ledger.
- **Ledger:** **Não está sendo usado** nas janelas 24h/7d/30d (0 registros). Tabela existe; coluna user_id detectada. Não bloqueia V1 para depósito/saldo; bloqueia rastreabilidade de saques se o worker escrever no ledger.
- **Saldo:** Persiste no banco (usuarios.saldo). Prova anterior (supabase_polling) mostrou valor estável. Sem BEARER não foi reexecutada prova T0/T+10/T+40 nesta sessão.
- **Recomendação final:** **NO-GO** para deploy do backend financeiro até: (1) corrigir causa dos saques presos e do worker (payouts_falha); (2) opcionalmente garantir que o ledger seja preenchido no fluxo de saque; (3) último release Fly complete (v305) vs máquinas em v312 (releases falhando).

---

## 2) Estado do frontend atual (Vercel current funcional)

| Item | Valor |
|------|--------|
| Projeto | goldeouro-player |
| Domínio | https://www.goldeouro.lol (e app.goldeouro.lol) |
| Deployment de produção atual | **ez1oc96t1** (conforme relatório FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06) |
| FyKKeg6zb / m38czzm4q | Não aparece na lista de deployments de produção; domínio não aponta para FyKKeg6zb |
| Conclusão | Frontend atual está servindo; esta auditoria **não** executa nenhuma ação no Vercel; qualquer deploy backend futuro deve preservar esse frontend |

---

## 3) Estado do backend atual (Fly)

| Item | Valor |
|------|--------|
| App | goldeouro-backend-v2 |
| Hostname | goldeouro-backend-v2.fly.dev |
| Processos | **app** (2 máquinas: 1 started, 1 stopped), **payout_worker** (1 started) |
| Imagem | goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM |
| Release atual (máquinas) | v312 |
| Último release **complete** | v305 (Feb 25 2026) |
| Releases v306–v312 | **failed** |
| Observações | 1 app stopped; novos deploys estão falhando |

---

## 4) Estado real do schema

| Tabela | Coluna saldo/balance | processed_at | transacao_id | Ledger user |
|--------|-----------------------|--------------|--------------|-------------|
| usuarios | **saldo** (presente) | — | — | — |
| saques | — | **sim** | **sim** | — |
| pagamentos_pix | — | — | — | — |
| ledger_financeiro | — | — | — | **user_id** (amostra vazia) |
| transacoes | — | sim | não (referencia_id) | — |

- **CHECK status saques:** documentado no schema SQL (pendente, processando, concluido, etc.).
- **UNIQUE pagamentos_pix:** não verificado via API REST.

---

## 5) Fluxo financeiro mapeado

| Etapa | Componente | Estado |
|-------|------------|--------|
| **Depósito** | Webhook MP → pagamentos_pix → saldo usuario | OK (approved 23; reconcile com external_id não numérico é ruído conhecido) |
| **Saldo** | usuarios.saldo | Persiste no banco; prova anterior estável |
| **Prêmio** | (jogo → crédito) | Fora do escopo desta varredura read-only |
| **Saque** | Request → saques → worker → MP payout → processed_at/transacao_id | **Bloqueado/parcial:** 5 presos >30 min; worker com payouts_falha |
| **Ledger** | ledger_financeiro | 0 registros em 24h/7d/30d — **não está sendo usado** |
| **Worker** | payout_worker (Fly) | Roda; log: payouts_sucesso: 0, payouts_falha: 5; “Nenhum saque processado neste ciclo” |
| **Webhook** | /api/payments/webhook, /webhooks/mercadopago | OPTIONS 204; endpoints existem |
| **Reconcile** | (cron/automático) | Emite “ID inválido” para external_id não numérico (ruído; não bloqueia V1) |

---

## 6) O que está CORRETO

- Health e monitoring: GET /health, /api/monitoring/health retornam 200.
- Endpoints financeiros GET/OPTIONS: existem e respondem (401 onde exige auth; OPTIONS 204 para withdraw, webhook, mercadopago).
- Schema: coluna **saldo** em usuarios; **processed_at** e **transacao_id** em saques; ledger com coluna **user_id**.
- Depósitos PIX: aprovados existem (23); fluxo de aprovação funciona; duplicidade por payment_id: 0; duplicidade por external_id: 1 caso (2 registros).
- Frontend: /game e /dashboard retornam 200 (Vercel); fingerprint estável.
- Saldo: persistido no banco (evidência em prova anterior).
- Fly: app e payout_worker estão em execução (1 app stopped é escala configurada).

---

## 7) O que está ERRADO

- **Saques presos:** 5 saques em status “processando” há mais de 30 minutos, sem processed_at nem transacao_id.
- **Worker de payout:** Logs mostram `payouts_falha: 5` e “Nenhum saque processado neste ciclo” — worker não está concluindo saques.
- **Releases Fly:** v306–v312 falharam; apenas v305 complete; máquinas rodando v312 (imagem de um release falho).
- **Ledger vazio:** 0 registros em 24h, 7d e 30d — fluxo de saque não está escrevendo no ledger (ou tabela não utilizada no código atual).

---

## 8) O que ainda está INCONCLUSIVO

- Prova de saldo T0/T+10/T+40 com GET /api/user/profile não foi reexecutada (sem BEARER nesta auditoria).
- Causa exata dos saques presos (MP indisponível, erro de integração, CHECK/violates no banco, ou outro) — logs não mostram [LEDGER], insert_falhou, updateSaqueStatus indisponível, CHECK, violates, “Erro ao registrar saque” nas últimas 100 linhas; apenas PAYOUT_WORKER e payouts_falha.
- Se o patch V1 feito localmente cobre ou não a causa dos saques presos (depende do código do patch não alterado aqui).

---

## 9) O que falta para a V1 funcional

1. **Corrigir o fluxo de saque** para que os 5 (e futuros) saques “processando” sejam concluídos ou rejeitados e tenham processed_at/transacao_id.
2. **Identificar e corrigir a causa de payouts_falha** no worker (integração MP, status, ledger ou banco).
3. (Opcional) Garantir que o ledger_financeiro seja preenchido no fluxo de saque para auditoria.
4. (Recomendado) Ter um novo release Fly **complete** antes de considerar deploy estável (atualmente releases falham).

---

## 10) O que bloqueia deploy agora

1. **Saques presos e worker com payouts_falha** — risco de novos saques ficarem presos e impacto em confiança do usuário.
2. **Releases Fly falhando (v306–v312)** — deploy atual não está “verde”; máquinas em v312 (imagem de release failed).
3. (Recomendação) Não promover novo deploy do backend até: (a) patch que resolva saques presos e worker; (b) novo release complete no Fly.

---

## 11) Recomendação final

- **GO / NO-GO para deploy do backend financeiro:** **NO-GO**
- **Motivo:** Saques presos (5), worker reportando payouts_falha, releases Fly falhando. V1 do financeiro **não** está pronta para deploy até correção do fluxo de saque e, preferencialmente, um release complete no Fly.

---

## 12) Checklist objetivo para próximo passo

- [ ] Corrigir causa de payouts_falha no payout_worker (logs + código).
- [ ] Garantir que saques “processando” sejam atualizados (processed_at, transacao_id) ou rejeitados.
- [ ] (Opcional) Inserir registros no ledger_financeiro no fluxo de saque.
- [ ] Obter um release Fly **complete** após as correções.
- [ ] Reexecutar esta varredura read-only (ou equivalente) após o patch e antes de qualquer deploy.

---

## 13) Anexos gerados

| Anexo | Descrição |
|-------|-----------|
| `final-fly-snapshot.json` | Status, machines, scale, releases Fly |
| `final-vercel-snapshot.json` | *(Não gerado nesta sessão; estado Vercel documentado no relatório e em FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06)* |
| `final-finance-endpoints.json` | GET/OPTIONS dos endpoints financeiros |
| `final-schema-check.json` | Colunas, saldo, ledger, processed_at, transacao_id |
| `final-depositos-check.json` | Contagem por status, duplicidades, external_id não numérico |
| `final-saques-check.json` | Total por status, presos >30 min, processed_at/transacao_id null, últimos 20 |
| `final-ledger-check.json` | Ledger 24h, 7d, 30d (0 registros) |
| `final-saldo-check.json` | Conclusão saldo; prova T0/T+10/T+40 não reexecutada (sem BEARER) |
| `final-worker-logs-check.json` | Contagens PAYOUT_WORKER, payouts_falha, exemplares |
| `final-game-fingerprint.json` | Status, headers, SHA256 HTML /game e /dashboard |

---

## Tabela final (Item × Status × Impacto V1 × Ação recomendada)

| Item | Status | Impacto na V1 | Ação recomendada |
|------|--------|----------------|------------------|
| Frontend (Vercel) | OK | Nenhum | Manter; não alterar nesta auditoria |
| Backend Fly (app + worker) | ERRO | Alto | Corrigir worker e releases antes de deploy |
| Schema (saldo, processed_at, transacao_id, ledger) | OK | Nenhum | — |
| Depósitos PIX | OK | Nenhum | — |
| Saques (fluxo completo) | ERRO | Bloqueador | Corrigir payout e atualização de status |
| Ledger em uso | INCONCLUSIVO | Médio (auditoria) | Opcional: preencher no fluxo de saque |
| Saldo persistência | OK | Nenhum | Prova com BEARER opcional depois |
| Endpoints GET/OPTIONS | OK | Nenhum | — |
| Worker logs (payouts_falha) | ERRO | Bloqueador | Diagnosticar e corrigir causa |
| Releases Fly (v306–v312 failed) | ERRO | Alto | Garantir novo release complete antes de deploy |

---

*Fim do relatório. Auditoria 100% read-only; nenhum código, deploy, Vercel ou Fly alterado.*
