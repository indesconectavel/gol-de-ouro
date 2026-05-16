# DEPLOY CONTROLADO — CIRURGIA 8 ROTA USUÁRIOS (2026-05-12)

## Escopo

- **Apenas** `goldeouro-admin` (fonte: `E:\Chute de Ouro\goldeouro-backend\goldeouro-admin`).
- **Não** alterado: backend, base de dados, player.

## Contexto funcional (código-fonte)

- Rota **`/lista-usuarios`** em `AppRoutes.jsx` renderiza **`Users`** (`Users.jsx`).
- `Users.jsx` obtém dados com **`getData(\`/api/admin/users/list?...\`)`** (GET com query `limit`, `search`, `status`).

## Build local

- Comando: `npm run build` em `goldeouro-admin`.
- Resultado: **sucesso** (Vite; artefactos em `dist/`, por exemplo `dist/assets/index-b17bf40f.js` nesta máquina).

## Deploy Vercel (produção)

- Comando: `npx vercel --prod --yes` (diretório `goldeouro-admin`).
- **Projeto:** `goldeouro-admins-projects/goldeouro-admin`.
- **URL de deployment (saída CLI):** `https://goldeouro-admin-n3ju4cepw-goldeouro-admins-projects.vercel.app`
- **Inspeção (saída CLI):** `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/BbMuCkk2QyzWY6ACXMt5fgtctc2D`
- **Domínio de produção habitual:** `https://admin.goldeouro.lol/` (bundle servido nesta validação: `/assets/index-d68dccc6.js`).

## Validação em produção (`admin.goldeouro.lol`)

| Verificação | Resultado |
|-------------|------------|
| Login admin (`admin@goldeouro.lol` / credencial de relatórios anteriores) | **SIM** — sessão estabelecida; painel com métricas (ex.: total de utilizadores coerente com backend). |
| Abrir **`/lista-usuarios`** | **SIM** — página **“Usuários”** com pesquisa, filtro de estado, cards de resumo e tabela “Lista de Usuários”; totais da página (até 50 por pedido) coerentes com dados reais. |
| Chamada ao endpoint novo **`/api/admin/users/list`** | **SIM** — verificado no bundle servido em produção (`GET` com literal `/api/admin/users/list` em `https://admin.goldeouro.lol/assets/index-d68dccc6.js`). |
| Dados reais (lista com saldos e estados) | **SIM** — UI mostra utilizadores com valores financeiros e estados (ativos/bloqueados) alinhados ao modelo do endpoint. |
| **Não** utilizar legado **`/admin/lista-usuarios`** na rota | **SIM** — o literal `/admin/lista-usuarios` **não** está presente no mesmo bundle JS de produção. |

### Nota sobre URL de preview da CLI

- Ao testar **login** diretamente na URL `*.vercel.app` do deployment, o navegador registou **bloqueio CORS** no pré-flight (`Access-Control-Allow-Origin` em falta para essa origem). Isto é esperado quando o backend não inclui a origem de preview na política CORS.
- A validação completa de login e lista foi feita no domínio **`https://admin.goldeouro.lol`**, que está alinhado com as origens de produção.

## Saída final solicitada

| Campo | Valor |
|--------|--------|
| **Deploy URL (CLI)** | `https://goldeouro-admin-n3ju4cepw-goldeouro-admins-projects.vercel.app` |
| **`/lista-usuarios` validado** | **SIM** |
| **Endpoint novo (`/api/admin/users/list`) chamado / presente no cliente** | **SIM** |
| **Endpoint legado (`/admin/lista-usuarios`) removido da rota / bundle** | **SIM** |
| **GO / NO-GO para Cirurgia 9 (bloqueio / desbloqueio)** | **GO** — rota de listagem de utilizadores está alinhada ao contrato novo e sem dependência do POST legado no bundle; seguro avançar para a cirurgia seguinte desde que o escopo continue a excluir alterações não pedidas em backend/banco/player. |
