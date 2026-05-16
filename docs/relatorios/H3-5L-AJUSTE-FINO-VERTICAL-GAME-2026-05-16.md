# H3.5l — Ajuste fino vertical da tela `/game`

**Data:** 2026-05-16  
**Branch:** `fix/h3-5l-game-vertical-fine-tuning`  
**Baseline:** merge H3.5k · `b4b5aa0` (`index-BSHHrtG4.js`)  
**Relacionado:** [H3-5I](H3-5I-CORRECAO-GEOMETRICA-GAME-2026-05-16.md) · [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md)

---

## 1. Objetivo

Subir proporcionalmente as **zonas de chute** e a **bola** no eixo Y, preservando o alinhamento horizontal corrigido em H3.5i e sem alterar fundo, trave, goleiro idle, CSS ou backend.

---

## 2. Solução

**Delta aplicado:** **−25px em Y** (uniforme em todas as zonas e na bola).

| Campo | H3.5i / H3.5k | H3.5l |
|-------|---------------|-------|
| `TARGETS.TL` | (450, **520**) | (450, **495**) |
| `TARGETS.TR` | (1470, **520**) | (1470, **495**) |
| `TARGETS.C` | (960, **520**) | (960, **495**) |
| `TARGETS.BL` | (450, **740**) | (450, **715**) |
| `TARGETS.BR` | (1470, **740**) | (1470, **715**) |
| `BALL.START` | (960, **1010**) | (960, **985**) |

**Inalterado:**

- Todos os **X** (zonas e bola)
- `GOALKEEPER.IDLE` (960, 690)
- `GOALKEEPER.JUMPS`
- `HORIZONTAL_OFFSET` / `VERTICAL_OFFSET`
- CSS, `GameFinal.jsx`, backend, pipeline

**Espaçamento vertical relativo entre zonas:** mantido (TL/TR −220px vs BL/BR; mesma distância entre pares superior/inferior).

---

## 3. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/game/layoutConfig.js` | −25px Y em `TARGETS.*` e `BALL.START` |
| `docs/relatorios/H3-5L-AJUSTE-FINO-VERTICAL-GAME-2026-05-16.md` | Este relatório |

---

## 4. Build

```text
cd goldeouro-player && npm run build
Exit: 0 (~16s)
JS: index--8ygH50f.js
CSS: index-D7hr6dPE.css (inalterado)
```

---

## 5. Validação

| Critério | Método | Resultado |
|----------|--------|-----------|
| Eixo X preservado | Diff `layoutConfig` | **OK** — só Y alterado |
| Zonas mais altas | Análise coordenadas (−25px) | **Esperado OK** |
| Bola na mesma proporção | `BALL.START.y` −25px | **OK** |
| Goleiro / trave / HUD | Sem alteração de ficheiros | **OK** |
| Clique / animação bola | `GameFinal` usa `getTargetPosition` + mesma lógica | **Sem mudança de código** |
| Visual pixel pós-merge | — | **Pendente** review do PR |

**Nota:** validação visual completa deve ser feita no preview/deploy do PR (desktop 1920×1080 e mobile).

---

## 6. Decisão (pré-merge)

### **PASS COM RESSALVAS**

- Alteração mínima e reversível (um delta Y).
- Build verde.
- **Ressalva:** confirmar alinhamento visual em produção após merge; `JUMPS` não ajustados nesta etapa.

---

## 7. PR

*(preencher após `gh pr create`)*
