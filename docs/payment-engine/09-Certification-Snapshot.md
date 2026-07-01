# Indesconectável Payment Engine™ — Certification Snapshot

**Versão:** V1 CERTIFICADA  
**Data do snapshot:** 2026-07-01  
**Tag:** `payment-engine-v1-certified`

---

## 1. Identificação da Release

| Campo | Valor |
|-------|-------|
| Produto | Indesconectável Payment Engine™ |
| Versão | V1 CERTIFICADA |
| Status | Production Certified |
| Certificação | P1.9 PASS |
| Productização | P2.0A PASS |
| Congelamento | P2.0B |
| App produção | `goldeouro-backend-v2` (Fly.io) |
| Release Fly | v536 |
| Commit | `eb299d5` |
| Branch | `chore/f2-4e-2-mp-log` |
| Tag | `payment-engine-v1-certified` / `ipe-v1-certified` |

---

## 2. Arquitetura Certificada

```text
PIX IN (Mercado Pago | Asaas)
    │
    ▼
Wallet (usuarios.saldo)
    │
    ▼
Ledger (ledger_financeiro)
    │
    ▼
Withdraw (saques)
    │
    ▼
approve-and-send / payout-worker
    │
    ▼
FinanceProviderFactory → Asaas POST /v3/transfers
    │
    ├────────────► Webhook /webhooks/asaas (TRANSFER_*)
    │                     │
    │                     ▼
    │              processAsaasTransferWebhook
    │
    └────────────► Recovery Job (P1.8)
                          │
                          ▼
                   GET /v3/transfers/{id}
                          │
                          ▼
                   Reconciliação idempotente
                          │
                          ▼
                   status = processado
                   ledger payout_confirmado
```

### Camadas

```text
server-fly.js + payout-worker.js
    ↓
src/domain/payout/          (ledger, saques, rollback)
src/finance/                (factory, providers, webhooks, reconciliation)
    ↓
services/pix-mercado-pago.js (MP OUT legado)
    ↓
Supabase: usuarios, pagamentos_pix, saques, ledger_financeiro
```

---

## 3. Timeline de Certificação

| Data (UTC) | Marco | Resultado |
|------------|-------|-----------|
| 2026-06-28 | P1.0 — Wire Asaas produção | PASS |
| 2026-06-28 | P1.3 — PIX IN real Asaas | PASS |
| 2026-06-28 | P1.4 — Go-live PIX IN | PASS |
| 2026-06-29 | P1.5 — PIX OUT + webhooks | PASS (ressalvas) |
| 2026-06-29 | P1.6 — Transfer authorization | PASS |
| 2026-06-30 | P1.7 — Homologação PIX OUT final | PASS |
| 2026-06-30 | P1.7C — Auditoria forense (webhook ausente) | Cenário B identificado |
| 2026-06-30 | P1.8 — Recovery Job implementado | PASS |
| 2026-07-01 01:48 | Deploy Fly v536 (P1.8) | Complete |
| 2026-07-01 01:50 | Recovery reconcilia saque stale | Automático |
| 2026-07-01 01:54 | P1.9 — Certificação final | **CERTIFICADA** |
| 2026-07-01 | P2.0A — Productização | PASS |
| 2026-07-01 | P2.0B — Congelamento oficial | Este snapshot |

---

## 4. Principais Homologações

| ID | Escopo | Veredito | Relatório |
|----|--------|----------|-----------|
| P1.0 | Wire webhook Asaas | PASS | `P1.0-HOMOLOGACAO-OPERACIONAL-ASAAS.md` |
| P1.4Z | PIX IN Asaas produção | PASS | `P1.4Z-CERTIFICACAO-FINAL-PIX-IN-ASAAS-PRODUCAO.md` |
| P1.5MASTER | Webhook + PIX OUT | PASS c/ ressalvas | `P1.5MASTER-CERTIFICACAO-FINAL-V1.md` |
| P1.5G | Webhook TRANSFER Asaas | PASS | `P1.5G-WEBHOOK-TRANSFER-ASAAS.md` |
| P1.6Z | Certificação readonly | PASS | `P1.6Z-CERTIFICACAO-FINAL-READONLY.md` |
| P1.7 | Homologação PIX OUT final | PASS | `P1.7-HOMOLOGACAO-FINAL-PIXOUT.md` |
| P1.7C | Forense pós-homologação | Cenário B | `P1.7C-AUDITORIA-FORENSE-POS-HOMOLOGACAO.md` |
| P1.8 | Recovery automático | PASS | `P1.8-RECONCILIACAO-AUTOMATICA-PIXOUT.md` |
| P1.9 | Certificação final Engine | **CERTIFICADA** | `P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` |

