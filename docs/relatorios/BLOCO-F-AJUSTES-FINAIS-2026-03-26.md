# BLOCO F — Ajustes finais (safe-area + disabled)

**Data:** 2026-03-26  
**Tipo:** Cirurgia controlada — apenas dois ficheiros, duas alterações pontuais.

---

## 1. Resumo das alterações

1. **Safe-area no footer** (`InternalPageLayout.jsx`): o `footer` deixou de usar `py-4 px-4` e passou a usar `pt-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]`, preservando o espaçamento base de 1rem no fundo e somando o inset seguro do sistema quando existir (ex.: iOS). Em ambientes onde `env(safe-area-inset-bottom)` é `0`, o padding inferior mantém-se **1rem** — comportamento visual alinhado ao anterior em Android/desktop.

2. **Disabled no Withdraw** (`Withdraw.jsx`): no botão de submissão do formulário de saque, `disabled:opacity-90` foi substituído por `disabled:opacity-50`, alinhado aos outros botões PRIMARY do app shell. `disabled:cursor-not-allowed` e o gradiente `disabled:from-gray-500 disabled:to-gray-600` foram **mantidos**.

---

## 2. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/components/InternalPageLayout.jsx` | Classe do `footer`: padding inferior com `calc` + safe-area. |
| `goldeouro-player/src/pages/Withdraw.jsx` | Uma classe no botão submit: `disabled:opacity-50`. |

---

## 3. Confirmação de escopo

- **Não alterado:** `Register.jsx`, `Profile.jsx`, `Pagamentos.jsx`, `ResetPassword.jsx` (incl. ecrã de sucesso), restantes páginas, `GameFinal.jsx`, `game-scene.css`, `game-shoot.css`.
- **Estrutura:** HTML/JSX do footer e do formulário de saque **inalterados**; apenas strings de `className`.
- **Lógica:** nenhum `onClick`, `disabled={...}`, validação ou chamada a API foi modificada.
- **Botão SUPER PRIMARY:** classes do botão “⚽ JOGAR AGORA” **não** foram alteradas.

---

## 4. Confirmação — gameplay não afetado

Nenhum ficheiro da rota `/game` ou dos estilos HUD (`game-scene.css`, `game-shoot.css`, `GameFinal.jsx`) foi tocado. O fluxo de jogo e overlays permanecem iguais.

---

## 5. Validação recomendada (preview)

- [ ] iPhone com home indicator: footer com espaço confortável acima da área do sistema.
- [ ] Android / desktop: footer visualmente equivalente ao anterior (padding inferior ~1rem quando inset = 0).
- [ ] Withdraw: com formulário inválido ou durante envio, botão com opacidade 50% em disabled, cursor não permitido.

---

**Status documental (2026-03-26):** integrado no encerramento oficial — `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`.

*Documento gerado na sequência da implementação.*
