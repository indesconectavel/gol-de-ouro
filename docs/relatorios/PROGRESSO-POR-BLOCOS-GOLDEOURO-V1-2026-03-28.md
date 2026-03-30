# PROGRESSO POR BLOCOS — GOL DE OURO V1

**Data do relatório:** 2026-03-28  
**Escopo:** apenas evidências no repositório local (sem execução em produção, sem suposições de comportamento não refletido no código).

---

## 1. Resumo executivo

O núcleo operacional V1 concentra-se em `server-fly.js`: autenticação JWT, perfil, chute (`/api/games/shoot`), PIX (criação via API de pagamentos MP, webhook, reconcile periódico, crédito com RPC opcional), saque (RPC opcional + fallback JS), health/readiness e ingestão de analytics. O player (`goldeouro-player`) chama esses endpoints via `gameService.js` e `apiClient.js`.

Há **duplicação arquitetural**: rotas ricas em `routes/paymentRoutes.js`, `routes/gameRoutes.js` e `middlewares/auth.js` coexistem com a implementação efetiva do deploy Fly, que **não monta** esses routers (exceto `routes/analyticsIngest.js`). O ficheiro `.env.example` **não documenta** variáveis que `server-fly.js` exige via `config/required-env.js` (ex.: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

Riscos transversais: **estado de jogo em memória** (lotes + idempotência) não partilhável entre instâncias Fly; resposta de `/api/metrics` **não alinha** com o que `gameService.loadGlobalMetrics()` espera; RPCs e colunas SQL (`reconcile_skip`) são **opcionais** até aplicadas no Supabase.

---

## 2. Tabela geral de progresso

| Bloco | Status | % | Observação |
|------|--------|---|------------|
| BACKEND CORE | CONCLUÍDO COM RESSALVAS | 82 | Monólito `server-fly.js` completo; routers alternativos não integrados ao entrypoint Fly. |
| SISTEMA FINANCEIRO (PIX + SAQUE) | CONCLUÍDO COM RESSALVAS | 78 | Fluxo principal no `server-fly.js`; RPC/fallback; segundo caminho em `paymentController.js` diferente. |
| BANCO DE DADOS (SUPABASE) | PARCIAL | 68 | Uso consistente no código; DDL disperso; migrações/RPC manuais; possível divergência em SQL legado (`result` vs `resultado`). |
| GAMEPLAY ENGINE | CONCLUÍDO COM RESSALVAS | 72 | Lógica explícita em `server-fly.js`; dependência de memória e contador global. |
| PLAYER (FRONTEND) | EM ANDAMENTO | 70 | Integração real com shoot/profile; contrato `/api/metrics` vs `gameService` incoerente. |
| AUTENTICAÇÃO | CONCLUÍDO COM RESSALVAS | 80 | JWT em `server-fly.js`; middleware `middlewares/auth.js` usa payload `id` (incompatível com token `userId` se usado). |
| OBSERVABILIDADE / LOGS | PARCIAL | 52 | Logs prefixados; health; métricas custom Fly comentadas; `/api/metrics` parcialmente zerado. |
| INFRA / DEPLOY | CONCLUÍDO COM RESSALVAS | 76 | `fly.toml` + `Dockerfile`; estado do deploy em Fly.io **não** inferível só pelo Git. |

**Progresso total (média simples dos 8 blocos): ~72%.**  
(Ponderação manual sugerida: financeiro + gameplay + DB pesam mais para “produção real”; mesmo assim o relatório mantém média simples para transparência.)

---

## 3. Detalhamento por bloco

### BACKEND CORE

**1. Status:** CONCLUÍDO COM RESSALVAS  

**2. Nível de completude:** 82%  

**3. Evidências reais**
- **Entrypoint:** `Dockerfile` → `CMD ["node", "server-fly.js"]`.
- **App Express:** `server-fly.js` — `helmet`, `cors`, `compression`, `express-rate-limit`, `express.json`, Supabase (`database/supabase-unified-config`), teste Mercado Pago no arranque.
- **Rotas principais (inline no monólito):**  
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`, forgot/reset/verify-email, `PUT /api/auth/change-password`, duplicata `POST /auth/login`.  
  - Perfil: `GET|PUT /api/user/profile`, `GET /usuario/perfil`.  
  - Jogo: `POST /api/games/shoot`.  
  - Financeiro: `POST /api/payments/pix/criar`, `GET /api/payments/pix/usuario`, `POST /api/payments/webhook`, `POST /api/withdraw/request`, `GET /api/withdraw/history`.  
  - Saúde: `GET /health`, `GET /ready`, `GET /api/metrics`, `GET /api/monitoring/*`, `GET /api/production-status`, `GET /api/debug/token` (condicionado).  
  - Outros: `GET /api/fila/entrar` (resposta simulada), WebSocket via `src/websocket`.
- **Router externo montado:** `app.use('/api/analytics', require('./routes/analyticsIngest'))`.
- **Não montado no `server-fly.js`:** `routes/gameRoutes.js`, `routes/paymentRoutes.js`, `routes/authRoutes.js`, etc. (existem como ficheiros à parte).

**4. O que está funcionando (objetivo)**  
Um servidor único expõe os fluxos V1 documentados no próprio ficheiro: registro/login, perfil, chute, PIX e saque, webhook, reconcile, health e readiness após `listen`.

**5. O que ainda falta**
- Integração única dos vários `routes/*.js` ou remoção/documentação clara do que é legado.  
- `/api/metrics` alinhado com consumidores (ver bloco PLAYER).  
- Monitoramento avançado importado mas **comentado** no topo de `server-fly.js`.

**6. Riscos técnicos**
- Duas “camadas” de API (monólito vs routers) geram confusão sobre qual código está em produção.  
- `GET /api/debug/token` expõe dados sensíveis se `DEBUG_TOKEN` estiver ativo (lógica no fim do ficheiro; não reproduzida aqui em detalhe — existe o endpoint no grep de rotas).

---

### SISTEMA FINANCEIRO (PIX + SAQUE)

**1. Status:** CONCLUÍDO COM RESSALVAS  

**2. Nível de completude:** 78%  

**3. Evidências reais**
- **Criação PIX (caminho Fly):** `POST /api/payments/pix/criar` em `server-fly.js` — `axios.post` `https://api.mercadopago.com/v1/payments`, `payment_method_id: 'pix'`, persistência em `pagamentos_pix` com `dualWritePagamentoPixRow` (`utils/financialNormalization.js`).
- **Webhook:** `POST /api/payments/webhook` — validação opcional via `utils/webhook-signature-validator.js` se `MERCADOPAGO_WEBHOOK_SECRET`; consulta MP; `creditarPixAprovadoUnicoMpPaymentId`.
- **Crédito:** preferência `supabase.rpc('creditar_pix_aprovado_mp', …)` quando `FINANCE_ATOMIC_RPC !== 'false'`; fallback `creditarPixAprovadoUnicoMpPaymentIdJsLegacy` no mesmo ficheiro.
- **Reconcile:** `reconcilePendingPayments`, `setInterval` quando `MP_RECONCILE_ENABLED !== 'false'`; coluna `reconcile_skip` com fallback se migração ausente (`database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql`).
- **Saque:** `POST /api/withdraw/request` — RPC `solicitar_saque_pix_atomico` (`database/rpc-financeiro-atomico-2026-03-28.sql`) ou sequência débito + `insert` em `saques` com rollback documentado.
- **Caminho alternativo:** `controllers/paymentController.js` — `Preference.create` + `pagamentos_pix`; `req.user.id` (modelo diferente do JWT `userId` do monólito); webhook em `routes/paymentRoutes.js` aponta para o controller.

**4. O que está funcionando**  
Fluxo end-to-end **no desenho do `server-fly.js`**: criar cobrança PIX MP, gravar linha pendente, webhook/reconcile chamam crédito idempotente com caminho atómico opcional. Saque com débito e registo, atómico opcional.

**5. O que ainda falta**
- Garantir no ambiente real que as funções SQL do ficheiro `database/rpc-financeiro-atomico-2026-03-28.sql` e migração `reconcile_skip` estão aplicadas (o código apenas adapta se não estiverem).  
- Unificar ou isolar `paymentController` / `routes/mpWebhook.js` (PG direto + `mp_events`) para não haver dois “mundos” financeiros.

**6. Riscos técnicos**
- **RPC ausente:** fallback JS multi-request abre janelas menores mas não equivalentes à transação única.  
- **Legado `pagamentos_pix`:** IDs não numéricos entram em reconcile com skip (comportamento explícito no código).  
- **Webhook:** em não-produção, assinatura inválida pode ser apenas logada (`NODE_ENV !== 'production'`).

---

### BANCO DE DADOS (SUPABASE)

**1. Status:** PARCIAL  

**2. Nível de completude:** 68%  

**3. Evidências reais**
- **Tabelas usadas no runtime (PostgREST via Supabase client em `server-fly.js`):**  
  - `usuarios` (saldo, perfil, auth).  
  - `chutes` — `insert` com `usuario_id`, `lote_id`, `direcao`, `valor_aposta`, `resultado`, `premio`, `premio_gol_de_ouro`, `is_gol_de_ouro`, `contador_global`, `shot_index`.  
  - `pagamentos_pix` — campos `amount`/`valor`, `payment_id`, `external_id`, `status`, QR; normalização em `financialNormalization.js`.  
  - `saques` — `dualWriteSaqueRow` alinha EN/PT.  
  - `metricas_globais` — `upsert` id 1, `contador_chutes_global`, `ultimo_gol_de_ouro`.  
  - Tabelas auxiliares: `password_reset_tokens`, `email_verification_tokens` (fluxos de email).
- **SQL no repositório:** `database/rpc-financeiro-atomico-2026-03-28.sql`, `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql`, `database/schema-ranking.sql`, `database/corrigir-supabase-security-warnings.sql`, etc.
- **Inconsistência documentada em SQL vs app:** `database/schema-ranking.sql` referencia `chutes` com coluna `result`; o insert em `server-fly.js` usa `resultado`. Isto é risco se esse SQL for aplicado sem alinhamento.

**4. O que está funcionando**  
O código assume um schema compatível com os nomes de colunas usados nos `insert`/`select`/`update` do monólito e com as funções RPC definidas no ficheiro SQL de 2026-03-28.

**5. O que ainda falta**
- Schema canónico único (ou gerado) que cubra todas as queries e views/rankings.  
- Prova no repo de que constraints (FK, unicidade de `payment_id`, etc.) existem — **não** estão centralizadas num único DDL verificado nesta auditoria.

**6. Riscos técnicos**
- Colunas espelhadas (`amount`/`valor`, chaves PIX PT/EN) mitigadas em JS, mas dados antigos podem divergir (há `console.warn` em `financialNormalization.js`).  
- Migrações críticas vivendo apenas como ficheiros SQL manuais.

---

### GAMEPLAY ENGINE

**1. Status:** CONCLUÍDO COM RESSALVAS  

**2. Nível de completude:** 72%  

**3. Evidências reais**
- **Lote em memória:** `lotesAtivos` (`Map`), `getOrCreateLoteByValue`, `batchConfigs` (V1 efetivo: aposta 1 → `size: 10`, `winnerIndex: config.size - 1` — último chute do lote é gol).
- **Contador global:** `contadorChutesGlobal`, incremento a cada chute; `isGolDeOuro = contadorChutesGlobal % 1000 === 0`; persistência `saveGlobalCounter` → `metricas_globais`; carregamento no `startServer()`.
- **Chute:** `POST /api/games/shoot` — validação direção `VALID_DIRECTIONS`, `amount === 1`, saldo, idempotência em `Map` com TTL, optimistic lock em `usuarios.saldo`, `LoteIntegrityValidator` antes/depois, insert `chutes`, rollback de saldo/lote se falhar.
- **Prémios:** gol → `premio = 5`, opcional `premioGolDeOuro = 100` se múltiplo de 1000 chutes globais.

**4. O que está funcionando**  
Regra de resultado **determinística** no código: índice do chute no lote vs `winnerIndex`; contador global e Gol de Ouro acoplados ao contador em memória sincronizado com DB no `upsert`.

**5. O que ainda falta**
- Modelo multi-instância ou fila única: **não** há evidência no código de partilha de `lotesAtivos` entre processos.  
- Recuperação de lotes após restart: novos lotes criam-se de novo; estado parcial de lote **não** foi auditado como rehidratado a partir de `chutes` (não encontrado nesta leitura).

**6. Riscos técnicos**
- **Fly com scale > 1 ou restart:** lotes e idempotência tornam-se incoerentes entre instâncias ou reinícios.  
- `winnerIndex` fixo no último lugar do lote — “probabilidade” dos comentários não é aleatória.

---

### PLAYER (FRONTEND)

**1. Status:** EM ANDAMENTO  

**2. Nível de completude:** 70%  

**3. Evidências reais**
- **Serviço:** `goldeouro-player/src/services/gameService.js` — `loadUserData` → `GET /api/user/profile`; `processShot` → `POST /api/games/shoot` com `X-Idempotency-Key`; `initialize()` chama `loadGlobalMetrics()` → `GET /api/metrics`.
- **Páginas:** `Game.jsx`, `GameShoot.jsx`, `GameFinal.jsx`, CSS associados; `GameShoot.jsx` usa `gameService.initialize()` e estado de HUD/animações.
- **API:** `apiClient.js` — `Authorization: Bearer` de `localStorage`, `baseURL` de `config/environments.js`.
- **Analytics:** `goldeouro-player/src/utils/analytics.js` (ficheiro presente no working tree).

**4. O que está funcionando**  
Chamadas ao backend para perfil e chute estão implementadas e alinhadas com o contrato de resposta do shoot (`success`, `data.novoSaldo`, `contadorGlobal`, etc.).

**5. O que ainda falta**
- **`loadGlobalMetrics`:** espera `response.data.data.contador_chutes_global` e `ultimo_gol_de_ouro`; `server-fly.js` em `/api/metrics` devolve objeto com `totalChutes`, `ultimoGolDeOuro` (e ainda zera vários campos no ramo “dados reais”). Evidência objetiva: desencontro de chaves e semântica.  
- Garantir que o HUD usa apenas dados do shoot após primeira jogada se métricas falharem.

**6. Riscos técnicos**
- Contador “Gol de Ouro” no cliente pode ficar **0** ou desatualizado face ao servidor.  
- Idempotency key em `gameService` usa `Math.random()` no browser (aceitável para unicidade, mas não criptográfico — risco baixo; apenas nota).

---

### AUTENTICAÇÃO

**1. Status:** CONCLUÍDO COM RESSALVAS  

**2. Nível de completude:** 80%  

**3. Evidências reais**
- **JWT:** `jwt.sign` com payload `{ userId, email, username }` em login/registro; `authenticateToken` em `server-fly.js` faz `jwt.verify` e define `req.user`.
- **Rotas protegidas:** `authenticateToken` em shoot, PIX, withdraw, profile, etc.
- **Alternativa:** `middlewares/auth.js` — `decoded.id` e consulta `usuarios` com campos `username` (pode não existir no select do monólito — divergência de modelo).

**4. O que está funcionando**  
Fluxo principal email/senha + bcrypt + token para o player que usa o mesmo esquema `userId` no monólito.

**5. O que ainda falta**
- Alinhar middleware legado com payload `userId` ou documentar que `paymentRoutes` não deve ser usado com tokens do monólito sem adaptação.

**6. Riscos técnicos**
- Dois middlewares JWT com convenções de payload diferentes.  
- Endpoint de debug de token (se habilitado) aumenta superfície de vazamento.

---

### OBSERVABILIDADE / LOGS

**1. Status:** PARCIAL  

**2. Nível de completude:** 52%  

**3. Evidências reais**
- **Logs:** prefixos explícitos no monólito, por exemplo `[SHOOT]`, `[WEBHOOK]`, `[RECON]`, `[PIX]`, `[SAQUE]`, `[AUTH]`, `[METRICS]`.
- **Health:** `GET /health` — testa Supabase com `usuarios` head count; expõe `mercadoPago`, `contadorChutes`, `ultimoGolDeOuro`.
- **Readiness:** `GET /ready` — `isAppReady` após `listen`.
- **Métricas internas:** objeto `monitoringMetrics` e middleware de contagem de requests no `startServer()` de `server-fly.js`.
- **Fly custom metrics:** import comentado (bloco `monitoring/flyio-custom-metrics.js`).

**4. O que está funcionando**  
Health para load balancer; logs operacionais no processo Node; reconcile com logs de erro.

**5. O que ainda falta**
- Métricas Fly/alertas desligadas no código comentado.  
- `/api/metrics` não expõe de forma estável o contador no formato esperado pelo player (ver acima).

**6. Riscos técnicos**
- `contadorChutes` em `/health` reflecte memória do processo; em multi-instância, valores diferem entre VMs.  
- Duplo middleware de erro no final de `server-fly.js` (dois `app.use` de erro) — comportamento depende da ordem de registo.

---

### INFRA / DEPLOY

**1. Status:** CONCLUÍDO COM RESSALVAS  

**2. Nível de completude:** 76%  

**3. Evidências reais**
- **`fly.toml`:** app `goldeouro-backend-v2`, região `gru`, `internal_port = 8080`, health check `GET /health` 30s, `Dockerfile` root.
- **`Dockerfile`:** Node 20 alpine, `npm install --only=production`, `CMD ["node", "server-fly.js"]`, `PORT=8080`.
- **`.env.example`:** `DATABASE_URL`, `JWT_SECRET`, `ADMIN_TOKEN`, CORS, bloco financeiro opcional — **não inclui** `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `MERCADOPAGO_ACCESS_TOKEN` / `BACKEND_URL` usados pelo monólito.

**4. O que está funcionando**  
Definição de imagem e app Fly coerente com o servidor único; health check alinhado com rota existente.

**5. O que ainda falta**
- `.env.example` sincronizado com `assertRequiredEnv` em `server-fly.js`.  
- Documentação no repo do **estado atual** do deploy (revisões Fly, secrets) — **fora do escopo do Git**.

**6. Riscos técnicos**
- `memory_mb = 256` com app completo + axios + websocket — risco de pressão de memória (não medido aqui).  
- Variáveis críticas apenas nos secrets da plataforma; exemplo local incompleto aumenta erro humano.

---

## 4. Visão consolidada

### Progresso total do projeto (em %)

~**72%** (média dos oito blocos; ver tabela).

### Blocos mais avançados

1. Backend core (monólito Fly)  
2. Autenticação (fluxo principal JWT)  
3. Sistema financeiro (desenho no `server-fly.js`)

### Blocos críticos pendentes (bloqueiam “produção real” multi-usuário escalável)

- **Gameplay em memória + escala horizontal / restart.**  
- **Contrato `/api/metrics` vs player** (HUD / Gol de Ouro).  
- **Consistência schema/SQL** (ranking vs colunas reais) e aplicação confirmada de RPC/migrações.

### Gargalos atuais

| Tipo | Descrição |
|------|-----------|
| Técnicos | Estado de lote e idempotência só no processo; métricas API vs `gameService`. |
| Infra | Possível multi-instância Fly sem coordenação de estado de jogo. |
| Arquitetura | Dois conjuntos de rotas/controllers financeiros e auth; um só é o entrypoint Docker. |

---

## 5. Veredito final

**PROJETO EM CONSOLIDAÇÃO**

**Justificativa (evidência):** o fluxo V1 está implementado de ponta a ponta no caminho `server-fly.js` + player, mas persistem dependências de estado em memória, contratos HTTP inconsistentes entre backend e `gameService`, artefactos SQL/RPC opcionais até aplicados no Supabase, e duplicação de camadas de API não montadas no deploy. Não é possível afirmar “pronto para produção” só com o repositório sem resolver escala/coerência de contrato e schema.

---

*Fim do relatório.*
