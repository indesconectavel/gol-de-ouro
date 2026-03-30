# BLOCO F — Verificação de Preview (Read-Only)

**Data:** 2026-03-26  
**Escopo:** Confirmar se o código local contém o Bloco F esperado e orientar verificação de preview/deploy sem assumir estado remoto sem evidência.

---

## 1. Resumo executivo

No repositório local analisado:

- A branch ativa é `feature/bloco-e-gameplay-certified`.
- O **HEAD atual é exatamente o commit `ef345f3`** (mensagem: *BLOCO F: fechamento oficial + ajustes finais (safe-area + disabled)*).
- O commit `ef345f3` está presente e é ancestral de HEAD (é o próprio topo).
- Os ficheiros citados no pedido contêm as classes/comportamentos esperados onde aplicável (`InternalPageLayout`, `Withdraw`, páginas de auth e internas listadas no `git show`).

**Não foi possível provar a partir apenas deste repositório** que o preview Vercel está servindo `ef345f3` ou a branch correta: isso exige evidência no dashboard Vercel ou no response HTTP do deployment (ver secção 4).

**Ponto crítico de leitura:** o Bloco F descrito (footer com **JOGAR AGORA**, safe-area, app shell interno) vive em `InternalPageLayout` e páginas que o importam. A rota **`/game` usa `GameFinal`**, que **não** monta `InternalPageLayout` — validar “Bloco F” na `/game` é **tela errada** para o footer dourado/global do app shell.

---

## 2. Estado do código local

### 2.1 Branch e commit

| Verificação | Resultado |
|-------------|-----------|
| Branch ativa | `feature/bloco-e-gameplay-certified` |
| Último commit (`git log -1 --oneline`) | `ef345f3 BLOCO F: fechamento oficial + ajustes finais (safe-area + disabled)` |
| Commit `ef345f3` existe | Sim (`git show ef345f3 -s`) |
| `ef345f3` na linha do tempo atual | Sim — HEAD = `ef345f3` |

### 2.2 Ficheiros tocados no commit `ef345f3` (evidência `git show ef345f3 --stat`)

Alterações em `goldeouro-player` incluem (entre outros):

- `src/components/InternalPageLayout.jsx`
- `src/pages/Withdraw.jsx`
- `src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`
- `src/pages/Pagamentos.jsx`, `Profile.jsx`, `Terms.jsx`, `Privacy.jsx`

**Não aparecem** neste commit:

- `src/pages/GameFinal.jsx`
- `src/pages/game-scene.css` / `src/pages/game-shoot.css` (caminhos habituais do jogo)

*Nota:* os ficheiros de jogo podem existir com outro path; o que importa é que o **stat do commit `ef345f3`** não os lista.

### 2.3 Verificações pontuais no working tree

#### `goldeouro-player/src/components/InternalPageLayout.jsx`

- **Footer:** contém `pt-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]` (linha do `<footer>`).
- **Botão “⚽ JOGAR AGORA”:** gradiente âmbar/amarelo, `ring`, `shadow` com glow (`shadow-[0_0_22px_rgba(251,191,36,0.42),...]`), estados hover/focus — consistente com “SUPER PRIMARY” / destaque dourado.

#### `goldeouro-player/src/pages/Withdraw.jsx`

- Botão de submit inclui `disabled:opacity-50` (junto com `disabled:cursor-not-allowed` e gradientes de disabled).

#### Demais páginas (presença de padrão verde / ajustes)

- **Login / Register / ForgotPassword / ResetPassword:** botões com `from-green-500 to-green-600` e variantes; vários com `disabled:opacity-50` onde aplicável.
- **Pagamentos / Profile:** usam `InternalPageLayout`; há acentos **sky** em tabs/elementos (Pagamentos, Profile) e verde nos CTAs — alinhado a “unificação PRIMARY verde + hierarchy sky” no app shell.
- **Terms / Privacy:** alteração no commit `ef345f3` foi **cirúrgica no header**: botão voltar passou a ser círculo com `bg-white/10 backdrop-blur-lg rounded-full w-10 h-10`; spacer `w-8` → `w-10`. **Mudança visual pequena** em relação ao footer dourado.

---

## 3. O que deveria estar visível no preview

### 3.1 Onde o impacto é **claro** (melhor prova de deploy correto)

1. **Qualquer página que use `InternalPageLayout`** (ex.: **Perfil**, **Pagamentos**, **Saque** se usar o layout — ver rota real).
   - **Footer fixo** com botão **“⚽ JOGAR AGORA”** grande, **dourado com glow** (não é o botão verde padrão).
   - Em dispositivo com safe-area (ou DevTools simulando iPhone), **espaço extra no fundo** do footer (`pb-[calc(1rem+env(safe-area-inset-bottom,0px))]`).

2. **`/withdraw` (Withdraw)**  
   - Com formulário inválido ou envio em progresso, o botão principal deve ficar **visivelmente mais apagado** (`opacity-50`).

### 3.2 Onde o impacto é **médio**

- **Login / Register / auth:** botões verdes consistentes; diferença em relação a um build antigo pode ser subtil se já estava parecido.
- **Pagamentos / Profile:** tabs sky + CTAs verdes — perceptível se você comparar com screenshot antigo.

