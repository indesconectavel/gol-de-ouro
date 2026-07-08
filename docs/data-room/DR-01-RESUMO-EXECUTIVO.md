# DR-01 — Resumo Executivo do Data Room

**Projeto:** Gol de Ouro™ V1  
**Ativo principal:** Indesconectável Payment Engine™  
**Documento:** Porta de entrada oficial do Data Room Executivo™  
**Data:** 2026-07-08  
**Gate de sincronização:** H2.5  
**Classificação:** Due Diligence · Investidores · Compradores · Parceiros  

**Bases oficiais (estado atual):** H0 · H1 · H2 · H2A · P1.9 · G2 · V1.FINAL (88/100)

---

## 1. Visão geral do ativo

O **Gol de Ouro™ V1** é uma plataforma de entretenimento digital com **economia real em BRL** (depósito PIX, gameplay de penáltis, wallet, saque PIX), em **produção pública**, com governança **GOVERNED** e certificação operacional **CERTIFIED WITH RESSALVAS** (score **88/100**, maturidade **Semi-autonomous** — V1.6 / V1.FINAL, 2026-05-19).

Dentro do monorepo opera a **Indesconectável Payment Engine™ (IPE™)** — motor de orquestração PIX multi-PSP (Cash-In, Cash-Out, ledger, webhooks, recovery, gates), certificado operacionalmente (**P1.9 PASS**, critério GOLD: Recovery sem webhook) e tratado como **ativo tecnológico reutilizável** (H0/H1), ainda **embutido** no monólito do produto.

| Dimensão | Estado oficial (jul/2026) |
|----------|---------------------------|
| Produto | Produção (`goldeouro.lol`, admin, Fly `goldeouro-backend-v2`) |
| IPE™ | Identidade própria + núcleo `src/finance/` + fachada `src/payment-engine/` (P2.2) |
| Classificação patrimonial | Ativo Tecnológico Patrimonial **COM RESSALVAS** (H1) |
| Data Room | DR-01–11 + índice DD (este pacote, pós-H2.5) |

---

## 2. Asset Package™ (H1)

| Pacote | Conteúdo |
|--------|----------|
| **A — Produto** | Player PWA, Admin, gameplay RPC, backend monólito, mobile parcial |
| **B — IPE™** | Provider Layer, Webhook Engine, Recovery, Ledger/Wallet adapters, Workers, Gates, docs 01–12 |
| **C — Infra/Ops** | Fly, Supabase, Vercel, GitHub Actions, snapshots/scripts cert |
| **D — Capital intelectual** | Data Room, certificações, metodologias de gate/freeze, PE.VALOR/BRAND |

**Fronteira IP:** escopo IPE em `LICENSE-PAYMENT-ENGINE.md` / `PROPRIETARY-SCOPE.md`; gameplay/player/admin fora da licença PE.

---

## 3. Arquitetura (resumo)

```text
Player / Admin (Vercel)
        │
        ▼
server-fly.js (Fly)  ──► PaymentEngine facade (P2.2)
        │                         │
        │                         ▼
        │                  src/finance/ (Factory · Providers · Webhooks · Recovery)
        │                         │
        ▼                         ▼
Supabase (wallet + ledger + RPCs)   PSPs: Asaas (primário arquitetural) · MP · Celcoin stub
```

**Homologação permanente (G2 / H2A):** app Fly `goldeouro-backend-staging` + `fly.staging.toml` + Supabase staging isolado; workers OFF; Asaas sandbox por design; baseline tag `payment-engine-v1-runtime-baseline` @ `b29d847`.

---

## 4. Maturidade

| Área | Nível | Fonte |
|------|-------|-------|
| Plataforma V1 | Semi-autonomous / GOVERNED · 88/100 | V1.FINAL / H0 |
| Payment Engine | Certificada V1 (P1.9); productização parcial | P1.9 · F4.Z · H0 |
| Staging permanente | Certificado G2 PASS COM RESSALVAS | G2 · H2A |
| Independência IPE (SaaS/npm) | Não concluída — roadmap B→C | H2A · A1.0 |
| Data Room (pós-H2.5) | Sincronizado com ressalvas residuais | H2.5 |

---

## 5. Certificações âncora

