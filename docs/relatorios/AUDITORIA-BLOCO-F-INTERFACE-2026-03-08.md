# AUDITORIA — BLOCO F (INTERFACE)

**Projeto:** Gol de Ouro — Web Player  
**Escopo:** Interface (frontend) — `goldeouro-player/src`  
**Data:** 2026-03-08  
**Modo:** READ-ONLY (nenhuma alteração de código, banco ou deploy)

**Stack analisada:** React, Axios, Supabase Auth, API backend Node, Tailwind CSS.

---

## 1. Consistência visual

### Pontos positivos
- **Paleta:** Uso consistente de fundo escuro (slate-900, gray-900), amarelo/dourado (yellow-400, yellow-500) para destaque e verde para ações positivas (green-500/600). `index.css` define utilitários (pulse-glow, goal-celebration, bounce-in) alinhados ao tema.
- **Tipografia:** Títulos em bold, subtítulos em `text-white/70` ou `text-white/80`, labels em `text-sm font-medium`. Padrão coerente entre Login, Register, Dashboard, Withdraw e Profile.
- **Containers:** Padrão glassmorphism (`bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20`) em Dashboard, Withdraw, Profile e GameShoot. Botões principais com `rounded-lg`, gradientes em CTAs (e.g. `from-green-500 to-green-600`).
- **Espaçamentos:** `space-y-6` em formulários, `p-6` em cards, `gap-4` em grids. Margens entre seções coerentes.

### Inconsistências encontradas
- **Página Pagamentos:** Única tela com tema claro (`bg-gray-50`, cards `bg-white`, texto `text-gray-900`). Restante do app é tema escuro. Quebra a unidade visual da demo.
- **Margem do conteúdo (sidebar):** Quando a sidebar está expandida, parte das telas usa `ml-72` (Dashboard, Profile, Withdraw) e parte usa `ml-64` (GameShoot, Pagamentos). A sidebar é `w-72`, então GameShoot e Pagamentos ficam com margem menor e possível desalinhamento visual.
- **Botão de logout no Dashboard:** Ícone 👤 no header sem label; na Navigation o logout é "Sair" com ícone. Comportamento igual, apresentação diferente (header vs sidebar).
- **Placeholder de input:** Login usa `placeholder-white`; Register usa `placeholder-white/50` em alguns campos. Pequena variação de contraste.

### Resumo
Consistência geral boa. Principais problemas: tema claro isolado em Pagamentos e divergência de `ml-64` vs `ml-72`.

---

## 2. Estados de carregamento

### Onde existe feedback de loading
- **Login:** Botão mostra "Entrando..." e fica `disabled` quando `loading` do AuthContext. ✅
- **Registro:** Botão "⏳ Criando conta..." e `disabled` quando `isSubmitting`. ✅
- **Rotas protegidas:** ProtectedRoute exibe "Verificando autenticação..." com spinner enquanto valida token. ✅
- **Dashboard:** Apenas na seção "Apostas Recentes" aparece "Carregando..." enquanto `loading`. O restante da página (saldo, nome do usuário) renderiza com valores iniciais (0, fallback "Jogador") sem spinner full-page.
- **GameShoot:** Tela cheia "Carregando jogo..." enquanto `loading` na inicialização. Durante o chute, botões desabilitados e estado `shooting` impedem novo chute; não há spinner no botão de zona. ✅
- **Pagamentos:** Botão "Criando Pagamento..." durante `criarPagamentoPix`. **Não há loading** no carregamento inicial da página (histórico de pagamentos); a lista aparece quando a requisição termina, sem indicador.
- **Withdraw:** Tela de loading com `LoadingSpinner` enquanto `loadUserData`. Botão de envio mostra spinner + "Processando..." durante `isSubmitting`. ✅
- **Profile:** Não há tela de loading inicial; o estado `user` começa com "Carregando..." como nome/e-mail até `loadUserProfile` terminar. Durante "Salvar" em edição, `setLoading(true)` é usado mas não há spinner no botão ou overlay.

### Resumo
Login, registro, ProtectedRoute, Withdraw e GameShoot (inicial) têm feedback claro. **Faltam ou estão fracos:** loading inicial do Dashboard (só na seção de apostas), loading inicial em Pagamentos, e feedback visual de "Salvando" no Profile.

---

## 3. Mensagens ao usuário

