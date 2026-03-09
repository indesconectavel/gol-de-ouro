# Auditoria READ-ONLY — Opção A (ADD COLUMNS no Supabase para compatibilidade com o código)

**Data:** 2026-03-02  
**Modo:** READ-ONLY absoluto. Nenhuma alteração de código, git, banco ou deploy foi executada.  
**Objetivo:** Avaliar se a Opção A (adicionar colunas na tabela `saques` no Supabase) é segura, quais riscos existem e exatamente o que mudaria em produção.

---

## 1) Resumo executivo

- **Contexto:** O frontend chama `POST /api/withdraw/request` e recebe 500. A auditoria anterior indicou mismatch entre as colunas que o backend insere em `saques` e as colunas definidas no schema “Consolidado” do repositório. A Opção A consiste em **adicionar no Supabase** as colunas que o código já usa e que podem não existir no banco atual (`amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`), mantendo as colunas atuais (`valor`, `taxa`/`valor_liquido`, `chave_pix`, `tipo_chave`) para compatibilidade.
- **Evidência do INSERT:** O handler em `server-fly.js` (L1546–1566) insere em `saques`: `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`. O schema **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql** (L92–103) define apenas: `id`, `usuario_id`, `valor`, `valor_liquido`, `taxa`, `chave_pix`, `tipo_chave`, `status`, `created_at`, `updated_at`. Ou seja, faltam no Consolidado: `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`. Se produção tiver sido criada a partir desse Consolidado, o INSERT falha e o handler retorna 500.
- **Inventário:** A tabela `saques` é usada em: (1) **server-fly.js** — POST /api/withdraw/request (INSERT + idempotência SELECT + pendentes SELECT), GET /api/withdraw/history (SELECT * + mapeamento dual nome), webhook (SELECT + UPDATE status); (2) **src/domain/payout/processPendingWithdrawals.js** — SELECT com lista explícita de colunas, UPDATE status; (3) **src/workers/payout-worker.js** — ping SELECT id; (4) **controllers/paymentController.js** — INSERT com valor, chave_pix, tipo_chave, status; (5) **services/history-service.js** — SELECT *; (6) **monitoring** e **scripts** de auditoria — SELECT com colunas explícitas ou *.
- **Compatibilidade do código:** O handler de history e o worker já usam fallbacks duais (`row.valor ?? row.amount`, `row.fee ?? row.taxa`, `row.pix_key ?? row.chave_pix`, etc.). O ponto único que **exige** as colunas novas é o **INSERT** do POST /api/withdraw/request e o **SELECT** do worker (que lista colunas explícitas). Adicionar as colunas faltantes (como NULLABLE ou com default) alinha o banco ao código sem exigir mudança de aplicação.
- **Riscos da Opção A:** (1) **CHECK de status:** O Consolidado restringe `status` a `('pendente', 'processando', 'aprovado', 'rejeitado')`. O worker e o webhook usam também `pending`, `aguardando_confirmacao`, `processado`, `falhou`. Se produção tiver esse CHECK, updates do worker podem falhar. (2) **Trigger/função:** Existe no repo uma função `saques_sync_valor_amount` que escreve em `NEW.amount`; ela só faz sentido se a coluna `amount` existir. (3) **RLS:** As políticas atuais usam apenas `usuario_id`; não dependem das colunas novas. (4) **Views/funções externas:** Não foram encontradas views sobre `saques` nos arquivos auditados; scripts e relatórios usam SELECT com colunas explícitas ou * e já têm fallbacks.
- **Recomendação:** A Opção A é **viável e segura** desde que: (i) a migração use `ADD COLUMN ... NULLABLE` (ou DEFAULT) para não quebrar linhas existentes; (ii) o CHECK de `status` seja revisado/ampliado no mesmo passo (ou a aplicação pare de usar valores fora do CHECK); (iii) a mudança seja aplicada primeiro em **staging**, com smoke test de saque e histórico, e só depois em produção; (iv) haja rollback definido (não remover colunas; em caso de problema, reverter apenas o código se necessário). A Opção A **não altera** deploy na Vercel (FyKKeg6zb) nem no Fly por si só; altera **apenas** o banco (Supabase) quando a migration for aplicada.

