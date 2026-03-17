# AUDITORIA PROFUNDA — ENGINE DE LOTES

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Estritamente READ-ONLY — auditoria, análise, rastreamento e documentação. Nenhuma alteração de código, banco, lógica, rotas ou infraestrutura.

---

## 1. Resumo executivo

A auditoria técnica profunda da **Engine de Lotes** do Gol de Ouro foi conduzida por inspeção de código (server-fly.js, utils/lote-integrity-validator.js), esquemas SQL (schema-supabase-final.sql) e documentação de relatórios anteriores. A lógica matemática (tamanho do lote, sorteio do vencedor, prêmio fixo R$ 5 e Gol de Ouro R$ 100) está correta e previsível. A aleatoriedade do resultado usa `crypto.randomInt`, adequada para uso em produção. A consistência financeira depende criticamente do **trigger** `update_user_stats` na tabela `chutes`: sem ele, perdedores não têm o saldo debitado. O vencedor é ajustado explicitamente no backend (saldo = saldo - aposta + prêmio), sobrescrevendo o efeito do trigger e evitando duplo crédito. Foram identificados riscos de **integridade operacional** (falha no INSERT sem rollback, dependência do trigger em produção, lotes apenas em memória) e **escalabilidade horizontal** (múltiplas instâncias = múltiplos lotes por valor), sem evidência de vetores de fraude ou exploração que permitam ganho indevido ou geração de dinheiro infinito. **Classificação final: SEGURO COM RESSALVAS.**

---

## 2. Arquitetura da engine de lotes

### 2.1 Componentes

| Componente | Arquivo | Função |
|------------|---------|--------|
| Estado em memória | server-fly.js | `lotesAtivos` (Map global): chave = loteId, valor = objeto lote com id, valor, ativo, chutes[], winnerIndex, config, totalArrecadado, premioTotal |
| Configuração | server-fly.js | `batchConfigs`: 1→size 10, 2→5, 5→2, 10→1; totalValue 10 por lote; winChance descritiva |
| Criação/reuso | server-fly.js | `getOrCreateLoteByValue(amount)`: reutiliza lote ativo do mesmo valor com vagas; senão cria lote com `winnerIndex = crypto.randomInt(0, config.size)` |
| Entrada única | server-fly.js | POST `/api/games/shoot` (authenticateToken): body `direction`, `amount` |
| Validação | utils/lote-integrity-validator.js | `LoteIntegrityValidator`: validateBeforeShot, validateAfterShot; estrutura do lote, tamanho, winnerIndex, direções TL/TR/C/BL/BR nos chutes |
| Persistência | server-fly.js + Supabase | INSERT em `chutes` (usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index) |
| Saldo | server-fly.js + trigger | Vencedor: UPDATE explícito `saldo = user.saldo - amount + premio + premioGolDeOuro`. Perdedor: trigger `update_user_stats` em INSERT em chutes (saldo -= valor_aposta) |

### 2.2 Fluxo de dados

- Lotes **não são persistidos**: apenas em `lotesAtivos` (Map). Reinício do processo limpa lotes; novos chutes criam novos lotes.
- Histórico de chutes fica na tabela `chutes`; métricas globais em `metricas_globais` (contador, ultimo_gol_de_ouro), atualizadas por trigger no INSERT em chutes.
- Não existem rotas GET `/api/games/join-lote` nem GET `/api/games/status`; o jogo é stateless do ponto de vista do cliente.

---

## 3. Fluxo completo do jogo

