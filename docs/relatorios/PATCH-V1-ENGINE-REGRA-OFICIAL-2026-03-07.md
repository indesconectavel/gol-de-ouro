# Relatório do patch — Engine alinhada à regra oficial V1 (SAFE PATCH)

**Data:** 2026-03-07  
**Modo:** SAFE PATCH (alterações mínimas, sem deploy, rollback simples).  
**Objetivo:** Alinhar a engine do jogo Gol de Ouro à regra oficial da V1.

---

## 1. Arquivos alterados

| Arquivo | Alterações |
|---------|-------------|
| **server-fly.js** | batchConfigs restrito a `1: { size: 10, totalValue: 10, ... }`; validação na rota POST `/api/games/shoot`: `amount !== 1` → 400; `getOrCreateLoteByValue`: uso de `batchConfigs[1]` e checagem `amount !== 1`; criação do lote: `winnerIndex = config.size - 1` (gol no 10º chute). |
| **utils/lote-integrity-validator.js** | `batchConfigs` restrito a `1: { tamanho: 10, multiplicador: 10 }`. |
| **goldeouro-player/src/services/gameService.js** | `batchConfigs` apenas valor 1; `processShot`: validar `amount !== 1`; `setBetAmount`: aceitar só 1; `isValidBetAmount`: `amount === 1`; `getGameInfo().config.availableBets`: `[1]`. |
| **goldeouro-player/src/pages/GameShoot.jsx** | `currentBet` fixo em 1 (const); removida seleção de valor (botões R$ 1, 2, 5, 10); bloco "Valor do Chute" exibe "R$ 1,00" e texto "Cada lote tem 10 chutes. Gol no 10º chute."; `processShot(dir, BET_AMOUNT_V1)` com `BET_AMOUNT_V1 = 1`; removido `handleBetChange`. |
| **docs/V1-VALIDATION.md** | BLOCO B: status alterado para "EM AJUSTE TÉCNICO"; observações atualizadas com registro do patch (data, arquivos, resumo das mudanças). |

---

## 2. Diff resumido

### server-fly.js

- **batchConfigs:** De 4 entradas (1, 2, 5, 10) para 1 entrada (1 com size 10, totalValue 10). Comentário: "V1: apenas R$ 1,00, 10 chutes por lote, gol no último chute".
- **getOrCreateLoteByValue:** `const config = batchConfigs[1]`; condição `!config || amount !== 1`; mensagem de erro "Use: 1".
- **Criação do lote:** `winnerIndex: config.size - 1` (antes: `crypto.randomInt(0, config.size)`).
- **POST /api/games/shoot:** Substituição de `if (!batchConfigs[amount])` por `if (amount !== 1)` e mensagem "Na V1 apenas R$ 1,00 é aceito."

### utils/lote-integrity-validator.js

- **batchConfigs:** De 4 entradas para 1 entrada `1: { tamanho: 10, multiplicador: 10 }`. Comentário: "V1: apenas R$ 1,00 — 10 chutes por lote, gol no último".

### goldeouro-player/src/services/gameService.js

- **batchConfigs:** Apenas `1: { size: 10, totalValue: 10, description: "10 chutes, gol no 10º" }`.
- **processShot:** `if (amount !== 1)` com mensagem "Na V1 apenas R$ 1,00."
- **setBetAmount:** `if (amount === 1)` e `this.currentBet = 1`.
- **isValidBetAmount:** `return amount === 1`.
- **getGameInfo:** `availableBets: [1]`.

### goldeouro-player/src/pages/GameShoot.jsx

- **Estado:** `const currentBet = 1` (constante no lugar de estado).
- **Constante:** `const BET_AMOUNT_V1 = 1` (substitui `betValues`).
- **handleShoot:** `gameService.processShot(dir, BET_AMOUNT_V1)`.
- **handleBetChange:** Removido (comentário "V1: sem seleção de valor").
- **UI "Valor da Aposta":** Substituída por bloco único "Valor do Chute" com "R$ 1,00" e texto explicativo do lote/gol no 10º.

### docs/V1-VALIDATION.md

- **Status BLOCO B:** "PENDENTE (regra oficial...)" → "EM AJUSTE TÉCNICO (patch V1 aplicado em 2026-03-07)".
- **Observações:** Adicionada linha descrevendo o patch (data, objetivo, arquivos alterados).

---

## 3. Impacto do patch

| Área | Impacto |
|------|--------|
| **Backend** | Qualquer requisição POST `/api/games/shoot` com `amount` diferente de 1 retorna 400. Clientes que enviavam 2, 5 ou 10 passam a receber erro até enviarem amount = 1. |
| **Lotes** | Novos lotes são sempre de valor 1, size 10, com gol fixo no 10º chute (winnerIndex = 9). Lotes já em memória com valor 2, 5 ou 10 deixam de ser criados; lotes antigos com valor 1 continuam compatíveis. |
| **Frontend /game** | Tela de jogo (GameShoot) não permite mais escolher valor; exibe "Valor do Chute: R$ 1,00" e envia sempre amount = 1. Layout preservado com texto fixo. |
| **Validador** | Só valida lotes com `lote.valor === 1` e tamanho 10; lotes com valor 2, 5, 10 não têm mais config no validador (não serão criados pelo backend). |
| **Rollback** | Reverter os 5 arquivos para a versão anterior (git revert ou restauração dos trechos alterados) restaura comportamento anterior; nenhuma migração de banco foi feita. |

---

## 4. Riscos remanescentes

| Risco | Mitigação / observação |
|-------|-------------------------|
| **Clientes legados** | Qualquer cliente (app, script, Postman) que envie amount 2, 5 ou 10 passará a receber 400. Recomendável comunicar que apenas R$ 1,00 é aceito na V1. |
| **Trigger de saldo** | O débito do perdedor continua dependendo do trigger na tabela `chutes` (update_user_stats). Se o trigger não existir em produção, o saldo do perdedor não é debitado. Confirmar conforme relatório CONFIRMACAO-TRIGGER-CHUTES-SALDO-READONLY-2026-03-07. |
| **Testes automatizados** | Testes que enviam amount 2, 5 ou 10 ou que esperam múltiplos valores de aposta devem ser atualizados para amount = 1. |
| **E2E / Cypress** | Testes em goldeouro-player que usam seletor de valor (ex.: `data-testid="bet-amount"`) podem quebrar se dependiam de múltiplos botões; a tela agora exibe apenas "R$ 1,00" fixo. |

---

## 5. Conclusão

- **Arquivos alterados:** 5 (server-fly.js, utils/lote-integrity-validator.js, goldeouro-player/src/services/gameService.js, goldeouro-player/src/pages/GameShoot.jsx, docs/V1-VALIDATION.md).
- **Comportamento:** Engine aceita apenas amount = 1; cada lote tem 10 chutes; gol sempre no 10º chute; frontend envia sempre 1 e exibe "Valor do Chute: R$ 1,00".
- **Rollback:** Simples (reversão dos arquivos).
- **Deploy:** Não realizado; patch aplicado apenas no repositório.

Patch SAFE PATCH concluído. BLOCO B registrado como "EM AJUSTE TÉCNICO" em docs/V1-VALIDATION.md.
