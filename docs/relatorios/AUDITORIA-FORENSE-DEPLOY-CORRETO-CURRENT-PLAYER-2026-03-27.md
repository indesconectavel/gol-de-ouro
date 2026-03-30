# AUDITORIA FORENSE — DEPLOY CORRETO PARA CURRENT — GOLDEOURO PLAYER

**Data da auditoria:** 2026-03-28 (evidências recolhidas com data de sistema do ambiente de execução; referência de trabalho solicitada: 2026-03-27).  
**Modo:** estritamente **READ-ONLY** — sem alteração de código, sem `git commit`/`push`, sem promoção de deploy, sem alteração de variáveis Vercel ou de produção.  
**Projeto Vercel:** `goldeouro-admins-projects/goldeouro-player` (CLI).

---

## 1. Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| **Qual deploy está hoje em Current / Production?** | **`dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`**, URL canónica `https://goldeouro-player-m38czzm4q-goldeouro-admins-projects.vercel.app`, com aliases **`https://app.goldeouro.lol`**, **`https://www.goldeouro.lol`**, **`https://goldeouro.lol`**, **`https://goldeouro-player.vercel.app`**, etc. (confirmado com `vercel inspect https://app.goldeouro.lol`). |
| **Esse Current é tecnicamente o mais correto face ao estado atual do projeto?** | **Não.** O artefacto servido em Production difere de forma **objectiva e verificável** do artefacto do **último preview** da branch de trabalho certificada no repositório (`feature/bloco-e-gameplay-certified`), nomeadamente no **CSS do HUD do `/game`** (logo **150px** em Production vs **200px** no preview alinhado ao código local) e nos **hashes** dos ficheiros `index-*.js` / `index-*.css`. |
| **Qual deploy deveria ser o Current?** | O deploy de preview **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** (`https://goldeouro-player-94gvkibr7-goldeouro-admins-projects.vercel.app`), que é o destino actual do alias de branch **`https://goldeouro-player-git-feature-b-e4eeb8-goldeouro-admins-projects.vercel.app`** (truncagem Vercel de `feature/bloco-e-gameplay-certified`), criado em **2026-03-27 14:31:24 -03**, alinhado no tempo com o **HEAD** local auditado **`4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`** (*fix(player): dobra área visual do botão Recarregar no /game*). **Antes de promover em definitivo**, recomenda-se confirmar no painel Vercel o **commit SHA** ligado a esse deployment (o CLI `vercel inspect` utilizado não expôs o meta de Git). |
| **Nível de confiança** | **Alto** para a conclusão “Production **não** reflete o último estado certificado da branch local/preview”; **médio-alto** para “promover especificamente `dpl_5nY2…`” — depende de confirmação explícita do SHA no dashboard e de um smoke test humano pós-promoção (navegação autenticada, `/game`, PIX). |

---

## 2. Escopo e metodologia

- **READ-ONLY:** apenas leitura do repositório local, comandos de inspecção (`vercel ls`, `vercel inspect`), pedidos HTTP (`curl`) a URLs públicas e comparação de conteúdo estático (HTML/CSS/JS minificado).
- **Fontes de evidência:**
  - Código local: `goldeouro-player/src/App.jsx`, `goldeouro-player/src/config/api.js`, `goldeouro-player/src/pages/game-scene.css`, `goldeouro-player/vercel.json`, `docs/relatorios/BLOCO-F-VALIDACAO-OFICIAL-FINAL.md`.
  - Git local: branch `feature/bloco-e-gameplay-certified`, commits recentes do player.
  - Vercel CLI: project `goldeouro-player`, lista de deployments e `vercel inspect` em URLs de Production, preview e alias de branch.
  - HTTP: cabeçalhos e corpos de `index.html` e de ficheiros CSS agregados em Production vs preview.
- **Limitações explícitas:** não foi executada sessão de browser automatizada com login para validar `/dashboard`, `/profile` e fluxo completo de `/game` autenticado; não foi possível obter via CLI o **commit SHA** e a **mensagem de commit** por deployment (campos não apresentados na saída do `vercel inspect` testado). A rota `/game` em SPA devolve o mesmo `index.html` que `/`; a integridade da rota React foi inferida por **aderência do bundle/CSS** ao estado documentado no repositório, não por teste de UI ao vivo.

