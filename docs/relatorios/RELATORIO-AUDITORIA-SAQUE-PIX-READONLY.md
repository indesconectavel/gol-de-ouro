# RELATÓRIO — AUDITORIA DE SAQUE PIX (READ-ONLY) — MISSÃO S-PIX

**Data:** 2026-02-05  
**Sistema:** Gol de Ouro · Produção real  
**Modo:** READ-ONLY TOTAL (nenhuma criação de saque, processamento de payout, execução de worker ou chamada de rollback).  
**Objetivo:** Auditar o fluxo de saque PIX garantindo: nenhum saque sem lastro, nenhum saldo negativo, nenhum double payout, rollback funcional.

---

## 1. Regras aplicadas

- **Proibido:** Criar saque, processar payout, executar worker, chamar rollback, qualquer escrita.
- **Permitido:** Leitura de código, SELECT no Supabase, leitura de logs.
- **Escopo:** Apenas descrever fatos e classificar riscos (🟢 Seguro / 🟡 Atenção / 🔴 Crítico). Não propor correções nem alterar código.

---

## 2. FASE 0 — Prova de localização (código)

### 2.1 Endpoint de solicitação de saque

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Rota | server-fly.js | 1372 | `POST /api/withdraw/request` (authenticateToken). |
| Body | server-fly.js | 1373-1379 | valor, chave_pix, tipo_chave; correlationId = x-idempotency-key \|\| x-correlation-id \|\| crypto.randomUUID(). |
| Validação | server-fly.js | 1383-1406 | PixValidator.validateWithdrawData; valor mínimo R$ 10; valor líquido (após taxa) > 0. |

### 2.2 Verificação de saldo

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Leitura de saldo | server-fly.js | 1474-1494 | SELECT usuarios.saldo por userId; rejeita se saldo < requestedAmount (400 Saldo insuficiente). |

### 2.3 Débito inicial (lock otimista)

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Update condicional | server-fly.js | 1505-1521 | update usuarios set saldo = novoSaldo onde id = userId e saldo = usuario.saldo (valor lido); .select('saldo').single(). Se 0 linhas ou erro → 409 "Saldo atualizado recentemente. Tente novamente." |

### 2.4 Criação de registro em `saques`

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| INSERT | server-fly.js | 1523-1571 | .from('saques').insert({ usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, chave_pix, tipo_chave, status: 'pendente', ... }).select().single(). Em falha: rollback de saldo (1550-1555). |

### 2.5 Escrita em `ledger_financeiro`

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Função | src/domain/payout/processPendingWithdrawals.js | 3-40 | createLedgerEntry(supabase, tipo, usuarioId, valor, referencia, correlationId): verifica se já existe (correlation_id + tipo + referencia); se não, INSERT. |
| Chamadas no request | server-fly.js | 1562-1612 | Primeiro ledger tipo 'saque' (referencia = saque.id); depois tipo 'taxa' (referencia = saque.id + ':fee'). Em falha de qualquer um: rollbackWithdraw e retorno 500. |

### 2.6 Worker de payout

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Entrada | src/workers/payout-worker.js | 54-97 | runCycle() chama processPendingWithdrawals; setInterval(intervalMs); flag running evita sobreposição. |
| Lógica | src/domain/payout/processPendingWithdrawals.js | 100-266 | Lista saques com status in ('pendente','pending'), limit 1, order created_at asc; lock: update status = 'processando' onde id = saqueId e status in ('pendente','pending'); se 0 linhas → "Tentativa duplicada ignorada". Chama createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId); sucesso → status 'aguardando_confirmacao'; falha → ledger falha_payout + rollbackWithdraw + status 'falhou'. |

### 2.7 Webhook de confirmação/falha

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Rota | server-fly.js | 2108-2281 | POST /webhooks/mercadopago (sem auth). Resposta 200 imediata (received: true). |
| Payload | server-fly.js | 2116-2133 | status, external_reference; external_reference = saqueId_correlationId. |
| Validação | server-fly.js | 2149-2175 | Busca saque por id; confere correlation_id; se status já processado/falhou retorna; idempotência: busca ledger por correlation_id + referencia + tipo in (payout_confirmado, falha_payout); se existe retorna. |
| approved/credited | server-fly.js | 2212-2227 | createLedgerEntry tipo payout_confirmado; update saques status = 'processado'. |
| rejected/cancelled | server-fly.js | 2232-2270 | createLedgerEntry tipo falha_payout; rollbackWithdraw; update saques status via rollback (falhou). |

### 2.8 Rollback

