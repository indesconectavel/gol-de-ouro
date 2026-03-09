# Auditoria: POST /api/withdraw/request retorna 500 mas registro aparece em GET /api/withdraw/history

**Data:** 2026-03-04  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo alterado, sem commit, deploy, env ou escrita em DB).  
**Projeto:** goldeouro-backend (Fly: goldeouro-backend-v2).  
**Versão referência:** v311 (server-fly.js v1.2.1-deploy-functional).

---

## Declaração READ-ONLY

Esta auditoria utilizou apenas: leitura de arquivos, grep/search, e (quando aplicável) chamadas HTTP GET. Nenhum código foi alterado, nenhum commit criado, nenhum deploy ou alteração de env/secrets, e nenhuma escrita direta no banco.

---

## 1. Snapshot do sistema (arquivos e versões)

| Item | Valor |
|------|--------|
| Servidor principal | `server-fly.js` (linha 2: v1.2.1-deploy-functional) |
| Rotas de saque | Única implementação em `server-fly.js` (sem duplicata em outro servidor) |
| Status de saque | `src/domain/payout/withdrawalStatus.js` |
| Worker de payout | `src/domain/payout/processPendingWithdrawals.js` |
| Ledger | `src/domain/payout/processPendingWithdrawals.js` (`createLedgerEntry`), tabela `ledger_financeiro` |
| Schema ledger | `database/schema-ledger-financeiro.sql` |
| Reconciler (saques presos) | `src/domain/payout/reconcileProcessingWithdrawals.js` |

**Implementação duplicada:** Não. A busca por `withdraw/request` e `withdraw/history` em `*.js` aponta apenas para `server-fly.js` como registro de rotas. Nenhum outro `app.post('/api/withdraw/request')` ou controller externo foi encontrado para o servidor em uso.

---

## 2. Evidências do roteamento

### 2.1 Onde as rotas são registradas

**Arquivo:** `server-fly.js`

- **POST /api/withdraw/request**  
  - Linha: **1396**  
  - Trecho:

```javascript
// Linha 1396
app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  try {
    const { valor, chave_pix, tipo_chave } = req.body;
    const userId = req.user.userId;
    const correlationId = String(
      req.headers['x-idempotency-key'] ||
      req.headers['x-correlation-id'] ||
      crypto.randomUUID()
    );
    // ...
```

- **GET /api/withdraw/history**  
  - Linha: **1668**  
  - Trecho:

```javascript
// Linha 1668
app.get('/api/withdraw/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // ...
    const { data: saques, error: saquesError } = await supabase
      .from('saques')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
```

### 2.2 Handler exato

- O handler do POST é uma função **inline** no `app.post(...)` em `server-fly.js` (linhas 1396–1665). Não há controller separado; toda a lógica está nesse bloco.
- O handler do GET também é inline no `app.get(...)` (linhas 1668–1721).

---

## 3. Fluxo detalhado do POST /api/withdraw/request e pontos de falha

### 3.1 Ordem das operações (server-fly.js, ~1396–1665)

