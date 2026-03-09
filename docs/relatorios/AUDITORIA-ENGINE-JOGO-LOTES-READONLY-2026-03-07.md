# Auditoria completa da Engine do jogo (LOTES) — READ-ONLY

**Data:** 2026-03-07  
**Modo:** Somente leitura — nenhum arquivo alterado.  
**Escopo:** Engine do jogo Gol de Ouro baseada em **LOTES** (não usa fila de jogadores).  
**Fonte:** server-fly.js, utils/lote-integrity-validator.js, tabela chutes e schemas SQL.

---

## 1. Arquivos da engine identificados

| Arquivo | Função |
|---------|--------|
| **server-fly.js** | Único entrypoint em produção (Fly). Contém: `batchConfigs`, `lotesAtivos` (Map), `getOrCreateLoteByValue`, rota POST `/api/games/shoot`, ajuste de saldo do vencedor, insert em `chutes`. |
| **utils/lote-integrity-validator.js** | Validação de integridade do lote: estrutura, config, winnerIndex, chutes, consistência; `validateBeforeShot` e `validateAfterShot`. Usa `batchConfigs` próprio com propriedade `tamanho` (equivalente a `size` do server-fly). |
| **database/schema.sql** | Schema legado (partidas, chutes com partida_id). Não é o schema em uso para a engine de lotes em server-fly. |
| **SCHEMA-SUPABASE-100-REAL-FIXED.sql** / **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql** / **schema-supabase-final.sql** | Definições de tabela `chutes` com `lote_id`, `valor_aposta`, `resultado`, `premio`, `premio_gol_de_ouro`; trigger `update_user_stats` para débito/crédito de saldo em INSERT em chutes. |

**Observação:** Não existe rota `/api/games/create-lote` em server-fly.js; testes (test-servidor-real-simples.js, test-servidor-real-avancado.js) chamam esse endpoint, que **não está implementado** no servidor de produção. A criação de lote é **implícita** no primeiro chute de um valor (getOrCreateLoteByValue).

---

## 2. Fluxo completo da aposta

1. **Cliente** envia POST `/api/games/shoot` com `direction` e `amount` (1, 2, 5 ou 10), Bearer JWT.
2. **Validação:** `batchConfigs[amount]` existe; saldo do usuário ≥ amount (select em `usuarios`, 400 se insuficiente).
3. **Lote:** `getOrCreateLoteByValue(amount)` retorna lote ativo existente (mesmo valor, ativo, chutes.length < size) ou cria novo e coloca em `lotesAtivos`.
4. **Integridade:** `loteIntegrityValidator.validateBeforeShot(lote, { direction, amount, userId })`; se inválido → 400.
5. **Contador global:** `contadorChutesGlobal++`; Gol de Ouro = (contadorChutesGlobal % 1000 === 0); `saveGlobalCounter()` persiste em `metricas_globais`.
6. **Sorteio:** `shotIndex = lote.chutes.length`; `isGoal = (shotIndex === lote.winnerIndex)`; `result = isGoal ? 'goal' : 'miss'`.
7. **Prêmios:** Se goal → premio = 5.00; se Gol de Ouro → premioGolDeOuro = 100.00; senão 0. Lote é fechado (`status = 'completed'`, `ativo = false`).
8. **Chute em memória:** objeto chute adicionado a `lote.chutes`; `lote.totalArrecadado += amount`; `lote.premioTotal += premio + premioGolDeOuro`.
9. **Pós-chute:** `loteIntegrityValidator.validateAfterShot(lote, { result, premio, premioGolDeOuro, timestamp })`; se inválido → revertido (pop, totalArrecadado e premioTotal corrigidos) e 400.
10. **Persistência:** INSERT em `chutes` (usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index). Erro de insert apenas logado; não reverte o lote em memória.
11. **Fechamento por tamanho:** Se `lote.chutes.length >= lote.config.size` e status !== 'completed', lote marcado completed e ativo = false.
12. **Saldo do vencedor:** Somente se `isGoal`: `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`; UPDATE em `usuarios` com esse saldo. Para **perdedor** não há update explícito no código — depende de **trigger** no banco (ex.: `update_user_stats` em schema-supabase-final.sql que debita `valor_aposta` quando `resultado != 'goal'`).
13. Resposta 200 com `shootResult` (loteId, direction, amount, result, premio, premioGolDeOuro, loteProgress, isLoteComplete, novoSaldo se ganhou).

