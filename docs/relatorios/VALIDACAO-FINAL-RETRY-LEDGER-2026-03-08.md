# VALIDAÇÃO FINAL — RETRY AUTOMÁTICO DE LEDGER

**Data:** 2026-03-08  
**Modo:** READ-ONLY  
**Objetivo:** Validar se o mecanismo de reconciliação automática / retry de ledger foi implementado com segurança.

---

## 1. Patch encontrado

**Evidência:** O patch está presente.

| Item | Local | Evidência |
|------|--------|-----------|
| Módulo de reconciliação | src/domain/ledger/reconcileMissingLedger.js | Arquivo existe; exporta runReconcileMissingLedger e ledgerExists. |
| Integração no servidor | server-fly.js | Linha 27: require de reconcileMissingLedger. Linhas 2969–3005: rota POST /api/admin/reconcile-ledger com authenticateToken, verificação tipo admin, chamada a runReconcileMissingLedger({ supabase, createLedgerEntry }) e resposta com report. |

**Conclusão:** Patch encontrado e integrado.

---

## 2. Detecção implementada?

**Sim.** A lógica de detecção está em runReconcileMissingLedger.

| Caso | Implementação |
|------|----------------|
| Pagamentos aprovados sem ledger | SELECT em pagamentos_pix com status 'approved' (linhas 53–56). Para cada registro, ledgerExists(supabase, ref, 'deposito_aprovado') (65–66). Se não existir, conta em report.deposits.found e prossegue para retry. |
| Chutes miss sem ledger | SELECT em chutes com resultado 'miss' (91–94). Para cada registro, ledgerExists(supabase, ref, 'chute_miss') (102–103). Se não existir, report.miss.found e retry. |
| Chutes goal sem ledger de aposta | SELECT em chutes com resultado 'goal' (126–129). Para cada registro, hasAposta = ledgerExists(supabase, ref, 'chute_aposta') (140). Se !hasAposta, report.goal.found e retry para chute_aposta. |
| Chutes goal sem ledger de prêmio | Mesmo loop de chutes goal; hasPremio = ledgerExists(supabase, ref, 'chute_premio') (141). Se !hasPremio, retry para chute_premio. |

ledgerExists consulta ledger_financeiro por referencia e tipo (SELECT id, limit 1, maybeSingle). Não há detecção de saldo divergente, rollback ou saque; apenas depósitos aprovados e chutes (miss/goal).

**Conclusão:** Detecção implementada para os quatro casos obrigatórios.

---

## 3. Retry implementado?

**Sim.**

- **Função usada:** createLedgerEntry, recebida por parâmetro e passada pelo server-fly (mesmo createLedgerEntry de processPendingWithdrawals).
- **Depósito:** createLedgerEntry({ tipo: 'deposito_aprovado', usuarioId: p.usuario_id, valor, referencia: ref, correlationId: ref }) com ref = String(p.id).
- **Chute miss:** createLedgerEntry({ tipo: 'chute_miss', usuarioId: c.usuario_id, valor: -amount, referencia: ref, correlationId: ref }) com ref = String(c.id).
- **Chute goal (aposta):** createLedgerEntry({ tipo: 'chute_aposta', usuarioId: c.usuario_id, valor: -amount, referencia: ref, correlationId: ref }).
- **Chute goal (prêmio):** createLedgerEntry({ tipo: 'chute_premio', usuarioId: c.usuario_id, valor: premioTotal, referencia: ref, correlationId: ref }).

Referências estáveis: id do pagamento (pagamentos_pix.id) para depósito; id do chute (chutes.id) para todos os tipos de chute. correlationId igual à referencia em todos os casos, alinhado ao fluxo original e à deduplicação.

**Conclusão:** Retry implementado com createLedgerEntry e referências estáveis corretas.

---

## 4. Deduplicação preservada?

**Sim.**

- runReconcileMissingLedger não implementa própria lógica de insert no ledger; usa exclusivamente createLedgerEntry.
- createLedgerEntry (processPendingWithdrawals) faz SELECT por (correlation_id, tipo, referencia) antes do insert; se existir linha, retorna { success: true, deduped: true } e não insere.
- O módulo de reconciliação usa a mesma trinca (referencia = correlationId = id do pagamento ou do chute; tipo conforme o evento). Portanto, segunda execução ou race com o fluxo original resulta em deduped, sem segunda linha no ledger.
- O relatório distingue created e deduped (deposits.created/deduped, miss.created/deduped, goal.apostaCreated/premioCreated/deduped).