| Ordem | Ação | Linhas (aprox.) | Pode lançar exceção / retornar erro? |
|-------|------|------------------|--------------------------------------|
| 1 | Ler `valor`, `chave_pix`, `tipo_chave`, `userId`, `correlationId` (x-idempotency-key ou x-correlation-id ou UUID) | 1397–1404 | Não (só leitura) |
| 2 | Validar com `pixValidator.validateWithdrawData(withdrawData)` | 1407–1421 | Retorna 400 se inválido |
| 3 | Valor mínimo R$ 10,00 | 1423–1430 | Retorna 400 se menor |
| 4 | Checar `dbConnected` e `supabase` | 1432–1438 | Retorna 503 se indisponível |
| 5 | **Idempotência:** SELECT em `saques` por `correlation_id` | 1440–1472 | Retorna 500 em erro de query; retorna **200** se já existir saque com esse `correlation_id` |
| 6 | Bloquear duplicata: SELECT saques do usuário com `status = PENDING` | 1474–1495 | Retorna 500 em erro; retorna 409 se já existir pendente |
| 7 | SELECT usuário (saldo) | 1506–1516 | Retorna 404 se não achar |
| 8 | Verificar saldo >= valor solicitado | 1511–1516 | Retorna 400 se insuficiente |
| 9 | Calcular taxa (env PAGAMENTO_TAXA_SAQUE ou 2.00), valor líquido | 1518–1526 | Retorna 400 se valor líquido <= 0 |
| 10 | **UPDATE `usuarios`** (debitar saldo) com `.eq('saldo', usuario.saldo)` | 1530–1544 | Retorna 409 se concorrência |
| 11 | **INSERT `saques`** (status `PENDING`) | 1546–1594 | Em erro: rollback de saldo, retorna 500 "Erro ao criar saque" |
| 12 | **createLedgerEntry** (`tipo: 'saque'`) | 1588–1611 | Em falha: **rollbackWithdraw** + retorna **500 "Erro ao registrar saque"** |
| 13 | **createLedgerEntry** (`tipo: 'taxa'`) | 1612–1635 | Em falha: **rollbackWithdraw** + retorna **500 "Erro ao registrar saque"** |
| 14 | **res.status(201).json(...)** | 1641–1656 | Sucesso |

### 3.2 Pontos que podem lançar exceção após o INSERT e antes do res.json

- **Linhas 1588–1611:** `createLedgerEntry({ tipo: 'saque', ... })`. Se `ledgerDebit.success` for falso, chama `rollbackWithdraw` e retorna 500 com **message: 'Erro ao registrar saque'**.
- **Linhas 1612–1635:** `createLedgerEntry({ tipo: 'taxa', ... })`. Se `ledgerFee.success` for falso, chama `rollbackWithdraw` e retorna 500 com **message: 'Erro ao registrar saque'**.
- Qualquer exceção não tratada no bloco (ex.: se `rollbackWithdraw` lançar) cai no `catch` das linhas 1558–1564 e resulta em **500 "Erro interno do servidor"**.

### 3.3 Evidência da mensagem "Erro ao registrar saque"

Trecho em `server-fly.js`:

```javascript
// 1588-1611
const ledgerDebit = await createLedgerEntry({
  supabase,
  tipo: 'saque',
  usuarioId: userId,
  valor: requestedAmount,
  referencia: saque.id,
  correlationId
});

if (!ledgerDebit.success) {
  console.error('❌ [SAQUE] Erro ao registrar ledger (saque):', ledgerDebit.error);
  await rollbackWithdraw({ ... });
  return res.status(500).json({
    success: false,
    message: 'Erro ao registrar saque'   // <-- mensagem exata do E2E
  });
}
```

O mesmo `message: 'Erro ao registrar saque'` aparece também no bloco do ledger de **taxa** (aprox. 1630–1634).

### 3.4 Causa raiz mais provável

- O **INSERT em `saques`** (linhas 1547–1571) é executado **antes** dos dois `createLedgerEntry`.
- Se o **primeiro** ou o **segundo** `createLedgerEntry` falhar (insert em `ledger_financeiro`), o handler:
  - chama `rollbackWithdraw` (restaura saldo, tenta marcar saque como rejeitado),
  - retorna **500** com **"Erro ao registrar saque"**.
- Portanto: **o 500 com "Erro ao registrar saque" ocorre quando o insert em `ledger_financeiro` falha** (tabela ausente, schema diferente, RLS, constraint, permissão, etc.), **depois** do saque já ter sido inserido em `saques`. Isso explica o “criou mas respondeu 500” e o registro aparecer em GET /api/withdraw/history.

**Hipótese principal:** Falha em `createLedgerEntry` (insert em `ledger_financeiro`) após o insert em `saques` com sucesso. O rollback restaura o saldo, mas o saque pode permanecer em **pendente** (detalhe na seção 4), gerando inconsistência visível no histórico.

