# AUDITORIA — BLOCO G (FLUXO DO JOGADOR)

**Data:** 2026-03-08  
**Modo:** Read-only absoluto  
**Escopo:** Frontend Gol de Ouro Player — jornada do jogador (conversão, fricção, confiança)  
**Artefatos analisados:** `goldeouro-player/src` (Login, Register, Dashboard, Pagamentos, GameShoot, Withdraw, Profile, Navigation, gameService, paymentService, apiClient, config/api)

---

## 1. Primeira impressão

**O que o jogador vê logo após o login (Dashboard):**

- Cabeçalho: “Gol de Ouro”, “Bem-vindo, [nome]!” e ícone de perfil (logout).
- Card **Saldo Disponível** em destaque (R$ 0,00 para novo usuário).
- Grid 2x2 de ações: **Jogar** (Penalty Shootout), **Depositar** (PIX Instantâneo), **Sacar** (PIX 24h), **Perfil** (Estatísticas).
- Seção “Apostas Recentes” (vazia ou com histórico PIX).

**Respostas:**

- **Fica claro que é um jogo com dinheiro real?**  
  **Parcialmente.** O saldo em R$ e os termos “Depositar” e “Sacar” indicam dinheiro real, mas não há uma frase explícita do tipo “Jogo com dinheiro real” ou “Apostas reais” na primeira tela. Um iniciante pode ainda interpretar como moeda virtual.

- **Fica claro que cada chute custa R$ 1?**  
  **Não.** No Dashboard não aparece valor por chute nem custo do jogo. Só em **GameShoot** existe o card “Valor do Chute — R$ 1,00”.

- **Fica claro que é possível ganhar dinheiro?**  
  **Não.** Não há texto na landing pós-login explicando prêmios, Gol de Ouro ou ganhos. A descoberta é feita dentro do jogo.

**Ambiguidades:**  
Nenhum copy de “dinheiro real”, “valor da aposta” ou “como ganhar” no primeiro impacto. Quem chega sem contexto pode não associar imediatamente saldo → aposta → prêmio.

---

## 2. Compreensão do jogo

**Onde as regras e custos aparecem:**

- **Dashboard:** Apenas labels “Jogar — Penalty Shootout” e “Depositar — PIX Instantâneo”. Nada sobre regras, valor da aposta ou Gol de Ouro.
- **GameShoot:**  
  - “Escolha uma zona e chute ao gol!”  
  - Card “Valor do Chute”: “R$ 1,00” e “Cada lote tem 10 chutes. Gol no 10º chute.”  
  - Bloco “Sistema Gol de Ouro”: “Chutes até próximo Gol de Ouro: [N]” e “A cada 1000 chutes, um jogador ganha R$ 100 extra!”

**Respostas:**

- **Essas informações aparecem antes de entrar no jogo?**  
  **Não.** Custo (R$ 1), lote (10 chutes, gol no 10º) e Gol de Ouro (R$ 100 a cada 1000 chutes) só aparecem **dentro** da tela do jogo.

- **Ou o jogador precisa descobrir sozinho?**  
  **Sim.** Quem entra direto em “Jogar” só descobre o custo e as regras ao carregar GameShoot. Quem tem R$ 0 descobre ao tentar chutar e ver botões desabilitados + toast de saldo insuficiente.

**Conclusão:** Compreensão do jogo é tardia; não há onboarding ou resumo “antes de jogar”.

---

## 3. Momento da primeira decisão

**CTAs no Dashboard:**

- Ordem visual (grid 2x2): **Jogar** (primeiro), **Depositar**, **Sacar**, **Perfil**.
- Todos com mesmo peso visual (mesmo estilo de card, ícone, hover).
- “Jogar” é o primeiro elemento e usa ⚽, reforço de ação lúdica.

**Respostas:**

- **Quais CTAs existem?**  
  Jogar, Depositar, Sacar, Perfil (e no header, logout implícito no ícone).

