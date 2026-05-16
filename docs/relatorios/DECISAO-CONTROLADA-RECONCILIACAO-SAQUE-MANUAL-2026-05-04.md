# Decisão controlada — reconciliação histórica (saque manual)

**Data:** 2026-05-04  
**Saque objeto:** `371ed41a-5053-411f-b7cc-414a2ee798ec`  
**Documento-base:** `docs/relatorios/TRIAGEM-INCONSISTENCIA-HISTORICA-SAQUE-MANUAL-2026-05-04.md`

**Premissas desta decisão:**

- **Nenhum DML foi executado** na elaboração deste documento (**sem INSERT/UPDATE/DELETE**).
- **Sem deploy.**

---

## 1. DDL oficial — modo de confirmação em dupla fonte

### 1.1 Cluster Postgres (runtime) — obrigatório antes de aplicar UPDATE em produção

O ambiente de automação atual **não dispõe de `DATABASE_URL`**; **`information_schema` não foi interrogado contra o BD real**. Deve repetir‑se apenas com **SQL read-only**:

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

```sql
select rel.relname as table_name,
       tc.contype AS constraint_type,
       tc.conname AS constraint_name,
       pg_get_constraintdef(tc.oid, true) as definition
from pg_constraint tc
join pg_class rel on rel.oid = tc.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname in ('saques','ledger_financeiro')
order by rel.relname, tc.contype::text;
```

*(Alternativa equivalente apenas com `information_schema` já documentada na triagem.)*

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('saques', 'ledger_financeiro')
order by tablename, indexname;
```

### 1.2 Repositório (canônico do projeto — **pode divergir** do drift em produção)

**`saques.processed_at`**

Fonte principal `database/schema.sql` (baseline):

```117:117:database/schema.sql
    processed_at TIMESTAMP WITH TIME ZONE,
```

- Coluna declarada **sem `NOT NULL`** ⇒ **semanticamente compatível com `NULL`** ⇒ **SIM (nullable esperado pelo repositório)**.
- **Ressalva:** produção deve devolver **`is_nullable = 'YES'`** na query §1.1 para fechar o ciclo oficial.

**`saques.status`**

- **`VARCHAR(50)`** na baseline histórica de `database/schema.sql` (com `CHECK` antigo diferente).

**Contrato atual alvo (`pago_manual` permitido)**

```26:44:database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql
ALTER TABLE public.saques
  ADD CONSTRAINT saques_status_check CHECK (
    status = ANY (
      ARRAY[
        'pendente'::text,
        'pending'::text,
        'processando'::text,
        'processing'::text,
        'em_processamento'::text,
        'aguardando_confirmacao'::text,
        'processado'::text,
        'falhou'::text,
        'cancelado'::text,
        'rejeitado'::text,
        'concluido'::text,
        'pago_manual'::text,
        'cancelado_manual'::text
      ]
    )
  );
```

Qualquer **`UPDATE ... status = 'pago_manual'`** futuro só é válido se o **`CHECK` em produção** incluir esse literal (migration aplicada ou equivalente).

**`ledger_financeiro.referencia`**

Baseline em `database/schema-ledger-financeiro.sql`:

```9:11:database/schema-ledger-financeiro.sql
  referencia text,
  created_at timestamptz not null default now()
);
```

Índice de idempotência (evita dupla linha lógica no mesmo grupo):

```15:15:database/schema-ledger-financeiro.sql
create unique index if not exists ledger_financeiro_correlation_tipo_ref_idx on ledger_financeiro (correlation_id, tipo, referencia);
```

**Tipos de ledger (`payout_manual_confirmado`)** — migração:

```11:21:database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql
        'rollback'::text,
        'payout_confirmado'::text,
        'falha_payout'::text,
        'payout_manual_confirmado'::text,
        'rollback_manual'::text
```

### 1.3 Síntese DDL (combinada repositório + evidência de linha já em `processed_at IS NULL`)

| Item | Estado |
|------|--------|
| **`processed_at` nullable em produção** | **Confirmado no código SQL do repositório como coluna opcional.** **Runtime:** repetir §1.1 → esperado **`is_nullable = YES`**. Linha atual já gravada com `NULL` ⇒ coerência operacional forte. |
| **`status` tipo** | **`varchar(50)`** (baseline) + **`CHECK`** expandido (migração manual withdraw). Confirmar définition em PG §1.1. |
| **`referencia` tipo** | **`text`** (baseline). |
| **Constraints relevantes** | `saques_status_check`; `ledger_financeiro_tipo_check`; **`CHECK`/índices** variam conforme drift — listar §1.1. |
| **Índices relevantes** | `ledger_financeiro_correlation_tipo_ref_idx` (+ índices de `usuario_id`, status de `saques` conforme baseline). |

---

## 2. Evidência operacional já consolidada (read-only — triagem)

| Verificação | Resultado |
|-------------|-----------|
| Ledger `payout_manual_confirmado` existente para o caso | **Sim** (`f63765b0-3998-4549-87e4-9c3e42d80cba`) |
| Valor líquido | **`ledger.valor = 8`** = **`saques.net_amount = 8`** |
| `referencia` | **`371ed41a-5053-411f-b7cc-414a2ee798ec` = `saques.id`** |
| `correlation_id` ledger ↔ saque | **`30a9d56d-9689-458c-9dc7-531169bca521`** (iguais) |
| Temporalidade ledger vs saque | Ledger **após** criação do saque (**~600 ms**) — cenário típico do bug pré-`1c5bea8` |

---

## 3. Planos futuros (**não executar** até minuta GO formal)

Todos os exemplos seguintes são **propostos** para revisão técnico-jurídica e **dupla confirmação** no BD (SELECT pré/pós quando executados).

---

### Plano A — Ledger = pagamento efetivamente realizado

**Hipótese:** comprovação operacional forte (PIX / extrato conciliado ao valor líquido R$ 8,00 para o mesmo `usuario_id`).

**Passos formais antes do DML**

1. Assinatura de tesouraria/ops no documento (**evidência de pagamento**).
2. `SELECT FOR UPDATE`/snapshot do par saque + linha ledger (consistente §2).
3. Confirmar **`INVARIANT`** exclusivo neste UUID (nenhum segundo payout duplicado no mesmo grupo único índice).
4. Aplicar **apenas atualização coerente de `saques`** (**não** inserir nova linha `payout_manual_confirmado`).

**UPDATE proposto (exemplo único caso — modelo transacional)**

```sql
BEGIN;

