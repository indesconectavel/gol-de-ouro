# Causa raiz — INSERT em ledger_financeiro falha no POST /api/withdraw/request (500 "Erro ao registrar saque")

**Data:** 2026-03-04  
**Modo:** READ-ONLY + evidência (sem alterar schema, player, máquinas, migrate).  
**Objetivo:** Descobrir por que o INSERT em ledger_financeiro falha e causa 500 "Erro ao registrar saque".

---

## PASSO 1 — Pontos exatos do erro no server-fly.js

Os dois únicos pontos que retornam **"Erro ao registrar saque"** estão **após** o INSERT em `saques` ter sucesso, quando `createLedgerEntry` falha:

### Trecho 1 — Ledger débito (tipo 'saque')

**Arquivo:** `server-fly.js`  
**Linhas:** 1577–1600

```javascript
const ledgerDebit = await createLedgerEntry({
  supabase,
  tipo: 'saque',
  usuarioId: userId,
  valor: requestedAmount,
  referencia: saque.id,
  correlationId
});

if (!ledgerDebit.success) {
  console.error('❌ [SAQUE] Erro ao registrar ledger (saque):', ledgerDebit.error);
  await rollbackWithdraw({ ... });
  return res.status(500).json({
    success: false,
    message: 'Erro ao registrar saque'
  });
}
```

**Step/tipo:** `'saque'`. **Campos passados ao ledger:** `tipo`, `usuarioId` (→ coluna user_id ou usuario_id), `valor`, `referencia` (= `saque.id`), `correlationId`.

### Trecho 2 — Ledger taxa (tipo 'taxa')

**Arquivo:** `server-fly.js`  
**Linhas:** 1602–1626

```javascript
const ledgerFee = await createLedgerEntry({
  supabase,
  tipo: 'taxa',
  usuarioId: userId,
  valor: taxa,
  referencia: `${saque.id}:fee`,
  correlationId
});

if (!ledgerFee.success) {
  console.error('❌ [SAQUE] Erro ao registrar ledger (taxa):', ledgerFee.error);
  await rollbackWithdraw({ ... });
  return res.status(500).json({
    success: false,
    message: 'Erro ao registrar saque'
  });
}
```

**Step/tipo:** `'taxa'`. **Campos:** idem, com `referencia` = `saque.id + ':fee'`.

---

## PASSO 2 — insertLedgerRow / createLedgerEntry (processPendingWithdrawals.js)

### createLedgerEntry (linhas 40–74)

- **Deduplicação:** SELECT em `ledger_financeiro` por `(correlation_id, tipo, referencia)`; se existir, retorna success (deduped).
- **Payload base montado:**  
  `{ tipo, valor: parseFloat(valor), referencia, correlation_id: correlationId, created_at: new Date().toISOString() }`.
- **Inserção:** chama `insertLedgerRow(supabase, payloadBase, usuarioId)`.

### insertLedgerRow (linhas 11–37)

- Se **cache** `ledgerUserIdColumn` está definido: um único INSERT com `[ledgerUserIdColumn]: usuarioId` (user_id ou usuario_id).
- Se **não** está definido:
  1. Tenta INSERT com **user_id**: `rowUser = { ...payloadBase, user_id: usuarioId }`.
  2. Se falhar: loga `console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', code: res1.error?.code, message: (res1.error?.message || '').slice(0, 80) })`.
  3. Tenta INSERT com **usuario_id**: `rowUsuario = { ...payloadBase, usuario_id: usuarioId }`.
  4. Se falhar: loga idem com `step: 'usuario_id'`.
  5. Retorna `{ success: false, error: res2.error }` (último erro).

**Payload final do INSERT (por tentativa):**

- Colunas: `tipo`, `valor`, `referencia`, `correlation_id`, `created_at` + **user_id** OU **usuario_id** (valor = `usuarioId` UUID).

**O que é logado em falha (airbag):**

- Apenas `code` e `message` (primeiros 80 caracteres). **Não** são logados `details` nem `hint` do erro Supabase/Postgrest.

---

## PASSO 3 — Logs do Fly (coleta READ-ONLY)

- **Comando:** `flyctl logs -a goldeouro-backend-v2 --no-tail`, filtrado por `[SAQUE]`, `[LEDGER]`, `airbag`, `Erro ao registrar ledger`.
- **Resultado na janela coletada:** Nenhuma linha com "Erro ao registrar ledger" nem "[LEDGER] insert falhou (airbag)" no buffer recente (apenas logs do worker e da app 2874551a105768 com RECON/PIX/WEBHOOK). Ou seja, não houve tentativa de saque que falhasse no ledger nesse intervalo.
- **Evidência alternativa (auditoria anterior):** O relatório **AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md** documenta um **probe READ-ONLY** no banco de **produção** (Supabase) com o seguinte resultado para a tabela `ledger_financeiro`:

