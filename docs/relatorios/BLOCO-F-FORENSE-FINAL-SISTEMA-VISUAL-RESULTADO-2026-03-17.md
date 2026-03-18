# BLOCO F — Forense final do sistema visual de resultado da /game

**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhum arquivo alterado.

---

## 1. Resumo executivo

Na rota **/game** só é usado o componente **GameFinal**. Existe **uma única camada** de overlays de resultado (imagens GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL): todos são renderizados via **createPortal** para o nó **#game-overlay-root**, filho direto de `<body>`, fora do palco. **Não há** renderização duplicada nem overlay de resultado desenhado dentro do stage. O **toast** (react-toastify) é uma camada distinta: notificação em texto no canto superior direito, complementar aos overlays centrais. O problema restante de “overlay deslocado” foi causado por **posicionamento incorreto** (containing block quando o portal usava fallback para `document.body` e, historicamente, keyframes sem `translate(-50%,-50%)`). Assets estão corretos; duplicação não existe.

---

## 2. Camadas de resultado encontradas

| Camada | Onde | O que exibe | Posição | Usado em /game? |
|--------|------|-------------|---------|------------------|
| **A – Overlay central (portal)** | `createPortal(..., document.getElementById('game-overlay-root'))` em GameFinal.jsx | 4 imagens: goool.png, ganhou.png, defendeu.png, golden-goal.png | `position: fixed`; `top: 50%`; `left: 50%`; `transform: translate(-50%, -50%)`; destino = `#game-overlay-root` (fora do stage) | **Sim** — única camada de overlay de resultado |
| **B – Toast** | `<ToastContainer />` em App.jsx; disparado por `toast.success()` / `toast.info()` em GameFinal.jsx | Texto (“GOL! Você ganhou R$ X”, “Defesa! Tente novamente.”) | Top-right (react-toastify) | **Sim** — complementar, não é o overlay de imagem |
| **C – GameShootSimple / GameShootFallback** | Componentes com classe `.gs-goool` / `.gs-defendeu` | Imagem/div de resultado | Dentro do próprio componente (não portal) | **Não** — rota /game usa só GameFinal; /gameshoot usa GameShoot |

Não há outra camada (ex.: segundo overlay dentro do stage ou outro portal) exibindo os mesmos assets na /game.

---

## 3. Qual camada está correta

