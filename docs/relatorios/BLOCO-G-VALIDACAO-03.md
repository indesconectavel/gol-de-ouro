# BLOCO G — Validação 03

**Data:** 2026-03-27  
**Objeto:** MICRO-CIRURGIA G-4 — loading + entrada suave (`game-scene.css`, `GameFinal.jsx`).  
**Método:** revisão estática do código; **sem execução de browser** neste ambiente.

---

## 1. Resumo executivo

O código **confirma** a implementação descrita em `BLOCO-G-CIRURGIA-03.md`: animações `gameG4LoadingIn`, `gameG4LoadingPulse` e `gameG4StageEnter` com durações e valores alinhados ao relatório; `prefers-reduced-motion` desativa essas animações. Em `GameFinal.jsx`, o ramo `if (loading)` **mantém** a mesma estrutura condicional e o mesmo texto; apenas foram acrescentadas as classes `game-loading-screen` e `game-loading-label`. A lógica de `loading` / `setLoading` no `init` **não** foi alterada nesta leitura.

**Ressalva:** confirmação de **aspeto e timing** no pixel depende de teste manual no preview.

**Veredito:** **APROVADO COM RESSALVAS** (secção 6).

---

## 2. Itens validados

| Item | Evidência |
|------|-----------|
| `.game-loading-screen` com `gameG4LoadingIn` 200 ms, `ease-out`, `forwards` | `game-scene.css` linhas 12–13, 20–27 |
| `.game-loading-label` com pulse 2,2 s, opacidade 0,62 ao meio | linhas 16–17, 29–37 |
| `body[data-page="game"] .game-viewport` com `gameG4StageEnter` 200 ms, opacity + `translateY(6px)`→0, easing `cubic-bezier(0.22, 1, 0.36, 1)` | linhas 39–51 |
| `prefers-reduced-motion` | linhas 54–62 |
| JSX loading com `game-loading-screen` e `game-loading-label` | `GameFinal.jsx` 551–556 |
| Condição `if (loading)` e fluxo de render inalterados | mesmo ficheiro |
| `useState` / `setLoading` presentes como antes | linhas 69, 287, 307, 551 |
| `game-shoot.css` sem referências G-4 / loading | grep sem matches |
| Blocos G-2 (`--go-hud-tx`, etc.) preservados no topo do ficheiro | linhas 1–9 |

---

## 3. Ganhos perceptivos confirmados

**A partir do código (não medição visual):**

1. **Loading:** fade-in de 200 ms evita aparecer com opacidade total instantânea; pulse no texto reduz sensação de ecrã estático.
2. **Entrada:** 200 ms de opacidade + deslocamento vertical curto — transição inicial **curta** e coerente com o easing do HUD.
3. **Acessibilidade:** utilizadores com `prefers-reduced-motion: reduce` não são forçados às animações.

---

## 4. Regressões encontradas

**Nenhuma regressão funcional ou estrutural** detetável por revisão estática:

- **Atraso artificial:** não há `setTimeout` nem atraso extra no fluxo de `init`; `setLoading(false)` mantém-se no `finally` do fluxo assíncrono existente.
- **Gameplay / overlays / backend:** fora do âmbito deste diff.
- **G-1:** alterações estão em `game-shoot.css` (zonas); **não** foram tocadas nesta validação de ficheiros G-4.
- **G-2:** variáveis e botões HUD no mesmo `game-scene.css` permanecem acima do bloco G-4; bloco G-4 não sobrescreve regras de `.hud-btn` / `.btn-dashboard`.

**Regressões visuais em runtime:** não verificáveis sem preview (ex.: combinação de `transform` no `.game-viewport` com resto do layout).

---

## 5. Integridade arquitetural

| Critério | Estado |
|----------|--------|
| BLOCO F / HUD | **Preservado** — G-4 não altera seletores do HUD nem estrutura do header/footer. |
| G-1 (zonas) | **Intacto** em `game-shoot.css`; sem edições G-4 nesse ficheiro. |
| G-2 (botões) | **Intacto** — regras G-2 no início de `game-scene.css` mantidas. |
| Overlays (`#game-overlay-root`) | **Não alterados** — comentário e regra do contentor mantidos após o bloco G-4. |
| `game-shoot.css` | **Sem alterações** relacionadas com G-4. |

---

## 6. Segurança para a V1

**Classificação: APROVADO COM RESSALVAS**

- **Motivo da ressalva:** confirmação perceptiva final (fluidez, ausência de “salto” estranho no primeiro frame) deve ser feita **no preview**.
- **Motivo de aprovação técnica:** alterações limitam-se a classes e CSS; lógica de loading inalterada; duração 200 ms é negligenciável como “espera” extra.

---

## 7. Próxima melhor micro-cirurgia

Conforme `BLOCO-G-PLANO-INICIAL.md`, o item restante de **médio risco** é **G-5** — reduzir duplicação entre animações inline nos `<img>` de overlay em `GameFinal.jsx` e as `@keyframes` em `game-shoot.css`, **sem** alterar `OVERLAYS.ANIMATION_DURATION` nem timers de som/toast. Só deve ser feita com checklist explícito de regressão em overlays.

Alternativa de **menor risco:** encerrar o BLOCO G após validação manual de G-4 e documentar G-5 como backlog opcional.

---

## 8. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| Loading ficou melhor **em desenho**? | **Sim** — fade-in + pulse no CSS. |
| Entrada ficou mais suave **em desenho**? | **Sim** — entrada de 200 ms no viewport. |
| Lógica intacta? | **Sim** — apenas classes no JSX de loading. |
| Seguro para a V1? | **Sim, com smoke test** no preview. |
| Avançar para a próxima cirurgia? | **Opcional** — G-5 se se aceitar tocar em overlays; caso contrário, validar G-4 e fechar. |

---

**Assinatura:** validação estática de repositório; não substitui QA manual no browser.
