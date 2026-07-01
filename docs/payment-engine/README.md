# Indesconectável Payment Engine™ V1

**Produto:** Indesconectável Payment Engine™ (IPE™)  
**Versão:** V1 CERTIFICADA  
**Titular:** Indesconectável™  
**Cliente de referência:** Gol de Ouro™ V1  
**Tag:** `payment-engine-v1-certified`  
**Baseline código:** `payment-engine-p2.2` (`d188ca6`)

© 2026 Indesconectável™. Todos os direitos reservados.  
Licença: [`LICENSE-PAYMENT-ENGINE.md`](../../LICENSE-PAYMENT-ENGINE.md)

---

## O que é

A **Indesconectável Payment Engine™** é infraestrutura PIX certificada em produção — orquestração de depósitos (PIX IN), saques (PIX OUT), wallet, ledger imutável, webhooks, reconciliação e **recovery automático** sobre múltiplos PSPs.

> *Pagamentos PIX que não param.*

**Categoria:** Payment Infrastructure / PIX Orchestration Platform

---

## Documentação canônica

| # | Documento |
|---|-----------|
| 01 | [Arquitetura](01-Arquitetura.md) |
| 02 | [Core](02-Core.md) |
| 03 | [Interfaces](03-Interfaces.md) |
| 04 | [Provider Layer](04-Provider-Layer.md) |
| 05 | [Roadmap](05-Roadmap.md) |
| 06 | [Posicionamento](06-Posicionamento.md) |
| 07 | [Productization Report](07-Productization-Report.md) |
| 08 | [Version Manifest](08-Version-Manifest.md) |
| 09 | [Certification Snapshot](09-Certification-Snapshot.md) |
| 10 | [Architecture Signature](10-Architecture-Signature.md) |
| 11 | [Hardening](11-Hardening.md) |
| 12 | [Core Decoupling](12-Core-Decoupling.md) |

Aviso legal: [NOTICE.md](NOTICE.md)

---

## Governança e IP

| Artefato | Path |
|----------|------|
| Licença proprietária | `LICENSE-PAYMENT-ENGINE.md` |
| Escopo proprietário | `docs/governance/PROPRIETARY-SCOPE.md` |
| Política copyright | `docs/governance/COPYRIGHT-AND-LICENSE-POLICY.md` |
| Cessão autoral (institucional) | `docs/governance/DECLARACAO-CESAO-AUTORAL-INSTITUCIONAL.md` |
| Uso de marca | `docs/governance/BRAND-AND-TRADEMARK-GUIDELINES.md` |
| Proteção baseline | `docs/governance/BASELINE-PROTECTION-POLICY.md` |
| Due diligence | `docs/data-room/INDICE-DUE-DILIGENCE.md` |

---

## Changelog e certificação

- [`CHANGELOG_PAYMENT_ENGINE.md`](../../CHANGELOG_PAYMENT_ENGINE.md)
- Certificação P1.9: `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md`
- Runner: `scripts/p19-certification.cjs`

---

## Código certificado

| Camada | Path |
|--------|------|
| Core financeiro | `src/finance/` |
| Fachada P2.2 | `src/payment-engine/` |
| Entry point | `server-fly.js` |

---

## Monorepo

Este repositório também contém o **Gol de Ouro™** (jogo). A Payment Engine™ é produto **Indesconectável™** — ver `README.md` raiz para o jogo; este README é a entrada institucional da Engine.

---

*README institucional — PE.BRAND.2*
