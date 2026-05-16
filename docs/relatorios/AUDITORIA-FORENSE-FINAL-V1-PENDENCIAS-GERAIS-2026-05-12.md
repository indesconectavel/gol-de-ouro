# AUDITORIA FORENSE FINAL V1
# VARREDURA TOTAL DE PENDÊNCIAS

**Data da auditoria:** 2026-05-15  
**Modo:** READ-ONLY (código, deploy, banco e workflows **não** alterados)  
**Entrega:** este documento (única escrita autorizada pelo prompt supremo)  
**Branch:** `fix/admin-financial-integrity-v1`  
**HEAD documental (repo backend):** `10a25cc` — *docs: registrar fechamento oficial V1 goldeouro*  
**Runtime Fly declarado:** release **v452** · `gitCommit` **`7ecedca`** (`/meta`)  
**Baseline oficial:** `RELATORIO-OFICIAL-FECHAMENTO-V1-GOLDEOURO-2026-05-12.md` (commit `10a25cc`)

---

## 1. Resumo executivo

Foi executada varredura forense cruzando **estado Git**, **~285 relatórios** em `docs/relatorios/`, **código** (backend `server-fly.js`, admin, player), **configs/deploy**, **SQL/migrations**, **segurança** e **UX**. A V1 encontra-se **operacional em produção real**, com F1/F2/F3 e fechamento oficial classificados como **APROVADO / OPERACIONAL COM RESSALVAS**.

**Não foi identificada pendência bloqueante** que impeça operação diária, rollback Fly ou suporte de produção. Persistem, porém, **lacunas de governança** (working tree suja, artefactos não versionados), **aceite formal incompleto** (smoke autenticado Cirurgia 11), **hardening financeiro documentado** (webhook payout sem assinatura, depósitos fora do ledger, RPC SQL não versionada) e **dívida de higiene operacional** (scripts/docs com `fly deploy` sem `GIT_COMMIT`).

**Classificação final desta auditoria:** ver secção 19 e **CLASSIFICAÇÃO FINAL** no fim.

---

## 2. Estado Git e baseline

### Comandos executados (2026-05-15)

| Comando | Resultado |
|---------|-----------|
| `git status --short` | ` M goldeouro-player/vercel.json` + **25** entradas `??` |
| `git status` | Branch up to date com `origin/fix/admin-financial-integrity-v1`; nada staged |
| `git branch --show-current` | `fix/admin-financial-integrity-v1` |
| `git log -10 --oneline` | Topo: `10a25cc` fechamento V1 → `60bae48` F3 → `deec98d` F2 → `fe7b7ac` F1 → `61c4679` validação runtime → `a94a70b` H2 exec → **`7ecedca`** fix GIT_COMMIT |
| `git rev-parse HEAD` | `10a25cc27b8296798281ea015e96bfe7531aee52` |
| `git tag --list` | 80+ tags (backups, cirurgias, `v1.2.1`, `pre-h2-runtime-traceability-2026-05-12`, `t14a-runtime-alignment-admin-v1-2026-05-12`, etc.) |
| `git diff -- goldeouro-player/vercel.json` | **Sem delta semântico**; aviso Git: CRLF/LF na working copy |

### Divergências relevantes

| Camada | Commit / estado | Nota |
|--------|-----------------|------|
| **HEAD repo** | `10a25cc` | Documentação pós-runtime (F1–F3 + fechamento) |
| **Runtime Fly** | `7ecedca` (v452) | Código deployado; **3 commits** atrás do HEAD (só docs após H2) |
| **Admin (repo aninhado)** | `bb41c40` local (F3) | `.git` em `goldeouro-admin/`; sem `.gitmodules` no parent |
| **Origin** | Alinhado | Sem ahead/behind na branch |

### Risco de working tree suja

**Médio-alto** para operações Git: `git add .` pode misturar relatórios de incidente, SQL Plano B e `vercel.json` CRLF. **Não** implica regressão em produção até novo deploy acidental.

---

## 3. Relatórios analisados

### Baseline e fechamento V1

