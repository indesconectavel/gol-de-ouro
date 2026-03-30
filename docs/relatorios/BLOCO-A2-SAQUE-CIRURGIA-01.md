# BLOCO A2 — Cirurgia 01 do saque seguro

**Data:** 2026-03-27  
**Escopo:** apenas `POST /api/withdraw/request` em `server-fly.js`.

---

## 1. Resumo executivo

O endpoint passou a **debitar `usuarios.saldo` no momento da solicitação**, usando **lock otimista** (`.eq('saldo', valor_lido)`), no mesmo espírito do `POST /api/games/shoot`. O **insert em `saques` só ocorre após** o update de saldo bem-sucedido. Se o **insert falhar**, o handler tenta **reverter o saldo** ao valor anterior, com lock otimista no saldo pós-débito; se o rollback falhar, o erro é **logado** e a API ainda responde **500** por falha na criação do saque.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `server-fly.js` | Handler de `POST /api/withdraw/request`: débito com lock otimista, insert condicional, rollback em falha de insert. |

---

## 3. Fluxo antigo

1. Validar PIX e saldo (leitura pontual).  
2. Inserir linha em `saques`.  
3. **Não** alterar `usuarios.saldo`.  
4. Responder 201.

Consequência: várias requisições concorrentes podiam abrir vários saques sobre o mesmo saldo sem reduzir o saldo na conta.

---

## 4. Fluxo novo

1. Manter: autenticação, `PixValidator.validateWithdrawData`, DB disponível, usuário encontrado, `saldo >= valor`.  
2. Calcular `saldoAtual`, `valorSaque`, `novoSaldo = saldoAtual - valorSaque`.  
3. **`update` em `usuarios`** com `saldo: novoSaldo`, `.eq('id', userId)`, `.eq('saldo', usuario.saldo)` (lock otimista no valor lido).  
4. Se nenhuma linha atualizada ou erro → **409** com mensagem alinhada ao shoot (“Saldo insuficiente ou alterado…”). **Não** cria saque.  
5. Se sucesso → **`insert` em `saques`**.  
6. Se insert falhar → **`update` de rollback** `saldo: saldoAtual` com `.eq('saldo', usuarioDebitado.saldo)`; log em caso de falha do rollback; **500** “Erro ao criar saque”.  
7. Se sucesso → **201** com o mesmo formato de resposta anterior (`status: 'pending'` em `data`, etc.).

---

## 5. Garantias de segurança adicionadas

| Garantia | Como |
|----------|------|
| Débito real | `update` reduz `saldo` pelo valor solicitado antes de registrar o saque. |
| Lock otimista | Condição `.eq('saldo', usuario.saldo)` no débito; concorrência perde com 409. |
| Prevenção de corrida | Dois saques paralelos: o segundo update não casa com `saldo` se o primeiro já alterou. |
| Saque só com saldo debitado | Insert só após update retornar linha. |
| Falha no insert | Tentativa de restaurar saldo ao valor anterior. |

---

## 6. O que NÃO foi alterado

- PIX, webhook, reconciliação, `POST /api/games/shoot`, demais endpoints.  
- Estrutura de tabelas (sem novas tabelas ou colunas).  
- Nome do endpoint, método HTTP, autenticação JWT.  
- Contrato principal da resposta 201 (campos `success`, `message`, `data` com `status: 'pending'`).  
- Validação `PixValidator` e limites de valor.  
- Campos do `insert` em `saques` (incl. `status: 'pendente'`).  
- Sem fila de saque, sem ledger novo, sem idempotência de chave (fora do escopo desta cirurgia).

---

## 7. Riscos residuais

- **Idempotência:** reenvio duplicado do mesmo pedido pelo cliente pode gerar dois saques se intencional — não tratado aqui.  
- **Rollback:** se o insert falhar e outra operação alterar o saldo antes do rollback, o `.eq('saldo', …)` pode não atualizar; o log marca falha crítica — pode exigir reconciliação manual.  
- **Precisão decimal:** uso de `Number` / `parseFloat` como no restante do arquivo; edge cases de ponto flutuante em dinheiro não foram redesenhados.  
- **Processamento externo do saque:** liquidação PIX real continua fora deste handler; o comentário foi ajustado para não afirmar delegação contábil removida de forma ambígua.  
- **`valorLiquido` / taxa:** continuam calculados; o débito na conta é o **valor integral** solicitado (`valor`), coerente com o insert anterior.

---

## 8. Como testar

1. **Saldo suficiente:** com token válido, `POST /api/withdraw/request` com `valor`, `chave_pix`, `tipo_chave` válidos; esperar **201**; conferir no Supabase que `usuarios.saldo` diminuiu de `valor` e existe nova linha em `saques`.  
2. **Saldo insuficiente:** valor maior que saldo → **400** “Saldo insuficiente”; saldo inalterado.  
3. **Concorrência:** duas requisições paralelas com a mesma soma cobrindo todo o saldo; esperar **uma** 201 e **uma** 409 (ou ambas 409 se a primeira já consumiu o saldo).  
4. **Simulação de falha de insert:** (ambiente de teste) forçar erro de schema ou mock; esperar **500** e verificar que o saldo foi restaurado ou que o log de rollback falhou (cenário extremo).

---

## 9. Conclusão

A **cirurgia mínima** cumpre o objetivo: o saldo **cai** na solicitação, **concorrência** no mesmo saldo é barrada pelo lock otimista, e há **tentativa de rollback** se o registro do saque não for criado. O endpoint está **pronto para validação** da V1 no que tange ao débito de saldo no pedido de saque; riscos residuais são conhecidos e listados acima.

---

*Fim do relatório BLOCO A2 — Cirurgia 01.*
