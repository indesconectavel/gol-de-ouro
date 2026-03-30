# Validação do schema financeiro Supabase (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — nenhuma alteração em banco ou código.  
**Objetivo:** Verificar se a estrutura das tabelas financeiras está compatível com o código em uso (server-fly.js, src/domain/payout/*, worker).

---

## 1. Resumo da compatibilidade

| Tabela | Colunas solicitadas | Compatível com código? | Observações |
|--------|---------------------|------------------------|-------------|
| **usuarios** | id, saldo | ✅ Sim | Código usa ainda email, username, updated_at, etc. |
| **pagamentos_pix** | payment_id, status, valor, usuario_id | ✅ Sim | Código exige também id, external_id, amount, created_at, updated_at. |
| **saques** | id, usuario_id, valor, status, correlation_id | ✅ Sim | Código exige também amount, fee, net_amount, pix_key/pix_type ou chave_pix/tipo_chave, created_at, updated_at, processed_at, transacao_id, motivo_rejeicao. |
| **ledger_financeiro** | id, user_id ou usuario_id, tipo, valor, referencia, created_at | ✅ Sim* | *Código aceita **user_id** ou **usuario_id** (fallback). Precisa de **correlation_id**. CHECK do tipo deve incluir `withdraw_request`. |

---

## 2. Tabela `usuarios`

### Colunas que você listou
- **id** — usada em todos os selects/updates por usuário (server-fly.js, processPendingWithdrawals.js).
- **saldo** — lida e atualizada em: request de saque, webhook depósito, reconciliação, shoot, rollback.

### Conclusão
**Compatível.** O código em produção (server-fly.js, processPendingWithdrawals) usa `usuarios.id` e `usuarios.saldo` exatamente como esperado. O schema em `database/schema.sql` define `id` (UUID PK) e `saldo` (DECIMAL(10,2) DEFAULT 0.00). Outras colunas usadas pelo mesmo código (email, username, senha_hash, tipo, ativo, updated_at, total_apostas, total_ganhos, etc.) precisam existir para auth/perfil/jogo, mas para o **bloco financeiro** id + saldo são suficientes e compatíveis.

---

## 3. Tabela `pagamentos_pix`

### Colunas que você listou
- **payment_id** — usada em server-fly.js no insert (criar PIX), no webhook (claim por `payment_id` ou `external_id`) e na reconciliação.
- **status** — insert `'pending'`, update para `'approved'` no webhook/reconciliação; select com `.eq('status','pending')` e `.neq('status','approved')`.
- **valor** — insert e uso no crédito de saldo (valor ou amount).
- **usuario_id** — insert e select; usado para creditar `usuarios.saldo`.

### Colunas adicionais usadas pelo código
- **id** — retorno do insert; reconciliação faz update por `id` e select por id.
- **external_id** — gravado no insert (server-fly.js ~1798); webhook e reconciliação fazem claim por `external_id` ou `payment_id`.
- **amount** — inserido junto com `valor` (server-fly.js); crédito usa `pixRecord.amount ?? pixRecord.valor`.
- **created_at**, **updated_at** — filtro de pendentes antigos (reconciliação) e update em approved.
- **qr_code**, **qr_code_base64**, **pix_copy_paste** — opcionais no insert.

### Conclusão
**Compatível.** As colunas payment_id, status, valor, usuario_id são obrigatórias e estão alinhadas ao código. O repositório prevê ainda `external_id` e `amount` (ex.: SCHEMA-FORCA-CACHE-PIX-SAQUE.sql). Para produção, a tabela deve ter no mínimo: **id, usuario_id, payment_id, external_id (ou payment_id usado como external_id), status, valor, amount, created_at, updated_at**.

---

## 4. Tabela `saques`

### Colunas que você listou
- **id** — usada em selects, updates, insert (retorno), ledger (referencia), webhook.
- **usuario_id** — insert, select, update, webhook, worker.
- **valor** — insert e leitura (valor ou amount).
- **status** — insert `'pendente'`, update para `'processando'`, `'concluido'`, `'rejeitado'`; filtros em worker e webhook.
- **correlation_id** — insert (idempotência), select (idempotência e webhook), obrigatória para o fluxo.

### Colunas adicionais usadas pelo código
- **amount** — insert (server-fly.js); worker e webhook leem `amount ?? valor`.
- **fee**, **net_amount** — insert; worker e rollback usam.
- **pix_key**, **pix_type** — insert (server-fly); worker usa `pix_key ?? chave_pix`, `pix_type ?? tipo_chave`.
- **chave_pix**, **tipo_chave** — fallback legado no mesmo insert e no worker.
- **created_at**, **updated_at** — ordenação e filtros (worker, reconciler).
- **processed_at**, **transacao_id** — preenchidos pelo worker e webhook ao concluir.
- **motivo_rejeicao** — preenchido no rollback.

### Conclusão
**Compatível.** As colunas id, usuario_id, valor, status, correlation_id são essenciais e usadas como esperado. O código foi escrito para conviver com dois desenhos (valor/chave_pix/tipo_chave e amount/pix_key/pix_type); o schema em produção deve ter pelo menos uma das duplas (valor ou amount; chave_pix/tipo_chave ou pix_key/pix_type) e, para o worker e webhook funcionarem por completo: **fee, net_amount, created_at, updated_at, processed_at, transacao_id, motivo_rejeicao**. O `database/schema.sql` define valor, chave_pix, tipo_chave; `schema-ledger-financeiro.sql` e scripts de correção adicionam correlation_id, amount, fee, net_amount, pix_key, pix_type.

---

## 5. Tabela `ledger_financeiro`

### Colunas que você listou
- **id** — retorno do insert; select para dedup.
- **user_id ou usuario_id** — o código tenta primeiro **user_id**, depois **usuario_id** (processPendingWithdrawals.js, insertLedgerRow). Basta existir **uma** das duas.
- **tipo** — insert e select (dedup e webhook). Valores usados no código: `withdraw_request`, `payout_confirmado`, `falha_payout`, `rollback`.
- **valor** — insert (valor numérico do lançamento).
- **referencia** — insert (id do saque ou `saqueId:fee`); select para idempotência e auditoria.
- **created_at** — inserido pelo código; usado em consultas de auditoria.

### Coluna adicional obrigatória no código
- **correlation_id** — faz parte do payload de insert e da dedup (select por correlation_id + tipo + referencia). O schema em `database/schema-ledger-financeiro.sql` já prevê `correlation_id text not null`.

### Atenção: CHECK do `tipo`
O arquivo `database/schema-ledger-financeiro.sql` declara:
```sql
CHECK (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout'))
```
O código em produção insere **`withdraw_request`** (server-fly.js ao criar saque; processPendingWithdrawals não insere withdraw_request, só rollback, falha_payout, e o webhook insere payout_confirmado/falha_payout). Ou seja, **o código insere `withdraw_request`**, que **não** está na lista do CHECK acima. Para o schema estar compatível com o código, o CHECK em produção deve incluir **`withdraw_request`** (ou a tabela não deve restringir esses valores). Caso contrário, o insert de ledger no request de saque falhará.

### Conclusão
**Compatível** desde que:
1. Exista **uma** das colunas **user_id** ou **usuario_id** (o código trata as duas).
2. Existam **tipo, valor, referencia, correlation_id, created_at**.
3. O CHECK de **tipo** (se houver) inclua **`withdraw_request`** além de rollback, payout_confirmado, falha_payout.

Documentação anterior (INVENTARIO-SCHEMA-FINANCEIRO-READONLY-2026-03-04) indica que em produção a coluna de usuário do ledger é **user_id**; o código está preparado para os dois casos.

---

## 6. Checklist final (schema vs código)

| Requisito | Status |
|-----------|--------|
| **usuarios**: id, saldo | ✅ Código usa; compatível. |
| **pagamentos_pix**: payment_id, status, valor, usuario_id | ✅ Código usa; compatível. Incluir também id, external_id, amount, created_at, updated_at para o fluxo completo. |
| **saques**: id, usuario_id, valor, status, correlation_id | ✅ Código usa; compatível. Incluir amount, fee, net_amount, chave_pix/tipo_chave ou pix_key/pix_type, created_at, updated_at, processed_at, transacao_id, motivo_rejeicao para worker e webhook. |
| **ledger_financeiro**: id, user_id ou usuario_id, tipo, valor, referencia, created_at | ✅ Código usa; compatível. Incluir **correlation_id**. Garantir que CHECK de tipo aceite **withdraw_request**. |

---

## 7. Conclusão

O schema financeiro está **compatível com o código** desde que:

1. **usuarios** tenha **id** e **saldo** (e as demais colunas usadas por auth/perfil/jogo).
2. **pagamentos_pix** tenha **id, usuario_id, payment_id, status, valor** e, para o fluxo atual, **external_id, amount, created_at, updated_at**.
3. **saques** tenha **id, usuario_id, valor, status, correlation_id** e, para o fluxo completo, **amount, fee, net_amount**, chaves PIX (**pix_key/pix_type** ou **chave_pix/tipo_chave**), **created_at, updated_at, processed_at, transacao_id, motivo_rejeicao**.
4. **ledger_financeiro** tenha **id, correlation_id, tipo, valor, referencia, created_at** e **uma** das colunas **user_id** ou **usuario_id**; e que a constraint de **tipo** (se existir) permita o valor **withdraw_request**.

Único ponto que pode quebrar em produção é o **CHECK de `ledger_financeiro.tipo`** se não incluir `withdraw_request`. Recomenda-se confirmar no Supabase (SQL ou painel) se o CHECK atual aceita `withdraw_request` ou se a tabela foi criada sem esse CHECK.

---

*Relatório gerado em modo READ-ONLY. Nenhuma alteração foi feita em banco ou código.*
