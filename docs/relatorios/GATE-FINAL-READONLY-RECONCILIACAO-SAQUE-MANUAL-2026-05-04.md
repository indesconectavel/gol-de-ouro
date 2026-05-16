# Gate final (read-only) — reconciliação saque manual (Plano A)

**Data/Hora evidência automatizada:** `2026-05-04T16:16:56.770Z` (UTC — snapshot REST)

**Documento-base:** `docs/relatorios/DECISAO-CONTROLADA-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`

**Saque:** `371ed41a-5053-411f-b7cc-414a2ee798ec`  
**Ledger:** `f63765b0-3998-4549-87e4-9c3e42d80cba`

**Premissas:** nenhum DML aplicado pela automação ao elaborar este gate; deploy fora do escopo.

**Status fechamento humano:** **§7** — DDL oficial e evidência PIX **devem** ser registrados antes de declarar **`GO FINAL`** para UPDATE do Plano A. Até lá, vale o **§5 / §9** (**NO‑GO integral** por lacuna de papel).

---

## 1. DDL em produção (information_schema / pg_indexes / pg_constraint)

| Item | Estado neste runner |
|------|---------------------|
| `DATABASE_URL` no ambiente Cursor/.env backend | **Ausente** — **não** foi possível executar contra o Postgres nativo pelo agente. |
| Ação esperada antes do **primeiro UPDATE** do Plano A | Colar os **mesmos SELECT** da §1 da decisão controlada (**DECISÃO 2026-05-04**) no **SQL Editor** do projeto Supabase (produção) e arquivar o resultado (**CSV/export** ou cópia de saída) em trilho de auditoria interna. |

**Queries read-only obrigatórias (réplica sintética)**

```sql
select table_name, column_name, data_type, character_maximum_length, is_nullable
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

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('saques', 'ledger_financeiro')
order by tablename, indexname;
```

**Resultado DDL neste gate:** ⚠️ **execução manual pendente na produção.**

---

## 2. Estado atual técnico (Supabase REST — apenas SELECT efetivamente executado pelo agente)

Fonte: `SUPABASE_*_PROD` do `.env` local (somente operações `.select`, sem mutação).

### 2.1 `saques` (campos materiais ao Plano A)

| Campo | Valor atual |
|--------|--------------|
| `id` | `371ed41a-5053-411f-b7cc-414a2ee798ec` |
| `status` | `pendente` |
| `usuario_id` | `4c3b3b02-592c-4183-a53e-b05b1d9a4426` |
| `correlation_id` | `30a9d56d-9689-458c-9dc7-531169bca521` |
| `amount` / `valor` | `10` |
| `fee` | `2` |
| `net_amount` | `8` |
| `processed_at` | **`null`** |
| `created_at` | `2026-05-04T13:29:42.312+00:00` |
| `updated_at` | `2026-05-04T13:29:42.326824+00:00` |

*(Campos PIX/chaves presentes na base — omitidos deliberatemente neste relatório público por PII.)*

### 2.2 `ledger_financeiro`

| Campo | Valor atual |
|--------|--------------|
| `id` | `f63765b0-3998-4549-87e4-9c3e42d80cba` |
| `tipo` | `payout_manual_confirmado` |
| `valor` | `8` |
| `referencia` | `371ed41a-5053-411f-b7cc-414a2ee798ec` (= `saques.id`) |
| `correlation_id` | `30a9d56d-9689-458c-9dc7-531169bca521` (= saque.correlation_id) |
| `user_id` | `4c3b3b02-592c-4183-a53e-b05b1d9a4426` |
| `usuario_id` (coluna) | `null` |
| `created_at` | `2026-05-04T13:29:42.912+00:00` |

### 2.3 Check-list automático (booleanos)

| Verificação | Resultado |
|-------------|-----------|
| Saque ainda existe | **Sim** |
| Saque ainda **`pendente`**/`pending` | **Sim** (`pendente`) |
| `processed_at` ainda **`null`** | **Sim** |
| Ledger `payout_manual_confirmado` presente | **Sim** |
| `ledger.valor = 8` | **Sim** |
| `referencia = saques.id` | **Sim** |
| `correlation_id` ledger = saque | **Sim** |
| `net_amount` = valor ledger quando ambos definidos | **Sim** (**8**) |

---

## 3. `processed_at` nullable (**SIM**/NÃO) — sintetização do gate

| Fonte | Parecer |
|-------|---------|
| **`information_schema` em PG produção (neste gate)** | **Indeterminado** — não executado pelo runner (§1). |
| **Baseline repositório** (`database/schema.sql`: `processed_at TIMESTAMP WITH TIME ZONE` sem `NOT NULL`) | Concorda com **SIM** esperado pelo código versionado — **substituível** apenas pelo retorno oficial `is_nullable = YES`. |
| **Evidência de linha** | `processed_at IS NULL` **persistiu** ⇒ **consistente com coluna que aceita `NULL`** (heurística operacional forte). |

**Resposta prática combinada até fechar DDL:** declarar **`SIM` probabilístico** + **marcar obrigatória** a evidência oficial da query §2.1 (primeira tabela) na produção.

---

## 4. Evidência operacional PIX (histórico — automação apenas)

Durante as rodadas apenas com API/modelo de dados **não** foi possível atestar pagamento PIX. **A declaratória oficial** passa pelo **§7.2** (fechamento humano).

---

## 5. Parecer GO / NO-GO — UPDATE do Plano A (pré‑fechamento humano §7)

