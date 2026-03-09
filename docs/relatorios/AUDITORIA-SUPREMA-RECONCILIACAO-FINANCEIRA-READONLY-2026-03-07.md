# AUDITORIA SUPREMA DE RECONCILIAÇÃO FINANCEIRA — GOL DE OURO V1

**Data:** 2026-03-07  
**Modo:** READ-ONLY — inspeção, mapeamento e comprovação; nenhuma alteração de código ou banco.  
**Objetivo:** Confirmar se o sistema financeiro da V1 é reconciliável ponta a ponta segundo a fórmula:

saldo_final_usuario = + depósitos_aprovados - custos_de_chutes + prêmios - saques + rollbacks ± ajustes_legítimos

---

## 1. MAPEAMENTO DE FONTES FINANCEIRAS REAIS

### Produção real (entrypoint server-fly.js)

| Fluxo | Arquivo | Rota/Função | Tabelas | Observação |
|-------|---------|-------------|---------|-------------|
| Depósito PIX (criar) | server-fly.js | POST /api/payments/pix/criar | pagamentos_pix (INSERT) | Linhas 1809–1824 |
| Webhook PIX | server-fly.js | POST /api/payments/webhook | pagamentos_pix (UPDATE approved), usuarios (UPDATE saldo) | 2002–2092 |
| Reconciliação PIX | server-fly.js | reconcilePendingPayments() | pagamentos_pix (UPDATE), usuarios (UPDATE saldo) | 2336–2404, setInterval |
| Chute MISS | server-fly.js | POST /api/games/shoot (else) | chutes (INSERT), usuarios (UPDATE saldo) | 1357–1375 |
| Chute GOAL | server-fly.js | POST /api/games/shoot (if isGoal) | chutes (INSERT), usuarios (UPDATE saldo) | 1347–1356 |
| Gol de ouro | server-fly.js | mesmo handler (premioGolDeOuro no cálculo) | usuarios (UPDATE saldo no GOAL) | 1244–1246, 1348 |
| Saque (request) | server-fly.js | POST /api/withdraw/request | usuarios (UPDATE saldo), saques (INSERT), ledger_financeiro (INSERT withdraw_request) | 1532–1616 |
| Rollback saque | processPendingWithdrawals.js | rollbackWithdraw | usuarios (UPDATE saldo), ledger_financeiro (INSERT rollback), saques (UPDATE status) | 140–212 |
| Ledger (saque) | server-fly.js + processPendingWithdrawals | createLedgerEntry | ledger_financeiro | withdraw_request, payout_confirmado, falha_payout, rollback |
| Webhook payout | server-fly.js | POST /webhooks/mercadopago | saques (UPDATE), ledger_financeiro (INSERT) | 2152–2274 |
| Histórico saldo | server-fly.js | GET /api/user/profile | usuarios (SELECT) | 1011–1056 |
| Histórico saques | server-fly.js | GET /api/withdraw/history | saques (SELECT) | 1647–1688 |
| Histórico depósitos | server-fly.js | GET /api/payments/pix/usuario | pagamentos_pix (SELECT) | 1873–1887 |

### Legado / não usado pelo server-fly.js

| Fluxo | Arquivo | Observação |
|-------|---------|------------|
| transacoes (INSERT) | controllers/paymentController.js | Rotas não montadas no server-fly; depósito no controller insere transacoes, mas esse fluxo não é o de produção. |
| analytics/transacoes | src/ai/analytics-ai.js | Apenas leitura; não define escrita em produção. |

---

## 2. INVENTÁRIO TOTAL DE ESCRITAS FINANCEIRAS

