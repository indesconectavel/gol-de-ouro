# BLOCO G — Validação 02

**Data:** 2026-03-27  
**Objeto:** MICRO-CIRURGIA G-2 — botões do HUD (`game-scene.css`) e app shell (`InternalPageLayout.jsx`).  
**Método:** revisão estática do código-fonte; **sem execução de browser** neste ambiente.

---

## 1. Resumo executivo

O código **confirma** a implementação descrita em `BLOCO-G-CIRURGIA-02.md`: variáveis `--go-hud-tx` e `--go-hud-ease` em `body[data-page="game"]`; estados `:active` e `:focus-visible` em `.btn-dashboard`, `.hud-btn` (com `:not(:disabled)` onde aplicável), `body...hud-btn.primary`, `.control-btn`; extensão da regra de cor do **MENU PRINCIPAL** para `:active` e `:focus-visible`; `InternalPageLayout` com `duration-150`, `active:` e `focus-visible` nos três botões. **Não** foram encontradas alterações em `GameFinal.jsx`, stage, overlays ou `game-shoot.css` no âmbito desta validação.

**Ressalva:** confirmação de **pixels e tacto** (desktop/mobile) depende de teste manual no preview.

**Veredito:** **APROVADO COM RESSALVAS** (secção 6).

---

## 2. Itens validados

| Item | Evidência no código |
|------|---------------------|
| `body[data-page="game"]` com `--go-hud-tx: 150ms` e `--go-hud-ease: cubic-bezier(0.22, 1, 0.36, 1)` | `game-scene.css` linhas 2–9 |
| `.btn-dashboard` — sombra base, `transition` com `var(..., fallback)`, `:hover`, `:active`, `:focus-visible`, `focus:not(:focus-visible)` | linhas 441–476 |
| `.hud-btn` — transições com variáveis; `:hover`/`:active`/`:focus-visible` com `:not(:disabled)`; secundário com `:active` | linhas 524–574 |
| `body...hud-btn.primary` — `:hover`, `:active`, `:focus-visible` com `:not(:disabled)` | linhas 577–611 |
| `.control-btn` — transição multi-propriedade; `:hover` com `translateY(-1px)`; `:active` com `scale(0.97)`; `:focus-visible` | linhas 619–659 |
| Cor preta do `.btn-dashboard` no header para `:active` e `:focus-visible` | linhas 809–814 |
| `InternalPageLayout` — header voltar e sair: `duration-150`, `active:opacity-90`, `active:scale-[0.99]`, outline em `focus-visible` | linhas 26–38 |
| Footer **JOGAR AGORA** — `duration-150`, `active:translate-y-0.5`, sombras e `active:brightness-[0.98]`, `focus-visible:ring` preservado | linhas 58 |
| `GameFinal.jsx` / handlers | **Sem alterações** nesta cirurgia (confirmado por não constar nos ficheiros revistos) |
| `game-shoot.css` | **Sem referências G-2**; ficheiro não integra alterações G-2 (grep) |

---

## 3. Ganhos perceptivos confirmados

**A partir do código (não medição visual):**

1. **Active:** deslocamentos e sombras mais baixas em `.btn-dashboard`, `.hud-btn`, `.hud-btn.primary` e `.control-btn` reproduzem padrão “pressionado”; `filter: brightness` reforça feedback sem mudar layout.
2. **Focus-visible:** contornos com cor alinhada à paleta (dourado no dashboard, verde nos `.hud-btn`, amarelo no áudio); footer do shell mantém anel BLOCO F; header usa outline suave — legível e não genérico.
3. **Timing:** 150 ms partilhado no HUD via variáveis + fallbacks; shell alinhado a `duration-150` — coerência **declarativa** entre camadas.
4. **Profundidade:** sombra base em `.btn-dashboard`; hover eleva (`translateY` negativo); active aproxima do plano — hierarquia clara.
5. **`:disabled`:** `pointer-events` e estilos de hover/active/focus em `.hud-btn` excluem `:disabled` onde necessário — Recarregar desativado durante chute não deve animar como ativo.

---

## 4. Regressões encontradas

**Nenhuma regressão estrutural ou funcional** detetável por revisão estática:

- **Layout:** `padding`, `border-radius`, posicionamento de `.hud-footer` / `.hud-bottom-*` **inalterados** relativamente ao bloco existente; apenas estados pseudo e transições.
- **Gameplay:** sem mudanças em JSX de jogo nesta cirurgia.
- **Overlays / stage / G-1:** `game-shoot.css` e zonas `.gs-zone` não fazem parte deste diff.

**Observação neutra (não é falha):** `.control-btn` não usa `:not(:disabled)` no `:hover`/`:active` — o botão de áudio no `GameFinal` não é desativado por prop; comportamento esperado mantém-se.

**Regressões visuais em runtime:** não verificáveis sem preview.

---

## 5. Integridade arquitetural

| Critério | Estado |
|----------|--------|
| BLOCO F (HUD, footer **JOGAR AGORA** com ring/safe-area) | **Preservado** — mesmas classes base; acrescentam-se só `duration-150` e `active:` no gradiente. |
| G-1 (zonas em `game-shoot.css`) | **Intacto** — sem edições G-2 nesse ficheiro. |
| `body[data-page="game"]` como âncora | **Reforçado** — variáveis só neste escopo. |
| Legado `.gs-hud` | **Não tocado** em `game-shoot.css` para G-2. |
| Separação shell vs `/game` | **Mantida** — `InternalPageLayout` sem `data-page`; estilos do jogo concentrados em `game-scene.css` carregado pelo `GameFinal`. |

---

## 6. Segurança para a V1

**Classificação: APROVADO COM RESSALVAS**

- **Aprovação técnica:** escopo, especificidade e exclusão de `:disabled` estão corretos; risco de quebra lógica é **baixo**.
- **Ressalva:** validação perceptiva final (contraste do outline em fundo real, leitura do **Recarregar** grande com foco) deve ser feita **no preview** antes de considerar fechamento total do G-2.

---

## 7. Próxima melhor micro-cirurgia

Conforme `BLOCO-G-PLANO-INICIAL.md`, após G-1 e G-2, o próximo passo de **baixo risco** e impacto perceptivo é **G-4** — polish mínimo do estado de **carregamento** do `/game` (transição de entrada ou skeleton leve no wrapper existente de “Carregando jogo…”), **sem** alterar fetch nem lógica — apenas CSS / marcação mínima se necessário.

*(G-5 — unificação de animações de overlays — só quando for aceite tocar em `GameFinal`/`game-shoot` para overlays; fora do escopo imediato se se quiser evitar qualquer risco em cadeia de timings.)*

---

## 8. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| Botões ficaram mais “premium” no código? | **Sim** — estados completos e timing explícito. |
| Clique/press melhor **em desenho**? | **Sim** — `:active` e sombras coerentes. |
| `focus-visible` correto **em intenção**? | **Sim** — visível, com cores da marca; **confirmar** em dispositivo. |
| Seguro para a V1? | **Sim, com smoke test** no preview. |
| Avançar para a próxima cirurgia? | **Sim** — recomendado **G-4** (loading) ou planeamento explícito de G-5 se overlays forem aceites. |

---

**Assinatura:** validação estática de repositório; não substitui QA manual no browser.
