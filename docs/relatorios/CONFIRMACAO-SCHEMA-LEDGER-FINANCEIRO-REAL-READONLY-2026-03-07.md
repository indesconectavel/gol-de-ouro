# Confirmação do schema real da tabela ledger_financeiro (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — nenhuma conexão ao banco em tempo real; baseado em código e relatórios de auditoria anteriores.  
**Objetivo:** Confirmar se o schema real de `ledger_financeiro` é compatível com server-fly.js e processPendingWithdrawals.js (BLOCO A).

---

## 1. Estrutura real da tabela (evidência disponível)

Não é possível, em modo read-only sem acesso ao Supabase, executar `information_schema` ou `\d ledger_financeiro` em tempo real. A estrutura abaixo é a **consolidada a partir de**:

- **database/schema-ledger-financeiro.sql** (definição no repositório)
- **Probe em produção** (AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04, DIAGNOSTICO-FINAL-LEDGER-WITHDRAW-READONLY-2026-03-04)
- **Incidente E2E** (E2E-WITHDRAW-LEDGER-RESULT-2026-03-04) sobre tipo de `correlation_id`

### 1.1 Colunas

| Coluna | Schema no repo | Evidência em produção (probe 2026-03-04) | Código usa |
|--------|----------------|------------------------------------------|------------|
| **id** | uuid PK default gen_random_uuid() | YES | SELECT após insert; dedup |
| **user_id** | não declarado no repo | **YES** (existe) | insertLedgerRow tenta primeiro |
| **usuario_id** | uuid not null | **"column does not exist"** | insertLedgerRow fallback |
| **correlation_id** | text not null | Tipo **uuid** em um ambiente (erro 22P02 com string não-UUID) | insert + select dedup; código normaliza com toLedgerCorrelationId() |
| **tipo** | text not null + CHECK | Não verificado por probe | insert + select (dedup, webhook) |
| **valor** | numeric(12,2) not null | — | insert |
| **referencia** | text | — | insert + select |
| **created_at** | timestamptz not null default now() | — | insert (código envia ISOString) |

**Estrutura real inferida (produção):**

- **id** — existe (uuid PK).
- **user_id** — existe (probe: YES). **usuario_id** — não existe (probe: "column ledger_financeiro.usuario_id does not exist").
- **correlation_id** — existe; em pelo menos um ambiente foi tipo **uuid** (log 22P02: "invalid input syntax for type uuid"). O código atual converte qualquer chave para formato UUID via `toLedgerCorrelationId()`, então aceita tanto coluna **text** quanto **uuid** desde que o valor seja UUID válido.
- **tipo**, **valor**, **referencia**, **created_at** — usados pelo código em todo insert/select; presume-se presentes.

---

## 2. Confirmação das colunas solicitadas

| Pergunta | Resposta |
|----------|----------|
| Existe coluna **user_id** ou **usuario_id**? | **Sim.** Em produção foi confirmado **user_id** (YES). **usuario_id** não existe. O código tenta **user_id** primeiro e depois **usuario_id** (fallback); em produção a primeira tentativa atende. |
| Existe coluna **correlation_id**? | **Sim.** Usada no insert e no select de dedup. Evidência de existência também pelo erro 22P02 (tipo uuid) em ambiente onde o valor era string não-UUID. |
| Existe coluna **tipo**? | **Sim.** Obrigatória no insert e no select (dedup e webhook). Schema do repo e fluxo do código dependem dela. |

---

## 3. CHECK de ledger_financeiro.tipo

### 3.1 Valores que o código insere

| Arquivo | Valor de `tipo` |
|---------|------------------|
| server-fly.js (POST /api/withdraw/request) | **withdraw_request** |
| server-fly.js (webhook payout aprovado) | **payout_confirmado** |
| server-fly.js (webhook payout rejeitado) | **falha_payout** |
| processPendingWithdrawals.js (rollbackWithdraw) | **rollback** (e outro **rollback** para taxa) |
| processPendingWithdrawals.js (falha do worker) | **falha_payout** |

Ou seja, o código atual usa apenas: **withdraw_request**, **payout_confirmado**, **falha_payout**, **rollback**.

### 3.2 CHECK definido no repositório

**Arquivo:** `database/schema-ledger-financeiro.sql`

```sql
check (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout'))
```

- **rollback** — incluído no CHECK do repo.  
- **payout_confirmado** — incluído.  
- **falha_payout** — incluído.  
- **withdraw_request** — **não** está na lista.

Nenhum artefato do repositório (schema SQL, migrations, relatórios) indica que o CHECK em produção foi alterado para incluir **withdraw_request**. Ou seja: **não é possível afirmar que o schema real aceita `withdraw_request`**; pelo schema do repo, **não** aceitaria.

### 3.3 Conclusão sobre o CHECK

| Valor | No CHECK do repo | Código insere? | Compatível com repo? |
|-------|-------------------|----------------|------------------------|
| withdraw_request | Não | Sim (server-fly.js) | **Não** — risco de violação em produção se o CHECK for o do repo. |
| payout_confirmado | Sim | Sim | Sim |
| falha_payout | Sim | Sim | Sim |
| rollback | Sim | Sim | Sim |

