# Auditoria READ-ONLY — Produção: Saque PIX 500 + Spam shouldShowWarning

**Data:** 2026-03-02  
**Modo:** READ-ONLY absoluto. Nenhuma alteração de código, git, banco ou deploy.  
**Projeto:** Gol de Ouro — diagnóstico com evidências (arquivo/linha) + plano seguro.

---

## Evidence Log (evidências objetivas)

| # | Evidência | Local |
|---|-----------|--------|
| 1 | Rota POST /api/withdraw/request definida em server-fly.js | server-fly.js:1394 |
| 2 | Supabase usado no request é supabaseAdmin (service role) | server-fly.js:118; database/supabase-unified-config.js:48–57 |
| 3 | INSERT em saques não envia valor_liquido nem taxa | server-fly.js:1546–1565 |
| 4 | Worker atualiza status para 'processando', 'aguardando_confirmacao'; rollback usa 'falhou' | processPendingWithdrawals.js:191, 211, 89–92 |
| 5 | Webhook atualiza status para 'processado', 'aguardando_confirmacao' | server-fly.js:2240, 2253 |
| 6 | CHECK status em PROD (informado pelo usuário): pendente, processando, concluido, rejeitado, cancelado | Contexto do prompt |
| 7 | VersionWarning no repo atual usa apenas checkCompatibility() no mount, sem setInterval | goldeouro-player/src/components/VersionWarning.jsx:11–39 |
| 8 | versionService não expõe shouldShowWarning, getWarningMessage, getVersionInfo | goldeouro-player/src/services/versionService.js (classe completa) |
| 9 | Doc de 2026-02-28 descreve versão antiga do VersionWarning com setInterval 1s e métodos inexistentes | docs/relatorios/RELEASE-CHECKPOINT/READONLY-auditoria-shouldShowWarning-withdraw-20260228.md |

---

## Resumo executivo

- **Saque 500:** O backend usa **service role** (supabaseAdmin) no endpoint de saque, então RLS não é a causa. O INSERT envia `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status: 'pendente'`, `created_at` mas **não envia `valor_liquido` nem `taxa`**. Se a tabela em produção tiver essas colunas como NOT NULL, o INSERT falha e retorna 500. Além disso, o **CHECK de status em PROD** (pendente, processando, concluido, rejeitado, cancelado) **não inclui** os valores que o worker e o webhook usam: `aguardando_confirmacao`, `processado`, `falhou`. O INSERT com `pendente` é válido; porém, após o saque ser criado, o worker tenta UPDATE para `aguardando_confirmacao` e o rollback/webhook usam `processado`/`falhou`, que violam o CHECK atual e podem gerar falhas em sequência (saque fica travado em "processando" e rollback também falha).
- **VersionWarning / shouldShowWarning:** No **repositório atual**, VersionWarning.jsx já foi ajustado: usa apenas `versionService.checkCompatibility()` uma vez no mount (useEffect), sem setInterval e sem chamar `shouldShowWarning`, `getWarningMessage` ou `getVersionInfo`. O versionService não implementa esses métodos. O documento READONLY-auditoria-shouldShowWarning-withdraw-20260228 descreve uma versão **anterior** do componente (setInterval 1s e chamadas aos métodos inexistentes). Se o deploy em produção (FyKKeg6zb) ainda servir um bundle antigo, o spam no console pode persistir até o deploy do código atual do player.
- **Recomendação:** (1) Backend: incluir no INSERT `valor_liquido` e `taxa` (ou garantir que as colunas aceitem NULL/default) e alinhar os status ao CHECK de produção (usar `concluido` em vez de `processado`, `cancelado` em vez de `falhou`, e incluir `aguardando_confirmacao` no CHECK ou mapear para um status permitido). (2) Frontend: não é necessário novo patch para shouldShowWarning no código atual; validar em produção se o bundle deployado já é o que usa apenas checkCompatibility().

---

## PARTE A — Auditoria do spam shouldShowWarning (frontend)

### A.1 Localização (arquivo/linha)

