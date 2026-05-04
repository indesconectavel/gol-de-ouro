# PRÉ-EXECUÇÃO — BLOCO FINANCEIRO — SAQUES MANUAIS

**Data:** 2026-05-04  
**Base:** `docs/relatorios/DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md`  
**Modo:** planejamento apenas — sem alteração de código, migrations ou frontend neste artefato.

---

## 1. Resumo executivo

O incidente **ledger indica pagamento (`payout_manual_confirmado`) e `saques` permanece pendente**, com cancel retornando **“Saque já pago”**, é **explicável pelo código atual** da função `approveWithdrawManualAdmin`: a linha de ledger é **inserida antes** da atualização de `saques` para `pago_manual`. Se o `UPDATE` em `saques` falhar ou não atualizar nenhuma linha (filtro `.in('status', ['pendente', 'pending'])` + corrida de concorrência), o ledger já contém evidência de payout manual e `cancelWithdrawManualAdmin` detecta esse registro e responde **`ALREADY_PAID`**.

A **fonte de verdade operacional** desejável é o **conjunto coerente** `saques` + `ledger_financeiro` + `usuarios.saldo`, com prioridade normativa:

1. **`saques`** — estado do ciclo de vida do pedido (pendente → pago ou cancelado/revertido).
2. **`ledger_financeiro`** — auditoria monetária (append-only conceitual), **não deve existir payout confirmado sem linha terminal coerente em `saques`** em estado estável.
3. **`usuarios.saldo`** — saldo atual; no pedido de saque o backend **debita** antes de criar o registro (`server-fly.js`); cancel manual deve **repor** conforme `rollback_manual` no domínio.

Este documento mapeia fluxos, schema de referência no repo, **queries somente leitura**, plano cirúrgico, rollback e **GO/NO-GO**.

**Atenção:** existem **vários ficheiros SQL legado** (`database/schema.sql`, `schema-completo.sql`, `schema-ledger-financeiro.sql`) que **não coincidem** entre si (tipos de `id`, CHECKs antigos). O **Supabase real** deve ser tratado como fonte através de **`information_schema` em produção** (secção 5 e queries iniciais na 6).

---

## 2. Fonte de verdade financeira atual

| Artefato | Papel |
|----------|--------|
| **`saques`** | Estado do pedido de saque; deve refletir se o valor já “saiu” definitivamente ao jogador (pago/processado/manual) ou se foi cancelado/rejeitado e saldo tratado. |
| **`ledger_financeiro`** | Trilho de auditoria: no pedido aparecem tipos como `saque`, `taxa`; no payout automático/manual `payout_confirmado` / `payout_manual_confirmado`; rollbacks `rollback` / `rollback_manual`. **`createLedgerEntry`** deduplica por `(correlation_id, tipo, referencia)`. |
| **`usuarios.saldo`** | Saldo atual. Débito na criação do saque (`/api/withdraw/request`); reversão esperada em cancel manual via fluxo de rollback no domínio. |
| **`correlation_id` (saques + ledger)** | Idempotência e correlação de todas as linhas do mesmo fluxo. |

Relacionados ao payout (contexto Mercado Pago / worker), podem existir colunas auxiliares em `saques` referenciadas no código (`payout_external_reference`, etc.) — confirmar em produção.

**Regra de ouro para correção:** após cirurgia, **não** deve persistir estado estável onde exista **`payout_manual_confirmado`** (ou `payout_confirmado`) para `referencia = saques.id` e **`saques.status`** ainda **`pendente`/`pending`**, salvo janela transacional ínfima.

---

## 3. Fluxo atual de approve manual

| Etapa | Onde |
|-------|------|
| **Endpoint** | `POST /api/admin/withdraw/approve` (`server-fly.js`) |
| **Auth** | `authenticateToken` + `requireAdministradorDb` (JWT; `usuarios.tipo === 'admin'`) |
| **Controller** | `controllers/adminWithdrawController.js` → `approveManualWithdraw` |
| **Domínio** | `src/domain/payout/processPendingWithdrawals.js` → `approveWithdrawManualAdmin` |

**Ordem das operações (crítico):**

1. `SELECT saques` por `saqueId` (campos incl. `usuario_id`, `correlation_id`, `amount`/`valor`, `fee`, `net_amount`, `status`).
2. Valida `correlation_id` presente.
3. Se já `pago_manual` → sucesso deduplicado.
4. Valida status pendente (`isPendenteSaqueStatus`).
5. Verifica ausência de rollback no ledger para o mesmo par `correlation_id` + `referencia`.
6. **Insere ledger** `createLedgerEntry` com **`tipo: 'payout_manual_confirmado'`**, `valor` = `net_amount`, `referencia` = **`String(saqueId)`**, `correlationId`.
7. **`UPDATE saques`** → `status: 'pago_manual'`, `processed_at`, `updated_at`, com `.eq('id', saqueId)` e **`.in('status', ['pendente', 'pending'])`**.
8. Se não retornar linha atualizada → **`code: 'CONFLICT'`** (ou erro de DB → fase `update_status`).

