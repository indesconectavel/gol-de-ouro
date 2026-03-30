# BLOCO F — /game — Cirurgia de Escala do HUD

**Data:** 2026-03-26  
**Base:** Auditoria read-only da rota `/game` (HUD subdimensionado percebido; conflito de cascata `game-scene.css` vs `game-shoot.css`).

---

## 1. Resumo executivo

Foi feita uma **recalibração de escala visual** do HUD superior do `GameFinal` (SALDO, CHUTES, GANHOS, GOLS DE OURO, aposta fixa, MENU PRINCIPAL e logo), **sem alterar JSX, lógica, overlays, áudio ou gameplay**.

Dois eixos:

1. **Aumentar** variáveis e regras em `game-scene.css` (tipografia, ícones, gaps, padding do painel, texto da aposta fixa, botão dashboard).
2. **Corrigir a cascata:** regras globais de `.stat-*` em `game-shoot.css` que, por carregamento posterior, **sobrescreviam** o sistema responsivo do `game-scene` no HUD do `/game`. Essas regras foram **restritas a `.gs-hud`** (layout legado `GameShootFallback`), onde continuam a aplicar-se.

`transform: scale(gameScale)` no stage **não foi alterado**; a compensação é por tipografia/espaçamento mais generosos.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/game-scene.css` | Variáveis `--stat-*`, `--header-padding-*`, `--bet-gap-*`; `.hud-header` (padding via vars, `min-height`); logo `.brand-logo-small`; `.stat-content` gap; `.bet-label`; nova `.bet-value-fixed` + media queries; `.btn-partida` / `.btn-dashboard` tamanho e padding; `.hud-content` gap |
| `goldeouro-player/src/pages/game-shoot.css` | Prefixo `.gs-hud` nas regras de `.stat-item`, `.stat-icon`, `.stat-content`, `.stat-label`, `.stat-value` e nas media queries que as afetavam |

**Não alterados:** `GameFinal.jsx`, `layoutConfig.js`, overlays, áudio, `gameService`, etc.

---

## 3. Fonte de verdade final do HUD

- **Tipografia e espaçamento do HUD do `/game`:** `game-scene.css`, secção de variáveis `:root` e regras `.hud-header`, `.hud-stats`, `.stat-*`, `.hud-betting`, `.bet-*`, `.btn-dashboard`.
- **`game-shoot.css`:** continua a estilizar o HUD **dentro de `.gs-hud`** (ex.: `GameShootFallback`); **não** compete mais com o HUD do `GameFinal` para as classes `.stat-*` genéricas.

---

## 4. Alterações por elemento

| Elemento | O que mudou |
|----------|-------------|
| **SALDO / CHUTES / GANHOS / GOLS DE OURO** | Labels, valores e ícones ampliados via variáveis CSS; gap entre stats e gap interno aumentados; `stat-content` com gap vertical maior. |
| **Aposta (“Aposta:” / texto fixo)** | `.bet-label` de 14px → **15px**; criada **`.bet-value-fixed`** (15–17px conforme breakpoint, peso 600, cor `#fbbf24`). |
| **MENU PRINCIPAL** | `.btn-dashboard` (e `.btn-partida` no mesmo seletor): `font-size` ~15px (base), ~16px em desktop; padding ligeiramente maior; `line-height: 1.2`. |
| **Logo** | `.brand-logo-small`: 60px → **68px** máx. |
| **Painel superior** | `.hud-header`: padding passa a usar variáveis já recalibradas; **`min-height: 4.5rem`** para presença do card. |
| **Layout interno** | `.hud-content`: gap **24px** entre blocos. |

---

## 5. O que foi preservado

- **Lógica:** nenhuma alteração em `GameFinal.jsx` ou serviços.
- **Gameplay:** chutes, saldo, totais, fases, `betAmount === 1`, rotas de navegação inalteradas.
- **Textos de negócio:** strings e formatos (`toFixed`, labels SALDO/CHUTES/etc.) intactos.
- **Overlays, timing, áudio, assets:** não tocados.
- **Comportamento:** `onClick` de MENU PRINCIPAL e Recarregar inalterados; apenas estilo.

---

## 6. Riscos evitados

- Não se alterou `gameScale` / cálculo de escala.
- Não se fez refactor amplo de CSS.
- Não se removeu `game-shoot.css` do bundle; apenas se **encapsulou** o conflito.
- Não se alterou app shell nem rotas fora de `/game`.

---

## 7. Checklist de validação visual

1. Abrir `/game` autenticado.
2. **HUD superior:** confirmar labels e valores **mais legíveis** e ícones proporcionais.
3. **Aposta fixa:** linha “R$ 1,00 por chute” com tamanho e cor consistentes com o restante.
4. **MENU PRINCIPAL:** botão amarelo com texto legível e área de clique confortável.
5. **Desktop** (≥1024px): confirmar aumento de valores em relação ao mobile.
6. **Viewport estreito:** confirmar que não há quebra de layout grave (wrap já existia em `.hud-stats`).
7. (Opcional) Abrir rota que use `GameShootFallback` com `.gs-hud`: stats ainda estilizados como antes.

---

## 8. Conclusão objetiva

A cirurgia está **pronta para validação em preview**: HUD com escala recalibrada, conflito de cascata entre folhas **endereçado** para o HUD do `/game`, e **zero mudanças funcionais** no escopo bloqueado.
