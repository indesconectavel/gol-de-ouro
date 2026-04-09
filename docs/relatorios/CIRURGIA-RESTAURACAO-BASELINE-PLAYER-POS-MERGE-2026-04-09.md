# Cirurgia — restauração baseline player pós-merge — 2026-04-09

## 1. Resumo executivo

Foi aplicada a **restauração completa da árvore `goldeouro-player/`** a partir do commit **`2785aae`** (baseline certificada na linha `diag/vercel-edge-spa-deep-2026-04-08`), sobre o **`main` atual** (`d72e21d`). A operação usa `git checkout 2785aae -- goldeouro-player/`, garantindo paridade de código com a baseline **sem** reintroduzir `cleanUrls`: o `vercel.json` restaurado é **funcionalmente igual** ao de `main` (rotas com `filesystem` + fallback `/index.html`, sem `cleanUrls`). O objetivo é devolver **`GameFinal` em `/game`**, layout e CSS certificados, e **banner oculto por padrão** (`VITE_SHOW_VERSION_BANNER`).

**Build local (Windows):** `npm ci` falhou com **`EPERM`** ao remover ficheiros em `node_modules` (bloqueio do SO / antivírus / ficheiros em uso). **`npm run build`** não chegou a concluir neste ambiente. **Docker** não estava disponível. A validação de compilação fica **pendente** para CI ou máquina com `node_modules` limpo.

**Preview HTTP (Vercel):** não foi gerado deploy nesta sessão; não há URLs para medir `X-Vercel-Error`. Recomenda-se preview no Vercel após merge.

## 2. Quais arquivos precisaram ser restaurados

Conjunto aplicado: **todo** `goldeouro-player/` conforme **`2785aae`** (52 caminhos divergentes face ao `main` anterior), incluindo de forma destacada:

| Área | Ficheiros (exemplos) |
|------|----------------------|
| Rotas / shell | `src/App.jsx` (`/game` → `GameFinal`, `ToastContainer`) |
| Jogo | `src/pages/GameFinal.jsx`, `GameFinal_BACKUP_*.jsx`, `GameShoot.jsx`, `game-scene.css`, `game-shoot.css`, backups CSS |
| Layout | `InternalPageLayout.jsx`, `TopBar.jsx`, `Navigation.jsx`, páginas (`Dashboard`, `Login`, `Profile`, …) |
| Versão | `VersionBanner.jsx`, `VersionWarning.jsx`, `vite.config.ts` (`define` `VITE_SHOW_VERSION_BANNER`) |
| Game layout | `src/game/layoutConfig.js` (+ backup) |
| Assets | imagens `ganhou_*`, `gol_*`, `goool.png`, etc. |
| Build / deps | `package.json`, `package-lock.json`, `index.html` |
| Edge (preservado) | `vercel.json` (sem `cleanUrls`; diff face ao `main` anterior: apenas newline EOF) |

## 3. Quais arquivos foram preservados do `main`

- **Repositório fora de `goldeouro-player/`:** inalterado (sem backend, sem workflows extra neste commit).
- **`vercel.json`:** conteúdo de rotas/CSP **equivalente** ao que estava em `main` pós-PR55; **não** há `cleanUrls`.

## 4. Como o fix do edge foi mantido

- O ficheiro `goldeouro-player/vercel.json` na baseline **`2785aae`** já continha:
  - `"routes": [ { "handle": "filesystem" }, …, { "src": "/(.*)", "dest": "/index.html" } ]`
  - **ausência** de `cleanUrls`
- Logo, alinhar o player a **`2785aae`** **não** reverte o fix de deep links; mantém o mesmo modelo de edge validado.

## 5. Resultado do build

| Tentativa | Resultado |
|-----------|-----------|
| `npm ci` (Windows) | **Falhou** — `EPERM` em `unlink` dentro de `node_modules` |
| `npm run build` | **Falhou** — `vite` inexistente / `node_modules` inconsistente |
| `npx vite build` | **Falhou** — pacotes em falta após `npm ci` parcial |
| Docker `node:20` | **Indisponível** (daemon Docker inacessível) |

**Conclusão:** build **não confirmado** neste ambiente; espera-se sucesso em runner Linux (GitHub Actions) após merge, assumindo `package-lock.json` coerente.

## 6. Resultado HTTP no preview

**Não executado** (sem `dist/` local e sem deploy Vercel nesta sessão). Checklist pedido (`/`, `/game`, `/dashboard`, `/profile`, `/register` — 200, `text/html`, sem `X-Vercel-Error`) deve ser corrido **no preview de produção** após o pipeline.

## 7. Resultado visual/funcional

Com base na **árvore de ficheiros** restaurada (revisão estática):

- **`/game`:** `App.jsx` volta a renderizar **`GameFinal`** dentro de `ProtectedRoute`.
- **Banner:** `VersionBanner` / `VersionWarning` com gate `VITE_SHOW_VERSION_BANNER === 'true'` e `define` no Vite com default `'false'` → **oculto por padrão** em builds sem a env a `true`.
- **Layout:** componentes `TopBar`, `InternalPageLayout` e páginas alinhados à baseline.

Confirmação visual no browser **não** foi feita nesta sessão.

## 8. Pode seguir para produção?

**Recomendação:** só após **(1)** build verde no CI, **(2)** deploy em **preview**, **(3)** smoke HTTP nas rotas listadas e **(4)** confirmação visual rápida. O código da baseline está aplicado; o **gate de produção** é validação de build + preview.

---

## Saída final obrigatória (estado desta sessão)

**BASELINE DO PLAYER RESTAURADA** (código e `vercel.json` alinhados a **`2785aae`** com edge sem `cleanUrls).

**Ressalva:** **RESTAURAÇÃO INCOMPLETA** no que toca a **BLOCO 3 (build)** e **BLOCO 4–5 (preview HTTP / visual)** neste ambiente — dependem de CI ou execução local em máquina sem bloqueio `EPERM`.