| Documento | Papel |
|-----------|--------|
| `RELATORIO-OFICIAL-FECHAMENTO-V1-GOLDEOURO-2026-05-12.md` | Fechamento oficial: **V1 OPERACIONAL APROVADA COM RESSALVAS** |
| `DIAGNOSTICO-FINALIZACAO-V1-PRODUCAO-REAL-2026-05-12.md` | **PRONTO COM RESSALVAS** (parcialmente **superado** em `/meta` após H2) |
| `F1-AUDITORIA-GLOBAL-RUNTIME-PRODUCAO-BACKEND-V1-2026-05-12.md` | F1 **APROVADO COM RESSALVAS** |
| `F2-AUDITORIA-GLOBAL-FINANCEIRO-LEDGER-PIX-SAQUES-V1-2026-05-12.md` | F2 **APROVADO COM RESSALVAS** |
| `F3-AUDITORIA-GLOBAL-FRONTEND-PAINEL-UX-GOVERNANCA-V1-2026-05-12.md` | F3 **APROVADO COM RESSALVAS** |

### Higiene e rastreabilidade

| Documento | Papel |
|-----------|--------|
| `H1-HIGIENE-OPERACIONAL-BASELINE-FINAL-V1-2026-05-12.md` | Working tree suja; **BASELINE ESTÁVEL COM RESSALVAS** |
| `H2-PRE-EXECUCAO-RUNTIME-TRACEABILITY-GITCOMMIT-2026-05-12.md` | Scripts/docs sem `GIT_COMMIT` |
| `H2-EXECUCAO-CONTROLADA-RUNTIME-GITCOMMIT-2026-05-12.md` | Deploy v452; `/meta` corrigido |

### Painel, auditoria, smoke

| Documento | Papel |
|-----------|--------|
| `CIRURGIA-T14A-CORRECAO-ESTRUTURAL-PAINEL-ADMIN-V1-2026-05-12.md` | `/api/admin/*`; mocks críticos removidos |
| `VALIDACAO-FUNCIONAL-T14A-PAINEL-ADMIN-V1-2026-05-12.md` | Checklist parcial |
| `CIRURGIA-10-AUDITORIA-PERSISTIDA-ADMIN-2026-05-12.md` | `admin_logs`; NO-GO deploy sem migration |
| `DEPLOY-CONTROLADO-CIRURGIA-11-TELA-AUDITORIA-ADMIN-2026-05-12.md` | UI `/auditoria` |
| `SMOKE-FINAL-CIRURGIA-11-AUDITORIA-ADMIN-2026-05-12.md` | **NO-GO** aceite completo (sem credenciais) |
| `DIAGNOSTICO-READONLY-LOGS-AUDITORIA-ADMIN-2026-05-12.md` | Rastreabilidade ator admin |
| `RELATORIO-MIGRACAO-TABELA-ADMIN-LOGS-2026-05-12.md` | Migration `admin_logs` |

### Financeiro / saque manual (maio/2026)

| Documento | Papel |
|-----------|--------|
| `DECISAO-CONTROLADA-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md` | Planos A/B/C; ressalva `is_nullable` |
| `EXECUCAO-CONTROLADA-PLANO-B-REVERSAO-2026-05-04.md` | Plano B executado/documentado |
| `GATE-FINAL-READONLY-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md` | Gate readonly |
| `DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md` | Mock histórico em `SaqueUsuarios` (**código atual corrigido** — ver §5) |
| Cirurgias 4–8 (deploy controlado maio/2026) | Saques reais, dashboard, utilizadores |

### Inconsistências entre relatórios

| Tema | Relatório A | Relatório B | Resolução forense |
|------|-------------|-------------|-------------------|
| `gitCommit` nulo | `DIAGNOSTICO-FINALIZACAO-V1` (2026-05-12) | H2 + F1 + Fechamento V1 | **H2 venceu** — produção com hash real; diagnóstico antigo |
| Mock em saques admin | `DIAGNOSTICO-READONLY-ADMIN-SAQUES` (04/05) | T14A + código atual | **Corrigido** — `GET /api/admin/withdraw/list` |
| HEAD vs runtime | F1 (`61c4679`) | Fechamento (`10a25cc`) | Drift **só documental** até novo deploy |
| Smoke Cirurgia 11 | NO-GO | Fechamento V1 “operacional” | Gate **formal em aberto**; não bloqueia runtime |

---

## 4. Pendências extraídas dos relatórios

