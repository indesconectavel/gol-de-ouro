# AUDITORIA READ-ONLY — BLOCO D: SISTEMA DE SALDO — GOL DE OURO V1

**Data:** 2026-03-07  
**Modo:** Somente leitura (sem alteração de código, banco, patch, migração ou deploy)  
**Entrypoint considerado:** `server-fly.js` (produção Fly.io)  
**Banco:** Supabase | **Gateway:** Mercado Pago  

---

## 1. ENTRYPOINT E ROTAS REAIS ENVOLVIDAS NO SALDO

### 1.1 Arquivos que participam do sistema de saldo em produção

| Arquivo | Uso no saldo |
|--------|----------------|
| **server-fly.js** | Único entrypoint; contém rotas de auth, perfil, chute, saque, PIX e webhooks. Todas as escritas de saldo/ledger usadas em produção passam por aqui. |
| **src/domain/payout/processPendingWithdrawals.js** | `createLedgerEntry`, `rollbackWithdraw`; importado por server-fly.js (linhas 21–26). Usado em: saque (ledger), rollback (saldo + ledger). |
| **src/domain/payout/withdrawalStatus.js** | Constantes de status (pendente, processando, concluido, rejeitado); usado por processPendingWithdrawals. |
| **services/pix-mercado-pago.js** | `createPixWithdraw`; usado pelo worker de payout e indiretamente pelo fluxo de saque. |
| **config/system-config.js** | `calculateInitialBalance`; usado em registro e login para saldo inicial (0 em produção). |
| **database/supabase-unified-config.js** | Cliente Supabase usado por server-fly.js. |
| **utils/pix-validator.js**, **utils/lote-integrity-validator.js**, **utils/webhook-signature-validator.js** | Validação de dados de saque e integridade de lote antes/depois do chute. |

**Não utilizados pelo server-fly.js (rotas/controllers legados):**  
`router.js`, `router-producao.js`, `controllers/paymentController.js`, `controllers/gameController.js`, `routes/paymentRoutes.js`, `routes/adminRoutes.js` — não são montados no entrypoint; o fluxo real está inline em server-fly.js.

---

## 2. DEPÓSITO PIX — COMO O SALDO É CREDITADO

### 2.1 Rota e fluxo real

- **Criar cobrança:** `POST /api/payments/pix/criar` (autenticado)  
  - **Arquivo:** server-fly.js, aprox. linhas 1692–1852.  
  - Chama Mercado Pago `POST /v1/payments` com `X-Idempotency-Key` único.  
  - Insere em **pagamentos_pix**: usuario_id, external_id, payment_id, amount, valor, status 'pending', qr_code, etc.  
  - **Saldo:** não é alterado na criação.

- **Webhook de confirmação:** `POST /api/payments/webhook`  
  - **Arquivo:** server-fly.js, aprox. linhas 1955–2091.  
  - Responde 200 logo (linha 1990).  
  - Se `type === 'payment'` e `data.id`: consulta MP; se `status === 'approved'`:  
    - **Idempotência:** update em **pagamentos_pix** com `.neq('status', 'approved')` por payment_id ou external_id; `.select()` retorna 1 linha só se o update afetar exatamente um registro ("claim atômico").  
    - **Crédito de saldo:** se `claimed`: lê `usuarios.saldo` do usuário do registro, calcula `novoSaldo = saldo + (amount ?? valor)`, faz `update usuarios set saldo = novoSaldo` where id = usuario_id do PIX (linhas 2068–2081).  
  - **Proteção contra duplicidade:** o claim (update com `.neq('status','approved')`) garante que apenas um processamento credita; se já estiver approved, retorna sem creditar (linhas 2005–2011).  
  - **Ledger/transacoes:** não há insert em **ledger_financeiro** nem em **transacoes** no depósito PIX no server-fly.js.

- **Reconciliação (fallback):** função `reconcilePendingPayments()` (linhas 2345–2431), agendada por `setInterval` se `MP_RECONCILE_ENABLED !== 'false'`. Lista **pagamentos_pix** com status 'pending' e created_at anterior a `MP_RECONCILE_MIN_AGE_MIN`; para cada um consulta MP; se approved, faz o mesmo claim (update por id com `.neq('status','approved')`) e, se 1 linha afetada, credita **usuarios.saldo** da mesma forma. Não escreve em ledger/transacoes.

