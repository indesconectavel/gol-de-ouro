# Deploy e validação CORS Preview — Fly.io

**Data/hora:** 2026-02-25  
**App:** goldeouro-backend-v2  
**Objetivo:** Colocar em produção o commit 7afa349 (fix CORS para previews Vercel) e validar preflight para preview e www.

---

## 1) Pré-check

| Item | Comando | Resultado |
|------|---------|-----------|
| Diretório | `Test-Path fly.toml` no diretório do backend | fly.toml OK |
| git status | `git status` | Branch main, ahead of origin/main by 1 commit; apenas untracked |
| HEAD | `git log -1 --oneline` | **7afa349 fix(cors): allow goldeouro-player vercel previews** |
| flyctl | `flyctl --version` | flyctl.exe version 0.4.3 |
| Status antes do login | `flyctl status --app goldeouro-backend-v2` | **Erro:** No access token available. Please login with 'flyctl auth login' |

**Conclusão pré-check:** HEAD = 7afa349. Diretório e flyctl OK. Login necessário.

---

## 2) Autenticação no Fly

**Comando executado:** `flyctl auth login`

**Output:**

```
Opening https://fly.io/app/auth/cli/...

successfully logged in as indesconectavel@gmail.com
```

**Prova do login:** Em seguida foi executado `flyctl status --app goldeouro-backend-v2`:

```
App
  Name     = goldeouro-backend-v2
  Owner    = personal
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KGJTPXXGY02326QB6ZBRW94M

Machines
PROCESS      	ID            	VERSION	REGION	STATE  	ROLE	CHECKS
app          	2874551a105768	302    	gru   	started	    	1 total, 1 passing
app          	e82d445ae76178	302    	gru   	started	    	1 total, 1 passing
payout_worker	e82794da791108	302    	gru   	started
```

Status do app listado com sucesso (login OK).

---

## 3) Deploy — FALHOU (NO-GO)

**Comando executado:** `flyctl deploy --app goldeouro-backend-v2` (no diretório do backend)

**Output relevante:**

```
==> Verifying app config
Validating E:\Chute de Ouro\goldeouro-backend\fly.toml
✓ Configuration is valid
--> Verified app config
==> Building image
Waiting for depot builder...
==> Building image
Waiting for depot builder...
Error: failed to fetch an image or build from source: error building: ensure depot builder failed, please try again (status 403): Your account has overdue invoices. Please update your payment information: https://fly.io/dashboard/indesconectavel-gmail-com/billing
```

**Status final:** **ERRO** (exit code 1)  
**Motivo:** 403 — conta com faturas em atraso; é necessário atualizar a forma de pagamento no dashboard do Fly.io.  
**Release/versão gerada:** Nenhuma (deploy não concluído).

**Conclusão:** Deploy **não** foi aplicado na primeira tentativa (billing em atraso).

---

## 3bis) Segundo deploy (após regularização do billing)

**Data/hora:** 2026-02-25 (após pagamento das faturas)  
**Comando executado:** `flyctl deploy --app goldeouro-backend-v2` (PowerShell, diretório do backend)

**Status final:** **Sucesso** (exit code 0)

**Release/versão:** `deployment-01KJB5K9MPDYQ49P82YF2P3J3D`  
**Imagem:** `registry.fly.io/goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D` (61 MB)

**Resumo do output:** Config validada → build com Depot concluído → 3 máquinas atualizadas (rolling): 2874551a105768, e82d445ae76178 (app), e82794da791108 (payout_worker); todas em good state; DNS verificado. Aviso de "Metrics token unavailable" ao final (não impacta o deploy).

---

## 4) Validação CORS — Preflight OPTIONS (pós-deploy)

Comandos executados **após** o deploy bem-sucedido.

### Comandos executados

**A) Preview (ORIGIN fixo):**

```powershell
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**B) Produção www:**

```powershell
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

### Output A) Preview (headers) — pós-deploy

```
HTTP/1.1 204 No Content
content-security-policy-report-only: ...
cross-origin-opener-policy: same-origin
cross-origin-resource-policy: same-origin
...
access-control-allow-origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app
vary: Origin
access-control-allow-credentials: true
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
access-control-allow-headers: Content-Type,Authorization,X-Requested-With,X-Idempotency-Key
...
```

**access-control-allow-origin:** **https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app** — OK (critério atendido).

### Output B) Produção www (headers) — pós-deploy

```
HTTP/1.1 204 No Content
content-security-policy-report-only: ...
...
access-control-allow-origin: https://www.goldeouro.lol
vary: Origin
access-control-allow-credentials: true
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
access-control-allow-headers: Content-Type,Authorization,X-Requested-With,X-Idempotency-Key
...
```

**access-control-allow-origin:** **https://www.goldeouro.lol** — OK (sem regressão).

---

## 5) GO / NO-GO

| Critério | Esperado | Atual (pós-deploy) |
|----------|----------|---------------------|
| Deploy aplicado | Sucesso | **Sucesso** (release 01KJB5K9MPDYQ49P82YF2P3J3D) |
| Preview (A) com allow-origin | Sim | **Sim** — `access-control-allow-origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app` |
| www (B) com allow-origin | Sim | **Sim** — `access-control-allow-origin: https://www.goldeouro.lol` |
| HTTP status preflight | 204 (ou 200) | 204 em ambos |

**Resultado:** **GO**

Todos os critérios foram atendidos após o segundo deploy (após regularização do billing).

---

## 6) Rollback (pronto — não executado)

Caso, após um deploy futuro bem-sucedido, seja necessário reverter o fix CORS:

1. **Reverter o commit localmente:**  
   `git revert 7afa349 --no-edit`

2. **Deploy da árvore revertida:**  
   `flyctl deploy --app goldeouro-backend-v2`

3. **Validar:**  
   - Curl (A) com Origin de preview deve voltar a **não** retornar `access-control-allow-origin`.  
   - Curl (B) com Origin https://www.goldeouro.lol deve continuar retornando `access-control-allow-origin: https://www.goldeouro.lol`.

Não executar rollback automaticamente; apenas aplicar se o usuário solicitar.

---

## 7) Resumo

- **Login Fly:** OK (flyctl auth login concluído).  
- **Deploy (1ª tentativa):** Falhou — 403 (faturas em atraso).  
- **Deploy (2ª tentativa, após pagamento):** **Sucesso** — release `deployment-01KJB5K9MPDYQ49P82YF2P3J3D`, 3 máquinas em good state.  
- **Preview (curl A) pós-deploy:** 204, **com** `access-control-allow-origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`.  
- **www (curl B) pós-deploy:** 204, **com** `access-control-allow-origin: https://www.goldeouro.lol` (sem regressão).  
- **GO/NO-GO:** **GO** — patch CORS em produção e validação concluída.
