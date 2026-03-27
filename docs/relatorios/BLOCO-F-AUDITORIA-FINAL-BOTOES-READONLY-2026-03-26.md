# BLOCO F — Auditoria final de botões e refinamento visual (READ-ONLY)

**Data:** 2026-03-26  
**Modo:** Auditoria estática — nenhum ficheiro de código alterado  
**Âmbito:** `goldeouro-player/src/` — camada visual do app shell (exclui alterações a `GameFinal.jsx`, `game-scene.css`, `game-shoot.css` por decisão de escopo)  
**Referência de rotas:** `goldeouro-player/src/App.jsx`

---

## Resumo executivo

O **player web** usa quase exclusivamente elementos `<button>` e alguns `<a>` / `<Link>` com classes **Tailwind** inline por página. **Não existe** um componente React único de botão partilhado por todas as telas (padrão por repetição de strings de classe).

A padronização semântica proposta (**SUPER PRIMARY** dourado + glow só para “JOGAR AGORA”; **PRIMARY** gradiente verde para confirmações; **SECONDARY** glass; **TERTIARY** texto; **GAME BUTTON** isolado) é **compatível com o código atual** desde que:

1. As alterações limitem-se a **classes Tailwind** em ficheiros do app shell listados neste documento.  
2. **Não** se modifiquem `GameFinal.jsx` nem os CSS importados por ele (`game-scene.css`, `game-shoot.css`).  
3. Se trate com cuidado o componente **`InternalPageLayout.jsx`** (impacto global em todas as páginas que o envolvem).

O **isolamento app vs jogo** confirma-se: a rota `/game` renderiza apenas `GameFinal` **sem** `InternalPageLayout`; os ficheiros CSS do jogo são importados **só** em `GameFinal.jsx` (e variantes de desenvolvimento). Nomes como `.btn-dashboard` no CSS de jogo **não** são os mesmos que os botões Tailwind da página `Dashboard.jsx`.

**Inconsistência documental:** o relatório `BLOCO-F-INTERFACE-READONLY-2026-03-08.md` descreve `Pagamentos` com “tema claro”; o código atual de `Pagamentos.jsx` usa **fundo escuro** (`bg-slate-900/95`) e cartões glass — a interface evoluiu após março/2026.

---

## 1. Inventário de botões e controlos clicáveis (app shell)

Legenda de categorização semântica alvo:

| Categoria | Uso alvo |
|-----------|----------|
| **SUPER PRIMARY** | “JOGAR AGORA” (footer global), CTAs máximos de entrada no jogo |
| **PRIMARY** | Submissão de formulários, confirmação forte |
| **SECONDARY** | Navegação destacada, glass, suporte |
| **TERTIARY** | Links de texto, ações discretas, ícones |
| **GAME BUTTON** | HUD, zonas de chute, CSS `game-*` — **fora do escopo de cirurgia app** |

### 1.1 `pages/Login.jsx`

| # | Contexto | Elemento | Classe / estilo principal | Categoria atual sugerida |
|---|----------|----------|---------------------------|---------------------------|
| 1 | Alternar visibilidade da senha | `<button type="button">` | `absolute inset-y-0 right-0 pr-3 flex items-center` (ícone) | TERTIARY / ícone |
| 2 | Enviar login | `<button type="submit">` | `w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg … disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none` | PRIMARY |
| 3 | Ir para registo | `<button>` | `text-yellow-400 hover:text-yellow-300 font-medium` | TERTIARY |

**Nota:** “Esqueceu a senha?” é `<a href="/forgot-password">`, não `<button>`.

**Tecnologia:** Tailwind apenas. **Loading:** texto dinâmico via `loading` do contexto (`Entrando…`).

---

### 1.2 `pages/Register.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1–2 | Toggle senha / confirmar | `absolute …` ícone | TERTIARY |
| 3–4 | Termos / Privacidade (inline) | `text-yellow-400 hover:text-yellow-300 underline` | TERTIARY |
| 5 | Submeter registo | `w-full font-bold py-3 px-6 rounded-lg` — **sólido** `bg-green-600 hover:bg-green-700` ou `bg-gray-500` se `isSubmitting` | PRIMARY (variante visual diferente de Login) |
| 6 | “Faça login aqui” | `text-green-400 hover:text-green-300 font-medium` | TERTIARY (**cor diverge** do Login) |
| 7–8 | Links legais rodapé | `text-green-400 … underline` | TERTIARY |

**Tecnologia:** Tailwind. **Loading:** `isSubmitting` → texto “⏳ Criando conta…” e fundo cinza.

---