1. Cliente autenticado envia POST `/api/games/shoot` com `{ direction, amount }`.
2. Backend valida presença de direction e amount; valida `batchConfigs[amount]` (1, 2, 5 ou 10); exige Supabase conectado.
3. Busca saldo do usuário; se `saldo < amount` → 400 "Saldo insuficiente".
4. `lote = getOrCreateLoteByValue(amount)` (reuso ou novo lote com winnerIndex sorteado por `crypto.randomInt(0, config.size)`).
5. `validateBeforeShot(lote, { direction, amount, userId })`: integridade do lote, lote ainda aceita chutes, direction/amount/userId presentes.
6. `contadorChutesGlobal++`; `isGolDeOuro = (contadorChutesGlobal % 1000 === 0)`; `saveGlobalCounter()`.
7. `shotIndex = lote.chutes.length`; `isGoal = (shotIndex === lote.winnerIndex)`; `result = isGoal ? 'goal' : 'miss'`.
8. Se goal: premio = 5.00; se Gol de Ouro: premioGolDeOuro = 100.00; lote.status = 'completed', lote.ativo = false.
9. Chute adicionado ao lote (push em lote.chutes); totalArrecadado e premioTotal atualizados.
10. `validateAfterShot`: confere se result corresponde a (índice do último chute === winnerIndex).
11. INSERT em `chutes` (dispara triggers: update_global_metrics, update_user_stats).
12. Se lote cheio sem gol: marca completed/ativo = false.
13. Se isGoal: UPDATE usuarios SET saldo = user.saldo - amount + premio + premioGolDeOuro WHERE id = userId.
14. Resposta 200 com shootResult (loteId, result, premio, premioGolDeOuro, loteProgress, novoSaldo se goal).

---

## 4. Lógica matemática identificada

### 4.1 Tamanho e probabilidade por valor

| Valor (R$) | size | Total arrecadado por lote | Chance teórica de gol |
|------------|------|----------------------------|------------------------|
| 1 | 10 | R$ 10 | 1/10 = 10% |
| 2 | 5 | R$ 10 | 1/5 = 20% |
| 5 | 2 | R$ 10 | 1/2 = 50% |
| 10 | 1 | R$ 10 | 1/1 = 100% |

- **winnerIndex** é sorteado uma vez por lote em `[0, config.size)` com `crypto.randomInt(0, config.size)`, garantindo distribuição uniforme e aleatoriedade criptográfica.
- **Gol:** exatamente um gol por lote, na posição `winnerIndex`. Fórmula: `isGoal = (lote.chutes.length === lote.winnerIndex)` no momento do chute.

### 4.2 Prêmios

- Prêmio normal (qualquer gol): **R$ 5,00** fixo, independente do valor apostado.
- Gol de Ouro (a cada 1000 chutes globais): **R$ 100,00** adicionais.
- Máximo por chute vencedor: R$ 5 + R$ 100 = R$ 105. Aposta paga pelo vencedor: 1 a 10 reais. Lucro máximo por chute: 105 - 1 = R$ 104 (R$ 1) ou 105 - 10 = R$ 95 (R$ 10).

### 4.3 Economia por lote

- Por lote: entrada = size × valor_aposta = R$ 10; saída = R$ 5 (ou R$ 105 se Gol de Ouro). Casa retém R$ 5 por lote (ou perde R$ 95 no Gol de Ouro). Não há fórmula que permita ao jogador gerar ganho infinito; ganhos são limitados por prêmio fixo e uma aposta por chute.

### 4.4 Consistência matemática do validador

- Validador exige `winnerIndex` em `[0, config.tamanho)`; `chutes.length <= config.tamanho`; após o chute, `result` deve ser `goal` se e só se `lote.chutes.length - 1 === lote.winnerIndex`. Alinhado à lógica do server-fly.

---

## 5. Consistência financeira

### 5.1 Débito da aposta

- **Perdedor (miss):** o backend **não** atualiza saldo. O comentário no código (server-fly.js) indica que o "gatilho do banco subtrai valor_aposta". No **schema-supabase-final.sql**, o trigger `update_user_stats` em `chutes` (AFTER INSERT) faz, para `resultado <> 'goal'`: `UPDATE usuarios SET saldo = saldo - NEW.valor_aposta WHERE id = NEW.usuario_id`.
- **Risco:** Se esse trigger **não** existir no ambiente de produção (Supabase), perdedores **não** terão o saldo debitado — falha crítica para a casa, não para o jogador.

### 5.2 Crédito do prêmio (vencedor)

- **Trigger:** para `resultado = 'goal'`, o trigger faz `saldo = saldo + NEW.premio + NEW.premio_gol_de_ouro` e atualiza `total_ganhos`.
- **Backend:** em seguida executa `UPDATE usuarios SET saldo = user.saldo - amount + premio + premioGolDeOuro` (onde `user.saldo` foi lido **antes** do INSERT). Esse UPDATE **sobrescreve** o saldo; o valor final fica correto (saldo anterior - aposta + prêmio). Não há duplo crédito.