---

## 4. Idempotência (estado atual e risco)

### 4.1 Uso de x-idempotency-key

- **Lida:** sim. Linhas 1399–1403: `correlationId = String(req.headers['x-idempotency-key'] || req.headers['x-correlation-id'] || crypto.randomUUID())`.
- **Salva:** sim. No INSERT em `saques` (linha 1563: `correlation_id: correlationId`) e usada nas buscas de idempotência e no ledger.
- **Impede duplicação de saque por request duplicado:** sim. Linhas 1440–1472: se já existir linha em `saques` com esse `correlation_id`, retorna 200 com o saque existente, sem novo insert.
- **Risco:** Se o primeiro request passar do insert em `saques` e falhar no ledger, retorna 500. Um retry com o **mesmo** `x-idempotency-key` ainda encontra o saque por `correlation_id` e retorna 200 (idempotência por correlation_id funciona). Porém, se o cliente não reenvia o mesmo header ou usa outro correlationId, pode criar outro saque (e haverá dois pendentes para o mesmo usuário apenas se a checagem de “pendente” passar em momento diferente).

### 4.2 Comportamento do rollback quando o saque está PENDING

- `rollbackWithdraw` está em `src/domain/payout/processPendingWithdrawals.js` (linhas 104–195).
- Para marcar o saque como rejeitado usa `updateSaqueStatus` com **`onlyWhenStatus: PROCESSING`** (linha 112).
- No POST, quando o ledger falha, o saque acabou de ser criado com status **PENDING**. Portanto o update para REJECTED **não** é aplicado (a condição `status = PROCESSING` não é satisfeita).
- Efeito: o rollback **restaura o saldo** e pode criar entradas de ledger de rollback, mas **não altera o status do saque**. O saque permanece **pendente** no histórico, gerando “saque fantasma” do ponto de vista do usuário (vê 500 mas vê o saque pendente na lista).

Trecho que suporta isso:

```javascript
// processPendingWithdrawals.js, 105-113
const markRejected = async (motivoRejeicao) => {
  const updateResult = await updateSaqueStatus({
    supabase,
    saqueId,
    userId,
    newStatus: REJECTED,
    motivo_rejeicao: String(motivoRejeicao).slice(0, 500),
    onlyWhenStatus: PROCESSING   // <-- no POST o status é PENDING, então update não altera linha
  });
  return updateResult;
};
```

---

## 5. Status: onde escreve, onde lê, valores

### 5.1 Valores oficiais (withdrawalStatus.js)

- Constantes: `PENDING = 'pendente'`, `PROCESSING = 'processando'`, `COMPLETED = 'concluido'`, `REJECTED = 'rejeitado'`, `CANCELED = 'cancelado'`.
- Comentário no código: *"Não usar: aguardando_confirmacao, processado, falhou, pending"*. A leitura/exibição normaliza via `normalizeWithdrawStatus` (pending→pendente, processado→concluido, etc.).

### 5.2 Onde o status é escrito

| Arquivo | Onde | Valor escrito |
|---------|------|----------------|
| server-fly.js | INSERT saques (linha 1564) | `PENDING` ('pendente') |
| server-fly.js | Resposta 201 (linha 1652) | `PENDING` (só na resposta) |
| processPendingWithdrawals.js | updateSaqueStatus (lock) | PENDING → **PROCESSING** (onlyWhenStatus: PENDING) |
| processPendingWithdrawals.js | updateSaqueStatus (sucesso) | PROCESSING → **COMPLETED** (+ processed_at, transacao_id) |
| processPendingWithdrawals.js | rollbackWithdraw (markRejected) | PROCESSING → **REJECTED** (onlyWhenStatus: PROCESSING) |
| reconcileProcessingWithdrawals.js | updateSaqueStatus | PROCESSING → COMPLETED ou REJECTED (timeout) |

