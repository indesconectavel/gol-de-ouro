# BLOCO A3 — Cirurgia 01 do PIX seguro

**Data:** 2026-03-27  
**Arquivo alterado:** `server-fly.js` apenas.

---

## 1. Resumo executivo

Foi introduzida a função interna **`creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)`**, reutilizada pelo **webhook** `POST /api/payments/webhook` e pela **`reconcilePendingPayments()`**.

O fluxo passa a ter **claim atômico** em `pagamentos_pix`: só uma execução consegue transicionar uma linha de **`pending` → `approved`**; só então o **crédito em `usuarios.saldo`** é aplicado com **lock otimista** (`.eq('saldo', saldoAnt)`), alinhado ao shoot/saque. Se o crédito falhar, o status do pagamento **volta para `pending`** para permitir nova tentativa (webhook/reconcile), sem marcar como pago sem saldo.

O ID do pagamento no MP passa a aceitar **string ou número** no webhook (`String(data.id)`), sem alterar o contrato HTTP.

---

## 2. Arquivos alterados

| Arquivo | Conteúdo |
|---------|----------|
| `server-fly.js` | Nova função `creditarPixAprovadoUnicoMpPaymentId`; webhook simplificado; loop de reconciliação delegado a essa função. |

---

## 3. Fluxo antigo

1. Webhook: leitura de `status === 'approved'` em memória; **update** livre em `pagamentos_pix` para `approved`; **crédito** em saldo **sem** lock; possível **duplo crédito** (webhook concorrente ou webhook + reconcile).  
2. Reconciliação: mesmo padrão de update + crédito **sem** claim atômico nem lock no saldo.

---

## 4. Fluxo novo

1. **Confirmação no MP:** mantida — `GET /v1/payments/{id}` com `status === 'approved'` antes de chamar o helper (webhook e reconcile).  
2. **Claim idempotente:** `UPDATE pagamentos_pix SET status='approved' WHERE id = ? AND status = 'pending' RETURNING ...` — se **0 linhas**, outro fluxo venceu (`claim_lost`) ou estado inesperado; **não credita**.  
3. Se já existir **`status === 'approved'`** no registro → **retorno idempotente** (`already_processed`), **sem** novo crédito.  
4. **Crédito:** `novoSaldo = Number(saldoAnt) + credit` com `update ... .eq('saldo', saldoAnt)`.  
5. **Falha no crédito:** `pagamentos_pix` **revertido** para `pending` (mesmo `id`, `.eq('status','approved')`).  
6. **Ordem:** MP aprovado → helper (claim + crédito ou saída antecipada).

---

## 5. Garantias de segurança adicionadas

| Garantia | Como |
|----------|------|
| Um crédito por pagamento (em condições normais) | Claim só com `pending`; duplicata vê `approved` e sai sem creditar. |
| Mitigação webhook duplicado | Segundo processo perde o claim ou vê `already_processed`. |
| Mitigação reconcile vs webhook | Mesmo `paymentIdStr`: só um **claim** vence; o outro obtém `claim_lost` ou `already_processed`. |
| Lock otimista no saldo | `.eq('saldo', saldoAnt)` no `update` de `usuarios`. |
| Soma numérica | `Number(...)` no crédito e no novo saldo. |

---

## 6. O que NÃO foi alterado

- `POST /api/payments/pix/criar`, saque, shoot, analytics, admin, frontend.  
- Nenhuma tabela nova; nenhum worker novo.  
- Estrutura geral do webhook (assinatura MP, resposta 200 imediata).  
- Intervalo e filtros da reconciliação (pendentes antigos, limite, etc.).

---

## 7. Riscos residuais

- **Transação ACID única** (Postgres BEGIN/COMMIT envolvendo `pagamentos_pix` + `usuarios`): **não** implementada; janela mínima entre claim e crédito permanece.  
- **`claim_lost`:** outro processo creditou; comportamento esperado; não é erro de produto.  
- **Crédito zero:** linha pode ficar `approved` sem alteração de saldo (valor 0) — log de aviso.  
- **Registros legados** com status fora de `pending`/`approved`: retorno `unexpected_status`.  
- **Rollback** do saldo (falha de lock) restaura `pending`; retentativas dependem de MP/webhook/reconcile.

---

## 8. Como testar

1. **Fluxo feliz:** criar PIX (`pending`), aprovar no MP (sandbox), disparar webhook ou aguardar reconcile → saldo sobe **uma vez**; `pagamentos_pix.status` = `approved`.  
2. **Idempotência:** reenviar o mesmo payload de webhook → log “já processado” ou claim perdido; saldo **não** dobra.  
3. **Concorrência:** simular dois POSTs de webhook quase simultâneos para o mesmo `payment id` → um crédito, outro `claim_lost` ou idempotente.  
4. **Reconcile:** deixar pagamento `pending` antigo com MP `approved`; job deve creditar **uma vez** (helper).  
5. **Concorrência saldo:** durante crédito PIX, executar chute/saque que altere saldo entre read e update — esperar falha de lock e **reversão** para `pending` no PIX (ver logs).

---

## 9. Conclusão

A cirurgia atinge o **mínimo solicitado para V1:** idempotência lógica forte no **mesmo pagamento**, alinhamento do crédito ao **lock otimista** do restante do financeiro, e **unificação** webhook/reconcile num único helper. **Pronto para validação** em ambiente de teste/staging com Mercado Pago.

---

*Fim do relatório BLOCO A3 — Cirurgia 01.*
