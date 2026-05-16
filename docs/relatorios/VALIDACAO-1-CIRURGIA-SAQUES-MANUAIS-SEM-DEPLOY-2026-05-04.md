# Validação 1 — Cirurgia saques manuais (sem deploy)

**Data:** 2026-05-04  
**Branch:** `fix/admin-financial-integrity-v1`  
**Commit da cirurgia validado:** `1c5bea8` (`fix(admin): integridade approve/cancel saque manual (ledger apos saques)`)

**Escopo desta validação:** apenas fluxo **`approveWithdrawManualAdmin`** / **`cancelWithdrawManualAdmin`** — sem deploy, sem painel admin, sem mocks.

---

## 1. Git

| Comando | Resultado (sessão local) |
|---------|---------------------------|
| `git status -sb` | `## fix/admin-financial-integrity-v1` (working tree limpa) |
| `git log --oneline -5` | `1c5bea8` … `5d88838` … `819d31d` … `68f8929` … `e0d0003` |

---

## 2. Checks sintáticos (Node)

| Arquivo | `node --check` |
|---------|----------------|
| `src/domain/payout/processPendingWithdrawals.js` | OK (exit 0) |
| `controllers/adminWithdrawController.js` | OK (exit 0) |

---

## 3. Regressões textuais (grep / busca semântica)

Todas as ocorrências relevantes ficam onde se espera após a cirurgia:

| Símbolo | Onde aparece |
|---------|----------------|
| `payout_manual_confirmado` | `processPendingWithdrawals.js` (approve, invariante, outros trechos HEAL), relatórios de docs |
| `INVARIANT_BROKEN` | `processPendingWithdrawals.js`, `adminWithdrawController.js`, `CIRURGIA-1-*.md` |
| `LEDGER_WRITE_FAILED` | `processPendingWithdrawals.js`, `adminWithdrawController.js`, `CIRURGIA-1-*.md` |
| `TERMINAL_SAQUE_PAGO` | `processPendingWithdrawals.js` (cancel) |
| `approveWithdrawManualAdmin` | `processPendingWithdrawals.js`, `adminWithdrawController.js`, exports module, relatórios |
| `cancelWithdrawManualAdmin` | idem |

**Observação:** diagnósticos pré-cirurgia (`DIAGNOSTICO-READONLY-ADMIN-SAQUES-*`, etc.) ainda **descrevem o comportamento antigo** (ledger antes do `UPDATE`); isso é **histórico de auditoria**, não regressão de código na `1c5bea8`.

---

## 4. Pseudoexecução dos cenários (código atual `1c5bea8`)

### Cenário A — saque pendente válido → approve OK

1. SELECT `saques` por id; existe; `correlation_id` OK; status pendente (`isPendenteSaqueStatus`).  
2. Não há invariante prévia (sem linha payout no ledger ou saque não pendente).  
3. Sem rollback conflituoso.  
4. **UPDATE** `saques`: `pendente|pending` → `pago_manual` → linha afetada (`updated.id`).  
5. `createLedgerEntry(payout_manual_confirmado)` → sucesso (ou dedupe se já existir linha idêntica).  
6. Retorno `{ success: true, statusFinal: 'pago_manual' }`. Controller **200**.

### Cenário B — saque pendente + ledger já pago → `INVARIANT_BROKEN`

1. SELECT payout em `ledger_financeiro`: `tipo IN (payout_confirmado, payout_manual_confirmado)`, `referencia = saqueId`, `correlation_id` do saque.  
2. Se existe linha **e** saque segue pendente → retorno **`INVARIANT_BROKEN`** antes de qualquer `UPDATE`.  
3. Controller **409**. Nenhum ledger novo; `saques` intocado.

### Cenário C — update `saques` falha → não grava ledger

- **Subcase C1:** `upErr` no UPDATE → retorno erro fase `update_status`; **ledger não é chamado**.  
- **Subcase C2:** `updated` vazio, releitura não é `pago_manual` → `CONFLICT`; **ledger não é chamado**.  

Em ambos, `createLedgerEntry` **não executa** (só após `updated?.id`).

### Cenário D — ledger falha após UPDATE → compensação para pendente

1. UPDATE para `pago_manual` com sucesso.  
2. `createLedgerEntry` retorna `success: false`.  
3. UPDATE compensatório: `pago_manual` → `pendente`, `processed_at = null`, filtrado por `id` e `status = pago_manual`.  
4. Retorno `LEDGER_WRITE_FAILED`, `compensated: true/false`.  
5. Controller **503** se `compensated !== false`, **500** se reversão falhou.

### Cenário E — cancel saque pendente sem ledger de payout → cancel OK (via rollback)

1. Status pendente; não está em `TERMINAL_SAQUE_PAGO`.  
2. Sem linha ledger `payout_confirmado` / `payout_manual_confirmado` para o par `correlation_id` + `referencia`.  
3. Chama `rollbackWithdrawManualAdmin` (ledger `rollback_manual`, saldo se preciso, `saques` → `cancelado_manual`).  
4. Sucesso → **200** no controller (assumindo rollback interno OK).

