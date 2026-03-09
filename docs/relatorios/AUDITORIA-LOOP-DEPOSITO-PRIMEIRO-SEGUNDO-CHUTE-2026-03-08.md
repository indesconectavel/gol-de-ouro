# AUDITORIA — LOOP DE MONETIZAÇÃO

**Data:** 2026-03-08  
**Modo:** Read-only absoluto  
**Foco:** Loop crítico depósito confirmado → retorno ao jogo → primeiro chute → resultado → decisão → segundo chute  
**Artefatos:** `Pagamentos.jsx`, `GameShoot.jsx`, `Dashboard.jsx`, `gameService.js`, `paymentService.js`, `apiClient.js`, `Navigation.jsx`, componentes e layouts relevantes

---

## 1. Confirmação do depósito

**O que acontece após o jogador pagar o PIX no banco:**

- Na tela **Pagamentos** o bloco do pagamento atual exibe sempre o badge **"Pendente"** (linha 127–129). Não existe no frontend:
  - polling do status do PIX (approved/pending/rejected);
  - atualização em tempo real do mesmo bloco para "Aprovado";
  - mensagem do tipo "Pagamento aprovado!" ou "Seu saldo foi creditado".
- `carregarDados()` é chamado apenas no mount do componente (useEffect com `[carregarDados]`) e após `criarPagamentoPix()`. Não há `setInterval` nem novo fetch quando o usuário volta à aba depois de pagar.
- O texto das instruções PIX diz apenas: "Seu saldo será creditado automaticamente" (passo 4). Não há confirmação explícita de que isso já ocorreu.
- A tabela **Histórico de Pagamentos** lista pagamentos com status (Aprovado/Pendente/Rejeitado). Se o usuário recarregar a página ou voltar à tela mais tarde, pode ver o status atualizado na tabela, mas o bloco do "Pagamento PIX Criado" continua mostrando "Pendente" e não é atualizado em tempo real.

**Respostas:**

- **Existe feedback claro de que o PIX foi aprovado?**  
  **Não.** Na própria tela de Pagamentos não há confirmação em tempo real. A aprovação só fica visível no histórico (se o usuário recarregar ou reentrar) ou indiretamente pelo saldo em outras telas.

- **Existe confirmação de saldo atualizado?**  
  **Não na tela de Pagamentos.** O saldo não é exibido em Pagamentos. A confirmação ocorre apenas quando o usuário vai ao **Dashboard** ou ao **GameShoot**: aí o saldo é buscado de novo (Dashboard no mount, GameShoot no `initializeGame()`) e o valor aparece atualizado. Não há mensagem do tipo "Saldo atualizado!".

- **O jogador entende que pode jogar agora?**  
  **Só por inferência.** Nenhum copy diz "Pode jogar agora" ou "Seu saldo já está disponível". Quem volta ao site após pagar e vai ao Dashboard vê o novo saldo; quem fica na tela Pagamentos não vê saldo nem mensagem de conclusão.

**Possíveis dúvidas:** "O pagamento caiu?", "Preciso recarregar a página?", "Onde vejo o saldo?" — todas plausíveis na jornada atual.

---

## 2. Recondução ao jogo

**Fluxo após o depósito (do ponto de vista da UI):**

- Em **Pagamentos** o único CTA de saída no header é **"← Voltar"**, que leva ao **Dashboard** (navigate('/dashboard')).
- Não existe na tela de Pagamentos:
  - botão "Jogar agora";
  - botão "Voltar ao jogo";
  - link direto para `/game`.
- No **Dashboard** há quatro ações em grid: Jogar, Depositar, Sacar, Perfil. Todas com o mesmo peso visual. "Jogar" leva a `/game`. Não há destaque ou mensagem do tipo "Seu saldo está pronto — jogue agora".
- Na **Navigation** (sidebar) os itens são: Dashboard, Jogar, Perfil, Saque. Não há item "Depositar" ou "Pagamentos". O jogador pode ir ao jogo clicando em "Jogar" no menu, sem precisar passar pelo Dashboard.