### 2.2 Evidência resumida

| Etapa | Arquivo | Função/trecho | Tabela | Campo | Operação | Valor/direção |
|-------|---------|----------------|--------|-------|----------|----------------|
| Criar PIX | server-fly.js | POST /api/payments/pix/criar | pagamentos_pix | status, amount, valor, etc. | INSERT | status pending |
| Aprovar (webhook) | server-fly.js | webhook type=payment, status=approved | pagamentos_pix | status, updated_at | UPDATE | status = approved |
| Creditar saldo | server-fly.js | mesmo bloco do webhook | usuarios | saldo | UPDATE | saldo += valor do PIX |
| Reconciliação | server-fly.js | reconcilePendingPayments | pagamentos_pix, usuarios | status, saldo | UPDATE | idem ao webhook |

**Condição de execução do crédito:** MP retorna status approved e o claim (update com neq status approved) afeta exatamente 1 linha.  
**Dependência de status MP:** sim; crédito só após approved.  
**Idempotência:** sim, via claim atômico.  
**Lacuna:** depósito aprovado não gera registro em **ledger_financeiro** nem **transacoes** no código inspecionado.

---

## 3. CHUTE — DÉBITO DE SALDO (R$ 1,00)

### 3.1 Endpoint e ordem das operações

- **Endpoint:** `POST /api/games/shoot` (autenticado).  
- **Arquivo:** server-fly.js, aprox. linhas 1156–1376.

**Ordem no código:**

1. Validação de direction e amount (V1: amount === 1).  
2. Leitura de **usuarios.saldo** (linhas 1318–1324); se saldo < amount, retorna 400 "Saldo insuficiente".  
3. `getOrCreateLoteByValue(amount)` (lote em memória).  
4. Validação de integridade do lote (loteIntegrityValidator) antes do chute.  
5. Cálculo de resultado: `shotIndex = lote.chutes.length`, `isGoal = (shotIndex === lote.winnerIndex)` (gol no 10º chute), `result = isGoal ? 'goal' : 'miss'`.  
6. Prêmio: se goal, premio = 5, e se contador global múltiplo de 1000, premioGolDeOuro = 100.  
7. Inclusão do chute no array em memória do lote.  
8. **INSERT em tabela `chutes`** (linhas 1329–1343): usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index.  
9. **Ajuste de saldo no Node:** apenas se **isGoal** (linhas 1345–1359):  
   - `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`  
   - `update usuarios set saldo = novoSaldoVencedor` where id = userId.

**Comentário no código (linhas 1344–1348):**  
"Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente. Vitórias: gatilho do banco credita apenas o prêmio; subtrair manualmente o valor da aposta apenas quando houver gol."

### 3.2 Conclusão sobre débito

- **Chute perdido (miss):** o código Node **não** faz update em **usuarios.saldo**. O débito de R$ 1,00 está delegado a um **trigger no banco** (comentário no código).  
- **Chute vencedor (goal):** o trigger (quando existe) credita premio + premio_gol_de_ouro; o Node sobrescreve o saldo com o valor correto (saldo - aposta + prêmios), evitando dupla cobrança da aposta.  
- **Atomicidade:** não há transação explícita no Node envolvendo insert em chutes + update em usuarios. Se o insert em chutes falhar após a validação de saldo, não há débito. Se o insert funcionar e o trigger não existir, no caso de **miss** o saldo não é debitado (risco identificado).  
- **Mesmo jogador no mesmo lote:** o lote é por valor e por "vaga" (chutes.length); o mesmo usuario_id pode aparecer várias vezes no mesmo lote_id; a engine (winnerIndex = 9, 10 chutes) e o insert suportam isso. Nenhum trecho inspecionado assume "10 jogadores únicos".

### 3.3 Evidência

| Evento | Arquivo | Linhas aprox. | Tabela | Campo | Operação | Regra/valor |
|--------|---------|----------------|--------|-------|----------|--------------|
| Validação saldo | server-fly.js | 1318–1331 | usuarios | saldo | SELECT | saldo >= amount |
| Registro chute | server-fly.js | 1329–1343 | chutes | valor_aposta, resultado, premio, etc. | INSERT | R$ 1, goal/miss |
| Débito (goal) | server-fly.js | 1346–1358 | usuarios | saldo | UPDATE | saldo - 1 + premio + premioGolDeOuro |
| Débito (miss) | (banco) | — | usuarios | saldo | UPDATE | Esperado por trigger; não há update no Node |

