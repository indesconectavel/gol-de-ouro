# AUDITORIA CIRÚRGICA — CONVERSÃO E FRONTEIRA DE BLOCOS

**Projeto:** Gol de Ouro — Web Player  
**Foco:** Comportamento ideal em saldo zero, Pagamentos como extensão do jogo, fluxo de retorno, fronteira BLOCO F vs GAMEPLAY/BLOCO G  
**Data:** 2026-03-08  
**Modo:** READ-ONLY (nenhuma alteração de código ou configuração)

**Contexto:** Auditoria anterior concluiu **UX COM RISCO DE BAIXA CONVERSÃO**. Sidebar em processo de remoção — não considerada referência definitiva de navegação futura.

---

## 1. Dashboard em saldo zero

### Comportamento atual da interface quando saldo = 0

- O Dashboard **não diferencia** saldo zero de saldo positivo. O mesmo layout é renderizado: card "Saldo Disponível" com `R$ {balance.toFixed(2)}` (ou seja, "R$ 0.00"), seguido do grid de quatro botões (Jogar, Depositar, Sacar, Perfil). Não há condicional `balance === 0` para alterar texto, ordem ou destaque.
- Não existe mensagem orientando o jogador (ex.: "Para jogar você precisa de saldo" ou "Cada chute custa R$ 1,00 — recarregue para começar").
- Não há destaque visual para depósito quando saldo é zero: "Depositar" usa exatamente as mesmas classes dos outros três botões.
- O CTA principal correto para quem está com R$ 0,00 seria "Depositar"; na prática, o primeiro CTA visual (posição superior-esquerda) é "Jogar". Não há hierarquia que indique "depositar primeiro".
- O botão "Jogar" **não perde** prioridade visual em saldo zero: mantém mesma posição, tamanho e estilo. O jogador pode clicar em "Jogar", ir ao GameShoot e só então descobrir que não pode chutar (zonas desabilitadas, mensagem de saldo insuficiente).

### Resposta direta

- **O Dashboard hoje atrapalha a primeira conversão:** conduz naturalmente para "Jogar" primeiro e só no jogo o usuário é confrontado com a necessidade de saldo e o botão "Recarregar". O momento ideal para orientar e destacar o depósito (no Dashboard) não é aproveitado.
- **O estado saldo zero não está tratado visualmente:** é genérico. Não há estado específico (copy, destaque de CTA, ou reordenação) para saldo zero.

### Comportamento ideal quando o jogador está com saldo zero

- **Ideal:** (1) Manter o saldo visível ("R$ 0,00"); (2) exibir uma linha de copy orientadora, por exemplo: "Para jogar, cada chute custa R$ 1,00 — recarregue seu saldo"; (3) dar destaque visual ao botão "Depositar" (ex.: cor primária, tamanho ou posição de destaque) e/ou colocá-lo como primeiro CTA; (4) reduzir hierarquia do botão "Jogar" nesse estado (ex.: secundário ou com subtítulo "Depois de recarregar") para que a ação correta seja inequívoca.

---

## 2. Hierarquia de CTA

### Dashboard

- **Ação de maior destaque:** Os quatro botões têm o mesmo peso (mesma classe: `bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6`, mesmo grid 2x2). A ordem de leitura e posição é: (1) Jogar, (2) Depositar, (3) Sacar, (4) Perfil. Portanto **"Jogar"** ocupa a primeira posição e recebe leitura prioritária.
- **Coerência com quem ainda não depositou:** Não faz sentido. Para quem tem saldo zero, a ação primária deveria ser "Depositar"; hoje "Jogar" é a que mais se destaca pela posição.
- **Competição entre ações:** "Jogar", "Depositar", "Sacar" e "Perfil" competem em excesso: mesmo tamanho, mesmo estilo, sem hierarquia. Não há um CTA primário único.
- **Hierarquia para usuário iniciante:** Está errada. O iniciante com R$ 0,00 é guiado visualmente para "Jogar" em vez de "Depositar".

### GameShoot

- **Destaque:** No header, "Saldo" e o valor em amarelo têm destaque; ao lado, o botão "💳 Recarregar" (verde). Quando `highlightRecharge` é true (após erro INSUFFICIENT_BALANCE), o botão ganha ring e pulse. As zonas de chute são os CTAs principais do jogo; quando `balance < currentBet`, ficam desabilitadas (cinza, cursor-not-allowed).
- **Prioridade:** No jogo, o CTA de ação principal é "chutar" (zonas); "Recarregar" é secundário até o momento em que o saldo é insuficiente — aí o destaque temporário em "Recarregar" passa a fazer sentido.

