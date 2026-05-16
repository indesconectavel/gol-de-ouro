# REVISÃO GERAL READ-ONLY — GOL DE OURO

**Data do relatório:** 2026-05-15  
**Modo:** exclusivamente read-only — **nenhuma** alteração de código de aplicação, **nenhum** commit, **nenhum** deploy, **nenhuma** correção executada nesta etapa.  
**Exceção deliberada:** criação deste ficheiro de relatório em `docs/relatorios/`, conforme pedido explícito de saída obrigatória.

**Âmbito da evidência:** inspeção do repositório local, leitura de documentação existente, workflows GitHub Actions, `fly.toml`, `Dockerfile`, amostras de código, e **duas** requisições HTTP read-only ao runtime público (`GET /health`, `GET /meta`) executadas durante a elaboração deste documento.

**Nota temporal:** o servidor devolveu `timestamp` em **2026-05-16T01:22:07Z** no `/health` — diferença de um dia face à data nominal do relatório; tratado como **fato** de relógio do servidor.

---

## 1. Resumo executivo

O ecossistema **Gol de Ouro** existe como **monorepo** centrado em `goldeouro-backend`, com **backend Node/Express** (`server-fly.js`), **frontend jogador** (`goldeouro-player`, Vite/React/PWA), **painel admin** (`goldeouro-admin`, código-fonte + `dist`), **SQL e migrações** em `database/`, integração **Supabase/PostgreSQL**, **Mercado Pago** (PIX depósito e payout/saques), **worker de payout** no Fly (`payout_worker`), e **CI/CD** via **GitHub Actions** + **Fly.io** + **Vercel**.

**Fato (runtime público, verificado nesta sessão):** `https://goldeouro-backend-v2.fly.dev/health` responde **200** com `database: connected`, `mercadoPago: connected`, `version: 1.2.1`. `GET /meta` responde **200** com `gitCommit: 7ecedca98d1f5d5d7c1878aa043ec724e422dd41`.

**Risco:** o working tree local está **sujo** (ex.: `goldeouro-player/vercel.json` modificado; muitos ficheiros `??` em `docs/relatorios/`, `scripts/`, SQL), e a branch ativa **não** é `main` — **drift** entre o que está no disco, o que está em `main` remoto e o que está em produção é **plausível** e exige governança antes de nova cirurgia.

**Hipótese (não verificada aqui):** o commit em produção (`7ecedca…`) pode estar **atrás** do `HEAD` local na branch de feature; isso só fecha com `fly releases` + comparação ao remoto.

**Classificação global desta revisão:** **GO COM RESSALVAS** — alinhado ao fechamento V1 documentado (`RELATORIO-OFICIAL-FECHAMENTO-V1-GOLDEOURO-2026-05-12.md`), reforçado pela checagem pontual de `/health` e `/meta`, com ressalvas de **higiene Git**, **homologação E2E humana incompleta** e **pipeline com `continue-on-error`**.

---

## 2. Estado geral do projeto

| Dimensão | Avaliação | Classificação |
|----------|------------|---------------|
| Estrutura de pastas e entrypoints claros | Sim (`server-fly.js`, `Dockerfile` → `server-fly.js`) | **OK** |
| Documentação operacional e auditorias | Muito extensa em `docs/` e `docs/relatorios/` | **OK COM RESSALVAS** (volume alto, alguns `??` não integrados no Git) |
| Consistência Git local ↔ remoto ↔ produção | Branch `fix/admin-financial-integrity-v1`; working tree suja | **RISCO** |
| Rastreabilidade runtime | `/meta.gitCommit` preenchido na resposta observada | **OK** |
| Homologação E2E autenticada | Documentação indica smoke humano pendente | **NÃO VERIFICADO** / **OK COM RESSALVAS** |

**Ficheiros críticos (backend):** `server-fly.js`, `fly.toml`, `Dockerfile`, `database/supabase-unified-config.js` (referenciado em `server-fly.js`), `services/pix-mercado-pago.js`, `src/domain/payout/processPendingWithdrawals.js`, `src/workers/payout-worker.js`, `utils/webhook-signature-validator.js`, `config/required-env.js`.

**Ficheiros críticos (player):** `goldeouro-player/vite.config.*`, `goldeouro-player/vercel.json`, rotas SPA, integração API (axios), páginas de jogo (ex.: `GameShootFallback.jsx`, variantes `GameFinal_*`).

