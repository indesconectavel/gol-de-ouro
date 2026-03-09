# Auditoria total financeiro (READ-ONLY) — Gol de Ouro

**Data:** 2026-03-05  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo de código alterado; nenhum commit, deploy, migração, env ou chamada que execute saque/PIX real).  
**Objetivo:** Identificar causa(s) raiz dos problemas do sistema financeiro (saque + ledger), validar arquitetura e propor menor conjunto de mudanças para V1 “rodar liso”.

---

## 1. Resumo executivo (não técnico)

O sistema financeiro tem **depósito PIX**, **saldo em conta**, **saque solicitado via API** e um **worker** que envia o saque ao Mercado Pago e deveria atualizar status e registrar no **ledger**. As falhas observadas (500 “Erro ao registrar saque”, histórico pendente, E2E FAIL) concentram-se em:

- **Ledger:** Em produção a tabela `ledger_financeiro` tem coluna **user_id** e não **usuario_id**. O código (e o schema do repositório) usavam apenas `usuario_id`, gerando erro de coluna inexistente e 500. Já existe no repositório um patch (tentativa `user_id` primeiro, depois `usuario_id` com cache); **se a imagem deployada não incluir esse patch, o POST de saque continua falhando**.
- **Status de saque vs banco:** O worker e o webhook usam valores de status (`aguardando_confirmacao`, `falhou`, `processado`) que **não constam do CHECK** da tabela `saques` no schema de referência (`pendente`, `processando`, `concluido`, `rejeitado`, `cancelado`). Se o banco tiver esse CHECK, os UPDATEs podem falhar e saques ficam presos.
- **Reconciler quebrado:** O módulo que “despresa” saques em processamento (`reconcileProcessingWithdrawals`) depende de `updateSaqueStatus` exportado por `processPendingWithdrawals.js`, mas **essa função não está definida nem exportada** no arquivo atual. O reconciler encerra imediatamente com “updateSaqueStatus indisponível”.
- **E2E:** O script de E2E já tem **fallback** quando o flyctl não suporta a flag `--since`; o FAIL recente deve-se à **resposta 500 do backend** (“Erro ao registrar saque”), não à ferramenta. O relatório marca FAIL corretamente por `success === false` e statusCode 500.

**Conclusão em uma frase:** A causa principal do 500 no saque é a divergência **ledger_financeiro.user_id vs usuario_id** em produção; em seguida vêm o uso de status não permitidos pelo CHECK em `saques` e o reconciler inoperante por falta de `updateSaqueStatus`.

---

## 2. Mapa do fluxo financeiro (end-to-end)

| Etapa | Onde | Tabela / endpoint | Evidência (arquivo:linhas) |
|-------|------|-------------------|----------------------------|
| **Depósito** | Webhook MP + reconciler | `pagamentos_pix` → `usuarios.saldo` | server-fly.js 2091–2112 (webhook claim); 2374–2394 (reconcilePendingPayments) |
| **Saldo** | Frontend lê | GET (ex.: saldo do usuário) | usuarios.saldo; endpoint depende do player |
| **Jogo / aposta** | Backend debita | `usuarios.saldo` | server-fly.js (update saldo em lógica de partida/chute) |
| **Saque request** | POST | `saques` (insert) + débito saldo + ledger | server-fly.js 1385–1655: POST `/api/withdraw/request`; insert saques 1536–1565; createLedgerEntry 1576–1624 |
| **Worker** | process group `payout_worker` | Lê `saques` status pendente → update processando → createPixWithdraw → update aguardando_confirmacao | fly.toml 13–14; src/workers/payout-worker.js; processPendingWithdrawals.js 184–285 |
| **Provedor PIX** | Mercado Pago | POST /v1/transfers | services/pix-mercado-pago.js 223–332 (createPixWithdraw) |
| **Ledger** | API + worker + webhook | `ledger_financeiro` (insert) | processPendingWithdrawals.js 21–92 (insertLedgerRow, createLedgerEntry); server-fly.js 1576, 1602, 2216, 2257 |
| **Confirmação payout** | Webhook MP ou reconciler | Update `saques` (status concluído + processed_at, transacao_id) | server-fly.js 2215–2237 (webhook); reconcileProcessingWithdrawals.js (usa updateSaqueStatus, que não existe no export atual) |

