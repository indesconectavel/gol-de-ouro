# Auditoria Total Financeiro — READ-ONLY (Master)

**Data:** 2026-03-05  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo de lógica alterado; nenhum commit/push/deploy; nenhum POST/PUT/PATCH/DELETE em produção).  
**Objetivo:** Fonte da verdade do que está pronto, quebrado e do que falta para V1.

---

## 1. Resumo executivo (não técnico)

- **Produção Fly:** App `goldeouro-backend-v2` está no ar com 1 máquina **app** ativa, 1 **app** stopped e 1 **payout_worker** ativo. Últimas releases (v312–v306) constam como *failed*; v305 (Feb 25) *complete*. Health e endpoints GET públicos respondem 200.
- **Depósitos PIX:** Fluxo criar/consultar/histórico existe; webhook e reconciler ativos. Em produção: 23 approved, 40 pending, 258 expired. Há **1 duplicidade por external_id** (2 registros mesmo external_id); **nenhuma duplicidade por payment_id** em approved. 264 registros com external_id não numérico (ex.: UUID), compatível com formato antigo.
- **Saques PIX:** Endpoints GET history e POST request existem; worker de payout ativo. **5 saques presos em "processando"** há mais de 30 min (todos do mesmo usuário mascarado). Worker reporta `payouts_falha: 5` e "Nenhum saque processado neste ciclo". Status na tabela alinhados ao CHECK (pendente|processando|concluido|rejeitado|cancelado).
- **Saldo:** Prova "saldo aumentando" (persistido vs visual) ficou **INCONCLUSIVA** nesta execução: BEARER e PROVA_USER_ID não foram definidos; é necessário definir BEARER (JWT) e/ou PROVA_USER_ID e reexecutar o script de prova para concluir.
- **Ledger:** Tabela existe; em produção o script de ledger falhou por **coluna de usuário**: erro `ledger_financeiro.usuario_id does not exist` — código usa `user_id` com fallback `usuario_id` (processPendingWithdrawals). Ou a tabela está vazia (amostra sem linha) ou só tem `user_id`. Idempotência/correlation_id documentada no código.
- **Riscos e gates:** Documentados abaixo; **não foram executados** backup/rollback/canário.

---

## 2. Estado de produção (Fly + entrypoint + worker)

| Item | Fonte | Resultado |
|------|--------|-----------|
| **Entrypoint app** | package.json `"start": "node server-fly.js"` | CONFIRMADO |
| **Entrypoint Docker** | Dockerfile `CMD ["node", "server-fly.js"]` | CONFIRMADO |
| **Process groups** | fly.toml: `app = "npm start"`, `payout_worker = "node src/workers/payout-worker.js"` | CONFIRMADO |
| **Machines** | auditoria-fly-snapshot-2026-03-05.json | 3 machines: 1 app started, 1 app **stopped**, 1 payout_worker started |
| **Scale** | scale show | app: 2, payout_worker: 1 (gru) |
| **Releases** | releases | Últimas 10: v312–v304; v312–v306 failed; v305 complete (Feb 25) |
| **Observação** | Snapshot | "1 app stopped ou máquina stopped" |

---

## 3. Mapa do dinheiro (onde se escreve saldo/saques/ledger)

Inventário gerado por `scripts/audit-map-escritas-financeiro-readonly.js` (regex em .js):

- **usuarios (saldo):** 166 ocorrências (inclui backups/obsoletos). Principais: server-fly.js (reconciler, saque, webhook), paymentController.js (webhook, depósito), processPendingWithdrawals.js (rollback saldo), auth (registro), gameController (prêmio).
- **pagamentos_pix:** 32 escritas (insert/update) — paymentController, server-fly (webhook, reconcile).
- **saques:** 26 — server-fly.js, processPendingWithdrawals.js, paymentController.js, payout-worker.
- **ledger_financeiro:** 8 — processPendingWithdrawals.js (insert débito saque; fallback user_id/usuario_id).
- **transacoes:** 10 — paymentController (inserção em depósito/saque), gameController.

Tipos inferidos: depósito, saque, webhook, reconcile, worker, rollback, premio, registro.  
Arquivo principal de escritas financeiras: `server-fly.js`, `controllers/paymentController.js`, `src/domain/payout/processPendingWithdrawals.js`, `src/workers/payout-worker.js`.

---

## 4. Schema real (SSOT) e divergências

Fonte: `auditoria-schema-prod-2026-03-05.json` (amostra de 1 linha por tabela; sem information_schema).

