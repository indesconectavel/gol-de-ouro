# Validação READ-ONLY — Patch V1.1 payout_worker

**Data:** 2026-03-06  
**Modo:** Somente leitura (nenhuma alteração de código, frontend ou /game).  
**Objetivo:** Confirmar se o worker passa a revelar a causa exata do bloqueio dos 5 saques presos e se a seleção ficou observável.

---

## Resultado: **CONDITIONAL PASS** (patch ainda não deployado)

A validação foi executada; os **novos sinais do Patch V1.1 não aparecem nos logs** porque o commit `0f09038` (patch V1.1) **ainda não está em execução no Fly**. O worker em produção segue com a versão anterior. Assim:

- **PASS** no que se refere a: relatório, anexos e script de validação gerados; estado dos 5 saques e diagnóstico coerente com “patch não deployado”.
- **Pendente:** Confirmar causa exata e seleção observável **após deploy** do patch e nova coleta de logs.

---

## A) Presença dos novos sinais nos logs

| Sinal | Esperado (pós-deploy) | Encontrado |
|-------|------------------------|------------|
| `[PAYOUT][CYCLE]` | enabled= db= provider= | **0** |
| `[PAYOUT][QUERY]` | statuses= count= | **0** |
| `[PAYOUT][SELECT]` | saqueId= status= | **0** |
| `[PAYOUT][SKIP]` | motivo= | **0** |
| `[PAYOUT][ROLLBACK_FAIL]` | saqueId= motivo= | **0** |

**Conclusão A:** Nenhum sinal do Patch V1.1 foi encontrado nas últimas ~600 linhas de log. **patch_visivel: false** — o código do patch não está rodando no app atual.

---

## B) Saques presos (releitura)

| Métrica | Valor |
|---------|--------|
| Total presos (>30 min, status processando) | **5** |
| Foram selecionados? | Não observável (sem [PAYOUT][SELECT] nos logs) |
| Motivo de skip claro? | N/A (patch não deployado) |
| Indicação env/config/provider desabilitado? | N/A (sem [PAYOUT][CYCLE]) |

**IDs (8 primeiros caracteres):** ea3e4dec, ecd0045f, da70665c, ed46001f, 8d11c1a2.  
Todos com `processed_at` e `transacao_id` nulos; **0** entradas no ledger por saque.

---

## C) Conclusão

### Causa confirmada final

- **Nesta validação:** Não foi possível confirmar a causa exata do bloqueio **nos logs atuais**, porque o Patch V1.1 ainda não está em produção.
- **Diagnóstico registrado:** `patch_v1_1_nao_visivel_nos_logs` — próximo passo é fazer deploy do commit do patch e recolher logs para que [PAYOUT][CYCLE], [PAYOUT][QUERY] e, se aplicável, [PAYOUT][SELECT]/[SKIP]/[ROLLBACK_FAIL] revelem:
  - se `enabled`/`db`/`provider` estão ok;
  - se a query de elegíveis retorna count=5 ou 0;
  - se há seleção, skip ou falha de rollback.

### Próximo patch mínimo necessário

1. **Deploy:** Fazer deploy do commit **0f09038** (Patch V1.1) no Fly (process group `payout_worker`) e aguardar pelo menos um ciclo (ex.: 30 s).
2. **Revalidar:** Rodar novamente o script `scripts/validate-payout-v1_1-readonly.js` (ou equivalente) e inspecionar:
   - **payout-v1_1-worker-logs.json:** `patch_visivel === true` e amostras de [PAYOUT][CYCLE] e [PAYOUT][QUERY].
   - **payout-v1_1-diagnostico-final.json:** `causa_confirmada_final` e `proximo_patch_minimo`.
3. A partir dos novos logs, aplicar apenas o necessário:
   - **1. env/config** — se [PAYOUT][CYCLE] mostrar `enabled=false` ou `db=fail` ou `provider=fail`.
   - **2. query/status** — se [PAYOUT][QUERY] mostrar `count=0` com 5 saques no banco (inconsistência) ou `inconsistencia` no log.
   - **3. rollback** — se aparecer [PAYOUT][ROLLBACK_FAIL]; então corrigir update do saque para rejeitado.
   - **4. provider MP** — se `provider=fail` ou falha explícita do MP nos logs.

---

## Anexos gerados

| Anexo | Descrição |
|-------|-----------|
| `payout-v1_1-worker-logs.json` | Contagens e amostras dos sinais V1.1; patch_visivel=false |
| `payout-v1_1-saques-status.json` | 5 saques presos; ledger 0 por saque |
| `payout-v1_1-diagnostico-final.json` | causa_confirmada_final, proximo_patch_minimo |

---

## Resposta final

| Item | Valor |
|------|--------|
| **PASS/FAIL** | **CONDITIONAL PASS** (validação executada; causa exata só confirmável após deploy do patch) |
| **Causa confirmada** | **Patch V1.1 não está nos logs** — necessário deploy do commit 0f09038 para revelar enabled/db/provider e count da query |
| **Próximo patch recomendado** | **1)** Fazer deploy do Patch V1.1 no Fly. **2)** Reexecutar validação read-only e, com os novos logs, aplicar apenas o item necessário: env/config, query/status, rollback ou provider MP. |

---

*Validação 100% read-only; frontend e /game não foram alterados.*
