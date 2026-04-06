# Correção automática — runtime SPA Vercel (2026-04-06)

**Projeto:** Gol de Ouro  
**Modo:** cirúrgico, sem alteração a gameplay, backend, auth ou UI.

---

## 1. Problema provado

- `GET https://www.goldeouro.lol/` → **200** + HTML.
- `GET https://www.goldeouro.lol/dashboard` e `/register` → **404** + **`x-vercel-error: NOT_FOUND`**.
- URL directa do deployment Vercel (mesmo comportamento, já documentado antes desta tentativa).
- Hipótese operacional: o **routing efectivo** no edge **não** aplica fallback SPA para deep links, apesar de `goldeouro-player/vercel.json` versionado com `rewrites` catch-all.

---

## 2. Causa técnica escolhida

**Hipótese de correção:** substituir `rewrites` por **`routes`** com **`handle: filesystem`** antes do catch-all para `/index.html`, de modo a espelhar a ordem “ficheiros estáticos primeiro, depois SPA”, por vezes referida para SPAs estáticos quando `rewrites` sozinhos não produzem o comportamento esperado no edge.

---

## 3. Correção aplicada

**Ficheiro:** `goldeouro-player/vercel.json`

- Removido bloco `"rewrites"` (duas regras: `/download` e `/(.*)` → `/index.html`).
- Adicionado bloco `"routes"`:
  - `{ "handle": "filesystem" }`
  - `/download` → `/download.html`
  - `/(.*)` → `/index.html`

Restantes chaves (`buildCommand`, `outputDirectory`, `framework`, `cleanUrls`, `trailingSlash`, `headers`) **inalteradas**.

---

## 4. Diff dos ficheiros

Commit de alteração: `ae32329` (branch `fix/vercel-spa-routes-filesystem-2026-04-06`).

Resumo:

```diff
-  "rewrites": [
+  "routes": [
+    { "handle": "filesystem" },
     {
-      "source": "/download",
-      "destination": "/download.html"
+      "src": "/download",
+      "dest": "/download.html"
     },
     {
-      "source": "/(.*)",
-      "destination": "/index.html"
+      "src": "/(.*)",
+      "dest": "/index.html"
     }
   ]
```

---

## 5. Commit / tag / PR / merge

| Item | Valor |
|------|--------|
| Commit da alteração | `ae32329` |
| Merge em `main` | `c78ef9507f1f6a2d4105a15eb04020f20518ca49` |
| PR | [#53](https://github.com/indesconectavel/gol-de-ouro/pull/53) |
| Tag | `spa-routes-filesystem-2026-04-06` (aponta para o merge commit) |

Integração via PR (branch `main` protegida).

---

## 6. Run do workflow

| Campo | Valor |
|--------|--------|
| Workflow | `frontend-deploy.yml` (Frontend Deploy Vercel) |
| Run ID | `24043740682` |
| URL | [actions/runs/24043740682](https://github.com/indesconectavel/gol-de-ouro/actions/runs/24043740682) |
| SHA | `c78ef9507f1f6a2d4105a15eb04020f20518ca49` |
| Resultado global | **failure** (job Deploy Produção: passos de deploy Vercel **OK**; falha no **gate** `🛡️ Gate blindagem — deep links SPA`) |

---

## 7. Teste real de produção

Após o deploy (curl, 2026-04-06):

| URL | HTTP | `x-vercel-error` |
|-----|------|------------------|
| `https://www.goldeouro.lol/` | 200 | — |
| `https://www.goldeouro.lol/dashboard` | **404** | **NOT_FOUND** |
| `https://www.goldeouro.lol/register` | **404** | **NOT_FOUND** |

**Critérios de sucesso do pedido original** (200 + HTML sem `NOT_FOUND` em deep links) **não** cumpridos.

---

## 8. Conclusão final

**❌ NÃO RESOLVIDO**

A alteração de `vercel.json` no repositório (`rewrites` → `routes` + `filesystem`) **não** foi suficiente para alterar o runtime observado em produção: deep links continuam **404 NOT_FOUND**.

**Implicação:** a causa residual **não** foi eliminada apenas com esta configuração versionada; provavelmente envolve **configuração efectiva do projecto/deployment na Vercel** (overrides, Root Directory, ou como a CLI incorpora a config no deployment), **fora** do escopo deste único diff.

---

*Fim do relatório.*
