# Relatório executivo — auditoria read-only da página `/game` (HUD)

**Data:** 2026-03-27  
**Escopo:** página de jogo certificada (`GameFinal`), rota `/game`, estilos `game-scene.css` e interação com `game-shoot.css`.  
**Método:** revisão estática de código (read-only); sem execução de testes E2E ou build nesta auditoria.

---

## 1. Resumo executivo

A rota **`/game`** renderiza o componente **`GameFinal`** (`goldeouro-player/src/pages/GameFinal.jsx`), protegida por **`ProtectedRoute`**. O HUD (header com logo, estatísticas, linha de aposta e botão MENU PRINCIPAL; footer com Recarregar e áudio) está **estruturado de forma consistente** com o stage em coordenadas fixas (`layoutConfig`) e escala por viewport.

O **`body[data-page="game"]`** é definido no mount e **removido no unmount**, evitando que regras CSS do jogo vazem para outras rotas.

O ficheiro **`game-scene.css`** concentra o design system do HUD (variáveis `--stat-gap-*`, `--header-padding-*`, blindagem de cores para `.bet-value-fixed` e `.stat-value`, botões `.btn-dashboard` e `.hud-btn.primary` no canto inferior esquerdo). Os commits recentes na branch de trabalho (`4ff3d48`, `015bd5e`, `9dcc1ef`, `aa2bb72`, …) alinham **legibilidade**, **contraste de texto** (MENU PRINCIPAL em preto; valores em dourado) e **área clicável** do Recarregar.

**Conclusão para validação:** o desenho atual está **coerente com os requisitos de HUD BLOCO F** documentados no histórico de conversa (stats sem quebra indevida, logo dimensionada no HUD, Recarregar em pill amarelo com texto legível). **Recomenda-se** validação visual no preview Vercel e smoke test manual (login, `/game`, um chute) antes de merge para produção.

---

## 2. Artefactos auditados

| Artefacto | Função na auditoria |
|-----------|---------------------|
| `goldeouro-player/src/pages/GameFinal.jsx` | Estrutura JSX do HUD, `data-page`, navegação, overlays via portal |
| `goldeouro-player/src/pages/game-scene.css` | Estilos do header, stats, apostas, botões, logo, Recarregar, chat |
| `goldeouro-player/src/pages/game-shoot.css` | Regras `.gs-hud` / zonas; ver nota de escopo abaixo |
| `goldeouro-player/src/App.jsx` | Rota `/game` → `GameFinal` + `ProtectedRoute` |
| `goldeouro-player/src/components/Logo.jsx` | Tamanho base `small` (Tailwind `w-12`); sobrescrito no HUD por CSS |

---

## 3. Arquitetura da página (read-only)

1. **Autenticação:** utilizador autenticado acede a `/game`; caso contrário, fluxo de login.
2. **Estado global da página:** `document.body` recebe `data-page="game"` uma vez (guard `isInitializedRef`); cleanup remove o atributo ao sair.
3. **Stage:** fundo, alvos (`gs-zone`), goleiro (`gs-goalie`), bola (`gs-ball`) com posições derivadas de `layoutConfig` e escala `gameScale`.
4. **HUD:** posicionamento absoluto no `stage-root` com offsets de `HUD` em `layoutConfig`.
5. **Overlays de resultado:** `createPortal` para `#game-overlay-root` (fora de `#root`), com `position: fixed` e `z-index` alto para evitar problemas com `transform` no stage.

---

## 4. Checklist de validação HUD (critérios verificáveis)

| Critério | Estado | Evidência |
|----------|--------|-----------|
| Escopo CSS por `body[data-page="game"]` | OK | Regras específicas para header, Recarregar, chat, overlay root |
| Valores monetários em linha única (SALDO / GANHOS) | OK | `.stat-value` com `white-space: nowrap`; reforço em `body[data-page="game"] .hud-header .stat-value` |
| Cor dourada dos valores vs. branco genérico | OK | `.stat-value` removido da lista branca; cor `#fbbf24 !important` no escopo |
| Texto MENU PRINCIPAL preto sobre amarelo | OK | `.btn-dashboard` com cor preta explícita; não incluído na regra branca de texto |
| Logo no HUD (vs. Tailwind `w-12` no `Logo`) | OK | `body[data-page="game"] .hud-header .brand-small .brand-logo-small` e `img` a **200px** |
| Recarregar: pill amarelo, texto preto, área grande | OK | `.hud-bottom-left .hud-btn.primary` com padding e `font-size` elevados (`~2.125rem` / `2.25rem` desktop) |
| Recarregar desativado fora de IDLE | OK | `disabled={gamePhase !== GAME_PHASE.IDLE}` |
| Limpeza de `data-page` ao sair | OK | `removeAttribute('data-page')` no cleanup do `useEffect` |

---

## 5. Riscos e limitações (não bloqueantes para auditoria read-only)

1. **Escala do stage:** o HUD é renderizado em coordenadas do stage; o CSS em `rem`/`px` é afetado pelo zoom/escala do viewport. Validação em **telefone retrato** vs. **desktop** continua necessária (o `game-rotate` em portrait pode ocultar o stage).
2. **Botão Recarregar muito grande em telas estreitas:** `font-size` ~2.1rem pode competir com espaço horizontal; se houver overflow, considerar `clamp()` ou media query apenas para `max-width`.
3. **Duplicação de ícone 💰** em SALDO e GANHOS: é uma decisão de design, não um bug; apenas redundância visual.
4. **Cascata de `game-shoot.css`:** importado no mesmo componente; regras `.gs-hud` não aplicam ao markup atual do `GameFinal` (sem classe `gs-hud` no header). O risco de conflito no HUD principal é **baixo** para as classes auditadas (`hud-header`, `stats`, etc.).
5. **Acessibilidade:** botões de zona têm `title`; HUD usa emoji e texto. Não foi feita auditoria WCAG completa (contraste de labels, foco de teclado, `aria-label` em todos os controles).

---

## 6. Referência de commits recentes (`game-scene.css`)

| Commit | Mensagem (resumo) |
|--------|-------------------|
| `4ff3d48` | Área visual do botão Recarregar aumentada |
| `015bd5e` | Logo HUD 200px |
| `9dcc1ef` | Logo 240px + texto MENU PRINCIPAL preto (corrigido) |
| `aa2bb72` | HUD preview: stats, logo, Recarregar |

*(Lista obtida por `git log` no repositório; hashes válidos no momento da auditoria.)*

---

## 7. Recomendações

1. **Smoke manual no preview:** login → `/game` → verificar header, Recarregar, MENU PRINCIPAL, áudio, um chute.
2. **Opcional:** screenshot de regressão visual para HUD em 375px e 1920px.
3. **Opcional:** se `shotsUntilGoldenGoal` for exibido no HUD no futuro, alinhar tipografia às variáveis CSS existentes.

---

## 8. Assinatura do relatório

- **Tipo:** auditoria read-only (código + histórico Git).  
- **Não inclui:** testes automatizados, métricas de performance, pentest ou revisão de API.  
- **Próximo passo sugerido:** aceite de produto após validação visual no preview Vercel e checklist manual acima.