| ID | Pendência | Origem | Severidade |
|----|-----------|--------|------------|
| R-01 | Smoke manual autenticado Cirurgia 11 (login → `/auditoria` → Network → filtros → `/logs`) | `SMOKE-FINAL-CIRURGIA-11` | **MÉDIA** (aceite) |
| R-02 | Working tree: `vercel.json` + 25 `??` | H1, F1, F3, fechamento | **MÉDIA** (governança) |
| R-03 | Versionar ou arquivar relatórios/scripts/SQL Plano B (maio/2026) | H1, gate saque manual | **MÉDIA** |
| R-04 | Webhook payout sem assinatura | F2, fechamento §12 | **MÉDIA** (segurança) |
| R-05 | Depósitos fora de `ledger_financeiro` | F2, fechamento | **MÉDIA** (contabilidade) |
| R-06 | RPC `claim_and_credit_approved_pix_deposit` não versionada no repo | F2 | **MÉDIA** |
| R-07 | Scripts/docs com `fly deploy` sem `--build-arg GIT_COMMIT` | H2 pré-execução | **LEVE** (drift humano) |
| R-08 | `goldeouro-admin` dual-repo sem submódulo | F3, H1 | **LEVE** |
| R-09 | Warning Fly bind address | F1, H2 | **LEVE** |
| R-10 | E2E player/admin completo não repetido na F3 | F3 | **MÉDIA** (aceite) |
| R-11 | Páginas admin sem backend (honestas) | T14A, F3 | **LEVE** (backlog produto) |
| R-12 | Incidente ledger manual — Plano B | maio/2026, SQL `??` | **MÉDIA** (histórico; tratado operacionalmente) |
| R-13 | Ressalva `is_nullable` fechamento ciclo saque manual | `DECISAO-CONTROLADA` | **LEVE** |
| R-14 | Dependabot / vulnerabilidades npm (informativo) | H2 exec, fechamento | **LEVE** |
| R-15 | HEAD repo ≠ imagem Fly até próximo deploy | F1, fechamento | **LEVE** (observabilidade) |

---

## 5. Pendências encontradas no código

### Backend (`server-fly.js`)

| Achado | Evidência | Severidade |
|--------|-----------|------------|
| `router.js` legado no repo, **não montado** | F1 | LEVE (código morto) |
| `POST /api/admin/bootstrap` — promove primeiro admin | L4360+ | **MÉDIA** (superfície sensível; mitigado se já existe admin) |
| Webhook depósito: assinatura **obrigatória** (`401`) | L3421+ | ✅ Resolvido |
| Webhook payout: **sem** `WebhookSignatureValidator` | L3542+ | **MÉDIA** |
| `TODO: Re-habilitar` monitoramento avançado | L101 | LEVE (pós-V1) |
| `lotesAtivos` em memória (multi-instância) | relatório Fase 2 shoot | LEVE (pós-V1) |

### Admin (`goldeouro-admin/src`)

| Achado | Estado atual |
|--------|--------------|
| Rotas **`/api/admin/*`** nas páginas críticas | ✅ (`SaqueUsuarios`, `Auditoria`, `Users`, etc.) |
| Mock fixo em `SaqueUsuarios` (ids 1–3) | ❌ **Não encontrado** — usa `withdraw/list` |
| Páginas **sem** endpoint (estado honesto) | `Backup.jsx`, `Configuracoes.jsx`, `RelatorioSemanal.jsx`, `TopJogadores.jsx`, `ExportarDados.jsx` |
| Fallback UI Sidebar | `SidebarResponsive` — fallback de **layout**, não dados financeiros |

### Player (`goldeouro-player/src`)

| Achado | Evidência |
|--------|-----------|
| `USE_MOCKS` guard em produção (`environments.js`) | Throw se mocks em prod |
| Log "MOCK" em `paymentService.js` | Ramo dev; verificar não ativo em build prod |
| Rotas `/login`, `/deposit` — shell 200 sem `Route` | F3 |

### Scripts perigosos (não executados nesta auditoria)

| Ficheiro | Risco |
|----------|-------|
| `scripts/exec-plano-b-reversao-20260504.js` | Mutação BD se executado sem controlo |
| `database/exec-plano-b-reversao-transacao-20260504.sql` | SQL operacional **não versionado** |

