# Execução Auditoria Financeiro V1 — READ-ONLY

**Data:** 2026-03-05  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo de código alterado; nenhum commit, deploy, migração, env ou chamada que execute saque/PIX real).  
**Objetivo:** Executar auditoria completa do sistema financeiro (saque + worker + webhook + ledger + E2E + Fly/Supabase), confirmar causa raiz e produzir plano mínimo e seguro para V1.

---

## 1. Resumo executivo (não técnico)

O sistema permite depósitos PIX, saldo em conta, jogo e saques via API. Um worker envia o saque ao Mercado Pago e deveria atualizar status e registrar no ledger. Os problemas atuais (erro 500 “Erro ao registrar saque”, E2E falhando, saques presos) têm três causas principais:

1. **Ledger:** Em produção a tabela `ledger_financeiro` usa a coluna **user_id**; o código antigo usava só **usuario_id**, gerando erro de coluna inexistente e 500. O repositório já tem um patch (tentar `user_id` primeiro, depois `usuario_id`). Se a imagem em produção não tiver esse patch, o POST de saque continua falhando.
2. **Status vs banco:** O worker e o webhook usam valores (`aguardando_confirmacao`, `falhou`, `processado`) que **não estão no CHECK** da tabela `saques` (que permite apenas: pendente, processando, concluido, rejeitado, cancelado). Se o banco tiver esse CHECK, os UPDATEs falham e os saques ficam presos.
3. **Reconciler inoperante:** O módulo que “despresa” saques em processamento depende de uma função `updateSaqueStatus` que **não existe nem é exportada** no arquivo atual do worker. O reconciler encerra logo com “updateSaqueStatus indisponível”.

**Conclusão em uma frase:** A causa principal do 500 no saque é a divergência **ledger user_id vs usuario_id** em produção; em seguida vêm o uso de status não permitidos pelo CHECK e o reconciler quebrado por falta de `updateSaqueStatus`. O E2E falha corretamente por causa da resposta 500 do backend, não por falha do script.

---

## 2. Mapa do fluxo financeiro

| Etapa | Onde | Tabela / endpoint | Evidência (arquivo:linha) |
|-------|------|-------------------|----------------------------|
| Depósito | Webhook MP + reconciler | `pagamentos_pix` → `usuarios.saldo` | server-fly.js 2091–2112; 2374–2394 |
| Saldo | Frontend/API | `usuarios.saldo` | — |
| Jogo / aposta | Backend | `usuarios.saldo` | server-fly.js (lógica de partida/chute) |
| **Saque request** | POST | `saques` + débito saldo + ledger | server-fly.js **1385** (POST `/api/withdraw/request`); insert saques 1555–1565; createLedgerEntry 1576, 1602 |
| **Ledger (API)** | createLedgerEntry | `ledger_financeiro` | server-fly.js 1576 (saque), 1602 (taxa); createLedgerEntry importado de processPendingWithdrawals (server-fly.js 23, 26) |
| **Função ledger** | insertLedgerRow, createLedgerEntry, cache | `ledger_financeiro` | **src/domain/payout/processPendingWithdrawals.js**: insertLedgerRow **22–54**, createLedgerEntry **58–92**, ledgerUserIdColumn **5**, cache **37**, **51** |
| **Worker payout** | process group `payout_worker` | Lê saques → update processando → PIX → update status | **fly.toml 14**: `payout_worker = "node src/workers/payout-worker.js"`; **src/workers/payout-worker.js** entrada **4** (require processPendingWithdrawals), loop **76** (processPendingWithdrawals), flags env **6–8**, **63** (PAYOUT_PIX_ENABLED); **processPendingWithdrawals.js** 184–189 (select pendentes), 239–246 (lock processando), 259 (createPixWithdraw), 261–266 (update aguardando_confirmacao), 291–299 (rollback/falha) |
| **Webhook MP (payout)** | POST | Update saques + ledger | **server-fly.js** **2121** (app.post `/webhooks/mercadopago`), 2161–2179 (busca saque), 2216 (createLedgerEntry payout_confirmado), 2230 (update status 'processado'), 2242–2251 (in_process → aguardando_confirmacao), 2255–2274 (rejected/cancelled → falha_payout + rollback) |
| **Reconciler** | runReconcileCycle no worker | Saques em processando → update COMPLETED/REJECTED | **src/domain/payout/reconcileProcessingWithdrawals.js** (arquivo completo); require updateSaqueStatus **11**; chamadas updateSaqueStatus **98, 136, 167, 186, 206, 223, 253**; **src/workers/payout-worker.js** **5** (require reconcileProcessingWithdrawals), **112** (await reconcileProcessingWithdrawals), **127–128** (setInterval runReconcileCycle) |
| **Status oficiais** | withdrawalStatus.js | Constantes alinhadas ao CHECK | **src/domain/payout/withdrawalStatus.js** (arquivo completo): PENDING=pendente, PROCESSING=processando, COMPLETED=concluido, REJECTED=rejeitado, CANCELED=cancelado; comentário **2–4** “Não usar: aguardando_confirmacao, processado, falhou, pending” |

