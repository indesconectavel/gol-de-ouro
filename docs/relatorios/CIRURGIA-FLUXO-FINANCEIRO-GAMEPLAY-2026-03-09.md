# CIRURGIA — FLUXO FINANCEIRO GAMEPLAY V1

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Cirurgia controlada — apenas backend (server-fly.js).  
**Referência:** AUDITORIA-SUPABASE-FLUXO-FINANCEIRO-READONLY-2026-03-09.md

---

## 1. Problema identificado

- A tabela **chutes** no Supabase **não possui triggers ativos** (consulta pg_trigger retornou 0 linhas).
- A função **update_user_stats()** existe apenas no arquivo SQL do repositório (schema-supabase-final.sql) e não está ativa no banco.
- O backend **assumia** que o trigger debitaria o perdedor; na prática **apenas o vencedor** era ajustado (UPDATE de saldo no ramo GOAL).
- **Consequência:** Em cada lote, 9 perdedores não tinham R$ 1 debitados; 1 vencedor recebia R$ 5. O sistema criava dinheiro e a economia do lote não fechava. Diagnóstico oficial: **BANCO FINANCEIRO INCONSISTENTE**.

---

## 2. Estratégia adotada

- **Lógica financeira 100% no backend**, sem dependência de trigger ou função SQL.
- O endpoint **POST /api/games/shoot** passa a executar:
  - **MISS:** debitar saldo do jogador (saldo = saldo - valor da aposta).
  - **GOAL:** debitar aposta e creditar prêmio (saldo = saldo - aposta + premio + premioGolDeOuro).
- Nenhuma alteração em banco, schema, triggers, RPCs, frontend ou engine de lotes.

---

## 3. Alteração realizada

- **Arquivo:** server-fly.js  
- **Endpoint:** POST /api/games/shoot  
- **Ponto:** Bloco após o INSERT em `chutes`, onde antes só havia ajuste de saldo para o vencedor (isGoal).
- **Mudança:** Inclusão de ramo **else** para **MISS**: após o INSERT, calcular `novoSaldoPerdedor = user.saldo - betAmount` e executar UPDATE em `usuarios` com esse saldo para o usuário que chutou. Comentários atualizados para refletir que não há mais dependência de trigger.

---

## 4. Código modificado

### Trecho antigo

```javascript
    // Ajuste de saldo:
    // - Perdas: o trigger update_user_stats (AFTER INSERT em chutes) subtrai valor_aposta no banco.
    //   PRESSUPOSTO CRÍTICO: esse trigger deve existir no Supabase de produção; sem ele, perdedores não têm saldo debitado.
    // - Vitórias: o trigger credita premio+premio_gol_de_ouro; este UPDATE sobrescreve o saldo para o valor correto (anterior - aposta + prêmio).
    if (isGoal) {
      const novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro;
      const { error: saldoWinnerError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoVencedor })
        .eq('id', req.user.userId);
      if (saldoWinnerError) {
        console.error('❌ [SHOOT] Erro ao ajustar saldo do vencedor:', saldoWinnerError);
      } else {
        shootResult.novoSaldo = novoSaldoVencedor;
      }
    }
```

### Trecho novo

```javascript
    // Ajuste de saldo (100% no backend — sem dependência de trigger):
    // - MISS: debitar valor da aposta do jogador (saldo = saldo - betAmount).
    // - GOAL: debitar aposta e creditar prêmio (saldo = saldo - betAmount + premio + premioGolDeOuro).
    if (isGoal) {
      const novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro;
      const { error: saldoWinnerError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoVencedor })
        .eq('id', req.user.userId);
      if (saldoWinnerError) {
        console.error('❌ [SHOOT] Erro ao ajustar saldo do vencedor:', saldoWinnerError);
      } else {
        shootResult.novoSaldo = novoSaldoVencedor;
      }
    } else {
      // MISS: debitar aposta do perdedor (economia V1 — sem trigger)
      const novoSaldoPerdedor = user.saldo - betAmount;
      const { error: saldoLoserError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoPerdedor })
        .eq('id', req.user.userId);
      if (saldoLoserError) {
        console.error('❌ [SHOOT] Erro ao debitar saldo do perdedor:', saldoLoserError);
      } else {
        shootResult.novoSaldo = novoSaldoPerdedor;
      }
    }
```

---

## 5. Fluxo financeiro final

| Evento | Ação no backend após INSERT em chutes |
|--------|--------------------------------------|
| **MISS** | UPDATE usuarios SET saldo = saldo - 1 WHERE id = userId → jogador perde R$ 1. |
| **GOAL** | UPDATE usuarios SET saldo = saldo - 1 + premio + premioGolDeOuro WHERE id = userId → jogador paga R$ 1 e recebe R$ 5 (ou R$ 5 + R$ 100). |

- **Regra V1 mantida:** valor_aposta R$ 1, lote 10 chutes, prêmio R$ 5.  
- **Por lote:** 9 jogadores → -1 cada; 1 jogador → -1 + 5 = +4 líquido; plataforma → +5.  
- Nenhuma dependência de trigger ou função SQL; compatível com o banco atual (sem triggers em `chutes`).

---

## 6. Resultado

- **Economia do lote:** Passa a fechar corretamente: arrecadação R$ 10, saída R$ 5 ao vencedor, R$ 5 retidos pela plataforma; perdedores são debitados no backend.
- **Cenário 1 — MISS:** saldo inicial 10, chute miss → saldo final = 10 - 1 = **9**.  
- **Cenário 2 — GOAL:** saldo inicial 10, chute goal (prêmio R$ 5) → saldo final = 10 - 1 + 5 = **14**.  
- Engine de lotes, gameplay, frontend, banco, autenticação, depósitos e saques permanecem intactos. A correção é mínima, localizada e auditável apenas em server-fly.js.

---

*Cirurgia aplicada em 2026-03-09. Nenhum trigger, schema, RPC ou outro endpoint foi alterado.*