### Clareza e padronização
- **Login:** Erro exibido em bloco vermelho (`bg-red-500/20 border border-red-500/50`) com texto do backend ou genérico. Mensagem única, clara.
- **Registro:** Erros de validação específicos: "As senhas não coincidem!", "Você deve aceitar os termos de uso!", "A senha deve ter pelo menos 6 caracteres!". Erro de API em bloco com "❌ {error}". Linguagem direta.
- **Saldo insuficiente (jogo):** GameShoot usa `toast.error(message)` e trata `INSUFFICIENT_BALANCE` com destaque no botão "Recarregar". **Problema:** o app usa `react-toastify` mas **não renderiza `<ToastContainer />`** em `App.jsx` nem em `main.jsx`. Toasts não aparecem na tela.
- **PIX criado:** Pagamentos usa `toast.success('Pagamento PIX criado com sucesso!')` — também afetado pela ausência do ToastContainer.
- **Saque solicitado:** Withdraw exibe modal de sucesso ("Saque Solicitado!", texto explicativo e botão "Entendi"). Não depende de toast. ✅
- **Resultado do chute:** GameShoot usa `toast.success` (GOL, GOL DE OURO) e `toast.info` (Defesa) — novamente sem exibição por falta de ToastContainer. Na tela há overlays visuais ("GOOOL!", "DEFENDEU!", "GOL DE OURO!") que funcionam.

### Resumo
Mensagens são claras e em português. **Problema crítico:** Toasts (react-toastify) são chamados mas o container não está na árvore de componentes, então feedback de sucesso/erro em GameShoot e Pagamentos **não é exibido**. Modal de saque e overlays do jogo funcionam.

---

## 4. Consistência do saldo

### Origem do saldo por tela
- **Dashboard:** `apiClient.get(API_ENDPOINTS.PROFILE)` → `setBalance(profileResponse.data.data.saldo)`. ✅
- **GameShoot:** `gameService.initialize()` → internamente `apiClient.get('/api/user/profile')` e uso de `userData.saldo`. ✅
- **Withdraw:** `apiClient.get(API_ENDPOINTS.PROFILE)` → `setBalance(response.data.data.saldo)`. ✅
- **Profile:** `apiClient.get(API_ENDPOINTS.PROFILE)` → `user.balance = userData.saldo`. ✅

Todas as telas que exibem saldo usam o mesmo endpoint de perfil (`/api/user/profile`). **Fonte única** correta.

### Exceção
- **Navigation (sidebar):** Saldo exibido como **valor fixo** "R$ 150,00" no bloco do usuário. Não consome API. Risco de **saldo desatualizado e enganoso** na barra lateral.

### Resumo
Consistência da fonte de dados (profile) está correta. **Inconsistência de exibição:** sidebar mostra valor fixo; demais telas mostram saldo real. Recomenda-se remover o valor fixo ou passar a usar o saldo do contexto/API.

---

## 5. Fluxo visual do jogo

### Pontos positivos
- **Custo da aposta:** Bloco "Valor do Chute" com "R$ 1,00" e texto "Cada lote tem 10 chutes. Gol no 10º chute." Clareza adequada.
- **Zonas clicáveis:** Botões TL, TR, C, BL, BR no campo; estados disabled quando `shooting || balance < currentBet` (cinza) e hover quando habilitado. Cursor e título explicam a ação.
- **Feedback pós-chute:** Overlays "⚽ GOOOL!", "🥅 DEFENDEU!", "🏆 GOL DE OURO!" com animação (animate-bounce/pulse). Estatísticas da sessão (Gols, Defesas, Sequência, Gols de Ouro) atualizam em cards abaixo.
- **Destaque de Gol de Ouro:** Texto e estilo diferenciados; contador "Chutes até próximo Gol de Ouro" visível.
- **Saldo e Recarregar:** Saldo no header; botão "Recarregar" leva a Pagamentos; quando saldo insuficiente, botão pode receber destaque (ring pulse).

### Pontos de atenção
- **Toasts do resultado:** Mensagens de prêmio (ex.: "Você ganhou R$ X!") dependem de toast e não aparecem por falta de ToastContainer; apenas os overlays visuais garantem feedback.
- **Novos jogadores:** Pode não ficar óbvio que é preciso depositar (Pagamentos) antes de jogar; o botão "Recarregar" na tela do jogo ajuda após o primeiro erro de saldo.

### Resumo
Fluxo do jogo é claro: valor fixo R$ 1,00, zonas visíveis, resultado destacado e estatísticas em tempo real. Melhoria possível: garantir que mensagens de prêmio (toast) sejam exibidas ou substituídas por feedback apenas na tela.

---

## 6. Responsividade

### Implementação
- **Tailwind:** Uso de `md:` (breakpoint 768px) na Navigation: menu mobile com `md:hidden` / `md:block`, sidebar que em mobile fica oculta (`-translate-x-full`) e abre com botão hambúrguer. Sidebar fixa com `w-16` (recolhida) ou `w-72` (expandida).
- **Layout:** Grids com `grid-cols-2`, `md:grid-cols-4` (GameShoot, Profile). Dashboard com `grid-cols-2 gap-4` nos botões. Pagamentos com `grid-cols-1 lg:grid-cols-2` e `grid-cols-3` nos valores de recarga.
- **Campo do jogo:** Largura fixa `400px` no container do campo; em telas muito estreitas pode exigir scroll horizontal ou ficar apertado.
- **Profile:** Várias abas em linha (`flex space-x-2`); em mobile pode haver overflow horizontal (muitos botões: Informações, Apostas, Saques, Conquistas, Estatísticas, Gamificação, Notificações).
- **Login/Register:** `max-w-md mx-4` e `w-full`; adequado a mobile.

