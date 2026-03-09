# Auditoria da Engine do jogo — Regra oficial V1 (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — nenhum arquivo alterado.  
**Objetivo:** Auditar a engine do Gol de Ouro com base na **regra oficial da V1** e identificar divergências e pontos de ajuste.  
**Referência:** docs/V1-VALIDATION.md (BLOCO B — Engine do jogo).

---

## Regra oficial V1 (referência)

- Todos os chutes custam **R$ 1,00**.
- Não existe seleção de valores de chute.
- Cada lote possui **10 chutes**.
- Cada lote arrecada **R$ 10,00**.
- O gol acontece **obrigatoriamente no último chute do lote** (chute 10).
- Os chutes 1 a 9 devem resultar em **erro** (defesa).
- O chute 10 deve resultar em **gol**.
- Um mesmo jogador pode chutar várias vezes no mesmo lote.

O sistema usa **LOTES** (não fila de jogadores).

---

## 1. Arquivos envolvidos

| Arquivo | Papel na engine |
|---------|------------------|
| **server-fly.js** | Único entrypoint em produção. Contém: `batchConfigs`, `lotesAtivos`, `getOrCreateLoteByValue`, rota POST `/api/games/shoot`, determinação de gol (shotIndex vs winnerIndex), prêmios, insert em `chutes`, update de saldo do vencedor. |
| **utils/lote-integrity-validator.js** | Validação de integridade do lote: `batchConfigs` (1, 2, 5, 10), `validateBeforeShot`, `validateAfterShot`; exige que o resultado do chute seja consistente com `winnerIndex`. |
| **schema-supabase-final.sql** | Trigger `update_user_stats` em `chutes`: débito do perdedor, crédito do vencedor (saldo + total_ganhos). |
| **goldeouro-player/src/services/gameService.js** | Frontend: chama POST `/api/games/shoot` com `direction` e `amount`; pode enviar múltiplos valores se a UI permitir. |
| **goldeouro-player/src/config/api.js** | Constante `GAMES_SHOOT: /api/games/shoot`. |

---

## 2. Lógica atual da engine

### 2.1 Criação e controle dos lotes

- **Onde:** server-fly.js, linhas 370–427.
- **Estrutura:** `lotesAtivos = new Map()` (em memória). Não há tabela `lotes` persistida pelo backend.
- **Função:** `getOrCreateLoteByValue(amount)`:
  - Procura lote ativo com mesmo `amount` e `chutes.length < config.size`.
  - Se não achar, cria novo lote com `id = lote_${amount}_${Date.now()}_${randomBytes}`, `valor`/`valorAposta` = amount, `config = batchConfigs[amount]`, `chutes = []`, **winnerIndex = crypto.randomInt(0, config.size)**.
  - Insere o lote em `lotesAtivos`.

### 2.2 Configuração dos lotes (batchConfigs)

**server-fly.js (linhas 376–381):**

```js
const batchConfigs = {
  1:  { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
  2:  { size: 5,  totalValue: 10, winChance: 0.2, description: "20% chance" },
  5:  { size: 2,  totalValue: 10, winChance: 0.5, description: "50% chance" },
  10: { size: 1,  totalValue: 10, winChance: 1.0, description: "100% chance" }
};
```

- A engine aceita **quatro valores de aposta:** 1, 2, 5 e 10.
- Tamanhos de lote: 10, 5, 2 e 1 respectivamente.
- **winnerIndex** é sorteado na criação: `crypto.randomInt(0, config.size)` → posição do gol é **aleatória** (0 a size-1).

### 2.3 Rota POST /api/games/shoot (linhas 1158–1327)

