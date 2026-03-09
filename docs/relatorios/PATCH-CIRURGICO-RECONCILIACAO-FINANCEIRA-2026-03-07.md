# PATCH CIRÚRGICO — RECONCILIAÇÃO FINANCEIRA V1

**Data:** 2026-03-07  
**Arquivos alterados:** server-fly.js  
**Modo:** Patch cirúrgico; sem refatoração do sistema.

---

## 1. Lacuna corrigida

- **Depósitos aprovados** alteravam `usuarios.saldo` sem registro em `ledger_financeiro`.
- **Chutes (miss e goal)** alteravam `usuarios.saldo` sem registro em `ledger_financeiro`.

Com o patch, todo crédito/débito de saldo por depósito aprovado e por chute passa a ter contrapartida em `ledger_financeiro`.

---

## 2. Estratégia aplicada

- **Manter** todos os updates atuais em `usuarios.saldo` (webhook PIX, reconcile, shoot).
- **Adicionar** chamadas a `createLedgerEntry` (já existente em `processPendingWithdrawals.js`) nos pontos onde o saldo é alterado por:
  1. Depósito aprovado (webhook e reconcile).
  2. Chute MISS (após débito de saldo).
  3. Chute GOAL: dois lançamentos contábeis — `chute_aposta` (débito) e `chute_premio` (crédito) — para reconstruir a fórmula saldo_final = saldo_anterior - amount + premio + premioGolDeOuro.
- **Idempotência:** uso de `correlation_id` + `tipo` + `referencia` já implementado em `createLedgerEntry` (deduplicação por linha existente).
- **Depósito:** `correlationId` e `referencia` = id do registro em `pagamentos_pix`, para que webhook e reconcile não criem dois ledgers para o mesmo pagamento.
- **Chute:** `referencia` e `correlationId` = id do registro inserido em `chutes` (insert passou a retornar `id` com `.select('id').single()`).
- **Totalizadores:** atualização de `total_apostas` e `total_ganhos` no Node no fluxo do chute (total_apostas += 1 em todo chute; total_ganhos += premio + premioGolDeOuro apenas em goal).

---

## 3. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| server-fly.js | Webhook PIX: após creditar saldo, `createLedgerEntry` tipo `deposito_aprovado`. |
| server-fly.js | reconcilePendingPayments: após creditar saldo, `createLedgerEntry` tipo `deposito_aprovado`. |
| server-fly.js | POST /api/games/shoot: select user com `total_apostas`, `total_ganhos`; insert chutes com `.select('id').single()`; GOAL: update saldo + total_apostas + total_ganhos, depois ledger `chute_aposta` (-amount) e `chute_premio` (premio+premioGolDeOuro); MISS: update saldo + total_apostas, depois ledger `chute_miss` (-amount). |

Nenhum outro arquivo foi alterado (sem mudança em engine, saque além do já existente, ou domínio de payout).

---

## 4. Código final completo (trechos relevantes)

**Arquivo único alterado:** `server-fly.js`.

**(A) Webhook PIX** — após creditar saldo (após o `if (saldoError)` que retorna):
```javascript
          // Trilha contábil: ledger para depósito aprovado (idempotência por correlation_id = id do pagamento)
          const ledgerDep = await createLedgerEntry({
            supabase,
            tipo: 'deposito_aprovado',
            usuarioId: pixRecord.usuario_id,
            valor: credit,
            referencia: String(pixRecord.id),
            correlationId: String(pixRecord.id)
          });
          if (!ledgerDep?.success) {
            console.warn('⚠️ [WEBHOOK] Ledger deposito_aprovado não gravado (não reverte saldo):', ledgerDep?.error?.message || ledgerDep?.error);
          }
```

**(B) reconcilePendingPayments** — após `saldoErr` (dentro do `else` de sucesso ao creditar):
```javascript
                const ledgerDep = await createLedgerEntry({
                  supabase,
                  tipo: 'deposito_aprovado',
                  usuarioId: pixRecord.usuario_id,
                  valor: credit,
                  referencia: String(pixRecord.id),
                  correlationId: String(pixRecord.id)
                });
                if (!ledgerDep?.success) {
                  console.warn('⚠️ [RECON] Ledger deposito_aprovado não gravado (não reverte saldo):', ledgerDep?.error?.message || ledgerDep?.error);
                }
```

**(C) POST /api/games/shoot** — select do usuário: `.select('saldo, total_apostas, total_ganhos')`; insert em chutes: `.insert({...}).select('id').single()` e `const chuteId = chuteRow?.id`; bloco de ajuste de saldo: updates com `total_apostas` e `total_ganhos`; após update GOAL dois `createLedgerEntry` (`chute_aposta`, `chute_premio`); após update MISS um `createLedgerEntry` (`chute_miss`). Ver arquivo completo para o bloco exato.

---

## 5. Tipos de ledger utilizados

