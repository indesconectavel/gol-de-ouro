# H3.5i — Correção geométrica da tela `/game`

**Data:** 2026-05-16  
**Branch:** `fix/h3-5i-game-geometry-alignment`  
**Baseline pré-correção:** `1a2f8d3` (`/meta` produção)  
**Forense:** [H3-5H-FORENSE-GEOMETRICA-GAME-2026-05-16.md](H3-5H-FORENSE-GEOMETRICA-GAME-2026-05-16.md)

---

## 1. Objetivo

Restaurar coerência visual entre fundo/trave (`scene-bg`), goleiro idle, bola e zonas de chute após H3.0B expor o desvio estrutural **layout 1020 vs arte/stage 960**, sem rollback, sem alterar backend/pipeline/PIX/SQL.

---

## 2. Investigação (pré-edição)

| Pergunta | Resposta |
|----------|----------|
| Onde zonas recebem `left`/`top`? | `GameFinal.jsx`: `left: adjustedX - targetSize/2` (canto superior-esquerdo de caixa centrada logicamente em `adjustedX`) |
| CSS usa centro ou canto? | Com H3.5d: **canto** + `transform: none` → centro visual = `adjustedX` |
| `layoutConfig` era centro? | Sim — comentários indicam “centro exato”; valores X estavam calibrados com grupo em **≈1020** |
| Legado pré-H3.0B | `translate(-50%,-50%)` **+** inline `−size/2` → centro visual **−50px** (C ≈ **970**) |
| Estado `1a2f8d3` | Só inline `−size/2` → C em **1020** (+50px vs legado, +60px vs stage **960**) |

**Opções avaliadas:**

| Opção | Descrição | Decisão |
|-------|-----------|---------|
| A | Restaurar `translate(-50%,-50%)` nas zonas mantendo inline `−size/2` | **Rejeitada** — dupla compensação; C ≈ 970, não 960; risco em hover/active |
| B | `left: adjustedX` + CSS translate (sem `−size/2`) | **Rejeitada** — exige `GameFinal.jsx`; escopo maior |
| C | Recalibrar `TARGETS` / `BALL.START` **−60px em X** | **Escolhida** — uma fonte de verdade; mantém padrão H3.5d |
| D | `object-position` em `scene-bg` | **Rejeitada** — move arte, não hitboxes |

---

## 3. Solução implementada

**Opção C** — `goldeouro-player/src/game/layoutConfig.js`:

| Campo | Antes | Depois |
|-------|-------|--------|
| `TARGETS.TL.x` | 510 | **450** |
| `TARGETS.TR.x` | 1530 | **1470** |
| `TARGETS.C.x` | 1020 | **960** |
| `TARGETS.BL.x` | 510 | **450** |
| `TARGETS.BR.x` | 1530 | **1470** |
| `BALL.START.x` | 1000 | **960** |

**Inalterado:** `GOALKEEPER.IDLE` (960), `JUMPS`, `game-shoot.css` H3.5d (`transform: none`), `scene-bg`, `calculateScale()`, HUD, overlay retrato.

**Simetria pós-offsets** (offsets ±30 mantidos):

- TL/BL: 450 + 30 = **480**
- TR/BR: 1470 − 30 = **1440**
- Média lateral: **960** = eixo stage / goleiro idle / zona C

**Justificativa:** H3.5d corrigiu o *container* (safe-area); o drift residual é **coordenadas de interacção** desalinhadas da arte. Ajustar `layoutConfig` reconcilia hitboxes ao palco sem reintroduzir `translate` duplicado nem deslocar o JPEG.

---

## 4. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/game/layoutConfig.js` | Recalibração −60px X em `TARGETS` e `BALL.START` |
| `docs/relatorios/H3-5I-CORRECAO-GEOMETRICA-GAME-2026-05-16.md` | Este relatório |

**Não alterados:** `game-shoot.css`, `game-scene.css`, `GameFinal.jsx`, backend, workflows, SQL.

---

## 5. Build

```text
cd goldeouro-player && npm run build
Exit: 0
Bundle: dist/assets/index-Dk25r7n1.js (layoutConfig no JS)
CSS: index-D7hr6dPE.css (inalterado)
```

---

## 6. Validação

| Cenário | Método | Resultado |
|---------|--------|-----------|
| Build produção | `npm run build` | **OK** |
| Desktop 1920×1080 | Análise coordenadas + critério forense (C=960, simetria 480/1440) | **Esperado OK** — validação pixel pós-merge recomendada |
| Mobile retrato | Overlay `.game-rotate` inalterado (`game-scene.css`) | **Sem regressão estrutural esperada** |
| Mobile paisagem | `calculateScale()` inalterado | **Sem regressão estrutural esperada** |
| Goleiro idle | `IDLE.x = 960` | **Alinhado com C** |
| Pulos goleiro | `JUMPS` não deslocados | **Ressalva** — animação de defesa pode precisar −60px em follow-up se divergir visualmente |

---

## 7. Critérios de aceite (checklist)

| Critério | Status |
|----------|--------|
| Zona C ≈ X=960 | **Sim** (`TARGETS.C.x = 960`) |
| TL/TR simétricas vs trave | **Sim** (480 / 1440 vs 960) |
| Bola alinhada ao eixo | **Sim** (`BALL.START.x = 960`) |
| Goleiro central | **Sim** (idle inalterado) |
| Overlay retrato | **Sim** (sem mudança CSS viewport) |
| HUD intacto | **Sim** |

---

## 8. Decisão

### **PASS COM RESSALVAS**

- Correção mínima, alinhada à forense H3.5h opção 2.
- Build verde; CSS de palco inalterado.
- **Ressalvas:** (1) validação visual fullscreen 1920×1080 e mobile deve ser feita no preview do PR; (2) `GOALKEEPER.JUMPS` não foram recalibrados neste passo — monitorar animação de defesa após deploy.

---

## 9. PR

*(preenchido após `gh pr create`)*
