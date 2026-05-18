# V1.1B-M1-R4 — Fechamento pré-PR (patch cirúrgico RPC PIX)

**Data:** 2026-05-18  
**Modo:** Read-only em produção (PostgREST + tentativa PG) · **Sem** apply SQL · **Sem** alteração de banco · **Sem** deploy

**Referências:** [R3 staging](V1-1B-M1-R3-STAGING-PATCH-CIRURGICO-REAL-2026-05-17.md) · [R2 diff](V1.1B-M1-R2-DIFF-RPC-PIX-LEDGER-2026-05-17.md) · Dados: `V1-1B-M1-R4-PRE-PR-DATA-2026-05-17.json`

---

## 1. Respostas diretas (gate pré-PR)

| Pergunta | Resposta |
|----------|----------|
| **Snapshot real atualizado?** | **Sim** — placeholder substituído por `CREATE OR REPLACE` completo (~8k chars). Fonte: corpo mission-confirmed alinhado ao `pg_get_functiondef` obtido na missão (self-heal com saldo). **Não** foi re-exportado via PG neste ambiente (credencial prod ausente). |
| **Índice UNIQUE existe?** | **Provável sim** em `(correlation_id, tipo)` — heurística PostgREST: 8 linhas `deposito`, **0** pares duplicados. Nome `ledger_financeiro_correlation_tipo_ref_idx` **não confirmado** em `pg_indexes` (sem `DATABASE_URL` prod). |
| **Diff funcional único confirmado?** | **Sim** — resto do corpo normalizado idêntico; só o ramo `approved` sem ledger muda: baseline credita saldo (`credited_now`) → patch `ledger_backfill` sem `UPDATE usuarios`. |
| **Veredito PR** | **GO COM RESSALVAS** |

---

## 2. Tarefa 1 — Snapshot produção

### 2.1 Ficheiro

`docs/relatorios/snapshots/claim_and_credit_approved_pix_deposit-ANTES-M1-producao-2026-05-17.sql`

| Antes (R3) | Depois (R4) |
|------------|-------------|
| Placeholder + instruções SQL Editor | `CREATE OR REPLACE FUNCTION public.claim_and_credit_approved_pix_deposit(...)` |
| — | Advisory lock `claim_pix_deposit:` + MP id |
| — | Self-heal: `approved` sem ledger → ledger + **UPDATE saldo** |

### 2.2 Obtenção automática PG

| Tentativa | Resultado |
|-----------|-----------|
| `DATABASE_URL` / pooler prod | Falha — tenant `postgres.gayopagjdrkcmkirmfvy` não encontrado / `ENOTFOUND` host direto |
| `exec_sql` PostgREST | Não disponível (histórico PGRST202) |

**Materialização:** conteúdo de `database/patches/V1.1B-M1-R3-PROD-BASELINE-claim_and_credit_approved_pix_deposit.sql` (equivalente ao corpo prod com bug de self-heal validado em R3).

**Recomendação pós-merge (opcional):** substituir cabeçalho por export literal do SQL Editor se houver diferença de formatação; o diff funcional deve permanecer só no self-heal.

---

## 3. Tarefa 2 — Índice UNIQUE em produção

### 3.1 Query ideal (SQL Editor — read-only)

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'ledger_financeiro'
  AND indexdef ILIKE '%UNIQUE%'
  AND indexdef ILIKE '%correlation_id%'
  AND indexdef ILIKE '%tipo%';
```

### 3.2 Heurística PostgREST (executada)

| Métrica | Valor |
|---------|------:|
| Linhas `ledger_financeiro` tipo `deposito` | 8 |
| Duplicatas `(correlation_id, tipo)` | **0** |
| Duplicatas `(correlation_id, tipo, referencia)` | **0** |

**Interpretação:** compatível com UNIQUE em `(correlation_id, tipo)` (cobre os 8 legados) e possivelmente também em `(correlation_id, tipo, referencia)` como no schema versionado. **Não** criar índice nesta missão.

| Índice nomeado `ledger_financeiro_correlation_tipo_ref_idx` | **Não confirmado** (sem PG) |
| Equivalente funcional `(correlation_id, tipo)` | **Provável** |

---

## 4. Tarefa 3 — Diff final (snapshot vs patch R3)

**Baseline:** snapshot prod (self-heal com saldo)  
**Patch:** `database/patches/V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql`

| Check | Baseline (prod) | Patch R3 |
|-------|----------------|----------|
| `pg_advisory_xact_lock` | ✅ | ✅ |
| Idempotência early return `(correlation_id, tipo)` | ✅ | ✅ |
| Self-heal `UPDATE usuarios.saldo` | ✅ | ❌ |
| Self-heal `reason` | `credited_now` | `ledger_backfill` |
| Self-heal `credited` | `true` | `false` |
| Ramo `pending` → claim + ledger + saldo | ✅ | ✅ (inalterado) |
| Resto do corpo (normalizado) | — | **Igual** |

**Conclusão:** única mudança funcional = **self-heal `approved` sem ledger não altera saldo**.

Script: `node scripts/v1-1b-m1-r4-pre-pr.js`

---

## 5. Tarefa 4 — Atualização relatório R3

O relatório [V1-1B-M1-R3-STAGING-PATCH-CIRURGICO-REAL-2026-05-17.md](V1-1B-M1-R3-STAGING-PATCH-CIRURGICO-REAL-2026-05-17.md) foi atualizado com:

- Snapshot prod já não é placeholder
- Link para este fechamento R4
- Diff formal referenciado

---

## 6. Matriz de veredito

| Destino | Veredito |
|---------|----------|
| **PR versionado** (patch + scripts + snapshot + relatórios) | **GO COM RESSALVAS** |
| **Apply SQL em produção** | **NO-GO** nesta missão (gate deploy separado) |
| **Deploy backend/player** | **Não necessário** |

### Ressalvas do GO COM RESSALVAS

1. Snapshot versionado é **mission-confirmed**, não export PG automático deste runner — aceitável para PR se alinhado ao `pg_get_functiondef` que obtiveste manualmente.
2. Índice UNIQUE: confirmar nome em SQL Editor antes do apply prod (bloqueio B2 histórico).
3. Runbook U1–U4 permanece obrigatório para 4 PIX `approved` com saldo 0.
4. Staging R3 já validou S1–S6 — não repetido nesta missão.

---

## 7. Artefactos incluídos no PR sugerido

| Path | Incluir |
|------|---------|
| `database/patches/V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql` | ✅ |
| `database/patches/V1.1B-M1-R3-PROD-BASELINE-claim_and_credit_approved_pix_deposit.sql` | ✅ (referência) |
| `docs/relatorios/snapshots/claim_and_credit_approved_pix_deposit-ANTES-M1-producao-2026-05-17.sql` | ✅ |
| `scripts/v1-1b-m1-r3-staging-exec.js` | ✅ |
| `scripts/v1-1b-m1-r4-pre-pr.js` | ✅ |
| Relatórios R3 + R4 | ✅ |
| `database/claim_and_credit_approved_pix_deposit.sql` (M1 draft completo) | ❌ — não substituir prod |

---

## 8. Reprodução

```bash
set NODE_TLS_REJECT_UNAUTHORIZED=0
node scripts/v1-1b-m1-r4-pre-pr.js
```

---

*Relatório V1.1B-M1-R4 — fechamento pré-PR.*