**Risco:** Se o schema em produção **não** tiver o trigger que em INSERT em chutes faz `saldo = saldo - valor_aposta` para resultado 'miss', os chutes perdidos **não** debitam saldo.

---

## 4. CHUTE VENCEDOR E GOL DE OURO

### 4.1 Onde é identificado o 10º chute e o vencedor

- No Node: `shotIndex = lote.chutes.length` (antes de push), `isGoal = (shotIndex === lote.winnerIndex)` com `winnerIndex = config.size - 1` (9 para size 10). Ou seja, o 10º chute (índice 9) é o gol.  
- Gol de ouro: `isGolDeOuro = (contadorChutesGlobal % 1000 === 0)` (linhas 1176–1177).  
- Prêmio: goal → premio = 5; se isGolDeOuro → premioGolDeOuro = 100.  
- Crédito de prêmio no saldo: no Node apenas no caso goal, em um único update: `saldo = user.saldo - amount + premio + premioGolDeOuro`. O trigger (quando existe) em schema-supabase-final.sql credita `saldo + premio + premio_gol_de_ouro`; o Node então sobrescreve com o valor correto (incluindo desconto da aposta).  
- **Ledger/transacoes:** no server-fly.js não há insert em **ledger_financeiro** nem **transacoes** para chute, prêmio ou gol de ouro.  
- Modelagem "10 chutes, mesmo jogador pode chutar várias vezes": compatível; não há lógica que exija 10 usuários distintos.

### 4.2 Schemas no repositório

- **schema-supabase-final.sql:** contém a função `update_user_stats()` e o trigger `trigger_update_user_stats` em **chutes** (AFTER INSERT): para goal credita premio + premio_gol_de_ouro em usuarios.saldo e total_ganhos; para miss debita valor_aposta em usuarios.saldo.  
- **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:** não define trigger que altere **usuarios.saldo** em INSERT em chutes; apenas triggers de `update_updated_at_column()` em várias tabelas.  
Qual schema está aplicado em produção não foi possível comprovar (auditoria read-only).

---

## 5. SAQUE — DÉBITO E REGISTRO

### 5.1 Endpoint e fluxo

- **Endpoint:** `POST /api/withdraw/request` (autenticado).  
- **Arquivo:** server-fly.js, aprox. linhas 1383–1628.

**Ordem:**

1. Validação (PixValidator), valor mínimo R$ 10.  
2. **Idempotência:** busca em **saques** por `correlation_id` (x-idempotency-key ou x-correlation-id ou UUID); se existir, retorna o saque existente (200).  
3. Bloqueio de duplicidade: se existir saque do usuário com status 'pendente' ou 'pending', retorna 409.  
4. Leitura de **usuarios.saldo**; se saldo < valor solicitado, retorna 400.  
5. **Débito de saldo:** `novoSaldo = saldo - requestedAmount`; update em **usuarios** com `.eq('saldo', usuario.saldo)` (otimistic lock) e `.select('saldo').single()`. Se nenhuma linha afetada (concorrência), retorna 409 "Saldo atualizado recentemente".  
6. **INSERT em saques:** usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status 'pendente', created_at.  
7. Se insert falhar: rollback do saldo (update usuarios set saldo = usuario.saldo).  
8. **Ledger:** `createLedgerEntry({ tipo: 'withdraw_request', usuarioId, valor: -requestedAmount, referencia: saque.id, correlationId })`. Se falhar, chama `rollbackWithdraw` e retorna 500.

### 5.2 Evidência

| Evento | Arquivo | Linhas aprox. | Tabela | Campo | Operação | Valor/direção |
|--------|---------|----------------|--------|-------|----------|----------------|
| Idempotência | server-fly.js | 1471–1502 | saques | — | SELECT | correlation_id |
| Bloqueio pendente | server-fly.js | 1505–1523 | saques | status | SELECT | pendente/pending |
| Débito saldo | server-fly.js | 1517–1532 | usuarios | saldo, updated_at | UPDATE | saldo - requestedAmount |
| Criar saque | server-fly.js | 1536–1554 | saques | status, amount, etc. | INSERT | status pendente |
| Ledger | processPendingWithdrawals.js / server-fly | 1575–1598 | ledger_financeiro | tipo, valor, referencia, correlation_id | INSERT | withdraw_request, valor negativo |

