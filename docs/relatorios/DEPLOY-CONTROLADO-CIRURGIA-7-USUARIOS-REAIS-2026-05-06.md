# DEPLOY CONTROLADO — CIRURGIA 7 USUÁRIOS REAIS (2026-05-06)

## Contexto Git (antes do deploy)
```
git log --oneline -5 (raiz):
bf1c0bf fix(backend): users list compativel com schema nome/username
45ab301 fix(admin): conectar usuarios do painel a dados reais
157319a docs: registrar deploy controlado cirurgia 6 relatorio financeiro
...
```

**Observação:** durante a validação em produção, `GET /api/admin/users/list` na release inicial da Cirurgia 7 (`45ab301`) respondeu **`500`** (`Erro ao listar usuários`). A causa raiz foi **incompatibilidade entre colunas esperadas (`nome` / `username`) e o schema real**. Foi aplicado um **hotfix apenas em `server-fly.js`** (commits `bf1c0bf` no histórico local após este primeiro deploy tentado). **Nenhuma mudança de banco, player ou PIX.**

Alterações locais não relacionadas continuam no working tree (ex.: `goldeouro-player/vercel.json`), **fora do escopo**.

## Deploy Fly.io (app `goldeouro-backend-v2`)
- Imagem final relevante para endpoint estável: `registry.fly.io/goldeouro-backend-v2:deployment-01KQZ70NCTNC05N9S8QBFFWRD4`
- **Último release observado nesta sessão:** **v447** (`flyctl releases`, status complete)

### Validações backend (produção)

| Item | Resultado |
|------|------------|
| `GET /health` | **200** OK |
| `GET /meta` | **200**, `success: true` |
| `GET /api/admin/users/list?limit=5` + JWT admin | **SIM** (`success: true`, `meta.count = 5` após hotfix) |
| `status=active` | **SIM** |
| `status=blocked` | **SIM** (lista vazia esperada se não há bloqueados na amostra) |
| `search=admin` | **SIM** (`meta.count` coerente) |

## Deploy Vercel (`goldeouro-admin`)
- `npm run build` — **OK** antes do CLI
- Comando: `npx vercel --prod --yes`
- **URL CLI (deployment):** `https://goldeouro-admin-qaico4vv7-goldeouro-admins-projects.vercel.app`
- **Domínio verificado:** `https://admin.goldeouro.lol/` (bundle JS: `assets/index-d0b811ca.js` neste deploy)

## Validacao producao — painel “usuarios”

### Evidencias estaticas (bundle em `admin.goldeouro.lol`)
| Verificacao | Resultado |
|-------------|------------|
| String `/api/admin/users/list` presente | **Não** (pagina `Users.jsx` **não esta importada** em `AppRoutes.jsx`) |
| Legacy `POST` `/admin/lista-usuarios` (pagina `ListaUsuarios.jsx`) | **Sim** (rotas ativas: `/lista-usuarios`) |

**Conclusão de UI:** o item de menu **Lista de Usuários** aponta para **`/lista-usuarios` (`ListaUsuarios.jsx`)**, que **ainda usa o endpoint legado** e **não reflete a Cirurgia 7** aplicada em `Users.jsx`. Ou seja: **a lista “oficial” no painel não foi validada como “dados reais via `/api/admin/users/list`” neste deploy.**

Validação manual opcional: após **conectar a rota/menu** a `Users.jsx` ou alinhar `ListaUsuarios.jsx` ao mesmo contrato — fora do pedido “só deploy” desta sessão.

### Mocks
- O bundle minificado **não** contém o literal `mockUsers`; ainda assim, a rota canônica atual **não usa** o modulo `Users.jsx` implementado na Cirurgia 7.

## Saida final solicitada

| Campo | Valor |
|--------|--------|
| **Release Fly (último esta sessão)** | **v447** |
| **Endpoint `GET /api/admin/users/list` validado com JWT** | **SIM** (após hotfix `bf1c0bf`) |
| **Deploy Vercel URL (CLI)** | `https://goldeouro-admin-qaico4vv7-goldeouro-admins-projects.vercel.app` |
| **Página de usuários (`/lista-usuarios`) lista real via novo endpoint** | **NÃO** (rota não usa `Users.jsx`) |
| **Dados mock da Cirurgia 7 removidos no que foi publicado dessa página** | **N/A / NÃO aplicável** ao menu atual; bundle ainda carrega fluxo `lista-usuarios` legado |
| **GO/NO-GO próximo módulo** | **GO** no backend; **NO-GO operacional** para “módulo usuários concluído” até **alinhar rota** `/lista-usuarios` (ou equivalente) ao `GET /api/admin/users/list` |

## Recomendacao tecnica (proximo passo cirurgia leve, fora deste deploy-only)
- Alterar `AppRoutes.jsx` para renderizar `Users` em `/lista-usuarios`, **ou** substituir implementacao de `ListaUsuarios.jsx` pela mesma fonte de dados do endpoint novo, sem acoes de bloqueio até ordem explicita.
