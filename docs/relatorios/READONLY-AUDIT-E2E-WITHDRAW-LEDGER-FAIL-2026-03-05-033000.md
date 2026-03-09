# Auditoria READ-ONLY — FAIL E2E "Erro ao registrar saque"

**Tipo:** Read-only absoluto (nenhum patch, commit ou deploy).  
**Objetivo:** Causa exata do FAIL no E2E automatizado `scripts/e2e-withdraw-ledger.js`.  
**Data:** 2026-03-05.

---

## 1. Resumo executivo

O E2E automatizado de saque/ledger retornou **FAIL** com `statusCode: 500`, `success: false`, `message: "Erro ao registrar saque"`. As contagens no relatório E2E para uuid inválido, 22P02, "Erro ao registrar saque" nos logs e "[LEDGER] insert falhou" foram **todas zero**, o que indica que **o script está classificando FAIL pela resposta HTTP do saque** (e não por evidência nos logs coletados).

**Causa mais provável (diagnóstico):**  
- **E) O script E2E coleta logs em janela/filtro que não contêm a linha do erro** — o backend retorna 500 e a mensagem "Erro ao registrar saque" quando `createLedgerEntry` falha (saque ou taxa); o log no servidor é `"Erro ao registrar ledger (saque):"` ou `"(taxa):"`, e o airbag grava `"[LEDGER] insert falhou (airbag)"`. Nenhuma dessas linhas apareceu nos logs coletados pelo E2E (janela imediata pós-saque, possivelmente antes do flush do log ou em máquina/instância diferente).  
- **Complementar B)** Não se pode descartar outra constraint no ledger (RLS, tipo, UNIQUE, etc.) sem o log real do Postgres; a imagem em produção (v312) pode não incluir os commits locais do branch `hotfix/ledger-userid-fallback` (toLedgerCorrelationId + airbag user_id/usuario_id), o que deixaria o correlation_id como string não-UUID no INSERT e geraria 22P02 — mas então seria esperado ver 22P02/uuid nos logs; como não vemos, a janela de logs é a explicação mais coerente.

**Veredito READ-ONLY:** **NO-GO** — faltam evidências no buffer de logs para afirmar a causa exata (22P02, RLS, airbag, etc.). Recomenda-se **change mínimo**: (1) incluir no E2E a contagem de "Erro ao registrar **ledger**" nos logs (não só "Erro ao registrar saque"); (2) ampliar janela/retrocesso dos logs (ou usar flyctl logs com timestamp próximo ao do request); (3) confirmar se a imagem deployada em produção contém `toLedgerCorrelationId` e o airbag (build a partir de `a4b2e54` / `93b502f`).

---

## 2. Evidências

### 2.1 FASE 1 — Baseline local (git)

Comandos executados (PowerShell):

```text
git status
git branch --show-current
git rev-parse HEAD
git log -5 --oneline
git diff --stat
```

**Resultado:**

- **Branch:** `hotfix/ledger-userid-fallback`
- **HEAD:** `93b502fb2dc2e3dacc3780b6f20d3abdf139ffee`
- **Últimos commits:**  
  - `93b502f` chore(ledger): improve airbag error logs (details/hint) for diagnostics  
  - `f727860` test(payout): allow PIX_KEY via env for live withdraw test  
  - `a4b2e54` hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry  
  - `3ae3786` Merge pull request #29 ...  
  - `d67f6b5` fix(security): CSP report-only no helmet
- **Mudanças locais (não commitadas):**  
  - `package.json` (modified)  
  - `server-fly.js` (modified)  
  - `src/domain/payout/processPendingWithdrawals.js` (modified)
- **Conclusão:** O commit do patch de correlation_id (via `toLedgerCorrelationId`) e do airbag user_id/usuario_id está no histórico (**a4b2e54**, **93b502f**). O código que implementa isso está em `processPendingWithdrawals.js` (local). Não foi verificado se a **imagem em produção** (v312) foi construída a partir desses commits.

---

### 2.2 FASE 2 — Fluxo do withdraw e origem do "Erro ao registrar saque"