### 5.3 Onde o status é lido

| Arquivo | Onde | Valor lido / critério |
|---------|------|------------------------|
| server-fly.js | Idempotência (existingWithdraw) | Qualquer; resposta usa normalizeWithdrawStatus |
| server-fly.js | Bloquear duplicata | `.eq('status', PENDING)` (1480) |
| server-fly.js | GET /api/withdraw/history | Lê `row.status`, expõe `normalizeWithdrawStatus(row.status)` (1701) |
| processPendingWithdrawals.js | Worker SELECT | `.eq('status', PENDING)` (238) |
| processPendingWithdrawals.js | updateSaqueStatus (onlyWhenStatus) | PENDING ou PROCESSING conforme caso |
| reconcileProcessingWithdrawals.js | SELECT saques presos | `.eq('status', PROCESSING)` (68) |
| server-fly.js | GET /api/admin/saques-presos | `.eq('status', PROCESSING)` (2963) |

### 5.4 Compatibilidade com o worker

- O worker busca apenas **`status = PENDING`** ('pendente'). Comentário no código: *"Selecionar somente status 'pendente' (CHECK do banco); não usar 'pending'"* (processPendingWithdrawals.js, 234–238).
- O POST insere com **`status: PENDING`** ('pendente'). Não há divergência pendente vs pending no fluxo ativo: o backend usa sempre 'pendente' na escrita e o worker filtra por PENDING ('pendente'). Se no banco existir algum registro legado com 'pending' (string), o worker não o pega (só .eq('status', PENDING) = 'pendente').

---

## 6. Worker (payout): critérios e transições

### 6.1 Arquivo

- **Arquivo:** `src/domain/payout/processPendingWithdrawals.js`.  
- Função principal exportada e usada pelo servidor: `processPendingWithdrawals`.

### 6.2 Status que o worker SELECT procura

- **Status:** `PENDING` (string **'pendente'**).  
- Trecho (linhas 234–240):

```javascript
const { data: pendentes, error: listError } = await supabase
  .from('saques')
  .select('id, usuario_id, amount, valor, fee, net_amount, pix_key, ...')
  .eq('status', PENDING)   // PENDING = 'pendente'
  .order('created_at', { ascending: true })
  .limit(1);
```

### 6.3 Transições

- **PENDING → PROCESSING:** ao adquirir “lock” (update com onlyWhenStatus: PENDING) antes de chamar `createPixWithdraw` (linhas 291–297).
- **PROCESSING → COMPLETED:** se `createPixWithdraw` retornar sucesso; preenche `processed_at` e `transacao_id` (linhas 325–331).
- **PROCESSING → REJECTED:** em falha de payout ou erro, via `rollbackWithdraw` (markRejected com onlyWhenStatus: PROCESSING).

### 6.4 processed_at e transacao_id

- Preenchidos no **update para COMPLETED** (linhas 325–331): `processed_at: now`, `transacao_id: payoutResult?.data?.id` (ou null).
- O reconciler e a lógica de “saques presos” usam `status = PROCESSING` e, quando aplicável, `transacao_id` para consultar o provedor.

### 6.5 Logs de falha

- Listagem de pendentes: `❌ [SAQUE][WORKER] Erro ao listar saques pendentes` (243).
- Lock falhou/duplicata: `ℹ️ [SAQUE][WORKER] Tentativa duplicada ou falha no lock` (300).
- Falha ao marcar concluído: `❌ [SAQUE][WORKER] Falha ao marcar concluído (sem revert)` (334).
- Rollback: `❌ [PAYOUT][FALHOU] rollback acionado` (372).
- Erro inesperado: `❌ [SAQUE][WORKER] Erro inesperado` (381).

### 6.6 Incompatibilidade com o status criado no POST

- Não há incompatibilidade: o POST insere com `status: PENDING` ('pendente') e o worker seleciona por `PENDING`. Um saque criado pelo POST e que permaneça pendente (por exemplo, quando o rollback não consegue marcar REJECTED por onlyWhenStatus: PROCESSING) **será** pego pelo worker em execuções futuras, pois continua 'pendente'.

