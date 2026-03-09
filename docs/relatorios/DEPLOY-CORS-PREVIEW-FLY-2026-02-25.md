# Deploy CORS Preview — Fly.io (auditoria)

**Data:** 2026-02-25  
**Objetivo:** Colocar em produção no Fly o commit **7afa349** (fix CORS para previews Vercel do player).  
**App:** `goldeouro-backend-v2`

---

## 1. Contexto

- **Commit alvo:** `7afa349` — `fix(cors): allow goldeouro-player vercel previews`
- **Alteração:** Em `server-fly.js`, a opção `origin` do middleware CORS passou a ser uma função que permite: (1) origem ausente; (2) lista de `parseCorsOrigins()`; (3) origens que casem com a regex `^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$`; (4) nega as demais.
- **Objetivo:** Previews do player na Vercel (`https://goldeouro-player-*.vercel.app`) passarem no preflight CORS; produção (goldeouro.lol, www) e admin inalterados.

---

## 2. Verificação do repositório e commit

| Verificação | Resultado |
|-------------|-----------|
| **Repositório** | Diretório do backend com `fly.toml` contendo `app = "goldeouro-backend-v2"`. ✅ |
| **git status** | Branch `main`; "Your branch is ahead of 'origin/main' by 1 commit"; apenas arquivos untracked (working tree limpa para deploy). ✅ |
| **git log -1 --oneline** | `7afa349 fix(cors): allow goldeouro-player vercel previews` ✅ |
| **HEAD = 7afa349** | Confirmado. Nenhum checkout/rebase necessário. ✅ |

---

## 3. Deploy no Fly — BLOQUEADO

### 3.1 Comandos executados

```bash
flyctl status --app goldeouro-backend-v2
```

### 3.2 Resultado (bloqueio)

```
Error: No access token available. Please login with 'flyctl auth login'
```

### 3.3 Conclusão

**Deploy não foi executado.** O ambiente local não possui token de acesso ao Fly.io (flyctl não autenticado).

### 3.4 Como destravar

1. **Fazer login no Fly.io:**  
   Executar no terminal (no mesmo ambiente em que rodará o deploy):
   ```bash
   flyctl auth login
   ```
   Seguir o fluxo no navegador para autorizar o flyctl (contas Fly.io / SSO).

2. **Confirmar acesso ao app:**  
   ```bash
   flyctl status --app goldeouro-backend-v2
   ```
   Deve listar o app e máquinas sem erro.

3. **Executar o deploy:**  
   No diretório raiz do backend (onde está o `fly.toml`), com HEAD em `7afa349` e working tree limpa:
   ```bash
   flyctl deploy --app goldeouro-backend-v2
   ```

4. **Registrar no relatório:**  
   - Número da release gerada (ex.: `v42`)  
   - Timestamp do deploy  
   - Resultado (success/fail)  
   - Em seguida, re-executar os testes de validação (curls) abaixo e atualizar a seção 4 e o GO/NO-GO.

**Não improvisar credenciais.** Usar apenas o login oficial via `flyctl auth login`.

---

## 4. Validação técnica (CURL preflight)

Executado contra o backend **atual** em produção (antes do deploy do commit 7afa349, pois o deploy foi bloqueado). Após realizar o deploy, **re-executar** estes testes e atualizar esta seção.

### 4.1 Ambiente dos testes

- **Data/hora:** 2026-02-25 (após bloqueio do deploy)
- **URL do backend:** `https://goldeouro-backend-v2.fly.dev`
- **Comando usado no Windows:** `curl.exe` (PowerShell)

### 4.2 A) Preview (ORIGIN placeholder)

**Comando:**

```bash
curl.exe -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-preview.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v
```

**Nota:** `https://goldeouro-player-preview.vercel.app` é um placeholder. Para validação final, usar a URL real de um preview (ex.: `https://goldeouro-player-<deployment-id>.vercel.app`).

**Resposta (trechos relevantes):**

```
< HTTP/1.1 204 No Content
< access-control-allow-credentials: true
< access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
< access-control-allow-headers: Content-Type,Authorization,X-Requested-With,X-Idempotency-Key
```

**Observação:** Na resposta **não** apareceu o header `access-control-allow-origin`. Isso é consistente com o backend **antes** do patch (origem de preview não permitida). **Após** o deploy do commit 7afa349, a mesma chamada deve retornar `access-control-allow-origin: https://goldeouro-player-preview.vercel.app` (ou a origem real enviada).

### 4.3 B) Produção (www.goldeouro.lol)

**Comando:**

```bash
curl.exe -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v
```

**Resposta (trechos relevantes):**

```
< HTTP/1.1 204 No Content
< access-control-allow-origin: https://www.goldeouro.lol
< access-control-allow-credentials: true
< access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
< access-control-allow-headers: Content-Type,Authorization,X-Requested-With,X-Idempotency-Key
```

**Conclusão:** Produção (www) está recebendo `Access-Control-Allow-Origin` corretamente. Status 204. ✅

### 4.4 Critérios de sucesso (para preencher após o deploy)

- [ ] **Preview:** Resposta OPTIONS com `Access-Control-Allow-Origin` refletindo exatamente o `Origin` enviado; status 200 ou 204.
- [x] **Produção www:** Resposta OPTIONS com `Access-Control-Allow-Origin: https://www.goldeouro.lol`; status 204. (já atendido no estado atual)

---

## 5. GO / NO-GO

| Critério | Status |
|----------|--------|
| Deploy do commit 7afa349 realizado no Fly | ❌ **NÃO** — bloqueado por falta de login (`flyctl auth login`) |
| Validação curl preview (header CORS) | ⏸️ Pendente deploy |
| Validação curl www | ✅ OK (estado atual) |

**Resultado:** **NO-GO** para “deploy concluído e validado”. O deploy não foi executado; é necessário autenticar com `flyctl auth login`, executar `flyctl deploy --app goldeouro-backend-v2` e, em seguida, re-executar os curls e preencher a seção 4 e este GO/NO-GO.

---

## 6. Rollback (pronto para uso após o deploy)

Quando o deploy do commit 7afa349 tiver sido realizado e for necessário reverter:

1. **Reverter o commit localmente:**  
   ```bash
   git revert 7afa349 --no-edit
   ```

2. **Fazer deploy da árvore revertida no Fly:**  
   ```bash
   flyctl deploy --app goldeouro-backend-v2
   ```

3. **Validar rollback:**  
   - **Preview:** OPTIONS com `Origin: https://goldeouro-player-<id>.vercel.app` deve voltar a **não** retornar `Access-Control-Allow-Origin`.  
   - **www:** OPTIONS com `Origin: https://www.goldeouro.lol` deve continuar retornando `Access-Control-Allow-Origin: https://www.goldeouro.lol`.

---

*Relatório de deploy e validação — 2026-02-25. Deploy bloqueado por credencial Fly; instruções de destravamento e rollback documentadas.*