---

## 3. Fluxo completo do lote

### 3.1 Criação da estrutura de LOTE

- **Onde:** `server-fly.js`, função `getOrCreateLoteByValue(amount)` (linhas 383–428).
- **Quando:** Na primeira aposta de um dado valor (1, 2, 5 ou 10) para o qual não existe lote ativo com vaga, ou quando o lote ativo está cheio.
- **Estrutura criada (em memória):**
  - `id`: `lote_${amount}_${Date.now()}_${randomBytes}`
  - `valor` / `valorAposta`: amount
  - `ativo`: true, `status`: 'active'
  - `config`: objeto de `batchConfigs[amount]` (size, totalValue, winChance, description)
  - `chutes`: []
  - `winnerIndex`: `crypto.randomInt(0, config.size)` — índice do chute vencedor (0 a size-1)
  - `createdAt`, `totalArrecadado`, `premioTotal`
- **Armazenamento:** Apenas em **memória** (`lotesAtivos = new Map()`). Não há tabela `lotes` populada pelo server-fly.js em produção; apenas a tabela **chutes** recebe insert com `lote_id`.

### 3.2 Como jogadores entram em um lote

- **Entrada:** Não há “entrada” separada. O jogador **entra ao dar o chute**: POST `/api/games/shoot` com `amount` (1, 2, 5 ou 10). O backend obtém ou cria o lote para aquele valor e adiciona o chute ao array `lote.chutes`. A posição no lote é `lote.chutes.length` no momento do chute (0-based como índice de array).
- **Múltiplos chutes do mesmo jogador:** Permitido pelo validador (“É permitido o mesmo usuário chutar várias vezes no mesmo lote”). Não há bloqueio por usuário.

### 3.3 Limite de apostas por lote

- **Por valor de aposta (batchConfigs em server-fly.js):**

| amount (R$) | size | totalValue | Descrição   |
|-------------|------|------------|-------------|
| 1           | 10   | 10         | 10 chutes   |
| 2           | 5    | 10         | 5 chutes    |
| 5           | 2    | 10         | 2 chutes    |
| 10          | 1    | 10         | 1 chute     |

- **Limite:** `lote.chutes.length < config.size` para reutilizar lote; quando `chutes.length >= config.size` o lote é marcado completed e não aceita mais chutes (validador retorna "Lote já está completo").

### 3.4 Quando o lote é considerado fechado

- **Imediatamente ao gol:** Se `isGoal` (shotIndex === winnerIndex), `lote.status = 'completed'` e `lote.ativo = false` (linhas 1253–1256). Nenhum novo chute é aceito para esse lote (validateBeforeShot verifica `lote.ativo` e tamanho).
- **Por tamanho:** Se não houve gol mas `lote.chutes.length >= lote.config.size`, o lote também é marcado completed e ativo = false (linhas 1320–1324). Assim, um lote sem gol encerra quando atinge o número máximo de chutes.

### 3.5 Onde ocorre o sorteio do vencedor

- **Momento:** Na **criação do lote**, não no fechamento. Em `getOrCreateLoteByValue`, ao criar um novo lote: `winnerIndex = crypto.randomInt(0, config.size)` (linha 418). Esse índice define qual **posição** (0-based) no array de chutes será o gol.
- **Determinação do resultado:** No momento do chute, `shotIndex = lote.chutes.length` (posição que este chute ocupará); `isGoal = (shotIndex === lote.winnerIndex)`. Ou seja, o “sorteio” já ocorreu ao criar o lote; o resultado do chute é apenas verificação determinística da posição.

### 3.6 Algoritmo de seleção do chute vencedor

- **Fórmula:** Vencedor = o chute cujo **índice de ordem** no lote é igual a `winnerIndex` (número fixo entre 0 e size-1, sorteado na criação do lote com `crypto.randomInt(0, config.size)`).
- **Um único vencedor por lote:** Só existe um `winnerIndex`; assim que um chute ocupa essa posição, o lote fecha e não há mais chutes. Impossível ter dois gols no mesmo lote.
- **Aleatoriedade:** `crypto.randomInt` (CSPRNG); não usa Math.random().

---

## 4. Registro das tentativas de chute

- **Memória:** Cada chute é um objeto em `lote.chutes` com id, userId, direction, amount, result, premio, premioGolDeOuro, isGolDeOuro, shotIndex, timestamp.
- **Banco:** INSERT na tabela **chutes** com: usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index (server-fly.js linhas 1298–1315). Se o insert falhar, o erro é apenas logado; o lote em memória e o saldo do vencedor já foram atualizados — risco de inconsistência se a tabela chutes falhar.

