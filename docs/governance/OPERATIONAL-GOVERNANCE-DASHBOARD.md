# Painel de governança operacional — Gol de Ouro

**Atualização:** 2026-05-19T10:41:01Z (read-only)  
**Fonte:** `docs/governance/snapshots/LATEST.json`  
**Comando:** `node scripts/governance/autonomous-reliability-check.js`

> Dashboard **estático/documental** — atualizar reexecutando o script acima.

---

## Status executivo

| Indicador | Valor |
|-----------|-------|
| **Estado operacional** | **DEGRADED** |
| **Certificação contínua** | **CERTIFIED** |
| **Score operacional** | **97** / 100 |
| **Classificação score** | GREEN |
| **Veredito** | **PASS COM RESSALVAS** |
| **Risco agregado** | 28 / 100 |
| **Reliability hash** | `93d45bd0…` |

---

## Runtime live

| Campo | Valor |
|-------|-------|
| SHA `/meta` | `a83c3cff…` (certificado) |
| Fly release | **v461** |
| `/health` | ok · v1.2.1 · DB/MP connected |
| Bundle player | `index-B6M2smS9.js` |
| Runtime certification | **CERTIFIED** |
| Fingerprint hash | ver `runtime-certification` snapshot |

---

## Financeiro

| Métrica | Live | Baseline | Δ |
|---------|-----:|---------:|--:|
| approved_sem_ledger | 34 | 34 | 0 |
| pix_pending_old | 54 | 54 | 0 |
| dups_corr_tipo | 0 | 0 | 0 |
| saldo_negativo | 0 | 0 | 0 |
| falha_payout | 13 | 13 | 0 |
| rollback | 14 | 14 | 0 |
| reconcile_backlog | 54 | 54 | 0 |

| Prova | Valor |
|-------|-------|
| Financial proof | **VALID** |
| Financial score | 100 |
| Proof hash | ver snapshot `proofs/LATEST` |

---

## Segurança

| Probe | Status |
|-------|--------|
| Webhook deposit (sem assinatura) | 401 |
| Webhook payout (sem assinatura) | 401 |
| Security score | 100 |

---

## Workers & drift

| Item | Status |
|------|--------|
| Payout worker (env) | habilitado |
| Heartbeats (amostra Fly) | variável — ver WK-01 |
| Drift repo local vs live | **DR-03** (medium) |
| Drift score | 86 |

---

## Scores por domínio

| Domínio | Score |
|---------|------:|
| Runtime | 100 |
| Financeiro | 100 |
| Segurança | 100 |
| Deploy/drift | 86 |
| Workers | 100 |
| Backlog | 100 |

---

## Riscos ativos (top)

1. **DR-03** — Repo local diverge do runtime live (documentado V1.2C)
2. **WK-01** — Heartbeats payout inconclusivos em janela curta (intermitente)

---

## Incidentes

| Campo | Valor |
|-------|-------|
| Incidentes abertos | 0 (automático) |
| Heurísticas | IH-WK (P2) se WK-01 persistir |

---

## Tendência

| Métrica | Valor |
|---------|-------|
| Amostras históricas | 1+ |
| Último score V1.2E | 87 (YELLOW) |
| Score atual V1.3 | 97 (GREEN) |
| Direção | estável / melhorando |

---

## Ações rápidas

```bash
node scripts/governance/autonomous-reliability-check.js
node scripts/reliability/reliability-score-engine.js
node scripts/reliability/runtime-certification.js
node scripts/reliability/financial-proof-engine.js
```

## Referências

- [CONTINUOUS-CERTIFICATION-MODEL.md](CONTINUOUS-CERTIFICATION-MODEL.md)
- [RELIABILITY-MATURITY-MODEL.md](RELIABILITY-MATURITY-MODEL.md)
- Runbooks: `docs/runbooks/README.md`
- Simulações: `docs/reliability/simulations/`
