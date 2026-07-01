# V1 — Baseline Operacional Certificada (congelada)

**Data oficial de certificação:** 2026-05-19  
**Veredito:** CERTIFIED WITH RESSALVAS  
**Score consolidado:** 88/100  
**Maturidade:** Semi-autonomous

> Documento de referência congelada. Alterações em produção que divergem deste baseline exigem novo ciclo de certificação.

---

## Runtime certificado

| Campo | Valor |
|-------|-------|
| **gitCommit** | `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` |
| **gitCommitShort** | `a83c3cf` |
| **Fly release** | **v461** |
| **Player bundle** | `index-B6M2smS9.js` |
| **API** | `https://goldeouro-backend-v2.fly.dev` |

---

## Score final V1.6

| Domínio | Score |
|---------|------:|
| Runtime | 100 |
| Financeiro | 85 |
| Segurança | 100 |
| Governança | 100 |
| Observabilidade | 100 |
| Resiliência | 96 |
| Readiness | 82 |
| **Consolidado** | **88** |

---

## Riscos aceitos (documentados)

- 34 approved PIX sem ledger (legado U1–U4 + backlog estável)
- payout_confirmado histórico = 0 (modelo MP; sem tráfego confirmado documentado)
- Worker liveness inconclusivo em janela curta de logs Fly
- Monitoramento externo e alertas reais não ativados (V1.5D plano apenas)
- Pre-deploy gate REVIEW — sign-off humano antes de deploy
- Drift repo local vs runtime (documentado V1.2C)

---

## Artefatos de referência

- Relatório: `docs/relatorios/V1-6-OPERATIONAL-PRODUCTION-CERTIFICATION-2026-05-19.md`
- V1.1G certificação financeira
- V1.2A–V1.2E observabilidade
- V1.3–V1.5 governance / resilience / activation
- V1.5C–V1.5D external readiness (dry-run)

---

## Regras pós-certificação

1. Deploy deve passar por `pre-deploy-gate.js`
2. Não alterar RPC/ledger sem snapshot PRE-APPLY
3. Herdar baseline em V2 como `V1-BASELINE-CERTIFIED`

---

_Certificação V1.6 — 2026-05-19. Produção não alterada durante emissão._
