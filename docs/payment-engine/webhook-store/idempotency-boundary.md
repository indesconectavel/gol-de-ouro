# PE.2H — Fronteira IdempotencyStore × WebhookStorePort



## Responsabilidades



| | IdempotencyStore (PE.2G) | WebhookStorePort (PE.2H) |

|--|--------------------------|-------------------------|

| Decide duplicidade financeira | Sim | Não |

| Reserva / commit / rollback | Sim | Não |

| Registra ciclo de vida do evento | Não | Sim |

| Retry de webhook | Não | Sim |

| Status received/processing/processed/failed | Não | Sim |



## Ordem segura



1. `IdempotencyStore.exists` / `reserve` (se aplicável ao fluxo financeiro)

2. `WebhookStorePort.registerReceived`

3. Processamento do provider / claim

4. `markProcessed` **ou** `markFailed`

5. `IdempotencyStore.commit` (quando o fluxo financeiro usar reserva)



## Respostas



1. Registro do webhook ocorre **depois** da checagem/reserva idempotente no desenho alvo.

2. Ordem acima.

3. Sim — replay dry-run pode marcar store sem nova reserva se já processado.

4. Sim — reserva sem registry em falha prematura; recovery usa IdempotencyStore/pagamentos_pix.

5. Janela de corrida existe no DryRun in-memory (pré-existente); claim/ledger mitigam efeito financeiro.

6. Replay → `markProcessed` retorna `duplicate: true`.

7. Commit duplicado no store → `duplicate: true`, sem nova escrita financeira.

8. Status já `processed` não regride para `received`/`failed`.

9. Recovery de depósito consulta idempotência/`pagamentos_pix`, não tabela webhook_events (inexistente).

10. Port permite implementação transacional futura (adapter com tabela dedicada).

