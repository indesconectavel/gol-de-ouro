# DIAGNÓSTICO TÉCNICO PROFUNDO — EDGE SPA VERCEL — GOL DE OURO PLAYER

**Data:** 2026-04-08  
**Escopo:** `goldeouro-player` (Vite + React Router), monorepo `gol-de-ouro`  
**Método:** inspeção estática + **experimentos controlados em preview** (sem produção, sem aliases, sem alteração de UI/JSX/CSS).

---

## 1. Resumo executivo

O fallback SPA (`routes` com `{ "handle": "filesystem" }` + catch-all para `/index.html`) **estava correto em intenção**, mas era **neutralizado pela opção `cleanUrls: true`** no `vercel.json`. Com `cleanUrls` ativo, pedidos a caminhos profundos que **não** correspondem a ficheiros estáticos reais (ex.: `/game`) passam a ser resolvidos pelo edge de forma incompatível com o catch-all, resultando em **`404`** com **`X-Vercel-Error: NOT_FOUND`** antes de servir `index.html`.

**Prova empírica:** remover **apenas** `"cleanUrls": true` (mantendo `trailingSlash: false` e o bloco `routes`) devolveu **`HTTP 200`** e **`Content-Type: text/html`** em `/game`, `/dashboard`, `/profile` e `/register` num deployment de preview.

**Correção mínima recomendada:** **não definir `cleanUrls: true`** neste projeto (omitir a chave ou fixar `false` se quiserem ser explícitos). Manter o restante (incluindo `routes` + `filesystem` e `trailingSlash: false`).

---

## 2. Fatos já consolidados

- Baseline visual: commit `a3fff5e`; patch de edge com `routes` + `filesystem` aplicado sobre o branch de cirurgia.
- Build local (`vite build`) **sucesso**; `dist/` contém `index.html`, assets, `download.html`, etc.
- Com **`cleanUrls: true`** + **`trailingSlash: false`** + fallback: preview respondia **`/` → 200** e **`/game` etc. → 404 NOT_FOUND** (comportamento já documentado na cirurgia anterior).
- O problema **não** era ausência total de regra de rewrite: era **interação** com `cleanUrls`.

---

## 3. Hipóteses investigadas

| ID | Hipótese | Resultado |
|----|-----------|-----------|
| H1 | `cleanUrls` interfere no fallback | **Confirmada** — ver matriz de experimentos. |
| H2 | `trailingSlash` interfere | **Refutada** como causa principal — com `cleanUrls` removido e `trailingSlash: false`, deep links **200**. |
| H3 | `routes` / `rewrites` não aplicados | **Refutada** — com mesmas `routes`, o comportamento muda apenas com `cleanUrls`. |
| H4 | Deploy CLI da raiz altera routing | **Improvável** como causa raiz — o mesmo tipo de `vercel.json` foi usado; a variável decisiva foi `cleanUrls`. |
| H5 | Preset Vite / `dist` ignora config | **Parcial** — o preset não “apaga” regras; **`cleanUrls`** altera a semântica de resolução de caminhos no edge. |
| H6 | Outro ficheiro neutraliza fallback | Nada encontrado que sobreponha `cleanUrls`; a causa foi **localizada em `vercel.json`**. |
| H7 | Git vs CLI | Não repetido nesta sessão; evidência anterior + experimentos atuais apontam para **config**, não para o canal de deploy. |

---

## 4. Inspeção estrutural do player

### `goldeouro-player/vercel.json`

- `version: 2`, `framework: "vite"`, `outputDirectory: "dist"`, `buildCommand: "npm run build"` — alinhado ao preset.
- `headers`: bloco amplo `source: "/(.*)"` + regras por som — **não** explicam sozinhos o NOT_FOUND (são headers, não substituem o handler estático principal).
- **`cleanUrls: true`** — presente na linha de base problemática; é o fator isolado abaixo.

### `vite.config.ts`

- `build.outDir: "dist"`, entrada única `index.html` — SPA clássica.
- PWA (`navigateFallback: '/index.html'`) — relevante para **Service Worker no browser**, **não** para a primeira resposta HTTP do edge Vercel (o 404 ocorre **antes** do SW).

### `package.json` / `index.html`

- Sem `base` alterado; `index.html` referencia `/src/main.jsx` em dev e bundling correto em prod.

### Incompatibilidade estrutural evidente

- **`cleanUrls: true`** + rotas só no cliente (`react-router`) + catch-all para `index.html` — combinação **problemática** neste hosting: o edge trata URLs “limpas” como se devessem mapear para ficheiros `.html` omitidos; rotas como `/game` **não** têm `game.html` em `dist`, e o fluxo **não** chega ao fallback como esperado quando `cleanUrls` está ativo.

---

## 5. Inspeção estrutural do `dist`

- Existe **`index.html`** na raiz do `dist`.
- Existe **`download.html`** (e pasta `download/`).
- **Não** existe ficheiro estático nomeado `game`, `dashboard`, etc., que satisfaça `/game` sob semântica `cleanUrls` — pelo que, com `cleanUrls: true`, o pedido pode ser tratado como “sem recurso” **antes** do catch-all eficaz.

---

## 6. Matriz de experimentos