**Respostas:**

- **Existe CTA claro "Jogar agora"?**  
  **Não.** Em nenhuma tela há botão ou link com o texto "Jogar agora".

- **Existe botão "Voltar ao jogo"?**  
  **Não.** Em Pagamentos só existe "← Voltar" (para o Dashboard).

- **Ou o jogador precisa descobrir sozinho?**  
  **Sim.** Ele precisa:
  - clicar em "Voltar" e no Dashboard escolher "Jogar", ou
  - usar o menu lateral e clicar em "Jogar".

Não há quebra técnica do fluxo (as rotas e o menu permitem ir ao jogo), mas há **quebra de fluxo psicológica**: a experiência não conduz explicitamente de "pagamento feito" → "ir jogar". O próximo passo fica implícito.

---

## 3. Momento do primeiro chute

**GameShoot ao carregar (após o jogador ter saldo):**

- No **header** aparecem "Saldo" e o valor em destaque: `R$ {balance.toFixed(2)}` (linhas 332–336). O saldo é carregado em `initializeGame()` via `gameService.initialize()` (perfil + métricas).
- Existe um card **"Valor do Chute"** com "R$ 1,00" e o texto "Cada lote tem 10 chutes. Gol no 10º chute." (linhas 349–356).
- As zonas do gol (TL, TR, C, BL, BR) são botões clicáveis; ficam desabilitados quando `shooting || balance < currentBet` (currentBet = 1). Com saldo ≥ 1, o jogador pode chutar.

**Respostas:**

- **O custo do chute está claro?**  
  **Sim.** "R$ 1,00" e o card de valor do chute estão visíveis antes do primeiro chute.

- **O saldo é visível?**  
  **Sim.** No header da tela do jogo.

- **O jogador entende que está apostando dinheiro real?**  
  **Sim.** Valor em R$, saldo em R$ e contexto de depósito PIX/saque deixam claro que é dinheiro real.

**Fricção nesse momento:** Pouca. Quem chegou com saldo já viu o valor no Dashboard; no jogo o custo e o saldo estão explícitos. O único ponto é que não há frase explícita do tipo "Você está apostando R$ 1,00 neste chute" no momento do clique; o entendimento vem do contexto.

---

## 4. Resultado do primeiro chute

**Comportamento após o chute (GameShoot.jsx):**

- Animação da bola até a zona e do goleiro; após ~950 ms:
  - **Gol:** overlay "GOOOL!" ou "GOL DE OURO!"; toast com "GOL! Você ganhou R$ X" ou "GOL DE OURO! Você ganhou R$ X".
  - **Defesa:** overlay "DEFENDEU!"; toast "Defesa! Tente novamente."
- O saldo no header é atualizado na hora (`setBalance(user.newBalance)` após resposta do backend).
- As estatísticas da sessão (Gols, Defesas, Sequência, Gols de Ouro) são atualizadas.
- Após 3 segundos, `resetAnimations()` é chamado: overlays somem, `shooting` volta a false, as zonas ficam clicáveis de novo para o próximo chute.

**Respostas:**

- **O jogador entende claramente se ganhou ou perdeu?**  
  **Sim.** Overlay (GOOOL / DEFENDEU / GOL DE OURO) + toast deixam óbvio.

- **O prêmio aparece de forma clara?**  
  **Sim.** No toast em R$ ("Você ganhou R$ X") e no saldo atualizado no header.

- **O feedback visual é suficiente?**  
  **Sim.** Animação, overlay, toast e saldo formam um feedback completo.

---

## 5. Transição para o segundo chute

**O que acontece entre o resultado e a possibilidade de chutar de novo:**

- Após o resultado, há um delay de **3 segundos** até `resetAnimations()` (linha 244–246). Durante esse tempo os overlays (GOOOL / DEFENDEU / GOL DE OURO) permanecem; as zonas continuam desabilitadas (`shooting` true).
- Depois dos 3 s, as animações são resetadas, `shooting` passa a false e os botões das zonas são habilitados novamente (desde que `balance >= currentBet`).
- **Não existe** na UI:
  - botão "Chutar novamente";
  - texto "Clique em uma zona para o próximo chute";
  - CTA "Próximo chute" ou similar.
