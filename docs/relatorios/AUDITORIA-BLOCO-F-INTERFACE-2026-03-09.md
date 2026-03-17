# AUDITORIA PROFUNDA — BLOCO F (INTERFACE DO JOGO)

**Projeto:** Gol de Ouro  
**Documento:** Auditoria read-only da interface e experiência do jogador  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código ou arquivos)

---

## 1. MAPA DE NAVEGAÇÃO

### 1.1 Fluxo completo do jogador

```
/ (Login) ............................. Tela inicial (não existe "Home" separada)
  ├── /register ...................... Cadastro
  ├── /forgot-password ................ Recuperação de senha
  ├── /reset-password ................. Redefinir senha (após link do email)
  ├── /terms, /privacy ............... Páginas legais
  ├── /download ...................... Download do app
  │
  └── [Após login] → /dashboard ...... Hub principal
        ├── /game ..................... Tela de chute (GameFinal) — BACKEND SIMULADO
        ├── /gameshoot ................ Tela de chute alternativa (GameShoot) — BACKEND REAL
        ├── /pagamentos ............... Depósito PIX
        ├── /withdraw ................. Saque PIX
        └── /profile .................. Perfil, abas (info, apostas, saques, conquistas, stats, gamificação, notificações)
```

### 1.2 Rotas e componentes

| Rota | Componente | Protegida | Observação |
|------|------------|-----------|------------|
| `/` | Login | Não | Entrada principal; não há "Home" antes do login |
| `/register` | Register | Não | Fluxo claro; termos obrigatórios |
| `/forgot-password` | ForgotPassword | Não | Fluxo completo com feedback de sucesso |
| `/reset-password` | ResetPassword | Não | — |
| `/dashboard` | Dashboard | Sim | Botão "Jogar" leva a `/game` (GameFinal) |
| `/game` | **GameFinal** | Sim | Backend **simulado** (simulateInitializeGame, simulateProcessShot) |
| `/gameshoot` | **GameShoot** | Sim | Backend **real** (gameService) — **não linked no menu** |
| `/profile` | Profile | Sim | Muitas abas; histórico de apostas/saques vazios |
| `/withdraw` | Withdraw | Sim | Formulário completo; histórico via paymentService |
| `/pagamentos` | Pagamentos | Sim | Depósito PIX; possível bug de saldo e useEffect |

### 1.3 Quebras e inconsistências de navegação

- **Duas telas de jogo:** `/game` (GameFinal) e `/gameshoot` (GameShoot). O Dashboard e o menu lateral apontam apenas para **/game**. A rota `/gameshoot`, que usa o backend real, não é oferecida na interface — o jogador padrão joga na versão simulada.
- **Não existe tela "GameResult" separada:** o resultado (gol/defesa/gol de ouro) é mostrado na mesma tela (overlay + toast), tanto em GameShoot quanto em GameFinal.
- **Sidebar (Navigation):** não há link para "Depositar" ou "Pagamentos"; apenas Dashboard, Jogar, Perfil, Saque. O depósito é acessado pelo botão "Recarregar" na tela de jogo ou pelo card "Depositar" no Dashboard.
- **Saldo na sidebar:** valor fixo "R$ 150,00" no componente Navigation, não reflete o saldo real do usuário.

---

## 2. PROBLEMAS ENCONTRADOS

### 2.1 Críticos

1. **Rota principal de jogo usa backend simulado**  
   - **Onde:** Dashboard → "Jogar" → `/game` → `GameFinal.jsx`.  
   - **Problema:** `GameFinal` usa `simulateInitializeGame()` e `simulateProcessShot()` (lógica local, saldo e contador não persistem no servidor).  
   - **Impacto:** O jogador que entra pelo fluxo oficial não joga contra o backend real; saldo e prêmios são apenas simulados. A tela que integra com a engine real (`GameShoot` em `/gameshoot`) não é alcançável pelo menu.

2. **Pagamentos: saldo possivelmente sempre zero**  
   - **Onde:** `Pagamentos.jsx`, `carregarDados()`: `setSaldo(response.data.balance || 0)`.  
   - **Problema:** Em outros pontos do app (Dashboard, Profile, gameService) o perfil retorna `response.data.data.saldo`. Se o backend seguir esse formato, `response.data.balance` é `undefined` e o saldo exibido em Pagamentos fica R$ 0,00.  
   - **Impacto:** Confusão financeira; jogador pode achar que não tem saldo na tela de depósito.

