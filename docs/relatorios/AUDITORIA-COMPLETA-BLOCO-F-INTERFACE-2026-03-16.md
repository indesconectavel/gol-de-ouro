# AUDITORIA COMPLETA — BLOCO F (INTERFACE DO JOGO)

**Projeto:** Gol de Ouro  
**Documento:** Auditoria forense read-only completa do BLOCO F  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, patch, commit, deploy ou refatoração)

---

## 1. Resumo executivo

Foi realizada auditoria forense completa do **BLOCO F — Interface do Jogo**, cobrindo estrutura de código, navegação, página `/game`, página `/pagamentos`, consistência visual, build e riscos.

**Estado geral:** O desenho da interface está alinhado ao BLOCO F (InternalPageLayout, TopBar removida das páginas internas, `/game` sem layout interno, `/pagamentos` conforme decisões aprovadas). Porém o **build de produção falha** devido a erro de estrutura JSX em `Withdraw.jsx` (tag de fechamento `</div>` a mais, gerando “Unexpected closing div tag does not match opening InternalPageLayout”). Enquanto esse erro não for corrigido, não é possível gerar deploy de preview nem confirmar que a versão publicada reflete o código atual.

**Classificação final:** **BLOCO F CRÍTICO** — bloqueado pelo erro de build.

---

## 2. Lista completa de arquivos analisados

### 2.1 Páginas do BLOCO F

| Arquivo | Uso |
|---------|-----|
| `goldeouro-player/src/pages/Dashboard.jsx` | InternalPageLayout, título "Início", sem TopBar |
| `goldeouro-player/src/pages/Profile.jsx` | InternalPageLayout, título "Perfil", showLogout, sem TopBar |
| `goldeouro-player/src/pages/Withdraw.jsx` | InternalPageLayout, título "Saque", em todos os retornos; **erro de JSX** |
| `goldeouro-player/src/pages/GameShoot.jsx` | InternalPageLayout, título "Gol de Ouro", sem TopBar |
| `goldeouro-player/src/pages/Pagamentos.jsx` | InternalPageLayout, título "Pagamentos", cirurgia PIX/histórico |
| `goldeouro-player/src/pages/GameFinal.jsx` | Sem InternalPageLayout, sem TopBar; usa layoutConfig, STAGE, HUD |

### 2.2 Componentes

| Arquivo | Uso |
|---------|-----|
| `goldeouro-player/src/components/InternalPageLayout.jsx` | Header (← MENU PRINCIPAL, Logo, título, opcional SAIR), footer (⚽ JOGAR AGORA) |
| `goldeouro-player/src/components/TopBar.jsx` | Existente no projeto; **não importado** por nenhuma página do BLOCO F |

### 2.3 Rotas e contexto

| Arquivo | Uso |
|---------|-----|
| `goldeouro-player/src/App.jsx` | Rotas, ProtectedRoute, `/game` → GameFinal |
| `goldeouro-player/src/components/ProtectedRoute.jsx` | Redireciona para `/` se não autenticado |

### 2.4 Gameplay (/game)

| Arquivo | Uso |
|---------|-----|
| `goldeouro-player/src/game/layoutConfig.js` | STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, getTargetPosition |
| `goldeouro-player/src/services/gameService.js` | Usado por GameFinal e GameShoot |
| `goldeouro-player/src/pages/game-scene.css` | Estilos da cena (GameFinal) |
| `goldeouro-player/src/pages/game-shoot.css` | Estilos do chute (GameFinal) |

### 2.5 Documentação de referência

| Arquivo | Uso |
|---------|-----|
| `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md` | Status dos blocos; BLOCO F em “EM ANÁLISE” |
| `docs/ROADMAP-V1-GOLDEOURO.md` | Progresso V1 ~88%; BLOCO F prioridade 1 |
| `docs/relatorios/BLOCO-F-PREVIEW-READONLY-2026-03-09.md` | Relatório de preparação para preview |

---

## 3. Verificação das rotas

### 3.1 Rotas definidas em App.jsx

