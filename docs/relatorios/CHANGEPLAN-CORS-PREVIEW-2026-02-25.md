# Change plan — Patch CORS para preview Vercel

**Data:** 2026-02-25  
**Modo:** READ-ONLY (plano de mudança; patch não aplicado)  
**Objetivo:** Plano de mudança auditável, com patch proposto em texto, riscos e checklist, antes de qualquer alteração no código.

---

## 1. Contexto

### 1.1 Por que o preview falha (CORS preflight)

- O **player** em **preview Vercel** é servido em origens do tipo `https://goldeouro-player-<sufixo>.vercel.app`.
- O frontend chama o backend **https://goldeouro-backend-v2.fly.dev** (cross-origin). O navegador envia **OPTIONS** (preflight) com header `Origin` igual à URL do preview.
- O backend em `server-fly.js` usa `cors({ origin: parseCorsOrigins() })`, que devolve uma **lista fixa** (env `CORS_ORIGIN` ou default: `goldeouro.lol`, `www.goldeouro.lol`, `admin.goldeouro.lol`). O pacote `cors` faz **match exato** da origem.
- A origem do preview **não** está nessa lista → o backend **não** envia `Access-Control-Allow-Origin` na resposta ao preflight → o navegador **bloqueia** e o POST de login nunca é enviado. Erro típico: *"No 'Access-Control-Allow-Origin' header... preflight"*.

### 1.2 Por que produção e admin não devem ser afetados

- **Produção (player):** Origens `https://goldeouro.lol` e `https://www.goldeouro.lol` já são permitidas pela lista atual. O patch **mantém** essa lista (parseCorsOrigins) e apenas **acrescenta** uma condição para previews; não remove nem altera o tratamento dessas origens.
- **Admin:** Usa `admin.goldeouro.lol`, já na whitelist. Em produção o admin chama a API via proxy `/api` (mesma origem do ponto de vista do backend quando configurado). O patch não remove `admin.goldeouro.lol` da lógica de permissão.

---

## 2. Patch proposto (somente texto)

### 2.1 Onde será alterado

- **Arquivo:** `server-fly.js`
- **Trecho:** Configuração do middleware CORS (atualmente linhas ~235–251: função `parseCorsOrigins` e `app.use(cors({ ... }))`).
- **Alteração:** Substituir a opção **`origin`** de um valor fixo (array retornado por `parseCorsOrigins()`) por uma **função** que implemente a lógica abaixo. O restante da configuração do `cors` (credentials, methods, allowedHeaders) permanece igual.

### 2.2 Como ficará a lógica de `origin`

A função `origin` receberá `(origin, callback)` (assinatura do pacote `cors`). Comportamento:

- **a) Origin ausente:** Se `origin` for `undefined` ou falsy (ex.: requisições same-origin, Postman, algumas ferramentas), chamar `callback(null, true)` para permitir (não enviar header de origem, mas não bloquear).

- **b) Lista atual (parseCorsOrigins):** Obter a lista de origens permitidas chamando `parseCorsOrigins()` (mesma função atual: CSV de `CORS_ORIGIN` ou default). Se `origin` estiver **incluído** nessa lista (match exato), chamar `callback(null, true)`.

- **c) Regex restrita para previews do player:** Se `origin` **não** estiver na lista do item (b), testar contra a regex:
  - **Regex:** `^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$`
  - Objetivo: permitir **somente** subdomínios que comecem com `goldeouro-player` no domínio `vercel.app` (ex.: `goldeouro-player-abc123xyz.vercel.app`, `goldeouro-player-git-main-scope.vercel.app`).
  - Se a regex der match, chamar `callback(null, true)` (e, se o pacote permitir, retornar o valor `origin` para que o header `Access-Control-Allow-Origin` seja essa origem exata).

- **d) Demais origens:** Em qualquer outro caso, chamar `callback(null, false)` (ou equivalente que indique “não permitir”), para que o middleware **não** envie `Access-Control-Allow-Origin` e o navegador trate como CORS negado.

### 2.3 Resumo da ordem de decisão

1. Sem `origin` → permitir.  
2. `origin` na lista de `parseCorsOrigins()` → permitir.  
3. `origin` casando com a regex de preview do player → permitir.  
4. Caso contrário → negar.

---

## 3. Riscos e mitigação

| Risco | Mitigação |
|-------|------------|
| **Regressão em produção (www / goldeouro.lol)** | A lista de `parseCorsOrigins()` é mantida e consultada **antes** da regex. Origens já permitidas continuam com o mesmo comportamento (match exato). |
| **Regressão no admin** | `admin.goldeouro.lol` permanece na lista padrão (ou em `CORS_ORIGIN`). Nenhuma remoção dessa origem. |
| **Regex liberal (permitir outros projetos Vercel)** | Regex restrita a `goldeouro-player` + sufixo opcional + `.vercel.app`. Não usar `.*\.vercel\.app` nem `*`. Testar a regex contra exemplos positivos (goldeouro-player-xxx.vercel.app) e negativos (outro-projeto.vercel.app, goldeouro-admin.vercel.app). |
| **Regex malformada ou edge cases** | Validar em desenvolvimento com vários valores de `Origin` (incluindo com trailing slash, http vs https, subdomínios aninhados) e garantir que apenas o padrão esperado passe. Documentar a regex no código com comentário. |
| **Performance** | Uma chamada a `parseCorsOrigins()` por request (ou cache da lista por app lifecycle). Regex é O(n) no tamanho da string; impacto desprezível. |
| **Pacote `cors` e assinatura da função** | Usar a assinatura documentada do pacote `cors` para `origin` como função: `function(origin, callback)`. Garantir que `callback` seja chamado exatamente uma vez com `(err, allow)` onde `allow` pode ser um booleano ou a string da origem a refletir. |

