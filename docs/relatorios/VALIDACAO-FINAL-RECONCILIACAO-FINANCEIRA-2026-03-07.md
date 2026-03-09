# VALIDAÇÃO FINAL — RECONCILIAÇÃO FINANCEIRA V1

**Data:** 2026-03-07  
**Modo:** READ-ONLY  
**Objetivo:** Validar se o patch cirúrgico de reconciliação financeira tornou o sistema mais reconciliável nos pontos críticos (depósito aprovado com ledger, jogo com ledger).

---

## 1. Patch encontrado

**Evidência:** O patch está presente em `server-fly.js`.

| Ponto | Local (linhas aprox.) | Evidência |
|-------|------------------------|-----------|
| Webhook PIX — ledger depósito | 2123–2134 | `createLedgerEntry` com `tipo: 'deposito_aprovado'`, `referencia` e `correlationId: String(pixRecord.id)` |
| reconcilePendingPayments — ledger depósito | 2441–2452 | Mesmo padrão: `deposito_aprovado` com `pixRecord.id` |
| Shoot — insert chutes retorna id | 1295–1325 | `.insert({...}).select('id').single()`, `chuteId = chuteRow?.id` |
| Shoot — select user com totalizadores | 1185–1189 | `.select('saldo, total_apostas, total_ganhos')` |
| Shoot — GOAL ledger | 1369–1373 | Dois `createLedgerEntry`: `chute_aposta` (-amount), `chute_premio` (premio + premioGolDeOuro) |
| Shoot — MISS ledger | 1398–1400 | Um `createLedgerEntry`: `chute_miss` (-amount) |
| Shoot — totalizadores no update | 1350–1351, 1359–1360, 1382 | `totalApostasNovo`, `totalGanhosNovo`; GOAL atualiza saldo + total_apostas + total_ganhos; MISS atualiza saldo + total_apostas |

**Conclusão:** Patch encontrado e aplicado nos fluxos de depósito (webhook e reconcile) e de jogo (MISS e GOAL), com totalizadores no Node.

---

## 2. Depósito com ledger?

**Sim.**

- **Webhook PIX:** Após o update de saldo (claim atômico em `pagamentos_pix` + crédito em `usuarios`), é chamado `createLedgerEntry` com `tipo: 'deposito_aprovado'`, `valor: credit`, `referencia: String(pixRecord.id)`, `correlationId: String(pixRecord.id)`.
- **reconcilePendingPayments:** Após o update de saldo (claim por `id` do registro pendente + crédito), o mesmo `createLedgerEntry` é chamado com os mesmos parâmetros.

**Idempotência / duplicidade:** Em `processPendingWithdrawals.js`, `createLedgerEntry` consulta `ledger_financeiro` por `(correlation_id, tipo, referencia)` antes de inserir; se já existir linha, retorna `{ success: true, deduped: true }`. Como webhook e reconcile usam o **id do registro em `pagamentos_pix`** como `referencia` e `correlationId`, o mesmo pagamento aprovado (mesmo `pixRecord.id`) não gera duas linhas: quem processar primeiro (webhook ou reconcile) insere; o segundo obtém dedup. **Duplicidade mitigada.**

---

## 3. Jogo com ledger?

**Sim.**

- **Chute MISS:** Após o update de saldo (débito com lock otimista) e apenas se `chuteId` existir, é chamado `createLedgerEntry` com `tipo: 'chute_miss'`, `valor: -amount`, `referencia` e `correlationId: String(chuteId)`.
- **Chute GOAL:** Após o update de saldo (saldo, total_apostas, total_ganhos) e apenas se `chuteId` existir, são chamados dois `createLedgerEntry`:
  - `chute_aposta`: valor `-amount` (débito da aposta).
  - `chute_premio`: valor `premio + premioGolDeOuro` (crédito do prêmio, incluindo gol de ouro).

**Estratégia para GOAL:** Dois lançamentos (`chute_aposta` e `chute_premio`) em vez de um líquido. Vantagens: (1) reconstrução explícita da fórmula saldo_final = saldo_anterior - amount + premio + premioGolDeOuro; (2) auditoria por tipo (aposta vs prêmio); (3) alinhado ao que já existe para saque (múltiplos tipos). **Clara e auditável.**

**Referência única:** O id do registro em `chutes` (retornado pelo insert com `.select('id').single()`) é usado como `referencia` e `correlationId` para os ledgers do chute, garantindo um conjunto de lançamentos por chute e evitando duplicação em retries com o mesmo id.

