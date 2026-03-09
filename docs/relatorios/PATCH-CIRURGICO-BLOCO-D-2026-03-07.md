# PATCH CIRÚRGICO — BLOCO D — DÉBITO DE CHUTE PERDIDO NO NODE

**Data:** 2026-03-07  
**Arquivo alterado:** server-fly.js  
**Rota:** POST /api/games/shoot  

---

## Objetivo

Corrigir o risco crítico comprovado: em produção, chutes perdidos (MISS) não debitavam saldo. A correção foi feita exclusivamente no Node, no handler real de produção, sem trigger e sem migration.

---

## Alteração aplicada

**Local:** server-fly.js, handler de `POST /api/games/shoot`, após o INSERT em `chutes` e após o bloco `if (isGoal)`.

**Antes:**  
- GOAL: UPDATE em `usuarios.saldo` com `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`.  
- MISS: nenhum UPDATE; saldo permanecia inalterado.

**Depois:**  
- GOAL: inalterado (mesmo cálculo e mesmo UPDATE).  
- MISS: bloco `else` adicionado:
  - `novoSaldoPerdedor = user.saldo - amount`
  - UPDATE `usuarios` SET `saldo = novoSaldoPerdedor`, `updated_at = now()` WHERE `id = req.user.userId` AND `saldo = user.saldo`
  - `.select('saldo').single()` para obter confirmação de linha afetada
  - Se `data` nulo ou `error`: retorno 409 com mensagem "Saldo foi alterado por outra ação. Tente chutar novamente."
  - Caso contrário: `shootResult.novoSaldo = novoSaldoPerdedor` e fluxo normal.

---

## Comentário no código

- Comentário atualizado no “Ajuste de saldo”: explicando que em GOAL há um único update no Node e que em MISS, por não existir trigger em produção, o débito é feito explicitamente no Node (patch Bloco D).
- No bloco MISS: comentário “MISS: débito com lock otimista (produção sem trigger de débito em chutes)”.

---

## Comportamento esperado após o patch

| Resultado | Fórmula do saldo final |
|-----------|-------------------------|
| MISS | saldo_final = saldo_anterior - 1 |
| GOAL | saldo_final = saldo_anterior - 1 + premio + premioGolDeOuro |

Sem trigger, sem migration, sem dupla escrita.

---

## Lock otimista

- Condição `WHERE saldo = user.saldo` garante que o UPDATE só afeta se o saldo não tiver sido alterado por outra operação.
- Se nenhuma linha for afetada (concorrência ou saldo já alterado): 409 para o cliente tentar novamente.

---

## O que não foi alterado

- INSERT em `chutes`
- Lógica de GOAL (cálculo e UPDATE)
- Cálculo de prêmio e gol de ouro
- Validações (saldo insuficiente, integridade de lote, amount === 1)
- Saque, depósito, outras rotas

---

## Validação recomendada

1. Fazer login com usuário de teste com saldo conhecido (ex.: 10).
2. Enviar POST /api/games/shoot com body { direction: "center", amount: 1 } até obter um `result: "miss"`.
3. Conferir que o saldo do usuário diminuiu em 1 (ex.: 10 → 9).
4. Repetir para um `result: "goal"` e conferir: saldo_final = saldo_anterior - 1 + premio (+ premioGolDeOuro se for o caso).