| Rota | Componente | Protegida | Observação |
|------|------------|-----------|------------|
| `/` | Login | Não | Entrada principal |
| `/register` | Register | Não | |
| `/forgot-password` | ForgotPassword | Não | |
| `/reset-password` | ResetPassword | Não | |
| `/terms` | Terms | Não | |
| `/privacy` | Privacy | Não | |
| `/download` | DownloadPage | Não | |
| `/dashboard` | Dashboard | Sim (ProtectedRoute) | Hub principal |
| `/game` | **GameFinal** | Sim | Tela de chute principal |
| `/gameshoot` | GameShoot | Sim | Tela de chute alternativa (InternalPageLayout) |
| `/profile` | Profile | Sim | |
| `/withdraw` | Withdraw | Sim | |
| `/pagamentos` | Pagamentos | Sim | |

### 3.2 Confirmações

- **Rotas protegidas:** Todas as rotas listadas como “Protegida” usam `<ProtectedRoute>`.
- **Redirecionamento:** ProtectedRoute redireciona para `/` quando não há `user`.
- **Rota `/game`:** Renderiza **GameFinal**; não usa Game, GameShoot nem outro componente.

**Conclusão:** A navegação definida em App.jsx está consistente e `/game` usa GameFinal conforme esperado.

---

## 4. Verificação da página /game (GameFinal.jsx)

### 4.1 Componentes e layout

| Item | Esperado | Estado |
|------|----------|--------|
| TopBar | Não usada | ✅ Não importada em GameFinal |
| InternalPageLayout | Não usado | ✅ Não importado em GameFinal |
| layoutConfig | Presente | ✅ Import de STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, DIRECTION_TO_GOALKEEPER_JUMP, getTargetPosition |
| STAGE | Presente | ✅ Uso em gameScaleStyle, game-stage (WIDTH/HEIGHT 1920x1080) |
| HUD | Presente | ✅ hudHeader, hudBottomLeft, hudBottomRight; botão MENU PRINCIPAL, Recarregar, áudio |
| Estrutura do palco | Preservada | ✅ game-viewport → game-scale → game-stage; background, targets, goleiro, bola, overlays |
| Lógica de chute | Backend real | ✅ gameService.processShot, apiClient.get(API_ENDPOINTS.PROFILE), betAmount = 1 |

### 4.2 Conteúdo do layoutConfig.js

- **STAGE:** WIDTH 1920, HEIGHT 1080.
- **BALL:** START, SIZE, ANIMATION_DURATION.
- **GOALKEEPER:** IDLE, SIZE, ROTATION_IDLE, JUMPS (TL, TR, C, BL, BR), ANIMATION_DURATION.
- **TARGETS:** TL, TR, C, BL, BR, SIZE, HORIZONTAL_OFFSET, VERTICAL_OFFSET.
- **OVERLAYS:** SIZE (GOOOL, DEFENDEU, GANHOU, GOLDEN_GOAL), ANIMATION_DURATION.
- **HUD:** HEADER, BOTTOM_LEFT, BOTTOM_RIGHT.
- **getTargetPosition:** exportada e usada em GameFinal.

### 4.3 Conclusão /game

A página `/game` (GameFinal) está **intacta** do ponto de vista do BLOCO F: não usa TopBar nem InternalPageLayout; usa layoutConfig, STAGE e HUD; gameplay com backend real (gameService, API_ENDPOINTS). Nenhuma regressão estrutural ou de integração com a engine foi identificada no código analisado.

---

## 5. Auditoria da página /pagamentos

### 5.1 Itens obrigatórios (decisões aprovadas)

| Item | Esperado | Estado no código |
|------|----------|------------------|
| TopBar | Removida | ✅ Não importada; usa InternalPageLayout |
| Saldo atual | Removido | ✅ Nenhum bloco “Saldo atual”; sem exibição de saldo no topo |
| Botão Verificar | Removido | ✅ Não há botão “Verificar” no bloco PIX nem no histórico |
| Coluna Ações | Removida | ✅ Tabela apenas Data, Valor, Status |
| Valores de recarga | [5, 10, 20, 50, 100, 200] | ✅ `valoresRecarga = [5, 10, 20, 50, 100, 200]` |
| Card recomendado | R$ 20, badge “Recomendado”, borda dourada | ✅ valor === 20 → isRecomendado; badge “Recomendado”; border-amber, ring-amber |
| CTA | “Garantir X chutes” | ✅ `Garantir ${valorRecarga} chutes` |
| PIX copia e cola | Principal | ✅ Exibido quando há pix_code ou qr_code ou pix_copy_paste |
| Botão copiar | “📋 Copiar código PIX” → “✅ Código copiado!” | ✅ Textos corretos |
| Instrução pós-cópia | “Abra o app do seu banco e cole o código PIX.” | ✅ Texto presente (variação “Abra o app do seu banco e cole o código PIX.”) |
| Histórico | Data | Valor | Status | ✅ thead/tbody com essas três colunas |
| Badges | ✓ Aprovado, ⏳ Pendente | ✅ getStatusText: approved → “✓ Aprovado”, pending → “⏳ Pendente”; getStatusColor emerald/amber |
| Tema | Dark, glassmorphism | ✅ bg-slate-900/95; cards bg-white/5, backdrop-blur-xl, border-white/10 |

