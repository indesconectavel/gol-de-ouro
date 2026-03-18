# BLOCO F — COMPARAÇÃO FORENSE TOTAL DA /GAME

**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — proibido alterar arquivos, patch, commit, merge, deploy, banco, env, assets, configs, rotas ou estilos. Objetivo exclusivo: auditoria comparativa forense da página /game.

**Referência soberana:** O deployment Current em produção (https://www.goldeouro.lol/game) é a VERDADE ABSOLUTA e está FUNCIONANDO CORRETAMENTE. É intocável. Toda a análise usa a produção apenas como referência para comparação com o preview da branch de trabalho.

**Alvos:**  
- **Produção:** https://www.goldeouro.lol/game  
- **Preview:** /game do deployment preview atual da branch `feature/bloco-e-gameplay-certified`

---

## 1. Resumo executivo

A página `/game` em **produção** é a referência estável e aprovada. Em **preview** (branch `feature/bloco-e-gameplay-certified`) foram identificadas, por análise de código e relatórios forenses anteriores, discrepâncias **estruturais**, **visuais** e de **assets**: (1) palco 1920×1080 escalado que, na ausência de centralização no viewport, ficaria ancorado no canto superior esquerdo — no código atual do repositório a **Correção 1** (flex + centralização no `.game-viewport`) já está aplicada, portanto o preview **deployado a partir desse código** pode exibir o palco centralizado; (2) overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) reportados no canto inferior esquerdo no preview, explicáveis por containing block/stacking context ou por build anterior à correção; (3) possível divergência do asset `goool.png` e presença de assets extras não usados; (4) DOM real (`.game-viewport` → `.game-scale` → `.game-stage`) sem regras CSS dedicadas, enquanto o CSS foi escrito para `.game-page`, `.game-stage-wrap`, `#stage-root`, que não aparecem no JSX do GameFinal. O veredito oficial, com base na evidência consolidada, permanece **BLOQUEADO** até validação visual no preview após todas as correções e confirmação de paridade com produção.

---

## 2. Referência oficial em produção

- **URL:** https://www.goldeouro.lol/game  
- **Componente (referência):** Rota `/game` servida pelo bundle em produção (Current). A referência de código utilizada nos relatórios é o backup visual validado e a descrição consolidada: stage base 1920×1080, HUD e elementos em coordenadas fixas (layoutConfig.js), overlays de resultado centralizados na tela.  
- **Estrutura esperada:** Container raiz (viewport) com palco escalado **centralizado** na tela; filho com `transform: scale(n)` e `transform-origin: center center`, dimensões 1920×1080; overlays GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL no **centro** da viewport (`position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`) via createPortal no `document.body`.  
- **Assets oficiais:** goool.png, defendeu.png, ganhou.png, golden-goal.png, bg_goal.jpg, ball.png, goalie_idle.png, goalie_dive_*.png, logo em /images.  
- **Comportamento visual aprovado:** Palco proporcional 16:9, centralizado; fundo do campo visível; HUD (header, saldo, chutes, ganhos, gols de ouro, MENU PRINCIPAL) e rodapés alinhados ao palco; overlays de resultado no centro; sem deslocamento para cantos.

---

## 3. Estado atual do preview

- **Branch:** `feature/bloco-e-gameplay-certified`.  
- **Componente:** `GameFinal.jsx` (App.jsx: rota `/game` → `<ProtectedRoute><GameFinal /></ProtectedRoute>`).  
- **Estrutura DOM no código:**  
  - Raiz: `<div className="game-viewport" style={{ width: '100vw', height: '100dvh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`  
  - Filho: `<div className="game-scale" style={gameScaleStyle}>` com `transform: scale(n)`, `transformOrigin: 'center center'`, `width: 1920`, `height: 1080`, `position: 'relative'`  
  - Filho do scale: `<div className="game-stage" style={{ width, height, position, overflow, background }}>` 1920×1080  
  - Não há no JSX `.game-page`, `.game-stage-wrap` nem `#stage-root`.  
