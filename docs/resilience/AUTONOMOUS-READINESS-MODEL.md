# Modelo de readiness autônomo (V1.5)

## Níveis

| Nível | Características |
|-------|-----------------|
| **1 Manual** | Ad-hoc; sem gates |
| **2 Assistido** | Scripts manuais V1.2 |
| **3 Governado** | V1.2D–V1.3 runbooks + certification |
| **4 Semi-autônomo** | V1.4–V1.5 gates, freeze sim, persistence |
| **5 Autônomo** | CI ativo + alertas + auto-freeze real |

## Classificação atual — Gol de Ouro (2026-05-19)

| Evidência | Nível |
|-----------|-------|
| Watchdogs + score + proof | 3+ |
| External cert + routing mock | 4 |
| Activation gates dry-run | **4** |
| CI/alertas live | &lt;5 |

**Nível atual: 4 — Semi-autônomo**

## Gate para nível 5

1. [ ] activation-gate em CI (workflow_dispatch 30 dias)
2. [ ] Slack P0/P1 testado (staging webhook)
3. [ ] UptimeRobot `/health`
4. [ ] Zero NO-GO em janela
5. [ ] Game day com `controlled-chaos-readiness` READY
