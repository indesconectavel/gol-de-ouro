# VALIDAÇÃO FINAL PÓS-PATCH — BLOCO D — SISTEMA DE SALDO

**Data:** 2026-03-07  
**Modo:** READ-ONLY (inspeção do código; nenhuma alteração).  
**Objetivo:** Validar a correção aplicada no Node para débito de saldo em chutes perdidos.

---

## 1. Patch no local correto

**Sim.**

- **Arquivo:** server-fly.js  
- **Rota:** POST /api/games/shoot (handler que começa na linha 1156)  
- **Local do patch:** Após o INSERT em `chutes` (linhas 1329–1343), após a montagem de `shootResult` (1325–1342), dentro do bloco de “Ajuste de saldo” (1344–1375).  
- **Evidência:** Comentário atualizado nas linhas 1344–1346 (“GOAL” e “MISS: em produção não existe trigger… patch Bloco D”); bloco `if (isGoal)` nas 1347–1356; bloco `else` (MISS) nas 1357–1375.

---

## 2. MISS corrigido?

**Sim.**

- No ramo `else` (quando `isGoal === false`):
  - Cálculo: `novoSaldoPerdedor = user.saldo - amount` (linha 1360).
  - UPDATE em `usuarios`: `saldo = novoSaldoPerdedor`, `updated_at = now()` (1361–1366).
  - Condição: `eq('id', req.user.userId)` e `eq('saldo', user.saldo)` (lock otimista).
  - Em sucesso: `shootResult.novoSaldo = novoSaldoPerdedor` (1374).
- Comportamento: em MISS o saldo passa a ser debitado em R$ 1,00 no Node.

---

## 3. GOAL preservado?

**Sim.**

- O bloco `if (isGoal)` (1347–1356) não foi alterado na lógica:
  - `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`.
  - Um único UPDATE em `usuarios` com esse valor.
  - Em caso de erro apenas log; em sucesso `shootResult.novoSaldo = novoSaldoVencedor`.
- Fórmula do vencedor mantida: **saldo_final = saldo_anterior - amount + premio + premioGolDeOuro**.

---

## 4. Lock otimista presente?

**Sim.**

- No UPDATE de MISS (1361–1366):
  - `.eq('id', req.user.userId)`  
  - `.eq('saldo', user.saldo)`  
- Com `.select('saldo').single()` para obter a linha afetada.
- Se `saldoMissError || !saldoPerdedorUpdated`: retorno **409** com mensagem “Saldo foi alterado por outra ação. Tente chutar novamente.” (1367–1372).

---

## 5. Efeitos colaterais

**Nenhum efeito colateral indevido encontrado.**

- **Saque:** O 409 em 1495 e 1544 pertence ao fluxo de saque (já existente: idempotência e saldo). Nenhuma alteração foi feita nesse fluxo.
- **Depósito:** Nenhuma alteração em webhook PIX, reconciliação ou crédito de saldo.
- **Engine:** Nenhuma alteração em `getOrCreateLoteByValue`, `winnerIndex`, INSERT em `chutes`, validações de lote ou cálculo de `isGoal`/`result`.
- **Trigger:** Nenhum trigger foi criado pelo patch (apenas arquivo .js alterado).
- **Migration:** Nenhum arquivo de migration SQL foi criado ou alterado.

---

## 6. Verificações adicionais

| Verificação | Resultado |
|-------------|-----------|
| UPDATE explícito em MISS em usuarios.saldo | Sim (1361–1366) |
| Retorno 409 em conflito de saldo (MISS) | Sim (1369–1372) |
| Fórmula do vencedor preservada | Sim (1348) |
| Sem criação de trigger | Sim |
| Sem criação de migration | Sim |
| Sem alteração em saque/depósito/engine | Sim |

---

## Conclusão

O patch cirúrgico do Bloco D foi aplicado corretamente no handler real de produção (`server-fly.js`, `POST /api/games/shoot`). Em MISS há débito explícito com lock otimista e 409 em conflito; em GOAL a lógica e a fórmula do vencedor foram preservadas; não há trigger, migration nem alteração indevida em outros fluxos.

**Classificação final do Bloco D:** **VALIDADO COM RESSALVAS.**

Ressalvas documentadas na auditoria do Bloco D (depósito e jogo sem ledger, histórico fragmentado, etc.) seguem válidas; a correção do débito em chute perdido está implementada e validada no código.
