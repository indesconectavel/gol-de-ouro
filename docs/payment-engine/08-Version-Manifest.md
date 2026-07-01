# Indesconectável Payment Engine™ — Version Manifest

---

## Identificação

| Campo | Valor |
|-------|-------|
| **Produto** | Indesconectável Payment Engine™ |
| **Versão** | V1 CERTIFICADA |
| **Status** | Production Certified |
| **Data de congelamento** | 2026-07-01 |
| **Tag Git** | `payment-engine-v1-certified` |
| **Alias** | `ipe-v1-certified` |
| **Commit** | `eab1d74` |
| **Branch** | `chore/f2-4e-2-mp-log` |
| **Base de certificação** | P1.9 PASS |
| **Base de productização** | P2.0A PASS |
| **Release de congelamento** | P2.0B |

---

## Ambiente Certificado

| Campo | Valor |
|-------|-------|
| **Cliente V1** | Gol de Ouro™ Produção |
| **App Fly.io** | `goldeouro-backend-v2` |
| **Release Fly certificada** | v536 |
| **Entry point** | `server-fly.js` |
| **Módulo Engine** | `src/finance/` |
| **Banco** | Supabase PostgreSQL (produção) |

---

## Componentes Certificados

| Componente | Status | Evidência |
|------------|:------:|-----------|
| Wallet | ✅ | `usuarios.saldo` + RPC `claim_and_credit_approved_pix_deposit` |
| Ledger | ✅ | `ledger_financeiro` imutável, UNIQUE `(correlation_id, tipo, referencia)` |
| PIX IN | ✅ | Mercado Pago + Asaas via `FinanceProviderFactory` |
| PIX OUT | ✅ | Asaas `POST /v3/transfers` homologado P1.7 |
| Recovery | ✅ | `asaasPayoutRecovery.js` — P1.8/P1.9 comprovado em produção |
| Reconciliation | ✅ | MP reconcile + Asaas payout recovery (scheduler inline) |
| Scheduler | ✅ | `server-fly.js` intervals + `payout-worker.js` |
| Provider Layer | ✅ | `PaymentProvider` + `PayoutProvider` + Factory |
| Webhooks | ✅ | MP IN, Asaas IN/OUT, transfer authorization P1.6 |
| Idempotência | ✅ | Ledger dedup + claim RPC + webhook guards |
| Compat Layer | ✅ | `*Compat.js` — ponte monólito → factory |
| Config / Gates | ✅ | `primary-psp.js`, feature flags explícitas |
| Audit Layer | ✅ | `ledger_financeiro`, `admin_logs`, `financeLog()` |

---

## Providers Certificados

| Provider | PIX IN | PIX OUT | Produção |
|----------|:------:|:-------:|:--------:|
| Asaas | ✅ | ✅ | Homologado |
| Mercado Pago | ✅ | ✅ | PIX IN ativo |
| Mock | ✅ | ✅ | Dev/test only |
| Celcoin | ⚠️ | ⚠️ | Stub (não certificado) |

---

## Documentação da Versão

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 01 | `01-Arquitetura.md` | Arquitetura oficial |
| 02 | `02-Core.md` | Inventário Core × Gol de Ouro |
| 03 | `03-Interfaces.md` | Interfaces públicas |
| 04 | `04-Provider-Layer.md` | Auditoria Provider Layer |
| 05 | `05-Roadmap.md` | Roadmap V1 → V2 |
| 06 | `06-Posicionamento.md` | Identidade institucional |
| 07 | `07-Productization-Report.md` | Relatório P2.0A |
| 08 | `08-Version-Manifest.md` | Este manifesto |
| 09 | `09-Certification-Snapshot.md` | Snapshot de certificação |
| 10 | `10-Architecture-Signature.md` | Assinatura arquitetural |

---

## Garantia GOLD (P1.9)

> A Payment Engine™ V1 sobrevive à perda total de webhooks sem intervenção manual.

**Evidência:** Saque `f3723ce8-a24f-4a4d-ac03-6f8d34bcc0ef` reconciliado automaticamente via Recovery Job em `2026-07-01T01:50:56Z` (Fly v536), sem replay manual.

---

## Imutabilidade

A partir de `payment-engine-v1-certified`, toda evolução ocorre em linhas separadas:

| Linha | Versão | Escopo |
|-------|--------|--------|
| **Congelada** | V1 CERTIFICADA | Patrimônio imutável — este manifesto |
| **Ativa** | V1.1+ | Melhorias, cleanup, parametrização |
| **Futura** | V2.0+ | Multi-tenant, REST pública, SDK |

Alterações na linha V1 CERTIFICADA requerem novo processo de certificação.

---

## Referências de Certificação

| Relatório | Caminho |
|-----------|---------|
| Certificação final | `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` |
| Recovery automático | `docs/relatorios/P1.8-RECONCILIACAO-AUTOMATICA-PIXOUT.md` |
| Homologação PIX OUT | `docs/relatorios/P1.7-HOMOLOGACAO-FINAL-PIXOUT.md` |
| Productização | `docs/payment-engine/07-Productization-Report.md` |
| Congelamento | `docs/relatorios/P2.0B-CONGELAMENTO-OFICIAL-V1.md` |

---

*Indesconectável Payment Engine™ V1 CERTIFICADA — Version Manifest*
