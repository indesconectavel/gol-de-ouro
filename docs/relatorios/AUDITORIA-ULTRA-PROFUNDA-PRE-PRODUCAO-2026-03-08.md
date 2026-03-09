# AUDITORIA ULTRA PROFUNDA — PRÉ-PRODUÇÃO

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, patch, deploy ou banco.  
**Objetivo:** Identificar riscos financeiros e de concorrência que costumam passar despercebidos em MVPs com dinheiro real.

**Escopo:** server-fly.js, processPendingWithdrawals.js, reconcileMissingLedger.js, detectBalanceLedgerMismatch.js, reconcileProcessingWithdrawals.js, schema ledger/saques.

---

## 1. Risco pós-saque

### Fluxo analisado

- **Criação do saque:** Idempotência por `correlation_id` (retorno do saque existente se já criado). Bloqueio de segundo saque pendente por usuário. Débito de saldo com **lock otimista** (`.eq('saldo', usuario.saldo)`). Insert em `saques`. Em seguida `createLedgerEntry(withdraw_request, valor negativo, referencia: saque.id, correlationId)`. Se o ledger falhar, chama `rollbackWithdraw` (restaura saldo, insere ledger rollback, status REJECTED).
- **Worker (processPendingWithdrawals):** Seleciona um saque pendente/processando, atualiza para PROCESSING (`.in('status', [PENDING, 'pending', PROCESSING, 'processando'])`). Chama provedor; em sucesso atualiza COMPLETED com `onlyWhenStatus: PROCESSING`. Em falha: `createLedgerEntry(falha_payout)` e `rollbackWithdraw`.
- **Webhook payout (rejeitado):** Verifica ledger idempotência (já existe payout_confirmado/falha_payout para esse saque → ignora). Em rejected/cancelled: `createLedgerEntry(falha_payout)` e `rollbackWithdraw`.
- **Reconciler (timeout):** `ledgerHasRollback(saqueId)`; se já existe rollback no ledger, apenas atualiza status para REJECTED; senão chama `rejectWithRollbackIfNeeded` → `rollbackWithdraw`.

### Janela em que o saldo pode ficar errado após saque?

- **Sim, em cenário de rollback duplo.**  
  `rollbackWithdraw` (processPendingWithdrawals.js) **não** verifica se já existe rollback no ledger antes de:
  1. Ler saldo do usuário  
  2. Fazer `saldo + amount` e atualizar `usuarios`  
  3. Chamar `createLedgerEntry(tipo: 'rollback')`  
  4. Atualizar saque para REJECTED  

  Se dois chamadores invocarem `rollbackWithdraw` para o mesmo saque (ex.: worker falha payout e chama rollback; reconciler em paralelo vê status ainda PROCESSING e chama `rejectWithRollbackIfNeeded` antes do worker gravar o ledger), o segundo chamador pode passar em `ledgerHasRollback` = false e chamar `rollbackWithdraw` de novo. No segundo uso: saldo já foi aumentado na primeira vez; o segundo soma `amount` de novo → **crédito duplo**. O ledger evita duplicata por deduplicação em `createLedgerEntry` (e por unique em `(correlation_id, tipo, referencia)` no schema), mas a **atualização de saldo em rollback não é idempotente**.

### Janela em que o saque pode ficar com status incorreto?

- Após rollback, o status é atualizado para REJECTED. Se o update do saque falhar após o saldo e o ledger terem sido aplicados, o saque pode ficar em PROCESSING com saldo já restaurado (caso raro; o código atualiza em sequência).

### Cenário em que o rollback restaura saldo mais de uma vez?

- **Sim.** O mesmo cenário acima: duas chamadas a `rollbackWithdraw` para o mesmo saque levam a duas atualizações de saldo (soma `amount` duas vezes). O segundo insert de ledger rollback falha por unique ou é dedupado; o saldo não.

### Cenário em que o ledger de saque fica inconsistente com o saldo?

- Se o ledger `withdraw_request` for gravado e, em seguida, o rollback for chamado mas a atualização de saldo do rollback falhar, o usuário fica com saldo debitado sem o crédito de rollback no saldo (ledger terá withdraw_request e rollback; saldo não reflete o rollback).  
- Se houver **double rollback** (acima), o saldo fica **maior** que o que o ledger indica (dois créditos de rollback, um só registro de rollback no ledger).

---

## 2. Duplicação de ledger