3. **Pagamentos: risco de loop de requisições**  
   - **Onde:** `Pagamentos.jsx`, `useEffect(() => { carregarDados(); }, [carregarDados])`.  
   - **Problema:** `carregarDados` não está em `useCallback`; a cada render é nova referência, o que pode disparar o efeito repetidamente após `setSaldo`/`setPagamentos`.  
   - **Impacto:** Múltiplas chamadas à API ao abrir a tela; possível degradação de performance e carga desnecessária no backend.

4. **Toast (react-toastify) sem ToastContainer**  
   - **Onde:** `App.jsx` e `main.jsx` não importam nem renderizam `<ToastContainer />` do `react-toastify`.  
   - **Problema:** `GameShoot`, `GameFinal` e `Pagamentos` usam `toast.success`, `toast.error`, `toast.info`. Sem o container, as notificações podem não aparecer.  
   - **Impacto:** Feedback de gol, defesa, erro de saldo e erros de API invisíveis para o usuário.

### 2.2 UX e fluxo

5. **Saldo insuficiente no jogo**  
   - **GameFinal:** exibe toast com valor do saldo e da aposta e bloqueia o chute (botões desabilitados).  
   - **GameShoot:** botões desabilitados quando `balance < betAmount`; toast de erro genérico em falha.  
   - **Melhoria sugerida:** Em ambos, além do toast, um aviso persistente na tela (ex.: "Saldo insuficiente. Recarregue para jogar") com link para `/pagamentos` reduz abandono.

6. **Histórico de apostas no Dashboard**  
   - **Onde:** Dashboard, "Ver todas" em "Apostas Recentes".  
   - **Problema:** `alert('Histórico completo será implementado em breve!')`.  
   - **Impacto:** Expectativa de histórico não atendida; sensação de produto incompleto.

7. **Perfil: abas "Apostas" e "Saques" sempre vazias**  
   - **Onde:** `Profile.jsx`: `bettingHistory = []`, `withdrawalHistory = []` com comentário "Dados reais serão carregados do backend".  
   - **Impacto:** Duas abas inteiras sem conteúdo; confusão sobre onde ver histórico.

8. **Perfil: feedback de sucesso/erro com `alert()`**  
   - **Onde:** `handleSave` em Profile usa `alert('Perfil atualizado com sucesso!')` e `alert(...)` em erro.  
   - **Problema:** Inconsistente com o uso de `toast` no restante do app; experiência mais brusca.

9. **Withdraw: erro inicial bloqueia a tela inteira**  
   - **Onde:** Se `loadUserData()` falhar, o estado `error` é setado e o componente renderiza apenas `ErrorMessage` com retry, sem o restante da tela.  
   - **Impacto:** Usuário não consegue navegar para outras áreas (ex.: voltar ao Dashboard) sem "Tentar Novamente"; possível abandono em redes instáveis.

### 2.3 Experiência do chute

10. **Clareza da ação de chutar**  
    - **GameFinal:** cinco zonas (TL, TR, C, BL, BR) como círculos clicáveis sobre o gol; label da zona no botão.  
    - **GameShoot:** mesmo conjunto de zonas em botões com texto (TL, TR, etc.).  
    - **Avaliação:** Ação de chute clara; valor fixo R$ 1,00 explicado em texto em ambas as telas.

11. **Tempo de resposta**  
    - **GameFinal:** `simulateProcessShot` com delay de ~50 ms; animação segue.  
    - **GameShoot:** depende da API real; em caso de latência, o jogador fica em `shooting === true` até a resposta. Não há indicador de "Processando chute..." além do desabilitar dos botões.  
    - **Recomendação:** Loading explícito (spinner ou estado "Chutando...") durante a requisição em GameShoot.

12. **Feedback visual do resultado**  
    - **GameFinal:** overlays (goool.png, defendeu.png, ganhou.png, golden-goal.png) via `createPortal` no `document.body`; sons de chute, gol e defesa; toasts.  
    - **GameShoot:** texto grande "GOOOL!", "DEFENDEU!", "GOL DE OURO!" com animação; toasts. Sem assets de imagem/som no trecho analisado.  
    - **Avaliação:** GameFinal oferece maior impacto emocional (imagens + áudio). GameShoot é mais simples; resultado ainda claro.

