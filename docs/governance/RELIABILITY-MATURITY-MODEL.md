# Modelo de maturidade de confiabilidade (V1.3)

## Níveis

### 1. Reativo

- Incidentes descobertos por usuários
- Sem baseline fixo
- Deploy ad-hoc

### 2. Observável

- Scripts manuais pontuais
- Relatórios V1.1x ad-hoc
- Logs sem agregação

### 3. Monitorado

- **V1.2A–E:** baseline, alertas, drift, watchdogs, score
- Runbooks V1.2D
- Métricas live vs threshold

### 4. Governado

- Certificação contínua (V1.3)
- Proof hashes financeiros
- Templates incident/postmortem
- Simulações tabletop
- CI examples (prontos para ativar)

### 5. Autônomo

- CI schedule ativo + gates NO-GO
- Alertas externos (PagerDuty/Slack)
- Auto-remediação **aprovada** (fora escopo atual)
- SLO/error budget

---

## Classificação atual — Gol de Ouro (2026-05-19)

| Critério | Evidência | Nível |
|----------|-----------|------:|
| Baseline certificado V1.1G | Sim | 3+ |
| Watchdogs + score V1.2E | Sim | 3+ |
| Runbooks + IR V1.2D | Sim | 3+ |
| Proof + certification V1.3 | Sim | **4** |
| CI ativo | Não (examples only) | &lt;5 |
| Autonomous gates | Manual script | &lt;5 |

**Nível atual: 4 — Governado** (entrada; tendência a consolidar governança antes de autônomo)

**Nível anterior (pré-V1.3):** 3 — Monitorado

---

## Roadmap para Autônomo (5)

1. Ativar `continuous-verification` em GHA (workflow_dispatch 2 semanas)
2. Gate PR: score ≥ 90 ou justificativa
3. Notificação automática DEGRADED/CRITICAL
4. Dashboard dinâmico (opcional Grafana)
5. Game days trimestrais usando `docs/reliability/simulations/`