---

## 2) Evidências: INSERT em saques e colunas usadas

**Arquivo:linha** — `server-fly.js:1545–1566`

```javascript
    const { data: saque, error: saqueError } = await supabase
      .from('saques')
      .insert({
        usuario_id: userId,
        valor: requestedAmount,
        amount: requestedAmount,
        fee: taxa,
        net_amount: valorLiquido,
        correlation_id: correlationId,
        pix_key: validation.data.pixKey,
        pix_type: validation.data.pixType,
        chave_pix: validation.data.pixKey,
        tipo_chave: validation.data.pixType,
        status: 'pendente',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
```

**Payload que entra no handler (L1396, 1406–1411):**  
`req.body`: `valor`, `chave_pix`, `tipo_chave`.  
`userId` de `req.user.userId`; `correlationId` de headers ou `crypto.randomUUID()`; `taxa` de `process.env.PAGAMENTO_TAXA_SAQUE || '2.00'` (L1518); `valorLiquido = requestedAmount - taxa` (L1520).

**Colunas inseridas (lista exata):**  
`usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`.

---

## 3) Evidências: schema da tabela saques no repositório

### 3.1 Fonte “Consolidado” (CREATE TABLE)

**Arquivo:linha** — `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:92–103`

```sql
CREATE TABLE IF NOT EXISTS public.saques (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    valor_liquido DECIMAL(10,2) NOT NULL,
    taxa DECIMAL(10,2) NOT NULL,
    chave_pix VARCHAR(255) NOT NULL,
    tipo_chave VARCHAR(50) NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Colunas no Consolidado: `id`, `usuario_id`, `valor`, `valor_liquido`, `taxa`, `chave_pix`, `tipo_chave`, `status`, `created_at`, `updated_at`.  
**Não possui:** `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`.

### 3.2 Outras referências de schema / migrations

| Arquivo | O que faz |
|---------|-----------|
| `database/schema-ledger-financeiro.sql:18–19` | `ALTER TABLE saques ADD COLUMN IF NOT EXISTS correlation_id text;` + índice em `correlation_id`. |
| `APLICAR-SCHEMA-SUPABASE-FINAL.sql`, `SCHEMA-FORCA-CACHE-PIX-SAQUE.sql`, `SCHEMA-DEFINITIVO-FINAL-v2.sql`, etc. | Vários scripts que adicionam `amount`, `pix_key`, `pix_type` com `ADD COLUMN` e depois NOT NULL após backfill. |
| `database/corrigir-supabase-security-warnings.sql:39–52` | Função `saques_sync_valor_amount()` que define `NEW.amount = NEW.valor` (exige coluna `amount`). |
| `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:324–325` | Trigger `update_saques_updated_at` que chama `update_updated_at_column()` (atualiza apenas `updated_at`). |
| `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:242–248` | RLS: SELECT e INSERT em `saques` usando apenas `auth.uid() = usuario_id`. |

---

## 4) Inventário completo de uso da tabela saques

| Arquivo | Linhas | Operação | Colunas referenciadas | Classificação |
|---------|--------|----------|------------------------|----------------|
| **server-fly.js** | 1439–1444 | SELECT (idempotência) | id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, created_at, correlation_id | Handler saque |
| **server-fly.js** | 1474–1477 | SELECT (pendentes) | id, status | Handler saque |
| **server-fly.js** | 1546–1566 | **INSERT** | usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status, created_at | Handler saque |
| **server-fly.js** | 1679–1683 | SELECT * (histórico) | * (mapeamento em L1694–1702: valor/amount, fee/taxa, net_amount/valor_liquido, pix_key/chave_pix, pix_type/tipo_chave) | Handler API |
| **server-fly.js** | 2171–2175 | SELECT (webhook) | id, correlation_id, status, usuario_id, amount, valor, fee, net_amount | Webhook |
| **server-fly.js** | 2240, 2253 | UPDATE status | status | Webhook |
| **src/domain/payout/processPendingWithdrawals.js** | 133–137 | SELECT | id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at | Worker |
| **src/domain/payout/processPendingWithdrawals.js** | 189–195 | UPDATE status | status | Worker |
| **src/domain/payout/processPendingWithdrawals.js** | 209–212 | UPDATE status | status | Worker |
| **src/domain/payout/processPendingWithdrawals.js** | 89–92 | UPDATE status | status (falhou) | Rollback |
| **src/workers/payout-worker.js** | 64–67 | SELECT id | id | Ping/health |
| **controllers/paymentController.js** | 337–346 | INSERT | usuario_id, valor, chave_pix, tipo_chave, status | Controller alternativo |
| **services/history-service.js** | 340–342 | SELECT * | * | Histórico |
| **monitoring/flyio-custom-metrics.js** | 469–471 | SELECT | valor, status, created_at | Métricas |
| **monitoring-system.js** | 405–408 | SELECT * | * | Backup |
| **scripts/release-audit-pix-saques-readonly.js** | 61 | SELECT | id, usuario_id, status, valor, amount, created_at | Relatório |
| **scripts/fechamento-contabil-minimo-readonly.js** | 136 | SELECT | usuario_id, valor, amount, status | Relatório |
| **scripts/encerramento-financeiro-v1-d1c-readonly.js** | 176 | SELECT | usuario_id, valor, amount, status | Relatório |
| **scripts/audit-financeira-total-prod-readonly.js** | 120, 130 | SELECT | status; id, usuario_id, status, valor, created_at, updated_at | Relatório |
| **scripts/audit-b2-readonly.js** | 75, 118, 126 | SELECT | usuario_id, valor, amount, status; id, usuario_id, valor, status, created_at; usuario_id, valor, created_at | Relatório |

---

## 5) Mapa de colunas (código → schema Consolidado → ação sugerida)

| Conceito | Coluna esperada no código | Coluna no schema Consolidado | Ação sugerida (Opção A) |
|----------|----------------------------|-------------------------------|---------------------------|
| Valor bruto | `valor` | `valor` | Nenhuma |
| Valor bruto (alias) | `amount` | — | ADD COLUMN `amount` DECIMAL(10,2) NULL (ou DEFAULT valor); depois trigger/backfill se quiser NOT NULL. |
| Taxa | `fee` | — | ADD COLUMN `fee` DECIMAL(10,2) NULL. (Consolidado tem `taxa`.) |
| Valor líquido | `net_amount` | — | ADD COLUMN `net_amount` DECIMAL(10,2) NULL. (Consolidado tem `valor_liquido`.) |
| Idempotência | `correlation_id` | — | ADD COLUMN `correlation_id` TEXT NULL (já previsto em schema-ledger-financeiro.sql). |
| Chave PIX | `pix_key` | — | ADD COLUMN `pix_key` VARCHAR(255) NULL. (Consolidado tem `chave_pix`.) |
| Tipo chave | `pix_type` | — | ADD COLUMN `pix_type` VARCHAR(50) NULL. (Consolidado tem `tipo_chave`.) |
| Chave PIX (legado) | `chave_pix` | `chave_pix` | Nenhuma |
| Tipo chave (legado) | `tipo_chave` | `tipo_chave` | Nenhuma |
| Taxa (legado) | — | `taxa` | Manter; código pode preencher taxa também se desejado. |
| Valor líquido (legado) | — | `valor_liquido` | Manter. |
| Status | `status` | `status` (CHECK restritivo) | Revisar CHECK: código usa também 'pending', 'aguardando_confirmacao', 'processado', 'falhou'. Ampliar CHECK ou migrar valores. |
| created_at / updated_at | `created_at` | `created_at`, `updated_at` | Nenhuma |

---

## 6) Análise de impacto da Opção A

### 6.1 Pode quebrar algo?

| Elemento | Risco | Detalhe |
|----------|--------|---------|
| **RLS policies** | Baixo | Políticas usam apenas `usuario_id`; não referem as colunas novas. ADD COLUMN não altera políticas. |
| **Triggers** | Médio | `update_saques_updated_at` só toca em `updated_at`. A função `saques_sync_valor_amount` escreve em `NEW.amount`; só deve ser criada/ativada **depois** de existir a coluna `amount`. |
| **Views** | Nenhuma encontrada | Nenhuma view sobre `saques` nos arquivos auditados. |
| **CHECK (status)** | Alto | Consolidado: `status IN ('pendente', 'processando', 'aprovado', 'rejeitado')`. Worker e webhook usam `pending`, `aguardando_confirmacao`, `processado`, `falhou`. Se o CHECK estiver ativo em produção, UPDATEs com esses valores falham. Opção A deve incluir **revisão do CHECK** (ampliar lista) ou migração de valores antes de restringir. |
| **SELECT *** | Baixo | GET /api/withdraw/history e history-service usam `*` e mapeiam com fallbacks (valor/amount, fee/taxa, etc.). Colunas extras não quebram. |
| **Serialização / dashboards** | Baixo | Scripts e métricas usam colunas explícitas ou * com fallbacks; adicionar colunas não quebra. |
| **Worker payout** | Crítico | Worker faz SELECT com lista explícita incluindo `amount`, `fee`, `net_amount`, `pix_key`, `pix_type`, `correlation_id`. Se essas colunas não existirem, o SELECT já falha. ADD COLUMN resolve. |
| **Integrações externas** | Desconhecido | Qualquer ferramenta externa que assuma conjunto fixo de colunas pode ser afetada; não há evidência no repo. |

### 6.2 Mudaria deploy em produção?

- **Vercel / Fly:** Não. A Opção A é **apenas** alteração de schema no Supabase (migration). Não mexe em código do player (FyKKeg6zb) nem em código do backend no Fly, a menos que se decida fazer um deploy em conjunto.
- **Supabase (produção):** Sim. Aplicar a migration em produção **altera** a tabela `saques` (novas colunas e, se escolhido, alteração do CHECK de status). Deve ser feito em janela controlada, com backup e rollback planejado.

---

## 7) Plano de mudança (world-class)

- **Staging-first:** Aplicar a migration primeiro no projeto Supabase de **staging** (ou banco de teste). Rodar POST /api/withdraw/request, GET /api/withdraw/history, e um ciclo do worker; conferir logs sem 500.
- **Preview/Canary:** Se houver ambiente de preview do backend (ex.: uma instância Fly de preview), apontar para o mesmo Supabase de staging e repetir os mesmos testes.
- **Produção:** Após aprovação, aplicar a migration em **produção** em janela de baixo tráfego. Ordem sugerida: (1) ADD COLUMN para todas as colunas novas como NULLABLE (ou com DEFAULT onde fizer sentido); (2) opcional: backfill para preencher amount/fee/net_amount a partir de valor/taxa/valor_liquido nas linhas antigas; (3) revisar CHECK de status se necessário; (4) opcional: criar trigger `saques_sync_valor_amount` se quiser manter valor e amount sincronizados.
- **Observabilidade:** Durante e após a mudança: monitorar logs do Fly (erros 500 em /api/withdraw/request e /api/withdraw/history), logs do worker de payout, e métricas de erro no Supabase. Alertas sobre aumento de 500 ou falhas no worker devem acionar rollback.
- **Rollback:** Não remover as colunas adicionadas (evita quebrar código já em produção). Em caso de problema: (i) reverter apenas o **código** (ex.: deploy anterior do backend) se a causa for de aplicação; (ii) se a causa for a migration (ex.: CHECK novo que rejeita valores atuais), reverter a alteração do CHECK ou da constraint no Supabase; (iii) manter colunas novas vazias se for necessário desativar temporariamente o fluxo que as usa (ex.: feature flag no backend para não escrever nas colunas novas).

---

## 8) Checklist de decisão final (go/no-go)

| # | Critério | Status (preencher) |
|---|----------|--------------------|
| 1 | Schema real de produção conhecido (colunas atuais de `saques`) | [ ] Sim — via introspection / [ ] Não |
| 2 | Migration testada em staging com sucesso | [ ] Sim / [ ] Não |
| 3 | Smoke test: POST /api/withdraw/request retorna 201 | [ ] Sim / [ ] Não |
| 4 | Smoke test: GET /api/withdraw/history retorna 200 | [ ] Sim / [ ] Não |
| 5 | Worker processa um saque pendente sem erro | [ ] Sim / [ ] N/A / [ ] Não |
| 6 | CHECK de status revisado ou compatível com valores usados | [ ] Sim / [ ] Não |
| 7 | Rollback definido (reversão de CHECK/código; não drop de colunas) | [ ] Sim / [ ] Não |
| 8 | Janela de aplicação em produção definida | [ ] Sim / [ ] Não |
| 9 | Deploy estável do player (FyKKeg6zb) não será alterado | [ ] Confirmado |

**Go:** Prosseguir com Opção A em produção somente se todos os itens aplicáveis estiverem “Sim” ou “Confirmado”.  
**No-go:** Se o schema real de produção for desconhecido ou os testes em staging falharem, adiar a migration até que a verificação read-only (ou staging) seja feita.

---

## Apêndice A — Script de verificação read-only (introspection)

O script abaixo contém **apenas SELECT** (introspection). Não altera dados nem estrutura. Pode ser executado por alguém com acesso read-only ao Supabase (por exemplo, no SQL Editor com role que permita ler `information_schema`).

```sql
-- Verificação READ-ONLY: colunas da tabela public.saques
-- Executar no Supabase SQL Editor (somente leitura). Não aplica INSERT/UPDATE/DELETE/DDL.

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