**Inconsistências de nomes/IDs:**  
- **userId** no JWT (req.user.userId) = **usuario_id** na tabela `saques` e `usuarios` (código alinhado).  
- **ledger_financeiro:** repositório e schema SQL usam **usuario_id**; em produção a coluna existente é **user_id** (docs/relatorios/PROVA-LEDGER-FINANCEIRO-2026-03-04.md, AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md).

---

## 3. Snapshot do “estado da verdade” (infra + versões)

### 3.1 Fly.io (evidências em docs — somente leitura)

- **App:** `goldeouro-backend-v2` (fly.toml linha 2; relatórios E2E e PRECHECK).
- **Process groups:** `app` (npm start), `payout_worker` (node src/workers/payout-worker.js) — fly.toml 12–14.
- **Machines (exemplo em relatório E2E 2026-03-05):** app 2874551a105768, app e82d445ae76178, payout_worker e82794da791108; version 312; região gru.
- **Último deployment id (ex.):** goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM.
- **Máquina parada:** Em outros relatórios (ex.: PRECHECK-READONLY-DEPLOY-BACKEND) consta app e82d445ae76178 **stopped** e payout_worker **started**. Ou seja: uma instância do **app** pode estar parada; o **worker** aparece como started.

**Meta:** O worker está configurado e, nos snapshots, em execução. A confirmação de que ele realmente processa depende de ENV (ENABLE_PIX_PAYOUT_WORKER, PAYOUT_PIX_ENABLED, MERCADOPAGO_PAYOUT_ACCESS_TOKEN) e de logs em produção — não alterados nesta auditoria.

### 3.2 Ferramentas locais e E2E (--since)

- **Problema:** `Error: unknown flag: --since` ocorre com versões antigas do flyctl que não suportam `--since`.
- **Evidência:** docs/relatorios/CHANGE-E2E-FLYCTL-SINCE-FALLBACK-2026-03-05-124857.md; scripts/e2e-withdraw-ledger.js linhas 41–58.
- **Fallback:** O script tenta primeiro `flyctl logs ... --since 15m --no-tail`; se falhar e a saída contiver "unknown flag: --since", define `flyctlSinceSupported = false` e chama `flyctl logs ... --no-tail` (sem --since). Assim o E2E **não sai com erro por causa do flyctl**; a coleta de logs segue com janela total.
- **Conclusão:** O FAIL do E2E (ex.: E2E-WITHDRAW-LEDGER-AUTO-2026-03-05-233659.md — statusCode 500, message "Erro ao registrar saque") é **falha do backend/ledger**, não do script. O script marca FAIL por `!success && statusCode === 500` (e2e-withdraw-ledger.js 286–288).

---

## 4. Mapa do fluxo financeiro (detalhado)

- **Depósito:** Webhook ou reconciler atualiza `pagamentos_pix` e credita `usuarios.saldo` (server-fly.js 2091–2112, 2374–2394).
- **Saldo:** Coluna `usuarios.saldo`; frontend consome via API (endpoint exato no player).
- **Saque (API):**  
  - Autenticação: Bearer JWT (authenticateToken); userId = req.user.userId.  
  - Validações: PixValidator, mínimo R$ 10, bloqueio por saque pendente duplicado, saldo suficiente.  
  - Débito: update `usuarios` com `.eq('saldo', usuario.saldo)` (optimistic lock).  
  - Insert `saques`: usuario_id, valor/amount, fee, net_amount, correlation_id, pix_key/pix_type (e chave legada), status **'pendente'**, created_at — server-fly.js 1536–1565.  
  - createLedgerEntry('saque') e createLedgerEntry('taxa'); em falha, rollbackWithdraw e 500 "Erro ao registrar saque" — 1576–1625.