| Item | Caminho | Linhas |
|------|---------|--------|
| VersionWarning | goldeouro-player/src/components/VersionWarning.jsx | 1–111 |
| versionService | goldeouro-player/src/services/versionService.js | 1–125 |
| Montagem global | goldeouro-player/src/App.jsx | 5, 32 |

### A.2 Verdade atual do repositório

- **setInterval 1s chamando shouldShowWarning/getWarningMessage/getVersionInfo?**  
  **Não.** Em VersionWarning.jsx (L11–39) o useEffect chama apenas `versionService.checkCompatibility()` uma vez (runOnce), com cleanup `cancelled = true`. Não há setInterval e não há chamadas a `shouldShowWarning`, `getWarningMessage` ou `getVersionInfo`.

- **versionService:** Expõe `checkVersionCompatibility`, `checkCompatibility` (alias), `startPeriodicCheck(interval)` (default 5 min), `stopPeriodicCheck`, `clearCache`, `getCacheStats`. **Não expõe** `shouldShowWarning`, `getWarningMessage`, `getVersionInfo`. VersionWarning **não** chama `startPeriodicCheck` no código atual.

- **Deploy FyKKeg6zb:** Conforme docs/relatorios e RELEASE-CHECKPOINT, FyKKeg6zb é o deploy estável do player e **não deve ser alterado** por esta auditoria. Se esse deploy for um build antigo (antes do hotfix do VersionWarning), o spam pode ainda ocorrer em produção até que um novo build seja promovido.

### A.3 Resultado Parte A

- **Causa raiz:** O spam "gn.shouldShowWarning is not a function" ocorria quando o componente chamava métodos inexistentes no versionService (shouldShowWarning, getWarningMessage, getVersionInfo) dentro de um setInterval de 1s, conforme documentado em READONLY-auditoria-shouldShowWarning-withdraw-20260228.md. No código **atual** do repo essa lógica já foi removida/substituída por uma única chamada a checkCompatibility() no mount.
- **Impacto:** Afetava todas as rotas onde VersionWarning está montado (incluindo /game e /withdraw), pois o componente está em App.jsx (L32).
- **Correção proposta (mínima, sem editar):** Se produção ainda mostrar o spam, garantir que o bundle em produção seja o que já usa apenas checkCompatibility() no mount (deploy do branch que contém o VersionWarning atual). Nenhuma alteração adicional necessária no código atual do repo.

---

## PARTE B — Auditoria do 500 em POST /api/withdraw/request (backend)

### B.1 Fluxo completo com evidências

| Etapa | Onde | Evidência (arquivo:linha) |
|-------|------|---------------------------|
| Rota | server-fly.js | L1394: `app.post('/api/withdraw/request', authenticateToken, async (req, res) => {` |
| Payload | server-fly.js | L1396: `const { valor, chave_pix, tipo_chave } = req.body;` |
| Validação | server-fly.js | L1406–1418: PixValidator.validateWithdrawData({ amount: valor, pixKey: chave_pix, pixType: tipo_chave, userId }) |
| Taxa / valor líquido | server-fly.js | L1521–1524: `taxa = parseFloat(process.env.PAGAMENTO_TAXA_SAQUE \|\| '2.00'); valorLiquido = requestedAmount - taxa` |
| INSERT | server-fly.js | L1546–1566: `.from('saques').insert({ usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status: 'pendente', created_at })` — **não envia valor_liquido nem taxa** |
| Tratamento de erro 500 | server-fly.js | L1568–1582: log `saqueError`, rollback de saldo, `res.status(500).json({ success: false, message: 'Erro ao criar saque' })` — mensagem genérica; correlation_id não é enviado na resposta ao client |

### B.2 Supabase client

| Aspecto | Evidência |
|---------|-----------|
| Inicialização | database/supabase-unified-config.js: createClient(url, serviceRoleKey, options) exporta supabaseAdmin (L48–57). |
| Uso no server | server-fly.js L70–76: `const { supabaseAdmin, ... } = require('./database/supabase-unified-config');` e L118: `let supabase = supabaseAdmin;` |
| Env vars | supabase-unified-config.js L14–17: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. required-env.js (server-fly L51–53): JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. |
| Endpoint de saque | Usa o mesmo `supabase` (supabaseAdmin), portanto **service role** — RLS não bloqueia INSERT/UPDATE. |
| Riscos | "RLS bloqueia insert": Não (service role). "Key ausente": possível se SUPABASE_SERVICE_ROLE_KEY não estiver definida no Fly (startup falharia). "Client usando anon key em server-side": não; o request usa supabaseAdmin. |

