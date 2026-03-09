# Investigação read-only — Regressão /game (Vercel x Fly)

**Data:** 2026-03-06  
**Modo:** Somente leitura (nenhuma alteração de código, commit, deploy, Vercel ou Fly).  
**Objetivo:** Provar com evidência se a regressão do /game (layout diferente, barra de versão, login quebrado) vem de **(A)** troca/promoção no Vercel, **(B)** mudança no Fly (backend), ou **(C)** rewrite/DNS apontando para projeto errado.

---

## Conclusão

**Conclusão principal: (A) — A regressão vem de troca/promoção no Vercel (frontend).**

- **Quem serve /game:** 100% Vercel (frontend). Headers mostram `server: Vercel`, `x-vercel-id`, `x-vercel-cache: HIT`. O Fly (backend) não serve HTML do /game.
- **Deployment de produção atual:** `ez1oc96t1` (promovido há ~1 dia). O deployment **FyKKeg6zb** **não** aparece na lista de deployments de produção do projeto `goldeouro-player` (20 mais recentes). Ou seja, o domínio (www/app/goldeouro.lol) está apontando para um deployment diferente do FyKKeg6zb — consistentemente com uma promoção recente para outro build.
- **Fly:** Não é causa da regressão de layout/barra de versão/login; o backend só serve API. Último release bem-sucedido em produção no Fly é v305 (Feb 25); máquinas estão em v312 (com releases v306–v312 falhando).
- **(C)** Não há evidência de DNS/rewrite apontando para *projeto* errado: o domínio está no Vercel, projeto correto (goldeouro-player). A “direção errada” é para outro *deployment* (ez1oc96t1 em vez de FyKKeg6zb), o que se enquadra em (A).

---

## Evidências

### PASSO 1 e 6 — Fingerprint /game e /dashboard

- **URLs:** `https://www.goldeouro.lol/game`, `https://www.goldeouro.lol/dashboard`
- **Status:** 200 em ambos.
- **Headers (exemplo /game):**
  - `server`: Vercel  
  - `cache-control`: no-cache, no-store, must-revalidate  
  - `x-vercel-id`: gru1::… (valor varia por request)  
  - `x-vercel-cache`: HIT  
  - `content-type`: text/html; charset=utf-8  
- **Bundle JS no HTML:** `/assets/index-qIGutT6K.js` (mesmo em before e after).
- **SHA256 do HTML:**
  - Before: `/game` e `/dashboard` → `bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0`
  - After: idêntico.
- **Comparação before/after:** Nenhuma mudança espontânea durante a investigação (mesmo hash; apenas `x-vercel-id` muda por request).

Anexos: `game-fingerprint-before.json`, `game-fingerprint-after.json`.

### PASSO 2 — Quem está servindo /game

- **Conclusão:** O /game é servido pelo **Vercel (frontend)**, não pelo backend (Fly).
- **Evidência:** Presença de `server: Vercel`, `x-vercel-id`, `x-vercel-cache`, ausência de headers típicos de backend (ex.: fly.io, x-request-id do Express). O HTML é o shell SPA (index com `index-qIGutT6K.js`), característico de frontend estático no Vercel.

### PASSO 3 — Snapshot Fly (read-only)

- **App:** goldeouro-backend-v2  
- **Hostname:** goldeouro-backend-v2.fly.dev  
- **Releases (últimas 15):** v312–v298 listadas; v305 (Feb 25) e v302, v301, v297… complete; v312, v311, … v306 failed.  
- **Status:** Máquinas em **v312** (uma app started, uma stopped, payout_worker started); imagem: `goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM`.

Anexo: `fly-releases-snapshot.json`.

### PASSO 4 — Snapshot Vercel (read-only)

- **Vercel CLI:** Disponível (usado a partir do workspace linkado ao projeto goldeouro-player).
- **Projetos:** goldeouro-player (prod: app.goldeouro.lol), goldeouro-backend, goldeouro-admin (admin.goldeouro.lol), indes.
- **Domínios:** goldeouro.lol (Vercel NS, 183d).

Anexos: `vercel-project-snapshot.json`, `vercel-deployments-snapshot.json`.

### PASSO 5 — FyKKeg6zb vs produção atual

- **Deployments de produção (goldeouro-player):** Listados 20 mais recentes; o **primeiro** (produção atual) é **ez1oc96t1** (1d).
- **FyKKeg6zb:** **Não** aparece na lista de deployments de produção. Conclusão: o domínio **não** está apontando para FyKKeg6zb; está apontando para **ez1oc96t1** (ou outro deployment promovido).
- Em relatório anterior (PROVA-FYKKeg6zb-GAME-READONLY-2026-03-04), a URL direta do deployment FyKKeg6zb retornou **404 DEPLOYMENT_NOT_FOUND**, indicando que o deployment pode ter expirado ou sido removido. Mesmo assim, a lista atual de *production* não contém FyKKeg6zb, reforçando que a “regressão” é vista porque produção foi promovida para outro deployment (ez1oc96t1), não porque o DNS aponta para outro projeto.

---

## Plano cirúrgico recomendado (não executado)

Para **congelar produção no FyKKeg6zb** (somente leitura aqui; executar manualmente se desejado):

1. **Confirmar se FyKKeg6zb ainda existe**
   - No Vercel Dashboard: Team/Account → projeto **goldeouro-player** → **Deployments**.
   - Buscar por deployment com ID **FyKKeg6zb** (ou URL `…-FyKKeg6zb-…`). Se aparecer 404 ao abrir a URL do deployment, ele pode ter expirado.

2. **Se FyKKeg6zb existir na lista**
   - Abrir esse deployment → **Promote to Production**.
   - Aguardar propagação e invalidar cache se necessário (Vercel costuma atualizar rápido).
   - Validar em https://www.goldeouro.lol/game (e se aplicável app.goldeouro.lol) que o layout/versão/login voltaram ao esperado.

3. **Se FyKKeg6zb não existir (expirado/removido)**
   - Não é possível “congelar” nesse ID sem redeploy.
   - Opções: (a) no repositório do player, fazer checkout do commit que gerou FyKKeg6zb e fazer novo deploy; (b) identificar outro deployment antigo listado em produção que corresponda ao build desejado e promover esse (ex.: p4epfrx3w, 28d).

4. **Não alterar**
   - Fly (backend): não é necessário para reverter layout/barra de versão/login do /game.
   - DNS/domínios: manter como estão (goldeouro.lol → Vercel).

---

## Anexos (paths relativos a docs/relatorios/)

| Anexo | Descrição |
|-------|-----------|
| `game-fingerprint-before.json` | Fingerprint (status, headers, preview HTML, sha256) de /game e /dashboard — antes |
| `game-fingerprint-after.json`  | Fingerprint de /game e /dashboard — depois (hashes iguais) |
| `vercel-project-snapshot.json` | Projetos e domínios Vercel (projects ls + domains ls) |
| `vercel-deployments-snapshot.json` | Deployments de produção goldeouro-player (FyKKeg6zb ausente; atual ez1oc96t1) |
| `fly-releases-snapshot.json`  | Releases e status do app goldeouro-backend-v2 no Fly |

---

## Resumo em uma linha

**A regressão do /game vem do Vercel (A): produção está no deployment ez1oc96t1; FyKKeg6zb não é o deployment de produção e não aparece na lista de prod; reverter exige promover FyKKeg6zb (ou o commit correspondente) a produção no Vercel, sem mudar Fly nem DNS.**
