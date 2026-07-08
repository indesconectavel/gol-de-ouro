# Índice de Due Diligence — Gol de Ouro™ V1 + Indesconectável Payment Engine™

**Produto:** Indesconectável Payment Engine™  
**Cliente de referência / produto âncora:** Gol de Ouro™ V1  
**Data (sincronização):** 2026-07-08  
**Gate:** **H2.5 — Sincronização Oficial do Data Room™**  
**Bases:** H0 · H1 · H2 · H2A · P1.9 · G2  
**Repositório:** `indesconectavel/gol-de-ouro`

> **Leitura obrigatória:** começar por [`DR-01-RESUMO-EXECUTIVO.md`](./DR-01-RESUMO-EXECUTIVO.md).  
> Trechos DR-02–11 datados de jun/2026 podem conter narrativa histórica — ver adendas **H2.5** em cada documento.

---

## Navegação rápida

| Seção | Uso |
|-------|-----|
| [0. Portão patrimonial H0–H2.5](#0-portão-patrimonial-h0h25) | Estado oficial jul/2026 |
| [1. Baseline Git](#1-baseline-git) | Commits e tags |
| [2. Data Room DR-01–11](#2-data-room-dr-0111) | Pacote DD institucional |
| [3. Arquitetura](#3-arquitetura) | Design PE |
| [4. Certificação](#4-certificação) | P1.9, G2, V1.FINAL |
| [5. Homologação P1.x](#5-homologação-p1x) | Linha produção |
| [6. Formação F4.x](#6-formação-f4x) | Pré-produção |
| [7. Governança](#7-governança) | Políticas |
| [8. Operação / Staging](#8-operação--staging) | Runbooks + homologação permanente |
| [9. Patrimônio / Asset Package](#9-patrimônio--asset-package) | H1 · PE.PATRIMÔNIO |
| [10. Valoração](#10-valoração) | Pré-H3 |

---

## 0. Portão patrimonial H0–H2.5

| Gate | Documento | Veredito |
|------|-----------|----------|
| **H0** | `docs/relatorios/H0-CERTIFICACAO-FINAL-PLATAFORMA-ENGENHARIA.md` | PASS COM RESSALVAS |
| **H1** | `docs/relatorios/H1-EMPACOTAMENTO-PATRIMONIAL-OFICIAL.md` | PASS COM RESSALVAS — **Asset Package™** |
| **H2** | `docs/relatorios/H2-DATA-ROOM-EXECUTIVO.md` | PASS COM RESSALVAS (pré-sync) |
| **H2A** | `docs/relatorios/H2A-AUDITORIA-SUPREMA-STAGING-E-ARQUITETURA.md` | PASS COM RESSALVAS |
| **H2.5** | `docs/relatorios/H2.5-SINCRONIZACAO-DATA-ROOM.md` | Sync documental (este ciclo) |
| Snapshot H1 | `docs/relatorios/snapshots/h1-patrimonial-package.json` | Asset Package machine-readable |
| Snapshot H2.5 | `docs/relatorios/snapshots/h2.5-data-room-sync.json` | Sync machine-readable |

**P1.9 (obrigatório):** `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` — **PASS** (Recovery GOLD).  
**G2 (staging):** `docs/relatorios/G2-CERTIFICACAO-HOMOLOGACAO-PERMANENTE.md` — **PASS COM RESSALVAS**.

---

## 1. Baseline Git

| Artefato | Referência |
|----------|------------|
| Tag V1 Certificada | `payment-engine-v1-certified` → `eab1d74` |
| Tag P2.2 | `payment-engine-p2.2` → `d188ca6` |
| **Runtime baseline staging (G2)** | `payment-engine-v1-runtime-baseline` → **`b29d847`** |
| Release GitHub | [payment-engine-v1-certified](https://github.com/indesconectavel/gol-de-ouro/releases/tag/payment-engine-v1-certified) |
| CHANGELOG | `CHANGELOG_PAYMENT_ENGINE.md` |
| Manifesto | `docs/payment-engine/08-Version-Manifest.md` |
| Licença PE | `LICENSE-PAYMENT-ENGINE.md` |
| README PE | `README-PAYMENT-ENGINE.md` |

> **H2A:** staging pinado em `b29d847` pode divergir do tip patrimonial P2.2 — esperado até política de pin explícita.

---

## 2. Data Room DR-01–11

Pasta: `docs/data-room/`

| DR | Documento | Nota H2.5 |
|----|-----------|-----------|
| **DR-01** | [`DR-01-RESUMO-EXECUTIVO.md`](./DR-01-RESUMO-EXECUTIVO.md) | **CRIADO** — porta de entrada |
| DR-02 | [`DR-02-INVENTARIO-OFICIAL-DO-ATIVO.md`](./DR-02-INVENTARIO-OFICIAL-DO-ATIVO.md) | Adenda sync (Asaas/PE/staging) |
| DR-03 | [`DR-03-ARQUITETURA-GERAL.md`](./DR-03-ARQUITETURA-GERAL.md) | Adenda sync |
| DR-04 | [`DR-04-GOVERNANCA-TECNOLOGICA-E-OPERACIONAL.md`](./DR-04-GOVERNANCA-TECNOLOGICA-E-OPERACIONAL.md) | Coerente V1.6; refs H0–H2.5 |
| DR-05 | [`DR-05-INFRAESTRUTURA-TECNOLOGICA.md`](./DR-05-INFRAESTRUTURA-TECNOLOGICA.md) | Adenda staging permanente |
| DR-06 | [`DR-06-PROPRIEDADE-INTELECTUAL.md`](./DR-06-PROPRIEDADE-INTELECTUAL.md) | Adenda IPE / LICENSE |
| DR-07 | [`DR-07-ROADMAP-ESTRATEGICO.md`](./DR-07-ROADMAP-ESTRATEGICO.md) | Adenda B→E + DR-01 presente |
| DR-08 | [`DR-08-MODELO-OPERACIONAL-E-FINANCEIRO.md`](./DR-08-MODELO-OPERACIONAL-E-FINANCEIRO.md) | Adenda PIX OUT / Recovery |
| DR-09 | [`DR-09-AVALIACAO-ESTRATEGICA-DO-ATIVO.md`](./DR-09-AVALIACAO-ESTRATEGICA-DO-ATIVO.md) | Adenda H0/H1 |
| DR-10 | [`DR-10-INVESTMENT-MEMORANDUM.md`](./DR-10-INVESTMENT-MEMORANDUM.md) | Adenda (precursor H4) |
| DR-11 | [`DR-11-MULTI-PSP-ANALYSIS.md`](./DR-11-MULTI-PSP-ANALYSIS.md) | Adenda pós-P1.9/G2 |

---

## 3. Arquitetura

| # | Documento |
|---|-----------|
| 01–12 | `docs/payment-engine/01-Arquitetura.md` … `12-Core-Decoupling.md` |
| Homologação permanente | `docs/arquitetura/HOMOLOGACAO-PERMANENTE.md` |
| ADR | `docs/arquitetura/ADR-002-PRIMARY-PSP-ASAAS.md` |
| PE V1 | `docs/arquitetura/PAYMENT-ENGINE-V1.md` |
| Auditoria estratégica | `docs/relatorios/A1.0-AUDITORIA-ESTRATEGICA-PAYMENT-ENGINE.md` |

---

## 4. Certificação

| Marco | Documento |
|-------|-----------|
| **P1.9 PASS** | `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` |
| **G2 staging** | `docs/relatorios/G2-CERTIFICACAO-HOMOLOGACAO-PERMANENTE.md` |
| F4.Z | `docs/relatorios/F4.Z-CERTIFICACAO-OFICIAL-PAYMENT-ENGINE-V1.md` |
| V1 oficial | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` |
| V1.FINAL | `docs/executive/V1-FINAL-OPERATIONAL-VERDICT.md` |
| Snapshot PE | `docs/payment-engine/09-Certification-Snapshot.md` |

**Critério GOLD:** Recovery Job reconcilia sem webhook (P1.7C → P1.9).

---

## 5. Homologação P1.x

### P1.0–P1.3 — Go-live e PIX IN

| ID | Relatório |
|----|-----------|
| P1.0 | `P1.0-HOMOLOGACAO-OPERACIONAL-ASAAS.md`, `P1.0D-DEPLOY-CONTROLADO-WIRE-ASAAS.md` |
| Checklist | `docs/checklists/P1.0-PRODUCTION-GO-LIVE-CHECKLIST.md` |
| P1.1–P1.3 | Séries `P1.1*`, `P1.2*`, `P1.3*` |

### P1.4–P1.6 — PIX IN produção e webhook

| Faixa | Destaques |
|-------|-----------|
| P1.4 | `P1.4Z-CERTIFICACAO-FINAL-PIX-IN-ASAAS-PRODUCAO.md` |
| P1.5 | `P1.5CERT-*`, `P1.5MASTER-*`, PIX OUT |
| P1.6 | Webhook authorization / desacoplamento gates |

### P1.7–P1.9 — PIX OUT e recovery

| ID | Relatório |
|----|-----------|
| P1.7 | `P1.7-HOMOLOGACAO-FINAL-PIXOUT.md`, `P1.7C-*` |
| P1.8 | `P1.8-RECONCILIACAO-AUTOMATICA-PIXOUT.md` |
| **P1.9** | **Certificação final PE — PASS** |

---

## 6. Formação F4.x

| Marco | Relatório |
|-------|-----------|
| Mapa | `F4.0A-MAPA-FINANCEIRO-ATUAL.md` |
| Sandbox / Primary PSP | `F4.2*` · `F4.3*` |
| PIX IN / Webhook / E2E | `F4.4` · `F4.5` · `F4.7` |
| Cert pré-prod | `F4.Z-CERTIFICACAO-OFICIAL-PAYMENT-ENGINE-V1.md` |

---

## 7. Governança

| Documento | Função |
|-----------|--------|
| `docs/governance/BASELINE-PROTECTION-POLICY.md` | Tags / imutabilidade |
| `LICENSE-PAYMENT-ENGINE.md` | Licença proprietária |
| `PROPRIETARY-SCOPE.md` | Escopo paths |
| `DECLARACAO-CESAO-AUTORAL-INSTITUCIONAL.md` | Titularidade |
| `BRAND-AND-TRADEMARK-GUIDELINES.md` | Marca |
| `CONTINUOUS-CERTIFICATION-MODEL.md` | CERTIFIED / DEGRADED / INVALID |

---

## 8. Operação / Staging

| Categoria | Localização |
|-----------|-------------|
| Homologação permanente | `docs/arquitetura/HOMOLOGACAO-PERMANENTE.md` |
| Fly staging | `fly.staging.toml` · app `goldeouro-backend-staging` |
| Deploy staging | `.github/workflows/backend-deploy-staging.yml` |
| A2R sandbox | `.github/workflows/a2r-staging-asaas-sandbox.yml` · `A2R-RUNTIME-ASAAS-SANDBOX-STAGING.md` |
| S3 / S3.3 | `S3-INFRAESTRUTURA-PERMANENTE-HOMOLOGACAO.md` · `S3.3-DEPLOY-CONTROLADO-STAGING.md` |
| Runbooks | `docs/runbooks/**` |
| Snapshot G2 | `docs/relatorios/snapshots/g2-certificacao-staging-2026-07-06.json` |

---

## 9. Patrimônio / Asset Package

| Fase | Relatório |
|------|-----------|
| H1 Asset Package | `H1-EMPACOTAMENTO-PATRIMONIAL-OFICIAL.md` |
| PE.PATRIMÔNIO.1–3 | `PE-PATRIMONIO-1-CONSOLIDACAO.md` … `PE-PATRIMONIO-3-GOVERNANCA-BASELINE.md` |
| PE.BRAND | `PE-BRAND-1/2/3-*` |
| A1.0 | `A1.0-AUDITORIA-ESTRATEGICA-PAYMENT-ENGINE.md` |

---

## 10. Valoração

| Documento | Conteúdo |
|-----------|----------|
| `PE-VALOR-1-AVALIACAO-ESTRATEGICA.md` | Avaliação qualitativa |
| `PE-VALOR-2-POSICIONAMENTO-COMERCIAL.md` | Posicionamento |
| DR-09 / DR-10 | Avaliação + IM precursor (**pré-H3/H4**) |
| `docs/payment-engine/05-Roadmap.md` | V1 → V2.1 |

**Próximo gate valuation:** **H3 — Valuation Tecnológico** (usar DR-01 + adendas H2.5; não precificar só com narrativa jun/2026).

---

## Checklist due diligence (auditor externo) — atualizado H2.5

- [ ] Ler **DR-01** e este índice  
- [ ] Ler **H0 → H1 → H2 → H2A → H2.5**  
- [ ] Validar **P1.9 PASS** e **G2** (staging)  
- [ ] Clonar / checkout tags `payment-engine-v1-certified` e runtime baseline `b29d847` conforme escopo  
- [ ] Percorrer DR-02–11 **com adendas H2.5**  
- [ ] Confirmar fronteira IP (`PROPRIETARY-SCOPE`, LICENSE-PE)  
- [ ] Revisar desacoplamento B→E (H2A) sem antecipar D/E  
- [ ] Consultar Release GitHub oficial  

---

## Nota de versão do índice

| Versão | Data | Alteração |
|--------|------|-----------|
| PE.PATRIMÔNIO.3 | 2026-07-01 | Índice IPE inicial |
| **H2.5** | **2026-07-08** | DR-01 · H0–H2A · P1.9 · G2 · Asset Package · sync |

---

*Índice sincronizado em H2.5 — 2026-07-08*
