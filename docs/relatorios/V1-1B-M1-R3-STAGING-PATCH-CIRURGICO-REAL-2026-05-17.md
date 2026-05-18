# V1.1B-M1-R3 — Staging do patch cirúrgico real (RPC PIX)

**Data:** 2026-05-17  
**Ambiente:** Staging `uatszaqzdqcwnfbipoxg` (pooler `aws-0-sa-east-1`, porta 5432)  
**Modo:** Apply **somente** em staging · Produção **não** alterada · Sem deploy · Sem mudanças em backend/player

**Artefactos:**

| Ficheiro | Papel |
|----------|--------|
| `database/patches/V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql` | Patch alvo (self-heal corrigido) |
| `database/patches/V1.1B-M1-R3-PROD-BASELINE-claim_and_credit_approved_pix_deposit.sql` | Baseline prod (bug self-heal) — espelhada no snapshot prod (R4) |
| `scripts/v1-1b-m1-r3-staging-exec.js` | Execução automatizada S1–S6 |
| `docs/relatorios/V1-1B-M1-R3-STAGING-EXEC-DATA-2026-05-17.json` | Evidências JSON |

---

## 1. Resumo executivo

| Item | Resultado |
|------|-----------|
| Patch aplicado em staging | ✅ `V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql` |
| Produção (`gayopagjdrkcmkirmfvy`) | ❌ Não tocada |
| Testes S1–S6 (massa `999…`) | **Todos PASS** |
| Regressão pré-patch (bug self-heal) | **PASS** — baseline creditou saldo em dobro no cenário S4 |
| Só o self-heal mudou? | **Sim (intenção funcional)** — advisory lock, claim `pending→approved`, ledger+saldo no ramo principal preservados |
| Drift vs baseline | ⚠️ Comentários/COMMENT + diferença de tamanho (7989 → 8237 chars); diff automático por bloco não isolou 100% (formatação `pg_get_functiondef`) |
| Veredito PR versionado (pré-R4) | **GO COM RESSALVAS** → ver [R4](V1-1B-M1-R4-FECHAMENTO-PRE-PR-RPC-PIX-LEDGER-2026-05-17.md) |

---

## 2. Baseline e patch

### 2.1 Snapshot produção no repositório

**Atualizado em R4 (2026-05-18):** o placeholder foi substituído por corpo `CREATE OR REPLACE` versionado em `docs/relatorios/snapshots/claim_and_credit_approved_pix_deposit-ANTES-M1-producao-2026-05-17.sql` (baseline mission-confirmed com self-heal que credita saldo). Diff formal vs patch R3: [R4](V1-1B-M1-R4-FECHAMENTO-PRE-PR-RPC-PIX-LEDGER-2026-05-17.md).

### 2.2 Baseline usada em staging

Foi aplicada a baseline sintética `V1.1B-M1-R3-PROD-BASELINE-claim_and_credit_approved_pix_deposit.sql`, alinhada às características confirmadas da RPC de produção:

- `pg_advisory_xact_lock(hashtextextended('claim_pix_deposit:' || payment_id, 0))`
- Idempotência ledger `(correlation_id, tipo)` (+ índice UNIQUE `(correlation_id, tipo, referencia)`)
- Ramo principal: `pending` → `approved` + `INSERT ledger deposito` + `UPDATE usuarios.saldo`
- **Self-heal (bug):** `approved` sem ledger → ledger **+** crédito de saldo (`credited: true`, `reason: credited_now`)

### 2.3 Patch R3 (única alteração funcional)

No ramo `IF v_status_norm = 'approved'` (sem ledger prévio):

| Antes (baseline / prod bug) | Depois (R3) |
|-----------------------------|---------------|
| `INSERT ledger` + `UPDATE saldo` | `INSERT ledger` apenas |
| `credited: true` | `credited: false` |
| `reason: credited_now` | `reason: ledger_backfill` |
| — | `idempotent: true`, `saldo_unchanged: true` (opcional no JSON) |

**Inalterado:** advisory lock, lookup `FOR UPDATE`, check ledger existente, ramo `pending`, ramo concorrência (`v_rows_claimed = 0`), `EXCEPTION`.

---

## 3. Pré-voo staging

