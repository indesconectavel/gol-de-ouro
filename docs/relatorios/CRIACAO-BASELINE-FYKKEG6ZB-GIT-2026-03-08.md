# Criação da branch oficial baseline/fykkeg6zb — Git

**Projeto:** Gol de Ouro  
**Data:** 2026-03-08  
**Modo:** Operações seguras de Git apenas (nenhum deploy, alteração de produção, Vercel, Fly, banco ou env)

---

## 1. Contexto da baseline FyKKeg6zb

- **Deploy validado em produção:** FyKKeg6zb (id longo dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX).
- **Bundle associado:** index-qIGutT6K.js, index-lDOJDUAS.css.
- **Origem do deploy:** vercel deploy; não vinculado a um branch/commit visível na interface da Vercel.
- **Problema:** O Git atual (main e feature branches) está à frente dessa baseline; os previews nascem de main e das feature branches, não do código que gerou o FyKKeg6zb.
- **Objetivo:** Criar referência oficial da baseline no Git para reancorar o desenvolvimento e validar os BLOCOs (C, D, A) a partir da mesma base.

---

## 2. Commit utilizado como referência

| Item | Valor |
|------|--------|
| **Commit** | **0a2a5a1** (0a2a5a1effb18f78e6df7d7081cd9c04e657e800) |
| **Mensagem** | Merge pull request #18 from indesconectavel/security/fix-ssrf-vulnerabilities |
| **Data** | 2025-11-15 12:43:50 -0300 |
| **Tipo** | Merge commit (2291b83 + 7dbb4ec) |
| **Existência no repositório** | Confirmada (`git rev-parse 0a2a5a1` retorna o hash). |

Este é o commit inferido mais próximo da baseline FyKKeg6zb (documentado em BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md e RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08.md).

---

## 3. Tag criada

| Item | Valor |
|------|--------|
| **Nome da tag** | **fykkeg6zb-baseline** |
| **Objeto** | 0a2a5a1 |
| **Comando utilizado** | `git tag fykkeg6zb-baseline 0a2a5a1` |
| **Verificação** | `git rev-parse fykkeg6zb-baseline` → 0a2a5a1effb18f78e6df7d7081cd9c04e657e800 |

A tag serve como marcador permanente e imutável da baseline no repositório local.

---

## 4. Branch criada

| Item | Valor |
|------|--------|
| **Nome da branch** | **baseline/fykkeg6zb** |
| **Commit de origem** | 0a2a5a1 |
| **Comando utilizado** | `git branch baseline/fykkeg6zb 0a2a5a1` |
| **Verificação** | `git log -1 baseline/fykkeg6zb` → 0a2a5a1 Merge pull request #18 from indesconectavel/security/fix-ssrf-vulnerabilities |

A branch **não** contém commits adicionais; aponta exatamente para o commit de referência.

---

## 5. Estrutura do frontend na baseline

