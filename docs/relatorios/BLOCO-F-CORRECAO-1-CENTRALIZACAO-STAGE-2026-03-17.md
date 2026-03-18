# BLOCO F — Correção 1: Centralização do stage no viewport (PREVIEW ONLY)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** Correção controlada — apenas branch de trabalho/preview. Produção intocada.

**Referência:** BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT-2026-03-17.md, BLOCO-F-RELATORIO-MESTRE-AUDITORIA-FORENSE-GAME-2026-03-17.md

---

## 1. Diagnóstico do que foi corrigido

- **Causa raiz abordada:** O bloco 1920×1080 escalado (`.game-scale`) não era centralizado no viewport; o container `.game-viewport` não tinha layout de centralização, então o palco ficava ancorado no canto superior esquerdo.
- **Correção aplicada:** Foi adicionado ao container `.game-viewport` layout flex com centralização: `display: flex`, `alignItems: center`, `justifyContent: center`, mantendo `width: 100vw`, `height: 100dvh`, `overflow: hidden`.
- **O que não foi alterado:** Cálculo de scale (`calculateScale`, `gameScale`, `gameScaleStyle`), dimensões 1920×1080, `transform-origin: center center`, `.game-scale` e `.game-stage`, lógica de jogo, produção.

---

## 2. Plano técnico objetivo

| Ordem | Item | Status |
|-------|------|--------|
| 1 | Centralização do stage/viewport | **Concluído** (esta correção) |
| 2 | Coerência DOM/CSS | Pendente |
| 3 | Overlays e stacking context | Pendente |
| 4 | Auditar/corrigir assets visuais divergentes | Pendente |
| 5 | Checklist de validação manual do preview | Abaixo |
| 6 | Veredito técnico final do BLOCO F | Após validação |

---

## 3. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/GameFinal.jsx` | Estilo inline do `.game-viewport`: adicionados `display: 'flex'`, `alignItems: 'center'`, `justifyContent: 'center'` (mantidos width, height, overflow). |

Nenhum outro arquivo foi modificado. Produção não foi tocada.

---

## 4. Patch aplicado (trecho)

**Antes (linha ~539):**
```jsx
<div className="game-viewport" style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
```

**Depois:**
```jsx
<div
  className="game-viewport"
  style={{
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
```

---

## 5. Checklist de validação visual (após aplicar)

Validar **apenas no preview** (deployment da branch de trabalho), sem tocar em produção:

- [ ] Abrir a rota `/game` no preview.
- [ ] **Palco centralizado:** O retângulo do jogo (campo 1920×1080 escalado) aparece centralizado na tela (horizontal e verticalmente), não mais no canto superior esquerdo.
- [ ] **Proporção 16:9:** O palco mantém proporção correta, sem deformação; letterbox/pillarbox simétricos se a janela não for 16:9.
- [ ] **Scale preservado:** Redimensionar a janela e conferir se o palco continua escalando corretamente e permanece centralizado.
- [ ] **HUD/header/rodapé:** Elementos dentro do stage (header, botões, HUD) continuam visíveis e alinhados ao palco.
- [ ] **Overlays de resultado:** GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL — verificar na próxima correção (overlays); aqui apenas garantir que o stage está centralizado.

Se todos os itens forem atendidos no preview, a correção 1 está validada e pode-se seguir para a correção 2 (coerência DOM/CSS) e 3 (overlays).

---

## 6. Regra de governança

- **Produção:** Referência soberana, estável e intocável; nenhuma alteração no deployment Current.
- **Preview:** Único ambiente onde as correções do BLOCO F são aplicadas e validadas.

---

*Documento gerado na fase de correção controlada do BLOCO F. Apenas código do preview foi alterado.*