### Ação primária recomendada por estado

| Estado            | Ação primária recomendada        | Situação atual                                                                 |
|-------------------|----------------------------------|-------------------------------------------------------------------------------|
| Saldo zero        | Depositar                        | Jogar ocupa primeira posição e mesmo peso; Depositar não é primário          |
| Saldo positivo    | Jogar                            | Jogar já está em primeiro; adequado                                           |
| Após chute        | Continuar jogando ou Recarregar | Se saldo insuficiente, Recarregar recebe highlight; overlays de resultado ok  |
| Após depósito     | Voltar ao jogo / Jogar           | Não existe CTA "Jogar" ou "Voltar ao jogo" na tela Pagamentos                 |

---

## 3. Pagamentos como extensão do jogo

### Parece parte do mesmo produto?

- **Não.** A tela Pagamentos usa fundo `bg-gray-50`, cards `bg-white`, bordas `border-gray-200`, títulos `text-gray-900`, subtítulos `text-gray-600`. Dashboard e GameShoot usam fundo escuro (imagem de estádio + overlay), glassmorphism (`bg-white/10`, `border-white/20`), amarelo para destaque. Pagamentos não compartilha nenhum desses elementos; parece um módulo administrativo ou de outro produto.

### Elementos que quebram a continuidade

- **Fundo:** `bg-gray-50` vs fundo escuro do resto do app.
- **Cards:** `bg-white rounded-xl shadow-sm border-gray-200` vs `bg-white/10 backdrop-blur-lg border-white/20`.
- **Botões:** `bg-blue-600` / `bg-green-600` em Pagamentos vs gradientes e glassmorphism no Dashboard.
- **Títulos e texto:** `text-gray-900`, `text-gray-600` vs `text-white`, `text-white/70`, `text-yellow-400`.
- **Estrutura emocional:** Falta referência ao jogo (estádio, futebol, "créditos para chutes"). O copy é neutro/administrativo ("Pagamentos PIX", "Recarregar Saldo", "Histórico de Pagamentos").
- **Hierarquia:** O bloco "Recarregar Saldo" + valor + botão "Recarregar" compete com "Como funciona o PIX" e "Histórico" na mesma vista; não há um único foco "coloque créditos para jogar".

### Elementos que já funcionam bem

- Subtítulo do header: "Recarregue seu saldo para apostar no jogo" — vincula depósito ao jogo.
- Passo a passo "Como funciona o PIX" (1–4) é claro.
- Após criar PIX, o bloco de código aparece no topo e há scroll automático; valor e botão "Copiar Código PIX" são evidentes.
- Botão "Código Copiado!" com feedback visual temporário.

### Conclusão

- O problema **não é apenas cor/tema:** também é **estrutura e copy**. Para ser extensão do jogo, Pagamentos precisaria: (1) mesmo universo visual (fundo escuro, glassmorphism, amarelo/dourado); (2) copy orientado ao jogo ("Coloque créditos para chutar", "Cada chute = R$ 1,00"); (3) hierarquia clara com um CTA principal (ex.: valor + "Gerar PIX para jogar"); (4) após PIX criado, CTA de retorno ("Quando seu saldo atualizar, jogar agora").

---

## 4. PIX e confiança

### Fluxo de criação do PIX

- O fluxo é linear: escolher valor (presets ou personalizado) → clicar "Recarregar R$ X,XX" → bloco do código aparece, scroll até ele. Do ponto de vista de passos, transmite clareza. Porém o **toast** de sucesso não aparece (ToastContainer ausente), então a confirmação imediata depende só do aparecimento do bloco e do scroll — que existem e ajudam.

### Valor padrão

- **Estado inicial:** `valorRecarga = 200`. Os presets são `[1, 5, 10, 25, 50, 100]`. R$ 200 não está nos botões; o usuário pode não perceber que está gerando PIX de R$ 200 ao clicar sem alterar. **Atrapalha:** risco de susto ou desistência se o jogador não quiser depositar tanto; para um jogo de R$ 1,00 por chute, um padrão menor (ex.: 10 ou 20) seria mais seguro.

### Próximo passo após gerar PIX

- O jogador entende que deve copiar o código e pagar no app. O texto "Cole este código no seu app bancário para completar o pagamento" e o passo 4 ("Seu saldo será creditado automaticamente") deixam claro o que fazer. **Falta:** o que fazer depois de pagar (voltar ao jogo, onde ver o saldo).

### Excesso de informação técnica