### Tipos e referência / correlation_id

| Tipo | Referência típica | correlation_id | Deduplicação |
|------|-------------------|----------------|--------------|
| deposito_aprovado | id do registro em pagamentos_pix | id do pagamento | createLedgerEntry: SELECT por (correlation_id, tipo, referencia); se existe retorna deduped. Insert com unique (correlation_id, tipo, referencia) no DB. |
| chute_miss | id do chute (chutes.id) | id do chute | Idem. |
| chute_aposta | id do chute | id do chute | Idem. |
| chute_premio | id do chute | id do chute | Idem. |
| withdraw_request | id do saque | correlation_id do request | Idem. |
| payout_confirmado | saqueId | correlationId do saque | Idem. |
| falha_payout | saqueId | correlationId | Idem. |
| rollback | saqueId (e saqueId:fee para taxa) | correlationId (ou 'missing') | Idem. |

### Riscos de duplicação

- **Webhook PIX duplicado:** Claim atômico (update `.neq('status','approved')` + select); só um processo ganha o claim. Quem ganha credita saldo e chama `createLedgerEntry(deposito_aprovado)` com referencia = id do pagamento. Segundo webhook com mesmo payment_id não obtém linhas no claim; não credita de novo. **Risco de ledger duplicado:** baixo (mesmo correlation_id/referencia = dedup + unique).
- **reconcilePendingPayments junto com webhook:** Reconciler usa update por `id` do registro; webhook por `payment_id`/`external_id`. É o mesmo registro; apenas um claim vence. Ledger usa id do pagamento; createLedgerEntry deduplica. **Risco:** baixo.
- **Retry admin reconcile-ledger:** runReconcileMissingLedger só insere quando não existe ledger para (referencia, tipo). createLedgerEntry continua deduplicando. **Risco:** baixo.
- **Webhook payout duplicado:** Código verifica se já existe ledger com tipo payout_confirmado ou falha_payout para (correlation_id, referencia); se existir, retorna sem fazer nada. **Risco:** baixo.
- **Rollback rodando mais de uma vez:** createLedgerEntry evita segundo insert (dedup + unique). A **atualização de saldo** dentro de rollbackWithdraw **não** é protegida (não checa “já rolou back” antes de somar ao saldo). **Risco:** duplicação de **saldo** (não de linha de ledger).
- **Chute repetido por retry do cliente:** Cada chute gera novo insert em `chutes` (novo id). Ledger usa chuteId como referencia/correlationId; cada request gera id diferente. Não há idempotência por request do cliente (ex.: idempotency-key). Dois retries do mesmo “clique” podem gerar dois chutes e dois conjuntos de ledger. **Risco:** duplicação funcional se o cliente enviar duas requisições iguais (dois chutes, dois débitos). Não é duplicação de linha de ledger, e sim de evento de negócio.

### Schema ledger

- `database/schema-ledger-financeiro.sql` define unique index `ledger_financeiro_correlation_tipo_ref_idx on (correlation_id, tipo, referencia)`. Em ambiente que use esse schema, segundo insert com mesma trinca falha. O código já faz SELECT antes de inserir; em corrida dois processos podem ambos passar no SELECT e um falhar no insert por unique.

---

## 3. Concorrência no chute

### Lock otimista no MISS

- **MISS:** Update de saldo com `.eq('saldo', user.saldo)` (lock otimista). Se outra requisição já tiver alterado o saldo, 0 linhas afetadas → 409 “Saldo foi alterado por outra ação”. **Suficiente para evitar double spend no MISS** em uma única instância.

### GOAL sem lock otimista

- **GOAL:** Update de saldo **sem** `.eq('saldo', user.saldo)`. Cálculo `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro` e update. Em **uma** instância (Node single-threaded) não há dois GOALs simultâneos para o mesmo usuário no mesmo lote. Porém, se no futuro o GOAL for paralelizado ou houver retry que reexecuta a lógica, teoricamente dois updates poderiam aplicar; hoje o fluxo é sequencial por request.

### Risco de dois chutes simultâneos do mesmo usuário com o mesmo saldo?

- **MISS:** Lock otimista impede: só um update com aquele saldo vence; o outro recebe 409.  
- **GOAL:** Não há lock; em single-process não há paralelismo no mesmo lote. Risco atual é baixo em mono-instância.

### Double spend