| tipo | valor | quando |
|------|------|--------|
| deposito_aprovado | positivo (valor do PIX) | webhook ou reconcile aprova pagamento e credita saldo |
| chute_miss | negativo (-1) | após débito de saldo em chute perdido |
| chute_aposta | negativo (-1) | em chute goal, débito da aposta |
| chute_premio | positivo (premio + premioGolDeOuro) | em chute goal, crédito do prêmio |

---

## 5. Como a correção fecha a conta

A fórmula  
`saldo_final = + depósitos_aprovados - custos_chutes + prêmios - saques + rollbacks`  
passa a ser auditável via `ledger_financeiro`:

- **Depósitos:** linhas com `tipo = 'deposito_aprovado'` (valor positivo).
- **Custos de chutes:** `chute_miss` e `chute_aposta` (valores negativos).
- **Prêmios:** `chute_premio` (valor positivo).
- **Saques e rollbacks:** já existentes (`withdraw_request`, `payout_confirmado`, `falha_payout`, `rollback`).

Somando `valor` do ledger por usuário (e por tipo, se necessário), obtém-se a variação de saldo com trilha contábil única.

---

## 6. O que ficou como ressalva

- Falha ao gravar ledger **não** reverte saldo (apenas log de aviso); cenário de falha parcial (saldo atualizado e ledger não) continua possível e deve ser tratado por processo de reconciliação ou retry futuro.
- Totalizadores `total_apostas` e `total_ganhos` passam a ser atualizados no Node; dados históricos anteriores ao patch podem estar desatualizados até então.

---

## 8. Validação recomendada

1. **Depósito:** aprovar um PIX (webhook ou reconcile) e verificar em `ledger_financeiro` uma linha `tipo = 'deposito_aprovado'` com valor e `referencia` = id do pagamento.
2. **Chute MISS:** dar um chute com resultado miss e verificar ledger `chute_miss` com valor -1 e referencia = id do chute.
3. **Chute GOAL:** dar um chute goal e verificar duas linhas: `chute_aposta` -1 e `chute_premio` com valor = premio + premioGolDeOuro, mesma referencia (id do chute).
4. **Idempotência:** reenviar mesmo webhook ou reprocessar mesmo pagamento e confirmar que não surge segunda linha de ledger para o mesmo depósito.

---

## 9. Referências

- Auditoria: [AUDITORIA-SUPREMA-RECONCILIACAO-FINANCEIRA-READONLY-2026-03-07.md](AUDITORIA-SUPREMA-RECONCILIACAO-FINANCEIRA-READONLY-2026-03-07.md)
- Rollback: [ROLLBACK-PATCH-RECONCILIACAO-FINANCEIRA-2026-03-07.md](ROLLBACK-PATCH-RECONCILIACAO-FINANCEIRA-2026-03-07.md)
- Validação V1: [../V1-VALIDATION.md](../V1-VALIDATION.md)

---

## 10. Prompt de validação final

Use o texto abaixo para validar o patch em ambiente de teste ou produção (modo somente leitura onde aplicável):

1. **Depósito:** Após aprovar um PIX (via webhook ou reconciliação), consultar `ledger_financeiro` filtrando por `tipo = 'deposito_aprovado'` e `referencia` = id do registro em `pagamentos_pix`. Deve existir exatamente uma linha com valor positivo igual ao valor do pagamento.
2. **Chute MISS:** Realizar um chute com resultado `miss`. Consultar a tabela `chutes` pelo último insert do usuário e obter o `id`. Em `ledger_financeiro`, deve existir uma linha com `tipo = 'chute_miss'`, `referencia` = id do chute, `valor` = -1.
3. **Chute GOAL:** Realizar um chute com resultado `goal`. Em `ledger_financeiro` devem existir duas linhas com a mesma `referencia` (id do chute): uma `tipo = 'chute_aposta'` com `valor` = -1 e outra `tipo = 'chute_premio'` com `valor` = premio + premio_gol_de_ouro (ex.: 5 ou 105 se gol de ouro).
4. **Idempotência depósito:** Reenviar o mesmo webhook de pagamento aprovado (ou aguardar novo ciclo de reconcile para o mesmo pagamento já aprovado) e confirmar que não foi criada segunda linha em `ledger_financeiro` para o mesmo `referencia`/`correlation_id`.
5. **Totalizadores:** Após um chute (miss ou goal), consultar `usuarios` e verificar que `total_apostas` aumentou em 1; após um goal, verificar que `total_ganhos` aumentou em premio + premio_gol_de_ouro.
6. **Fórmula:** Para um usuário de teste, somar todos os `valor` em `ledger_financeiro` (deposito_aprovado, chute_miss, chute_aposta, chute_premio, withdraw_request, payout_confirmado, falha_payout, rollback) e comparar com o `saldo` atual em `usuarios`; devem ser consistentes (saldo = soma dos valores do ledger para aquele usuário).