```text
TABLE_ledger_financeiro {
  "id": "YES",
  "usuario_id": "column ledger_financeiro.usuario_id does not exist",
  "user_id": "YES"
}
```

Ou seja: em produção a tabela **ledger_financeiro** tem coluna **user_id** e **não** tem coluna **usuario_id**. O erro do Supabase ao tentar INSERT com **usuario_id** seria do tipo **coluna inexistente** (código PostgreSQL **42703** ou mensagem equivalente “column ledger_financeiro.usuario_id does not exist”). Não foi necessário registrar tokens, JWT nem chaves PIX completas; o probe não expõe dados sensíveis.

---

## PASSO 4 — Causa raiz provável

| Hipótese | Evidência | Conclusão |
|----------|-----------|-----------|
| Coluna de usuário divergente | Em **produção**, `ledger_financeiro` tem **user_id** e **não** tem **usuario_id**. No **repo**, `database/schema-ledger-financeiro.sql` e o código original usam **usuario_id**. | **Causa raiz** |
| RLS | Server usa `supabaseAdmin` (SERVICE_ROLE); RLS é bypassado. | Descartada para este 500 |
| Outra constraint / NOT NULL | Payload envia todos os campos obrigatórios (tipo, valor, referencia, correlation_id, created_at + id do usuário). Falha ocorre antes (coluna inexistente). | Secundária |
| Tipo UUID inválido | `usuarioId` vem de `req.user.userId` (JWT); já usado no INSERT em `saques` com sucesso. | Descartada |

**Diagnóstico final (1 causa provável):**

- **Divergência de coluna de usuário no ledger:** em produção a tabela `ledger_financeiro` foi criada (ou alterada) com a coluna **user_id**, enquanto o código e o schema do repositório (`schema-ledger-financeiro.sql`) usam **usuario_id**. O INSERT em `ledger_financeiro` enviando **usuario_id** falha com erro do tipo “column ledger_financeiro.usuario_id does not exist”, o que faz `createLedgerEntry` retornar `success: false` e o handler retornar **500 "Erro ao registrar saque"**.

---

## PASSO 5 — Plano de correção mínimo (apenas backend, sem schema, sem /game)

- **Não** alterar schema (nem rodar migrate) e **não** tocar no player (/game).
- **Correção já existente no código:** Em `src/domain/payout/processPendingWithdrawals.js`, a função **insertLedgerRow** implementa um “airbag”: tenta primeiro INSERT com **user_id**; se falhar, tenta com **usuario_id** e grava em cache a coluna que funcionar. Assim, em produção (onde a coluna é **user_id**), a primeira tentativa já deve ter sucesso após o deploy dessa versão.
- **Ação recomendada:** Garantir que a versão do backend que contém esse airbag (fallback user_id → usuario_id) está **efetivamente em deploy** no app `goldeouro-backend-v2`. Se o 500 ainda ocorrer após o deploy, coletar de novo os logs no momento do erro e inspecionar o objeto `ledgerDebit.error` / `ledgerFee.error` (e, se possível, logar `error.code`, `error.message`, `error.details`, `error.hint`) para confirmar se persiste erro de coluna ou se há outra causa (ex.: constraint, tipo).
- **Melhoria opcional (só backend):** No airbag, além de `code` e `message`, logar `details` e `hint` do erro Supabase (sem incluir dados sensíveis) para facilitar diagnóstico futuro sem alterar schema nem /game.

---

## Resumo

| Item | Conteúdo |
|------|----------|
| Trechos do código (falha) | server-fly.js 1577–1600 (ledger saque), 1602–1626 (ledger taxa); processPendingWithdrawals.js 11–37 (insertLedgerRow), 40–74 (createLedgerEntry). |
| Erro Supabase (evidência) | Em produção, `ledger_financeiro` tem **user_id** e não tem **usuario_id**. INSERT com usuario_id → “column ledger_financeiro.usuario_id does not exist” (código 42703 ou equivalente). |
| Diagnóstico final | Divergência de coluna: produção usa **user_id**, código/schema repo usavam **usuario_id** → INSERT falha → 500 "Erro ao registrar saque". |
| Plano mínimo | Manter correção atual (airbag user_id → usuario_id) e garantir deploy; opcional: logar details/hint do erro no airbag. Sem alterar schema, sem tocar /game. |
