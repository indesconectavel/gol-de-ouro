# REVISÃO OFICIAL DAS REGRAS DA V1 — GOL DE OURO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Estritamente READ-ONLY — auditoria, comparação decisões vs código, sem alterações.  
**Objetivo:** Fonte única da verdade das regras da V1 e confronto com o comportamento real do backend e frontend.

---

## 1. Resumo executivo

As **decisões de produto** para a V1 estão documentadas em **docs/V1-VALIDATION.md** e em relatórios de patch (PATCH-V1-ENGINE-REGRA-OFICIAL, PATCH-LIMPEZA-RESIDUOS-ENGINE-V1): valor único R$ 1 por chute, lote de 10 chutes, arrecadação R$ 10, prêmio base R$ 5, **gol sempre no 10º chute**, mesmo jogador pode chutar várias vezes no mesmo lote; R$ 2, R$ 5 e R$ 10 reservados para V2.  

O **código atual** (server-fly.js, gameService.js, GameShoot.jsx, GameFinal.jsx, lote-integrity-validator.js) **não** está alinhado à essa definição: o backend aceita **amount 1, 2, 5 e 10** (batchConfigs com quatro valores); o gol é definido por **índice aleatório** (`winnerIndex = crypto.randomInt(0, config.size)`), e não obrigatoriamente no 10º chute; o frontend/hub exibe e permite escolher **R$ 1, 2, 5 e 10**. A única regra implementada conforme a decisão é: **lote por 10 chutes** (para valor 1), **mesmo jogador pode repetir** no mesmo lote, **fechamento ao completar 10 chutes ou ao sair o gol**, prêmio R$ 5 e arrecadação R$ 10 por lote quando valor = 1.  

**Conclusão objetiva:** A V1 **oficial** (decisão) é valor único R$ 1 e gol no 10º chute. O código atual **ainda não** respeita isso: aceita múltiplos valores e usa sorteio para a posição do gol. Qualquer afirmação de que “a V1 está 100% valor único R$ 1” ou “gol no 10º chute” refere-se à **regra desejada**, não ao comportamento atual do sistema.

---

## 2. Regras já definidas

Com base em **docs/V1-VALIDATION.md** (BLOCO B — Engine do jogo), relatórios de patch e especificações:

| Regra | Decisão oficial |
|-------|------------------|
| Valor do chute | **Apenas R$ 1,00** na V1 |
| Seleção de valor no hub | **Removida** — sem escolha de valor |
| Quantidade de chutes por lote | **10 chutes** (para R$ 1) |
| Arrecadação por lote | **R$ 10,00** (10 × R$ 1) |
| Prêmio base | **R$ 5,00** por gol |
| Lucro plataforma | 50% por lote (R$ 10 entrada, R$ 5 saída em prêmio) |
| Mesmo jogador no mesmo lote | **Pode chutar várias vezes** |
| Fechamento do lote | Ao completar 10 chutes **ou** ao sair o gol |
| Momento do gol | **Sempre no 10º chute** (chutes 1 a 9 = erro, chute 10 = gol) |
| Valores R$ 2, R$ 5, R$ 10 | **Reservados para V2** — não fazem parte da regra ativa da V1 |
| Gol de Ouro | R$ 100 adicionais a cada 1000 chutes globais (mantido) |

Documentos que sustentam: **V1-VALIDATION.md** (regra oficial Engine V1), **PATCH-LIMPEZA-RESIDUOS-ENGINE-V1-2026-03-07.md** (winnerIndex = size-1, batchConfigs apenas 1, rejeição amount ≠ 1 em arquivos residuais), **AUDITORIA-ENGINE-V1-REGRA-OFICIAL-READONLY-2026-03-07.md** (divergências e correções sugeridas).

---

## 3. Regras implementadas no código

Evidência obtida por leitura de **server-fly.js**, **utils/lote-integrity-validator.js**, **goldeouro-player** (gameService.js, GameShoot.jsx, GameFinal.jsx).

### 3.1 Backend (server-fly.js)

