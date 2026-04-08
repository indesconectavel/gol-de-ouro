# VALIDAÇÃO FINAL — V1 — GOL DE OURO PLAYER

**Data da validação:** 2026-04-08  
**Âmbito:** produção pública + repositório remoto + infraestrutura Vercel  
**Modo:** leitura e testes não invasivos (sem alteração de código, sem redeploy, sem mudança de aliases).

---

## 1. Status da produção

| Indicador | Estado | Evidência |
|-----------|--------|-----------|
| Deep links no edge | Operacionais | `GET` em `/`, `/game`, `/dashboard`, `/profile`, `/register` em `https://www.goldeouro.lol` → **200** `text/html`; ausência de cabeçalho `X-Vercel-Error` (secção 2). |
| Deployment ativo (CLI) | `dpl_CgeiUWMTv9YgvCLrqiVBtZY6kRN1` | `vercel inspect` para `www`, `app` e apex (secção 6). |
| Artefacto | `goldeouro-player-kw6v6gxh5-goldeouro-admins-projects.vercel.app` | Idem. |
| Commit de referência do deploy | `2785aae` | Documentado na execução controlada; paridade com fonte em `diag/…` (secção 7). |

**Nota:** O alvo Vercel aparece como `preview` na CLI para esse ID; os **domínios de produção** foram associados por alias a esse deployment — o tráfego público segue o artefacto acima.

---

## 2. Validação HTTP

**Método:** `curl.exe -sI` e amostra de corpo em `https://www.goldeouro.lol` (2026-04-08).

| Rota | Status | Content-Type | `X-Vercel-Error` | Tipo de resposta |
|------|--------|--------------|------------------|------------------|
| `/` | 200 | `text/html; charset=utf-8` | ausente | Shell SPA (`index.html`) |
| `/game` | 200 | `text/html; charset=utf-8` | ausente | Shell SPA — corpo ~1323 bytes, `<!doctype html>`, `<html lang="pt-BR">` |
| `/dashboard` | 200 | `text/html; charset=utf-8` | ausente | Shell SPA |
| `/profile` | 200 | `text/html; charset=utf-8` | ausente | Shell SPA |
| `/register` | 200 | `text/html; charset=utf-8` | ausente | Shell SPA |

**Conclusão técnica:** o edge deixa de devolver `NOT_FOUND` nestas rotas; o HTML inicial é consistente com entrega da SPA.

---

## 3. Validação funcional

| Verificação | Resultado nesta sessão | Nota |
|-------------|------------------------|------|
| Login carrega | **Não testado** (sem browser automatizado nem credenciais) | Exige smoke manual autenticado. |
| Navegação cliente entre rotas | **Não testado** | Depende de execução JS no browser após carregar o bundle. |
| `/game` usa `GameFinal` | **Indireto** | `git show 2785aae:goldeouro-player/src/App.jsx` — rota `path="/game"` com `<GameFinal />`. |
| Fluxo login → dashboard → game | **Não testado** | Checklist manual recomendado. |

---

## 4. Validação visual

| Verificação | Resultado nesta sessão | Nota |
|-------------|------------------------|------|
| Barra/banner de versão | **Indireto** | Em `2785aae`, `VersionBanner.jsx` retorna `null` se `VITE_SHOW_VERSION_BANNER !== 'true'`. HTML inicial de `/game` não contém texto óbvio de banner. |
| Layout antigo / CSS / HUD | **Não observado** | Requer comparação visual humana ou capturas de ecrã. |

---

## 5. Validação de configuração

### `goldeouro-player/vercel.json` (estado alinhado ao deploy — ramo `diag/vercel-edge-spa-deep-2026-04-08` @ `97074dc` / commit de deploy `2785aae` para o player)

| Requisito | Cumprido |
|-----------|----------|
| **Não** existe `cleanUrls: true` | Sim — chave ausente (valor efetivo não é “true”). |
| Fallback SPA | Sim — bloco `routes` com catch-all `src: "/(.*)"` → `dest: "/index.html"`. |
| `{ "handle": "filesystem" }` | Sim — primeira entrada em `routes`. |
| `trailingSlash: false` | Sim. |

### `vite.config.ts`

- `build.outDir: "dist"`, `rollupOptions.input` → `index.html` — consistente com output Vite.
- PWA com `navigateFallback: '/index.html'` — relevante para SW no cliente, complementar ao edge.

### `package.json`

- `build`: `vite build`; `prebuild` com injeção de metadados — coerente com pipeline documentado.

---

## 6. Validação Vercel

| Hostname | Resolve para (inspect) | Deployment ID |
|----------|------------------------|---------------|
| `www.goldeouro.lol` | `goldeouro-player-kw6v6gxh5-…` | `dpl_CgeiUWMTv9YgvCLrqiVBtZY6kRN1` |
| `app.goldeouro.lol` | Idem | Idem |
| `goldeouro.lol` | Idem | Idem |

