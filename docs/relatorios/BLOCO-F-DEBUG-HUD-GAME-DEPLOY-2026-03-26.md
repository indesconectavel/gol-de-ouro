# DEBUG — HUD /game não refletido no preview

## 1. Estado do CSS local

Arquivo verificado: `goldeouro-player/src/pages/game-scene.css`.

Evidências locais:
- `.bet-label` está em `font-size: 15px`.
- `.bet-value-fixed` existe com `font-size: 15px`, `font-weight: 600`, `color: #fbbf24`.

Resposta objetiva:
- CSS local está correto? **sim**.

## 2. Cadeia de importação de estilos

Arquivo verificado: `goldeouro-player/src/pages/GameFinal.jsx`.

Importação encontrada:
- `import './game-scene.css';`
- `import './game-shoot.css';`

Controle real do HUD:
- O HUD de `/game` renderizado em `GameFinal` usa principalmente classes de `game-scene.css` (`.hud-header`, `.hud-stats`, `.stat-*`, `.bet-*`).
- Porém `game-shoot.css` é importado **depois** no mesmo componente e ainda contém algumas regras globais (ex.: `.bet-label`) que podem prevalecer por ordem de carregamento.

Risco de prevalência por outro CSS:
- **sim**, existe risco real por ordem + seletor global.

## 3. Análise de conflitos de CSS

### 3.1 `stat-*`
- Em `game-shoot.css`, as regras de stats foram escopadas para `.gs-hud .stat-*`.
- Em `GameFinal`, o HUD usa `.hud-header` e não `.gs-hud`.
- Classificação de conflito para `stat-*`: **improvável**.

### 3.2 `bet-label`
- Em `game-scene.css`: `.bet-label { font-size: 15px; }`
- Em `game-shoot.css`: `.bet-label { font-size: 12px; }` (global, sem `.gs-hud`).
- Como `game-shoot.css` é importado depois, a regra de 12px pode sobrescrever.
- No bundle do deploy (`index-BSDYyLE4.css`), ambos existem e a ordem confirma:
  - `idx15=18765`
  - `idx12=28066` (mais ao final, portanto prevalece)
- Classificação de conflito para `.bet-label`: **provável**.

### 3.3 `bet-value-fixed` (cor)
- A regra existe no bundle:
  - `.bet-value-fixed{font-size:15px;font-weight:600;color:#fbbf24}`
- Também existe regra global mais forte no mesmo bundle:
  - `body[data-page=game] .hud-header ... div ... {color:#fff!important}`
- Como `.bet-value-fixed` é um `div`, essa regra força branco via `!important`.
- Classificação de conflito para cor da linha de aposta: **provável**.

### 3.4 `hud-header`
- Não foi encontrada regra em `game-shoot.css` sobrescrevendo diretamente `.hud-header` do `GameFinal`.
- Classificação de conflito em `.hud-header`: **improvável**.

## 4. Análise do bundle

Deploy analisado (commit `7be6f24`):
- URL de preview player: `https://goldeouro-player-1la7tqo85-goldeouro-admins-projects.vercel.app`
- Asset CSS: `/assets/index-BSDYyLE4.css`

Prova de inclusão do CSS novo no bundle:
- `.bet-label{font-size:15px` -> **True**
- `.bet-value-fixed` -> **True**
- `width:68px` e `max-height:68px` -> **True**
- `.btn-partida,.btn-dashboard ... line-height:1.2 ... font-size:.9375rem` -> **True**

Conclusão desta secção:
- `game-scene.css` está incluído no bundle final.
- Não há evidência de tree-shaking removendo o CSS do HUD.
- Não há evidência de import condicional impedindo carga no `/game` (o CSS está no bundle global do app).

## 5. Análise de escala (transform)

Arquivo: `GameFinal.jsx`.

Evidência:
- `gameScaleStyle` aplica `transform: scale(${gameScale})`.
- `gameScale` é calculado por `Math.min(window.innerWidth/1920, window.innerHeight/1080)`.

Interpretação técnica:
- Em telas comuns (ex.: largura menor que 1920), `scale < 1` e reduz visualmente **todo** o stage, incluindo HUD.
- Isso não impede aplicação do CSS novo, mas reduz percepção final de tamanho.

Classificação de impacto:
- **alto**.

## 6. Componente realmente renderizado

Arquivo: `goldeouro-player/src/App.jsx`.

Rota `/game`:
- `<Route path="/game" element={<ProtectedRoute><GameFinal /></ProtectedRoute>} />`

Componente de HUD em runtime:
- `/game` renderiza `GameFinal` (quando autenticado).
- `fallback` `.gs-hud` (`GameShootFallback`) é outro componente e não é a rota `/game` no `App.jsx`.

Possibilidade de estar vendo fallback `.gs-hud` em `/game`:
- **improvável** pelo roteamento atual.

## 7. Hipótese principal

**CSS está sendo sobrescrito.**

O deploy do commit `7be6f24` contém o CSS novo, mas há conflito efetivo de cascata no próprio bundle final: a regra global `.bet-label` de `game-shoot.css` (12px) aparece depois da regra de 15px de `game-scene.css`, e uma regra com `!important` em `body[data-page=game] .hud-header ... div` força texto branco, neutralizando a cor da `.bet-value-fixed`. Resultado: a linha de aposta não reflete o visual esperado mesmo com deploy correto.

## 8. Evidência técnica

Evidência concreta (bundle de produção do deploy `7be6f24`):

- Ordem conflitante para `.bet-label`:
  - `.bet-label{font-size:15px` em `idx15=18765`
  - `.bet-label{font-size:12px` em `idx12=28066` (prevalece por ordem)

- Regra que força cor branca com `!important`:
  - `body[data-page=game] .hud-header .text-sm, body[data-page=game] .hud-header .text-xs, body[data-page=game] .hud-header span, body[data-page=game] .hud-header div, ... {color:#fff!important}`

## 9. Conclusão

- O commit `7be6f24` **foi deployado** e o bundle contém as regras novas do HUD.
- O problema de “não refletir” não é ausência de build/import.
- A causa mais forte, comprovada por evidência, é **sobrescrita de CSS no bundle final** (ordem + `!important`) afetando a linha de aposta.
- Existe ainda um fator estrutural adicional de percepção: `transform: scale(gameScale)` pode reduzir todo o HUD em telas menores, com impacto visual alto.
