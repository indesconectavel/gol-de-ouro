# BLOCO F — CIRURGIA DE BOTÕES

**Data:** 2026-03-26  
**Base:** `BLOCO-F-AUDITORIA-FINAL-BOTOES-READONLY-2026-03-26.md`, `STATUS-ATUAL-BLOCOS-GOLDEOURO-2026-03-26.md`  
**Âmbito:** apenas `className` / estilos Tailwind no app shell — **sem** alteração de lógica, fluxos ou ficheiros de jogo.

---

## 1. Resumo executivo

Foi aplicada a padronização visual mínima acordada:

- **SUPER PRIMARY:** o botão global **“⚽ JOGAR AGORA”** no footer de `InternalPageLayout.jsx` passou a usar gradiente dourado/âmbar, anel luminoso (`ring-2`), sombra com glow controlado e `hover` coerente, com `overflow-visible` no footer para reduzir risco de clipping. Não foi alterado o espaçamento estrutural (`py-4 px-4` do footer mantido).

- **PRIMARY:** submissões e CTAs principais foram alinhados ao **gradiente verde** (`from-green-500` → `to-green-600`, hover mais escuro, texto branco), incluindo `Register`, `ForgotPassword`, `ResetPassword`, `Pagamentos` (CTA, copiar PIX, link Mercado Pago), ajustes em `Withdraw` (modal e submit sem borda extra redundante), e `Profile` (Salvar).

- **SECONDARY:** botão **Editar** no Perfil com glass + borda sky; **Cancelar** com glass neutro; abas ativas do Perfil deixaram o gradiente amarelo (que competia com o SUPER PRIMARY) e passaram a destaque **sky** contido (`bg-sky-600/35`, borda `sky-400/60`).

- **TERTIARY:** links auxiliares no `Register` unificados a **amarelo** (alinhado ao Login); pequenos `transition-colors` no header de `InternalPageLayout`.

- **Termos / Privacidade:** voltar com o mesmo padrão **SECONDARY** compacto (círculo glass) usado em Saque/Perfil; spacer do header ajustado de `w-8` para `w-10` para equilibrar o botão circular.

- **`Dashboard.jsx`:** nenhuma alteração necessária após revisão — tiles já correspondiam ao padrão SECONDARY (glass).

**Não tocado:** `GameFinal.jsx`, `game-scene.css`, `game-shoot.css`, `layoutConfig.js`, `gameService.js`, APIs, hooks, handlers.

---

## 2. Arquivos alterados

| Ficheiro |
|----------|
| `goldeouro-player/src/components/InternalPageLayout.jsx` |
| `goldeouro-player/src/pages/Login.jsx` |
| `goldeouro-player/src/pages/Register.jsx` |
| `goldeouro-player/src/pages/ForgotPassword.jsx` |
| `goldeouro-player/src/pages/ResetPassword.jsx` |
| `goldeouro-player/src/pages/Pagamentos.jsx` |
| `goldeouro-player/src/pages/Withdraw.jsx` |
| `goldeouro-player/src/pages/Profile.jsx` |
| `goldeouro-player/src/pages/Terms.jsx` |
| `goldeouro-player/src/pages/Privacy.jsx` |

**Não alterado:** `goldeouro-player/src/pages/Dashboard.jsx`, `DownloadPage.jsx`.

---

## 3. Alterações por arquivo

### `InternalPageLayout.jsx`

- **SUPER PRIMARY — footer “⚽ JOGAR AGORA”:** gradiente `from-amber-400 via-yellow-500 to-amber-400`, `text-slate-900`, `ring-2 ring-amber-200/90`, sombras com glow, hover mais claro, `focus-visible` para foco por teclado; footer e wrapper com `overflow-visible` e `py-0.5` no contentor do botão.
- **TERTIARY — header:** `transition-colors` em “← MENU PRINCIPAL” e “SAIR DA CONTA”.

### `Login.jsx`

- **TERTIARY:** “Cadastre-se aqui” com `transition-colors` (PRIMARY do submit já estava correto).

### `Register.jsx`

- **PRIMARY:** submit com gradiente verde unificado; `disabled:cursor-not-allowed disabled:opacity-50`; estado `isSubmitting` mantém fundo cinza.
- **TERTIARY:** “Faça login aqui” e links legais do rodapé em `text-yellow-400` (antes verde), com `transition-colors` onde aplicável.

### `ForgotPassword.jsx`

- **PRIMARY:** botão de envio de link: de amarelo sólido para gradiente verde unificado; `disabled:opacity-50 disabled:cursor-not-allowed` preservados.

### `ResetPassword.jsx`

