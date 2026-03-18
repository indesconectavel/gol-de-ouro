# BLOCO F — Fechamento oficial e playbook

**Data:** 2026-03-17  
**Documento:** Fechamento oficial do incidente + protocolo para evitar retrabalho.  
**Referência soberana:** Produção https://www.goldeouro.lol/game — intocável.

---

## 1. Resumo do incidente

O **BLOCO F** tratou da interface da rota **/game** (componente GameFinal, stage 1920×1080, HUD e overlays de resultado). No **preview** (branch `feature/bloco-e-gameplay-certified`) apareceram regressões visuais: palco ancorado no canto em vez de centralizado, e overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) deslocados para o canto em vez do centro da tela. A produção estava correta; o objetivo foi diagnosticar e corrigir **apenas no preview**, sem alterar produção.

**Resumo em uma frase:** Dois problemas de **posicionamento** — (1) stage não centralizado no viewport e (2) overlays com containing block errado + keyframes sobrescrevendo o `transform` de centralização — foram corrigidos em sequência; hipóteses de “overlay duplicado” e “asset errado” consumiram tempo e não eram a causa.

---

## 2. Sintomas observados

| Sintoma | Onde | Gravidade |
|--------|------|-----------|
| Palco 1920×1080 ancorado no **canto superior esquerdo** | Preview /game | Crítica |
| Overlays (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) no **canto** ou **deslocados para a direita** | Preview /game | Crítica |
| `position: fixed` com `top: 50%`, `left: 50%` **não** centralizando na tela | Runtime | Crítica |
| Sensação de “dois centros” ou overlay que “pula” no início da animação | Runtime | Alta |
| Possível divergência visual do asset GOOOL | Relatórios de assets | Média (não era causa raiz) |

---

## 3. Hipóteses que consumiram tempo

