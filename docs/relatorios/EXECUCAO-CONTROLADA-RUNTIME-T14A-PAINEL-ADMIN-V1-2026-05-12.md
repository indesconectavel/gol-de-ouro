# EXECUÇÃO CONTROLADA DE RUNTIME — T14A

**Data do registro:** 2026-05-13  
**Branch backend (monorepo):** `fix/admin-financial-integrity-v1`  
**Repositório admin (submódulo):** `goldeouro-admin` — branch `painel-protegido-v1.1.0`  
**Baseline de segurança:** `pre-t14a-painel-admin-v1-2026-05-12`  
**Relatório de cirurgia:** `docs/relatorios/CIRURGIA-T14A-CORRECAO-ESTRUTURAL-PAINEL-ADMIN-V1-2026-05-12.md`

---

## 1. Resumo executivo

A T14A foi **commitada** em dois repositórios (admin + backend), **etiquetada** (`t14a-runtime-alignment-admin-v1-2026-05-12`), enviada ao **GitHub** e **implantada** em **Fly.io** (backend) e **Vercel** (painel admin). Verificação anónima ao runtime confirmou **`/health`** e **`/meta`** em 200 e os novos caminhos **`/api/admin/users/:id`** e **`/api/admin/chutes/recentes`** a responder **401** sem token (rota viva). O ficheiro **`goldeouro-player/vercel.json`** permaneceu **fora** do índice em todo o fluxo.

---

## 2. Estado Git inicial (antes do commit T14A)

| Área | Estado |
|------|--------|
| Parent | `M server-fly.js`, ` m goldeouro-admin`, ` M goldeouro-player/vercel.json`, vários `??` |
| Submódulo `goldeouro-admin` | 18 ficheiros em `src/` modificados |

**Confirmação:** `goldeouro-player/vercel.json` **não** foi incluído em qualquer `git add` da T14A.

---

## 3. Arquivos commitados

### Repositório `goldeouro-admin` (commit `bb41c40`)

- `src/AppRoutes.jsx`, `src/components/Sidebar.jsx`  
- `src/pages/*.jsx` (18 páginas listadas na cirurgia T14A)

### Repositório `gol-de-ouro` (parent, commit `ca4c6a0`)

- `server-fly.js`  
- `docs/relatorios/CIRURGIA-T14A-CORRECAO-ESTRUTURAL-PAINEL-ADMIN-V1-2026-05-12.md`  
- Referência do submódulo `goldeouro-admin` → `bb41c40`

---

## 4. Arquivos excluídos do commit

- `goldeouro-player/vercel.json`  
- Todos os `??` (scripts, outros relatórios, SQL, etc.)

---

## 5. Commit da cirurgia

| Repositório | SHA | Mensagem |
|-------------|-----|----------|
| `goldeouro-admin` | `bb41c40` | `fix: alinhar painel admin V1 ao runtime real T14A` |
| `gol-de-ouro` (parent) | `ca4c6a0` | `fix: alinhar painel admin V1 ao runtime real T14A` |

**Push remoto:** `origin/painel-protegido-v1.1.0` (admin) e `origin/fix/admin-financial-integrity-v1` (parent).

---

## 6. Tag da cirurgia

| Nome | Aponta para |
|------|----------------|
| `t14a-runtime-alignment-admin-v1-2026-05-12` | Commit **`ca4c6a0`** do parent |

**Push da tag:** enviada para `origin`.

---

## 7. Push

| Ação | Resultado |
|------|-----------|
| `git push` (admin) | OK — `d7e6c22..bb41c40` |
| `git push` (parent) | OK — `8ba15cf..ca4c6a0` |
| `git push origin t14a-runtime-alignment-admin-v1-2026-05-12` | OK — tag nova no remoto |

---

## 8. Deploy frontend admin

| Campo | Valor |
|-------|--------|
| **Ferramenta** | Vercel CLI `48.10.2` — `vercel deploy --prod --yes` |
| **Diretório** | `goldeouro-admin/` |
| **Inspect** | `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/8omr3mK1R4Xn9dLgHvKGXbx3yGnJ` |
| **URL de deployment (build)** | `https://goldeouro-admin-fqjh1axos-goldeouro-admins-projects.vercel.app` |
| **Domínio customizado (verificação)** | `https://admin.goldeouro.lol/` — **HEAD 200** (após deploy) |

**Build:** concluído no painel Vercel (“Completing”).