### 3.3 Onde o impacto é **muito subtil**

- **Terms / Privacy:** só o botão voltar e alinhamento do header — fácil de não notar.

### 3.4 O que **não** deve mudar com este Bloco F (para não confundir validação)

- **`/game`:** não é o local para ver o footer **JOGAR AGORA** do `InternalPageLayout`; o jogo tem UI própria (`GameFinal`). Ouvir som ou ver layout de jogo **não prova** o Bloco F de app shell.

---

## 4. Verificação de branch/commit/deploy

### 4.1 Evidência local (confirmada)

- Código local na branch `feature/bloco-e-gameplay-certified` no commit `ef345f3` contém as alterações esperadas do Bloco F nos ficheiros listados acima.

### 4.2 Evidência remota (não verificável só pelo repo)

Este repositório **não inclui** um ficheiro que amarre o deployment Vercel ao commit atual (ex.: badge de deploy no README gerado pelo CI com hash). O `goldeouro-player/vercel.json` define build e headers, **não** a branch/commit do Git.

**Como confirmar no Vercel (operacional):**

1. Abrir o projeto no Vercel → **Deployments**.
2. No deployment mais recente do ambiente de **Preview** (ou Production, conforme o fluxo):
   - Ver **Git commit** (deve mostrar `ef345f3` ou mensagem equivalente).
   - Ver **branch** (deve ser `feature/bloco-e-gameplay-certified` se o preview foi disparado por push nessa branch).
3. Opcional: na página do deployment, abrir **Building** ou **Summary** e copiar o commit SHA exibido.
4. Se o SHA não bater com `ef345f3`, o preview **não** está com o código deste fechamento.

**Hipótese de mismatch documental:** sem acesso ao dashboard, **não há como** afirmar que o preview está em `ef345f3`.

---

## 5. Hipóteses para ausência de diferença visual

| Hipótese | Classificação | Notas |
|----------|---------------|--------|
| Preview aponta para commit antigo (não `ef345f3`) | **Provável** se o utilizador não confirmou o SHA no Vercel | Única prova objetiva é o deployment. |
| Cache do navegador / SW antigo | **Possível** | `vercel.json` força `no-cache` em HTML/JS/CSS; ainda assim, testar janela anónima ou hard refresh. |
| Alterações subtis (Terms/Privacy, pequenos ajustes de botão) | **Provável** para algumas páginas | Fácil não ver diferença sem comparação lado a lado. |
| **Tela errada** (ex.: validar Bloco F na `/game`) | **Provável** | `/game` não mostra o footer do `InternalPageLayout`. |
| Página não usa `InternalPageLayout` | **Possível** | Auth pages não têm o footer “JOGAR AGORA”; só verde/estilo. |
| Branch/deploy errado no Vercel | **Possível** | Preview pode estar ligado a outra branch ou a production. |
| CSS antigo servido | **Improvável** se o `index.html` e bundles forem do deployment certo | Possível se o deployment estiver errado ou cache agressivo fora do controlo do projeto. |

---

## 6. Checklist de prova visual

Ordem sugerida (do mais decisivo ao mais subtil):

1. **Fazer login** e abrir uma página que use **`InternalPageLayout`** (ex.: **Perfil** `/profile` ou **Pagamentos** `/pagamentos`).
2. **Rolar até ao fundo** e confirmar:
   - Footer com **“⚽ JOGAR AGORA”** grande, **dourado**, com **glow** (ring + sombra).
   - Em mobile ou simulação de safe-area, **padding inferior** extra no footer.
3. Abrir **`/withdraw`**:
   - Deixar o botão de envio **disabled** (campos vazios ou a enviar) e confirmar **`opacity-50`** no botão principal.
4. Abrir **`/login`** e **`/register`**:
   - Confirmar botão principal **verde** (`from-green-500 to-green-600`) e estados disabled coerentes onde existam.
5. Abrir **`/terms`** e **`/privacy`**:
   - Confirmar botão **←** no header como **círculo** com fundo translúcido (mudança pequena).
6. **Não usar** `/game` como prova do footer dourado do Bloco F.

**Melhor confirmação única:** passo 1–2 (footer **JOGAR AGORA** dourado + safe-area) numa rota interna com `InternalPageLayout`.

---

## 7. Conclusão objetiva

- **Código local:** o Bloco F referenciado pelo commit **`ef345f3`** está presente na branch **`feature/bloco-e-gameplay-certified`** e os ficheiros críticos conferem com o pedido (footer + safe-area, Withdraw com `disabled:opacity-50`, auth e internas alteradas conforme o commit; **sem** alterações listadas em `GameFinal` / CSS de jogo nesse commit).
- **Preview/deploy:** **não** foi possível verificar remotamente nesta auditoria; é obrigatório cruzar o **SHA** no painel Vercel com `ef345f3`.
- Se “não vi diferença”, a causa mais consistente com o desenho do produto é **validação na rota errada (`/game`)** ou **preview num commit anterior** — ambas devem ser descartadas com evidência (rota correta + SHA do deployment).