| Evento | Arquivo / função | Tabela | Campo | Operação | Valor/direção | Gera ledger? | Condição |
|--------|------------------|--------|-------|----------|----------------|--------------|----------|
| Registro usuário | server-fly.js | usuarios | saldo, total_apostas, total_ganhos | INSERT | 0 | Não | — |
| Login saldo inicial | server-fly.js | usuarios | saldo | UPDATE | calculateInitialBalance | Não | saldo 0 ou null |
| Criar PIX | server-fly.js | pagamentos_pix | status, amount, valor, etc. | INSERT | pending | Não | — |
| Webhook PIX approved | server-fly.js | pagamentos_pix | status | UPDATE | approved | Não | claim 1 linha |
| Webhook PIX approved | server-fly.js | usuarios | saldo | UPDATE | + valor PIX | Não | após claim |
| Reconciliação PIX | server-fly.js | pagamentos_pix, usuarios | status, saldo | UPDATE | approved, + valor | Não | MP approved, claim por id |
| Chute INSERT | server-fly.js | chutes | valor_aposta, resultado, premio, etc. | INSERT | 1, goal/miss | Não | — |
| Chute GOAL | server-fly.js | usuarios | saldo | UPDATE | -1 + premio + premioGolDeOuro | Não | isGoal |
| Chute MISS | server-fly.js | usuarios | saldo | UPDATE | -1 | Não | !isGoal |
| Saque request | server-fly.js | usuarios | saldo | UPDATE | - valor | Sim (withdraw_request) | lock otimista |
| Saque request | server-fly.js | saques | — | INSERT | status pendente | — | — |
| Saque request | server-fly.js | ledger_financeiro | tipo, valor, referencia | INSERT | withdraw_request, negativo | — | — |
| Rollback saque | processPendingWithdrawals | usuarios | saldo | UPDATE | + amount | Sim (rollback) | — |
| Rollback saque | processPendingWithdrawals | ledger_financeiro | tipo, valor | INSERT | rollback, positivo | — | — |
| Rollback saque | processPendingWithdrawals | saques | status | UPDATE | rejeitado | — | — |
| Webhook payout approved | server-fly.js | ledger_financeiro | — | INSERT | payout_confirmado, líquido | — | — |
| Webhook payout approved | server-fly.js | saques | status, processed_at | UPDATE | concluido | — | — |
| Webhook payout rejected | server-fly.js | ledger_financeiro | — | INSERT | falha_payout | — | — |
| Webhook payout rejected | server-fly.js | rollbackWithdraw | usuarios, ledger, saques | UPDATE/INSERT | restaura saldo, rollback | — | — |

**transacoes:** Nenhuma escrita no fluxo de produção (server-fly.js). Apenas paymentController (legado) e scripts escrevem ou leem transacoes.

---

## 3. RECONCILIAÇÃO DE DEPÓSITOS

- **Como entra:** Cliente chama POST /api/payments/pix/criar; backend cria pagamento no MP e insere em **pagamentos_pix** (status pending). MP notifica webhook ou reconciliação consulta MP; se approved, claim atômico (update pagamentos_pix com neq status approved) e update **usuarios.saldo** += valor.
- **Onde saldo é creditado:** server-fly.js webhook (2089–2092) e reconcilePendingPayments (2396–2399).
- **Há ledger?** Não. Nenhum insert em ledger_financeiro no fluxo de depósito.
- **Há transacoes?** Não no server-fly.js.
- **Risco crédito sem ledger?** Sim: todo crédito de depósito altera saldo sem registro em ledger.
- **Risco duplicidade?** Mitigado pelo claim atômico (update com neq approved; só 1 linha afetada).
- **Idempotência:** Sim (claim + early return se já approved).

---

## 4. RECONCILIAÇÃO DE JOGO

- **MISS debita:** server-fly.js (1359–1374): UPDATE usuarios SET saldo = user.saldo - amount com lock otimista; 409 se conflito.
- **GOAL credita (líquido):** server-fly.js (1347–1356): UPDATE saldo = user.saldo - amount + premio + premioGolDeOuro.
- **Gol de ouro:** Incluído em premioGolDeOuro (100) no mesmo UPDATE de GOAL; não há movimento separado.
- **Trilha auditável:** Cada chute gera uma linha em **chutes** (usuario_id, valor_aposta, resultado, premio, premio_gol_de_ouro). O saldo pode ser reconstruído somando/subtraindo a partir de chutes + saldo inicial + depósitos - saques.
- **Ledger para jogo?** Não. Nenhum insert em ledger_financeiro para chute (miss ou goal).
- **Saldo pode divergir dos chutes?** Teoricamente sim (falha após INSERT chutes e antes do UPDATE saldo, ou race); o lock otimista em MISS reduz risco de race. Não há transação atômica entre INSERT chutes e UPDATE usuarios.