Ambiente: `vercel deploy` a partir da **raiz** do monorepo, com `.vercelignore` na raiz (exclusão de pastas massivas), projeto `goldeouro-player`, **preview** apenas.

### Experimento 1 — Remover `cleanUrls` e `trailingSlash`

| Campo | Conteúdo |
|--------|-----------|
| **Hipótese** | Opções de URL estáticas impedem o fallback SPA. |
| **Delta** | Removidas as chaves `"cleanUrls": true` e `"trailingSlash": false`. |
| **Preview** | `https://goldeouro-player-3q55p9pt0-goldeouro-admins-projects.vercel.app` (`cSXfMNgtzoLw42dTGgd14Ui8SeSp`) |
| **Evidência HTTP** | `GET /` → **200** `text/html`; `GET /game`, `/dashboard` → **200** `text/html`; sem `X-Vercel-Error`. |
| **Conclusão** | Deep links **passam a funcionar**; confirma que uma das duas opções (ou ambas) era problemática. |

### Experimento 2 — Remover **apenas** `cleanUrls` (manter `trailingSlash: false`)

| Campo | Conteúdo |
|--------|-----------|
| **Hipótese** | `cleanUrls` é o fator principal. |
| **Delta** | Removido só `"cleanUrls": true`; mantido `"trailingSlash": false` e o bloco `routes` + `filesystem` inalterado. |
| **Preview** | `https://goldeouro-player-b1rq4p4vo-goldeouro-admins-projects.vercel.app` (`GD5HoFDueS8PH3eRyHuZBzbh5BfY`) |
| **Evidência HTTP** | `GET /game`, `/dashboard` → **200**. |
| **Conclusão** | **`trailingSlash: false` não é a causa**; **`cleanUrls: true` é o gatilho** do NOT_FOUND. |

### Experimento 3 — `cleanUrls: true` **sem** `trailingSlash`

| Campo | Conteúdo |
|--------|-----------|
| **Hipótese** | Talvez só `trailingSlash` interaja mal com `cleanUrls`. |
| **Delta** | `"cleanUrls": true` restaurado; chave `trailingSlash` omitida. |
| **Preview** | `https://goldeouro-player-kx8pkvtmp-goldeouro-admins-projects.vercel.app` (`…kx8pkvtmp…`) |
| **Evidência HTTP** | `GET /game` → **404**, `X-Vercel-Error: NOT_FOUND`. |
| **Conclusão** | Com **`cleanUrls: true`**, deep links **voltam a falhar** mesmo sem `trailingSlash`. **Confirma H1.** |

---

## 7. Causa técnica principal

**`cleanUrls: true` no `vercel.json`**, em conjunto com uma SPA servida por um único `index.html` e rotas exclusivamente no cliente. O edge tenta resolver caminhos “sem extensão” de forma incompatível com o catch-all para `/index.html`, produzindo **NOT_FOUND** em rotas profundas.

---

## 8. Causas secundárias

- **Confusão com PWA:** `navigateFallback` no Workbox **não** corrige o primeiro request HTTP ao edge — pode mascarar em SW já ativo, mas não explica o 404 inicial.
- **Preset / monorepo:** relevantes para **como** se faz deploy (tamanho do upload, raiz), não como causa raiz do NOT_FOUND **após** evidência dos experimentos.

---

## 9. Correção mínima recomendada

1. **Remover** `"cleanUrls": true` de `goldeouro-player/vercel.json` (ou definir explicitamente `"cleanUrls": false` se a equipa preferir ser explícita).
2. **Manter** o fallback atual com `routes` + `{ "handle": "filesystem" }` e catch-all para `/index.html` (equivalente ao `ae32329`).
3. **Manter** `trailingSlash: false` se for o comportamento desejado para URLs sem barra final.

**Nota sobre URLs `/download`:** existe `download.html` no `dist`; sem `cleanUrls`, o URL canónico pode passar a ser `/download.html` dependendo do edge — validar em preview se o produto exige `/download` limpo; se sim, tratar com **rewrite explícito** já presente (`/download` → `/download.html`) e testes HTTP.

---

## 10. Se a correção pode seguir para cirurgia

**Sim.** A alteração é **uma linha** (remoção de `cleanUrls`) em configuração de deploy, **sem** tocar em UI. Deve ser reaplicada no branch de baseline protegida, com **preview + gate HTTP** antes de qualquer consideração de produção.

---

## 11. Riscos remanescentes

- Alteração de comportamento de URLs `.html` (ex.: bookmarks antigos com ou sem `.html`) — mitigar com testes manuais curtos.
- **Não** promover sem revalidar `/`, `/game`, `/download`, auth e rotas críticas em preview.

---

## 12. Próximo passo do pipeline

1. Integrar a remoção de `cleanUrls` no branch **`fix/vercel-edge-baseline-protegida-2026-04-08`** (ou cherry-pick a partir do branch de diagnóstico).
2. Deploy **preview** obrigatório; checklist HTTP (200, `text/html`, ausência de `NOT_FOUND`).
3. Validação visual humana opcional mas recomendada (baseline inalterada no código).

---

## Veredicto final obrigatório

**CAUSA IDENTIFICADA — PRONTO PARA NOVA CIRURGIA**
