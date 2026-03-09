# Auditoria READ-ONLY — Introspecção da tabela `public.saques` no Supabase de PRODUÇÃO

**Data:** 2026-03-02  
**Modo:** READ-ONLY absoluto. Nenhum comando que altere código, git, build, deploy, env ou banco.  
**Objetivo:** Descobrir o schema REAL da tabela `public.saques` em produção e confirmar com evidência: colunas, tipos, nullability, defaults, constraints (CHECK status), índices, triggers, RLS, funções que referenciam a tabela, e existência de `amount` / `fee` / `net_amount` / `pix_key` / `pix_type` / `correlation_id`.

---

## Aviso sobre execução das queries

**Este relatório foi gerado em modo READ-ONLY a partir do repositório.**  
As queries dos **Passos 1 a 7** são **somente SELECT** (introspecção). Elas **precisam ser executadas no Supabase de PRODUÇÃO** por alguém com acesso (ex.: SQL Editor do projeto Supabase).  
**Não execute ALTER/CREATE/DROP/INSERT/UPDATE/DELETE/GRANT/REVOKE.**  
Se alguma query falhar por permissão, registrar no relatório e não tentar contornar.  
Após executar, **preencha as seções "Resultado"** abaixo com o output obtido para completar a auditoria com evidência 100%.

---

## 1) Resumo executivo

- **Objetivo:** Conhecer o schema real de `public.saques` em produção para confirmar divergências em relação ao código (server-fly.js, processPendingWithdrawals.js) e ao schema Consolidado (SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql).
- **Método:** Executar apenas queries SELECT de introspecção (information_schema, pg_constraint, pg_policies, pg_indexes, pg_proc) e uma amostra de dados (SELECT id, status LIMIT 20). Nenhuma escrita ou DDL.
- **O que o código espera no INSERT (server-fly.js L1546–1566):** `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`. Ou seja, o código **exige** as colunas: `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type` (além das do Consolidado).
- **O que o schema Consolidado define (L92–103):** `id`, `usuario_id`, `valor`, `valor_liquido`, `taxa`, `chave_pix`, `tipo_chave`, `status` (CHECK: 'pendente','processando','aprovado','rejeitado'), `created_at`, `updated_at`. **Não** define: `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`.
- **Worker (processPendingWithdrawals.js L133–135):** Faz SELECT com colunas explícitas: `id`, `usuario_id`, `amount`, `valor`, `fee`, `net_amount`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `correlation_id`, `created_at`. Se alguma dessas colunas não existir no banco, o SELECT falha.
- **Status usados pelo código:** 'pendente', 'pending', 'processando', 'aguardando_confirmacao', 'aprovado', 'processado', 'rejeitado', 'falhou'. O Consolidado só permite os quatro primeiros da lista; os demais podem violar CHECK em produção.
- **Conclusão do resumo:** A confirmação final (divergências, riscos reais, Go/No-Go) depende do preenchimento dos **Resultados dos Passos 1–7** após execução no Supabase de produção. Abaixo estão as queries e as seções para colar os resultados.

---

## 2) Estrutura real da tabela (a preencher com resultados)

### PASSO 1 — Listar colunas reais

**Query (somente SELECT):**

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'saques'
ORDER BY ordinal_position;
```

**Resultado (preencher após executar no Supabase de produção):**

| column_name   | data_type                   | is_nullable | column_default |
|---------------|-----------------------------|-------------|----------------|
| *(colar aqui o resultado da query acima)* |

---

### PASSO 2 — Constraints (CHECK / FK / PK / UNIQUE)

**Query:**

```sql
SELECT
  conname,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'saques';
```

**Resultado:**

| conname | definition |
|---------|------------|
| *(colar aqui)* |

**Verificar especialmente:** CHECK de `status`, FK `usuario_id`, UNIQUE (se houver), PK.

---

### PASSO 3 — Triggers

**Query:**

```sql
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'saques';
```

**Resultado:**

| trigger_name | event_manipulation | action_statement |
|--------------|--------------------|------------------|
| *(colar aqui)* |

---

### PASSO 4 — RLS Policies

**Query:**

```sql
SELECT *
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'saques';
```

**Resultado:**

*(colar aqui as linhas retornadas; se a view pg_policies não existir ou der erro de permissão, anotar: "Falha: [mensagem]")*

---

### PASSO 5 — Índices

**Query:**

```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'saques';
```

**Resultado:**

| indexname | indexdef |
|-----------|----------|
| *(colar aqui)* |

---

### PASSO 6 — Funções que referenciam `saques`

**Query:**

```sql
SELECT
  p.proname,
  pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%saques%';