**Conclusão:** Deduplicação permanece garantida pelo uso exclusivo de createLedgerEntry e pelas referências estáveis.

---

## 5. Saldo ficou protegido?

**Sim.**

- O módulo reconcileMissingLedger.js não contém nenhum UPDATE ou INSERT em usuarios; não acessa a coluna saldo.
- As únicas escritas são indiretas, via createLedgerEntry, que insere apenas em ledger_financeiro.
- O comentário no topo do módulo e na rota em server-fly explicita: "NÃO altera saldo; apenas recompõe ledger faltante".

**Conclusão:** O retry não altera saldo; saldo permanece protegido.

---

## 6. Houve regressão?

**Não.**

- Fluxos de depósito (webhook, reconcile), chute (shoot) e saque (withdraw request, webhook payout, rollback) não foram alterados; apenas foi adicionada uma rota nova e um módulo novo.
- O módulo de reconciliação não importa nem chama funções de saque (rollbackWithdraw, processPendingWithdrawals, etc.); não lê nem escreve na tabela saques.
- createLedgerEntry não foi alterado; é o mesmo exportado por processPendingWithdrawals.
- A rota /api/admin/reconcile-ledger é apenas mais uma rota; exige JWT e tipo admin e não substitui nenhuma rota existente.

**Conclusão:** Nenhuma regressão identificada no fluxo financeiro principal.

---

## 7. Casos fora do escopo bem definidos?

**Sim.**

- No cabeçalho do módulo (linhas 11–12): "Não corrige automaticamente: saldo divergente da soma do ledger, rollback inconsistente, ou qualquer caso ambíguo."
- O código só trata: (1) pagamentos_pix aprovados sem ledger deposito_aprovado, (2) chutes miss sem chute_miss, (3) chutes goal sem chute_aposta e/ou chute_premio.
- Não há lógica para: comparar saldo com soma do ledger, verificar ou preencher ledger de rollback de saque, nem para qualquer outro tipo de ledger (withdraw_request, payout_confirmado, falha_payout). Casos ambíguos ou que exijam correção de saldo não são corrigidos automaticamente.

**Conclusão:** Casos fora do escopo estão documentados e o código limita-se ao retry seguro de depósito e chute.

---

## 8. Logs e relatório

- **Durante o retry:** Para cada falha de createLedgerEntry, console.warn com ref e error (deposito_aprovado, chute_miss).
- **Ao final:** console.log('[RECONCILE-LEDGER] Concluído', { deposits, miss, goal }) com o objeto report.
- **Resposta HTTP:** O endpoint retorna 200 com body { success: true, message, report }, sendo report = { runAt, deposits: { found, created, deduped, failed }, miss: { ... }, goal: { found, apostaCreated, premioCreated, deduped, failed } }.

**Conclusão:** Logs e relatório do processamento existem e permitem auditar quantos foram encontrados, criados, deduplicados e falharam.

---

## 9. Classificação final

**VALIDADO COM RESSALVAS**

- O patch está presente e integrado (módulo + endpoint admin).
- A detecção cobre pagamentos aprovados sem ledger e chutes miss/goal sem ledger (aposta e prêmio).
- O retry usa createLedgerEntry com referências estáveis (id do pagamento, id do chute) e mantém a deduplicação.
- O retry não altera saldo e não interfere em saque; não há alteração dos fluxos financeiros principais.
- Casos fora do escopo (saldo divergente, rollback, ambíguos) estão explícitos e não são corrigidos automaticamente.
- Logs e relatório permitem observabilidade.

**Ressalvas:** (1) A reconciliação só é executada quando o endpoint é chamado (por admin ou cron externo); não há job periódico embutido. (2) Em ambiente com muitos registros, a varredura completa de pagamentos_pix e chutes pode ser pesada; não há paginação neste patch.

---

## Referências

- [PATCH-CIRURGICO-RETRY-LEDGER-2026-03-08.md](PATCH-CIRURGICO-RETRY-LEDGER-2026-03-08.md)
- [AUDITORIA-SUPREMA-LEDGER-FINANCEIRO-2026-03-08.md](AUDITORIA-SUPREMA-LEDGER-FINANCEIRO-2026-03-08.md)