---

## 5. RECONCILIAÇÃO DE SAQUES

- **Request:** Débito em usuarios (lock otimista), INSERT em saques (status pendente), createLedgerEntry(withdraw_request, valor negativo). Se ledger falha, rollbackWithdraw.
- **Payout confirmado (webhook):** createLedgerEntry(payout_confirmado, valor líquido), UPDATE saques (status concluido, processed_at, transacao_id).
- **Rollback:** rollbackWithdraw restaura usuarios.saldo, insere ledger rollback (valor positivo), UPDATE saques (rejeitado). Chamado quando ledger do request falha ou webhook rejected/cancelled ou worker falha.
- **Status finais:** pendente → processando → concluido ou rejeitado.
- **Saldo e ledger podem divergir?** Sim em cenários de falha: ex. update de saldo no rollback sucesso mas createLedgerEntry falha (saldo já restaurado, ledger sem rollback); ou inversão de ordem. Na prática o rollback faz saldo primeiro e depois ledger; se o segundo falhar, há divergência até correção manual.

---

## 6. HISTÓRICO FINANCEIRO

- **Saldo exibido:** GET /api/user/profile → SELECT usuarios (saldo, total_apostas, total_ganhos). Fonte: **usuarios**.
- **Depósitos exibidos:** GET /api/payments/pix/usuario → SELECT pagamentos_pix. Fonte: **pagamentos_pix**.
- **Saques exibidos:** GET /api/withdraw/history → SELECT saques. Fonte: **saques**.
- **Histórico unificado:** Não existe rota no server-fly.js que agregue ledger_financeiro ou transacoes para o usuário. Não há endpoint “últimas transações” ou “extrato” único.
- **Fonte única de verdade?** Não. O histórico é **fragmentado**: saldo e totais em usuarios, depósitos em pagamentos_pix, saques em saques; chutes em chutes (não expostos como “histórico financeiro” em uma única API). Ledger_financeiro existe apenas para saques (withdraw_request, payout_confirmado, falha_payout, rollback).

---

## 7. FÓRMULA DE FECHAMENTO

É possível fechar a conta de um usuário usando apenas banco e código reais, **agregando** várias tabelas:

- **Depósitos aprovados:** SUM(amount) em pagamentos_pix WHERE usuario_id = X AND status = 'approved'.
- **Custos de chutes:** SUM(valor_aposta) em chutes WHERE usuario_id = X.
- **Prêmios:** SUM(premio + premio_gol_de_ouro) em chutes WHERE usuario_id = X (ou WHERE resultado = 'goal').
- **Saques:** SUM(amount) em saques WHERE usuario_id = X AND status = 'concluido' (ou equivalente).
- **Rollbacks:** SUM(valor) em ledger_financeiro WHERE user_id/usuario_id = X AND tipo = 'rollback'.
- **Ajustes:** saldo inicial (registro/login), se houver; não há outra “ajuste” automático no código além de depósito, chute e saque/rollback.

Fórmula reconstruída:  
saldo_esperado = depositos_aprovados - custos_chutes + premios - saques_concluidos + rollbacks_ledger (+ saldo_inicial se aplicável).

O **saldo atual** em usuarios deve coincidir com saldo_esperado **se** não houver falhas parciais (ex. update saldo ok e insert ledger falhou, ou vice-versa). Não há garantia transacional entre todas as escritas.