- No MISS, o lock otimista evita debitar duas vezes com o mesmo saldo lido. No GOAL, o saldo é atualizado uma vez por resposta; sem paralelismo no mesmo lote, não há double spend típico. **Risco residual:** se o cliente enviar dois POST /shoot muito rápidos, dois chutes podem ser criados (dois inserts em `chutes`, dois débitos) porque não há idempotency-key no endpoint.

### Dois GOALs conflitantes / lote em memória

- O lote é **em memória** (`getOrCreateLoteByValue`, `lotesAtivos`). Com **múltiplas instâncias** (vários processos Fly/Node), cada processo tem seu próprio `lotesAtivos` e seu próprio `contadorChutesGlobal`. Resultado:
  - Cada instância tem seu próprio “lote” e seu próprio “vencedor” (ex.: 10º chute).
  - Dois usuários em instâncias diferentes podem ambos ganhar “goal” (cada um no seu lote local).
  - `contadorChutesGlobal` e “Gol de Ouro” (a cada 1000) divergem entre instâncias.
  - **Risco:** **ALTO** em deploy multi-instância: mais de um “goal” por lote lógico, contadores e prêmios inconsistentes.

### Fluxo insert chutes + update saldo + ledger sob concorrência

- Em **uma** instância, as operações são sequenciais por request. Insert em `chutes` pode falhar (ex.: constraint); nesse caso o código não faz update de saldo nem ledger para esse chute (o resultado já foi calculado e o lote em memória já foi alterado — há risco de lote “à frente” do banco se o insert falhar depois de ter avançado o lote).  
- Em **múltiplas** instâncias, não há coordenação: dois processos podem inserir chutes para o mesmo “lote” lógico (mesmo lote_id se por acaso gerado igual) ou para lotes diferentes, com saldos atualizados em paralelo. **Risco:** alto em multi-instância.

### Chutes válidos duplicados (um clique, dois chutes)

- Não há idempotency-key no POST /api/games/shoot. Retry do cliente ou duplo clique pode gerar dois requests, dois chutes, dois débitos. **Risco:** moderado (depende do uso real do cliente).

---

## 4. Concorrência em depósito

### Claim atômico

- **Webhook:** Update em `pagamentos_pix` com `.eq('payment_id', data.id).neq('status', 'approved').select(...)`. Quem afetar 1 linha “ganha” o claim; quem chegar depois obtém 0 linhas e não credita.  
- **Reconciler:** Update por `.eq('id', p.id).neq('status', 'approved').select(...)`. Mesmo registro; primeiro a comitar vence.  
- Webhook e reconciler usam chaves diferentes (payment_id vs id) para o **mesmo** registro; apenas um dos dois updates pode afetar a linha (uma vez approved, o outro não encontra linha com neq approved). **O claim realmente elimina dupla aprovação** no registro.

### Crédito duplo de saldo?

- Quem ganha o claim é o único que segue para creditar saldo. O crédito é feito com read de `usuarios.saldo` e depois update. Não há lock otimista nesse update. Em teoria, se dois fluxos de claim ganhassem (impossível pelo mesmo registro), haveria duplo crédito. Como só um claim ganha, **risco residual de crédito duplo no mesmo pagamento:** baixo.  
- **Risco residual:** webhook e reconciler nunca devem “ganhar” os dois para o mesmo payment_id; o design do claim evita isso.

### Ledger duplicado

- createLedgerEntry(deposito_aprovado) usa referencia = id do pagamento e correlationId = id do pagamento. Deduplicação + unique (correlation_id, tipo, referencia) impedem segunda linha para o mesmo depósito. **Risco:** baixo.

### Saldo atualizado e pagamento com status errado?

- O fluxo é: claim (update status approved) → read user → update saldo → createLedgerEntry. Se o update de saldo falhar após o claim, o pagamento fica approved mas o usuário não recebe saldo (inconsistência). O código não faz rollback do status do pagamento nesse caso. **Risco:** moderado (falha de infra entre claim e update de saldo).

---

## 5. Concorrência em saque

### Dois saques simultâneos passando?

