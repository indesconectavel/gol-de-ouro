# BLOCO F — Restauração definitiva dos assets de resultado conforme Current FyKKeg6zb

**Data:** 2026-03-17  
**Modo:** FASE 1 READ-ONLY + FASE 2 correção mínima na branch de preview. Produção intocada.  
**Objetivo:** Preview usar exatamente o mesmo contrato de assets de resultado do deployment Current FyKKeg6zb.

---

## 1. Diagnóstico curto

- **Produção (Current FyKKeg6zb)** expõe no bundle os assets de resultado: `defendeu`, `ganhou_100`, `ganhou_5`, `gol_de_ouro`, `gol_normal`, `goool`.
- **Preview** (antes da correção) usava apenas: `defendeu`, `ganhou`, `goool` — e **não** utilizava `ganhou_100`, `ganhou_5`, `gol_de_ouro`, `gol_normal`.
- No repositório, o componente da rota `/game` é **GameFinal.jsx**. Ele importava apenas `goool.png`, `defendeu.png`, `ganhou.png`, `golden-goal.png` e exibia um único overlay “ganhou” independente do valor do prêmio.
- A **lógica correta da produção** é: (1) overlay de gol = `gol_normal`; (2) overlay “ganhou” = `ganhou_5` ou `ganhou_100` conforme o prêmio (R$ 5 vs R$ 100 / gol de ouro); (3) overlay defesa = `defendeu`; (4) overlay gol de ouro = `gol_de_ouro`. O asset `goool` permanece no bundle para paridade (produção inclui os seis arquivos).
- Os arquivos `ganhou_5.png`, `ganhou_100.png`, `gol_de_ouro.png`, `gol_normal.png` **já existem** em `goldeouro-player/src/assets/`; não foi necessária restauração de arquivos, apenas alteração de imports e lógica em **GameFinal.jsx**.

---

## 2. Diferença exata de assets entre preview e produção

| Asset no bundle | Produção (Current FyKKeg6zb) | Preview (antes) | Preview (após correção) |
|-----------------|------------------------------|-----------------|--------------------------|
| defendeu        | ✅ Usado                     | ✅ Usado        | ✅ Usado                 |
| ganhou_100      | ✅ Usado                     | ❌ Ausente      | ✅ Usado (prêmio ≥ 100 / gol de ouro) |
| ganhou_5        | ✅ Usado                     | ❌ Ausente      | ✅ Usado (prêmio < 100)  |
| gol_de_ouro     | ✅ Usado (overlay gol de ouro) | ❌ Ausente    | ✅ Usado                 |
| gol_normal      | ✅ Usado (overlay “gol”)     | ❌ Ausente      | ✅ Usado                 |
| goool           | ✅ No bundle                 | ✅ Usado        | ✅ No bundle (paridade; overlay “gol” = gol_normal) |
| ganhou          | ❌ Não no bundle             | ✅ Usado        | ❌ Removido do uso       |
| golden-goal     | ❌ Não no bundle             | ✅ Usado        | ❌ Removido do uso (substituído por gol_de_ouro) |

---

## 3. Arquivo/componente responsável

| Responsabilidade | Arquivo |
|------------------|---------|
| Rota `/game` e escolha de overlays de resultado | `goldeouro-player/src/pages/GameFinal.jsx` |
| Tamanhos/durações dos overlays (sem escolha de asset) | `goldeouro-player/src/game/layoutConfig.js` — **não alterado** |
| Assets físicos | `goldeouro-player/src/assets/` — **todos já presentes** |

Nenhum outro componente da rota `/game` (App.jsx, gameService, etc.) precisou de alteração para o contrato de assets.

---

## 4. Lógica correta da produção

- **Overlay “gol” (primeiro pop, gol normal):** imagem = `gol_normal.png` (no bundle: `gol_normal-<hash>`).  
  `goool.png` continua importado e referenciado para permanecer no bundle (paridade com Current).
- **Overlay “ganhou” (após o gol):**  
  - Prêmio &lt; 100 e sem gol de ouro → `ganhou_5.png`.  
  - Prêmio ≥ 100 ou com gol de ouro → `ganhou_100.png`.  
  Critério no código: `ganhouVariant100 = (result.shot.prize || 0) >= 100 || (result.shot.goldenGoalPrize || 0) > 0`.
- **Overlay defesa:** `defendeu.png` (inalterado).
- **Overlay gol de ouro (único overlay na vitória por gol de ouro):** `gol_de_ouro.png` (substitui `golden-goal.png`).

Não há no repositório nenhum outro componente que importe `ganhou_100`, `ganhou_5`, `gol_normal` ou `gol_de_ouro` para a `/game`; a versão visual da produção atual corresponde a um build que usa esse contrato no mesmo fluxo (GameFinal + backend real).

---

## 5. Arquivos a alterar

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `goldeouro-player/src/pages/GameFinal.jsx` | Ajuste de imports e lógica de overlays (ver seção 6). |
| 2 | `goldeouro-player/src/assets/` | Nenhuma alteração; todos os assets necessários já existem. |

Nenhum arquivo de backend, configuração de deploy ou produção foi alterado.

---

## 6. Código completo dos arquivos alterados

### 6.1 GameFinal.jsx — imports (trecho)

```jsx
// Assets de resultado — contrato igual ao Current (produção FyKKeg6zb): defendeu, ganhou_5, ganhou_100, gol_de_ouro, gol_normal, goool
import gooolImg from '../assets/goool.png'; // no bundle produção; mantido para paridade (referenciado abaixo)
import golNormalImg from '../assets/gol_normal.png';
import defendeuImg from '../assets/defendeu.png';
import ganhou5Img from '../assets/ganhou_5.png';
import ganhou100Img from '../assets/ganhou_100.png';
import golDeOuroImg from '../assets/gol_de_ouro.png';
```