- **Overlays de resultado:** createPortal(..., document.body) com estilo inline `position: 'fixed'`, `top: '50%'`, `left: '50%'`, `transform: 'translate(-50%, -50%)'`.  
- **Problemas reportados (relatórios forenses):** Overlays no canto inferior esquerdo; palco “quebrado”/não centralizado (estado **antes** da Correção 1); possível asset GOOOL diferente; assets extras (gol_normal.png, gol_de_ouro.png, ganhou_100.png, ganhou_5.png) presentes no preview e não referenciados pelo GameFinal.  
- **Nota:** O arquivo GameFinal.jsx **atual** já contém a Correção 1 (flex + centralização no `.game-viewport`). Se o deployment preview for o build desse commit, o palco deve aparecer centralizado; a validação visual no preview é obrigatória para confirmar.

---

## 4. Diferenças estruturais confirmadas

| Item | Produção (referência) | Preview (código / relatórios) | Confirmado |
|------|------------------------|-------------------------------|------------|
| Componente da rota /game | Bundle production (referência estável) | GameFinal.jsx | Sim |
| Árvore de wrappers | viewport → scale → stage (palco centralizado na prática) | viewport → scale → stage (sem .game-page, .game-stage-wrap, #stage-root) | Sim |
| Uso de .game-viewport no DOM | Sim (referência) | Sim | Sim |
| Uso de .game-scale no DOM | Sim | Sim | Sim |
| Uso de .game-stage no DOM | Sim | Sim | Sim |
| Uso de .game-page / .game-stage-wrap / #stage-root no JSX | Não (referência) | Não | Sim |
| Regras CSS para .game-viewport / .game-scale | Nenhuma nos arquivos auditados | Nenhuma | Sim |
| Estilo inline no .game-viewport | Referência sem inline obrigatório ou com centralização | 100vw, 100dvh, overflow, display flex, alignItems center, justifyContent center (após Correção 1) | Sim (código atual já centraliza) |
| createPortal para overlays | body, fixed 50% + translate -50% | body, fixed 50% + translate -50% (igual no código) | Sim (código idêntico; sintoma de overlay deslocado é de runtime/containing block) |

---

## 5. Diferenças de layout/scale confirmadas

| Item | Produção | Preview | Severidade |
|------|----------|---------|------------|
| Cálculo de scale | scaleX = innerWidth/1920, scaleY = innerHeight/1080, min(scaleX, scaleY) | Idêntico (calculateScale) | Nenhuma |
| transform-origin do .game-scale | center center | center center | Nenhuma |
| Dimensões do stage | 1920×1080 | 1920×1080 | Nenhuma |
| Centralização do .game-scale no viewport | Esperada (palco centralizado) | No código atual: sim (flex + center no .game-viewport). Em build anterior: não (palco no canto) | Crítica se deploy for antigo |
| Altura do viewport | (referência) | 100dvh no inline | Média (pode divergir de innerHeight em alguns browsers) |
| boundingClientRect / ocupação | Palco centralizado, letterbox/pillarbox simétricos | Depende do build: com Correção 1, centralizado; sem ela, canto superior esquerdo | Crítica |

---

## 6. Diferenças de background/enquadramento visual

| Item | Produção | Preview | Observação |
|------|----------|---------|------------|
| Asset de fundo | bg_goal.jpg (layoutConfig / import) | bg_goal.jpg (import de ../assets/bg_goal.jpg) | Path idêntico |
| object-fit | cover | cover (inline no img.scene-bg) | Idêntico |
| object-position | Não explícito no código | Não explícito | Pode variar por proporção da imagem |
| Dimensão do stage | 1920×1080 | 1920×1080 | Idêntico |
| Crop/zoom aparente | Referência estável | Idêntico em código; diferença perceptível só se scale ou centralização falharem | Sintoma indireto de layout |

---

## 7. Diferenças de elementos do palco

| Elemento | Produção | Preview (código) | Observação |
|----------|----------|------------------|------------|
| .scene-bg | absolute, left 0, top 0, width/height stage | Idêntico | — |
| .hud-header | HUD.HEADER (top 20, left 20, right 20) px | Idêntico | — |
| .gs-zone (TL,TR,C,BL,BR) | TARGETS + offsets, absolute | Idêntico | — |
| .gs-goalie | GOALKEEPER + pose, absolute, inline left/top/width/height/transform | Idêntico; game-scene.css tem .gs-goalie com transform (translate/scale) que pode conflitar com inline | Inline vence especificidade |
| .gs-ball | ballPos, absolute, inline | Idêntico; game-scene.css usa --pf-* (indefinidas no DOM) para .gs-ball | Inline protege |
| .hud-bottom-left / .hud-bottom-right | HUD.BOTTOM_LEFT / BOTTOM_RIGHT (left 20, bottom 20, etc.) | Idêntico | game-scene.css usa --pf-ox, --pf-w (não definidas em #stage-root no DOM real) |

---

## 8. Diferenças de overlays

| Overlay | Produção | Preview (código) | Comportamento reportado no preview |
|---------|----------|------------------|-------------------------------------|
| GOOOL | fixed 50% + translate(-50%,-50%), body | Idêntico no JSX | Aparece no canto inferior esquerdo (relatórios) |
| GANHOU | Idem | Idem | Possível deslocamento |
| DEFENDEU | Idem | Idem | Possível deslocamento |
| GOLDEN GOAL | Idem | Idem | Não detalhado |
| createPortal target | document.body | document.body | Idêntico |
| CSS em game-shoot.css | .gs-goool etc. position absolute, inset 0, margin auto | Inline fixed 50% + translate vence | Containing block por ancestral com transform explica canto |

---

## 9. Diferenças de CSS efetivo

| Aspecto | Produção | Preview | Causa provável |
|---------|----------|---------|----------------|
| Regras para .game-viewport | Nenhuma | Nenhuma | Não definidas em nenhum .css |
| Regras para .game-scale | Nenhuma | Nenhuma | Idem |
| Regras para #stage-root, .game-page, .game-stage-wrap | Existem em game-scene.css, game-pixel.css, game-page.css | Não se aplicam ao DOM (classes/ids não usados no JSX) | Divergência DOM vs CSS |
| Variáveis --pf-w, --pf-h, --pf-ox, --pf-oy | Definidas em #stage-root (não presente no DOM do GameFinal) | Indefinidas no contexto real | Risco se inlines forem removidos |
| .gs-goalie, .gs-ball em game-scene.css | Usam --pf-* e transform | Inline no GameFinal sobrescreve posição/transform | Inline protege hoje |
| .gs-goool, .gs-defendeu, .gs-ganhou em game-shoot.css | position absolute, inset 0, margin auto | Inline fixed 50% + translate no JSX vence | Overlay no canto = containing block no runtime |

---

## 10. Diferenças de assets

| Asset | Produção | Preview | Severidade |
|-------|----------|---------|------------|
| goool.png | Aprovado, centralizado | Divergência visual reportada; path idêntico no código | Crítica |
| defendeu.png, ganhou.png, golden-goal.png | Aprovados | Path e import idênticos | Média (conteúdo binário não comparado) |
| bg_goal.jpg, ball.png, goalie_* | Aprovados | Idem | Média |
| gol_normal.png, gol_de_ouro.png, ganhou_100.png, ganhou_5.png | Ausentes em main (referência) | Presentes em src/assets no preview; não referenciados por GameFinal | Alta (risco de uso indevido) |
| golden-victory.png | Presente | Presente; não usado por GameFinal (.gs-golden-victory no CSS) | Baixa |

---

## 11. Causas prováveis priorizadas

1. **Centralização do stage (estrutural):** Ausência de layout de centralização no `.game-viewport` fazia o palco ficar no canto. **No código atual a Correção 1 já adiciona flex + center**; se o preview estiver com build antigo, a causa ainda se aplica.  
2. **Containing block / stacking context (overlays):** Ancestral do body (ex.: root da app com transform/filter/perspective) cria novo containing block para `position: fixed`, deslocando overlays para o canto.  
3. **DOM vs CSS:** Regras escritas para `.game-page`, `.game-stage-wrap`, `#stage-root` não se aplicam ao DOM real (viewport → scale → stage), e não há regras para .game-viewport/.game-scale.  
4. **100dvh vs window.innerHeight:** Possível desencontro entre altura do container e valor usado em calculateScale.  
5. **Asset goool.png:** Conteúdo diferente no preview ou uso indevido de variante (ex. gol_normal.png) em algum path/build.  
6. **Variáveis --pf-* indefinidas:** Em elementos que usam essas variáveis no CSS mas não estão dentro de #stage-root, comportamento indefinido se inlines forem removidos.

---

## 12. Causa raiz principal mais provável

A **causa raiz principal** é **estrutural e de contexto de renderização**:

- **Palco:** O bloco 1920×1080 escalado não era centralizado no viewport porque o container `.game-viewport` não tinha `display: flex` + `align-items: center` + `justify-content: center`. Isso foi corrigido no código (Correção 1); em previews com build anterior, o sintoma persiste.  
- **Overlays:** O código de ancoragem é o mesmo (body + fixed 50% + translate -50%). O deslocamento para o canto inferior esquerdo é explicado por **containing block alterado**: algum ancestral do body (ex. div com `transform` ou `filter`) faz o “fixed” ser relativo a esse bloco em vez da viewport.  
- **Assets:** Divergência do GOOOL e presença de assets extras são causa **secundária** em relação à estrutura, mas bloqueiam reaprovação até confirmação de fidelidade.

---

## 13. Ordem exata recomendada de correção

1. **Garantir centralização do stage no viewport** — Confirmar que o deployment preview usa build com Correção 1 (flex + center no `.game-viewport`). Se já estiver no código, validar no preview.  
2. **Garantir que overlays fixed usem a viewport como containing block** — Revisar ancestrais do body (root da app, wrappers de rota); remover ou isolar `transform`/`filter`/`will-change` que criem novo containing block; ou renderizar portal em nó filho direto do body sem ancestral com transform.  
3. **Alinhar DOM e CSS** — Ou usar no JSX a árvore esperada pelo CSS (game-page, stage-wrap, stage-root) com scale/centralização no nível correto, ou adicionar regras explícitas para `.game-viewport` e `.game-scale` e definir `--pf-*` em ancestral existente.  
4. **Revisar 100dvh vs 100vh** — Alinhar à lógica de scale (window.innerHeight) conforme decisão técnica.  
5. **Assets** — Garantir que goool.png no preview seja idêntico ao aprovado (checksum/conteúdo); tratar assets extras (gol_normal, gol_de_ouro, ganhou_100, ganhou_5): remover ou documentar e garantir que não sejam usados na /game.  
6. **Validação visual no preview** — Checklist: palco centralizado, proporção 16:9, overlays no centro, HUD/rodapés alinhados, mesmo “sensação” que produção.

---

## 14. Riscos de corrigir sem essa comparação

- **Promover preview sem validar:** Regressão de layout e overlays em produção.  
- **Corrigir apenas overlays sem centralizar o stage:** Layout continua quebrado (palco no canto) e percepção de overlay “errado” pode persistir.  
- **Corrigir apenas centralização sem verificar containing block:** Overlays podem continuar no canto.  
- **Ignorar assets extras:** Risco de uso indevido ou troca acidental em futuros deploys.  
- **Remover inlines sem alinhar DOM/CSS:** Regras que usam `--pf-*` podem desalinhar HUDs e elementos do stage.

---

## 15. Veredito final: BLOQUEADO ou APROVADO

**BLOQUEADO**

O preview da branch `feature/bloco-e-gameplay-certified` **não pode ser considerado paridade visual com produção** até: (1) confirmação no preview de que o palco está centralizado (build com Correção 1) e de que os overlays aparecem no centro; (2) garantia de que nenhum ancestral do body altera o containing block dos overlays fixed; (3) confirmação de que o asset GOOOL e demais overlays são idênticos aos aprovados; (4) decisão sobre assets extras. A comparação forense identifica causa raiz (estrutura + containing block) e ordem de correção; a base mínima para continuar é aplicar e validar as correções acima no preview, sem tocar em produção.

---

## A. Tabela mestra de discrepâncias

| Item | Produção | Preview | Severidade | Causa provável |
|------|----------|---------|------------|----------------|
| Palco centralizado | Sim | Código atual: sim (Correção 1). Build antigo: não | Crítica | Falta de flex/center no viewport (já corrigido no código) |
| Overlays no centro | Sim | Reportado no canto inferior esquerdo | Crítica | Containing block por ancestral com transform |
| Asset GOOOL | Aprovado | Divergência reportada | Crítica | Conteúdo diferente ou asset errado |
| Regras CSS para viewport/scale | Nenhuma | Nenhuma | Alta | DOM sem regras dedicadas |
| Uso de .game-page / #stage-root no DOM | Não | Não | Alta | CSS escrito para árvore não usada |
| Variáveis --pf-* no contexto real | N/A (#stage-root ausente) | Indefinidas | Média | Risco futuro se remover inlines |
| 100dvh no viewport | (referência) | Sim | Média | Possível desencontro com innerHeight |
| Assets extras (gol_normal, etc.) | Ausentes | Presentes, não usados | Alta | Risco de uso indevido |
| HUDs/rodapés | Alinhados ao stage | Inline idêntico; protegido | — | — |

---

## B. Lista objetiva

**Top 10 discrepâncias mais importantes:**  
1. Overlays de resultado no canto inferior esquerdo no preview.  
2. Palco 1920×1080 não centralizado (em build anterior à Correção 1).  
3. Possível divergência do asset goool.png.  
4. Nenhuma regra CSS para .game-viewport e .game-scale.  
5. DOM real não usa .game-page, .game-stage-wrap, #stage-root (CSS órfão).  
6. Containing block para position:fixed possivelmente alterado por ancestral.  
7. Variáveis --pf-* indefinidas no DOM real.  
8. Assets extras no preview (gol_normal, gol_de_ouro, ganhou_100, ganhou_5).  
9. Uso de 100dvh sem garantia de consistência com scale.  
10. Conflito conceitual CSS (absolute inset 0) vs inline (fixed 50% translate) nos overlays.

**Top 5 causas mais prováveis:**  
1. Ausência de centralização do .game-scale no viewport (mitigada no código pela Correção 1).  
2. Containing block para fixed criado por ancestral com transform/filter.  
3. Divergência entre árvore DOM (viewport/scale/stage) e árvore para a qual o CSS foi escrito.  
4. Conteúdo do goool.png diferente ou uso de variante indevida.  
5. 100dvh e possível desencontro com window.innerHeight no cálculo de scale.

**Primeiro ponto técnico que deve ser corrigido:**  
Garantir que o deployment preview use build com **centralização do stage** (display: flex, alignItems: center, justifyContent: center no .game-viewport) e validar no browser; em seguida garantir que **nenhum ancestral do body** crie containing block para os overlays (revisar transform/filter na árvore da app).

**O que parece sintoma:**  
Overlay no canto inferior esquerdo; “palco quebrado”; sensação de layout diferente da produção.

**O que parece causa raiz:**  
(1) Falta de centralização do bloco escalado no viewport (já corrigida no código). (2) Containing block para position:fixed alterado por ancestral com transform. (3) Divergência de asset e assets extras como fatores adicionais.

---

## C. Veredito final oficial

- **O preview ainda está BLOQUEADO** para promoção à produção.  
- **Existe base mínima para continuar correções:** O código atual já inclui a centralização do stage (Correção 1). Próximos passos: validar no preview que o palco está centralizado e que os overlays aparecem no centro; corrigir containing block dos overlays se necessário; alinhar DOM/CSS e tratar assets; repetir checklist visual até paridade com produção.  
- **Nenhuma alteração foi feita** em código, deploy, banco, env ou assets nesta auditoria. Documentação apenas.

---

*Documento gerado em modo READ-ONLY ABSOLUTO. Nenhum patch, commit, merge ou deploy foi aplicado. Produção intocada.*