**Worker real:** o processamento do saque (envio ao MP) é feito pelo processo **payout_worker** (`node src/workers/payout-worker.js`), que chama `processPendingWithdrawals`; não é chamado dentro do server-fly.js em um setInterval; o server-fly apenas expõe a rota de solicitação e o webhook de confirmação.

---

## 6. ROLLBACK DE SAQUE

### 6.1 Onde o saldo volta

- **Função:** `rollbackWithdraw` em **src/domain/payout/processPendingWithdrawals.js** (linhas 138–212).  
- **Chamadas no server-fly.js:**  
  - Linha 1591: quando createLedgerEntry do withdraw_request falha (após débito e insert do saque).  
- **Chamadas no webhook de payout:** linhas 2238–2248: quando status do MP é rejected/cancelled.  
- **Chamadas no worker:** em processPendingWithdrawals.js quando payout falha ou correlation_id ausente (rollback e, em rejeição MP, via webhook).

**Passos do rollback:**

1. SELECT saldo do usuario.  
2. UPDATE **usuarios** set saldo = saldo + amount, updated_at.  
3. createLedgerEntry tipo 'rollback', valor positivo, referencia = saqueId.  
4. Se fee > 0, createLedgerEntry tipo 'rollback', referencia = saqueId+:fee.  
5. UPDATE **saques** set status = REJECTED, processed_at, motivo_rejeicao.

**Riscos verificados:**

- Rollback restaura saldo e depois cria ledger; se o segundo createLedgerEntry falhar, o saldo já foi restaurado (não há reversão do saldo nesse caso).  
- Não foi encontrada deduplicação explícita de rollback por saqueId no código (evitar rodar rollback duas vezes no mesmo saque); a idempotência de createLedgerEntry é por (correlation_id, tipo, referencia). Para o mesmo saque, tipo 'rollback' e mesma referencia podem gerar apenas um registro se o correlationId for o mesmo.  
- Divergência status/saldo: se o update do saque para rejeitado falhar após restaurar saldo, o saque pode continuar "pendente" no banco com saldo já devolvido; depende de tratamento de erro (rollbackWithdraw retorna success: false nesse caso).

---

## 7. HISTÓRICO FINANCEIRO

### 7.1 Fontes no server-fly.js

- **GET /api/user/profile:** retorna saldo, total_apostas, total_ganhos de **usuarios** (leitura direta).  
- **GET /api/withdraw/history:** lista **saques** do usuario_id, ordenado por created_at; normaliza valor, fee, net_amount, status, pix_key, pix_type.  
- **GET /api/payments/pix/usuario:** lista **pagamentos_pix** do usuario_id.

Não existe no server-fly.js rota que agregue **ledger_financeiro** ou **transacoes** para o usuário (ex.: não há equivalente a `GET /api/user/ultimas-transacoes` no entrypoint). O histórico exibido ao usuário vem de:  
- Saldo e totais: **usuarios**.  
- Saques: **saques**.  
- Depósitos: **pagamentos_pix**.  

Chutes/prêmios não têm rota de histórico financeiro unificado no server-fly; apenas a tabela **chutes** e, se existir, o trigger que atualiza total_apostas/total_ganhos em **usuarios**.

**Confiabilidade para auditoria:** depósitos e saques são rastreáveis por tabelas e, no saque, por ledger; já depósitos e chutes/prêmios não geram ledger no código inspecionado, o que dificulta uma reconciliação contábil completa apenas por ledger.

---

## 8. BANCO — TRIGGERS, FUNÇÕES SQL, AUTOMAÇÕES

### 8.1 Encontrado no repositório

- **schema-supabase-final.sql:**  
  - `update_global_metrics()`: AFTER INSERT em chutes → update metricas_globais (contador_chutes_global, ultimo_gol_de_ouro).  
  - `update_user_stats()`: AFTER INSERT em chutes → update usuarios (total_apostas; se goal: total_ganhos e saldo += premio + premio_gol_de_ouro; se miss: saldo -= valor_aposta).  
  - Triggers: trigger_update_metrics, trigger_update_user_stats em chutes.

