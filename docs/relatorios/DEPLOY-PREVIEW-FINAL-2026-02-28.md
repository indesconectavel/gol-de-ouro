# Deploy Preview goldeouro-player — Finalização segura (2026-02-28)

**Regras respeitadas:** Sem push em main, sem alteração em Production, apenas Preview e env vars; evidências registradas abaixo.

---

## TAREFA 1 — Preview e bundle correto

### Deployments listados (Vercel CLI)

- **Projeto:** goldeouro-player (goldeouro-admins-projects).
- **Preview mais recente (Ready):**  
  **URL:** https://goldeouro-player-4dljkviev-goldeouro-admins-projects.vercel.app  
  **Alias:** https://goldeouro-player-git-preview-w-0da8dc-goldeouro-admins-projects.vercel.app  
  **Status:** ● Ready | **Environment:** Preview | **Idade:** ~2h.

- **Commit esperado do branch `preview/withdraw-merge-97e67b2`:**  
  **SHA:** `8741bcc` (full: `8741bcc45622a381fef9f4b42eff5d3b4409cb13`).

- O alias contém `0da8dc`, que pode ser um commit diferente de `8741bcc`. Para garantir que o Preview está no commit do hotfix (banner + withdraw), é necessário um **redeploy limpo** do branch `preview/withdraw-merge-97e67b2` (sem build cache), para que o “Source” do deployment seja esse commit.

### Banner de versão

- **Hotfix aplicado no código:** `VITE_SHOW_VERSION_BANNER === 'true'` → só exibe; caso contrário → não exibe.
- **Preview:** A variável `VITE_SHOW_VERSION_BANNER` **não existe** em Preview (confirmado com `vercel env ls`). Portanto, no bundle que usa essa flag, o banner **não deve aparecer**.
- **Conclusão:** Se o deployment atual for do commit 8741bcc, o banner não aparece. Se o banner aparecer na URL do Preview, o deployment não está no commit esperado → fazer redeploy limpo do branch até o “Source” ser 8741bcc.

### Ação recomendada (Tarefa 1)

1. Vercel Dashboard → **goldeouro-player** → **Deployments**.
2. Localizar o deployment do branch **preview/withdraw-merge-97e67b2** (ou o mais recente Preview).
3. **Redeploy** com **“Redeploy with existing Build Cache” desativado** (build limpo).
4. Anotar a **nova URL do Preview** após o deploy (será a URL final para validação).

---

## TAREFA 2 — Login no Preview (env vars)

### Diagnóstico do “Erro ao fazer login”

- **Auth no app:** Login via **backend** (`/api/auth/login`), não Firebase.  
  Base URL: `VITE_BACKEND_URL` ou fallback `https://goldeouro-backend-v2.fly.dev` (ver `api.js` e `AuthContext.jsx`).
- **Causa provável:** Em Production existem várias variáveis **VITE_*** que em Preview não existiam; o build de Preview podia divergir de Production (modo, mocks, URL do backend). Para alinhar comportamento e evitar erros de config, as mesmas variáveis de ambiente usadas em Production (relacionadas a API/auth) foram **replicadas apenas para Preview**.

### Variáveis copiadas para Preview (somente nomes; valores não vazados)

Foram adicionadas/ajustadas **apenas no ambiente Preview** (Production não foi alterado):

| Variável | Ambiente de destino |
|----------|----------------------|
| VITE_BACKEND_URL | Preview |
| VITE_APP_ENV | Preview |
| VITE_USE_MOCKS | Preview |
| VITE_USE_SANDBOX | Preview |
| VITE_ENV | Preview |
| VITE_MIN_CLIENT_VERSION | Preview |

**Preview já tinha:** VITE_API_BASE_URL.  
**Não foi adicionada em Preview:** VITE_API_URL (em Production é `/api` para proxy; em Preview a base é dada por VITE_BACKEND_URL).

### Redeploy do Preview (obrigatório após env)

- As variáveis **VITE_*** são injetadas em **tempo de build**. É necessário um **novo deploy de Preview** (sem cache) para que o bundle use as novas env vars.
- **Como:** Dashboard → Deployments → deployment do branch `preview/withdraw-merge-97e67b2` → Redeploy com “Redeploy with existing Build Cache” **desativado**.