---

## 4. Rollback exato

### 4.1 Git revert + redeploy

1. **Identificar o commit do patch:**  
   `git log -1 --oneline` no branch onde o patch foi aplicado (ou anotar o SHA no momento do commit).

2. **Reverter o commit:**  
   `git revert <SHA_DO_COMMIT_DO_PATCH> --no-edit`  
   Resolver conflitos se houver; concluir o revert.

3. **Redeploy no Fly.io:**  
   Fazer deploy do branch que contém o revert (ex.: `fly deploy` ou pipeline configurado para o app `goldeouro-backend-v2`). Garantir que a release ativa no Fly é a pós-revert.

### 4.2 Validação pós-rollback (curl)

- **Preview deve voltar a ser bloqueado (comportamento anterior):**
  ```bash
  curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" \
    -H "Origin: https://goldeouro-player-xxx.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -v
  ```
  **Esperado:** Resposta **sem** header `Access-Control-Allow-Origin` (ou CORS negado); no browser o preflight volta a falhar.

- **Produção deve continuar permitida:**
  ```bash
  curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" \
    -H "Origin: https://www.goldeouro.lol" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -v
  ```
  **Esperado:** Status 204 ou 200; header `Access-Control-Allow-Origin: https://www.goldeouro.lol`.

---

## 5. Checklist de validação pós-fix

Após aplicar o patch e fazer deploy do backend:

| # | Item | Comando / ação | Critério de sucesso |
|---|------|----------------|----------------------|
| 1 | **curl OPTIONS preview** | `curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-<ID_REAL>.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v` | Resposta com `Access-Control-Allow-Origin: https://goldeouro-player-<ID_REAL>.vercel.app` e status 2xx. |
| 2 | **curl OPTIONS www** | `curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v` | Resposta com `Access-Control-Allow-Origin: https://www.goldeouro.lol` e status 2xx. |
| 3 | **Login preview** | Abrir URL de um preview do player na Vercel; tentar login (email/senha). | Login concluído sem erro de CORS no console; Network mostra OPTIONS 2xx seguido de POST 200 para `/api/auth/login`. |
| 4 | **Login produção** | Abrir https://www.goldeouro.lol (ou https://goldeouro.lol); tentar login. | Login concluído sem regressão; sem erro de CORS. |
| 5 | **Admin** | Abrir https://admin.goldeouro.lol; login e uso de uma funcionalidade que chame a API. | Fluxo normal; sem erro de CORS ou 403 por origem. |

---

## 6. Critérios de GO / NO-GO

### 6.1 GO (seguir com o patch)

- Produção (www / goldeouro.lol) e admin estão estáveis antes do patch.
- Há SHA/documentação do estado atual para rollback.
- O único arquivo a ser alterado é `server-fly.js` (bloco CORS).
- Após o patch, os itens 1–5 do checklist de validação forem executados e aprovados (ou plano de correção imediata definido para qualquer falha isolada).

### 6.2 NO-GO (abortar e reverter)

- **Regressão em produção:** Qualquer falha de login ou de chamadas à API a partir de https://www.goldeouro.lol ou https://goldeouro.lol após o deploy do patch → **reverter imediatamente** (rollback da seção 4) e investigar.
- **Regressão no admin:** Falha de CORS ou de autenticação no admin em produção → **reverter** e investigar.
- **Origem indevida permitida:** Se testes ou logs indicarem que uma origem que **não** deve ser permitida (ex.: outro projeto Vercel, domínio arbitrário) passou na regex → **reverter** e apertar a regex ou a lógica.
- **Indisponibilidade do backend:** Se o deploy do patch causar crash ou 5xx generalizado → **reverter** (release anterior no Fly) e corrigir o código antes de nova tentativa.
- **Decisão operacional:** Qualquer critério interno da equipe que defina abortar (ex.: janela de mudança encerrada, incidente em andamento) → **não fazer deploy** ou **reverter** se já deployado.

### 6.3 Ação em caso de NO-GO

1. Executar o rollback exato da seção 4 (git revert + redeploy + validação curl).
2. Comunicar e documentar o motivo do NO-GO.
3. Revisar o patch (regex, ordem das condições, testes) antes de nova tentativa.

---

*Plano de mudança gerado em modo READ-ONLY. Nenhum código foi alterado.*
