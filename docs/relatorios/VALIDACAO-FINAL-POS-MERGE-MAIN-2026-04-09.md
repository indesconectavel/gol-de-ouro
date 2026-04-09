# Validação final pós-merge — `main` e produção — 2026-04-09

## BLOCO 1 — Deployments (`goldeouro-player`)

### Deployment automático com commit `277cf16`

| Campo | Valor |
|-------|--------|
| Filtro usado | `vercel ls … -m githubCommitSha=277cf1629f41582bdda396b4b3f12668faa314e1` |
| Deployment encontrado | `https://goldeouro-player-fbqfiydum-goldeouro-admins-projects.vercel.app` |
| ID | `dpl_63YpTTryM8pnKvoQ7zL3pht3TtkC` |
| Ambiente | **Production** |
| Estado | **Ready** (build concluído com sucesso na janela verificada) |

### Current / aliases

- `vercel inspect https://www.goldeouro.lol` resolve para o deployment **`fbqfiydum`** (`dpl_63YpTTryM8pnKvoQ7zL3pht3TtkC`), **não** para o deployment promovido manualmente anterior (**`dpl_BpvEXukA14pnHsy43JdkL237kY7X`** / família **BpvEXukA1**).

**Interpretação:** após o merge do PR #56, o **GitHub Actions → `vercel --prod`** gerou um **novo** deployment de produção a partir de **`main` @ `277cf16`**. Os domínios canónicos passaram a apontar para **esse** deployment. Isto é o comportamento esperado: o *Current* **mudou** do promote manual (`2785aae`) para o artefacto construído a partir de **`main` alinhado** pelo merge #56 — não é regressão se o código em `main` reproduz a baseline (PR #56).

---

## BLOCO 2 — Produção (HTTP)

Base: **`https://www.goldeouro.lol`** (redirects seguidos com `curl -L`).

| Rota | HTTP | Content-Type | `X-Vercel-Error` |
|------|------|--------------|------------------|
| `/` | 200 | `text/html; charset=utf-8` | ausente |
| `/game` | 200 | idem | ausente |
| `/dashboard` | 200 | idem | ausente |
| `/profile` | 200 | idem | ausente |
| `/register` | 200 | idem | ausente |

Critérios pedidos: **cumpridos** na verificação automatizada.

---

## BLOCO 3 — Validação visual

| Aspeto | Método | Resultado |
|--------|--------|-----------|
| Shell SPA | HTML de `/` e `/game` | `#root` presente; sem página *Authentication Required* da Vercel |
| Bundle | Referência a `/assets/index-*.js` | Build Vite presente (ex.: `index-CLCDt8v9.js` no momento da verificação) |
| Banner ausente | — | **Não** verificável só com HTML estático (React); **recomendação:** confirmação rápida no browser |
| `/game` = `GameFinal` | — | **Não** aparece no HTML inicial; **recomendação:** abrir `/game` autenticado ou inspeccionar bundle em DevTools |
| Login / dashboard | — | Validação UX **manual** recomendada |

---

## BLOCO 4 — Decisão

Com base em: (1) deployment de produção **Ready** para **`277cf16`**; (2) **Current** nos domínios = esse deployment; (3) rotas principais **200** + **text/html** + sem **`X-Vercel-Error`**:

**PRODUÇÃO FINALMENTE ESTÁVEL E ALINHADA**

*(O *Current* deixou de ser o deployment **BpvEXukA1** porque o deploy automático de `main` substituiu o artefacto — comportamento normal. O risco de regressão só reaparece se `main` voltar a divergir da baseline.)*

---

## Saída final obrigatória

**PRODUÇÃO FINALMENTE ESTÁVEL E ALINHADA**
