# BLOCO F — Correção 3: Centralização dos overlays de resultado durante a animação (PREVIEW ONLY)

**Data:** 2026-03-17  
**Modo:** Correção cirúrgica apenas na branch de trabalho / preview. Produção intocada.

**Referência:** BLOCO-F-FORENSE-ASSETS-RESULTADO-POSICIONAMENTO-2026-03-17.md

---

## 1. Diagnóstico curto

Os overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) são renderizados via createPortal com estilo inline `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`. Os keyframes **gooolPop**, **ganhouPop** e **pop** em **game-shoot.css** usavam apenas `transform: scale(...)`. Ao aplicar a animação, o navegador substituía o `transform` do inline; sem o translate, o elemento ficava posicionado pelo canto superior esquerdo no centro da tela e o centro visual deslocava para baixo/direita. **Correção:** Inclusão de `translate(-50%, -50%)` em todos os passos desses keyframes, mantendo a centralização durante toda a animação.

---

## 2. Arquivo alterado

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/game-shoot.css` | Keyframes `pop`, `gooolPop` e `ganhouPop`: em cada passo, `transform: scale(...)` foi alterado para `transform: translate(-50%, -50%) scale(...)`. Comentário explicativo adicionado acima dos keyframes. |

Nenhum outro arquivo foi modificado. Produção, backend e lógica do jogo não foram alterados.

---

## 3. Explicação objetiva da correção

- **Problema:** A animação CSS sobrescreve a propriedade `transform` do elemento. O inline define `transform: translate(-50%, -50%)` para centralizar; os keyframes definiam só `transform: scale(...)`, substituindo o valor e removendo a centralização durante (e após, com `forwards`) a animação.
- **Solução:** Em cada keyframe (pop, gooolPop, ganhouPop), em todos os percentuais (0%, 20%/30%, 70%/80%, 100%), o `transform` passou a ser `translate(-50%, -50%) scale(...)` em vez de apenas `scale(...)`. Assim a animação continua com o mesmo efeito de escala e brilho, e o translate de centralização é preservado em todos os momentos.

---

## 4. Trecho alterado (keyframes)

**Antes:**

```css
@keyframes pop{ 0%{transform:scale(.6);opacity:0;} 100%{transform:scale(1);opacity:1;} }
@keyframes gooolPop{ 
  0%{transform:scale(.6);opacity:0; filter:brightness(1.2);} 
  30%{transform:scale(1.1);opacity:1; filter:brightness(1.5);}
  70%{transform:scale(1);opacity:1; filter:brightness(1.2);}
  100%{transform:scale(.8);opacity:0; filter:brightness(1);} 
}
@keyframes ganhouPop{ 
  0%{transform:scale(.3);opacity:0; filter:brightness(1.2);} 
  20%{transform:scale(1.1);opacity:1; filter:brightness(1.5);}
  80%{transform:scale(1);opacity:1; filter:brightness(1.2);}
  100%{transform:scale(1);opacity:1; filter:brightness(1);} 
}
```

**Depois:**

```css
/* Centralização preservada durante animação (overlays via createPortal com fixed 50% + translate -50% -50%) */
@keyframes pop{ 0%{transform:translate(-50%,-50%) scale(.6);opacity:0;} 100%{transform:translate(-50%,-50%) scale(1);opacity:1;} }
@keyframes gooolPop{ 
  0%{transform:translate(-50%,-50%) scale(.6);opacity:0; filter:brightness(1.2);} 
  30%{transform:translate(-50%,-50%) scale(1.1);opacity:1; filter:brightness(1.5);}
  70%{transform:translate(-50%,-50%) scale(1);opacity:1; filter:brightness(1.2);}
  100%{transform:translate(-50%,-50%) scale(.8);opacity:0; filter:brightness(1);} 
}
@keyframes ganhouPop{ 
  0%{transform:translate(-50%,-50%) scale(.3);opacity:0; filter:brightness(1.2);} 
  20%{transform:translate(-50%,-50%) scale(1.1);opacity:1; filter:brightness(1.5);}
  80%{transform:translate(-50%,-50%) scale(1);opacity:1; filter:brightness(1.2);}
  100%{transform:translate(-50%,-50%) scale(1);opacity:1; filter:brightness(1);} 
}
```

(O restante do arquivo `game-shoot.css` permanece inalterado.)

---

## 5. Checklist de validação visual no preview

Validar **apenas no preview** (deployment da branch de trabalho), sem tocar em produção:

- [ ] Abrir a rota `/game` no preview (logado).
- [ ] Fazer um chute que resulte em **gol**: overlay **GOOOL** deve aparecer **centralizado** na tela durante toda a animação (não desloca para baixo/direita).
- [ ] Após o GOOOL, overlay **GANHOU** deve permanecer **centralizado** durante a animação.
- [ ] Fazer um chute que resulte em **defesa**: overlay **DEFENDEU** deve aparecer **centralizado**.
- [ ] Se houver cenário de **Gol de Ouro**, overlay **GOLDEN GOAL** (usa animação ganhouPop) deve permanecer **centralizado**.
- [ ] Redimensionar a janela e repetir: overlays continuam centralizados em todos os momentos da animação.
- [ ] Toast (canto superior direito) continua como antes; apenas os overlays de imagem devem estar centralizados.

Se todos os itens forem atendidos, a Correção 3 está validada no preview.

---

## 6. Regra de governança

- **Produção:** Intocada; nenhuma alteração no deployment Current.
- **Preview:** Único ambiente onde esta correção é aplicada e validada.

---

*Documento gerado na fase de correção cirúrgica do BLOCO F (centralização dos overlays de resultado durante a animação).*