**Drift entre domínios:** não detetado nesta amostra — os três hostnames apontam ao **mesmo** deployment.

**Observação:** a CLI pode etiquetar o deployment como `target: preview`; a verdade operacional para tráfego é a **resolução por hostname**, aqui consistente.

---

## 7. Paridade repositório vs produção

| Referência | SHA (remoto, amostra 2026-04-08) | `cleanUrls` em `goldeouro-player/vercel.json` |
|------------|----------------------------------|-----------------------------------------------|
| **`origin/main`** | `992ff8f…` | **`true`** — **desalinhado** da produção atual |
| **`origin/fix/vercel-edge-baseline-protegida-2026-04-08`** | `036e7a4…` | **`true`** — **desalinhado** |
| **`origin/diag/vercel-edge-spa-deep-2026-04-08`** | `97074dc…` (HEAD; deploy em `2785aae`) | **ausente** — **alinhado** ao comportamento em produção |

**Drift:** existe **drift** entre **`main`** (e o branch `fix/…` antigo) e o **artefacto em produção**. A **fonte da verdade** para o que está no ar deve ser tratada como o **commit `2785aae`** (e documentação/tag `prod-vercel-edge-spa-fix-2026-04-08`) até **`main` absorver o merge**.

**Próximo passo de Git:** integrar o fix em `main` (e atualizar `fix/…` ou arquivar) para eliminar risco de futuros deploys a partir de `main` reintroduzirem `cleanUrls: true`.

---

## 8. Causa raiz documentada

### Problema original

- Rotas profundas da SPA (`/game`, `/dashboard`, etc.) respondiam **404** com **`X-Vercel-Error: NOT_FOUND`** no edge, enquanto `/` funcionava.

### Causa raiz real

- **`cleanUrls: true`** no `vercel.json`, em conjunto com uma SPA servida por um único `index.html` e rotas apenas no cliente. O edge não aplicava o fallback como esperado para caminhos sem ficheiro estático correspondente.

### Por que foi difícil identificar

- Sintomas assemelhavam-se a falha de **alias**, **deploy errado** ou **rewrites**; o `vercel.json` parecia ter fallback correto.
- A interação é **no edge** (sem stack trace na aplicação React).

### Solução final

- **Remover** `cleanUrls: true` (omitir ou `false`).
- Manter **`routes`** com **`{ "handle": "filesystem" }`** e catch-all para **`/index.html`**.

---

## 9. Correção aplicada

1. Remoção de `cleanUrls` no `vercel.json` do player.  
2. Manutenção de `routes` + filesystem + fallback SPA.  
3. Aliases `www`, `app` e apex associados ao deployment validado (`dpl_CgeiUWMT…`).  
4. Tag Git `prod-vercel-edge-spa-fix-2026-04-08` em `2785aae`.

---

## 10. Blindagem futura

| Regra | Detalhe |
|-------|---------|
| **Evitar `cleanUrls: true`** em SPAs Vite/React com routing cliente e um único `index.html`, salvo requisitos muito específicos e testados. |
| **Checklist pré-deploy** | `curl -I` em `/`, `/game`, `/register` (e rotas críticas) no **preview**; falha se `NOT_FOUND` ou não-HTML. |
| **Preview obrigatório** | Nenhuma promoção de alias sem preview com o mesmo commit que irá a produção. |
| **Paridade Git** | Deploy de produção só a partir de commit em `main` que contenha o `vercel.json` validado (após merge do fix). |
| **Monorepo** | Manter `.vercelignore` na raiz se necessário para limitar upload CLI (pastas de backup). |

---

## 11. Riscos remanescentes

- **`main` sem merge** — risco de reintrodução de `cleanUrls` ou de deploy a partir de config antiga.  
- **Validação funcional e visual** não substituída por HTTP — regressões só detetáveis em browser podem escapar.  
- **URLs `.html`** — sem `cleanUrls`, alguns links podem expor `*.html` onde antes havia URLs “limpas”; validar `/download` e documentação de marketing.

---

## 12. Próximos passos do projeto

1. **Merge** do fix (`2785aae` / ramo `diag/…`) para **`main`**.  
2. **Smoke test manual:** login, dashboard, `/game`, ausência de banner de versão, HUD.  
3. **Alinhar CI/CD** para usar sempre o `vercel.json` pós-fix em builds de produção.  
4. Arquivar ou atualizar o branch `fix/vercel-edge-baseline-protegida-2026-04-08` para não confundir operadores.

---

## Veredicto final obrigatório

**V1 PARCIALMENTE VALIDADA**

**Justificativa:** A **produção** está **validada ao nível HTTP, edge, aliases e configuração** correspondente ao commit **`2785aae`**, com **causa raiz** e **correção** documentadas. A **validação funcional completa** (login, fluxos) e a **validação visual** (HUD, layout pixel a pixel) **não foram executadas nesta sessão**; o ramo **`main`** permanece **desalinhado** do `vercel.json` em produção até merge.
