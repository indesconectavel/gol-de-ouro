# H2 — EXECUÇÃO CONTROLADA DE RUNTIME — GITCOMMIT

**Data:** 2026-05-14 (registo alinhado ao deploy Fly)  
**App:** `goldeouro-backend-v2`  
**Baseline pré-H2 (tag):** `pre-h2-runtime-traceability-2026-05-12` → `77464f5`  
**Cirurgia H2 (commit):** `7ecedca98d1f5d5d7c1878aa043ec724e422dd41`

---

## 1. Resumo executivo

Foi executado **deploy Fly controlado** com `--build-arg GIT_COMMIT=<SHA do HEAD local>`, correspondente ao commit **`7ecedca`** da branch `fix/admin-financial-integrity-v1`. Após o rollout, **`GET /meta`** passou a expor **`gitCommit` não nulo** e **igual ao SHA injetado**. **`GET /health`** mantém **200**. Endpoints admin anónimos respondem **401** (rota existente, não 404).

**Classificação (secção 12):** **APROVADO**.

---

## 2. Estado Git

| Comando | Resultado |
|---------|-------------|
| `git status --short` | ` M goldeouro-player/vercel.json`; vários `??` (não tocados nesta execução) |
| `git branch --show-current` | `fix/admin-financial-integrity-v1` |
| `git log -1 --oneline` | `7ecedca fix(ci): injetar GIT_COMMIT no deploy on-demand Fly (H2)` |
| `HEAD` | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` — **confere** com o pedido |

**Confirmado:** `goldeouro-player/vercel.json` **não** foi incluído em deploy nem alterado para esta missão.

---

## 3. SHA usado no deploy

| Fonte | Valor |
|--------|--------|
| `git rev-parse HEAD` (antes do `fly deploy`) | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` |

**Comando (PowerShell):**

```powershell
$sha = git rev-parse HEAD
fly deploy --remote-only --build-arg "GIT_COMMIT=$sha" --app goldeouro-backend-v2
```

---

## 4. Deploy Fly

| Campo | Valor |
|-------|--------|
| Estratégia | `--remote-only` (build remoto Depot) |
| App | `goldeouro-backend-v2` |
| Resultado CLI | **Exit code 0** — deploy concluído |
| URL de monitorização (Fly) | `https://fly.io/apps/goldeouro-backend-v2/monitoring` |

---

## 5. Release e imagem

| Campo | Valor |
|-------|--------|
| **Release Fly** | **v452** (`complete`, ~10s após listagem `fly releases`) |
| **Imagem (referência build log)** | `registry.fly.io/goldeouro-backend-v2:deployment-01KRM3KRNFSNAACC21P1FDP4P4` |
| **Digest manifest (log build)** | `sha256:0641ff0c199a0ad9c06f60ef0b4ce0f71b6f4429912ff1a97317a96775751a96` |
| **Machines atualizadas** | `784e047bd04e08` (**payout_worker**); `080e207b071048` (**app**) |
| **Horário** | Deploy concluído na mesma sessão que gerou **v452** (ordem de minutos; ver dashboard Fly para timestamp exato) |

---

## 6. Healthcheck

| Verificação | Resultado |
|-------------|-------------|
| `GET https://goldeouro-backend-v2.fly.dev/health` | **HTTP 200** |

---

## 7. Meta runtime

**Antes do deploy (referência):** `gitCommit`: **null**.

**Após o deploy:**

| Campo | Valor |
|-------|--------|
| HTTP | **200** |
| `data.version` | `1.2.1` (coerente com baseline anterior) |
| `data.build` | `2025-10-21` |
| `data.gitCommit` | **`7ecedca98d1f5d5d7c1878aa043ec724e422dd41`** |
| Igual ao SHA do deploy? | **Sim** (match exato) |

Corpo JSON observado (resumo):

```json
{"success":true,"data":{"version":"1.2.1","build":"2025-10-21","gitCommit":"7ecedca98d1f5d5d7c1878aa043ec724e422dd41","environment":"production",...}}
```

---

## 8. Endpoints mínimos

| Request | HTTP | Nota |
|---------|------|------|
| `GET /api/admin/chutes/recentes` (sem token) | **401** | Não 404 — rota ativa, auth exigida |
| `GET /api/admin/users/00000000-0000-0000-0000-000000000001` (sem token) | **401** | Idem |

---

## 9. Warnings

Durante o deploy, o Fly emitiu:

```text
WARNING The app is not listening on the expected address and will not be reachable by fly-proxy.
You can fix this by configuring your app to listen on the following addresses:
  - 0.0.0.0:8080
```

Seguido de **smoke / machine checks** com sucesso (**machines in a good state**). Trata-se de **ressalva operacional** já conhecida em histórico do projeto; **não** impediu health público **200** nem `/meta` correto após o rollout.

Outros avisos no log de build: `npm audit` / vulnerabilidades — **fora do escopo H2**.

---

## 10. Problemas encontrados

- **Nenhum bloqueante:** critérios de aprovação cumpridos (`/meta` com `gitCommit` real e alinhado ao SHA).

---

## 11. Rollback disponível

| Tipo | Ação |
|------|------|
| **Fly** | `fly releases -a goldeouro-backend-v2` e rollback para **v451** (ou imagem estável anterior) se necessário. |
| **Git** | Tag `pre-h2-runtime-traceability-2026-05-12` em `77464f5` como referência de baseline documental pré-cirurgia. |

---

## 12. Classificação final

**APROVADO**

| Critério | Cumprido |
|----------|----------|
| Deploy OK | Sim (v452) |
| `/health` 200 | Sim |
| `/meta` 200 | Sim |
| `gitCommit` não null | Sim |
| `gitCommit` = SHA usado | Sim |
| Admin anónimo 401, não 404 | Sim |

---

*Fim do relatório de execução controlada H2 — runtime real validado.*