- "ID: {pagamentoAtual.id}" no bloco do PIX criado é informação técnica, pouco útil para o jogador e pode parecer burocrática. "Pagamento PIX Criado", "Pendente", tabela de histórico com colunas Data/Valor/Status são neutros — não geram dúvida grave, mas não reforçam a narrativa do jogo.

### Feedback visual sem toast

- Sem ToastContainer, o feedback de "PIX criado" é apenas: (1) surgimento do bloco no topo, (2) scroll até ele, (3) título "✅ Código PIX Gerado com Sucesso!". Esse conjunto **é suficiente** para o usuário saber que deu certo; não é ideal, mas não é crítico para confiança no momento do PIX. O gap maior é a ausência de CTA de retorno e de feedback de "pagamento aprovado / saldo atualizado".

### Pontos que podem gerar dúvida, susto ou desistência

- Valor padrão R$ 200 sem preset visível.
- Exibição do ID do pagamento (tom burocrático).
- Tema claro abrupto ao entrar em Pagamentos (sensação de sair do jogo).
- Ausência de "Próximo passo: quando seu saldo atualizar, clique aqui para jogar".

---

## 5. Retorno ao jogo após depósito

### Após PIX criado

- Existe scroll até o bloco do código. **Não existe** CTA "Voltar ao jogo", "Jogar quando o saldo cair" ou "Ir para o jogo". O único retorno oferecido é "← Voltar" no header (Dashboard). O sistema **não reforça** o objetivo principal (jogar) nesse momento.

### Após código copiado

- Nenhuma mudança de interface; o usuário fica na mesma tela. Nenhum CTA adicional para "Pagou? Voltar ao jogo".

### Após pagamento concluído / saldo atualizado

- Não há na tela Pagamentos polling, websocket ou mensagem do tipo "Pagamento aprovado! Seu saldo foi atualizado." O jogador não é informado na própria tela que pode voltar a jogar. Para ver saldo atualizado, precisa navegar (Dashboard ou GameShoot) ou recarregar.

### Lacuna entre pagar e voltar a jogar

- **Sim.** Entre "paguei no app" e "voltar a jogar" há uma lacuna: o usuário não é reconduzido. Pode ficar "solto" — sem saber se o pagamento caiu, quando voltar ou onde clicar para jogar. O fluxo atual **não reconduz** o jogador ao jogo; **deixa-o sem próximo passo claro** após a etapa financeira.

### Resposta direta

- **O fluxo atual não reconduz o jogador ao jogo** de forma explícita.
- **O usuário pode ficar perdido** após criar/copiar o PIX, pois não há CTA de retorno nem confirmação de saldo na própria tela de Pagamentos.

---

## 6. Fronteira oficial — BLOCO F vs GAMEPLAY vs BLOCO G

**Definições usadas na classificação:**

- **BLOCO F — INTERFACE:** Aspectos visuais, componentes, layout, cores, tipografia, posição de elementos na tela, feedback visual (sem alterar regras do jogo ou fluxo lógico do jogador).
- **GAMEPLAY:** Regras do jogo (quando o chute pode acontecer, valor da aposta, resultado gol/defesa, Gol de Ouro), mecânicas e feedback in-game (overlay GOOOL, etc.).
- **BLOCO G — FLUXO DO JOGADOR:** Jornada do usuário, ordem de telas, decisão de "depositar antes de jogar", CTAs que guiam a sequência de ações, retorno pós-depósito, confiança no momento do depósito (como experiência de fluxo).
- **ZONA HÍBRIDA:** Depende de implementação tanto na interface (F) quanto no fluxo/jornada (G), ou na regra do jogo (GAMEPLAY).

