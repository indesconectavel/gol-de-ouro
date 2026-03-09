# Validação final — Engine alinhada à regra oficial V1 (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — auditoria final, nenhum arquivo alterado.  
**Objetivo:** Confirmar que a engine do jogo Gol de Ouro está totalmente alinhada à regra oficial da V1 após o patch aplicado.

---

## Regra oficial V1 (referência)

- Todos os chutes custam **R$ 1,00**
- Não existe seleção de valor
- Cada lote possui **10 chutes**
- Cada lote arrecada **R$ 10,00**
- O gol acontece obrigatoriamente no **10º chute**
- Chutes 1 a 9 = **erro**
- Chute 10 = **gol**
- O mesmo jogador pode chutar várias vezes no mesmo lote

---

## 1. Arquivos auditados

| Arquivo | Escopo da verificação |
|---------|------------------------|
| **server-fly.js** | batchConfigs, getOrCreateLoteByValue, winnerIndex, POST /api/games/shoot, lógica do gol, fechamento do lote, INSERT chutes |
| **utils/lote-integrity-validator.js** | batchConfigs, tamanho do lote |
| **goldeouro-player/src/services/gameService.js** | batchConfigs, processShot, availableBets, validação de amount |
| **goldeouro-player/src/pages/GameShoot.jsx** | valor do chute, chamada processShot, ausência de seleção de valor |

---

## 2. Confirmação da regra V1

### 2.1 server-fly.js

| Item | Esperado | Verificado | Local |
|------|----------|------------|--------|
| batchConfigs possui apenas valor 1 | Sim | Sim — único objeto `1: { size: 10, totalValue: 10, ... }` | 376–378 |
| size = 10 | Sim | Sim — `size: 10` | 377 |
| winnerIndex = config.size - 1 | Sim | Sim — `winnerIndex: config.size - 1` (9 para size 10) | 415 |
| POST /api/games/shoot rejeita amount ≠ 1 | Sim | Sim — `if (amount !== 1)` retorna 400 com mensagem "Na V1 apenas R$ 1,00 é aceito." | 1168–1173 |
| getOrCreateLoteByValue exige amount === 1 | Sim | Sim — `config = batchConfigs[1]`, `if (!config \|\| amount !== 1)` throw | 382–384 |

### 2.2 utils/lote-integrity-validator.js

| Item | Esperado | Verificado | Local |
|------|----------|------------|--------|
| Apenas configuração para valor 1 | Sim | Sim — `this.batchConfigs = { 1: { tamanho: 10, multiplicador: 10 } }` | 8–10 |
| Tamanho do lote = 10 | Sim | Sim — `tamanho: 10` | 9 |

### 2.3 Frontend — gameService.js

| Item | Esperado | Verificado | Local |
|------|----------|------------|--------|
| batchConfigs apenas 1 com size 10 | Sim | Sim — único `1: { size: 10, totalValue: 10, ... }` | 13–15 |
| processShot valida amount === 1 | Sim | Sim — `if (amount !== 1)` throw | 76–78 |
| processShot envia amount ao backend | Sim | Sim — body `{ direction, amount }`; chamador passa 1 | 85–88 |
| availableBets = [1] | Sim | Sim — `availableBets: [1]` em getGameInfo() | 263 |

### 2.4 Frontend — GameShoot.jsx

| Item | Esperado | Verificado | Local |
|------|----------|------------|--------|
| processShot sempre com amount = 1 | Sim | Sim — `gameService.processShot(dir, BET_AMOUNT_V1)` com `BET_AMOUNT_V1 = 1` | 75, 179 |
| Não existe seleção de valor | Sim | Sim — bloco "Valor do Chute" exibe apenas "R$ 1,00" e texto fixo; sem botões 2, 5, 10 | 350–356 |
| currentBet fixo | Sim | Sim — `const currentBet = 1` (constante) | 23 |

### 2.5 Lógica do gol

| Item | Esperado | Verificado | Local |
|------|----------|------------|--------|
| shotIndex === winnerIndex | Sim | Sim — `shotIndex = lote.chutes.length`, `isGoal = shotIndex === lote.winnerIndex` | 1232–1234 |
| winnerIndex = 9 (10º chute) | Sim | Sim — `winnerIndex: config.size - 1` com config.size = 10 → 9 | 415 |
| Chutes 1–9 = miss, chute 10 = goal | Sim | Sim — shotIndex 0..8 → miss; shotIndex 9 → goal | 1232–1235 |

### 2.6 Fechamento do lote

| Item | Esperado | Verificado | Local |
|------|----------|------------|--------|
| Lote fecha quando shotIndex == 9 (gol) | Sim | Sim — quando isGoal, `lote.status = 'completed'`, `lote.ativo = false` | 1251–1254 |
| Lote também fecha por tamanho (backup) | Sim | Sim — `if (lote.chutes.length >= lote.config.size && lote.status !== 'completed')` marca completed | 1317–1321 |