| Aspecto | Implementação real |
|--------|---------------------|
| Valores aceitos | **1, 2, 5 e 10** — `batchConfigs` com quatro entradas (linhas 373–378). Validação: `if (!batchConfigs[amount])` → 400 "Valor de aposta inválido. Use: 1, 2, 5 ou 10". **Não há** checagem `amount === 1`. |
| Tamanho do lote | Por valor: 1→10, 2→5, 5→2, 10→1 chutes. Para amount=1, lote de **10 chutes**. |
| Definição do gol | **winnerIndex = crypto.randomInt(0, config.size)** na criação do lote (linha 415). **isGoal = (shotIndex === lote.winnerIndex)** (linhas 1205–1206). Ou seja: gol em **posição aleatória** (0 a 9 para valor 1), **não** obrigatoriamente no 10º chute. |
| Fechamento do lote | (1) Ao **gol** — `lote.status = 'completed'`, `lote.ativo = false` (linhas 832–834). (2) Ao **completar tamanho** — `lote.chutes.length >= lote.config.size` (linhas 1303–1307). |
| Mesmo jogador | Nenhuma restrição por `usuario_id` no lote. O validador (lote-integrity-validator.js) explicita: "Permitir múltiplos chutes do mesmo usuário no mesmo lote" (linhas 368–369). **Implementado:** sim. |
| Prêmio | R$ 5,00 fixo por gol; Gol de Ouro + R$ 100 (linhas 816–821). |

### 3.2 Validador (utils/lote-integrity-validator.js)

- **batchConfigs:** 1, 2, 5, 10 com tamanhos 10, 5, 2, 1 (linhas 8–15).  
- **validateBeforeShot:** exige `lote.chutes.length < config.tamanho`; não verifica valor único nem jogador único.  
- **validateAfterShot:** exige que o resultado bata com `lote.chutes.length - 1 === lote.winnerIndex` (goal só nessa posição). Compatível com **qualquer** winnerIndex (0 a size-1), não apenas último.

### 3.3 Frontend / Hub

| Arquivo | Comportamento |
|---------|----------------|
| **GameShoot.jsx** | `betValues = [1, 2, 5, 10]` (linha 69); `currentBet` state (default 1); seção "Valor da Aposta" com **grid de 4 botões R$ 1, R$ 2, R$ 5, R$ 10** (linhas 326–345); chute enviado com `gameService.processShot(dir, currentBet)`. **Permite escolher e enviar qualquer um dos quatro valores.** |
| **GameFinal.jsx** | `betValues = [1, 2, 5, 10]` (linha 581); `currentBet` e seletor de aposta (linhas 667–672). **Permite escolher R$ 1, 2, 5, 10.** |
| **gameService.js** | `batchConfigs` com 1, 2, 5, 10 (linhas 13–17); `currentBet = 1` (padrão); `setBetAmount(amount)`, `getBetConfig(amount)`, `isValidBetAmount(amount)` para qualquer valor. **Suporta e envia amount 1, 2, 5 ou 10.** |
| **BettingControls.jsx** (Game.jsx) | Usado em Game.jsx com `betAmount = 1.00` fixo; exibe "Total Partida …/10". Tela Game.jsx parece fluxo mais simulado; a tela integrada ao backend real é GameShoot (e, onde existir rota, GameFinal). |

Conclusão: o **frontend/hub** ainda **mostra e permite** escolher R$ 1, 2, 5 e 10; não há bloqueio de UI para valor único R$ 1.

---

## 4. Divergências encontradas

| # | Decisão V1 | Código atual | Divergência |
|---|------------|--------------|-------------|
| 1 | Valor único R$ 1 | Backend aceita 1, 2, 5, 10 | **Sim** — backend não restringe a R$ 1. |
| 2 | Escolha de valor removida do hub | GameShoot e GameFinal exibem seletor R$ 1, 2, 5, 10 | **Sim** — frontend ainda permite escolher valor. |
| 3 | Gol sempre no 10º chute | winnerIndex = crypto.randomInt(0, config.size); gol em posição aleatória | **Sim** — gol pode ser no 1º, 2º, … ou 10º chute, não obrigatoriamente no 10º. |
| 4 | Lote de 10 chutes (R$ 1) | Para amount=1, config.size=10 | **Não** — alinhado. |
| 5 | Arrecadação R$ 10, prêmio R$ 5 | totalValue 10, premio 5.00 | **Não** — alinhado quando valor=1. |
| 6 | Mesmo jogador pode repetir no lote | Validador e fluxo permitem múltiplos chutes do mesmo userId no lote | **Não** — alinhado. |
| 7 | Lote fecha ao completar 10 ou ao gol | Fechamento por gol ou por chutes.length >= size | **Não** — alinhado. |
| 8 | R$ 2, 5, 10 reservados para V2 | Backend e frontend tratam 2, 5, 10 como valores ativos | **Sim** — não estão “reservados” no código; estão ativos. |

Não há bloqueio real no backend para impedir uso de valores diferentes de R$ 1: qualquer cliente pode enviar `amount: 2`, `amount: 5` ou `amount: 10` e será aceito.

---

## 5. Regra do lote e do gol

### 5.1 Lote: 10 chutes ou 10 jogadores?