**Decisão:** **PARCIALMENTE reconciliável.** É possível reconstruir e validar o saldo a partir das tabelas reais (pagamentos_pix, chutes, saques, ledger_financeiro, usuarios), mas não existe uma única “fonte de verdade” (ledger completo); depósitos e jogo não geram ledger; e o histórico exibido ao usuário é fragmentado (várias rotas, várias tabelas).

---

## 8. INCONSISTÊNCIAS OBRIGATÓRIAS

| Verificação | Resposta |
|-------------|----------|
| Saldo alterado sem ledger | Sim: depósito (crédito) e jogo (débito/crédito) alteram usuarios.saldo sem insert em ledger_financeiro. |
| Ledger sem reflexo no saldo | Possível: ex. rollback restaura saldo e depois createLedgerEntry falha; ou update saldo falha após ledger. |
| Depósitos sem ledger | Sim: nenhum ledger para depósito no código de produção. |
| Jogo sem ledger | Sim: nenhum ledger para chute (miss ou goal). |
| Risco divergência histórica | Sim: histórico vem de 3+ fontes (usuarios, pagamentos_pix, saques); não há “extrato” único auditável. |
| Risco relatórios enganarem | Sim se alguém assumir que “histórico = ledger” ou que “transacoes” reflete todos os movimentos; em produção transacoes não é preenchido pelo fluxo real. |
| Saldo “bate hoje” mas não auditável depois | Parcialmente: é auditável agregando pagamentos_pix + chutes + saques + ledger, mas o processo é manual e não há garantia de que não houve falha parcial em algum write. |

---

## 9. RISCO OCULTO PRINCIPAL

**Não existe uma fonte única de verdade para movimentos financeiros.** O saldo em **usuarios** é o resultado de escritas em vários fluxos (depósito, chute, saque, rollback) que não passam por um único livro-razão (ledger). Apenas o fluxo de **saque** gera ledger_financeiro; depósitos e jogo não. Para auditoria, disputa ou conformidade, é necessário agregar manualmente pagamentos_pix + chutes + saques + ledger_financeiro. Se uma tabela for perdida, corrompida ou alterada fora do fluxo, o fechamento fica incompleto ou inconsistente. Além disso, **total_apostas** e **total_ganhos** em usuarios não são atualizados pelo código de produção (eram atualizados pelo trigger que não existe em produção), podendo estar desatualizados em relação aos chutes reais.

---

## 10. DECISÃO TÉCNICA FINAL

- **O que precisa ser corrigido (para reconciliação plena):**  
  (1) Passar a registrar em ledger_financeiro (ou em transacoes) cada movimento que altera saldo: depósito aprovado (crédito), chute miss (débito), chute goal (débito da aposta + crédito de prêmio), de forma idempotente.  
  (2) Ou manter modelo atual e documentar oficialmente que a reconciliação é feita por agregação de pagamentos_pix + chutes + saques + ledger_financeiro, com procedimento e responsável definidos.

- **O que pode permanecer como ressalva:**  
  Histórico fragmentado (várias rotas/tabelas); ausência de ledger para depósito e jogo; total_apostas/total_ganhos possivelmente desatualizados; risco de falha parcial (saldo atualizado mas ledger não, ou vice-versa) em cenários de erro.

- **O que bloqueia validação financeira plena:**  
  A inexistência de uma única trilha auditável (ledger ou transacoes) que reflita todos os movimentos de saldo. Sem isso, “validação plena” depende de script ou processo que agregue as quatro fontes e compare com usuarios.saldo.

- **Próxima menor correção segura:**  
  Introduzir registros em **ledger_financeiro** (ou em **transacoes**) para depósito aprovado e para cada chute (tipo “deposito” / “chute_miss” / “chute_goal” com valor e referencia), sem alterar a lógica atual de update em usuarios.saldo, para que toda alteração de saldo tenha contrapartida auditável. Opcionalmente, atualizar total_apostas e total_ganhos no Node no handler de chute (incrementar em 1 e, se goal, somar premio+premio_gol_de_ouro) para alinhar aos dados de chutes.
