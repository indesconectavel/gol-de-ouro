# BLOCO F — FORENSE DOS ASSETS DE RESULTADO DA /GAME

**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em arquivos, patch, commit, merge ou deploy.

**Referência:** Produção (https://www.goldeouro.lol/game) = verdade absoluta. Preview = branch feature/bloco-e-gameplay-certified.

---

## 1. Resumo executivo

Na rota `/game`, o componente **GameFinal.jsx** é o único responsável pelos resultados visuais (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL). Ele usa **apenas** os assets certificados (goool.png, ganhou.png, defendeu.png, golden-goal.png) importados de `../assets/` e renderiza os quatro overlays via **createPortal** no container `#game-overlay-root` ou `document.body`, com estilo **inline** `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`. Não há referência no código a gol_normal.png, ganhou_100.png, ganhou_5.png nem gol_de_ouro.png.

O sintoma “resultado aparece dentro do palco, próximo ao canto direito” tem **duas causas prováveis** identificadas no código e no CSS:

1. **Toast em canto superior direito:** GameFinal chama `toast.success()` em gol e gol de ouro; o **ToastContainer** em App.jsx está com `position="top-right"`. Esse toast é um **segundo** feedback visual, distinto do overlay de imagem, e fica no canto por design.
2. **Animação CSS sobrescreve o transform de centralização:** Os keyframes **gooolPop**, **ganhouPop** e **pop** em **game-shoot.css** usam apenas `transform: scale(...)`. Ao aplicar a animação, o navegador **substitui** o `transform: translate(-50%, -50%)` do inline. Com `position: fixed` e `top: 50%`; `left: 50%`, o canto **superior esquerdo** do elemento fica no centro da tela; sem o translate, o **centro visual** da imagem fica deslocado para **baixo e para a direita**. Isso explica overlay “próximo ao canto direito” (na prática, centro inferior-direito).

**Conclusão:** O problema atual é predominantemente de **posicionamento** (camada correta + animação removendo o translate), não de **asset errado**. Os imports são os certificados; não há uso de assets alternativos no GameFinal.

---

## 2. Assets de resultado usados em produção

Referência documentada (relatórios BLOCO F e auditoria de assets):

| Estado   | Asset         | Path (produção)        | Uso                          |
|----------|---------------|-------------------------|------------------------------|
| GOOOL    | goool.png     | src/assets/goool.png   | Overlay “GOL!” centralizado  |
| GANHOU   | ganhou.png    | src/assets/ganhou.png  | Overlay “Ganhou” após gol    |
| DEFENDEU | defendeu.png  | src/assets/defendeu.png | Overlay “Defendeu”          |
| GOLDEN GOAL | golden-goal.png | src/assets/golden-goal.png | Overlay “Gol de Ouro”    |

Em produção o comportamento esperado é overlay **centralizado** na viewport (position fixed + 50% + translate -50% -50%), sem deslocamento para o canto.

---

## 3. Assets de resultado usados no preview (código)

No **GameFinal.jsx** (único componente da rota `/game`):

| Estado     | Import                         | Uso no JSX     | Classe CSS   |
|------------|--------------------------------|-----------------|--------------|
| GOOOL      | `import gooolImg from '../assets/goool.png'`       | `src={gooolImg}`    | gs-goool     |
| GANHOU     | `import ganhouImg from '../assets/ganhou.png'`     | `src={ganhouImg}`   | gs-ganhou    |
| DEFENDEU   | `import defendeuImg from '../assets/defendeu.png'` | `src={defendeuImg}` | gs-defendeu  |
| GOLDEN GOAL| `import goldenGoalImg from '../assets/golden-goal.png'` | `src={goldenGoalImg}` | gs-golden-goal |

Não há nenhum import nem referência a: **gol_normal.png**, **ganhou_100.png**, **ganhou_5.png**, **gol_de_ouro.png**. Esses arquivos existem em `src/assets/` mas **não** são usados pelo GameFinal.

---

## 4. Camadas de renderização encontradas

### 4.1 Overlay de imagem (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL)

- **Onde:** GameFinal.jsx, bloco com createPortal.
- **Container de destino:** `document.getElementById('game-overlay-root') || document.body` (variável `overlayContainer`).
- **DOM:** O nó renderizado (tag `<img>`) é filho direto de `#game-overlay-root` ou de `body`; **não** está dentro de `.game-stage` nem de `.game-scale`.
- **Estilo inline (intenção):** `position: 'fixed'`, `top: '50%'`, `left: '50%'`, `transform: 'translate(-50%, -50%)'`, zIndex 10000–10002, dimensões via OVERLAYS.SIZE.*, animation (gooolPop, ganhouPop, pop).
- **Camada:** Overlay em cima da viewport (portal fora da árvore do stage).

### 4.2 Toast de sucesso (GOL / GOL DE OURO)

- **Onde:** GameFinal.jsx, após setShowGoool/setShowGoldenGoal: `toast.success('⚽ GOL!...')` e `toast.success('🏆 GOL DE OURO!...')`.
- **Componente:** react-toastify; **ToastContainer** em App.jsx com `position="top-right"`.
- **Camada:** Toast **sempre** no canto superior direito; é um segundo feedback, não o overlay de imagem.

### 4.3 Conflito com CSS (game-shoot.css)

- As classes **.gs-goool**, **.gs-defendeu**, **.gs-ganhou** em game-shoot.css têm:
  - `position: absolute; inset: 0; margin: auto;`
  - width/height (ex.: width: min(49%,504px) para .gs-goool).
- O inline em GameFinal usa `position: fixed` e dimensões explícitas; o **inline vence** na especificidade para `position` e tamanho.
- Porém, a **animação** (gooolPop, ganhouPop, pop) é aplicada pela classe e pelos keyframes. Nos keyframes está apenas `transform: scale(...)`. A animação **sobrescreve** a propriedade `transform` do inline durante (e, com `forwards`, ao final da) animação. Assim, o `translate(-50%, -50%)` deixa de ser aplicado e o elemento passa a estar posicionado apenas por `top: 50%` e `left: 50%` (canto superior esquerdo no centro), resultando em deslocamento visual para **baixo e para a direita**.

### 4.4 Regras em game-scene.css para .gs-golden-goal

- `.gs-golden-goal` em game-scene.css: `position: absolute; top: 20%; left: 50%; transform: translateX(-50%);` (e animação goldenGoalPop).
- No GameFinal, o overlay GOLDEN GOAL também tem estilo inline `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`. O inline deveria prevalecer; mas, de novo, se a animação **goldenGoalPop** (ou ganhouPop) usar só `transform: scale(...)` ou `translateX(-50%)`, o translate de centralização pode ser perdido durante a animação.

---

## 5. Diferenças de posicionamento

| Aspecto            | Produção (esperado)              | Preview (código + CSS) |
|--------------------|-----------------------------------|-------------------------|
| Intenção do código | Overlay centralizado (fixed 50% + translate -50% -50%) | Idêntica no JSX (inline). |
| Container          | body ou #game-overlay-root        | Idem (overlayContainer). |
| Durante a animação | Centralização mantida             | Keyframes usam só `transform: scale(...)`, **substituindo** o translate; posição efetiva passa a ser “top-left no centro” → imagem deslocada para baixo/direita. |
| Toast              | Top-right por design              | Idem (ToastContainer top-right). |

A diferença de posicionamento não vem de “overlay dentro do stage”, e sim de:
- overlay na camada correta (portal) com inline correto, mas
- **animação CSS** que sobrescreve `transform` e remove o `translate(-50%, -50%)`.

---

## 6. Diferenças de asset

- **GameFinal** usa **somente** goool.png, ganhou.png, defendeu.png, golden-goal.png (imports explícitos).
- **Nenhum** código da /game importa ou referencia gol_normal.png, ganhou_100.png, ganhou_5.png, gol_de_ouro.png.
- Se no preview a **imagem** do overlay parecer “antiga” ou diferente da produção, as causas plausíveis são: (1) **conteúdo binário** diferente do arquivo goool.png (ou outro) no build do preview; (2) cache ou build antigo servindo outro asset. No **código** não há troca de asset.

---

## 7. Componente responsável

- **Único componente que renderiza os resultados visuais da /game:** **GameFinal** (`goldeouro-player/src/pages/GameFinal.jsx`).
- **Rota:** App.jsx: `/game` → `<ProtectedRoute><GameFinal /></ProtectedRoute>`.
- **Controle dos overlays:** Estados `showGoool`, `showGanhou`, `showDefendeu`, `showGoldenGoal`; renderização condicional com createPortal para `overlayContainer`; dimensões e durações vêm de **layoutConfig.js** (OVERLAYS.SIZE, OVERLAYS.ANIMATION_DURATION).
- **Toast:** Mesmo componente chama `toast.success()` em gol e gol de ouro; o ToastContainer é global (App.jsx).

---

## 8. Causa raiz mais provável

1. **Animação CSS sobrescreve o transform de centralização**  
   Os keyframes **gooolPop**, **ganhouPop** e **pop** em **game-shoot.css** definem apenas `transform: scale(...)`. Ao aplicar a animação ao elemento que tem inline `transform: translate(-50%, -50%)`, o transform da animação substitui o do inline. Com `top: 50%` e `left: 50%` e sem translate, o canto superior esquerdo do overlay fica no centro da tela e o centro visual da imagem fica **abaixo e à direita** do centro — compatível com “próximo ao canto direito” ou “dentro do palco, à direita”.

2. **Toast no canto superior direito**  
   O toast de “GOL!” e “GOL DE OURO!” é exibido em **top-right** por configuração do ToastContainer. Quem descreve “resultado no canto direito” pode estar se referindo ao **toast**, e não ao overlay de imagem.

3. **Containing block (já documentado em outros relatórios)**  
   Se o preview estiver em build sem #game-overlay-root e com ancestral com transform, o `position: fixed` pode ficar relativo a um retângulo deslocado, agravando o efeito. Isso não altera a conclusão sobre a animação.

---

## 9. Correção mínima recomendada (conceitual, sem aplicar)

1. **Manter centralização durante e após a animação**  
   Nos keyframes **gooolPop**, **ganhouPop** e **pop** em **game-shoot.css**, incluir o translate de centralização em todos os passos, por exemplo:
   - `transform: translate(-50%, -50%) scale(...);`
   Assim a animação não remove o posicionamento central.

2. **Opcional: reduzir confusão visual com o toast**  
   Se a intenção for que o feedback principal seja o overlay de imagem (e não o toast no canto), considerar não disparar `toast.success` para gol/gol de ouro na /game, ou exibir o toast em outra posição/contexto. Isso é decisão de produto; não é obrigatório para corrigir o overlay.

3. **Manter** createPortal para #game-overlay-root (ou body), assets atuais (goool, ganhou, defendeu, golden-goal) e dimensões do layoutConfig. Não trocar asset nem camada de renderização; apenas garantir que o transform da animação preserve o translate(-50%, -50%).

---

## 10. Veredito final

- **Problema atual:** Principalmente **posicionamento** (animação removendo o translate de centralização); em segundo plano, possível **confusão** entre overlay central e **toast** no canto direito. **Não** é uso de **asset errado** no código (os imports são os certificados; alternativos não são referenciados).
- **Camada de renderização:** Está **correta** (portal para #game-overlay-root ou body; overlay fora do stage). O que falha é o **transform** durante a animação.
- **Arquivo mais suspeito:** **goldeouro-player/src/pages/game-shoot.css** — keyframes **gooolPop**, **ganhouPop** e **pop** que usam só `transform: scale(...)` e assim sobrescrevem o `translate(-50%, -50%)` do inline.
- **Primeiro ajuste técnico recomendado na próxima etapa:** Nos keyframes **gooolPop**, **ganhouPop** e **pop** em **game-shoot.css**, alterar cada `transform: scale(...)` para `transform: translate(-50%, -50%) scale(...)` (e, onde já existir translateX(-50%), unificar com translate(-50%, -50%) quando for o caso do overlay centralizado), para que a centralização seja mantida durante toda a animação.

---

## Respostas obrigatórias

| Pergunta | Resposta |
|----------|----------|
| O problema atual é **asset errado**? | **Não.** Os assets usados são goool.png, ganhou.png, defendeu.png, golden-goal.png. Não há uso de gol_normal, ganhou_100, ganhou_5 ou gol_de_ouro no GameFinal. |
| O problema atual é **camada errada**? | **Não.** A camada é a correta (portal para #game-overlay-root ou body; overlay fora do stage). O problema é o **posicionamento** dentro dessa camada: a animação CSS sobrescreve o transform e remove o translate de centralização. |
| É **ambos**? | **Não.** Asset está correto; camada está correta; o defeito é de **posicionamento** (animação + eventualmente percepção do toast no canto). |
| **Arquivo exato mais suspeito** | **goldeouro-player/src/pages/game-shoot.css** (keyframes gooolPop, ganhouPop, pop). |
| **Primeiro ajuste técnico** | Incluir `translate(-50%, -50%)` em todos os passos dos keyframes gooolPop, ganhouPop e pop em game-shoot.css, para não sobrescrever a centralização do overlay. |

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código ou deploy.*