- **Implementação:** Lote é por **número de chutes**, não por jogadores únicos.  
- **Evidência:** `lote.chutes.length`, `validateBeforeShot` com `lote.chutes.length >= config.tamanho`, `shotIndex = lote.chutes.length`. Não há contagem de `usuario_id` distintos nem restrição “um chute por jogador por lote”.  
- **Resposta:** O lote é de **10 chutes** (para valor 1). Não é “10 jogadores únicos”.

### 5.2 Mesmo jogador pode chutar várias vezes no mesmo lote?

- **Implementação:** Sim. Comentário no validador: “Permitir múltiplos chutes do mesmo usuário no mesmo lote” (lote-integrity-validator.js, linhas 368–369). Nenhum `if` impede o mesmo `userId` em vários chutes do mesmo lote.  
- **Resposta:** **Sim** — o código permite explicitamente.

### 5.3 Quando o lote fecha?

- Ao **sair o gol** — imediatamente após definir `isGoal`, o lote é marcado `completed` e `ativo = false`.  
- Ao **completar 10 chutes** (para valor 1) — se ainda não houve gol, ao 10º chute `chutes.length >= config.size` e o lote é fechado (linhas 1303–1307).  
- **Resposta:** Nas **duas** condições: ao gol **ou** ao completar 10 chutes.

### 5.4 Quando o gol acontece?

- **Evento que define o gol:** comparação **shotIndex === lote.winnerIndex**, onde `shotIndex = lote.chutes.length` no momento do chute (antes do push).  
- **Definição de winnerIndex:** na **criação** do lote, `winnerIndex = crypto.randomInt(0, config.size)` (ex.: para size 10, um inteiro entre 0 e 9).  
- **Resposta:** O gol acontece **na posição aleatória** sorteada (winnerIndex), que pode ser o 1º, 2º, … ou 10º chute. **Não** é “sempre no 10º chute” no código atual. A regra desejada (“gol no 10º chute”) exigiria `winnerIndex = config.size - 1` (9 para size 10), o que **não** está implementado em server-fly.js.

### 5.5 Divergência entre regra desejada e implementação

- **Regra desejada:** “Mesmo jogador pode chutar várias vezes no mesmo lote”; “10º chute fecha os R$ 10”; “engine aceita apenas R$ 1”.  
- **Comportamento real:**  
  - Mesmo jogador várias vezes no mesmo lote: **implementado**.  
  - 10º chute fecha o lote (quando não há gol antes): **implementado**.  
  - Aceitar apenas R$ 1: **não implementado** — backend aceita 1, 2, 5, 10; frontend oferece os quatro valores.  
  - Gol no 10º chute: **não implementado** — gol em posição aleatória.

---

## 6. Definição econômica oficial proposta para a V1

Com base nas decisões já tomadas (V1-VALIDATION.md e contexto do produto):

| Item | Regra oficial proposta V1 |
|------|----------------------------|
| Valor por chute | **R$ 1,00** (único valor ativo) |
| Quantidade de chutes por lote | **10** |
| Arrecadação por lote | **R$ 10,00** |
| Prêmio por lote | **R$ 5,00** (base); + R$ 100 se Gol de Ouro |
| Lucro da plataforma | 50% por lote (R$ 5 retidos quando prêmio base) |
| Mesmo jogador no mesmo lote | **Pode entrar mais de uma vez** (vários chutes no mesmo lote) |
| Quando o lote fecha | Ao **completar 10 chutes** ou ao **gol** (o que ocorrer primeiro) |
| Quando o gol acontece | **Sempre no 10º chute** (chutes 1 a 9 = erro; chute 10 = gol) |
| Gol de Ouro | Mantido: R$ 100 adicionais a cada 1000 chutes globais |

Esta é a **regra-mestra** que deve ser a referência para documentação, testes e homologação da V1.

---

## 7. O que fica reservado para V2

- **Valores de aposta R$ 2, R$ 5 e R$ 10** — decisão de produto: não fazem parte da regra ativa da V1; ficam reservados para uma possível V2.  
- **Lotes com tamanho diferente de 10** (ex.: 5 chutes para R$ 2, 2 para R$ 5, 1 para R$ 10) — hoje no código como configs alternativas; na V1 estrita só existe lote de 10 chutes de R$ 1.  
- **Seleção de valor da aposta no hub** — na V1 deve ser removida; na V2 pode ser (re)oferecida.

O código atual ainda expõe esses valores e comportamentos; “reservado” aqui é em relação à **regra oficial da V1**, não à implementação atual.

---

## 8. Riscos de confusão futura