**Pontos de falha que geram inconsistência:**

- **Sucesso em (6)** e falha ou “zero rows” em (7): ledger com payout manual, **`saques` ainda pendente**.
- Erro HTTP **500** no controller quando `result.success === false` e não é código mapeado (ex.: erro em `upErr`).
- Corrida: outro processo altera `status` entre SELECT e UPDATE (update não casa → CONFLICT mesmo sem ledger novo em alguns cenários).

**Controller HTTP:** `CONFLICT` → **409**; erro genérico ledger/update → **500** (mensagem genérica ao cliente).

---

## 4. Fluxo atual de cancel manual

| Etapa | Onde |
|-------|------|
| **Endpoint** | `POST /api/admin/withdraw/cancel` |
| **Controller** | `cancelManualWithdraw` → `cancelWithdrawManualAdmin` |

**Ordem (resumo):**

1. Carrega `saques` pelo id.
2. Exige `correlation_id`.
3. Se já `cancelado_manual` → dedupe.
4. **Consulta `ledger_financeiro`**: existe linha com mesmo `correlation_id`, **`tipo IN ('payout_confirmado','payout_manual_confirmado')`**, **`referencia = String(saqueId)`** → retorna **`ALREADY_PAID`** (“Saque já pago — não pode cancelar”). **Isso não lê `saques.status`** para essa decisão.
5. Se status não pendente → `INVALID_STATUS`.
6. Prossegue com `rollbackWithdrawManualAdmin` (ledger `rollback_manual`, crédito de saldo onde aplicável, `saques.status` → `cancelado_manual`), conforme ramos do código.

**Motivo de “Saque já pago” com `saques` ainda pendente:** passo **4** verdadeiro (ledger já tem payout confirmado manual ou automático) **enquanto** o passo **7** do approve **não** atualizou `saques`.

---

## 5. Schema real envolvido

### 5.1 Referência no repositório (não substitui prod)

**`ledger_financeiro`** (`database/schema-ledger-financeiro.sql` — baseline):

- `id` uuid PK, `correlation_id` text NOT NULL, `tipo` text NOT NULL (CHECK inicial estreito; **substituído** em migration).
- `usuario_id` uuid NOT NULL (baseline); em produção pode existir **`user_id`** — o código faz *fallback* `user_id` / `usuario_id` em `insertLedgerRow`.
- `valor` numeric, `referencia` text, `created_at` timestamptz.
- **Índice único:** `ledger_financeiro_correlation_tipo_ref_idx ON (correlation_id, tipo, referencia)` — uma linha por combinação.

**Migration V1 manual** (`database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql`):

- Estende CHECK `tipo` com `payout_manual_confirmado`, `rollback_manual`.
- Estende CHECK `saques.status` com `pago_manual`, `cancelado_manual`, e vários intermediários/automático.

**`saques`** em `database/schema.sql` (UUID, legado naming):

- Inclui `valor`, `chave_pix`, `tipo_chave`, CHECK de status antigo (`pendente`, `processando`, `concluido`, …) — **pode estar desatualizado** face ao Supabase live.

**Código runtime** (`server-fly.js` + domínio) usa em `saques` entre outros:

- `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, timestamps.

### 5.2 O que confirmar no Supabase (read-only)

Antes de qualquer migração/cirurgia de código:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('saques', 'ledger_financeiro', 'usuarios')
order by table_name, ordinal_position;
```

E constraints/indexes únicos relevantes:

```sql
select conname, contype, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid in (
  'public.saques'::regclass,
  'public.ledger_financeiro'::regclass
);

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('saques', 'ledger_financeiro');
```

---

## 6. Queries read-only de detecção de inconsistência

**Prefixo:** `public.` assumido; ajustar schema se necessário.  
** Tipos:** `referencia` e `correlation_id` podem comparar como text; garantir cast `::text` em ids uuid.

### 6.1 Saque pendente com ledger de payout confirmado (manual ou automático)

```sql
select s.id, s.usuario_id, s.status, s.correlation_id,
       s.amount, s.valor, s.net_amount, s.processed_at,
       l.id as ledger_payout_id, l.tipo as ledger_tipo, l.valor as ledger_valor, l.created_at as ledger_created_at
from public.saques s
join public.ledger_financeiro l
  on l.correlation_id = s.correlation_id
 and l.referencia = s.id::text
where lower(s.status) in ('pendente', 'pending')
  and l.tipo in ('payout_confirmado', 'payout_manual_confirmado')
order by s.created_at desc;
```