- **Qual ação recebe mais destaque?**  
  Nenhuma claramente; “Jogar” ganha destaque por posição (primeiro) e ícone de futebol.

- **Qual ação um iniciante provavelmente escolheria?**  
  **Jogar** — é a primeira, mais associada ao nome “Gol de Ouro” e não exige pensar em dinheiro.

- **O fluxo incentiva jogar antes de depositar?**  
  **Sim.** A ordem e o destaque de “Jogar” levam o usuário a clicar em jogar primeiro. Com saldo zero, ele só então descobre que precisa depositar.

- **Ou incentiva depositar antes de jogar?**  
  **Não.** Não há mensagem do tipo “Adicione saldo para jogar” nem CTA principal “Depositar primeiro” no Dashboard.

**Conclusão:** O desenho atual incentiva “jogar antes de depositar”; o depósito vira descoberta (ou obstáculo) depois.

---

## 4. Descoberta do depósito

**Onde o jogador percebe que precisa depositar:**

- **No Dashboard:** Pode ver “Saldo Disponível R$ 0,00” e inferir que precisa depositar, mas o CTA principal é “Jogar”. Não há destaque para “Você precisa de saldo para jogar”.
- **No GameShoot:** Se saldo &lt; R$ 1, os botões de zona (TL, TR, C, BL, BR) ficam desabilitados (`balance < currentBet`). O toast exibe “Você está sem saldo. Adicione saldo para jogar.” O botão **Recarregar** recebe destaque visual temporário (`highlightRecharge`, pulse/ring) após erro `INSUFFICIENT_BALANCE`.

**Respostas:**

- **Ele descobre isso no Dashboard?**  
  Pode ver o saldo zero, mas não há copy que guie “deposite para jogar”. A descoberta não é garantida no Dashboard.

- **Ou apenas no GameShoot?**  
  Na prática, **muitas vezes sim**: o usuário clica em Jogar, tenta chutar, vê botões desabilitados e a mensagem de saldo. Aí aparece o CTA “Recarregar” em destaque.

**Fricção psicológica:**  
A descoberta acontece num momento **negativo** (ação bloqueada), não preventiva. Isso pode gerar frustração (“por que me deixaram entrar no jogo sem avisar?”) e aumentar risco de abandono nesse passo.

---

## 5. Experiência de depósito

**Tela Pagamentos:**

- Layout: fundo `bg-gray-50`, cards brancos, bordas cinza — visual de “painel administrativo” ou “área financeira”.
- Dashboard e GameShoot usam fundo escuro (imagem de fundo, glassmorphism, amarelo/branco). Pagamentos usa tema claro e linguagem mais técnica (“Pagamentos PIX”, “Recarregue seu saldo para apostar”).
- Header: “Pagamentos PIX”, “Recarregue seu saldo para apostar no jogo”, botão “← Voltar” para dashboard.
- Conteúdo: presets de valor (1, 5, 10, 25, 50, 100), valor customizado, botão “Recarregar R$ X”, instruções “Como funciona o PIX” (4 passos), histórico de pagamentos.
- Após criar PIX: bloco “Pagamento PIX Criado” com código copia e cola, botão “Copiar Código PIX”, texto “Cole este código no seu app bancário”.

**Respostas:**

- **Clareza do processo PIX:**  
  Boa: passos numerados, valor em destaque, código único, botão de copiar e feedback “Código Copiado!”.

- **Confiança visual:**  
  Layout limpo e previsível, mas o estilo “formulário financeiro” difere do resto do app (jogo/dashboard escuro).

- **Continuidade com o jogo:**  
  **Baixa.** Não há referência visual ao jogo (gol, bola, tema esportivo) nem copy do tipo “Deposite e volte a jogar”. Parece uma tela de “sistema de pagamentos” separada.

- **Sensação de segurança:**  
  Neutra a positiva: PIX é conhecido, instruções claras. Falta reforço explícito (ex.: “Pagamento seguro”, “Seu saldo será creditado em instantes”).

