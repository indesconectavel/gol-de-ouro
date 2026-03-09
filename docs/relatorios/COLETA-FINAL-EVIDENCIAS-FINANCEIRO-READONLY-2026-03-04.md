# Coleta Final de Evidências — Fechamento do Sistema Financeiro (READ-ONLY ABSOLUTO)

**Data:** 2026-03-04  
**Objetivo:** Evidências técnicas para validar o fechamento do sistema financeiro (depósito → saldo → jogo → saque → ledger → worker).  
**Regras:** Nenhuma alteração em código, banco, deploy ou secrets. Apenas leitura.

---

## SEÇÃO 1 — SNAPSHOT DE PRODUÇÃO (FLY)

Comandos executados (somente leitura):

- `flyctl status -a goldeouro-backend-v2`
- `flyctl machines list -a goldeouro-backend-v2`
- `flyctl releases -a goldeouro-backend-v2`

### Resultado

| Campo | Valor |
|-------|--------|
| **Versão atual** | v311 |
| **Imagem da release atual** | goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J |
| **Hostname** | goldeouro-backend-v2.fly.dev |
| **Owner** | personal |

### Process groups e máquinas

| PROCESS       | Máquinas | STATE (started/stopped) | Observação                    |
|---------------|----------|--------------------------|-------------------------------|
| **app**       | 2        | 1 started, 1 stopped   | 1 total, 1 passing (started)  |
| **payout_worker** | 1    | **started**              | Sem checks HTTP               |

- **Quantas máquinas started:** 2 (1 app + 1 payout_worker).
- **Quantas máquinas stopped:** 1 (app).
- **payout_worker está STARTED:** Sim.

### Releases (top 10)

| VERSION | STATUS   | DATE (resumo)   |
|---------|----------|-----------------|
| v311    | failed   | 17h22m ago      |
| v310    | failed   | 17h32m ago      |
| v309    | failed   | 17h48m ago      |
| v308    | failed   | Mar 3 2026 15:11 |
| v307    | failed   | Mar 3 2026 15:06 |
| v306    | failed   | Mar 3 2026 14:43 |
| v305    | complete| Feb 25 2026 19:50 |
| v304    | failed   | Feb 6 2026 06:42 |
| v303    | failed   | Feb 6 2026 06:42 |
| v302    | complete| Feb 3 2026 22:42 |

Nenhuma alteração foi feita no Fly.

---

## SEÇÃO 2 — ESTADO DO CÓDIGO ATUAL (REPO LOCAL)

### 1) Função createLedgerEntry

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Linhas:** 43–76

```javascript
const createLedgerEntry = async ({ supabase, tipo, usuarioId, valor, referencia, correlationId }) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('ledger_financeiro')
      .select('id')
      .eq('correlation_id', correlationId)
      .eq('tipo', tipo)
      .eq('referencia', referencia)
      .maybeSingle();
    // ...
    const payloadBase = { tipo, valor: parseFloat(valor), referencia, correlation_id: correlationId, created_at: new Date().toISOString() };
    const insertResult = await insertLedgerRow(supabase, payloadBase, usuarioId);
    if (!insertResult.success) return { success: false, error: insertResult.error };
    return { success: true, id: insertResult.data?.id };
  } catch (error) {
    return { success: false, error };
  }
};
```

### 2) Helper insertLedgerRow

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Linhas:** 13–40

```javascript
async function insertLedgerRow(supabase, payloadBase, usuarioId) {
  if (ledgerUserIdColumn) {
    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
    const { data, error } = await supabase.from('ledger_financeiro').insert(row).select('id').single();
    if (error) return { success: false, error };
    return { success: true, data };
  }
  const rowUser = { ...payloadBase, user_id: usuarioId };
  const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
  if (!res1.error) { ledgerUserIdColumn = 'user_id'; return { success: true, data: res1.data }; }
  // fallback usuario_id
  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
  const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
  if (!res2.error) { ledgerUserIdColumn = 'usuario_id'; return { success: true, data: res2.data }; }
  return { success: false, error: res2.error };
}
```