### Riscos
- **Textos cortados:** Nenhum caso óbvio de truncamento sem `truncate` ou `line-clamp`; labels e títulos curtos.
- **Botões quebrando:** Botões em grid ou flex; possível compressão em telas muito pequenas na área de ações do Dashboard ou nas abas do Profile.
- **Elementos sobrepostos:** Overlays do jogo (GOOOL!, etc.) em `absolute inset-0` com `flex items-center justify-center`; podem cobrir o campo em viewports pequenos se o container for cortado.

### Resumo
Estrutura responsiva presente (sidebar, grids, breakpoints). Pontos a validar em dispositivo real: largura fixa do campo no jogo e quantidade de abas no Profile em mobile.

---

## 7. Consistência de navegação

### Fluxos verificados
- **Login → Dashboard:** Após login bem-sucedido, `navigate('/dashboard')`. ✅
- **Dashboard → Jogo:** Botão "Jogar" → `navigate('/game')`. Rota protegida com GameShoot. ✅
- **Dashboard → Pagamentos:** Botão "Depositar" → `navigate('/pagamentos')`. ✅
- **Dashboard → Saque:** Botão "Sacar" → `navigate('/withdraw')`. ✅
- **Dashboard → Perfil:** Botão "Perfil" → `navigate('/profile')`. ✅
- **Logout:** Dashboard (ícone 👤) e Navigation ("Sair") chamam logout e `navigate('/')`. ✅
- **Retorno ao Dashboard:** Withdraw e Profile têm botão "←" no header para `navigate('/dashboard')`. GameShoot tem "📊 Dashboard". Pagamentos tem "← Voltar" para dashboard. ✅

### Sidebar (Navigation)
- Itens: Dashboard, Jogar, Perfil, Saque. **Não há link direto para Pagamentos/Depositar**; acesso apenas pelo Dashboard. Intencional (depósito como ação secundária).
- Link "Jogar" aponta para `/game`; em App a rota `/gameshoot` também renderiza GameShoot. Duas URLs para a mesma tela.

### Rotas públicas
- `/` (Login), `/register`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/download` declaradas em App. Login tem link para registro e "Esqueceu a senha?". ✅

### Resumo
Navegação coerente; nenhum link quebrado identificado. Pagamentos só pelo Dashboard; duas rotas para o jogo (/game e /gameshoot).

---

## 8. Problemas visuais encontrados

### Críticos
1. **ToastContainer ausente:** Uso de `toast.success`, `toast.error`, `toast.info` (GameShoot, Pagamentos) sem `<ToastContainer />` no App. Toasts não aparecem.
2. **Saldo fixo na sidebar:** Navigation exibe "R$ 150,00" fixo; desalinhado com o saldo real das demais telas.

### Médios
3. **Pagamentos: tema claro:** Única página em tema claro; quebra consistência com o restante do app.
4. **Margem do conteúdo:** `ml-64` em GameShoot e Pagamentos vs `ml-72` em Dashboard, Profile e Withdraw; possível desalinhamento com a sidebar.
5. **Pagamentos – useEffect:** `useEffect(() => { carregarDados(); }, [carregarDados])` com `carregarDados` não memoizado; risco de loop ou avisos de lint (ex.: exhaustive-deps).
6. **Dashboard/Profile – loading inicial:** Sem full-page loading; conteúdo aparece com valores padrão (0, "Jogador", "Carregando...") até a API responder.
7. **Profile – salvando:** Estado de loading ao salvar edição sem indicador visual no botão ou overlay.

### Menores
8. **Placeholder:** Pequena variação entre `placeholder-white` e `placeholder-white/50` entre telas.
9. **Campo do jogo:** Largura fixa 400px; em mobile pode exigir scroll horizontal.
10. **Profile – abas:** Muitas abas em uma linha; em mobile pode gerar overflow horizontal.

---

## CLASSIFICAÇÃO FINAL

**VALIDADO COM RESSALVAS**

A interface está estruturada, com padrão visual coerente (cores, tipografia, glassmorphism), mesma fonte de saldo (API profile) nas telas principais, fluxo de jogo claro e navegação funcional. Os pontos que impedem classificação como **VALIDADO** são:

- **Toasts não exibidos** por falta de ToastContainer (impacto direto em feedback de sucesso/erro no jogo e em Pagamentos).
- **Saldo fixo na sidebar**, gerando inconsistência e risco de confusão.
- **Tema claro apenas em Pagamentos** e **margem (ml-64 vs ml-72)** como falhas de consistência visual.
- **Carregamentos iniciais** em Dashboard e Pagamentos (e estado "Salvando" no Profile) sem feedback visual completo.

Correção do ToastContainer e do saldo na sidebar, e pequenos ajustes de loading e tema/margem, elevariam a auditoria a **VALIDADO** para uso em demo.

---

*Relatório gerado em modo read-only. Nenhuma alteração foi feita em código, banco ou configuração.*