| Check | Resultado |
|-------|-----------|
| Fingerprint PIX | 0 total / 0 approved (staging vazio — OK) |
| RPC antes do R3 | Corpo M1 draft anterior (8681 chars, `referencia IN`, sem advisory lock) |
| Índice UNIQUE `ledger_financeiro_correlation_tipo_ref_idx` | Garantido (`IF NOT EXISTS`) |
| Massa de teste | Prefixo `999000000000…`, utilizador `stg-m1-pix-ledger@test.local` |

---

## 4. Regressão pré-patch (prova do bug)

Cenário equivalente ao **S4** com baseline **antes** do patch:

- PIX `approved`, saldo já creditado manualmente (+7.77), sem ledger
- Chamada RPC → `credited: true`, `reason: credited_now`, saldo **+7.77** novamente (double-credit)

**Resultado:** **PASS** como regressão do bug (comportamento indesejado reproduzido de forma controlada).

---

## 5. Testes obrigatórios (pós-patch R3)

| ID | Cenário | Resultado | Evidência chave |
|----|---------|-----------|-----------------|
| **S1** | Pending novo → claim + ledger + saldo | **PASS** | `reason=credited_now`, `credited=true`, 1 ledger, saldo +7.77 |
| **S2** | Repetição mesmo `payment_id` | **PASS** | `already_credited`, sem novo ledger/saldo |
| **S3** | Approved + ledger legado (`referencia=payment_id`) | **PASS** | `already_credited`, 1 ledger, saldo estável |
| **S4** | Approved sem ledger, saldo já creditado | **PASS** | `ledger_backfill`, `credited=false`, saldo inalterado, 1 ledger canónico |
| **S5** | Approved sem ledger, saldo 0 | **PASS** | `ledger_backfill`, saldo permanece 0 → **runbook manual** (U1–U4) |
| **S6** | Concorrência (2 sessões) | **PASS** | 1× `credited_now`, 1× idempotente, 1 ledger, 1 crédito de saldo |

Dados completos: `V1-1B-M1-R3-STAGING-EXEC-DATA-2026-05-17.json`.

---

## 6. Drift e escopo da alteração

| Pergunta | Resposta |
|----------|----------|
| Só o self-heal mudou? | **Sim** — única mudança de comportamento observada nos testes; ramo principal e idempotência intactos |
| Advisory lock preservado? | **Sim** — presente no corpo pós-apply (8237 chars) |
| `ledger_backfill` presente? | **Sim** |
| Drift estrutural automático | ⚠️ `only_self_heal_changed=false` no comparador (COMMENT + comentários R2/R3 no SQL fonte; normalização `pg_get_functiondef`) |
| Drift funcional | **Nenhum** nos S1–S6 |
| Substituir por M1 draft completo? | **Não** — staging tinha M1 sem advisory lock; R3 restaura modelo prod + fix cirúrgico |

**R4:** diff automatizado confirma **única** alteração funcional no self-heal (baseline credita saldo → patch `ledger_backfill` sem saldo). Se export SQL Editor prod diferir do snapshot, aplicar só o hunk em `V1.1B-M1-R2-DIFF-RPC-PIX-LEDGER-2026-05-17.md` §3.

---

## 7. Riscos residuais (produção)

| Risco | Mitigação |
|-------|-----------|
| 4 PIX suspeitos (saldo 0, sem ledger) | `ledger_backfill` **não** credita — runbook U1–U4 |
| ~30 approved já creditados sem ledger | R3 evita double-credit no self-heal |
| Snapshot prod ausente no repo | Colar SQL Editor antes do PR de apply |
| Índice UNIQUE em prod | Confirmar no gate pré-prod (bloqueio B2) |

---

## 8. Veredito

| Destino | Veredito |
|---------|----------|
| Staging R3 | **PASS** (S1–S6) |
| PR versionado do patch SQL | **GO COM RESSALVAS** (R4) — merge permitido; apply prod continua gate separado |
| Apply produção | **NO-GO** nesta missão (fora de escopo) |
| Deploy backend/player | **Não necessário** |

---

## 9. Comandos de reprodução

```bash
# Somente staging — requer DATABASE_URL → uatszaqzdqcwnfbipoxg no .env.local
set NODE_TLS_REJECT_UNAUTHORIZED=0
node scripts/v1-1b-m1-r3-staging-exec.js
```

---

*Relatório gerado por V1.1B-M1-R3-STAGING-EXEC — 2026-05-17.*
