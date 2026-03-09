# Hotfix Ledger user_id Fallback — Prova em Runtime (APP started)

**Data:** 2026-03-04  
**App Fly:** goldeouro-backend-v2  
**Máquina alvo (APP started):** 2874551a105768 (process group app)  
**Regra:** Não mexer na máquina parada (e82d445ae76178). Sem seleção interativa.

---

## 1) Conexão (sem menu interativo)

**Comando usado:** conexão direta na máquina via `--machine`, comando remoto via `-C` (não interativo).

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C "sh -c '<comando>'"
```

*(Não foi usado `-s`/`--select`; não foi usado `--pty` para os comandos de prova.)*

---

## 2) Comandos executados dentro do container

Todos os comandos foram executados via `-C "sh -c '...'"` para garantir interpretação no container (BusyBox).

### Localizar o arquivo

```sh
find /app -name processPendingWithdrawals.js 2>/dev/null
```

**Caminho real do arquivo encontrado:**  
`/app/src/domain/payout/processPendingWithdrawals.js`

---

### Provar presença de `ledgerUserIdColumn`

```sh
grep -n ledgerUserIdColumn /app/src/domain/payout/processPendingWithdrawals.js
```

**Output:**
```
4:let ledgerUserIdColumn = null;
12:  if (ledgerUserIdColumn) {
13:    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
26:    ledgerUserIdColumn = 'user_id';
34:    ledgerUserIdColumn = 'usuario_id';
```

---

### Provar presença de `insertLedgerRow`

```sh
grep -n insertLedgerRow /app/src/domain/payout/processPendingWithdrawals.js
```

**Output:**
```
11:async function insertLedgerRow(supabase, payloadBase, usuarioId) {
66:    const insertResult = await insertLedgerRow(supabase, payloadBase, usuarioId);
```

---

### Provar presença de `createLedgerEntry`

```sh
grep -n createLedgerEntry /app/src/domain/payout/processPendingWithdrawals.js
```

**Output:**
```
41:const createLedgerEntry = async ({ supabase, tipo, usuarioId, valor, referencia, correlationId }) => {
104:    await createLedgerEntry({
114:      await createLedgerEntry({
272:    await createLedgerEntry({
308:  createLedgerEntry,
```

---

### Provar presença de `user_id` e `usuario_id`

```sh
grep -n user_id /app/src/domain/payout/processPendingWithdrawals.js | head -20
```
**Output:**
```
3:/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
8: * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
23:  const rowUser = { ...payloadBase, user_id: usuarioId };
26:    ledgerUserIdColumn = 'user_id';
29:  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', code: res1.error?.code, message: (res1.error?.message || '').slice(0, 80) });
```

```sh
grep -n usuario_id /app/src/domain/payout/processPendingWithdrawals.js | head -20
```
**Output:**
```
3:/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
8: * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
31:  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
34:    ledgerUserIdColumn = 'usuario_id';
37:  console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', code: res2.error?.code, message: (res2.error?.message || '').slice(0, 80) });
169:      .select('id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at')
194:    const userId = saque.usuario_id;
```

---

### Trecho das primeiras 40 linhas (prova do patch)

```sh
head -40 /app/src/domain/payout/processPendingWithdrawals.js
```

**Output:**
```
const payoutCounters = { success: 0, fail: 0 };

/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
let ledgerUserIdColumn = null;

/**
 * Insere uma linha no ledger usando a coluna de usuário existente no ambiente.
 * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
 * Nunca lança exceção; em falha retorna { success: false, error }.
 */
async function insertLedgerRow(supabase, payloadBase, usuarioId) {
  if (ledgerUserIdColumn) {
    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
    const { data, error } = await supabase
      .from('ledger_financeiro')
      .insert(row)
      .select('id')
      .single();
    if (error) return { success: false, error };
    return { success: true, data };
  }

  const rowUser = { ...payloadBase, user_id: usuarioId };
  const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
  if (!res1.error) {
    ledgerUserIdColumn = 'user_id';
    return { success: true, data: res1.data };
  }
  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', code: res1.error?.code, message: (res1.error?.message || '').slice(0, 80) });

  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
  const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
  if (!res2.error) {
    ledgerUserIdColumn = 'usuario_id';
    return { success: true, data: res2.data };
  }
  console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', code: res2.error?.code, message: (res2.error?.message || '').slice(0, 80) });
  return { success: false, error: res2.error };
}
```

---

## 3) Resumo da evidência

| Verificação | Resultado |
|-------------|-----------|
| Caminho real do arquivo | `/app/src/domain/payout/processPendingWithdrawals.js` |
| ledgerUserIdColumn | Presente (linhas 4, 12, 13, 26, 34) |
| insertLedgerRow | Presente (definição linha 11, chamada linha 66) |
| createLedgerEntry | Presente (definição 41, chamadas 104, 114, 272, export 308) |
| user_id | Presente (rowUser, cache 'user_id', log airbag) |
| usuario_id | Presente (rowUsuario, cache 'usuario_id', log airbag) |

---

## Confirmação textual

**Patch confirmado em runtime no APP started.**

O arquivo `processPendingWithdrawals.js` no container da máquina **2874551a105768** (process group app) contém o hotfix do ledger: cache `ledgerUserIdColumn`, função `insertLedgerRow` com tentativa `user_id` e fallback `usuario_id`, e `createLedgerEntry` utilizando esse fluxo. Nenhuma seleção interativa foi usada; conexão direta via `flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C "sh -c '...'"`.

---

*Saque não testado. Máquina parada não tocada. Worker não alterado.*