### 5.3 Ordem das operações

- Ordem no código: 1) INSERT em chutes (dispara trigger); 2) se isGoal, UPDATE saldo do vencedor. Não há transação explícita no Node envolvendo INSERT + UPDATE. Se o INSERT falhar, o erro é apenas logado; o lote em memória já foi atualizado e, em caso de gol, o UPDATE do vencedor já pode ter sido enviado — cenário de falha parcial identificado em relatórios anteriores (insert falha → perdedor não debitado pelo trigger; vencedor já ajustado pelo backend).

### 5.4 Impossibilidade de dinheiro infinito

- Cada chute consome uma posição no lote; apenas uma posição é vencedora por lote; prêmio é fixo (5 ou 5+100). Não há caminho no código para creditar prêmio sem aposta correspondente ou para debitar apenas uma vez com múltiplos créditos. Replay da mesma requisição gera **outro** chute (outra posição ou outro lote), não o mesmo gol creditado duas vezes.

---

## 6. Riscos técnicos encontrados

| # | Risco | Gravidade | Descrição |
|---|--------|-----------|-----------|
| 1 | Dependência do trigger para débito do perdedor | **Alta** | Se o trigger `update_user_stats` (ou equivalente) não existir em produção, chutes com resultado 'miss' não debitam saldo. Documentação e schema-supabase-final.sql descrevem o trigger; é essencial confirmar sua existência no Supabase real. |
| 2 | INSERT chutes sem transação com UPDATE saldo | **Média** | INSERT e UPDATE não estão em transação atômica. Se o INSERT falhar após o processamento em memória (e, no caso de gol, após o UPDATE do vencedor), o histórico em chutes fica incompleto e o perdedor pode não ser debitado (trigger não dispara). |
| 3 | Lotes apenas em memória | **Média** | Reinício do processo (deploy, crash) zera `lotesAtivos`. Novos chutes criam novos lotes. Histórico de chutes permanece em `chutes`; não há inconsistência de saldo por causa disso, mas a semântica "um lote contínuo por valor" não é garantida entre restarts. |
| 4 | Múltiplas instâncias (escalabilidade horizontal) | **Média** | Com mais de uma instância (ex.: várias máquinas Fly), cada uma tem seu próprio `lotesAtivos`. Dois chutes no mesmo valor podem ir para lotes diferentes (um por instância). Probabilidade e economia por lote continuam corretas; a expectativa de "uma única fila por valor" não se mantém. |
| 5 | Falha no INSERT apenas logada | **Média** | Em caso de `chuteError`, o código faz `console.error` e segue; não reverte lote em memória nem o UPDATE do vencedor. Pode gerar divergência entre estado em memória, saldo e tabela chutes. |
| 6 | Direção não validada no backend | **Baixa** | O server-fly não valida se `direction` pertence a ['TL','TR','C','BL','BR']; apenas exige presença. O validador verifica direção nos chutes já no lote; o primeiro chute de um lote pode persistir direção inválida. Sem impacto financeiro direto. |

---

## 7. Possíveis explorações

### 7.1 Manipulação do resultado

- **winnerIndex** é definido no servidor com `crypto.randomInt(0, config.size)` no momento da criação do lote. O cliente não envia nem pode alterar winnerIndex. O resultado é derivado apenas de `shotIndex === lote.winnerIndex`. Não foi identificado vetor para forçar gol ou miss via API.

### 7.2 Replay de requisições

- Reenviar o mesmo POST `/api/games/shoot` com o mesmo body gera um **novo** chute (nova posição no mesmo lote ou em outro). Não há idempotency key; o efeito é segunda aposta (segundo débito e segunda chance de ganho), não duplo crédito pelo mesmo gol.

### 7.3 Bypass de validações

- Rotas de shoot exigem `authenticateToken`; saldo é checado antes de obter/criar lote. Validações de integridade (validateBeforeShot, validateAfterShot) impedem lote completo e resultado incoerente. Não foi encontrado bypass que permita chute sem débito ou prêmio indevido.

### 7.4 Race conditions (mono-instância)

