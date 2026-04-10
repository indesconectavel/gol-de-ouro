# Auditoria de regressão visual pós-merge — 2026-04-09

## 1. Resumo executivo

O banner de versão **não voltou** porque o PR #55 tivesse alterado `VersionBanner.jsx` ou variáveis de ambiente no Vercel em si: o PR #55 **não tocou** no código do player. O que ocorreu foi um **novo deploy de produção a partir de `main`**. O `main` (antes e depois do merge, até `d72e21d`) contém o player **sem** o *gate* `VITE_SHOW_VERSION_BANNER` e **sem** o `define` correspondente no Vite. Já o commit **`2785aae`** (ramo `diag/vercel-edge-spa-deep-2026-04-08`) contém a **baseline certificada** com banner **oculto por padrão**. Assim, comparando **`2785aae` vs `d72e21d`**, a regressão visual do banner é **objetiva**: remoção (na linha do `main`) dos guardas que existiam na linha do diagnóstico/baseline.

**Conclusão:** regressão **identificada** — delta mínimo é **reaplicar o gate + define** (ou equivalente) na linha de `main`.

## 2. Qual deployment estava visualmente correto

| Referência | Significado |
|------------|-------------|
| **Commit `2785aae`** | `fix(vercel): remover cleanUrls que neutralizava fallback SPA no edge` — presente no histórico do ramo **`diag/vercel-edge-spa-deep-2026-04-08`** (`git branch -a --contains 2785aae` confirma). |
| Comportamento esperado do banner | `VersionBanner` e `VersionWarning` fazem `return null` salvo `import.meta.env.VITE_SHOW_VERSION_BANNER === 'true'`. |
| **Vite** | `vite.config.ts` injeta `import.meta.env.VITE_SHOW_VERSION_BANNER` com default `'false'` via `define`. |

Qualquer deployment construído a partir dessa **árvore** (código + env de build) tende a **não** exibir o banner em produção, alinhado ao que descreveu como “baseline visual boa”.

## 3. Qual deployment está ativo agora

| Referência | Significado |
|------------|-------------|
| **`d72e21d`** | Merge commit do PR #55 em `main`: `Merge pull request #55 from .../release/vercel-spa-fix-2026-04-08`. |
| **Conteúdo do player em `main`** | Igual ao **pai do merge no lado `main`**: `992ff8f` — o PR #55 só acrescentou docs, `vercel.json` (sem `cleanUrls`) e workflow de CI; **não** alterou ficheiros em `goldeouro-player/src`. |
| **Build Vercel** | Novo deploy de produção a partir de `main` recompila o player **sem** os guardas da baseline `2785aae`. |

Ou seja: o deployment “atual” associado a `main` @ `d72e21d` é o da **linha principal do repositório**, não a linha `diag/` onde `2785aae` introduziu a baseline de banner.

## 4. Diferenças de arquivos entre `2785aae` e `d72e21d` (player — destaques)

Merge-base comum: `0a2a5a1` (históricos divergem; a comparação direta mede **delta de conteúdo**, não “um commit após o outro” em linha reta).

### Banner / versão (causa do sintoma)

| Ficheiro | Em `2785aae` | Em `d72e21d` |
|----------|----------------|----------------|
| `goldeouro-player/src/components/VersionBanner.jsx` | Comentário “baseline certificada”; **`if (import.meta.env.VITE_SHOW_VERSION_BANNER !== 'true') return null;`** | **Sem** esse `if` — o componente **sempre** renderiza quando montado. |
| `goldeouro-player/src/components/VersionWarning.jsx` | Idem — **gate** com `VITE_SHOW_VERSION_BANNER` | **Sem** gate — lógica de aviso executa sempre. |
| `goldeouro-player/vite.config.ts` | `define`: **`VITE_SHOW_VERSION_BANNER`** com default `'false'` + comentário de baseline | **Sem** essa entrada em `define`. |

### App e jogo (outras diferenças visuais relevantes)

| Ficheiro | Resumo do delta (`2785aae` → `d72e21d`) |
|----------|----------------------------------------|
| `goldeouro-player/src/App.jsx` | `d72e21d`: remove `ToastContainer`; rota `/game` usa **`GameShoot`** em vez de **`GameFinal`**; remove import de `GameFinal`. |
| `goldeouro-player/src/pages/GameFinal.jsx` | Existe em `2785aae` (ficheiro grande); **removido** na árvore de `d72e21d`. |
| `goldeouro-player/src/pages/GameShoot.jsx` | Diferenças substanciais entre revisões. |
| `goldeouro-player/src/pages/game-scene.css` | Diff grande (centenas de linhas) — impacto direto em layout HUD/cena. |
| `goldeouro-player/src/pages/game-shoot.css` | Alterações relevantes. |
| Componentes de layout | Em `2785aae`: `TopBar.jsx`, `InternalPageLayout.jsx`; em `d72e21d`: removidos ou não usados da mesma forma — páginas (`Dashboard`, `Login`, etc.) diferem. |

