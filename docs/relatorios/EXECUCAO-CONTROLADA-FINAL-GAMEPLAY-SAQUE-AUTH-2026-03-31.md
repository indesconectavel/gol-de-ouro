# EXECUÇÃO CONTROLADA FINAL — GAMEPLAY + SAQUE + AUTH

**Data do relatório:** 2026-04-01 (UTC aproximado nos logs Fly).  
**Referência de planeamento:** `CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md`.

---

## 1. Resumo executivo

Foram concluídos **localmente**: revisão git, **staging** restrito aos quatro ficheiros da cirurgia, **commit** e **tag**, e **deploy** bem-sucedido na Fly (`goldeouro-backend-v2`). A **aplicação dos scripts SQL no Supabase** **não** foi executada nesta sessão automatizada (ausência de credencial Postgres / SQL Editor no agente); a verificação via OpenAPI mostra `chutes` **ainda sem** `contador_global`. Pelas regras do pipeline (**não assumir produção alinhada**; falha de etapa → bloqueio), o resultado é **TESTE BLOQUEADO** até o SQL ser aplicado manualmente e revalidado.

---

## 2. Escopo aplicado

| Item | Estado |
|------|--------|
| Staging/commit/tag (4 ficheiros da cirurgia) | Feito |
| `database/migration-2026-03-31-chutes-v1-align.sql` no Supabase | **Não aplicado** (ação manual pendente) |
| Bloco RPC em `database/rpc-financeiro-atomico-2026-03-28.sql` no Supabase | **Não aplicado** (ação manual pendente) |
| Deploy `server-fly.js` na Fly | Feito |
| Prova banco + runtime alinhados | **Não** — banco não migrado |

---

## 3. Estado local antes do commit

- Branch: `feature/bloco-e-gameplay-certified`.
- Alterações da cirurgia: `server-fly.js`, `database/rpc-financeiro-atomico-2026-03-28.sql` modificados; `database/migration-2026-03-31-chutes-v1-align.sql` e `docs/relatorios/CIRURGIA-FINAL-...` novos.
- Fora do staging: relatórios `DIAGNOSTICO-*`, `PRE-EXECUCAO-*`, `PREPARACAO-*` (mantidos untracked).

---

## 4. Commit realizado

| Campo | Valor |
|--------|--------|
| **SHA** | `c25dd82bb006b990b9e797599f13f4ac14dd779c` |
| **Mensagem** | `fix(finance): align chutes v1 schema and complete saque rpc/fallback` |
| **Ficheiros** | `database/migration-2026-03-31-chutes-v1-align.sql` (novo), `database/rpc-financeiro-atomico-2026-03-28.sql`, `server-fly.js`, `docs/relatorios/CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` (novo) |

Validação: `git log -1 --stat` — 4 files changed, 389 insertions, 9 deletions.

---

## 5. Tag criada

| Campo | Valor |
|--------|--------|
| **Nome** | `cirurgia-final-gameplay-saque-auth-2026-03-31` |
| **Objetivo** | Marcar o commit da cirurgia no código para rollback/referência antes da execução completa no ambiente. |

---

## 6. SQL aplicado no Supabase

| Bloco | Resultado nesta sessão | Observação |
|-------|------------------------|------------|
| Migration `chutes` (`migration-2026-03-31-chutes-v1-align.sql`) | **Não executado** | Requer SQL Editor (ou `psql` com `DATABASE_URL` do projeto). Não há variável de ligação direta ao Postgres no `.env` do repositório utilizado pelo agente. |
| Replace RPC `solicitar_saque_pix_atomico` | **Não executado** | Aplicar o ficheiro `database/rpc-financeiro-atomico-2026-03-28.sql` (secção da função) após rever backup. |

**Evidência de estado do schema (read-only, após deploy):** pedido OpenAPI a `.../rest/v1/` — propriedades de `chutes` continuam: `created_at`, `direcao`, `gol_marcado`, `id`, `partida_id`, `resultado`, `usuario_id`, `valor_aposta`; **`contador_global` ausente** → migração **não** refletida no projeto Supabase ligado ao `.env`.

---

## 7. Deploy realizado

| Campo | Valor |
|--------|--------|
| **Comando** | `fly deploy -a goldeouro-backend-v2` |
| **Release** | **v344** (complete) |
| **Image** | `registry.fly.io/goldeouro-backend-v2:deployment-01KN38GP8HQY8BQZ20B45F3F5S` |
| **Machine** | `1850066f141908`, **version 344**, região `gru`, health check passing |
| **Horário (log)** | Arranque após deploy ~ **2026-04-01T00:54:37Z** UTC |

---

## 8. Verificação de produção

| Verificação | Resultado |
|-------------|-----------|
| `fly status` | App `goldeouro-backend-v2`, imagem `deployment-01KN38GP8HQY8BQZ20B45F3F5S`, máquina started, **1 check passing** |
| `fly releases` | **v344** ativa (complete), ~57s antes da consulta |
| `fly logs --no-tail` | Boot recente: Supabase OK, Mercado Pago OK, servidor porta 8080, health passou após arranque |
| **Runtime atualizado** | **Sim** — nova imagem e release v344 |
| **Banco alinhado ao V1** | **Não** — evidência OpenAPI |

---

## 9. Prova concreta de alinhamento

### `chutes`

- **PGRST204 / `contador_global`:** **não** eliminado — schema exposto ainda **sem** `contador_global` (verificação OpenAPI pós-deploy).
- **Insert V1:** **não** comprovado em produção até a migração SQL ser aplicada.

### `saques`

- **RPC nova (fee, net_amount, `p_fee`):** **não** comprovada no Postgres desta sessão (SQL não aplicado). O runtime Fly já envia `p_fee` e o fallback corrigido, mas a função no BD pode permanecer na versão antiga até o `CREATE OR REPLACE`.

### Auth / procedimento

- Testes devem usar **`POST https://goldeouro-backend-v2.fly.dev/api/auth/login`** e o **token** devolvido.
- Rotação de `JWT_SECRET` na Fly: apenas operacional; não executada aqui.

---

## 10. Resultado final

**EXECUÇÃO INTERROMPIDA / TESTE BLOQUEADO**

**Motivo:** etapa obrigatória **5 (SQL no Supabase)** não concluída nesta execução; sem migração + RPC no BD, **não** se cumpre a regra “não testar antes de confirmar runtime **e** banco alinhados”.

*(Após aplicar manualmente os dois blocos SQL e repetir OpenAPI + um chute/saque de smoke com login na API pública, reclassificar para **EXECUÇÃO CONCLUÍDA E TESTE LIBERADO** num addendum ou novo relatório.)*

---

## 11. Conclusão objetiva

O **código** está versionado (`c25dd82`), etiquetado e **deployado** na Fly (v344). O **alinhamento da base de dados** em produção **não** foi realizado pelo agente e **não** está verificado; a prova objetiva (OpenAPI) mostra `chutes` ainda no modelo anterior. **Próximo passo obrigatório:** executar no Supabase, por ordem, (1) `database/migration-2026-03-31-chutes-v1-align.sql`, (2) função `solicitar_saque_pix_atomico` actualizada; depois revalidar schema e smoke E2E autenticado.