---

## 3. Evidências (arquivo:linha e docs existentes)

| Ponto | Arquivo | Linhas | Doc/relatório de referência |
|-------|---------|--------|-----------------------------|
| POST /api/withdraw/request | server-fly.js | 1385 | — |
| createLedgerEntry, insertLedgerRow, ledgerUserIdColumn | src/domain/payout/processPendingWithdrawals.js | 5, 22–54, 58–92 | AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md, PROVA-LEDGER-FINANCEIRO-2026-03-04.md |
| Worker entrada + loop + flags | src/workers/payout-worker.js | 4, 6–8, 63, 76 | fly.toml 14 |
| Webhook payout | server-fly.js | 2121–2294 | — |
| Reconciler | src/domain/payout/reconcileProcessingWithdrawals.js | 11, 40–59, 98, 136, 167, 186, 206, 223, 253 | AUDITORIA-TOTAL-FINANCEIRO-READONLY-2026-03-05.md |
| Status oficiais | src/domain/payout/withdrawalStatus.js | 1–49 | schema-supabase.sql 115 (CHECK status) |
| CHECK status saques | schema-supabase.sql | 115 | CHECK (status IN ('pendente', 'processando', 'concluido', 'rejeitado', 'cancelado')) |

---

## 4. Diagnóstico das causas raiz (ranqueadas)

### 4.1 Ledger: user_id vs usuario_id

| Item | Evidência |
|------|-----------|
| Código atual (patch) | processPendingWithdrawals.js **21–54**: insertLedgerRow tenta **user_id** primeiro (33–37), em falha tenta **usuario_id** (47–51); cache **ledgerUserIdColumn** em 37 e 51. |
| Schema repo | database/schema-ledger-financeiro.sql **7**: coluna **usuario_id**. |
| Produção | docs/relatorios/PROVA-LEDGER-FINANCEIRO-2026-03-04.md: "column ledger_financeiro.usuario_id does not exist" → coluna em prod é **user_id**. |
| Onde o ledger é escrito | (1) Saque: server-fly.js 1576 (saque), 1602 (taxa); (2) Worker rollback/falha: processPendingWithdrawals.js 122–127 (rollback), 291–294 (falha_payout); (3) Webhook: server-fly.js 2216 (payout_confirmado), 2256 (falha_payout). |

**Estado do patch no repositório local:** **PRESENTE** — insertLedgerRow (22–54) faz user_id primeiro e fallback usuario_id; cache em 5, 37, 51. Evidência: processPendingWithdrawals.js linhas 33–54.

