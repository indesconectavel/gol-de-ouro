# AUDITORIA FORENSE READ-ONLY — Divergência usuario_id vs user_id

**Data:** 2026-03-04  
**Escopo:** Código (repo) + banco real (produção Fly/Supabase).  
**Regras:** Nenhuma alteração em código, banco, migrations, deploy ou env.

---

## PASSO A — Auditoria no repositório (código)

### A.1 Busca global e tabela de ocorrências

Foram buscados: `usuario_id`, `user_id`, `.eq('usuario_id')`, `.eq('user_id')`, inserts e JOINs envolvendo essas colunas.

**Tabela resumida (arquivos principais; contexto e tabela envolvida):**

| Arquivo | Linha(s) | Coluna usada | Contexto | Tabela envolvida |
|---------|----------|--------------|----------|------------------|
| src/domain/payout/processPendingWithdrawals.js | 26-27 | usuario_id | INSERT | ledger_financeiro |
| server-fly.js | 1551, 1479, 1664, 1918, 2060, 2070, 2084, 2095, 2155, 2211, 2228, 2233, 2248, 2260, 2269, 2278, 2342, 2392, 2405, 2412, 2943, 2964 | usuario_id | SELECT/INSERT/UPDATE | saques, usuarios, pagamentos_pix |
| server-fly.js | 494, 564, 595, 615, 649, 676, 696 | user_id | SELECT/INSERT (tokens) | password_reset_tokens / verify |
| controllers/paymentController.js | 71, 173, 254, 268, 274, 341, 361 | usuario_id | INSERT/SELECT/UPDATE | pagamentos_pix, transacoes, saques, usuarios |
| controllers/adminSaquesController.js | 24, 45 | usuario_id | SELECT | saques |
| services/history-service.js | 30, 86, 161, 173, 221, 297, 343 | usuario_id | SELECT/INSERT | transacoes, user_transaction_history |
| services/notification-service.js | 172, 241, 281 | usuario_id | SELECT/INSERT | notifications |
| services/auth-service-unified.js | 361, 419 | user_id | INSERT | tabelas de token/sessão |
| router.js | 427 | usuario_id | SELECT | (saques/usuarios) |
| router-database.js | 405 | user_id | SELECT | games |
| database/schema-ledger-financeiro.sql | 7, 13 | usuario_id | CREATE TABLE / INDEX | ledger_financeiro |
| database/schema.sql | 51, 65, 77, 93, 110, 125, 148, 160, 191, 200, 212 | usuario_id | CREATE TABLE (FK) | partida_jogadores, chutes, transacoes, etc. |
| database/schema-history.sql | 7, 19, 26, 33, 55, 69 | usuario_id | CREATE TABLE / RLS | user_transaction_history |
| database/schema-notifications.sql | 7, 13, 19, 30, 31, 41, 44 | usuario_id | CREATE TABLE / INDEX / RLS | user_subscriptions, notification_history |
| password-reset-tokens.sql | 10, 19 | user_id | CREATE TABLE / INDEX | password_reset_tokens |
| fix-supabase-rls.sql | 39-129 | user_id | RLS policies | Transaction, Game, Withdrawal, etc. (schema em inglês) |

### A.2 Confirmações no repo

- **usuarios:** PK é `id` (database/schema.sql linha 10: `id UUID PRIMARY KEY`). Não há coluna `usuario_id` nem `user_id` na tabela `usuarios`; as outras tabelas referenciam `usuarios(id)` por FK.
- **saques:** No código e nos schemas do repo usa-se **usuario_id** (server-fly.js insert L1551, SELECT L1479, L1664; schema-ledger e vários SCHEMA-*.sql para saques).
- **ledger_financeiro:** No código e em **database/schema-ledger-financeiro.sql** usa-se **usuario_id** (processPendingWithdrawals.js L26-27; schema-ledger-financeiro.sql L7, L13).
- **Inconsistência identificada no repo:** Nenhuma no domínio principal. O arquivo **fix-supabase-rls.sql** e tabelas como **password_reset_tokens** usam **user_id** para tabelas específicas (tokens, RLS em schema “User/Transaction/Game” em inglês); o restante do app (saques, pagamentos, transacoes, chutes, ledger no schema PT) usa **usuario_id**.

