# H3.0B — CIRURGIA /GAME MOBILE — V1

**Data:** 2026-05-15  
**Baseline (tag):** `pre-h3-0b-game-mobile-2026-05-12` → commit `b475647`  
**HEAD pré-cirurgia (docs):** `079bfd6`  
**Modo:** cirurgia mínima — apenas player `/game` (layout/CSS + overlay portrait)

---

## 1. Resumo executivo

Aplicada correção **H3.0B** na responsividade mobile da rota `/game` (**`GameFinal.jsx`**), conforme diagnóstico H3.0A e pré-execução H3.0B (**Opção A** — bloquear portrait).

**Entregas:**

1. Neutralização do conflito `translate(-50%, -50%)` em bola e zonas no escopo GameFinal.
2. Overlay portrait no JSX (`.game-rotate`) com palco oculto em retrato.
3. Safe-area no viewport e botões inferiores (landscape mobile).
4. `viewport-fit=cover` no `index.html`.
5. HUD ligeiramente compacto em landscape mobile (≤767px).
6. **`npm run build`** no player — **sucesso** (~59s).

**Preservado:** palco 1920×1080, `calculateScale()`, `layoutConfig.js`, `gameService`, `handleShoot`, backend, financeiro.

**Classificação:** **PRONTO PARA VALIDAÇÃO LOCAL** — build OK; falta validação em browser/dispositivo antes de deploy produção.

---

## 2. Arquivos alterados

| Ficheiro | Linhas (diff aprox.) | Alteração |
|----------|----------------------|-----------|
| `goldeouro-player/src/pages/GameFinal.jsx` | +15 | Overlay `.game-rotate` no JSX |
| `goldeouro-player/src/pages/game-scene.css` | +54 | Portrait gate GameFinal, safe-area, HUD compact landscape |
| `goldeouro-player/src/pages/game-shoot.css` | +52 | P1: neutralizar translate em `.gs-ball` / `.gs-zone` |
| `goldeouro-player/index.html` | +1 | `viewport-fit=cover` |
| `docs/relatorios/H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md` | novo | Este relatório |

**Total código player:** 4 ficheiros, **+120 / -3** linhas (estatística Git).

**Não alterados (confirmado):** `layoutConfig.js`, `gameService.js`, `handleShoot`, `vercel.json`, backend, admin, banco.

---

## 3. Alterações aplicadas

### 3.1 P1 — Conflito de posição (`game-shoot.css`)

Bloco final escopado com `body[data-page="game"] .game-stage`:

- **`img.gs-ball`:** `transform: none !important`; não aplicar `left:50%` / `translate` legado; dimensões via inline.
- **`button.gs-zone`:** `transform: none` na base; hover/active com **`scale()`** apenas (sem `translate(-50%,-50%)`).
- **`img.gs-goalie`:** `left/top/width/height: auto` para priorizar inline + `rotate` do JSX.
- **`@media (max-width: 767px)`:** reforço `transform: none` na bola (anula `scale(0.8)` legado de `game-scene.css`).

### 3.2 Opção A — Portrait (`GameFinal.jsx` + `game-scene.css`)

**JSX:** bloco `.game-rotate` com `.rotate-card`, títulos “Gire o celular” / “Use o modo horizontal (paisagem) para jogar.”

**CSS:**

```css
@media (orientation: portrait) {
  body[data-page="game"] .game-viewport > .game-scale {
    display: none !important;
    pointer-events: none !important;
  }
}
```

Overlay `.game-rotate` visível em portrait (regras existentes ampliadas com safe-area no padding).

### 3.3 Safe-area (`game-scene.css` + `index.html`)

- **`index.html`:** `viewport-fit=cover` na meta viewport.
- **`.game-viewport`:** padding com `env(safe-area-inset-*)` nos quatro lados.
- **Landscape mobile:** `.hud-bottom-left` / `.hud-bottom-right` com `bottom: calc(20px + env(safe-area-inset-bottom)) !important` (sobrepõe inline 20px do layoutConfig).

### 3.4 HUD landscape mobile (`game-scene.css`)

Em `@media (max-width: 767px) and (orientation: landscape)`:

- Header mais baixo; logo ~120px; gap de stats reduzido.

### 3.5 Preservação do palco

