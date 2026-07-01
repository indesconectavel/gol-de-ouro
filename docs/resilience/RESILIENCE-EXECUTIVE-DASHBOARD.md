# Painel executivo de resiliência — V1.5

**Atualização:** 2026-05-19T11:16:58Z  
**Fonte:** `docs/relatorios/V1-5-CONSOLIDATED-DATA-2026-05-19.json`  
**Comando:** `node scripts/resilience/v1-5-consolidated-run.js`

---

## Status executivo

| Indicador | Valor |
|-----------|-------|
| **Veredito V1.5** | **PASS COM RESSALVAS** |
| **Estado operacional** | **DEGRADED** (activation REVIEW) |
| **Resilience state** | **HARDENED** |
| **Resilience score** | **94** |
| **Activation gate** | **REVIEW** |
| **Freeze (simulado)** | inativo |
| **Certificação externa** | **EXTERNALLY_CERTIFIED** |
| **Score operacional** | **90** |
| **Live cert readiness** | **READY** (100% artefatos) |

---

## Activation & freeze

| Campo | Valor |
|-------|-------|
| Deploy (simulado) | requer revisão humana |
| Payout changes | permitido com review |
| Freeze recomendado | não |
| Blockers ativos | nenhum crítico (baseline certificada) |
| Warnings | G7 drift local; tendência monitorada |

---

## Resiliência por domínio

| Domínio | Score aprox. |
|---------|-------------:|
| Runtime resilience | ~95 |
| Financial resilience | 95 |
| Operational | 90 |
| Recovery readiness | ~90 |
| Rollback readiness | 90 |

---

## Certification & probes

| Item | Status |
|------|--------|
| Runtime certification | CERTIFIED |
| Financial proof | VALID |
| Availability | 100% (última certificação estável) |
| Anomaly score | 17 |

---

## Chaos & live readiness

| Área | Readiness |
|------|-----------|
| Controlled chaos | **READY** (6/6 cenários) |
| Live certification CI | **READY** (artefatos) |
| Alert routing real | **não ativo** (dry-run) |

---

## Tendência (persistence)

| Métrica | Valor |
|---------|-------|
| Histórico JSONL | iniciado |
| Forecast | monitorar após 7+ amostras |
| Degradation flag | false (baseline cert) |

---

## Comandos

```bash
node scripts/resilience/v1-5-consolidated-run.js
node scripts/activation/activation-gate-engine.js
node scripts/resilience/production-resilience-engine.js
node scripts/resilience/freeze-governance-simulator.js
node scripts/resilience/reliability-persistence-engine.js
```

---

## Referências

- [ACTIVATION-GATE-MODEL.md](ACTIVATION-GATE-MODEL.md)
- [PRODUCTION-RESILIENCE-MODEL.md](PRODUCTION-RESILIENCE-MODEL.md)
- [AUTONOMOUS-READINESS-MODEL.md](AUTONOMOUS-READINESS-MODEL.md)