---

## 7. Reprodução controlada (sem escrever no DB)

### 7.1 Como reproduzir com segurança

- **Não** executar POST real se o objetivo for apenas coletar evidências sem alterar estado.
- Para reproduzir o 500 com “Erro ao registrar saque” em ambiente controlado: usar um usuário de teste, saldo suficiente, valor mínimo 10, chave PIX válida (ex.: email), e enviar POST com header `x-idempotency-key` único. Se a tabela `ledger_financeiro` não existir ou falhar o insert, o comportamento esperado é: saque criado, resposta 500, e o saque visível em GET /api/withdraw/history como pendente (e saldo possivelmente restaurado pelo rollback).

### 7.2 Logs no Fly

- Padrões úteis: `[SAQUE]`, `[SAQUE][ROLLBACK]`, `Erro ao registrar ledger`, `Erro ao registrar saque`, `createLedgerEntry`, `ledger_financeiro`.
- Filtros sugeridos (exemplo genérico): buscar por “SAQUE” e “ledger” ou “500” nas respostas do app.

### 7.3 Campos a comparar (sem consultar DB diretamente)

- **GET /api/user/profile:** `saldo` antes e depois do POST (se rollback de saldo funcionar, o saldo volta).
- **GET /api/withdraw/history:** último saque (id, valor, status, created_at). Se status permanecer “pendente” após um 500 “Erro ao registrar saque”, é consistente com rollback que não atualiza status (onlyWhenStatus: PROCESSING).

### 7.4 Prova via endpoints GET

- Após um POST que retorne 500 com “Erro ao registrar saque”:
  - GET /api/withdraw/history deve mostrar um novo item com status “pendente” e valor/correlation_id daquele request.
  - GET /api/user/profile: saldo pode ter sido restaurado (rollback de saldo) ou não, dependendo de sucesso do rollback.

---

## 8. Plano de correção (sem aplicar)

### Nível A (mínimo): garantir que, se o saque foi criado, a resposta seja 200 com data do saque

- **Objetivo:** Evitar 500 quando o insert em `saques` já foi feito. Se o ledger falhar, ainda assim responder 201 com os dados do saque e registrar o erro de ledger de forma assíncrona ou em log, ou fazer o ledger em “best effort” sem falhar o request.
- **Arquivos/funções:** `server-fly.js` (handler do POST, ~1588–1636). Opções (conceituais, sem editar):
  - Mover os dois `createLedgerEntry` para **depois** do `res.status(201).json(...)` (fire-and-forget ou job), de forma que a resposta 201 seja enviada assim que o insert em `saques` e o débito de saldo forem bem-sucedidos; em falha do ledger apenas logar e, opcionalmente, enfileirar correção.
  - Ou: em falha de `createLedgerEntry`, não retornar 500; retornar 201 com os dados do saque e logar `ledgerDebit.error` / `ledgerFee.error` e disparar alerta ou job de reconciliação.
- **Novos logs/erros:** Log estruturado do tipo `[SAQUE] Ledger falhou (saque ou taxa) mas saque criado`, com `saqueId`, `correlationId`, `error`. Não retornar “Erro ao registrar saque” como mensagem de resposta quando o saque já existir.

### Nível B (atômico): POST transacional/consistente (sem saque fantasma)

