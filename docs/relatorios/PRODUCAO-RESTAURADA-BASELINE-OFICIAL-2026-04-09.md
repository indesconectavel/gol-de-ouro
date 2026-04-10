# Produção restaurada — baseline oficial — 2026-04-09

## BLOCO 1 — Produção

### Deployment actual (Current)

| Campo | Valor |
|-------|--------|
| Projecto Vercel | `goldeouro-player` (equipa `goldeouro-admins-projects`) |
| Deployment activo (promovido) | `https://goldeouro-player-d7pn92ruy-goldeouro-admins-projects.vercel.app` |
| ID | `dpl_BpvEXukA14pnHsy43JdkL237kY7X` |
| **Commit Git associado** | **`2785aae`** (`fix(vercel): remover cleanUrls que neutralizava fallback SPA no edge`, ramo `diag/vercel-edge-spa-deep-2026-04-08`) |

Operação registada em `docs/relatorios/RESTAURACAO-PRODUCAO-DEFINITIVA-2026-04-09.md` (**`vercel promote`**).

### Domínios

Produção canónica (aliases do deployment promovido): **`www.goldeouro.lol`**, **`goldeouro.lol`**, **`app.goldeouro.lol`**.

### Validação técnica (sessão de restauração)

- Rotas testadas com **HTTP 200** e **`text/html`** (redirects seguidos no apex): `/`, `/game`, `/dashboard`, `/profile`, `/register`.
- **Sem** `X-Vercel-Error` nos cabeçalhos verificados em amostragem **www**.
- HTML de `/game`: shell SPA (`#root`), sem página *Authentication Required* da Vercel.

### Validação visual manual

**Registo oficial:** na sessão documentada em **RESTAURACAO-PRODUCAO-DEFINITIVA** confirmou-se o **comportamento técnico** e o **HTML inicial** coerente com a app; **não** há registo separado neste repositório de *sign-off* UX nomeado (login, animações, HUD). **Recomendação:** um teste visual rápido pela equipa (banner invisível com env por defeito, `/game` = fluxo `GameFinal`) para arquivo interno, se ainda não foi feito após o promote.

### Baseline esperada (linha `2785aae`)

- **Banner:** `VersionBanner` / `VersionWarning` com gate `VITE_SHOW_VERSION_BANNER === 'true'` + `vite.config` com default `'false'` — ausente por defeito em build sem env a forçar.
- **`/game`:** rota para **`GameFinal`** (conforme árvore desse commit).

---

## BLOCO 2 — Risco remanescente

### O `main` ainda está desalinhado?

**Sim.** O `main` no Git permanece em **`d72e21d`** (merge PR #55). O commit **`2785aae` não é ancestral de `main`** (`git merge-base --is-ancestor 2785aae main` falha). Ou seja: **o código em `main` para o player ainda não incorpora** a baseline completa restaurada em produção via promote.

### O PR #56 continua a ser o caminho para alinhar `main`?

**Sim.** O PR #56 (`fix/restaurar-baseline-player-2026-04-09` → `main`) é o veículo preparado para integrar a árvore `goldeouro-player/` alinhada à baseline (com saneamento já documentado), de modo que **`main` passe a coincidir** com o que se pretende em produção sem depender de promote manual.

### Risco de nova regressão se houver deploy automático de `main` antes do merge do PR #56?

**Alto.** O workflow **Frontend Deploy** faz **`vercel-action --prod`** em **push a `main`** com alterações em `goldeouro-player/**`. Qualquer merge/push a `main` que inclua o player **na linha antiga** (GameShoot em `/game`, sem gates, etc.) **reconstrói produção** a partir desse commit e **pode substituir** o estado actual obtido pelo promote para `2785aae`.

**Mitigação:** merge do **PR #56** antes de novos merges que toquem no player; ou abster alterações em `goldeouro-player/` em `main` até lá.

---

## BLOCO 3 — Próximo passo

| Acção | Justificação |
|-------|----------------|
| **Mergear o PR #56** (após revisão e checks verdes) | Alinha `main` à baseline; reduz risco de o próximo deploy automático **reintroduzir** a regressão. |
| Não é necessária “nova auditoria” de plataforma **antes** do merge se CI + revisão do PR forem aceites; manter smoke HTTP pós-merge. |

**Não** recomendar “segurar produção” indefinidamente sem alinhar `main`: a estabilidade actual depende do **promote**; a **fonte de verdade Git** continua desalinhada até o merge.

---

## Saída final obrigatória

**PRODUÇÃO ESTÁVEL — PRONTO PARA ALINHAR MAIN**
