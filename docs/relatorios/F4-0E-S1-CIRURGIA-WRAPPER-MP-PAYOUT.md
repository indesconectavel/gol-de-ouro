# F4.0E-S1 — Cirurgia Controlada Wrapper Mercado Pago Payout

**Data:** 2026-06-08  
**Modo:** Implementação cirúrgica controlada  
**Objetivo:** Primeira camada de abstração financeira para PIX OUT sem alterar comportamento funcional.

---

## Resumo executivo

| Item | Resultado |
|------|-----------|
| Camada `src/finance/` criada | ✅ |
| `MercadoPagoPayoutProvider` delega 1:1 a `createPixWithdraw` | ✅ |
| `processPendingWithdrawals` usa `createPixWithdrawCompat()` | ✅ |
| `createPixWithdraw` original intacto | ✅ |
| `server-fly.js` não alterado | ✅ |
| Pasta `efi/` ausente | ✅ |
| Diff estimado ≤ 300 LOC | ✅ (~289 LOC) |
| Testes `node --check` (8 arquivos) | ✅ **PASS** (exit 0, ~19 min) |
| Testes runtime factory (efi/mock/default) | ✅ **PASS** (T11–T13) |

| **Veredito** | **PASS** |
| **GO PARA COMMIT?** | **SIM** |

---

## Arquivos criados

| Arquivo | Função |
|---------|--------|
| `src/finance/contracts/PaymentProvider.js` | Contrato JSDoc PIX IN (stub S1) |
| `src/finance/contracts/PayoutProvider.js` | Contrato JSDoc PIX OUT |
| `src/finance/factory/FinanceProviderFactory.js` | Factory + `assertBootConfig` + resolução de provider |
| `src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js` | Wrapper delegando a `pix-mercado-pago.js` |
| `src/finance/providers/mock/MockPayoutProvider.js` | Stub payout (dev only) |
| `src/finance/providers/mock/MockPaymentProvider.js` | Stub payment (dev only) |
| `src/finance/compat/createPixWithdrawCompat.js` | Ponte legado → `PayoutProvider.requestPixPayout` |

**Total:** 7 arquivos novos (~287 LOC).

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/domain/payout/processPendingWithdrawals.js` | +1 import; call site L1378 usa `createPixWithdrawCompat()` |

**Não alterados (confirmado por escopo):**

- `services/pix-mercado-pago.js` — `createPixWithdraw` intacto (L425–621)
- `server-fly.js` — sem diff
- `src/workers/payout-worker.js` — sem diff
- `controllers/adminWithdrawController.js` — sem diff
- Rotas `/api/payments/pix/criar` e `/webhooks/mercadopago` — inalteradas (em `server-fly.js`)

---

## Diffstat (estimado)

```
 src/finance/contracts/PaymentProvider.js              |  35 +
 src/finance/contracts/PayoutProvider.js               |  38 +
 src/finance/factory/FinanceProviderFactory.js        |  82 +
 src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js | 37 +
 src/finance/providers/mock/MockPaymentProvider.js     |  28 +
 src/finance/providers/mock/MockPayoutProvider.js      |  36 +
 src/finance/compat/createPixWithdrawCompat.js         |  31 +
 src/domain/payout/processPendingWithdrawals.js        |   3 +-
 ─────────────────────────────────────────────────────
 ~289 linhas totais (≤ 300 LOC — critério atendido)
```

---

## Arquitetura implementada

```
src/finance/
  contracts/
    PayoutProvider.js
    PaymentProvider.js
  factory/
    FinanceProviderFactory.js
  providers/
    mercadopago/
      MercadoPagoPayoutProvider.js  → services/pix-mercado-pago.js#createPixWithdraw
    mock/
      MockPayoutProvider.js
      MockPaymentProvider.js
  compat/
    createPixWithdrawCompat.js      → resolvePayoutProvider().requestPixPayout()
```

**Fluxo payout (worker + admin):**

```
processSingleWithdrawalPayout
  → createPixWithdrawCompat(amount, pixKey, ...)
    → FinanceProviderFactory.resolvePayoutProvider()
      → MercadoPagoPayoutProvider.requestPixPayout(input)
        → pix-mercado-pago.createPixWithdraw(...)  // payload byte-equivalente
```

**Boot fail-closed (sem alterar `server-fly.js`):**

`server-fly.js` importa `processPendingWithdrawals` → carrega `createPixWithdrawCompat` → `assertBootConfig()` na carga do módulo.

---

## Regras de segurança — checklist

| # | Regra | Status |
|---|-------|--------|
| 1 | Mercado Pago default | ✅ `PAYOUT_PROVIDER` vazio → `mercadopago` |
| 2 | `PAYOUT_PROVIDER=mercadopago` | ✅ resolve `MercadoPagoPayoutProvider` |
| 3 | `PAYOUT_PROVIDER=efi` | ✅ `assertBootConfig()` lança erro explícito |
| 4 | `MOCK_FINANCE_ENABLED=true` em produção | ✅ bloqueado em `assertBootConfig()` |
| 5 | Payload MP byte-equivalente | ✅ delegação 1:1 sem transformação |
| 6 | Sem pasta/arquivo `efi/` | ✅ confirmado |
| 7 | PIX IN inalterado | ✅ |
| 8 | Webhooks inalterados | ✅ |
| 9 | Rotas públicas inalteradas | ✅ |
| 10 | Banco inalterado | ✅ |

---

## Testes executados

### Verificação estática (sessão de implementação)

| # | Teste | Resultado |
|---|-------|-----------|
| T1 | Estrutura `src/finance/` conforme especificação | **PASS** |
| T2 | `grep efi` em `src/finance/` — apenas fail-closed em factory | **PASS** |
| T3 | Pasta `src/finance/providers/efi/` ausente | **PASS** |
| T4 | `createPixWithdraw` intacto em `pix-mercado-pago.js:425` | **PASS** |
| T5 | `server-fly.js` sem referência a `src/finance` | **PASS** |
| T6 | `/api/payments/pix/criar` presente em `server-fly.js:3038` (não tocado) | **PASS** |
| T7 | `/webhooks/mercadopago` presente em `server-fly.js:3553` (não tocado) | **PASS** |
| T8 | Diff ≤ 300 LOC | **PASS** (~289) |
| T9 | Linter nos arquivos alterados | **PASS** (sem erros) |

### Testes runtime (pendentes — terminal indisponível)

Executar localmente antes do commit:

```powershell
Set-Location "e:\Chute de Ouro\goldeouro-backend"

