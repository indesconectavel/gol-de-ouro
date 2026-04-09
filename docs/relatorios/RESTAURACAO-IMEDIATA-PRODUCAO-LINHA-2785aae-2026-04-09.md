# Restauração imediata da produção — linha `2785aae` — 2026-04-09

## 1. Resumo executivo

A operação pedida (**rollback / promote** no Vercel para recolocar o deployment da linha **`2785aae`** como produção activa em **`goldeouro-player`**) **não foi executada neste ambiente**.

**Motivo:** não existe `VERCEL_TOKEN` (nem outro credencial de API Vercel) disponível no processo de execução. Sem token, a CLI e a API não podem alterar o **Current** nem os aliases de domínio.

**Código / `main` / backend / PR:** não foram alterados, conforme regras.

---

## 2. Identificação do deployment “bom” (referência fornecida)

| Referência | Significado |
|------------|-------------|
| Commit **`2785aae`** | Baseline certificada (diag / edge sem `cleanUrls`, player com `GameFinal`, gates de banner). |
| Deployment exemplo no painel | Família associada a essa linha; exemplo citado: **`BpvEXukA1`** (validar no dashboard que o **Git commit** do deployment é `2785aae` antes de promover). |

**Nota:** o ID exacto do deployment deve ser confirmado em **Vercel → goldeouro-player → Deployments** filtrando por commit ou branch `diag/vercel-edge-spa-deep-2026-04-08`.

---

## 3. Operação que deveria ser executada (equipa com acesso)

1. **Vercel Dashboard** → projecto **`goldeouro-player`** → **Deployments**.
2. Localizar o deployment com commit **`2785aae`** (ou o que o painel mostre como rebuild de produção dessa linha).
3. Usar **⋯** no deployment → **Promote to Production** (ou **Instant Rollback** se a Vercel oferecer rollback directo para esse deployment como “previous production”).

**CLI (equivalente), com token e scope correctos:**

```bash
# Exemplo — substituir DEPLOYMENT_URL_OR_ID pelo URL ou id do deployment 2785aae
npx vercel@50.38.3 promote <DEPLOYMENT_URL_OR_ID> --token "$VERCEL_TOKEN" --scope goldeouro-admins-projects
```

(Validar sintaxe actual da CLI na documentação; o workflow do repo usa `vercel@50.38.3` e scope `goldeouro-admins-projects` no rollback manual.)

---

## 4. Confirmação de domínios (apenas estado observado, sem alteração)

Pedido de confirmação de que `www`, `app` e apex apontam para a linha validada **após** o promote — **não aplicável** aqui porque **não** houve promote.

**Snapshot read-only (HTTP) no momento da auditoria:**

| URL | HTTP (redirect seguido) |
|-----|-------------------------|
| `https://www.goldeouro.lol/` | 200 |
| `https://goldeouro.lol/` | 200 |
| `https://app.goldeouro.lol/` | 200 |

Isto apenas indica que os domínios respondem; **não** prova que o bundle servido é o de `2785aae` (isso só após rollback/promote bem sucedido + verificação de cabeçalhos/`x-vercel-id` ou hash de asset).

---

## 5. Validação de rotas em produção (não reexecutada como gate)

Sem mudança de deployment, não há “nova” validação pós-restauração. Checklist para a equipa após o promote:

- `GET /`, `/game`, `/dashboard`, `/profile`, `/register` → **200**, `text/html`, sem `X-Vercel-Error: NOT_FOUND`.
- Visual: banner ausente (gate `VITE_SHOW_VERSION_BANNER`), `/game` → `GameFinal`.

---

## 6. Divergência `goldeouro-player` vs `goldeouro-backend` (contexto)

Relatório anterior: previews de PR no GitHub podem aparecer no projecto **`goldeouro-backend`**; o painel **`goldeouro-player`** é onde devem estar os domínios de produção canónicos se estiverem configurados aí. **Promover** deve ser feito no projecto que **serve** `www.goldeouro.lol` / `goldeouro.lol` / `app.goldeouro.lol` (confirmar em **Settings → Domains**).

---

## 7. Próximo passo mínimo

1. Exportar `VERCEL_TOKEN` com permissão na equipa **goldeouro-admins-projects**.
2. No dashboard, **Promote to Production** o deployment do commit **`2785aae`** no projecto correcto (`goldeouro-player`).
3. Repetir smoke HTTP + verificação visual.

---

## Saída final obrigatória

**RESTAURAÇÃO BLOQUEADA**

*(Ambiente sem credenciais Vercel; nenhuma alteração de produção efectuada.)*