| ID | Veredito | Papel |
|----|----------|-------|
| V1.6 / V1.FINAL | CERTIFIED WITH RESSALVAS | Plataforma produção |
| F4.Z | PASS (sandbox / arquitetura PE) | Formação multi-PSP |
| P1.9 | **PASS** | PE produção + Recovery GOLD |
| G2 | PASS COM RESSALVAS | Staging permanente |
| H0 | PASS COM RESSALVAS | Certificação engenharia |
| H1 | PASS COM RESSALVAS | Asset Package™ |
| H2 | PASS COM RESSALVAS | Auditoria Data Room (pré-sync) |
| H2A | PASS COM RESSALVAS | Staging × arquitetura |
| H2.5 | *(este gate)* | Sincronização documental |

---

## 6. Payment Engine™ — narrativa oficial atual

- **Provider Layer / PSP Abstraction:** `FinanceProviderFactory` + contratos; Asaas primário arquitetural (ADR-002).  
- **Facade:** `src/payment-engine/api/PaymentEngine.js` (P2.2).  
- **Compat Layer:** ponte monólito preservada.  
- **Webhook Engine + Idempotência + Gates:** produção hardened; staging sandbox.  
- **Recovery Job:** certificado P1.9 (reconcilia PIX OUT sem webhook).  
- **Workers:** ON em produção (`payout_worker`); OFF em staging (design).  
- **Runtime baseline staging:** tag `payment-engine-v1-runtime-baseline` @ `b29d847` (G2).  
- **Homologação permanente:** ambiente oficial, não temporário (`docs/arquitetura/HOMOLOGACAO-PERMANENTE.md` + S3/G2).

---

## 7. Estado atual (oficial — 2026-07-08)

| Tema | Estado |
|------|--------|
| PIX IN | Operacional (MP hist.; Asaas via Engine com gates — P1.4Z/P1.5/P1.9) |
| PIX OUT | Homologado Asaas com Recovery (P1.7–P1.9); gates de produção aplicáveis |
| Staging | UP e certificado G2; A2R (Asaas sandbox resolvível) **pendente** (H2A) |
| Drift documental pré-H2.5 | DR-02–10 desatualizados em Asaas/OUT — **objeto deste sync** |
| Empacotamento comercial IPE | Parcial (LICENSE + narrativa; sem npm/API multi-tenant) |

---

## 8. Limitações (transparência obrigatória)

1. IPE **embutida** no monólito / schema Gol de Ouro (wallet acoplada).  
2. Staging pinado em `b29d847` — pode divergir do tip patrimonial P2.2 (`d188ca6`).  
3. Asaas sandbox no staging **não resolvível** até A2R (H2A).  
4. Escala / pen test / alertas externos live: sem evidência de certificação plena (H0).  
5. IP registral (INPI/contratos): documentação preparatória; eficácia legal fora do repo.  
6. Trechos DR antigos (jun/2026) preservados como **HISTÓRICO** — ler **Estado oficial H2.5** em cada DR.

---

## 9. Roadmap de desacoplamento (oficial H2A — sem antecipar)

| Fase | Descrição | Status |
|------|-----------|--------|
| **B** | Módulo interno (facade/adapters) | **Recomendado agora** / em curso (P2.2) |
| **C** | Pacote reutilizável (npm interno) | Próximo após B |
| **D** | Repositório dedicado | Prematuro |
| **E** | Produto independente (SaaS/WL) | Prematuro |

Roadmap patrimonial: **H3** Valuation → **H4** IM → **H5** DD Final.

---

## 10. Como navegar o Data Room

1. Este **DR-01**  
2. [`INDICE-DUE-DILIGENCE.md`](./INDICE-DUE-DILIGENCE.md)  
3. H0 → H1 → H2 → H2A → H2.5 (série patrimonial)  
4. DR-02 inventário · DR-03 arquitetura · DR-11 multi-PSP · DR-08 financeiro  
5. P1.9 · G2 · F4.Z (prova técnica)  
6. DR-06 IP · DR-09/10 avaliação e IM (ler addenda H2.5)

---

## 11. Veredito de porta de entrada

O Data Room, **a partir do H2.5**, passa a ter **entrada executiva oficial (DR-01)** alinhada às certificações H0–H2A, P1.9 e G2. Documentos DR-02+ anteriores a jul/2026 devem ser lidos **com as adendas de sincronização**; trechos pré-P1.9 sobre “Asaas zero código” ou “PIX OUT apenas bloqueado MP” são **narrativa histórica**, não estado atual.

---

*DR-01 — Resumo Executivo do Data Room — emitido em H2.5 (2026-07-08).*