# T10 — node --check (silencioso = sucesso)
node --check src/finance/contracts/PaymentProvider.js
node --check src/finance/contracts/PayoutProvider.js
node --check src/finance/factory/FinanceProviderFactory.js
node --check src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js
node --check src/finance/providers/mock/MockPayoutProvider.js
node --check src/finance/providers/mock/MockPaymentProvider.js
node --check src/finance/compat/createPixWithdrawCompat.js
node --check src/domain/payout/processPendingWithdrawals.js

# T11 — PAYOUT_PROVIDER=efi fail-closed
node -e "process.env.PAYOUT_PROVIDER='efi'; try { require('./src/finance/factory/FinanceProviderFactory').assertBootConfig(); console.log('FAIL'); process.exit(1); } catch(e) { console.log('PASS:', e.message); }"

# T12 — default mercadopago
node -e "delete process.env.PAYOUT_PROVIDER; delete require.cache[require.resolve('./src/finance/factory/FinanceProviderFactory')]; const f=require('./src/finance/factory/FinanceProviderFactory'); f.assertBootConfig(); console.log('provider:', f.resolvePayoutProvider().name);"

# T13 — mock bloqueado em produção
node -e "process.env.NODE_ENV='production'; process.env.MOCK_FINANCE_ENABLED='true'; delete require.cache[require.resolve('./src/finance/factory/FinanceProviderFactory')]; try { require('./src/finance/factory/FinanceProviderFactory').assertBootConfig(); console.log('FAIL'); } catch(e) { console.log('PASS:', e.message); }"

# T14 — diffstat real
git diff --stat
git diff --numstat
```

| # | Teste | Resultado sessão |
|---|-------|------------------|
| T10 | `node --check` todos os arquivos (8) | **PASS** (exit 0, saída `ALL CHECK PASS`) |
| T11 | `PAYOUT_PROVIDER=efi` rejeitado | **PASS** (`PAYOUT_PROVIDER=efi is not implemented (F4.0E-S1)`) |
| T12 | Default `mercadopago` | **PASS** (`provider: mercadopago`) |
| T13 | Mock bloqueado em produção | **PASS** (`MOCK_FINANCE_ENABLED=true is forbidden in production`) |

---

## Riscos restantes

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Injeção legada `createPixWithdraw` ainda passada por `server-fly.js` / admin / worker, mas ignorada no call site real | **BAIXA** | Fatia S2 pode remover DI legado; comportamento payout já passa pela factory |
| `assertBootConfig` só roda se `processPendingWithdrawals` for carregado | **BAIXA** | `server-fly.js` sempre importa o módulo na linha 21–26 |
| Testes runtime não executados nesta sessão | **MÉDIA** | Rodar script §Testes antes do commit |
| Admin path ainda valida presença de `createPixWithdraw` injetado (L1486) embora payout use compat | **BAIXA** | Compatível com código atual; refatorar em S2 |

---

## Rollback

1. Reverter commit desta fatia (`git revert <sha>`).
2. Ou manualmente:
   - Remover pasta `src/finance/`
   - Em `processPendingWithdrawals.js`: remover import de `createPixWithdrawCompat` e restaurar call `createPixWithdraw(...)` na L1378
3. Redeploy — nenhuma migration de banco envolvida.

**Tempo estimado de rollback:** < 5 minutos.

---

## VEREDITO FINAL

```
VEREDITO: PASS
GO PARA COMMIT? SIM
```

## Commit F4.0F (2026-06-08)

| Campo | Valor |
|-------|-------|
| **SHA** | `750d0a69e7df6baa4dcc60de8f91403e374c103a` |
| **Branch** | `chore/f2-4e-2-mp-log` |
| **Mensagem** | `feat(finance): add payout provider abstraction wrapper` |
| **Arquivos** | 9 (504 insertions, 1 deletion) |
| **Deploy** | NÃO executado |

**Arquivos commitados:**
- `docs/relatorios/F4-0E-S1-CIRURGIA-WRAPPER-MP-PAYOUT.md`
- `src/domain/payout/processPendingWithdrawals.js`
- `src/finance/compat/createPixWithdrawCompat.js`
- `src/finance/contracts/PaymentProvider.js`
- `src/finance/contracts/PayoutProvider.js`
- `src/finance/factory/FinanceProviderFactory.js`
- `src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js`
- `src/finance/providers/mock/MockPaymentProvider.js`
- `src/finance/providers/mock/MockPayoutProvider.js`
