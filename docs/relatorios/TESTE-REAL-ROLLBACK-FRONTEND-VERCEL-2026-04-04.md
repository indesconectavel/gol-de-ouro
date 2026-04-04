# TESTE REAL DE ROLLBACK — FRONTEND

Data (UTC): 2026-04-04.

## 1. Estado inicial

**Antes de qualquer rollback (referência dos logs de Actions):**

| Campo | Valor |
|--------|--------|
| Deployment ativo (último deploy canónico antes do teste) | `dpl_HiEYDGVM35voEa8GQxVP5zkQnkMC` |
| URL (log run `23980761562`) | `https://goldeouro-player-20etetgb0-goldeouro-admins-projects.vercel.app` |
| Commit `main` (run de referência) | `51e17515bccbd01785330c12cc5393130fe9b660` |

**Headers iniciais (curl, ~14:54 UTC):**

- `https://www.goldeouro.lol/` → **200**, `Etag: "081fc87064e388839f5e81a78359c51f"`
- `https://goldeouro.lol/` → **307** → `Location: https://www.goldeouro.lol/` (comportamento esperado)

## 2. Deployment alvo

| Campo | Valor |
|--------|--------|
| ID | `dpl_FQQ77aRVhaKp6g8pYWCehxuQQNfQ` |
| URL | `https://goldeouro-player-o4ixihrp1-goldeouro-admins-projects.vercel.app` |
| Origem da evidência | Run de deploy `23980726132` (merge PR #44), commit `51e1751` (mesmo conteúdo de app que o estado estável imediatamente anterior ao último dispatch de deploy) |

**Notas de identificação:**

- Deployments mais antigos (ex.: logs de 2026-04-02 com `dpl_FTRgnHZ…`) falharam com **Deployment belongs to a different team** quando usados como alvo **sem** `--scope` na CLI.
- Tentativa com `vercel rollback` **sem** alvo e **sem** `--scope` (run `23981310492`) não alterou o `Etag` observado em `www` — comportamento consistente com verificação de estado, não rollback efetivo.
- Correção aplicada no workflow: **`--scope goldeouro-admins-projects`** (PR #46).

## 3. Execução

| Item | Valor |
|------|--------|
| Workflow | `frontend-rollback-manual.yml` |
| `confirm` | `ROLLBACK` |
| `deployment_target` | `dpl_FQQ77aRVhaKp6g8pYWCehxuQQNfQ` |
| Run ID (sucesso) | **23981435945** |
| URL do run | https://github.com/indesconectavel/gol-de-ouro/actions/runs/23981435945 |

**Evidência CLI (trecho do log):**  
`Success! goldeouro-player was rolled back to goldeouro-player-o4ixihrp1-goldeouro-admins-projects.vercel.app (dpl_FQQ77aRVhaKp6g8pYWCehxuQQNfQ)`

**Runs falhados / inconclusivos (rastreabilidade):**

| Run | Nota |
|-----|------|
| 23981293854 | URL legada `…lg6feurr7…` → *different team* |
| 23981337882 | URL `…o4ixihrp1…` sem `--scope` → *different team* |
| 23981353876 | `dpl_FQQ…` sem `--scope` → *different team* |
| 23981310492 | Sem alvo, sem `--scope` — sucesso de job mas sem mudança de `Etag` em `www` |

## 4. Resultado

**Rollback funcionou?** **SIM** (após `--scope` correto).

Indício objetivo: após o rollback, `https://www.goldeouro.lol/` passou a responder com  
`Etag: "30ef7773b84d3ca4091b81a9eefa267d"` (diferente do estado inicial `081fc870…`).

## 5. Smoke pós-rollback

- Step **🧪 Smoke pós-rollback** do run `23981435945`: **OK** (`curl -fsSL` em www e apex).
- Fora do Actions: www **200**; apex **307** para `HEAD` (redirect para www) — consistente com o pipeline canónico.

## 6. Restauração

| Item | Valor |
|------|--------|
| Ação | `workflow_dispatch` em **🎨 Frontend Deploy (Vercel)** |
| Run ID | **23981452088** |
| Novo deployment de produção | `dpl_G7hGaFuX65aZeFvkhX4tHkLvoMaB` → `https://goldeouro-player-4n5s4kcbq-goldeouro-admins-projects.vercel.app` |
| Commit no run | `3c29e9f7a188f6997452aa4b32b6eaf1286d3ab3` (inclui merge do PR #46 no workflow de rollback) |
| Gate deploy + smoke + health | **OK** |

**Deploy restaurado?** **SIM** — novo deployment de produção publicado; domínios canónicos continuam a responder (200 em www após seguir redirects no health interno do workflow).

*Nota:* o `Etag` de `index.html` pode coincidir com o período pós-rollback se o artefacto estático do player for idêntico entre builds; o critério operacional é o **novo `dpl_`** e o sucesso do pipeline de deploy.

## 7. Veredito

**ROLLBACK VALIDADO**

*(Condição: uso de `vercel rollback` com `--scope goldeouro-admins-projects` alinhado à equipa do projeto; alvos sem scope ou de equipa/URL incoerente falham ou não produzem efeito verificável.)*

---

## Fechamento oficial (governação)

Consolidação do estado enterprise do pipeline (histórico, causas, dependências críticas, veredito):  
`docs/relatorios/FECHAMENTO-OFICIAL-PIPELINE-FRONTEND-ENTERPRISE-2026-04-04.md`.