### 1.3 `pages/ForgotPassword.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | Enviar link | `w-full bg-yellow-400 text-green-900 font-semibold py-3 px-4 rounded-lg hover:bg-yellow-300 … disabled:opacity-50` | PRIMARY **ou** SUPER-adjacente (amarelo forte; **não** é o gradiente verde) |
| — | Voltar ao login | `<Link>` `inline-flex … text-yellow-400 hover:text-yellow-300` | TERTIARY |
| — | Sucesso: voltar | `<Link>` mesma classe TERTIARY | TERTIARY |

**Tecnologia:** Tailwind + `lucide-react`.

---

### 1.4 `pages/ResetPassword.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1–2 | Toggle senhas | ícone absoluto | TERTIARY |
| 3 | Submeter nova senha | `w-full bg-yellow-400 text-green-900 font-semibold py-3 px-4 rounded-lg` + spinner condicional | PRIMARY (amarelo) |
| 4 | “Ir para login” (sucesso) | `bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700` | PRIMARY (verde sólido) |
| 5 | Voltar ao pedido | `inline-flex … text-yellow-400` | TERTIARY |

**Tecnologia:** Tailwind.

---

### 1.5 `pages/Dashboard.jsx` (conteúdo dentro de `InternalPageLayout`)

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | Logout (emoji 👤) | `text-white/70 hover:text-white … p-2 rounded-full hover:bg-white/10 hover:scale-110` | TERTIARY |
| 2–5 | Tiles Jogar / Depositar / Sacar / Perfil | `bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6 … border border-white/20 shadow-lg` + hover scale | SECONDARY (navegação) |
| 6 | “Ver todas →” | `text-yellow-400 text-sm hover:text-yellow-300` | TERTIARY |

**Tecnologia:** Tailwind. **Cor:** branco translúcido; **padding:** `py-4 px-6`; **radius:** `rounded-xl`.

---

### 1.6 `pages/Pagamentos.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | ← Voltar | `bg-white/10 hover:bg-white/20 … px-4 py-2 rounded-xl border border-white/20 text-sm` | SECONDARY |
| 2–7 | Valores R$ (grid) | `p-3 rounded-xl border-2` + variantes sky/âmbar/branco | SECONDARY / seletor |
| 8 | Garantir chutes | `w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-3 px-4 rounded-xl font-semibold disabled:opacity-50` | PRIMARY (**emerald**, não gradiente verde) |
| 9 | Copiar PIX | `px-6 py-3 rounded-xl` estado `copiado` vs default emerald | PRIMARY |
| — | Mercado Pago | `<a>` `inline-block bg-emerald-500 … px-6 py-3 rounded-xl` | PRIMARY |

**Tecnologia:** Tailwind. **Loading:** texto “Criando Pagamento…”.

---

### 1.7 `pages/Withdraw.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | Voltar (←) | `rounded-full w-10 h-10 … bg-white/10 backdrop-blur-lg` | SECONDARY compacto |
| 2 | Usar saldo total | `text-yellow-400 text-sm hover:text-yellow-300` | TERTIARY |
| 3–6 | Tipo PIX (4 botões) | `p-3 rounded-lg border-2` + estado ativo amarelo | SECONDARY / segmentado |
| 7 | Solicitar saque | `w-full bg-gradient-to-r from-green-500 to-green-600 … rounded-lg` + `disabled:from-gray-500` + spinner | PRIMARY |
| 8 | Modal “Entendi” | gradiente verde `py-2 px-6 rounded-lg` | PRIMARY |

**Tecnologia:** Tailwind.

---

### 1.8 `pages/Profile.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | Voltar | igual `Withdraw` (círculo ←) | SECONDARY |
| 2–8 | Abas (7) | inativo: `bg-white/10 … border`; ativo: `bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900` | Tab **≠** botão CTA padrão; visual próximo a SUPER/destaque |
| 9 | Editar | `bg-gradient-to-r from-blue-500 to-blue-600 … py-2 px-4 rounded-lg` | SECONDARY com acento |
| 10 | Salvar | gradiente verde `py-3 px-6` | PRIMARY |
| 11 | Cancelar | gradiente cinza | SECONDARY / cancelamento |

**Tecnologia:** Tailwind. **Risco de layout:** 7 abas em `flex space-x-2` sem wrap explícito.

---

### 1.9 `components/InternalPageLayout.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | ← MENU PRINCIPAL | `text-white/90 hover:text-white text-sm font-medium flex items-center gap-1` | TERTIARY / navegação |
| 2 | SAIR DA CONTA (se `showLogout`) | `text-red-400 hover:text-red-300 text-sm font-medium` | TERTIARY |
| 3 | **⚽ JOGAR AGORA** (footer) | `bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg` | **SUPER PRIMARY** (candidato natural a glow) |

