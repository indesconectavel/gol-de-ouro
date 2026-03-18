# BLOCO F — RELATÓRIO-MESTRE DE AUDITORIA FORENSE DA /GAME

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, deploy, banco ou assets. Apenas consolidação e documentação.

**Documentos consolidados:**
- BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT-2026-03-17.md  
- BLOCO-F-FORENSE-OVERLAYS-CAMADAS-GAME-2026-03-17.md  
- BLOCO-F-FORENSE-ASSETS-INTEGRIDADE-VISUAL-GAME-2026-03-17.md  
- COMPARACAO-FORENSE-GAME-PROD-VS-PREVIEW-2026-03-17.md  
- ENCERRAMENTO-CHAT-I5-E-TRANSICAO-BLOCO-F-2026-03-17.md  
- AUDITORIA-ASSETS-GAME-PROD-VS-PREVIEW-2026-03-17.md  

---

## 1. Resumo executivo

O **BLOCO F** cobre a **interface da rota /game** (componente GameFinal, stage 1920×1080, HUD, overlays de resultado e assets). Foram executadas três auditorias forenses read-only: (1) Stage / Scale / Viewport, (2) Overlays / camadas / ancoragem, (3) Assets / integridade visual. Este relatório-mestre consolida todos os achados.

**Conclusão:** O **preview** (branch `feature/bloco-e-gameplay-certified`) apresenta **regressões estruturais e visuais** na tela `/game`: palco não centralizado no viewport, overlays de resultado deslocados (reportados no canto inferior esquerdo), possível divergência do asset GOOOL e assets extras não usados. A **produção é a referência soberana e intocável**; nenhum deploy, patch, merge ou alteração deve ser aplicado ao ambiente de produção (current). O veredito oficial do BLOCO F no estado atual do preview é **BLOQUEADO**.

---

## 2. Estado de produção (referência oficial)

- **Produção não deve ser tocada.** O ambiente de produção (current) é a referência estável e aprovada. Nenhuma alteração de código, deploy, merge ou patch deve ser feita no deployment Current em produção.
- **Referência de rollback:** tag `pre-fase1-idempotencia-2026-03-17` (commit `16177266d702a75c101947e9bf397540acaeb103`).
- **Rota /game em produção:** Layout base 1920×1080 (`layoutConfig.js`), stage e HUD com coordenadas fixas em pixels; overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) centralizados (`position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`) via `createPortal` no `document.body`. Assets: `goool.png`, `defendeu.png`, `ganhou.png`, `golden-goal.png` e demais conforme GameFinal/layoutConfig.
- **Estrutura referenciada (backup visual validado):** Raiz `.game-viewport` sem estilos inline obrigatórios; filho `.game-scale` com `transform: scale(n)`, `transformOrigin: center center`, 1920×1080; filho `.game-stage` com mesmo tamanho. HUDs dentro do stage; overlays de resultado no body. Em produção (ou no backup), a paridade visual esperada é palco proporcional e centralizado e overlays no centro da tela.

---

## 3. Estado do preview auditado

- **Branch:** `feature/bloco-e-gameplay-certified`. Componente: `GameFinal.jsx` (rota `/game`).
- **Estrutura real no preview:** `.game-viewport` com estilo inline `width: 100vw`, `height: 100dvh`, `overflow: hidden` → `.game-scale` (1920×1080, scale aplicado) → `.game-stage` (1920×1080). Não há uso de `.game-page`, `.game-stage-wrap` nem `#stage-root` no JSX.
- **Problemas reportados e confirmados pela auditoria:**  
  - Palco “quebrado” / escala estranha / conteúdo fora do centro: o bloco 1920×1080 escalado **não está centralizado** no viewport (ancorado no canto superior esquerdo).  
  - Overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) no **canto inferior esquerdo** em vez do centro.  
  - Possível divergência do asset **goool.png** (imagem diferente da aprovada).  
  - Presença de assets extras no preview não usados pelo GameFinal: `gol_normal.png`, `gol_de_ouro.png`, `ganhou_100.png`, `ganhou_5.png` (risco de uso indevido ou confusão).
- **CSS:** Não existe regra para `.game-viewport` nem `.game-scale` nos arquivos auditados; o CSS (game-scene.css, game-pixel.css) foi escrito para `.game-page`, `.game-stage-wrap`, `#stage-root`, que não aparecem no DOM do GameFinal.

---

## 4. Regressões confirmadas