- Idempotência por `correlation_id`: se o cliente reenviar com o mesmo correlation_id, retorna o saque existente.  
- Bloqueio “um pendente por usuário”: select de saques com status **apenas** `pendente`/`pending` por usuario_id (server-fly.js ~1506–1510: `.in('status', ['pendente', 'pending'])`); se existir, 409. **O status `processando`/PROCESSING não está incluído.** Assim que o worker marca o primeiro saque como PROCESSING, essa linha deixa de ser retornada na consulta; um segundo request do mesmo usuário (com outro correlation_id) passa no bloqueio, debita o saldo de novo e cria um segundo saque. **Risco de dois saques simultâneos passarem:** **MODERADO** — cenário: usuário solicita saque A → worker pega A e coloca em PROCESSING → usuário solicita saque B → bloqueio não encontra pendente/pending → B é criado e saldo debitado de novo.  
- Débito de saldo com lock otimista `.eq('saldo', usuario.saldo)` protege apenas a mesma “rodada”; não evita o segundo saque após o primeiro ter ido para processando.

### Payout duplicado?

- Worker pega um saque pendente/processando e faz update para PROCESSING com `.in('status', [PENDING, 'pending', PROCESSING, 'processando']).eq('id', saqueId)`. Dois workers em duas instâncias podem tentar o mesmo saque; o update afeta apenas uma linha; o outro retorna 0 e o código trata como “duplicate” e retorna sem processar. **Risco:** baixo, desde que o provedor (ex.: MP) também trate idempotência por correlation_id.

### Ledger duplicado no saque?

- withdraw_request e rollback usam createLedgerEntry com referencia/correlationId; unique no ledger impede duplicata. **Risco:** baixo.

### Rollback vs webhook em conflito?

- Webhook (rejeitado): chama rollbackWithdraw. Worker (payout falhou): chama rollbackWithdraw. Reconciler (timeout): chama rejectWithRollbackIfNeeded, que verifica ledgerHasRollback antes de chamar rollbackWithdraw.  
- **Conflito:** Worker e webhook **não** verificam ledgerHasRollback antes de chamar rollbackWithdraw. Se o worker falhar e chamar rollbackWithdraw e, em paralelo, o webhook de rejeição também chamar rollbackWithdraw, ambos podem atualizar o saldo (crédito duplicado). O ledger fica protegido pela dedup/unique. **Risco:** moderado (duplo crédito de saldo em cenário de corrida entre worker e webhook de rejeição).

---

## 6. Consistência geral

Cenários concretos onde pode ocorrer inconsistência:

- **Saldo > ledger:** (1) Rollback executado duas vezes (saldo creditado duas vezes, ledger uma). (2) Crédito manual ou bug que credita saldo sem ledger.
- **Ledger > saldo:** (1) Ledger gravado e update de saldo falhou (ex.: depósito aprovado com ledger e falha no update de saldo; ou rollback com ledger gravado e falha no update do saque/saldo). (2) Débito de saldo aplicado e createLedgerEntry falhou (ex.: shoot MISS com saldo atualizado e ledger chute_miss falhou).
- **Saque concluído sem reflexo correto:** Worker marca COMPLETED mas webhook não registra payout_confirmado (ou o contrário); saldo já foi debitado na criação. Ledger tem withdraw_request; se não houver payout_confirmado, a “conclusão” é apenas de status; o valor já saiu do saldo. Não há inconsistência de saldo nesse caso; possível inconsistência de “status vs provedor”.
- **Depósito aprovado sem reflexo correto:** Claim aprovou o registro mas o update de saldo falhou → pagamento approved, saldo não creditado. runReconcileMissingLedger pode criar o ledger deposito_aprovado depois, mas não corrige saldo (não altera saldo).
- **Chute gravado sem ledger:** Insert em chutes sucesso; createLedgerEntry falha (ex.: timeout). Saldo já foi atualizado. Resultado: chute no banco, saldo correto, ledger faltando. reconcileMissingLedger preenche o ledger faltante (não mexe em saldo).
- **Ledger gravado sem evento correspondente:** Muito raro; createLedgerEntry é chamado após o evento (depósito aprovado, chute, saque, rollback). Se o insert no ledger suceder e o evento “principal” falhar depois (ex.: update de status do saque), o ledger fica “à frente”.
- **total_apostas / total_ganhos divergentes da contagem real de chutes:** Atualização de total_apostas e total_ganhos é feita no mesmo update de saldo no shoot. Se um update falhar após o insert em chutes, o chute existe mas totalizadores não. Com múltiplas instâncias, totalizadores podem divergir da soma real em `chutes` (cada instância atualiza com seu próprio valor lido).

---

