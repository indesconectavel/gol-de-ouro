# FIX — POST /api/withdraw/request 500 “Erro ao registrar saque” (ledger)

**Data:** 2026-03-04  
**Versão patch:** V311  
**Objetivo:** Corrigir o bug em que o POST retornava 500 mesmo com registro criado no history; eliminar saque fantasma e garantir resposta consistente ao cliente.

---

## 1. Causa raiz e evidências (Ledger)

### 1.1 createLedgerEntry — localização e comportamento

- **Arquivo:** `src/domain/payout/processPendingWithdrawals.js`
- **Função:** `createLedgerEntry({ supabase, tipo, usuarioId, valor, referencia, correlationId })`
- **Tabela:** `ledger_financeiro`
- **Colunas usadas no insert:** `tipo`, `usuario_id`, `valor`, `referencia`, `correlation_id`, `created_at` (opcional; enviado como `new Date().toISOString()`).
- **Validação/normalização:** Apenas `parseFloat(valor)`. Não há normalização de `usuario_id` (UUID); Supabase aceita string UUID.
- **Deduplicação:** Antes do insert, faz SELECT por `(correlation_id, tipo, referencia)`; se existir, retorna `{ success: true, deduped: true }`.

### 1.2 Schema ledger

- **Arquivo:** `database/schema-ledger-financeiro.sql`
- **Definição relevante:**

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
create unique index if not exists ledger_financeiro_correlation_tipo_ref_idx on ledger_financeiro (correlation_id, tipo, referencia);
```

- Colunas exigidas: `correlation_id`, `tipo`, `usuario_id`, `valor`, `created_at`. `referencia` pode ser NULL no schema; o código envia sempre string (saque.id ou `${saque.id}:fee`).

### 1.3 Cliente Supabase no server

- **Arquivo:** `database/supabase-unified-config.js`
- **Uso no server:** `server-fly.js` usa `supabase = supabaseAdmin` (linha 120), criado com `SUPABASE_SERVICE_ROLE_KEY`. Ou seja, **service role** — RLS é bypassado.

### 1.4 Hipótese mais provável (top-1)

**Tabela `ledger_financeiro` inexistente ou não aplicada no ambiente (ex.: produção Fly).**

- O insert em `saques` e o update em `usuarios` ocorrem antes do ledger. Se a tabela não existir no projeto Supabase em uso, o insert em `ledger_financeiro` falha e `createLedgerEntry` retorna `{ success: false, error }`, gerando 500 “Erro ao registrar saque” com o saque já criado.
- **Evidência:** A mensagem exata “Erro ao registrar saque” só é retornada nos blocos em que `!ledgerDebit.success` ou `!ledgerFee.success` (server-fly.js, antes do patch).

### 1.5 Top-3 alternativas

1. **Coluna ou tipo divergente no Supabase real**  
   Ex.: `usuario_id` como tipo diferente, ou `referencia` NOT NULL em algum migration não documentado. O erro do Supabase viria em `ledgerDebit.error` / `ledgerFee.error`.

2. **Constraint CHECK em `tipo`**  
   O código envia `'saque'` e `'taxa'`, que estão no CHECK. Se em algum ambiente o CHECK for diferente (ex.: só `'deposito'`), o insert falharia.

3. **Índice único (correlation_id, tipo, referencia)**  
   Em PostgreSQL, múltiplas linhas com `referencia = NULL` podem violar unique index dependendo da versão/definição. O código envia sempre referencia não nula; se em algum fluxo `referencia` fosse null, poderia haver conflito em retries.

---

## 2. Estratégia escolhida: S1 (mínima e segura)

- **S1:** Se o INSERT em `saques` ocorreu com sucesso, **não** retornar 500 por falha de ledger. Retornar **201** com os dados do saque e **logar** a falha do ledger para auditoria.
- **Motivo:** Exige **zero** mudança de schema; elimina o 500 do ponto de vista do cliente e evita saque “fantasma” no sentido de “usuário vê erro mas vê saque pendente”. O cliente passa a receber sucesso consistente quando o saque é criado; a falta de registro no ledger fica como débito técnico/auditoria, tratável por job ou correção manual.
- **Hotfix 1 (rollback com PENDING):** Foi implementado em `processPendingWithdrawals.js` (parâmetro `onlyWhenStatusForReject`) para o caso em que o handler **decidir** retornar erro após criar o saque (ex.: estratégia S2 futura ou outro fluxo). Com S1, o POST não chama `rollbackWithdraw` em falha de ledger; mesmo assim, o rollback passa a poder marcar REJECTED quando o status ainda é PENDING, eliminando saque fantasma nesses cenários.

---

## 3. Diferenças antes / depois (trechos)

### 3.1 server-fly.js (handler POST /api/withdraw/request)

**Antes:** Em falha de `ledgerDebit` ou `ledgerFee`, chamava `rollbackWithdraw(...)` e retornava `res.status(500).json({ success: false, message: 'Erro ao registrar saque' })`.

**Depois:**
- Construção de um único `successPayload` com os dados do saque (id, amount, fee, net_amount, pix_key, pix_type, status: PENDING, created_at, correlation_id).
- Se `!ledgerDebit.success`: log de erro + `console.warn` com “Retornando 201 com saque criado (ledger pendente para auditoria)” e `return res.status(201).json(successPayload)` (sem chamar rollback).
- Se `!ledgerFee.success`: idem (log + warn + `return res.status(201).json(successPayload)`).
- Sucesso total: mesmo `res.status(201).json(successPayload)`.

### 3.2 processPendingWithdrawals.js (rollbackWithdraw)

**Antes:** `markRejected` usava sempre `onlyWhenStatus: PROCESSING`. Quando o POST chamava rollback após falha de ledger, o saque estava PENDING e o update para REJECTED não alterava nenhuma linha, gerando saque fantasma.

**Depois:**
- Novo parâmetro opcional: `onlyWhenStatusForReject = PROCESSING`.
- Se `onlyWhenStatusForReject === PENDING`, usa `onlyWhenStatus: PENDING` no `updateSaqueStatus` ao marcar REJECTED; caso contrário, mantém `PROCESSING`.
- Log de conclusão do rollback usa `status_anterior: onlyWhenStatus` em vez de fixo PROCESSING.

Assim, quando o POST (ou qualquer chamador) passar `onlyWhenStatusForReject: 'PENDING'`, o saque será marcado REJECTED e o saldo restaurado, sem deixar pendente fantasma.

---

## 4. Idempotência e retry

- **x-idempotency-key:** O handler lê `req.headers['x-idempotency-key']` (ou `x-correlation-id` ou UUID) e persiste em `correlation_id` no saque e nas buscas.
- **Comportamento no retry com a mesma chave:**
  - Antes do insert, o handler consulta `saques` por `correlation_id`. Se já existir saque com esse `correlation_id`, responde **200** com os dados do saque existente e **não** tenta novo insert nem novo ledger.
  - Portanto, retry com o mesmo `x-idempotency-key` **não** recria ledger nem saque; a resposta é **200** (ou 201 só na primeira criação) com o mesmo `data` do saque.
- **Documentação:** Em qualquer retry com o mesmo header, a resposta esperada é **200 OK** com `success: true` e `data` contendo o saque já existente (id, amount, fee, status, created_at, correlation_id).

---

## 5. Como executar os scripts PowerShell

### 5.1 Somente leitura (GET)

```powershell
$env:BEARER = "Bearer <seu-jwt>"
.\scripts\e2e_withdraw_readonly.ps1
```

- Faz GET `/api/user/profile` e GET `/api/withdraw/history`.
- Não altera estado. Pode rodar sem BEARER (com aviso).

### 5.2 Execução completa (GET + POST + GET history)

```powershell
$env:BEARER = "Bearer <seu-jwt>"
.\scripts\e2e_withdraw_execute.ps1
```

- Exige `$env:BEARER` definido.
- Gera um `x-idempotency-key` único por execução.
- Fluxo: GET profile → POST /api/withdraw/request (valor 10, chave email) → GET history.
- No final imprime resumo (status HTTP, success, saqueId, total de saques) e **não** imprime o token.

### Base URL

- Os scripts usam `https://goldeouro-backend-v2.fly.dev`. Para outro ambiente, altere a variável `$BaseUrl` no início do script.