| # | Regressão | Tipo | Fonte |
|---|-----------|------|--------|
| 1 | Palco 1920×1080 escalado não centralizado no viewport; conteúdo ancorado no canto superior esquerdo | Estrutural | Forense Stage/Scale/Viewport |
| 2 | Overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) deslocados para o canto inferior esquerdo no preview | Visual / ancoragem | Comparação forense + Forense Overlays |
| 3 | Possível divergência do asset goool.png (conteúdo ou contexto de exibição) | Visual / assets | Forense Assets + Auditoria prod vs preview |
| 4 | Uso de `100dvh` no viewport do preview sem regra de centralização; possível desencontro com `window.innerHeight` no cálculo de scale | Estrutural | Forense Stage/Scale |
| 5 | DOM real (viewport → scale → stage) sem regras CSS correspondentes; regras existentes para game-page/stage-wrap/stage-root não se aplicam | Estrutural | Forense Stage + Overlays |
| 6 | Assets extras no preview (gol_normal, gol_de_ouro, ganhou_100, ganhou_5) não referenciados pelo GameFinal; risco de troca/uso indevido | Integridade | Forense Assets |
| 7 | Variáveis CSS `--pf-w`, `--pf-h`, `--pf-ox`, `--pf-oy` definidas em `#stage-root`, que não existe no DOM; risco futuro se inlines forem removidos | Ancoragem / risco | Forense Overlays |

---

## 5. Causas prováveis priorizadas

1. **Estrutural (prioridade máxima):** Ausência de centralização do `.game-scale` dentro do `.game-viewport`. O container raiz não possui `display: flex`, `align-items: center`, `justify-content: center` (nem em CSS nem em inline), portanto o bloco escalado fica no canto superior esquerdo.  
2. **Estrutural:** Inexistência de regras CSS para `.game-viewport` e `.game-scale`; a árvore DOM usada não corresponde à árvore para a qual o CSS foi escrito.  
3. **Ancoragem / stacking context:** Containing block para `position: fixed` alterado por ancestral com `transform` (ou `filter`/`perspective`), fazendo os overlays no body ficarem “fixos” em relação a um retângulo que não é a viewport (ex.: canto inferior esquerdo).  
4. **Estrutural/visual:** Uso de `100dvh` na raiz do preview pode divergir de `window.innerHeight` usado no cálculo de scale, afetando proporção e sensação de layout.  
5. **Visual/assets:** Conteúdo do arquivo `goool.png` diferente entre produção e preview (mesmo path); ou uso indevido de outro asset (ex.: `gol_normal.png`) em build/fallback não identificado.  
6. **Visual:** object-fit/object-position do fundo (cover sem object-position explícito) e overlays (contain com dimensões fixas) podem variar o aspecto entre ambientes ou proporções de imagem.

---

## 6. Causa raiz principal

A **causa raiz principal** identificada é **estrutural**: o palco 1920×1080 escalado **nunca foi configurado para ser centralizado no viewport**. O elemento que contém o scale (`.game-scale`) está dentro de um container (`.game-viewport`) que não aplica layout de centralização (flex ou absolute + translate). Em algum ambiente/build anterior pode ter existido outra camada ou regra que compensava isso; no preview atual essa compensação não existe.  

As regressões de **overlay no canto inferior esquerdo** são explicadas de forma consistente por (a) **containing block / stacking context** criado por ancestral com `transform`, e/ou (b) efeito indireto do **stage não centralizado** e do uso de **100dvh**, que tornam o layout da página inconsistente. A ancoragem em código (fixed 50% + translate -50%) é idêntica entre preview e referência de produção; a diferença é o contexto de renderização.  

As divergências **visuais de asset** (GOOOL diferente, assets extras) são causa **secundária** em relação à estrutura, mas bloqueiam a reaprovação até confirmação de fidelidade aos assets aprovados.

---

## 7. Severidade por categoria

| Categoria | Severidade | Itens |
|-----------|------------|--------|
| **Estrutural** | Crítica | Palco não centralizado; ausência de regras CSS para .game-viewport/.game-scale; divergência entre DOM e CSS (game-page/stage-wrap não usados). |
| **Ancoragem** | Crítica | Overlays de resultado deslocados (containing block/stacking context); variáveis --pf-* indefinidas no DOM real (risco futuro). |
| **Visual / assets** | Crítica | Possível divergência do goool.png; presença de assets extras (gol_normal, etc.) com risco de uso indevido. |
| **Visual / layout** | Alta | Uso de 100dvh sem consistência com scale; object-fit/object-position sem garantia de paridade entre ambientes. |
| **Operacional** | Média | Preload dos assets da /game não incluído; fallback apenas na logo; imagens do stage sem onError. |

---

## 8. Ordem ideal de correção

