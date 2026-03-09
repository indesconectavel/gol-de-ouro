# Prova final read-only — Runtime ledger patch (user_id ↔ usuario_id)

**Data:** 2026-03-04  
**App Fly:** goldeouro-backend-v2  
**Base URL:** https://goldeouro-backend-v2.fly.dev  
**Regras:** Zero write (arquivos, DB, deploy, env). Apenas leitura, grep, flyctl read-only, HTTP GET.

---

## 1) Snapshot Fly READ-ONLY

### flyctl status -a goldeouro-backend-v2

```
App
  Name     = goldeouro-backend-v2
  Owner    = personal
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J

Machines
PROCESS        ID             VERSION  REGION  STATE    ROLE   CHECKS              LAST UPDATED
app            2874551a105768 311      gru     started         1 total, 1 passing  2026-03-03T23:54:24Z
app            e82d445ae76178 311      gru     stopped         1 total, 1 warning  2026-03-03T23:54:36Z
payout_worker  e82794da791108 311      gru     started                           2026-03-03T23:54:23Z
```

*(Warning Metrics token omitido no relatório; exit_code: 0.)*

### flyctl machines list -a goldeouro-backend-v2

| ID             | NAME                 | STATE   | IMAGE (resumo)                    | PROCESS GROUP | SIZE                |
|----------------|----------------------|--------|-----------------------------------|---------------|---------------------|
| 2874551a105768 | withered-cherry-5478 | started| goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J | app           | shared-cpu-1x:256MB |
| e82794da791108 | weathered-dream-1146 | started| (mesma imagem)                    | payout_worker | shared-cpu-1x:256MB |
| e82d445ae76178 | dry-sea-3466         | stopped| (mesma imagem)                    | app           | shared-cpu-1x:256MB |

Imagem em execução nas máquinas STARTED: **deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J**.

### flyctl releases -a goldeouro-backend-v2 (top 15)

| VERSION | STATUS   | DESCRIPTION | USER                      | DATE            |
|---------|----------|-------------|---------------------------|-----------------|
| v311    | failed   | Release     | indesconectavel@gmail.com | 18h20m ago      |
| v310    | failed   | Release     | indesconectavel@gmail.com | 18h30m ago      |
| v309    | failed   | Release     | indesconectavel@gmail.com | 18h46m ago      |
| v308    | failed   | Release     | indesconectavel@gmail.com | Mar 3 2026 15:11|
| v307    | failed   | Release     | indesconectavel@gmail.com | Mar 3 2026 15:06|
| v306    | failed   | Release     | indesconectavel@gmail.com | Mar 3 2026 14:43|
| v305    | complete| Release     | indesconectavel@gmail.com | Feb 25 2026 19:50|
| v304    | failed   | Release     | indesconectavel@gmail.com | Feb 6 2026 06:42|
| v303    | failed   | Release     | indesconectavel@gmail.com | Feb 6 2026 06:42|
| v302    | complete| Release     | indesconectavel@gmail.com | Feb 3 2026 22:42|
| v301    | complete| Release     | indesconectavel@gmail.com | Feb 3 2026 22:41|
| v300    | failed   | Release     | indesconectavel@gmail.com | Feb 3 2026 20:10|
| v299    | failed   | Release     | indesconectavel@gmail.com | Feb 3 2026 19:54|
| v298    | failed   | Release     | indesconectavel@gmail.com | Feb 3 2026 19:54|
| v297    | complete| Release     | indesconectavel@gmail.com | Feb 3 2026 16:29|

**Observação Fly:** v311 (e v310, v309…) aparecem como **failed**, porém as máquinas **app** (2874551a105768) e **payout_worker** (e82794da791108) estão **started** e rodando a imagem **deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J**. Ou seja: a imagem em execução é a do deploy mais recente (v311), mesmo com status de release "failed".

---

## 2) PROVA RUNTIME (imagem em execução)

**Objetivo:** Confirmar no **container** (não no repo) que o arquivo em runtime contém `ledgerUserIdColumn`, `insertLedgerRow` (user_id → usuario_id) e `createLedgerEntry` chamando `insertLedgerRow`.

### Tentativa de acesso ao container

- Comando: `flyctl ssh console -a goldeouro-backend-v2 -s 2874551a105768 -C "find /app -name processPendingWithdrawals.js"`
- Resultado: **Error: selecting VM: prompt: non interactive**
- Conclusão: Em ambiente não interativo não foi possível obter prova **dentro** do container. A prova em runtime requer **SSH interativo** (execução manual no ambiente com `flyctl ssh console -a goldeouro-backend-v2 -s 2874551a105768` e, dentro da sessão, os comandos abaixo).