Se a tabela em produção tiver exatamente o CHECK do `schema-ledger-financeiro.sql`, o **insert de `withdraw_request`** (no POST /api/withdraw/request) **falhará** com erro de constraint (CHECK violation).

---

## 4. Compatibilidade com o código atual

### 4.1 server-fly.js

- **createLedgerEntry** com `tipo: 'withdraw_request'` ao criar saque (linha ~1577).  
- **createLedgerEntry** com `tipo: 'payout_confirmado'` e `tipo: 'falha_payout'` no webhook de payout.  
- Select em `ledger_financeiro` por `correlation_id`, `referencia`, `tipo` (idempotência webhook).

Requisitos: coluna de usuário (**user_id** ou **usuario_id**), **correlation_id**, **tipo**, **valor**, **referencia**, **created_at**. O código já trata **user_id** primeiro e **usuario_id** em fallback; em produção (user_id presente) está coberto.

### 4.2 processPendingWithdrawals.js

- **insertLedgerRow**: insere com **user_id** ou **usuario_id** (cache após primeiro sucesso).  
- **createLedgerEntry**: payload com **tipo**, **valor**, **referencia**, **correlation_id**, **created_at**; dedup por (correlation_id, tipo, referencia).  
- Tipos usados: **rollback**, **falha_payout**.

Requisitos: mesmos da tabela acima. **toLedgerCorrelationId** garante valor em formato UUID quando a coluna for uuid.

### 4.3 Resumo de compatibilidade

| Aspecto | Compatível? | Observação |
|---------|--------------|------------|
| Coluna de usuário (user_id / usuario_id) | Sim | Produção tem **user_id**; código tenta user_id primeiro. |
| correlation_id | Sim | Código envia valor normalizado (UUID); coluna em produção existe (e em um caso era uuid). |
| tipo, valor, referencia, created_at | Sim | Usados em todo insert/select. |
| CHECK de tipo aceita withdraw_request | **Incerto** | Repo **não** inclui withdraw_request; não há evidência de que produção incluiu. **Risco direto.** |
| CHECK de tipo aceita payout_confirmado, falha_payout, rollback | Sim | Todos estão no CHECK do repo. |

---

## 5. Risco exato encontrado

**Risco 1 — CHECK de `tipo` sem `withdraw_request`**

- **O quê:** O schema do repositório declara CHECK em `ledger_financeiro.tipo` com os valores `('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout')`. O código em produção insere **withdraw_request** no POST /api/withdraw/request.
- **Consequência:** Se a tabela em produção tiver esse mesmo CHECK, **todo** request de saque que passe pela criação do saque e pelo insert no ledger **falhará** no insert do ledger com erro de constraint (CHECK violation). O handler fará rollback do saque e retornará 500 "Erro ao registrar saque".
- **Mitigação possível (fora do escopo read-only):** Alterar o CHECK em produção para incluir `'withdraw_request'` ou remover o CHECK de `tipo`. Exemplo:  
  `ALTER TABLE ledger_financeiro DROP CONSTRAINT ... ;` e recriar com `(... 'withdraw_request', ...)` ou equivalente conforme o nome da constraint no banco.

**Risco 2 — Tipo de correlation_id (menor, já mitigado no código)**

- **O quê:** Em um ambiente (E2E 2026-03-04) a coluna `correlation_id` era tipo **uuid** e rejeitou string não-UUID (22P02).
- **Estado atual:** O código usa **toLedgerCorrelationId(clientKey)** e passa a enviar sempre um valor em formato UUID. Se a coluna for uuid, o valor é aceitável; se for text, também.
- **Risco residual:** Se em algum ambiente `correlation_id` for uuid e o cliente enviar uma chave que, após o hash, gere um UUID inválido (improvável com o algoritmo atual), ainda poderia falhar. Considerado baixo.

---

## 6. Conclusão final

| Pergunta | Resposta |
|----------|----------|
| **Estrutura real da tabela** | Inferida: **id**, **user_id** (produção sem **usuario_id**), **correlation_id**, **tipo**, **valor**, **referencia**, **created_at**. Evidência de produção: user_id presente, usuario_id ausente; correlation_id presente (em um caso como uuid). |
| **Compatível com server-fly.js e processPendingWithdrawals.js?** | **Parcialmente.** Colunas e lógica de user_id/usuario_id e correlation_id estão compatíveis com o que o código faz. **Incompatibilidade em aberto:** CHECK de **tipo** no repositório **não** inclui **withdraw_request**, que o código insere em todo request de saque. |
| **Risco exato** | **CHECK de `ledger_financeiro.tipo` pode não aceitar `withdraw_request`.** Se o banco tiver o mesmo CHECK do schema-ledger-financeiro.sql, o insert do ledger no POST /api/withdraw/request falhará e o usuário receberá 500 com rollback do saque. |
| **Recomendação** | Confirmar no Supabase (SQL ou painel) a constraint exata de `ledger_financeiro.tipo`. Se **withdraw_request** não estiver permitido, alterar o CHECK para incluí-lo (ou remover a restrição) para alinhar ao código atual. |

---

*Relatório gerado em modo READ-ONLY. Nenhuma conexão ao banco em tempo real; nenhuma alteração em código, schema ou deploy.*