---

## 5. Integridade do cálculo financeiro do lote

### 5.1 Valores no código

- **totalArrecadado:** incrementado a cada chute por `amount` (valor da aposta). Corresponde à soma das apostas do lote.
- **premioTotal:** incrementado por `premio + premioGolDeOuro` (5 ou 5+100 quando gol de ouro). Para um lote com um único gol, premioTotal = 5 ou 105.
- **Config:** Para todos os valores (1, 2, 5, 10), `totalValue = 10` (arrecadação máxima do lote quando cheio: R$ 10). Prêmio normal = R$ 5; Gol de Ouro = R$ 100.

### 5.2 Validação matemática

- **Valor total arrecadado:** `lote.totalArrecadado = Σ amount` dos chutes. Máximo por lote = size × amount = 10×1 = 10, 5×2 = 10, 2×5 = 10, 1×10 = 10 → sempre R$ 10 quando o lote enche.
- **Valor pago ao vencedor:** premio (R$ 5) + premioGolDeOuro (R$ 0 ou R$ 100). No máximo R$ 105 por lote (um gol de ouro).
- **Valor retido pela plataforma:** Não calculado explicitamente; implicitamente `totalArrecadado - premioTotal`. Ex.: lote R$ 10 com 1 chute e gol → arrecadado 10, pago 5 (ou 105 se gol de ouro) → plataforma fica com 5 (ou -95 se gol de ouro; nesse caso a plataforma subsidia). O Gol de Ouro é um evento raro (a cada 1000 chutes) e não está “coberto” pela arrecadação do lote.

### 5.3 Consistência de saldo

- **Antes da aposta:** Saldo lido de `usuarios` (select por id); verificação `user.saldo >= amount`.
- **Após aposta (perdedor):** O código **não** atualiza saldo no backend para miss. O comentário no server-fly indica que “gatilho do banco subtrai valor_aposta”. Se o trigger `update_user_stats` (ou equivalente) existir no Supabase e debitar `saldo - valor_aposta` quando resultado ≠ 'goal', o saldo fica consistente. **Se o trigger não existir, o perdedor não perde o valor da aposta** — falha crítica.
- **Após vitória:** `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`; UPDATE em usuarios. O `user.saldo` usado é o lido **antes** do insert em chutes. Se existir trigger que credita premio no INSERT, o saldo seria primeiro aumentado pelo trigger e depois sobrescrito por esse UPDATE, resultando no valor correto (inicial - aposta + prêmio). Portanto a consistência do vencedor depende deste update explícito; o trigger pode ou não existir para o gol.

---

## 6. Registro no banco e relação com usuarios

- **Tabela de lotes:** O server-fly.js **não** insere em nenhuma tabela `lotes`. Lotes existem apenas em memória (Map). Em alguns schemas do repositório existe tabela `lotes` (ex.: schema-supabase-corrigido.sql, SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql); em produção pode ou não existir e não é preenchida por esta engine.
- **Tabela de apostas:** Não há tabela separada “apostas”. Cada **chute** é a aposta; a tabela usada é **chutes** (usuario_id, lote_id, valor_aposta, resultado, premio, etc.).
- **Tabela chutes:** Usada com insert (usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index). Relacionada a **usuarios** por `usuario_id`.
- **Relação com usuarios:** usuarios.saldo é atualizado (1) pelo trigger no INSERT em chutes (débito no miss, crédito de premio no goal, conforme schema-supabase-final.sql) e (2) explicitamente no server-fly quando há gol: update com `novoSaldoVencedor` (sobrescreve o saldo para o vencedor).

---

## 7. Possíveis falhas identificadas