- **Sem alteração** a `STAGE` 1920×1080, `calculateScale()`, `gameScaleStyle`, posições `layoutConfig` nos inline styles de bola/zonas/goleiro.

---

## 4. Itens preservados

| Item | Estado |
|------|--------|
| `layoutConfig.js` (TARGETS, BALL, GOALKEEPER) | Intocado |
| `gameService.processShot` / `handleShoot` | Intocado |
| Fases `GAME_PHASE`, timers, overlays em portal | Intocados |
| Backend / Fly / PIX / saques / saldo | Intocados |
| Rota `App.jsx` `/game` → `GameFinal` | Intocada |
| `goldeouro-player/vercel.json` | Intocado |

---

## 5. Build

```text
Comando: cd goldeouro-player && npm run build
Resultado: ✓ built in 59.11s
Exit code: 0
```

**Artefactos (amostra):**

- `dist/index.html` — 1.34 kB  
- `dist/assets/index-DMJTzLg7.css` — 110.99 kB  
- `dist/assets/index-qE-29bKd.js` — 398.60 kB  

**Avisos (não bloqueantes):** `baseline-browser-mapping` / `caniuse-lite` desatualizados.

**Nota:** `prebuild` executou `inject-build-info.cjs` (`.env.local` do player) — comportamento pré-existente do projeto; **fora** do diff intencional da cirurgia.

---

## 6. Riscos remanescentes

| ID | Risco | Severidade | Mitigação |
|----|-------|------------|-----------|
| R1 | Safe-area em botões dentro do palco **escalado** — `env()` em px do stage não é perfeito | Baixa | Teste iPhone landscape; ajuste fino se necessário |
| R2 | Tablet em portrait (ex. iPad) — overlay bloqueia jogo | Baixa | Aceite Opção A; media query pode ser refinada depois |
| R3 | Regressão visual desktop | Baixa | Teste L2 checklist |
| R4 | `/gameshoot` legado — regras `.gs-*` genéricas ainda no CSS | Baixa | Escopo `body[data-page="game"] .game-stage` limita impacto |
| R5 | Deploy não executado — produção inalterada | — | Deploy controlado após validação local |

---

## 7. Próximos testes obrigatórios

### Local (antes de deploy)

| # | Teste | Critério |
|---|-------|----------|
| T1 | `npm run dev` ou preview `dist` — desktop `/game` | 5 zonas alinhadas; 1 chute OK |
| T2 | DevTools iPhone — **landscape** | Jogo visível; Recarregar/mute clicáveis |
| T3 | DevTools iPhone — **portrait** | Overlay “Gire o celular”; **sem** palco interativo |
| T4 | Refresh `/game` autenticado | Sem tela branca |
| T5 | Console | Sem erro JS crítico |

### Dispositivo físico (recomendado)

- iPhone Safari: landscape chute + portrait overlay  
- Android Chrome: landscape  

### Produção (após deploy Vercel player)

- `www.goldeouro.lol/game` — landscape funcional  
- Portrait — overlay apenas  
- `POST /api/games/shoot` — sem regressão de contrato (smoke 1 chute)

### Rollback se necessário

```bash
git checkout pre-h3-0b-game-mobile-2026-05-12 -- \
  goldeouro-player/src/pages/GameFinal.jsx \
  goldeouro-player/src/pages/game-scene.css \
  goldeouro-player/src/pages/game-shoot.css \
  goldeouro-player/index.html
```

Ou `git revert` do commit da cirurgia após versionado.

---

## 8. Classificação final

# **PRONTO PARA VALIDAÇÃO LOCAL**

| Classificação | Aplica? |
|---------------|---------|
| **PRONTO PARA VALIDAÇÃO LOCAL** | **Sim** — build passou; testes manuais pendentes |
| PRONTO COM RESSALVAS | Após deploy sem teste em dispositivo |
| BLOQUEADO | Não |

---

## 9. Próximo passo recomendado

1. Validar localmente (secção 7).  
2. Commit cirurgia (sem `vercel.json` nem `??`).  
3. Deploy controlado Vercel player ou merge para `main` + pipeline.  
4. Relatório `H3-0B-EXECUCAO-CONTROLADA-...` opcional pós-deploy.

---

*Cirurgia H3.0B aplicada em código; produção player não deployada nesta sessão.*
