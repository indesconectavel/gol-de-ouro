# BLOCO A2 — Validação 01 do saque seguro

**Data:** 2026-03-27  
**Método:** leitura do código atual em `server-fly.js` (handler `POST /api/withdraw/request`, ~L1401–1533).  
**Escopo:** apenas validação técnica; **nenhuma alteração de código** realizada nesta tarefa.

---

## 1. Resumo executivo

A cirurgia no endpoint **`POST /api/withdraw/request`** foi **revisada no código-fonte** e está **tecnicamente alinhada** ao comportamento oficial reportado: débito em `usuarios.saldo` **antes** do `insert` em `saques`, com **lock otimista** na mesma linha de ideia do `POST /api/games/shoot`, interrupção do fluxo com **409** se o débito não aplicar, e **tentativa de rollback** do saldo se o `insert` falhar.

**Classificação:** **APROVADO COM RESSALVAS** (ressalvas = riscos residuais inevitáveis fora desta cirurgia, não falhas encontradas no trecho validado).

---

## 2. Fluxo validado (ordem observada no código)

| Ordem | O que o código faz |
|-------|---------------------|
| 1 | `authenticateToken` (middleware da rota). |
| 2 | `PixValidator.validateWithdrawData` — falha → **400**. |
| 3 | Verificação `dbConnected` / `supabase` — falha → **503**. |
| 4 | `select('saldo')` em `usuarios` por `id` — falha → **404**. |
| 5 | `parseFloat(usuario.saldo) < parseFloat(valor)` — verdadeiro → **400** “Saldo insuficiente”. |
| 6 | Cálculo de `taxa` / `valorLiquido` (informativo; não altera o débito). |
| 7 | `saldoAtual`, `valorSaque`, `novoSaldo = saldoAtual - valorSaque`. |
| 8 | **`update` em `usuarios`:** `saldo: novoSaldo`, `.eq('id', userId)`, **`.eq('saldo', usuario.saldo)`**, `.select().single()`. |
| 9 | Se `debitoError` ou `!usuarioDebitado` → **409** “Saldo insuficiente ou alterado. Tente novamente.” — **fim** (sem `insert`). |
|10 | **`insert` em `saques`** apenas se o passo 8 tiver sucesso. |
|11 | Se `saqueError` → log do erro de insert; **`update` de rollback** `saldo: saldoAtual` com `.eq('saldo', usuarioDebitado.saldo)`; log crítico se rollback falhar; **500** “Erro ao criar saque”. |
|12 | Sucesso → log, **201** com `success`, `message`, `data` (incl. `status: 'pending'`). |

**Conclusão de ordem:** o **débito precede** o registro em `saques`; se o débito não “pegar”, **não há** criação de saque.

---

## 3. Garantias de segurança confirmadas

| Garantia | Confirmação no código |
|----------|------------------------|
| Débito imediato | Sim — `update({ saldo: novoSaldo })` ocorre **antes** do `insert` em `saques` (L1459–1473 vs L1475+). |
| Lock otimista | Sim — `.eq('saldo', usuario.saldo)` no mesmo `update` do débito (L1464), usando o valor **lido** na mesma requisição (equivalente ao padrão do shoot com `.eq('saldo', user.saldo)`). |
| Bloqueio de corrida no mesmo saldo | Sim — segundo pedido concorrente com o mesmo `usuario.saldo` esperado falha o `update` (0 linhas / `usuarioDebitado` ausente) → **409**. Dois pedidos que somam mais que o saldo: o primeiro debita; o segundo não casa `saldo` → **409**. |
| Rollback em falha do insert | Sim — L1496–1511: `update({ saldo: saldoAtual })` com `.eq('saldo', usuarioDebitado.saldo)` para reverter apenas se o saldo ainda for o pós-débito. |
| Mensagens e HTTP | **409** para conflito de débito; **500** com mensagem fixa em falha de insert/fluxo de erro; **201** no sucesso — coerente com o handler. |

**Perguntas diretas da missão:**

- *O saque agora debita saldo de verdade?* **Sim** — via `update` em `usuarios` antes do insert.  
- *A corrida foi mitigada?* **Sim** no sentido de **não permitir dois débitos** baseados no mesmo snapshot de saldo; quem perde a corrida recebe **409**.  
- *O rollback existe e está correito?* **Existe**; restaura `saldoAtual` com condição no saldo atual pós-débito (`usuarioDebitado.saldo`), alinhado à ideia de reversão segura se ninguém mais alterou o saldo entretanto.

---

## 4. Problemas encontrados

**Nenhum defeito lógico** foi identificado no fluxo validado (ordem débito → insert → rollback) em relação ao objetivo da cirurgia.

Observações **não classificadas como bug** nesta validação:

- `valorLiquido` continua **não persistido** no insert (já era assim); apenas informativo.  
- Precisão monetária usa `Number` / `parseFloat` como no restante do arquivo — **mesma classe de risco** que o shoot, não regressão específica deste endpoint.

---

## 5. Riscos residuais (fora do escopo desta cirurgia)

- **Idempotência:** requisições repetidas com o mesmo payload podem gerar **vários saques** se o cliente reenviar após sucesso — não há chave de idempotência no handler.  
- **Rollback falho:** se entre o insert falho e o rollback outra operação alterar `usuarios.saldo` (ex.: crédito PIX, outro saque em instância diferente), o `.eq('saldo', usuarioDebitado.saldo)` pode não atualizar — o código **loga** falha crítica; pode exigir **ajuste manual** no banco.  
- **Transação ACID única:** débito e insert não estão em uma única transação SQL explícita — mitigado por ordem + rollback, não eliminado formalmente.  
- **Liquidação externa:** pagamento PIX real do saque continua **fora** deste endpoint; o débito na conta é “reserva lógica” até o processo operacional concluir.

---

## 6. Compatibilidade com o sistema atual

| Item | Status |
|------|--------|
| Autenticação | Mantida — `authenticateToken`. |
| Validações PixValidator + saldo insuficiente (pré-débito) | Mantidas. |
| Contrato 201 | Mantido — `success`, `message`, `data` com `id`, `amount`, `pix_key`, `pix_type`, `status: 'pending'`, `created_at`. |
| Endpoint e método | Inalterados — `POST /api/withdraw/request`. |
| Alteração em PIX / shoot / outras rotas | **Não** verificadas alterações nesta leitura focada; o trecho analisado **não** inclui handlers de PIX nem `shoot`. |

---

## 7. Classificação

**APROVADO COM RESSALVAS**

Motivo: o fluxo financeiro mínimo (débito + lock + rollback) está **implementado corretamente** no código lido; as ressalvas são **residuais** e documentadas na seção 5, não erros de implementação encontrados no handler.

---

## 8. Conclusão objetiva

- O endpoint **debita o saldo de forma consistente** com o padrão do **shoot** (leitura → `update` com `.eq` no saldo anterior).  
- A **corrida** entre dois pedidos que disputam o **mesmo saldo lido** está **mitigada** pelo lock otimista.  
- O **rollback** após falha no **insert** está **presente** e **condicionado** ao saldo pós-débito esperado.

**Pronto para a V1** no sentido de **“saque solicitação debita saldo e não permite double-spend concorrente no mesmo snapshot”**. **Próximas cirurgias** do financeiro (idempotência de saque, ledger, ou transação única) podem seguir como evolução, **sem bloquear** a validação desta entrega.

---

*Fim do relatório BLOCO A2 — Validação 01.*