- **A tela parece parte do jogo ou sistema separado?**  
  **Sistema separado.** Estilo (claro vs escuro) e ausência de elementos de jogo fazem a página de Pagamentos parecer outro produto dentro do mesmo app.

---

## 6. Momento de pagamento

**Após gerar o PIX:**

- O bloco “Pagamento PIX Criado” aparece; a página faz scroll suave até o código (`pixCopiaColaRef`).
- Texto: “Código PIX Gerado com Sucesso!”, “Copie o código abaixo e cole no seu app bancário”, código em `<code>`, botão “Copiar Código PIX” / “Código Copiado!”.
- Nota: “Cole este código no seu app bancário para completar o pagamento”.

**Respostas:**

- **O jogador entende claramente o próximo passo?**  
  **Sim.** “Copiar → colar no app bancário” é explícito.

- **Existe orientação suficiente?**  
  **Parcialmente.** Falta:  
  - O que fazer **depois** de pagar (ex.: “Aguarde a confirmação; seu saldo será atualizado em instantes”).  
  - Onde ver o saldo atualizado (Dashboard / Jogo).  
  - CTA para “Voltar ao jogo” ou “Ir ao Dashboard” após pagar, reduzindo abandono nessa etapa.

---

## 7. Retorno ao jogo

**Após o pagamento (tela Pagamentos):**

- Único CTA de saída visível no header é **“← Voltar”**, que leva ao **Dashboard**.
- Não há botão “Voltar ao jogo”, “Jogar agora” ou “Continuar jogando” na página de Pagamentos.
- No sidebar (Navigation): links para Dashboard, Jogar, Perfil, Saque. **Não há link direto para “Depositar”/“Pagamentos”.** Quem está em Pagamentos volta pelo “Voltar” ou clicando em “Jogar” no menu.

**Respostas:**

- **O sistema reconduz o jogador ao jogo?**  
  **Não.** Não há recondução explícita; o usuário precisa lembrar de ir ao menu → Jogar ou Dashboard → Jogar.

- **Existe CTA claro para voltar a jogar?**  
  **Não.** Na tela de Pagamentos não há “Jogar agora” ou similar.

**Lacunas:**  
(1) Nenhum CTA pós-pagamento do tipo “Seu saldo será atualizado em breve. **Ir para o jogo**”.  
(2) Não há mensagem de “Pagamento recebido” na própria página (atualização em tempo real ou aviso quando aprovado) com botão “Jogar”.  
(3) Risco de o usuário fechar o app após pagar no banco e não retornar ao fluxo de jogo.

---

## 8. Primeira experiência de jogo

**GameShoot — primeira vez que o jogador chuta:**

- **Zonas:** Cinco botões circulares no gol (TL, TR, C, BL, BR) com labels visíveis. Posições fixas; dá para entender “escolher um canto”.
- **Custo:** Card “Valor do Chute” com “R$ 1,00” e texto “Cada lote tem 10 chutes. Gol no 10º chute.”
- **Feedback visual:** Animação da bola até a zona; goleiro se move; após ~950 ms aparecem overlays “GOOOL!”, “DEFENDEU!” ou “GOL DE OURO!”; toasts com valor do prêmio (“Você ganhou R$ X” ou “GOL DE OURO! Você ganhou R$ X”).
- **Emoção do resultado:** Cores (amarelo gol, azul defesa), animação e toasts deixam o resultado claro.

**Respostas:**

- **O jogador entende o que aconteceu após o chute?**  
  **Sim.** GOOL/DEFENDEU/GOL DE OURO + toast com prêmio em R$ deixam claro ganhou/perdeu e quanto.

**Ressalva:** A relação “lote de 10 chutes / gol no 10º” vs “Gol de Ouro a cada 1000 chutes (global)” pode confundir na primeira vez. O texto do Gol de Ouro está em bloco separado; um iniciante pode não ligar imediatamente “meu 10º chute no lote” ao “próximo Gol de Ouro” global. Não invalida o entendimento do resultado do chute, mas a compreensão completa da mecânica exige leitura de dois blocos.

