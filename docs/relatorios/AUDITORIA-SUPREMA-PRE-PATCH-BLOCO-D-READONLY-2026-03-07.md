# AUDITORIA SUPREMA READ-ONLY — BLOCO D — CORREÇÃO PRÉ-PATCH

**Data:** 2026-03-07  
**Modo:** Somente leitura — inspeção e comprovação; nenhuma alteração de código, banco ou deploy.

---

## 1. Fluxo completo do endpoint de chute

**Rota:** `POST /api/games/shoot`  
**Arquivo:** `server-fly.js`  
**Ordem exata das operações:**

| # | Operação | Arquivo | Linhas aprox. | Detalhe |
|---|----------|---------|----------------|---------|
| 1 | Rota registrada | server-fly.js | 1156 | app.post('/api/games/shoot', authenticateToken, async (req, res) => { |
| 2 | Middleware | (express) | — | authenticateToken (linha 334): extrai JWT, req.user.userId |
| 3 | Validação entrada | server-fly.js | 1160–1173 | direction e amount obrigatórios; amount === 1 (V1) |
| 4 | Verificação DB | server-fly.js | 1175–1181 | dbConnected e supabase |
| 5 | Leitura de saldo | server-fly.js | 1318–1324 | SELECT usuarios.saldo WHERE id = req.user.userId |
| 6 | Validação saldo | server-fly.js | 1326–1331 | user.saldo < amount → 400 Saldo insuficiente |
| 7 | Obter/criar lote | server-fly.js | 1204 | getOrCreateLoteByValue(amount) — lote em memória |
| 8 | Validação pré-chute | server-fly.js | 1207–1219 | loteIntegrityValidator.validateBeforeShot |
| 9 | Contador global | server-fly.js | 1222–1227 | contadorChutesGlobal++; isGolDeOuro; saveGlobalCounter() |
| 10 | Definição goal/miss | server-fly.js | 1229–1234 | shotIndex = lote.chutes.length; isGoal = shotIndex === lote.winnerIndex; result = isGoal ? 'goal' : 'miss' |
| 11 | Prêmios (se goal) | server-fly.js | 1236–1254 | premio = 5; premioGolDeOuro = 100 se isGolDeOuro; lote.status = 'completed' se goal |
| 12 | Chute em memória | server-fly.js | 1256–1274 | lote.chutes.push(chute); totalArrecadado; premioTotal |
| 13 | Validação pós-chute | server-fly.js | 1275–1292 | loteIntegrityValidator.validateAfterShot; em falha pop + return 400 |
| 14 | INSERT em chutes | server-fly.js | 1329–1343 | supabase.from('chutes').insert({ usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, ... }) |
| 15 | Update saldo (apenas GOAL) | server-fly.js | 1345–1359 | if (isGoal) { novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro; update usuarios set saldo } |
| 16 | Resposta | server-fly.js | 1362–1366 | res.status(200).json({ success: true, data: shootResult }) |

Não há transação explícita que una o INSERT em `chutes` e o UPDATE em `usuarios`. Em MISS não há nenhum UPDATE em `usuarios` após o INSERT.

---

## 2. Todos os writes em saldo relacionados a chute

### Em produção (server-fly.js, rota /api/games/shoot)

| Local | Tabela | Campo | Operação | Condição | Linhas |
|-------|--------|-------|----------|----------|--------|
| Ajuste vencedor | usuarios | saldo | UPDATE | isGoal === true | 1350–1358 |

Não há write em `total_apostas` nem `total_ganhos` no endpoint de chute em server-fly.js. Esses campos seriam atualizados apenas por um trigger (que em produção não existe).

### Legado / não usado no entrypoint de produção

| Arquivo | Uso |
|---------|-----|
| controllers/gameController.js | registerShot insere em chutes com outro schema (zona, potencia, angulo); não atualiza usuarios.saldo. Não montado em server-fly.js. |
| server-fly-deploy.js | Outro entrypoint; contém lógica de saldo em PIX/chute em rotas próprias. Não é o entrypoint Fly atual. |
| services/ranking-service.js | Apenas leitura de total_apostas/total_ganhos para ranking. |
| scripts (fechamento-contabil, audit-b2, etc.) | Leitura ou cálculo teórico; não escrevem em usuarios no fluxo de chute. |

Conclusão: no fluxo real de chute (server-fly.js) o único write em saldo é o UPDATE no bloco `if (isGoal)`; para MISS não existe write em saldo em lugar nenhum do código inspecionado.

---

## 3. Existe algum débito de MISS fora do trigger?

**Resposta: NÃO.**

- **Node (server-fly.js):** apenas o ramo `if (isGoal)` altera `usuarios.saldo`; não há ramo para MISS.
- **Controllers:** gameController.registerShot não atualiza saldo e não é usado pelo server-fly.
- **Services / helpers / workers:** nenhum altera saldo em função de chute perdido.
- **SQL / RPC:** no repositório a única lógica que debita em MISS é a função `update_user_stats` em schema-supabase-final.sql; em produção essa função não existe (confirmado).
- **Trigger em outra tabela:** não há trigger em outras tabelas que leia `chutes` e atualize `usuarios.saldo`.
- **Automação indireta:** não encontrada.

Conclusão: não existe débito de MISS em nenhum outro ponto; a única implementação esperada era o trigger ausente em produção.

---

## 4. Dupla escrita potencial no GOAL

- **O que acontece hoje no GOAL:**  
  (1) Saldo lido antes do INSERT: `user.saldo` (linhas 1319–1323).  
  (2) INSERT em `chutes` (1329–1343); em produção nenhum trigger roda, então o saldo no banco não muda nesse momento.  
  (3) Cálculo: `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`.  
  (4) UPDATE `usuarios` SET saldo = novoSaldoVencedor WHERE id = userId (1351–1354).

- **Saldo lido:** o valor usado é o de antes do INSERT (e, em produção, o INSERT não altera saldo), então o valor está correto para o vencedor.

- **Risco de a correção do MISS interferir no GOAL:**  
  Se a correção for só no Node (débito de MISS no mesmo endpoint): não altera o ramo GOAL; continua um único UPDATE por request (GOAL ou MISS).  
  Se no futuro for criado trigger que debita MISS e credita GOAL: aí sim haveria dupla escrita no GOAL (trigger + Node), a menos que o Node deixe de fazer o UPDATE em GOAL ou o trigger seja desenhado para não creditar (apenas débito em MISS).  
  Recomendação: corrigir apenas MISS no Node mantém GOAL como está e evita dupla escrita.

- **Dupla cobrança / dupla premiação:** hoje em GOAL há um único UPDATE com a fórmula correta. Não há dupla cobrança nem dupla premiação no código atual.

---

## 5. Impacto da correção em GOAL e gol de ouro

- **Corrigir MISS no banco (trigger):** em GOAL o trigger (se existir) credita prêmio e o Node sobrescreve com `saldo - aposta + prêmios`. Não altera a fórmula do vencedor. Débito em MISS passaria a ocorrer no banco.

- **Corrigir MISS no Node:** adicionar um bloco `else` (MISS) que faz UPDATE `saldo = user.saldo - amount`. Não altera o bloco GOAL; GOAL continua com o mesmo cálculo. Não afeta gol de ouro (apenas valor de premio/premioGolDeOuro já usado no GOAL).

- **Corrigir nos dois (banco + Node):** para MISS, débito em duplicidade se ambos debitaram. Deve ser um ou outro.

- **Manutenção da fórmula do vencedor:**  
  `saldo_final_vencedor = saldo_anterior - aposta + premio + premio_gol_de_ouro`  
  já é garantida pelo Node em GOAL. A correção de MISS (no Node ou no banco) não muda essa fórmula.

---

## 6. Melhor local da correção

**Recomendação: Opção B — corrigir no Node dentro do endpoint de chute.**

Justificativa:

- **Segurança:** um único lugar (server-fly.js) passa a tratar débito de MISS e GOAL; não depende de migration nem de trigger em produção.
- **Clareza:** a regra “MISS debita R$ 1” fica explícita no mesmo fluxo do INSERT e do ajuste de GOAL.
- **Rollback:** revertendo um deploy (um arquivo) desfaz a correção; não é preciso reverter migration ou trigger.
- **Risco de duplicidade:** não há trigger em produção; não há dupla escrita. Se no futuro for adicionado trigger que debita MISS, será preciso remover o débito de MISS do Node para evitar duplo débito.
- **Validação:** basta testar POST /api/games/shoot com resultado miss e conferir saldo antes/depois; não exige verificação de objeto de banco (trigger/função).
- **Aderência ao fluxo atual:** GOAL já é ajustado no Node; MISS no mesmo endpoint mantém consistência (toda movimentação de saldo por chute no mesmo handler).

Opção A (só trigger) exigiria migration em produção e confirmação de que o trigger está ativo; Opção C (banco + Node) introduziria risco de duplo débito em MISS. Por isso a recomendação é apenas B.

---

## 7. Riscos a avaliar antes do patch

| Risco | Avaliação |
|-------|-----------|
| Débito duplicado | Mitigação: fazer um único UPDATE por request (MISS). Se no futuro houver trigger que debita MISS, remover o débito de MISS do Node. |
| Prêmio incorreto | Nenhuma alteração no cálculo de premio/premioGolDeOuro; apenas débito em MISS. |
| Corrida/concorrência | Atual: não há lock otimista no chute (diferente do saque). Dois MISS simultâneos podem ler o mesmo saldo e ambos fazer UPDATE saldo - 1; um dos débitos pode ser “perdido”. Mitigação recomendada: UPDATE ... WHERE id = userId AND saldo = user.saldo e verificar linhas afetadas; se 0, retornar 409 ou reprocessar. |
| Insert em chutes sem update de saldo | Hoje em MISS já ocorre (insert sem update). O patch corrige passando a fazer o update em MISS. |
| Update de saldo sem insert em chutes | Se o INSERT falhar, o código não entra no bloco de update de saldo (o update de MISS deve ficar após o INSERT e só executar se não houver chuteError crítico). Manter ordem: INSERT primeiro; em seguida, se sucesso (ou ignorando erro apenas de trigger), fazer UPDATE de saldo para MISS. |
| Inconsistência no gol de ouro | Não afetada; gol de ouro só altera valor de prêmio no ramo GOAL. |
| Reentrada mesmo usuário no mesmo lote | Permitida pela engine; cada chute gera um INSERT e um débito (ou um crédito em GOAL). Corrigir MISS não altera esse comportamento. |
| Retries de request | Sem idempotência por chute: retry pode gerar segundo INSERT e segundo débito. Aceitável como risco conhecido; idempotência (ex.: chave por lote+usuário+shotIndex) seria evolução futura. |
| Múltiplas instâncias do app | Mesmo que o saque: concorrência entre instâncias; lock otimista (WHERE saldo = user.saldo) reduz risco de saldo incorreto. |
| Relatórios existentes | Relatórios que leem chutes e usuarios.saldo continuam compatíveis; passamos a debitar MISS como esperado. |

---

## 8. Decisão técnica final pré-patch

- **O que deve ser corrigido:** débito de R$ 1,00 em saldo do usuário quando o chute é perdido (resultado miss).

- **Onde:** no **Node**, no arquivo **server-fly.js**, dentro do handler de `POST /api/games/shoot`, após o INSERT em `chutes` e após o bloco `if (isGoal)`, adicionando um ramo para MISS que atualize `usuarios.saldo` (saldo = saldo - amount). Preferencialmente com lock otimista (WHERE saldo = user.saldo) e verificação de linhas afetadas para evitar race.

- **Por que é a menor correção segura:** (1) Um único arquivo, uma única rota. (2) Não exige migration nem criação de trigger em produção. (3) Comportamento alinhado ao GOAL (ajuste de saldo no mesmo request). (4) Rollback imediato por revert do arquivo. (5) Não introduz dupla escrita enquanto não houver trigger que debite MISS.

- **O que NÃO deve ser alterado:** (1) Lógica de GOAL (cálculo de novoSaldoVencedor e UPDATE). (2) INSERT em chutes (campos e formato). (3) Validações de lote, saldo insuficiente e integridade. (4) Não criar trigger em produção nesta etapa (evitar dupla escrita com o novo débito no Node). (5) Não alterar total_apostas/total_ganhos neste patch (opcional em evolução futura).

---

## Resumo executivo

| Item | Conclusão |
|------|-----------|
| Problema comprovado | Chutes perdidos não debitam saldo: tabela chutes sem trigger, função update_user_stats inexistente, Node só ajusta saldo em GOAL. |
| Débito de MISS fora do trigger? | Não existe em nenhum outro ponto. |
| GOAL hoje | Saldo lido antes do INSERT; após INSERT (sem trigger) um único UPDATE com saldo_anterior - 1 + premio + premioGolDeOuro. |
| Melhor local da correção | Node (server-fly.js), no handler de /api/games/shoot. |
| Menor patch seguro | Adicionar bloco else (MISS) com UPDATE usuarios SET saldo = user.saldo - amount WHERE id = userId (e, se possível, WHERE saldo = user.saldo para lock otimista). |
| Riscos principais | Concorrência (mitigar com lock otimista); retries sem idempotência (risco aceito nesta etapa). |
| Conclusão técnica | Corrigir apenas no Node, em server-fly.js; não alterar GOAL nem criar trigger nesta etapa. |