---

## 6. Pendências em configs/deploy

| Item | Estado | Pendência |
|------|--------|-----------|
| `fly.toml` | App `goldeouro-backend-v2`, processos `app` + `payout_worker` | OK |
| `deploy-on-demand.yml` | `--build-arg GIT_COMMIT="${{ github.sha }}"` | ✅ H2 |
| `backend-deploy.yml` | Push `main`/`dev`; paths filtrados | Branch ativa é `fix/admin-financial-integrity-v1` — deploy automático **pode não** disparar nesta branch |
| `goldeouro-player/vercel.json` | Modified CRLF only | Higiene Git |
| `.cursor/commands/deploy-producao.md` | Referência `fly deploy` sem SHA (H2) | Drift operador |
| Múltiplos guias/scripts legados | `fly deploy` sem `GIT_COMMIT` | H2 backlog higiene |
| `config-temp.js` | No `.gitignore` | Tokens exemplo — **não** commitar |

---

## 7. Pendências financeiras

| ID | Área | Descrição | Severidade | Bloqueia ops? |
|----|------|-----------|------------|---------------|
| FIN-01 | Ledger | Depósitos PIX não gravam em `ledger_financeiro` | MÉDIA | Não |
| FIN-02 | Webhook | Payout `POST /webhooks/mercadopago` sem validação assinatura | MÉDIA | Não |
| FIN-03 | RPC | `claim_and_credit_approved_pix_deposit` ausente em `database/migrations/` | MÉDIA | Não (fallback 1-row no código) |
| FIN-04 | Reconcile | Ativo por defeito — dependência operacional MP | LEVE | Não |
| FIN-05 | Saque manual | Ordem ledger→status documentada; Plano B para histórico | MÉDIA | Não (incidente pontual) |
| FIN-06 | Idempotência | `correlation_id` + UNIQUE ledger | ✅ Mitigado | — |
| FIN-07 | Worker | `payout_worker` Fly separado | ✅ Operacional | — |

**Classificação financeira V1:** operacional com ressalvas de hardening (F2 alinhado).

---

## 8. Pendências de banco/SQL

| Artefacto | Versionado? | Classificação |
|-----------|-------------|---------------|
| `database/migrations/20260512_create_admin_logs.sql` | ✅ | Migration Cirurgia 10 |
| `database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql` | ✅ | Saque manual |
| `database/migrations/20260428_add_cpf_cnpj_usuarios.sql` | ✅ | CPF/CNPJ |
| `database/exec-plano-b-reversao-transacao-20260504.sql` | ❌ `??` | **SQL operacional** — versionar ou arquivar em pasta `database/ops/` |
| `claim_and_credit_approved_pix_deposit` | ❌ não encontrado em repo | **Lacuna rastreabilidade** — confirmar no Supabase |
| Schemas soltos (`schema-*.sql`, `SCHEMA-*.sql` na raiz) | Histórico / referência | Não executar em prod sem revisão |

---

## 9. Pendências de segurança

| ID | Item | Severidade | Nota |
|----|------|------------|------|
| SEC-01 | Webhook payout sem assinatura | MÉDIA | Idempotência parcial mitiga |
| SEC-02 | `POST /api/admin/bootstrap` | MÉDIA | One-shot; 403 se admin existe |
| SEC-03 | JWT admin + `requireAdministradorDb` | ✅ | Padrão nas rotas `/api/admin/*` |
| SEC-04 | `/api/debug/token` | ✅ 404 em prod (F1) | |
| SEC-05 | Credenciais em scripts antigos / backup | LEVE | Revisar antes de commit amplo |
| SEC-06 | CORS / CSP player | LEVE | CSP removido no MVP (fechamento) |
| SEC-07 | Rate limits | Documentados em cirurgias 2026-04 | Validar em H3 |

---

## 10. Pendências de UX/funcionalidade

| ID | Item | Impacto |
|----|------|---------|
| UX-01 | `/login`, `/deposit` no player — 200 sem rota React | Confusão de links/bookmarks |
| UX-02 | Admin: páginas menu sem dados reais (mensagem honesta) | Expectativa de produto |
| UX-03 | Auditoria: `limit=50` sem paginação UI | Escalabilidade |
| UX-04 | Smoke autenticado não executado | Aceite formal |
| UX-05 | GET em rotas POST-only → 404 genérico | DX API (F1 L2) |