- **Worker:**  
  - Seleção: `saques` com status **in ('pendente','pending')**, order created_at asc, limit 1 — processPendingWithdrawals.js 184–189.  
  - Lock: update status **'processando'** onde id e status in (pendente, pending) — 239–246.  
  - createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId) — 259.  
  - Se sucesso: update status **'aguardando_confirmacao'** (261–266); **não** grava processed_at nem transacao_id neste arquivo.  
  - Se falha: createLedgerEntry('falha_payout'), rollbackWithdraw (saldo + ledger rollback + update saques status **'falhou'**) — 287–299, 144.

- **Ledger:**  
  - createLedgerEntry em processPendingWithdrawals.js 56–92: dedup por (correlation_id, tipo, referencia); payloadBase (tipo, valor, referencia, correlation_id, created_at); insertLedgerRow adiciona coluna de usuário (user_id ou usuario_id com fallback e cache).  
  - Chamadas: server-fly.js 1576 (saque), 1602 (taxa); processPendingWithdrawals 120–127 (rollback), 287–294 (falha_payout); server-fly 2216, 2257 (webhook payout_confirmado/falha_payout).

- **Provedor PIX:** createPixWithdraw (pix-mercado-pago.js 223–332) usa MERCADOPAGO_PAYOUT_ACCESS_TOKEN, POST /v1/transfers; external_reference = `${saqueId}_${correlationId}`; retorna data.id (transfer id). Esse id **não** é escrito em `saques.transacao_id` pelo worker atual (apenas status 'aguardando_confirmacao').

---

## 5. Achados com evidências

### 5.1 Ledger: coluna user_id vs usuario_id (causa do 500)

| Item | Evidência |
|------|-----------|
| Código/schema repo | database/schema-ledger-financeiro.sql: coluna **usuario_id** (linha 7). processPendingWithdrawals.js: insertLedgerRow tenta **user_id** primeiro, depois **usuario_id** (21–54). |
| Produção | docs/relatorios/PROVA-LEDGER-FINANCEIRO-2026-03-04.md: SCHEMA_ERROR_MESSAGE "column ledger_financeiro.usuario_id does not exist"; TABLE_EXISTS true; conclusão: coluna existente é **user_id**. |
| Impacto | Se a imagem em produção não tiver o patch (insertLedgerRow com fallback), o insert usa apenas usuario_id e o Postgres retorna erro → createLedgerEntry falha → server-fly retorna 500 "Erro ao registrar saque" (server-fly.js 1585–1600, 1612–1625). |

**Arquivo:linhas:**  
- Insert ledger: `src/domain/payout/processPendingWithdrawals.js` 21–54 (insertLedgerRow), 56–92 (createLedgerEntry).  
- Resposta 500: `server-fly.js` 1585–1600 (ledger saque), 1612–1625 (ledger taxa).

### 5.2 Status de saque: CHECK constraint vs valores usados no código

| Item | Evidência |
|------|-----------|
| Schema (database/schema.sql) | saques: `CHECK (status IN ('pendente', 'processando', 'concluido', 'rejeitado', 'cancelado'))` — linha 114. |
| Código worker | processPendingWithdrawals.js 263: update `status: 'aguardando_confirmacao'`; 144: rollbackWithdraw update `status: 'falhou'`. |
| Webhook | server-fly.js 2229: update `status: 'processado'`. 2180: comparação com 'processado', 'falhou'. |
| withdrawalStatus.js | Define oficiais: pendente, processando, concluido, rejeitado, cancelado; diz "Não usar: aguardando_confirmacao, processado, falhou". |
| Impacto | Se o banco tiver o CHECK do schema.sql, os UPDATEs para 'aguardando_confirmacao', 'falhou' e 'processado' **violam a constraint** e falham → saque preso em "processando" ou rollback não persiste. |

**Arquivo:linhas:**  
- CHECK: `database/schema.sql` 114.  
- Uso: `src/domain/payout/processPendingWithdrawals.js` 241 (processando), 263 (aguardando_confirmacao), 144 (falhou).  
- Webhook: `server-fly.js` 2180, 2229.

