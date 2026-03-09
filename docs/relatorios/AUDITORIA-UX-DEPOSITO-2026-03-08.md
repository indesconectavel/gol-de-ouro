# AUDITORIA UX — CONVERSÃO DE DEPÓSITO

**Projeto:** Gol de Ouro — Web Player  
**Foco:** UX e conversão no fluxo Dashboard → Depósito PIX → Jogar  
**Data:** 2026-03-08  
**Modo:** READ-ONLY (nenhuma alteração de código ou configuração)

**Objetivo:** Identificar pontos invisíveis que possam reduzir a taxa de conversão entre Dashboard, Depósito PIX e Jogo — problemas psicológicos, visuais e estruturais que levem o jogador a desistir antes de depositar.

---

## 1. Contexto do jogador

### O que a interface comunica hoje

- **Dinheiro real:** Não há frase explícita no Dashboard dizendo que o jogo usa dinheiro real. O saldo em "R$" e os botões "Depositar" e "Sacar" sugerem dinheiro real, mas um usuário novo pode ainda ter dúvida.
- **Quanto custa jogar:** No **Dashboard** não aparece o custo por chute. O jogador só vê "R$ 1,00 por chute" ao entrar em **GameShoot** (bloco "Valor do Chute"). Quem decide "Jogar" antes de depositar pode não saber que precisa de pelo menos R$ 1,00.
- **Quanto pode ganhar:** No Dashboard não há menção a prêmios ou Gol de Ouro. Em GameShoot sim: "A cada 1000 chutes, um jogador ganha R$ 100 extra!" e valor do chute. Ou seja, a **expectativa de ganho** só aparece depois que o usuário já entrou no jogo.
- **Quanto possui de saldo:** Dashboard mostra "Saldo Disponível" em destaque (R$ X,XX). GameShoot mostra "Saldo" no header. **Sidebar (Navigation)** mostra valor fixo "R$ 150,00", que não reflete o saldo real e pode gerar confusão ou desconfiança.

### Antes da ação de depósito

- No Dashboard o jogador vê: saldo, depois quatro botões em grid (Jogar, Depositar, Sacar, Perfil). Não há texto do tipo "Para jogar, você precisa de saldo" ou "Cada chute custa R$ 1,00". Quem tem R$ 0,00 pode clicar em "Jogar", ser levado ao jogo e só então descobrir que precisa depositar — aumentando frustração e abandono.
- **Ambiguidade:** Não fica claro que o fluxo esperado é "depositar → depois jogar". "Jogar" e "Depositar" têm o mesmo peso visual; não há hierarquia nem copy que guie para depositar primeiro quando o saldo é zero.

---

## 2. Transição jogo → dinheiro

### Consistência visual entre telas

- **Dashboard e GameShoot:** Mesmo universo — fundo escuro (imagem de estádio + overlay), glassmorphism (bg-white/10, bordas white/20), amarelo para destaque, mesma sidebar.
- **Pagamentos:** **Quebra clara.** Fundo `bg-gray-50`, cards `bg-white`, texto `text-gray-900`, bordas `border-gray-200`. Nenhum glassmorphism, nenhuma referência visual ao estádio/jogo. A página se parece com um **painel administrativo ou financeiro**, não com uma etapa do mesmo jogo.

### Transição Dashboard → Pagamentos

- Ao clicar "Depositar", o usuário é levado a uma tela que **não parece parte do mesmo produto**. Cores, tipografia e componentes são de outro sistema. Isso pode:
  - Reduzir sensação de continuidade e segurança.
  - Aumentar a sensação de "sistema de pagamento externo" e, com isso, fricção para concluir o depósito.

### Transição Pagamentos → Jogo

- Após criar o PIX, o único retorno oferecido é "← Voltar" (para o dashboard). Não há CTA "Jogar agora" ou "Ir para o jogo". O jogador que acabou de depositar não é conduzido de volta ao jogo de forma explícita.

**Conclusão:** A transição para Pagamentos quebra o ambiente de jogo; a transição de volta não reforça o objetivo (jogar).

---

## 3. Visibilidade do depósito