---

## 11. Arquivos locais não versionados

### Modificado (tracked)

- `goldeouro-player/vercel.json` — diff vazio; CRLF/LF

### Não rastreados (`??`) — inventário completo

**Database (1):**

- `database/exec-plano-b-reversao-transacao-20260504.sql`

**Docs (18):**

- `CIRURGIA-2-ALINHAMENTO-DEPLOY-PAINEL-ADMIN-VERCEL-2026-05-04.md`
- `DECISAO-CONTROLADA-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `DEPLOY-CONTROLADO-AUTH-REAL-PAINEL-ADMIN-2026-05-06.md`
- `DEPLOY-CONTROLADO-CIRURGIA-4-SAQUES-REAIS-PAINEL-ADMIN-2026-05-06.md`
- `DEPLOY-CONTROLADO-CIRURGIA-5-DASHBOARD-REAL-2026-05-06.md`
- `DEPLOY-CONTROLADO-CIRURGIA-8-ROTA-USUARIOS-2026-05-06.md`
- `DIAGNOSTICO-READONLY-404-PAINEL-ADMIN-VERCEL-2026-05-04.md`
- `DIAGNOSTICO-READONLY-DASHBOARD-REAL-PAINEL-ADMIN-2026-05-06.md`
- `DIAGNOSTICO-READONLY-LOGS-AUDITORIA-ADMIN-2026-05-12.md`
- `DIAGNOSTICO-READONLY-RELATORIO-FINANCEIRO-REAL-2026-05-06.md`
- `DIAGNOSTICO-READONLY-TELA-AUDITORIA-ADMIN-2026-05-12.md`
- `DIAGNOSTICO-READONLY-USUARIOS-REAIS-PAINEL-ADMIN-2026-05-06.md`
- `DIAGNOSTICO-REAL-DADOS-PAINEL-ADMIN-2026-05-06.md`
- `EXECUCAO-CONTROLADA-PLANO-B-REVERSAO-2026-05-04.md`
- `GATE-FINAL-READONLY-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `PRE-EXECUCAO-ALINHAMENTO-DEPLOY-PAINEL-ADMIN-2026-05-04.md`
- `PRE-EXECUCAO-PLANO-B-REVERSAO-LEDGER-INDEVIDO-2026-05-04.md`
- `RELATORIO-MIGRACAO-TABELA-ADMIN-LOGS-2026-05-12.md`
- `TRIAGEM-INCONSISTENCIA-HISTORICA-SAQUE-MANUAL-2026-05-04.md`
- `VALIDACAO-2-BANCO-REAL-SAQUES-MANUAIS-READONLY-2026-05-04.md`

**Scripts (5):**

- `scripts/exec-plano-b-reversao-20260504.js`
- `scripts/gate-final-readonly-reconciliacao-20260504.js`
- `scripts/readonly-validacao2-saques-20260504.js`
- `scripts/test-withdraw-admin.js`
- `scripts/triagem-readonly-inconsistencia-saque-20260504.js`

**Recomendação:** commit documental único (“ops maio/2026”) ou `.gitignore` se artefactos locais apenas.

---

## 12. Riscos aceitos oficialmente

Conforme fechamento V1 e F1–F3:

1. Depósitos sem linha em `ledger_financeiro`.
2. Webhook payout sem paridade de assinatura com depósito.
3. RPC Supabase dependente de migration fora do repo parent.
4. Working tree local suja (governança, não runtime).
5. Smoke E2E humano incompleto.
6. Dual-repo `goldeouro-admin`.
7. Rotas SPA 200 sem router (player).
8. HEAD documental à frente da imagem Fly.
9. Warning Fly bind address (health OK).
10. CSP player removido no MVP.
11. Incidente histórico saque manual — Plano B documentado.

---

## 13. Riscos novos identificados (esta varredura)

| ID | Risco | Nota |
|----|-------|------|
| N-01 | **Este relatório** também em `??` até commit | Mesma classe H1 |
| N-02 | Branch `fix/admin-financial-integrity-v1` vs workflows em `main` | Deploy CI pode não refletir branch atual sem merge |
| N-03 | Scripts Plano B no disco sem versionar | Risco de execução em ambiente errado |
| N-04 | `DIAGNOSTICO-FINALIZACAO` ainda cita `gitCommit: null` | Documentação **obsoleta** — pode induzir erro em auditoria futura |

