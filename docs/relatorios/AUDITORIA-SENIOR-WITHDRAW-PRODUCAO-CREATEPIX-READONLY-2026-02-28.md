# Auditoria Sênior — /withdraw em produção ainda chama createPix (READ-ONLY)

**Data/hora:** 2026-02-28 (auditoria)  
**Modo:** READ-ONLY total (nenhum arquivo editado, nenhum commit/push, nenhuma alteração em Vercel/Fly via UI).  
**Objetivo:** Descobrir por que /withdraw em https://www.goldeouro.lol ainda chama PaymentService.createPix (/api/payments/pix/criar) em vez de /api/withdraw/request, mesmo após hotfix commit 8f4dec1 e limpeza de SW/cache.

---

## 1. O que está em produção de verdade (commit + bundle)

### 1.1 Deploy que serve www.goldeouro.lol

- **Vercel CLI:** Não foi executado nesta auditoria (READ-ONLY; sem acesso a `vercel whoami` / `vercel ls` / `vercel inspect`). Para confirmar com evidência direta: com CLI configurado, rodar no projeto do player:
  - `vercel project ls` (ou equivalente) para identificar o projeto ligado ao repo.
  - `vercel inspect https://www.goldeouro.lol` (ou listar deployments e checar qual está atribuído ao domínio de produção).
  - Anotar: **production branch** (geralmente `main`), **último deployment** para esse domínio e **commit SHA** do build.
