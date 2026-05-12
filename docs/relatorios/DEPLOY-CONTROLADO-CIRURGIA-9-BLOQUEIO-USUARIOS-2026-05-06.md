# DEPLOY CONTROLADO — CIRURGIA 9 BLOQUEIO DE USUÁRIOS (retomada 2026-05-12)

Relatório gerado na retomada da sessão de deploy; o ficheiro mantém o sufixo de data **2026-05-06** alinhado ao pedido de nomenclatura e à Cirurgia 9 documentada em `docs/relatorios/CIRURGIA-9-BLOQUEIO-USUARIOS-PAINEL-ADMIN-2026-05-06.md`.

## 1. Estado do repositório (raiz)

**Comando:** `git status --short` e `git log --oneline -8`

- **Working tree:** alterações locais não relacionadas a esta cirurgia (ex.: `goldeouro-player/vercel.json` modificado; vários `docs/relatorios/*.md` e `scripts/*.js` não versionados). Nada disso foi alterado para este deploy.
- **HEAD backend:** `ef651bd` — `fix(admin): adicionar bloqueio real de usuarios` (conforme contexto).

## 2. Endpoints no código (backend)

Confirmado em `server-fly.js`:

- `POST /api/admin/users/block` → `adminUsersMutationBlockOrUnblock(req, res, 'block')` com `authenticateToken` e `requireAdministradorDb`.
- `POST /api/admin/users/unblock` → idem com modo `'unblock'`.

Proteções no handler (sem alteração de código nesta sessão):

- `userId` inválido → **400**.
- Bloquear/desbloquear **a própria conta** (`userId === adminId`) → **400**, mensagem controlada.
- Bloquear utilizador com `tipo === 'admin'` → **400**, mensagem controlada (desbloqueio de admin bloqueado não é barrado pelo mesmo ramo).

## 3. Submodule `goldeouro-admin`

**Comandos:** `git status --short`, `git log --oneline -5`, `npm run build`

- **Working tree:** limpo (sem alterações pendentes no submodule).
- **HEAD:** `562c4fc` — `fix(admin): adicionar bloqueio real de usuarios`.
- **Build:** sucesso (Vite; artefactos em `dist/`, por exemplo `dist/assets/index-a3ed332b.js` nesta máquina).

## 4. Deploy backend (Fly.io)

**Comando:** `flyctl deploy --app goldeouro-backend-v2 --yes`

- **Resultado:** concluído com sucesso.
- **Nota:** aviso de health check sobre um processo que não escuta em `0.0.0.0:8080` (provável máquina `payout_worker`); a app principal respondeu a `/health` e `/meta` após o deploy.

## 5. Validação backend pós-deploy

| Verificação | Resultado |
|-------------|-----------|
| `flyctl releases --app goldeouro-backend-v2` | **v449** `complete` (deploy desta sessão); v448 imediatamente anterior |
| `GET https://goldeouro-backend-v2.fly.dev/health` | **200** — `status: ok`, `database: connected` |
| `GET https://goldeouro-backend-v2.fly.dev/meta` | **200** — `success: true` |
| `POST /api/auth/login` (admin) | **200** — JWT obtido (credencial de conta admin de teste documentada em relatórios anteriores; não reproduzida aqui) |
| `GET /api/admin/users/list?limit=5` | **200** — `success: true`, lista com dados |

## 6. Utilizador de smoke (comum, não admin)

Escolhido a partir de `GET /api/admin/users/list?limit=20`:

| Campo | Valor |
|--------|--------|
| **id** | `ec91d564-538b-484b-9eb1-bed997f3f29a` |
| **email** | `pixfinal725094@example.com` |
| **tipo** | `jogador` |
| **Estado inicial** | `account_status: active` |

Conta claramente de teste (`@example.com`), adequada a mutação controlada.

## 7. Smoke test API (block / unblock)

Base: `https://goldeouro-backend-v2.fly.dev`

| Passo | Resultado |
|--------|------------|
| `POST /api/admin/users/block` com `userId` do utilizador teste + `reason` opcional | **200** — `success: true`, `data.account_status: blocked` |
| `GET /api/admin/users/list?...&search=pixfinal725094` | Estado **blocked** para o mesmo `id` |
| `POST /api/admin/users/unblock` com o mesmo `userId` | **200** — `success: true`, `data.account_status: active` |
| `GET` lista novamente | **active** — utilizador teste reposto ao estado seguro para o dia a dia |

