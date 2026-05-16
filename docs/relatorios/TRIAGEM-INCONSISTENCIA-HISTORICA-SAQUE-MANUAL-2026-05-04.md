# Triagem READ-ONLY — inconsistência histórica (saque manual × ledger payout)

**Data:** 2026-05-04  
**Base:** `docs/relatorios/VALIDACAO-2-BANCO-REAL-SAQUES-MANUAIS-READONLY-2026-05-04.md`  
**Regras cumpridas:** apenas leituras (REST `select`; nenhum DML aplicado pela triagem automatizada nesta sessão). Sem deploy, sem migrações.

---

## 1. Saque pendente × ledger payout (identificação precisa)

| Campo | Valor observado |
|--------|----------------|
| **`saques.id`** | `371ed41a-5053-411f-b7cc-414a2ee798ec` |
| **`saques.correlation_id`** | `30a9d56d-9689-458c-9dc7-531169bca521` |
| **`saques.usuario_id`** | `4c3b3b02-592c-4183-a53e-b05b1d9a4426` |
| **`saques.status`** | `pendente` |
| **`saques.amount`** | `10` |
| **`saques.valor`** | `10` |
| **`saques.fee`** | `2` |
| **`saques.net_amount`** | `8` |
| **`saques.created_at`** | `2026-05-04T13:29:42.312+00:00` |
| **`saques.processed_at`** | `null` |
| **`saques.updated_at`** | `2026-05-04T13:29:42.326824+00:00` |
| **`ledger_financeiro.id`** | `f63765b0-3998-4549-87e4-9c3e42d80cba` |
| **`ledger_financeiro.tipo`** | `payout_manual_confirmado` |
| **`ledger_financeiro.referencia`** | `371ed41a-5053-411f-b7cc-414a2ee798ec` |
| **`ledger_financeiro.correlation_id`** | `30a9d56d-9689-458c-9dc7-531169bca521` |
| **`ledger_financeiro.valor`** | `8` |
| **`ledger_financeiro.user_id`** | `4c3b3b02-592c-4183-a53e-b05b1d9a4426` |
| **`ledger_financeiro.created_at`** | `2026-05-04T13:29:42.912+00:00` |

**Interpretação técnica rápida:** o valor líquido do saque (`net_amount = 8`) coincide com **`ledger_financeiro.valor = 8`**. Os timestamps são **aproximadamente ~0,6 s** entre criação do saque/atualização e criação do ledger, compatível com o bug **antigo** (ledger gravado antes de consolidar `saques.status`), corrigido em `1c5bea8` para fluxos novos.

---

## 2. Para onde aponta `ledger.referencia`?

| Pergunta | Resultado |
|----------|-----------|
| Igual a **`saques.id`** (UUID texto)? | **Sim** (`referencia` == `371ed41a-5053-411f-b7cc-414a2ee798ec`) |
| Igual a **`correlation_id`** do saque? | **Não** (`referencia ≠ 30a9d56d-9689-458c-9dc7-531169bca521`) |
| Outro identificador sem relação óbvia? | **Não** — formato UUID do próprio id de `saques` |

A junção utilizada pela aplicação (`l.referencia = s.id::text` **e** `l.correlation_id = s.correlation_id`) casa **integralmente** com este par de linhas.

---

## 3. DDL mínimo (forma recomendada de confirmação)

Nesta sessão **`DATABASE_URL` não estava definido** no ambiente local; **`information_schema` / `pg_indexes` não foram consultados via Postgres direto.**

### 3.1 Evidência empírica sobre `processed_at`

O registro inconsistente existe com **`processed_at = null`** em **`pendente`**. Isso **não substitui** o catálogo SQL, mas indica compatibilidade operacional com **coluna que aceita `NULL`** em linhas já persistidas (esperado para Cirurgia 1 quando `pendente`, e para revert do approve).

### 3.2 Queries exclusivamente `SELECT` (executar no SQL Editor ou `psql`)

**Nullable `processed_at` + tipos relevantes:**

```sql
select table_name,
       column_name,
       data_type,
       character_maximum_length,
       is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'saques' and column_name in ('processed_at','status'))
    or (table_name = 'ledger_financeiro' and column_name = 'referencia')
  )
order by table_name, ordinal_position;
```

**Constraints:**

```sql
select tc.table_name,
       tc.constraint_type,
       tc.constraint_name,
       string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
where tc.table_schema = 'public'
  and tc.table_name in ('saques', 'ledger_financeiro')
group by tc.table_name, tc.constraint_type, tc.constraint_name
order by tc.table_name, tc.constraint_type;
```

**Índices:**

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('saques', 'ledger_financeiro')
order by tablename, indexname;
```

---

## 4. Decisão negocial (proposta — sem executar DML aqui)

| Opção | Descrição | Quando faz sentido |
|-------|-----------|---------------------|
| **A** | Tratar o **ledger como fonte de verdade de pagamento** e, após política definida pela operação, **alinhar `saques` para `pago_manual`** (e timestamps coerentes) | Comprovação operacional forte de que o PIX manual **foi efetivamente pago** ao jogador (~ alinhamento `net_amount` / ledger já presente). |
| **B** | Tratar o **pendente como fonte operacional** e iniciar fluxo corretivo (ex.: rollback/ajuste contábil) **sem declarar pagamento**, se não houver prova | Quando há **ledger enganoso** ou pagamento não ocorreu. |
| **C** | Manter invariante **`INVARIANT_BROKEN`** até decisão judicial de negócio; **bloquear approve/cancel** automáticos apenas documentando **exceção** | Alta incerteza, disputa ou necessidade de trilhar auditoria antes de mover estado. |

**Recomendação preliminar (somente técnico): Opção A** *condicionada* a uma confirmação explícita de tesouraria/ops (“pagamento PIX manual de R$ líquidos 8,00 realizados para o usuário”). Os dados coerentes `net_amount` ↔ `ledger.valor` e `payout_manual_confirmado` são **consistentes com pagamento intencional**; apenas a operação confirma a realidade bancária.

---

## 5. Artefatos de reproducibilidade (read-only)

Script local opcional (não comita dados; apenas consome `.env`):

```
node scripts/triagem-readonly-inconsistencia-saque-20260504.js
```

---

## Referências de código / doc

- `1c5bea8` — `INVARIANT_BROKEN` quando ledger payout existe em saque pendente.
- `docs/relatorios/VALIDACAO-2-BANCO-REAL-SAQUES-MANUAIS-READONLY-2026-05-04.md`
