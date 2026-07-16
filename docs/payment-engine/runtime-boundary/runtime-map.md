# Runtime Map — PE.2K



## Entrypoints



| Componente | Path | Papel |

|------------|------|--------|

| Bootstrap HTTP | `server-fly.js` | API + PaymentEngine.start + payout helpers |

| Payout worker | `src/workers/payout-worker.js` | Filas PIX OUT (Fly process) |

| Asaas recovery | `scheduler/asaasPayoutRecoveryScheduler.js` | Timer recovery |

| MP deposit reconcile | `scheduler/mpDepositReconcile.js` | Timer PIX IN |

| Admin withdraw | `controllers/adminWithdrawController.js` | Ações manuais |



## Fluxo pós-PE.2K



```text

Worker / Admin / server-fly payout / Asaas scheduler

  → RuntimeBoundary

      [flag OFF] → domain/finance (legado idêntico)

      [flag ON]  → PaymentEngine → ports/bridges → adapters → legado

```



## Timers



- `PaymentEngine.start()` → `scheduler/index.js` intervals (MP + Asaas)

- Worker: `setInterval(runCycle)` + heartbeat log-only

