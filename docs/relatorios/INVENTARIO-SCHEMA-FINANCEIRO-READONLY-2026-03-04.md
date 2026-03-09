# Inventário Schema Financeiro (READ-ONLY) — Backend Goldeouro

**Data:** 2026-03-04  
**Escopo:** Tabelas e colunas usadas pelo backend no fluxo financeiro (depósito, jogo, saque, ledger).  
**Fonte:** database/*.sql + uso em server-fly.js e src/domain/payout/*.js.

---

## 1. Tabelas do domínio financeiro (inventário)

### 1.1 usuarios

| Coluna        | Tipo (schema repo)     | Uso no backend (evidência)                    |
|---------------|------------------------|----------------------------------------------|
| id            | UUID PK                | FK em todas as tabelas de usuário            |
| email         | VARCHAR(255) UNIQUE    | Auth, perfil                                 |
| nome          | VARCHAR(255)           | Perfil                                       |
| senha_hash    | VARCHAR(255)           | Login                                        |
| **saldo**     | DECIMAL(10,2) DEFAULT 0| Débito/crédito depósito, saque, shoot        |
| tipo          | VARCHAR(50)            | jogador, admin, moderador                    |
| ativo         | BOOLEAN                 | —                                            |
| email_verificado | BOOLEAN              | —                                            |
| created_at    | TIMESTAMPTZ            | —                                            |
| updated_at    | TIMESTAMPTZ            | Atualizado em updates de saldo               |

**Evidência (saldo):** server-fly.js:1500 (select saldo), 1532–1544 (update débito saque), 1574 (rollback), 2082–2093 (crédito webhook), 2403–2410 (crédito reconciler), 1364 (shoot vencedor).

**Schema:** database/schema.sql L9–28.

---

### 1.2 saques

| Coluna           | Tipo (schema repo)     | Uso no backend                               |
|------------------|------------------------|----------------------------------------------|
| id               | UUID PK                | Referência em ledger (referencia), webhook   |
| usuario_id       | UUID NOT NULL FK       | Dono do saque; SELECT/INSERT (server-fly, worker) |
| transacao_id     | UUID                   | Preenchido pelo worker (MP transfer id)       |
| valor            | DECIMAL(10,2)          | Valor solicitado                             |
| chave_pix        | VARCHAR(255)           | Chave PIX (legado)                           |
| tipo_chave       | VARCHAR(50) CHECK      | cpf, cnpj, email, telefone, aleatoria       |
| status           | VARCHAR(50) CHECK      | pendente, processando, concluido, rejeitado, cancelado |
| motivo_rejeicao  | TEXT                   | Rollback / timeout reconciler                |
| processed_at     | TIMESTAMPTZ            | Preenchido ao COMPLETED                      |
| created_at       | TIMESTAMPTZ            | —                                            |
| updated_at       | TIMESTAMPTZ            | —                                            |
| correlation_id   | TEXT                   | Idempotência request; alter add column (schema-ledger) |
| amount, fee, net_amount | —              | Usados no código (compatibilidade)          |
| pix_key, pix_type| —                      | Código (processPendingWithdrawals, server-fly) |

**Evidência:** server-fly.js:1443 (idempotência), 1477 (pendente por usuario_id), 1549 (insert), 1662 (history), 2154 (webhook select), 2245 (update PROCESSING); processPendingWithdrawals.js:271–278 (select PENDING), 294–302 (lock).

**Schema:** database/schema.sql L107–119; database/schema-ledger-financeiro.sql L18–19 (correlation_id).

---

### 1.3 ledger_financeiro

| Coluna         | Tipo (schema repo)     | Uso no backend                               |
|----------------|------------------------|----------------------------------------------|
| id             | UUID PK                | Retorno do insert; dedup                     |
| correlation_id | TEXT NOT NULL          | Dedup (correlation_id + tipo + referencia)   |
| tipo           | TEXT NOT NULL CHECK    | deposito, saque, taxa, rollback, payout_confirmado, falha_payout |
| usuario_id     | UUID NOT NULL (repo)   | **Produção tem user_id** — ver auditoria     |
| valor          | NUMERIC(12,2) NOT NULL| Valor do lançamento                         |
| referencia     | TEXT                   | saque.id ou saque.id:fee                     |
| created_at     | TIMESTAMPTZ            | Inserido pelo código                         |

**Evidência:** processPendingWithdrawals.js:46–56 (SELECT dedup), 59–65 (payloadBase), insertLedgerRow (INSERT com user_id ou usuario_id); server-fly.js:2182 (SELECT id, tipo webhook), 2208, 2257 (createLedgerEntry).

**Schema:** database/schema-ledger-financeiro.sql L3–15.  
**Produção:** coluna **user_id** existe; **usuario_id** não existe (probe 2026-03-04).

---

### 1.4 pagamentos_pix

| Coluna      | Tipo (schema repo)     | Uso no backend                               |
|-------------|------------------------|----------------------------------------------|
| id          | UUID PK                | Claim, reconciler                            |
| usuario_id  | UUID NOT NULL FK       | Dono do pagamento; crédito em usuarios.saldo |
| transacao_id| UUID                   | Opcional                                     |
| payment_id  | VARCHAR(255) UNIQUE    | Idempotência webhook; claim por payment_id  |
| external_id | —                      | Usado no código (claim e reconciler)        |
| status      | VARCHAR(50) CHECK      | pending, approved, rejected, cancelled       |
| valor / amount | DECIMAL               | Valor creditado                              |
| created_at  | TIMESTAMPTZ            | Filtro reconciler (idade)                    |
| updated_at  | TIMESTAMPTZ            | Update para approved                         |

**Evidência:** server-fly.js:1811 (insert criar PIX), 1890 (select usuario), 2004–2075 (webhook claim approved), 2341–2417 (reconcilePendingPayments).

**Schema:** database/schema.sql L90–105.

---

### 1.5 chutes

| Coluna            | Tipo (schema repo)     | Uso no backend                    |
|-------------------|------------------------|-----------------------------------|
| id                | UUID PK                | —                                 |
| partida_id        | UUID (schema antigo)   | Código usa lote_id (memória)      |
| usuario_id        | UUID NOT NULL FK       | Dono do chute                     |
| lote_id           | —                      | Inserido no código (server-fly L1312) |
| direcao           | —                      | direction                         |
| valor_aposta      | —                      | amount                            |
| resultado         | —                      | goal / miss                       |
| premio, premio_gol_de_ouro | —               | Prêmios                           |
| contador_global   | —                      | contadorChutesGlobal              |
| shot_index        | —                      | shotIndex + 1                     |

**Evidência:** server-fly.js:1310 (insert chutes), 1312 (usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index).

**Schema:** database/schema.sql L61–71 (estrutura partida_id, usuario_id, zona, potencia, angulo, resultado, gol_marcado). Código pode usar colunas adicionais (lote_id, etc.) se existirem no banco.

---

### 1.6 transacoes

| Coluna          | Tipo (schema repo)     | Uso no backend                    |
|-----------------|------------------------|-----------------------------------|
| id              | UUID PK                | —                                 |
| usuario_id      | UUID NOT NULL FK       | —                                 |
| tipo            | VARCHAR(50) CHECK      | deposito, saque, aposta, premio…  |
| valor           | DECIMAL(12,2)          | —                                 |
| saldo_anterior  | DECIMAL(12,2)          | —                                 |
| saldo_posterior | DECIMAL(12,2)          | —                                 |
| status          | VARCHAR(50)            | pendente, processando, concluida… |

**Uso:** Schema existe; server-fly.js não insere em transacoes no fluxo principal de depósito/saque/shoot documentado nesta auditoria. Outros controllers (paymentController, history-service) podem usar.

**Schema:** database/schema.sql L74–86.

---

### 1.7 metricas_globais

| Coluna                   | Uso no backend                    |
|--------------------------|-----------------------------------|
| id                       | eq('id', 1)                       |
| contador_chutes_global   | Carregado/atualizado no shoot     |
| ultimo_gol_de_ouro       | Último gol de ouro                |

**Evidência:** server-fly.js:2566–2570 (select), 2518 (saveGlobalCounter); 2306 (select).

---

### 1.8 password_reset_tokens

| Coluna     | Tipo (schema repo) | Uso no backend     |
|------------|--------------------|--------------------|
| id         | UUID PK            | —                  |
| user_id    | UUID FK usuarios   | SELECT/INSERT (server-fly L492, 563, 607) |
| token      | —                  | Verificação        |
| expires_at | —                  | —                  |
| used       | —                  | —                  |

**Observação:** Única tabela do domínio “auth” que usa **user_id** no repo e em produção (alinhado).

**Schema:** password-reset-tokens.sql.

---

## 2. Coluna usuario_id vs user_id (resumo por tabela)

| Tabela                | Schema repo   | Produção (probe) | Backend (código)     |
|-----------------------|---------------|------------------|----------------------|
| usuarios              | id (PK)       | id               | —                    |
| saques               | usuario_id    | usuario_id       | usuario_id           |
| ledger_financeiro     | usuario_id    | **user_id**      | Fallback user_id/usuario_id (patch) |
| pagamentos_pix        | usuario_id    | usuario_id       | usuario_id           |
| chutes                | usuario_id    | usuario_id       | usuario_id           |
| transacoes            | usuario_id    | usuario_id       | usuario_id           |
| password_reset_tokens  | user_id       | user_id          | user_id              |

---

## 3. Índices e constraints (schema repo)

- **ledger_financeiro:** UNIQUE (correlation_id, tipo, referencia); CHECK tipo in (...); índice usuario_id (repo) / user_id em prod.
- **saques:** CHECK status in (pendente, processando, concluido, rejeitado, cancelado); índice correlation_id (schema-ledger-financeiro.sql).
- **pagamentos_pix:** payment_id UNIQUE; status CHECK.

---

## 4. Tabelas referenciadas (não financeiras diretas)

- email_verification_tokens (server-fly.js L648, 688)
- metricas_globais (server-fly.js L2306, 2518, 2568)

---

*Inventário READ-ONLY. Nenhuma alteração em banco ou código. Produção pode divergir (ledger_financeiro user_id) conforme relatórios 2026-03-04.*