- **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:**  
  - Apenas funções `update_updated_at_column()` e triggers de updated_at em usuarios, metricas_globais, lotes, pagamentos_pix, saques, configuracoes_sistema.  
  - **Nenhum** trigger em chutes que altere **usuarios.saldo**.

- **database/schema-completo.sql, schema-supabase.sql, etc.:** triggers apenas de updated_at; nenhum que altere saldo em chutes encontrado nesses arquivos.

### 8.2 Dupla escrita (trigger + código Node)

Para **chute vencedor (goal):**

1. INSERT em chutes dispara o trigger (se existir) → saldo = saldo + premio + premio_gol_de_ouro.  
2. Node faz update usuarios set saldo = user.saldo - amount + premio + premioGolDeOuro (com user.saldo lido **antes** do insert).  

O valor final fica correto porque o Node sobrescreve com a fórmula certa. Porém há **dupla escrita** no mesmo campo (trigger + update no Node), o que é um **risco de manutenção e consistência** (por exemplo, se o trigger mudar ou não existir em outro ambiente).

Para **chute perdido (miss):** apenas o trigger (quando existe) debita; não há update no Node.

---

## 9. INVENTÁRIO GLOBAL DE ESCRITAS FINANCEIRAS

| Evento | Arquivo / função | Tabela | Campo | Operação | Valor/direção | Evidência (linhas aprox.) |
|--------|------------------|--------|-------|----------|----------------|----------------------------|
| Registro usuário | server-fly.js, POST /api/auth/register | usuarios | saldo | INSERT | calculateInitialBalance (0) | 524–532 |
| Login saldo inicial | server-fly.js, POST /api/auth/login | usuarios | saldo | UPDATE | calculateInitialBalance (0) se saldo 0/null | 947–958 |
| Depósito PIX aprovado (webhook) | server-fly.js, POST /api/payments/webhook | pagamentos_pix | status | UPDATE | approved | 2016–2034 |
| Depósito PIX aprovado (webhook) | server-fly.js, idem | usuarios | saldo | UPDATE | + valor PIX | 2073–2081 |
| Reconciliação PIX | server-fly.js, reconcilePendingPayments | pagamentos_pix, usuarios | status, saldo | UPDATE | approved, + valor | 2369–2391 |
| Chute (INSERT) | server-fly.js, POST /api/games/shoot | chutes | valor_aposta, resultado, premio, etc. | INSERT | 1, goal/miss, premios | 1329–1343 |
| Chute perdido (débito) | Trigger (schema-supabase-final) | usuarios | saldo | UPDATE | - valor_aposta | Trigger update_user_stats |
| Chute vencedor (saldo) | server-fly.js, POST /api/games/shoot | usuarios | saldo | UPDATE | -1 + premio + premioGolDeOuro | 1346–1358 |
| Chute (trigger goal) | Trigger (schema-supabase-final) | usuarios | saldo, total_ganhos | UPDATE | + premio + premio_gol_de_ouro | trigger_update_user_stats |
| Saque solicitação | server-fly.js, POST /api/withdraw/request | usuarios | saldo | UPDATE | - requestedAmount | 1519–1526 |
| Saque solicitação | server-fly.js, idem | saques | — | INSERT | status pendente | 1536–1552 |
| Saque solicitação | processPendingWithdrawals / server-fly | ledger_financeiro | tipo, valor, referencia | INSERT | withdraw_request, negativo | 1575–1598, createLedgerEntry |
| Rollback saque | processPendingWithdrawals.js, rollbackWithdraw | usuarios | saldo | UPDATE | + amount | 155–158 |
| Rollback saque | processPendingWithdrawals.js, idem | ledger_financeiro | tipo, valor | INSERT | rollback, positivo | 166–184 |
| Rollback saque | processPendingWithdrawals.js, idem | saques | status | UPDATE | rejeitado | 194–205 |
| Webhook payout aprovado | server-fly.js, POST /webhooks/mercadopago | ledger_financeiro | — | INSERT | payout_confirmado, valor líquido | 2190–2202 |
| Webhook payout aprovado | server-fly.js, idem | saques | status, processed_at, transacao_id | UPDATE | concluido | 2206–2214 |
| Webhook payout rejeitado | server-fly.js, idem | ledger_financeiro, usuarios, saques | — | insert + rollbackWithdraw | falha_payout, rollback | 2238–2251 |