**Causa raiz #1:** Se a imagem deployada **não** incluir esse patch, o insert usa apenas a primeira tentativa; em ambiente com apenas `user_id` a primeira tentativa já funciona. Em ambiente com apenas `usuario_id` a segunda funciona. O 500 “Erro ao registrar saque” ocorre quando **ambas** falham (ex.: coluna em prod era usuario_id e código antigo só tentava user_id, ou vice-versa). Com o patch atual no repo, em prod com **user_id** a primeira tentativa deve passar. Conclusão: **causa raiz #1 confirmada** como “ledger: coluna user_id vs usuario_id”; estado no repo: patch presente; em produção depende da imagem deployada.

### 4.2 Status vs CHECK

| Item | Evidência |
|------|-----------|
| CHECK (schema) | schema-supabase.sql **115**: `CHECK (status IN ('pendente', 'processando', 'concluido', 'rejeitado', 'cancelado'))`. |
| Worker | processPendingWithdrawals.js **241** (processando ✓), **263** (aguardando_confirmacao ✗), **144** (falhou ✗). |
| Webhook | server-fly.js **2230** (processado ✗), **2243** (aguardando_confirmacao ✗), **2180** (compara processado, falhou). |
| withdrawalStatus.js | Define apenas os 5 permitidos; comentário: não usar aguardando_confirmacao, processado, falhou. |

**Tabela status usados vs permitidos:**

| Status usado no código | Permitido pelo CHECK | Observação |
|------------------------|----------------------|------------|
| pendente | Sim | API insert, worker select |
| pending | Não | Worker select .in('status', ['pendente','pending']) — valor legado |
| processando | Sim | Worker lock |
| aguardando_confirmacao | **Não** | Worker após PIX ok; webhook in_process |
| processado | **Não** | Webhook approved/credited |
| falhou | **Não** | rollbackWithdraw |
| concluido | Sim | Deveria ser usado no lugar de processado |
| rejeitado | Sim | Deveria ser usado no lugar de falhou |
| cancelado | Sim | — |

**Causa raiz #2:** UPDATEs para `aguardando_confirmacao`, `processado` ou `falhou` **violam o CHECK** se ele estiver aplicado em produção → saque preso em “processando” ou rollback não persiste. **Confirmada** (evidência por arquivo:linha acima).

### 4.3 Reconciler quebrado

| Item | Evidência |
|------|-----------|
| reconcileProcessingWithdrawals.js | **11**: `const { updateSaqueStatus } = require('./processPendingWithdrawals');` **57–59**: se `typeof updateSaqueStatus !== 'function'` → return com erro "updateSaqueStatus indisponível". |
| processPendingWithdrawals.js | **324–328**: module.exports = { payoutCounters, createLedgerEntry, rollbackWithdraw, processPendingWithdrawals }. **updateSaqueStatus não está definido nem exportado.** |

**Reconciler operacional?** **NÃO.** Evidência: reconcileProcessingWithdrawals.js exige updateSaqueStatus (11, 57–59); processPendingWithdrawals.js não exporta essa função (324–328). Na carga do módulo, updateSaqueStatus é undefined; na primeira execução do reconciler, retorna { success: false, processed: 0, error: 'updateSaqueStatus indisponível' }.

**Causa raiz #3:** Reconciler não processa saques em processando porque a função que ele usa não existe no export. **Confirmada.**

### 4.4 processed_at e transacao_id

| Onde | Preenche processed_at? | Preenche transacao_id? |
|------|------------------------|------------------------|
| processPendingWithdrawals.js (worker) | Não | Não (payoutResult?.data?.id não é escrito em saques) |
| server-fly.js webhook payout | Não | Não (não há update com esses campos nas linhas 2230, 2243) |
| reconcileProcessingWithdrawals.js | Sim (nas chamadas a updateSaqueStatus) | Sim | 
| Problema | updateSaqueStatus não existe; reconciler não roda | Idem |

