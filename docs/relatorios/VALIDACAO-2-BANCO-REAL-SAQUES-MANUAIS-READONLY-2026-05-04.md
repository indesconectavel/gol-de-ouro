# Validação 2 — Banco real (read-only): saques manuais

**Data:** 2026-05-04  
**Branch:** `fix/admin-financial-integrity-v1`  
**Commits referência:** `1c5bea8` (cirurgia), `c6389b0` (validação sem deploy estática)

---

## Limites e método

| Regra | Cumprida |
|--------|-----------|
| Apenas SELECT / diagnóstico equivalente via API read-only | Sim (PostgREST `select`; nenhum DML aplicado pelo script desta sessão) |
| Sem migration / deploy | Sim |
| Sem segredos no relatório | Sim — **nenhuma URL completa, chave JWT ou connection string é reproduzida aqui.** |

### Conexão alvo inferida em produção

- O arquivo `.env` do backend (**não** versionado) contém `SUPABASE_URL_PROD`, `SUPABASE_SERVICE_ROLE_KEY_PROD`, etc.
- Como **`DATABASE_URL` não está definido** neste ambiente, a inspeção foi feita pela **via Supabase (PostgREST)** usando **par `SUPABASE_*_PROD`** quando disponível (`usingProdSuffixEnv: true`), alinhando o alvo à configuração de produção habitual do projeto.
- **Host público da instância** foi **omitido neste relatório**; conferir nos secrets Fly / Dashboard que o projeto é o esperado antes de usar estes números como decisório.
- Para **DDL completa** (`information_schema`, índices, constraints, nullable de `processed_at`), rodar na seção **Queries SQL READ-ONLY** abaixo com **SQL Editor** ou `psql` + `DATABASE_URL`.

### Script opcional reproducível

```bash
node scripts/readonly-validacao2-saques-20260504.js
```

Saída: JSON único em stdout. Depende apenas do `.env` local (**não** versionar credenciais).

---

## Schema (partial — método REST nesta corrida)

Não há `information_schema` via cliente Supabase usado quando não há `DATABASE_URL`.

### `saques` — colunas vistas nos payloads

`id`, `correlation_id`, `status`, `processed_at`, `usuario_id`, `amount`, `valor`, `fee`

### `ledger_financeiro` — colunas vistas

`id`, `correlation_id`, `referencia`, `tipo`

### `correlation_id`

- Presente em **ambas** as tabelas (confirmado pelos registros retornados).

### `saques.processed_at` aceita NULL?

| Nesta execução | Motivo |
|----------------|--------|
| **Indeterminado** | Sem consulta a `information_schema`. A cirurgia assume `NULL` na compensação — **validar com query DDL abaixo** antes de GO final. |

### `referencia` compatível com `saques.id::text`?

- Sobre linhas ledger com tipos `payout_confirmado`, `payout_manual_confirmado`, `rollback`, `rollback_manual`: **14** com texto no formato UUID; **15** linhas neste grupo no total (**1** possível formato ou tipo de referência diferente — triagem opcional pelo id da linha ledger).
- Junção código: `l.correlation_id = s.correlation_id` e `l.referencia = s.id::text`.

---

## Valores encontrados (REST + agregação em memória)

### Status em `saques`

| status (norm.) | n |
|----------------|---|
| `cancelado` | 14 |
| `rejeitado` | 7 |
| `pendente` | 1 |

- **Status fora da lista esperada pela validação 1:** **0** grupo.

### Tipos em `ledger_financeiro`

| tipo | n |
|------|---|
| `rollback` | 14 |
| `falha_payout` | 13 |
| `taxa` | 12 |
| `saque` | 12 |
| `deposito` | 8 |
| `payout_manual_confirmado` | 1 |

- **Tipos fora da lista esperada pela validação 1:** **0**.  
- **`payout_confirmado`:** **0** linhas neste snapshot.

---

## Contagens (equivalentes às queries de negócio)

| Diagnóstico | Quantidade |
|-------------|------------|
| Saques `pendente`/`pending` com ledger payout (`payout_confirmado` ou `payout_manual_confirmado`) no mesmo `correlation_id` + `referencia = id::text` | **1** |
| `pago_manual` sem linha payout no ledger | **0** |
| Grupos `(correlation_id, tipo, referencia)` com `count(*) > 1` | **0** (extras **0**) |
| `cancelado` / `cancelado_manual` com linha payout pelo join acima | **0** |