- O jogador precisa **perceber** que pode clicar de novo em uma das cinco zonas. A tela é a mesma; só o overlay some e os botões voltam a ficar clicáveis.

**Respostas:**

- **O sistema incentiva o jogador a continuar?**  
  **Indiretamente.** As estatísticas (sequência, gols) e o saldo visível incentivam; não há incentivo verbal ou CTA.

- **Existe CTA claro para chutar novamente?**  
  **Não.** Nenhum botão ou texto do tipo "Chutar novamente" ou "Próximo chute".

- **Ou o jogador precisa entender sozinho que pode continuar?**  
  **Sim.** Ele precisa inferir que pode clicar em outra zona. A interface é a mesma de antes do primeiro chute; a continuidade é implícita.

**Vazio de continuidade:** Há um vazio entre "resultado exibido" e "próxima ação". Não há ponte explícita (frase ou CTA) que diga "agora você pode chutar de novo". Para usuários acostumados a jogos, isso pode ser óbvio; para outros, pode gerar um momento de hesitação ("e agora?").

---

## 6. Loop de repetição

**Ciclo chutar → ver resultado → chutar novamente:**

- O fluxo é o mesmo para o 1º, 2º, 3º chute etc.: clicar em uma zona → animação → resultado (overlay + toast) → 3 s → reset → zonas clicáveis de novo.
- Não há tela intermediária, modal de "Fim da rodada" nem redirecionamento. O jogador permanece na mesma página e repete o gesto (escolher zona e clicar).
- O loop **não é automático**: não há "próximo chute" disparado sozinho. O jogador precisa clicar em uma zona a cada vez.

**Respostas:**

- **O fluxo é automático?**  
  **Não.** Cada novo chute exige um novo clique em uma zona.

- **Ou depende de iniciativa do jogador?**  
  **Depende da iniciativa do jogador.** A interface não avança sozinha para o próximo chute; apenas libera os botões após os 3 segundos.

**Conclusão:** O ciclo existe e é coerente (mesma tela, mesma mecânica), mas é **discreto**: cada iteração depende de uma decisão explícita do usuário. Não há "modo contínuo" nem CTA que reforce o loop.

---

## 7. Possível erro de arquitetura

**Avaliação do ciclo:**

**depósito confirmado → primeiro chute → segundo chute**

- **Depósito confirmado:** O frontend **não** confirma em tempo real na tela de Pagamentos. O usuário confirma indiretamente ao ver o saldo maior no Dashboard ou no Jogo. Há **lacuna** entre "paguei" e "está confirmado / posso jogar".
- **Depósito → primeiro chute:** A **recondução** ao jogo não é explícita. Não há "Jogar agora" nem "Voltar ao jogo" após o pagamento. O usuário precisa navegar (Voltar + Jogar ou menu Jogar). **Quebra psicológica** nessa transição.
- **Primeiro chute → resultado:** Bem fechado. Resultado claro, saldo atualizado, feedback suficiente.
- **Resultado → segundo chute:** A **transição** é apenas temporal (3 s) e de estado (botões habilitados). Não há CTA nem copy que fechem o ciclo ("Chute de novo"). **Pequena quebra** por falta de ponte explícita.

**Respostas:**

- **O sistema fecha bem esse ciclo?**  
  **Parcialmente.** O trecho "primeiro chute → resultado → segundo chute" é fechado em termos de funcionalidade e feedback. Já o trecho "depósito confirmado → retorno ao jogo → primeiro chute" tem falhas: confirmação do depósito e recondução ao jogo não são explícitas.

- **Existe quebra psicológica na jornada?**  
  **Sim.** Principalmente em:
  1. **Pós-pagamento:** usuário volta ao site sem ver "Aprovado" nem "Saldo atualizado" na tela em que estava; não é guiado para "Jogar agora".
  2. **Pós-resultado:** não há reforço de continuidade ("Chute novamente"), apenas a mesma tela com botões liberados.

