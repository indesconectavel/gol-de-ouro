# BLOCO A — FINANCEIRO

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Backend** | server-fly.js (POST /api/payments/pix/criar, POST /api/payments/webhook, POST /api/withdraw/request, GET /api/withdraw/history, POST /webhooks/mercadopago; reconcilePendingPayments), src/domain/payout/processPendingWithdrawals.js, src/domain/payout/withdrawalStatus.js, src/workers/payout-worker.js, services/pix-mercado-pago.js, utils/pix-validator.js, utils/webhook-signature-validator.js, config/required-env.js, database/supabase-unified-config.js |
| **Frontend** | Pagamentos.jsx (paymentService, PIX criar), Withdraw.jsx (withdrawService.requestWithdraw, history), api.js (PIX_CREATE, PIX_USER, WITHDRAW) |
| **Documentação** | AUDITORIA-BLOCO-A-FINANCEIRO-READONLY-2026-03-07.md |

---

## 2. Fonte de verdade do bloco

- **Produção:** server-fly.js é o entrypoint; rotas financeiras inline (não monta paymentRoutes.js nem mpWebhook.js). Payout worker: process group payout_worker no Fly (payout-worker.js), condicionado a ENABLE_PIX_PAYOUT_WORKER e PAYOUT_PIX_ENABLED.
- **Depósito:** POST /api/payments/pix/criar (JWT); webhook /api/payments/webhook; reconciliação por setInterval; crédito em usuarios.saldo (claim atômico); sem insert em ledger para depósito.
- **Saque:** POST /api/withdraw/request (JWT); débito saldo + insert saques + createLedgerEntry withdraw_request; worker processa e chama createPixWithdraw; webhook /webhooks/mercadopago atualiza status e ledger (payout_confirmado / falha_payout + rollback).

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| Rotas reais | AUDITORIA-BLOCO-A-FINANCEIRO-READONLY-2026-03-07, seção 2 |
| Fluxo saldo depósito/saque | server-fly.js (webhook, request, rollbackWithdraw); processPendingWithdrawals.js |
| Ledger | createLedgerEntry: withdraw_request, payout_confirmado, falha_payout, rollback; fallback user_id/usuario_id |
| Frontend Pagamentos | Pagamentos.jsx → apiClient.post(PIX_CREATE); paymentService |
| Frontend Withdraw | Withdraw.jsx → withdrawService.requestWithdraw; GET withdraw/history |
| Base URL produção | https://goldeouro-backend-v2.fly.dev |

---

## 4. Alinhamento com baseline validada

**Resposta:** **parcial**

- Backend financeiro é o mesmo servidor para baseline e produção atual; rotas e fluxo não dependem do deployment do frontend. O **frontend** da baseline (FyKKeg6zb) usava os mesmos endpoints (PIX criar, withdraw request/history) na documentação de fluxo (DIFF-PR29-vs-FyKKeg6zb, REVISAO-GERAL-V1-FINANCEIRO). Não há documento que compare linha a linha os componentes Pagamentos/Withdraw do bundle index-qIGutT6K.js com o local.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Produção atual (ez1oc96t1) é build do código local. Telas Pagamentos e Withdraw usam API_ENDPOINTS e services atuais. Backend é único. Saque local e saque em produção atual usam o mesmo fluxo (request → worker → webhook).

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Funcional** | Depósito aprovado não gera linha em ledger_financeiro (apenas usuarios.saldo + pagamentos_pix). Documentado como pendência no BLOCO A. |
| **Ambiente** | Worker de payout depende de ENABLE_PIX_PAYOUT_WORKER e PAYOUT_PIX_ENABLED; se desativados, saques ficam pendentes. |
| **Legado** | routes/paymentRoutes.js, controllers/paymentController.js, mpWebhook.js não são usados em produção (server-fly inline). |
| **Não deployado** | Nenhum bloco financeiro “não deployado” identificado; local = build atual. |

---

## 7. Risco operacional

**Classificação:** **médio**

- Riscos documentados: worker desabilitado por env; dois tokens MP (deposit vs payout); webhook depósito sem secret opcional; dependência de schema Supabase (user_id vs usuario_id). Nenhum risco novo identificado nesta auditoria por blocos.

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim**

- Fluxo financeiro (depósito PIX, saque, histórico, ledger de saque, worker) está mapeado e alinhado à produção atual. Local pode ser usado para validar telas de Pagamentos e Withdraw e endpoints. Ressalva: conferir env do worker em produção e URL do webhook de payout no painel MP.

---

## 9. Exceções que precisam ser registradas

1. **Ledger sem depósito:** Depósito aprovado não insere em ledger_financeiro; reconciliação contábil completa exige pagamentos_pix + chutes + usuarios + ledger (saque).
2. **Worker por env:** Saques só processam se ENABLE_PIX_PAYOUT_WORKER e PAYOUT_PIX_ENABLED estiverem true.
3. **Webhook payout:** Garantir URL https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago configurada no Mercado Pago para transfers.

---

## 10. Classificação final do bloco

**BLOCO ALINHADO**

- Alinhado com **produção atual** (sim). Alinhado com **baseline** (parcial — backend sim; frontend não comparado linha a linha). Pode usar local como referência para o bloco financeiro com exceções documentadas (ledger depósito, env worker, webhook).

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