### 5.3 Reconciler: updateSaqueStatus indisponível

| Item | Evidência |
|------|-----------|
| reconcileProcessingWithdrawals.js | Linha 11: `const { updateSaqueStatus } = require('./processPendingWithdrawals');` Linhas 57–59: se `typeof updateSaqueStatus !== 'function'` → return com erro "updateSaqueStatus indisponível". |
| processPendingWithdrawals.js | module.exports (324–329): apenas payoutCounters, createLedgerEntry, rollbackWithdraw, processPendingWithdrawals. **updateSaqueStatus não está definido nem exportado.** |
| Impacto | O reconciler nunca processa: na primeira execução sai com "updateSaqueStatus indisponível". Saques que ficam em "processando" (ou "aguardando_confirmacao" se o CHECK permitir) não são finalizados nem com processed_at/transacao_id pelo reconciler. |

**Arquivo:linhas:**  
- Require: `src/domain/payout/reconcileProcessingWithdrawals.js` 11, 57–59.  
- Export: `src/domain/payout/processPendingWithdrawals.js` 324–329.

### 5.4 Worker não grava processed_at nem transacao_id ao “sucesso” do PIX

| Item | Evidência |
|------|-----------|
| processPendingWithdrawals.js | Após payoutResult?.success === true (259) só faz update status 'aguardando_confirmacao' (261–266). Não chama update que preencha processed_at ou transacao_id (payoutResult?.data?.id). |
| createPixWithdraw | Retorna data.id (transfer id) — pix-mercado-pago.js 315–322. |
| Impacto | O registro de saque fica sem transacao_id e processed_at até que o webhook do MP ou o reconciler atualizem. O reconciler está quebrado (achado 5.3); o webhook usa status 'processado' (fora do CHECK). |

**Arquivo:linhas:**  
- Worker: `src/domain/payout/processPendingWithdrawals.js` 259–266.  
- Provedor: `services/pix-mercado-pago.js` 314–322.

### 5.5 E2E: FAIL por resposta do backend, não por flyctl

| Item | Evidência |
|------|-----------|
| Fallback --since | scripts/e2e-withdraw-ledger.js 44–58: em caso de "unknown flag: --since", usa --no-tail sem --since; não sai com erro. |
| Heurística FAIL | Linhas 272–294: FAIL se 22P02/uuid nos logs, ou "Erro ao registrar ledger"/"[LEDGER] insert falhou", ou (!success && statusCode === 500). |
| Relatório 2026-03-05 | statusCode 500, message "Erro ao registrar saque"; contagens de ledger nos logs em zero (janela/timing); justificativa: "Chamada ao saque retornou success=false". |
| Impacto | O E2E está classificando corretamente a falha como do backend (500). Separar "falha do E2E" vs "falha do sistema financeiro": a falha é do sistema (ledger/status); o script apenas a expõe. |

**Arquivo:linhas:**  
- Fallback: `scripts/e2e-withdraw-ledger.js` 41–58.  
- Veredito: 268–294.

### 5.6 Banco Supabase: consistência de nomes

- **Tabelas financeiras:** usuarios (saldo), transacoes, pagamentos_pix, saques, ledger_financeiro (evidência em relatórios e database/schema*.sql).  
- **Nomenclatura:** Código e schema do repo usam **usuario_id** em saques, transacoes, pagamentos_pix; apenas **ledger_financeiro** em produção tem **user_id** (AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md).  
- **Schema saques:** database/schema.sql tem valor DECIMAL, chave/tipo, CHECK de status, processed_at; schema-completo.sql tem versão mais simples (sem CHECK explícito na lista). Qual schema está aplicado em produção não foi alterado nesta auditoria.

---

## 6. Hipóteses ranqueadas (1 = mais provável)