---

## 5. Evidência Central (P1.9)

**Saque de referência:** `f3723ce8-a24f-4a4d-ac03-6f8d34bcc0ef`  
**Transfer Asaas:** `5d1355b9-75c8-4be8-b805-a4185e50d9da`  
**Correlation:** `p17a-7690fece-bb6f-42fd-8289-fb7cb1f8721b`

| Estado | Antes (v535) | Depois (v536 + Recovery) |
|--------|--------------|--------------------------|
| status | `aguardando_confirmacao` | `processado` |
| asaas_transfer_status | `PENDING` | `DONE` |
| last_asaas_sync_at | stale (23:47:47Z) | `2026-07-01T01:50:56Z` |
| ledger | saque + taxa | + `payout_confirmado` |

**Conclusão:** Recovery Job idempotente — sem webhook, sem intervenção manual.

---

## 6. Componentes no Snapshot

| Módulo | Arquivo principal |
|--------|-------------------|
| Factory | `src/finance/factory/FinanceProviderFactory.js` |
| PIX IN | `src/finance/deposit/createPixDeposit.js` |
| PIX OUT domain | `src/domain/payout/processPendingWithdrawals.js` |
| Webhook IN | `src/finance/webhooks/processPaymentWebhook.js` |
| Webhook TRANSFER | `src/finance/webhooks/processAsaasTransferWebhook.js` |
| Recovery | `src/finance/reconciliation/asaasPayoutRecovery.js` |
| Compat | `src/finance/compat/*.js` |
| Scheduler | `server-fly.js` (intervals) |
| Worker | `src/workers/payout-worker.js` |
| Certificação | `scripts/p19-certification.cjs` |

---

## 7. Endpoints Certificados

| Método | Path | Função |
|--------|------|--------|
| POST | `/api/payments/pix/criar` | Criar depósito PIX |
| GET | `/api/payments/pix/usuario` | Listar depósitos |
| GET | `/api/payments/pix/status` | Status + sync |
| POST | `/api/payments/webhook` | Webhook MP depósito |
| POST | `/api/withdraw/request` | Solicitar saque |
| GET | `/api/withdraw/history` | Histórico saques |
| POST | `/webhooks/asaas` | Webhook Asaas |
| POST | `/webhooks/asaas/transfer-validation` | Autorização transfer |
| POST | `/webhooks/mercadopago` | Webhook MP payout |
| GET | `/health` | Health check |

---

## 8. Documentação do Snapshot

| Documento | Caminho |
|-----------|---------|
| Arquitetura | `docs/payment-engine/01-Arquitetura.md` |
| Core | `docs/payment-engine/02-Core.md` |
| Interfaces | `docs/payment-engine/03-Interfaces.md` |
| Provider Layer | `docs/payment-engine/04-Provider-Layer.md` |
| Roadmap | `docs/payment-engine/05-Roadmap.md` |
| Posicionamento | `docs/payment-engine/06-Posicionamento.md` |
| Productização P2.0A | `docs/payment-engine/07-Productization-Report.md` |
| Manifesto | `docs/payment-engine/08-Version-Manifest.md` |
| Assinatura | `docs/payment-engine/10-Architecture-Signature.md` |
| Changelog | `CHANGELOG_PAYMENT_ENGINE.md` |
| Arquitetura V1 legado | `docs/arquitetura/PAYMENT-ENGINE-V1.md` |

---

## 9. Garantias Registradas

| Garantia | Evidência |
|----------|-----------|
| PIX IN operacional em produção | Health MP connected; reconcile ativo |
| PIX OUT homologado Asaas | Transfer DONE P1.7 |
| Recovery sem webhook | P1.9 saque reconciliado automaticamente |
| Idempotência | Ledger 3 entradas estáveis em leituras repetidas |
| Multi-provider | Factory resolve Asaas + MP |
| Auditabilidade | Ledger imutável com correlation IDs |

---

*Indesconectável Payment Engine™ V1 CERTIFICADA — Certification Snapshot*
