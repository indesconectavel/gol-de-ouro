# Diagnóstico final — Ledger/Withdraw (READ-ONLY)

**Data:** 2026-03-04  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo editado, nenhum deploy, migration, schema ou reinício).  
**Objetivo:** Confirmar com evidência técnica todos os elementos envolvidos no erro "Erro ao registrar saque" relacionado ao INSERT em ledger_financeiro.

---

## FASE 1 — Implementação real do ledger

**Arquivos:** `server-fly.js`, `src/domain/payout/processPendingWithdrawals.js`

### 1) Função createLedgerEntry

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js` (linhas 46–80)

- Deduplicação: SELECT em `ledger_financeiro` por `(correlation_id, tipo, referencia)`; se existir, retorna `{ success: true, deduped: true }`.
- Monta `payloadBase`: `tipo`, `valor: parseFloat(valor)`, `referencia`, `correlation_id`, `created_at: new Date().toISOString()`.
- Chama `insertLedgerRow(supabase, payloadBase, usuarioId)`.
- Retorna `{ success: true, id }` ou `{ success: false, error }`.

### 2) Função insertLedgerRow

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js` (linhas 11–44)

- Se cache `ledgerUserIdColumn` existe: um INSERT com `[ledgerUserIdColumn]: usuarioId`.
- Senão: tenta INSERT com **user_id**; se falhar, tenta INSERT com **usuario_id**; grava em cache a coluna que funcionar; se ambos falharem, retorna `{ success: false, error }`.

### 3) Ordem de fallback de colunas

**user_id primeiro, depois usuario_id** (linhas 22–27, depois 36–43).

### 4) Payload enviado ao INSERT

- **payloadBase (createLedgerEntry):** `tipo`, `valor`, `referencia`, `correlation_id`, `created_at`.
- **insertLedgerRow** adiciona uma coluna de usuário: **user_id** ou **usuario_id** (valor = `usuarioId`).

### Colunas usadas no INSERT

| Coluna         | Origem        | Tipo/valor                          |
|----------------|---------------|-------------------------------------|
| tipo           | payloadBase   | string ('saque', 'taxa', etc.)      |
| valor          | payloadBase   | numeric (parseFloat)                |
| referencia     | payloadBase   | text (ex.: saque.id ou saque.id+:fee) |
| correlation_id | payloadBase   | text                                |
| created_at     | payloadBase   | timestamptz (ISO)                   |
| user_id **ou** usuario_id | insertLedgerRow | UUID (usuarioId)              |

**Trecho real (insertLedgerRow, linhas 22–37):**

```javascript
const rowUser = { ...payloadBase, user_id: usuarioId };
const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
if (!res1.error) {
  ledgerUserIdColumn = 'user_id';
  return { success: true, data: res1.data };
}
// ... log airbag ...
const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
```

---

## FASE 2 — Chamadas do ledger no fluxo de saque

**Rota:** `POST /api/withdraw/request` — **server-fly.js** (handler a partir da linha 1386).

### INSERT em tabela saques

**Linhas 1538–1558:** `supabase.from('saques').insert({ usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status: 'pendente', created_at }).select().single()`

### Chamadas de createLedgerEntry

**Chamada 1 (linhas 1576–1583):**
- `createLedgerEntry({ supabase, tipo: 'saque', usuarioId: userId, valor: requestedAmount, referencia: saque.id, correlationId })`
- **tipo = 'saque'**

**Chamada 2 (linhas 1601–1608):**
- `createLedgerEntry({ supabase, tipo: 'taxa', usuarioId: userId, valor: taxa, referencia: \`${saque.id}:fee\`, correlationId })`
- **tipo = 'taxa'**

Em falha de qualquer uma, o handler chama `rollbackWithdraw` e retorna **500** com **message: 'Erro ao registrar saque'**.

**Trechos (server-fly.js 1575–1625):**

```javascript
const ledgerDebit = await createLedgerEntry({
  supabase, tipo: 'saque', usuarioId: userId, valor: requestedAmount,
  referencia: saque.id, correlationId
});
if (!ledgerDebit.success) { ... return res.status(500).json({ message: 'Erro ao registrar saque' }); }

const ledgerFee = await createLedgerEntry({
  supabase, tipo: 'taxa', usuarioId: userId, valor: taxa,
  referencia: `${saque.id}:fee`, correlationId
});
if (!ledgerFee.success) { ... return res.status(500).json({ message: 'Erro ao registrar saque' }); }
```

---

## FASE 3 — Estrutura esperada do ledger (schema do repo)

**Arquivo:** `database/schema-ledger-financeiro.sql`