| Falha | Risco | Observação |
|-------|--------|------------|
| **Duplicidade de aposta** | Aceita por regra | Mesmo usuário pode chutar várias vezes no mesmo lote; não há idempotência por (usuario_id, lote_id). Não é bug, mas aumenta exposição por lote. |
| **Múltiplos vencedores** | Mitigado | Um único winnerIndex por lote; lote fecha no primeiro gol. Impossível dois gols no mesmo lote. |
| **Perda de saldo (perdedor)** | Alto se trigger ausente | Débito do perdedor depende de trigger (ex.: update_user_stats) no INSERT em chutes. Se o ambiente de produção não tiver esse trigger, saldo não é debitado no miss. |
| **Lote não fechado** | Baixo | Lote é fechado por gol ou por atingir config.size; validador impede chute em lote completo. Em restart do processo, lotes em memória são perdidos; novos lotes são criados. Chutes já persistidos em `chutes` permanecem; não há “lote órfão” no banco porque lote não é tabela usada pelo server-fly. |
| **Inconsistência matemática** | Médio | Gol de Ouro (R$ 100) não é coberto pela arrecadação do lote (máx. R$ 10). A plataforma subsidia esse prêmio. Prêmio normal (R$ 5) é menor que a arrecadação por lote cheio (R$ 10), então a margem por lote sem gol de ouro é positiva. |
| **Insert chutes falha** | Médio | Se o INSERT em `chutes` falhar, o código só loga; não reverte o lote em memória nem o update de saldo do vencedor. Pode gerar saldo correto mas histórico de chutes incompleto ou duplicação de lógica se o trigger também depender do insert. |
| **Dois configs (size vs tamanho)** | Baixo | server-fly usa `config.size`; lote-integrity-validator usa `batchConfigs[].tamanho`. Valores são iguais (10, 5, 2, 1); apenas nomenclatura duplicada. |

---

## 8. Validação matemática do jogo (resumo)

- **Arrecadação por lote (cheio):** R$ 10 (1×10, 2×5, 5×2, 10×1).
- **Prêmio normal:** R$ 5 (um ganhador por lote).
- **Prêmio Gol de Ouro:** R$ 100 (evento a cada 1000 chutes, independente do lote).
- **Margem por lote (sem gol de ouro):** 10 - 5 = R$ 5 para a plataforma.
- **Margem com gol de ouro no lote:** 10 - 105 = -R$ 95 (plataforma paga a diferença).
- **Consistência contábil:** Para cada chute: perdedor deve perder `valor_aposta`; vencedor deve ter `-valor_aposta + premio + premio_gol_de_ouro`. Isso é garantido pelo update explícito do vencedor e pelo trigger para o perdedor (se o trigger existir no ambiente).

---

## 9. Riscos encontrados

1. **Débito do perdedor depende de trigger:** Se a tabela `chutes` em produção não tiver o trigger que debita `valor_aposta` no INSERT quando resultado ≠ 'goal', os perdedores não perdem saldo.
2. **Lotes só em memória:** Reinício do processo (deploy, crash) zera `lotesAtivos`. Novos chutes criam novos lotes. Histórico de chutes no banco mantém `lote_id`, mas não há tabela de lotes preenchida pelo app para auditoria de lote completo.
3. **Insert chutes sem transação com saldo:** INSERT em chutes e UPDATE de saldo do vencedor não estão em transação explícita; em falha parcial pode haver inconsistência.
4. **Gol de Ouro não coberto pela arrecadação:** Modelo econômico aceita subsidiar R$ 100 a cada 1000 chutes.

---

## 10. Conclusão final da engine

- **Arquivos:** Engine concentrada em **server-fly.js** (lotes em memória, sorteio, shoot, saldo do vencedor) e **utils/lote-integrity-validator.js** (validação pré e pós chute). Persistência em **chutes**; dependência de trigger para saldo do perdedor.
- **Fluxo:** Aposta = chute; lote obtido ou criado por valor; winnerIndex fixo por lote; um vencedor por lote; lote fecha por gol ou por tamanho; registro em chutes; saldo do vencedor atualizado em código; perdedor depende de trigger.
- **Algoritmo de sorteio:** Determinístico por posição; aleatoriedade apenas na criação do lote (`crypto.randomInt(0, config.size)`).
- **Validação matemática:** Coerente para arrecadação e prêmio normal; Gol de Ouro é subsídio; margem positiva por lote sem gol de ouro.
- **Riscos principais:** (1) Trigger de débito do perdedor obrigatório no banco; (2) lotes não persistidos; (3) falha no INSERT chutes sem rollback de saldo/lote em memória.
- **Conclusão:** A engine de lotes está implementada de forma consistente no código e não usa fila de jogadores. A integridade financeira do perdedor depende criticamente da existência e correção do trigger de saldo no ambiente onde a tabela `chutes` está definida. Recomenda-se confirmar no Supabase se a função/trigger equivalente a `update_user_stats` (débito em miss, crédito em goal) está aplicada na tabela `chutes` de produção.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo foi alterado.*