---

## 9. Decisão de continuar

**Após o resultado do chute (GameShoot):**

- Não há botão explícito “Chutar novamente” ou “Continuar jogando”; o jogador continua clicando em outra zona.
- **Saldo** aparece no header (canto superior direito): “Saldo / R$ X,XX” — sempre visível.
- **Estatísticas** da sessão: Gols, Defesas, Sequência, Gols de Ouro — reforçam progresso e encorajam mais chutes.
- Botões de zona permanecem ativos (exceto durante `shooting` ou sem saldo). Navegação: “Recarregar”, “Dashboard”, toggle de áudio.

**Respostas:**

- **O jogador é incentivado a continuar jogando?**  
  **Sim, de forma implícita:** saldo visível, stats em tempo real, botões de zona disponíveis. Falta um CTA explícito “Chute de novo” ou “Próximo chute” para quem é mais hesitante.

- **O saldo restante é visível?**  
  **Sim.** No header da tela do jogo.

- **Existe incentivo para continuar?**  
  Stats (sequência, gols de ouro) e feedback de ganho (toast) funcionam como incentivo. Nada bloqueia continuar enquanto houver saldo.

---

## 10. Decisão de sacar

**Tela Withdraw:**

- Mesmo padrão visual do Dashboard/Profile: fundo com imagem (Gol_de_Ouro_Bg02), overlay escuro, cards em glassmorphism (bg-white/10, bordas brancas).
- Header: logo, “Solicitar Saque”, botão voltar para dashboard.
- Card “Saldo Disponível” com valor em destaque (R$ X,XX) e “Valor mínimo para saque: R$ X,XX” (paymentService.getConfig().minAmount).
- Formulário: valor do saque, tipo de chave PIX (CPF, E-mail, Telefone, Chave Aleatória), chave PIX.
- **Resumo:** Valor solicitado, “Taxa de processamento: R$ 2,00”, “Valor a receber: R$ (valor - 2)”.
- Bloco “Informações Importantes”: prazo até 24h, taxa R$ 2, valor mínimo, confirmação de dados e conta PIX.
- Histórico de saques com status (Processado, Pendente, Cancelado).
- Em sandbox: aviso “Modo Sandbox Ativo”.

**Respostas:**

- **Clareza:**  
  Boa: saldo, mínimo, taxa e valor líquido explícitos; passos do formulário claros.

- **Confiança:**  
  Resumo transparente (taxa e valor a receber), prazo e avisos aumentam confiança.

- **Transparência:**  
  Alta: valor solicitado, taxa e valor a receber visíveis antes de enviar.

- **O processo parece seguro?**  
  **Sim.** Layout consistente com o resto do app (glassmorphism, mesma identidade), informações legais e resumo claro. Sandbox deixado explícito quando aplicável.

---

## 11. Pontos críticos de abandono

Pontos da jornada onde o jogador pode desistir, com base no fluxo analisado:

| # | Momento | Motivo |
|---|--------|--------|
| 1 | **Logo após login (Dashboard)** | Saldo R$ 0, nenhuma explicação “o que é” ou “o que fazer”; quatro botões com mesmo peso; usuário pode não entender o valor do produto e sair. |
| 2 | **Antes do primeiro depósito** | Clica em “Jogar”, vai ao GameShoot, vê botões desabilitados e mensagem de saldo. Descoberta tardia e negativa; pode achar que “precisava ter depositado antes” e desistir. |
| 3 | **Após gerar o PIX (Pagamentos)** | Usuário copia o código e abre o app do banco. Se não houver CTA “Voltar ao jogo” ou “Aguardar confirmação aqui”, pode não retornar ao site após pagar. |
| 4 | **Enquanto aguarda aprovação do PIX** | Na tela Pagamentos não há polling/feedback “Pagamento aprovado! Seu saldo foi atualizado.”; usuário pode ficar em dúvida e sair. |
| 5 | **Após o primeiro chute (especialmente se perdeu)** | Se defesa + toast “Defendeu! Tente novamente” sem nenhum incentivo (“Próximo chute pode ser gol”), jogador sensível a perda pode abandonar. |
| 6 | **Após sequência de defesas** | Sem mensagem de apoio ou “quase lá”; só stats. Risco de frustração e saída. |
| 7 | **Sidebar com saldo incorreto** | Navigation exibe “R$ 150,00” fixo no rodapé da sidebar. Se o saldo real for outro, gera desconfiança (“por que aqui está diferente?”). |