### A.3 Schemas SQL e migrations

- **database/schema-ledger-financeiro.sql:** Define `ledger_financeiro` com coluna **usuario_id** (uuid not null) e índice em `usuario_id`.
- **database/*.sql:** Os schemas em database/ (schema.sql, schema-history.sql, schema-notifications.sql, schema-ranking.sql) usam **usuario_id** para FKs a `usuarios(id)`.
- **password-reset-tokens.sql:** Define **user_id** UUID REFERENCES usuarios(id) — tabela de tokens com nomenclatura em inglês.
- **fix-supabase-rls.sql:** Políticas RLS para tabelas "User", "Transaction", "Game", "Withdrawal", etc., usando **user_id** — schema alternativo em inglês.
- **Migrations:** Pasta **migrations/** existe apenas com `.gitkeep`; não há arquivos de migration versionados.
- **Nenhum schema no repo** que defina `ledger_financeiro` com coluna **user_id**; todos os arquivos que citam ledger_financeiro usam **usuario_id**.

---

## PASSO B — Auditoria no banco real (produção)

### B.1 Método

- App Fly: **goldeouro-backend-v2**, process group **app**.
- Script Node READ-ONLY em `/tmp/schema_probe_usuario_user_id.js`: para cada tabela, tentativa de `select(col).limit(1)` para `id`, `usuario_id`, `user_id`. Resultado: coluna existe (YES) ou mensagem de erro (ex.: "column X does not exist").
- **Limitação:** O cliente Supabase (REST) não expõe `information_schema.columns`, `pg_indexes` nem consultas SQL arbitrárias. Índices e FKs não foram listados por query direta; a evidência é por inferência das colunas que aceitam SELECT.

### B.2 Resultado do probe (output completo, sem secrets)

```
SUPABASE_URL_PRESENT true
SERVICE_ROLE_PRESENT true
TABLE_usuarios {"id":"YES","usuario_id":"column usuarios.usuario_id does not exist","user_id":"column usuarios.user_id does not exist"}
TABLE_saques {"id":"YES","usuario_id":"YES","user_id":"column saques.user_id does not exist"}
TABLE_ledger_financeiro {"id":"YES","usuario_id":"column ledger_financeiro.usuario_id does not exist","user_id":"YES"}
TABLE_tentativas_chute {"id":"Could not find the table 'public.tentativas_chute' in the schema cache",...}
TABLE_transacoes {"id":"YES","usuario_id":"YES","user_id":"column transacoes.user_id does not exist"}
TABLE_pagamentos_pix {"id":"YES","usuario_id":"YES","user_id":"column pagamentos_pix.user_id does not exist"}
TABLE_withdrawals {"id":"Could not find the table 'public.withdrawals' in the schema cache",...}
TABLE_password_reset_tokens {"id":"YES","usuario_id":"column password_reset_tokens.usuario_id does not exist","user_id":"YES"}
TABLE_chutes {"id":"YES","usuario_id":"YES","user_id":"column chutes.user_id does not exist"}
SCHEMA_PROBE_DONE ok
```

### B.3 Tabela comparativa (produção)

| Tabela | Coluna usuario_id existe? | Coluna user_id existe? | Observação |
|--------|---------------------------|-------------------------|------------|
| usuarios | Não (não se aplica; PK é id) | Não | OK |
| saques | **Sim** | Não | Alinhado com código e schema repo |
| **ledger_financeiro** | **Não** | **Sim** | **Divergência: código/schema repo usam usuario_id** |
| tentativas_chute | — | — | Tabela não encontrada no schema cache |
| transacoes | **Sim** | Não | Alinhado com código |
| pagamentos_pix | **Sim** | Não | Alinhado com código |
| withdrawals | — | — | Tabela não encontrada |
| password_reset_tokens | Não | **Sim** | Alinhado com password-reset-tokens.sql e server-fly.js |
| chutes | **Sim** | Não | Alinhado com código |

### B.4 Índices e foreign keys

- **Índices:** Não foi possível executar `pg_indexes` via cliente REST; não aplicado nesta auditoria.
- **Foreign keys:** Não foi possível executar a query em `information_schema.table_constraints` / `key_column_usage` via REST; não aplicado. A inferência é que tabelas com `usuario_id` ou `user_id` referenciam `usuarios(id)` conforme os schemas do repo.

---

## PASSO C — Análise de consistência

1. **Existe padrão único ou mistura?**  
   **Mistura controlada:** O domínio principal (saques, transacoes, pagamentos_pix, chutes, ledger no schema PT) no **código** e nos **schemas do repo** usa **usuario_id**. Em produção, **todas essas tabelas exceto ledger_financeiro** têm a coluna **usuario_id**. A tabela **ledger_financeiro** em produção tem **user_id** e não tem **usuario_id**. As tabelas de token (password_reset_tokens) e o schema em inglês (fix-supabase-rls) usam **user_id** tanto no repo quanto no banco.

2. **Alguma tabela usa usuario_id enquanto outra usa user_id (no mesmo domínio)?**  
   **Sim, apenas no caso ledger_financeiro:** Código e schema-ledger-financeiro.sql usam **usuario_id**; o banco em produção tem **user_id** e não tem **usuario_id**. Demais tabelas do domínio financeiro/jogo (saques, transacoes, pagamentos_pix, chutes) usam **usuario_id** em código e em produção.

3. **Existem FKs inconsistentes?**  
   Não foi possível verificar FKs no banco via REST. No repo, todos os FKs para usuário nas tabelas principais apontam para `usuarios(id)`; a divergência é apenas o **nome da coluna** em `ledger_financeiro` (usuario_id no repo vs user_id no banco).

4. **O código está apontando para colunas que não existem?**  
   **Sim, apenas para ledger_financeiro:** O insert em `createLedgerEntry` (processPendingWithdrawals.js) envia **usuario_id**. No banco real a coluna existente é **user_id**. Resultado: erro "column ledger_financeiro.usuario_id does not exist" e falha do POST /api/withdraw/request (500 antes do patch S1).

5. **Risco de dados órfãos por divergência?**  
   Não. A divergência é de **nome de coluna**, não de referência a outra tabela. Se o insert usasse a coluna correta (user_id) com o mesmo valor (userId), a integridade referencial seria mantida. Órfãos só surgiriam se houvesse FK quebrada ou dados inseridos em tabela errada; aqui o problema é apenas a coluna inexistente no insert.

6. **O problema do ledger é isolado ou parte de um padrão maior?**  
   **Isolado.** Apenas **ledger_financeiro** em produção tem **user_id** enquanto o código (e o schema do repo) usam **usuario_id**. Saques, transacoes, pagamentos_pix e chutes estão alinhados (usuario_id em código e banco).

---

## PASSO D — Classificação do risco

### NÍVEL DE RISCO: **MÉDIO**

- **Justificativa:**  
  - O impacto direto (500 no POST de saque) já foi mitigado no código pelo patch S1 (retorno 201 mesmo com falha de ledger), reduzindo impacto em produção.  
  - A causa raiz está identificada e localizada em uma única tabela e uma única coluna (ledger_financeiro / usuario_id vs user_id).  
  - Não há evidência de outras tabelas do fluxo principal com o mesmo desalinhamento; não há migração automática em uso que possa replicar o erro em massa.  
  - O risco permanece **médio** porque: (1) o ledger não é preenchido em produção para saques (auditoria incompleta); (2) qualquer correção futura (schema ou código) exige coordenação e teste para não quebrar outros ambientes; (3) existem múltiplos arquivos de schema no repo (SCHEMA-*.sql, database/*.sql) sem um único “source of truth” documentado para produção.

---

## PASSO E — Conclusão estratégica (sem aplicar)

Três cenários possíveis, **sem recomendar aplicação nesta auditoria**:

---

### Cenário A — Padronizar tudo para usuario_id

- **O que seria feito:** No banco de produção, alterar `ledger_financeiro` para ter a coluna **usuario_id** (e, se desejado, remover **user_id** após migração de dados). Código e schema-ledger-financeiro.sql já usam usuario_id; não mudaria.
- **Impacto técnico:** Migration ou ALTER TABLE no Supabase; possível cópia de dados de user_id → usuario_id se ambas existirem; índices/FK a ajustar conforme schema do repo.
- **Risco:** Médio — alteração de schema em produção; requer janela e rollback plan.
- **Complexidade:** Baixa a média (uma tabela, uma coluna).
- **Recomendação a longo prazo:** Alinha o banco ao repo e ao restante do domínio (saques, transacoes, etc. já usam usuario_id). Consistência de nomenclatura em PT.

---

### Cenário B — Padronizar tudo para user_id

- **O que seria feito:** Alterar código e schema-ledger-financeiro.sql para usar **user_id** no insert em ledger_financeiro (e, em tese, padronizar outras tabelas para user_id).
- **Impacto técnico:** Mudança em processPendingWithdrawals.js (insert), possivelmente em outros pontos que leem ledger_financeiro; vários schemas e scripts no repo usam usuario_id (saques, transacoes, pagamentos_pix, chutes) — padronizar “tudo” para user_id exigiria muitas alterações.
- **Risco:** Alto — alteração ampla de código e de convenção; risco de regressão em vários fluxos.
- **Complexidade:** Alta.
- **Recomendação a longo prazo:** Menos segura; o repo está majoritariamente em usuario_id no domínio principal; manter usuario_id e corrigir apenas o banco (Cenário A) ou a camada de adaptação (Cenário C) é mais coerente.

---

### Cenário C — Manter como está e criar camada de adaptação

- **O que seria feito:** Não alterar o banco. No código, em `createLedgerEntry`, mapear o campo para o nome existente no banco: inserir como **user_id** em vez de **usuario_id** (ex.: `user_id: usuarioId` no payload do insert). Schema do repo continua documentando usuario_id; a “adaptação” fica apenas no ponto de escrita em ledger_financeiro.
- **Impacto técnico:** Uma alteração localizada no insert (processPendingWithdrawals.js ou wrapper); leituras que usam usuario_id em ledger_financeiro precisariam usar user_id ao selecionar (já que a coluna no banco é user_id).
- **Risco:** Baixo — mudança mínima; possível inconsistência documental (schema diz usuario_id, banco tem user_id).
- **Complexidade:** Baixa.
- **Recomendação a longo prazo:** Solução mais segura no curto prazo para desbloquear o ledger sem migration. A longo prazo, alinhar schema do banco ao repo (Cenário A) reduz dívida técnica e confusão.

---

## Resumo das evidências

| Fonte | Evidência |
|-------|-----------|
| Código (processPendingWithdrawals.js) | INSERT em ledger_financeiro usa **usuario_id** (L26-27). |
| Repo (database/schema-ledger-financeiro.sql) | CREATE TABLE ledger_financeiro com **usuario_id** (L7). |
| Produção (probe) | ledger_financeiro: coluna **usuario_id** não existe; coluna **user_id** existe. |
| Produção (probe) | saques, transacoes, pagamentos_pix, chutes: **usuario_id** existe; user_id não. |
| Produção (probe) | password_reset_tokens: **user_id** existe (consistente com repo e server-fly.js). |

**Conclusão objetiva:** A divergência que causa falha no insert do ledger em produção é **apenas** na tabela **ledger_financeiro**: o banco tem a coluna **user_id** e o código (e o schema de referência do repo) usam **usuario_id**. Nenhuma outra tabela do domínio principal apresentou essa divergência. Nenhuma alteração foi aplicada nesta auditoria.
