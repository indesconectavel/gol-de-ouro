# VALIDAÇÃO FINAL — BLOCO E — GAMEPLAY

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Escopo:** Engine de lotes / gameplay — auditoria matemática, validação prática, auditoria operacional e encerramento técnico do BLOCO E.  
**Modo:** READ-ONLY (nenhuma alteração de código, banco, triggers ou deploy).

---

## 1. Resumo executivo

A varredura completa da **engine do jogo (BLOCO E — GAMEPLAY)** foi conduzida com base nos relatórios oficiais existentes (AUDITORIA-ENGINE-LOTES-READONLY-2026-03-09.md, CIRURGIA-CONTROLADA-ENGINE-LOTES-2026-03-09.md), inspeção do código (server-fly.js, utils/lote-integrity-validator.js) e do schema definitivo (schema-supabase-final.sql). **Diagnóstico geral:** a matemática do jogo está correta; o sorteio usa `crypto.randomInt` sem viés; a persistência é segura com rollback em falha de INSERT; a validação de direção (TL, TR, C, BL, BR) é feita no backend; a API responde de forma consistente. A consistência financeira do perdedor depende do trigger `update_user_stats` em produção. Não foram identificados vetores de fraude ou manipulação. Riscos remanescentes são **arquiteturais** (lotes em memória, múltiplas instâncias, dependência do trigger). **O BLOCO E está oficialmente validado como APROVADO COM RESSALVAS**, com ressalvas limitadas à confirmação do trigger em produção e às limitações arquiteturais documentadas.

---

## 2. Auditoria matemática

### 2.1 Estrutura de lote

Configuração extraída de `server-fly.js` (batchConfigs) e alinhada ao validador `utils/lote-integrity-validator.js`:

| aposta (R$) | tamanho lote | arrecadação (R$) | prêmio (R$) | chance teórica |
|-------------|--------------|-------------------|-------------|----------------|
| 1           | 10           | 10                | 5           | 1/10 = 10%     |
| 2           | 5            | 10                | 5           | 1/5 = 20%      |
| 5           | 2            | 10                | 5           | 1/2 = 50%      |
| 10          | 1            | 10                | 5           | 1/1 = 100%     |

- **Arrecadação:** `arrecadação = valor_aposta × tamanho_lote` → sempre R$ 10 por lote.
- **Prêmio:** implementado como **valor fixo R$ 5,00** por gol (linha 816 de server-fly.js). Equivalência matemática: `prêmio = valor_aposta × tamanho_lote × 0,5 = 10 × 0,5 = 5`.
- **Lucro plataforma:** por lote, entrada R$ 10 e saída R$ 5 (prêmio normal) → **lucro_plataforma = 50%**. Gol de Ouro (a cada 1000 chutes) adiciona R$ 100 ao prêmio; economia por lote permanece bem definida.

### 2.2 Sorteio

- **Mecanismo:** `winnerIndex = crypto.randomInt(0, config.size)` na criação do lote (server-fly.js, linha 401).
- **Confirmado:** uso de `crypto.randomInt` (Node.js), adequado para uso criptográfico; não há `Math.random()` nem manipulação de índice pelo cliente.
- **Um vencedor por lote:** o gol é determinado por `isGoal = (shotIndex === lote.winnerIndex)` com `shotIndex = lote.chutes.length` no momento do chute; exatamente uma posição por lote é vencedora.

### 2.3 Invariantes obrigatórias

| Invariante                         | Verificação no código |
|------------------------------------|------------------------|
| Exatamente 1 gol por lote          | `winnerIndex` único em `[0, config.size)`; `isGoal` apenas quando `shotIndex === winnerIndex`. |
| Máximo 1 prêmio por lote           | Prêmio atribuído somente quando `isGoal`; lote encerrado em seguida (`status = 'completed'`, `ativo = false`). |
| Máximo `tamanho_lote` chutes       | `validateBeforeShot` exige `lote.chutes.length < config.tamanho`; validador e fechamento por tamanho impedem excesso. |
| Lote encerra após completar        | Encerramento por gol ou por `chutes.length >= config.size`; `validateBeforeShot` bloqueia novo chute em lote completo. |

---

## 3. Validação prática

Comportamento esperado do endpoint **POST /api/games/shoot** com base na inspeção do código (server-fly.js, linhas 1119–893). Os testes existentes em `tests/endpoints-criticos.test.js` cobrem parte dos casos; o restante foi validado por rastreamento de fluxo.

### Teste 1 — Direção inválida

