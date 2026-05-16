# DEPLOY CONTROLADO FINAL — CIRURGIA 10 AUDITORIA PERSISTIDA ADMIN (2026-05-12)

## Escopo

- **Alterações de código:** nenhuma.
- **Commits funcionais:** nenhum novo; apenas documentação desta execução.
- **Player / admin UI:** não alterados.

## 1. Git (pré-execução)

**Comandos:** `git status --short`, `git log --oneline -5`

- Working tree com alterações locais pré-existentes não relacionadas (ex.: `goldeouro-player/vercel.json`, ficheiros `docs/` e `scripts/` não versionados) — **não** modificados nesta sessão.
- Referência recente na branch: `84f2929` (relatório intermédio Cirurgia 10), `3e416c0` (auditoria persistida), etc.

## 2. Deploy Fly.io

**Comando:** `flyctl deploy --app goldeouro-backend-v2 --yes`

- **Resultado:** concluído com sucesso.
- **Release:** **v450** (`complete`), imediatamente após **v449**.
- **Nota:** aviso habitual do Fly sobre uma máquina que não escuta em `0.0.0.0:8080` (worker); máquina principal da app passou nos health checks.

## 3. Runtime — `/health` e `/meta`

**Base:** `https://goldeouro-backend-v2.fly.dev`

| Verificação | Resultado |
|---------------|------------|
| `GET /health` | **200** — `status: ok`, `database: connected` |
| `GET /meta` | **200** — `success: true` |

## 4. Autenticação admin

- **POST** `/api/auth/login` com credencial admin de ambiente de relatórios (conta de teste documentada em execuções anteriores).
- **JWT** obtido com sucesso para chamadas subsequentes.

## 5. Endpoint `GET /api/admin/audit/logs`

**Pedido:** `GET /api/admin/audit/logs?limit=10`

| Campo | Resultado |
|--------|------------|
| `success` | **true** |
| `data` | **array** (inicialmente vazio antes do smoke; após mutações, contém entradas) |

**Validação:** **SIM** — rota responde com contrato esperado e autenticação admin.

## 6. Smoke persistência — `user.block` / `user.unblock`

**Utilizador teste:** `ec91d564-538b-484b-9eb1-bed997f3f29a` (`pixfinal725094@example.com`, tipo comum).

| Passo | Resultado |
|--------|------------|
| `POST /api/admin/users/block` | **200** — `success: true`, `account_status: blocked` |
| `POST /api/admin/users/unblock` | **200** — `success: true`, `account_status: active` |
| `GET /api/admin/audit/logs?limit=20` | **200** — `success: true`; presença de **`user.block`** e **`user.unblock`** para o `target_id` acima |

**Campos validados nas linhas de auditoria:**

| Campo | Presente |
|--------|------------|
| `admin_id` | **SIM** (UUID do admin autenticado) |
| `target_id` | **SIM** (UUID do utilizador teste) |
| `created_at` | **SIM** (timestamptz ISO) |

**Persistência `user.block` / `user.unblock`:** **SIM**

## 7. Smoke saque manual (`withdraw.cancel` / `withdraw.approve`)

- **GET** `/api/admin/withdraw/list?limit=15&status=pendente` → **0** saques pendentes no momento do teste.
- **Decisão:** **NÃO EXECUTADO** — sem saque pendente claramente isolável para teste controlado, evitar mutação financeira desnecessária em contas reais.

**Eventos `withdraw.*` na auditoria após esta sessão:** **NÃO** (apenas as duas linhas de utilizador geradas pelo smoke).

## 8. Confirmação de persistência no PostgreSQL (read-only via API)

O prompt pedia SQL explícito; equivalência segura: **leitura** com cliente Supabase (service role) apenas `SELECT` de colunas públicas do modelo:

```text
from('admin_logs').select('action, target_type, target_id, created_at').order('created_at', { ascending: false }).limit(10)
```

**Amostra devolvida (ordem `created_at` desc):**

- `user.unblock` — `target_type` user — `target_id` ec91d564-… — `created_at` 2026-05-12T20:38:27.85688+00:00  
- `user.block` — `target_type` user — `target_id` ec91d564-… — `created_at` 2026-05-12T20:38:27.493381+00:00  

**Confirmação:** **SIM** — linhas visíveis em `public.admin_logs` alinhadas ao smoke e ao endpoint HTTP.

## 9. Saída final solicitada

| Campo | Valor |
|--------|--------|
| **Release Fly** | **v450** |
| **Endpoint `audit/logs` validado** | **SIM** |
| **Eventos `user.block` / `user.unblock` persistidos** | **SIM** |
| **Eventos saque persistidos** | **NÃO** (smoke não executado) |
| **SQL readonly / leitura equivalente confirmou persistência** | **SIM** |
| **Hash do commit deste relatório** | Ver `git log -1 --oneline` (mensagem: `docs: registrar deploy final cirurgia 10 auditoria admin`). |
| **GO / NO-GO próximo módulo** | **GO** — backend em produção com auditoria persistida ativa para mutações integradas; smoke crítico de utilizador passou; smoke de saque pode ser feito numa janela em que exista saque de teste pendente. |

---

*Execução sem alteração de código-fonte; apenas deploy, validações e este relatório.*
