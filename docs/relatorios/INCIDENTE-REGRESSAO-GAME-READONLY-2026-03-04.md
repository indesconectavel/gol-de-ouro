# Incidente — Regressão visual /game e barra de versão (READ-ONLY)

**Data:** 2026-03-04  
**Modo:** Auditoria somente leitura. Nenhuma ação executada (sem rollback, deploy, alteração de config/código/variáveis).  
**Contexto:** Regressão visual percebida no /game (layout e “barra de versão” reapareceram). Deploy estável conhecido: FyKKeg6zb (Vercel goldeouro-player). Após merge do PR #30 (hotfix backend), produção atual na Vercel é deploy do main (commit 7c8cf59).

---

## 1) EVIDÊNCIA NO VERCEL (somente leitura via CLI)

### 1.1 Vercel CLI

```
vercel --version
→ Vercel CLI 48.10.2
```

### 1.2 e 1.3 Listagens

- **Comando:** `vercel ls goldeouro-player` e `vercel ls goldeouro-player --prod`
- **Contexto:** goldeouro-admins-projects.

**Produção (primeira página):**

| Age  | Deployment (URL)                                                                 | Status  | Environment |
|------|-----------------------------------------------------------------------------------|--------|-------------|
| 36m  | https://goldeouro-player-**ez1oc96t1**-goldeouro-admins-projects.vercel.app       | Ready  | Production  |
| 27d  | https://goldeouro-player-p4epfrx3w-goldeouro-admins-projects.vercel.app           | Ready  | Production  |
| 47d  | … (outros)                                                                        | Ready  | Production  |

O deployment mais recente em **Production** (Current) é **ez1oc96t1** (36 minutos antes da coleta).

### 1.4 Detalhes do deployment atual em produção (Current)

**Comando:** `vercel inspect https://goldeouro-player-ez1oc96t1-goldeouro-admins-projects.vercel.app`

| Campo    | Valor |
|----------|--------|
| **DEPLOY_ID (short)** | ez1oc96t1 |
| **id (full)**        | dpl_4T2WpqnXxYcCbokKrwM6o69da51p |
| **name**             | goldeouro-player |
| **target**           | production |
| **status**           | ● Ready |
| **url**              | https://goldeouro-player-ez1oc96t1-goldeouro-admins-projects.vercel.app |
| **created**          | Wed Mar 04 2026 18:02:19 GMT-0300 (Horário Padrão de Brasília) [~37m antes da coleta] |
| **Aliases**          | https://app.goldeouro.lol, https://www.goldeouro.lol, https://goldeouro-player.vercel.app, https://goldeouro.lol, https://goldeouro-player-git-main-goldeouro-admins-projects.vercel.app |

**Branch/commit:** O alias `goldeouro-player-git-main-goldeouro-admins-projects.vercel.app` indica build a partir da branch **main**. O merge do PR #30 (commit **7c8cf59**) ocorreu em 2026-03-04 18:02:15 -0300; o deploy foi criado às 18:02:19, ou seja, **o deployment atual em produção é o build do main pós-merge do PR #30 (commit 7c8cf59)**.

**Mensagem do commit:** `Merge pull request #30 from indesconectavel/hotfix/ledger-userid-fallback`

### 1.5 Deployment FyKKeg6zb

**Comando:** `vercel inspect FyKKeg6zb`

```
Error: Can't find the deployment "FyKKeg6zb" under the context "goldeouro-admins-projects"
```

**Busca na lista:** `vercel ls goldeouro-player --prod` (e lista geral) — filtro por "fykk", "FyKK", "Redeploy": **nenhum resultado**.

**Conclusão:** O deployment **FyKKeg6zb não existe** no contexto atual (goldeouro-admins-projects). Não foi encontrado nem como deployment nem como “Redeploy of FyKKeg6zb” na primeira página de deployments. Possíveis razões: ID antigo/outro formato, retenção/exclusão de deployments antigos, ou projeto/equipe diferente.

**Registro:**

- **DEPLOY_ID atual prod:** ez1oc96t1 (id completo: dpl_4T2WpqnXxYcCbokKrwM6o69da51p).
- **Branch:** main. **Commit:** 7c8cf59. **Message:** Merge pull request #30 (hotfix ledger user_id fallback). **createdAt:** 2026-03-04 18:02:19 GMT-0300.
- **DEPLOY_ID FyKKeg6zb:** não encontrado; inspect falha com "Can't find the deployment".
- **“Redeploy of FyKKeg6zb”:** nenhum ID encontrado nas listagens consultadas.

---

## 2) EVIDÊNCIA PELO HTTP (somente leitura)

### 2.1 Headers

**https://www.goldeouro.lol/**

