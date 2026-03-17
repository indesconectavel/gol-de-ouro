# BLOCO F — PREPARAÇÃO PARA PREVIEW DEPLOY (READ-ONLY)

**Projeto:** Gol de Ouro  
**Modo:** READ-ONLY ABSOLUTO (nenhum código alterado, patch, commit, deploy ou refatoração)  
**Data:** 2026-03-09  

---

## 1. Resumo executivo

O estado atual da branch foi analisado para validar se está seguro gerar um **novo deploy de preview no Vercel** com as mudanças do BLOCO F, mantendo a produção intacta. As alterações restringem-se à interface do player: novo layout interno (`InternalPageLayout`), remoção da TopBar nas páginas fora da `/game`, cirurgia na página de pagamentos e documentação. A rota `/game` continua renderizando `GameFinal` sem TopBar e sem InternalPageLayout; layoutConfig, stage e HUD seguem em uso direto no GameFinal. Nenhum risco bloqueante foi identificado. **Recomendação: PRONTO PARA PREVIEW.**

---

## 2. Lista de arquivos alterados (BLOCO F e contexto)

Com base em `git status` e na análise do escopo do BLOCO F:

### Arquivos modificados (M) relacionados ao BLOCO F

| Arquivo | Escopo BLOCO F | Descrição |
|---------|----------------|-----------|
| `goldeouro-player/src/pages/Dashboard.jsx` | Sim | TopBar removida; uso de InternalPageLayout com título "Início". |
| `goldeouro-player/src/pages/Profile.jsx` | Sim | TopBar removida; InternalPageLayout com título "Perfil" e showLogout. |
| `goldeouro-player/src/pages/Withdraw.jsx` | Sim | TopBar removida; InternalPageLayout em todos os retornos (loading, error, main) com título "Saque". |
| `goldeouro-player/src/pages/GameShoot.jsx` | Sim | TopBar removida; InternalPageLayout com título "Gol de Ouro". |
| `goldeouro-player/src/pages/Pagamentos.jsx` | Sim | Cirurgia completa: layout interno, valores, card R$ 20, CTA, PIX, histórico, badges, tema escuro + glassmorphism. |
| `goldeouro-player/src/pages/GameFinal.jsx` | Parcial | Consta como modificado no git; no código atual **não** importa TopBar nem InternalPageLayout; usa layoutConfig, STAGE, HUD. Rota `/game` preservada. |
| `goldeouro-player/src/App.jsx` | Contexto | Rotas; `/game` → GameFinal; demais rotas inalteradas em relação ao BLOCO F. |

### Arquivos novos (??) relacionados ao BLOCO F

| Arquivo | Descrição |
|---------|-----------|
| `goldeouro-player/src/components/InternalPageLayout.jsx` | Componente de navegação interna (header + footer). |
| `goldeouro-player/src/components/TopBar.jsx` | TopBar existente no projeto; **não** é importada pelas páginas do BLOCO F (Dashboard, Profile, Pagamentos, Withdraw, GameShoot). |

### Outros arquivos modificados (fora do escopo estrito da interface BLOCO F)

- `README.md`, `server-fly.js`, `docs/relatorios/VALIDACAO-FINAL-BLOCO-C-AUTENTICACAO-2026-03-09.md`, `goldeouro-player/src/services/gameService.js` — não fazem parte da cirurgia de interface do BLOCO F; podem ter sido alterados em outros blocos ou ajustes gerais.

---

## 3. Estado da /game

- **Rota:** `App.jsx` → `<Route path="/game" element={<ProtectedRoute><GameFinal /></ProtectedRoute>} />`. ✅  
- **GameFinal.jsx:**  
  - **Não** importa TopBar. ✅  
  - **Não** importa InternalPageLayout. ✅  
  - Importa e usa `layoutConfig` (STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, etc.). ✅  
  - Stage e HUD derivados de `STAGE` e `HUD`; estrutura do palco preservada. ✅  
- **Conclusão:** A página `/game` permanece intacta do ponto de vista estrutural e de navegação do BLOCO F. O arquivo GameFinal.jsx aparece como modificado no git (possível comentário ou pequeno ajuste); na leitura do código atual não há mudança que retire TopBar/sidebar ou altere layoutConfig/stage/HUD/gameplay para a validação em preview.

---

## 4. Estado da navegação

