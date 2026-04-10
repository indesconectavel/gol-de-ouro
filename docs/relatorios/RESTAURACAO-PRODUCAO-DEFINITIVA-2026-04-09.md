# Restauração definitiva da produção — linha `2785aae` — 2026-04-09

## 1. Resumo executivo

Foi executado **`vercel promote`** no projecto **`goldeouro-player`** (equipa `goldeouro-admins-projects`) para o deployment com **meta `githubCommitSha=2785aae1b674cc7c6d73d40a7dda5db8e7b3a29c`** e ambiente **Production**:

| Campo | Valor |
|-------|--------|
| URL do deployment | `https://goldeouro-player-d7pn92ruy-goldeouro-admins-projects.vercel.app` |
| ID Vercel | `dpl_BpvEXukA14pnHsy43JdkL237kY7X` (confere com a família **BpvEXukA1** referida no contexto) |
| Commit | `2785aae` |

**Deploy que estava “na frente” (regressivo):** `dpl_4XKhLq1Cr29xNjmsCvAEiCKas98s` (`goldeouro-player-dgsbp2erk-…`), mais recente; após o promote, a produção activa passou a ser a linha **2785aae**.

**Código / `main` / backend:** não alterados.

---

## 2. Comando executado

```bash
vercel promote https://goldeouro-player-d7pn92ruy-goldeouro-admins-projects.vercel.app \
  --scope goldeouro-admins-projects -y
```

**Resultado CLI:** `Success! goldeouro-player was promoted to goldeouro-player-d7pn92ruy-goldeouro-admins-projects.vercel.app (dpl_BpvEXukA14pnHsy43JdkL237kY7X)`

Autenticação: sessão **Vercel CLI** local (`vercel whoami` → `indesconectavel`).

---

## 3. Identificação do deployment (commit `2785aae`)

```bash
vercel ls goldeouro-player --scope goldeouro-admins-projects \
  -m githubCommitSha=2785aae1b674cc7c6d73d40a7dda5db8e7b3a29c
```

Devolveu, entre outros, o deployment de produção promovido acima.

---

## 4. Domínios

Após o promote, `vercel inspect` no deployment promovido lista aliases incluindo:

- `https://www.goldeouro.lol`
- `https://goldeouro.lol`
- `https://app.goldeouro.lol`

---

## 5. Validação HTTP (automática)

Pedidos com `curl -L` (redirects seguidos). Critério: **200**, **`text/html`** no estado final, **sem** `X-Vercel-Error`.

| Origem | Rotas | HTTP | Notas |
|--------|-------|------|--------|
| `www.goldeouro.lol` | `/`, `/game`, `/dashboard`, `/profile`, `/register` | 200 | `text/html; charset=utf-8`; sem `x-vercel-error` nos cabeçalhos filtrados |
| `app.goldeouro.lol` | idem | 200 | idem |
| `goldeouro.lol` (apex) | idem | 200 | Resposta final após redirect 307 → HTML (comportamento típico apex→www) |

---

## 6. Validação visual (indirecta no HTML)

- **`/game` (www):** HTML inicial com `<div id="root">`, sem texto *Authentication Required*; presença de scripts Vite/PWA coerente com build do player.
- **Banner:** o banner React não aparece no HTML estático; confirmação visual no browser continua recomendada.

---

## 7. Próximo passo

- Smoke manual rápido no browser (login, `/game`, ausência de banner se `VITE_SHOW_VERSION_BANNER` não estiver a `true` no build).
- Quando o **PR #56** for mergeado a `main`, a produção futura alinhar-se-á ao código sem depender de promote manual.

---

## Saída final obrigatória

**PRODUÇÃO RESTAURADA**