1. **Frontend mostrando só R$ 1 mas backend aceitando 2, 5, 10** — Hoje ambos mostram e aceitam os quatro. Se no futuro o frontend for alterado para exibir só R$ 1, a API continuará aceitando 2, 5, 10 até o backend ser alterado. Risco: testes ou integrações enviando amount ≠ 1 e sendo aceitos sem que a equipe espere.  
2. **Documentação dizendo “10 jogadores” e código operando por “10 chutes”** — Se em algum material aparecer “10 jogadores por lote”, isso é incorreto; o sistema é por **10 chutes**, com o mesmo jogador podendo responder por vários deles.  
3. **Regra “gol no 10º chute” vs engine com sorteio** — Quem ler apenas a regra oficial pode assumir que o 10º chute é sempre gol. No código, o gol ocorre em posição aleatória. Risco de expectativa errada em produto, suporte ou auditoria.  
4. **Regra de reentrada do mesmo jogador não documentada** — Está implementada e documentada em relatórios e no validador; manter na documentação oficial da V1 evita que alguém “corrija” o sistema impedindo múltiplos chutes do mesmo jogador no mesmo lote.  
5. **V2 herdando comportamento indefinido da V1** — Se a V2 reutilizar batchConfigs e lógica atual sem formalizar que a V1 “ativa” é só R$ 1 e gol no 10º, a V2 pode herdar múltiplos valores e gol aleatório como se fossem definição oficial.  
6. **Patch “V1” aplicado em server-fly-deploy.js e não em server-fly.js** — A limpeza de resíduos (PATCH-LIMPEZA-RESIDUOS) alterou **server-fly-deploy.js** (winnerIndex = size-1, amount !== 1 rejeitado). O entrypoint em produção é **server-fly.js**, que **não** contém essas alterações. Risco: acreditar que “o patch V1 já está em produção” quando o arquivo ativo não foi o que recebeu o patch.

---

## 9. Diagnóstico final

**Classificação:** **REGRAS CLARAS COM AJUSTES PENDENTES**

- **REGRAS CLARAS:** A definição da V1 está documentada (valor único R$ 1, 10 chutes, R$ 10 arrecadados, prêmio R$ 5, gol no 10º chute, mesmo jogador pode repetir, R$ 2/5/10 reservados para V2).  
- **AJUSTES PENDENTES:** O código atual (server-fly.js, validador, frontend) ainda aceita múltiplos valores e usa sorteio para a posição do gol; não há bloqueio real para R$ 1 único nem fixação do gol no 10º chute no entrypoint de produção.

---

## 10. Conclusão objetiva

- **A V1 oficial do Gol de Ouro deve ser:** valor único **R$ 1** por chute, lote de **10 chutes**, arrecadação **R$ 10**, prêmio base **R$ 5**, **gol sempre no 10º chute**, mesmo jogador **pode** chutar várias vezes no mesmo lote; lote fecha ao completar 10 chutes ou ao gol; R$ 2, R$ 5 e R$ 10 reservados para V2.  
- **O código atual NÃO está alinhado a essa definição:**  
  - Backend aceita **1, 2, 5 e 10**.  
  - Frontend/hub **mostra e permite** escolher R$ 1, 2, 5 e 10.  
  - Gol é definido por **índice aleatório** (winnerIndex sorteado), não obrigatoriamente no 10º chute.  
- **O que já está alinhado:** lote de 10 chutes (para valor 1), arrecadação R$ 10 e prêmio R$ 5, fechamento ao completar 10 chutes ou ao gol, permissão de múltiplos chutes do mesmo jogador no mesmo lote.

**Respostas diretas às perguntas:**

| Pergunta | Resposta |
|----------|----------|
| A V1 oficial é 100% valor único de R$ 1? | **Como decisão, sim. No código, não** — backend e frontend ainda aceitam 1, 2, 5, 10. |
| O lote é de 10 chutes ou 10 jogadores únicos? | **10 chutes.** Não é por jogadores únicos. |
| O mesmo jogador pode repetir no mesmo lote? | **Sim** — permitido e implementado. |
| O gol sai no 10º chute ou por índice aleatório? | **No código atual: por índice aleatório.** Na regra desejada da V1: no 10º chute. |
| O código atual já está alinhado à definição V1? | **Não.** Falta restringir valor a R$ 1 e fixar o gol no 10º chute (winnerIndex = 9) no backend ativo (server-fly.js) e remover/ocultar seleção de valor no hub. |

---

*Nenhuma alteração foi feita em código, banco ou documentação existente.*  
*Revisão conduzida em modo estritamente READ-ONLY.*