**Onde deveria ser feito na V1 mínima:** (1) Worker: ao sucesso de createPixWithdraw, além de atualizar status para valor permitido pelo CHECK, fazer update em `saques` com processed_at = now e transacao_id = payoutResult?.data?.id. (2) Webhook: ao marcar approved/credited, usar status 'concluido' e preencher processed_at e transacao_id (payoutId) no update. (3) Reconciler: após restaurar updateSaqueStatus, já passa processed_at e transacao_id (reconcileProcessingWithdrawals.js 141–142, 228–229, 258–259).

---

## 5. Auditoria Fly.io (read-only) — Execução 2026-03-05

Comandos executados (somente leitura):

- `flyctl status -a goldeouro-backend-v2`
- `flyctl machines list -a goldeouro-backend-v2`
- `flyctl scale show -a goldeouro-backend-v2`
- `flyctl releases -a goldeouro-backend-v2`

### Resultados

| Métrica | Valor |
|---------|--------|
| Máquinas app | 2 (scale count 2) |
| Máquinas payout_worker | 1 (scale count 1) |
| App started | 2874551a105768 (withered-cherry-5478) — 1/1 checks passing |
| App stopped | e82d445ae76178 (dry-sea-3466) — 0/1 checks |
| payout_worker | e82794da791108 (weathered-dream-1146) — **started** |
| Imagem | goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM |
| Última release | v312 (status **failed**), ~21h59m atrás |
| Última release complete | v305 (Feb 25 2026) |

**Impacto da “segunda máquina” parada:** Uma instância do **app** (e82d445ae76178) está **stopped**; a outra (2874551a105768) está started com checks passing. O **payout_worker** está started. Para o fluxo de saque: o POST é atendido pelo app ativo; o worker está rodando. A máquina app parada não impacta diretamente o saque/ledger; pode ser escala 2 com uma instância inativa (rolling ou falha de health na segunda).

---

## 6. Auditoria E2E (somente leitura + simulação lógica)

**Arquivo:** scripts/e2e-withdraw-ledger.js

| Pergunta | Resposta | Evidência |
|----------|----------|-----------|
| Fallback do flyctl --since? | Sim | Linhas **41–58**: tenta `--since 15m`; se saída contiver "unknown flag: --since", seta flyctlSinceSupported = false e usa `--no-tail` sem --since. |
| Critério FAIL (500 backend vs falha flyctl)? | FAIL por resposta do backend | **287–289**: `else if (!success && is500)` → FAIL com justificativa pela message. FAIL também por hasLedgerErrors (285–286) ou 22P02/uuid (281–283). |
| E2E bloqueado por 500 “Erro ao registrar saque”? | Sim | Relatório E2E-WITHDRAW-LEDGER-AUTO-2026-03-05-233659.md: statusCode 500, message "Erro ao registrar saque" → veredito FAIL. |
| E2E sem logs (sem --since ou vazios): marca INCONCLUSIVO ou FAIL por log? | Não falha por “falta de log” | Se não houver credenciais → INCONCLUSIVO (275–277). Se houver credenciais e success false + 500 → FAIL por 500 (287–289). Se logs vazios mas success true e saqueId → PASS (290–291). Se resultado ambíguo → INCONCLUSIVO (296–297). Ou seja: não há FAIL apenas por “nenhuma linha nos logs”; pode cair em INCONCLUSIVO. |

**Por que falhou no último run (ex.: 2026-03-05-233659):** A chamada ao saque retornou **success=false** e **statusCode 500** com message "Erro ao registrar saque". A heurística marca FAIL por isso (e2e-withdraw-ledger.js 287–289). As contagens de "Erro ao registrar ledger" nos logs foram 0 (janela/timing podem não ter capturado a linha do app).

**O que precisa mudar no backend para o E2E passar:** (1) Garantir que a imagem em produção tenha o patch do ledger (user_id primeiro, fallback usuario_id) para o POST não retornar 500 por falha no ledger. (2) Usar apenas status permitidos pelo CHECK para que nenhum UPDATE falhe por constraint e o fluxo conclua.