### B.3 Constraints e status

**Valores de status usados no código (saques):**

| Origem | Valores | Arquivo:linha |
|--------|---------|----------------|
| INSERT request | 'pendente' | server-fly.js:1562 |
| Idempotência / pendentes | 'pendente', 'pending' | server-fly.js:1441, 1476 |
| Worker lock | 'processando' | processPendingWithdrawals.js:191 |
| Worker após PIX | 'aguardando_confirmacao' | processPendingWithdrawals.js:211 |
| Rollback | 'falhou' | processPendingWithdrawals.js:91 |
| Webhook aprovado | 'processado' | server-fly.js:2240 |
| Webhook in_process | 'aguardando_confirmacao' | server-fly.js:2253 |
| Frontend (Withdraw.jsx) | processado, pendente, processando, aguardando_confirmacao, cancelado, falhou | goldeouro-player/src/pages/Withdraw.jsx:140–158 |

**CHECK em PROD (informado pelo usuário):** pendente, processando, concluido, rejeitado, cancelado.

**Conclusão:**  
- INSERT com `pendente` é permitido pelo CHECK.  
- **Worker** ao fazer UPDATE para `aguardando_confirmacao` **viola** o CHECK (não está na lista).  
- **Webhook** ao fazer UPDATE para `processado` **viola** o CHECK (produção usa `concluido`).  
- **Rollback** ao fazer UPDATE para `falhou` **viola** o CHECK (produção usa `cancelado`).  
Risco real: após o INSERT bem-sucedido, o primeiro UPDATE do worker para `aguardando_confirmacao` (ou para `processando` se já estiver permitido) pode falhar; se o worker gravar `processando` e em seguida tentar `aguardando_confirmacao`, o UPDATE falha e o saque fica travado em "processando". Rollback ao tentar gravar `falhou` também pode falhar por constraint.

### B.4 Triggers / funções

| Item | Arquivo | Comportamento |
|------|---------|----------------|
| update_saques_updated_at | SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:324–325 | BEFORE UPDATE; chama update_updated_at_column() → set NEW.updated_at = NOW(). Não afeta INSERT. |
| saques_sync_valor_amount | database/corrigir-supabase-security-warnings.sql:39–52 | NEW.amount = NEW.valor quando NEW.valor IS NOT NULL. Requer coluna amount. Se esse trigger estiver ativo em PROD no INSERT, o INSERT já preenche amount; não costuma quebrar INSERT. Pode quebrar se a tabela não tiver coluna amount (improvável, pois usuário confirmou que amount existe). |

### B.5 Worker de payout

| Aspecto | Evidência |
|---------|-----------|
| Módulo | src/domain/payout/processPendingWithdrawals.js; chamado de server-fly via payout-worker (src/workers/payout-worker.js). |
| SELECT saques | L133–137: .select('id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at').in('status', ['pendente', 'pending']) |
| UPDATE status | L189–195: status = 'processando'; L209–212: status = 'aguardando_confirmacao'; rollback L89–92: status = 'falhou' |
| Guard | PAYOUT_PIX_ENABLED (processPendingWithdrawals L63; payout-worker repassa payoutEnabled). |
| Travamento | Se UPDATE para 'aguardando_confirmacao' ou 'falhou' falhar por CHECK, o worker loga erro e o saque pode permanecer em 'processando' sem avançar; rollback também pode falhar ao gravar 'falhou'. |

---

## PARTE C — Introspection pack (queries READ-ONLY)

Executar no Supabase SQL Editor (PROD). Somente SELECT.