### Comandos e evidências esperadas (para verificação manual no container)

Caminho esperado do arquivo no container (a confirmar com `find`):

- `find /app -name "processPendingWithdrawals.js"` → ex.: `/app/src/domain/payout/processPendingWithdrawals.js` ou similar sob `/app`.

Evidências a extrair **no container** (ex.: com `grep -n` e `sed -n 'N1,N2p' <path>`):

| Item | Comando sugerido | O que deve aparecer (trecho 5–25 linhas) |
|------|------------------|-------------------------------------------|
| A) Cache ledger | `grep -n "ledgerUserIdColumn" <path>` | Linha com `let ledgerUserIdColumn = null;` |
| B) insertLedgerRow | `grep -n "insertLedgerRow\|function insertLedgerRow" <path>` e `sed -n '13,40p' <path>` | Função que: 1) tenta `user_id`, 2) fallback `usuario_id`, 3) seta cache `'user_id'` ou `'usuario_id'`; sem throw. |
| C) createLedgerEntry → insertLedgerRow | `grep -n "createLedgerEntry\|insertLedgerRow" <path>` | `createLedgerEntry` chamando `insertLedgerRow(supabase, payloadBase, usuarioId)`. |

### Referência do repositório (código esperado na imagem)

Trechos do arquivo **local** `src/domain/payout/processPendingWithdrawals.js` (fonte do que deve estar na imagem v311):

**A) Cache e assinatura insertLedgerRow (linhas 5–13):**

```js
/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
let ledgerUserIdColumn = null;

/**
 * Insere uma linha no ledger usando a coluna de usuário existente no ambiente.
 * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
 * Nunca lança exceção; em falha retorna { success: false, error }.
 */
async function insertLedgerRow(supabase, payloadBase, usuarioId) {
```

**B) Primeira tentativa user_id e fallback usuario_id (linhas 24–39):**

```js
  const rowUser = { ...payloadBase, user_id: usuarioId };
  const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
  if (!res1.error) {
    ledgerUserIdColumn = 'user_id';
    return { success: true, data: res1.data };
  }
  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', ... });

  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
  const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
  if (!res2.error) {
    ledgerUserIdColumn = 'usuario_id';
    return { success: true, data: res2.data };
  }
  ...
  return { success: false, error: res2.error };
```

**C) createLedgerEntry chamando insertLedgerRow (linhas 59–66):**

```js
    const payloadBase = { tipo, valor: parseFloat(valor), referencia, correlation_id: correlationId, created_at: new Date().toISOString() };
    const insertResult = await insertLedgerRow(supabase, payloadBase, usuarioId);
    if (!insertResult.success) {
      return { success: false, error: insertResult.error };
    }
    return { success: true, id: insertResult.data?.id };
```

**Status desta seção:** Prova no container **não obtida** nesta sessão (SSH non-interactive). Para prova **incontestável** em produção, executar os comandos acima manualmente via `flyctl ssh console` na máquina **app** (2874551a105768).

---

## 3) PROVA READ-ONLY do schema em produção

Probe READ-ONLY: `SELECT ... LIMIT 1` nas colunas abaixo; apenas registrar existência (YES) ou falha (ex.: "column does not exist"). **Não usar** information_schema; não imprimir SUPABASE_SERVICE_ROLE_KEY nem URLs completas.

### Script de probe (para execução no container ou com env de prod)

- **Opção 1 (container):** Copiar para `/tmp` e rodar `node /tmp/probe_schema_ledger.js` (variáveis de ambiente já presentes no processo).
- **Opção 2 (local com .env prod):** Não executado nesta sessão para evitar uso de credenciais prod em relatório.

Tabelas/colunas a testar:

| Tabela                | Coluna     | Resultado esperado (exemplo) |
|-----------------------|------------|------------------------------|
| ledger_financeiro     | user_id    | YES ou "column does not exist" |
| ledger_financeiro     | usuario_id | YES ou "column does not exist" |
| saques                | usuario_id | YES ou "column does not exist" |
| password_reset_tokens | user_id    | YES ou "column does not exist" |

Formato de saída no relatório (sem vazar secrets):