- Node é single-threaded; requisições ao mesmo lote são processadas em sequência. Não há condição de corrida dentro do processo que permita dois chutes na mesma posição ou dois créditos para o mesmo gol. Em multi-instância, cada instância tem seu próprio lote; não há compartilhamento de estado que cause duplo crédito.

### 7.5 Conclusão sobre exploração

- Não foi identificado vetor de exploração por API, manipulação de requests ou bypass de validações que permita ganho indevido, fraude ou geração de dinheiro infinito. Riscos são operacionais e de ambiente (trigger, transação, persistência de lotes, multi-instância).

---

## 8. Integridade da engine

### 8.1 Validações em uso

- **Antes do chute:** integridade do lote (estrutura, config, winnerIndex, chutes existentes, consistência); lote ainda aceita chutes (`chutes.length < config.tamanho`); direction, amount e userId presentes.
- **Depois do chute:** resultado do chute deve ser `goal` se e só se o índice do último chute for igual a winnerIndex; caso contrário retorna erro e reverte o push no lote (pop, desconta totalArrecadado e premioTotal).

### 8.2 Dupla execução e múltiplos créditos

- Cada INSERT em chutes dispara o trigger uma vez; o backend faz um único UPDATE de saldo para o vencedor. Não há lógica que credite o mesmo gol mais de uma vez. Falha no INSERT impede o trigger de rodar (perdedor não debitado), mas não gera crédito extra.

### 8.3 Sincronização

- Em uma única instância, a ordem é determinística: obter lote → validar → calcular resultado → atualizar lote em memória → validar pós-chute → INSERT → UPDATE saldo (se goal). Não há concorrência no objeto lote. Em múltiplas instâncias, não há sincronização de `lotesAtivos` entre processos; cada processo mantém lotes independentes.

### 8.4 Fechamento do lote

- Lote é fechado (status completed, ativo false) por: 1) gol (imediatamente após determinar isGoal); 2) preenchimento sem gol (`chutes.length >= config.size`). validateBeforeShot impede novo chute em lote completo. Integridade do fechamento está preservada.

---

## 9. Classificação de segurança

- **Aleatoriedade:** Adequada (`crypto.randomInt`).
- **Regras de negócio:** Um gol por lote; prêmio fixo; débito/crédito bem definidos; sem caminho para lucro infinito.
- **Validações:** Integridade antes/depois do chute; saldo e valor de aposta verificados.
- **Dependência crítica:** Trigger de débito do perdedor deve existir em produção.
- **Atomicidade:** INSERT e UPDATE saldo não estão em transação única; falha parcial possível.
- **Escalabilidade:** Múltiplas instâncias quebram a noção de “um lote por valor” sem, porém, criar injustiça financeira ou vetor de fraude.

**Classificação:** **SEGURO COM RESSALVAS**

- **SEGURO:** Lógica matemática correta, aleatoriedade criptográfica, sem vetor de exploração identificado, sem ganho indevido ou dinheiro infinito.
- **RESSALVAS:** (1) Débito do perdedor depende do trigger em produção; (2) Falha no INSERT sem rollback pode deixar perdedor sem débito; (3) Lotes não persistidos e multi-instância alteram semântica operacional.

---

## 10. Conclusão final

A Engine de Lotes do Gol de Ouro está **bem desenhada** do ponto de vista de regras de jogo, probabilidade e economia: um lote por valor com tamanho fixo, um vencedor por lote, prêmio fixo e sorteio seguro do índice do gol. A consistência financeira do vencedor é garantida pelo backend (UPDATE explícito); a do perdedor depende do trigger no banco. Não foram encontrados bugs que permitam fraude, manipulação do resultado ou geração de dinheiro infinito. Os riscos identificados são de **configuração/ambiente** (existência do trigger em produção), **robustez operacional** (falha no INSERT sem transação, lotes em memória, multi-instância) e **validação de entrada** (direção não restrita no backend). Recomenda-se: (1) confirmar no Supabase de produção a existência do trigger que debita `valor_aposta` em chutes com resultado diferente de 'goal'; (2) considerar transação ou compensação se o INSERT em chutes falhar após atualização de saldo; (3) documentar o comportamento com múltiplas instâncias para o produto.

---

**Nenhuma alteração foi realizada.**  
**Nenhum deploy foi executado.**  
**A auditoria foi conduzida em modo estritamente READ-ONLY.**