**Melhoria opcional do E2E (apenas proposta):** Incluir na justificativa de FAIL, quando statusCode 500 e message "Erro ao registrar saque", uma nota explícita de que a causa provável é falha no registro do ledger (e sugerir verificar ledger user_id/usuario_id e logs do app). Opcional: ampliar filtro de logs para "Erro ao registrar" (além de "Erro ao registrar ledger") para capturar a mensagem exata do server-fly.js 1598/1624.

---

## 7. Versão em produção vs versão local (sem deploy)

| Passo | Resultado |
|-------|-----------|
| Endpoint de versão | **GET /health** — server-fly.js **2452–2477**; retorna `version: '1.2.1'`, database, mercadoPago, contadorChutes, ultimoGolDeOuro. Não retorna commit, build ou release_id. |
| Chamada GET health (read-only) | Executada em 2026-03-05. Resposta: `{"status":"ok","timestamp":"2026-03-05T19:02:08.101Z","version":"1.2.1","database":"connected","mercadoPago":"connected","contadorChutes":213,"ultimoGolDeOuro":0}`. |
| Cruzamento Fly releases vs commit local | Releases listam v312 (failed) como última; máquinas rodam imagem deployment-01KJXAHSJH0G0PEB6SAWWCPBQM. O health não expõe commit/sha. **Não é possível cravar** qual commit exato está em produção apenas pelo health. |

**Conclusão:** **INCONCLUSIVO** — Produção responde version "1.2.1" e está conectada ao DB e Mercado Pago; não há evidência no endpoint de que o patch do ledger (user_id/usuario_id) está ou não na imagem. Para instrumentar versão sem alterar comportamento: adicionar ao JSON de /health um campo opcional, por exemplo `release: process.env.FLY_APP_VERSION || 'unknown'` ou `commit: process.env.COMMIT_SHA || ''`, preenchido no build/deploy; não alterar lógica de negócio.

---

## 8. Plano mínimo V1 (sem executar)

Baseado nos achados, plano de mudanças **mínimo e seguro**:

### 8.1 Obrigatório

1. **Patch do ledger (user_id primeiro, fallback usuario_id)**  
   - **Estado no repo:** Já presente em processPendingWithdrawals.js (insertLedgerRow 22–54).  
   - **Ação:** Garantir que o **deploy** use esse código (build a partir do branch/commit que contém o patch). Confirmar em produção: após um POST de saque de teste, não deve ocorrer 500 "Erro ao registrar saque"; logs do app não devem mostrar "[LEDGER] insert falhou (airbag)" para o primeiro insert de saque/taxa.

2. **Padronizar status só nos permitidos pelo CHECK**  
   - **Mapeamento exato:**  
     - `aguardando_confirmacao` → **processando** (worker após PIX ok; webhook in_process).  
     - `falhou` → **rejeitado** (rollbackWithdraw em processPendingWithdrawals e webhook rejected/cancelled).  
     - `processado` → **concluido** (webhook approved/credited).  
   - **Arquivos e trocas:**  
     - **src/domain/payout/processPendingWithdrawals.js:** linha 263: `status: 'aguardando_confirmacao'` → `status: 'processando'` (ou usar constante PROCESSING de withdrawalStatus). Linha 144: `status: 'falhou'` → `status: 'rejeitado'` (ou REJECTED).  
     - **server-fly.js (webhook):** linha 2230: `status: 'processado'` → `status: 'concluido'` (ou COMPLETED). Linhas 2243, 2180: aguardando_confirmacao → processando; processado/falhou → concluido/rejeitado onde for update ou comparação de estado final.

3. **Restaurar reconciler: criar/exportar updateSaqueStatus**  
   - **Arquivo:** src/domain/payout/processPendingWithdrawals.js.  
   - **Mudança:** Definir função `updateSaqueStatus({ supabase, saqueId, userId, newStatus, motivo_rejeicao, processed_at, transacao_id, onlyWhenStatus })` que faz update em `saques` (status, motivo_rejeicao, processed_at, transacao_id, updated_at) com filtros por id e opcionalmente onlyWhenStatus; retornar { success, error }. Incluir **updateSaqueStatus** no **module.exports**.  
   - **Uso:** reconcileProcessingWithdrawals.js já importa e chama; não precisa alterar desde que a assinatura seja compatível com as chamadas existentes (98, 136, 167, 186, 206, 223, 253).