Arquivo: `server-fly.js`.

- **Endpoint:** `POST /api/withdraw/request` (linha 1385), com `authenticateToken`.
- **CorrelationId:**  
  `req.headers['x-idempotency-key'] || req.headers['x-correlation-id'] || crypto.randomUUID()` (linhas 1388–1392).
- **createLedgerEntry (débito saque):** linhas 1576–1584:
  - Parâmetros: `supabase`, `tipo: 'saque'`, `usuarioId: userId`, `valor: requestedAmount`, `referencia: saque.id`, `correlationId`.
- **Condição do 500 (saque):** se `!ledgerDebit.success` (linha 1585):
  - `console.error('❌ [SAQUE] Erro ao registrar ledger (saque):', ledgerDebit.error);`
  - `rollbackWithdraw(...)`
  - `return res.status(500).json({ success: false, message: 'Erro ao registrar saque' });` (linhas 1596–1599).
- **createLedgerEntry (taxa):** linhas 1602–1610:
  - Parâmetros: `tipo: 'taxa'`, `referencia: \`${saque.id}:fee\``, mesmo `usuarioId` e `correlationId`.
- **Condição do 500 (taxa):** se `!ledgerFee.success` (linha 1612):
  - `console.error('❌ [SAQUE] Erro ao registrar ledger (taxa):', ledgerFee.error);`
  - `rollbackWithdraw(...)`
  - `return res.status(500).json({ success: false, message: 'Erro ao registrar saque' });` (linhas 1622–1625).

Ou seja: o cliente recebe sempre a mesma mensagem **"Erro ao registrar saque"** tanto quando falha o ledger do débito quanto da taxa; no servidor o log é **"Erro ao registrar ledger (saque)"** ou **"(taxa)"**, nunca a string exata "Erro ao registrar saque".

---

### 2.3 FASE 3 — Implementação atual do ledger (domínio)

Arquivo: `src/domain/payout/processPendingWithdrawals.js` (somente leitura).

- **toLedgerCorrelationId (equivalente):** existe com o nome `toLedgerCorrelationId` (linhas 8–14). Converte `clientKey` em UUID válido: se já for UUID (regex), retorna como está; senão gera UUID determinístico via SHA-256 do string.
- **createLedgerEntry:** usa `ledgerCorrelationId = toLedgerCorrelationId(correlationId)` (linha 59); usa esse valor no SELECT de dedup `.eq('correlation_id', ledgerCorrelationId)` (linhas 60–65) e em `payloadBase.correlation_id = ledgerCorrelationId` (linhas 76–80). O insert é feito via `insertLedgerRow(supabase, payloadBase, usuarioId)`.
- **Airbag user_id / usuario_id:** em `insertLedgerRow` (linhas 21–55): primeiro tenta com `user_id`; se falhar, faz `console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', ... });` e tenta com `usuario_id`; se falhar de novo, `console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', ... });` e retorna `{ success: false, error: res2.error }`. Ou seja, a string exata nos logs é **"[LEDGER] insert falhou (airbag)"**, que contém o substring **"[LEDGER] insert falhou"** usado na contagem do E2E.

Trechos mínimos:

```javascript
// toLedgerCorrelationId (linhas 7-14)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function toLedgerCorrelationId(clientKey) {
  const s = String(clientKey || '');
  if (UUID_REGEX.test(s)) return s;
  const hash = crypto.createHash('sha256').update(s).digest();
  // ... forma UUID
}
// createLedgerEntry usa ledgerCorrelationId no dedup e no payloadBase (59, 62, 79)
// insertLedgerRow: row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId } ou user_id/usuario_id
```

---

### 2.4 FASE 4 — E2E e logs (janela/filtro)

**Relatório E2E usado:** `docs/relatorios/E2E-WITHDRAW-LEDGER-AUTO-2026-03-05-233659.md`

- **RunId:** e2e-1772678219420  
- **Timestamp ISO:** 2026-03-05T02:36:59.420Z  
- **Hora local aproximada:** 02:36 UTC (23:36 BRT aprox. no dia anterior).