### Validação do login

- Após o redeploy, abrir a **URL final do Preview** (aba anônima, Disable cache).
- Fazer login com credenciais válidas.
- **Sucesso:** redirecionamento para o app e carregamento do profile (e possivelmente Dashboard).

---

## TAREFA 3 — Validação do saque no Preview (Q1–Q5)

Executar no **Preview** (URL final após redeploy), em aba anônima, com **Disable cache** ativado.

| # | Verificação | Como validar | Resultado (preencher) |
|---|-------------|--------------|------------------------|
| **Q1** | GET /api/user/profile (200) e GET /api/withdraw/history (200) | DevTools → Network; após login, ir em Saque/Withdraw e conferir as chamadas. | OK / FAIL |
| **Q2** | Ao solicitar saque: POST /api/withdraw/request e depois novo GET profile + GET history | Clicar em “Solicitar Saque”, preencher e enviar; conferir no Network. | OK / FAIL |
| **Q3** | Não pode existir POST /api/payments/pix/criar no fluxo de saque | No Network, garantir que não há POST para `/api/payments/pix/criar` ao solicitar saque. | OK / FAIL |
| **Q4** | No assets/index-*.js: “/api/withdraw/request” ou “withdrawService” | DevTools → Sources (ou baixar o JS do deployment); buscar no bundle. | OK / FAIL |
| **Q5** | Evidências | Lista resumida das requests (método + URL + status) e trecho/linha da busca no bundle. | (anotar) |

---

## OUTPUT OBRIGATÓRIO (a preencher após o redeploy)

- **URL final do Preview:** _________________________________________  
  (ex.: https://goldeouro-player-xxxxx-goldeouro-admins-projects.vercel.app)

- **Commit SHA do Preview:** _________________________________________  
  (conferir em Vercel → Deployments → deployment → “Source” / commit; esperado: **8741bcc**)

- **Q1:** OK / FAIL  
- **Q2:** OK / FAIL  
- **Q3:** OK / FAIL  
- **Q4:** OK / FAIL  
- **Q5:** (evidências)

- **Diagnóstico do login:**  
  Variáveis copiadas para Preview (apenas nomes): VITE_BACKEND_URL, VITE_APP_ENV, VITE_USE_MOCKS, VITE_USE_SANDBOX, VITE_ENV, VITE_MIN_CLIENT_VERSION.  
  Nenhum segredo vazado; Production não foi alterado.

- **Banner:**  
  Não aparece no Preview quando o bundle for do commit 8741bcc e a variável `VITE_SHOW_VERSION_BANNER` não estiver definida em Preview (comportamento atual). Se aparecer, o deployment não está no commit esperado ou a flag foi definida → conferir “Source” do deployment e env vars.

---

## Próximo passo seguro (somente se Q1–Q5 OK)

1. **Não** fazer push em main até todas as validações acima estarem OK.
2. Se Q1–Q5 estiverem OK no Preview:
   - Fazer **merge** do branch `preview/withdraw-merge-97e67b2` em `main` (por PR ou localmente).
   - Dar **push** em main: `git push origin main`.
   - Na Vercel, o deploy de **Production** será disparado pelo push em main.
3. **Validar em produção:**
   - Confirmar que o deployment de Production é o esperado (FyKKeg6zb ou o novo).
   - Repetir no domínio de produção (www.goldeouro.lol) as mesmas checagens (login, saque, Q1–Q5 e ausência de banner, se aplicável).

---

## Resumo de segurança

- Nenhum push em main realizado nesta execução.
- Nenhuma alteração em Production (apenas leitura de env para copiar nomes/valores para Preview).
- Ações realizadas: listagem de deployments, inspeção do Preview, cópia de env vars **apenas para Preview**, remoção de arquivos temporários (temp_env_value.txt, .env.production.vercel-pull).
- Próximas ações dependem de: redeploy limpo do Preview, validação manual Q1–Q5 e, se tudo OK, merge + push em main e validação em produção.