4. **Preencher processed_at e transacao_id no fluxo**  
   - **Worker (processPendingWithdrawals.js):** Após createPixWithdraw com success, em vez de apenas update status para processando/aguardando_confirmacao, fazer update com status **concluido** (ou manter processando até webhook, conforme desenho; se for “concluir no worker”): status 'concluido', processed_at = new Date().toISOString(), transacao_id = payoutResult?.data?.id.  
   - **Webhook (server-fly.js):** No bloco approved/credited, no update de saques (equivalente à atual linha 2230), setar status 'concluido', processed_at, transacao_id (payoutId).  
   - Reconciler já passa processed_at e transacao_id nas chamadas a updateSaqueStatus; basta que updateSaqueStatus exista e persista esses campos.

### 8.2 Checklist pós-correção (validação sem transação real)

- [ ] GET https://goldeouro-backend-v2.fly.dev/health → status ok, database connected.  
- [ ] POST /api/withdraw/request com Bearer e body válido (valor, chave_pix, tipo_chave) em ambiente de teste → 200/201, body com success true e saque com status pendente; **não** 500 "Erro ao registrar saque".  
- [ ] Query read-only em ledger_financeiro (ex.: select por correlation_id do saque de teste): existem linhas tipo 'saque' e 'taxa'.  
- [ ] Worker: logs com "Início do ciclo" e, se houver saque pendente, "Payout iniciado"; nenhum log "Falha ao mover para aguardando_confirmacao" por CHECK.  
- [ ] Reconciler: logs **sem** "updateSaqueStatus indisponível".  
- [ ] E2E (com credenciais): veredito PASS quando POST retornar success e não houver erros de ledger nos logs.

### 8.3 Lista de arquivos a alterar (ordem recomendada)

| Ordem | Arquivo | Descrição exata da mudança |
|-------|---------|----------------------------|
| 1 | src/domain/payout/processPendingWithdrawals.js | (1) Trocar status 'aguardando_confirmacao' → 'processando' (linha 263). (2) Trocar status 'falhou' → 'rejeitado' no rollback (linha 144). (3) Definir e exportar updateSaqueStatus. (4) Opcional: ao sucesso do PIX, update com status concluido + processed_at + transacao_id. |
| 2 | server-fly.js (webhook /webhooks/mercadopago) | (1) Trocar update status 'processado' → 'concluido' (linha 2230). (2) Trocar 'aguardando_confirmacao' → 'processando' (linha 2243). (3) Incluir processed_at e transacao_id (payoutId) no update de approved/credited. (4) Comparações de estado final (ex. 2180): usar 'concluido' e 'rejeitado' em vez de 'processado' e 'falhou'. |
| 3 | (Nenhum, apenas deploy) | Garantir que a build de produção inclui o patch do ledger já presente em processPendingWithdrawals.js (insertLedgerRow 22–54). |

**Ordem recomendada:** 1 → 2; em seguida build e deploy. Validação após cada deploy com os passos do checklist acima.

**Critérios de sucesso:** (1) POST /api/withdraw/request não retorna 500 "Erro ao registrar saque". (2) Logs do app sem "[LEDGER] insert falhou (airbag)" para o primeiro insert de saque/taxa. (3) Logs do worker sem "Falha ao mover para aguardando_confirmacao" por constraint. (4) Logs do reconciler sem "updateSaqueStatus indisponível". (5) E2E com credenciais: veredito PASS quando o backend retornar success no saque e sem erros de ledger nos logs.

---