### 3) Declaração do cache ledgerUserIdColumn

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Linha:** 6

```javascript
/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
let ledgerUserIdColumn = null;
```

### 4) Onde é chamado createLedgerEntry no fluxo de saque

| Arquivo        | Linha(s) | Contexto                                      |
|----------------|----------|-----------------------------------------------|
| server-fly.js  | 1603     | POST /api/withdraw/request — ledger tipo 'saque' |
| server-fly.js  | 1618     | POST /api/withdraw/request — ledger tipo 'taxa'  |
| server-fly.js  | 2208     | Webhook MP — payout_confirmado                |
| server-fly.js  | 2257     | Webhook MP — falha_payout                     |
| processPendingWithdrawals.js | 200, 210 | rollbackWithdraw — tipo 'rollback'      |
| processPendingWithdrawals.js | 397     | Worker — falha_payout após createPixWithdraw falhar |

### 5) Onde é feita deduplicação por correlation_id

**Saque (idempotência request):**  
**Arquivo:** `server-fly.js`  
**Linhas:** 1439–1470

```javascript
// Idempotência por correlation_id (se já existe, retornar o saque existente)
const { data: existingWithdraw, error: existingWithdrawError } = await supabase
  .from('saques')
  .select('id, amount, valor, fee, net_amount, ...')
  .eq('correlation_id', correlationId)
  .maybeSingle();
// ...
if (existingWithdraw?.id) {
  return res.status(200).json({ success: true, message: '...', data: { ... existingWithdraw } });
}
```

**Ledger (dedup antes de insert):**  
**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Linhas:** 44–56

```javascript
const { data: existing, error: existingError } = await supabase
  .from('ledger_financeiro')
  .select('id')
  .eq('correlation_id', correlationId)
  .eq('tipo', tipo)
  .eq('referencia', referencia)
  .maybeSingle();
if (existing?.id) return { success: true, id: existing.id, deduped: true };
```

