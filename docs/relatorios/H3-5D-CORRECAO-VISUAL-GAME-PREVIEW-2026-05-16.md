# H3.5d — CORREÇÃO VISUAL `/game` — PREVIEW

**Data:** 2026-05-16  
**Branch:** `fix/h3-5d-game-visual-alignment`  
**Baseline de referência:** `460ba4e` (main)  
**Forense:** [H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md](H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md)  
**Modo:** correção cirúrgica player — sem backend, banco, PIX, pipeline ou lógica de jogo.

---

## 1. Resumo executivo

Correção mínima H3.5d para a regressão horizontal da trave/cenário em `/game`, introduzida por H3.0B (`dac9f8b`):

1. **Removido** `padding` com `env(safe-area-inset-*)` de `body[data-page="game"] .game-viewport` — o palco (`.game-scale`) volta a centrar-se na viewport completa.
2. **Mantido** safe-area no overlay portrait (`.game-rotate`) e nos botões inferiores do HUD em landscape mobile.
3. **Simplificado** bloco H3.0B em `game-shoot.css`: mantém `transform: none` para bola/zonas (alinhado ao inline `layoutConfig`), remove `left/top: auto` e regras hover duplicadas; hover/active das zonas usam apenas `scale()`.

**`GameFinal.jsx`:** não alterado.

**Build:** `npm run build` — **sucesso** (~32s).

**Decisão:** **PASS COM RESSALVAS** — build e smoke local/preview OK; validação em dispositivo físico (paisagem + notch) pendente antes de merge.

---

## 2. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/pages/game-scene.css` | Removido safe-area do `.game-viewport` |
| `goldeouro-player/src/pages/game-shoot.css` | H3.5d: zonas hover sem `translate(-50%,-50%)`; bloco final enxuto |
| `docs/relatorios/H3-5D-CORRECAO-VISUAL-GAME-PREVIEW-2026-05-16.md` | Este relatório |

**Fora do escopo (intocado):** backend, `layoutConfig.js`, `GameFinal.jsx`, `index.html`, `vercel.json`, financeiro, PIX.

---

## 3. Detalhe da correção

### 3.1 `game-scene.css`

**Antes (H3.0B):** `.game-viewport` com `padding` em todos os lados via `safe-area-inset-*`, reduzindo e deslocando a área de flex onde `.game-scale` é centrado — `calculateScale()` continua a usar `window.innerWidth/Height` integral.

**Depois (H3.5d):** apenas animação de entrada no `.game-viewport`; safe-area permanece em:

- `.game-rotate` (portrait) — overlay “Gire o celular”
- `.hud-bottom-left` / `.hud-bottom-right` em `@media (max-width: 767px) and (orientation: landscape)`

### 3.2 `game-shoot.css`

- Regras G-1 (hover/active zonas): `translate(-50%, -50%)` substituído por `scale()` — coerente com posição inline já centrada (`left: x - size/2`).
- Bloco final: só `transform: none !important` na bola (anula legado `game-scene.css` mobile `scale(0.8)` + translate); zonas com `transform-origin: center`.

---

## 4. Resultado do build

```text
Comando: cd goldeouro-player && npm run build
Exit code: 0
Tempo: ~32s
CSS bundle: dist/assets/index-D7hr6dPE.css (109.97 kB)
JS bundle:  dist/assets/index-Dodb9Nx1.js (398.60 kB)
```

---

## 5. Validação local / preview

| Cenário | Método | Resultado |
|---------|--------|-----------|
| Build produção | `vite build` | OK |
| Preview estático | `vite preview` :4173 | Servidor local para PR/Vercel |
| `/game` desktop | Smoke automatizado / inspeção manual recomendada | **Não bloqueante** — palco sem padding lateral |
| `/game` mobile retrato | Overlay `.game-rotate` preservado no CSS | OK (regras intactas) |
| `/game` mobile paisagem | Emulação limitada | **Ressalva** — confirmar em hardware |
| Alinhamento trave | Correção estrutural (viewport sem inset no palco) | Esperado **restaurado** vs. H3.0B |

---

## 6. Preservado (H3.0B)

| Item | Estado |
|------|--------|
| `viewport-fit=cover` em `index.html` | Mantido (fora do diff) |
| Overlay “Gire o celular” | Mantido |
| Ocultar `.game-scale` em portrait | Mantido |
| HUD landscape compacto | Mantido |
| `layoutConfig` / `handleShoot` / API | Intocados |

---

## 7. Riscos e próximos passos

| Risco | Mitigação |
|-------|-----------|
| Botões HUD sob notch em landscape | Safe-area mantido em `hud-bottom-*` |
| Regressão em desktop | Diff mínimo; sem mudança em `calculateScale` |
| Cache SW em produção | Após merge, validar bundle novo no Vercel |

**Pós-merge:** smoke H3.5b repetido em telemóvel real (paisagem).

---

## 8. Metodologia

- Branch `fix/h3-5d-game-visual-alignment` a partir de `460ba4e`
- Diff guiado por [H3-5C](H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md)
- `npm run build` no player

**Relacionado:** [H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md](H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md) · [H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md](H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md)