1. **Primeiro ponto técnico a corrigir (estrutural):** Garantir que o container raiz da `/game` (ou `.game-viewport`) **centralize** o `.game-scale`. Ex.: no `.game-viewport`: `display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: hidden;` (ou equivalente em CSS dedicado), mantendo no `.game-scale` o `transform: scale(...)` e `transform-origin: center center`. Alternativa: `.game-scale` com `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(...)` e viewport com `position: relative`.  
2. **Alinhar DOM e CSS:** Ou passar a usar no JSX a árvore para a qual o CSS foi escrito (`.game-page` > `.game-stage-wrap` > `#stage-root`/`.game-stage`) com scale/centralização no nível correto, ou adicionar regras explícitas para `.game-viewport` e `.game-scale` e definir `--pf-*` em um ancestral que exista no DOM.  
3. **Overlays de resultado:** Manter createPortal no body com fixed 50% + translate -50%. Garantir que **nenhum ancestral do body** (root da app, wrappers de rota) tenha `transform`, `filter` ou `will-change` que crie novo containing block para fixed.  
4. **Altura do viewport:** Revisar uso de `100dvh` vs `100vh` e consistência com `window.innerHeight` no cálculo de scale.  
5. **Assets:** Garantir que `goool.png` no preview seja exatamente o asset aprovado (comparação binária/checksum); decidir sobre `ganhou_100`, `ganhou_5`, `gol_de_ouro`, `gol_normal` (remover ou documentar como não usados e garantir que o build não os use na /game).  
6. **object-fit/object-position e preload/fallback:** Ajustes opcionais para previsibilidade visual e robustez (object-position no bg, preload dos assets da /game, onError nas imagens do stage).

---

## 9. Riscos de avançar sem correção

- **Promoção do preview para produção:** Quebra da fidelidade ao layout aprovado (palco e overlays); experiência de jogo inconsistente e possivelmente quebrada.  
- **Validação funcional (ex.: I.5) em preview:** Qualquer teste em ambiente com interface regredida não é representativo da produção e não garante ausência de regressão de UX.  
- **Uso do preview como referência para novas features:** Decisões baseadas em um layout incorreto podem propagar erros.  
- **Risco futuro de ancoragem:** Se os estilos inline dos HUDs forem removidos, regras que usam `--pf-*` (indefinidas no DOM atual) podem desalinhar elementos.

---

## 10. Critérios objetivos para reaprovação

- **O que depende de correção técnica (antes da validação manual):**  
  - Centralização do stage no viewport implementada e em uso no preview.  
  - Coerência entre DOM e CSS (regras para .game-viewport/.game-scale ou uso da árvore esperada pelo CSS).  
  - Garantia de que nenhum ancestral do body crie containing block para os overlays fixed (overlays relativos à viewport).  
  - Consistência de altura (100dvh/100vh e scale) conforme decisão técnica.  
  - Confirmação de que o arquivo `goool.png` e demais overlays são idênticos aos aprovados; remoção ou documentação dos assets extras.  

- **O que depende de nova validação manual depois:**  
  - Acessar o preview (URL do deployment) e conferir visualmente: palco centralizado, proporção 16:9 respeitada, overlays GOOOL/GANHOU/DEFENDEU/GOLDEN GOAL no centro da tela.  
  - Comparar lado a lado (produção vs preview) as mesmas rotas e confirmar paridade de stage, escala e overlays.  
  - Registrar evidência (prints/vídeo) e relatório de que stage, overlays e assets da `/game` estão em paridade com produção.  

- **Regra de governança:** Nenhuma validação funcional (incluindo I.5) nem promoção para produção deve ocorrer enquanto houver regressão visual no BLOCO F. A produção permanece **intocada** até decisão explícita após BLOCO F reaprovado.

---

## 11. Veredito final oficial

**BLOQUEADO**

O BLOCO F (interface da /game) no estado atual do preview está **bloqueado** para promoção à produção e para uso do preview como ambiente de validação funcional. As regressões confirmadas são: (1) **estrutural** — palco não centralizado no viewport e DOM sem regras CSS correspondentes; (2) **visual/ancoragem** — overlays de resultado deslocados (canto inferior esquerdo), explicados por containing block/stacking context e/ou efeito do stage não centralizado; (3) **assets** — possível divergência do GOOOL e presença de assets extras com risco de uso indevido.

A **produção é referência soberana e intocável**: nenhum deploy, patch, merge ou alteração no deployment Current em produção. O **primeiro ponto técnico a corrigir** é a centralização do `.game-scale` dentro do `.game-viewport`. Após as correções técnicas, é obrigatória **validação manual em preview** (stage centralizado, overlays no centro, paridade de assets) com evidência documentada.

Até que esses critérios sejam atendidos e a reaprovação seja documentada, o veredito oficial do BLOCO F permanece **BLOQUEADO**.

---

*Documento gerado em modo READ-ONLY ABSOLUTO. Nenhuma alteração foi feita em código, deploy, banco, env ou assets. Apenas consolidação e documentação.*