Com winnerIndex = 9, o 10º chute (shotIndex 9) é sempre gol; o lote fecha nesse momento. O fechamento por tamanho só ocorreria se não houvesse gol até 10 chutes — o que não acontece na V1.

### 2.7 Registro do chute (INSERT chutes)

| Coluna | Esperado | Verificado | Local |
|--------|----------|------------|--------|
| usuario_id | Sim | Sim — `usuario_id: req.user.userId` | 1309 |
| valor_aposta | Sim | Sim — `valor_aposta: amount` (sempre 1) | 1302 |
| resultado | Sim | Sim — `resultado: result` ('goal' ou 'miss') | 1303 |
| premio | Sim | Sim — `premio: premio` | 1304 |
| premio_gol_de_ouro | Sim | Sim — `premio_gol_de_ouro: premioGolDeOuro` | 1305 |

Insert também inclui: lote_id, direcao, is_gol_de_ouro, contador_global, shot_index (1297–1309).

---

## 3. Possíveis resíduos de lógica antiga

Referências a amount 2, 5, 10 ou a batchConfigs com entradas 2, 5, 10 encontradas no projeto (fora da engine em uso):

### 3.1 Arquivo com batchConfigs 2, 5, 10 (lógica antiga)

| Arquivo | Linhas | Observação |
|---------|--------|------------|
| **server-fly-deploy.js** | 188–193 | Define `batchConfigs` com 1, 2, 5 e 10 (size 10, 5, 2, 1). Arquivo alternativo de deploy; **não** é o entrypoint em produção (server-fly.js). Se este arquivo for executado em algum ambiente, a engine seria a antiga. |

### 3.2 Testes que usam amount 5 ou 10 (chute ou PIX)

| Arquivo | Linhas | Observação |
|---------|--------|------------|
| **tests/automated-tests.js** | 235, 240, 274, 508 | amount: 10 em requisições; testes falharão com backend V1 (400) a menos que alterados para amount: 1. |
| **tests/production-tests.js** | 199 | amount: 10 | 
| **tests/endpoints-criticos.test.js** | 199, 219 | .send({ amount: 10.00 }) |
| **test-servidor-real-avancado.js** | 188, 232, 279 | amount: 10.00, 5.00 |
| **test-config-real.js** | 134 | amount: 10.00 |
| **goldeouro-player/cypress/e2e/game.cy.js** | 46–47, 66, 78, 92, 112 | Preenche `bet-amount` com '10'; a tela V1 não tem mais esse campo editável — testes E2E do jogo podem quebrar. |

### 3.3 Outros arquivos

- Demais ocorrências de "amount: 2", "5", "10" ou "amount" em outros arquivos referem-se a: depósito PIX, saque, transações, seeds, config (maxPlayers, etc.), estilos (margin, padding) ou testes de outros fluxos. **Não** fazem parte da engine de chute/lote e não conflitam com a regra V1.

---

## 4. Conclusão técnica

- **Engine em produção (server-fly.js):** Está alinhada à regra oficial V1: apenas amount = 1, lote de 10 chutes, arrecadação R$ 10, gol no 10º chute (winnerIndex = 9), rejeição explícita de amount ≠ 1.
- **Validador (utils/lote-integrity-validator.js):** Configuração apenas para valor 1 e tamanho 10; compatível com a engine.
- **Frontend (gameService.js + GameShoot.jsx):** Envia sempre amount = 1, sem seleção de valor na tela do jogo; exibe "Valor do Chute: R$ 1,00".
- **Registro em banco:** INSERT em `chutes` contém usuario_id, valor_aposta, resultado, premio, premio_gol_de_ouro e demais campos esperados.

**Resíduos:**

- **server-fly-deploy.js:** Mantém batchConfigs antigo (2, 5, 10). Só impacta se for usado como entrypoint em algum deploy; recomenda-se alinhar ao server-fly.js ou descontinuar.
- **Testes automatizados e E2E:** Vários usam amount 10 (ou 5) ou o campo de valor do chute; tendem a falhar contra o backend V1 até serem atualizados para amount = 1 e para a UI sem seleção de valor.

**Conclusão final:** A engine do jogo utilizada em **server-fly.js** e exposta em POST `/api/games/shoot` está **totalmente alinhada** à regra oficial da V1 após o patch. O frontend de jogo (GameShoot + gameService) também está alinhado. Resíduos restantes estão em arquivo alternativo de deploy (server-fly-deploy.js) e em testes, sem impacto na engine em produção quando o entrypoint for server-fly.js.

---

*Auditoria realizada em modo READ-ONLY. Nenhum arquivo foi alterado.*