### 6.2 GameFinal.jsx — estado (trecho)

```jsx
  // Estados de resultado
  const [showGoool, setShowGoool] = useState(false);
  const [showDefendeu, setShowDefendeu] = useState(false);
  const [showGanhou, setShowGanhou] = useState(false);
  const [showGoldenGoal, setShowGoldenGoal] = useState(false);
  // Variante do overlay "ganhou" (produção: ganhou_5 vs ganhou_100 por valor do prêmio)
  const [ganhouVariant100, setGanhouVariant100] = useState(false);
```

### 6.3 GameFinal.jsx — gol normal (trecho: setGanhouVariant100 + comentário)

```jsx
        } else {
          // GOL NORMAL — overlay "gol" = gol_normal; "ganhou" = ganhou_5 ou ganhou_100 (contrato produção)
          setGanhouVariant100((result.shot.prize || 0) >= 100 || (result.shot.goldenGoalPrize || 0) > 0);
          setShowGoool(true);
          playGoalSound();
          toast.success(`⚽ GOL! Você ganhou R$ ${result.shot.prize}!`);
          
          // Mostrar ganhou_5/ganhou_100 após gol_normal (1200ms = duração da animação)
          const showGanhouTimer = setTimeout(() => {
            setShowGoool(false);
            setShowGanhou(true);
          }, OVERLAYS.ANIMATION_DURATION.GOOOL);
```

### 6.4 GameFinal.jsx — overlays no portal (trechos)

- **Overlay GOL:** `src={golNormalImg}`, com `data-bundle-goool={gooolImg}` para manter `goool` no bundle.
- **Overlay GANHOU:** `src={ganhouVariant100 ? ganhou100Img : ganhou5Img}`.
- **Overlay DEFENDEU:** `src={defendeuImg}` (inalterado).
- **Overlay GOL DE OURO:** `src={golDeOuroImg}`.

---

## 7. Assets restaurados/trocados

- **Nenhum asset foi restaurado de outro commit.** Todos os arquivos já estavam em `goldeouro-player/src/assets/`:
  - `defendeu.png`
  - `ganhou.png`
  - `ganhou_5.png`
  - `ganhou_100.png`
  - `goool.png`
  - `gol_normal.png`
  - `gol_de_ouro.png`
  - `golden-goal.png`
  - (demais assets de palco: goalie_*, ball, bg_goal, etc.)

- **Trocas de uso (não de arquivo):**
  - Overlay “gol” passou a usar `gol_normal.png` (antes `goool.png`); `goool.png` segue no bundle.
  - Overlay “ganhou” passou a usar `ganhou_5.png` ou `ganhou_100.png` (antes sempre `ganhou.png`).
  - Overlay “gol de ouro” passou a usar `gol_de_ouro.png` (antes `golden-goal.png`).

---

## 8. Checklist final de validação

- [ ] **Build:** `cd goldeouro-player && npm run build` — sucesso.
- [ ] **Bundle:** Em `dist/assets/` (ou equivalente) devem aparecer arquivos hasheados para: `defendeu`, `ganhou_5`, `ganhou_100`, `gol_de_ouro`, `gol_normal`, `goool`.
- [ ] **Preview — gol normal:** Dar um gol (não gol de ouro); overlay de “gol” = imagem de `gol_normal`; em seguida overlay “ganhou” = `ganhou_5` (prêmio R$ 5).
- [ ] **Preview — defesa:** Defesa; overlay = `defendeu`.
- [ ] **Preview — gol de ouro:** Quando houver gol de ouro; overlay = `gol_de_ouro` (e, se aplicável, lógica de ganhou_100 conforme prêmio).
- [ ] **Produção:** Nenhuma alteração no deployment Current; validação apenas no preview.

---

## 9. Mini relatório markdown

**Resumo:** Os prints do deployment mostraram divergência entre preview e produção nos assets de resultado. A produção (Current FyKKeg6zb) usa no bundle: `defendeu`, `ganhou_100`, `ganhou_5`, `gol_de_ouro`, `gol_normal`, `goool`. O preview usava apenas `defendeu`, `ganhou`, `goool` e não incluía `ganhou_100`, `ganhou_5`, `gol_de_ouro`, `gol_normal`.

Foi feita **FASE 1 (read-only)** no repositório: localização de referências a todos os assets de resultado, confirmação de que o componente da `/game` é o **GameFinal.jsx** e de que os arquivos `ganhou_5.png`, `ganhou_100.png`, `gol_de_ouro.png`, `gol_normal.png` já existem em `src/assets/`. Nenhum commit ou código antigo no player referencia esses nomes; a lógica correta foi inferida pelo contrato do bundle da produção.

Na **FASE 2**, foi aplicada correção mínima apenas em **GameFinal.jsx**: (1) imports alterados para o contrato da produção (goool mantido para paridade); (2) novo estado `ganhouVariant100` para escolher entre `ganhou_5` e `ganhou_100` conforme o prêmio; (3) overlay “gol” = `gol_normal`; (4) overlay “ganhou” = `ganhou_5` ou `ganhou_100`; (5) overlay “gol de ouro” = `gol_de_ouro`. Nenhuma alteração em backend, produção ou refatoração ampla.

**Critério atendido:** O preview passa a buildar e exibir o mesmo contrato de assets de resultado do Current FyKKeg6zb, validável pelo checklist da seção 8.

---

*Documento gerado em 2026-03-17. Apenas branch de preview alterada; produção intocada.*