### 6.2 Saque marcado como pago manual sem linha de payout no ledger

```sql
select s.id, s.usuario_id, s.status, s.correlation_id, s.processed_at
from public.saques s
where lower(s.status) in ('pago_manual')
  and not exists (
    select 1 from public.ledger_financeiro l
    where l.correlation_id = s.correlation_id
      and l.referencia = s.id::text
      and l.tipo in ('payout_confirmado', 'payout_manual_confirmado')
  );
```

### 6.3 Possível ledger duplicado “lógico” (mesmo saque / mesmo tipo — o índice único normalmente impede duplicata exata)

```sql
select correlation_id, tipo, referencia, count(*) as n
from public.ledger_financeiro
group by correlation_id, tipo, referencia
having count(*) > 1;
```

### 6.4 Saque cancelado manualmente mas com apenas payout confirmado sem rollback (avaliar caso a caso)

```sql
select s.id, s.status, s.correlation_id,
       sum(case when l.tipo in ('payout_confirmado','payout_manual_confirmado') then 1 else 0 end) as payouts,
       sum(case when l.tipo in ('rollback','rollback_manual') then 1 else 0 end) as rollbacks
from public.saques s
join public.ledger_financeiro l on l.correlation_id = s.correlation_id and l.referencia = s.id::text
where lower(s.status) = 'cancelado_manual'
group by s.id, s.status, s.correlation_id;
```

*(Interpretação: cancel manual esperado deve ter trajetória de rollback; presença de payout + cancel exige revisão manual de negócio.)*

### 6.5 Saldo vs soma ledger (aproximação — **não é fechamento contábil completo** sem regras de depósitos/jogo)

Útil apenas como alarme; depende dos tipos contabilizados no projeto:

```sql
select u.id, u.saldo::numeric as saldo_atual
from public.usuarios u
where u.id in (
  select distinct usuario_id from public.saques where correlation_id is not null
)
limit 100;
```

Combinações mais rigorosas exigem definir política (ex.: somar apenas `deposito` − `saque` ± `rollback` …) **fora do âmbito** deste pré-planeamento.

---

## 7. Inconsistências possíveis

| ID | Descrição | Deteção |
|----|-----------|---------|
| A | Ledger `payout_manual_confirmado`; `saques` pendente | Query 6.1 |
| B | Approve retorna 500 após ledger; UX/admin retenta | Logs + 6.1 |
| C | `referencia` em ledger com formato diferente de `saques.id::text` (legado) | Join 6.1 retorna vazio mas dados “estranhos” — audit manual por `correlation_id` |
| D | Race: dois admins aprovando | UNIQUE + segunda operação pode dedupe ou CONFLICT |
| E | Migration CHECK em `tipo`/`status` desatualizada no ambiente | Erros INSERT/UPDATE nos logs Postgres |
| F | Painel lista mock — operador julga estado errado | Diagnóstico admin UI (correção separada) |

---

## 8. Contrato final recomendado de estados

**Manter nomes já usados pelo backend Supabase atual** (após migration `20260201`):

| Estado em `saques.status` | Significado |
|---------------------------|-------------|
| `pendente` / `pending` | Aguardando processamento ou ação administrativa/manual. |
| `pago_manual` | Pagamento confirmado pelo operador; ledger deve ter `payout_manual_confirmado` para esse saque/referência. |
| `cancelado_manual` | Cancelado pelo admin com restituição de saldo conforme implementação (`rollback_manual`). |
| Estados automáticos MP/worker | `processando`, `aguardando_confirmacao`, `processado`, `falhou`, etc. — não renomear sem migração coordenada. |

**Ledger `tipo` (extensão já prevista):** incluir `payout_manual_confirmado`, `rollback_manual` além de `saque`, `taxa`, `rollback`, `payout_confirmado`, `falha_payout`, `deposito`.

**Não** introduzir na API pública nomes só em inglês (`approved`, `canceled`) **sem** mapeamento explícito; preferir **exibir** em PT na UI mapeando estes valores canónicos.

---

## 9. Plano cirúrgico proposto (sem implementar aqui)

**Fase 0 — só leitura em produção**  
Rodar queries da secção 6 + `information_schema`; exportar resultado; etiquetar `saque.id` afetados.

**Fase 1 — Correção transacional ou ordem das operações (backend)**  
Para `approveWithdrawManualAdmin`:

