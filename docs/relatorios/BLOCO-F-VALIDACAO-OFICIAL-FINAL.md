# BLOCO F — Validação oficial final

**Data do relatório:** 2026-03-27  
**Modo:** validação por evidência em código e histórico Git; **sem alteração de código**; **sem execução de browser/preview nesta sessão** para captura visual.

**HEAD local auditado:** `4ff3d48` (`fix(player): dobra área visual do botão Recarregar no /game`).

---

## 1. Resumo executivo

O **BLOCO F** entregou padronização relevante do **app shell** (`InternalPageLayout`, footer **SUPER PRIMARY**, `safe-area`), ajustes em páginas auth e internas no commit `ef345f3`, e uma sequência de correções ao **HUD do `/game`** em `game-scene.css` / `game-shoot.css` (`7be6f24`, `cc1cbc8` e commits subsequentes até `4ff3d48`).

**Evidência técnica:** o isolamento do HUD do `GameFinal` via `body[data-page="game"]`, a blindagem da linha de aposta e valores dourados, e o escopo **`.gs-hud`** em `game-shoot.css` estão **presentes no código** e alinhados ao objetivo de cascata.

**Limite desta validação:** **não foi feita verificação visual ao vivo** (preview Vercel ou `npm run dev`) nesta sessão. Logo, a frase “100% concluído **visualmente**” exige **aceitação explícita humana** após smoke no deploy ou local. Do ponto de vista **estático**, a classificação é **APROVADO COM AJUSTES FINOS** (detalhes na secção 6).

---

## 2. Escopo validado

| Área | Ficheiros / artefactos |
|------|-------------------------|
| App shell | `goldeouro-player/src/components/InternalPageLayout.jsx` |
| Auth + internas (BLOCO F fechamento) | `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Pagamentos.jsx`, `Withdraw.jsx`, `Profile.jsx`, `Terms.jsx`, `Privacy.jsx` (tocados em `ef345f3`) |
| HUD `/game` | `game-scene.css`, `game-shoot.css`, `GameFinal.jsx` |
| Rotas | `App.jsx` — `/game` → `GameFinal` + `ProtectedRoute` |
| Commits de referência solicitados | `ef345f3`, `7be6f24`, `cc1cbc8` — **existem no histórico** (`git show` confirmado) |

---

## 3. Evidências técnicas

### 3.1 App shell

- **SUPER PRIMARY “⚽ JOGAR AGORA”:** presente no footer de `InternalPageLayout.jsx` (gradiente âmbar/amarelo, `ring`, `shadow`, estados `hover` e `focus-visible`).
- **Safe-area no footer:** `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]` no `<footer>` — confirma requisito de safe-area.
- **Header:** “← MENU PRINCIPAL” + logo + título; placeholder `aria-hidden` quando não há logout — layout coerente.

### 3.2 Sistema de botões (código)

- **Não existe** um único componente React `<Button variant=…>` partilhado por todo o app; a padronização é por **repetição de classes Tailwind** (já documentado em `BLOCO-F-AUDITORIA-FINAL-BOTOES-READONLY-2026-03-26.md`).
- **Categorias semânticas** (SUPER PRIMARY / PRIMARY / SECONDARY / TERTIARY) **aplicam-se por convenção** às classes escolhidas; **há divergências residuais** entre rotas (ex.: `Login` usa gradiente verde no submit; `ForgotPassword` / partes de `ResetPassword` usam amarelo forte — evidência no mesmo relatório de auditoria e nos ficheiros).
- **Estados:** `disabled`/`loading` aparecem onde o contexto expõe `loading` ou `isSubmitting` (ex. Login); **não foi feita matriz exaustiva** ficheiro a ficheiro nesta validação.

### 3.3 `/game` — HUD