---

## 9. Deploy backend Fly

| Campo | Valor |
|-------|--------|
| **App** | `goldeouro-backend-v2` |
| **Comando** | `fly deploy --remote-only` (a partir da raiz do backend) |
| **Release** | **v451** (`complete`) |
| **Imagem (registry)** | `registry.fly.io/goldeouro-backend-v2:deployment-01KRH7HR4GQCT17P095JDW6FSW` |
| **Máquinas** | `080e207b071048` (app), `784e047bd04e08` (payout_worker) — smoke checks **passed** |
| **URL** | `https://goldeouro-backend-v2.fly.dev` |

**Aviso Fly (deploy):** mensagem *“The app is not listening on the expected address…”* durante a atualização; as **machine checks** finalizaram em estado **good**. Registar para observação pós-deploy.

---

## 10. Verificação de runtime backend

| Endpoint | Método | Sem token | Corpo / notas |
|----------|--------|-----------|----------------|
| `https://goldeouro-backend-v2.fly.dev/health` | GET | **200** | OK |
| `https://goldeouro-backend-v2.fly.dev/meta` | GET | **200** | OK |
| `https://goldeouro-backend-v2.fly.dev/api/admin/users/00000000-0000-0000-0000-000000000001` | GET | **401** | `{"success":false,"message":"Token de acesso requerido"}` |
| `https://goldeouro-backend-v2.fly.dev/api/admin/chutes/recentes` | GET | **401** | idem |

**Conclusão:** rotas novas **existem** no runtime (não devolvem 404 de “rota não encontrada” anónima para estes GET).

---

## 11. Verificação de runtime frontend

| Verificação | Resultado |
|-------------|-----------|
| Domínio admin | **HEAD 200** em `https://admin.goldeouro.lol/` |
| Fluxo UI autenticado | **Não** executado nesta sessão (sem credenciais/browser automatizado aqui) |

**Próximo passo manual:** login admin → Lista → **Ver** → `/relatorio-por-usuario/:id` → abas Chutes / Logs / Transações e inspeção de **Network** (prefixos `/api/admin/...`).

---

## 12. Endpoints novos

- `GET /api/admin/users/:id` — protegido; 401 sem JWT.  
- `GET /api/admin/chutes/recentes` — protegido; 401 sem JWT.

---

## 13. Rotas corrigidas (SPA)

- `/relatorio-por-usuario/:id` + redirect de `/relatorio-por-usuario` → lista.  
- Sidebar “Relatório Individual” → lista com instrução.  
- Demais páginas conforme relatório CIRURGIA-T14A.

---

## 14. Evidências reais de produção

| Evidência | Detalhe |
|-----------|---------|
| GitHub parent | Commit `ca4c6a0` na branch `fix/admin-financial-integrity-v1` |
| GitHub admin | Commit `bb41c40` na branch `painel-protegido-v1.1.0` |
| Tag | `t14a-runtime-alignment-admin-v1-2026-05-12` no remoto |
| Fly | Release **v451**, imagem listada na secção 9 |
| Vercel | URL de inspect na secção 8 |
| HTTP | 200 `/health`, `/meta`; 401 nos novos GET admin sem token |

---

## 15. Problemas encontrados

1. **Aviso Fly** durante deploy sobre endereço de escuta — não impediu conclusão nem checks “good”.  
2. **Smoke UI autenticado** não coberto automaticamente neste documento (depende de sessão real).

---

## 16. Riscos remanescentes

- Validar com **token admin** em produção: 200 + payload para `users/:id` válido e `chutes/recentes`.  
- Confirmar que o domínio **admin.goldeouro.lol** aponta para o **mesmo** deployment Vercel que contém `bb41c40` (propagação DNS / alias de produção).  
- Monitorizar logs Fly após o aviso de listener.

---

## 17. Classificação final

**PRONTO COM RESSALVAS**

**Motivo:** deploy backend e frontend **concluídos**; endpoints novos **visíveis** no runtime (401 sem auth); domínio admin responde **200**. **Ressalvas:** smoke autenticado e Network no browser **não** feitos nesta execução; aviso Fly durante deploy merece confirmação em monitorização.

Para fechar como **PRONTO PARA VALIDAÇÃO** no critério estrito do pedido, executar o **smoke completo** com sessão admin real (lista, relatório individual, chutes, logs, transações) e anexar prints ou HAR se necessário.

---

*Fim do relatório.*
