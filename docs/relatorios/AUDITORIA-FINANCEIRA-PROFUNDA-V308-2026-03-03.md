# Auditoria financeira profunda V308 — Depósito PIX R$ 10 pendente

**Data:** 2026-03-03  
**Modo:** READ-ONLY (inspeção, GET, leitura DB, logs, relatórios). Nenhuma alteração de código, deploy, secrets, restart ou escrita direta no banco.

---

## Sumário executivo (1 página)

Um depósito PIX de R$ 10 foi realizado pelo usuário e permanece **pendente** na página `/pagamentos`. Esta auditoria identificou a causa raiz provável e o estado dos subsistemas (depósito, saque, saldos, premiações) sem alterar produção.

**Contexto técnico:** Backend no Fly (`goldeouro-backend-v2`), release **V308**, 1 app healthy (ID `2874551a105768`), 1 app stopped, 1 payout_worker ativo. Depósito usa tabela `pagamentos_pix`, rotas em `server-fly.js`, webhook em `/api/payments/webhook` e reconciliação por `reconcilePendingPayments` (setInterval no processo app).

**Evidência DB (candidato R$ 10 de hoje):** Registro `87ee8545-e56d-4978-85d0-d0bd22240eeb`, `usuario_id` `4ddf8330-ae94-4e92-a010-bdc7fa254ad5`, `status: pending`, `payment_id` e `external_id: 148697499270`, `created_at: 2026-03-03T20:32:29Z`. Ou seja, o registro **tem** ID do Mercado Pago; não é falha de persistência na criação.

**Causa raiz mais provável:** **(1) Webhook não chega** ao backend ou **(2) Webhook chega mas falha validação de assinatura** (quando `MERCADOPAGO_WEBHOOK_SECRET` está configurado). O reconciler (`reconcilePendingPayments`) deveria cobrir falhas do webhook, mas nos logs recentes **não há linhas `[RECON]`**; quando não há pendentes processados ou quando o MP ainda retorna status não aprovado, o código não loga. Alternativa: **(3)** no MP o pagamento ainda está como **pending** (usuário não concluiu o pagamento no app do banco/MP), então nem webhook nem reconciler alterariam o status.

**Hipóteses eliminadas:** (5) Registro sem `payment_id`/`external_reference` — **eliminada**: o candidato e todos os últimos 20 têm `payment_id` e `external_id`. (4) Reconciler não roda — **não confirmável só por logs** (não há log quando a lista de pendentes está vazia ou quando o MP retorna não aprovado).

**Plano de correção mínima (proposta, não aplicada):**  
1) Garantir que a URL do webhook no painel MP seja exatamente `https://goldeouro-backend-v2.fly.dev/api/payments/webhook` e que o secret configurado no MP corresponda a `MERCADOPAGO_WEBHOOK_SECRET` do Fly.  
2) Adicionar log mínimo no handler do webhook (entrada + resultado da validação de assinatura, sem corpo completo) e no início de `reconcilePendingPayments` (ex.: “RECON ciclo iniciado, N pendentes”).  
3) Opcional: reduzir `MP_RECONCILE_MIN_AGE_MIN` para 1 minuto para encurtar a janela até o primeiro ciclo de reconciliação (mantendo idempotência).

**Checklist GO/NO-GO por subsistema:**  
- **Depósito PIX:** NO-GO (vários pendentes com `payment_id` válido não evoluem; webhook/reconciler a esclarecer).  
- **Saques PIX:** GO (worker ativo, sem erros nos logs; últimos saques com status final).  
- **Saldos/Ledger:** GO (lógica de crédito por depósito aprovado e débito por saque presente e com idempotência por `correlation_id`).  
- **Premiações:** GO (prêmio e saldo no jogo em `server-fly.js`; tabela `chutes` e gatilhos).  
- **Observabilidade:** NO-GO (falta log estruturado no webhook e no ciclo do reconciler de depósitos).

---

## Regras absolutas (respeitadas)