**Ficheiros críticos (admin):** `goldeouro-admin/src/AppRoutes.jsx`, páginas em `src/pages/`, bundle `dist/` publicado.

**Git (fato, sessão local):** branch atual `fix/admin-financial-integrity-v1`; `origin/HEAD` → `origin/main`; últimos commits visíveis incluem trabalho de documentação e game mobile (`dac9f8b`, `079bfd6`, …). Existem **dezenas** de branches locais/remotas — sinal de evolução iterativa, não de bloqueio por si só.

---

## 3. Backend

**O que existe:** Express 4, Helmet, CORS, rate limit, JWT, cliente Supabase, integração Mercado Pago (axios), rotas de pagamento/webhook, saques, jogo, admin, health/meta, WebSocket (módulo referenciado). Monitoramento avançado no código **comentado** em `server-fly.js` (trecho inicial lido).

**O que parece funcionar (fato parcial):** runtime público saudável; `/meta` com versão e commit.

**Fragilidades:**  
- **Fato:** existem **múltiplos** artefactos de servidor (`server-fly-deploy.js`, `controllers/paymentController.js`, `middlewares/authMiddleware.js`) — o **Dockerfile** aponta apenas para `server-fly.js`. Risco de **confusão cognitiva** ou manutenção no ficheiro errado.  
- **Fato:** `main-pipeline.yml` usa `continue-on-error: true` no deploy Fly e no passo de health check — falhas podem **não** falhar o job.  
- **Hipótese:** duplicação parcial de lógica de webhook entre serviços e `server-fly.js`.

| Classificação | **OK COM RESSALVAS** |

---

## 4. Frontend player

**O que existe:** Projeto Vite/React (`goldeouro-player`), PWA (Workbox no `dist` gerado), Capacitor para Android, testes Jest configurados em `package.json`.

**O que parece funcionar:** Documentação recente (H3.x game mobile) e fechamento V1 indicam player publicado; **nesta sessão** não foi feito browser E2E.

**Fragilidades:**  
- **Fato:** `goldeouro-player/vercel.json` está **modificado** e não limpo no `git status` — drift deploy vs repo.  
- **Fato:** ESLint no workflow de frontend usa `|| echo` para não falhar — qualidade pode passar com avisos.  
- **Risco:** múltiplas variantes de UI de jogo (`GameFinal_BACKUP_*`, `GameShootFallback.jsx`) — risco de **rota errada** ou bundle que não reflete a “versão canónica” sem verificação de `App`/`router`.

| Classificação | **OK COM RESSALVAS** |

---

## 5. Painel admin

**O que existe:** Aplicação em `goldeouro-admin/` com páginas (Utilizadores, Transacções, Auditoria, Logs, etc.) e `dist/` pré-gerado.

**Fato estrutural:** presença de `goldeouro-admin/.git` nos resultados de listagem — indica **sub-repositório Git aninhado** dentro do monorepo. Isto é **risco de governança** (submodule/subtree mal documentado, clones incompletos).

**Documentação:** relatórios T14A, diagnósticos READONLY 404, alinhamento `/api/admin/*` (vide `RELATORIO-OFICIAL-FECHAMENTO-V1-GOLDEOURO-2026-05-12.md`).

| Classificação | **OK COM RESSALVAS** |

---

## 6. Banco de dados

**O que existe:** Ficheiros `database/schema*.sql`, `database/migrations/*.sql` (ex.: ledger/saques, MP payout intents, `admin_logs`, CPF/CNPJ, `shoot_apply_atomic_transaction.sql`). Script `exec-plano-b-reversao-transacao-20260504.sql` presente como **untracked** no estado Git inicial — operação sensível **fora** do controlo de versão até commit explícito.

**O que não foi verificado aqui:** estado real das tabelas, RLS, e migrações aplicadas no projeto Supabase de produção (requer credenciais e política de acesso).

| Classificação | **NÃO VERIFICADO** (schema local **OK**; aplicação em prod **RESSALVAS**)

---

## 7. Financeiro, PIX e saques

**O que existe:** Webhooks em `server-fly.js` (`/api/payments/webhook` para depósito; `/webhooks/mercadopago` para payout com flag `PAYOUT_PIX_ENABLED`), serviço `services/pix-mercado-pago.js`, domínio `src/domain/payout/processPendingWithdrawals.js`, worker `payout_worker` no `fly.toml`, scripts read-only de auditoria em `scripts/` (ex.: release audit PIX/saques).