- **Camada A (portal para #game-overlay-root)** é a correta e é a única que deve exibir os overlays de resultado na /game. Ela usa os 4 assets certos, posicionamento fixed na viewport (com keyframes que preservam `translate(-50%,-50%)` em game-shoot.css) e está fora de qualquer container com transform, desde que o portal use apenas `#game-overlay-root` (sem fallback para `document.body`).

- **Camada B (toast)** também é correta no seu papel: feedback em texto no canto da tela, sem substituir o overlay central.

---

## 4. Qual camada está errada

- Nenhuma camada está “errada” em termos de existência: não há overlay duplicado nem camada legada ativa na /game.
- O que **estava** errado era o **posicionamento** da camada A quando:
  1. O portal usava fallback para `document.body`, podendo fazer os nós ficarem em contexto com containing block indesejado (já corrigido: portal usa somente `#game-overlay-root`).
  2. Os keyframes (gooolPop, ganhouPop, pop) sobrescreviam o `transform` sem manter `translate(-50%,-50%)` (já corrigido em game-shoot.css).

- **Risco residual (legado em CSS):** em **game-scene.css**, a regra `.gs-golden-goal` usa `position: absolute`, `top: 20%`, `left: 50%`, `transform: translateX(-50%)` e `animation: goldenGoalPop`. No GameFinal, o overlay Gol de Ouro tem **estilos inline** (position: fixed, top/left 50%, translate(-50%,-50%), animation: ganhouPop), que têm prioridade. Portanto, hoje o comportamento visível vem do inline; a regra em game-scene.css é legado e poderia, em edge cases (ex.: inline não aplicado), deslocar o golden goal. Não é a causa do bug atual, mas é a única regra de overlay “errada” no sentido de não refletir o desenho atual (viewport fixo, centralizado).

---

## 5. Assets usados em cada camada

| Camada | Arquivo | Assets |
|--------|---------|--------|
| **GameFinal (overlay portal)** | GameFinal.jsx | `goool.png`, `ganhou.png`, `defendeu.png`, `golden-goal.png` (imports linhas 46–49; usados nas linhas 766, 791, 816, 843) |
| Toast | GameFinal.jsx | Nenhum asset de imagem; apenas strings em `toast.success` / `toast.info` |
| layoutConfig.js | OVERLAYS.SIZE | Apenas dimensões (GOOOL, DEFENDEU, GANHOU, GOLDEN_GOAL); não referencia arquivos de imagem |

**Não utilizados na /game:** ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png — não aparecem em GameFinal.jsx nem na rota /game.

---

## 6. Causa raiz final

- **Não** é renderização duplicada: há uma única árvore de overlays de resultado (portal para #game-overlay-root).
- **Não** é asset incorreto: os 4 assets usados são os pretendidos.
- **É** posicionamento incorreto:
  - **Estrutural:** uso de `document.body` como fallback do portal criava risco de containing block (ancestral com transform) e deslocamento dos elementos com `position: fixed`. Correção: portal usar **apenas** `#game-overlay-root`.
  - **Animação:** keyframes que só tinham `scale()` sobrescreviam o `transform` inicial e deslocavam o centro. Correção: keyframes em game-shoot.css já incluem `translate(-50%,-50%)` em todos os passos (pop, gooolPop, ganhouPop).

---

## 7. Correção mínima recomendada (conceitual, sem aplicar)

1. **Manter** o portal usando somente `document.getElementById('game-overlay-root')` (sem fallback para body) — já feito.
2. **Opcional (limpeza):** Em **game-scene.css**, remover ou ajustar a regra `.gs-golden-goal` (position: absolute, top: 20%, translateX(-50%), goldenGoalPop) para evitar conflito em edge cases; o overlay de Gol de Ouro já é controlado por inline + keyframes em game-shoot.css.
3. **Opcional (clareza):** Em **game-shoot.css**, as regras `.gs-goool`, `.gs-defendeu`, `.gs-ganhou` usam `position: absolute; inset: 0; margin: auto`. Como no GameFinal esses elementos estão no portal com `position: fixed` via inline, essas declarações não ganham. Para evitar confusão futura, poderia ser documentado ou as regras poderiam ser restritas (ex.: só quando dentro do stage) ou removidas para esses overlays se tudo for controlado por inline/outro módulo.

Nenhuma alteração em produção; apenas na branch de trabalho se for feita limpeza.

---

## 8. Arquivo mais suspeito

- **game-scene.css** — trecho das linhas 335–370: a regra `.gs-golden-goal` com `position: absolute`, `top: 20%`, `left: 50%`, `transform: translateX(-50%)` e `animation: goldenGoalPop` não reflete o desenho atual (overlay em viewport fixa, centralizado). É o único bloco de CSS que, se passasse a prevalecer, deslocaria um overlay (verticalmente e em contexto de posicionamento). Por isso é o trecho mais suspeito como legado.

- **game-shoot.css** — trechos 523–535 (`.gs-goool`, `.gs-defendeu`, `.gs-ganhou` com `position: absolute; inset: 0; margin: auto`) foram escritos para elementos posicionados dentro do stage; hoje os nós estão no portal com fixed via inline. A especificidade faz o inline ganhar; o risco de deslocamento é baixo, mas o arquivo concentra as animações (gooolPop, ganhouPop, pop) que já foram corrigidas para manter a centralização.

---

## 9. Veredito final

- **Renderização duplicada:** Não. Uma única camada de overlays de resultado (createPortal para #game-overlay-root).
- **Asset incorreto:** Não. goool.png, ganhou.png, defendeu.png, golden-goal.png são os usados e corretos.
- **Posicionamento incorreto:** Sim. Causa raiz do bug: containing block (fallback para body) e keyframes sem translate(-50%,-50%) — ambos já endereçados na branch de trabalho.
- **Combinação dos três:** Não; apenas posicionamento (estrutural + animação).

**Resposta direta:** o bug é **posicionamento incorreto** (3), não renderização duplicada (1) nem asset incorreto (2).

---

*Documento gerado em 2026-03-17. Leitura somente; nenhuma alteração aplicada.*
