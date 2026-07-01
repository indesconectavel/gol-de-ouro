# Índice de Due Diligence — Indesconectável Payment Engine™ V1

**Produto:** Indesconectável Payment Engine™  
**Cliente de referência:** Gol de Ouro™ V1  
**Data:** 2026-07-01  
**Fase:** PE.PATRIMÔNIO.3  
**Repositório:** `indesconectavel/gol-de-ouro` · branch `chore/f2-4e-2-mp-log`

---

## Navegação rápida

| Seção | Uso |
|-------|-----|
| [1. Baseline Git](#1-baseline-git) | Commits e tags oficiais |
| [2. Arquitetura](#2-arquitetura) | Design e assinatura |
| [3. Certificação](#3-certificação) | P1.9 e evidências |
| [4. Homologação P1.x](#4-homologação-p1x) | Linha histórica produção |
| [5. Formação F4.x](#5-formação-f4x) | Pré-produção / sandbox |
| [6. Data Room](#6-data-room) | Ativo institucional |
| [7. Governança](#7-governança) | Políticas e maturidade |
| [8. Operação](#8-operação) | Runbooks e checklists |
| [9. Patrimônio](#9-patrimônio) | Fases PE.PATRIMÔNIO |
| [10. Valoração](#10-valoração) | Posicionamento comercial |

---

## 1. Baseline Git

| Artefato | Referência |
|----------|------------|
| Tag V1 Certificada | `payment-engine-v1-certified` → `eab1d74` |
| Tag P2.2 | `payment-engine-p2.2` → `d188ca6` |
| Release GitHub | [payment-engine-v1-certified](https://github.com/indesconectavel/gol-de-ouro/releases/tag/payment-engine-v1-certified) |
| CHANGELOG | `CHANGELOG_PAYMENT_ENGINE.md` |
| Manifesto | `docs/payment-engine/08-Version-Manifest.md` |
| Política baseline | `docs/governance/BASELINE-PROTECTION-POLICY.md` |
| Licença proprietária | `LICENSE-PAYMENT-ENGINE.md` |
| README institucional PE | `README-PAYMENT-ENGINE.md` |
| Auditoria timeline | `docs/relatorios/GIT-AUDIT-PAYMENT-ENGINE-TIMELINE.md` |

---

## 2. Arquitetura

| # | Documento |
|---|-----------|
| 01 | `docs/payment-engine/01-Arquitetura.md` |
| 02 | `docs/payment-engine/02-Core.md` |
| 03 | `docs/payment-engine/03-Interfaces.md` |
| 04 | `docs/payment-engine/04-Provider-Layer.md` |
| 10 | `docs/payment-engine/10-Architecture-Signature.md` |
| 12 | `docs/payment-engine/12-Core-Decoupling.md` |
| ADR | `docs/arquitetura/ADR-002-PRIMARY-PSP-ASAAS.md` |
| PE V1 | `docs/arquitetura/PAYMENT-ENGINE-V1.md` |
| Webhook auth | `docs/arquitetura/P1.6-WEBHOOK-AUTHORIZATION.md` |

---

## 3. Certificação

| Marco | Documento |
|-------|-----------|
| **P1.9 PASS** | `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` |
| Runner | `scripts/p19-certification.cjs` |
| Snapshot | `docs/payment-engine/09-Certification-Snapshot.md` |
| P2.0B freeze | `docs/relatorios/P2.0B-CONGELAMENTO-OFICIAL-V1.md` |
| P2.1 hardening | `docs/payment-engine/11-Hardening.md` |
| P2.2 commit | `docs/relatorios/P2.2-COMMIT-OFICIAL.md` |

**Critério GOLD:** Recovery Job reconcilia sem webhook (evidência P1.7C → P1.9).

---

## 4. Homologação P1.x

### P1.0–P1.3 — Go-live e PIX IN

| ID | Relatório |
|----|-----------|
| P1.0 | `P1.0-HOMOLOGACAO-OPERACIONAL-ASAAS.md`, `P1.0D-DEPLOY-CONTROLADO-WIRE-ASAAS.md` |
| Checklist | `docs/checklists/P1.0-PRODUCTION-GO-LIVE-CHECKLIST.md` |
| Runbook | `docs/runbooks/ASAAS-PRODUCTION-GO-LIVE.md` |
| P1.1 | `P1.1A-*`, `P1.1B-*` (3 relatórios) |
| P1.2 | `P1.2-VALIDACAO-WEBHOOK-PRODUCAO.md` |
| P1.3 | `P1.3-*` a `P1.3R-*` (10 relatórios) |

### P1.4–P1.6 — PIX IN produção e webhook authorization

| Faixa | Destaques |
|-------|-----------|
| P1.4 | `P1.4Z-CERTIFICACAO-FINAL-PIX-IN-ASAAS-PRODUCAO.md` |
| P1.5 | `P1.5CERT-*`, `P1.5I-*`, `P1.5Y.*` (PIX OUT homologação) |
| P1.6 | `P1.6ZB-*`, `P1.6F-*`, webhook authorization (15+ relatórios) |

### P1.7–P1.8 — PIX OUT e recovery

| ID | Relatório |
|----|-----------|
| P1.7 | `P1.7-HOMOLOGACAO-FINAL-PIXOUT.md`, `P1.7C-AUDITORIA-FORENSE-*` |
| P1.8 | `P1.8-RECONCILIACAO-AUTOMATICA-PIXOUT.md` |

---

## 5. Formação F4.x

Série de formação da Engine em sandbox (pré-P1.0):

| Marco | Relatório |
|-------|-----------|
| Mapa | `F4.0A-MAPA-FINANCEIRO-ATUAL.md` |
| Asaas sandbox | `F4.2A` – `F4.2H` |
| Primary PSP | `F4.3A` – `F4.3C` |
| PIX IN Engine | `F4.4-PIX-IN-PAYMENT-ENGINE-ASAAS.md` |
| Webhook | `F4.5-WEBHOOK-PAYMENT-ENGINE.md` |
| E2E | `F4.7-ASAAS-E2E-SANDBOX.md` |
| Certificação pré-prod | `F4.Z-CERTIFICACAO-OFICIAL-PAYMENT-ENGINE-V1.md` |

---

## 6. Data Room

| DR | Documento |
|----|-----------|
| DR-02 | Inventário oficial do ativo |
| DR-03 | Arquitetura geral |
| DR-04 | Governança tecnológica |
| DR-05 | Infraestrutura |
| DR-06 | Propriedade intelectual |
| DR-07 | Roadmap estratégico |
| DR-08 | Modelo operacional |
| DR-09 | Avaliação estratégica |
| DR-10 | Investment memorandum |
| DR-11 | Análise multi-PSP |

Pasta: `docs/data-room/`

---

## 7. Governança

| Documento | Função |
|-----------|--------|
| `BASELINE-PROTECTION-POLICY.md` | Proteção da baseline V1 |
| `LICENSE-PAYMENT-ENGINE.md` | Licença proprietária (raiz) |
| `COPYRIGHT-AND-LICENSE-POLICY.md` | Dual-license monorepo |
| `PROPRIETARY-SCOPE.md` | Escopo paths proprietários |
| `DECLARACAO-CESAO-AUTORAL-INSTITUCIONAL.md` | Titularidade institucional |
| `BRAND-AND-TRADEMARK-GUIDELINES.md` | Uso de marca |
| `INPI-PLANO-REGISTRO-MARCA.md` | Registro INPI (preparado) |
| `CONTINUOUS-CERTIFICATION-MODEL.md` | CERTIFIED / DEGRADED / INVALID |
| `RELIABILITY-MATURITY-MODEL.md` | Níveis 1–5 |
| `OPERATIONAL-GOVERNANCE-DASHBOARD.md` | Painel executivo |

---

## 8. Operação

| Categoria | Localização |
|-----------|-------------|
| Runbooks financeiros | `docs/runbooks/financeiro/` |
| Runbooks workers | `docs/runbooks/workers/` |
| Runbooks segurança | `docs/runbooks/seguranca/` |
| Runbooks runtime | `docs/runbooks/runtime/` |
| Incident response | `docs/runbooks/INCIDENT-RESPONSE-FLOW.md` |
| Operação controlada | `docs/operacao/OC1.*` |
| Go/No-Go | `docs/relatorios/G1.0-GO-NO-GO-FINAL-V1.md` |

---

## 9. Patrimônio

| Fase | Relatório |
|------|-----------|
| PE.PATRIMÔNIO.1 | `PE-PATRIMONIO-1-CONSOLIDACAO.md` |
| PE.PATRIMÔNIO.2 | `PE-PATRIMONIO-2-PLANO-PUBLICACAO.md` |
| PE.PATRIMÔNIO.2A | `PE-PATRIMONIO-2A-PUBLICACAO-CONTROLADA.md` |
| PE.PATRIMÔNIO.2B | `PE-PATRIMONIO-2B-CURADORIA-DOCUMENTAL.md` |
| PE.PATRIMÔNIO.3 | `PE-PATRIMONIO-3-GOVERNANCA-BASELINE.md` |
| PE.BRAND.1 | `PE-BRAND-1-CONSOLIDACAO-PROPRIEDADE-INTELECTUAL.md` |
| PE.BRAND.2 | `PE-BRAND-2-FORMALIZACAO-PROPRIETARIA.md` |
| PE.BRAND.3 | `PE-BRAND-3-REGISTRO-MARCA-INPI.md` · `INPI-PLANO-REGISTRO-MARCA.md` |
| Auditoria estratégica | `A1.0-AUDITORIA-ESTRATEGICA-PAYMENT-ENGINE.md` |

---

## 10. Valoração

| Documento | Conteúdo |
|-----------|----------|
| `PE-VALOR-1-AVALIACAO-ESTRATEGICA.md` | Avaliação do ativo |
| `PE-VALOR-2-POSICIONAMENTO-COMERCIAL.md` | Posicionamento comercial |
| `docs/payment-engine/06-Posicionamento.md` | Identidade institucional |
| `docs/payment-engine/05-Roadmap.md` | V1 → V2.1 |

---

## Checklist due diligence (auditor externo)

- [ ] Clonar repo e checkout `payment-engine-v1-certified`
- [ ] Verificar tag → `eab1d74` e manifesto 08
- [ ] Ler P1.9 e executar `p19-certification.cjs` (read-only, ENV)
- [ ] Percorrer P1.0–P1.8 em ordem cronológica
- [ ] Validar data room DR-02–DR-11
- [ ] Confirmar `src/finance/**` inalterado em `d188ca6..HEAD` para commits patrimoniais
- [ ] Revisar runbooks e governança
- [ ] Consultar Release GitHub oficial

---

*Índice gerado em PE.PATRIMÔNIO.3 — 2026-07-01*