### Cenário F — cancel com ledger pago → bloqueia

1. Query ledger encontra linha payout para o saque → **`ALREADY_PAID`**.  
2. Controller **409**. `saques` não segue para rollback “feliz” neste ramo.

### Cenário G — cancel com status `pago_manual` → bloqueia

1. `TERMINAL_SAQUE_PAGO.has('pago_manual')` → **`ALREADY_PAID`** antes da query de ledger (defesa em profundidade).  
2. Controller **409**.

---

## 5. Queries READ-ONLY para o banco (antes de deploy controlado)

**Schema:** `public` assumido. Ajustar se o projeto usar outro. `referencia` costuma ser texto do UUID do saque — usar `s.id::text` no join.

### 5.1 Saque pendente com ledger de payout (invariante que a cirurgia evita criar de novo)

```sql
select s.id,
       s.usuario_id,
       s.status,
       s.correlation_id,
       s.processed_at,
       l.id as ledger_payout_id,
       l.tipo as ledger_tipo,
       l.created_at as ledger_created_at
from public.saques s
join public.ledger_financeiro l
  on l.correlation_id = s.correlation_id
 and l.referencia = s.id::text
where lower(s.status) in ('pendente', 'pending')
  and l.tipo in ('payout_confirmado', 'payout_manual_confirmado')
order by s.updated_at desc nulls last;
```

### 5.2 Saque `pago_manual` sem linha de payout no ledger

```sql
select s.id,
       s.usuario_id,
       s.status,
       s.correlation_id,
       s.processed_at,
       s.updated_at
from public.saques s
where lower(s.status) in ('pago_manual')
  and not exists (
    select 1
    from public.ledger_financeiro l
    where l.correlation_id = s.correlation_id
      and l.referencia = s.id::text
      and l.tipo in ('payout_confirmado', 'payout_manual_confirmado')
  );
```

### 5.3 Possível ledger duplicado por (correlation_id, tipo, referencia)

```sql
select correlation_id,
       tipo,
       referencia,
       count(*) as n,
       array_agg(id order by created_at) as ledger_ids
from public.ledger_financeiro
group by correlation_id, tipo, referencia
having count(*) > 1;
```

### 5.4 Saque cancelado com evidência de payout no ledger (revisão de negócio)

```sql
select s.id,
       s.usuario_id,
       s.status,
       s.correlation_id,
       count(*) filter (where l.tipo in ('payout_confirmado', 'payout_manual_confirmado')) as linhas_payout,
       count(*) filter (where l.tipo in ('rollback', 'rollback_manual')) as linhas_rollback
from public.saques s
join public.ledger_financeiro l
  on l.correlation_id = s.correlation_id
 and l.referencia = s.id::text
where lower(s.status) in ('cancelado_manual', 'cancelado')
group by s.id, s.usuario_id, s.status, s.correlation_id
having count(*) filter (where l.tipo in ('payout_confirmado', 'payout_manual_confirmado')) > 0
order by s.updated_at desc nulls last;
```

---

## 6. Riscos encontrados (validação estática apenas)

| Risco | Nota |
|-------|------|
| **Rollback do cancel (`rollbackWithdrawManualAdmin`)** | Vários writes REST sem TX única; não foi alterado nesta cirurgia. Cancel “E” pode falhar em etapa intermediária. |
| **Legado em `referencia`** | Joins assumem `referencia = s.id::text`; formatos antigos podem mascarar inconsistências nas queries. |
| **`processed_at NULL` na compensação** | Depende do schema aceitar NULL; divergência de DDL quebra revert. |
| **`npm test` local** | Exige env Supabase; não comprova comportamento approve/cancel sem integração ou testes dedicados. |
| **Documentação pré-cirurgia** | Ainda menciona ordem antiga do approve — risco apenas de confusão humana, não de código na `1c5bea8`. |

---

## 7. Parecer GO / NO-GO (deploy controlado)

| Porta | Parecer |
|-------|---------|
| **Validação estática / lógica no repositório** | **GO** — sintaxe OK, símbolos mapeados, cenários A–G coerentes com o código em `1c5bea8`. |
| **Deploy para produção** | **NO-GO** neste documento — exige: (1) executar queries 5.1–5.4 em staging/prod-readonly e aceitar resultado; (2) smoke approve/cancel em ambiente com Supabase real; (3) confirmar política de `processed_at`; (4) plano se aparecer linhas em 5.1. |

---

## Referências

- `docs/relatorios/CIRURGIA-1-INTEGRIDADE-SAQUES-MANUAIS-2026-05-04.md`
- `docs/relatorios/PRE-EXECUCAO-BLOCO-FINANCEIRO-SAQUES-MANUAIS-2026-05-04.md` (queries-base 6.x)
