# BLOCO F — Restauração da /game certificada de produção para o preview

**Data:** 2026-03-17  
**Modo:** FASE 1 READ-ONLY | FASE 2 Restauração controlada apenas na branch/preview. Produção intocada.

**Referência soberana:** https://www.goldeouro.lol/game (produção atual = verdade absoluta)

---

## FASE 1 — FORENSE READ-ONLY

### 1. Diagnóstico conclusivo

- **O que a produção representa (referência documentada):**  
  A auditoria forense de 2026-03-08 (AUDITORIA-FORENSE-GAMEPLAY-VALIDADO-PRODUCAO) e o relatório BLOCO E (BLOCO-E-GAMEPLAY-CERTIFICADO-RESTAURADO) estabelecem que a **tela validada em produção** corresponde à implementação **GameFinal** com:
  - Stage fixo 1920×1080, layoutConfig.js, game-scene.css, game-shoot.css
  - Assets em `src/assets/`: goalie_idle, goalie_dive_tl/tr/bl/br/mid, ball.png, bg_goal.jpg, goool.png, defendeu.png, ganhou.png, golden-goal.png
  - HUD: SALDO, CHUTES, GANHOS, GOLS DE OURO, MENU PRINCIPAL, Recarregar, áudio
  - 5 zonas de chute, overlays de resultado centralizados

- **Estado atual do repositório (branch feature/bloco-e-gameplay-certified):**
  - **App.jsx:** rota `/game` aponta para **GameFinal** (não para GameShoot). Não há uso indevido de componente legado na rota /game.
  - **GameFinal.jsx:** existe, usa layoutConfig, game-scene.css, game-shoot.css, backend real (gameService, apiClient), imports dos 12 assets de `../assets/`, HUD com SALDO/CHUTES/GANHOS/GOLS DE OURO, MENU PRINCIPAL. Já contém **Correção 1** (centralização do viewport: flex + center) e **Correção 2** (portal para `#game-overlay-root`).
  - **GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx:** versão com backend **simulado** e viewport **sem** estilos inline de centralização; mesma estrutura visual e mesmos assets.
  - **layoutConfig.js:** existe em `src/game/`, STAGE 1920×1080, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD.
  - **Assets em src/assets/:** no workspace atual foi verificada a presença apenas de `golden-goal.png` e `golden-victory.png`. A pasta **deve** conter os 12 arquivos listados acima para o build e a experiência certificada; relatório de auditoria de assets (2026-03-17) indica que na branch do preview existiam 17 arquivos (13 da main + 4 extras). Se faltarem goalie_*, ball, bg_goal, goool, defendeu, ganhou, a build pode falhar ou usar fallbacks incorretos.

- **Conclusão:**  
  A implementação que corresponde à /game de produção é a **GameFinal** (commit 9056c2e ou equivalente no backup). No preview, a **rota já usa GameFinal** e a **estrutura de código está alinhada** à certificada (layoutConfig, CSS, HUD, overlays). As regressões visuais já tratadas foram centralização do stage (Correção 1) e containing block dos overlays (Correção 2). **Não há** uso de GameShoot nem de Game.jsx na rota /game no código atual. A possível divergência restante é: (1) **ausência ou diferença de assets** em `src/assets/` (conteúdo binário diferente do aprovado ou arquivos faltando); (2) **assets extras** (ganhou_100, ganhou_5, gol_de_ouro, gol_normal) que podem causar confusão ou uso indevido.

---

### 2. Qual implementação do projeto corresponde à /game de produção