- **PRIMARY:** formulário “Alterar senha” — gradiente verde; spinner de loading com `border-white` (antes `border-green-900` por contraste com fundo claro do botão amarelo).
- **PRIMARY:** ecrã de sucesso “Ir para Login” — gradiente verde alinhado aos restantes.

### `Pagamentos.jsx`

- **PRIMARY:** CTA “Garantir … chutes” — `emerald` → gradiente verde + texto branco.
- **PRIMARY:** “Copiar código PIX” — estados default/copiado em verde (`gradient` / `bg-green-600/90`).
- **PRIMARY:** `<a>` Mercado Pago — gradiente verde + texto branco.

### `Withdraw.jsx`

- **PRIMARY:** submit “Solicitar Saque” — remoção de `backdrop-blur` + `border` redundantes; `disabled:opacity-90` para feedback quando desativado; restantes estados preservados.
- **PRIMARY:** modal “Entendi” — padding `py-3` alinhado; sem borda extra.

### `Profile.jsx`

- **Abas (7):** estado ativo: **sky** contido (sem gradiente dourado/amarelo); inativo inalterado em intenção (glass).
- **SECONDARY:** “Editar” — glass + borda sky.
- **PRIMARY:** “Salvar” — gradiente verde sem borda duplicada.
- **SECONDARY:** “Cancelar” — glass neutro em vez de gradiente cinza forte.

### `Terms.jsx` / `Privacy.jsx`

- **SECONDARY:** voltar (←) — círculo `w-10 h-10` glass, alinhado a Withdraw/Profile.
- Spacer direito `w-10` + `aria-hidden` para simetria com o botão.

---

## 4. O que foi preservado

| Item | Confirmação |
|------|----------------|
| Lógica React | Nenhum `useState`, `onClick`, `navigate`, `apiClient` ou validação alterados. |
| Handlers | Todos preservados. |
| Textos | Sem mudança de cópia (exceto classes). |
| Gameplay | `GameFinal.jsx` e CSS de jogo **não** modificados. |
| Rota `/game` | Não referenciada em alterações de código (apenas `navigate('/game')` já existente no footer). |
| Estados `disabled` / loading | Mantidos; spinners e mensagens de loading inalterados em significado. |

---

## 5. Riscos evitados (auditoria)

- **Conflito Tailwind × CSS de jogo:** nenhum ficheiro de jogo alterado.
- **Abas vs SUPER PRIMARY:** abas passaram a sky — não competem com o footer dourado.
- **Clipping do glow:** `overflow-visible` no footer e wrapper.
- **Regressão funcional:** apenas `className`; sem mudança de fluxo PIX/saque/auth.

---

## 6. Pontos de atenção pós-cirurgia

1. **Preview:** validar footer “JOGAR AGORA” em ecrãs pequenos (glow pode exigir ajuste fino de `shadow` se algum ancestral global tiver `overflow-hidden`).
2. **Perfil:** confirmar leitura das abas ativas (contraste sky sobre fundo escuro).
3. **Pagamentos:** CTA passou a texto branco — confirmar legibilidade em todos os estados.
4. **ResetPassword:** spinner branco sobre botão verde — confirmar visibilidade.

---

## 7. Checklist de validação visual (preview)

- [ ] Footer: “JOGAR AGORA” com aparência dourada premium, glow visível, sem cortar sombra.
- [ ] Login / Registo / Forgot / Reset: botões principais verdes consistentes; links amarelos coerentes no Registo.
- [ ] Pagamentos: CTA + copiar + link MP com o mesmo “look” PRIMARY verde.
- [ ] Saque: submit + modal; estados disabled.
- [ ] Perfil: abas ativas sky; Editar / Salvar / Cancelar hierarquia clara.
- [ ] Termos / Privacidade: botão voltar circular alinhado às outras telas.
- [ ] `/game`: abrir e confirmar HUD/overlays **inalterados** (smoke test).

---

## 8. Conclusão objetiva

A cirurgia limitou-se a **classes Tailwind** nos ficheiros do app shell listados, cumpriu o **SUPER PRIMARY** exclusivo no footer, unificou o **PRIMARY** verde nos formulários e CTAs financeiros, clarificou **SECONDARY** e **TERTIARY**, e afastou o **Perfil** de um conflito visual com o CTA máximo. O código está **pronto para validação visual em preview** e regressão funcional leve; **nenhuma** alteração foi feita em caminhos de jogo ou API.

---

**Status documental (2026-03-26):** integrado no encerramento oficial — `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`.

*Relatório gerado na sequência da implementação do dia 2026-03-26.*