| Item | Arquivo | Linhas | Descrição |
|------|---------|--------|-----------|
| Função | src/domain/payout/processPendingWithdrawals.js | 42-97 | rollbackWithdraw(supabase, saqueId, userId, correlationId, amount, fee, motivo): lê usuarios.saldo; update saldo = saldo + amount; createLedgerEntry tipo 'rollback' (referencia saqueId e saqueId+:fee para taxa); update saques status = 'falhou'. |
| Uso | server-fly.js / processPendingWithdrawals.js | 1550-1555, 1574-1585, 1598-1608, 2252-2259; 241-243 | Em falha de INSERT saque; falha de ledger saque/taxa; webhook rejected/cancelled; worker quando payout falha. |

---

## 3. FASE 1 — Base de dados (READ-ONLY)

Fonte: script `scripts/audit-financeira-total-prod-readonly.js` (execução 2026-02-05).

### 3.1 Saques por status

| status   | count |
|----------|-------|
| cancelado | 2   |

**Total:** 2 registros em `saques`. Nenhum com status processado, pendente ou aguardando_confirmacao na amostra.

### 3.2 Saques antigos não finalizados

- **q7_saques_antigos_nao_final:** Lista vazia. Status considerados finais: processado, concluido, cancelado, rejeitado. Os 2 saques estão como cancelado (final).

### 3.3 Usuários com saque confirmado

- Critério: status em ['processado','concluido','confirmado','pago','completed']. Na base atual: **0** saques nesses status (apenas 2 cancelado). Nenhum usuário com saque confirmado.

### 3.4 Saldos antes/depois do saque

- Não executado SELECT histórico “antes/depois” por saque (seria necessário snapshot ou log). Saldos atuais: q10_saldos_negativos = [] (nenhum usuário com saldo negativo). q11_top_saldos contém amostra de saldos positivos.

### 3.5 Ledger por tipo (saque, taxa, rollback, payout_confirmado)

- **q8_ledger_por_tipo:** Lista vazia na execução. Tabela `ledger_financeiro` sem linhas retornadas na agregação por tipo (ou tabela vazia).

**Classificação FASE 1:** 🟢 Seguro (sem saques pendentes órfãos; sem saldo negativo; ledger sem duplicidade detectada — ver FASE 2).

---

## 4. FASE 2 — Integridade financeira

### 4.1 Saque confirmado sem PIX suficiente (lastro)

- Verificação (lógica do script encerramento-financeiro-v1-d1c-readonly.js): para cada usuário, soma de saques com status “confirmado” vs soma de PIX approved; se total_saques_confirmados > total_pix_approved → sem lastro.
- **Resultado na base atual:** 0 saques confirmados; portanto **nenhum** caso de saque confirmado sem lastro.

### 4.2 Débito sem saque correspondente

- O débito de saldo ocorre apenas no endpoint POST /api/withdraw/request, imediatamente antes do INSERT em saques; em falha do INSERT é feito rollback de saldo. Não existe débito “solto” sem criação de registro em saques no fluxo atual.

### 4.3 Saque sem entrada no ledger

- No fluxo de request: após INSERT em saques são criadas duas entradas de ledger (saque e taxa). Se criação do ledger falha, rollbackWithdraw remove o saldo do saque e marca o saque (e reverte saldo). Em produção, q8_ledger_por_tipo vazio pode indicar que os 2 saques (cancelado) foram criados em fluxo antigo ou que ledger não estava em uso; não foi possível verificar “cada saque tem par saque+taxa no ledger” sem escrita. **Risco documentado:** não verificado empiricamente para os 2 registros cancelado.

### 4.4 Ledger duplicado por correlation_id

- **q9_ledger_duplicidade:** Lista vazia. Chave (correlation_id, referencia, tipo) não apresenta duplicidade na base.

**Classificação FASE 2:** 🟢 Seguro (nenhum saque confirmado sem lastro; nenhum débito órfão no código; nenhuma duplicidade de ledger por correlation_id). 🟡 Atenção: consistência “todo saque tem ledger” não validada para os 2 cancelados (ledger vazio na execução).

---

## 5. FASE 3 — Segurança lógica

### 5.1 Lock otimista (saldo)

- **Implementado:** Update de saldo com `.eq('saldo', usuario.saldo)` (server-fly.js 1509-1512). Se outro request debitou entre a leitura e o update, 0 linhas afetadas e retorno 409. Evita débito concorrente além do saldo disponível.

### 5.2 Proteção contra double request

