# PRECHECK READ-ONLY — Deploy backend (observabilidade ledger)

**Data:** 2026-03-04  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo editado, nenhum commit, deploy ou alteração de config).  
**Objetivo:** Garantir com evidência que um deploy do backend via flyctl (goldeouro-backend-v2) não pode afetar o player (/game) e que a mudança pretendida é mínima, segura e isolada.

---

## FASE 1 — Escopo real do que mudaria (git)

### 1) Comandos executados e resultado

**git status (resumo):**
- Branch: hotfix/ledger-userid-fallback (ahead of origin by 1 commit).
- **Modified (não staged):** apenas `src/domain/payout/processPendingWithdrawals.js`.
- **Untracked:** diversos arquivos em docs/relatorios/, scripts/, controllers/, src/domain/payout/reconcileProcessingWithdrawals.js, withdrawalStatus.js (nenhum deles faz parte do build do Fly; o build usa .dockerignore em whitelist).

**git diff --stat:**
```
 src/domain/payout/processPendingWithdrawals.js | 10 ++++++++--
 1 file changed, 8 insertions(+), 2 deletions(-)
```

**git diff (trecho relevante):**
- Adição do helper `safeErr(e)` que retorna `{ code, message (slice 80), details (slice 120), hint (slice 120) }`.
- Os dois `console.warn('[LEDGER] insert falhou (airbag)', ...)` passam a usar `...safeErr(res1.error)` e `...safeErr(res2.error)` em vez de apenas `code` e `message`.

### 2) Confirmação da única mudança pretendida

- **Único arquivo modificado (que entraria no deploy):** `src/domain/payout/processPendingWithdrawals.js`.
- Opcionalmente, apenas **docs** (relatórios) poderiam ser commitados; não fazem parte da imagem Docker do Fly.

### 3) Confirmação de ausência de mudanças em player/workflows

- **git diff** e **git status** não mostram alterações em:
  - `goldeouro-player/**`
  - `.github/workflows/**`
  - `vercel.json`, `package.json` (raiz), turbo, nx.
- Os únicos itens listados como modificados ou untracked são arquivos do backend ou docs/scripts; nenhum path sob goldeouro-player ou .github/workflows aparece como modificado.

**Resultado FASE 1:** Nenhum arquivo fora do backend aparece como mudança pretendida. **GO** para escopo (apenas 1 arquivo de backend).

---

## FASE 2 — Prova de que deploy via Fly não envolve Vercel/player

### 4) Estrutura do repositório

- **Backend:** raiz do repo (server-fly.js, src/, config/, services/, etc.). Entrypoint: `node server-fly.js` (package.json "main": "server-fly.js", script "start": "node server-fly.js").
- **Player:** subpasta `goldeouro-player/` (app Vite/React servido pela Vercel).

### 5) Comando flyctl deploy

- O comando `flyctl deploy -a goldeouro-backend-v2` usa o **fly.toml** na raiz, que declara `[build] dockerfile = "Dockerfile"` e `ignorefile = ".dockerignore"`.
- O **Dockerfile** na raiz faz: `COPY . .` após `COPY package*.json`, `RUN npm install --only=production`; depois `CMD ["node", "server-fly.js"]`. Não há nenhuma menção a **vercel**, **goldeouro-player** nem **npx vercel** no Dockerfile (confirmado por busca em Dockerfile*).

### 6) Evidências fly.toml e Dockerfile

**fly.toml (trecho):**
- `app = "goldeouro-backend-v2"`
- `[build] dockerfile = "Dockerfile"`, `ignorefile = ".dockerignore"`
- `[processes] app = "npm start"`, `payout_worker = "node src/workers/payout-worker.js"`
- Nenhuma referência a Vercel nem ao diretório goldeouro-player.

**Dockerfile (raiz):**
- `FROM node:20-alpine`, `WORKDIR /app`, `COPY package*.json ./`, `RUN npm install --only=production`, `COPY . .`, `CMD ["node", "server-fly.js"]`.
- Não executa vercel nem build do player.

**.dockerignore:**
- Modo whitelist: `**` (ignora tudo) e depois `!package.json`, `!package-lock.json`, `!server-fly.js`, `!src/**`, `!config/**`, etc. **Não há** `!goldeouro-player`; portanto a pasta **goldeouro-player não é copiada** para o contexto de build da imagem.

### 7) Etapa do build Fly que rode o player

- **Não há.** O build da imagem usa apenas o Dockerfile e o .dockerignore; o contexto inclui só os paths permitidos pelo .dockerignore (backend). Nenhum script do package.json raiz executa build do player; não existe etapa que chame Vercel ou goldeouro-player.

**Resultado FASE 2:** flyctl deploy empacota apenas o backend; não executa vercel nem mexe no player. **GO**.

---

## FASE 3 — Workflows e risco de gatilhos

### 8) Listagem de workflows

- Comando: listagem de `.github/workflows` (backend-deploy.yml, ci.yml, configurar-seguranca.yml, deploy-on-demand.yml, frontend-deploy.yml, health-monitor.yml, main-pipeline.yml, monitoring.yml, rollback.yml, security.yml, tests.yml).

### 9) Workflows que usam Vercel

- **main-pipeline.yml:** passo "Deploy Frontend (Vercel)" com `working-directory: ./goldeouro-player` e `npx vercel --prod --yes`.
- **frontend-deploy.yml:** `amondnet/vercel-action@v25` com `vercel-args: '--prod --yes'` (main) ou `'--target preview'` (dev); `working-directory: goldeouro-player`.
- **rollback.yml:** `npx vercel ls`, `npx vercel promote` (rollback do frontend).
- **deploy-on-demand.yml:** `amondnet/vercel-action@v25` com `working-directory: ./goldeouro-player`, `vercel-args: "--prod"`.