## 7. Queries de verificação

```sql
-- Saques potencialmente inconsistentes (com withdraw_request mas sem rollback nem payout_confirmado em rejeitados)
SELECT s.id, s.usuario_id, s.status, s.amount, s.valor, s.correlation_id, s.created_at,
  (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo = 'withdraw_request') AS has_wr,
  (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo = 'rollback') AS has_rollback,
  (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo IN ('payout_confirmado','falha_payout')) AS has_payout_ledger
FROM saques s
WHERE s.status IN ('rejeitado','rejected','pendente','pending','processando','processing')
  AND (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo = 'withdraw_request') > 0
  AND (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo = 'rollback') = 0;

-- Ledger duplicado (mesmo correlation_id + tipo + referencia)
SELECT correlation_id, tipo, referencia, COUNT(*) AS cnt
FROM ledger_financeiro
GROUP BY correlation_id, tipo, referencia
HAVING COUNT(*) > 1;

-- Usuários com saldo divergente do ledger (ajustar user_id/usuario_id conforme schema)
WITH ledger_soma AS (
  SELECT COALESCE(usuario_id, user_id) AS uid, SUM(valor) AS soma
  FROM ledger_financeiro
  GROUP BY COALESCE(usuario_id, user_id)
)
SELECT u.id, u.saldo, COALESCE(l.soma, 0) AS ledger_sum, (u.saldo - COALESCE(l.soma, 0)) AS diff
FROM usuarios u
LEFT JOIN ledger_soma l ON l.uid = u.id
WHERE u.saldo IS DISTINCT FROM COALESCE(l.soma, 0);

-- Pagamentos aprovados sem ledger deposito_aprovado
SELECT p.id, p.usuario_id, p.amount, p.valor, p.status
FROM pagamentos_pix p
WHERE p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM ledger_financeiro l
    WHERE l.referencia = CAST(p.id AS text) AND l.tipo = 'deposito_aprovado'
  );

-- Chutes sem ledger (miss)
SELECT c.id, c.usuario_id, c.valor_aposta, c.resultado
FROM chutes c
WHERE c.resultado = 'miss'
  AND NOT EXISTS (
    SELECT 1 FROM ledger_financeiro l
    WHERE l.referencia = CAST(c.id AS text) AND l.tipo = 'chute_miss'
  );

-- Chutes goal sem chute_aposta ou chute_premio
SELECT c.id, c.usuario_id, c.resultado,
  (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(c.id AS text) AND l.tipo = 'chute_aposta') AS has_aposta,
  (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(c.id AS text) AND l.tipo = 'chute_premio') AS has_premio
FROM chutes c
WHERE c.resultado = 'goal'
  AND (
    (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(c.id AS text) AND l.tipo = 'chute_aposta') = 0
    OR (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(c.id AS text) AND l.tipo = 'chute_premio') = 0
  );

-- Saques rejeitados sem rollback no ledger
SELECT s.id, s.usuario_id, s.status, s.amount
FROM saques s
WHERE s.status IN ('rejeitado','rejected')
  AND (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo = 'withdraw_request') > 0
  AND (SELECT COUNT(*) FROM ledger_financeiro l WHERE l.referencia = CAST(s.id AS text) AND l.tipo = 'rollback') = 0;

-- total_apostas vs contagem real de chutes por usuário
SELECT u.id, u.total_apostas, u.total_ganhos,
  (SELECT COUNT(*) FROM chutes c WHERE c.usuario_id = u.id) AS real_chutes,
  (SELECT COALESCE(SUM(c.premio + COALESCE(c.premio_gol_de_ouro, 0)), 0) FROM chutes c WHERE c.usuario_id = u.id AND c.resultado = 'goal') AS real_ganhos
FROM usuarios u
WHERE u.total_apostas IS DISTINCT FROM (SELECT COUNT(*) FROM chutes c WHERE c.usuario_id = u.id)
   OR u.total_ganhos IS DISTINCT FROM (SELECT COALESCE(SUM(c.premio + COALESCE(c.premio_gol_de_ouro, 0)), 0) FROM chutes c WHERE c.usuario_id = u.id AND c.resultado = 'goal');
```

(Em ambientes onde o ledger usa `user_id`, trocar `usuario_id` por `user_id` nas queries que referenciam ledger_financeiro.)

---

## 8. Classificação por área

