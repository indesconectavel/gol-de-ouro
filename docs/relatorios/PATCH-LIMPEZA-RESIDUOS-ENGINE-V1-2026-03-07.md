# Patch — Limpeza de resíduos da lógica antiga (Engine V1)

**Data:** 2026-03-07  
**Modo:** SAFE PATCH (apenas arquivos residuais; engine principal não alterada).  
**Objetivo:** Alinhar resíduos à regra oficial V1 (valor fixo R$ 1, 10 chutes, gol no 10º).

---

## 1. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| **server-fly-deploy.js** | Comentário no topo: entrypoint ativo é server-fly.js. batchConfigs restrito a `1: { size: 10, ... }`. getOrCreateLoteByValue: config = batchConfigs[1], rejeita amount !== 1. winnerIndex = config.size - 1. POST /api/games/shoot: amount !== 1 → 400 com mensagem V1. |
| **tests/contracts/games.shoot.http** | Body de todos os exemplos: amount 10 → 1, direction "left" → "C". |
| **tests/sistema-testes-automatizados.js** | Body do chute: removido loteId, direction 1 → 'C', amount 5.00 → 1. |
| **test-servidor-real-avancado.js** | Body do chute: removido loteId, direction 1 → 'C', amount 5.00 → 1. |
| **goldeouro-player/cypress/e2e/game.cy.js** | Removida dependência de data-testid="bet-amount". Testes adaptados: "deve exibir valor fixo do chute R$ 1,00 (V1)"; "deve validar valor mínimo" verifica R$ 1,00; "deve validar saldo insuficiente" sem digitar valor; "deve executar chute", "deve exibir resultado", "deve atualizar saldo" sem configurar bet-amount; interceptors ajustados para /api/games/shoot. |
| **docs/V1-VALIDATION.md** | Registrada a limpeza de resíduos e referência a este relatório. |

---

## 2. Resumo do patch

- **server-fly-deploy.js:** Comportamento alinhado à V1 (apenas amount = 1, gol no último chute). Comentário deixa claro que o entrypoint em produção é server-fly.js.
- **Testes:** Contrato e testes que chamam /api/games/shoot passam a usar amount = 1 e direction válida ('C'). Testes de PIX (amount 10 para depósito) não foram alterados.
- **Cypress:** Remoção do uso de seletor de valor da aposta; asserções passam a verificar valor fixo "R$ 1,00" e fluxo de chute sem preencher valor. Interceptors apontam para /api/games/shoot quando aplicável.
- **Documentação:** V1-VALIDATION.md atualizado com a informação de que os resíduos foram limpos e com link para este relatório.

---

## 3. Riscos remanescentes

| Risco | Observação |
|-------|------------|
| **Cypress e rotas /game** | Os testes E2E usam data-testid como "shoot-button", "game-result", "user-balance". Se a página real do jogo (GameShoot) não expuser esses ids, os testes podem falhar até que os componentes recebam os data-testid ou os testes usem outros seletores. |
| **Outros testes** | Scripts como test-config-real.js usam amount 10 para PIX (depósito) — mantido de propósito. Nenhum outro arquivo de teste que chame apenas /api/games/shoot com amount ≠ 1 foi encontrado além dos já corrigidos. |
| **server-fly-deploy.js** | Se for usado em algum ambiente como entrypoint, passará a se comportar como V1. Caso se queira descontinuar o arquivo, recomenda-se remover da lista de scripts de start ou documentar como legado. |

---

*Patch aplicado sem deploy. Rollback: reverter os arquivos listados na seção 1.*