**Evidência de decisão prévia:** comentário no ficheiro — `// BLOCO F — Navegação interna (sem TopBar)`; footer documentado como “⚽ JOGAR AGORA”.

**Tecnologia:** Tailwind. **Container footer:** `py-4 px-4`, `flex justify-center` — sem `overflow-hidden` no próprio footer.

---

### 1.10 `pages/Terms.jsx` e `pages/Privacy.jsx`

| # | Contexto | Classe / estilo principal | Categoria atual sugerida |
|---|----------|---------------------------|---------------------------|
| 1 | Voltar (←) | `text-white/70 hover:text-white text-2xl` **sem** círculo glass (diferente de Withdraw/Profile) | TERTIARY |

---

### 1.11 `pages/DownloadPage.jsx`

- Não usa `<button>`; usa `<a href="/download.html">` com estilo **inline** (`style={{ color: '#fbbf24' }}`).
- **Fora** do conjunto Tailwind do resto do player; refinamento eventual é **página isolada**.

---

### 1.12 GAME BUTTON — `pages/GameFinal.jsx` (inventário de referência, escopo intocável)

| # | Contexto | Mecanismo | Observação |
|---|----------|-----------|------------|
| 1 | MENU PRINCIPAL | `className="btn-dashboard"` | Definido em `game-scene.css` |
| 2 | Zonas TL/TR/C/BL/BR | `gs-zone` + **estilos inline** (position, size, border, background) | Tamanho depende de `targetSize` em JS |
| 3 | Recarregar (PIX) | `hud-btn primary` | `game-shoot.css` / `game-scene.css` |
| 4 | Áudio | `control-btn` | Idem |

**Imports:** `import './game-scene.css'; import './game-shoot.css';` — **apenas** neste módulo de página de jogo.

---

## 2. Inconsistências atuais (resumo técnico)

1. **PRIMARY:** coexistem **gradiente verde** (Login, Withdraw, Profile Salvar), **verde sólido** (Register), **emerald** (Pagamentos + `<a>` MP), **amarelo** (Forgot/Reset submit em alguns passos), **verde sólido** (Reset sucesso).  
2. **SUPER PRIMARY:** apenas o footer **JOGAR AGORA** usa amarelo opaco; o **Dashboard** “Jogar” é **glass SECONDARY**, não o mesmo peso visual.  
3. **Voltar:** três padrões — retangular glass (Pagamentos), círculo (Withdraw/Profile), texto simples (Terms/Privacy).  
4. **TERCIARY:** Login usa amarelo para “Cadastre-se”; Register usa **verde** para “Faça login” — divergência de cor.  
5. **Abas Profile:** estado ativo em gradiente amarelo pode **competir semanticamente** com SUPER PRIMARY se ambos forem “dourados” no novo sistema — requer regra de design (ex.: abas com saturação menor ou borda, sem glow).

---

## 3. Validação do novo sistema visual (compatibilidade)

| Nível | Compatível? | Notas |
|-------|-------------|--------|
| SUPER PRIMARY | **Sim** | Reforçar só `InternalPageLayout` footer; `index.css` já tem utilitário `.pulse-glow` (box-shadow) — pode reutilizar sem novo ficheiro de estilo se a equipa optar por classe existente + Tailwind `shadow-*` / `ring-*`. |
| PRIMARY | **Sim** | Colapsar variantes para o **gradiente verde** já usado em Login/Withdraw exige editar **class strings** em Pagamentos (emerald → verde) e alinhar Register/Forgot/Reset — **sem** mudar handlers. |
| SECONDARY | **Sim** | Padrão glass já existe (Dashboard, Pagamentos Voltar); extensível a “Editar” e seletores PIX. |
| TERTIARY | **Sim** | Unificar links para uma família de cor (ex.: amarelo). |
| GAME BUTTON | **Sim (por exclusão)** | Nenhuma alteração obrigatória para cumprir o objetivo do app shell. |

**Conclusão:** o sistema é **compatível** com o código atual **desde que** as mudanças sejam **puramente de classes** e testadas em **preview** (especialmente footer com glow e abas do Perfil).

---

## 4. Riscos técnicos (com nível)

