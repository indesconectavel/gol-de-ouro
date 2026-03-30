# RELATÓRIO MESTRE — V1 GOL DE OURO

**Documento:** consolidação de auditorias READ-ONLY já existentes no repositório.  
**Data de consolidação:** 2026-03-29  
**Premissa de runtime:** `Dockerfile` → `node server-fly.js`; Supabase; Mercado Pago; frontends `goldeouro-player` e `goldeouro-admin` no mesmo mono-repositório.

Este texto **não** propõe alterações de código nem plano de correção; apenas sintetiza o que consta nas auditorias referenciadas na secção final.

---

## 1. Visão geral do sistema

O Gol de Ouro V1 é um conjunto **integrado em torno do monólito Express** `server-fly.js`: autenticação JWT, perfil, motor de jogo por **lotes e contador global em memória**, persistência de chutes e métricas no Supabase, **PIX** via API REST do Mercado Pago com `pagamentos_pix`, **webhook** e **reconcile** periódico, **saque** com caminho RPC opcional ou fallback JS, rotas de saúde e monitorização, montagem de **`/api/admin/*`** via `routes/adminApiFly.js`, e ingestão mínima de analytics.

O **player** consome os endpoints expostos por esse servidor (ex.: login, perfil, chute, PIX). O **painel administrativo** é uma SPA separada que, nas auditorias, apresenta **histórico de legado** e **várias camadas de cliente HTTP**, enquanto o **contrato backend real** para operações administrativas é o router montado em `server-fly.js` com header `x-admin-token`.

Classificação executiva já fixada no checklist V1: **PRONTO COM RESSALVAS** (operacional e de configuração), desde que se respeitem premissas de topologia e secrets.

---

## 2. Arquitetura real (como está implementado)

| Camada | Implementação auditada |
|--------|-------------------------|
| **API principal** | Rotas declaradas **inline** em `server-fly.js` (não o conjunto `routes/gameRoutes.js`, `routes/paymentRoutes.js`, etc., que **não** estão montados no entrypoint Fly). |
| **Auth jogador** | `authenticateToken`: `jwt.verify` com `JWT_SECRET`; payload com `userId` usado nas rotas protegidas. |
| **Motor de jogo** | `lotesAtivos` (`Map`), `contadorChutesGlobal`, `ultimoGolDeOuro`; `getOrCreateLoteByValue`; validador `utils/lote-integrity-validator.js`; `POST /api/games/shoot`. |
| **Dados** | Supabase (`usuarios`, `chutes`, `pagamentos_pix`, `saques`, `metricas_globais`, etc.); RPCs em `database/rpc-financeiro-atomico-2026-03-28.sql` quando aplicadas no projeto. |
| **Financeiro entrada** | `POST /api/payments/pix/criar`, `POST /api/payments/webhook`, `reconcilePendingPayments`, `creditarPixAprovadoUnicoMpPaymentId` (+ RPC / fallback JS). |
| **Financeiro saída** | `POST /api/withdraw/request`, `GET /api/withdraw/history`. |
| **Admin (API)** | `app.use('/api/admin', createAdminApiRouter(...))` com `authAdminToken` (`ADMIN_TOKEN`, mín. 16 caracteres). |
| **Outros routers montados** | `app.use('/api/analytics', …)` (`routes/analyticsIngest.js`). |
| **Frontends** | `goldeouro-player` (jogo, auth, PIX); `goldeouro-admin` (painel; auditoria J descreve legado e desalinhamentos históricos com rotas `/admin/*` não usadas pelo `server-fly.js`). |

---

## 3. Fluxo completo ponta a ponta

Ordem lógica consolidada das auditorias:

1. **Registo / login** — `POST /api/auth/register` ou `POST /api/auth/login`; JWT; opcional saldo inicial em login para utilizadores com saldo zero.  
2. **Sessão** — `GET /api/user/profile` (e validação no cliente; auditoria C regista formato de `user` no contexto após refresh).  
3. **Depósito** — `POST /api/payments/pix/criar` → Mercado Pago → insert `pagamentos_pix` `pending`.  
4. **Pagamento** — utilizador paga no MP; **webhook** `POST /api/payments/webhook` responde cedo com 200; servidor consulta MP e, se `approved`, credita saldo (idempotente).  
5. **Reconcile** — tarefa periódica sobre linhas `pending` antigas com ID MP numérico válido; mesma função de crédito que o webhook.  
6. **Jogo** — `POST /api/games/shoot` com direção válida e `amount === 1` (V1); débito/crédito de prémio num único `UPDATE` com lock otimista; insert `chutes`; atualização de lote em memória e contador global.  
7. **Saque** — `POST /api/withdraw/request` (RPC ou fallback JS, conforme auditoria D).  
8. **Admin** — cliente com `x-admin-token` chama `GET/POST` sob `/api/admin/*` para estatísticas, utilizadores, saques, exportações, snapshot de lotes em memória, etc.