| Item | Correspondência |
|------|------------------|
| **Componente** | **GameFinal** (`goldeouro-player/src/pages/GameFinal.jsx`) |
| **Fonte certificada no histórico** | Commit **9056c2e** — `feat(game): versão VALIDADA da página /game (pré-scale mobile)`; também documentado no backup **GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx** (backend simulado, mesma estrutura visual). |
| **Estrutura** | game-viewport → game-scale → game-stage (1920×1080); layoutConfig.js; game-scene.css + game-shoot.css. |
| **Assets certificados** | goalie_idle.png, goalie_dive_tl/tr/bl/br/mid.png, ball.png, bg_goal.jpg, goool.png, defendeu.png, ganhou.png, golden-goal.png (em `src/assets/`). |
| **Rota** | `/game` → `<ProtectedRoute><GameFinal /></ProtectedRoute>` (já é o caso no App.jsx atual). |

---

### 3. Quais arquivos do preview estão divergentes/antigos

| Situação | Arquivo / aspecto | Divergência |
|----------|-------------------|-------------|
| **Rota /game** | App.jsx | **Não divergente** — já aponta para GameFinal. |
| **Componente /game** | GameFinal.jsx | **Não legado** — é a linha certificada com backend real + Correção 1 e 2. O backup tem backend simulado; o atual é o correto para produção real. |
| **Assets** | src/assets/ | **Possível divergência:** (a) Se faltarem goalie_*, ball, bg_goal, goool, defendeu, ganhou, o build ou runtime podem falhar ou ficar incorretos. (b) Relatório de assets aponta **goool.png** com divergência visual reportada. (c) Arquivos **ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png** existem no preview e **não** são usados pelo GameFinal; risco de troca indevida. |
| **CSS** | game-scene.css, game-shoot.css | **Não divergentes** para a estrutura viewport/scale/stage; já incluem regra para #game-overlay-root. |
| **Layout** | layoutConfig.js | **Não divergente** — STAGE 1920×1080, HUD, OVERLAYS, TARGETS conforme certificado. |
| **Legado** | GameShoot.jsx, Game.jsx | **Não** usados na rota /game; usados apenas em /gameshoot ou não em rota. Nenhum deles está substituindo GameFinal na /game. |

Não foi identificado **componente legado** servindo a /game no preview; a divergência reportada é sobretudo **visual** (regressões de centralização e overlays já corrigidas no código) e possível **conteúdo de assets** ou **assets faltando**.

---

### 4. Se existe uma versão certificada pronta para restauração

**Sim.**

- **Versão certificada no repositório:**  
  - **GameFinal.jsx atual** já é a linha certificada (GameFinal + layoutConfig + assets + backend real) com as correções de viewport e overlay aplicadas.  
  - **GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx** é a variante com backend simulado e sem as correções de centralização/overlay; serve como referência visual, não para substituir o atual em produção/preview real.

- **Restauração necessária:**  
  - **Código:** Não é necessário trocar o componente da rota nem substituir GameFinal.jsx por outro arquivo; basta **garantir** que os 12 assets certificados existam em `src/assets/` e que não haja uso de assets errados (ex.: gol_normal em vez de goool).  
  - **Assets:** Se algum dos 12 arquivos estiver ausente em `src/assets/`, devem ser restaurados a partir do commit **9056c2e** (ex.: `git checkout 9056c2e -- goldeouro-player/src/assets/goalie_idle.png goldeouro-player/src/assets/goalie_dive_tl.png ...`).  
  - **Limpeza opcional:** Remover ou renomear os 4 assets não usados (ganhou_100, ganhou_5, gol_de_ouro, gol_normal) para evitar confusão, ou documentar que não devem ser usados na /game.

---

### 5. Plano mínimo de substituição