---

## 3. Current identificado

| Campo | Valor (evidência) |
|--------|-------------------|
| **Deployment id** | `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX` |
| **URL canónica do deployment** | `https://goldeouro-player-m38czzm4q-goldeouro-admins-projects.vercel.app` |
| **Aliases (Production)** | `https://app.goldeouro.lol`, `https://www.goldeouro.lol`, `https://goldeouro.lol`, `https://goldeouro-player.vercel.app`, `https://goldeouro-player-goldeouro-admins-projects.vercel.app`, `https://goldeouro-player-indesconectavel-goldeouro-admins-projects.vercel.app` |
| **Branch** | *Não reportada pelo `vercel inspect` nesta sessão.* |
| **Commit SHA / mensagem** | *Não obtidos via CLI;* ver secção 6 para fingerprints de artefactos. |
| **Data/hora (`vercel inspect`)** | **created:** `Fri Jan 16 2026 02:24:53 GMT-0300` (indicador `[71d ago]` à data da auditoria). **Nota:** o cabeçalho HTTP `Last-Modified` do `index.html` servido neste deployment aponta **`Tue, 24 Mar 2026 21:30:23 GMT`** — manter ambas as leituras no relatório; a interpretação fina da metadata Vercel vs cabeçalhos CDN pode exigir confirmação no dashboard. |
| **Status** | **Ready** |
| **Ambiente** | **production** (`target production`) |
| **Comportamento observado (HTTP)** | `GET /` → 200, `Content-Type: text/html`, artefactos principais: **`/assets/index-qIGutT6K.js`**, **`/assets/index-lDOJDUAS.css`**. CSP sem entradas explícitas de Posthog/GTM no HTML servido (contrasta com `vercel.json` actual do repositório e com o preview recente). |

---

## 4. Deploys candidatos relevantes

### 4.1 Candidato A — Production (Current)

- **id:** `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`
- **url:** `https://goldeouro-player-m38czzm4q-goldeouro-admins-projects.vercel.app` (e domínios customizados acima)
- **branch / commit:** não determinados por CLI
- **data:** metadata `created` 2026-01-16 (ver ressalva acima); `Last-Modified` HTML 2026-03-24
- **Diferenças relevantes:** bundles **`index-qIGutT6K.js`** + **`index-lDOJDUAS.css`**; CSS do HUD com logo **150px** (ver secção 5)

### 4.2 Candidato B — Último preview da branch `feature/bloco-e-gameplay-certified` (alias estável)

- **id:** `dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`
- **url:** `https://goldeouro-player-94gvkibr7-goldeouro-admins-projects.vercel.app`
- **alias de branch:** `https://goldeouro-player-git-feature-b-e4eeb8-goldeouro-admins-projects.vercel.app` → resolve para o mesmo deployment (`vercel inspect` no alias confirma **id** `dpl_5nY2…`)
- **branch (inferida pelo alias):** `feature/bloco-e-gameplay-certified` (prefixo truncado `feature-b-…` na URL Vercel)
- **commit:** alinhamento temporal com **`4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`** (2026-03-27 14:31:38 -03); **confirmar SHA no painel Vercel**
- **data:** `created` **2026-03-27 14:31:24 -03**
- **Diferenças relevantes:** bundles **`index-BkwLfIcL.js`** + **`index-yFQt_YUB.css`**; CSP com **Posthog** e **GTM** como em `goldeouro-player/vercel.json`; CSS do HUD com regra **`body[data-page=game] .hud-header .brand-small .brand-logo-small` a 200px**

### 4.3 Outros previews recentes (mesma janela temporal, artefactos distintos)

A lista `vercel ls` mostrou vários previews “10h” com URLs distintas; dois exemplos verificados **não** partilham o mesmo hash de JS/CSS que o candidato B (logo **não** são o mesmo build):

| Deployment URL (exemplo) | JS / CSS principais (extraído de `index.html`) |
|--------------------------|--------------------------------------------------|
| `goldeouro-player-hxifhi50y-…` | `index-EkBz_LVu.js`, `index-tigneRrC.css` |
| `goldeouro-player-dlpp35zwj-…` | `index-nJ4nfxpA.js`, `index-B0F6hOF0.css` |