13. **Impacto emocional da vitória**  
    - **GameFinal:** sequência goool → ganhou com durações configuráveis; Gol de Ouro com overlay e toast com valor.  
    - **GameShoot:** mensagem única por ~3 s e reset.  
    - **Recomendação:** Manter ou reforçar a sequência de feedback (imagem + valor ganho) na tela que for definida como padrão (idealmente a que usa backend real).

### 2.4 Estados de erro

14. **Token expirado (401)**  
    - **Onde:** `apiClient.js`: em 401 remove token e userData do localStorage; não redireciona.  
    - **AuthContext:** ao carregar, se `get(PROFILE)` falhar com 401, `setUser(null)`.  
    - **ProtectedRoute:** se `!user`, redireciona para `/`.  
    - **Problema:** Em rotas protegidas, a próxima requisição que falhar com 401 deixa o usuário na mesma tela até que algo force re-render do ProtectedRoute (ex.: navegação). Pode haver janela em que a UI ainda mostra conteúdo autenticado.  
    - **Recomendação:** Redirecionar para `/` no interceptor em 401 (ou garantir que o AuthContext invalide a sessão e que o ProtectedRoute reaja imediatamente).

15. **Erro de API genérico**  
    - **GameShoot:** `toast.error(error.message)`; animação resetada após 1 s.  
    - **GameFinal:** `toast.error(error.message || 'Erro ao processar chute')`; reset visual.  
    - **Problema:** Mensagem técnica pode ser pouco clara (ex.: "Request failed with status code 500"). Falta mensagem amigável e, quando aplicável, ação "Tentar novamente" ou "Recarregar".

16. **Conexão lenta / timeout**  
    - **apiClient:** timeout 30 s; não há UI de "conexão lenta" ou retry automático na camada de UI para o jogo.  
    - **Dashboard:** usa `retryDataRequest` para profile e PIX; boa prática.  
    - **Recomendação:** Em telas críticas (jogo, pagamentos), considerar indicador de "conexão lenta" ou retry após timeout.

17. **ErrorBoundary**  
    - **Onde:** Envolve o app; em erro de React mostra "Ops! Algo deu errado" e botão "Recarregar Página".  
    - **Problema:** Não oferece link para "/" ou "/dashboard"; usuário só pode recarregar a URL atual.  
    - **Recomendação:** Adicionar link "Voltar ao início" ou "Ir para o Dashboard".

### 2.5 Consistência visual

18. **Paleta e identidade**  
    - Uso consistente de fundos escuros (slate-900, gray-900), acentos amarelo/dourado (yellow-400, yellow-500), verde para sucesso/recarga, glassmorphism (bg-white/10, backdrop-blur, border-white/20).  
    - **Pagamentos:** exceção — fundo `bg-gray-50`, cards brancos, texto gray-900/gray-600; parece mais "admin" do que "jogo".  
    - **Recomendação:** Alinhar Pagamentos ao restante (fundo escuro + glassmorphism) para manter identidade do produto.

19. **Tipografia e hierarquia**  
    - Títulos em bold, subtítulos em text-white/70 ou text-white/80; labels em text-sm.  
    - Nenhuma inconsistência grave identificada além do contraste da página Pagamentos.

20. **Navegação e layout**  
    - Dashboard, Profile, Withdraw, GameShoot: sidebar (Navigation) com margem `ml-16` (colapsada) ou `ml-64`/`ml-72`.  
    - GameFinal: tela cheia, sem sidebar; apenas botão "MENU PRINCIPAL" no header e "Recarregar" no canto.  
    - **Problema:** Quem está em `/game` não vê o mesmo menu que nas outras telas; para ir a Perfil ou Saque precisa voltar ao Dashboard. Decisão de design aceitável para "modo jogo", mas pode aumentar abandono se o usuário quiser conferir saldo ou depósito sem sair do jogo.

