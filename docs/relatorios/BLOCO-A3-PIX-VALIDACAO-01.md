# BLOCO A3 — Validação 01 do PIX seguro

**Data:** 2026-03-27  
**Método:** leitura do código atual em `server-fly.js` (função `creditarPixAprovadoUnicoMpPaymentId`, `POST /api/payments/webhook`, `reconcilePendingPayments`, verificação por grep de rotas adjacentes).  
**Escopo:** validação técnica; **nenhuma alteração de código** nesta tarefa.

---

## 1. Resumo executivo

A cirurgia está **tecnicamente coerente** com o desenho oficial: **um único helper** concentra o crédito de saldo por pagamento PIX aprovado no Mercado Pago; **webhook** e **reconciliação** apenas confirmam `approved` no MP e chamam esse helper. O helper implementa **claim condicional** (`pending` → `approved`), **idempotência** quando o registro já está `approved`, **crédito com lock otimista** em `usuarios.saldo` e **reversão para `pending`** se o crédito ou o usuário falharem.

**Classificação:** **APROVADO COM RESSALVAS** (ressalvas = ausência de transação ACID única e edge cases operacionais; não defeitos lógicos encontrados no fluxo validado).

---

## 2. Fluxo validado (ordem real no código)

### Função `creditarPixAprovadoUnicoMpPaymentId` (~L1847–1927)

1. Falha cedo se `!dbConnected || !supabase` → `{ ok: false, reason: 'no_db' }`.  
2. Busca `pagamentos_pix` por `external_id`, depois por `payment_id` → `pix_not_found` se inexistente.  
3. Se `pix.status === 'approved'` → `{ ok: true, reason: 'already_processed' }` (**sem** alterar saldo).  
4. Se `pix.status !== 'pending'` → `{ ok: false, reason: 'unexpected_status' }`.  
5. **Claim:** `update` com `.eq('id', pix.id).eq('status', 'pending')` + `select` → se array vazio → `claim_lost`.  
6. `credit = Number(row.amount ?? row.valor ?? 0)`; se `credit <= 0` → aviso, `{ ok: true, reason: 'zero_credit' }` (linha mantida `approved`).  
7. Lê `usuarios.saldo`; se usuário inexistente → reverte pagamento para `pending` e retorna `user_not_found`.  
8. `novoSaldo = Number(saldoAnt) + credit`; `update` com `.eq('saldo', saldoAnt)`; se falha → reverte para `pending`, `saldo_race`.  
9. Sucesso → log e `{ ok: true, reason: 'credited' }`.

### Webhook (~L1935–1997)

1. Middleware de assinatura MP (inalterado em propósito).  
2. `res.status(200).json({ received: true })` **antes** do processamento assíncrono.  
3. Se `type === 'payment'` e `data.id` presente: normaliza `paymentIdStr`, valida dígitos, `GET` MP; se `status !== 'approved'`, retorna.  
4. Chama **`creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)`** única vez.  
5. Logs específicos para `already_processed` e erros (exceto `claim_lost` silencioso para erro).

### Reconciliação (~L2027–2088)

1. Lista `pagamentos_pix` com `status === 'pending'` e idade mínima; para cada item, consulta MP.  
2. Se MP `approved` → **`creditarPixAprovadoUnicoMpPaymentId(mpId)`** (mesmo helper).  
3. Logs de erro se falha com `reason` diferente de `claim_lost`; log de sucesso se `reason === 'credited'`.

---

## 3. Garantias de segurança confirmadas

| Garantia | Confirmação |
|----------|----------------|
| **Um caminho de crédito** para PIX no fluxo analisado | Todo crédito de saldo por pagamento aprovado passa **somente** por `creditarPixAprovadoUnicoMpPaymentId`; não há segundo bloco paralelo de `update` de saldo no webhook/reconcile após a cirurgia. |
| **Claim / idempotência** | `UPDATE … WHERE id = ? AND status = 'pending'` — no máximo uma linha transiciona; leitura prévia de `approved` evita novo crédito em reenvios. |
| **Um crédito por pagamento** | Em condições normais, após claim bem-sucedido, um único `update` de saldo com lock; segunda execução vê `approved` ou perde o claim. |
| **Lock otimista no saldo** | `.eq('saldo', saldoAnt)` no `update` de `usuarios` com `saldoAnt` lido na mesma sequência. |
| **Soma numérica** | `Number(saldoAnt) + credit` e `Number(row.amount ?? …)`. |
| **Falha de lock** | Reversão para `pending` (L1919–1923). |
| **Webhook duplicado** | Segundo processo: `already_processed` ou `claim_lost` (0 linhas no claim). |
| **Webhook × reconcile** | Mesmo `paymentIdStr`: um vence o claim; o outro não atualiza linhas ou vê `already_processed`. |

**Coerência de `claim_lost` / `already_processed`:** `claim_lost` = corrida no claim; `already_processed` = pagamento já finalizado antes — **coerente** com o desenho.

---

## 4. Problemas encontrados

**Nenhum defeito lógico** foi identificado no fluxo validado em relação aos objetivos da cirurgia (duplicação de crédito, lock, convergência webhook/reconcile).

Observações **não classificadas como bug** nesta validação:

- `claim_lost` **intencionalmente** não gera erro no webhook (reduz ruído em reenvios concorrentes).  
- Crédito zero deixa `approved` sem alterar saldo — **edge case** de dado, não duplicação.

---

## 5. Riscos residuais

- **Sem transação ACID única** envolvendo `pagamentos_pix` e `usuarios` — janela teórica entre claim e crédito (mitigada por revert para `pending` em falha).  
- **Crédito zero:** linha pode ficar `approved` sem movimento de saldo — requer dados ou regra de negócio futura se for problema.  
- **Estado legado** `approved` sem crédito histórico: helper retorna `already_processed` e **não** credita — pode exigir correção manual em banco se existir lixo antigo.  
- **Retentativas:** dependem de MP reenviar webhook ou de reconcile pegar `pending` após reversão.

---

## 6. Compatibilidade com o sistema atual

| Item | Verificação |
|------|-------------|
| `POST /api/payments/pix/criar` | Rota permanece em ~L1590, **antes** do bloco do helper; **não** há alteração estrutural da rota de criação na região analisada (helper inserido ~L1840+). |
| Saque | `POST /api/withdraw/request` em ~L1401 — **fora** do patch PIX; validação por posição no arquivo e ausência de referência cruzada ao helper no fluxo de saque. |
| Gameplay | `shoot` não referido no trecho PIX; **não** alterado na cirurgia PIX. |
| Webhook | Continua `POST /api/payments/webhook`, resposta **200** `{ received: true }`, middleware de assinatura preservado. |

---

## 7. Classificação

**APROVADO COM RESSALVAS**

---

## 8. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| O PIX agora evita crédito duplicado? | **Sim**, no desenho atual: claim atômico + `approved` idempotente + lock no saldo. |
| Webhook e reconciliação deixaram de competir de forma perigosa? | **Sim** — ambos usam o **mesmo helper**; o claim serializa o mesmo pagamento. |
| O saldo está protegido com lock? | **Sim** — `.eq('saldo', saldoAnt)`. |
| Está pronto para a V1? | **Sim**, para **validação operacional** da V1 no escopo de duplicação de crédito PIX e concorrência; ressalvas de **ACID** e edge cases permanecem documentadas. |

---

*Fim do relatório BLOCO A3 — Validação 01.*