| Hipótese | Por que não era a causa | Tempo perdido |
|----------|-------------------------|----------------|
| **Renderização duplicada** (dois overlays) | Forense confirmou: **uma única** camada — createPortal para um único destino. Não existe overlay de resultado dentro do stage na /game. | Alto |
| **Asset errado** (goool.png, ganhou_100, gol_normal, etc.) | GameFinal usa apenas goool.png, ganhou.png, defendeu.png, golden-goal.png. Os 4 estão corretos; arquivos extras no repo **não** são usados na /game. | Médio |
| **Toast competindo com overlay** | Toast é texto no canto (top-right); overlay é imagem central. Camadas distintas e complementares. | Baixo |
| **Falta de #game-overlay-root no HTML** | index.html **já tinha** o nó como filho direto de body. O problema era o **fallback para document.body** no JS quando o portal usava body. | Médio |
| **Keyframes “errados” (animação quebrada)** | Não era “animação errada” e sim **posicionamento durante a animação**: keyframes com só `scale()` sobrescreviam o `translate(-50%,-50%)` inicial. Correção: incluir translate em todos os passos. | Médio |
| **Regra .gs-golden-goal em game-scene.css “ativa”** | Regra é legado; o inline do GameFinal prevalece. O risco era edge case; não era a causa do bug principal. | Baixo |
| **DOM/CSS desalinhado** (.game-page, #stage-root) | CSS escrito para árvore antiga não se aplica ao DOM real (viewport → scale → stage). Contexto importante, mas **não** era a causa direta do overlay deslocado. | Médio |

**Lição:** Fazer **forense primeiro** (uma única camada? qual containing block? keyframes com translate?) evita corrigir no lugar errado.

---

## 4. Causa raiz verdadeira

**Posicionamento incorreto**, em duas partes:

1. **Stage não centralizado:** O container `.game-viewport` não tinha layout de centralização (`display: flex`, `alignItems: center`, `justifyContent: center`). O bloco 1920×1080 escalado ficava ancorado no canto superior esquerdo.
2. **Overlays deslocados:**  
   - **Estrutural:** O portal usava `document.getElementById('game-overlay-root') || document.body`. O fallback para `body` permitia que, em alguns builds/contextos, os nós ficassem em um ancestral que cria **containing block** para `position: fixed` (ex.: wrapper com `transform`), deslocando o overlay.  
   - **Animação:** Em game-shoot.css, os keyframes `gooolPop`, `ganhouPop` e `pop` usavam só `transform: scale(...)`, sobrescrevendo o `translate(-50%,-50%)` inicial e deslocando o centro durante a animação.

**Não era:** duplicação de overlay, asset incorreto ou toast.

---

## 5. Arquivos críticos

| Arquivo | Função |
|---------|--------|
| **goldeouro-player/src/App.jsx** | Rota `/game` → `<GameFinal />`. Nunca usar GameShoot/GameShootSimple/GameShootFallback na /game. |
| **goldeouro-player/index.html** | Deve ter `<div id="game-overlay-root" aria-hidden="true"></div>` como **filho direto de body**, após `#root`. |
| **goldeouro-player/src/pages/GameFinal.jsx** | Único componente da /game. Viewport com flex + center (Correção 1). Portal **somente** para `document.getElementById('game-overlay-root')` — **sem** fallback para body (Correção 2 + correção final). |
| **goldeouro-player/src/pages/game-scene.css** | `#game-overlay-root`: position static; transform none; filter none; will-change auto; contain none (não criar containing block). Regras `.gs-golden-goal` / `.gs-golden-victory` escopadas a `.game-stage`. |
| **goldeouro-player/src/pages/game-shoot.css** | Keyframes `pop`, `gooolPop`, `ganhouPop` devem incluir **translate(-50%,-50%)** em **todos** os passos da animação. |
| **goldeouro-player/src/game/layoutConfig.js** | OVERLAYS.SIZE (dimensões); posição do overlay é fixed 50% + translate no JSX. |

---

## 6. Ordem correta de debug

Seguir esta ordem evita perder tempo com hipóteses erradas:

1. **Confirmar rota:** App.jsx → `/game` deve renderizar **GameFinal** (não GameShoot nem outro).
2. **Confirmar destino do portal:** GameFinal deve usar **apenas** `document.getElementById('game-overlay-root')`, **sem** fallback para `document.body`.
3. **Confirmar HTML:** index.html com `#game-overlay-root` como filho direto de body.
4. **Confirmar CSS do container:** `#game-overlay-root` com position static; transform none; filter none (e, se aplicável, will-change auto; contain none) — não criar containing block.
5. **Confirmar keyframes:** Em game-shoot.css, `pop`, `gooolPop`, `ganhouPop` com **translate(-50%,-50%)** em todos os passos (não só scale).
6. **Confirmar centralização do stage:** `.game-viewport` com display flex, alignItems center, justifyContent center.
7. **Descartar duplicação:** Uma única chamada createPortal por tipo de overlay; nenhum overlay de resultado dentro de .game-stage.
8. **Descartar asset errado:** Imports em GameFinal = goool, ganhou, defendeu, golden-goal; não usar ganhou_100, gol_normal, etc. na /game.

---

## 7. Ordem correta de correção

Ordem que resolve o incidente sem retrabalho:

1. **Centralização do stage (Correção 1):** No `.game-viewport` (GameFinal.jsx), adicionar `display: 'flex'`, `alignItems: 'center'`, `justifyContent: 'center'` no estilo inline. Nada em scale/stage/dimensões.
2. **Container dedicado e sem fallback para body:**  
   - Garantir `#game-overlay-root` no index.html (filho direto de body).  
   - No GameFinal.jsx, portal usar **somente** `document.getElementById('game-overlay-root')`; se não existir, retornar `null` (nunca usar `document.body`).
3. **CSS do container:** Em game-scene.css, `#game-overlay-root` com position static; transform none; filter none; will-change auto; contain none.
4. **Keyframes:** Em game-shoot.css, em todo keyframe que altera `transform` nos overlays, usar `transform: translate(-50%,-50%) scale(...)`, nunca só `scale()`.
5. **Legado (opcional):** Escopar ou remover regras que apliquem position/transform a `.gs-golden-goal` / `.gs-golden-victory` fora do portal (ex.: `.game-stage .gs-golden-goal`).
6. **Validar:** Build, abrir /game no preview, chute gol/defesa/gol de ouro, redimensionar janela; palco e overlays centralizados.

---

## 8. O que nunca fazer novamente

- **Não** usar `document.body` como destino do portal de overlays. Usar **só** `#game-overlay-root`.
- **Não** colocar overlays de resultado dentro de `.game-scale` ou `.game-stage` (evitar containing block por transform).
- **Não** adicionar `transform`, `filter` ou `perspective` em `#game-overlay-root` nem em ancestrais até body.
- **Não** criar keyframes de overlay que sobrescrevam o transform sem manter `translate(-50%,-50%)` quando o elemento for centralizado com top/left 50%.
- **Não** adicionar regras CSS globais para `.gs-goool`, `.gs-ganhou`, `.gs-defendeu`, `.gs-golden-goal` que forcem position/transform diferente do inline do GameFinal; se precisar de regra, escopar ao stage.
- **Não** trocar a rota /game para GameShoot, GameShootSimple ou GameShootFallback sem documentar e validar overlays.
- **Não** corrigir “overlay duplicado” ou “asset errado” sem antes confirmar no código e no forense que há uma única camada e que o problema é posicionamento.
- **Não** promover preview para produção sem rodar o checklist de validação da /game.

---

## 9. Checklist antes de validar preview

Antes de considerar a /game estável ou antes de qualquer deploy:

- [ ] **Build:** `cd goldeouro-player && npm run build` — sucesso.
- [ ] **HTML:** index.html contém `<div id="game-overlay-root">` como filho direto de body.
- [ ] **Portal:** GameFinal usa somente `getElementById('game-overlay-root')`; nenhum fallback para `document.body`.
- [ ] **Stage:** Palco 1920×1080 centralizado na tela (flex + center no .game-viewport).
- [ ] **Gol:** Overlay GOOOL no centro da tela (horizontal e vertical).
- [ ] **Ganhou:** Após GOOOL, overlay GANHOU centralizado.
- [ ] **Defesa:** Overlay DEFENDEU centralizado.
- [ ] **Gol de ouro:** Overlay GOLDEN GOAL centralizado (sem desvio para cima/lados).
- [ ] **Redimensionar:** Janela redimensionada; palco e overlays permanecem centralizados.
- [ ] **Produção:** Nenhuma alteração em produção sem seguir este playbook.

---

## 10. Lições aprendidas

- **position: fixed** é relativo ao **containing block**; se um ancestral tiver `transform`, o fixed passa a ser relativo a esse ancestral, não à viewport. Por isso o portal deve ir para um nó fora de qualquer container com transform (ex.: #game-overlay-root, filho direto de body).
- **Keyframes** que definem `transform` substituem o valor inicial do elemento durante a animação. Para manter centralização, incluir `translate(-50%,-50%)` em **todos** os passos do keyframe, não só `scale()`.
- **Fallback para body** parece inofensivo mas acopla os overlays à árvore da app; um único wrapper com transform quebra o posicionamento. Destino único e dedicado (#game-overlay-root) evita isso.
- **Forense antes de corrigir:** confirmar se o problema é duplicação, asset ou posicionamento evita correções no lugar errado (ex.: trocar assets ou “remover overlay duplicado” que não existia).
- **Produção como referência:** não alterar produção; usar como verdade visual e comparar o preview contra ela após cada correção.
- **Ordem das correções:** centralizar o stage primeiro; em seguida garantir containing block e keyframes dos overlays. Corrigir só overlays com stage no canto não resolve a sensação de “tudo errado”.

---

## 11. Status final do BLOCO F

| Item | Status |
|------|--------|
| **Causa raiz** | Identificada e documentada: posicionamento (stage + containing block + keyframes). |
| **Correção 1 (centralização do stage)** | Aplicada: flex + center no .game-viewport. |
| **Correção 2 (portal para #game-overlay-root)** | Aplicada: container no HTML + portal com fallback para body (depois removido na correção final). |
| **Correção final (sem fallback para body)** | Aplicada: portal usa somente #game-overlay-root; CSS do container reforçado (filter none, will-change auto, contain none). |
| **Keyframes** | Corrigidos: translate(-50%,-50%) em todos os passos de pop, gooolPop, ganhouPop. |
| **Produção** | Intocada. |
| **Preview** | Deve ser validado com o checklist da seção 9 antes de promoção. |
| **Documentação** | Playbook anti-retrabalho (BLOCO-F-PLAYBOOK-ANTI-RETRABALHO-GAME-RESULTADOS), forense final (BLOCO-F-FORENSE-FINAL-SISTEMA-VISUAL-RESULTADO), correções 1 e 2 e correção final documentadas. |

**Veredito:** BLOCO F tecnicamente **encerrado** no código (causa raiz corrigida, ordem de correção aplicada). A **reaprovação oficial** do preview depende da validação manual com o checklist da seção 9 e da confirmação de paridade visual com produção.

---

*Documento oficial. Utilizar como protocolo pela equipe. Atualizar quando houver mudanças estruturais na /game ou no sistema de overlays.*