21. **Responsividade**  
    - **GameFinal:** escala por `gameScale` (min(scaleX, scaleY)) sobre stage 1920×1080; `game-scene.css` trata orientação retrato (aviso "gire o dispositivo").  
    - **GameShoot:** campo fixo 400×300 px; em mobile pode ficar pequeno ou desproporcional.  
    - **game-shoot.css:** variáveis CSS para mobile/tablet/desktop; uso em partes do HUD.  
    - **Recomendação:** Revisar GameShoot em viewports pequenos (botões de zona, legibilidade do saldo e estatísticas).

### 2.6 Clareza financeira

22. **Valor do chute**  
    - Ambas as telas de jogo deixam explícito: "R$ 1,00 por chute" e texto sobre lote (10 chutes, prêmio R$ 5).  
    - **Avaliação:** Clareza adequada para a regra V1.

23. **Saldo atual**  
    - GameFinal e GameShoot exibem saldo no header.  
    - **Risco:** Em GameFinal o saldo vem da simulação (inicial R$ 100); se o usuário acreditar que está jogando "de verdade", a discrepância com o saldo real (ex.: após login no Dashboard) gera desconfiança.

24. **Prêmio possível**  
    - Texto sobre Gol de Ouro (R$ 100 a cada 1000 chutes) presente em GameShoot; em GameFinal a informação está no código da simulação.  
    - **Recomendação:** Exibir na UI do GameFinal também o prêmio do Gol de Ouro e, se possível, "Chutes até próximo Gol de Ouro".

25. **Resultado do jogo**  
    - Valor ganho no toast (ex.: "Você ganhou R$ X").  
    - **GameFinal:** atualiza saldo na HUD após o chute. **GameShoot:** atualiza `balance` no estado.  
    - **Avaliação:** Valor do prêmio fica claro no feedback imediato.

---

## 3. PONTOS DE RISCO

### 3.1 Retenção

- **Entrada no jogo aponta para versão simulada:** Quem entra por "Jogar" não persiste saldo nem chutes no servidor; ao recarregar ou trocar de dispositivo, o "progresso" some. Alto risco de frustração e abandono quando o usuário descobrir ou quando quiser sacar.
- **Histórico de apostas inexistente no Perfil e "em breve" no Dashboard:** Reduz sensação de progresso e transparência; prejudica retenção.
- **Sidebar com saldo fixo (R$ 150,00):** Passa impressão de dado fake; prejudica confiança.

### 3.2 Engajamento

- **Duas experiências de jogo diferentes:** GameFinal (rico em assets e som) vs GameShoot (mais simples). O fluxo principal usa a versão que não integra com o backend, o que desincentiva o uso da versão "real" e gera dúvida sobre qual é a oficial.
- **Feedback de resultado:** Se o ToastContainer não estiver montado, o jogador perde o reforço positivo (toast de gol/prêmio), o que reduz o engajamento no loop de chute.

### 3.3 Compreensão do jogo

- **Novo usuário sem saldo:** Pode ir para "Jogar", ver GameFinal com saldo simulado R$ 100 e jogar sem entender que não é a conta real; depois, ao ver Dashboard com R$ 0,00, fica confuso.
- **Pagamentos com saldo errado (0):** Aumenta a sensação de que "não tenho saldo" mesmo após depósito, se o bug de `response.data.balance` se confirmar.

### 3.4 Abandono provável

- **Login → Dashboard → Jogar:** Fluxo natural leva à tela simulada; abandono quando o usuário perceber que não está jogando "de verdade" ou ao tentar sacar.
- **Tela de Saque com erro de carregamento:** Tela inteira substituída por mensagem de erro; sem navegação de saída além de "Tentar Novamente".
- **Perfil com várias abas vazias ou com "em breve":** Risco de abandono por quem busca histórico ou estatísticas completas.

---

## 4. RECOMENDAÇÕES

### 4.1 Prioridade alta

1. **Unificar fluxo de jogo com backend real**  
   - Fazer com que a rota principal de jogo (ex.: `/game` ou a que for definida como padrão) use a mesma lógica de `GameShoot` (gameService + API).  
   - Se for desejado manter a experiência visual do GameFinal, integrar GameFinal ao `gameService`/backend real em vez de `simulateProcessShot`/`simulateInitializeGame`.  
   - Remover ou deixar apenas para testes a versão 100% simulada.