- Opção segura típica: **transação única** (Postgres BEGIN/COMMIT via RPC ou `supabase.rpc` encapsulando UPDATE+INSERT ordenados), ou **inverter ordem** com salvaguarda: só gravar payout no ledger **após** `UPDATE saques` bem-sucedido — **atenção**: se inverter, definir rollback explícito se UPDATE ok e INSERT falhar (estado intermediário).

- Alternativa já comum em sistemas financieros: **“outbox”** ou **ledger com estado compensatório`** — maior esforço.

**Mínimo viável recomendado na discussão técnica:** atomicidade INSERT ledger + UPDATE `saques` OU compensação síncrona (apagar entrada ledger / linha contra-partida) se UPDATE falhar após INSERT — política deve ser decidida pelo time de auditoria.

**Fase 2 — Cancel manual**  
Garantir que `ALREADY_PAID` reflita também **derivado coerente de `saques.status`** onde fizer sentido, ou ferramenta de **reconciliação** para recuperar registos em estado A (secção 7).

**Fase 3 — Dados já corrompidos**  
Scripts **one-shot** sob governança: para cada linha em 6.1, ou atualizar `saques` para `pago_manual` **se** payout for válido negocialmente, ou inserir compensação / estorno conforme decisão — **não** automatizar sem assinatura.

**Fase 4 — API listagem admin + painel**  
Endpoint autenticado JWT que devolva `saques` + flags de consistência (join com ledger); remover mock.

---

## 10. Arquivos candidatos a alteração

| Ficheiro | Motivo |
|----------|--------|
| `src/domain/payout/processPendingWithdrawals.js` | Núcleo `approveWithdrawManualAdmin`, `cancelWithdrawManualAdmin`, `createLedgerEntry`, rollback. |
| `controllers/adminWithdrawController.js` | Mapeamento de erros, mensagens; eventual payload estendido. |
| `server-fly.js` | Novos endpoints GET/POST administrativos para listagem/relatório; montagem opcional de rotas legacy. |
| `database/migrations/*.sql` | Se RPC/transação for implementada como função SQL; índices de apoio; **alterações de CHECK apenas com evidência**. |
| `goldeouro-admin/src/pages/SaqueUsuarios.jsx` + `src/js/api.js` | Lista real + auth JWT alinhada (fase posterior). |

---

## 11. Riscos de execução

| Risco | Mitigação |
|-------|-----------|
| Corrigir código sem sanear linhas já “A” na query 6.1 | Fase 0 obrigatória; eventual script de saneamento antes ou depois, versionado |
| Índice único impede segunda linha esperada em edge-case | Rever `deduped` paths em `createLedgerEntry` |
| Coluna usuário ledger errada (`user_id` vs `usuario_id`) | `insertLedgerRow` já mitiga — validar erro em logs histórios |
| Downtime / travas | Evitar lock em tabelas grandes em horário de pico; preferir janela controlada |
| Rollback de deploy sem reverter dados | Dados corrigidos manualmente precisam runbook separado |

---

## 12. Plano de rollback

| Nível | Ação |
|-------|------|
| **Git** | Tag **antes** da cirurgia: ex. `pre-saque-manual-surgery-2026-05-04`; branch dedicada; PR com descrição e link a este documento. |
| **Deploy** | Reverter para imagem/commit anterior no Fly (ou pipeline equivalente). |
| **Base de dados** | Migrations “forward-only” — evitar `DOWN` destrutivo em prod; para dados, **backup point-in-time** Supabase antes de UPDATE em massa. |
| **Risco de banco** | Scripts de correção massiva **não** embutidos no deploy da app; executar com snapshot e validação pós-query. |

**Se apenas código regredir** sem tocar no DB, linhas “A” podem **permanecer** até novo script — por isso GO/NO-GO exige critério explícito.

---

## 13. Critério GO/NO-GO para cirurgia

### GO (todas recomendadas)

- Backup/snapshot do BD ou PITR confirmado.
- Resultados das queries 6.1–6.3 arquivados; escopo de linhas afetadas conhecido.
- Plano de transação/ordem aprovado em review (2 olhos).
- Teste em **staging** com fluxo approve/cancel + simulação de falha de rede após ledger (se possível).
- Janela e responsável de rollback definidos.

### NO-GO

- Schema real não inspecionado (`information_schema` não corrido).
- Queries 6.1 retornam volume grande **sem** decisão de negócio para cada caso.
- Ausência de backup ou deploy em sexta/feriado sem cobertura.
- Misturar correção de painel mock com hotfix de dinheiro **na mesma release** sem separação de risco (opcionalmente NO-GO por governança).

---

*Fim do documento de pré-execução.*
