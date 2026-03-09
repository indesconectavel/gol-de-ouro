# Auditoria financeira master V308 — 2026-03-03 (READ-ONLY)

**Modo:** READ-ONLY ABSOLUTO. Nenhuma alteração de código, secrets, deploy, restart, escrita direta no banco ou migrações.

**Contexto crítico:** Operador confirma que o PIX de R$ 10 (03/03/2026 17:32:29 BRT) foi **pago** (valor saiu da conta bancária e entrou no Mercado Pago). No GoldeOuro o depósito continua como **pending**. Se o MP estiver **approved**, o backend está falhando em refletir a aprovação.

---

## Snapshot infra

| Item | Valor |
|------|--------|
| App | goldeouro-backend-v2.fly.dev |
| Imagem | goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH |
| **APP_HEALTHY_ID** | `2874551a105768` (app, 1/1 passing, started) |
| App stopped | `e82d445ae76178` (0/1, warning) — causa: ADMIN_TOKEN inválido no boot |
| **WORKER_ID** | `e82794da791108` (payout_worker, started) |

---

## FASE 1 — Prova do status no MP

**Objetivo:** GET `https://api.mercadopago.com/v1/payments/148697499270` a partir do container (APP_HEALTHY_ID), usando `process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`.

**Execução:** A consulta a partir do container **não foi possível** nesta sessão devido à limitação de quoting do PowerShell ao passar um script Node inline para `flyctl ssh console -C "..."`. A tentativa de consulta **local** com token do `.env` retornou **HTTP 401** (não autorizado), portanto o status real no MP **não foi obtido** nesta auditoria.

**Registro (quando a consulta for feita com token de produção):**

- **httpStatus:** (a preencher)
- **id, status, status_detail, transaction_amount, date_created, date_approved, external_reference, payer.email:** (a preencher)

**Conclusão automática (quando houver resposta do MP):**

- Se **status === approved** → Backend não refletiu (webhook ou reconciler não atualizaram).
- Se **status === pending** → MP ainda não confirmou compensação.
- Se outro status → registrar (cancelled, rejected, expired, etc.).

**Para esta auditoria:** Dado o relato do operador (PIX pago) e o registro no DB ainda **pending**, a **hipótese de trabalho** é que o MP esteja **approved** e o backend não tenha atualizado (falha de webhook ou reconciler).

---

## FASE 2 — Webhook de depósito

**2.1) Logs (app):** Nos logs do Fly coletados (`flyctl logs --no-tail`), filtro por: `/api/payments/webhook`, mercadopago, signature, invalid, 401, 403, update pagamentos_pix, approved. **Resultado:** **Nenhuma linha encontrada** referente ao webhook de depósito na app (2874551a105768). **Conclusão:** **Ausência total de evidência de webhook** nos trechos de log analisados (nem entrada, nem validação, nem update).

**2.2) Código — validação da assinatura:**

- **Arquivo:** `server-fly.js` (linhas 1992–2011). Rota `POST /api/payments/webhook`. Se `process.env.MERCADOPAGO_WEBHOOK_SECRET` estiver definido, chama `webhookSignatureValidator.validateMercadoPagoWebhook(req)`. Se `!validation.valid`, em **produção** responde **401** com `error: 'Webhook signature inválida'`.
- **Validador:** `utils/webhook-signature-validator.js`. Usa `this.secret = process.env.MERCADOPAGO_WEBHOOK_SECRET`; exige header `x-signature`; payload para hash é `req.rawBody` (se existir) ou `JSON.stringify(req.body)`. Comparação com `crypto.timingSafeEqual`. Se o header não bater ou o secret estiver errado, retorna `valid: false` → webhook retorna 401 e **não** atualiza `pagamentos_pix`.

**Resumo:** O webhook **depende** de `MERCADOPAGO_WEBHOOK_SECRET` quando configurado; em produção rejeita com 401 se a assinatura falhar. Não há log de que o webhook tenha sido chamado ou processado.

---

## FASE 3 — Reconciler de depósitos

**3.1) Código:**