### 10) Risco identificado

- **main-pipeline.yml** dispara em **push** (e workflow_dispatch) na branch **main**. Quando dispara, executa deploy do backend no Fly **e** deploy do frontend na Vercel (goldeouro-player). Portanto, **merge/push em main pode disparar deploy do player**.

### 11) Plano atual vs. workflows

- O plano atual é **deploy apenas do backend via flyctl deploy** (manual), **sem** push/merge em main. Com isso, **nenhum** workflow é acionado; em particular, o main-pipeline não roda e o player não é redeployado.

### 12) Conclusão FASE 3

- **Deploy via Fly = não toca Vercel.** Evidência: flyctl deploy usa apenas fly.toml + Dockerfile + .dockerignore; não chama GitHub Actions nem Vercel. O risco histórico (merge em main → pipeline → deploy do player) é evitado porque não há push/merge em main no plano atual; apenas flyctl deploy manual do backend.

**Resultado FASE 3:** **GO**.

---

## FASE 4 — Estado atual de produção (somente leitura)

### 13) Player (www.goldeouro.lol)

- **curl -I https://www.goldeouro.lol/:** HTTP/1.1 200 OK, Server: Vercel, Content-Type: text/html; charset=utf-8.
- **Assets servidos (extraídos do HTML):** `/assets/index-qIGutT6K.js`, `/assets/index-lDOJDUAS.css`.
- **curl -I https://www.goldeouro.lol/game:** HTTP/1.1 200 OK (Content-Length 9056, Server Vercel). **/game responde 200.**

### 14) Backend (Fly)

- **flyctl status -a goldeouro-backend-v2:** App goldeouro-backend-v2, Hostname goldeouro-backend-v2.fly.dev, Image deployment-01KJXAHSJH0G0PEB6SAWWCPBQM. Machines: app 2874551a105768 VERSION 312 started; app e82d445ae76178 VERSION 312 stopped; payout_worker e82794da791108 VERSION 312 started.
- **curl -I https://goldeouro-backend-v2.fly.dev/health:** HTTP/1.1 200 OK, content-type: application/json, server: Fly.

Nenhum token, JWT ou chave PIX foi incluído no relatório.

**Resultado FASE 4:** Player e /game respondem 200; assets registrados; backend em execução (v312). **GO**.

---

## FASE 5 — Segurança do log (patch safeErr)

### 16) Inspeção do patch

- O patch adiciona `safeErr(e)` que retorna apenas: `code`, `message` (slice 0–80), `details` (slice 0–120), `hint` (slice 0–120) do objeto de erro do Supabase/Postgrest.
- O log é `console.warn('[LEDGER] insert falhou (airbag)', { step, ...safeErr(res1.error) })`. O parâmetro `e` é o **erro retornado pelo cliente Supabase** em um `.insert().select().single()`; esse objeto típico contém `code`, `message`, `details`, `hint` (mensagens do PostgreSQL/Postgrest), **não** Authorization, JWT, pix_key nem email.
- Nenhum trecho do patch lê ou loga `req`, `headers`, `Authorization`, `body`, `pix_key` ou `email`. Truncamento (80/120) reduz ainda mais risco de vazamento.

### 17) Tabela de segurança

| Campo sensível           | Aparece nos logs? | Mitigação                                      | Status  |
|--------------------------|-------------------|------------------------------------------------|---------|
| Authorization / JWT       | Não               | safeErr só recebe objeto de erro do Supabase  | OK      |
| pix_key completo         | Não               | Não é passado para insertLedgerRow/safeErr    | OK      |
| email completo           | Não               | Idem                                           | OK      |
| code/message/details/hint| Sim (truncados)   | message 80 chars, details/hint 120 chars      | OK      |

**Resultado FASE 5:** Patch não vaza segredos. **GO**.

---

## FASE 6 — Checklist GO/NO-GO (final)

| Condição | Verificação | Resultado |
|----------|-------------|-----------|
| a) Apenas 1 arquivo de backend mudaria (+ docs opcional) | git diff --stat: só processPendingWithdrawals.js | **GO** |
| b) flyctl deploy não roda build do player nem toca Vercel | fly.toml + Dockerfile + .dockerignore; sem vercel/goldeouro-player | **GO** |
| c) Nenhum workflow será acionado (não há push/merge em main) | Plano: flyctl deploy manual; main-pipeline só dispara em push main | **GO** |
| d) /game (goldeouro.lol/game) está 200 e assets registrados | curl / e /game → 200; assets index-qIGutT6K.js, index-lDOJDUAS.css | **GO** |
| e) Patch de log não vaza segredos | safeErr só loga code/message/details/hint truncados; sem JWT/pix/email | **GO** |

---

## Conclusão

- **GO** — Todas as condições do checklist são verdadeiras. Um deploy do backend via **flyctl deploy -a goldeouro-backend-v2** (com a mudança atual em `src/domain/payout/processPendingWithdrawals.js`) é **mínimo, seguro e isolado**: não afeta o player (/game), não aciona workflows nem Vercel, e o patch de observabilidade (details/hint) não introduz vazamento de segredos nos logs.

**Nenhum deploy foi executado; nenhum arquivo foi editado, commitado ou alterado além da geração deste relatório.**