## 8. Smoke test proteção (admin / self)

| Cenário | HTTP | Notas |
|---------|------|--------|
| Bloquear **o próprio** `userId` do admin autenticado | **400** | `success: false` — mensagem: não é permitido bloquear ou desbloquear a própria conta |
| Bloquear outro utilizador com `tipo` **admin** (`4c3b3b02-592c-4183-a53e-b05b1d9a4426`) | **400** | `success: false` — não é permitido bloquear um administrador; **nenhuma mutação** em conta de produção real além da rejeição esperada |

## 9. Deploy painel admin (Vercel)

**Comandos:** `npm run build` e `npx vercel --prod --yes` em `goldeouro-admin`.

| Campo | Valor |
|--------|--------|
| **Projeto** | `goldeouro-admins-projects/goldeouro-admin` |
| **URL de deployment (saída CLI)** | `https://goldeouro-admin-j9mvqj6xb-goldeouro-admins-projects.vercel.app` |
| **Inspeção (saída CLI)** | `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/EcaWmv2YUMK6Yb7GDrvgw74N74nC` |
| **Domínio de produção** | `https://admin.goldeouro.lol/` |

## 10. Validação UI (`/lista-usuarios`)

| Verificação | Resultado |
|-------------|-----------|
| Login em `https://admin.goldeouro.lol` + rota **`/lista-usuarios`** | **SIM** — sessão já presente no browser de validação; página “Usuários” com resumo (50 ativos na página), busca e filtro de estado |
| Dados reais (ex.: email de teste visível na tabela) | **SIM** — pesquisa nativa do browser encontrou texto `pixfinal` na página |
| Bundle JS servido em produção (`/assets/index-8b49ccfc.js`) contém literais `POST` alvo | **SIM** — `/api/admin/users/block`, `/api/admin/users/unblock`, `/api/admin/users/list` presentes |
| Ausência de rota legada no bundle | **SIM** — literal `/admin/lista-usuarios` **não** encontrado no mesmo ficheiro |
| Botões **Bloquear** / **Desbloquear** visíveis na automação de pesquisa em página | **PARCIAL** — o texto “Bloquear” não apareceu em correspondências de pesquisa na viewport (tabela com `overflow-x-auto`; coluna “Ações” provavelmente fora da área visível sem scroll horizontal). O código-fonte `Users.jsx` e o bundle confirmam os rótulos e chamadas |
| Bloqueio/desbloqueio **pela UI** no utilizador teste | **NÃO executado** — ciclo completo já validado pela **API** com o mesmo utilizador; evita dupla mutação e diálogos `confirm`/`prompt` nesta sessão automatizada |

## 11. Player e base de dados

- **Player:** não alterado.
- **Banco:** nenhuma alteração manual fora do fluxo normal das rotas `block`/`unblock` (smoke reversível no utilizador teste).

## 12. Saída final solicitada

| Campo | Valor |
|--------|--------|
| **Release Fly** | **v449** (`goldeouro-backend-v2`) |
| **Deploy Vercel URL (CLI)** | `https://goldeouro-admin-j9mvqj6xb-goldeouro-admins-projects.vercel.app` |
| **Endpoints `block` / `unblock` validados** | **SIM** (API, smoke mutável + proteções) |
| **UI `/lista-usuarios` validada** | **SIM** (estrutura, dados, bundle); clique Bloquear/Desbloquear na UI **NÃO** repetido (justificado acima) |
| **Utilizador teste** | `ec91d564-538b-484b-9eb1-bed997f3f29a` — `pixfinal725094@example.com` |
| **Proteção admin / self-block** | **SIM** (ambos **400** com mensagens esperadas) |
| **Hash do commit do relatório** | *Não fixado no corpo do ficheiro (evita referência circular ao objeto commit). Consultar na raiz: `git log -1 --oneline -- docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-9-BLOQUEIO-USUARIOS-2026-05-06.md`.* |

## 13. GO / NO-GO para o próximo módulo

**GO** — Backend em produção com `POST /api/admin/users/block` e `unblock` operacionais, proteções confirmadas, admin publicado na Vercel com bundle alinhado aos endpoints novos e sem dependência do path legado `/admin/lista-usuarios` no JS analisado.
