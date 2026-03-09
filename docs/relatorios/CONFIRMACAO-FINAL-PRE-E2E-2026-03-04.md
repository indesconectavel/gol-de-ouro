# Confirmação final pré-E2E

**Data:** 2026-03-04  
**Modo:** READ-ONLY ABSOLUTO (não editar, não commitar, não deployar, não reiniciar, não tocar em Vercel/player).  
**Objetivo:** Confirmar que o estado atual do sistema ainda corresponde ao diagnóstico antes de executar qualquer teste de saque.

---

## PASSO 1 — Frontend (/ e /game)

**Comandos executados (equivalente curl -I em PowerShell):**
- `Invoke-WebRequest -Uri "https://www.goldeouro.lol/" -Method Head`
- `Invoke-WebRequest -Uri "https://www.goldeouro.lol/game" -Method Head`

| URL | Status HTTP | Server header |
|-----|-------------|---------------|
| https://www.goldeouro.lol/ | **200** | Vercel |
| https://www.goldeouro.lol/game | **200** | Vercel |

**Assets index-*.js e index-*.css (extraídos do HTML de /game, sem baixar conteúdo):**
- `/assets/index-lDOJDUAS.css`
- `/assets/index-qIGutT6K.js`

---

## PASSO 2 — Backend

**Comando:** `Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method Head`

| URL | Status HTTP |
|-----|-------------|
| https://goldeouro-backend-v2.fly.dev/health | **200** |

---

## PASSO 3 — Fly

**Comando:** `flyctl status -a goldeouro-backend-v2`

| Campo | Valor |
|-------|--------|
| **VERSION** | 312 |
| **IMAGE** | goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM |

**Machines:**

| PROCESS      | ID             | VERSION | REGION | STATE   | CHECKS            |
|-------------|----------------|---------|--------|---------|--------------------|
| app         | 2874551a105768 | 312     | gru    | started | 1 total, 1 passing |
| app         | e82d445ae76178 | 312     | gru    | stopped | 1 total, 1 warning  |
| payout_worker | e82794da791108 | 312   | gru    | started | —                  |

**Estado:** Uma máquina **app** em **started**, uma **app** em **stopped**; **payout_worker** em **started**. Serviço atendido pela app started.

---

## PASSO 4 — Fallback do ledger no código

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`

**Confirmado:**
- **Tentativa com user_id primeiro:** INSERT com `user_id`; em sucesso grava cache `ledgerUserIdColumn = 'user_id'`.
- **Fallback para usuario_id:** Se o INSERT com `user_id` falhar, tenta INSERT com `usuario_id`; em sucesso grava `ledgerUserIdColumn = 'usuario_id'`.

**Trecho (linhas 3–44):**

```javascript
/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
let ledgerUserIdColumn = null;

/**
 * Insere uma linha no ledger usando a coluna de usuário existente no ambiente.
 * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
 * ...
 */
async function insertLedgerRow(supabase, payloadBase, usuarioId) {
  if (ledgerUserIdColumn) {
    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
    // ...
  }

  const rowUser = { ...payloadBase, user_id: usuarioId };
  const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
  if (!res1.error) {
    ledgerUserIdColumn = 'user_id';
    return { success: true, data: res1.data };
  }
  // ... log airbag ...

  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
  const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
  if (!res2.error) {
    ledgerUserIdColumn = 'usuario_id';
    return { success: true, data: res2.data };
  }
  // ...
}
```

---

## PASSO 5 — Alterações locais (git)

**Comandos:** `git status` e `git diff --stat`

**git status (resumo):**
- Branch: `hotfix/ledger-userid-fallback` (1 commit à frente de origin).
- **Modificado (não staged):** `src/domain/payout/processPendingWithdrawals.js`
- Untracked: vários arquivos em docs/relatorios, scripts, controllers (relatórios e scripts de apoio).

**git diff --stat:**

```
 src/domain/payout/processPendingWithdrawals.js | 10 ++++++++--
 1 file changed, 8 insertions(+), 2 deletions(-)
```

**Conclusão do passo 5:** Existe alteração local no arquivo crítico do ledger (**8 inserções, 2 remoções**). Isso **não** atende ao critério “não existem mudanças inesperadas”.

---

## PASSO 6 — Conclusão

**Critérios para GO:**

| Critério | Atende? |
|----------|---------|
| /game responde 200 | Sim |
| backend responde 200 | Sim |
| flyctl status mostra máquinas started (app e payout_worker) | Sim |
| fallback user_id → usuario_id está no código | Sim |
| não há mudanças inesperadas no git | **Não** — `processPendingWithdrawals.js` modificado |

---

## STATUS FINAL

**NO-GO**

Motivo: há mudanças locais não commitadas em `src/domain/payout/processPendingWithdrawals.js`. Para obter GO antes do teste de saque, é necessário reverter ou commitar essas alterações de forma consciente e refazer esta confirmação.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo do projeto foi editado; apenas criação deste documento.*
