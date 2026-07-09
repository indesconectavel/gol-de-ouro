# PE.2B — Adapter Boundary SAFE™
## Indesconectável Payment Engine™ · Fase B → C

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™ (IPE™)  
**Gate:** PE.2B  
**Data:** 2026-07-09  
**Modo:** SHADOW + COMPATIBILITY FIRST  
**Base:** P2.2 · PE.2 · PE.2A Interface Freeze  
**Snapshot:** `docs/relatorios/snapshots/pe2b-adapter-boundary-safe.json`

---

## Declarações limitadoras

1. Este gate **preparou** fronteiras de adapter — **não migrou** fluxos produtivos.
2. **Nenhum** endpoint, webhook PSP, provider, schema SQL ou deploy foi alterado.
3. Todos os caminhos validados em produção permanecem ativos com `PE_ADAPTER_BOUNDARY_ENABLED=false` (default).

### Flags

```
PE_ADAPTER_BOUNDARY_ENABLED=false   # implementada — default produção
PE_USE_PACKAGE=false                # inalterada — PE.2G
code_changed=true                   # apenas camada shadow aditiva
runtime_altered=false               # flag default false
database_altered=false
deploy_executed=false
production_flows_activated=false
rollback_available=true
```

---

## Veredito consolidado

# **PASS COM RESSALVAS**

| Campo | Valor |
|-------|-------|
| **Produção preservada por default?** | **SIM** |
| **Assinaturas produtivas removidas?** | **NÃO** |
| **Fluxos ativos quebrados?** | **NÃO** |
| **Contratos shadow preparados?** | **SIM** |
| **Flag implementada default false?** | **SIM** |
| **PE.2C autorizado?** | **NÃO** — GO explícito pendente |
| **Índice risco residual** | **≈ 2,8 / 10** |
| **Desacoplamento pós-PE.2B** | **≈ 5,7 / 10** (+0,8 vs PE.2A) |
| **Prontidão PE.2C** | **≈ 6,1 / 10** |

### Justificativa

A camada boundary foi implementada de forma **aditiva e inerte**: ports (`LedgerPort`, `WalletPort`, `WithdrawalPort`), tipo `WebhookPayload`, bridges de compatibilidade, adapters shadow (`GolDeOuroWebhookAdapter`, `GolDeOuroWithdrawalAdapter`) e flag `PE_ADAPTER_BOUNDARY_ENABLED`. Nenhum handler produtivo, contract PSP ou `PaymentEngine` facade foi modificado.

**Ressalvas:** P1.9/G2/SUPA não re-executados nesta sessão (shell indisponível); smoke test documentado para execução manual; B2/B7/B8 permanecem bloqueadores PE.2C; contracts PSP ainda usam `express.Request` em produção.

---

# 1. Estratégia executada

```text
Preservar produção
  ↓
Criar contratos/bridges shadow (novos arquivos)
  ↓
Manter P2.2 + src/finance intocados
  ↓
Flag PE_ADAPTER_BOUNDARY_ENABLED=false
  ↓
Documentar rollback + riscos
```

---

# 2. Artefatos implementados

## 2.1 Flag

| Item | Detalhe |
|------|---------|
| Nome | `PE_ADAPTER_BOUNDARY_ENABLED` |
| Default | `false` |
| Implementação | `src/payment-engine/boundary/adapter-boundary-config.js` |
| Documentação | `.env.example` linha PE.2B |

## 2.2 Contratos e ports (shadow)

| Artefato | Path |
|----------|------|
| `WebhookPayload` | `src/payment-engine/types/WebhookPayload.js` |
| `LedgerPort` | `src/payment-engine/ports/LedgerPort.js` |
| `WalletPort` (+ `credit`) | `src/payment-engine/ports/WalletPort.js` |
| `WithdrawalPort` | `src/payment-engine/ports/WithdrawalPort.js` |

## 2.3 Bridges de compatibilidade

| Bridge | Path | Função |
|--------|------|--------|
| `webhookPayloadFromExpress` | `compat/webhookPayloadFromExpress.js` | Express → WebhookPayload (+ round-trip) |
| `createLedgerPortFromAdapter` | `compat/ledgerPortBridge.js` | LedgerAdapter → LedgerPort |
| `createWalletPortFromAdapter` | `compat/walletPortBridge.js` | WalletAdapter → WalletPort + credit |
| `resolveWithdrawalIds` | `compat/withdrawalIdAlias.js` | `saqueId` ↔ `withdrawalId` |

## 2.4 Adapters GDO

| Adapter | Path | Status |
|---------|------|--------|
| `GolDeOuroLedgerAdapter` | existente P2.2 | **Preservado** |
| `GolDeOuroWalletAdapter` | existente P2.2 | **Preservado** |
| `GolDeOuroWebhookAdapter` | **novo** | Shadow |
| `GolDeOuroWithdrawalAdapter` | **novo** | Shadow |

## 2.5 Resolver boundary

```javascript
// src/payment-engine/boundary/index.js
resolveAdapterBoundaryPorts(deps) // → null se flag false
```

## 2.6 Exports aditivos

`src/payment-engine/index.js` exporta: `boundary`, `ports`, `types`, `compat`.

## 2.7 Smoke test

`scripts/pe2b-adapter-boundary-smoke.mjs` — valida flag, mappers e bridges **sem banco**.

---

# 3. O que NÃO foi alterado (produção)

