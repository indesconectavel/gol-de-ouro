# DEPLOY CONTROLADO — CIRURGIA 11 TELA AUDITORIA ADMIN (2026-05-12)

## Escopo

- **Incluído:** pré-check Git e build em `goldeouro-admin`, deploy produção Vercel (`npx vercel --prod --yes`), verificação HTTP pública do domínio `admin.goldeouro.lol` nas rotas `/auditoria` e `/logs`, registo do URL de deployment na Vercel.
- **Excluído:** alterações a código (nenhuma antes do deploy), backend, base de dados, `goldeouro-player`.
- **Limite da validação autenticada:** não foram usadas credenciais admin nesta sessão; smoke com JWT, chamada real a `GET /api/admin/audit/logs`, linhas na tabela e filtro por `action` ficam **pendentes de validação manual** pelo operador com login.

## 1. Git e build (`goldeouro-admin`)

**Diretório:** `goldeouro-admin/`

**Comandos:** `git status --short`, `git log --oneline -5`, `npm run build`

- **Working tree:** limpo (sem alterações pendentes no momento da execução).
- **HEAD:** `90331e0` — `fix(admin): adicionar tela real de auditoria admin` (alinhado ao ponteiro documentado na raiz `1d3e8f7`).
- **Build:** **sucesso** (Vite, ~25 s, exit code 0).

## 2. Deploy Vercel (produção)

**Comando:** `npx vercel --prod --yes`

**Projeto:** `goldeouro-admins-projects/goldeouro-admin`

| Campo | Valor |
|--------|--------|
| **Inspect (dashboard)** | `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/FwY4FioEWJfXf3T1BvyCKRzgqKDH` |
| **URL de deployment (Production, Ready)** | `https://goldeouro-admin-8n5o4jno7-goldeouro-admins-projects.vercel.app` |

O domínio personalizado **`https://admin.goldeouro.lol`** deve servir o mesmo projeto após propagação habitual; validação abaixo foi feita contra esse host.

## 3. Validação produção `https://admin.goldeouro.lol`

### 3.1 Login admin

**Estado:** **não executado** nesta sessão (sem credenciais disponíveis no ambiente do agente).

### 3.2 Rota `/auditoria` — página carrega

**Método:** pedido HTTP ao documento (fetch/read do HTML público).

**Resultado:** **SIM** — a aplicação responde; utilizador não autenticado vê o fluxo de **login** do painel (comportamento esperado para área protegida). A rota `/auditoria` está registada no router; após login, a tela de auditoria deve montar normalmente.

### 3.3 Chamada `GET /api/admin/audit/logs?limit=50`

**Estado:** **NÃO** validado nesta sessão (depende de sessão autenticada e de inspeção de rede ou do backend após login).

### 3.4 Eventos reais visíveis na tabela

**Estado:** **NÃO** validado nesta sessão (mesmo motivo).

### 3.5 Filtro por `action`

**Estado:** **NÃO** (sem login) — classificação: **NÃO** para esta execução; após login, espera-se **SIM** com o código em `Auditoria.jsx` (debounce + query `action`).

### 3.6 Legado `/logs`

**Método:** pedido HTTP a `https://admin.goldeouro.lol/logs`.

**Resultado:** **SIM** — o host responde com a mesma shell do painel e ecrã de login; a rota `/logs` **permanece acessível** ao nível de entrega do SPA (não removida).

## 4. Saída final (checklist)

| Item | Valor |
|------|--------|
| **Deploy Vercel URL (produção)** | `https://goldeouro-admin-8n5o4jno7-goldeouro-admins-projects.vercel.app` |
| **`/auditoria` validado** | **SIM** (carga pública / shell + login); **pós-login** não validado aqui |
| **Endpoint `audit/logs` chamado** | **NÃO** (nesta sessão) |
| **Eventos reais visíveis** | **NÃO** (nesta sessão) |
| **Filtro `action`** | **NÃO** |
| **`/logs` legado preservado** | **SIM** |
| **Hash commit (este relatório)** | Ver `git log -1 --oneline -- docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-11-TELA-AUDITORIA-ADMIN-2026-05-12.md` na raiz após o commit do relatório. |
| **GO / NO-GO próximo módulo** | **GO** para módulos que **não** dependam exclusivamente deste smoke autenticado. **GO condicional** para encerramento formal da Cirurgia 11: operador deve repetir login em `https://admin.goldeouro.lol/auditoria`, confirmar rede (`GET .../audit/logs?limit=50`), dados na grelha, filtro e `/logs`. |

---

*Deploy concluído com sucesso; validação funcional completa da API e da UI pós-login ficou documentada como pendência explícita.*