| Tabela | Colunas (amostra) | usuarios.saldo | users.balance | Observação |
|--------|-------------------|----------------|---------------|------------|
| **usuarios** | id, email, senha_hash, **saldo**, tipo, ativo, created_at, updated_at, ... | SIM | N/A | balance não existe em usuarios |
| **saques** | id, usuario_id, status, valor, amount, processed_at, transacao_id, motivo_rejeicao, ... | — | — | Status alinhado ao CHECK (withdrawalStatus.js) |
| **pagamentos_pix** | id, usuario_id, payment_id, external_id, status, valor, amount, ... | — | — | external_id/payment_id: ver idempotência no código |
| **ledger_financeiro** | (amostra vazia) | — | — | Coluna usuário: código usa **user_id** com fallback **usuario_id**; em prod erro "usuario_id does not exist" → provável user_id apenas |
| **transacoes** | id, usuario_id, tipo, valor, referencia, ... | — | — | OK |

Divergência conhecida: **ledger_financeiro** no código tem fallback user_id/usuario_id; no banco real a coluna exposta é **user_id**. Tabela pode estar vazia (sem linha para amostra).

---

## 5. Auditoria de endpoints do financeiro

Base: `auditoria-endpoints-financeiro-2026-03-05.json`. Base URL: https://goldeouro-backend-v2.fly.dev. **BEARER não foi usado** (auth_used: false).

| Endpoint | Método | Status | Tempo (ms) | read_only_safe |
|----------|--------|--------|------------|----------------|
| /health | GET | 200 | 490 | sim |
| /api/monitoring/health | GET | 200 | 109 | sim |
| /api/user/profile | GET | 401 | 32 | sim (com auth) |
| /api/withdraw/history | GET | 401 | 31 | sim (com auth) |
| /api/payments/pix/usuario | GET | 401 | 31 | sim (com auth) |
| /api/withdraw/request | OPTIONS | 204 | 30 | sim |
| /api/payments/pix/criar | OPTIONS | 204 | 30 | sim |
| /api/payments/webhook | OPTIONS | 204 | 29 | sim |
| /api/metrics | GET | 200 | 129 | sim |
| / | GET | 200 | 34 | sim |

Conclusão: Rotas existem; GETs que exigem auth retornam 401 sem token (esperado). Nenhum POST foi chamado.

---

## 6. Depósitos PIX: status, idempotência, reconcile

- **Contagem por status (prova-depositos-pix-readonly-2026-03-05.json):** expired 258, pending 40, approved 23.
- **Duplicidade external_id:** 1 caso com 2 registros (external_id mascarado ***9212).
- **Duplicidade payment_id:** Nenhuma.
- **external_id não numérico:** 264 registros (formato string/UUID); amostra em maioria status expired (nov/2025).
- **Reconcile (ruído):** Log Fly mostra `[RECON] ID de pagamento inválido (não é número): deposito_<uuid>_<ts>` — reconcile espera ID numérico do MP; external_id no formato deposito_uuid_ts gera ruído esperado (não quebra aprovação de PIX numérico).

---

## 7. Saques PIX: estado atual, worker, webhook, reconciler

- **Por status:** processando 5, rejeitado 2, cancelado 2.
- **Presos em "processando" > 30 min:** 5 (todos listados na amostra; mesmo usuario_id mascarado).
- **Worker (fly logs):** `[PAYOUT][WORKER] Resumo { payouts_sucesso: 0, payouts_falha: 5 }` e "Nenhum saque processado neste ciclo". Padrões "updateSaqueStatus indisponível", "Erro ao registrar saque", "[LEDGER] insert falhou" = 0 nas últimas linhas.
- **Status vs CHECK:** Permitidos: pendente, processando, concluido, rejeitado, cancelado. Encontrados: processando, rejeitado, cancelado — nenhuma violação.
- **Conclusão:** 5 saques presos; worker não está conseguindo concluir (causa raiz fora do escopo read-only: token MP payout, ledger insert, ou outro).

---

## 8. Saldo aumentando: prova persistido vs visual

- **Script:** prova-saldo-persistencia-readonly.js.
- **Execução:** BEARER não definido; PROVA_USER_ID não definido. Modo Supabase polling não executado (exige PROVA_USER_ID).
- **Resultado:** **INCONCLUSIVO.** Para concluir: (1) definir BEARER (JWT de login) e rodar script (T0, T+10s, T+40s em GET /api/user/profile) ou (2) definir PROVA_USER_ID e rodar polling Supabase em usuarios por ~3 min.
- **Separação desejada no relatório:** Saldo no banco mudando = prova por profile polling ou Supabase polling. UI atualizando por cache = TTL/requestCache/navegação (não provado nesta auditoria).

---

## 9. O que está pronto vs o que está quebrado

**Pronto (confirmado):**