### 5.2 Conclusão /pagamentos

A página `/pagamentos` está **alinhada** às decisões aprovadas do BLOCO F (layout interno, valores, card R$ 20 recomendado, CTA, PIX, histórico em 3 colunas, badges, tema escuro e glassmorphism).

---

## 6. Verificação do build

### 6.1 Comando executado

Em 2026-03-16 foi executado `npm run build` em `goldeouro-player` (Vite 5.x).

### 6.2 Resultado

**Build falhou.**

- **Arquivo:** `goldeouro-player/src/pages/Withdraw.jsx`
- **Linhas:** 447–448
- **Erro 1:** “Unexpected closing «div» tag does not match opening «InternalPageLayout» tag”
- **Erro 2:** “Unterminated regular expression” (decorrente do parser diante da estrutura incorreta)

A árvore JSX do retorno principal de `Withdraw` contém **uma tag `</div>` a mais** antes de `</InternalPageLayout>`. Estrutura esperada: `InternalPageLayout` → um único `div` (flex-1) → div de background → overlay + div de conteúdo; o fechamento correto é três `</div>` e em seguida `</InternalPageLayout>`. No código atual há quatro `</div>` antes de `</InternalPageLayout>`, o que quebra o build.

### 6.3 Consequência

- Não é possível gerar `dist/` para produção.
- Deploy de preview (Vercel) que dependa desse build **não reflete** o código atual até que o erro seja corrigido.
- **Nenhum outro erro de build** foi observado (o processo parou neste ponto).

---

## 7. Verificação do preview deploy e diferença preview vs produção

### 7.1 Preview deploy (Vercel)

- **Configuração:** `goldeouro-player/vercel.json` existe; `buildCommand`: `npm run build`, `outputDirectory`: `dist`, `framework`: `vite`.
- **Branch e preview:** Não foi possível inspecionar o dashboard do Vercel nem a URL de preview. A verificação de “deploy gerado, branch correta, preview isolado” **requer** que o build passe e, em seguida, que se confira no Vercel o último deploy de preview da branch em uso.
- **Conclusão:** Com o build falhando, **não é possível afirmar** que a versão publicada em preview corresponde ao código atual. Assim que o build for corrigido, será necessário rodar o build e o deploy de preview e validar no Vercel.

### 7.2 Comparação preview vs produção

- Sem build bem-sucedido e sem acesso às URLs de preview e produção, **não foi possível** comparar layout, pagamentos e navegação entre preview e produção.
- **Recomendação:** Após corrigir o erro em `Withdraw.jsx` e gerar novo preview, comparar manualmente (ou com testes E2E) as rotas principais (dashboard, game, pagamentos, withdraw, profile) entre preview e produção para garantir que produção permaneça intacta até o deploy deliberado.

---

## 8. Auditoria visual e UX (BLOCO F)

### 8.1 Páginas com InternalPageLayout

- **Dashboard:** InternalPageLayout título “Início”; header com logo e boas-vindas; botões Jogar, Depositar, Sacar, Perfil; footer não duplicado (InternalPageLayout já fornece “JOGAR AGORA”).
- **Profile:** InternalPageLayout título “Perfil”, showLogout; abas e conteúdo conforme esperado.
- **Withdraw:** InternalPageLayout título “Saque” em loading, error e main; layout de formulário e histórico consistente (porém arquivo com erro de JSX).
- **GameShoot:** InternalPageLayout título “Gol de Ouro”; conteúdo de jogo e estatísticas.
- **Pagamentos:** InternalPageLayout título “Pagamentos”; seção recarga, PIX e histórico conforme especificação.