- `SUPABASE_URL_PRESENT`: true/false  
- `SERVICE_ROLE_PRESENT`: true/false  
- `SUPABASE_URL_LEN`, `SERVICE_ROLE_LEN`: comprimentos (opcional)  
- Para cada tabela.coluna: **YES** ou mensagem curta de erro (ex.: "column does not exist").

**Status:** Probe **não executado** no container (SSH indisponível). Para obter esta prova em produção, executar no container (app ou payout_worker) um script que use apenas `supabase.from(tabela).select(col).limit(1)` e imprima apenas os flags acima e YES/erro por coluna. Script de referência no repo: `scripts/schema_probe_usuario_user_id.js` (adaptar para não logar keys; apenas flags e resultados por coluna).

---

## 4) Contrato do endpoint de saque (código em runtime)

Evidência esperada **no container** (path ex.: `/app/server-fly.js` ou similar):

- Handler: **POST /api/withdraw/request**
- Idempotência: `correlation_id` via `x-idempotency-key` ou `x-correlation-id`; consulta `saques` por `correlation_id` e retorno do saque existente se houver.
- Chamadas a **createLedgerEntry**: (1) débito saque, (2) débito taxa.

Trechos de referência do **repositório** (`server-fly.js`):

**Idempotência (correlation_id):**

```js
// Linhas ~1398-1470
const correlationId = String(
  req.headers['x-idempotency-key'] ||
  req.headers['x-correlation-id'] ||
  crypto.randomUUID()
);
// ...
const { data: existingWithdraw, error: existingWithdrawError } = await supabase
  .from('saques')
  .select('id, amount, valor, ...')
  .eq('correlation_id', correlationId)
  .maybeSingle();
if (existingWithdraw?.id) {
  return res.status(200).json({ success: true, message: 'Saque solicitado com sucesso', data: { ... existingWithdraw ... } });
}
```

**Chamadas createLedgerEntry (saque e taxa):**

```js
// Linhas ~1603-1625
const ledgerDebit = await createLedgerEntry({
  supabase,
  tipo: 'saque',
  usuarioId: userId,
  valor: requestedAmount,
  referencia: saque.id,
  correlationId
});
// ...
const ledgerFee = await createLedgerEntry({
  supabase,
  tipo: 'taxa',
  usuarioId: userId,
  valor: taxa,
  referencia: `${saque.id}:fee`,
  correlationId
});
```

**Status:** Contrato documentado a partir do **código do repositório**. Prova no container (sed/grep em `/app/server-fly.js`) requer SSH interativo.

---

## 5) Conclusão objetiva

- **PATCH PRESENT IN RUNTIME: NO (não verificado)**  
  A prova no **container** (arquivo em execução) não foi obtida nesta sessão porque `flyctl ssh console` exige modo interativo. A imagem em uso é **deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J** (release v311); o **código no repositório** contém o patch completo (ledgerUserIdColumn, insertLedgerRow com user_id/usuario_id, createLedgerEntry).

- **Recomendação:** Para fechar com segurança: **(1)** Executar manualmente no container (SSH interativo) os comandos da seção 2 e anexar os trechos ao relatório; **(2)** Rodar o probe de schema no container (seção 3) e preencher YES/erro; **(3)** Só então afirmar "PATCH PRESENT IN RUNTIME: YES" e considerar **pronto para etapa E2E (execução)**.

- **Se após verificação manual o patch estiver presente:**  
  - **Pronto para etapa E2E (execução).**

- **Se o patch não estiver presente no container:**  
  - **Bloqueado — precisa deploy do patch.**

### Sinais de sucesso (sem rodar write)

1. Logs do worker/handler com `[LEDGER]` sem erro "column ... does not exist" após primeiro insert.  
2. POST /api/withdraw/request retorna 201 e em `ledger_financeiro` aparece linha com `tipo: 'saque'` e `tipo: 'taxa'` para o mesmo `correlation_id`.  
3. Reenvio com mesmo `x-idempotency-key` retorna 200 com o mesmo saque (idempotência).

### Sinais de falha (sem rodar write)

1. Log "column ... does not exist" ou PGRST204 em inserção em `ledger_financeiro`.  
2. POST /api/withdraw/request retorna 500 com mensagem relacionada a ledger/coluna.  
3. Worker falha ao processar saque com erro de insert no ledger (airbag logado mas saque fica pendente/rollback).

---

*Relatório gerado em modo read-only. Nenhum arquivo alterado (exceto criação deste .md), nenhum deploy, nenhuma escrita em banco.*