1. Lê `direction` e `amount` do body.
2. Valida: `batchConfigs[amount]` existe → senão 400 "Valor de aposta inválido. Use: 1, 2, 5 ou 10".
3. Verifica saldo ≥ amount.
4. Obtém ou cria lote: `getOrCreateLoteByValue(amount)`.
5. `validateBeforeShot(lote, { direction, amount, userId })`; se inválido → 400.
6. `shotIndex = lote.chutes.length` (0-based).
7. **isGoal = (shotIndex === lote.winnerIndex)**; result = isGoal ? 'goal' : 'miss'.
8. Se gol: premio = 5.00; se Gol de Ouro (contador global % 1000 === 0): premioGolDeOuro = 100.00; lote.status = 'completed', lote.ativo = false.
9. Adiciona chute ao array; totalArrecadado += amount; premioTotal += premio + premioGolDeOuro.
10. validateAfterShot: exige que result seja igual ao esperado por winnerIndex (goal só na posição winnerIndex).
11. INSERT em `chutes` (usuario_id, lote_id, valor_aposta: amount, resultado, premio, premio_gol_de_ouro, etc.).
12. Se `lote.chutes.length >= lote.config.size` e status !== 'completed', marca lote completed e ativo = false.
13. Se isGoal: UPDATE usuarios SET saldo = user.saldo - amount + premio + premioGolDeOuro.

### 2.4 Fechamento do lote

- **Por gol:** no momento do chute que é gol, lote.status = 'completed' e lote.ativo = false (linhas 1253–1255).
- **Por tamanho:** quando `lote.chutes.length >= lote.config.size` e ainda não completed (linhas 1320–1324). Assim, lotes sem gol fecham ao completar o número de chutes.

### 2.5 Saldo do jogador

- **Perdedor:** o backend **não** debita; comentário (linha 1347): "Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente". Depende do trigger na tabela `chutes`.
- **Vencedor:** backend faz UPDATE explícito: `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro` (linhas 1352–1359).

### 2.6 Validador (lote-integrity-validator.js)

- **batchConfigs:** 1→tamanho 10, 2→5, 5→2, 10→1 (linhas 8–14).
- **validateBeforeShot:** exige lote íntegro, espaço no lote (chutes.length < config.tamanho), direction/amount/userId; **permite** mesmo usuário várias vezes no mesmo lote (comentário linhas 368–369).
- **validateAfterShot:** exige que `shotResult.result` seja igual ao esperado: goal se `lote.chutes.length - 1 === lote.winnerIndex`, senão miss (linhas 398–404). Ou seja, o resultado deve bater com o winnerIndex (aleatório) já definido no lote.

---

## 3. Divergências entre engine atual e regra oficial V1

| Regra oficial V1 | Engine atual | Divergência |
|------------------|--------------|-------------|
| Todos os chutes custam R$ 1,00 | Aceita amount 1, 2, 5 ou 10 | **Valores 2, 5 e 10 não devem ser aceitos.** |
| Não existe seleção de valores | Cliente envia `amount`; backend valida contra batchConfigs[amount] | **Seleção de valor existe na API e no contrato.** |
| Cada lote tem 10 chutes | Lote tem size 10 só para amount=1; para 2/5/10 tem 5, 2 e 1 chutes | **Para V1 só deve existir lote de 10 chutes (valor único R$ 1).** |
| Cada lote arrecada R$ 10,00 | totalArrecadado = Σ amount; para amount=1 e size=10 dá R$ 10 | **Correto apenas quando amount=1 e size=10; outros cenários arrecadam 10 com menos chutes.** |
| Gol obrigatoriamente no último chute (chute 10) | winnerIndex = crypto.randomInt(0, config.size) → gol em posição **aleatória** | **Gol deve ser fixo na última posição (índice 9), não aleatório.** |
| Chutes 1 a 9 = erro | isGoal = (shotIndex === lote.winnerIndex); se winnerIndex ≠ 9, chutes 1–9 podem não ser todos erro | **Só garantido se winnerIndex for sempre 9 (último chute).** |
| Chute 10 = gol | Só é gol se shotIndex === winnerIndex; hoje winnerIndex é aleatório | **Para V1, shotIndex 9 (10º chute) deve sempre ser gol.** |
| Mesmo jogador pode chutar várias vezes no lote | Validador e fluxo permitem | **Alinhado.** |

---