**Coleta de logs (read-only):**

- `flyctl status -a goldeouro-backend-v2`:  
  - app started: `2874551a105768` (version 312)  
  - app stopped: `e82d445ae76178`  
  - payout_worker: `e82794da791108` (version 312)
- `flyctl logs -a goldeouro-backend-v2 --machine 2874551a105768 --no-tail`  
- `flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail`

**Trechos filtrados (mascarados):**

- Nos logs recentes da app (2874551a105768) **não** apareceram linhas contendo:  
  `[SAQUE]` (exceto outras operações), `Erro ao registrar ledger`, `[LEDGER]`, `airbag`, `rollbackWithdraw`, `ledger_financeiro`, `createLedgerEntry`, `correlation_id`, `constraint`, `duplicate key`, `violates`, `permission denied`, `RLS`, `PGRST`, `42703`, `22P02`, `23505`, `23503`, `42501`.  
  O que aparece na janela são muitas linhas de `[RECON] ID de pagamento inválido` (outro fluxo), em timestamps a partir de 2026-03-05T02:39:09Z. O evento do E2E foi por volta de **02:37:02Z** (como no relatório: "[SAQUE] Início" com correlationId `hotfix-ledger-live-test-1772678222525`). Ou seja, **a janela de logs obtida com `--no-tail` não contém o momento exato do request de saque** (logs já rotacionaram ou o buffer retornado é posterior ao 02:37).
- No worker (e82794da791108) só aparecem ciclos `[PAYOUT][WORKER]` (nenhum saque pendente, resumo); nada de ledger ou SAQUE.

**Conclusão FASE 4:** Não foi encontrada nenhuma linha com os termos listados que seja claramente do mesmo request do E2E. **Registrado explicitamente:** não apareceu evidência do erro de ledger nos logs coletados. **Sugestão:** o script E2E pode estar usando janela/filtro inadequados (pouco retrocesso no tempo ou apenas uma máquina) e por isso "0 ocorrências" não implica ausência do erro no servidor.

---

### 2.5 FASE 5 — E2E e script de saque (captura da resposta)

- **create-test-withdraw-live.js:**  
  - Envia `Authorization: BEARER` (valor de `process.env.BEARER`; o script exige `BEARER.startsWith('Bearer ')`).  
  - Endpoint: `BASE + '/api/withdraw/request'` (BASE = backend URL).  
  - Em erro (statusCode fora de 2xx), imprime uma única linha JSON: `{ success: false, statusCode: res.statusCode, message: msg, saqueId }`. O E2E usa essa linha para extrair `success`, `message`, `statusCode`, `saqueId`. O parse é confiável (primeira linha que começa com `{` e contém `"success"`).  
  - **statusCode:** só está no JSON no ramo de erro (linha 85); no sucesso (linha 82) não inclui `statusCode` (o E2E pode mostrar "(não disponível)" em caso de sucesso). Para o caso FAIL atual, o statusCode 500 está presente no JSON.  
- **e2e-withdraw-ledger.js:**  
  - Classifica FAIL quando `!success && !noCall` com justificativa "Chamada ao saque retornou success=false. message: ..." (linhas 252–254). Ou seja, o FAIL é corretamente atribuído à **resposta da API** (success=false, message "Erro ao registrar saque"), e não às contagens de logs (que deram 0).

---

### 2.6 FASE 6 — Hipóteses com evidência