**Resumo:** Os pontos mais críticos para conversão e retenção são **2** (descoberta do depósito no jogo, de forma negativa), **3** e **4** (pós-PIX sem recondução nem feedback de aprovação) e **1** (primeira impressão sem narrativa clara).

---

## 12. Confiança do sistema

**Elementos que transmitem confiança:**

- **Saldo:** Visível no Dashboard, GameShoot, Withdraw e Profile, sempre em R$ com duas casas decimais.
- **Prêmio:** No jogo, toast exibe valor ganho (“Você ganhou R$ X”) e “GOL DE OURO! Você ganhou R$ X”; card “Sistema Gol de Ouro” explica R$ 100 a cada 1000 chutes.
- **Depósito:** Processo PIX passo a passo, código copia e cola, instruções “Como funciona o PIX” e histórico de pagamentos.
- **Saque:** Valor solicitado, taxa R$ 2, valor a receber, prazo 24h e histórico de saques com status.

**Elementos que podem gerar desconfiança:**

- **Saldo na Navigation:** Valor fixo “R$ 150,00” no rodapé da sidebar (Navigation.jsx), não reflete saldo real. Usuário pode comparar com Dashboard/Jogo e questionar consistência.
- **Pagamentos como “outro sistema”:** Visual e copy da tela de Pagamentos não reforçam “parte do Gol de Ouro”; pode parecer terceirizado ou pouco integrado.
- **Ausência de reforços explícitos:** Nenhum copy do tipo “Pagamentos seguros”, “Seu dinheiro está protegido” ou “Licenciado” nas telas de depósito/saque (nem na primeira impressão).
- **Fallbacks de dados no código:** Dashboard e Profile usam fallback com email/nome fixos em caso de erro (ex.: “free10signer@gmail.com”); em erro de API, o usuário pode ver dados que não são dele e desconfiar.

**Conclusão:** Transparência de valores (saldo, prêmio, taxa, valor a receber) é boa e favorece confiança. Saldo errado na sidebar, tela de Pagamentos “separada” e falta de mensagens de segurança/legitimidade são pontos a melhorar para confiança plena.

---

## Classificação final

**FLUXO ADEQUADO COM RESSALVAS**

O fluxo do jogador é **funcional** e as telas de saque e de jogo transmitem **clareza e transparência** (valor do chute, prêmios, taxa de saque, saldo). Porém:

- A **primeira impressão** não comunica de forma explícita “dinheiro real”, “R$ 1 por chute” ou “como ganhar”.
- A **primeira decisão** tende a ser “Jogar” com saldo zero, e a **descoberta do depósito** ocorre em momento **negativo** (ação bloqueada), com risco de fricção e abandono.
- A **experiência de depósito** é clara no uso do PIX, mas a tela **não se sente parte do jogo** e **não reconduz** o usuário ao jogo após o pagamento.
- **Pontos críticos de abandono** concentram-se em: pós-login sem narrativa, descoberta tardia da necessidade de saldo, pós-PIX sem CTA de retorno e saldo incorreto na sidebar.

Por isso o fluxo está **adequado** para um jogo monetizado que já conhece o produto, mas **não está otimizado** para conversão de novos jogadores (onboarding, depósito preventivo e retorno pós-pagamento). Com ajustes de copy, ordem de CTAs e recondução pós-PIX, o fluxo pode evoluir para **otimizado para jogo monetizado**.

---

*Fim do relatório — Bloco G (Fluxo do Jogador).*