- **Idempotência por correlation_id:** Antes de debitar, busca saques por correlation_id (server-fly.js 1417-1448). Se existir saque com esse correlation_id, retorna 200 com dados do saque existente (não cria outro).
- **Bloqueio de pendente:** Busca saques do usuário com status in ('pendente','pending'); se existir, retorna 409 "Já existe um saque pendente em processamento" (1450-1471).

### 5.3 Idempotência do worker

- **Lock por status:** Update status = 'processando' com `.eq('id', saqueId).in('status', ['pendente','pending']) (processPendingWithdrawals.js 185-192). Apenas uma execução “ganha”; as demais afetam 0 linhas e são tratadas como "Tentativa duplicada ignorada" (retorno sem creditar nem reprocessar).
- **Um saque por ciclo:** limit(1); um único saque processado por intervalo.

### 5.4 Segurança do webhook

- **Autenticação:** Rota POST /webhooks/mercadopago **não** exige token nem assinatura (server-fly.js 2108). Qualquer cliente que conheça a URL pode enviar payload.
- **Validação de identidade:** Confere saque por id e correlation_id no payload (external_reference = saqueId_correlationId); correlation_id comparado ao do banco (2160-2167). Payload genérico sem saqueId/correlationId válidos é ignorado.
- **Idempotência:** Verificação de ledger payout_confirmado/falha_payout por (correlation_id, referencia, tipo) antes de criar novo ledger ou alterar status (2176-2195). Evita double payout por retentativas do MP.

**Classificação FASE 3:** 🟢 Seguro (lock otimista; idempotência por correlation_id e bloqueio de pendente; worker idempotente por status). 🟡 Atenção: webhook sem validação de assinatura (qualquer um pode chamar a URL; mitigado por validação de saque + correlation_id e idempotência de ledger).

---

## 6. Classificação de riscos (resumo)

| Item | Classificação | Motivo |
|------|----------------|--------|
| Verificação de saldo e débito condicional | 🟢 Seguro | Saldo verificado; update com lock otimista. |
| Idempotência e bloqueio de pendente | 🟢 Seguro | correlation_id + um pendente por usuário. |
| Worker: lock por status e um por ciclo | 🟢 Seguro | Evita double payout no worker. |
| Rollback em falhas | 🟢 Seguro | Rollback implementado em todos os pontos de falha (INSERT saque, ledger, webhook rejeitado, worker falha). |
| Saque confirmado sem lastro | 🟢 Seguro | 0 saques confirmados na base; verificação cruzada disponível em script. |
| Saldo negativo | 🟢 Seguro | q10 vazio. |
| Ledger duplicado por correlation_id | 🟢 Seguro | q9 vazio. |
| Ledger vazio vs saques existentes | 🟡 Atenção | 2 saques cancelado; ledger vazio na execução; consistência saque↔ledger não validada. |
| Webhook sem assinatura | 🟡 Atenção | URL pública; mitigado por validação de saque/correlation_id e idempotência. |

Nenhum item classificado como 🔴 Crítico.

---

## 7. Limitações explícitas

1. Não foi executado rollback nem worker; apenas leitura de código e SELECT.
2. Ledger vazio na amostra impede verificar empiricamente que todo saque criado possui entradas saque+taxa (e, se aplicável, rollback ou payout_confirmado).
3. Os 2 saques em produção estão com status cancelado; não há saques “processado” para validar lastro PIX no cenário real atual.

---

## 8. Veredito

**Fluxo de saque PIX:** **Seguro** na ótica desta auditoria read-only.

- Nenhum saque sem lastro detectado (0 confirmados).
- Nenhum saldo negativo.
- Mecanismos contra double payout: idempotência por correlation_id, bloqueio de um pendente por usuário, lock otimista de saldo, worker com lock por status, webhook com idempotência de ledger.
- Rollback implementado e usado em falha de criação de saque, falha de ledger, rejeição/cancelamento no webhook e falha do payout no worker.

Ressalvas documentadas: webhook sem validação de assinatura (🟡); ledger vazio na execução não permite validar paridade saque↔ledger para os 2 registros cancelado (🟡).

Nenhuma correção foi proposta nem nenhum código ou dado foi alterado.

---

**Scripts utilizados:** `scripts/audit-financeira-total-prod-readonly.js`; lógica de lastro em `scripts/encerramento-financeiro-v1-d1c-readonly.js`.  
**Evidências de código:** server-fly.js, src/domain/payout/processPendingWithdrawals.js, src/workers/payout-worker.js.  
**Data do relatório:** 2026-02-05