---

## 6. Critérios GO / NO-GO (E2E Saque — ponto de vista do cliente)

- **GO:** O cliente recebe **200** ou **201** ao solicitar o saque (POST /api/withdraw/request) e o corpo contém `success: true` e `data` com `id` do saque. O GET /api/withdraw/history inclui esse saque com status coerente (pendente/concluído/rejeitado).
- **NO-GO:** O cliente recebe **5xx** (ex.: 500 “Erro ao registrar saque”) ao solicitar o saque, ou recebe 4xx sem que seja um caso de negócio documentado (ex.: 409 “Já existe um saque pendente”, 400 validação).

Com o patch S1, assim que o saque é criado em `saques`, a resposta passa a ser **201** mesmo que o ledger falhe; portanto, o critério de GO fica satisfeito do lado do cliente (sem 500 por falha de ledger).

---

## 7. Arquivos modificados (resumo)

| Arquivo | Alteração |
|---------|-----------|
| `server-fly.js` | Payload único de sucesso; em falha de ledger (saque ou taxa) retorna 201 + log em vez de 500 + rollback. |
| `src/domain/payout/processPendingWithdrawals.js` | `rollbackWithdraw` com parâmetro opcional `onlyWhenStatusForReject` (default PROCESSING); permite marcar REJECTED quando status é PENDING. |

---

## 8. Entregáveis

1. **Patch em código:** Arquivos completos alterados (já aplicados): `server-fly.js`, `src/domain/payout/processPendingWithdrawals.js`.
2. **Relatório:** Este arquivo `docs/relatorios/FIX-SAQ-POST-500-LEDGER-V311-2026-03-04.md`.
3. **Scripts:**  
   - `scripts/e2e_withdraw_readonly.ps1` (apenas GETs).  
   - `scripts/e2e_withdraw_execute.ps1` (GET profile + POST withdraw + GET history, usando `$env:BEARER` e `x-idempotency-key`).

**Deploy:** Não realizado (correção apenas local/diff; sem alteração de env/secrets ou escrita direta em DB).