1. **Confirmar rota:** Manter `App.jsx` com `/game` → `<ProtectedRoute><GameFinal /></ProtectedRoute>` (já está assim).
2. **Confirmar assets:** Verificar em `goldeouro-player/src/assets/` a presença dos 12 arquivos: goalie_idle.png, goalie_dive_tl.png, goalie_dive_tr.png, goalie_dive_bl.png, goalie_dive_br.png, goalie_dive_mid.png, ball.png, bg_goal.jpg, goool.png, defendeu.png, ganhou.png, golden-goal.png. Se algum faltar, restaurados a partir do commit **9056c2e** (apenas na branch de trabalho, sem alterar produção).
3. **Evitar uso indevido de overlay:** Garantir que nenhum código use `gol_normal.png` nem outros assets alternativos para o overlay de gol; GameFinal usa apenas `goool.png` (import explícito).
4. **Manter correções:** Não remover Correção 1 (viewport com flex + center) nem Correção 2 (portal para `#game-overlay-root`); index.html deve manter `<div id="game-overlay-root">` e game-scene.css a regra para `#game-overlay-root`.
5. **Validação no preview:** Após build, abrir /game no preview e validar: palco centralizado, overlays (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) centralizados, mesmos assets e HUD que a produção.

---

## FASE 2 — RESTAURAÇÃO CONTROLADA NO PREVIEW (quando aplicável)

Confirmado que a versão certificada está no repositório (GameFinal + layoutConfig + estrutura CSS). A restauração no preview consiste em **garantir** assets e configuração, não em trocar o componente por outro.

### 6. Lista exata dos arquivos a alterar

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `goldeouro-player/src/App.jsx` | **Nenhuma** — já está com /game → GameFinal. |
| 2 | `goldeouro-player/src/pages/GameFinal.jsx` | **Nenhuma** — já é a implementação certificada com backend real e correções. |
| 3 | `goldeouro-player/src/game/layoutConfig.js` | **Nenhuma** — já conforme certificado. |
| 4 | `goldeouro-player/src/pages/game-scene.css` | **Nenhuma** — já inclui regra #game-overlay-root e escopo /game. |
| 5 | `goldeouro-player/src/pages/game-shoot.css` | **Nenhuma** — já usado pelo GameFinal. |
| 6 | `goldeouro-player/index.html` | **Nenhuma** — já contém `#game-overlay-root` (Correção 2). |
| 7 | `goldeouro-player/src/assets/*` | **Verificar/restaurar** — os 12 assets listados devem existir; se faltar algum, restaurar do commit 9056c2e (ver seção 8). |

Nenhuma alteração de código é obrigatória além da eventual **restauração de arquivos de asset** faltantes.

---

### 7. Código completo dos arquivos restaurados

Não há substituição de código de componente nem de rota. Os arquivos **já estão** no estado desejado:

- **App.jsx:** rota `/game` com GameFinal (já implementado).
- **GameFinal.jsx:** componente certificado com backend real, Correção 1 (viewport com display flex, alignItems center, justifyContent center) e Correção 2 (createPortal para `document.getElementById('game-overlay-root') || document.body`).
- **index.html:** contém `<div id="game-overlay-root" aria-hidden="true"></div>`.
- **game-scene.css:** contém regra para `#game-overlay-root` (pointer-events: none; position: static; transform: none).

Se em outro ambiente (ex.: clone ou branch sem as correções) o App.jsx ainda tiver `/game` → GameShoot, a alteração seria apenas:

```jsx
// Em App.jsx, rota /game:
<Route path="/game" element={
  <ProtectedRoute>
    <GameFinal />
  </ProtectedRoute>
} />
```

e o import: `import GameFinal from './pages/GameFinal'`. No estado atual do repositório isso já está assim.

---

### 8. Lista de assets que precisam ser trocados/restaurados

| Asset | Ação | Observação |
|-------|------|------------|
| goalie_idle.png | Restaurar se ausente | Do commit 9056c2e: `git checkout 9056c2e -- goldeouro-player/src/assets/goalie_idle.png` |
| goalie_dive_tl.png, goalie_dive_tr.png, goalie_dive_bl.png, goalie_dive_br.png, goalie_dive_mid.png | Restaurar se ausentes | Idem, paths em goldeouro-player/src/assets/ |
| ball.png | Restaurar se ausente | Idem |
| bg_goal.jpg | Restaurar se ausente | Idem |
| goool.png | Garantir que é o aprovado | Relatório aponta divergência visual; comparar com produção ou com cópia de 9056c2e |
| defendeu.png | Restaurar se ausente | Idem 9056c2e |
| ganhou.png | Restaurar se ausente | Idem |
| golden-goal.png | Já presente | Manter |
| golden-victory.png | Não usado pelo GameFinal | Pode permanecer; não usar na /game |
| ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png | Não usados | Remover da pasta ou documentar como proibidos para /game; reduz risco de uso indevido |