2. **Corrigir Pagamentos**  
   - Usar `response.data.data.saldo` (ou o formato real do backend) para `setSaldo`.  
   - Envolver `carregarDados` em `useCallback` e usar dependências estáveis no `useEffect`, ou chamar `carregarDados()` no efeito sem colocá-la no array de dependências (e documentar).

3. **Garantir exibição de toasts**  
   - Adicionar `<ToastContainer />` (e estilos do react-toastify, se necessário) em `App.jsx`, envolvendo as rotas, para que feedback de gol, defesa, erros e sucesso de PIX apareçam.

4. **Saldo real na sidebar**  
   - Navigation deve exibir o saldo do usuário (contexto, API ou prop) em vez do valor fixo "R$ 150,00".

### 4.2 Prioridade média

5. **Saldo insuficiente**  
   - Exibir mensagem persistente na tela de jogo ("Saldo insuficiente") com botão/link "Recarregar" para `/pagamentos`, além do toast.

6. **401 e sessão**  
   - No interceptor de resposta, em 401 redirecionar para `/` (ou definir um fluxo único de "sessão expirada") e garantir que o estado de autenticação seja atualizado antes de qualquer nova renderização de rota protegida.

7. **ErrorBoundary**  
   - Incluir link "Voltar ao início" ou "Ir ao Dashboard" na tela de erro.

8. **Withdraw em erro**  
   - Manter cabeçalho/navegação mesmo quando `loadUserData` falhar; exibir `ErrorMessage` apenas na área de conteúdo e permitir "Voltar ao Dashboard".

9. **Perfil**  
   - Substituir `alert()` por toasts no fluxo de edição/salvar.  
   - Integrar histórico de apostas e saques ao backend (ou esconder/desabilitar abas até haver dados).

### 4.3 Prioridade baixa

10. **Consistência visual de Pagamentos**  
    - Alinhar fundo e cards ao padrão escuro e glassmorphism do restante do app.

11. **Dashboard "Ver todas"**  
    - Implementar tela de histórico completo ou remover o botão até existir a funcionalidade; evitar `alert('em breve')`.

12. **Loading no chute (GameShoot)**  
    - Mostrar estado "Chutando..." ou spinner enquanto a requisição de chute estiver em andamento.

13. **Responsividade GameShoot**  
    - Revisar tamanho do campo e dos botões de zona em mobile; considerar layout adaptativo ou aviso de "use landscape" se necessário.

---

## 5. CLASSIFICAÇÃO FINAL

**INTERFACE VALIDADA COM RESSALVAS**

**Justificativa:**

- O fluxo de telas (Login, Registro, Dashboard, Jogar, Depósito, Saque, Perfil) está implementado e navegável. A experiência visual do jogo (GameFinal) é rica em feedback (overlays, sons, toasts). Regras financeiras (R$ 1 por chute, prêmio, Gol de Ouro) estão comunicadas na interface. Há tratamento de erros em várias telas e uso de ProtectedRoute e ErrorBoundary.

- As **ressalvas** são graves o suficiente para impedir classificação como "Interface validada" sem ajustes:
  - A rota principal de jogo usa backend **simulado**, enquanto a rota com backend real não é oferecida no menu, o que invalida a experiência para a V1 real.
  - Risco de saldo incorreto e de loop de requisições em Pagamentos.
  - Toasts podem não aparecer por falta de ToastContainer.
  - Saldo fixo na sidebar e históricos vazios ou "em breve" prejudicam confiança e retenção.

Após correção da integração jogo/backend real, do fluxo de dados em Pagamentos, da exibição de toasts e do saldo na sidebar, a interface pode ser reavaliada para **INTERFACE VALIDADA**.

---

## 6. REFERÊNCIAS

- `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md` — Bloco F: Interface (telas, fluxo, UX do chute, feedback visual).
- `docs/ROADMAP-V1-GOLDEOURO.md` — Progresso V1 ~88%; Bloco F em análise.
- Código analisado: `goldeouro-player/src/` (App.jsx, rotas, GameShoot, GameFinal, Dashboard, Login, Register, Profile, Withdraw, Pagamentos, Navigation, ProtectedRoute, ErrorBoundary, apiClient, gameService, estilos do jogo).

---

*Auditoria read-only. Nenhum arquivo ou código foi alterado.*