- NÃO alterar código (apenas leitura e script READ-ONLY temporário para consulta)
- NÃO deploy
- NÃO alterar secrets/env
- NÃO reiniciar máquinas
- NÃO escrever diretamente no banco (apenas SELECT)
- NÃO rodar migrações
- Apenas inspeção, chamadas HTTP seguras (GET) e relatórios

---

## FASE 0 — Snapshot infra (READ-ONLY)

**Comandos executados (com timestamps):**  
`flyctl status -a goldeouro-backend-v2`, `flyctl machines list -a goldeouro-backend-v2`, `flyctl releases -a goldeouro-backend-v2`, `flyctl logs -a goldeouro-backend-v2 --no-tail`.

**Resultados:**

| Item | Valor |
|------|--------|
| Imagem atual | `goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH` |
| Release | V308 (status failed no release, máquinas rodando versão 308) |
| App healthy | ID `2874551a105768` (withered-cherry-5478), 1/1 passing, gru |
| App stopped | ID `e82d445ae76178` (dry-sea-3466) |
| Payout worker | ID `e82794da791108` (weathered-dream-1146), started, gru |

**Logs — busca por payments/pix/webhook/reconcile/MercadoPago:**  
Nos trechos coletados aparecem apenas:  
- `[PIX] Buscando pagamentos para usuário: 4ddf8330-ae94-4e92-a010-bdc7fa254ad5` e `✅ [PIX] 46 pagamentos encontrados` (GET `/api/payments/pix/usuario` na app `2874551a105768`).  
- Várias linhas `[PAYOUT][WORKER] Início do ciclo`, `Nenhum saque pendente`, `Fim do ciclo` (worker).

**Não encontrado nos logs:**  
Nenhuma linha com `[WEBHOOK]`, `[RECON]`, `reconcilePendingPayments`, `approved`, `pagamentos_pix` (além da citada), nem erros 400/401/403/500 relacionados a webhook. Conclusão: **não há evidência de webhook de depósito sendo processado nem de ciclo do reconciler de depósitos nos logs recentes** (o reconciler pode estar rodando sem logar quando não há atualização ou quando o MP retorna não aprovado).

---

## FASE 1 — Prova no código (READ-ONLY)

**A) Rotas de depósito (server-fly.js):**

- **POST /api/payments/pix/criar** — `server-fly.js` ~1729: cria PIX no MP (`https://api.mercadopago.com/v1/payments`), persiste em `pagamentos_pix` com `status: 'pending'`, `payment_id` e `external_id` = `payment.id`, `notification_url: ${BACKEND_URL}/api/payments/webhook`.
- **GET /api/payments/pix/usuario** — `server-fly.js` ~1894: SELECT em `pagamentos_pix` por `usuario_id`, order `created_at` desc, limit 50.
- **POST /api/payments/webhook** — `server-fly.js` ~1992: middleware de assinatura (se `MERCADOPAGO_WEBHOOK_SECRET`), depois handler que busca por `external_id`/`payment_id`, consulta MP, se `status === 'approved'` faz update para `approved` e credita saldo.

**B) reconcilePendingPayments:**  
- Onde: `server-fly.js` ~2344–2438.  
- Filtro: `.in('status', ['pending', 'pendente'])`, `.lt('created_at', sinceIso)` com `sinceIso = now - maxAgeMin * 60 * 1000`, `maxAgeMin = parseInt(process.env.MP_RECONCILE_MIN_AGE_MIN || '2', 10)`, limit 10, order `created_at` asc.  
- Frequência: `setInterval(reconcilePendingPayments, Math.max(30000, intervalMs))` com `intervalMs = parseInt(process.env.MP_RECONCILE_INTERVAL_MS || '60000', 10)` (~60 s).  
- Só roda se `MP_RECONCILE_ENABLED !== 'false'`; ao subir, loga `🕒 [RECON] Reconciliação de PIX pendentes ativa a cada Xs`.

**C) Campos atualizados quando MP confirma:**  
No webhook e no reconciler: `status` → `'approved'`, `updated_at` → `new Date().toISOString()`. Não há campo `approved_at` nem `provider_status` na tabela no código; saldo é atualizado em `usuarios.saldo`.