**Comando sugerido para restauração em massa** (executar na raiz do repositório, apenas na branch de trabalho):

```bash
git checkout 9056c2e -- \
  goldeouro-player/src/assets/goalie_idle.png \
  goldeouro-player/src/assets/goalie_dive_tl.png \
  goldeouro-player/src/assets/goalie_dive_tr.png \
  goldeouro-player/src/assets/goalie_dive_bl.png \
  goldeouro-player/src/assets/goalie_dive_br.png \
  goldeouro-player/src/assets/goalie_dive_mid.png \
  goldeouro-player/src/assets/ball.png \
  goldeouro-player/src/assets/bg_goal.jpg \
  goldeouro-player/src/assets/goool.png \
  goldeouro-player/src/assets/defendeu.png \
  goldeouro-player/src/assets/ganhou.png
```

(golden-goal.png já existe; pode ser restaurado também se quiser garantir paridade: `goldeouro-player/src/assets/golden-goal.png`.)

---

### 9. Checklist de validação visual no preview

- [ ] Build do player: `cd goldeouro-player && npm run build` — sucesso, sem erros de import de assets.
- [ ] Abrir a URL do preview (deploy da branch feature/bloco-e-gameplay-certified), logar e acessar `/game`.
- [ ] **Palco:** Retângulo do jogo (campo 1920×1080 escalado) centralizado na tela (horizontal e vertical).
- [ ] **Fundo:** Imagem do estádio (bg_goal) visível, sem cortes estranhos.
- [ ] **HUD:** SALDO, CHUTES, GANHOS, GOLS DE OURO, botão MENU PRINCIPAL, aposta R$ 1, Recarregar, áudio.
- [ ] **Goleiro e bola:** Imagens reais (não emoji), posições corretas.
- [ ] **5 zonas de chute:** Visíveis e clicáveis (TL, TR, C, BL, BR).
- [ ] **Overlay GOOOL:** Ao marcar gol, aparece centralizado na tela (não no canto).
- [ ] **Overlay GANHOU / DEFENDEU / GOLDEN GOAL:** Quando aplicável, centralizados.
- [ ] Comparação direta com produção: mesma sensação de composição, enquadramento e hierarquia visual.

---

### 10. Mini relatório markdown da restauração

**Resumo:** A auditoria (FASE 1) confirmou que a implementação que corresponde à /game de produção é a **GameFinal** (commit 9056c2e / backup visual validado). No repositório da branch **feature/bloco-e-gameplay-certified**, a rota `/game` **já** usa GameFinal; o código já inclui backend real e as correções de centralização do stage (Correção 1) e de containing block dos overlays (Correção 2). **Não há** componente legado servindo a /game.

**Restauração executada (FASE 2):** Os 11 assets certificados que faltavam em `goldeouro-player/src/assets/` foram restaurados a partir do commit **9056c2e**:
- goalie_idle.png, goalie_dive_tl/tr/bl/br/mid.png, ball.png, bg_goal.jpg, goool.png, defendeu.png, ganhou.png.
- golden-goal.png e golden-victory.png já existiam.
- Na pasta constam também ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png (não usados pelo GameFinal); recomenda-se não utilizá-los na /game.

Nenhuma alteração foi feita em produção nem em backend, banco ou autenticação. Todas as ações foram apenas na branch de trabalho (restauração de assets e documentação).

**Próximo passo:** Validar no preview com o checklist da seção 9 (build + abertura de /game + comparação visual com produção).

---

*Documento gerado em 2026-03-17. Produção intocada; restauração apenas no preview.*
