# AUDITORIA FORENSE TOTAL — ORIGEM DA VERDADE DO PLAYER

**Projeto:** Gol de Ouro Player (monorepo `goldeouro-backend`)  
**Data:** 2026-04-09  
**Modo:** somente leitura no repositório (sem alteração de código, Vercel, envs ou deploy).  
**HEAD local analisado:** `c0223b35117ed6f942df3c9d2f0d436792faef8c` (branch `fix/restaurar-baseline-player-2026-04-09`).  
**`main` no momento da análise:** `d72e21d0fb39959ad4856c3e839d5c8c7bafd34b` (merge PR #55).

---

## 1. Resumo executivo

A produção “volta” para a versão errada do player porque **a fonte canónica do artefacto implantado não é o commit certificado `2785aae`**, e sim **`main`**. O commit **`2785aae` não está no histórico de `main`** (`git merge-base --is-ancestor 2785aae main` → falha; `git branch --contains 2785aae` → apenas `diag/vercel-edge-spa-deep-2026-04-08`). Assim, qualquer **push a `main` que dispare o workflow de frontend** reconstrói e publica o bundle da **linha principal**, onde `/game` aponta para **`GameShoot`**, **sem** gates de banner em `VersionBanner`/`VersionWarning` e **sem** o `define` de `VITE_SHOW_VERSION_BANNER` no Vite — ou seja, a árvore que o PR #55 **não alterou em `goldeouro-player/src`**, apenas acrescentou docs/CI/edge.

O merge #55 **corrigiu o edge (SPA)** e **disparou novo deploy de produção** a partir de `main`, o que **republicou o player “antigo”** (linha `992ff8f` no lado player) com **routing e UI errados** relativamente à baseline desejada. Isto não é um “deploy pontual errado”: é **dois fluxos de verdade** (branch de diagnóstico com baseline vs `main` operacional) **nunca integrados** para o código do player.

**Estado das evidências externas:** IDs de deployment, aliases ao minuto, e envs reais no painel Vercel **não são verificáveis só com o repo**; abaixo indicam-se lacunas e o que já é provável pelo código e pelo Git.

---

## 2. Linha do tempo dos deployments

| Item | Estado |
|------|--------|
| Deployments Vercel (id, preview vs production, promoted, rebuild, miniaturas) | **Não reconstruível localmente.** Exige `vercel ls`, API ou dashboard com acesso ao projeto (`secrets.VERCEL_PROJECT_ID` no GitHub, não o nome). |
| Eventos correlacionáveis no Git | **Sim:** merge `d72e21d` (2026-04-08) — PR #55; workflow `frontend-deploy.yml` faz deploy `--prod` em **push a `main`** com paths `goldeouro-player/**`. |

**Reconstrução lógica (não substitui log Vercel):**

1. Baseline “boa” desejada pelo equipa: código alinhado a **`2785aae`** (presente só no ramo `diag/...`), com `GameFinal`, gates de banner e `vite.config` com `define`.
2. **`main` em `d72e21d`:** player conforme **pai do merge no lado `main`** para ficheiros em `goldeouro-player/src` — equivalente a **`992ff8f`** para o código fonte do player; PR #55 não alterou esses ficheiros.
3. **Novo deploy de produção** após merge: inevitável se o push a `main` tocou `goldeouro-player/` ou o próprio workflow — o bundle servido passa a ser o **build de `main`**, não o de um preview “bom” preso noutro deployment.

Para uma linha do tempo **forense** com IDs, é obrigatório exportar do Vercel (por exemplo lista de deployments filtrada por domínio de produção e por commit SHA).

---

## 3. Qual commit representa a baseline boa

**Referência:** `2785aae1b674cc7c6d73d40a7dda5db8e7b3a29c` — *fix(vercel): remover cleanUrls que neutralizava fallback SPA no edge* (2026-04-08).

**Evidência (árvore do player nesse commit):**

- `App.jsx`: `/game` → **`GameFinal`**; `ToastContainer`; import de `GameFinal`.
- `VersionBanner.jsx` / `VersionWarning.jsx`: **`if (import.meta.env.VITE_SHOW_VERSION_BANNER !== 'true') return null`**.
- `vite.config.ts`: **`define`** com `import.meta.env.VITE_SHOW_VERSION_BANNER` default `'false'`.
- `vercel.json`: `routes` com `filesystem` + fallback para `/index.html` (sem `cleanUrls` no ficheiro analisado).

**Âmbito Git:** esse commit **só está integrado** no ramo **`diag/vercel-edge-spa-deep-2026-04-08`**, **não** em `main`.

---

## 4. Qual commit representa a versão regressiva

**Para o sintoma “produção = player errado” a comparar com a baseline acima:**

- **`main` @ `d72e21d`** (e, para ficheiros do player em `src`, o conteúdo efectivo coincide com a linha anterior a integrar apenas docs/CI — **base de player em `992ff8f`** para routing/banner).

**Evidência (`git show d72e21d:goldeouro-player/src/App.jsx`):**

- Rota `/game` → **`GameShoot`** (não `GameFinal`).
- Sem `ToastContainer` / sem import/uso de `GameFinal` na rota principal do jogo.

**Evidência (`git show d72e21d:goldeouro-player/src/components/VersionBanner.jsx`):**

- **Sem** gate inicial `VITE_SHOW_VERSION_BANNER` — o componente renderiza quando montado nas páginas que o incluem.

O ramo **`release/vercel-spa-fix-2026-04-08`** (origem do PR #55) reproduz o mesmo `App.jsx` com **`GameShoot`** em `/game` (confirmado com `git show release/...:goldeouro-player/src/App.jsx`).

---

## 5. Diferenças de código que explicam a regressão

### 5.1 O que o PR #55 mudou vs o que não mudou

- **Mudou:** merge de documentação, `vercel.json`, workflows (ex.: remoção de `cleanUrls`, gates CI).  
- **Não mudou:** ficheiros sob `goldeouro-player/src/**` entre o estado player de `main` antes e depois do merge, na medida em que o PR era focado em edge/pipeline — logo o **artefacto React** permanece o da **linha `main` antiga** (GameShoot, banner sem gate, etc.).

### 5.2 Commits / ramos pedidos (síntese)

| Ref | Papel na história |
|-----|-------------------|
| `2785aae` | Baseline **boa** (player + edge sem `cleanUrls`); **fora de `main`**. |
| `992ff8f` | Merge docs PR #54; **player em `App.jsx` já com `/game` → GameShoot** (igual ao observado em `d72e21d` para routing). |
| `d72e21d` | Merge PR #55; **produção GitHub aponta aqui**; player `src` como acima. |
| `diag/vercel-edge-spa-deep-2026-04-08` | Contém `2785aae`; é o ramo onde a baseline foi **commitada**. |
| `release/vercel-spa-fix-2026-04-08` | PR #55; **não** traz a árvore `src` da baseline `2785aae` para `/game` e banner. |
| `fix/restaurar-baseline-player-2026-04-09` | Restauração explícita `goldeouro-player/` a partir de `2785aae` sobre `main` (commits `cff8cdc` + doc); **ainda não é `main`**. |

### 5.3 “Reintroduções” pedidas na missão

| Sintoma | Onde aparece na linha `main` (`d72e21d`) vs `2785aae` |
|---------|------------------------------------------------------|
| Banner visível (sem opt-in) | `VersionBanner`/`VersionWarning` em `main` **sem** gate; em `2785aae` **com** gate + `define` no Vite. |
| `/game` “errado” | `main`: **`GameShoot`**; baseline: **`GameFinal`**. |
| Layouts / CSS | Diff grande entre revisões (`game-scene.css`, `game-shoot.css`, layouts de página); estatística local: dezenas de ficheiros no diff `main` vs branch de fix. |
| `GameFinal` “removido” | Em `main` o ficheiro pode existir no disco, mas **a rota `/game` não o usa**; a baseline **usa-o** como ecrã principal do jogo. |

**Conjunto mínimo — versão “correcta” (baseline certificada):** gate `VITE_SHOW_VERSION_BANNER` em banner/warning + `define` no `vite.config.ts` + `App.jsx` com `/game` → `GameFinal` + `ToastContainer` + CSS/layout alinhados (`GameFinal`, `game-scene.css`, `game-shoot.css`, `layoutConfig`, etc.).

**Conjunto mínimo — versão “regressiva” (linha `main` analisada):** `App.jsx` com `/game` → `GameShoot` + banner/warning **sem** gate + Vite **sem** `define` do banner.

---

## 6. Estado real do projeto Vercel

**O que o repositório prova:**

- Workflow usa **`VERCEL_ORG_ID`**, **`VERCEL_PROJECT_ID`**, **`VERCEL_TOKEN`** (GitHub Secrets) — ver `.github/workflows/frontend-deploy.yml`.
- Comentário no workflow: o ID real do projeto vem de `secrets.VERCEL_PROJECT_ID` (`prj_...`), não do nome “goldeouro-player”.
- **Root / build no CI:** `cd goldeouro-player`; `npm ci`; `npm run build`; deploy com `amondnet/vercel-action@v25` e `vercel-args: '--prod'` apenas para **`refs/heads/main`**.
- **`goldeouro-player/vercel.json`** (working tree / baseline): `outputDirectory` implícito via build Vite `dist`, `buildCommand` em JSON `npm run build`, `framework: vite`, rotas filesystem + fallback SPA.

**O que não pode ser afirmado sem painel/API:**

- Project ID exacto, “Production Branch” exclusiva, ignored build step, duplicidade **Git Integration nativa Vercel** vs **só GitHub Actions**, domínios e aliases ao minuto, “promote” manual recente.

**Risco estrutural:** se o repositório estiver **também** ligado ao Vercel com auto-deploy em `main`, poderão existir **dois caminhos** de produção (Action + integração). Isso **não foi verificado** aqui; recomenda-se confirmar no painel.

---

## 7. Estado real das env vars / flags

**Do código (build):**

- `vite.config.ts` (baseline / branch de fix): `import.meta.env.VITE_SHOW_VERSION_BANNER` via `loadEnv` + default `'false'` em `define`.
- Em `main` (`d72e21d`), o `vite.config.ts` **não** inclui esse `define` (comparar com `git show d72e21d:goldeouro-player/vite.config.ts` — ausência da entrada).

**Painel Vercel:**

- **Não auditável neste modo.** Se `VITE_SHOW_VERSION_BANNER=true` estiver em Production, **reforçaria** banner visível; na linha `main` **sem gate no componente**, o banner já seria visível **mesmo sem** essa env.

**Flags relacionadas a versão / build:** `VITE_BUILD_VERSION`, `VITE_BUILD_DATE`, `VITE_BUILD_TIME` (leitura de `.env.local` no `vite.config.ts`); não substituem o problema do gate do banner na linha `main`.

---

## 8. Fluxo real de deploy e promoção

**Mapeamento a partir de `.github/workflows/frontend-deploy.yml`:**

| Evento | Efeito |
|--------|--------|
| **Push** a `main` ou `dev` com alterações em `goldeouro-player/**` ou no próprio workflow | Corre job de testes +, se `main`, **deploy `--prod`** para Vercel. |
| **Pull request** para `main` | Testes/build; **não** há job `deploy-production` (condição `github.ref == refs/heads/main`). |
| **Rollback** | Apenas `workflow_dispatch` em `frontend-rollback-manual.yml` com confirmação `ROLLBACK`. |

**Resposta à pergunta “por que um deploy bom foi substituído por um mau?”**

- Se “bom” = preview ou alias manual para um deployment construído a partir de **outro commit/branch**, o próximo **deploy `--prod` a partir de `main`** (disparado pelo merge #55 ou por qualquer push subsequente) **associa produção ao artefacto de `main`**.  
- **Alias manual** não é “congelado” no tempo: o domínio de produção segue o **último deployment de produção** que o projecto considera actual, salvo configuração específica de pinning (não verificável aqui).

**Conflito conceptual:**

- **Verdade operacional do CI:** commit em **`main`**.  
- **Verdade desejada pelo equipa:** commit **`2785aae`** (ou branch de fix). Enquanto não forem a mesma referência, **regressão repetir-se-á**.

---

## 9. Causa raiz principal

**A baseline certificada do player (`2785aae`) nunca foi integrada em `main` como histórico ancestral** (`2785aae` ∉ ancestors(`main`)). O pipeline de produção **sempre** empacota o que está em **`main`**. O PR #55 **corrigiu infra-estrutura SPA** e **forçou um novo build de produção** sem alinhar **`goldeouro-player/src`** à baseline, pelo que **reinstalou** o player “errado” de forma **previsível**.

---

## 10. Causas secundárias

1. **Dois ramos de verdade:** `diag/...` com `2785aae` vs `main` operacional — risco de PRs que mexem só em edge/docs.  
2. **Gates de CI** validam HTTP 200 e deep links `/dashboard` e `/register`, **não** validam rota `/game` nem presença de `GameFinal` no bundle.  
3. **PWA / caches:** `vite-plugin-pwa` com `navigateFallback` e caches pode **prolongar** percepção de “versão antiga” no cliente; é agravante, não a causa raiz do routing errado no código fonte de `main`.  
4. **Possível** segunda origem de deploy (integração Git Vercel) — **não confirmada**.

---

## 11. Risco de repetição

**Alto**, enquanto:

- `main` ≠ árvore `goldeouro-player/` da baseline certificada;  
- qualquer merge/push a `main` disparar deploy de produção;  
- previews “bons” não estiverem **promovidos via o mesmo commit** que passa a ser **`main`**.

---

## 12. Estratégia definitiva de correção (sem implementação aqui)

1. **Fonte única de verdade:** o commit em **`main`** que alimenta produção **deve** conter a árvore completa do player certificada (equivalente a **`2785aae`** ou merge da branch `fix/restaurar-baseline-player-2026-04-09` após revisão).  
2. **Proteger `main`:** branch protection + exigência de que alterações em `goldeouro-player/` passem por checklist (GameFinal em `/game`, gates de banner, diff mínimo).  
3. **CI:** gate adicional que falhe se `App.jsx` não mapear `/game` → `GameFinal` (ou teste de fumo que parseie o bundle / rotas).  
4. **Vercel:** confirmar uma única origem de deploy de produção; documentar se há Git hook + GHA.  
5. **Envs:** manter `VITE_SHOW_VERSION_BANNER` ausente ou `false` em Production; alinhar com código com gate.

---

## 13. Próximo passo recomendado

1. **Revisar PR** que integre `fix/restaurar-baseline-player-2026-04-09` (ou equivalente) em `main` **antes** de novos merges só de infra.  
2. **Exportar do Vercel** a lista de deployments com SHA Git para fechar o **Bloco 1** com IDs reais.  
3. **Confirmar no painel** envs de Production e se existe deploy duplicado (Git + Actions).

---

## Saída final obrigatória

**CAUSA ESTRUTURAL IDENTIFICADA — PRONTO PARA CIRURGIA DEFINITIVA**

*(Evidência decisiva: `2785aae` ∉ `main`; `main` @ `d72e21d` serve `GameShoot` em `/game` e banner sem gate; pipeline liga produção a `main`.)*