### C.1 Colunas (information_schema)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saques'
ORDER BY ordinal_position;
```

**Cole aqui o resultado:**

```
(paste)
```

### C.2 Constraints (pg_constraint)

```sql
SELECT conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname = 'saques';
```

**Cole aqui o resultado:**

```
(paste)
```

### C.3 Triggers

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'saques';
```

**Cole aqui o resultado:**

```
(paste)
```

### C.4 RLS (pg_policies)

```sql
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saques';
```

**Cole aqui o resultado:**

```
(paste)
```

### C.5 Índices

```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'saques';
```

**Cole aqui o resultado:**

```
(paste)
```

### C.6 Funções que referenciam saques

```sql
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) ILIKE '%saques%';
```

**Cole aqui o resultado:**

```
(paste)
```

### C.7 Amostra de 20 saques

```sql
SELECT id, status, created_at, amount, valor, pix_type, tipo_chave
FROM public.saques
ORDER BY id DESC
LIMIT 20;
```

**Cole aqui o resultado:**

```
(paste)
```

---

## PARTE D — Hipóteses ranqueadas + plano de correção (sem executar)

### Top 5 hipóteses do 500

| # | Hipótese | Evidência | Como confirmar | Menor ajuste |
|---|----------|-----------|-----------------|--------------|
| 1 | Colunas NOT NULL faltando no INSERT (valor_liquido, taxa) | INSERT (server-fly.js:1546–1565) não envia valor_liquido nem taxa; schema Consolidado define ambos NOT NULL | Rodar introspection C.1 e checar is_nullable e column_default; tentar INSERT sem essas colunas no SQL Editor | Backend: incluir no INSERT valor_liquido e taxa (valorLiquido e taxa já calculados no handler) |
| 2 | CHECK status: worker/webhook tentam gravar valores não permitidos (aguardando_confirmacao, processado, falhou) | processPendingWithdrawals.js:211, 91; server-fly.js:2240, 2253; CHECK PROD = pendente, processando, concluido, rejeitado, cancelado | Ver erro nos logs do Fly ao processar saque (UPDATE falha); ou rodar C.2 e comparar com valores usados no código | Código: mapear processado→concluido, falhou→cancelado; incluir aguardando_confirmacao no CHECK ou mapear para processando |
| 3 | Trigger ou função BEFORE INSERT falha (ex.: saques_sync_valor_amount em tabela sem amount) | corrigir-supabase-security-warnings.sql:39–52 escreve NEW.amount | Rodar C.3 e C.6; se trigger existir e tabela não tiver amount, INSERT falha | Supabase: remover trigger ou garantir coluna amount; ou código já envia amount |
| 4 | Erro de rede/timeout ou Supabase indisponível | Handler retorna 500 genérico em saqueError (L1568–1582) | Logs Fly: mensagem de saqueError (Supabase error code/message) | Garantir conectividade e env vars; melhorar log (incluir correlation_id e saqueError.details) |
| 5 | Tipo de dado ou constraint (ex.: tipo_chave CHECK, tamanho chave_pix) | Consolidado: tipo_chave IN ('cpf','cnpj','email','phone','random'); chave_pix VARCHAR(255) | Resposta do Supabase no saqueError (code, message, details) | Validar payload no backend contra CHECK; sanitizar tamanho e enum |

### Dois caminhos de correção (sem executar)

**Caminho 1 — Ajuste no código (backend):**

- Incluir no INSERT em saques: `valor_liquido: valorLiquido`, `taxa: taxa` (já calculados em L1521–1524).
- Normalizar status para o CHECK de PROD: ao gravar sucesso do payout usar `concluido` em vez de `processado`; ao gravar rollback usar `cancelado` em vez de `falhou`; para "em processamento" usar `processando` ou incluir no backend um mapeamento para um valor permitido (ex.: manter `aguardando_confirmacao` só se o CHECK for alterado).
- Garantir service role (já em uso); não alterar key.
- Sanitizar payload (evitar NaN, tipos errados); incluir correlation_id nos logs em caso de 500.

**Caminho 2 — Ajuste no Supabase (somente se evidência exigir):**