**D) Validação do webhook:**  
`utils/webhook-signature-validator.js`: usa `MERCADOPAGO_WEBHOOK_SECRET`, headers `x-signature` e `x-timestamp`. Payload para hash: `req.rawBody` (se existir) ou `JSON.stringify(req.body)`. Em `server-fly.js` (linhas 317–325) o `express.json` tem `verify` que guarda `req.rawBody`. Em produção, se a assinatura for inválida, responde 401.

**E) Provider depósito:** Mercado Pago; endpoint de criação `POST https://api.mercadopago.com/v1/payments` com `payment_method_id: 'pix'`; retorno com `point_of_interaction.transaction_data.qr_code`; não usa preferences; `external_reference` no payload é `goldeouro_${userId}_${Date.now()}` (não persistido na tabela no código auditado; tabela tem `payment_id` e `external_id`).

**Fluxo esperado do depósito:**

| Etapa | Descrição |
|-------|-----------|
| 1 | Cliente chama POST `/api/payments/pix/criar` com `amount` (ex.: 10). |
| 2 | Backend chama MP `/v1/payments`, recebe `payment.id` e QR; insere em `pagamentos_pix` com `status: 'pending'`, `payment_id` e `external_id` = `payment.id`. |
| 3 | Usuário paga PIX no app do banco/MP. |
| 4 | MP envia POST para `notification_url` (`/api/payments/webhook`) **ou** o reconciler, a cada ~60 s, busca pendentes com mais de 2 min e consulta MP por `payment_id`. |
| 5 | Se status no MP = approved: update `pagamentos_pix` para `approved` e incremento de `usuarios.saldo`. |
| 6 | GET `/api/payments/pix/usuario` (e UI `/pagamentos`) passa a mostrar o item como aprovado. |

**Checagem de regressão silenciosa:**  
- INSERT em `pagamentos_pix` grava `status: 'pending'` (linha ~1826).  
- `reconcilePendingPayments` usa `.in('status', ['pending', 'pendente'])` (linha ~2359).  
- Webhook de depósito está na rota `/api/payments/webhook`; assinatura só é exigida se `MERCADOPAGO_WEBHOOK_SECRET` estiver definido; em produção, invalidez da assinatura retorna 401.

---

## FASE 2 — Auditoria DB (pagamentos_pix) com amostra real (READ-ONLY)

Consulta executada **localmente** com script READ-ONLY (`scripts/audit-pagamentos-pix-query-readonly.js`) usando `.env` (mesmo Supabase de produção), sem escrita.

**PAYMENTS_LAST_20 (resumo):**  
Últimos 20 registros ordenados por `created_at` desc. Incluem vários com `status: pending` e um com `status: approved` (ex.: `a339b2c8-...` e `53f2bea8-...`).

**PAYMENTS_AMOUNT_10_MATCHES (candidatos R$ 10):**  
Múltiplos registros com `amount`/`valor` 10; o **candidato do depósito de hoje** é:

- **id:** `87ee8545-e56d-4978-85d0-d0bd22240eeb`
- **usuario_id:** `4ddf8330-ae94-4e92-a010-bdc7fa254ad5`
- **status:** `pending`
- **amount / valor:** 10
- **created_at:** `2026-03-03T20:32:29.162628+00:00`
- **updated_at:** `2026-03-03T20:32:29.162628+00:00` (inalterado desde criação)
- **payment_id / external_id:** `148697499270`

Outros com amount 10 e `pending` (mesmo usuário): vários em 2026-02-28, 2026-02-04, 2026-02-03, 2026-01-29. Todos os listados têm `payment_id` e `external_id` preenchidos.

**Coluna webhook_received_at / last_webhook_at:** Não existe na tabela no esquema usado pelo código (apenas `created_at`, `updated_at`).

---

## FASE 3 — Auditoria webhook (depósito) (READ-ONLY)

