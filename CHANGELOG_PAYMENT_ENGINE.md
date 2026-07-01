# Changelog — Indesconectável Payment Engine™

Todas as mudanças notáveis deste produto são documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [V1 CERTIFICADA] — 2026-07-01

### Status

**Production Certified** — congelamento oficial via P2.0B.  
Tag: `payment-engine-v1-certified`

### Resumo Executivo

A Indesconectável Payment Engine™ V1 é a primeira versão certificada em produção do motor financeiro PIX do ecossistema Indesconectável™. Originada no Gol de Ouro™ V1, a Engine abstrai depósitos (PIX IN), saques (PIX OUT), wallet, ledger, webhooks, reconciliação e recovery sobre múltiplos PSPs.

A certificação P1.9 comprovou operação contínua com Recovery Job automático — a Engine sobrevive à perda total de webhooks. A productização P2.0A formalizou a separação como produto independente. O congelamento P2.0B estabelece esta versão como linha-base imutável.

### Componentes Entregues

- Wallet operacional (`usuarios.saldo` + RPC atômica)
- Ledger imutável (`ledger_financeiro`)
- PIX IN multi-provider (Mercado Pago, Asaas)
- PIX OUT homologado (Asaas transfers)
- Webhook Engine (MP + Asaas PAYMENT + TRANSFER)
- Transfer Authorization (Asaas P1.6)
- Recovery Job automático (P1.8)
- Reconciliação automática PIX IN/OUT
- Idempotência estrutural (ledger + claim + webhook guards)
- Provider Factory (`FinanceProviderFactory`)
- Scheduler (MP reconcile + Asaas recovery + payout worker)
- Compat Layer (ponte monólito → factory)
- Documentação completa (`docs/payment-engine/`)

---

## Marcos de Certificação

### P2.0B — Congelamento Oficial (2026-07-01)

- Tag `payment-engine-v1-certified`
- Manifesto de versão, snapshot, assinatura arquitetural
- Linha-base imutável estabelecida

### P2.0A — Productização (2026-07-01)

- Inventário Core × Gol de Ouro (25 componentes)
- Arquitetura oficial em 5 camadas
- 21 interfaces HTTP mapeadas
- Provider Layer auditada
- Roadmap V1 → V2.1
- Identidade institucional formalizada

### P1.9 — Certificação Final (2026-07-01)

- **VEREDITO: CERTIFICADA**
- Recovery Job reconcilia saque sem webhook (Fly v536)
- Garantia GOLD confirmada
- Runner: `scripts/p19-certification.cjs`

### P1.8 — Reconciliação Automática PIX OUT (2026-06-30)

- `asaasPayoutRecovery.js` implementado
- `runAsaasPayoutRecoveryCycle()` no runtime
- Deploy v536

### P1.7 — Homologação Final PIX OUT (2026-06-30)

- PIX OUT Asaas end-to-end em produção
- Transfer `DONE` comprovado
- Auditoria forense P1.7C (cenário webhook ausente)

### P1.6 — Webhook Authorization Asaas (2026-06-29)

- `POST /webhooks/asaas/transfer-validation`
- Autorização pré-execução de transferências
- Certificação operacional P1.6Z/P1.6ZB

### P1.5 — PIX OUT Asaas + Webhooks Produção (2026-06-29)

- Factory unificada worker + admin (P1.5F)
- Payout provider-aware (P1.5E)
- Webhook TRANSFER Asaas (P1.5G)
- Homologação PIX OUT produção (P1.5Y)
- Certificação master P1.5MASTER

### P1.4 — PIX IN Asaas Produção (2026-06-28)

- Go-live controlado PIX IN real
- Crédito wallet Asaas em produção (P1.4F)
- Certificação final PIX IN (P1.4Z)

### P1.3 — Secrets e Gate Asaas (2026-06-28)

- Configuração `ASAAS_API_KEY` em Fly secrets
- Gate controlado `ASAAS_PRODUCTION_ENABLED`
- PIX IN real Asaas produção (P1.3R)

### P1.2 — Validação Webhook Produção (2026-06-28)

- Webhook Asaas validado em ambiente controlado

### P1.1 — Auditoria Conta Asaas (2026-06-28)

- Auditoria conta produção Asaas
- Reauditoria API produção

### P1.0 — Homologação Operacional Asaas (2026-06-28)

- Wire definitivo `POST /webhooks/asaas`
- Injeção `supabase` + `claimAndCreditApprovedPixDeposit` no compat
- Runbook e checklist operacional
- **PASS** — base para série P1.x

---

## Origem — Pré-P1.0

### F4.x — Payment Engine Architecture (2026-06)

| Fatia | Entrega |
|-------|---------|
| F4.0E-S1 | Contratos `PaymentProvider` + `PayoutProvider` |
| F4.3A-C | Asaas como PSP primário arquitetural |
| F4.4 | PIX IN via factory (`createPixDepositCompat`) |
| F4.5 | Webhook engine (`processPaymentWebhook`) |
| F4.6 | Crédito controlado sandbox |
| F4.7 | E2E sandbox |

### Legado Pré-Engine

- PIX IN Mercado Pago inline no monólito
- Wallet `usuarios.saldo` + ledger `ledger_financeiro`
- Payout via `services/pix-mercado-pago.js`
- Webhooks MP-specific inline

**Cliente de origem:** Gol de Ouro™ V1 (`goldeouro-backend`)

---

## Linhas Evolutivas Futuras

| Versão | Status | Escopo |
|--------|--------|--------|
| V1 CERTIFICADA | ✅ Congelada | Este changelog — tag `payment-engine-v1-certified` |
| V1.1 | Planejada | Cleanup legado, MP consolidation, fee policy |
| V1.2 | Planejada | Repository pattern, router dedicado |
| V2.0 | Planejada | Multi-tenant, REST `/v2/*`, deploy independente |
| V2.1 | Planejada | SDK, licenciamento, marketplace |

---

*Indesconectável Payment Engine™ — Changelog*