*Não foi revalidado `/meta` em tempo real nesta sessão (timeout curl); F1/H2/fechamento mantêm evidência `7ecedca`.*

---

## 14. Matriz priorizada de pendências

| ID | Pendência | Origem | Evidência | Área | Severidade | Impacto | Recomendação | H3? | V2? | Backlog? | Bloqueia? | Prioridade |
|----|-----------|--------|-----------|------|------------|---------|--------------|-----|-----|----------|-----------|------------|
| P-01 | Smoke autenticado Cirurgia 11 | R-01 | `SMOKE-FINAL-CIRURGIA-11` | Aceite | MÉDIA | Gate formal | Checklist 30 min operador | ✅ | — | — | Não | **P1** |
| P-02 | Versionar 25 `??` + normalizar `vercel.json` | R-02 | `git status` | Governança | MÉDIA | Drift Git | Commit docs+scripts ou arquivar | ✅ | — | — | Não | **P1** |
| P-03 | Assinatura webhook payout | FIN-02 | `server-fly.js` L3542 | Segurança | MÉDIA | Fraude webhook | H3 hardening | ✅ | — | — | Não | **P2** |
| P-04 | Versionar RPC claim PIX | FIN-03 | F2 | Banco | MÉDIA | Drift schema | Export Supabase → migration | ✅ | — | — | Não | **P2** |
| P-05 | Ledger depósitos (opcional) | FIN-01 | F2 | Financeiro | MÉDIA | Auditoria contábil | Design H3 | ✅ | V2 | — | Não | **P3** |
| P-06 | Higiene `fly deploy` sem SHA | R-07 | H2 pré | Deploy | LEVE | Regressão meta | Atualizar runbooks | ✅ | — | ✅ | Não | **P3** |
| P-07 | Submódulo / doc dual-repo admin | R-08 | F3 | Governança | LEVE | Releases admin | Documentar processo | ✅ | — | ✅ | Não | **P4** |
| P-08 | Páginas admin sem API | R-11 | T14A | Produto | LEVE | UX | V2 ou backlog | — | ✅ | ✅ | Não | **P4** |
| P-09 | E2E player fluxos críticos | R-10 | F3 | UX | MÉDIA | Regressão | Playwright/manual | ✅ | — | — | Não | **P2** |
| P-10 | Deploy alinhado HEAD→Fly | R-15 | Fechamento | Deploy | LEVE | Traceability | Deploy on-demand pós-merge | ✅ | — | — | Não | **P3** |
| P-11 | Remover/arquivar `router.js` | Código | F1 | Backend | LEVE | Confusão | Delete ou README | — | — | ✅ | Não | **P5** |
| P-12 | Revisar bootstrap admin | SEC-02 | `server-fly.js` | Segurança | MÉDIA | Escalação privilégio | Desativar se admin existe | ✅ | — | — | Não | **P2** |
| P-13 | Rotas fantasma player | UX-01 | F3 | UX | LEVE | 404 lógico | Redirects | — | ✅ | ✅ | Não | **P4** |
| P-14 | Atualizar diag. obsoleto `gitCommit null` | N-04 | `DIAGNOSTICO-FINALIZACAO` | Docs | LEVE | Confusão | Nota de supersessão H2 | ✅ | — | — | Não | **P5** |

---

## 15. Itens recomendados para H3

1. **P-01** — Smoke autenticado admin (e checklist player mínimo).
2. **P-02** — Higiene Git: versionar artefactos maio/2026 ou arquivar.
3. **P-03** — Assinatura webhook payout.
4. **P-04** — RPC `claim_and_credit_*` versionada.
5. **P-06** — Runbooks/scripts com `GIT_COMMIT` canónico.
6. **P-09** — E2E regressão fluxos PIX/saque/jogo.
7. **P-10** — Deploy Fly com HEAD atual após merge na linha principal.
8. **P-12** — Política bootstrap admin (desligar em prod se já configurado).

---

## 16. Itens recomendados para V2