```

**Resultado:**

*(colar nome da função e definição; se vazio, registrar "Nenhuma função encontrada".)*

---

### PASSO 7 — Amostra de dados (valores de status)

**Query:**

```sql
SELECT id, status
FROM public.saques
LIMIT 20;
```

**Resultado:**

| id | status |
|----|--------|
| *(colar aqui)* |

**Objetivo:** Ver quais valores de `status` existem de fato e se há valores fora do CHECK do schema Consolidado ('pendente', 'processando', 'aprovado', 'rejeitado').

---

## 3) Comparação: código vs schema Consolidado vs schema real

### 3.1 O que o código espera (INSERT e worker)

| Coluna          | Uso no código |
|-----------------|----------------|
| usuario_id      | INSERT; worker SELECT |
| valor           | INSERT; worker SELECT (fallback amount) |
| amount          | INSERT; worker SELECT |
| fee             | INSERT; worker SELECT |
| net_amount      | INSERT; worker SELECT |
| correlation_id | INSERT; worker SELECT (obrigatório para o worker) |
| pix_key         | INSERT; worker SELECT |
| pix_type        | INSERT; worker SELECT |
| chave_pix       | INSERT; worker SELECT (fallback pix_key) |
| tipo_chave      | INSERT; worker SELECT (fallback pix_type) |
| status          | INSERT; worker UPDATE (pendente, processando, aguardando_confirmacao, processado, falhou, pending) |
| created_at      | INSERT; worker SELECT |

**Evidência:** server-fly.js:1546–1566 (INSERT); processPendingWithdrawals.js:133–135 (SELECT), 161–165 (uso de amount/valor, fee, net_amount, pix_key/chave_pix, pix_type/tipo_chave, correlation_id).

### 3.2 O que o schema Consolidado define

| Coluna       | Tipo / constraint |
|--------------|-------------------|
| id           | SERIAL PRIMARY KEY |
| usuario_id   | UUID NOT NULL REFERENCES usuarios(id) |
| valor        | DECIMAL(10,2) NOT NULL |
| valor_liquido| DECIMAL(10,2) NOT NULL |
| taxa         | DECIMAL(10,2) NOT NULL |
| chave_pix    | VARCHAR(255) NOT NULL |
| tipo_chave   | VARCHAR(50) NOT NULL CHECK (tipo_chave IN ('cpf','cnpj','email','phone','random')) |
| status       | VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente','processando','aprovado','rejeitado')) |
| created_at   | TIMESTAMPTZ DEFAULT NOW() |
| updated_at   | TIMESTAMPTZ DEFAULT NOW() |

**Não possui:** amount, fee, net_amount, correlation_id, pix_key, pix_type.

**Evidência:** SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:92–103.

### 3.3 Schema real (produção) — a preencher

*(Após preencher o Resultado do PASSO 1, resumir aqui:)*

- **Colunas que existem:** *(lista)*
- **Colunas que NÃO existem:** *(lista)*
- **Existência de amount / fee / net_amount / pix_key / pix_type / correlation_id:** *(Sim/Não por coluna)*

---

## 4) Lista de divergências (confirmadas após preenchimento)

*(Preencher após ter os resultados dos Passos 1–7.)*

| # | Divergência | Evidência (passo / resultado) |
|---|-------------|-------------------------------|
| 1 | *(ex.: Coluna `amount` ausente em produção)* | PASSO 1: colunas retornadas |
| 2 | *(ex.: CHECK status não inclui 'aguardando_confirmacao')* | PASSO 2: definition |
| … | … | … |

---

## 5) Riscos reais confirmados

*(Com base nos resultados reais, marcar o que se confirmar.)*

| Risco | Confirmado? | Evidência |
|-------|-------------|-----------|
| INSERT falha por coluna inexistente (amount, fee, net_amount, correlation_id, pix_key, pix_type) | [ ] Sim / [ ] Não | PASSO 1: se coluna não estiver na lista, risco confirmado. |
| Worker SELECT falha por coluna inexistente | [ ] Sim / [ ] Não | PASSO 1. |
| CHECK status rejeita valores usados pelo worker ('aguardando_confirmacao', 'processado', 'falhou', 'pending') | [ ] Sim / [ ] Não | PASSO 2 (definition) + PASSO 7 (valores existentes). |
| RLS bloqueia operações | [ ] Sim / [ ] Não | PASSO 4. |
| Trigger ou função quebra por coluna ausente | [ ] Sim / [ ] Não | PASSO 3 + PASSO 6. |

---

## 6) Recomendação objetiva

*(Ajustar após preenchimento dos resultados.)*

- **Se produção tiver apenas as colunas do Consolidado (sem amount, fee, net_amount, correlation_id, pix_key, pix_type):**
  - **Risco técnico real:** INSERT do POST /api/withdraw/request falha (500); worker SELECT falha. Causa raiz: colunas inexistentes.
  - **Recomendação:** **A) ADD COLUMN** para as colunas faltantes (NULLABLE ou DEFAULT), e revisar CHECK de `status` para incluir 'pending', 'aguardando_confirmacao', 'processado', 'falhou'. Opção B (ajustar código para escrever só colunas atuais) é alternativa; híbrido possível (código preenche valor_liquido/taxa no INSERT e worker continua com fallbacks).

- **Se produção já tiver as colunas amount, fee, net_amount, correlation_id, pix_key, pix_type:**
  - **Risco técnico real:** Pode ser outro (ex.: CHECK status, RLS, trigger). Usar Passos 2–7 para identificar.
  - **Recomendação:** Se schema já estiver alinhado ao código, investigar outra causa do 500 (ex.: RLS, rede, payload).

- **Impacto real em produção:** ADD COLUMN não altera Vercel/Fly; altera apenas o banco Supabase quando a migration for aplicada. Rollback: não remover colunas; reverter CHECK ou código se necessário.

- **Opção A (ADD COLUMN) é segura?** Sim, desde que: (i) migration use ADD COLUMN NULLABLE (ou DEFAULT); (ii) CHECK de status seja compatível com os valores usados; (iii) migration seja testada em staging antes de produção.

---

## 7) Go / No-Go

| Critério | Status |
|----------|--------|
| Queries de introspecção (Passos 1–7) executadas em produção | [ ] Sim / [ ] Não |
| Colunas reais documentadas (PASSO 1 preenchido) | [ ] Sim / [ ] Não |
| CHECK de status documentado e comparado aos valores usados | [ ] Sim / [ ] Não |
| Divergências listadas na seção 4 | [ ] Sim / [ ] Não |
| Recomendação (A / B / Híbrido) definida com base em evidência | [ ] Sim / [ ] Não |

**Go:** Prosseguir com a ação recomendada (ex.: Opção A em staging primeiro) após preencher este relatório com os resultados reais.  
**No-Go:** Se não houver acesso para executar as queries ou se os resultados indicarem risco não mitigável, adiar alterações até conclusão da introspecção.

---

## Apêndice — Script único (todas as queries em sequência, somente SELECT)

Executar no SQL Editor do Supabase (produção), em ordem. Nenhuma destas instruções altera dados ou estrutura.

```sql
-- ========== PASSO 1 ==========
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saques'
ORDER BY ordinal_position;

-- ========== PASSO 2 ==========
SELECT conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname = 'saques';

-- ========== PASSO 3 ==========
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'saques';

-- ========== PASSO 4 ==========
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saques';

-- ========== PASSO 5 ==========
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'saques';

-- ========== PASSO 6 ==========
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) ILIKE '%saques%';

-- ========== PASSO 7 ==========
SELECT id, status FROM public.saques LIMIT 20;
```

Se alguma query falhar por permissão, registrar a mensagem de erro no relatório e não tentar contornar.