- **Envio:** `{ "direction": "XYZ", "amount": 1 }` (com token válido).
- **Esperado:** HTTP **400**; corpo com `success: false` e mensagem contendo **"Direção inválida"** (texto exato no código: *"Direção inválida. Use: TL, TR, C, BL ou BR"*).
- **Estado:** Nenhum lote é obtido nem alterado; validação ocorre antes de `getOrCreateLoteByValue` (linhas 1132–1137). **Confirmado pelo código.**

### Teste 2 — Direção em minúsculas

- **Envio:** `{ "direction": "tl", "amount": 1 }`.
- **Esperado:** Normalização com `String(direction).trim().toUpperCase()` → **"TL"**; chute processado com direção "TL"; resposta 200 com `data.direction: "TL"`; INSERT em `chutes` com `direcao: "TL"`. **Confirmado pelo código** (linhas 1132, 1182, 1234, 1274).

### Teste 3 — Chute normal

- **Envio:** `{ "direction": "C", "amount": 1 }` (usuário com saldo ≥ 1).
- **Esperado:** HTTP **200**; `success: true`; `data` com `loteId`, `result` ('goal' ou 'miss'), `premio`, `loteProgress`, etc.; INSERT em `chutes` executado; lote em memória atualizado (`chutes.push`, `totalArrecadado`, `premioTotal`). **Fluxo implementado e coberto pelos testes de integração existentes.**

### Teste 4 — Completar lote

- **Envio:** Sequência de chutes válidos até preencher o lote (ex.: 10 chutes para valor 1, ou 2 para valor 5).
- **Esperado:** Ao último chute que preenche o lote: lote encerrado (`status === 'completed'`, `ativo === false`); exatamente **1 gol** no lote (na posição `winnerIndex`); prêmio registrado para o vencedor (R$ 5 ou R$ 5 + R$ 100 se Gol de Ouro). **Confirmado:** encerramento por tamanho (linhas 877–882) e por gol (linhas 832–834); validador garante um único vencedor por lote.

### Teste 5 — Simulação de falha de persistência

- **Cenário:** Falha no INSERT em `chutes` (ex.: banco indisponível ou constraint violation).
- **Esperado:** Em `chuteError` (linhas 855–871): **rollback** do lote em memória (`lote.chutes.pop()`, `totalArrecadado -= amount`, `premioTotal -= (premio + premioGolDeOuro)`); se era gol, reabertura do lote (`lote.status = 'active'`, `lote.ativo = true`); retorno HTTP **500** com `message: "Falha ao registrar chute. Tente novamente."`; **nenhum** UPDATE de saldo do vencedor (bloco `if (isGoal)` de saldo só roda após INSERT com sucesso); nenhum chute persistido. **Confirmado pelo código.** (Não foi executada injeção de falha real no banco por restrição READ-ONLY.)

---

## 4. Auditoria operacional

### 4.1 Consistência entre Map lotesAtivos, tabela chutes e trigger

- **lotesAtivos (Map):** Mantido em server-fly.js; chave `loteId`, valor objeto do lote (id, valor, ativo, chutes[], winnerIndex, config, totalArrecadado, premioTotal). Atualizado antes do INSERT; em caso de erro no INSERT, revertido pelo rollback documentado acima.
- **Tabela chutes:** Cada chute executado com sucesso gera **um** INSERT com (usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index). O backend não persiste o objeto “lote”; apenas os chutes são persistidos.
- **Trigger update_user_stats (schema-supabase-final.sql):** AFTER INSERT em `chutes`; chama `update_user_stats()` que: atualiza `total_apostas`; se `resultado = 'goal'`, atualiza `total_ganhos` e `saldo += premio + premio_gol_de_ouro`; se `resultado <> 'goal'`, atualiza `saldo -= valor_aposta`. O backend, em seguida, para o vencedor faz UPDATE explícito `saldo = user.saldo - amount + premio + premioGolDeOuro`, sobrescrevendo o saldo e evitando duplo crédito. **Persistência e trigger estão alinhados ao fluxo do backend**, desde que o trigger esteja aplicado no Supabase de produção.

### 4.2 Integridade

- **Múltiplos vencedores:** Impedido pela lógica de um único `winnerIndex` por lote e encerramento imediato após o gol.
- **Lotes com mais chutes que o limite:** Impedido por `validateBeforeShot` e pelo fechamento quando `chutes.length >= config.size`.
- **Chutes sem lote:** Não aplicável; o lote é sempre obtido/criado antes do chute e o `lote_id` é enviado no INSERT.
- **Prêmio pago sem chute vencedor:** O crédito ao vencedor ocorre apenas quando `isGoal` e após INSERT bem-sucedido; em falha de INSERT há rollback e 500, sem UPDATE de saldo.

### 4.3 Riscos operacionais reavaliados

