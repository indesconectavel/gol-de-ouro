# CIRURGIA — EDGE SPA COM BASELINE PROTEGIDA — VALIDAÇÃO REAL

**Projeto:** Gol de Ouro Player  
**Data:** 2026-04-08  
**Branch de trabalho:** `fix/vercel-edge-baseline-protegida-2026-04-08`  
**Baseline visual:** `a3fff5e` (tag de snapshot anterior: `4370fd0`)

---

## 1. Resumo executivo

Foi aplicado **apenas** o delta de **`goldeouro-player/vercel.json`** alinhado ao commit **`ae32329`** (`routes` + `{ "handle": "filesystem" }`, mantendo `/download` e fallback para `/index.html`). O **`npm run build`** local concluiu sem erros. Foi realizado **deploy de preview** (não produção) na Vercel. Os testes HTTP no URL de preview mostram **`/` → 200 HTML**, mas **`/game`**, **`/dashboard`**, **`/profile`** e **`/register`** continuam com **404** e **`X-Vercel-Error: NOT_FOUND`**. **Nenhum ficheiro JSX/CSS foi alterado** nesta cirurgia.

---

## 2. Delta de edge (origem `ae32329`)

Substituição do bloco final de **`rewrites`** por **`routes`**:

```json
"routes": [
  { "handle": "filesystem" },
  { "src": "/download", "dest": "/download.html" },
  { "src": "/(.*)", "dest": "/index.html" }
]
```

O restante de `vercel.json` (headers, `cleanUrls`, `trailingSlash`, etc.) manteve-se como na baseline.

---

## 3. Patch aplicado no repositório

| Commit | Descrição |
|--------|-----------|
| `55aafeac1c404ad3e62a5a2bd1f584fb42c017cf` | `fix(vercel): routes com filesystem antes do fallback SPA (baseline protegida)` — altera só `goldeouro-player/vercel.json` |
| `59caebe` (posterior) | `chore(vercel): ignorar pastas massivas na raiz para deploy CLI do player` — adiciona **`.vercelignore`** na raiz do monorepo para permitir `vercel deploy` sem ultrapassar limite de upload (pastas de backup massivas) |

---

## 4. Validação local (build)

- **Comando:** `npm run build` em `goldeouro-player`
- **Resultado:** sucesso; `dist/` gerado (ex.: `index.html`, assets, PWA `sw.js`)
- **Erros de build:** nenhum

---

## 5. Deploy de preview (obrigatório)

| Campo | Valor |
|--------|--------|
| **Ambiente** | **Preview** (`target: preview`) — **não** produção |
| **URL** | `https://goldeouro-player-dm1o0i3o2-goldeouro-admins-projects.vercel.app` |
| **Deployment ID** | `dpl_EbQeUhCTGmeRjmiyP8jDkVP6kcPi` |
| **Painel** | `https://vercel.com/goldeouro-admins-projects/goldeouro-player/EbQeUhCTGmeRjmiyP8jDkVP6kcPi` |
| **Branch Git** | `fix/vercel-edge-baseline-protegida-2026-04-08` |
| **Commit deployado (CLI)** | estado local incluindo `55aafea` + `.vercelignore` para upload (HEAD após push: `59caebe`) |

**Nota:** O primeiro `vercel deploy` a partir da raiz falhou por **tamanho total do repositório** (~15 GB com pastas de backup). A criação de **`.vercelignore`** na raiz reduziu o upload para ~**29 MB** e permitiu o preview.

---

## 6. Teste HTTP real (preview)

Comando: `curl.exe -sI` sobre a URL de preview (2026-04-08).

| Rota | HTTP | `Content-Type` | `X-Vercel-Error` |
|------|------|----------------|------------------|
| `/` | **200** | `text/html; charset=utf-8` | *(ausente)* |
| `/game` | **404** | `text/plain; charset=utf-8` | **NOT_FOUND** |
| `/dashboard` | **404** | `text/plain; charset=utf-8` | **NOT_FOUND** |
| `/profile` | **404** | `text/plain; charset=utf-8` | **NOT_FOUND** |
| `/register` | **404** | `text/plain; charset=utf-8` | **NOT_FOUND** |

Corpo de `/game` (amostra): texto `The page could not be found` + `NOT_FOUND` (erro do edge, **não** shell SPA).

**Critérios pedidos (200, sem `NOT_FOUND`, `text/html`, shell SPA) para deep links:** **não** cumpridos.

---

## 7. Validação visual (código)

- **Alterações nesta etapa:** apenas `goldeouro-player/vercel.json` e `.vercelignore` na raiz.
- **`/game` → `GameFinal`:** inalterado no código (continua a aplicar-se o `App.jsx` da baseline no branch).
- **Barra de versão / layout / CSS / HUD:** nenhum ficheiro em `src/` foi modificado; **não há regressão visual introduzida por diff de UI**.
- **Confirmação em browser** no URL de preview: **recomendada** para validação humana; não substitui o facto de o edge ainda devolver 404 nas rotas profundas.

---

## 8. Decisão (objetiva)

| Pergunta | Resposta |
|----------|----------|
| O patch de `vercel.json` (equivalente a `ae32329`) **resolveu** o problema de deep links no preview? | **Não** — evidência HTTP acima. |
| Houve **regressão visual** causada por esta cirurgia? | **Não** no código de UI (não houve alteração JSX/CSS). |
| O resultado é **seguro para produção**? | **Não** promover: deep links **ainda falham** no edge no preview; produção **não** foi alterada. |

---

## 9. Observações para a próxima etapa

1. O comportamento **replica** observações anteriores em outros deployments com `routes` + `filesystem`: o 404 pode ter causa adicional (ex.: interação `cleanUrls` / output estático / ordem de rotas na plataforma). É necessária **investigação técnica** além deste único delta.
2. O ficheiro **`.vercelignore`** na raiz é **útil** para futuros `vercel deploy` a partir do monorepo, mas **não** altera o runtime em si.

---

## Veredicto final obrigatório

**EDGE NÃO RESOLVIDO**