O erro de arquitetura típico de jogos monetizados — **quebra entre depósito confirmado e primeiro chute** — está presente: o sistema não garante confirmação clara do depósito nem recondução explícita ao jogo. O elo **primeiro chute → segundo chute** é mais sólido (mesma tela, mesma ação), mas ainda sem CTA de continuidade.

---

## 8. Pontos de abandono

Momentos em que o jogador pode parar **depois de ter depositado**:

| # | Momento | Motivo |
|---|--------|--------|
| 1 | **Após copiar o código PIX e sair para o app do banco** | Ao terminar o pagamento no banco, pode não voltar ao site. Não há lembrete nem CTA "Volte aqui após pagar". |
| 2 | **Ao voltar ao site ainda na tela Pagamentos** | Vê o mesmo bloco "Pendente", sem confirmação de aprovação nem saldo. Pode achar que não caiu e desistir ou ficar em dúvida. |
| 3 | **Após clicar em "Voltar" e ver o Dashboard** | Se não notar que o saldo subiu (ou se houver delay no backend), pode achar que o depósito não funcionou. Nenhuma mensagem reforça "Depósito recebido". |
| 4 | **Antes de clicar em "Jogar" no Dashboard ou no menu** | Sem CTA "Jogar agora", parte dos usuários pode distrair-se (outras abas, Perfil, etc.) e adiar ou abandonar o primeiro chute. |
| 5 | **Na tela do jogo, antes do primeiro chute** | Pouco provável, mas possível (fechar aba, medo de perder). Menor risco porque custo e saldo estão claros. |
| 6 | **Após o primeiro chute (especialmente se perdeu)** | Overlay "DEFENDEU!" e toast "Tente novamente." sem CTA "Chute de novo" ou mensagem de incentivo. Quem reage mal à perda pode sair aqui. |
| 7 | **Durante os 3 segundos do resultado** | Se não entender que em seguida poderá chutar de novo, pode achar que "acabou" e sair. |
| 8 | **Após o primeiro gol** | Menor risco; ganho tende a manter no jogo. Ainda assim, não há CTA explícito para o próximo chute. |

Os mais críticos para o loop de monetização são **1, 2, 3 e 6**: pós-pagamento sem confirmação e sem recondução, e pós-primeiro chute (principalmente em caso de defesa) sem incentivo explícito a continuar.

---

## Classificação final

**LOOP ADEQUADO COM RESSALVAS**

- **O que funciona:**  
  - No jogo, custo (R$ 1), saldo e resultado são claros; o feedback (overlay + toast + saldo) é suficiente.  
  - O ciclo "primeiro chute → resultado → segundo chute" funciona na mesma tela, sem quebra técnica; após 3 s o jogador pode chutar de novo.  
  - Dashboard e GameShoot buscam saldo ao montar, então quem volta após depositar vê o valor atualizado ao ir ao Dashboard ou ao Jogo.

- **O que falha:**  
  - **Confirmação do depósito:** inexistente na tela de Pagamentos (sem polling, sem "Aprovado", sem "Saldo atualizado").  
  - **Recondução ao jogo:** nenhum CTA "Jogar agora" ou "Voltar ao jogo" após o pagamento.  
  - **Transição para o segundo chute:** nenhum CTA "Chutar novamente"; a continuidade é apenas implícita (botões liberados).  
  - **Quebra psicológica** entre depósito confirmado e primeiro chute, com vários pontos de abandono nessa etapa.

Por isso o loop **não está quebrado** (o jogo em si e o ciclo de chutes são funcionais e compreensíveis), mas **não está otimizado** para retenção e conversão do depósito em gameplay. Com confirmação explícita do PIX, recondução "Jogar agora" e um CTA pós-resultado ("Chutar novamente"), o loop pode evoluir para **otimizado para jogo monetizado**.

---

*Fim do relatório — Loop Depósito / Primeiro e Segundo Chute.*