## 9. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Deploy sem patch do ledger | Build a partir do commit que contém insertLedgerRow com user_id primeiro; pós-deploy: um POST de teste e checagem de logs. |
| CHECK em produção diferente do schema (ex. mais valores) | Antes de trocar status no código, confirmar no Supabase (information_schema ou UI) o CHECK real da tabela saques; se necessário, alterar apenas o código para os valores já permitidos. |
| updateSaqueStatus com assinatura diferente da usada pelo reconciler | Implementar updateSaqueStatus com os parâmetros usados nas chamadas em reconcileProcessingWithdrawals.js (supabase, saqueId, userId, newStatus, motivo_rejeicao, processed_at, transacao_id, onlyWhenStatus). |
| Rollback marcar rejeitado e usuário já ter sido debitado | Já é o fluxo atual: rollback devolve saldo e marca falha; ao trocar para 'rejeitado', garantir que onlyWhenStatus ou filtro por status atual evite sobrescrever um saque já concluído. |
| E2E continuar FAIL por outro motivo (rede, env) | Manter INCONCLUSIVO quando faltar credenciais; FAIL apenas quando houver 500 ou evidência explícita de erro de ledger/constraint nos logs. |

---

## 10. Checklist de validação (passo a passo, sem executar transações reais aqui)

1. Health: `GET https://goldeouro-backend-v2.fly.dev/health` → status ok.  
2. Fly: `flyctl status -a goldeouro-backend-v2` → app e payout_worker com pelo menos uma instância started.  
3. Após correções: POST /api/withdraw/request (Bearer + body) em teste → 200/201, success true, sem 500.  
4. Query read-only: select em ledger_financeiro por correlation_id do teste → linhas saque e taxa.  
5. Logs app (flyctl logs): sem "Erro ao registrar ledger" / "[LEDGER] insert falhou" para o saque de teste.  
6. Logs worker: "Início do ciclo"; sem "Falha ao mover para aguardando_confirmacao" por constraint.  
7. Logs reconciler: sem "updateSaqueStatus indisponível".  
8. E2E: definir BEARER e PIX_KEY; rodar script; veredito PASS quando backend retornar success e sem erros nos logs.

---

## 11. Checklist “pronto para deploy”

- [ ] Patch ledger (user_id primeiro, fallback usuario_id) está no código que será deployado.  
- [ ] Status em processPendingWithdrawals e no webhook usam apenas pendente, processando, concluido, rejeitado, cancelado.  
- [ ] updateSaqueStatus definido e exportado em processPendingWithdrawals.js; reconciler não loga "indisponível".  
- [ ] processed_at e transacao_id preenchidos no worker e/ou webhook ao concluir.  
- [ ] Testes manuais ou E2E em ambiente de teste: POST saque retorna 200/201; ledger com linhas; sem 500 por ledger.  
- [ ] Fly: escala e máquinas conferidas (payout_worker pelo menos 1).  
- [ ] ENV de produção (PAYOUT_PIX_ENABLED, ENABLE_PIX_PAYOUT_WORKER, MERCADOPAGO_PAYOUT_ACCESS_TOKEN, Supabase) conferidas sem expor valores no relatório.

---

## 12. Anexo — Inventário de arquivos relevantes e rotas/endpoints

### 12.1 Arquivos

| Arquivo | Papel |
|---------|--------|
| server-fly.js | POST /api/withdraw/request (1385); createLedgerEntry saque/taxa (1576, 1602); rollbackWithdraw (1592, 1618); webhook /webhooks/mercadopago (2121–2294); GET /health (2452). |
| src/domain/payout/processPendingWithdrawals.js | insertLedgerRow, createLedgerEntry, ledgerUserIdColumn; rollbackWithdraw; processPendingWithdrawals; (falta updateSaqueStatus no export). |
| src/domain/payout/reconcileProcessingWithdrawals.js | reconcileProcessingWithdrawals; require updateSaqueStatus; chamadas updateSaqueStatus em vários cenários. |
| src/domain/payout/withdrawalStatus.js | Constantes e normalizeWithdrawStatus; alinhado ao CHECK. |
| src/workers/payout-worker.js | Loop processPendingWithdrawals; runReconcileCycle + setInterval; require reconcileProcessingWithdrawals e processPendingWithdrawals. |
| services/pix-mercado-pago.js | createPixWithdraw; retorna data.id (transfer id). |
| database/schema-ledger-financeiro.sql | Schema ledger (usuario_id no repo); tabela saques correlation_id. |
| schema-supabase.sql | CHECK status saques (115). |
| fly.toml | app e payout_worker (13–14); health check (39–41). |
| scripts/e2e-withdraw-ledger.js | E2E saque/ledger; fallback --since; heurística PASS/FAIL. |