-- Blindagem pré: estado esperado antes de mover
SELECT s.id,
       s.status,
       s.correlation_id,
       s.net_amount::numeric AS net_amount_saque,
       s.processed_at
FROM public.saques AS s
WHERE s.id = '371ed41a-5053-411f-b7cc-414a2ee798ec';

SELECT l.id AS ledger_id,
       l.tipo,
       l.valor::numeric,
       l.referencia,
       l.correlation_id,
       l.created_at
FROM public.ledger_financeiro AS l
WHERE l.id = 'f63765b0-3998-4549-87e4-9c3e42d80cba';

-- Atualização de alinhamento: `processed_at` alinhado ao `created_at` da linha ledger (proposta auditável)
UPDATE public.saques AS s
SET status        = 'pago_manual'::text,
    processed_at  = '2026-05-04T13:29:42.912+00:00'::timestamptz,
    updated_at    = timezone('utc', now())
WHERE s.id = '371ed41a-5053-411f-b7cc-414a2ee798ec'
  AND lower(trim(s.status::text)) IN ('pendente', 'pending')
  AND s.correlation_id IS NOT DISTINCT FROM '30a9d56d-9689-458c-9dc7-531169bca521'::text;

-- Se `ROW_COUNT` ≠ 1: ROLLBACK e reavaliar corrida/admin
COMMIT;
```

**Pós‑condição esperada:**

- **`saques.status = pago_manual`**, **`ledger` intocado**.
- Registrar decisão (**relatório operacional**) com número de caso e hashes de export read-only antes/depois (fora deste arquivo).

---

### Plano B — Pagamento **não** ocorreu (ledger equivocado mantido para auditoria)

**Hipótese:** tesouraria conclui que **nenhum PIX** válido existe para esse saque líquido (risco de fraude, erro duplo lançamento, etc.).

**Princípios**

- **`ledger_financeiro` não é apagado** (imutabilidade auditoria).

**Futuro modelo de procedimento (alto nível — sem executar)**

1. Trilhar incidente (**ticket / livro-caixa**) com nível jurídico interno conforme política da casa.
2. Definir se o próximo lançamento é **`rollback_manual`** e/ou ajustes de **`usuarios.saldo`** de acordo com a política de compensação já usada pelo domínio `rollbackWithdrawManualAdmin` (consultar só **após** minuta técnica e aprovação interna).

**SQL ilustrativo (não há DML pronto)**

```sql
-- Sem UPDATE/INSERT/DELETE neste plano até desenho de compensação financeira e saldo.
-- Preferir reutilizar o fluxo de domínio `rollbackWithdrawManualAdmin` (após aprovação interna)
-- em vez de SQL ad hoc em produção.
```

**Nota técnica:** qualquer segunda linha `rollback_manual` no mesmo `correlation_id` deve respeitar regras de idempotência e **nunca** remover `payout_manual_confirmado` já existente **sem política formal**.

---

### Plano C — Bloqueio documentado até decisão humana

**Hipótese:** alto risco ou ausência temporária de prova perante regulador/compliance.

**Ação futura**

1. Registrar **lista de exceções** com referência a este UUID e ao `ledger_id`.
2. Manter `saques` em **`pendente`** com **UI/admin** explicando `INVARIANT_BROKEN` (próxima evolução de produto, fora do escopo desta decisão).
3. **Nenhum DML** até decisão dirigida.

---

## 4. Recomendação formal (somente papel — até assinatura de ops)

Considerando **`payout_manual_confirmado`**, **valores reconciliados (8)** e **join perfeito** `referencia/id/correlation_id`, a **preferência técnica** tende ao **Plano A**, **somente sob assinatura de tesouraria/ops confirmando PIX real** contra o mesmo `usuario_id`/valor líquido.

Se a prova de pagamento **não existir**, migrar avaliação para **Plano B** ou **C** conforme risco reputacional/regulatório.

---

## 5. Parecer GO / NO‑GO sobre **execução** da reconciliação (UPDATE/DML)

| Porta | Parecer |
|-------|---------|
| **DDL runtime** via §1.1 (**SELECT** apenas) antes de qualquer UPDATE | **GO** (checklist obrigatório). Sem isso ⇒ **NO‑GO**. |
| **Pré‑requisito `pago_manual` no CHECK** em produção | **GO** após conferir constraint (§1.1). Caso não exista literal ⇒ aplicar migração **separada** antes do Plano A. |
| **Evidência operacional** (PIX / extrato) assinada | **GO** para Plano A; **NO‑GO** sem ela. |
| **Execução do UPDATE** (Plano A) | **NO‑GO automático** neste documento — depende de minuta operacional + janela controlada. |

---

## Referências

- `docs/relatorios/TRIAGEM-INCONSISTENCIA-HISTORICA-SAQUE-MANUAL-2026-05-04.md`
- `database/schema.sql`, `database/schema-ledger-financeiro.sql`, `database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql`
- Commit `1c5bea8` (ordem segura approve/cancel daqui em diante)
