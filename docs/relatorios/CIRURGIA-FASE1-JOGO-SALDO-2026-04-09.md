# CIRURGIA — FASE 1 — JOGO + SALDO

**Data:** 2026-04-09  
**Escopo:** `POST /api/games/shoot` — regra de saldo explícita, sem dependência de trigger em `chutes`.

---

## 1. Resumo executivo

O handler de chute em `server-fly.js` passou a aplicar **sempre** o movimento financeiro em `usuarios.saldo` após persistir o registro em `chutes`: débito da aposta (`amount`) em **MISS** e **GOAL**, com crédito de `premio + premio_gol_de_ouro` apenas em **GOAL**, alinhado à regra formal aprovada. Comentários que sugeriam gatilhos no PostgreSQL foram substituídos por texto fiel à produção. Foi adicionado **update condicional** no saldo (leitura + `UPDATE ... WHERE saldo = valor_esperado`) com **até 4 tentativas** para reduzir perda de atualização face a outros escritores de saldo.

---

## 2. Arquivo alterado

| Arquivo | Alteração |
|---------|-----------|
| `server-fly.js` | Apenas o bloco do `POST /api/games/shoot` relacionado a persistência do chute, comentários e ajuste de `usuarios.saldo` / `shootResult.novoSaldo`. |

---

## 3. Correção aplicada

- **Antes:** débito em MISS não era feito no backend (assumia-se trigger); em GOAL o saldo era calculado a partir do `user.saldo` lido **no início** do request, sem proteção de concorrência.
- **Depois:** após `insert` em `chutes`, o código lê o saldo atual, calcula `novoSaldo = saldoAtual - amount + (GOAL ? premio + premioGolDeOuro : 0)` e aplica `UPDATE` com `.eq('saldo', saldo_lido)`; em caso de conflito, repete até 4 vezes. `novoSaldo` na resposta vem do retorno do `UPDATE` bem-sucedido.

---

## 4. Regra final implementada

| Cenário | Fórmula |
|---------|---------|
| **MISS** | `saldo_novo = saldo_atual - amount` |
| **GOAL** | `saldo_novo = saldo_atual - amount + premio + premioGolDeOuro` |
| **`data.novoSaldo`** | Valor numérico retornado pelo `UPDATE` que venceu a condição de concorrência (equivalente ao saldo após a jogada). |

Contrato HTTP (`success`, `data` com os mesmos campos, incluindo `novoSaldo`) **mantido**.

---

## 5. Impacto da mudança

- **Contrato HTTP / payload público:** sem alteração intencional de forma ou campos.
- **Migração / schema / novas tabelas:** nenhum.
- **PIX, saque, webhook, worker, frontend:** não alterados.
- **Lotes em memória e `metricas_globais`:** lógica existente preservada; apenas comentários e bloco de saldo do shoot.

---

## 6. Testes executados

| Teste | Resultado |
|-------|-----------|
| `node --check server-fly.js` | OK (sintaxe) |
| Revisão do `git diff` | OK — alteração localizada |
| Execução local do handler / integração Supabase | **Não executado** (ambiente completo não disponível nesta sessão) |

---

## 7. Riscos eliminados

- Dependência implícita de trigger inexistente em `chutes` para movimentar saldo.
- Uso de saldo “congelado” do início do request para o cálculo do vencedor (substituído por leitura no momento do ajuste + update condicional).

---

## 8. Riscos remanescentes

- **Ordem das operações:** o registro em `chutes` continua a ser gravado **antes** do ajuste de saldo; se o ajuste falhar após várias tentativas, pode existir inconsistência entre histórico de chute e saldo (já era uma classe de risco; não foi objecto desta fase).
- **Concorrência:** o bloqueio otimista reduz corridas mas não é uma transação ACID única entre `chutes` e `usuarios`.
- **Tipos numéricos:** igualdade em `.eq('saldo', rowSaldo.saldo)` depende do formato devolvido pelo Supabase (mesmo padrão já usado no fluxo de saque no mesmo ficheiro).

---

## 9. Diagnóstico final da fase

**Classificação: APROVADA COM RESSALVAS**

**Justificativa:** a regra de negócio ficou explícita e alinhada ao diagnóstico de ausência de trigger; o contrato do shoot foi preservado; o âmbito manteve-se em `server-fly.js`. As ressalvas são a impossibilidade de teste E2E aqui e a persistência do risco estrutural “chute gravado antes do saldo”, fora do recorte desta fase.
