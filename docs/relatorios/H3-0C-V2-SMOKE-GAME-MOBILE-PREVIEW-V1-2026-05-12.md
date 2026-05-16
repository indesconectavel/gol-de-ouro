# H3.0C-V2 — SMOKE /GAME EM PREVIEW (PÓS-DESBLOQUEIO) — V1

**Data:** 2026-05-15  
**Base:** `docs/relatorios/H3-0C-DEPLOY-PREVIEW-SMOKE-GAME-MOBILE-V1-2026-05-12.md`  
**Commit H3.0B (alvo):** `dac9f8b` — `fix: polir game mobile H3.0B`  
**Modo:** **sem** alteração de código, **sem** `goldeouro-player/vercel.json`, **sem** deploy produção (`--prod`), **sem** backend/financeiro/admin/banco  

---

## 1. Resumo executivo

O estado Git confirma **HEAD em `dac9f8b`**. Foi executado **`npm run build`** em `goldeouro-player` (**sucesso**) e gerado **novo deployment preview** no projeto Vercel **`dist`** usando apenas `scripts/h3c-vercel-static-spa.json` (mesmo método da H3.0C-V1).

**O desbloqueio da Deployment Protection não se verifica** a partir deste ambiente:

- **`Invoke-WebRequest`** continua a receber **HTTP 401** nos URLs antigos e no URL novo.
- O **browser MCP** continua a ser redirecionado para **`https://vercel.com/login`** (fluxo SSO), **sem** renderizar HTML do player.

Por isso **não foi possível** cumprir o smoke visual autenticado em **`/game`** (desktop, portrait, landscape, refresh, HUD, zonas, overlay, chute).

**Classificação final:** **BLOQUEADO** para o objetivo específico desta corrida (**smoke em preview público/desprotegido**). Para **PRONTO PARA DEPLOY PRODUÇÃO**, os critérios definidos pelo utilizador continuam **não demonstrados** aqui por falta de acesso ao deployment.

---

## 2. Estado Git

**Comando:** `git status --short` + `git rev-parse HEAD` + `git log -1 --oneline`

| Item | Valor |
|------|--------|
| **HEAD** | `dac9f8ba012c13607116af7bf15d58a95d242c35` (**`dac9f8b`**) ✅ |
| **Último commit** | `dac9f8b fix: polir game mobile H3.0B` |
| **`goldeouro-player/vercel.json`** | Alterado localmente (**` M `**) — **não** foi editado nem usado nesta etapa |

**Commits nesta corrida:** nenhum (conforme regra).

---

## 3. Preview — acessibilidade sem 401

### 3.1 URLs herdados da H3.0C-V1

| URL | HTTP |
|-----|------|
| `https://dist-b0tqoi7r5-goldeouro-admins-projects.vercel.app/` | **401** |
| `https://dist-mt4t3f4tq-goldeouro-admins-projects.vercel.app/` | **401** |

### 3.2 URL novo (deployment desta corrida — ver secção 4)

| URL | HTTP |
|-----|------|
| `https://dist-2g5mfkwuy-goldeouro-admins-projects.vercel.app/` | **401** |

**Conclusão:** preview **ainda não acessível** sem autenticação Vercel a partir da rede/credenciais deste cliente.

---

## 4. Deploy preview Vercel (V2 — sem `--prod`)

| Campo | Valor |
|-------|--------|
| **Momento** | 2026-05-15 ~17:31–17:33 -03:00 |
| **Origem** | `goldeouro-player/dist` (após build local) |
| **Config SPA** | `scripts/h3c-vercel-static-spa.json` (não alterado) |
| **Projeto** | `goldeouro-admins-projects` / projeto **`dist`** |
| **Preview URL** | `https://dist-2g5mfkwuy-goldeouro-admins-projects.vercel.app` |
| **Inspect** | `https://vercel.com/goldeouro-admins-projects/dist/DaWfPwgmZGFVhwPtLX6PfGUNdNTa` |
| **`--prod`** | **Não** utilizado |

**Nota:** A CLI volta a mencionar prod alias `dist-rho-peach-85.vercel.app` para comandos `--prod`; **não aplicado**.

---

## 5. Build (pré-deploy)

**Comando:** `cd goldeouro-player && npm run build`  
**Resultado:** **SUCESSO** (~19s esta execução; bundle JS `dist/assets/index-Cr3Ja7Xl.js`).  