- **`body[data-page="game"]`:** definido em `GameFinal.jsx` no mount e **removido** no cleanup do `useEffect` — correcto para não vazar estilos.
- **`game-scene.css`:** variáveis `--stat-gap-*`, header, `.stat-value` com `nowrap` e cor dourada no escopo `body[data-page="game"] .hud-header .stat-value`, linha de aposta com `.bet-label` / `.bet-value-fixed` blindados — **fonte principal do HUD** do `GameFinal`.
- **`game-shoot.css`:** regras de stats/bet **prefixadas** com `.gs-hud` onde aplicável (ex. `.gs-hud .bet-label`); comentário explícito de não sobrescrever `.hud-header` do GameFinal — **isolamento por escopo**, não por ficheiro único (ambos os CSS são importados em `GameFinal.jsx`).
- **MENU PRINCIPAL:** `.btn-dashboard` com preto forçado no header do jogo (`body[data-page="game"] .hud-header .btn-dashboard`).
- **Recarregar:** `body[data-page="game"] .hud-bottom-left .hud-btn.primary` com pill amarelo, texto preto, padding e `font-size` elevados (commit `4ff3d48`).

### 3.4 Gameplay (estrutura e lógica)

- **`GameFinal.jsx` não esteve “congelado” em todo o histórico:** existem commits recentes que o alteram (ex. `4284721` música, `43444a2` overlays, `101d42a` assets/lógica). Para o critério **“não alterado estruturalmente no âmbito BLOCO F UI/UX”**: os commits **de HUD em CSS** (`7be6f24`, `cc1cbc8`, `aa2bb72`, …) **não listam** `GameFinal.jsx` nas estatísticas; alterações ao ficheiro referem-se sobretudo a **jogo/overlays/áudio**, não a um redesenho completo do JSX do HUD.
- **Overlays:** portal para `#game-overlay-root` e lógica de fases — presentes no código; **teste de runtime não efectuado** nesta sessão.
- **Áudio:** `musicManager`, `isMuted`, `crowdAudioRef` — presentes; **reprodução não testada** aqui.

### 3.5 Pipeline

- **Repositório local:** último commit na branch auditada inclui alterações de HUD/player até `4ff3d48`.
- **Preview/deploy:** **não foi possível** confirmar que o URL Vercel serviu o bundle com o mesmo **SHA** que o HEAD local — isso exige verificação no dashboard Vercel ou no comentário de deploy. **Não assumir** paridade local/deploy sem essa evidência.

---

## 4. Evidências visuais

| Tipo | Estado |
|------|--------|
| Screenshot / preview Vercel / sessão `npm run dev` nesta validação | **Não disponível** |
| Consequência | A consistência **visual global** (pixel-perfect entre todas as páginas) **não foi comprovada** aqui; mantém-se como **critério de aceitação manual** ou QA |

---

## 5. Checklist consolidado

| Item | Classificação | Nota breve |
|------|---------------|------------|
| App shell | **OK** | SUPER PRIMARY + safe-area + header coerentes no código |
| Botões | **PROBLEMA** | Padronização real por Tailwind; divergências residuais entre fluxos auth (documentado); sem componente único |
| `/game` HUD | **OK** | `data-page`, `game-scene.css`, escopo `.gs-hud`, aposta e stats blindados no código |
| Gameplay | **OK** | Lógica e estrutura presentes; **teste manual** de chute/overlays/áudio recomendado |
| Pipeline | **PROBLEMA** | SHA no preview **não verificado** nesta sessão |

---

## 6. Classificação final

**APROVADO COM AJUSTES FINOS**

**Motivos:** (1) evidência estática forte para HUD e app shell; (2) sistema de botões **não** é uniforme ao nível de um único componente nem idêntico em todas as páginas auth; (3) validação visual e paridade deploy não demonstradas neste relatório.

Para reclassificar a **APROVADO** “absoluto”: completar smoke visual no preview (ou local) + confirmar commit deploy = `4ff3d48` (ou o SHA alvo) no Vercel.

---

## 7. Decisão de encerramento

- **Encerramento técnico do BLOCO F (UI/UX + HUD + cascata CSS):** **sim**, com base no código e nos commits citados.
- **Encerramento absoluto “100% visual + pipeline verificado”:** **não** sem QA visual e confirmação do deploy.

**Próximos passos mínimos sugeridos (não bloqueantes de código):**

1. Abrir preview (ou local), percorrer Dashboard → Pagamentos → `/game` → verificar HUD e Recarregar.
2. No Vercel, confirmar que o deployment de `feature/bloco-e-gameplay-certified` aponta para o commit esperado.
3. (Opcional) alinhar variantes PRIMARY restantes nas páginas auth se o produto exigir identidade pixel-perfect única.

---

*Documento gerado em modo read-only, sem alterações ao repositório além deste ficheiro de relatório.*