Registrar o resultado (lista de colunas) no relatório ou em documento de evidência para comparar com o que o código espera e com o schema Consolidado.

---

## Apêndice B — Matriz de risco

| Risco | Probabilidade | Impacto | Mitigação | Evidência |
|-------|----------------|----------|-----------|-----------|
| INSERT falha por coluna inexistente | Alta (se produção = Consolidado) | 500 em todo saque | Opção A: ADD COLUMN para amount, fee, net_amount, correlation_id, pix_key, pix_type | server-fly.js:1546–1566 vs SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:92–103 |
| CHECK status rejeita valores do worker | Média | Worker não consegue atualizar status | Revisar CHECK para incluir 'pending', 'aguardando_confirmacao', 'processado', 'falhou' ou migrar dados antes | processPendingWithdrawals.js:191, 211; webhook server-fly.js:2240, 2253; Consolidado L99 |
| RLS bloqueia INSERT/UPDATE | Baixa | 403 ou erro Supabase | Políticas atuais usam apenas usuario_id; ADD COLUMN não altera RLS | SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:243–248 |
| Trigger quebra após ADD COLUMN | Baixa | Erro em INSERT/UPDATE | Criar trigger `saques_sync_valor_amount` só após coluna amount existir | corrigir-supabase-security-warnings.sql:40–52 |
| Scripts/relatórios quebram | Baixa | Falha em jobs de auditoria | Scripts usam colunas explícitas ou * com fallbacks | release-audit-pix-saques-readonly.js:61; server-fly.js:1694–1702 |

---

## Recomendação final

- **Seguir a Opção A** (adicionar colunas no Supabase) é **recomendado** desde que:  
  (i) a migration use `ADD COLUMN ... NULLABLE` (ou DEFAULT) para as colunas novas;  
  (ii) o CHECK de `status` seja ajustado ou os valores usados pelo worker/webhook sejam compatíveis;  
  (iii) a aplicação seja feita primeiro em staging e validada com os smoke tests acima;  
  (iv) exista plano de rollback sem drop de colunas.  

- **Não é recomendado** aplicar a migration diretamente em produção sem antes confirmar o schema real (introspection) e testar em staging.  

- **Alternativa (Opção B):** Alterar o código do backend para inserir **apenas** as colunas que existem no schema atual (ex.: valor, valor_liquido, taxa, chave_pix, tipo_chave, status, created_at) e usar correlation_id só se existir. Isso evita mudar o banco mas exige alteração e novo deploy do backend; o worker e o GET history já estão preparados para dual naming. A Opção A reduz mudança de código e centraliza a compatibilidade no banco.