No commit 0a2a5a1, a pasta **goldeouro-player/** contém:

- **package.json** — name: goldeouro-player, version: 1.2.0, scripts: dev (vite), build (vite build), etc.
- **vercel.json** — buildCommand: npm run build, outputDirectory: dist, framework: vite (alterado neste merge).
- **Arquivos de configuração:** .env.example, .env.prod, .env.production, vite.config.ts (via scripts), capacitor.config.ts.
- **src/** — estrutura completa do frontend, incluindo:
  - **config:** api.js, environments.js
  - **pages:** Login.jsx, Dashboard, GameShoot, Withdraw, Pagamentos, Profile, Register, ForgotPassword, ResetPassword, etc.
  - **components:** VersionBanner.jsx, VersionWarning.jsx, Navigation, etc.
  - **contexts:** AuthContext.jsx
  - **services:** gameService.js, paymentService, apiClient, etc.

Confirmação: o commit 0a2a5a1 contém **goldeouro-player/** com package.json, Vite, src/, páginas de login, config/api.js e environments.js, correspondendo à estrutura do frontend validado.

---

## 6. Diferença entre baseline e main

**Comando:** `git diff baseline/fykkeg6zb..main --stat`

**Resumo:** 91 arquivos alterados, 10.224 inserções(+), 624 deleções(-).

**Principais áreas:**

- **Backend:** server-fly.js (+654 linhas de alteração), controllers/authController.js, routes/mpWebhook.js, services/pix-mercado-pago.js, pix-service.js, config/required-env.js, fly.toml; novos: database/schema-ledger-financeiro.sql, src/domain/payout/processPendingWithdrawals.js, src/workers/payout-worker.js.
- **Frontend (goldeouro-player):** package.json, package-lock.json (524 alterações), src/config/api.js, src/pages/GameShoot.jsx, src/pages/Pagamentos.jsx, src/pages/Withdraw.jsx, src/services/gameService.js, src/services/withdrawService.js (novo).
- **CI/docs:** .github/workflows/frontend-deploy.yml, muitos arquivos em docs/relatorios e scripts de auditoria.

**Componentes de login / API / ambiente:** api.js e páginas (Login indiretamente via outras mudanças) têm alterações em main em relação à baseline; withdrawService.js é novo em main; AuthContext e Navigation não aparecem no diff baseline..main (podem estar iguais ou em branches de feature).

---

## 7. Diferença entre baseline e branches dos BLOCOs

### baseline/fykkeg6zb vs feature/bloco-c-auth

**Comando:** `git diff baseline/fykkeg6zb..feature/bloco-c-auth --stat`  
**Resumo:** 95 arquivos alterados, 10.403 inserções(+), 676 deleções(-).

Inclui, além do que já existe em main, alterações em: goldeouro-player/src/components/Navigation.jsx, goldeouro-player/src/config/api.js, goldeouro-player/src/contexts/AuthContext.jsx, goldeouro-player/src/pages/Dashboard.jsx, GameShoot.jsx, Pagamentos.jsx, Profile.jsx, Withdraw.jsx, withdrawService.js; controllers/authController.js (mais alterações que em main).

### baseline/fykkeg6zb vs feature/bloco-d-balance-profile-payments

**Comando:** `git diff baseline/fykkeg6zb..feature/bloco-d-balance-profile-payments --stat`  
**Resumo:** 95 arquivos alterados, 10.354 inserções(+), 677 deleções(-).

Inclui alterações em AuthContext.jsx, Dashboard.jsx, GameShoot.jsx, Pagamentos.jsx, Profile.jsx, Withdraw.jsx, withdrawService.js, api.js; documento BLOCO-D-SALDO-PERFIL-PAGAMENTOS-VALIDACAO-2026.md.

### baseline/fykkeg6zb vs feature/bloco-a-financial

**Comando:** `git diff baseline/fykkeg6zb..feature/bloco-a-financial --stat`  
**Resumo:** 92 arquivos alterados, 10.314 inserções(+), 627 deleções(-).

Inclui alterações em GameShoot.jsx, Pagamentos.jsx, Withdraw.jsx, gameService.js, withdrawService.js, api.js; server-fly.js (666 linhas de alteração); documento BLOCO-A-FINANCEIRO-VALIDACAO-2026.md.

**Conclusão:** As três feature branches estão à frente da baseline com muitas alterações em backend, frontend (api.js, AuthContext, páginas, withdrawService) e documentação; a branch **baseline/fykkeg6zb** fornece a base comum para comparação e validação dos BLOCOs.

---

## 8. Confirmação de que nenhuma alteração foi feita em produção

- **Deploy:** Nenhum deploy foi executado.
- **Vercel:** Nenhuma alteração em projetos, deployments ou configurações.
- **Fly:** Nenhuma alteração em aplicações ou config.
- **Banco:** Nenhuma alteração em schema ou dados.
- **Variáveis de ambiente:** Nenhuma alteração em .env, Vercel env ou Fly env.
- **Código funcional:** Nenhum arquivo de aplicação (backend ou frontend) foi modificado; apenas operações de Git locais (tag e branch).

Todas as operações foram **locais**: criação da tag **fykkeg6zb-baseline**, criação da branch **baseline/fykkeg6zb** e consultas (show, diff, log, ls-tree). O deploy FyKKeg6zb e a produção permanecem intocados.

---

## Arquivos de referência

- docs/relatorios/BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md  
- docs/relatorios/RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08.md  
- docs/relatorios/REANCORAGEM-BASELINE-FYKKEG6ZB-2026-03-08.md  

---

*Operação concluída em modo seguro; apenas Git local utilizado.*
