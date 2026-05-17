# H3.5p — Microajuste visual final da tela `/game`

**Data:** 2026-05-16  
**Branch:** `fix/h3-5p-final-micro-adjustment`  
**Baseline:** `4e90e9b` · `index-CZEHatgf.js` (H3.5n em produção)

---

## Objetivo

Subir **+5px** (delta Y **−5** no stage) zonas e bola após validação visual H3.5o, sem alterar eixo X, goleiro, JUMPS, CSS ou backend.

---

## Valores antigos vs novos

| Elemento | Antes (H3.5n) | Depois (H3.5p) | Δ Y |
|----------|---------------|----------------|-----|
| TL | (450, **495**) | (450, **490**) | −5 |
| TR | (1470, **495**) | (1470, **490**) | −5 |
| C | (960, **495**) | (960, **490**) | −5 |
| BL | (450, **715**) | (450, **710**) | −5 |
| BR | (1470, **715**) | (1470, **710**) | −5 |
| BALL.START | (960, **985**) | (960, **980**) | −5 |

---

## Confirmações

| Item | Estado |
|------|--------|
| **X intacto** | TL/TR/C/BL/BR/BALL `x` inalterados |
| **JUMPS intactos** | `GOALKEEPER.JUMPS` sem alteração |
| **Goleiro idle** | (960, 690) inalterado |
| **CSS** | `index-D7hr6dPE.css` inalterado no build |
| **Ficheiros tocados** | Apenas `layoutConfig.js` |

---

## Build

```text
cd goldeouro-player && npm run build
Exit: 0 (~10s)
```

| Artefacto | Hash |
|-----------|------|
| **JS** | `index-q8gJxEfC.js` |
| **CSS** | `index-D7hr6dPE.css` |

---

## Git / PR

| Item | Valor |
|------|--------|
| **Branch** | `fix/h3-5p-final-micro-adjustment` |
| **Commit** | *(preencher após push)* |
| **PR** | *(preencher após `gh pr create`)* |

---

## Decisão final

**PASS** — alteração mínima, build verde, escopo respeitado. Validação visual pós-merge recomendada.

**Sem merge. Sem deploy.**