**O que parece funcionar:** `/health` reporta `mercadoPago: connected` (fato da resposta HTTP).

**Fragilidades:**  
- **Fato:** múltiplas camadas e flags (`PAYOUT_PIX_ENABLED`, `ENABLE_PIX_PAYOUT_WORKER`) — erro de configuração em env é **risco real**.  
- **Fato:** documentação histórica menciona endurecimento de assinatura de webhook — qualquer regressão é **risco**.  
- **Hipótese:** reconciliação manual e edge cases de saque exigem validação periódica (já documentada em relatórios de maio/2026).

| Classificação | **OK COM RESSALVAS** |

---

## 8. Engine do jogo

**O que existe:** Lógica de chute e estado no frontend (ficheiros em `goldeouro-player/src/pages/` e CSS de jogo); no backend, contadores expostos no `/health` (`contadorChutes`, `ultimoGolDeOuro`) — indicação de persistência/contagem no servidor (**fato parcial**).

**O que não foi verificado:** fairness, RNG, anti-fraude, latência e idempotência de cada endpoint de chute em carga real.

| Classificação | **NÃO VERIFICADO** (código presente; prova de jogo completo **RESSALVAS**)

---

## 9. Autenticação

**O que existe:** JWT com `JWT_SECRET`; middleware `authenticateToken` inline em `server-fly.js` e módulo `middlewares/authMiddleware.js`; fluxos de registo/login referenciados na documentação.

**Fragilidades:**  
- **Fato:** mais de uma implementação de verificação JWT no repositório — risco de divergência se rotas usarem middlewares diferentes.  
- **Risco:** exposição de rotas admin sem token retorna **401** (comportamento desejável); validação de papel admin documentada como camada adicional (`requireAdministradorDb`).

| Classificação | **OK COM RESSALVAS** |

---

## 10. Deploy e runtime

**Fly.io:** `fly.toml` com app `goldeouro-backend-v2`, região `gru`, processos `app` + `payout_worker`, health check HTTP `/health`.

**Vercel:** Workflow `frontend-deploy.yml` para `goldeouro-player`; `vercel.json` com CSP, cache e rewrites SPA.

**Drift código ↔ deploy ↔ runtime:**  
- **Fato:** imagem em execução reporta `gitCommit` **7ecedca…**; o `HEAD` local na branch de trabalho pode diferir — **drift** até próximo deploy com `--build-arg GIT_COMMIT=$(git rev-parse HEAD)`.  
- **Fato:** `goldeouro-player/vercel.json` modificado localmente — possível drift front.

**Runtime (fato verificado):** ver secção 1 e resumo executivo.

| Classificação | **OK COM RESSALVAS** |

---

## 11. Segurança e observabilidade

**Segurança:** Helmet, rate limit, validação de env em `config/required-env.js`, validadores PIX e assinatura de webhook referenciados em `server-fly.js`. Histórico de correções SSRF em variantes de webhook (`server-fly-deploy.js` em busca semântica).

**Observabilidade:** `financeLog` e logs `console` no fluxo financeiro; sistema de logs avançado com fallback; monitoramento Fly “avançado” desativado no código comentado.

**Riscos:** CSP do player inclui `'unsafe-inline'` e `'unsafe-eval'` (**fato** em `vercel.json`) — trade-off comum para SPAs, mas **superfície XSS** elevada se houver injeção de conteúdo. Secrets em `.env` não inspecionados (correcto em read-only).

| Classificação | **OK COM RESSALVAS** (observabilidade **NÃO VERIFICADA** end-to-end fora dos logs citados na doc)

---

## 12. Documentação

**Documentado bem:** pipelines (`docs/PIPELINE-GITHUB-ACTIONS.md`), auditorias em `docs/auditorias/`, fechamento V1 (`RELATORIO-OFICIAL-FECHAMENTO-V1-GOLDEOURO-2026-05-12.md`), validação global (`VALIDACAO-GLOBAL-RUNTIME-FECHAMENTO-PIPELINE-V1-2026-05-12.md`), comandos Cursor em `.cursor/commands/` (deploy, teste, auditoria).

**Não documentado ou fraco:**  
- **Fato:** grande conjunto de relatórios e scripts ainda **untracked** — não fazem parte da “verdade oficial” do Git até integração.  
- **Hipótese:** relação exacta entre `goldeouro-admin` aninhado e o monorepo pode não estar clara para novos intervenientes.

| Classificação | **OK COM RESSALVAS** |