Estatística agregada (para contexto): `git diff --stat 2785aae d72e21d -- goldeouro-player/` mostra **52 ficheiros** alterados (milhares de linhas), não apenas o banner.

### Ficheiros explicitamente pedidos na missão

- **`VersionBanner.jsx` / `VersionWarning.jsx`**: diferença **objetiva** — gate + comentários de baseline **só** em `2785aae`.
- **`App.jsx`**: diferenças acima (toast, rota do jogo).
- **`GameFinal.jsx`**: presente só na linha `2785aae` (no diff para `d72e21d` aparece como removido).
- **`GameShoot.jsx` / `game-scene.css`**: diferenças grandes — regressões visuais possíveis além do banner.

## 5. Causa exata do reaparecimento do banner

1. **`VersionBanner` e `VersionWarning` em `main` (`992ff8f` / `d72e21d`) não têm** o `if (import.meta.env.VITE_SHOW_VERSION_BANNER !== 'true') return null;`.
2. **`App.jsx` em `main` continua a montar `<VersionWarning />`** globalmente; várias páginas montam `<VersionBanner showTime={true} />`.
3. Com o **novo deploy** após o merge, o bundle servido é o build de **`main`**, que **sempre** pinta esses componentes (desde que o JSX os inclua).
4. Em **`2785aae`**, o mesmo JSX existia, mas os componentes **retornavam `null`** por defeito porque `VITE_SHOW_VERSION_BANNER` era forçado a `'false'` no Vite **e** o código exigia `'true'` para mostrar.

**Não** é necessário invocar “variável no painel Vercel mudou” como hipótese principal: a **diferença de código entre as duas revisões** já basta para explicar o banner visível em `main` e oculto na baseline `2785aae`.

## 6. Outras regressões visuais encontradas

Além do banner:

- **Rota `/game`:** `GameFinal` (linha `2785aae`) vs `GameShoot` (`main` / `d72e21d`) — mudança de ecrã e de CSS associado (`game-scene.css`, `game-shoot.css`).
- **Toasts:** remoção de `ToastContainer` em `App.jsx` em `d72e21d` — altera feedback visual.
- **Layout geral:** remoção/diferença de `TopBar`, `InternalPageLayout`, e alterações em várias páginas (`Dashboard`, `Pagamentos`, etc.) entre as duas árvores.

Estas diferenças **não** foram introduzidas pelo PR #55; são **divergência histórica** entre o ramo onde `2785aae` vive e `main`.

## 7. Delta mínimo necessário para restauração visual (banner)

Para alinhar o comportamento do banner ao de `2785aae` **sem** fundir toda a árvore:

1. **Reintroduzir** em `VersionBanner.jsx` e `VersionWarning.jsx`:
   - comentário de baseline (opcional, documentação);
   - `if (import.meta.env.VITE_SHOW_VERSION_BANNER !== 'true') return null;` (ou equivalente seguro para `undefined`).
2. **Reintroduzir** em `goldeouro-player/vite.config.ts` o `define`:
   - `'import.meta.env.VITE_SHOW_VERSION_BANNER': JSON.stringify(env.VITE_SHOW_VERSION_BANNER || 'false')`
3. Garantir que **produção** não define `VITE_SHOW_VERSION_BANNER=true` no build, salvo se quiserem o banner de propósito.

Isso restaura o **comportamento** “banner oculto por padrão”. Restaurar **todo** o aspeto da baseline (jogo, layout) exigiria **cherry-pick ou merge** mais amplo da linha `diag/` ou commits específicos — fora do “mínimo” só para o banner.

## 8. Próximo passo recomendado

1. **Cirurgia focada:** PR em `main` com apenas os três pontos da secção 7 + build em preview; validar que o banner desapareceu e deep links continuam OK.
2. **Opcional:** decidir se `/game` deve voltar a `GameFinal` ou manter `GameShoot` — isso é decisão de produto independente do PR #55.
3. **Documentar** no repositório que deploys de “baseline visual” devem referenciar **commit/branch** explícitos para não confundir `main` com ramos `diag/*`.

---

## Saída final obrigatória

**REGRESSÃO IDENTIFICADA — PRONTO PARA CIRURGIA**