- **Tabela:** `ledger_financeiro`
- **Colunas:**
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `correlation_id` text NOT NULL
  - `tipo` text NOT NULL CHECK (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout'))
  - **usuario_id** uuid NOT NULL
  - `valor` numeric(12,2) NOT NULL
  - `referencia` text
  - `created_at` timestamptz NOT NULL DEFAULT now()
- **Índices:** ledger_financeiro_usuario_idx (usuario_id), ledger_financeiro_created_idx (created_at), ledger_financeiro_correlation_tipo_ref_idx UNIQUE (correlation_id, tipo, referencia)
- **Schema do repo:** usa **usuario_id**; **não** declara **user_id**.

---

## FASE 4 — Estrutura real em produção

**Fonte:** relatório `AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md` (probe READ-ONLY no Supabase produção).

**Resultado do probe para ledger_financeiro:**

- `id`: YES
- **usuario_id:** "column ledger_financeiro.usuario_id does not exist"
- **user_id:** YES

**Divergência:**

| Aspecto     | Schema do repo (schema-ledger-financeiro.sql) | Banco real (produção) |
|-------------|----------------------------------------------|------------------------|
| Coluna usuário | **usuario_id** uuid NOT NULL                 | **user_id** (existe)   |
| usuario_id  | Existe                                       | **Não existe**        |

Em produção, a tabela `ledger_financeiro` tem **user_id** e **não** tem **usuario_id**.

---

## FASE 5 — Worker de payout

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`

O worker usa **createLedgerEntry** em:

- **rollbackWithdraw** (linhas 110–117 e 119–126): `createLedgerEntry({ tipo: 'rollback', ... })` (débito e taxa de rollback).
- **processPendingWithdrawals** (linhas 278–285): em caso de falha de payout, `createLedgerEntry({ tipo: 'falha_payout', usuarioId, valor: netAmount, referencia: saqueId, correlationId })`.

O mesmo módulo exporta `createLedgerEntry` (linha 314); server-fly.js e o worker usam a mesma função e o mesmo airbag (user_id → usuario_id).

---

## FASE 6 — Deploy atual do Fly

**Comando:** `flyctl status -a goldeouro-backend-v2`

- **App:** goldeouro-backend-v2  
- **Hostname:** goldeouro-backend-v2.fly.dev  
- **Image:** goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM  
- **VERSION:** 312  
- **Machines:**  
  - app 2874551a105768 — VERSION 312, region gru, **started** (1 check passing)  
  - app e82d445ae76178 — VERSION 312, **stopped**  
  - payout_worker e82794da791108 — VERSION 312, **started**  
- **Processos:** app (`npm start`), payout_worker (`node src/workers/payout-worker.js`), conforme fly.toml.

---

## FASE 7 — Player não afetado (evidência)

**curl -I https://www.goldeouro.lol/**  
- HTTP/1.1 **200 OK**  
- Server: Vercel, Content-Type: text/html; charset=utf-8, Content-Length: 9056  

**curl -I https://www.goldeouro.lol/game**  
- HTTP/1.1 **200 OK**  
- Content-Length: 9056, Server: Vercel  

**Assets carregados (do HTML do player):**  
- `/assets/index-qIGutT6K.js`  
- `/assets/index-lDOJDUAS.css`  

Ambos retornam 200; /game está acessível.

---

## FASE 8 — Análise técnica

1) **O INSERT do ledger usa user_id ou usuario_id?**  
   O código tenta **os dois**, em ordem: primeiro **user_id**, depois **usuario_id** (insertLedgerRow). O payload enviado em cada tentativa é um único objeto com uma das colunas (user_id ou usuario_id), nunca as duas ao mesmo tempo.

2) **Qual coluna realmente existe no banco?**  
   No banco de **produção** (evidência do probe em AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md): **user_id** existe; **usuario_id** não existe.

3) **O fallback user_id → usuario_id resolve a divergência?**  
   **Sim.** Em produção a coluna é **user_id**; o código tenta **user_id** primeiro; portanto a primeira tentativa já deve ter sucesso e o cache `ledgerUserIdColumn = 'user_id'` evita novas falhas. O fallback foi introduzido exatamente para cobrir essa divergência (repo/schema com usuario_id, produção com user_id).

4) **Existe outra constraint possível que causaria erro?**  
   Possíveis causas adicionais (após a coluna correta): CHECK em `tipo` (valores 'saque' e 'taxa' estão no CHECK do schema); NOT NULL em outras colunas (todas enviadas); índice UNIQUE (correlation_id, tipo, referencia) — o código envia referencia não nula. A causa **principal** documentada é a coluna de usuário (user_id vs usuario_id).

---

## FASE 9 — Diagnóstico final

### DIAGNÓSTICO PROVÁVEL

**CAUSA PROVÁVEL**  
Divergência de coluna **user_id** vs **usuario_id** na tabela **ledger_financeiro**: em produção a tabela tem **user_id** e não tem **usuario_id**; o schema do repositório e o código original usavam **usuario_id**. Quando o INSERT era feito apenas com **usuario_id**, o Postgres/Postgrest retornava erro (coluna inexistente), `createLedgerEntry` retornava falha e o handler respondia **500 "Erro ao registrar saque"**.

### EVIDÊNCIAS

- Schema do repo (`database/schema-ledger-financeiro.sql`): coluna **usuario_id** uuid NOT NULL.
- Probe em produção (AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md): `ledger_financeiro` com **user_id** YES, **usuario_id** "column does not exist".
- Código atual em `processPendingWithdrawals.js`: airbag que tenta **user_id** primeiro, depois **usuario_id**; em produção a primeira tentativa (user_id) deve ter sucesso.
- Mensagem "Erro ao registrar saque" aparece apenas nos blocos em que `!ledgerDebit.success` ou `!ledgerFee.success` (server-fly.js), ou seja, quando o INSERT no ledger falha.

### RISCO DO DEPLOY

**Baixo** — O airbag (user_id → usuario_id) já está no código e em produção (v312 pós-merge PR #30). Deploy adicional apenas de melhorias de log (ex.: details/hint) não altera a lógica do INSERT; não há alteração de schema, player ou Vercel.

### RECOMENDAÇÃO

**Deploy seguro** para a alteração de observabilidade (log de details/hint no airbag), desde que: (1) escopo limitado ao backend (um arquivo, sem goldeouro-player/workflows/schema); (2) deploy via flyctl sem push em main (evitando redeploy do player). Para qualquer novo 500 relacionado ao ledger, os logs com details/hint permitirão confirmar a causa sem expor dados sensíveis.

---

**Relatório gerado em modo READ-ONLY. Nenhum código foi modificado, nenhum deploy executado, nenhuma máquina reiniciada.**
