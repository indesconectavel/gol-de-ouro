# READ-ONLY — Checklist e provas CORS Preview Vercel

**Data:** 2026-02-25  
**Modo:** 100% READ-ONLY (nenhum arquivo do projeto alterado; apenas este relatório criado)  
**Objetivo:** Diagnosticar e documentar o que falta para validar o fix de CORS para previews do Vercel no backend Fly.io.

---

## 1) Estado do Git (branch, HEAD, diff)

### Comandos executados

```bash
git status
git log -1 --oneline
git show --stat 7afa349
git show 7afa349 -- server-fly.js
```

### Evidências

| Item | Valor |
|------|--------|
| **Branch** | `main` |
| **Status** | "Your branch is ahead of 'origin/main' by 1 commit". Apenas arquivos untracked (working tree limpa para deploy). |
| **HEAD** | `7afa349 fix(cors): allow goldeouro-player vercel previews` |
| **Commit 7afa349 --stat** | 2 files changed: `server-fly.js` (10 insertions, 1 deletion), `docs/relatorios/PATCH-CORS-PREVIEW-APLICADO-2026-02-25.md` (91 insertions). |

### Diff do middleware CORS (git show 7afa349 -- server-fly.js)

**Antes:**

```javascript
app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

**Depois:**

```javascript
// Regex restrita: libera apenas previews do projeto goldeouro-player na Vercel (*.vercel.app)
const vercelPreviewOriginRegex = /^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = parseCorsOrigins();
    if (allowed.includes(origin)) return callback(null, true);
    if (vercelPreviewOriginRegex.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

---

## 2) Evidências do fix no código (trecho exato com regex)

**Arquivo:** `server-fly.js` (estado no commit 7afa349)

**Regex usada:**

```javascript
const vercelPreviewOriginRegex = /^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$/;
```

**Lógica de `origin`:** (1) origem ausente → permitir; (2) origem em `parseCorsOrigins()` → permitir; (3) origem casando com `vercelPreviewOriginRegex` → permitir; (4) demais → negar.

---

## 3) Como identificar o ORIGIN REAL de preview do Vercel (sem depender de prints)

### 3.1 Via Vercel CLI (preferencial)

Com o CLI logado (`vercel login`), usar:

- **Listar projetos / deployments:**
  - `vercel project ls` — lista projetos do time/usuário.
  - `vercel ls` (dentro do diretório do projeto, ex.: `goldeouro-player`) — lista deployments.
  - `vercel list` ou `vercel deployments ls` (conforme versão do CLI).
- **Identificar:** Projeto **goldeouro-player**; deployment mais recente em estado **Preview** / **Ready**; coluna **Domain(s)** ou **URL** — o domínio é o `Origin` (ex.: `https://goldeouro-player-xxxxx-goldeouro-admins-projects.vercel.app`).

### 3.2 Via repositório (sem CLI logado)

- **.vercel/project.json** (se existir no projeto do player): contém `projectId` e às vezes `orgId`; o domínio de preview é gerado pela Vercel (padrão `<project>-<id>-<scope>.vercel.app`). Neste repositório **não** foi encontrado `.vercel/project.json` no backend nem em `goldeouro-player`.
- **Docs e configs:** Procurar em `docs/`, `docs/auditorias/`, `docs/relatorios/`, `README*.md` por URLs que casem com `goldeouro-player-*-*.vercel.app` ou `goldeouro-player-*.vercel.app`.

### 3.3 Evidência local (URL real encontrada nos docs)

Busca por `goldeouro-player.*vercel\.app` em `*.md` e `*.json` do repositório encontrou **várias URLs reais** documentadas (deploys anteriores). Padrão típico:

- **Formato:** `https://goldeouro-player-<id>-goldeouro-admins-projects.vercel.app`
- **Exemplo usado nos testes abaixo:** `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app` (citado em `docs/auditorias/AUDITORIA-DOMINIO-VERCEL-FINAL-v1.2.0.md`, `AUDITORIA-VALIDACAO-TOTAL-DOMINIOS-v1.2.0.md`, entre outros).

**Nota:** Essas URLs são de deploys passados; um deployment **atual** de preview pode ter outro ID. Para o teste de preflight, qualquer URL que siga o padrão acima é válida para validar a regex; para validar “no browser” o preview atual, é necessário obter a URL do deployment atual (Vercel Dashboard ou `vercel ls` após login).

---

## 4) Comandos exatos (PowerShell)

### 4.1 Descobrir domínios de preview (Vercel CLI)

Requer `vercel login` antes. No diretório do **player** (ex.: `goldeouro-player`):

```powershell
cd "e:\Chute de Ouro\goldeouro-backend\goldeouro-player"
vercel whoami
vercel ls
```

Ou listar projetos e depois deployments do projeto:

```powershell
vercel project ls
vercel list --scope <team-or-user>
```

O output mostra a URL do deployment (ex.: `https://goldeouro-player-xxxxx-goldeouro-admins-projects.vercel.app`). Usar essa URL como `ORIGIN_REAL` nos curls.

### 4.2 Testar preflight (curl OPTIONS) com Origin real

Substituir `ORIGIN_REAL` pela URL obtida acima ou por uma documentada (ex.: `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`).

**Preview:**

```powershell
curl.exe -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: ORIGIN_REAL" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v
```

**Produção (www):**

```powershell
curl.exe -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v
```

Usar `curl.exe` no PowerShell para evitar o alias que aponta para `Invoke-WebRequest`.

---

## 5) Prova do bloqueio Fly (erro flyctl) e passo para destravar

### Comandos executados

```powershell
flyctl --version
flyctl status --app goldeouro-backend-v2
```

### Output (flyctl --version)

```
flyctl.exe version 0.4.3
```

### Output (flyctl status) — erro exato

```
Error: No access token available. Please login with 'flyctl auth login'
```

(No PowerShell pode aparecer também a mensagem de stderr sobre o script; a mensagem de erro do flyctl é a acima.)

### Passo para destravar

1. Executar: **`flyctl auth login`**
2. Concluir o fluxo no navegador (login/SSO Fly.io).
3. Em seguida: **`flyctl status --app goldeouro-backend-v2`** — deve listar o app sem erro.
4. Para deploy: **`flyctl deploy --app goldeouro-backend-v2`** (no diretório do backend, com HEAD em 7afa349 e working tree limpa).

---

## 6) Teste CORS preflight (sem deploy) — resultados atuais

Backend em produção **ainda sem** o commit 7afa349 (deploy bloqueado). Resultados dos curls:

### A) Origin real de preview (exemplo dos docs)

**Origin usada:** `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`

**Comando:**

```powershell
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**Resposta (trechos relevantes):**

- **Status HTTP:** 204 No Content  
- **access-control-allow-origin:** **ausente** (preview atualmente não permitido — comportamento esperado antes do deploy do fix)  
- **access-control-allow-credentials:** true  
- **access-control-allow-methods:** GET,POST,PUT,DELETE,OPTIONS  
- **access-control-allow-headers:** Content-Type,Authorization,X-Requested-With,X-Idempotency-Key  

### B) Produção (www.goldeouro.lol)

**Comando:**

```powershell
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**Resposta (trechos relevantes):**

- **Status HTTP:** 204 No Content  
- **access-control-allow-origin:** **https://www.goldeouro.lol**  
- **access-control-allow-credentials:** true  
- **access-control-allow-methods:** GET,POST,PUT,DELETE,OPTIONS  
- **access-control-allow-headers:** Content-Type,Authorization,X-Requested-With,X-Idempotency-Key  

Conclusão: produção (www) está OK; preview não recebe `Access-Control-Allow-Origin` no estado atual (antes do deploy).

---

## 7) Checklist para execução (NÃO executado neste READ-ONLY)

Comandos a serem executados **depois** (fora do modo READ-ONLY), em ordem:

1. **Autenticar no Fly:**  
   `flyctl auth login`

2. **Deploy do backend com o fix:**  
   No diretório do backend, com HEAD em 7afa349 e working tree limpa:  
   `flyctl deploy --app goldeouro-backend-v2`

3. **Repetir os dois curls e comparar:**  
   - Preview: deve passar a retornar `access-control-allow-origin` com o valor exato do `Origin` enviado (ex.: `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`).  
   - www: deve continuar retornando `access-control-allow-origin: https://www.goldeouro.lol`.

4. **Validar login no preview no browser:**  
   Abrir a URL do preview no navegador; tentar login; conferir que não há erro de CORS e que o POST para `/api/auth/login` é enviado após OPTIONS com sucesso.

---

## 8) GO / NO-GO e rollback (apenas texto)

### GO

- Deploy do commit 7afa349 aplicado no Fly (app `goldeouro-backend-v2`).
- Curl OPTIONS com **Origin real de preview** retorna `Access-Control-Allow-Origin` refletindo essa origem e status 2xx.
- Curl OPTIONS com **Origin: https://www.goldeouro.lol** continua retornando `Access-Control-Allow-Origin: https://www.goldeouro.lol`.
- Login no preview no browser funciona (sem bloqueio CORS).

### NO-GO

- Regressão em www ou admin (perda de `Access-Control-Allow-Origin` para essas origens).
- `Access-Control-Allow-Origin` retornado para origem que **não** deve ser permitida (ex.: outro projeto Vercel, domínio arbitrário).
- Indisponibilidade ou erros 5xx do backend após o deploy.

### Rollback (instruções exatas)

1. **Reverter o commit:**  
   `git revert 7afa349 --no-edit`

2. **Deploy da árvore revertida:**  
   `flyctl deploy --app goldeouro-backend-v2`

3. **Validar:**  
   - Curl OPTIONS com Origin de **preview** deve voltar a **não** retornar `Access-Control-Allow-Origin`.  
   - Curl OPTIONS com Origin **https://www.goldeouro.lol** deve continuar retornando `Access-Control-Allow-Origin: https://www.goldeouro.lol`.

---

## 9) Critérios de sucesso (checklist final)

| # | Critério | Como validar |
|---|----------|--------------|
| 1 | Fix no repositório | HEAD = 7afa349; diff em `server-fly.js` com regex e `origin` em função. |
| 2 | Deploy no Fly | `flyctl deploy --app goldeouro-backend-v2` concluído com sucesso (após `flyctl auth login`). |
| 3 | Preflight preview | Curl OPTIONS com Origin de preview retorna `Access-Control-Allow-Origin` com essa origem e status 204/200. |
| 4 | Preflight produção | Curl OPTIONS com Origin `https://www.goldeouro.lol` retorna `Access-Control-Allow-Origin: https://www.goldeouro.lol` e status 204/200. |
| 5 | Login no browser (preview) | Abrir preview; login sem erro de CORS; POST `/api/auth/login` executado. |
| 6 | Login produção / admin | Sem regressão em www.goldeouro.lol e admin.goldeouro.lol. |

---

## Resumo executivo

- O fix de CORS está commitado em **7afa349** em `server-fly.js` (função `origin` + regex `goldeouro-player(-[a-z0-9-]+)*\.vercel\.app`). O **deploy no Fly está bloqueado** por falta de token: `flyctl auth login` é necessário; em seguida `flyctl deploy --app goldeouro-backend-v2`. O **ORIGIN real de preview** pode ser obtido via Vercel CLI (`vercel ls` no projeto goldeouro-player) ou a partir de URLs documentadas no repositório (ex.: `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`). Os **curls de preflight** mostram: hoje o backend **não** envia `Access-Control-Allow-Origin` para a origem de preview e **envia** para `https://www.goldeouro.lol`. Após o deploy, o checklist (curls + login no preview + produção/admin) define GO; em caso de regressão ou origem indevida permitida, NO-GO e rollback com `git revert 7afa349 --no-edit` + `flyctl deploy --app goldeouro-backend-v2`.