- **Função:** `server-fly.js`, `reconcilePendingPayments` (a partir da linha 2344). Lista `pagamentos_pix` com `.in('status', ['pending', 'pendente'])`, `.lt('created_at', sinceIso)` (registros com mais de 2 min), limit 10. Para cada pendente, usa `mpId = external_id || payment_id` (numérico), chama `GET https://api.mercadopago.com/v1/payments/${paymentId}` com `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`; se `status === 'approved'`, faz update em `pagamentos_pix` e incrementa `usuarios.saldo`.
- **Agendamento:** Linhas 2441–2446: `if (process.env.MP_RECONCILE_ENABLED !== 'false') { setInterval(reconcilePendingPayments, Math.max(30000, intervalMs)); }` com `intervalMs = MP_RECONCILE_INTERVAL_MS || 60000`. **Conclusão:** O reconciler **está agendado** no processo app (app healthy); roda a cada 60 s (default).

**3.2) Logs:** Busca por reconcilePendingPayments, paymentId, "updated to approved", "erro update", **[RECON]**. **Resultado:** Nos trechos coletados **não há** linhas `[RECON]` da app (apenas logs do payout_worker). O código do reconciler só loga em erros ou quando faz claim (`✅ [RECON] Claim ganhou`); se não houver pendentes processados, não gera log. **Conclusão:** Não é possível **provar por logs** que o reconciler está executando ou processando; apenas que está **agendado** no código.

**3.3) Evidência DB — registro continua pending:** Consulta READ-ONLY ao Supabase para o id `87ee8545-e56d-4978-85d0-d0bd22240eeb`:

```json
{"id":"87ee8545-e56d-4978-85d0-d0bd22240eeb","status":"pending","amount":10,"payment_id":"148697499270","created_at":"2026-03-03T20:32:29.162628+00:00","updated_at":"2026-03-03T20:32:29.162628+00:00"}
```

**Conclusão:** O registro **continua pending**; `updated_at` igual a `created_at` (nunca foi atualizado). Portanto nem webhook nem reconciler (até o momento da auditoria) atualizaram este pagamento para approved.

---

## FASE 4 — Ledger / Saldos

**4.1) Tabelas:** Saldo do usuário em `usuarios.saldo`. Ledger em `ledger_financeiro` (usado em saques e confirmação de payout).

**4.2) Onde o saldo é incrementado após depósito aprovado:**

- **Webhook** (`server-fly.js` ~2070–2120): Após update `pagamentos_pix` para `approved`, busca `usuarios.saldo`, soma o valor do PIX e faz `update({ saldo: novoSaldo })` em `usuarios`.
- **Reconciler** (`server-fly.js` ~2392–2426): Após update `pagamentos_pix` para `approved` (por id do registro), busca `usuarios.saldo` e atualiza da mesma forma.

**Conclusão:** O incremento de saldo **depende** exclusivamente de webhook ou reconciler terem atualizado o registro em `pagamentos_pix` para `approved`. Não há outro caminho no código auditado.

**4.3) Idempotência:** No webhook, verificação `existingPayment.status === 'approved'` evita reprocessar. No reconciler, update com `.neq('status', 'approved')` e `select` para garantir uma única linha afetada (claim atômico). Ledger em saques: `createLedgerEntry` em `processPendingWithdrawals.js` verifica por `correlation_id` + `tipo` + `referencia` antes de inserir (dedup).

---

## FASE 5 — Saques PIX

**5.1) Worker ativo:** Logs mostram ciclos regulares do payout_worker (e82794da791108): "Início do ciclo", "Nenhum saque pendente", "Resumo { payouts_sucesso: 0, payouts_falha: 0 }", "Fim do ciclo". Sem erros Supabase/MP nos trechos coletados.

**5.2) Código:** `src/workers/payout-worker.js` — chama `processPendingWithdrawals` em cada ciclo e `reconcileProcessingWithdrawals` em intervalo separado (`setInterval(runReconcileCycle, reconcileIntervalMs)`). `updateSaqueStatus` em `processPendingWithdrawals.js` atualiza status do saque com optional `onlyWhenStatus` para concorrência.

**5.3) Saques presos:** Nos logs não há indicação de saques em processamento travados; worker reporta "Nenhum saque pendente". **Conclusão:** Worker de payout ativo; reconcileProcessingWithdrawals agendado; sem evidência de saques presos nos dados desta auditoria.

---

## FASE 6 — Diagnóstico final

**Categorias avaliadas:**