---

## 6. Validação — app, login, tela branca, console

| Critério | Resultado |
|----------|-----------|
| App carrega (SPA `index.html`) | **Não verificado** — resposta efetiva = gate Vercel (401/login) |
| Login **Gol de Ouro** | **Não alcançado** |
| Tela branca do player | **N/A** |
| Erro **`USE_MOCKS` em runtime** no bundle produção sob hostname Vercel | **N/A** nesta sessão |
| Console do player | **N/A** |

**Evidência browser:** apenas UI **«Log in to Vercel»** (snapshot MCP).

---

## 7. Smoke desktop — `/game` autenticado

**Não executado** — bloqueado antes da app.

| Item | Resultado |
|------|-----------|
| `/game` abre | N/A |
| HUD | N/A |
| Bola/zonas alinhadas | N/A |
| Botões visíveis | N/A |

---

## 8. Smoke mobile portrait

| Item | Resultado |
|------|-----------|
| Overlay «Gire o celular» | N/A |
| Palco não minúsculo / scroll | N/A |

---

## 9. Smoke mobile landscape + refresh + HUD consolidado

| Item | Resultado |
|------|-----------|
| Landscape — jogo, HUD compacto, botões, safe-area, alinhamento | N/A |
| **Refresh** em `/game` | N/A |
| **HUD / botões / alinhamento** (critérios cruzados) | N/A |

---

## 10. Chute visual

| Item | Resultado |
|------|-----------|
| 1 chute (fluxo visual apenas) | **Não executado** |

---

## 11. Evidências registadas

| # | Evidência |
|---|-----------|
| E1 | `Invoke-WebRequest` → **401** em `dist-2g5mfkwuy-*.vercel.app` |
| E2 | `Invoke-WebRequest` → **401** nos dois URLs legacy H3.0C |
| E3 | **Browser MCP:** URL final `vercel.com/login?next=…sso-api…preview…` |
| E4 | **CLI Vercel:** linha «Preview: https://dist-2g5mfkwuy-…» + Inspect URL |
| E5 | **`npm run build`:** exit code **0** |

**Screenshots formais:** não guardadas como ficheiros no repo nesta automatização (apenas descrições do fluxo MCP). Recomenda-se captura manual após desativar proteção.

---

## 12. Console e erros relevantes

| Origem | Achado |
|--------|--------|
| HTTP | **401 Unauthorized** nos previews |
| Browser | Fluxo SSO Vercel; **sem** execução de JS da app Gol de Ouro |
| Gol de Ouro `/game` | Sem dados |

---

## 13. Classificação final

## **BLOQUEADO**

**Justificativa (face ao objetivo H3.0C-V2):**

- O **deployment preview** existe, mas mantém **Deployment Protection / SSO**.
- Sem contornar isso neste cliente (credenciais de org, política «Standard Protection» → off para previews de equipa, bypass token, ou outro método aprovado), **o smoke `/game` não corre**.

**Interpretação relativamente aos três níveis solicitados:**

| Nível | Aplicável aqui |
|-------|----------------|
| **PRONTO PARA DEPLOY PRODUÇÃO** | **Não** — critérios de smoke em preview/autenticação não demonstrados |
| **PRONTO COM RESSALVAS** | Possível apenas para **«build/repo OK»**, mas não substitui o gate H3.0C-V2 |
| **BLOQUEADO** | **Sim** para **conclusão do smoke em preview nesta corrida** |

---

## 14. Próxima etapa recomendada

1. **Vercel Dashboard** (org `goldeouro-admins-projects`): no projeto **`dist`** (ou no projeto oficial após correção Root Directory): **Deployment Protection** → permitir previews **Without Protection** temporariamente, ou adicionar **Protection Bypass for Automation**, ou usar **sessão SSO** válida no browser onde o QA corre o smoke.

2. **Opcional saneamento:** rever nome do projeto **`dist`** e política SSO para não bloquear validações externas repetidas.

3. **Repescar H3.0C-V2** logo que exista HTTP **200** no preview: repetir checklist (login player → `/game` → portrait/landscape → refresh → 1 chute visual).

4. **Não** promover **`--prod`** nem domínio principal até o smoke ser fecho.

---

**Registado por:** automação Git + build + CLI Vercel + HTTP + MCP browser  
**Produção principal:** não alterada nesta corrida  