### Onde está o botão de depositar

- **Dashboard:** Botão "Depositar" (💰) no grid de 4 ações, segunda posição (após "Jogar"). Mesmo tamanho e estilo dos outros três.
- **Sidebar (Navigation):** Não há item "Depositar" ou "Pagamentos". Menu: Dashboard, Jogar, Perfil, Saque. Quem está em GameShoot ou em outra tela **não tem atalho direto para depositar** na sidebar; precisa voltar ao Dashboard.

### Visibilidade e competição com outras ações

- No Dashboard, "Jogar" aparece **antes** de "Depositar" (ordem visual e de leitura). Os quatro botões têm o mesmo peso (mesma classe, mesmo tamanho). Não há destaque para depósito quando o saldo é zero.
- **Consequência:** Quem quer "só jogar" tende a clicar em "Jogar" primeiro. Só na tela do jogo descobre que precisa de saldo e vê o botão "Recarregar" (que leva a Pagamentos). Ou seja, o depósito é mais reativo (após erro) do que proativo (convidar a depositar antes de jogar).

### Clareza sobre onde, quando e por que depositar

- **Onde:** Fica claro apenas para quem já foi ao Dashboard e viu "Depositar", ou quem viu "Recarregar" no jogo.
- **Quando:** Nenhum texto diz "Deposite para poder jogar" ou "Sem saldo você não pode chutar".
- **Por que:** O subtítulo em Pagamentos ("Recarregue seu saldo para apostar no jogo") é bom, mas só aparece **dentro** da tela de pagamento. No Dashboard não há copy que vincule depósito → poder jogar.

---

## 4. Clareza do PIX

### Foco visual e valor

- **QR Code:** A tela exibe o código PIX em **texto** (copia e cola). Não há no código frontend renderização de imagem de QR a partir de `qr_code_base64` (ou similar). As instruções dizem "Copie o código PIX ou escaneie o QR Code"; se o backend não enviar QR em imagem, o jogador só tem a opção de copiar/colar. Em mobile, copiar um código longo pode ser mais trabalhoso que escanear um QR.
- **Valor selecionado:** O valor aparece em destaque ("R$ X,XX") no bloco "Pagamento PIX Criado" e no botão "Recarregar R$ X,XX". O valor padrão na tela é **R$ 200**, mas os presets são [1, 5, 10, 25, 50, 100]. R$ 200 não está nos botões; o usuário pode não perceber que está gerando PIX de R$ 200 ao clicar sem alterar.

### Confirmação após gerar o PIX

- Após criar o PIX, um novo bloco aparece no topo ("Pagamento PIX Criado", "Pendente") e a página faz scroll suave até ele. Há confirmação visual (título, valor, código, botão "Copiar Código PIX"). **Porém:** o feedback de sucesso usa `toast.success('Pagamento PIX criado com sucesso!')` e o **ToastContainer não está renderizado** no App — o toast não aparece. O usuário depende apenas da aparição do bloco e do scroll.

### O que fazer após gerar o PIX

- Instruções em texto: "Copie o código abaixo e cole no seu app bancário" e "Cole este código no seu app bancário para completar o pagamento". Há também o passo a passo "Como funciona o PIX" (escolher valor, copiar/escanejar, pagar no app, saldo creditado). O fluxo é compreensível.
- **Falta:** Um CTA claro do tipo "Pagou? Voltar ao jogo" ou "Quando seu saldo atualizar, clique aqui para jogar". Após copiar o código, o jogador não é guiado de volta ao jogo.

---

## 5. Fricção cognitiva

### Textos técnicos ou burocráticos

- Pagamentos usa "Pagamento PIX Criado", "ID: {id}", "Valor personalizado", "Recarregar Saldo", "Histórico de Pagamentos". É neutro e pouco "gamificado". O título "Pagamentos PIX" soa mais administrativo que "Recarregar para jogar" ou "Coloque créditos".
- No bloco do PIX criado aparece "ID: {pagamentoAtual.id}" — informação técnica, pouco relevante para o jogador e pode parecer burocrático.

### Muitas opções de valor