---

## 10. RECONCILIAÇÃO CONTÁBIL

**Fórmula desejada:**  
saldo_final = + depósitos_aprovados - custos_chutes + prêmios - saques_solicitados/confirmados + rollbacks ± ajustes.

**Situação:**

- **Depósitos:** não há registro em ledger_financeiro nem em transacoes no código do server-fly; só em **pagamentos_pix** (status approved) e **usuarios.saldo**.  
- **Chutes (débito e prêmio):** não há registro em ledger_financeiro nem em transacoes; só **chutes** e **usuarios** (saldo, total_apostas, total_ganhos).  
- **Saques:** há ledger (withdraw_request, payout_confirmado, falha_payout, rollback) e updates em **usuarios** e **saques**.

**Conclusão:** **PARCIALMENTE reconciliável.** Para saques, o ledger permite conferência; para depósitos e jogo (chutes/prêmios), a reconciliação teria de ser feita por **pagamentos_pix** + **chutes** + **usuarios**, não por um único livro-razão (ledger/transacoes) completo.

---

## 11. RISCOS VERIFICADOS (RESPOSTAS OBJETIVAS)

| Risco | Resposta |
|-------|----------|
| Crédito duplicado por webhook | Mitigado pelo claim atômico (update com neq status approved; só 1 linha afetada). |
| Chute sem débito | **Sim:** se o trigger que debita em miss não existir no banco (ex.: schema consolidado v1.2.0), chute perdido não debita. |
| Débito sem chute | Improvável: débito de miss é só por trigger após insert; débito de goal é no mesmo fluxo do insert. |
| Prêmio sem ledger | **Sim:** chute/prêmio não gera ledger no código inspecionado. |
| Ledger sem refletir saldo | Possível se update de saldo falhar após insert no ledger (ex.: rollback parcial). |
| Saldo refletir algo sem ledger | **Sim:** depósito e jogo alteram saldo sem inserir em ledger. |
| Saque duplicado | Mitigado por correlation_id (idempotência) e bloqueio de saque pendente. |
| Rollback duplicado | createLedgerEntry deduplica por (correlation_id, tipo, referencia); risco de rollback duplicado depende de reutilização de correlationId. |
| Divergência usuarios.saldo vs histórico | Possível: histórico é fragmentado (saques, pagamentos_pix, profile); não há uma única fonte "histórico = ledger". |
| Lógica presa a 10 jogadores únicos | **Não:** engine e insert permitem mesmo jogador várias vezes no lote. |
| Concorrência | Mitigado no saque por update com .eq('saldo', usuario.saldo); no chute não há lock otimista entre leitura e update (goal). |
| Retries | Webhook responde 200 antes de processar; retry do MP pode reenviar; idempotência por claim evita crédito duplo no depósito. |
| Worker separado | Saque: saldo debitado na API; processamento no worker; se worker falhar, rollback pode ser acionado; risco de saque "pendente" por muito tempo. |
| Trigger + código escrevendo juntos | **Sim:** chute vencedor tem trigger (se existir) + update no Node em usuarios.saldo. |

---

## 12. ARQUIVOS LEGADOS / NÃO USADOS PELO ENTRYPOINT

- **server-fly-deploy.js:** outro entrypoint; não inspecionado como "produção" nesta auditoria.  
- **router.js, router-producao.js:** não montados em server-fly.js.  
- **controllers/paymentController.js, gameController.js, usuarioController.js:** não usados; server-fly tem lógica inline.  
- **routes/paymentRoutes.js, adminRoutes.js:** não montados.  
- **services/history-service.js, services/pix-service-real.js:** não referenciados no server-fly para o fluxo de saldo/PIX usado no entrypoint.  

Listagem completa de arquivos que tocam saldo/ledger/transacoes está no inventário da seção 9 e no grep utilizado na auditoria.

---

**Fim do relatório — auditoria read-only, sem alterações aplicadas.**