---

## 4. Avaliação por bloco (A → J)

| Bloco | Síntese das auditorias | Classificação consolidada |
|-------|-------------------------|----------------------------|
| **A — Financeiro** | Fluxo MP + `pagamentos_pix` + webhook + reconcile + crédito centralizado; idempotência forte com RPC; órfão MP sem linha local sem crédito automático; webhook sem secret sem HMAC; 200 antes do processamento. | **Com riscos moderados** (relatório A). |
| **B — Engine** | Lotes em RAM; V1 só R$ 1; gol no último índice do lote de 10; contador incrementado antes de fecho completo do chute — possível desvio contador ↔ persistência em falhas; `/api/metrics` com totais zerados no payload observado. | **Com riscos moderados** (relatório B). |
| **C — Auth** | Backend e player com fluxos reais de login, registo, forgot/reset; ressalvas no player: `/login` vs `/`, formato de `user` após GET profile, logout em Navigation/Dashboard sem `useAuth().logout()`, POST `/auth/logout` inexistente no backend. | **Estruturalmente implementado com ressalvas** (relatório C). |
| **D — Saldo** | Fonte de verdade `usuarios.saldo`; chute com lock otimista e rollbacks documentados; PIX/saque com RPC preferida; risco órfão MP; rollback do chute sem revalidar saldo no `WHERE` em cenário extremo. | **Com riscos moderados** (relatório D). |
| **E — Gameplay** | Coberto pelos relatórios B e D: direções TL/TR/C/BL/BR; aposta fixa 1; prémio fixo em gol; Gol de Ouro por múltiplo de 1000 no contador global; validação de integridade do lote. | **Coerente no caminho feliz**; dependente de memória e contador (B). |
| **F — Frontend** | Player: HUD `/game` (`GameFinal`), CSS por `data-page`, integração com shoot e amount 1; relatório executivo HUD marco 2026-03-27. Progresso global: possível incoerência histórica entre `/api/metrics` e o que `gameService` espera. | **Player em evolução com ressalvas de contrato** (F + PROGRESSO). |
| **G — Segurança** | JWT no jogo e rotas sensíveis; webhook condicional ao secret; **superfícies públicas** amplas (`/health` com dados de negócio, `/api/monitoring/*`, etc.); idempotência do chute em memória por processo; cliente gera nova chave por chamada a `processShot` (código atual). | **Riscos moderados a altos** em exposição operacional (relatório G). |
| **H — Economia** | Não há auditoria dedicada “economia” isolada; PROGRESSO e UI referem gamificação/experiência no player sem motor económico server-side paralelo ao núcleo PIX/jogo/saldo. | **Fora do núcleo financeiro V1** / lateral. |
| **I — Escalabilidade** | Instância única e carga moderada: operável com ressalvas; **não** seguro para escala horizontal sem partilha de estado de lotes/contador; contador não atómico no sentido distribuído; restart perde lotes em RAM. Relatório de 2026-03-16 precede envio atual de `X-Idempotency-Key` pelo `gameService.js`. | **Funcional em baixa escala / instância única** (relatório I + evolução posterior do cliente). |
| **J — Admin** | **API** `adminApiFly` montada e protegida — alinhada ao checklist V1. **SPA `goldeouro-admin`:** auditoria 2026-03-28 descreve legado (rotas duplicadas, clientes HTTP múltiplos, login local vs `x-admin-token`, `adminRoutes.js` não carregável com controllers em falta). | **API OK no servidor; painel React com ressalvas estruturais históricas** (J + checklist). |

---

## 5. Integração entre blocos

- **Engine → saldo:** Um único `UPDATE` no chute alinha débito e prémios; falhas pós-update revertem saldo (com nuances em D).  
- **Saldo → financeiro:** Crédito PIX e saque atuam sobre a mesma coluna `usuarios.saldo` com caminhos idempotentes ou compensados.  
- **Financeiro → webhook → saldo:** Webhook confirma no MP antes de creditar; sem linha em `pagamentos_pix` não há crédito.  
- **Saldo → gameplay:** Pré-check de saldo antes do shoot; lock otimista na escrita.  
- **Gameplay → admin:** Snapshot de lotes/contador injetado no router admin a partir do mesmo processo Node.

**Coerência ponta a ponta:** **sim** no desenho do monólito e do player alinhado a `amount = 1` e endpoints documentados. **Quebras** surgem sob **multi-instância**, **configuração ausente** (secret, URL), **órfãos MP** ou **inconsistências do cliente admin antigo** face à API real.

---

## 6. Dependências críticas