| # | Categoria | Evidência | Conclusão |
|---|-----------|-----------|-----------|
| (1) Webhook não chega | Nenhum log de /api/payments/webhook, 📨 [WEBHOOK], signature, 401 | **Provável** — URL no painel MP, rede ou MP não disparando. |
| (2) Webhook chega mas falha assinatura | Código: em produção retorna 401 se MERCADOPAGO_WEBHOOK_SECRET e signature inválida | **Possível** — se secret no Fly ≠ secret no painel MP. |
| (3) Reconciler não roda | setInterval presente no código da app; nenhum log [RECON] | Não descartado; sem prova por log. |
| (4) Reconciler roda mas não atualiza DB | Registro 87ee8545... continua pending; mpId numérico (148697499270) | Se reconciler rodasse e MP retornasse approved, deveria atualizar. |
| (5) Update DB falha silenciosamente | Código loga erro em claimErr/saldoErr; não há log de falha nos trechos vistos | Menos provável como causa única. |
| (6) Token de depósito incorreto | App healthy sobe; token usado em criar PIX; consulta local 401 | Possível em ambiente de auditoria; em prod o token é o do container. |
| (7) Problema no MP | Operador confirma pagamento | Improvável como causa (valor entrou no MP). |

**Causa raiz provável (uma principal):** **(1) Webhook não chega** — ausência total de evidência de chamada ao webhook nos logs; se o MP não notificar o backend ou a URL estiver incorreta, o backend nunca recebe o evento e não atualiza. **Alternativa forte:** **(2) Webhook chega mas falha assinatura** — se `MERCADOPAGO_WEBHOOK_SECRET` estiver definido no Fly e o MP enviar com outro secret ou formato, o backend responde 401 e não processa.

**Nível de severidade:** **Alto** — depósito pago pelo usuário não refletido no sistema; impacto em confiança e suporte; único app healthy (single point of failure) e segunda máquina parada por ADMIN_TOKEN.

---

## Plano de correção mínima (máx. 3 ações)

1. **Webhook:** Confirmar no painel Mercado Pago que a URL de notificação de pagamento é exatamente `https://goldeouro-backend-v2.fly.dev/api/payments/webhook` e que o secret configurado (se usado) corresponde a `MERCADOPAGO_WEBHOOK_SECRET` no Fly. Corrigir URL ou secret conforme necessário.
2. **Observabilidade:** Incluir log mínimo no handler do webhook (após responder 200): uma linha por requisição com tipo de evento e resultado da validação de assinatura (ok/invalid/missing). Incluir no início de cada ciclo de `reconcilePendingPayments` um log com a quantidade de registros pendentes encontrados (ex.: `[RECON] ciclo N pendentes`), sem dados sensíveis.
3. **Reconciler:** Manter ativo (MP_RECONCILE_ENABLED !== 'false'). Opcional: reduzir `MP_RECONCILE_MIN_AGE_MIN` para 1 minuto para encurtar a janela até o primeiro processamento, mantendo idempotência.

---

## Checklist GO/NO-GO

| Subsistema | Veredito | Motivo |
|------------|----------|--------|
| **Depósito PIX** | **NO-GO** | Depósito pago (relato do operador) permanece pending no DB/UI; sem evidência de webhook; reconciler agendado mas registro não atualizado. |
| **Saques PIX** | **GO** | Worker ativo; ciclos normais; reconcileProcessingWithdrawals agendado; sem saques presos nos logs. |
| **Ledger/Saldos** | **GO** | Lógica de crédito (webhook/reconciler) e débito (saque) presente; idempotência por correlation_id no ledger. |
| **Premiações** | **GO** | Prêmio e ajuste de saldo no jogo em server-fly.js (chutes, lotes); integração com usuarios.saldo. |
| **Observabilidade** | **NO-GO** | Ausência de log de webhook e de ciclo do reconciler de depósitos; impossível afirmar execução só por logs. |

---

## Declaração formal

**Nenhuma alteração de código, deploy, secrets ou restart foi feita.** Apenas leitura de código, consultas READ-ONLY ao banco (Supabase), coleta de logs do Fly e tentativa de consulta à API do Mercado Pago (sem sucesso por limitação de ambiente). Este relatório consolida as fases 1 a 6 da auditoria financeira master V308.