- Presets: R$ 1, 5, 10, 25, 50, 100 (seis botões). Mais o campo "Valor personalizado". Para um jogo de R$ 1,00 por chute, poderia bastar menos opções ou valores mais alinhados ao uso (ex.: "R$ 10 = 10 chutes"). Muitas escolhas podem atrasar a decisão.

### Botões competindo com o depósito

- No Dashboard, "Jogar" compete em igualdade com "Depositar", "Sacar" e "Perfil". Quem quer apenas jogar não é direcionado a depositar primeiro quando saldo = 0.
- Em Pagamentos, "← Voltar" está no header; após criar o PIX não há botão primário "Jogar agora" ou "Ver meu saldo no jogo".

### Mensagens que parecem burocráticas

- "Pagamento PIX criado com sucesso!" (toast que não aparece) e o bloco com "Pendente", "ID", "Código PIX" reforçam o lado transacional. Falta linguagem do tipo "Seu crédito está quase lá — pague no app e volte para jogar".

---

## 6. Feedback de ação

### PIX criado

- **Visual:** Novo bloco aparece, scroll automático até o código. ✅  
- **Toast:** `toast.success(...)` é chamado mas **ToastContainer não existe** no App — usuário não vê confirmação em toast. ❌

### Pagamento detectado / saldo atualizado

- Não há na interface polling, websocket ou mensagem explícita do tipo "Pagamento aprovado — saldo atualizado". O jogador precisa voltar ao Dashboard ou ao Jogo para ver o saldo atualizado. Não há feedback em tempo real na tela de Pagamentos ("Seu pagamento foi aprovado!").
- Se o backend enviar webhook e o saldo for atualizado no backend, o frontend só refletirá isso quando o usuário recarregar a página ou navegar para uma tela que busque o perfil de novo.

### Ações sem feedback visual

- **Criar PIX:** Feedback visual parcial (bloco + scroll); falta toast e CTA pós-ação.
- **Copiar código:** Botão muda para "✅ Código Copiado!" por 3 segundos — bom.
- **Saldo após pagamento:** Nenhum aviso na tela de Pagamentos; usuário não sabe quando pode voltar a jogar sem recarregar ou trocar de tela.

---

## 7. Continuidade de imersão

### Cores

- **Dashboard / GameShoot:** Escuro (slate/gray-900), amarelo (destaque), verde (ações positivas), branco semitransparente. Coerente com "jogo/estádio".
- **Pagamentos:** Cinza claro (gray-50), branco, azul (blue-600 para botões e blocos). Paleta de **formulário/admin**, não de jogo.

### Tipografia e componentes

- Dashboard/GameShoot: títulos bold, subtítulos em white/70, cards com borda white/20.
- Pagamentos: títulos em gray-900, texto gray-600, cards brancos com border-gray-200. Nenhum uso de glassmorphism ou fundo de estádio.

### Animações e hierarquia

- Dashboard e GameShoot usam hover (scale-105), animate-bounce em ícones, transições. Pagamentos é estático (sem animações de entrada ou microinterações no mesmo estilo).
- Conclusão: **Na tela de Pagamentos o jogador deixa de sentir que está "dentro do jogo".** Parece um sistema externo de pagamento, o que pode reduzir confiança e aumentar abandono no momento do depósito.

---

## 8. Microdecisões que afetam conversão

- **Valor padrão R$ 200 sem preset:** Usuário pode gerar PIX de R$ 200 sem perceber (presets só até 100). Pode assustar ou gerar arrependimento.
- **"Recarregar" vs "Depositar":** No jogo o botão é "Recarregar"; no Dashboard é "Depositar". Dois termos para a mesma ação — pequena inconsistência.
- **Botão "Jogar" primeiro no Dashboard:** Quem tem R$ 0 tende a clicar em Jogar antes de Depositar; descobre a necessidade de saldo só no jogo. Falta incentivo visual (ex.: destaque em "Depositar" quando saldo = 0).
- **Sem CTA pós-PIX:** Depois de criar o PIX não há "Jogar assim que o saldo cair" ou "Avisar quando estiver pronto para jogar". O próximo passo fica implícito.
- **Sidebar com "R$ 150,00" fixo:** Inconsistência com o saldo real; pode parecer bug ou desconfiança.
- **"Ver todas →" em Apostas Recentes:** Abre `alert('Histórico completo será implementado em breve!')` — transmite produto incompleto e pode minar confiança.
- **Excesso de informação antes do depósito:** Histórico de pagamentos e tabela na mesma tela podem distrair; o foco poderia ser "valor → gerar PIX → copiar".