## 4. Pontos exatos que precisam ser alterados

### 4.1 server-fly.js

| Local (aprox.) | Alteração necessária |
|----------------|----------------------|
| **376–381** | Restringir `batchConfigs` à regra V1: um único valor 1 com size 10 (e totalValue 10). Remover entradas 2, 5 e 10 ou ignorá-las na validação e no getOrCreateLoteByValue. |
| **384–386** | Garantir que apenas amount === 1 seja aceito (ex.: if (amount !== 1) throw new Error('Valor de aposta inválido. Use: 1')). |
| **418** | Trocar `winnerIndex: crypto.randomInt(0, config.size)` por **winnerIndex: config.size - 1** (ou 9 fixo) para que o gol seja sempre no último chute do lote. |
| **1170–1176** | Validar que amount === 1; retornar 400 com mensagem clara (ex.: "Valor de aposta inválido. Apenas R$ 1,00 é aceito na V1") se amount !== 1. |
| **1236** | Com winnerIndex fixo em 9, `isGoal = (shotIndex === lote.winnerIndex)` já produzirá gol só no 10º chute; nenhuma mudança de fórmula, apenas garantido pelo winnerIndex fixo. |

### 4.2 utils/lote-integrity-validator.js

| Local (aprox.) | Alteração necessária |
|----------------|----------------------|
| **8–14** | Restringir `batchConfigs` a um único valor 1 com tamanho 10 (e multiplicador 10). Remover 2, 5 e 10. |
| **143–148** | validateLoteConfig: se apenas valor 1 existir, garantir que expectedSize seja sempre 10. |
| **398** | Com winnerIndex fixo em 9, a expressão `lote.chutes.length - 1 === lote.winnerIndex ? 'goal' : 'miss'` já espera gol só na última posição; opcional documentar que V1 exige winnerIndex === 9. |

### 4.3 Frontend (fora do escopo desta auditoria, mas relevante)

- **goldeouro-player:** Garantir que a UI não permita escolher valor de chute (ou envie sempre amount = 1) para alinhar à regra "não existe mais seleção de valores de chute".

### 4.4 Contrato da API

- **POST /api/games/shoot:** O body pode continuar aceitando `amount` por compatibilidade, mas o backend deve rejeitar amount !== 1 com 400. Alternativa: tratar apenas amount = 1 e ignorar outros valores após validação.

---

## 5. Riscos de inconsistência matemática ou financeira

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Arrecadação por lote** | Com amount fixo 1 e size 10, totalArrecadado máximo = 10; alinhado à regra R$ 10 por lote. | Manter totalArrecadado += amount com amount = 1. |
| **Prêmio do vencedor** | Hoje premio = 5.00 (fixo); Gol de Ouro = 100 a cada 1000 chutes. Com um gol por lote e 10 apostas de R$ 1, margem = 10 - 5 = R$ 5 por lote (sem Gol de Ouro). | Nenhuma alteração obrigatória na matemática do prêmio para alinhar à regra V1; apenas garantir que o gol seja no último chute. |
| **Débito do perdedor** | Continua dependendo do trigger em `chutes`; se o trigger não existir em produção, perdedores não perdem saldo. | Confirmar trigger em produção (ver relatório CONFIRMACAO-TRIGGER-CHUTES-SALDO-READONLY-2026-03-07). |
| **Ordem dos chutes** | A regra V1 exige que o 10º chute seja sempre gol. Se winnerIndex for fixo em 9, a ordem dos chutes (quem chutou em cada posição) é a ordem de chegada; o 10º chute (shotIndex 9) é sempre o gol. | Garantir que nenhum código altere winnerIndex após a criação do lote e que não haja "pula posição". |
| **Lote completo sem gol** | Na engine atual, se o lote enche (10 chutes) e nenhum era winnerIndex, o lote fecha sem gol. Na V1 o gol é no último chute, então o lote nunca deve fechar "cheio" sem gol — o 10º chute é sempre gol. | Com winnerIndex = 9, o 10º chute sempre terá shotIndex === 9 === winnerIndex → sempre gol; não haverá lote completo sem gol. |
| **Múltiplos chutes do mesmo jogador** | Já permitido; regra V1 mantida. | Nenhuma alteração. |