Nos logs do Fly (app e worker) **não há** entradas para `/api/payments/webhook` nem mensagens de validação de assinatura ou update de `pagamentos_pix` por webhook.

O código do webhook loga:  
- `📨 [WEBHOOK] PIX recebido:` (tipo e data);  
- em falha de assinatura: `❌ [WEBHOOK] Signature inválida:`;  
- em sucesso de claim: `💰 [WEBHOOK] Claim ganhou: pagamento aprovado e saldo creditado:`.

**Conclusão:** **Observabilidade insuficiente** para afirmar se o webhook está sendo chamado. Recomendação (apenas proposta): logar no início do handler (após responder 200) uma linha com tipo de evento e presence/resultado da validação de assinatura (sem corpo completo), e em caso de 401 o motivo (ex.: “signature invalid”).

Se `MERCADOPAGO_WEBHOOK_SECRET` estiver definido no Fly e o MP enviar com outro secret ou sem os headers corretos, as requisições receberiam 401 e o pagamento não seria atualizado.

---

## FASE 4 — Auditoria reconcile de depósitos (READ-ONLY)

**Onde é executado:** `reconcilePendingPayments` é chamado por **setInterval no processo app** (`server-fly.js` ~2443–2446), **não** no payout_worker. O payout_worker chama `processPendingWithdrawals` e `reconcileProcessingWithdrawals` (saques), não o reconciler de depósitos PIX.

**Frequência e condições:** A cada `Math.max(30000, MP_RECONCILE_INTERVAL_MS)` ms (default 60 s); só se `MP_RECONCILE_ENABLED !== 'false'`. Filtro: `status in ('pending','pendente')`, `created_at < now - 2 min` (default `MP_RECONCILE_MIN_AGE_MIN`), limit 10. Correlação com MP por `external_id` ou `payment_id` (ambos usados no código).

**Logs:** Não foi encontrada nenhuma linha `[RECON]` nos logs recentes. O código só loga quando há erro, quando chama MP ou quando faz claim (ex.: `✅ [RECON] Claim ganhou`). Se a lista de pendentes vier vazia ou se todos os consultados no MP retornarem status diferente de `approved`, não há log. **Não é possível provar execução do reconciler apenas por logs;** apenas por leitura do código (setInterval ativo no boot da app).

---

## FASE 5 — Auditoria Mercado Pago (READ-ONLY “ponte”)

Para o depósito candidato (R$ 10, id `87ee8545-...`):  
- **payment_id / external_id:** `148697499270` — **presentes**.  
- O código usa esse ID para: (1) no webhook, buscar registro por `external_id` ou `payment_id` e depois GET `https://api.mercadopago.com/v1/payments/${paymentId}`; (2) no reconciler, GET no mesmo endpoint. Se o MP retornar `status === 'approved'`, o backend atualiza e credita saldo.

**Conclusão:** Não é caso de “registro local sem payment_id”. A criação do PIX persiste o retorno do MP (`payment.id`) em `payment_id` e `external_id` (server-fly.js ~1832–1834).

---

## FASE 6 — Auditoria saques PIX, saldos, premiações (READ-ONLY)

**A) Saques (tabela saques):**  
Consulta READ-ONLY retornou últimos 20 saques. Amostra: 1 com status `rejeitado` (valor 10, 2026-03-01), 2 com `cancelado` (2025-11). Nenhum com status “open” (pendente/processando) nos últimos 20.

**B) Worker (payout_worker):**  
`src/workers/payout-worker.js`: usa `processPendingWithdrawals` e `reconcileProcessingWithdrawals` (saques), intervalos por env; **não** executa `reconcilePendingPayments` (depósitos). Logs mostram ciclos regulares sem erros Supabase/MP.

**C) Saldos / Ledger:**  
- **Depósito aprovado:** em server-fly.js (webhook e reconciler), após update para `approved` em `pagamentos_pix`, lê `usuarios.saldo`, soma o valor do PIX e faz update em `usuarios`.  
- **Saque:** em server-fly.js (rota de saque), débito em `usuarios.saldo` e chamada a `createLedgerEntry` para débito e taxa; em `processPendingWithdrawals.js` e no webhook de payout, ledger com `correlation_id` para idempotência.  
- **Ledger:** tabela `ledger_financeiro`; `createLedgerEntry` em `src/domain/payout/processPendingWithdrawals.js` verifica por `correlation_id` + `tipo` + `referencia` antes de inserir (dedup).