| Hipótese | Evidência | Conclusão |
|----------|-----------|-----------|
| **A) correlation_id não convertido (patch ausente)** | No código local, `toLedgerCorrelationId` existe e é usado. Em produção não foi possível confirmar se a imagem v312 contém esse código. Se estivesse ausente, seria esperado 22P02/uuid nos logs; como não há logs do momento do erro, não se pode confirmar nem descartar. | Possível apenas se produção estiver sem o patch **e** a janela de logs for insuficiente. |
| **B) Outra constraint no ledger** | RLS, UNIQUE, NOT NULL, tipo de coluna etc. poderiam causar falha sem 22P02. O airbag logaria "[LEDGER] insert falhou (airbag)" com details/hint. Nenhuma dessas linhas apareceu na janela de logs coletada. | Possível; sem log do erro real, não há evidência. |
| **C) Rollback mascara o erro** | O rollback chama `createLedgerEntry` (rollback) e atualiza saque para 'falhou'. Se o rollback falhar, não altera o retorno 500 já enviado. Não mascara a causa do primeiro falho. | Improvável como causa do 500. |
| **D) Problema antes do ledger (ex.: saldo)** | Antes do ledger o endpoint retorna 400/409/503 com mensagens específicas (saldo insuficiente, saque pendente, etc.). "Erro ao registrar saque" só é retornado após falha de `createLedgerEntry`. | Descartado. |
| **E) Script coleta logs na janela errada** | O relatório E2E mostra apenas "[SAQUE] Início" no app; os logs obtidos agora com `--no-tail` começam em 02:39Z, enquanto o request foi ~02:37Z. A linha "Erro ao registrar ledger" ou "[LEDGER] insert falhou (airbag)" não está no buffer coletado. A contagem "Erro ao registrar saque" nos logs é 0 porque no servidor a mensagem logada é "Erro ao registrar **ledger**", não "saque". | **Mais provável:** janela/filtro de logs inadequados e diferença entre texto logado e texto contado. |

---

## 3. Linha do tempo

- **2026-03-05T02:36:59.420Z** — E2E inicia (RunId e2e-1772678219420).  
- **~2026-03-05T02:37:02Z** — Único log do request no relatório: `[SAQUE] Início` com `correlationId: 'hotfix-ledger-live-test-1772678222525'`.  
- Imediatamente após — Resposta HTTP 500, `message: "Erro ao registrar saque"`.  
- Em seguida — E2E coleta logs com `flyctl logs ... --no-tail`. O buffer retornado não contém o intervalo 02:36–02:38 para a app; contagens de uuid/22P02/ledger/erro = 0.  
- **2026-03-05T02:39:09Z** — Primeiras linhas visíveis nos logs da app na coleta atual (RECON, não SAQUE).

---

## 4. Diagnóstico (causa mais provável)

**Causa mais provável:** **E) O script E2E está coletando logs em janela/filtro que não incluem o momento do erro** e, além disso, a contagem de "Erro ao registrar saque" nos logs nunca seria positiva, pois o servidor loga "Erro ao registrar **ledger** (saque):" ou "(taxa):".

Em segundo plano, **B)** permanece plausível (outra constraint no ledger ou schema em produção), mas sem uma linha de log do erro (Postgres ou airbag) não há como confirmar.

---

## 5. Próximo passo recomendado (sem aplicar)

1. **Alterar o E2E** para contar também "Erro ao registrar ledger" e "[LEDGER] insert falhou" (incluindo "(airbag)") nos logs.  
2. **Aumentar a janela de logs** (ex.: pedir mais linhas ou usar intervalo de tempo próximo ao timestamp do request; ver se flyctl permite desde/hora).  
3. **Confirmar o build em produção:** verificar se a imagem deployment-01KJXAHSJH0G0PEB6SAWWCPBQM (v312) foi gerada a partir de commits que incluem `toLedgerCorrelationId` e o airbag user_id/usuario_id (por exemplo a4b2e54 / 93b502f).  
4. **Opcional:** no endpoint, logar de forma explícita um identificador (ex.: correlationId) e o código/msg do erro de `ledgerDebit.error` / `ledgerFee.error` (sem expor dados sensíveis), para facilitar correlação nos logs.

---

**VEREDITO READ-ONLY: NO-GO** — Faltam evidências no buffer de logs para concluir a causa exata (22P02, RLS, airbag, outra constraint). **GO para change mínimo** apenas após: (1) ajuste do E2E para buscar "Erro ao registrar ledger" e "[LEDGER] insert falhou"; (2) janela de logs que cubra o momento do request; e/ou (3) confirmação do código deployado em produção.