| Área | Classificação | Motivo principal |
|------|----------------|------------------|
| **Depósito** | **BAIXO** | Claim atômico evita dupla aprovação; ledger com dedup/unique; risco residual se update de saldo falhar após claim. |
| **Chute** | **MODERADO** (mono) / **ALTO** (multi) | Mono: MISS com lock otimista; GOAL sem lock, baixo risco em single-thread. Multi: lotes e contador em memória por processo → múltiplos “goal” e contadores divergentes. Sem idempotency no shoot, retry pode duplicar chute. |
| **Saque** | **MODERADO** | Idempotência e bloqueio de pendente ok; **bloqueio não inclui processando** → segundo saque pode ser criado após o primeiro ir para PROCESSING (débito duplo possível). Rollback sem checagem “já rolou” permite duplo crédito de saldo se worker e webhook (ou dois caminhos) chamarem rollback duas vezes. |
| **Rollback** | **MODERADO** | Dupla execução de rollbackWithdraw → duplo crédito de saldo; ledger protegido. |
| **Ledger** | **BAIXO** | Deduplicação em createLedgerEntry + unique (correlation_id, tipo, referencia) limitam duplicação de linhas. |
| **Concorrência multi-instância** | **ALTO** | Lotes e contador global em memória; rollback sem guard “já executado” antes de atualizar saldo; possível duplo crédito em rollback. |

---

## 9. Top 3 riscos remanescentes

1. **Rollback de saque executado mais de uma vez (saldo)**  
   `rollbackWithdraw` não verifica se já existe rollback no ledger antes de somar ao saldo. Dois chamadores (worker + webhook, ou worker + reconciler em corrida) podem creditar o valor duas vezes. **Mitigação recomendada:** no início de `rollbackWithdraw`, chamar `ledgerHasRollback(supabase, saqueId)`; se true, apenas atualizar status do saque para REJECTED e retornar, sem alterar saldo.

2. **Multi-instância no chute (lotes e contador em memória)**  
   Cada processo tem seu próprio `lotesAtivos` e `contadorChutesGlobal`. Vários “goal” e “Gol de Ouro” por lote lógico; totalizadores e prêmios inconsistentes entre instâncias. **Mitigação:** persistir lotes e contador global (ex.: banco ou store distribuído) ou garantir uma única instância para o endpoint de chute (ex.: sticky session ou fila).

3. **Bloqueio de saque não inclui “processando”**  
   O endpoint POST /api/withdraw/request bloqueia apenas saques com status `pendente`/`pending`. Quando o worker marca o primeiro saque como PROCESSING, um segundo request do mesmo usuário passa no bloqueio, debita o saldo novamente e cria outro saque. **Mitigação:** incluir `processando`/PROCESSING no filtro de “saque pendente em processamento” (ex.: `.in('status', ['pendente', 'pending', 'processando', 'processing'])`).

---

## 10. Conclusão final

- **O sistema está aceitável para demo?**  
  **Sim.** Em ambiente controlado (poucos usuários, uma instância, fluxo manual), os riscos de duplo crédito em rollback e de multi-instância no chute podem não se materializar. A trilha de ledger e o claim de depósito dão boa rastreabilidade.

- **O sistema está aceitável para dinheiro real controlado?**  
  **Com ressalvas.** Para dinheiro real com volume baixo e **uma única instância**, é aceitável desde que: (1) seja implementada a checagem “já rollback” em `rollbackWithdraw` antes de atualizar saldo; (2) se evite deploy multi-instância no endpoint de chute até que lotes/contador sejam persistidos ou coordenados.

- **Três maiores riscos remanescentes:**  
  1) Duplo crédito de saldo por rollback executado duas vezes.  
  2) Inconsistência e múltiplos “goal” com múltiplas instâncias (lotes/contador em memória).  
  3) Bloqueio de saque que não inclui status processando → segundo saque pode ser criado e saldo debitado duas vezes.

- **Próxima correção mais importante após a demo:**  
  Implementar em `rollbackWithdraw` a verificação `ledgerHasRollback(saqueId)` no início e, se já existir rollback no ledger, **não** atualizar saldo (apenas atualizar status do saque para REJECTED se ainda não estiver). Em seguida: incluir `processando`/PROCESSING no bloqueio de “já existe saque pendente” em POST /api/withdraw/request.

---

**Nenhuma alteração de código foi feita; apenas diagnóstico com base em evidência real do código.**