| Porta | Parecer |
|-------|---------|
| Snapshot técnico (§2 / §2.3) | **GO técnico** |
| DDL + PIX **oficiais** preenchidas em §7 | **GO / NO‑GO declarado apenas em §9** depois da operação registrar §7 |
| **Sem §7 completa** | **NO‑GO integral** ao UPDATE — ver **§9**

---

## 7. Fechamento humano — registros obrigatórios (SQL Editor produção)

**Ambiente:** Supabase Dashboard → projeto **produção** → **SQL** → apenas `SELECT`. Anexar print/export ou hashes internos segundo política da casa.

### 7.1 `processed_at` nullable (oficial — catálogo `information_schema`)

```sql
select column_name, data_type, character_maximum_length, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'saques'
  and column_name = 'processed_at';
```

| Campo | Valor oficial (copiar resultado) |
|-------|----------------------------------|
| `is_nullable` para `processed_at` | **_preencher: YES ⇒ SIM nullable / NO ⇒ NÃO nullable_** |

*(Após rodar:) declare na **§9** **`processed_at` nullable oficial = SIM** se `YES`, ou **NÃO** se `NO`.*

---

### 7.2 Constraints `public.saques`

```sql
select rel.relname as table_name,
       tc.contype AS constraint_type,
       tc.conname AS constraint_name,
       pg_get_constraintdef(tc.oid, true) as definition
from pg_constraint tc
join pg_class rel on rel.oid = tc.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'saques'
order by tc.contype::text, tc.conname;
```

| Atualização obrigatória | Preencher |
|-------------------------|-----------|
| **Validar literal `pago_manual` no CHECK** (quando aplicável) — citar snippet do campo `definition` | *(síntese OK/KO + trecho textual)* |
| Resultado integral (opcional) | *(anexar em arquivo-morto ou apêndice interno)* |

---

### 7.3 Índices `public.saques`

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'saques'
order by indexname;
```

| Registro breve |
|----------------|
| *(resumo: há índice em `usuario_id` / `status` / `correlation_id`? mencionar índices-chave observados)* |

---

### 7.4 Constraints `public.ledger_financeiro`

```sql
select rel.relname as table_name,
       tc.contype AS constraint_type,
       tc.conname AS constraint_name,
       pg_get_constraintdef(tc.oid, true) as definition
from pg_constraint tc
join pg_class rel on rel.oid = tc.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'ledger_financeiro'
order by tc.contype::text, tc.conname;
```

---

### 7.5 Índices `public.ledger_financeiro`

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'ledger_financeiro'
order by indexname;
```

| Registro útil |
|----------------|
| *(resumo: aparece índice único em `(correlation_id,tipo,referencia)` ou equivalente?)* |

---

### 7.6 Declaratória PIX (**R$ 8,00 líquidos**) — papel humano apenas

*(Valores devem espelhar reunião física/arquivo-morto institucional; **nenhum campo substitui** controles internos de compliance)*

| Pergunta | Registro obrigatório |
|----------|----------------------|
| **PIX de R$ 8,00** (valor líquido alinhado a `ledger.valor`) **foi efetivamente pago?** | **_SIM / NÃO_** *(obrigatório não deixar vazio antes de declarar §9)_* |
| **Quem confirmou** *(nome legível + função OU identificação interno controlado)* | **________________** |
| **Data/hora** *(ISO‑8601 preferível + fuso Brasil se aplicável)* | **________________** |
| **Origem da evidência** | **_extrato | comprovante | tela banco | PSP | auditoria arquivo morto | outro (especificar)_** |
| Observação (curta, até ~200 caracteres) | ________ |

⚠️ Se resposta **`NÃO`** ou ficar incompleta → **§9 obrigatoriamente `NO‑GO`** ao UPDATE Plano **A**. Em disputa ⇒ Plano **B/C** primeiro.

---

## 8. Reproducibilidade (read-only opcional)

```bash
node scripts/gate-final-readonly-reconciliacao-20260504.js
```

*(Não comita dados sensíveis; depende apenas de `.env` local.)*

---

## 9. Síntese executiva pós-humanos (atualizar após §7 fechado)

| Item | Estado oficial antes de qualquer `UPDATE` do Plano A |
|------|---------------------------------------------------------|
| `processed_at` nullable **oficial** (PG produção, §7.1 → `is_nullable`) | *preencher: **SIM** se `YES` / **NÃO** se `NO`* |
| PIX R$ 8 líquidos pago (§7.6) | *preencher: **SIM / NÃO*** |
| Nome do responsável pela confirmação PIX (§7.6) | ________________ |
| **GO FINAL** para UPDATE Plano A (assinatura decisão técnico + financeiro) | **NO‑GO** até §7 DDL e PIX registrados **e coerentes**; **GO** apenas se `is_nullable` = **SIM** (YES) para `processed_at` **e** PIX = **SIM** com nome, data/hora e origem evidência preenchidas. |

### GO / NO‑GO enquanto §7 está em branco (estado atual deste relatório)

- **DDL oficial (§7)** ainda não colada neste arquivo ⇒ **processed_at nullable oficial = indefinido** ⇒ **NO‑GO** DDL.
- **PIX (§7.6)** ainda não preenchido ⇒ **PIX confirmado oficial = indefinido** ⇒ **NO‑GO** ao UPDATE Plano A.

**Último registro humano** (DDL export + PIX declarado): **data/hora UTC** _____ **referência arquivo-morto ou ID interno** _____

---
## Referências

- `DECISAO-CONTROLADA-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `TRIAGEM-INCONSISTENCIA-HISTORICA-SAQUE-MANUAL-2026-05-04.md`