**D) Premiações / jogo:**  
Em server-fly.js, rota de chute: cálculo de `premio` e `premioGolDeOuro`, persistência em tabela `chutes`; ajuste de saldo do vencedor (`novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`); gatilhos de banco citados no código para métricas/saldo. Premiação usa o mesmo saldo (`usuarios.saldo`) que o fluxo financeiro.

---

## FASE 7 — Diagnóstico e veredito

**1) Causa raiz mais provável (uma categoria):**

- **(1) Webhook não chega** — URL incorreta no painel MP, ou MP não consegue alcançar o backend (DNS/firewall), ou webhook desativado/notificação não enviada.  
**ou**  
- **(2) Webhook chega mas falha validação/assinatura** — `MERCADOPAGO_WEBHOOK_SECRET` configurado no Fly e assinatura/headers do MP não conferem, resultando em 401.

**Alternativa plausível:**  
- **(3)** No Mercado Pago o pagamento **ainda está pendente** (usuário não finalizou o PIX). Nesse caso, nem o webhook (quando for disparado) nem o reconciler alterariam o status até o MP reportar approved.

**(4) Reconciler não roda / não encontra registro** — Menos provável: o código está ativo no app e há vários pendentes com mais de 2 min; mas não há log que prove execução.  
**(5) Registro sem payment_id** — **Eliminada** (todos os registros consultados têm `payment_id` e `external_id`).  
**(6) UI/cache** — Possível apenas se o backend já retornar approved e a UI estiver desatualizada; aqui o DB ainda está `pending`, então não é o caso.

**2) Plano de correção mínima (somente proposta, não aplicada):**

1. **Webhook:** Confirmar no painel Mercado Pago que a URL de notificação é exatamente `https://goldeouro-backend-v2.fly.dev/api/payments/webhook` e que o secret configurado lá é o mesmo valor de `MERCADOPAGO_WEBHOOK_SECRET` no app (se usar assinatura).  
2. **Logs mínimos:** (a) No handler do webhook: uma linha por requisição (tipo + “signature_ok”/“signature_invalid”/“missing_secret”); (b) No início de `reconcilePendingPayments`: uma linha por ciclo com a quantidade de pendentes encontrados (ex.: “RECON ciclo, N pendentes”). Sem logar corpo completo nem dados sensíveis.  
3. **Reconciler:** Opcional — reduzir `MP_RECONCILE_MIN_AGE_MIN` para 1 (minuto) para encurtar o atraso até o primeiro processamento, mantendo idempotência.

Garantir zero regressão em `/game` e saques: alterações apenas em webhook (logs) e em variáveis de config do reconciler (opcional).

**3) Checklist GO/NO-GO por módulo:**

| Subsistema        | Veredito | Motivo |
|-------------------|----------|--------|
| Depósito PIX      | **NO-GO** | Vários pendentes com payment_id válido não evoluem; webhook/reconciler sem evidência de processamento nos logs. |
| Saques PIX        | **GO**   | Worker ativo, ciclos normais, sem erros; últimos saques com status final. |
| Saldos/Ledger     | **GO**   | Crédito por depósito aprovado e débito por saque implementados; ledger com idempotência por correlation_id. |
| Premiações        | **GO**   | Prêmio e saldo no jogo em server-fly.js; integração com chutes e saldo. |
| Observabilidade   | **NO-GO** | Falta log mínimo no webhook (entrada + assinatura) e no ciclo do reconciler de depósitos. |

---

**Declaração:** Nenhuma alteração de código em produção, deploy, secrets, restart ou escrita direta no banco foi realizada. Foi usado apenas script READ-ONLY local para consulta ao Supabase e comandos de inspeção no Fly.