---

## 13. Pipeline oficial atual

**Componentes “oficiais” observados:**  
- `ci.yml` — install + smoke + audit com `|| true` em audit.  
- `main-pipeline.yml` — `npm ci`, validação de ficheiros, deploy Fly com **`continue-on-error: true`**, health com retry mas **também** `continue-on-error: true`.  
- `frontend-deploy.yml` — testes condicionais, build, deploy Vercel em `main`/`dev` com paths filtrados.  
- Outros: `backend-deploy.yml`, `tests.yml`, `security.yml`, `monitoring.yml`, `health-monitor.yml`, `rollback.yml`, `deploy-on-demand.yml`.

**Suficiência:** cobre **build** e **deploy**, com gates **fracos** em falhas (continue-on-error, audits ignoráveis). **Não** substitui homologação manual nem auditoria financeira read-only periódica.

| Classificação | **OK COM RESSALVAS** |

---

## 14. Melhorias recomendadas no pipeline (diagnóstico apenas)

1. **Falhar o job** quando deploy Fly ou health check crítico falhar (rever `continue-on-error`).  
2. Tornar **obrigatório** o `npm audit` ou política explícita de excepção (sem `|| true` silencioso).  
3. **Artifact** ou step que grave o **SHA deployado** e compare com `github.sha` (detecção de drift).  
4. Teste de **contrato** mínimo em PR (Docker build + `curl` `/health` a staging, se existir).  
5. **Normalizar** documentação: integrar relatórios `??` ou movê-los para arquivo com política clara.

---

## 15. Riscos encontrados

| ID | Descrição | Tipo |
|----|-----------|------|
| R1 | Working tree suja + `vercel.json` alterado — risco de deploy a partir do estado errado | **Fato** → **Risco** |
| R2 | `continue-on-error` no pipeline principal — “verde” com deploy falhado | **Fato** → **Risco** |
| R3 | Múltiplos ficheiros servidor / webhook — manutenção no legado por engano | **Fato** → **Risco** |
| R4 | `goldeouro-admin` com `.git` próprio — clones incompletos ou versões desalinhadas | **Fato** → **Risco** |
| R5 | Scripts SQL de reversão (`exec-plano-b-…`) fora do Git no snapshot inicial | **Fato** → **Risco** |
| R6 | Homologação E2E humana incompleta (documentado) | **Risco operacional** |

---

## 16. Bloqueadores encontrados

**Nenhum bloqueador técnico** identificado **nesta revisão read-only** que impeça o runtime de responder ou que invalide o uso do pipeline existente, desde que se aceitem as ressalvas de governança Git e gates de CI.

Se a política interna exigir **“zero ficheiros untracked antes de qualquer deploy”**, o estado atual do working tree seria **bloqueador processual** — isso é **critério organizacional**, não verificado como regra automática no repo.

| Classificação bloqueadores | **Nenhum** no sentido estrito de “sistema parado” |

---

## 17. Próximas etapas recomendadas (sem implementação nesta etapa)

1. **Congelar verdade Git:** decidir se a linha base é `main` ou a branch de integração atual; commitar ou descartar alterações em `goldeouro-player/vercel.json`; integrar ou arquivar relatórios/scripts `??`.  
2. **Confirmar alinhamento:** `git rev-parse HEAD` na branch escolhida vs `GET /meta` após próximo deploy (se objectivo for eliminar drift).  
3. **Checklist humano:** um smoke E2E (registo → depósito teste → chute → saque em sandbox) documentado com capturas/evidência.  
4. **Auditoria financeira read-only:** reexecutar scripts já existentes contra Supabase (com credenciais em ambiente controlado).  
5. **Rever pipeline:** decisão explícita sobre `continue-on-error`.

---

## 18. Decisão final: GO / GO COM RESSALVAS / NO-GO

### **GO COM RESSALVAS**

**Justificativa (síntese):** o runtime público verificado está **operacional** e **rastreável** via `/meta`; a arquitectura e a documentação de V1 sustentam operação contínua. As ressalvas **principalmente** de higiene Git, gates de CI e homologação humana impedem um **GO** “puro” sem condições.

**Próxima etapa mais segura:** **normalização do working tree e da branch de referência**, seguida de **revalidação read-only** (runtime + scripts de auditoria) **antes** de qualquer nova “cirurgia” de código ou deploy — sem implementar mudanças até essa governança estar fechada.

---

*Fim do relatório.*
