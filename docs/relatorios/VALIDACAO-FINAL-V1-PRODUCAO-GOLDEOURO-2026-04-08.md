# VALIDAÇÃO FINAL — V1 — GOL DE OURO PLAYER

**Data da validação (inicial):** 2026-04-08  
**Atualização (fechamento):** 2026-04-08  
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

**Nota:** O alvo Vercel pode aparecer como `preview` na CLI para esse ID; os **domínios de produção** foram associados por alias a esse deployment — o tráfego público segue o artefacto acima.

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

**Revalidação (fechamento):** `curl -I https://www.goldeouro.lol/game` → **200 OK**, `Content-Type: text/html; charset=utf-8`, sem `X-Vercel-Error`.

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

### `goldeouro-player/vercel.json` (estado alinhado ao deploy — commit `2785aae` / cherry `0551e6a` em `release/vercel-spa-fix-2026-04-08`)

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

---

## 7. Paridade repositório vs produção

| Referência | SHA / estado | `cleanUrls` em `goldeouro-player/vercel.json` |
|------------|--------------|-----------------------------------------------|
| **`origin/main`** (2026-04-08, pós-tentativa merge) | `992ff8f…` | **`true`** — **desalinhado** até PR ser fundido |
| **`origin/release/vercel-spa-fix-2026-04-08`** | `0551e6a…` (= cherry-pick de `2785aae` + doc diagnóstico) | **ausente** — **alinhado** à produção |
| **`origin/diag/vercel-edge-spa-deep-2026-04-08`** | `4f53413…` (inclui docs de validação) | **ausente** — alinhado |

**Ação executada (fechamento):**

1. Branch **`release/vercel-spa-fix-2026-04-08`** criada a partir de `main` atualizado.
2. **`git cherry-pick 2785aae`** concluído **sem conflitos**; `vercel.json` com **sem** `cleanUrls`, `routes` + `filesystem` intactos.
3. **`git push origin release/vercel-spa-fix-2026-04-08`** — **sucesso**.
4. Merge local `main` ← `release` (fast-forward para `0551e6a`).
5. **`git push origin main`** — **rejeitado** pelo GitHub: *“Protected branch update failed — Changes must be made through a pull request”* + checks obrigatórios.

**Estado:** o fix está **no remoto** em **`release/vercel-spa-fix-2026-04-08`**. **`origin/main` permanece em `992ff8f`** até abertura e fusão de **PR** (URL sugerida: `https://github.com/indesconectavel/gol-de-ouro/compare/main...release/vercel-spa-fix-2026-04-08`).

---

## 8. Causa raiz documentada

### Problema original

- Rotas profundas da SPA respondiam **404** com **`X-Vercel-Error: NOT_FOUND`** no edge.

### Causa raiz real

- **`cleanUrls: true`** no `vercel.json`, incompatível com o fallback SPA desejado.

### Solução final

- Remover `cleanUrls: true`; manter `routes` + `{ "handle": "filesystem" }` e catch-all para `/index.html`.

---

## 9. Correção aplicada

1. Remoção de `cleanUrls` no `vercel.json` do player.  
2. Aliases de produção associados ao deployment validado.  
3. Tag `prod-vercel-edge-spa-fix-2026-04-08` em `2785aae` (histórico Git).

---

## 10. Blindagem futura

| Regra | Detalhe |
|-------|---------|
| Evitar `cleanUrls: true` neste padrão SPA | Documentado. |
| PR obrigatório para `main` | Confirmado pelas regras do repositório. |
| Checklist `curl -I` em preview | Manter. |

---

## 11. Riscos remanescentes

- **`main` sem merge do PR** — drift continua até aprovação dos checks e merge.  
- Validação em browser (login, HUD) depende do operador.

---

## 12. Próximos passos do projeto

1. Abrir **PR** `release/vercel-spa-fix-2026-04-08` → `main` e concluir revisão/checks.  
2. Smoke manual (secções 13–14).  
3. Após merge, considerar `main` como fonte da verdade única.

---

## 13. Validação funcional manual

**Responsável:** operador humano (não automatizado nesta sessão).

| Passo | Critério de sucesso |
|-------|---------------------|
| Abrir `https://www.goldeouro.lol` | Página de login/entrada carrega sem erro visível |
| Autenticar | Redirecionamento e sessão OK |
| Abrir dashboard | Conteúdo esperado, sem tela branca |
| Navegar para `/game` (direto ou pela UI) | Carrega sem erro; sem tela branca; sem erro JS crítico na consola |

**Estado:** **pendente de execução pelo operador** (não registado como concluído no agente).

---

## 14. Validação visual manual

**Responsável:** operador humano.

| Critério | Verificação |
|----------|-------------|
| Sem barra/banner de versão indesejado | Inspeção visual |
| Sem layout antigo | Inspeção visual |
| HUD e CSS coerentes com baseline | Inspeção visual em `/game` |

**Estado:** **pendente de execução pelo operador**.

---

## 15. Paridade Git restaurada

| Item | Estado |
|------|--------|
| Fix disponível no remoto em branch dedicada | **Sim** — `release/vercel-spa-fix-2026-04-08` @ `0551e6a` |
| `origin/main` contém o mesmo `vercel.json` que produção | **Não** — bloqueado por branch protection; requer **PR** |
| Drift eliminado de forma definitiva | **Parcial** — eliminado no branch `release`; **pendente** merge em `main` |

---

## 16. Status final consolidado

| Dimensão | Estado |
|----------|--------|
| Produção HTTP / edge | **Estável** (revalidado) |
| Infra aliases | **Corretos** (sem alteração nesta etapa) |
| Repositório `main` | **Ainda não contém o fix** — PR obrigatório |
| Validação funcional/visual em browser | **Não concluída** no agente |
| Blindagem total V1 | **Incompleta** até PR + smoke manual |

---

## Veredicto (documento — 2026-04-08 fechamento)

**Condições para “100% validada e blindada” não satisfeitas:** merge em `main` **não** concluído (proteção de branch) e **checklists manuais** (secções 13–14) **não** executados pelo operador nesta sessão.

---

## Resposta final obrigatória (pipeline)

🔴 **V1 AINDA NÃO VALIDADA**