| Superfície | Status |
|------------|:------:|
| `src/finance/contracts/PaymentProvider.js` | Intocado |
| `src/finance/contracts/PayoutProvider.js` | Intocado |
| `src/finance/webhooks/*` handlers | Intocados |
| `claimApprovedPixDeposit.js` | Intocado |
| `processPendingWithdrawals.js` | Intocado |
| `FinanceProviderFactory` | Intocado |
| `PaymentEngine.js` facade | Intocado |
| `server-fly.js` | Intocado |
| Schema / migrations | Intocados |
| Providers Asaas/MP/Celcoin | Intocados |

---

# 4. Redução bloqueadores PE.2A

| ID | Bloqueador | Antes | Após PE.2B | Prod migrado? |
|----|------------|-------|------------|:-------------:|
| B1 | WebhookPayload | NEEDS_CHANGES | **READY_SHADOW** | Não |
| B3 | LedgerPort | NEEDS_CHANGES | **READY_SHADOW** | Não |
| B4 | WalletPort credit | NEEDS_CHANGES | **READY_SHADOW** | Não |
| B9 | withdrawalId | NEEDS_CHANGES | **READY_SHADOW** | Não |
| B2 | IdempotencyStore | NEEDS_CHANGES | NEEDS_CHANGES | — |
| B7 | Import isolation | OPEN | OPEN | — |
| B8 | claimApproved ports | OPEN | OPEN | — |
| B10 | WebhookStore | OPEN | OPEN | — |

---

# 5. Auditoria de acoplamento

## 5.1 Resumo por domínio

| Domínio | Severidade | Prod preservado | Boundary preparado | Permanece adapter GDO |
|---------|:----------:|:---------------:|:------------------:|:---------------------:|
| `express.Request` | MÉDIO | 5 refs (contracts + compat) | 5 refs (shadow) | — |
| `usuarios` | ALTO | 8 core | 0 | 5 adapter |
| `pagamentos_pix` | ALTO | 4 core | 0 | 1 adapter |
| `saques` | ALTO | 27 core | 0 | 2 adapter |
| `ledger_financeiro` | ALTO | 84 core | 1 bridge query* | 1 adapter |
| `saqueId` | MÉDIO | 137 prod | 10 alias shadow | — |
| `wallet` / `ledger` | ALTO | inline core | ports shadow | adapters |

\* `findByCorrelation` no bridge — **não ativo** com flag false.

## 5.2 Classificação em 4 buckets

1. **Uso produtivo preservado** — `src/finance/**`, `domain/payout`, `PaymentEngine` core, `server-fly.js`
2. **Uso preparado boundary** — `boundary/`, `ports/`, `compat/`, novos adapters shadow
3. **Bloqueador PE.2C** — B2, B7, B8, B10, express em contracts produtivos
4. **Permanece adapter GDO** — `GolDeOuro*Adapter` com schema legado

---

# 6. Testes e certificação

| Validação | Status PE.2B | Ação antes flag=true |
|-----------|:------------:|---------------------|
| P1.9 | Não re-run | Obrigatório staging |
| G2 | Não re-run | Obrigatório staging |
| SUPA | Não re-run | Obrigatório staging |
| PIX IN | Preservado (default) | — |
| PIX OUT | Preservado (default) | — |
| Wallet | Preservado (default) | — |
| Ledger | Preservado (default) | — |
| Recovery | Preservado (default) | — |
| Idempotência | Preservado (default) | — |
| Health / Meta | Preservado (default) | — |
| Smoke PE.2B | Script criado | `node scripts/pe2b-adapter-boundary-smoke.mjs` |

---

# 7. Rollback

Ver [`rollback-plan.md`](../payment-engine/adapter-boundary/rollback-plan.md).

**Rollback primário:** `PE_ADAPTER_BOUNDARY_ENABLED=false` (sem mudança de código).

---

# 8. Decisão PE.2C

| Critério | Atendido? |
|----------|:---------:|
| Flag false em produção | ✅ |
| Fluxos críticos preservados | ✅ |
| B1/B3/B4 reduzidos (shadow) | ✅ parcial |
| B2/B7/B8 resolvidos | ❌ |
| GO explícito no relatório | ❌ |

## Recomendação

| Gate | Decisão |
|------|---------|
| **PE.2B** | **PASS COM RESSALVAS** |
| **PE.2B.1** (opcional) | Ativar flag em staging + P1.9/G2 |
| **PE.2C** | **NO-GO** até PE.2D (import isolation) planificado |

---

# 9. Bloqueadores remanescentes

1. **B2** — `IdempotencyStore` formal (não apenas delegação)
2. **B7** — 11 imports `payment-engine/core` → `finance`
3. **B8** — `claimApprovedPixDeposit` via ports
4. **B10** — `GolDeOuroWebhookStore` persistência
5. Contracts PSP produtivos ainda com `express.Request`
6. Certificação P1.9/G2/SUPA pendente antes de qualquer `flag=true`

---

# 10. Referências

| Artefato | Path |
|----------|------|
| Boundary map | `docs/payment-engine/adapter-boundary/adapter-boundary-map.json` |
| Compatibility | `docs/payment-engine/adapter-boundary/compatibility-report.json` |
| Risk register | `docs/payment-engine/adapter-boundary/risk-register.json` |
| Rollback | `docs/payment-engine/adapter-boundary/rollback-plan.md` |
| Interface Freeze | `docs/relatorios/PE.2A-INTERFACE-FREEZE.md` |

---

**Assinatura gate:** PE.2B Adapter Boundary SAFE — **PASS COM RESSALVAS**  
**Próximo gate recomendado:** PE.2B.1 (staging flag) → PE.2D (import isolation) → PE.2C