---

## 9. Fluxo de retorno ao jogo

### Após PIX criado

- Scroll até o bloco do código. Não há botão "Voltar ao jogo" ou "Continuar para o jogo". O usuário precisa usar "← Voltar" (Dashboard) e depois "Jogar". Dois cliques e nenhuma narrativa de retorno.

### Após PIX pago

- Nenhuma mensagem na tela de Pagamentos informando que o pagamento foi detectado. Nenhum redirecionamento automático para o jogo. O jogador não é guiado de volta.

### Após saldo atualizado

- Saldo só aparece atualizado em Dashboard ou GameShoot ao recarregar ou ao navegar de volta. Não há indicação em Pagamentos do tipo "Seu saldo foi atualizado — jogar agora".

**Conclusão:** O fluxo de retorno é fraco. Não há guia explícito "depositou → volte a jogar" nem feedback de "pagamento recebido — pode jogar".

---

## 10. Problemas de confiança

- **Clareza do saldo:** Dashboard e GameShoot mostram o mesmo saldo (API profile). Sidebar mostra "R$ 150,00" fixo — **inconsistência** que pode fazer o usuário duvidar dos números.
- **Clareza das ações:** "Depositar" e "Recarregar" para a mesma ideia; "Pagamentos PIX" soa institucional. Pode reduzir sensação de controle e clareza.
- **Quebra visual em Pagamentos:** Tela clara e administrativa em meio a um app escuro e de jogo pode sugerir redirecionamento para outro sistema e aumentar receio na hora de colocar dados/copiar PIX.
- **ToastContainer ausente:** Erros e sucessos que deveriam aparecer em toast não aparecem. Usuário pode achar que nada aconteceu ao criar PIX ou ao falhar um chute (ex.: saldo insuficiente).
- **Alert de "Histórico em breve":** Mensagem de funcionalidade futura em produção transmite produto inacabado e pode reduzir confiança.

---

## CLASSIFICAÇÃO FINAL

**UX COM RISCO DE BAIXA CONVERSÃO**

A auditoria identifica vários fatores que podem reduzir a conversão no fluxo Dashboard → Depósito → Jogar:

1. **Contexto do jogador:** Custo do jogo (R$ 1/chute) e necessidade de depositar antes de jogar não são comunicados no Dashboard; saldo na sidebar é fixo e incorreto.
2. **Transição e imersão:** Tela de Pagamentos quebra totalmente o tema de jogo (tema claro, layout administrativo), reduzindo continuidade e sensação de segurança.
3. **Visibilidade do depósito:** Depósito não está na sidebar; no Dashboard compete em igualdade com "Jogar", sem destaque quando saldo é zero.
4. **Feedback:** Toasts não aparecem (ToastContainer ausente); não há confirmação de "pagamento aprovado" nem guia de retorno ao jogo.
5. **Fricção e microdecisões:** Valor padrão R$ 200 fora dos presets, falta de CTA pós-PIX, alert de "em breve" e terminologia inconsistente (Depositar/Recarregar).

Correções prioritárias para melhorar conversão: manter o mesmo universo visual em Pagamentos (ou aproximar do restante do app), comunicar no Dashboard que é preciso ter saldo para jogar e quanto custa cada chute, destacar "Depositar" quando saldo for zero, adicionar ToastContainer, exibir saldo real na sidebar, e incluir CTA claro após criar o PIX ("Jogar quando o saldo atualizar" ou "Voltar ao jogo").

---

*Relatório gerado em modo read-only. Nenhuma alteração foi feita em código, rotas, CSS ou configuração.*