---

## 4. Saldo preservado corretamente?

**Sim.**

- **GOAL:** Update em `usuarios` continua com `saldo: novoSaldoVencedor` (novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro), além de `total_apostas: totalApostasNovo` e `total_ganhos: totalGanhosNovo`. Ordem: update saldo → depois ledger.
- **MISS:** Update em `usuarios` com `saldo: novoSaldoPerdedor`, `total_apostas: totalApostasNovo`, lock otimista (`saldo = user.saldo`); depois ledger se `chuteId` existir.
- **Depósito (webhook e reconcile):** Ordem mantida: claim → update saldo → depois ledger. Falha no ledger não reverte saldo (apenas log de aviso), comportamento explícito do patch.

Nenhuma alteração na fórmula do saldo nem na ordem crítica (saldo antes de ledger onde aplicável).

---

## 5. Saque preservado?

**Sim.**

- O fluxo de saque em `server-fly.js` (POST `/api/withdraw/request`) não foi alterado pelo patch de reconciliação: continua usando `createLedgerEntry` para `withdraw_request`, e em falha chama `rollbackWithdraw`.
- O webhook de payout (POST `/webhooks/mercadopago`) continua usando `createLedgerEntry` para `payout_confirmado` e `falha_payout` e `rollbackWithdraw` quando aplicável.
- Nenhuma linha do patch modifica rotas de saque, payload de ledger de saque ou lógica de rollback.

**Conclusão:** Nenhuma regressão no saque.

---

## 6. Reconciliação melhorou?

**Sim.**

- **Antes (auditoria 2026-03-07):** Depósitos aprovados e chutes (miss/goal) alteravam `usuarios.saldo` sem registro em `ledger_financeiro`. A fórmula saldo_final = + depósitos - custos_chutes + prêmios - saques + rollbacks só era auditável agregando `pagamentos_pix`, `chutes`, `saques` e ledger (parcial).
- **Depois:** Todo crédito por depósito aprovado e todo débito/crédito por chute passam a ter contrapartida em `ledger_financeiro` (tipos `deposito_aprovado`, `chute_miss`, `chute_aposta`, `chute_premio`). A soma de `valor` em `ledger_financeiro` por usuário passa a refletir todos os movimentos de saldo (depósito, jogo, saque, rollback), permitindo fechamento e auditoria por uma única fonte (ledger) em conjunto com o saldo atual.

**Duplicidade:** Mitigada pela deduplicação em `createLedgerEntry` (correlation_id + tipo + referencia) e pelo uso de identificadores estáveis: id do pagamento para depósito e id do chute para jogo.

---

## 7. Ressalvas restantes

- **Falha parcial:** Se o insert em `ledger_financeiro` falhar após o update de saldo (depósito ou chute), o saldo já foi alterado e não é revertido; apenas é registrado um aviso em log. Cenário de divergência saldo vs ledger permanece possível e deve ser coberto por processo de reconciliação ou retry futuro.
- **Totalizadores:** `total_apostas` e `total_ganhos` foram **tratados** no patch (atualizados no Node no fluxo do chute), não deixados como ressalva. Dados históricos anteriores ao patch podem continuar desatualizados até a data da aplicação.

---

## 8. Classificação final

**VALIDADO COM RESSALVAS**

O patch atinge o objetivo: depósitos aprovados e jogo (miss e goal) passam a gerar trilha auditável em `ledger_financeiro`, sem alterar a lógica de saldo já validada, sem regredir o saque e com idempotência que mitiga duplicidade. A estratégia de dois lançamentos para GOAL (chute_aposta e chute_premio) é clara e auditável. A reconciliação financeira da V1 fica mais completa; a única ressalva operacional relevante é o risco de falha parcial (saldo atualizado e ledger não), já documentada e aceita no desenho do patch.

---

## Referências

- [PATCH-CIRURGICO-RECONCILIACAO-FINANCEIRA-2026-03-07.md](PATCH-CIRURGICO-RECONCILIACAO-FINANCEIRA-2026-03-07.md)
- [AUDITORIA-SUPREMA-RECONCILIACAO-FINANCEIRA-READONLY-2026-03-07.md](AUDITORIA-SUPREMA-RECONCILIACAO-FINANCEIRA-READONLY-2026-03-07.md)
- [ROLLBACK-PATCH-RECONCILIACAO-FINANCEIRA-2026-03-07.md](ROLLBACK-PATCH-RECONCILIACAO-FINANCEIRA-2026-03-07.md)