**Conclusão parcial:** para decisão de Current, o critério não é “qualquer preview recente”, mas o deployment ligado ao **alias da branch** de certificação **ou** o commit SHA desejado.

---

## 5. Comparação funcional entre os candidatos

| Critério | Production (`dpl_FyKK…`) | Preview branch (`dpl_5nY2…` / alias `…feature-b-e4eeb8…`) | Repositório local (referência) |
|----------|---------------------------|------------------------------------------------------------|---------------------------------|
| **Rota `/game` em código** | SPA: mesmo `index.html` que `/` | Idem | `App.jsx`: `/game` → **`GameFinal`** + `ProtectedRoute` |
| **Home `/`** | Login (SPA) | Idem (esperado) | `Route path="/"` → `Login` |
| **Dashboard / Profile** | Não testado com sessão | Não testado com sessão | Rotas protegidas presentes em `App.jsx` |
| **Layout / HUD `/game`** | CSS servido: **logo 150px** em `.brand-small` / `.brand-logo-small` (sem regra 200px no escopo jogo observada no extracto) | CSS servido: **`body[data-page=game] … 200px`** para logo | `game-scene.css`: HUD jogo com **200px** para `.brand-logo-small` sob `body[data-page="game"]` |
| **Headers / CSP** | CSP mais restrita no HTML observado (sem hosts Posthog/GTM explícitos no valor recebido) | CSP alinhada ao `vercel.json` actual (Posthog + GTM) | `goldeouro-player/vercel.json` inclui Posthog e GTM |
| **Backend API (fallback em bundle)** | String `https://goldeouro-backend-v2.fly.dev` presente no JS | Idem (verificado em extracto do bundle) | `api.js`: `VITE_BACKEND_URL` ou default **`https://goldeouro-backend-v2.fly.dev`** |
| **Integridade de carregamento** | 200 OK, assets estáveis | 200 OK | — |
| **Responsividade / overlays** | Não medido em browser | Não medido em browser | `BLOCO-F-VALIDACAO-OFICIAL-FINAL.md` documenta estado estático aprovado com ressalva de QA visual humano |

---

## 6. Evidências de regressão ou aderência

### 6.1 Evidências de que o Current está correto

- **Domínios de produção** apontam de forma consistente para **um único** deployment de target `production` segundo `vercel inspect` (aliases listados na secção 3).
- **Compatibilidade de base URL com o backend Fly** v2: ambos os bundles (Production e preview candidato) contêm referência a **`https://goldeouro-backend-v2.fly.dev`**, coerente com `goldeouro-player/src/config/api.js` e com a documentação interna do backend (`server-fly.js`, CORS incluindo `goldeouro.lol` e previews `.vercel.app`).
- **Não foi encontrada** evidência HTTP de indisponibilidade (5xx) nos `HEAD`/`GET` testados para as URLs principais.

### 6.2 Evidências de que o Current está **incorreto** relativamente ao estado certificado do projeto

1. **Divergência de artefactos:** Production serve **`index-qIGutT6K.js`** e **`index-lDOJDUAS.css`**; o candidato alinhado à branch certificada serve **`index-BkwLfIcL.js`** e **`index-yFQt_YUB.css`** (extraído de `index.html` em cada URL).
2. **Regressão / defasagem de HUD:** no CSS agregado de Production, o bloco visível para `.brand-small` / `.brand-logo-small` fixa **150px**; no CSS do candidato B aparece explicitamente a regra para **`body[data-page=game]` com 200px**, correspondendo ao ficheiro fonte `game-scene.css` no repositório (evolução documentada nos relatórios do BLOCO F e commits de 2026-03-27).
3. **Defasagem temporal relativa ao HEAD local:** o repositório local na branch `feature/bloco-e-gameplay-certified` tem commits de **2026-03-27** posteriores às correcções de HUD; o alias de branch na Vercel aponta para deployment de **2026-03-27 14:31**, enquanto Production permanece em **`dpl_FyKK…`** com artefactos que **não** incluem essas marcas no CSS.
4. **Configuração de headers:** o preview candidato reflecte o `vercel.json` actual (CSP com Posthog/GTM); o HTML de Production observado **não** coincide com esse padrão — indício de build ou configuração **anterior** ou pipeline distinto.
5. **Relatório interno `BLOCO-F-VALIDACAO-OFICIAL-FINAL.md`:** afirma explicitamente que, na altura da redacção, **não foi possível** confirmar paridade entre deploy e HEAD sem verificação no dashboard — esta auditoria **confirma** desalinhamento objectivo via comparação de artefactos.