- HTTP/1.1 200 OK  
- Server: Vercel  
- X-Vercel-Cache: HIT  
- X-Vercel-Id: gru1::xp8hm-1772660336566-b23141c934a2  
- Age: 1003  
- Cache-Control: no-cache, no-store, must-revalidate  
- Etag: "f5f30cfc4cf2495b0c25d9a955c23805"  
- Last-Modified: Wed, 04 Mar 2026 21:22:13 GMT  
- Content-Type: text/html; charset=utf-8  

**https://www.goldeouro.lol/game**

- HTTP/1.1 **404 Not Found**  
- Server: Vercel  
- X-Vercel-Error: NOT_FOUND  
- X-Vercel-Id: gru1::ms7qt-1772660336578-6fe386bfe8bc  
- Cache-Control: no-cache, no-store, must-revalidate  
- Content-Type: text/plain; charset=utf-8  

Ou seja, **GET /game** retorna 404 na borda (não há rewrite para index.html nessa requisição direta; a SPA pode ser acessada via navegação a partir da raiz).

### 2.2 HTML e indicadores de build

**GET /** (primeiras linhas):

- `<script type="module" crossorigin src="/assets/index-**DVt6EjKW**.js">`
- `<link rel="stylesheet" crossorigin href="/assets/index-**BplTpheb**.css">`
- `<meta name="cache-bust" content="2025-01-12-19-30">`

**GET /game** (body): `The page could not be found`, `NOT_FOUND`, `gru1::q2cvr-1772660354762-8b35601a58ba`.

**Registro:**

- **Headers principais (raiz):** Server: Vercel; X-Vercel-Cache: HIT; X-Vercel-Id presente; Age; Etag; Last-Modified 21:22:13 GMT (consistente com deploy recente).
- **Indicadores de build:** Assets atuais **index-DVt6EjKW.js** e **index-BplTpheb.css**. Em documentação anterior (POST-ROLLBACK-VERCEL-FyKKeg6zb), o deploy estável era associado a **index-qIGutT6K.js** e **index-lDOJDUAS.css** — hashes diferentes, confirmando que **o build em produção agora é outro** (o do ez1oc96t1), não o do FyKKeg6zb.

---

## 3) HIPÓTESE E CAUSA RAIZ (com evidência)

### 3.1 Auto-promoção para Production ao mergear no main

**Evidência:** O workflow `.github/workflows/main-pipeline.yml` dispara em **push** para a branch **main**. Um dos passos é “Deploy Frontend (Vercel)” em `working-directory: ./goldeouro-player` com `npx vercel --prod --yes`. Ou seja, **todo push em main (incluindo o merge do PR #30) dispara deploy do frontend para produção na Vercel**.

**Conclusão:** Sim, houve **auto-promoção para production**: o merge do PR #30 (commit 7c8cf59) em main gerou push, o pipeline rodou e fez `vercel --prod` do goldeouro-player, resultando no deployment **ez1oc96t1** como Production atual.

### 3.2 Monorepo e mesmo merge disparando build do player

**Evidência:** O repositório contém o backend na raiz e o frontend em **goldeouro-player/**. O main-pipeline faz checkout do repositório inteiro e, em seguida, deploy do backend (Fly) e do frontend (Vercel) a partir de `./goldeouro-player`. O mesmo commit em main (7c8cf59) é, portanto, a base tanto do deploy do backend quanto do deploy do player.

**Conclusão:** Sim, é **monorepo** e o **mesmo merge em main dispara o build do player** (e seu deploy para produção na Vercel).

### 3.3 Alteração de feature flag / env que reativou a barra de versão

**Evidência no repositório (somente leitura):**

- **VersionWarning:** `goldeouro-player/src/components/VersionWarning.jsx` está **ativo**: chama `versionService.startPeriodicCheck()` e, em setInterval de 1s, `versionService.shouldShowWarning()`, `getWarningMessage()`, `getVersionInfo()`. O componente é renderizado em `App.jsx` (`<VersionWarning />`).
- **versionService:** `goldeouro-player/src/services/versionService.js` **não** implementa `shouldShowWarning`, `getWarningMessage` nem `getVersionInfo()`; implementa `checkCompatibility`, `startPeriodicCheck`, etc. Ou seja, o código do **main** monta a barra de versão e chama métodos inexistentes (comportamento/erros em runtime dependem do bundle).
- Documentação antiga (HOTFIX-BARRA-VERSAO-AUDITORIA, READONLY-auditoria-shouldShowWarning) descreve produção estável **FyKKeg6zb** como um build onde a barra não aparecia ou estava contida; hotfix planejado para não exibir em produção e permitir em preview.

**Conclusão:** Não foi encontrada **alteração de feature flag ou env** específica que “reativou” a barra. O que mudou foi **qual build está em produção**: antes um deploy antigo (possivelmente FyKKeg6zb, sem barra ou com comportamento diferente); depois do merge do PR #30, o **build do main atual (ez1oc96t1)**, que inclui **VersionWarning** ativo no código e, portanto, pode exibir a barra de versão (ou efeitos colaterais dos métodos inexistentes). A “reativação” é consequência da **troca de deployment** para o build do main, não de uma flag/env nova.

### Hipótese principal

- **Causa raiz:** O merge do PR #30 em **main** disparou o pipeline, que fez **deploy do goldeouro-player para produção** na Vercel (`vercel --prod`). O deployment **ez1oc96t1** (build do main) passou a ser o **Production** atual, substituindo o que estava antes (referenciado em docs como FyKKeg6zb). O código no main contém **VersionWarning** ativo e layout atual do player; por isso a “barra de versão” e o layout do /game passaram a ser os do **main** atual.

### Hipóteses alternativas (resumidas)

- **Cache / service worker:** X-Vercel-Cache: HIT e Age na raiz indicam cache na borda; não altera a conclusão de que o **build** servido é o do ez1oc96t1 (assets DVt6EjKW/BplTpheb).
- **Domínio apontando para outro projeto:** Os aliases do deploy ez1oc96t1 incluem www.goldeouro.lol e app.goldeouro.lol; o mesmo projeto/deployment está servindo esses domínios.
- **Rota /game:** GET /game retorna 404 na borda; a aplicação é SPA com `vercel.json` com rewrite `"/(.*)" -> "/index.html"`. O 404 em GET /game pode ser comportamento da edge para certas requisições diretas; o uso normal via navegação a partir de / pode carregar a SPA e exibir /game no cliente.

---

## 4) ESTADO DO “BACKUP” FyKKeg6zb (sem agir)

- **FyKKeg6zb existe como deployment?** **Não** — no contexto **goldeouro-admins-projects**, `vercel inspect FyKKeg6zb` retorna “Can't find the deployment”; não aparece na lista de prod nem na lista geral (primeira página).
- **É Production ou Preview?** N/A (não encontrado).
- **Existe “Redeploy of FyKKeg6zb”?** **Não** — nenhum deployment com esse nome ou padrão encontrado nas listagens.
- **Impedimento para promover?** Como o deployment **não existe** no contexto consultado, **não é possível promovê-lo**. Não há evidência de retenção ou permissão; o ID simplesmente não está disponível.

*(Nenhuma ação de promote/rollback foi executada.)*

---

## 5) CONCLUSÃO E PLANO (sem executar)

### O que está em produção agora

- **Deployment:** ez1oc96t1 (id completo dpl_4T2WpqnXxYcCbokKrwM6o69da51p).  
- **Branch:** main.  
- **Commit:** 7c8cf59 (Merge pull request #30 — hotfix ledger user_id fallback).  
- **Criado:** 2026-03-04 18:02:19 GMT-0300.  
- **Build:** Assets index-DVt6EjKW.js e index-BplTpheb.css.  
- **Domínios:** www.goldeouro.lol, app.goldeouro.lol, goldeouro.lol, etc.

### Se FyKKeg6zb está disponível

- **Não.** FyKKeg6zb não foi encontrado no projeto/contexto atual (goldeouro-admins-projects). Não está listado e não pode ser inspecionado nem promovido.

### Próxima ação recomendada (NÃO executar; apenas registrar)

- **Objetivo:** Reverter a regressão visual (barra de versão / layout no /game) com **menor risco** e com **pré-checks**.
- **Opção A (rollback de deployment na Vercel):** No **Vercel Dashboard** → projeto **goldeouro-player** → **Deployments** → Production. Verificar se existe algum deployment **anterior** a ez1oc96t1 (ex.: **p4epfrx3w**, 27 dias) que corresponda ao estado desejado (sem barra de versão / layout antigo). **Pré-check:** Confirmar em preview ou por inspeção que esse deployment não introduz regressões (segurança, funcionalidade). Se adequado, usar “Promote to Production” nesse deployment. **Não fazer** sem confirmar qual deployment antigo é o alvo e que é seguro.
- **Opção B (correção no código e novo deploy):** Em **branch** separada: ajustar ou remover a exibição da barra de versão (ex.: desabilitar VersionWarning em produção, ou implementar `shouldShowWarning`/getWarningMessage/getVersionInfo de forma que não exiba em prod); testar em **Preview**; depois merge em main para gerar novo build e novo deploy. **Pré-check:** Garantir que o pipeline não promova automaticamente para produção sem validação, ou validar em preview antes do merge.
- **Pré-checks gerais:** (1) Confirmar no Dashboard qual deployment está marcado como “Current” em Production. (2) Se optar por promover um deployment antigo, comparar hashes de assets (index-*.js / index-*.css) com o estado desejado. (3) Não alterar configs, env ou código em produção sem passar por branch e preview.

**Fim do relatório (READ-ONLY). Nenhuma ação de rollback, deploy ou alteração de config/código/variáveis foi executada.**
