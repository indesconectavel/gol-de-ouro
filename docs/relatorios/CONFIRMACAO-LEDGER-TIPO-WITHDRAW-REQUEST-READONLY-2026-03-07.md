# Confirmação: ledger_financeiro.tipo e valor 'withdraw_request' (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — sem conexão ao banco de produção.  
**Objetivo:** Verificar se a tabela ledger_financeiro aceita o valor `withdraw_request` (definição no repositório e compatibilidade com o código).

---

## Limitação

A **constraint real** da tabela em produção só pode ser conhecida executando uma query no Supabase (ex.: SQL Editor ou script read-only). Nesta auditoria foi inspecionado apenas o **repositório** (arquivos SQL e código).

---

## 1. Definição atual da constraint (repositório)

**Arquivo:** `database/schema-ledger-financeiro.sql`

```sql
create table if not exists ledger_financeiro (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  tipo text not null check (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout')),
  usuario_id uuid not null,
  valor numeric(12,2) not null,
  referencia text,
  created_at timestamptz not null default now()
);
```

A constraint CHECK da coluna **tipo** é **inline** (sem nome explícito). Em PostgreSQL ela fica com um nome gerado (ex.: `ledger_financeiro_tipo_check`).

**Definição literal da constraint (como está no repo):**

```text
CHECK (tipo IN ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout'))
```

Não foi encontrado em nenhum `.sql` do repositório um `ALTER TABLE ledger_financeiro` que altere ou substitua essa constraint para incluir `withdraw_request`.

---

## 2. Lista de valores aceitos (pela definição do repositório)

| Valor             | Aceito pela definição no repo? |
|-------------------|---------------------------------|
| deposito          | Sim                             |
| saque             | Sim                             |
| taxa              | Sim                             |
| rollback          | Sim                             |
| payout_confirmado | Sim                             |
| falha_payout      | Sim                             |
| **withdraw_request** | **Não**                      |

Ou seja: pela definição versionada no repositório, **apenas** os 6 valores acima são permitidos; **withdraw_request** **não** está na lista e seria **bloqueado** por essa CHECK.

---

## 3. Verificação dos valores usados pelo código

| Valor             | Onde o código insere                    | Aceito pelo CHECK do repo? |
|-------------------|-----------------------------------------|----------------------------|
| withdraw_request  | server-fly.js (POST /api/withdraw/request) | **Não** — bloqueado        |
| payout_confirmado | server-fly.js (webhook payout aprovado) | Sim                        |
| falha_payout      | server-fly.js (webhook) e processPendingWithdrawals.js | Sim        |
| rollback          | processPendingWithdrawals.js (rollbackWithdraw)       | Sim        |

---

## 4. withdraw_request: aceito ou bloqueado?

- **Pela definição no repositório:** o valor **withdraw_request** é **bloqueado** — não consta na lista do CHECK.
- **Em produção:** não é possível afirmar sem consultar o banco. Se a tabela em produção tiver sido criada exatamente com o `schema-ledger-financeiro.sql` (e nunca alterada), então **withdraw_request** seria rejeitado (CHECK violation) em todo insert do tipo no request de saque. Se em algum momento foi feito um `ALTER TABLE` para incluir `withdraw_request` (ou remover o CHECK), a produção pode aceitar; isso só se confirma com uma query ao catálogo (ex.: `pg_get_constraintdef` ou Supabase Table Editor).

---

## 5. Conclusão de compatibilidade com o código

| Aspecto | Conclusão |
|---------|-----------|
| **Definição no repo** | CHECK aceita: deposito, saque, taxa, rollback, payout_confirmado, falha_payout. **Não** aceita withdraw_request. |
| **Código** | Insere **withdraw_request** (server-fly.js ao criar saque), **payout_confirmado**, **falha_payout**, **rollback**. |
| **Compatibilidade repo ↔ código** | **Incompatível** para **withdraw_request**: o schema versionado bloqueia o valor que o código usa no request de saque. |
| **Produção** | **Não verificável** nesta auditoria. Recomenda-se rodar no Supabase (SQL Editor) algo como: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.ledger_financeiro'::regclass AND contype = 'c';` (ou inspecionar a tabela no painel) para ver a constraint real e confirmar se `withdraw_request` é aceito. |

**Resumo:** Pelo repositório, **withdraw_request** é **bloqueado** pela CHECK da coluna **tipo**. Para o código atual (que insere esse valor) funcionar, a tabela em produção precisa ter essa constraint alterada para incluir `withdraw_request` ou não restringir esses valores.

---

*Relatório gerado em modo READ-ONLY. Nenhuma query foi executada no banco de produção.*