`paginationWarning` na corrida REST: **false** (volume dentro do limite do script).

---

## Classificação

| Faixa | Aplica? |
|-------|---------|
| **Banco íntegro** | **Não** — 1 inconsistência classe `pendente` + payout ledger (`INVARIANT_BROKEN`). |
| **Inconsistência histórica tratável** | **Sim** — volume único; requer revisão antes de alto tráfego. |
| **Bloqueador para deploy limpo** | **Moderado** — deploy só após corrigir/aceitar formalmente o caso e confirmar `processed_at` NULLável. |

---

## Queries SQL READ-ONLY (Supabase SQL editor / `psql`)

### Saque pendente com ledger payout

```sql
select s.id,
       s.usuario_id,
       s.status,
       s.correlation_id,
       l.id as ledger_payout_id,
       l.tipo as ledger_tipo,
       l.created_at as ledger_created_at
from public.saques s
join public.ledger_financeiro l
  on l.correlation_id = s.correlation_id
 and l.referencia = s.id::text
where lower(trim(s.status::text)) in ('pendente', 'pending')
  and l.tipo::text in ('payout_confirmado', 'payout_manual_confirmado');
```

### `pago_manual` sem payout no ledger

```sql
select s.id,
       s.usuario_id,
       s.status,
       s.correlation_id,
       s.processed_at,
       s.updated_at
from public.saques s
where lower(trim(s.status::text)) = 'pago_manual'
  and not exists (
    select 1
    from public.ledger_financeiro l
    where l.correlation_id = s.correlation_id
      and l.referencia = s.id::text
      and l.tipo::text in ('payout_confirmado', 'payout_manual_confirmado')
  );
```

### Ledger duplicado `(correlation_id, tipo, referencia)`

```sql
select correlation_id,
       tipo::text as tipo,
       referencia::text as referencia,
       count(*) as n,
       array_agg(id order by created_at) as ledger_ids
from public.ledger_financeiro
group by correlation_id, tipo::text, referencia::text
having count(*) > 1;
```

### Saques cancelados com linhas de payout

```sql
select s.id,
       s.usuario_id,
       s.status,
       count(*) filter (
         where l.tipo::text in ('payout_confirmado', 'payout_manual_confirmado')
       ) as linhas_payout
from public.saques s
join public.ledger_financeiro l
  on l.correlation_id = s.correlation_id
 and l.referencia = s.id::text
where lower(trim(s.status::text)) in ('cancelado_manual', 'cancelado')
group by s.id, s.usuario_id, s.status;
```

### Status distinct em `saques`

```sql
select lower(trim(status::text)) as status_norm,
       count(*)::bigint as n
from public.saques
group by lower(trim(status::text))
order by n desc;
```

### Tipos distinct em `ledger_financeiro`

```sql
select tipo::text as tipo,
       count(*)::bigint as n
from public.ledger_financeiro
group by tipo::text
order by n desc;
```

### Colunas `saques` / `ledger_financeiro` (tipos e nullable)

```sql
select table_name,
       column_name,
       data_type,
       is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('saques', 'ledger_financeiro')
order by table_name, ordinal_position;
```

### Constraints

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

### Índices

```sql
select tablename as table_name,
       indexname,
       indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('saques', 'ledger_financeiro')
order by tablename, indexname;
```

---

## Parecer GO / NO-GO — deploy controlado

| Aspecto | Parecer |
|---------|---------|
| Evidência read-only sem DML contra cluster carregado via credenciais de produção (`.env` `_PROD`) | **GO** |
| Invariante `pendente` + ledger payout no snapshot | **1** — **NO-GO deploy “limpo”** até tratamento aceito |
| `processed_at` NULL no DDL | **Confirmar separadamente** — **GO parcial até lá** |

---

## Referências

- `docs/relatorios/VALIDACAO-1-CIRURGIA-SAQUES-MANUAIS-SEM-DEPLOY-2026-05-04.md`
- `docs/relatorios/CIRURGIA-1-INTEGRIDADE-SAQUES-MANUAIS-2026-05-04.md`