| # | Hipótese | Evidência | Impacto |
|---|----------|-----------|---------|
| 1 | **Ledger em produção sem patch user_id/usuario_id** — insert usa coluna inexistente | Probe e relatórios 2026-03-04: "column ledger_financeiro.usuario_id does not exist"; repo tem insertLedgerRow com fallback | 500 no POST saque |
| 2 | **CHECK em saques rejeita status aguardando_confirmacao / falhou / processado** | schema.sql CHECK apenas 5 valores; worker/webhook usam 3 valores fora do conjunto | UPDATE falha; saque preso ou rollback não persistido |
| 3 | **Reconciler não roda (updateSaqueStatus ausente)** | reconcileProcessingWithdrawals require updateSaqueStatus; processPendingWithdrawals não exporta | Saques em processando nunca finalizados pelo reconciler |
| 4 | **Worker não grava transacao_id/processed_at** | processPendingWithdrawals só atualiza status para aguardando_confirmacao após createPixWithdraw | Dependência total de webhook (que usa 'processado') para concluir |
| 5 | **ENV do worker (PAYOUT_PIX_ENABLED / ENABLE_PIX_PAYOUT_WORKER)** false ou token ausente | payout-worker.js 6–9, 63; processPendingWithdrawals 163–168 | Worker não processa ou não inicia |
| 6 | **Máquina worker parada ou escala 0** | Em alguns relatórios há app stopped; worker apareceu started | Menos provável se fly status mostrar worker started |
| 7 | **Idempotência ledger (correlation_id)** — tipo/referência ou formato correlation_id | createLedgerEntry usa toLedgerCorrelationId; unique (correlation_id, tipo, referencia) no schema | Duplicidade ou erro de constraint; menos provável como causa do 500 atual |
| 8 | **Timeout/retry gera duplicidade ou status preso** | Sem lease/row lock explícito além do update status | Possível em cenários de concorrência |
| 9 | **transacao_id/processed_at nunca escritos pelo fluxo principal** | Worker não escreve; reconciler quebrado; webhook escreve mas com status 'processado' | Histórico/auditoria incompleto |
| 10 | **JWT userId vs DB usuario_id** | Código usa req.user.userId no insert como usuario_id; alinhado | Não é causa dos 500 atuais |

---

## 7. Comparação com “sistemas parecidos” (sanity check)

- **Padrão típico:** API cria saque pendente → worker faz lock por status/lease → chama provedor → atualiza saque com provider_tx_id e processed_at → ledger com idempotência (ex.: withdrawal_id/correlation_id). Em falha: status falhou/rejeitado e opcionalmente ledger de tentativa.
- **Nosso desenho:** API cria saque pendente, debita saldo, insere ledger (saque + taxa). Worker faz lock por update status processando, chama createPixWithdraw, atualiza para aguardando_confirmacao **sem** processed_at/transacao_id. Webhook ou reconciler deveriam marcar concluído e preencher processed_at/transacao_id; reconciler está quebrado; webhook usa status 'processado' fora do CHECK. Ledger tem idempotência por (correlation_id, tipo, referencia) e fallback user_id/usuario_id no insert.
- **Conclusão:** O caminho está correto em termos de fluxo (request → lock → provedor → confirmação → ledger). Para V1 estável faltam: (1) garantir insert no ledger com a coluna existente em produção (user_id); (2) alinhar todos os status ao CHECK da tabela (usar concluido/rejeitado em vez de processado/falhou/aguardando_confirmacao onde aplicável); (3) restaurar o reconciler (export/implementação de updateSaqueStatus ou equivalente); (4) opcionalmente o worker gravar processed_at e transacao_id ao receber sucesso do provedor, com status permitido pelo CHECK.

---

## 8. Correções mínimas propostas (V1 “rodar liso”)