| Risco | Nível | Detalhe |
|-------|--------|---------|
| Alteração acidental de `GameFinal.jsx` / CSS de jogo | **Alto** | Quebra HUD/overlays; proibido pelo escopo. |
| `InternalPageLayout` altera muitas rotas de uma vez | **Médio** | Dashboard, Perfil, Saque, Pagamentos, e **`GameShoot`** se usar o layout. |
| Estados `disabled` / `loading` esquecidos ao copiar classes | **Médio** | Regressão de UX; manter `disabled:opacity-50`, `disabled:cursor-not-allowed`, spinners. |
| Abas Profile: overflow horizontal em mobile | **Médio** | Mudança de padding/fonte pode piorar; testar viewport estreito. |
| Glow / sombra no SUPER PRIMARY: clipping | **Baixo–Médio** | Se algum ancestral aplicar `overflow-hidden` no eixo Y; footer atual não mostra clip óbvio no JSX. |
| Conflito Tailwind vs CSS jogo | **Baixo** | Apenas se o mesmo elemento tiver ambos; **não** ocorre nas páginas app atuais. |
| Nome `.btn-dashboard` (CSS) vs página “Dashboard” | **Baixo** | Risco humano de grep errado, não colisão CSS no DOM. |

---

## 5. Isolamento entre app e game

| Questão | Resposta baseada em código |
|---------|----------------------------|
| `GameFinal.jsx` isolado do app shell Tailwind? | **Sim** para estilos: importa `game-scene.css` e `game-shoot.css`; não usa `InternalPageLayout`. |
| `InternalPageLayout` afeta `/game`? | **Não.** `App.jsx`: `/game` → `<GameFinal />` diretamente. |
| Classes partilhadas app ↔ HUD? | **Não há** a mesma classe CSS aplicada aos dois mundos: app usa utilitários Tailwind; HUD usa `btn-dashboard`, `hud-btn`, `gs-zone`, etc., carregados só com o bundle da página de jogo. |
| Risco da “cirurgia visual” atingir gameplay? | **Nulo** se os ficheiros excluídos não forem editados. |
| `GameShoot.jsx` e `InternalPageLayout` | **`GameShoot`** envolve conteúdo com `InternalPageLayout` (ficheiro referenciado em auditorias). Qualquer mudança no header/footer **altera** a casca visual dessa rota; **não** altera o interior do `GameFinal` nem a rota `/game`. |

---

## 6. Estratégia segura de execução (sem implementação aqui)

### 6.1 Ficheiros que seriam afetados (app shell)

- **Obrigatório para SUPER PRIMARY:** `components/InternalPageLayout.jsx`  
- **Prováveis:** `pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Dashboard.jsx`, `Pagamentos.jsx`, `Withdraw.jsx`, `Profile.jsx`  
- **Opcional / baixa prioridade:** `Terms.jsx`, `Privacy.jsx`, `DownloadPage.jsx` (inline styles)  
- **Excluídos:** `pages/GameFinal.jsx`, `pages/game-scene.css`, `pages/game-shoot.css`

### 6.2 Ordem recomendada

1. `InternalPageLayout.jsx` (uma superfície, validação global do footer).  
2. Fluxos auth: `Login.jsx` → `Register.jsx` → `ForgotPassword.jsx` → `ResetPassword.jsx`.  
3. `Pagamentos.jsx` (PRIMARY emerald → alinhar ao verde acordado).  
4. `Withdraw.jsx`.  
5. `Dashboard.jsx`.  
6. **Por último:** `Profile.jsx` (maior densidade de controlos + abas).

### 6.3 Validação visual

- Build de **preview**; percorrer rotas protegidas; confirmar **`/game`** sem commits em ficheiros de jogo.  
- Mobile: footer com glow; abas do Perfil.  
- Estados: loading em login/registo/pagamentos; disabled em PIX e saque.

### 6.4 O que não tocar (hipótese alguma no âmbito BLOCO F “cirúrgico”)

- `GameFinal.jsx`, `game-scene.css`, `game-shoot.css`  
- `layoutConfig.js`, `gameService.js`, APIs  
- Lógica de overlay / portal / `createPortal` no jogo

---

## 7. Conclusão objetiva

A padronização visual dos botões no **app shell** é **viável e de risco controlado** se implementada como **alteração de classes Tailwind** seguindo a ordem acima e **excluindo integralmente** o módulo de jogo (`GameFinal` + CSS associado). Os principais **pontos de atenção** são: **unificar PRIMARY** sem quebrar estados, **definir regra clara** para não confundir **SUPER PRIMARY** (footer) com **abas ativas** do Perfil, e **testar** `InternalPageLayout` em todas as páginas dependentes incluindo **`GameShoot`** se essa rota estiver em uso.

---

**Status documental (2026-03-26):** fase de auditoria **supersedada** pela cirurgia, validação, ajustes finais e **encerramento oficial** — `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`.

*Documento gerado em modo READ-ONLY. Nenhuma alteração de código foi efetuada.*
