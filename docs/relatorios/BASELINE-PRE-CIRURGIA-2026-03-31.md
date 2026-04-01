# BASELINE PRÉ-CIRURGIA

**Data:** 2026-03-31

## 1. Estado do sistema

| Área | Estado |
|------|--------|
| **Chute** | Quebrado — insert em `chutes` falha com **PGRST204** (coluna `contador_global` ausente no schema cache / drift face ao `server-fly.js`). |
| **Saque** | Quebrado — RPC / fluxo atómico falha com **23502** — `null value in column "net_amount" of relation "saques" violates not-null constraint`. |
| **Auth produção** | Inconsistente — JWT emitido com `JWT_SECRET` do `.env` local rejeitado em `https://goldeouro-backend-v2.fly.dev` (**403** / token inválido), indicando divergência de segredo entre ambiente local e Fly. |

## 2. Evidência

Resumo dos erros já observados na sessão de prova (detalhe completo em `docs/relatorios/FECHAMENTO-FINANCEIRO-REAL-SEM-RESSALVAS-2026-03-31.md`):

- **Chute:** `POST /api/games/shoot` → HTTP **500**, `Falha ao registrar chute`; Supabase/PostgREST **PGRST204** em insert com `contador_global`.
- **Saque:** `POST /api/withdraw/request` → HTTP **500**; `solicitar_saque_pix_atomico` → PostgreSQL **23502** em `saques.net_amount`.
- **Auth:** `GET /api/user/profile` na API Fly com Bearer JWT (secret local) → **403** `Token inválido`.

## 3. Commit

`8976d703d5f8b0e314ebad8cd9fb7724c6f876de`

Mensagem: `chore(baseline): estado pré-cirurgia gameplay/saque/auth com falha reproduzida`

## 4. Tag

`pre-cirurgia-gameplay-saque-auth-2026-03-31` (aponta para o commit acima)

## 5. Decisão

**CIRURGIA LIBERADA**

---

**Notas operacionais**

- **Deploy:** não foi executado `fly deploy` nesta etapa.
- **Git (pré-commit):** branch `feature/bloco-e-gameplay-certified`; ficheiros incluídos no commit de baseline foram apenas relatórios em `docs/relatorios/` previamente não versionados (5 ficheiros).
