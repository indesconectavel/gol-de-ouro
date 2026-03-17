# CIRURGIA CONTROLADA — ENGINE V1 — GOL DE OURO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Objetivo:** Alinhar a engine e o frontend da V1 à regra oficial do produto (valor único R$ 1, gol no 10º chute, sem seletor de valor no hub).  
**Escopo:** Backend (server-fly.js), frontend (GameShoot.jsx, GameFinal.jsx, gameService.js). Nenhuma alteração em auth, PIX, saque, banco ou arquitetura geral.

---

## 1. Resumo executivo

Foi executada uma **cirurgia controlada** para que a V1 do Gol de Ouro passe a refletir a regra oficial: **apenas R$ 1,00 por chute**, **gol sempre no 10º chute**, **mesmo jogador pode chutar várias vezes no mesmo lote**, **hub sem escolha de valor**.  

**Backend:** Em POST /api/games/shoot, qualquer `amount` diferente de 1 passou a ser rejeitado com 400 e mensagem clara. A posição do gol foi fixada no último chute do lote (`winnerIndex = config.size - 1`), garantindo que chutes 1 a 9 sejam sempre *miss* e o 10º seja sempre *goal*. A reentrada do mesmo jogador no mesmo lote foi mantida (nenhum bloqueio por usuario_id).  

**Frontend:** Removida a seleção de valor da aposta em GameShoot.jsx e GameFinal.jsx; o jogador vê apenas “R$ 1,00 por chute” e a descrição da economia (lote 10 chutes, prêmio R$ 5). O gameService passou a enviar sempre `amount: 1` e a expor apenas `availableBets: [1]` no fluxo V1.  

Prêmio base R$ 5, Gol de Ouro, persistência, trigger e atualização de saldo foram preservados.

---

## 2. Arquivos alterados

| Arquivo | Alterações |
|---------|------------|
| **server-fly.js** | Validação V1: rejeitar amount ≠ 1 com 400; uso de `betAmount = 1` no fluxo do shoot; `winnerIndex = config.size - 1` na criação do lote (gol no último chute). |
| **goldeouro-player/src/pages/GameShoot.jsx** | Removidos `betValues`, `currentBet` e seletor de valor; constante `betAmount = 1`; bloco de UI substituído por texto fixo “R$ 1,00 por chute” e regra do lote; `processShot(dir, betAmount)`. |
| **goldeouro-player/src/pages/GameFinal.jsx** | Removidos `currentBet`, `setCurrentBet`, `betValues`, `handleBetChange`; constante `betAmount = 1`; seção de apostas substituída por “R$ 1,00 por chute”; `simulateProcessShot(direction, betAmount)` e `canShoot` com `betAmount`. |
| **goldeouro-player/src/services/gameService.js** | `processShot(direction, amount = 1)` com `betValue = 1` enviado ao backend; `getGameInfo().config.availableBets = [1]` para V1; mantidos `batchConfigs` para possível V2. |

**Arquivos não alterados:** utils/lote-integrity-validator.js (continua aceitando lote por valor; como só recebe valor 1, comportamento alinhado), schema SQL, triggers, rotas de auth/PIX/saque, outros componentes.

---

## 3. Correções aplicadas no backend

### 3.1 Bloqueio de amount diferente de 1

- Após validar direção, o handler de POST /api/games/shoot passa a checar `Number(amount) !== 1`.
- Se for diferente de 1, responde **400** com: *"V1 aceita apenas R$ 1,00 por chute. Outros valores ficam reservados para versões futuras."*
- Nenhum lote é obtido nem alterado; a validação ocorre antes de `getOrCreateLoteByValue`.
- No restante do fluxo usa-se a constante `betAmount = 1` (saldo, lote, chute, INSERT, resposta), garantindo que apenas 1 seja processado.

### 3.2 Ajuste da lógica do gol

- Na criação do lote, em getOrCreateLoteByValue, o índice do vencedor passou de `crypto.randomInt(0, config.size)` para **`config.size - 1`**.
- Para valor 1, `config.size` é 10, logo **winnerIndex = 9** (10º chute em base 0).
- Com isso, `isGoal = (shotIndex === lote.winnerIndex)` resulta em *goal* apenas quando `shotIndex === 9`, ou seja, no 10º chute; chutes 0 a 8 são sempre *miss*.
- O lote continua fechando ao gol (imediatamente) ou ao completar 10 chutes; com o gol fixo no 10º, o fechamento por “cheio sem gol” não ocorre na V1.

### 3.3 Preservação da reentrada do mesmo jogador

- Nenhuma verificação por `usuario_id` ou “uma participação por lote” foi adicionada.
- O validador (lote-integrity-validator.js) segue permitindo múltiplos chutes do mesmo usuário no mesmo lote; o backend não altera esse comportamento.
- O lote continua sendo contado por **chutes** (lote.chutes.length), não por jogadores únicos.

---

## 4. Correções aplicadas no frontend

### 4.1 Remoção da escolha de valor

- **GameShoot.jsx:** Removidos o array `betValues`, o state `currentBet` e a função `handleBetChange`. A seção “Valor da Aposta” com os quatro botões (R$ 1, 2, 5, 10) foi substituída por um bloco fixo: título “Valor da Aposta”, texto “R$ 1,00 por chute” e descrição “Cada lote tem 10 chutes. O gol sai no 10º chute. Prêmio: R$ 5,00.”
- **GameFinal.jsx:** Removidos `currentBet`, `setCurrentBet`, `betValues` e `handleBetChange`. A área de apostas com os botões R$ 1–10 foi substituída por “Aposta:” e “R$ 1,00 por chute”.

### 4.2 Ajuste do fluxo visual para R$ 1 fixo

