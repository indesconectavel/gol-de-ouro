# Execução controlada — Plano B (reversão ledger indevido)

**Data:** 2026-05-04  
**Saque:** `371ed41a-5053-411f-b7cc-414a2ee798ec`  
**Ledger indevido (não apagado):** `f63765b0-3998-4549-87e4-9c3e42d80cba`  

**Regras respeitadas na preparação:** nenhum `DELETE` / `UPDATE` em linhas de `ledger_financeiro` existentes; script transacional proposto com `BEGIN`/`COMMIT` (ou `ROLLBACK` em falha).

---

## 1. Resultado da execução automática (agente / runner Cursor)

| Métrica | Valor |
|---------|--------|
| **`DATABASE_URL` disponível no runner** | **Não** |
| Transação **`BEGIN…COMMIT`** executada contra Postgres por este ambiente | **Não** |
| Motivo | Execução bloqueada por ausência de string de conexão Postgres local (`DATABASE_URL`). |

**Logs:**

```
{"ok":false,"error":"DATABASE_URL ausente — defina no .env ou exporte antes de rodar."}
```

**Conclusão:** a correção **no cluster de produção** deve ser aplicada por **operador com credencial** (SQL Editor Supabase **ou** `psql` **ou** `node scripts/exec-plano-b-reversao-20260504.js` após `export DATABASE_URL=…`).

---

## 2. Estado **antes** da transação (somente leitura — evidência)

**Horário snapshot REST:** `2026-05-04T17:21:21.309Z` UTC  

### 2.1 `saques`

| Campo | Valor |
|--------|--------|
| `id` | `371ed41a-5053-411f-b7cc-414a2ee798ec` |
| `status` | **`pendente`** |
| `processed_at` | **`null`** |
| `correlation_id` | `30a9d56d-9689-458c-9dc7-531169bca521` |
| `usuario_id` | `4c3b3b02-592c-4183-a53e-b05b1d9a4426` |
| `amount` / `valor` / `fee` / `net_amount` | 10 / 10 / 2 / **8** |

### 2.2 `ledger_financeiro` (indevido preservado)

| Campo | Valor |
|--------|--------|
| `id` | `f63765b0-3998-4549-87e4-9c3e42d80cba` |
| `tipo` | `payout_manual_confirmado` |
| `valor` | **8** |
| `referencia` | `371ed41a-5053-411f-b7cc-414a2ee798ec` |
| `correlation_id` | `30a9d56d-9689-458c-9dc7-531169bca521` |

### 2.3 `usuarios.saldo` (antes)

| `usuario_id` | `saldo` |
|--------------|---------|
| `4c3b3b02-592c-4183-a53e-b05b1d9a4426` | **33** |

*(Chaves PIX omitidas no relatório por PII.)*

---

## 3. Queries / artefatos gerados para execução controlada

### 3.1 Script Postgres transacional (Node — quando `DATABASE_URL` existir)

Ficheiro: `scripts/exec-plano-b-reversao-20260504.js`

- `BEGIN` → validações → `INSERT rollback_manual` → `UPDATE saques` → `COMMIT` ou **`ROLLBACK`** em erro.
- Colunas do insert: `correlation_id`, `tipo`, `valor`, `referencia`, `created_at`, `user_id` (usa `usuario_id` do saque).

### 3.2 SQL único para SQL Editor (Supabase)

Ficheiro: `database/exec-plano-b-reversao-transacao-20260504.sql`

Contém:

1. **`BEGIN`**
2. Bloco **`DO $$ … $$`** com validações:
   - saque **`pendente`**
   - ledger indevido existe com tipo **`payout_manual_confirmado`**
   - **não** existe `rollback_manual` com `referencia` igual ao id do saque **nem** com o sufixo `:estorno_payout_indevido_f63765b0`
3. **`INSERT`** `rollback_manual`:
   - `valor` **8**
   - `referencia` **`371ed41a-5053-411f-b7cc-414a2ee798ec:estorno_payout_indevido_f63765b0`**
   - motivo documental humano (texto fixo operacional): **`confirmacao_manual_registrada_sem_pagamento_real_pix`**
4. **`UPDATE`** `saques`:
   - `status = cancelado_manual`
   - `processed_at = NULL`
   - `motivo_rejeicao = payout_manual_confirmado_sem_pagamento_real`
5. **`COMMIT`**
6. **`SELECT` pós** (saque, linhas ledger relevantes, saldo usuário)

**Nota:** se o `INSERT` falhar por coluna (`user_id` vs `usuario_id`), ajustar uma vez conforme `information_schema` em produção — versão atual alinha ao snapshot REST (`user_id` na linha indevida).

---

## 4. Estado **depois** da transação (agente)

**Não aplicável** — transação **não** foi commitada neste runner.

**Operador deve colar aqui após execução bem-sucedida:**

| Campo | Valor pós-execução |
|--------|---------------------|
| `saques.status` | *(preencher)* |
| `saques.processed_at` | esperado **`null`** |
| Novo `ledger.id` (`rollback_manual`) | *(preencher)* |
| `usuarios.saldo` | *(preencher — comparar com **33** antes)* |

---

## 5. Consistência esperada (checklist pós-`COMMIT`)

| Critério | Esperado |
|----------|----------|
| Linha **`payout_manual_confirmado`** original | **Intacta** (mesmo `id`) |
| Nova linha **`rollback_manual`** | `referencia` **termina em** `:estorno_payout_indevido_f63765b0`, `valor` **8** |
| `saques.status` | **`cancelado_manual`** |
| `saques.processed_at` | **`null`** (conforme instrução Plano B) |
| Saldo | **Revalidar negócio** — este script **não** altera `usuarios.saldo` por omissão; se a política financeira exigir crédito adicional (ex.: espelho do fluxo `rollbackWithdrawManualAdmin`), tratar em **passo separado** aprovado. |

---

## 6. Log resumido

| Evento | Detalhe |
|--------|---------|
| Pré-validação REST | Saque pendente; ledger indevido OK; saldo **33** |
| Execução pg (Cursor) | **Não realizada** (`DATABASE_URL` ausente) |
| Artefatos entregues | `database/exec-plano-b-reversao-transacao-20260504.sql`, `scripts/exec-plano-b-reversao-20260504.js` |
| Rollback automático | N/A (transação não iniciada) |

---

## Referências

- `docs/relatorios/PRE-EXECUCAO-PLANO-B-REVERSAO-LEDGER-INDEVIDO-2026-05-04.md`
