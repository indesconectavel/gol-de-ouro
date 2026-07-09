# PE.2B — Rollback Plan
## Adapter Boundary SAFE

**Gate:** PE.2B  
**Data:** 2026-07-09  
**Princípio:** Produção preservada por default — rollback = manter flag desligada

---

## 1. Rollback imediato (0–5 min)

### Passo 1 — Garantir flag desligada

```env
PE_ADAPTER_BOUNDARY_ENABLED=false
```

Ou remover a variável do ambiente (default implícito = `false`).

**Efeito:** `resolveAdapterBoundaryPorts()` retorna `null`; nenhum port shadow é resolvido.

### Passo 2 — Reiniciar processo (se flag foi ligada em runtime)

```bash
# Fly / host — apenas se PE_ADAPTER_BOUNDARY_ENABLED foi setada true
fly apps restart goldeouro-backend-v2
```

Com flag `false`, **não é necessário restart** para rollback — caminhos legados já estão ativos.

---

## 2. Rollback de código (se necessário)

PE.2B foi **aditivo**. Nenhuma assinatura produtiva foi removida.

### Opção A — Revert commit PE.2B (Git)

```bash
git revert <commit-pe2b>
```

Arquivos removíveis sem impacto em produção (nunca foram wired):

- `src/payment-engine/boundary/**`
- `src/payment-engine/ports/**`
- `src/payment-engine/types/WebhookPayload.js`
- `src/payment-engine/compat/**` (PE.2B)
- `src/payment-engine/adapters/goldeouro/GolDeOuroWebhookAdapter.js`
- `src/payment-engine/adapters/goldeouro/GolDeOuroWithdrawalAdapter.js`
- `scripts/pe2b-adapter-boundary-smoke.mjs`

### Opção B — Reverter apenas exports aditivos

Em `src/payment-engine/index.js`, remover blocos `boundary`, `ports`, `types`, `compat`.

Em `src/payment-engine/adapters/goldeouro/index.js`, remover `webhookAdapter` e `withdrawalAdapter` do factory return.

**PaymentEngine.js e src/finance/** permanecem intocados.

---

## 3. Validação pós-rollback

| Check | Comando / evidência |
|-------|---------------------|
| Flag false | `node -e "process.env.PE_ADAPTER_BOUNDARY_ENABLED='false'; console.log(require('./src/payment-engine/boundary').isAdapterBoundaryEnabled())"` → `false` |
| Health | `GET /health` — inalterado |
| Meta PSP | `GET /api/monitoring/health` — inalterado |
| P1.9 | `node scripts/p19-certification.cjs` (staging antes de prod) |
| G2 | Workflow staging conforme `G2-VALIDACAO-STAGING-*` |

---

## 4. O que NÃO fazer no rollback

- ❌ Não alterar `src/finance/contracts/*` em rollback PE.2B
- ❌ Não desmontar webhooks PSP
- ❌ Não reverter P2.2 adapters base (`GolDeOuroWalletAdapter`, etc.)
- ❌ Não executar migration SQL
- ❌ Não force-push produção

---

## 5. Escalonamento

| Cenário | Ação |
|---------|------|
| Flag true em staging com regressão | Set false + restart staging |
| Flag true em produção (incidente) | **P0** — false imediato + restart + P1.9 smoke |
| Bug em bridge shadow com flag false | Baixa prioridade — shadow não está em uso |

---

## 6. Critério de rollback bem-sucedido

1. `PE_ADAPTER_BOUNDARY_ENABLED=false` em todos os ambientes produtivos  
2. PIX IN/OUT, wallet, ledger, recovery comportam-se como pré-PE.2B  
3. P1.9 PASS em staging (se flag havia sido testada)  
4. Nenhum endpoint ou webhook alterado  

---

**Autoridade:** PE.2B — rollback não autoriza PE.2C