- **TopBar:** Removida das páginas `/dashboard`, `/profile`, `/pagamentos`, `/withdraw`, `/gameshoot` (nenhuma delas importa TopBar). ✅  
- **Sidebar:** A rota `/game` usa GameFinal, que não usa Sidebar. As demais páginas não utilizam sidebar no fluxo do player; o App mantém SidebarProvider apenas como contexto. ✅  
- **InternalPageLayout:** Aplicado em Dashboard (título "Início"), Profile (título "Perfil", showLogout), Withdraw (título "Saque"), GameShoot (título "Gol de Ouro"), Pagamentos (título "Pagamentos"). Header com ← MENU PRINCIPAL, Logo, título e, só em Profile, SAIR DA CONTA. Footer com ⚽ JOGAR AGORA. ✅  

---

## 5. Estado da /pagamentos

| Item | Esperado | Estado no código |
|------|----------|------------------|
| TopBar | Removida | ✅ Não importada; usa InternalPageLayout. |
| Saldo atual | Removido | ✅ Nenhum bloco "Saldo atual"; sem chamada à API de profile para exibir saldo nesta tela. |
| Botão Verificar | Removido | ✅ Não há botão Verificar no bloco PIX nem nas linhas do histórico. |
| Coluna Ações | Removida | ✅ Tabela apenas com Data, Valor, Status. |
| Valores de recarga | 5, 10, 20, 50, 100, 200 | ✅ `valoresRecarga = [5, 10, 20, 50, 100, 200]`. |
| Card recomendado R$ 20 | Badge, borda dourada, glow | ✅ Valor 20 com `isRecomendado`, badge "Recomendado", borda amber, shadow/ring. |
| CTA | Garantir X chutes | ✅ `Garantir ${valorRecarga} chutes`. |
| PIX copia e cola | Principal | ✅ Bloco exibido quando há pix_code/qr_code/pix_copy_paste. |
| Botão copiar | 📋 Copiar código PIX → ✅ Código copiado! | ✅ Textos corretos. |
| Instrução pós-cópia | "Abra o app do seu banco e cole o código PIX." | ✅ Parágrafo presente. |
| QR Code | Mantido | ✅ Fluxo de exibição não alterado. |
| Histórico | Data \| Valor \| Status | ✅ thead e tbody apenas com essas três colunas. |
| Badges fintech | ✓ Aprovado, ⏳ Pendente | ✅ getStatusText e getStatusColor com emerald/amber. |
| Tema | Escuro + glassmorphism | ✅ bg-slate-900/95; cards com bg-white/5, backdrop-blur-xl, border-white/10. |

**Conclusão:** A página `/pagamentos` está alinhada com as decisões aprovadas do BLOCO F.

---

## 6. Riscos encontrados

- **Navegação:** Nenhum. Todas as páginas que devem usar InternalPageLayout o utilizam; dependências (Logo, useAuth, useNavigate) existem.  
- **Renderização:** Nenhum indicativo de componente quebrado ou import inexistente.  
- **Build:** Estrutura de imports e componentes consistente; esperado que o build do Vercel (ex.: Vite/React) conclua com sucesso.  
- **Produção:** O preview deploy do Vercel é por definição isolado da produção; a produção só é afetada ao fazer deploy da branch de produção. Desde que o preview seja gerado a partir da branch atual (ex.: develop ou feature) e não se faça merge/deploy para produção sem revisão, não há risco de afetar produção por engano apenas ao subir o preview.  

**Ressalva:** O arquivo `GameFinal.jsx` consta como modificado no git. Recomenda-se, antes ou após o preview, conferir o diff em relação à base (ex.: main) para garantir que não há alterações indesejadas em lógica de gameplay, stage ou HUD. Isso não impede o preview.

---

## 7. Prontidão para preview deploy

- **A branch está pronta para preview deploy?** Sim. As mudanças do BLOCO F estão consistentes no código: novo layout interno, TopBar removida das páginas corretas, `/game` sem TopBar/InternalPageLayout, `/pagamentos` conforme especificação. Não foi identificado erro óbvio de build nem quebra de navegação/renderização.  
- **O que ainda precisa ser corrigido antes do preview?** Nada bloqueante. Opcional: revisar o diff de `GameFinal.jsx` para confirmar que as alterações (se houver) são apenas comentários ou ajustes aceitos.

---

## 8. Recomendação final

**PRONTO PARA PREVIEW**

O estado atual da branch está seguro para gerar um novo deploy de preview no Vercel com as alterações do BLOCO F. A interface fora da `/game` usa o padrão de navegação interno; a página `/game` permanece intacta; a página `/pagamentos` está alinhada às decisões aprovadas. Não foram encontrados riscos que impeçam o preview. A produção permanece intacta até que seja feito deploy explícito da branch de produção.

---

**Documento gerado em:** 2026-03-09  
**Arquivo:** `docs/relatorios/BLOCO-F-PREVIEW-READONLY-2026-03-09.md`