| Item | Classificação | Justificativa |
|------|----------------|---------------|
| Posição do botão Depositar | **A) BLOCO F** | Onde o botão aparece no layout (grid, ordem) é decisão de interface. |
| Destaque visual do botão Jogar | **A) BLOCO F** | Tamanho, cor, hierarquia visual são interface. |
| Texto "cada chute custa R$ 1,00" | **B) GAMEPLAY** (conteúdo) / **A) BLOCO F** (onde aparece) | O valor R$ 1,00 é regra do jogo (GAMEPLAY). Onde e como esse texto é exibido (Dashboard, GameShoot, copy) é F. A decisão de **comunicar** essa regra ao usuário antes de jogar é **C) BLOCO G** (fluxo/jornada). |
| Mensagem "você precisa de saldo para jogar" | **C) BLOCO G** | Orientação do fluxo do jogador: quando e onde explicitar a condição para jogar. O desenho visual da mensagem é F; a decisão de exibir e o momento pertencem ao fluxo (G). |
| Ordem visual dos botões no Dashboard | **A) BLOCO F** | Ordem no layout é interface. O critério dessa ordem (ex.: "saldo zero → Depositar primeiro") é G; a implementação visual é F. |
| CTA após PIX criado | **C) BLOCO G** | Definir que deve existir um CTA de retorno ao jogo é fluxo do jogador. O componente em si é F. |
| CTA após saldo atualizado | **C) BLOCO G** | Decisão de reconduzir o jogador ao jogo após confirmação de saldo é fluxo. Implementação visual é F. |
| Transição Dashboard → Pagamentos | **D) ZONA HÍBRIDA** | Consistência visual na transição é F; a decisão de que "Depositar" leve a uma tela que pareça parte do jogo é G + F. |
| Retorno Pagamentos → GameShoot | **C) BLOCO G** | Definir que o usuário deve ser guiado de volta ao jogo após depósito é fluxo. O botão/âncora é F. |
| Feedback visual de gol | **B) GAMEPLAY** | Overlay "GOOOL!", animação, prêmio exibido são parte da mecânica e do feedback do jogo. |
| Regras de quando o chute pode acontecer | **B) GAMEPLAY** | Condição `balance >= currentBet`, desabilitar zonas, é regra do jogo. A forma visual (botão desabilitado, cursor) é F. |
| Estados de saldo zero e saldo positivo | **D) ZONA HÍBRIDA** | Diferenciar estados na interface (copy, destaque, ordem de CTA) é F; a definição de que o fluxo deve tratar saldo zero de forma distinta é G. |
| Jornada do usuário iniciante | **C) BLOCO G** | Sequência ideal (login → ver custo → depositar → jogar) e onde orientar são fluxo do jogador. |
| Confiança no momento do depósito | **D) ZONA HÍBRIDA** | Confiança é resultado de fluxo (clareza de passos, CTA de retorno) e de interface (tema consistente, copy, ausência de elementos que pareçam erro). F e G. |

---

## 7. Decisão estratégica final

### Principal gargalo de conversão hoje

- **Gargalo principal:** O jogador com saldo zero não é orientado nem direcionado a depositar no Dashboard; é levado pela interface a clicar em "Jogar" primeiro. Só no jogo descobre que precisa de saldo. Depois de depositar (Pagamentos), não é reconduzido ao jogo. Ou seja, **falta um fluxo claro "entender que precisa de saldo → depositar → voltar a jogar"**, tanto no desenho da jornada quanto na hierarquia visual e nos CTAs.

### Natureza do gargalo

- **Híbrida:** (1) **Visual:** mesmo peso para Jogar e Depositar, tema de Pagamentos quebrado; (2) **Estrutural:** ordem dos botões, ausência de estado "saldo zero", ausência de CTA pós-PIX; (3) **Psicológico:** expectativa de "jogar logo" sem aviso prévio de custo/saldo, sensação de "sistema externo" em Pagamentos, falta de próximo passo após pagar.

### A principal correção futura pertence mais à INTERFACE ou ao FLUXO DO JOGADOR?

- **Mais ao FLUXO DO JOGADOR (BLOCO G).** A definição estratégica é: "em saldo zero, o CTA primário é depositar e o jogador deve ser informado do custo e da necessidade de saldo antes de ir ao jogo; após depositar, deve ser reconduzido ao jogo". Isso é desenho de jornada e fluxo (G). As mudanças na tela (destaque de botão, copy, CTA "Jogar" em Pagamentos, tema de Pagamentos) são implementação de interface (F) a serviço desse fluxo. Portanto: **a correção principal é de FLUXO DO JOGADOR; a interface (BLOCO F) é o meio de executá-la.**

---

## CLASSIFICAÇÃO FINAL

**ESTRUTURA COM RISCO DE CONVERSÃO**

A estrutura atual (Dashboard com grid de ações, GameShoot com saldo e Recarregar, Pagamentos com PIX) é reconhecível e utilizável, mas **não está alinhada** a um fluxo de jogo monetizado que maximize conversão: estado de saldo zero não tratado, hierarquia de CTA invertida para iniciantes, Pagamentos fora do universo visual do jogo, e ausência de retorno explícito ao jogo após depósito. Não se classifica como "estrutura desalinhada" no sentido de que não há fluxo de depósito ou jogo; classifica-se como **estrutura com risco de conversão**, passível de correção com ajustes de fluxo (G) e interface (F) pontuais e bem definidos.

---

*Relatório gerado em modo read-only. Nenhuma alteração foi feita em código, CSS, rotas ou configuração.*