| # | Mudança | Onde | Objetivo |
|---|---------|------|----------|
| 1 | **Garantir deploy com patch ledger** | processPendingWithdrawals.js (insertLedgerRow user_id primeiro, depois usuario_id) | Eliminar 500 por coluna inexistente no ledger |
| 2 | **Usar apenas status do CHECK em saques** | processPendingWithdrawals.js e server-fly.js (webhook) | Trocar 'aguardando_confirmacao' → 'processando'; 'falhou' → 'rejeitado'; 'processado' → 'concluido'. Garantir que rollback e webhook usem 'rejeitado' e 'concluido'. |
| 3 | **Restaurar updateSaqueStatus no domínio** | processPendingWithdrawals.js | Definir e exportar updateSaqueStatus (payload: newStatus, optional processed_at, transacao_id, onlyWhenStatus) para o reconciler funcionar. |
| 4 | **Worker: ao sucesso do createPixWithdraw, atualizar para concluido com processed_at e transacao_id** | processPendingWithdrawals.js | Reduzir dependência do webhook; saque concluído mesmo se webhook atrasar ou falhar. |
| 5 | **Webhook: usar status 'concluido' e preencher processed_at e transacao_id** | server-fly.js (rota /webhooks/mercadopago) | Alinhar ao CHECK e permitir auditoria. |
| 6 | **E2E: incluir "Erro ao registrar ledger" nas contagens e justificativa** | scripts/e2e-withdraw-ledger.js | Já documentado em CHANGE-E2E-LOGWINDOW-AND-FILTERS; opcional para diagnóstico. |

Máximo 6 itens; o essencial para “rodar liso” são **1, 2, 3 e 5** (e 4 se quiser conclusão imediata no worker).

---

## 9. Checklist de validação pós-correção

- [ ] POST /api/withdraw/request com Bearer e body válido retorna 201 e saque com status pendente.
- [ ] Nenhum 500 "Erro ao registrar saque" após deploy com patch ledger (user_id/usuario_id).
- [ ] Ledger: pelo menos uma linha em ledger_financeiro com tipo 'saque' e 'taxa' para o saque de teste.
- [ ] Worker: logs com "Início do ciclo" e, se houver saque pendente, "Payout iniciado" e update para status permitido (processando/concluido).
- [ ] Nenhum UPDATE em saques falhando por CHECK constraint (status inválido).
- [ ] Reconciler: não loga "updateSaqueStatus indisponível"; processa fila de processando (se houver).
- [ ] Webhook MP (payout): atualiza saque para concluido com processed_at/transacao_id quando status approved/credited.
- [ ] E2E: com credenciais, veredito PASS quando saque 201 e sem erros de ledger nos logs; FAIL apenas se backend retornar erro ou logs com "Erro ao registrar ledger"/22P02.

---

## 10. Evidências obrigatórias (resumo por achado)

| Achado | Arquivo(s) | Linhas / trecho | Por que quebra | Impacto |
|--------|------------|------------------|----------------|---------|
| Ledger user_id vs usuario_id | processPendingWithdrawals.js, PROVA-LEDGER-FINANCEIRO-2026-03-04.md | insertLedgerRow 21–54; createLedgerEntry 56–92; probe SCHEMA_ERROR_MESSAGE | Banco em prod tem user_id; código antigo só usuario_id | 500 "Erro ao registrar saque" |
| Status fora do CHECK | database/schema.sql, processPendingWithdrawals.js, server-fly.js | schema 114; worker 263, 144; webhook 2229, 2180 | CHECK permite só 5 valores; código usa aguardando_confirmacao, falhou, processado | UPDATE falha; saque preso ou rollback não salvo |
| updateSaqueStatus ausente | processPendingWithdrawals.js, reconcileProcessingWithdrawals.js | exports 324–329; require 11, 57–59 | Reconciler importa função não exportada | Reconciler não processa; "updateSaqueStatus indisponível" |
| Worker não grava transacao_id/processed_at | processPendingWithdrawals.js | 259–266 | Só update status aguardando_confirmacao | Dependência total de webhook/reconciler para concluir |
| E2E FAIL por backend | e2e-withdraw-ledger.js, E2E-WITHDRAW-LEDGER-AUTO-2026-03-05-233659.md | 268–294; relatório seção 6 e 8 | Heurística FAIL por statusCode 500 e message | E2E reflete falha real do sistema, não do script |

---

*Fim do relatório. Nenhum código, env, migração ou chamada de saque real foi alterado ou executado.*
