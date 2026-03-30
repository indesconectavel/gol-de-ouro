# BLOCO F — /game — Correção final de cascata

## 1. Resumo executivo

Foi aplicada cirurgia mínima para corrigir a cascata que estava impedindo o HUD real do `GameFinal` de refletir corretamente a linha de aposta no `/game`.

A correção foi focada em:
- aumentar especificidade no HUD real (`body[data-page="game"] .hud-header ...`);
- escopar regra legada de `.bet-label` no `game-shoot.css` para `.gs-hud`;
- impedir que a regra genérica branca com `!important` anulasse a cor dourada da `.bet-value-fixed`.

## 2. Arquivos alterados

- `goldeouro-player/src/pages/game-scene.css`
- `goldeouro-player/src/pages/game-shoot.css`

## 3. Causa confirmada

A causa confirmada era cascata/ordem de CSS:
- `game-shoot.css` ainda tinha `.bet-label` global, interferindo no HUD do `GameFinal`;
- regra ampla em `game-scene.css` (`.hud-header ... div/span` com `!important`) acabava anulando a cor específica da aposta fixa.

## 4. Correções aplicadas

No `game-scene.css`:
- adicionada blindagem específica:
  - `body[data-page="game"] .hud-header .bet-label` (15px, branco, peso 600)
  - `body[data-page="game"] .hud-header .bet-value-fixed` (15px, peso 600, dourado com prioridade)
- restringida a regra genérica de texto branco no header para classes explícitas do HUD (stats, botões e label), removendo alvo genérico de `div/span`.

No `game-shoot.css`:
- regra `.bet-label` passou para `.gs-hud .bet-label`, removendo interferência sobre o HUD do `GameFinal`.

## 5. O que foi preservado

- nenhuma alteração de lógica;
- nenhum ajuste em gameplay;
- nenhum ajuste em `GameFinal.jsx`;
- nenhum ajuste em overlays, áudio ou `layoutConfig`;
- sem redesenho de HUD.

## 6. Como a interferência do legado foi neutralizada

O legado (`game-shoot.css`) ficou limitado ao seu escopo natural (`.gs-hud`), inclusive para a linha de aposta.  
No HUD real do `/game`, as regras da aposta agora têm seletor específico de contexto (`body[data-page="game"] .hud-header`), evitando depender apenas da ordem de importação.

## 7. Checklist de validação visual

- `.bet-label` no HUD do `/game` com tamanho correto (15px): **implementado**
- `.bet-value-fixed` com tipografia correta e peso 600: **implementado**
- cor dourada da aposta fixa preservada no HUD real: **implementado**
- interferência de `.bet-label` legado sobre `GameFinal`: **neutralizada**
- escopo do restante (`stats/gameplay`) preservado: **preservado**

## 8. Conclusão objetiva

A cascata foi corrigida com escopo mínimo e controlado.  
O HUD do `GameFinal` no `/game` passa a ter blindagem específica para a linha de aposta, e o legado deixa de interferir nesse trecho.  
Não houve abertura de novo escopo.