- **Objetivo:** Ou tudo sucede (saque + ledger + resposta 201), ou nada (sem insert de saque visível com 500).
- **Arquivos/funções:** `server-fly.js` (handler POST); opcionalmente `processPendingWithdrawals.js` (rollback).
- **Mudanças conceituais (sem editar):**
  - Inverter ordem: **primeiro** inserir em `ledger_financeiro` (saque + taxa); **depois** debitar saldo; **depois** inserir em `saques`. Assim, se o ledger falhar, não há saque nem débito. Ou usar transação/outbox se o Supabase permitir.
  - Ou manter a ordem atual mas, em falha de ledger, garantir que o saque seja marcado como **REJECTED** mesmo estando PENDING: no POST, ao chamar `rollbackWithdraw` após falha de ledger, usar uma variante de `updateSaqueStatus` **sem** `onlyWhenStatus` (ou com `onlyWhenStatus: PENDING`) para marcar o saque como REJECTED quando o rollback for acionado pelo handler do POST (não só pelo worker). Assim o histórico não mostra “pendente” para um request que falhou.
- **Arquivo adicional:** `src/domain/payout/processPendingWithdrawals.js`: expor ou usar uma função “markRejectedWhenPending” (ou parâmetro onlyWhenStatus: null/PENDING) para o rollback acionado pelo POST.

### Nível C (E2E robusto): idempotência real + GET por id

- **Objetivo:** Idempotência explícita via `x-idempotency-key` e endpoint GET para consultar o saque criado.
- **Arquivos/funções:** `server-fly.js` (POST e nova rota GET); middlewares se necessário.
- **Mudanças conceituais (sem editar):**
  - Manter o uso de `correlation_id` como idempotency key (já implementado). Documentar que o cliente deve reenviar o mesmo `x-idempotency-key` em retry para receber 200 com o saque já criado.
  - Adicionar **GET /api/withdraw/:id** (ou GET /api/withdraw/request/:id com query param) para, com o id retornado no 201, o cliente poder consultar status do saque sem depender só do history.
  - Retornar no 201 o `id` do saque e, se possível, um header `Location: /api/withdraw/:id` para seguir padrão REST.
- **Logs:** Log de idempotência quando 200 for retornado por correlation_id existente (já existe em 1456). Opcional: métrica ou log quando retry com mesma key evita novo insert.

---

## 9. Resumo executivo (10 linhas)

1. **POST /api/withdraw/request** e **GET /api/withdraw/history** estão definidos apenas em **server-fly.js** (linhas 1396 e 1668); não há outra implementação ativa de rotas de saque.
2. O **500 com “Erro ao registrar saque”** ocorre quando o **insert em `ledger_financeiro`** falha (**createLedgerEntry** para 'saque' ou 'taxa') **depois** do insert em `saques` e do débito de saldo.
3. Por isso o saque **já existe** no banco e aparece em GET /api/withdraw/history, enquanto o cliente recebe 500.
4. A **idempotência** por `x-idempotency-key` (via `correlation_id`) está implementada e evita duplicar saque quando o mesmo header é reenviado; o problema é a ordem das operações e a resposta 500 após criar o saque.
5. O **rollback** chamado após falha do ledger restaura o saldo, mas **não** marca o saque como rejeitado, porque usa `onlyWhenStatus: PROCESSING` e o saque está **PENDING**, gerando “saque fantasma” (pendente) no histórico.
6. **Status** no código e no worker usam **'pendente'** (PENDING); não há divergência pendente/pending no fluxo principal; o worker seleciona corretamente por `status = 'pendente'`.
7. O **worker** pega saques com status **pendente**, faz PENDING → PROCESSING → COMPLETED ou REJECTED; preenche **processed_at** e **transacao_id** ao concluir.
8. **Causa raiz:** falha no insert em `ledger_financeiro` (tabela, schema, RLS ou permissão) após o saque já criado; resposta 500 e rollback que não atualiza status deixam o saque pendente.
9. **Plano A:** após criar saque com sucesso, responder 201 mesmo se o ledger falhar (logar/alertar e tratar ledger depois).
10. **Plano B/C:** tornar o fluxo atômico (ordem ou transação) e/ou marcar como REJECTED no rollback quando status for PENDING; e oferecer GET /api/withdraw/:id para consulta por id.

---

*Auditoria concluída em 2026-03-04. READ-ONLY: nenhum arquivo de código foi alterado.*