---

## 7. Melhor candidato real para virar Current

- **Deploy recomendado:** **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** (URL: `https://goldeouro-player-94gvkibr7-goldeouro-admins-projects.vercel.app`), hoje apontado pelo alias  
  **`https://goldeouro-player-git-feature-b-e4eeb8-goldeouro-admins-projects.vercel.app`**.

- **Porquê:**
  - Coincide no tempo com o **último commit** local da linha de trabalho certificada (**`4ff3d48…`**, 2026-03-27).
  - Contém, nos artefactos servidos, as **marcas CSS do HUD** esperadas para o `/game` actual (logo **200px** no escopo `body[data-page=game]`).
  - Alinha o **CSP** servido com o **`vercel.json`** presente no repositório.
  - Mantém a **mesma base de API** Fly v2 observada no bundle de Production (sem indício de divergência de backend entre os dois candidatos neste ponto).

- **Requisitos que cumpre:** aderência ao estado do código em `feature/bloco-e-gameplay-certified`; rota `/game` → `GameFinal` no código que gera esse build (assumindo build a partir dessa branch — **validar SHA no Vercel**).

- **Problemas que evita:** validação financeira e de jogo contra uma UI **defasada** (HUD 150px, bundles antigos, CSP desalinhada), com risco de conclusões de QA **não reproduzíveis** no código actual do repositório.

---

## 8. Risco operacional de escolher o deploy errado

- **Testar PIX ou fluxos financeiros** no frontend **Production** actual pode significar testar um **artefacto diferente** do que a equipa corrigiu e documentou em 2026-03-27 (HUD, possivelmente outros comportamentos embutidos no JS).
- **Validar fluxo financeiro** num deploy **desactualizado** produz **falsos negativos/positivos**: bugs já corrigidos no código podem reaparecer em Production, ou correcções em código podem **não estar** em Production.
- **Produção visual/funcional divergente** do repositório **aumenta o custo de auditoria** e a probabilidade de incidentes na comunicação com stakeholders (“o que está no Git não é o que o utilizador vê”).
- **Promover sem smoke test** (login, `/game`, depósito/saldo em ambiente controlado) mantém risco residual mesmo escolhendo o candidato certo — recomenda-se checklist curto **após** promoção.

---

## 9. Veredito final

**CURRENT INCORRETO — PROMOVER OUTRO DEPLOY**

Production (`dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`) **não** representa, com os artefactos hoje servidos, o estado mais fiável e actualizado da linha **`feature/bloco-e-gameplay-certified`** e das correcções de HUD/`/game` evidenciadas no repositório e no preview **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`**.

---

## 10. Ação objetiva recomendada

1. **No painel Vercel**, confirmar que o deployment **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** está associado ao commit **`4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`** (ou a um commit **posterior** aprovado pela equipa na mesma branch).
2. Se a confirmação for positiva, **promover esse deployment a Production** (ou executar o fluxo equivalente usado pelo projecto para atualizar Current), de modo que os aliases **`app.goldeouro.lol` / `www.goldeouro.lol` / `goldeouro.lol`** passem a servir os mesmos artefactos que o alias de branch **`goldeouro-player-git-feature-b-e4eeb8-…`** serve hoje.
3. **Após a promoção**, executar smoke manual: login, `/dashboard`, `/game` (HUD e botões), `/profile`, e apenas então **testes financeiros reais** planeados.

---

## Anexo A — Comandos e leituras que geraram evidência (reproducibilidade)

- `vercel ls` (directório `goldeouro-player`)
- `vercel inspect https://app.goldeouro.lol`
- `vercel inspect https://goldeouro-player-94gvkibr7-goldeouro-admins-projects.vercel.app`
- `vercel inspect https://goldeouro-player-git-feature-b-e4eeb8-goldeouro-admins-projects.vercel.app`
- `curl -sI` / `curl -s` para `index.html` e ficheiros CSS em Production vs preview
- `git log` na raiz do repositório para commits do player

---

*Fim do relatório.*
