# BLOCO F — AUDITORIA TOTAL FINAL DA /game

**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhum arquivo de código/config alterado; nenhum patch, commit, merge, deploy, rollback ou promote.  
**Objetivo:** Coletar evidências observáveis para encerrar o diagnóstico do overlay de resultado deslocado (ex.: DEFENDEU) no preview.

---

## 1. Resumo executivo

- **Código-fonte:** A rota `/game` usa apenas **GameFinal.jsx**. Overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) são renderizados via **createPortal** exclusivamente para `document.getElementById('game-overlay-root')` — **não há fallback para `document.body`** no código atual (linhas 757–760). Estilos inline nos `<img>` são `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`. Keyframes em **game-shoot.css** (`pop`, `gooolPop`, `ganhouPop`) incluem `translate(-50%,-50%)` em todos os passos. **game-scene.css** escopa `.gs-golden-goal` e `.gs-golden-victory` a `.game-stage`, portanto não se aplicam ao overlay no portal. **#game-overlay-root** está presente em **index.html** (e no **dist/index.html**) como filho direto de `body`, com regras CSS `position: static; transform: none; filter: none`.
- **Build local (dist):** O `dist/` contém `#game-overlay-root` no HTML e assets com hash (ex.: goool-CFZuq7e1.png, defendeu-BDg11Idl.png, ganhou-kJElw5zr.png). O diretório **src/assets/** no workspace atual contém apenas **golden-goal.png** e **golden-victory.png** — **goool.png, defendeu.png, ganhou.png** (e outros usados pelo GameFinal) **não estão presentes** no tree atual; o build em dist foi gerado a partir de um estado em que esses arquivos existiam.
- **Runtime produção/preview:** Não foi possível inspecionar o DOM com overlay visível: acesso a https://www.goldeouro.lol/game redireciona para login; não há credenciais para autenticar e disparar um chute. A URL de preview da branch `feature/bloco-e-gameplay-certified` não foi acessada (preview Vercel não identificada no repositório). Portanto **não há evidência real de runtime** (computed styles, boundingClientRect, parent chain, src final) para produção nem para preview — apenas inferência a partir do código e do relatório anterior **BLOCO-F-INSPECAO-RUNTIME-RESULTADO-VISIVEL-2026-03-17.md**, que já descreve o protocolo de inspeção manual no Console quando o overlay estiver visível.

---

## 2. Estado do código-fonte

| Arquivo | Evidência |
|--------|-----------|
| **App.jsx** | Rota `/game` renderiza `<GameFinal />` (linhas 51–55). Nenhum outro componente para /game. |
| **GameFinal.jsx** | Imports goool.png, defendeu.png, ganhou.png, golden-goal.png de `../assets/` (46–49). Overlays via createPortal com container `document.getElementById('game-overlay-root')` apenas — sem fallback para body (757–760). Estilos inline em cada `<img>`: position fixed, top/left 50%, transform translate(-50%,-50%), zIndex 10000+, width/height de OVERLAYS.SIZE, animation gooolPop/ganhouPop/pop. Classes: gs-goool, gs-ganhou, gs-defendeu, gs-golden-goal. |
| **layoutConfig.js** | OVERLAYS.SIZE: GOOOL 520×200, DEFENDEU 520×200, GANHOU 480×180, GOLDEN_GOAL 600×220. Nenhuma referência a arquivos de imagem. |
| **game-scene.css** | #game-overlay-root: pointer-events none; position static; transform none; filter none; will-change auto; contain none (linhas 5–12). .game-stage .gs-golden-goal e .game-stage .gs-golden-victory: position absolute; top 20%/30%; left 50%; transform translateX(-50%); animações goldenGoalPop/goldenVictoryPop (335–355). Essas regras **não** se aplicam ao overlay no portal (fora de .game-stage). |
| **game-shoot.css** | .gs-goool, .gs-defendeu, .gs-ganhou: position absolute; inset 0; margin auto; width/height; z-index 8/9; pointer-events none; animações gooolPop, pop, ganhouPop (523–535). Keyframes pop, gooolPop, ganhouPop incluem **translate(-50%,-50%)** em todos os passos (537–549). |
| **index.html** | `<div id="game-overlay-root" aria-hidden="true"></div>` como filho direto de body, após #root (linhas 19–21). |
| **Referências a assets** | GameFinal.jsx é o único que referencia goool.png, defendeu.png, ganhou.png, golden-goal.png na rota /game. ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png **não** são referenciados em GameFinal nem na rota /game. |
| **Outros componentes** | GameShootSimple.jsx e GameShootFallback.jsx usam classes .gs-goool/.gs-defendeu mas são usados nas rotas /gameshoot e /gameshoottest, **não** em /game. |

---

## 3. Estado do build do preview

- **Commit/build:** Não foi possível confirmar qual commit está rodando no preview da branch `feature/bloco-e-gameplay-certified` (URL de preview não acessada).
- **Build local (dist):** O arquivo `goldeouro-player/dist/index.html` contém `#game-overlay-root` e carrega `/assets/index-CgN1p04S.js` e `/assets/index-BhrHSN8R.css`. Em `dist/assets/` existem: goool-CFZuq7e1.png, defendeu-BDg11Idl.png, ganhou-kJElw5zr.png (e demais assets do jogo). Ou seja, o build local foi gerado a partir de um estado em que os assets goool/defendeu/ganhou existiam em src/assets.
- **Divergência código vs build:** No workspace atual, **src/assets/** tem apenas golden-goal.png e golden-victory.png. Um build novo a partir do estado atual falharia por imports quebrados (goool, defendeu, ganhou, ball, bg_goal, goalie_*). Conclusão: o código no disco atual está **incompleto** em relação ao que o dist e o GameFinal esperam, ou o repositório está em estado parcial (ex.: assets em outro branch/pasta).

---

## 4. Estrutura DOM real do preview

**Pendente por limitação técnica.** Para obter a estrutura DOM real do preview com overlay visível é necessário: (1) URL do deploy de preview da branch; (2) login; (3) disparar um chute que exiba DEFENDEU/GOOOL/GANHOU; (4) executar no Console o script de inspeção (documentado em BLOCO-F-INSPECAO-RUNTIME-RESULTADO-VISIVEL-2026-03-17.md).  
**Inferência a partir do código:** Esperado: body > #root (app React) + #game-overlay-root; overlay `<img>` filho direto de #game-overlay-root; **não** dentro de .game-stage nem .game-scale.

---

## 5. Elemento visual de resultado encontrado no preview

**Pendente por limitação técnica.** Inferência: o elemento visível deve ser o `<img>` renderizado por createPortal em GameFinal.jsx, com classe gs-defendeu/gs-goool/gs-ganhou/gs-golden-goal, src apontando para o asset correspondente (path com hash em build), filho de #game-overlay-root.

---

## 6. Computed styles reais do preview

**Pendente por limitação técnica.** Esperado (inline vence sobre classes): position fixed; top 50%; left 50%; transform translate(-50%, -50%) ou valor do keyframe no momento; z-index 10000+; width/height em px conforme OVERLAYS.SIZE. Se em runtime aparecer position absolute ou transform sem translate(-50%,-50%), a regra de **game-shoot.css** (.gs-* com position absolute; inset 0; margin auto) ou um containing block terá efeito.

---

## 7. Assets reais carregados no preview

**Pendente por limitação técnica.** No build local (dist): goool-CFZuq7e1.png, defendeu-BDg11Idl.png, ganhou-kJElw5zr.png. Para o preview ao vivo seria necessário inspecionar `el.currentSrc` ou el.src no Console com overlay visível.

---

## 8. Estrutura DOM real da produção

**Pendente por limitação técnica.** Acesso a https://www.goldeouro.lol/game resulta em redirecionamento para a tela de login; não foi possível carregar a /game logada nem inspecionar o DOM com overlay.

---

## 9. Elemento visual de resultado encontrado na produção

**Pendente por limitação técnica.** Idem seção 5, para produção.

---

## 10. Computed styles reais da produção

**Pendente por limitação técnica.** Idem seção 6, para produção.

---

## 11. Assets reais carregados na produção

**Pendente por limitação técnica.** Seria necessário inspecionar na produção o src/currentSrc do `<img>` de overlay quando visível.

---

## 12. Diferenças exatas preview vs produção

**Não foi possível obter diferenças exatas** por ausência de dados de runtime em ambos os ambientes. Relatórios anteriores apontam: (1) possível containing block no preview se o portal tivesse fallback para body ou se #game-overlay-root tivesse ancestral com transform; (2) keyframes sem translate(-50%,-50%) em builds antigos; (3) regra legada .gs-golden-goal em game-scene.css (já escopada a .game-stage no código atual). No **código atual** não há fallback para body e os keyframes têm translate(-50%,-50%); a diferença restante só pode ser confirmada com inspeção real (protocolo manual).

---

## 13. Regra CSS/arquivo que vence e causa o deslocamento

- **No código atual:** O posicionamento dos overlays é definido por **estilo inline** no GameFinal.jsx (position fixed, top/left 50%, transform translate(-50%,-50%)). Esse inline tem prioridade sobre as regras de classe em game-shoot.css (.gs-goool, .gs-defendeu, .gs-ganhou com position absolute; inset 0; margin auto). Portanto, em teoria, **nenhuma regra de arquivo CSS “vence”** sobre o inline para position/transform.
- **Cenários em que o overlay pode aparecer deslocado:** (1) **Containing block:** algum ancestral de #game-overlay-root (ou do nó onde o portal é renderizado, se por bug for outro) tem `transform`, `filter` ou `perspective` — então `position: fixed` deixa de ser relativo à viewport e passa a ser relativo a esse ancestral; (2) **Build/ordem de carregamento:** em um build antigo ou em hidração, o inline pode não estar aplicado e as regras de game-shoot.css (position absolute; inset 0; margin auto) passariam a valer; com pai #game-overlay-root (static), o containing block seria o viewport e “inset 0; margin auto” centralizaria — a menos que o pai tenha tamanho/posição diferente em outro build; (3) **Regra .game-stage .gs-golden-goal** em game-scene.css só se aplica dentro de .game-stage; se por engano existisse um overlay dentro do stage (não encontrado no código da /game), essa regra deslocaria (top 20%; left 50%; translateX(-50%)).

**Arquivo mais suspeito para deslocamento (conceitual):** **game-scene.css** (regras .game-stage .gs-golden-goal / .gs-golden-victory) — só afetariam elemento dentro do stage; **game-shoot.css** (regras globais .gs-goool, .gs-defendeu, .gs-ganhou) — poderiam afetar se o inline não estivesse presente. Sem dados de runtime não é possível afirmar qual regra “vence” no preview.

---

## 14. Causa raiz final

Com base **apenas em código e build local** (sem evidência de runtime):

1. **Não** é duplicidade de elemento: uma única origem de overlays de resultado (createPortal para #game-overlay-root).
2. **Não** é asset trocado no código: GameFinal usa apenas goool.png, defendeu.png, ganhou.png, golden-goal.png.
3. **Possível causa** é **posicionamento:**
   - **Containing block:** em algum deploy do preview, o portal poderia estar caindo em um container com transform (ex.: fallback para body em versão antiga) ou #game-overlay-root poderia ter estilo diferente.
   - **CSS vencendo sobre inline:** em edge case (build/hidração), as regras .gs-* em game-shoot.css (position absolute) poderiam aplicar e o containing block do pai determinaria a posição.
   - **Regra legada:** .game-stage .gs-golden-goal em game-scene.css não se aplica ao portal; só seria causa se houvesse overlay dentro do stage (não documentado no código).

**Causa raiz só pode ser confirmada** com a execução do protocolo de inspeção manual no preview (parent chain, computed position/transform, in #game-overlay-root vs in .game-stage) quando o overlay estiver visível.

---

## 15. Correção mínima recomendada (conceitual, sem aplicar)

- **Garantir** que o portal use **apenas** `document.getElementById('game-overlay-root')` (já é o caso no código atual; sem fallback para body).
- **Garantir** que **game-scene.css** não aplique transform/filter em #game-overlay-root nem em ancestrais (já é o caso).
- **Opcional (limpeza):** Escopar em **game-shoot.css** as regras `.gs-goool`, `.gs-defendeu`, `.gs-ganhou` a um contexto que não inclua o portal (ex.: só quando dentro de .game-stage), para evitar que em qualquer edge case essas regras alterem posição do overlay do portal. Ou documentar que o posicionamento é controlado apenas pelo inline do GameFinal.
- **Opcional:** Remover ou manter escopo `.game-stage` para `.gs-golden-goal` e `.gs-golden-victory` em game-scene.css (já escopado).
- **Repor** em **src/assets** os arquivos goool.png, defendeu.png, ganhou.png (e demais usados pelo GameFinal) se o build for refeito a partir do estado atual do repositório.

---

## 16. Veredito final

- **Código atual:** Consistente com overlay único no portal (#game-overlay-root), estilos inline centralizados e keyframes com translate(-50%,-50%). Não há fallback para body.
- **Evidência de runtime:** **Não coletada** — produção e preview não acessíveis com /game logada e overlay visível; inspeção com getComputedStyle/boundingClientRect/parent chain não foi executada.
- **Diagnóstico encerrado apenas por inferência:** Não. Para encerrar com **evidência real** é necessário executar o protocolo de inspeção manual (BLOCO-F-INSPECAO-RUNTIME-RESULTADO-VISIVEL-2026-03-17.md) no preview (e se possível na produção) com overlay visível e registrar: tag, className, src, parent chain, in #game-overlay-root?, in .game-stage?, computed position/transform/top/left, boundingClientRect, total de elementos com as classes de resultado.
- **BLOCO F:** Permanece **BLOQUEADO** para go-live até confirmação com dados reais de runtime ou até aplicação e validação das correções mínimas recomendadas.

---

## A. Tabela mestra

| Item | Preview | Produção | Evidência | Severidade | Arquivo responsável |
|------|---------|-----------|-----------|------------|----------------------|
| #game-overlay-root no HTML | Esperado sim (código) | Esperado sim (código) | index.html / dist/index.html | — | index.html |
| Portal usa só #game-overlay-root | Sim (código) | Sim (código) | GameFinal.jsx 757–760 | — | GameFinal.jsx |
| Estilos inline position/transform | fixed; 50%; translate(-50%,-50%) | Idem | GameFinal.jsx 769–772 etc. | — | GameFinal.jsx |
| Keyframes com translate(-50%,-50%) | Sim | Sim | game-shoot.css 538–549 | — | game-shoot.css |
| .game-stage .gs-golden-goal (não afeta portal) | Escopado | Escopado | game-scene.css 335–344 | Baixa | game-scene.css |
| .gs-goool/.gs-defendeu/.gs-ganhou (absolute) | Só se inline falhar | Idem | game-shoot.css 523–535 | Média (edge case) | game-shoot.css |
| Overlay no DOM (parent chain) | Não coletado | Não coletado | Runtime pendente | — | — |
| Computed position/transform | Não coletado | Não coletado | Runtime pendente | — | — |
| src/currentSrc do img | Não coletado | Não coletado | Runtime pendente | — | — |
| Duplicidade de elementos | Não no código | Não no código | Uma única createPortal | — | GameFinal.jsx |
| Assets em src/assets (workspace) | goool/defendeu/ganhou ausentes | — | Glob src/assets | Alta (build quebrado) | src/assets |

---

## B. Respostas objetivas

| Pergunta | Resposta (código / inferência) | Evidência real |
|----------|-------------------------------|----------------|
| O elemento visível está em #game-overlay-root ou .game-stage? | Esperado: #game-overlay-root (único createPortal para esse id). | **Pendente** — inspeção manual no preview. |
| position final é fixed ou absolute? | Esperado: **fixed** (inline no JSX). | **Pendente** — getComputedStyle no preview. |
| transform final contém translate(-50%, -50%) ou não? | Esperado: **sim** (inline e keyframes). | **Pendente** — getComputedStyle no preview. |
| src real é o asset aprovado ou não? | Código usa goool.png, defendeu.png, ganhou.png, golden-goal.png. Build dist tem hashes (goool-CFZuq7e1.png etc.). | **Pendente** — el.currentSrc no preview. |
| Existe duplicidade ou não? | **Não** no código (uma única camada de overlay). | **Pendente** — querySelectorAll no preview. |
| Qual regra/arquivo está empurrando o elemento para a direita? | Sem runtime: possíveis containing block ou regras .gs-* se inline não aplicar; game-scene.css só afeta elementos dentro de .game-stage. | **Pendente** — inspeção de computed + pais. |

---

## C. Saída final curta

1. **O que está de fato acontecendo:** No código atual, o overlay de resultado (DEFENDEU/GOOOL etc.) é o único desenhado via createPortal para #game-overlay-root, com estilos inline centralizados e keyframes com translate(-50%,-50%). No preview foi reportado overlay “deslocado para a direita”; sem inspeção real de runtime não é possível afirmar se o elemento visível é esse mesmo ou outro, nem qual position/transform/src está aplicado.

2. **Onde está o bug real:** Se o deslocamento persistir no preview com o código atual, o bug pode estar em: (a) containing block (ancestral com transform no preview); (b) regras em **game-shoot.css** (.gs-goool, .gs-defendeu, .gs-ganhou com position absolute) vencendo em edge case; (c) regra em **game-scene.css** (.game-stage .gs-golden-goal) apenas se existir overlay dentro do stage (não previsto no código).

3. **Qual arquivo exato deve ser corrigido depois:** **game-shoot.css** (linhas 523–535) — escopar ou remover/ajustar as regras .gs-goool, .gs-defendeu, .gs-ganhou para não afetar elementos fora do stage; e/ou **game-scene.css** (335–355) — manter escopo .game-stage para .gs-golden-goal/.gs-golden-victory. Opcional: garantir em GameFinal.jsx que não haja nenhum fallback para body (já garantido).

4. **Qual correção mínima resolveria:** Escopar em game-shoot.css as regras de overlay a um seletor que não inclua os filhos de #game-overlay-root (ex.: `.game-stage .gs-goool` etc.), de modo que no portal só os estilos inline do GameFinal determinem posição; e garantir que #game-overlay-root e seus ancestrais não tenham transform/filter.

5. **Se o BLOCO F segue BLOQUEADO ou não:** **BLOQUEADO** até confirmação com evidência real de runtime (protocolo de inspeção manual no preview) ou até aplicação e validação da correção mínima acima.

---

*Documento gerado em 2026-03-17. READ-ONLY. Nenhuma alteração de código, deploy ou produção aplicada.*