- Se a tabela tiver valor_liquido e taxa NOT NULL sem default: alterar para DEFAULT ou NULL (ou passar a preencher pelo código, preferível no Caminho 1).
- Se o CHECK de status for o bloqueio: ALTER TABLE saques DROP CONSTRAINT ... ADD CONSTRAINT ... para incluir aguardando_confirmacao, processado, falhou (ou os equivalentes desejados), em janela controlada e com rollback planejado.

### Matriz de risco

| Risco | Probabilidade | Impacto | Mitigação |
|-------|----------------|----------|------------|
| INSERT falha por coluna NOT NULL (valor_liquido/taxa) | Alta (se schema PROD exige) | 500 em todo saque | Caminho 1: enviar valor_liquido e taxa no INSERT |
| UPDATE falha por CHECK status (aguardando_confirmacao, processado, falhou) | Alta | Saque travado; rollback também pode falhar | Caminho 1: usar concluido/cancelado; ou Caminho 2: ampliar CHECK |
| Rollback de correção quebra outro ambiente | Média | Regressão | Staging primeiro; rollback: reverter deploy backend ou reverter migration CHECK |
| Alterar FyKKeg6zb por engano | Baixa | Quebra deploy estável | Safety rails: não fazer deploy do player nesta auditoria; mudanças apenas backend/Supabase conforme plano |

### Rollback

- **Código:** Reverter deploy do backend para versão anterior; não remover colunas no banco.
- **Supabase (CHECK):** Reverter constraint para a lista anterior de status se o novo CHECK causar falhas.

---

## Blast radius

- **O que pode quebrar:** (1) Qualquer alteração no CHECK de status pode afetar workers e webhooks que ainda usem os valores antigos até serem atualizados. (2) Incluir valor_liquido/taxa no INSERT é aditivo e não quebra leituras existentes. (3) VersionWarning: o código atual já não chama métodos inexistentes; apenas garantir que o bundle em produção seja o atual evita o spam sem mudar mais nada.
- **Rotas afetadas:** POST /api/withdraw/request (500); GET /api/withdraw/history (indireto se saques ficarem travados); worker de payout e webhook Mercado Pago (UPDATE de status). Frontend /game e /withdraw (spam apenas se bundle antigo).
- **Safety rails:** Não tocar no deploy estável FyKKeg6zb; não executar migrations ou comandos destrutivos; mudanças de código apenas em branch + preview antes de produção.

---

## Checklist GO / NO-GO

| # | Critério | [ ] |
|---|----------|-----|
| 1 | Introspection (Parte C) executada e resultados colados no relatório | |
| 2 | Causa do 500 identificada (coluna NOT NULL vs CHECK vs trigger) | |
| 3 | Decisão Caminho 1 (código) vs Caminho 2 (Supabase) documentada | |
| 4 | Ajuste testado em staging/preview (INSERT + worker + webhook) | |
| 5 | Rollback definido e comunicado | |
| 6 | Deploy FyKKeg6zb não alterado | |

**GO:** Prosseguir com o plano de correção escolhido após preencher o checklist.  
**NO-GO:** Se não houver acesso à introspecção ou se os testes em staging falharem, adiar alterações até conclusão do diagnóstico.

---

## Next actions (ordem sugerida, manuais, sem comandos destrutivos)

1. **Executar as queries da Parte C** no Supabase SQL Editor (PROD), colar os resultados nas seções "Cole aqui o resultado" e confirmar se existem colunas NOT NULL (valor_liquido, taxa) e a definição exata do CHECK de status e triggers.
2. **Com base nos resultados:** Se valor_liquido/taxa forem NOT NULL sem default → incluir no INSERT no backend (Caminho 1). Se o CHECK não permitir aguardando_confirmacao/processado/falhou → normalizar status no backend para concluido/cancelado ou ampliar o CHECK no Supabase (Caminho 2), testando primeiro em staging.
3. **Validar em produção (após correção):** Conferir se o bundle do player em produção já é o que usa apenas checkCompatibility() no VersionWarning (sem setInterval); se o spam persistir, promover deploy do player atual sem alterar o deploy estável FyKKeg6zb até o procedimento padrão de release.