---

## 6. Respostas às tarefas da auditoria

1. **Onde a engine cria e controla os lotes**  
   server-fly.js: `lotesAtivos` (Map), `getOrCreateLoteByValue(amount)` (linhas 383–427). Lotes só em memória.

2. **Sorteio aleatório de winnerIndex**  
   Sim. Linha 418: `winnerIndex: crypto.randomInt(0, config.size)`. Divergente da V1 (gol obrigatório no último chute).

3. **Apenas amount = 1 ou outros valores**  
   A engine aceita amount 1, 2, 5 e 10 (batchConfigs e validação nas linhas 1171–1176). Divergente da V1 (apenas R$ 1,00).

4. **Como o lote é fechado**  
   Por gol (status = 'completed', ativo = false no momento do gol) ou por tamanho (chutes.length >= config.size). Para V1, com gol no 10º chute o lote sempre fecha no gol.

5. **Arrecadação fixa R$ 10 por lote**  
   Só garantida quando amount = 1 e size = 10 (totalArrecadado = 10). Para 2/5/10 a arrecadação também é 10 mas com 5/2/1 chutes. V1 exige 10 chutes de R$ 1 = R$ 10.

6. **Gol no último chute ou posição aleatória**  
   Hoje em **posição aleatória** (winnerIndex sorteado). V1 exige **último chute** (posição 9 em 0-based).

7. **Saldo do jogador por chute**  
   Perdedor: debitado pelo trigger (valor_aposta). Vencedor: UPDATE explícito (saldo - amount + premio + premioGolDeOuro).

8. **Como o vencedor recebe o prêmio**  
   No gol, backend calcula novoSaldoVencedor e faz UPDATE em usuarios; trigger também credita premio + premio_gol_de_ouro no INSERT em chutes; o UPDATE da API sobrescreve o saldo ao valor correto.

9. **Pontos a ajustar para V1**  
   Resumidos na seção 4 (server-fly: batchConfigs só 1, validação amount === 1, winnerIndex = 9; validador: batchConfigs só 1; frontend: não permitir seleção de valor).

10. **Riscos**  
    Resumidos na seção 5 (arrecadação, prêmio, trigger do perdedor, ordem dos chutes, lote sem gol).

---

## 7. Conclusão final do BLOCO B

- **Arquivos principais:** server-fly.js (lógica de lotes e chute), utils/lote-integrity-validator.js (validação). Persistência em tabela `chutes`; saldo do perdedor via trigger.
- **Lógica atual:** Múltiplos valores de aposta (1, 2, 5, 10), tamanhos de lote 10/5/2/1, **winnerIndex aleatório**, gol em posição sorteada, fechamento por gol ou por tamanho. Mesmo jogador pode chutar várias vezes no mesmo lote.
- **Divergências em relação à regra oficial V1:**  
  (1) Valores de chute: aceita 1, 2, 5 e 10 — V1 exige só R$ 1,00.  
  (2) Gol: em posição aleatória — V1 exige último chute (10º).  
  (3) Tamanho de lote: 10 só para amount=1 — V1 exige sempre 10 chutes por lote.
- **Ajustes necessários (somente leitura; não executados):**  
  Restringir a um único valor de aposta (1) e tamanho de lote 10; fixar **winnerIndex = 9** (último chute); validar amount === 1 na rota de chute; alinhar validador à mesma regra; opcionalmente esconder seleção de valor no frontend.
- **Riscos:** Dependência do trigger para débito do perdedor; consistência matemática e financeira mantida com winnerIndex fixo e amount fixo 1.

**Status do BLOCO B:** A engine atual **não** está alinhada à regra oficial V1. As alterações indicadas na seção 4 (e a confirmação do trigger em produção) são necessárias para que a engine cumpra a regra oficial da V1.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo foi alterado.*
