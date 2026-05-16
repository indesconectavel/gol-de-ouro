# DEPLOY CONTROLADO - CIRURGIA 6 RELATORIO FINANCEIRO REAL (2026-05-06)

## Objetivo
Publicar backend (Fly) e painel admin (Vercel) com a Cirurgia 6 ja commitada, validar producao e registrar evidencias.

## Pre-deploy - Git
- Comando solicitado: `git status --short` e diff focado nos arquivos da cirurgia.
- Estado: **sem diff** em `server-fly.js`, `goldeouro-admin/src/pages/RelatorioFinanceiro.jsx` e `docs/relatorios/CIRURGIA-6-RELATORIO-FINANCEIRO-REAL-2026-05-06.md` (alteracoes ja integradas no commit).
- **Commit raiz (backend + ponteiro submodule + relatorio cirurgia 6):** `e0374c3` — mensagem: `fix(admin): conectar relatorio financeiro a dados reais`
- **Commit submodulo `goldeouro-admin`:** `e3ff9b0` — mesma mensagem.
- **Push:** branch `fix/admin-financial-integrity-v1` enviada para `origin` (PR sugerido pelo GitHub). Submodulo `goldeouro-admin`: push para `painel-protegido-v1.1.0`.

## Deploy Backend Fly.io
- **App:** `goldeouro-backend-v2` (`fly.toml`)
- **Comando:** `flyctl deploy --app goldeouro-backend-v2 --yes`
- **Imagem publicada:** `registry.fly.io/goldeouro-backend-v2:deployment-01KQZ3FSSJP601G0K7ZM79DA9W`
- **Release visivel nos releases Fly:** **v444** (status complete, mesmo dia da execucao)

### Validacao backend (producao)
| Checagem | Resultado |
|---------|-----------|
| `GET https://goldeouro-backend-v2.fly.dev/health` | **200**, JSON `status: ok`, `database: connected` |
| `GET https://goldeouro-backend-v2.fly.dev/meta` | **200**, payload com `version: 1.2.1`, `environment: production` |
| `GET .../api/admin/financial/report` sem `Authorization` | **401** (endpoint protegido) |
| `GET .../api/admin/financial/report` com JWT apos `POST /api/auth/login` (credencial admin de teste do projeto) | **SIM** — `success: true` e campos esperados na `data` |

## Deploy Painel Admin Vercel
- **Comandos:** `npm run build` (ok) ; `npx vercel --prod --yes`
- **URL de producao entregue pela CLI:** `https://goldeouro-admin-d1i1r9j5y-goldeouro-admins-projects.vercel.app`
- **Dominio oficial verificado:** `https://admin.goldeouro.lol/` carrega bundle `assets/index-556c96d1.js` (hash distinto de builds antigos observados antes do deploy).

## Validacao producao - modulo financeiro
- **Bundle em admin.goldeouro.lol:** contem string `/api/admin/financial/report` (**SIM**). Nao contem chamada ao legado `POST /admin/relatorio-financeiro` (**SIM**). Nao contem numeros ficticios do fallback antigo (ex.: **125430**) (**SIM**, ausentes).
- **Nota tecnica:** ainda existe outra string `"dados ficticios"` na aplicacao relacionada a **backup**, fora do escopo da Cirurgia 6 — nao e o fallback do RelatorioFinanceiro.jsx.
- **Login + UI `/relatorio-financeiro` (navegador automatizado MCP):** snapshot da ferramenta retornou arvore vazia (sem refs); **validacao E2E visual nao concluida por automacao**.
- Evidencias substitutivas: API real validada em producao + bundle atualizado para o novo endpoint.

## Saida solicitada - resumo executivo

| Item | Valor |
|------|-------|
| Hash do commit (raiz) | `e0374c3` |
| Release Fly mais recente (deploy desta corrida) | **v444** |
| Endpoint `financial/report` validado (JWT admin) | **SIM** |
| Deploy Vercel (URL CLI) | `https://goldeouro-admin-d1i1r9j5y-goldeouro-admins-projects.vercel.app` |
| Dominio producao padrao | `https://admin.goldeouro.lol` |
| `/relatorio-financeiro` validado (UI E2E) | **PARCIAL** (automacao MCP sem contenido capturado; evidencia por bundle + API) |
| Dados mock do relatorio financeiro removidos (codigo/fonte producao observada) | **SIM** (endpoint novo no bundle; sem fallback numerico da cirurgia; sem rota POST legada) |
| Proximo modulo | **GO** (deploy e API ok; opcional revisao manual da tela apos login) |

## Restricoes respeitadas
- Sem alteracao de codigo apenas para este deploy — **NAO houve refactor pre-deploy**.
- **NAO** executado migrations ou scripts de banco.
- **NAO** alterado player.
- Credenciais de login **nao** reproduzidas neste relatório; validacao JWT confirmada apenas como passo tecnico bem-sucedido.
