# BLOCO F — /game — Validação final da escala do HUD

**Data:** 2026-03-26  
**Modo:** validação read-only (código + raciocínio técnico). **Não** foi feita validação visual em browser nesta sessão.

---

## 1. Resumo executivo

A cirurgia documentada em `BLOCO-F-GAME-HUD-CIRURGIA-ESCALA-2026-03-26.md` está **largamente refletida no código atual** de `game-scene.css` e `game-shoot.css`: variáveis de tipografia e ícones aumentadas, painel superior com `min-height` e paddings recalibrados, logo 68px, gaps do `.hud-content`, botão **MENU PRINCIPAL** com `font-size` explícito, e regras `.stat-*` do `game-shoot.css` **encapsuladas em `.gs-hud`**, o que **remove o conflito de cascata** que anulava o sistema responsivo do `game-scene` no HUD do `GameFinal`.

**Discrepância objetiva:** o documento da cirurgia referencia regras para **`.bet-value-fixed`** e aumento de **`.bet-label`** para 15px. No **`game-scene.css` atual**:
- **`.bet-label` permanece `font-size: 14px`** (linhas ~280–284);
- **não existe** seletor `.bet-value-fixed` (a classe existe em `GameFinal.jsx` na linha do texto “R$ 1,00 por chute”, mas **sem estilo dedicado** no CSS analisado).

Consequência: o ganho de legibilidade na **linha de aposta fixa** é **inferior** ao descrito no relatório de cirurgia; o restante do HUD (stats, ícones, painel, menu) está alinhado ao intent.

**Classificação final:** **APROVADO COM AJUSTES FINOS** (ver secção 8).

---

## 2. Arquivos validados

| Ficheiro | Estado |
|----------|--------|
| `goldeouro-player/src/pages/game-scene.css` | Revisado: `:root` com variáveis recalibradas; `.hud-header`, `.hud-stats`, `.stat-*`, `.hud-content`, `.brand-logo-small`, `.btn-partida`/`.btn-dashboard` com media query desktop |
| `goldeouro-player/src/pages/game-shoot.css` | Revisado: `.gs-hud .stat-*` nas regras base e media queries alteradas |
| `goldeouro-player/src/pages/GameFinal.jsx` | Sem alterações na cirurgia (confirmado: JSX continua a usar as mesmas classes; `bet-value-fixed` presente no markup) |
| `goldeouro-player/src/game/layoutConfig.js` | Sem alteração esperada — não revisto em profundidade (fora do diff da cirurgia) |

---

## 3. Resultado visual do HUD (evidência em código)

### 3.1 Elementos do topo — o que **melhora** de forma verificável

| Elemento | Evidência técnica |
|----------|-------------------|
| **SALDO / CHUTES / GANHOS / GOLS DE OURO** | Variáveis aumentadas: labels 12px→15px (desktop), valores 16px→22px (desktop), ícones 22px→32px (desktop); gaps e gap interno maiores; `.stat-content` com `gap: 0.25rem`. |
| **Painel (card)** | `.hud-header`: `padding` via variáveis (12×18 mobile → 18×26 desktop), `min-height: 4.5rem`, `backdrop-filter` e fundo mantidos. |
| **Logo** | `.brand-logo-small`: **68×68** máx. |
| **MENU PRINCIPAL** | `.btn-dashboard`: `font-size: 0.9375rem`, `padding: 11px 18px`, em ≥1024px `1rem` e `12px 20px`. |
| **Aposta “Aposta:”** | `.bet-label` ainda **14px** (não 15px como no doc de cirurgia). |
| **Texto “R$ 1,00 por chute”** | Classe `bet-value-fixed` no JSX **sem** regra correspondente no CSS lido — estilo depende de herança / `body[data-page="game"] .hud-header div`. |

### 3.2 O que **não** pode ser afirmado sem runtime

- Ausência de “exagero”, “poluição” ou “truncamento” em **pixels reais** após `transform: scale(gameScale)` no stage.
- Comportamento exato em **todos** os tamanhos de janela (colisão de flex, wrap) — `.hud-stats` mantém `flex-wrap: wrap`; em larguras muito pequenas o wrap **pode** ocorrer (já era assim conceitualmente).

---

## 4. Resultado técnico

| Verificação | Resultado |
|-------------|-----------|
| **Cascata GameFinal vs game-shoot** | **Correto:** regras `.stat-*` globais passaram a `.gs-hud .stat-*`; o HUD do `GameFinal` (`.hud-header` **sem** `.gs-hud`) usa as variáveis de `game-scene.css` sem ser sobrescrito por `font-size: 11px/16px` do segundo ficheiro. |
| **Fonte de verdade do HUD /game** | **`game-scene.css`** para `.hud-header` e descendentes comuns. |
| **`min-height` / padding / gaps** | Presentes e coerentes com o relatório de cirurgia (exceto ponto da aposta acima). |
| **Responsividade (media queries)** | `game-scene` mantém breakpoints 768–1024 e ≥1024 para stats e header. |

---

## 5. Isolamento do legado

- **Confirmado em código:** seletores `.gs-hud .stat-item`, `.gs-hud .stat-icon`, etc., e media queries com o mesmo prefixo.
- **`GameShootFallback`** (estrutura com `.gs-hud` + `.stat-item`) continua a receber o bloco de estilos legado dentro de `.gs-hud`.
- **Não foi executado** teste manual da rota de fallback nesta validação; apenas coerência estática.

---

## 6. Gameplay preservado

| Área | Validação |
|------|-----------|
| **GameFinal.jsx / lógica** | Não alterados pela cirurgia (escopo foi só CSS). |
| **Overlays / áudio / timing** | Ficheiros não tocados na cirurgia documentada. |
| **Stage / chute / saldo** | Sem mudança de JS; apenas apresentação. |
| **Recarregar / MENU PRINCIPAL** | `onClick` e `navigate` inalterados; só classes CSS de botões. |

---

## 7. Comparação com o estado anterior

| Questão | Resposta objetiva |
|---------|-------------------|
| O HUD **deixa de parecer** subdimensionado? | **Em código, sim** para **stats, ícones e valores**: aumentos explícitos + fim da sobrescrita por `game-shoot`. |
| Leitura mais próxima da produção? | **Provável melhoria média**, sem medição em produção nesta sessão. |
| **Ganho percebido (estimativa técnica)** | **Médio** a **alto** nos blocos de estatísticas; **baixo a médio** na linha de aposta fixa se o estilo dedicado à classe não estiver no CSS. |

---

## 8. Classificação final

### **APROVADO COM AJUSTES FINOS**

**Motivo:** a cirurgia cumpre o objetivo principal (escala e legibilidade do HUD de stats + cascata + menu + logo + painel), mas há **desalinhamento** entre o relatório de cirurgia e o **`game-scene.css` atual** quanto a **`.bet-label` (14px vs 15px documentados)** e à **ausência de `.bet-value-fixed`** no CSS apesar da classe no JSX.

**Ajuste fino recomendado (fora do escopo desta validação read-only):** alinhar CSS ao documento de cirurgia ou atualizar o documento ao estado real do ficheiro — para fechar o ciclo sem ambiguidade.

---

## 9. Limitações desta validação

- **Sem** screenshot nem inspeção DevTools em `/game` autenticado.
- **Sem** prova de regressão visual zero em todos os viewports; apenas análise estática e coerência com a intenção da cirurgia.