- Health e monitoring health (GET 200).
- Entrada: server-fly.js + fly.toml app/payout_worker.
- Schema: usuarios.saldo, saques (status, processed_at, transacao_id, motivo_rejeicao), pagamentos_pix (external_id, payment_id, status), transacoes.
- Endpoints GET/OPTIONS do financeiro existem e respondem (401 com auth quando aplicável).
- Depósitos PIX: criar, webhook, reconcile; sem duplicidade approved por payment_id.
- Saques: GET history, POST request (apenas OPTIONS testado); worker rodando; status alinhados ao CHECK.

**Quebrado / em risco (com prova arquivo/linha ou produção):**

- **5 saques presos em "processando"** — worker reporta payouts_falha: 5 (prova: prova-payout-saques-readonly-2026-03-05.json + fly logs).
- **1 máquina app stopped** (fly snapshot) — possível capacidade reduzida.
- **Ledger:** script prova-ledger falhou por coluna usuario_id inexistente; código usa user_id (e fallback usuario_id). Tabela pode estar vazia ou só com user_id — **divergência user_id vs usuario_id** documentada (processPendingWithdrawals.js).
- **Saldo aumentando:** não provado se é persistido ou visual (prova INCONCLUSIVA).

---

## 10. Plano mínimo V1 (somente descrever — sem implementar)

1. **Saques presos:** Diagnosticar por que o worker não conclui (token MP payout, falha no insert do ledger, timeout, etc.); aplicar correção (ex.: fallback user_id no ledger já existente no código) e reprocessar ou marcar rejeitado com motivo.
2. **Ledger:** Garantir SSOT: uma única coluna de usuário (user_id ou usuario_id) e uso consistente no backend e worker; se tabela vazia, garantir que novos saques insiram com a coluna correta.
3. **Saldo:** Executar prova com BEARER e/ou PROVA_USER_ID; se saldo no banco subir sem novo depósito, corrigir origem (reconcile duplicado, webhook duplicado, etc.).
4. **Máquina stopped:** Decidir se sobe segunda máquina app ou mantém 1 ativa; documentar.
5. **Idempotência:** Reforçar UNIQUE/constraint em external_id e payment_id em pagamentos_pix se ainda não existir; revisar correlation_id no ledger.

---

## 11. Gates de segurança (apenas documentar)

- **Backup:** Fazer backup de tabelas financeiras (usuarios, pagamentos_pix, saques, ledger_financeiro, transacoes) antes de qualquer patch que altere escritas.
- **Rollback:** Ter release anterior (ex.: v305) como rollback conhecido; testar fly releases list e deploy de versão anterior.
- **Canário:** Se possível, testar patch em 1 máquina ou em staging antes de aplicar a todas.
- **Nenhum gate foi executado nesta auditoria.**

---

## 12. Checklist de aceitação final (para quando aplicarmos o patch)

- [ ] Backup das tabelas financeiras realizado e verificado.
- [ ] Ledger: coluna de usuário (user_id/usuario_id) única e usada de forma consistente; insert de saque testado.
- [ ] Worker: ao menos 1 ciclo com payouts_sucesso > 0 ou saques presos reduzidos (reprocessamento ou rejeição com motivo).
- [ ] Prova saldo: executada com BEARER e/ou PROVA_USER_ID; conclusão "saldo estável" ou causa do aumento identificada e corrigida.
- [ ] Endpoints GET do financeiro (profile, history, pix/usuario) retornam 200 com auth.
- [ ] Nenhum novo saque preso em processando > 30 min após patch.
- [ ] Releases Fly: novo deploy em estado *complete* (não failed).

---

## 13. ANEXOS (JSON gerados)

| Arquivo | Descrição |
|---------|-----------|
| docs/relatorios/auditoria-fly-snapshot-2026-03-05.json | Snapshot Fly: status, machines, scale, releases |
| docs/relatorios/auditoria-schema-prod-2026-03-05.json | Schema prod: colunas (amostra) usuarios, saques, pagamentos_pix, ledger_financeiro, transacoes |
| docs/relatorios/auditoria-endpoints-financeiro-2026-03-05.json | Endpoints GET/OPTIONS testados e status codes |
| docs/relatorios/auditoria-map-escritas-financeiro-2026-03-05.json | Mapa de escritas em saldo/saques/ledger/pagamentos_pix/transacoes |
| docs/relatorios/prova-saldo-persistencia-2026-03-05.json | Prova saldo (inconclusivo sem BEARER/PROVA_USER_ID) |
| docs/relatorios/prova-depositos-pix-readonly-2026-03-05.json | Depósitos PIX: status, duplicidade, external_id kind, amostra 50 |
| docs/relatorios/prova-payout-saques-readonly-2026-03-05.json | Saques: status, presos >30min, worker logs, CHECK |
| docs/relatorios/prova-ledger-readonly-2026-03-05.json | Ledger 24h: erro usuario_id (coluna user_id no código) |

---

*Auditoria executada em modo READ-ONLY. Nenhum dado foi alterado em produção.*