### 12.2 Rotas/endpoints relevantes (somente leitura para auditoria)

| Método | Rota | Uso |
|--------|------|-----|
| GET | /health | Versão e status do backend (read-only). |
| GET | /api/monitoring/health | Alternativa de health. |
| POST | /api/withdraw/request | Solicitar saque (autenticado); altera saldo, saques, ledger. |
| GET | /api/withdraw/history | Histórico de saques (autenticado). |
| POST | /webhooks/mercadopago | Webhook Mercado Pago payout; atualiza saques e ledger. |
| POST | /api/payments/webhook | Webhook pagamentos (depósito). |

---

## 13. Resultado final obrigatório

- **Link/caminho do relatório gerado:**  
  `docs/relatorios/EXECUCAO-AUDITORIA-FINANCEIRO-V1-READONLY-2026-03-05.md`

- **Causa raiz #1 confirmada:** **SIM** — Divergência ledger **user_id** (produção) vs **usuario_id** (schema/código antigo) causa falha no insert e 500 "Erro ao registrar saque". No repositório local o patch (user_id primeiro, fallback usuario_id) está **presente** (processPendingWithdrawals.js 22–54). Se a imagem em produção não tiver esse patch, o 500 persiste. Evidência: PROVA-LEDGER-FINANCEIRO-2026-03-04.md; server-fly.js 1585–1600, 1612–1625.

- **Causas raiz #2 e #3:**  
  - **#2:** Status `aguardando_confirmacao`, `processado`, `falhou` usados no worker e webhook **não** estão no CHECK da tabela saques (schema-supabase.sql 115) → UPDATEs podem falhar e saques ficam presos. Evidência: processPendingWithdrawals.js 263, 144; server-fly.js 2230, 2243, 2180.  
  - **#3:** Reconciler depende de `updateSaqueStatus`, que **não** está definido nem exportado em processPendingWithdrawals.js → reconciler retorna "updateSaqueStatus indisponível" e não processa. Evidência: reconcileProcessingWithdrawals.js 11, 57–59; processPendingWithdrawals.js 324–328.

- **Plano mínimo V1 (bullets):**  
  - Garantir deploy com patch do ledger (user_id primeiro, fallback usuario_id) e confirmar no ar via POST de teste e logs.  
  - Padronizar status: aguardando_confirmacao → processando, falhou → rejeitado, processado → concluido (processPendingWithdrawals.js e server-fly.js webhook).  
  - Restaurar reconciler: criar e exportar updateSaqueStatus em processPendingWithdrawals.js.  
  - Preencher processed_at e transacao_id no worker (após PIX ok) e no webhook (approved/credited).  
  - Validar com checklist (health, POST saque sem 500, ledger, logs, E2E).

- **Próxima ação recomendada (sem executar):**  
  Implementar no código as mudanças do plano mínimo V1 (status, updateSaqueStatus, processed_at/transacao_id) em **src/domain/payout/processPendingWithdrawals.js** e **server-fly.js** (webhook); garantir que a build inclui o patch do ledger já presente; fazer deploy; rodar checklist de validação e, se houver credenciais, o E2E para obter PASS.

---

*Fim do relatório. Nenhum código, env, migração ou chamada de saque real foi alterada ou executada nesta auditoria.*