- Em ambas as telas, o valor usado para chute é a constante **betAmount = 1**.
- As checagens de saldo e o envio ao backend usam esse valor; não há mais estado editável de aposta.
- Botões de zona e demais elementos do jogo seguem iguais; apenas o bloco de “valor da aposta” foi simplificado para refletir a V1.

### 4.3 Alinhamento com o backend

- O gameService envia sempre `amount: 1` em POST /api/games/shoot (via `betValue = 1` em processShot).
- `getGameInfo().config.availableBets` passou a ser `[1]`, evitando que a UI ou outros consumidores tratem 2, 5 ou 10 como opções ativas na V1.
- Assim, frontend e backend ficam alinhados: apenas R$ 1 é oferecido e aceito na V1.

---

## 5. Compatibilidade da API

### POST /api/games/shoot

- **Body:** Continua `{ direction, amount }`. Para a V1, o cliente deve enviar **amount: 1**; qualquer outro valor resulta em **400** com a mensagem indicada acima.
- **Resposta 200:** Inalterada: `{ success: true, data: { loteId, direction, amount, result, premio, premioGolDeOuro, isGolDeOuro, contadorGlobal, timestamp, playerId, loteProgress, isLoteComplete, novoSaldo? } }`. O campo `amount` na resposta será sempre 1 na V1.
- **Resposta 400:** Inclui o caso “V1 aceita apenas R$ 1,00 por chute…” quando amount ≠ 1; demais validações (direção, saldo, etc.) mantidas.
- Nenhuma mudança em autenticação, headers ou outros endpoints.

---

## 6. Regras da V1 após a cirurgia

As regras abaixo estão implementadas no código após a cirurgia:

| Regra | Implementação |
|-------|----------------|
| Cada chute custa R$ 1 | Backend rejeita amount ≠ 1; frontend envia e exibe apenas R$ 1. |
| Lote de 10 chutes | batchConfigs[1].size = 10; validateBeforeShot e fechamento por tamanho mantidos. |
| Mesmo jogador pode chutar várias vezes no mesmo lote | Sem bloqueio por usuario_id; validador permite múltiplos chutes do mesmo usuário. |
| Gol sempre no 10º chute | winnerIndex = config.size - 1 (9 para size 10); chutes 1–9 = miss, 10º = goal. |
| Lote fecha ao completar 10 chutes ou ao gol | Lógica de fechamento por gol e por tamanho preservada. |
| Prêmio base R$ 5 | Mantido; Gol de Ouro (R$ 100 a cada 1000 chutes) mantido. |
| Hub sem seletor de valor | GameShoot e GameFinal exibem apenas “R$ 1,00 por chute”. |
| R$ 2, R$ 5, R$ 10 reservados para V2 | Backend não os aceita na rota de shoot; frontend não os exibe; gameService expõe apenas [1] em availableBets. |

---

## 7. Riscos eliminados

- **Backend aceitando 2, 5, 10:** Eliminado — apenas amount = 1 é aceito; demais retornam 400.
- **Gol em posição aleatória:** Eliminado — gol fixo no último chute (winnerIndex = size - 1).
- **Hub sugerindo múltiplos valores:** Eliminado — seletor de valor removido; apenas R$ 1 exibido.
- **Divergência entre documentação (regra V1) e código:** Reduzida — comportamento da V1 (R$ 1, 10º chute = gol, mesmo jogador pode repetir) está implementado.

---

## 8. Riscos remanescentes

- **Trigger update_user_stats em produção:** Continua sendo pressuposto crítico para o débito do perdedor; a cirurgia não altera o banco nem os triggers. Recomenda-se confirmar a existência do trigger no Supabase de produção.
- **Validação em ambiente real:** Recomenda-se validar em staging/produção os cenários A a F (amount 1 aceito, amount 2 rejeitado, 1º–9º miss, 10º goal, mesmo jogador várias vezes, hub sem seletor).
- **batchConfigs com 2, 5, 10 no backend:** Permanecem no objeto para possível uso futuro (V2); não são aceitos na rota de shoot. Risco apenas se alguém alterar a validação sem atualizar a regra de produto.

---

## 9. Diagnóstico final

**Classificação:** **ENGINE V1 ALINHADA**

- A regra oficial da V1 (R$ 1 único, 10 chutes por lote, gol no 10º chute, mesmo jogador pode repetir, sem seletor de valor) está refletida no backend e no frontend.
- Não foram identificados resíduos ativos da lógica antiga no fluxo da V1 (múltiplos valores ou gol aleatório).
- Riscos remanescentes são de ambiente (trigger) e de validação prática, não de desalinhamento de regra no código.

---

## 10. Conclusão objetiva

A **regra oficial da V1** do Gol de Ouro **passou a estar refletida no código** após esta cirurgia:

- **Backend:** Aceita apenas amount = 1 em POST /api/games/shoot; gol sempre no 10º chute (winnerIndex = config.size - 1); mesma permissão de múltiplos chutes do mesmo jogador no mesmo lote.
- **Frontend:** Sem seletor de valor; exibição fixa “R$ 1,00 por chute” e descrição do lote (10 chutes, prêmio R$ 5); envio sempre com amount 1.
- **gameService:** Envia amount 1 e expõe apenas availableBets [1] no fluxo V1.

Os cenários funcionais esperados passam a valer: (A) amount 1 aceito; (B) amount 2 rejeitado com erro coerente; (C) 1º ao 9º chute sempre miss; (D) 10º chute sempre goal; (E) mesmo jogador pode chutar várias vezes no mesmo lote; (F) hub sem seletor de valor. A economia (prêmio R$ 5, Gol de Ouro, persistência, trigger, saldo) foi preservada.

---

*Cirurgia controlada concluída em 2026-03-09. Nenhuma alteração em autenticação, PIX, saque, banco ou arquitetura geral.*
