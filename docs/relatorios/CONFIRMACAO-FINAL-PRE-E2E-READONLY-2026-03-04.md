# Confirmação final pré-E2E (READ-ONLY)

**Data:** 2026-03-04  
**Modo:** READ-ONLY ABSOLUTO (não editar, não commitar, não deployar, não reiniciar, não tocar em Vercel/player).  
**Objetivo:** Confirmar que o estado atual ainda bate com o relatório **DIAGNOSTICO-FINAL-LEDGER-WITHDRAW-READONLY-2026-03-04.md**.

---

## 1) Frontend (/ e /game)

| URL | Método | Status |
|-----|--------|--------|
| https://www.goldeouro.lol/ | HEAD | **200** |
| https://www.goldeouro.lol/game | HEAD | **200** |

**Assets referenciados no HTML (sem baixar conteúdo):**

- `/assets/index-lDOJDUAS.css`
- `/assets/index-qIGutT6K.js`

**Conferência com o relatório:** O DIAGNOSTICO-FINAL registra os mesmos assets (index-qIGutT6K.js, index-lDOJDUAS.css) e status 200 para / e /game. **OK.**

---

## 2) Backend e worker

| Verificação | Resultado |
|-------------|-----------|
| curl -I https://goldeouro-backend-v2.fly.dev/health | **200** |
| flyctl status -a goldeouro-backend-v2 | Executado |

**Fly — App goldeouro-backend-v2:**

- **VERSION:** 312  
- **Image:** goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM  

**Machines:**

| PROCESS      | ID            | VERSION | STATE   | CHECKS            |
|-------------|---------------|---------|---------|--------------------|
| app         | 2874551a105768 | 312     | started | 1 total, 1 passing |
| app         | e82d445ae76178 | 312     | stopped | 1 total, 1 warning |
| payout_worker | e82794da791108 | 312   | started | —                 |

**Conferência com o relatório:** DIAGNOSTICO-FINAL indica VERSION 312, mesma imagem e processos app + payout_worker. **OK.**

---

## 3) Fallback user_id → usuario_id no ledger

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`

**grep -n "ledgerUserIdColumn":**

```
  4:let ledgerUserIdColumn = null;
 12:  if (ledgerUserIdColumn) {
 13:    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
 26:    ledgerUserIdColumn = 'user_id';
 40:    ledgerUserIdColumn = 'usuario_id';
```

**grep -n "user_id":**

```
  3:/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
  8: * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
 23:  const rowUser = { ...payloadBase, user_id: usuarioId };
 26:    ledgerUserIdColumn = 'user_id';
 35:  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', ...safeErr(res1.error) });
```

**grep -n "usuario_id":**

```
  3:/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
  8: * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
 37:  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
 40:    ledgerUserIdColumn = 'usuario_id';
 43:  console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', ...safeErr(res2.error) });
175:      .select('id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at')
200:    const userId = saque.usuario_id;
```

**Conferência:** Ordem de fallback **user_id → usuario_id** presente; cache `ledgerUserIdColumn`; tentativa com `user_id` primeiro, depois `usuario_id`. **OK.**

---

## 4) Alterações locais (git)

**git status (resumo):**

- **Branch:** hotfix/ledger-userid-fallback (1 commit à frente de origin)
- **Modificado (não staged):** `src/domain/payout/processPendingWithdrawals.js`
- **Untracked:** vários arquivos em docs/relatorios, scripts, controllers, etc. (esperado para relatórios e scripts de apoio)

**git diff --stat:**

```
 src/domain/payout/processPendingWithdrawals.js | 10 ++++++++--
 1 file changed, 8 insertions(+), 2 deletions(-)
```

**Conferência com o relatório:** O DIAGNOSTICO-FINAL foi produzido em cenário onde o código do ledger não tinha alterações locais inesperadas. **Agora existe alteração local em arquivo crítico:** `processPendingWithdrawals.js` com 8 inserções e 2 remoções. Isso é **divergência** em relação ao estado “sem mudanças fora do esperado”. **NÃO OK.**

---

## Conclusão

| Item | Esperado (DIAGNOSTICO-FINAL) | Atual | Resultado |
|------|-----------------------------|--------|-----------|
| / e /game 200 | Sim | Sim | OK |
| Assets index-*.js / index-*.css | index-qIGutT6K.js, index-lDOJDUAS.css | index-lDOJDUAS.css, index-qIGutT6K.js | OK |
| Backend /health 200 | Sim | Sim | OK |
| Fly VERSION 312 | Sim | 312 | OK |
| Fly Image / machines app + payout_worker | Sim | Sim | OK |
| Fallback user_id → usuario_id presente | Sim | Sim | OK |
| Sem alterações locais inesperadas | Sim | **Não** — processPendingWithdrawals.js modificado | **DIVERGÊNCIA** |

---

## Veredito

**NO-GO**

**Motivo:** Há alterações locais no arquivo crítico `src/domain/payout/processPendingWithdrawals.js` (8 inserções, 2 remoções) que não estavam no estado descrito no DIAGNOSTICO-FINAL. Para que o pré-E2E seja considerado alinhado ao relatório, é necessário either reverter essas alterações ou revisar o diff e incorporar ao baseline do relatório antes de prosseguir com E2E.

**Recomendação:** Revisar `git diff src/domain/payout/processPendingWithdrawals.js`; decidir se as mudanças são intencionais (ex.: observabilidade). Se forem, atualizar o baseline do diagnóstico; se não forem, restaurar o arquivo ao estado commitado. Só então refazer esta confirmação para obter **GO**.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo foi editado, nenhum deploy ou reinício foi executado.*