- **Lotes em memória:** Reinício do processo zera `lotesAtivos`; novos chutes criam novos lotes. Histórico em `chutes` permanece. **Risco arquitetural**, não bug de regra de jogo.
- **Múltiplas instâncias:** Cada instância tem seu próprio `lotesAtivos`; pode haver mais de um lote “por valor” na prática. Probabilidade e economia por lote continuam corretas. **Risco arquitetural.**
- **Reinício do servidor:** Mesmo que o lote em memória se perca, não há inconsistência de saldo atribuída a essa perda; débito/crédito já foram aplicados via trigger e UPDATE. **Risco operacional documentado.**

---

## 5. Riscos eliminados

- **Direção inválida aceita ou persistida:** Corrigido na cirurgia; backend rejeita com 400 e não altera lote nem persiste.
- **Falha no INSERT com lote evoluído e/ou resposta de sucesso:** Corrigido; rollback em memória e resposta 500; vencedor não é creditado quando o INSERT falha.
- **Dependência do trigger pouco visível:** Documentada no código como pressuposto crítico.

---

## 6. Riscos remanescentes

Apenas riscos **arquiteturais** ou de ambiente:

1. **Trigger `update_user_stats` ausente em produção:** Se o schema-supabase-final.sql (ou equivalente) não tiver sido aplicado no Supabase real, chutes com resultado 'miss' não debitam saldo. Recomendação: confirmar no Supabase a existência de `trigger_update_user_stats` e da função `update_user_stats` na tabela `chutes`.
2. **Lotes apenas em memória:** Sem persistência de lotes; reinício do processo recria lotes. Comportamento esperado na fase atual; documentado como limitação.
3. **Múltiplas instâncias:** Sem sincronização de `lotesAtivos` entre processos; semântica “uma fila por valor” não garantida entre instâncias.
4. **INSERT e UPDATE de saldo não em transação única:** Ordem atual (INSERT → depois UPDATE vencedor) mantida; em falha de INSERT não há UPDATE do vencedor graças ao rollback e retorno 500.

---

## 7. Checklist de validação

Para futuras auditorias do BLOCO E (gameplay / engine de lotes):

- [ ] **Matemática:** batchConfigs com size/totalValue corretos; prêmio fixo R$ 5; Gol de Ouro R$ 100 a cada 1000 chutes.
- [ ] **Sorteio:** Uso de `crypto.randomInt(0, config.size)` na criação do lote; nenhum uso de Math.random para resultado do jogo.
- [ ] **Direção:** VALID_DIRECTIONS = ['TL','TR','C','BL','BR']; validação antes de obter lote; normalização trim + uppercase; 400 em direção inválida.
- [ ] **Persistência:** INSERT em `chutes` com direcao normalizada; em erro, rollback (pop, totalArrecadado, premioTotal, reabertura do lote se gol) e 500.
- [ ] **Saldo:** Vencedor: UPDATE explícito após INSERT; perdedor: dependência do trigger `update_user_stats` documentada e confirmada em produção.
- [ ] **Invariantes:** Um gol por lote; no máximo tamanho_lote chutes; lote encerrado ao completar ou ao gol.
- [ ] **API:** Contrato POST /api/games/shoot inalterado; resposta 200 com data.loteId, result, premio, loteProgress, etc.

---

## 8. Diagnóstico final do BLOCO E

**Classificação:** **APROVADO COM RESSALVAS**

- **APROVADO:** Matemática correta; sorteio justo (crypto.randomInt); persistência com rollback em falha de INSERT; validação de direção; invariantes garantidos; API consistente; sem vetores de fraude identificados.
- **RESSALVAS:** (1) Confirmar em produção a existência do trigger `update_user_stats` na tabela `chutes`. (2) Aceitar as limitações arquiteturais atuais: lotes em memória e possível multi-instância sem fila única por valor.

---

## 9. Conclusão técnica

- A engine do jogo (lotes, sorteio, prêmios, persistência, rollback e fluxo do endpoint /api/games/shoot) foi auditada e validada conforme os critérios definidos.
- Não foram feitas alterações de código, banco, triggers ou deploy; apenas validação e documentação.

**Declaração:**

**BLOCO E — GAMEPLAY**  
**ESTÁ OFICIALMENTE VALIDADO**  
com ressalva de confirmação do trigger `update_user_stats` no ambiente de produção e com as limitações arquiteturais (lotes em memória, multi-instância) documentadas e aceitas para a fase atual.

---

*Nenhuma alteração foi realizada no código, no banco ou em triggers.*  
*Nenhum deploy foi executado.*  
*Auditoria conduzida em modo READ-ONLY.*