- `JWT_SECRET` (arranque); Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`); `MERCADOPAGO_ACCESS_TOKEN` em produção (`required-env`).  
- `MERCADOPAGO_WEBHOOK_SECRET` para HMAC efetivo; `BACKEND_URL` para `notification_url` (fallback fixo no código se ausente).  
- `NODE_ENV=production` para rejeitar assinatura webhook inválida.  
- RPCs `creditar_pix_aprovado_mp` e `solicitar_saque_pix_atomico` quando se pretende caminho atómico em BD.  
- Migração opcional `reconcile_skip` para filtrar linhas legadas no reconcile.  
- `ADMIN_TOKEN` (≥ 16) para `/api/admin/*`.  
- **Uma instância** Node (ou modelo explícito aceite) para lotes e contador global coerentes.

---

## 7. Limitações conhecidas da V1

- Estado de **lotes e idempotência só em memória** por processo; restart descarta lotes ativos.  
- **Contador global** pode desviar-se de chutes persistidos em cenários de falha após incremento (B).  
- **Webhook** responde antes do processamento; falhas posteriores dependem de retentativas e reconcile.  
- **Órfão MP** (cobrança sem linha local) sem recuperação automática no código.  
- **Duplicação de código** no repositório (`paymentController`, outros servers) **não** montada no Fly — risco de confusão operacional se outro entrypoint for usado.  
- Painel admin React: **legado e fragmentação** descritos na auditoria J (independentemente da API `adminApiFly` estar correta no backend).  
- Métricas públicas e monitoring **expostos sem auth** (G).  
- BLOCO H: **sem** subsistema económico server-side equivalente ao fluxo principal.

---

## 8. Riscos aceites

Documentação consolidada trata como **postura assumida ou tolerável apenas com disciplina operacional**:

- Webhook **sem** secret em ambiente exposto.  
- **Múltiplas instâncias** sem partilha de estado de jogo.  
- Exposição de **health/monitoring** com informação útil a reconhecimento ou planeamento de abuso.  
- Dependência de **playbook manual** para órfãos MP.  
- Uso do **painel admin** sem alinhar cliente HTTP e token `x-admin-token` ao contrato oficial.

---

## 9. O que NÃO faz parte da V1 (no âmbito das auditorias)

- Motor de **retenção / economia** server-side além de saldo, PIX, prémios de jogo e saque.  
- **Escala horizontal** da engine com estado partilhado (Redis, fila global de lotes, etc.) — **não** consta como entrega no código auditado.  
- **Unificação** dos routers legados (`routes/*.js`) no mesmo processo Fly.  
- **Garantias** sobre schema Supabase em produção além do que está em ficheiros SQL do repositório.  
- **Substituição** do modelo “gol no 10.º chute do lote de R$ 1” por outros valores de aposta no endpoint atual (config existe em `batchConfigs` mas o shoot força 1).

---

## 10. Estado final do sistema

| Dimensão | Síntese |
|----------|---------|
| **Integração técnica V1** | Monólito `server-fly.js` como coluna vertebral; fluxos principais encadeados. |
| **Prontidão de lançamento** | **PRONTO COM RESSALVAS** (checklist final 2026-03-29): não há bloqueador de código único que imponha perda financeira sistemática no caminho feliz, desde que configuração e topologia sejam as previstas nas auditorias. |
| **Risco residual dominante** | **Operacional e de topologia** (secrets, URL, instância única, RPCs no BD, órfãos, exposição de endpoints). |
| **Painel administrativo** | **API backend** alinhada ao uso com `x-admin-token`; **aplicação React** com histórico de problemas estruturais na auditoria J — estado “fechado” do produto admin depende de qual build/caminho HTTP está em uso face a essa auditoria. |

---

## Fontes consolidadas (auditorias e checklist)

- `docs/relatorios/AUDITORIA-READONLY-BLOCO-A-FINANCEIRO-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-B-ENGINE-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-C-AUTENTICACAO-2026-03-09.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-D-SALDO-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-G-ANTIFRAUDE-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-I-ESCALABILIDADE-2026-03-16.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-J-PAINEL-DE-CONTROLE-2026-03-28.md`  
- `docs/relatorios/CHECKLIST-FINAL-V1-GO-NO-GO-2026-03-29.md`  
- `docs/relatorios/PROGRESSO-POR-BLOCOS-GOLDEOURO-V1-2026-03-28.md`  
- `docs/relatorios/AUDITORIA-MERCADOPAGO-READY-2026-03-29.md`  
- `docs/relatorios/BLOCO-F-AUDITORIA-READONLY-GAME-HUD-EXECUTIVO-2026-03-27.md`  
- `docs/AUDITORIA-BLOCO-B.md` / `RELATORIO-BLOCO-B.md` (atalhos referidos no relatório B)

---

*Fim do relatório mestre.*