### 8.2 Consistência

- **Botão MENU PRINCIPAL:** Presente no header do InternalPageLayout (← MENU PRINCIPAL).
- **Logo:** Presente no header (Logo size="small").
- **Footer “JOGAR AGORA”:** Presente no InternalPageLayout (⚽ JOGAR AGORA → navega para `/game`).
- **Tema:** Escuro (bg-slate-900, glassmorphism) nas páginas analisadas.

### 8.3 UX

- **Navegação:** Fluxo login → dashboard → game / pagamentos / withdraw / profile é claro; ProtectedRoute evita acesso sem login.
- **Botão de chute (/game):** Zonas TL, TR, C, BL, BR; desabilitadas quando saldo < R$ 1 ou fase !== IDLE; feedback por overlay e toast.
- **Riscos de confusão/abandono:** (1) Build quebrado impede validar em preview. (2) Duas rotas de jogo (`/game` e `/gameshoot`) podem confundir se ambas forem expostas no mesmo nível no futuro; atualmente o fluxo principal é `/game`. (3) Em relatório anterior (AUDITORIA-BLOCO-F-INTERFACE-2026-03-09) foram apontados itens de UX (histórico “Ver todas”, abas vazias no Perfil, uso de alert em Profile); não reavaliados nesta auditoria read-only.

---

## 9. Problemas encontrados

### 9.1 Crítico (bloqueante)

1. **Build falha em Withdraw.jsx**  
   - **Onde:** `goldeouro-player/src/pages/Withdraw.jsx`, retorno principal (por volta das linhas 359–362).  
   - **O quê:** Uma tag `</div>` a mais na árvore JSX (fecha um nível a mais do que o aberto), fazendo o parser reportar “closing div does not match opening InternalPageLayout” e “Unterminated regular expression”.  
   - **Impacto:** Build de produção falha; não há artefato `dist/`; deploy de preview não pode ser considerado “refletindo o código atual” até correção.

### 9.2 Outros (não bloqueiam esta auditoria)

2. **TopBar não utilizada:** TopBar.jsx existe no projeto mas não é importada por nenhuma página do BLOCO F. Isso é esperado (decisão de remover TopBar das páginas internas); pode ser removida em limpeza futura ou mantida como componente opcional.

3. **Verificação de preview/produção:** Não foi possível confirmar no Vercel se o preview está atualizado ou comparar com produção, pois o build atual não passa.

---

## 10. Classificação final

**BLOCO F CRÍTICO**

Motivo: o build de produção falha devido a erro de estrutura JSX em `Withdraw.jsx`. Todas as demais verificações do BLOCO F (estrutura de código, rotas, página `/game`, página `/pagamentos`, uso de InternalPageLayout e ausência de TopBar nas páginas internas) estão conformes ao esperado. A validação total da interface e a confirmação do preview deploy dependem da correção desse único erro e da nova execução do build e do deploy de preview.

---

## 11. Recomendações (somente documentação, sem alterar código)

1. **Corrigir JSX em Withdraw.jsx:** Remover a tag `</div>` extra que antecede `</InternalPageLayout>` no retorno principal do componente (por volta da linha 362), de forma que a árvore de fechamento corresponda à abertura (InternalPageLayout → div → div → div de conteúdo).
2. **Reexecutar build:** Após a correção, rodar `npm run build` em `goldeouro-player` e confirmar que termina sem erros.
3. **Preview deploy:** Gerar novo deploy de preview no Vercel a partir da branch corrigida e confirmar no dashboard que o deploy foi gerado e que a branch está correta.
4. **Comparação preview vs produção:** Acessar preview e produção e comparar layout, /pagamentos e navegação para garantir que produção permaneça intacta até deploy deliberado.
5. **Atualizar documentação:** Após BLOCO F validado (build ok + preview verificado), atualizar `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md` e `docs/ROADMAP-V1-GOLDEOURO.md` conforme critério de V1 (BLOCO F validado → V1 ≈ 92%).

---

**Documento gerado em:** 2026-03-16  
**Arquivo:** `docs/relatorios/AUDITORIA-COMPLETA-BLOCO-F-INTERFACE-2026-03-16.md`  
**Modo:** READ-ONLY — nenhum arquivo de código ou configuração foi alterado.