1. Motor de jogo desacoplado; API versionada (fechamento V1 §14).
2. **P-08** — Endpoints admin faltantes (top jogadores, semanal, backup, config).
3. **P-13** — Router player unificado; redirects `/login` → `/`.
4. Ledger unificado e observabilidade central (Sentry, métricas).
5. Monorepo ou CI unificado admin+backend.

---

## 17. Itens recomendados para backlog

1. **P-11** — Limpeza `router.js` e servidores legados (`server-fly-deploy.js`, etc.).
2. Paginação UI auditoria admin.
3. Diferenciar 405 vs 404 em rotas POST-only.
4. Reativar monitoramento avançado (`TODO` server-fly).
5. Dependabot/npm audit (informativo).
6. `lotesAtivos` transacional multi-instância.
7. Preview Vercel em PR (diagnóstico PR56).

---

## 18. Itens que exigem saneamento antes de avançar

**Nenhum bloqueante absoluto** para iniciar H3 ou planejar V2 em paralelo com produção.

**Saneamento recomendado (não obrigatório para “operação”, sim para “fecho zero-risco”):**

| Ordem | Item | Motivo |
|-------|------|--------|
| 1 | P-01 Smoke Cirurgia 11 | Único gate formal **NO-GO** explícito em relatório recente |
| 2 | P-02 Versionar `??` | Fonte da verdade única para incidentes maio/2026 |
| 3 | Confirmar migration `admin_logs` aplicada em Supabase prod | Cirurgia 10 NO-GO sem migration |

*Não é necessário “parar produção” para H3 se estes itens forem tratados como sprint de higiene.*

---

## 19. Diagnóstico final

| Dimensão | Avaliação |
|----------|-----------|
| Produção real | ✅ Backend v452, health/meta documentados, MP+DB connected |
| Financeiro | ✅ Operacional; ressalvas hardening documentadas |
| Painel admin | ✅ Contrato `/api/admin/*`; mock crítico saques **removido** no código atual |
| Governança Git | ⚠️ Working tree suja; 25 ficheiros `??` |
| Aceite formal | ⚠️ Smoke autenticado pendente |
| Rastreabilidade runtime | ✅ `7ecedca` em `/meta` (pós-H2); HEAD `10a25cc` só docs |
| Bloqueio H3/V2 | ❌ Nenhum identificado |

**Síntese:** a V1 está **fechada oficialmente** como operacional com ressalvas. Esta auditoria forense **confirma** o mapa de pendências e **não eleva** nenhum item a bloqueante operacional, desde que smoke e higiene Git sejam tratados como **primeiro sprint H3**, não como pré-requisito de uptime.

---

## 20. Recomendação oficial

1. **Aceitar** a baseline **V1 OPERACIONAL APROVADA COM RESSALVAS** do relatório de fechamento (`10a25cc`).
2. **Iniciar H3** com escopo fechado: P-01 + P-02 + P-03 + P-04 (2–3 semanas operacionais estimadas, conforme capacidade).
3. **Versionar** este relatório e os `??` de maio/2026 num único commit documental na branch atual ou após merge para `main`.
4. **Não** misturar features V2 com higiene H3 no mesmo deploy Fly.
5. **Executar** smoke manual Cirurgia 11 antes de declarar “aceite zero-risco” a stakeholders.

---

## CLASSIFICAÇÃO FINAL

# **V1 APROVADA COM BACKLOG CONTROLADO**

**Justificativa (uma linha):** produção real estável e auditada (F1–F3 + fechamento); pendências são **ressalvas geríveis** (governança Git, smoke formal, hardening financeiro, documentação não versionada) — **nenhuma** classificada como bloqueante para operação ou para **iniciar H3** com disciplina.

**Não aplicável:**

- ~~V1 LIMPA PARA H3/V2~~ — smoke e working tree impedem “limpa”.
- ~~V1 PRECISA DE SANEAMENTO ANTES DE H3/V2~~ — saneamento é **recomendado**, não pré-condição de uptime.
- ~~V1 BLOQUEADA~~ — sem evidência de falha crítica aberta em runtime.

---

*Auditoria forense encerrada em modo read-only. Nenhum código, deploy, banco ou workflow foi alterado. Próximo artefacto sugerido: commit deste ficheiro + batch dos `??` de maio/2026 (decisão humana).*