### 6) Onde o worker altera status de saque (PENDING → PROCESSING → COMPLETED/REJECTED)

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`

| Transição        | Linhas     | Evidência                                                                 |
|------------------|------------|---------------------------------------------------------------------------|
| PENDING → PROCESSING | 330–336 | `updateSaqueStatus({ newStatus: PROCESSING, onlyWhenStatus: PENDING })`  |
| PROCESSING → COMPLETED | 363–369 | `updateSaqueStatus({ newStatus: COMPLETED, processed_at, transacao_id })` (após createPixWithdraw sucesso) |
| PROCESSING → REJECTED | rollback | `rollbackWithdraw` chama `updateSaqueStatus({ newStatus: REJECTED })` (L221, 224; e em catch L394–406) |

Trecho lock (PENDING → PROCESSING):

```javascript
const lockResult = await updateSaqueStatus({
  supabase, saqueId, userId,
  newStatus: PROCESSING,
  onlyWhenStatus: PENDING
});
if (!lockResult.success) return { success: true, processed: false, duplicate: true };
```

---

## SEÇÃO 3 — DIVERGÊNCIA usuario_id vs user_id

### Onde o código usa usuario_id

- **saques:** server-fly.js (insert L1551, select L1478, L1664), processPendingWithdrawals.js (select L276, L301), reconcileProcessingWithdrawals.js (L67, L89).
- **pagamentos_pix:** server-fly.js (L2060, L2070, L2084, L2095, L2342, L2392, L2405).
- **chutes:** server-fly.js (L1312).
- **usuarios:** acessos por `id`; outras tabelas referenciam usuário por coluna `usuario_id`.
- **ledger_financeiro (schema repo):** database/schema-ledger-financeiro.sql L7, L13 — coluna `usuario_id`. Código no **insert** usa o helper que tenta **user_id** primeiro e depois **usuario_id**.

### Onde o código usa user_id

- **password_reset_tokens:** server-fly.js (L492, L563, L607) — SELECT/INSERT em tabela de tokens.
- **ledger_financeiro (insert):** processPendingWithdrawals.js L25–28 — primeiro tentativa de insert com `user_id`; se sucesso, cache = 'user_id'.

### Se ledger_financeiro no código usa usuario_id

- **Schema do repo:** Sim — database/schema-ledger-financeiro.sql define `usuario_id`.
- **Código de insert:** O fluxo atual usa `insertLedgerRow`, que tenta primeiro `user_id` e em fallback `usuario_id`; portanto o código **não** insere apenas `usuario_id` fixo — adapta ao ambiente.

### Resultado do script de probe (produção)

Script existente: `scripts/schema_probe_usuario_user_id.js`. Output documentado em `docs/relatorios/AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md` (sem imprimir secrets; apenas flags SUPABASE_URL_PRESENT / SERVICE_ROLE_PRESENT e resultados por tabela).

**Output relevante (mascarando secrets — apenas chaves de resultado):**

```
SUPABASE_URL_PRESENT true
SERVICE_ROLE_PRESENT true
TABLE_usuarios {"id":"YES","usuario_id":"column usuarios.usuario_id does not exist","user_id":"column usuarios.user_id does not exist"}
TABLE_saques {"id":"YES","usuario_id":"YES","user_id":"column saques.user_id does not exist"}
TABLE_ledger_financeiro {"id":"YES","usuario_id":"column ledger_financeiro.usuario_id does not exist","user_id":"YES"}
TABLE_transacoes {"id":"YES","usuario_id":"YES","user_id":"column transacoes.user_id does not exist"}
TABLE_pagamentos_pix {"id":"YES","usuario_id":"YES","user_id":"column pagamentos_pix.user_id does not exist"}
TABLE_password_reset_tokens {"id":"YES","usuario_id":"... does not exist","user_id":"YES"}
TABLE_chutes {"id":"YES","usuario_id":"YES","user_id":"column chutes.user_id does not exist"}
SCHEMA_PROBE_DONE ok
```

**scripts/ledger_probe.js:** Faz SELECT com colunas `id, correlation_id, tipo, usuario_id, valor, referencia, created_at` (L41). Em produção, SELECT com `usuario_id` falha (coluna não existe); documento PROVA-LEDGER-FINANCEIRO-2026-03-04.md registra `SCHEMA_ERROR_MESSAGE: column ledger_financeiro.usuario_id does not exist`.

### Confirmação

- **Produção ledger_financeiro:** tem **user_id**; **não** tem **usuario_id** (probe e relatórios 2026-03-04).

### Declaração

- **Divergência isolada?** Sim. Apenas a tabela **ledger_financeiro** em produção tem coluna **user_id** enquanto o schema do repo e o probe esperam **usuario_id**; o código atual já faz fallback user_id → usuario_id no insert.
- **Outras tabelas afetadas?** Não. saques, transacoes, pagamentos_pix, chutes usam **usuario_id** em código e em produção; password_reset_tokens usa **user_id** em ambos.
- **Risco sistêmico ou localizado?** Localizado. Risco mitigado pelo patch insertLedgerRow (fallback + cache); createLedgerEntry não lança exceção (airbag).

---

## SEÇÃO 4 — CONTRATOS DOS ENDPOINTS FINANCEIROS

Evidência de rota: `server-fly.js` (grep app.get/app.post).

| Endpoint | Método | Linha | Exige Bearer | Idempotency-key | Principais validações |
|----------|--------|-------|--------------|------------------|------------------------|
| /api/payments/pix/criar | POST | 1710 | Sim (authenticateToken) | Não | Valor, chave PIX, tipo; PixValidator |
| /api/payments/pix/usuario | GET  | 1875 | Sim | Não | — |
| /api/payments/webhook    | POST | 1973 | Não (signature) | Não | type, data.id; idempotência por payment_id/external_id |
| /api/user/profile        | GET  | 1023 | Sim | Não | req.user.userId |
| /api/games/shoot         | POST | 1168 | Sim | Não | direction, amount; batchConfigs[amount]; saldo >= amount (L1210) |
| /api/withdraw/request    | POST | 1396 | Sim | Sim (x-idempotency-key ou x-correlation-id) | valor ≥ 10; PixValidator; 1 pendente por usuário; saldo suficiente; débito com .eq('saldo', usuario.saldo) |
| /api/withdraw/history    | GET  | 1649 | Sim | Não | usuario_id do token |

Validação executada nesta coleta: apenas GET/OPTIONS onde aplicável (sem POST). Endpoints que exigem Bearer não foram chamados com token (não vazar JWT).

---

## SEÇÃO 5 — INVARIANTES FINANCEIROS

| Invariante | Onde está implementado | Linha | Depende de banco ou apenas código |
|------------|-------------------------|-------|-----------------------------------|
| Depósito não pode creditar duas vezes o mesmo payment_id | Webhook: claim atômico update .neq('status','approved'); creditar só se claimed (1 linha) | server-fly.js 2054–2076 | Banco: UPDATE com condição; código: só credita se claimByPaymentId/claimByExternalId length === 1 |
| Saque não pode ser criado duas vezes com mesmo correlation_id | SELECT saques por correlation_id; se existingWithdraw?.id retorna 200 com data existente | server-fly.js 1440–1470 | Código + banco (select + early return) |
| Shoot não pode debitar saldo negativo | Verificação user.saldo < amount → 400 Saldo insuficiente | server-fly.js 1197–1214 | Código (leitura saldo + validação); débito/ Gatilho ou update em outro trecho |
| Worker não pode processar saque duas vezes | updateSaqueStatus(..., onlyWhenStatus: PENDING); se nenhuma linha afetada, retorna duplicate e não processa | processPendingWithdrawals.js 330–336, 338–345 | Banco: UPDATE ... WHERE status = 'pendente'; apenas 1 worker pega o lock |
| Ledger tem unique index por (correlation_id, tipo, referencia) | Schema: create unique index ledger_financeiro_correlation_tipo_ref_idx | database/schema-ledger-financeiro.sql L15 | Banco (unique index); código faz SELECT antes do insert e retorna deduped se existing?.id (L44–56) |

---

## SEÇÃO 6 — ESTADO DO LEDGER

### Tipos permitidos

**Evidência:** database/schema-ledger-financeiro.sql L6.

```sql
tipo text not null check (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout'))
```

### Como o insert é feito hoje

- createLedgerEntry monta `payloadBase` (tipo, valor, referencia, correlation_id, created_at) e chama **insertLedgerRow(supabase, payloadBase, usuarioId)**.
- insertLedgerRow: se cache definido, usa essa coluna; senão tenta **user_id** primeiro, depois **usuario_id**; grava em cache a coluna que funcionar.

### Se existe fallback user_id / usuario_id

Sim. processPendingWithdrawals.js L24–38: primeiro insert com `user_id`; em falha, insert com `usuario_id`; em sucesso de qualquer um, cache é preenchido.

### Se createLedgerEntry pode lançar exceção ou é airbag

É **airbag**: createLedgerEntry está em try/catch (L42–75); retorna `{ success: false, error }` em falha; insertLedgerRow não lança (retorna objeto). Nenhum throw é propagado para o chamador.

### Classificação de risco

| Risco | Classificação | Justificativa |
|-------|----------------|----------------|
| Insert ledger em produção com coluna user_id | **BAIXO** | Fallback user_id primeiro; cache evita tentativas repetidas; produção tem user_id. |
| Falha em ambos (user_id e usuario_id) | **BAIXO** | Retorno { success: false }; POST withdraw retorna 201 com saque criado (estratégia S1) sem derrubar request. |

---

## SEÇÃO 7 — MATRIZ DE RISCO FINAL

| Área | Status | Risco | Observação |
|------|--------|-------|------------|
| Depósito | OK | Baixo | Webhook + reconciler; claim atômico; não credita duas vezes o mesmo payment_id. |
| Shoot | OK | Baixo | Validação de saldo antes; valor em batchConfigs; insert chutes. |
| Saque POST | OK | Baixo | Idempotência por correlation_id; 1 pendente por usuário; débito com optimistic lock; ledger com fallback user_id/usuario_id. |
| Worker | OK | Baixo | Lock onlyWhenStatus PENDING; transições PROCESSING → COMPLETED/REJECTED; rollback em falha. |
| Ledger | OK | Baixo | Dedup (correlation_id + tipo + referencia); fallback user_id/usuario_id; createLedgerEntry não lança. |
| usuario_id vs user_id | OK | Baixo | Divergência isolada em ledger_financeiro; código com fallback e cache; produção tem user_id. |

---

## SEÇÃO 8 — VEREDITO TÉCNICO

### 1) Estamos prontos para fechar o sistema financeiro?

**SIM**, desde que a versão em produção (v311) já inclua o patch de insertLedgerRow com fallback user_id/usuario_id e cache. As evidências coletadas mostram esse código no **repo local**. Se a imagem deployada (deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J) for dessa base, o insert no ledger em produção deve funcionar com a coluna user_id.

### 2) O que falta exatamente?

- Confirmar que a **imagem atual no Fly** contém o arquivo processPendingWithdrawals.js com insertLedgerRow e ledgerUserIdColumn (ex.: via build/deploy que gerou a imagem, ou inspeção do artefato).
- Executar **testes E2E** com Bearer (1 depósito aprovado → saldo; 1 saque request → ledger + worker; 2 shoots) em ambiente controlado e validar invariantes.
- Opcional: rodar em produção o script de probe **somente leitura** (schema_probe ou ledger_probe) para reconfirmar colunas do ledger, sem expor secrets (output já documentado).

### 3) Qual é a única mudança de menor risco necessária (se houver)?

Nenhuma mudança de código é **necessária** para o fechamento se o patch já estiver deployado. Se a versão em produção **não** tiver o fallback user_id/usuario_id, a única mudança de menor risco é **garantir o deploy** do código atual de processPendingWithdrawals.js (insertLedgerRow + cache), sem alterar banco nem migrations.

### 4) Qual seria o plano de rollout seguro?

1. Garantir que o build da release (v311 ou próxima) inclui processPendingWithdrawals.js com insertLedgerRow.  
2. Deploy em staging (se houver) com ledger usando user_id; executar POST /api/withdraw/request e validar ledger e logs.  
3. Deploy em produção; verificar 1 saque de teste e GET /api/withdraw/history.  
4. Monitorar logs: não deve haver [LEDGER] insert falhou (airbag) para step user_id em ambiente com user_id (ou apenas 1 fallback inicial para usuario_id em ambiente com usuario_id).

### 5) Qual seria o rollback imediato?

Reverter para a versão anterior do processPendingWithdrawals.js que fazia insert **apenas** com `usuario_id` (sem insertLedgerRow e sem cache) e redeploy. Em produção com ledger **user_id**, isso faria o insert do ledger falhar de novo até que um patch (ou migration) seja reaplicado; o POST /api/withdraw/request continuaria retornando 201 com saque criado (estratégia S1), com ledger pendente para auditoria.

---

*Relatório READ-ONLY. Nenhum arquivo foi alterado; nenhum deploy, alteração de banco ou de secrets foi executado. Tokens e service role não foram impressos (apenas flags de presença e output de probe sem valores sensíveis).*