- **No repositório (evidência indireta):**
  - **vercel.json** (goldeouro-player): `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `framework: "vite"`. Sem `rootDirectory`; o projeto Vercel que aponta para este repo deve ter **Root Directory** = `goldeouro-player` (senão o build usaria a raiz do monorepo).
  - **package.json** (goldeouro-player): `"build": "vite build"`; **prebuild:** `node scripts/inject-build-info.cjs`.
  - Não há no repo config explícita de domínio (www.goldeouro.lol); isso fica na UI da Vercel / DNS.

### 1.2 Código no branch `main` (fonte típica de produção)

Comandos executados (somente leitura):

```text
git log -1 --oneline main                    → 7afa349 fix(cors): allow goldeouro-player vercel previews
git log -1 --oneline hotfix/withdraw-real-endpoints → 8f4dec1 fix(withdraw): use real withdraw endpoints and reload profile
git rev-list --count main..hotfix/withdraw-real-endpoints → 1
git rev-list --count hotfix/withdraw-real-endpoints..main → 0
```

- **main** está em **7afa349** (CORS). O hotfix **8f4dec1** está **apenas** em `hotfix/withdraw-real-endpoints`; **não está em main**.
- **Conteúdo de Withdraw.jsx em main** (trecho):
  - Importa `paymentService`; **não** importa `withdrawService`.
  - `loadWithdrawalHistory`: usa `paymentService.getUserPix()`.
  - `handleSubmit`: usa `paymentService.createPix(amount, formData.pixKey, ...)`.
- **Arquivo withdrawService.js em main:** **não existe** (`git show main:goldeouro-player/src/services/withdrawService.js` → fatal: path exists on disk but not in 'main').
- **Conclusão:** Se produção faz build a partir de **main** (ou **origin/main**, também em 3ae3786/7afa349), o bundle **não** contém withdrawService nem as alterações de Withdraw.jsx do hotfix; o fluxo de saque em produção é o **antigo** (createPix → `/api/payments/pix/criar`).

### 1.3 Prova de runtime (bundle servido)

Sem rodar build nem acessar o site, a prova é **por inferência** do código que entra no build:

- **Bundle construído a partir de main (7afa349):**
  - **Contém:** `paymentService`, `createPix`, `getUserPix`, `/api/payments/pix/criar`, e em paymentService.js o log `[PaymentService] Criando PIX` (linha 99). Withdraw.jsx chama createPix no submit.
  - **Não contém:** `withdrawService.js`, `requestWithdraw`, `getWithdrawHistory`, `WITHDRAW_REQUEST`, `/api/withdraw/request` no fluxo de saque.
- **Bundle construído a partir de hotfix (8f4dec1):**
  - **Contém:** `withdrawService`, `requestWithdraw`, `getWithdrawHistory`, `/api/withdraw/request`, `/api/withdraw/history` no fluxo de saque; Withdraw.jsx **não** chama createPix no submit.
  - **Ainda contém** (para depósitos): `paymentService`, `createPix`, `/api/payments/pix/criar` em outros pontos (Pagamentos/depósito).

**Como validar no browser (evidência direta):**  
Em https://www.goldeouro.lol → DevTools → Network (Fetch/XHR) → abrir /withdraw → clicar "Solicitar Saque". Se aparecer **POST** para **/api/payments/pix/criar** (e não POST para /api/withdraw/request), o bundle é o **antigo**. Complementar: em Network, abrir o JS principal (ex.: `assets/index-*.js`) → Response → buscar `/api/withdraw/request` ou `withdrawService`. **Não encontrar** = bundle antigo; **encontrar** = bundle novo.

**Classificação do bundle em produção (com base em main não ter o hotfix):**  
**ANTIGO** — produção está servindo código que usa createPix no /withdraw, porque o commit do hotfix (8f4dec1) **não** está em main e a produção muito provavelmente faz build a partir de main.

---

## 2. Causa raiz — Por que produção ignora o hotfix

Cada hipótese com evidência e classificação **SIM / NÃO / PROVÁVEL**.

| Hipótese | Evidência | Resultado |
|----------|-----------|-----------|
| **A) Hotfix não está em main (PR não merged / produção builda main)** | `git log -1 main` = 7afa349; `git log -1 hotfix/withdraw-real-endpoints` = 8f4dec1; `main` não contém o arquivo `withdrawService.js` nem as alterações de Withdraw.jsx do hotfix. `git rev-list --count main..hotfix/withdraw-real-endpoints` = 1. | **SIM** — O hotfix **não** está em main. Se a Vercel usa **main** como production branch, o build de produção é a partir de 7afa349 e portanto **não** inclui o patch de saque. |
| **B) Vercel production branch não é main (ou fixo em commit antigo)** | No repo não há config da Vercel que defina production branch; isso fica na UI do projeto. Documentação e convenção do repo apontam para **main** como branch principal. Sem CLI/UI não dá para provar o branch exato. | **PROVÁVEL** — Se por algum motivo o projeto Vercel de produção estiver configurado com outro branch (ou commit fixo) antigo, o resultado seria o mesmo (bundle sem hotfix). A evidência forte continua sendo: **main não tem o hotfix**. |
| **C) Monorepo path/root errado (Vercel builda outra pasta)** | `vercel.json` está em **goldeouro-player/** com `buildCommand`, `outputDirectory: dist`, `framework: vite`. Não há `vercel.json` na raiz do monorepo que defina o player. O projeto Vercel que serve www.goldeouro.lol deve ter **Root Directory** = `goldeouro-player`. Se a raiz for a pasta do monorepo, o build falharia ou buildaria outro app. | **NÃO** (como causa do createPix) — Root errado tenderia a quebrar o build ou servir outro código; não explicaria “withdraw usa createPix” com o mesmo player. A causa é **conteúdo do branch** (main sem hotfix), não o path do monorepo. |
| **D) Cache/CDN/SW** | Headers em vercel.json: Cache-Control no-cache para HTML/JS; existe VitePWA (Service Worker) com precache. Mesmo após “limpeza de SW/cache”, se o **deploy** não foi refeito com o hotfix (main não atualizado), o conteúdo servido continua o do último build de main — ou seja, bundle antigo. Cache/SW podem atrasar a atualização, mas a **fonte** do bundle antigo é o build a partir de main. | **PROVÁVEL** (agravante) — Pode fazer com que usuários ainda vejam bundle antigo mesmo após merge; **não** é a causa primária de “produção ainda chama createPix”. Causa primária: **main sem hotfix**. |
| **E) Dois players/projetos e domínio aponta para o errado** | No repo há **goldeouro-player** (com Withdraw.jsx e vercel.json) e menções a **player-dist-deploy** com outro vercel.json. www.goldeouro.lol é associado ao “player” em documentação. Sem acesso à Vercel não dá para confirmar qual projeto está ligado ao domínio. | **NÃO** (improvável) — Se o domínio servisse outro projeto (ex.: admin), a página /withdraw seria outra ou não existiria. O comportamento “/withdraw chama createPix” é exatamente o do **código de main** do goldeouro-player. |

**Conclusão causa raiz:**  
**O hotfix (8f4dec1) não está em main. A produção (www.goldeouro.lol) faz build a partir de main (ou equivalente), portanto serve o bundle antigo em que Withdraw.jsx usa paymentService.createPix e getUserPix.** Cache/SW podem prolongar a exibição do bundle antigo após um futuro merge, mas não são a razão de o bundle atual ser o antigo.

---

## 3. Plano de correção — Mínimo risco (Preview → Produção)

### 3.1 Etapa 1 — Preview (segura)

- **Objetivo:** Ter um **preview deploy** que use o **bundle NOVO** (commit 8f4dec1 ou branch `hotfix/withdraw-real-endpoints`).
- **Ação:** Na Vercel, garantir que existe um deployment do branch **hotfix/withdraw-real-endpoints** (ou de um branch que já contenha 8f4dec1). Se não existir, fazer push do branch (já feito) e/ou “Redeploy” a partir desse branch no projeto do player.
- **Validação (somente Network):**
  1. Abrir a URL do **preview** em aba anônima; DevTools → Network → Fetch/XHR; Disable cache.
  2. Ir em **/withdraw**; carregar a página.
  3. Clicar em **Solicitar Saque** (valor e chave preenchidos).
  4. **Deve aparecer:** **POST** para **/api/withdraw/request** (e em seguida GET /api/user/profile e GET /api/withdraw/history).
  5. **Não deve aparecer:** **POST** para **/api/payments/pix/criar** no momento do clique em Solicitar Saque.
- **Checklist:** Se os itens 4 e 5 forem atendidos, o preview está com o bundle novo; prosseguir para a Etapa 2.

### 3.2 Etapa 2 — Produção (só depois do preview OK)

- **Objetivo:** Fazer com que **produção** use o mesmo código do preview (bundle novo), sem quebrar a versão estável.
- **Ação recomendada:**  
  1. **Merge** do PR de `hotfix/withdraw-real-endpoints` em **main** (apenas após validação do preview).  
  2. Aguardar o deploy automático de produção (ou disparar deploy de main no projeto Vercel do player).  
  3. Opcional: em **Settings → Git**, confirmar que **Production Branch** é `main` e que o domínio www.goldeouro.lol está atribuído a esse projeto.
- **Validação em produção:** Repetir o mesmo fluxo de Network em https://www.goldeouro.lol (aba anônima, Disable cache). Confirmar POST /api/withdraw/request e ausência de POST /api/payments/pix/criar no saque.
- **Rollback plan:** Se após o merge/deploy a produção quebrar ou o saque voltar a chamar createPix:  
  - **Revert** do merge em main: `git revert -m 1 <merge_commit_sha> --no-edit` (ou revert do commit 8f4dec1 se tiver sido merge linear) e **push** em main.  
  - Na Vercel, disparar **Redeploy** do deployment anterior estável (ou aguardar deploy do revert).  
  - Validar novamente em www.goldeouro.lol (Network: POST /api/withdraw/request vs createPix).  
  - Se o problema for apenas cache/SW: orientar usuários a hard refresh ou a desregistrar o Service Worker (Application → Service Workers) e recarregar.

### 3.3 Checklist de validação (Network)

| # | Onde | Ação | Esperado |
|---|------|------|----------|
| 1 | Preview | GET /withdraw | GET /api/user/profile + GET /api/withdraw/history |
| 2 | Preview | Clicar Solicitar Saque | POST /api/withdraw/request; depois GET profile + GET history |
| 3 | Preview | Mesmo momento | **Não** deve haver POST /api/payments/pix/criar |
| 4 | Produção | Idem 1–3 em www.goldeouro.lol | Mesmos critérios |

### 3.4 Rollback plan (resumo)

- **Gatilho:** Produção quebrada ou /withdraw voltando a chamar createPix após o deploy do hotfix.
- **Ação:** Revert do commit do hotfix em main + push; redeploy da Vercel a partir do novo main (ou deploy do revert).
- **Validação pós-rollback:** Em www.goldeouro.lol, confirmar que o app carrega e que o fluxo de saque volta ao comportamento anterior (ou que um novo hotfix será aplicado em seguida).

---

## 4. Hotfix mínimo no código (só se houver fallback/bug no código)

**Conclusão da auditoria:** No repositório **não** há feature flag nem fallback em Withdraw.jsx que force o uso de createPix no saque. No branch **hotfix/withdraw-real-endpoints** (e no working tree atual), Withdraw.jsx já usa apenas **withdrawService** (requestWithdraw + getWithdrawHistory) e **paymentService** só para getConfig() e isSandboxMode() (exibição). O problema é **exclusivamente** que o hotfix **não está em main**, então o build de produção não o inclui.

Portanto **não** é necessário propor alteração de código adicional para “remover createPix do fluxo de saque” ou “blindagem” dentro do Withdraw.jsx: o código correto já existe no hotfix; basta **incluir o hotfix em main** (merge) e redeploy.

Se no futuro quiser **blindagem** defensiva (opcional): no Withdraw.jsx, não chamar nunca `paymentService.createPix` no handleSubmit; e, se houver algum path que por engano chamasse createPix na rota /withdraw, poderíamos adicionar um log de erro e early return — isso seria um patch **adicional** e opcional, não a causa do problema atual.

---

## 5. Resumo executivo

- **O que está em produção:** Build a partir de **main** (commit 7afa349). Código de **main** em Withdraw.jsx usa **paymentService.createPix** e **getUserPix**; **withdrawService.js não existe** em main. Logo o bundle servido em www.goldeouro.lol é **ANTIGO** (chamadas a /api/payments/pix/criar no saque).
- **Causa raiz:** O hotfix **8f4dec1** (withdraw real endpoints) está apenas na branch **hotfix/withdraw-real-endpoints** e **não foi merged em main**. Produção builda a partir de main, portanto não inclui o patch.
- **Plano mínimo risco:** (1) Validar **preview** do branch hotfix (Network: POST /api/withdraw/request, sem POST pix/criar no saque). (2) Fazer **merge** do hotfix em main e deploy de produção. (3) Validar produção com o mesmo checklist. (4) Rollback: revert do merge em main + redeploy.
- **Checklist de validação:** Network em /withdraw: GET profile + GET withdraw/history no load; no submit: POST /api/withdraw/request e novos GET profile e GET history; **não** POST /api/payments/pix/criar no saque.
- **Rollback plan:** Revert do commit do hotfix em main, push, redeploy na Vercel; validar novamente o site.

Nenhum arquivo do repositório foi alterado. Auditoria 100% READ-ONLY.
