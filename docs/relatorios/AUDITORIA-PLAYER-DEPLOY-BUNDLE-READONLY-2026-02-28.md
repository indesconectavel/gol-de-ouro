# Auditoria Player — Deploy/Bundle em Produção (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** ESTRITAMENTE READ-ONLY (nenhum arquivo editado, nenhum comando de escrita)  
**Objetivo:** Provar com evidências se produção (goldeouro.lol / Vercel) está servindo bundle antigo ou atual e mapear commit, símbolos, baseURL, divergências e checklist para redeploy seguro.

---

## A) Resumo executivo (não técnico)

**Conclusão:** O bundle em produção é o **antigo**. O patch que corrige a tela de saque (chamar o backend de saque em vez do de depósito PIX) **nunca foi commitado nem enviado ao repositório**. Existe apenas nas alterações locais (working tree). Por isso:

- Qualquer deploy a partir do que está no Git (origin/main ou HEAD) usa a versão **sem** o patch.
- Na versão publicada, ao clicar em "Solicitar Saque", o app chama o endpoint errado (criação de PIX de depósito) e o histórico usa lista de pagamentos PIX, não de saques.
- Para produção passar a usar o fluxo correto de saque, é necessário **commitar e fazer push** do patch (novo arquivo `withdrawService.js` + alterações em `api.js` e `Withdraw.jsx`), depois **fazer um novo deploy**. O Service Worker (PWA) pode manter cache de JS antigo até o usuário receber a nova versão do SW; isso é um segundo ponto de atenção após o deploy.

---

## B) Evidências

### FASE 0 — Repo e estrutura do player

| Item | Caminho / Conteúdo |
|------|--------------------|
| Raiz do player | `goldeouro-player/` (dentro do monorepo `goldeouro-backend`) |
| package.json | `goldeouro-player/package.json` — name: goldeouro-player, version: 1.2.0, scripts.build: "vite build", prebuild: inject-build-info |
| vite config | `goldeouro-player/vite.config.ts` — outDir: dist, VitePWA com workbox, registerType: 'autoUpdate' |
| vercel.json | `goldeouro-player/vercel.json` — buildCommand: "npm run build", outputDirectory: "dist", rewrites: /download → download.html, (.*) → index.html |
| environments.js | `goldeouro-player/src/config/environments.js` — production.API_BASE_URL = 'https://goldeouro-backend-v2.fly.dev' |
| apiClient.js | `goldeouro-player/src/services/apiClient.js` — baseURL: env.API_BASE_URL (env de environments.js) |
| Withdraw.jsx | `goldeouro-player/src/pages/Withdraw.jsx` |
| withdrawService.js | `goldeouro-player/src/services/withdrawService.js` |

---

### FASE 1 — Patch existe no repo atual (working tree)

**1.1 Arquivo withdrawService.js**

- **Existe no disco:** SIM — `goldeouro-player/src/services/withdrawService.js`
- **Trecho:** exporta `requestWithdraw` (POST `/api/withdraw/request`) e `getWithdrawHistory` (GET `/api/withdraw/history`), usa `API_ENDPOINTS.WITHDRAW_REQUEST` e `WITHDRAW_HISTORY` de `../config/api`

**1.2 Withdraw.jsx (arquivo atual no disco)**

- Importa `withdrawService` (linha 7): `import withdrawService from '../services/withdrawService'`
- Usa `withdrawService.getWithdrawHistory()` em `loadWithdrawalHistory` (linha 63)
- Usa `withdrawService.requestWithdraw({ valor, chave_pix, tipo_chave })` no submit (linhas 101–105)
- **Não usa** `paymentService.createPix` para o botão de saque no código atual

**1.3 createPix para saque**

- No **working tree**: Withdraw.jsx **não** chama createPix para saque; chama withdrawService.requestWithdraw.
- Em **paymentService.js** existe `createPix` (depósito PIX); não é usado na tela de saque na versão com patch.

**1.4 config/api.js (arquivo atual no disco)**

- Contém `WITHDRAW_REQUEST: '/api/withdraw/request'` e `WITHDRAW_HISTORY: '/api/withdraw/history'` (linhas 36–37)

**Conclusão FASE 1:** No **disco atual** o patch está presente e consistente. No **Git** (HEAD/origin) não está — ver FASE 2.

---

### FASE 2 — Commit local (fonte da verdade)

**2.1 Git status (saída literal)**

```
On branch main
Your branch is ahead of 'origin/main' by 1 commit.

Changes not staged for commit:
  modified:   goldeouro-player/src/config/api.js
  modified:   goldeouro-player/src/pages/Withdraw.jsx

Untracked files:
  ...
  goldeouro-player/src/services/withdrawService.js
```

**2.2 HEAD e branch**

- `git rev-parse HEAD` → `7afa349cf0104ce975a980183b2366f311f867ae`
- `git log -1 --oneline` → `7afa349 fix(cors): allow goldeouro-player vercel previews`
- `git branch --show-current` → `main`

**2.3 Commit que contém o patch**

- **Não existe.** O patch (withdrawService.js + alterações em Withdraw.jsx e api.js) está **apenas** no working tree.
- `git log -- goldeouro-player/src/services/withdrawService.js` → **nenhum commit** (arquivo nunca foi commitado).
- Em HEAD, `goldeouro-player/src/services/withdrawService.js` **não** existe no tree (`git ls-tree -r HEAD` não lista esse arquivo).

**2.4 Conteúdo de Withdraw.jsx e api.js no HEAD (o que está commitado)**

- **Withdraw.jsx em HEAD:**  
  - **Não** importa withdrawService.  
  - `loadWithdrawalHistory` usa `paymentService.getUserPix()` e trata `result.data` como array.  
  - `handleSubmit` usa `paymentService.createPix(amount, formData.pixKey, ...)` para o saque.  
  - Ou seja: fluxo antigo (depósito PIX).

- **api.js em HEAD:**  
  - Apenas `WITHDRAW: '/api/withdraw'`.  
  - **Não** contém `WITHDRAW_REQUEST` nem `WITHDRAW_HISTORY`.

**2.5 Diff do patch (working tree vs HEAD)**

- **api.js:** adiciona duas linhas:
  - `WITHDRAW_REQUEST: '/api/withdraw/request',`
  - `WITHDRAW_HISTORY: '/api/withdraw/history',`

- **Withdraw.jsx:**  
  - Adiciona `import withdrawService from '../services/withdrawService'`.  
  - Substitui `paymentService.getUserPix()` por `withdrawService.getWithdrawHistory()`.  
  - Substitui `paymentService.createPix(...)` por `withdrawService.requestWithdraw({ valor, chave_pix, tipo_chave })`.  
  - Ajustes de pós-sucesso (loadWithdrawalHistory + loadUserData, message vs error).

**2.6 origin/main**

- `git log -1 origin/main` → `3ae3786 Merge pull request #29 ...` (2026-02-06).  
- Nem origin/main nem HEAD contêm withdrawService.js nem as alterações de withdraw no Withdraw.jsx/api.js.

**Resumo FASE 2:** A “fonte da verdade” do patch é o **working tree local**. Nenhum commit no repositório (HEAD nem origin/main) contém o patch. Produção, ao fazer build a partir do Git, usa o bundle **antigo**.

---

### FASE 3 — Base URL e URL final em runtime (por código)

**3.1 environments.js**

- Produção escolhida quando hostname **não** é localhost nem staging/test (linhas 75–90).
- `environments.production.API_BASE_URL` = `'https://goldeouro-backend-v2.fly.dev'` (hardcoded).

**3.2 apiClient.js**

- `baseURL: env.API_BASE_URL` com `env = validateEnvironment()` → `getCurrentEnvironment()` de environments.js.
- Em produção (goldeouro.lol etc.) baseURL efetiva = `https://goldeouro-backend-v2.fly.dev`.

**3.3 api.js (endpoints)**

- Endpoints de withdraw no **patch**: `WITHDRAW_REQUEST`, `WITHDRAW_HISTORY` (paths relativos).
- No **HEAD**: só `WITHDRAW: '/api/withdraw'`; WITHDRAW_REQUEST/HISTORY não existem.

**3.4 Tabela: endpoint lógico → URL final em produção (com patch)**

| Endpoint lógico | Constante / path | URL final (produção) |
|-----------------|------------------|----------------------|
| Solicitar saque | WITHDRAW_REQUEST → `/api/withdraw/request` | `https://goldeouro-backend-v2.fly.dev/api/withdraw/request` |
| Histórico saques | WITHDRAW_HISTORY → `/api/withdraw/history` | `https://goldeouro-backend-v2.fly.dev/api/withdraw/history` |

Com o bundle **atual no Git** (sem patch), a tela de saque usa createPix → `.../api/payments/pix/criar` e getUserPix → `.../api/payments/pix/usuario`, não os endpoints de withdraw acima.

---

### FASE 4 — Service Worker / Cache / Workbox

**4.1 Presença de PWA/Workbox**

- **package.json:** `vite-plugin-pwa`, `workbox-window` (devDependencies).
- **vite.config.ts:** plugin `VitePWA` com:
  - `registerType: 'autoUpdate'`
  - `workbox.globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}']`
  - `workbox.runtimeCaching` para origem `.fly.dev` (NetworkFirst, cache 1h, status 0 e 200).
- **pwa-sw-updater.tsx:** usa `Workbox('/sw.js')`, escopo `/`, chama `wb.register()`.
- **useNotifications.js:** registra `/sw.js` manualmente em algum fluxo.
- Build gera `dist/sw.js` (e precache) via Workbox.

**4.2 Pode reter bundle antigo?**

- **Sim.** O SW faz precache dos assets (JS/CSS/HTML, etc.). Até que um novo deploy atualize o SW e o precache, clientes podem continuar recebendo o JS antigo.
- `registerType: 'autoUpdate'` atualiza o SW quando há nova versão, mas a primeira carga após deploy pode ainda ser antiga até o novo SW ativar e substituir o cache.

**4.3 Onde cacheia**

- Precache: arquivos que batem com `globPatterns` no build (ex.: chunks JS com hash).
- Runtime: API `.fly.dev` em `api-cache` (NetworkFirst, 1h).

**Evidência:** Qualquer verificação em produção que encontre no JS servido a string `withdrawService` ou `/api/withdraw/request` indica bundle novo; se encontrar apenas chamadas a createPix/getUserPix para a tela de saque, indica bundle antigo (e/ou SW servindo cache antigo).

---

### FASE 5 — Vercel / Deploy

**5.1 vercel.json**

- buildCommand: `npm run build`
- outputDirectory: `dist`
- framework: vite
- Sem rewrite para `/api`; rewrites só para SPA e /download.

**5.2 Scripts de build (package.json)**

- prebuild: `node scripts/inject-build-info.cjs || echo '...'`
- build: `vite build`

**5.3 Output e hashes**

- `vite.config.ts`: `outDir: 'dist'`, `emptyOutDir: true`. Vite gera chunks com hash no nome (ex.: `index-xxxxx.js`).
- **dist/** não existia no workspace durante a auditoria (não foi rodado build); não há evidência local de build id/hash.

**5.4 Como obter build id / hash em produção (sem executar nada)**

- Abrir goldeouro.lol, DevTools → Network, recarregar, identificar o JS principal (ex.: `assets/index-*.js`).
- Baixar o arquivo ou abrir no Sources e buscar no conteúdo:
  - **Bundle com patch:** presença de `withdrawService`, `requestWithdraw`, `/api/withdraw/request`, `WITHDRAW_REQUEST`.
  - **Bundle sem patch:** na tela de saque, uso de `createPix` e `getUserPix` para o fluxo de saque; ausência de `withdrawService` e `/api/withdraw/request`.
- Anotar o nome do arquivo (ex.: `index-ABC123.js`) como “hash/build id” do front para aquela implantação.

---

### FASE 6 — Instruções para evidência cruzada em produção (só leitura/verificação)

1. **Identificar o JS principal**  
   Em https://www.goldeouro.lol (ou URL de produção), abrir DevTools → Network → recarregar → filtrar por JS → identificar o chunk principal (ex.: `assets/index-*.js`).

2. **Buscar strings do patch no bundle**  
   Abrir o URL do chunk no navegador ou em Sources e buscar (Ctrl+F):
   - `withdrawService` ou `requestWithdraw` ou `getWithdrawHistory`
   - `/api/withdraw/request` ou `WITHDRAW_REQUEST`
   - Se **encontrar**: bundle contém o patch (ou está muito próximo).
   - Se **não encontrar** e, no mesmo fluxo, aparecer `createPix`/`getUserPix` usados para a tela de saque: bundle é o antigo.

3. **Registrar hash/nome do arquivo**  
   Anotar o nome exato do JS (ex.: `index-a1b2c3d4.js`) e a data/hora da verificação para correlacionar com deploys.

4. **Service Worker**  
   Em Application → Service Workers, ver se há SW registrado e qual escopo. Se houver, fazer um “Update” ou “Unregister” para teste e recarregar para ver se o JS muda (só para diagnóstico; não obrigatório).

---

## C) Matriz de hipóteses

| Hipótese | Status | Evidência |
|----------|--------|-----------|
| **Build antigo (patch não deployado)** | **CONFIRMADA** | Patch só no working tree; withdrawService.js nunca commitado; Withdraw.jsx e api.js no HEAD usam createPix/getUserPix e não têm WITHDRAW_REQUEST/HISTORY. |
| CORS | Possível como fator adicional | Não altera a conclusão de que o bundle atual no Git é antigo. |
| Backend (Fly) fora do ar / 503 | Possível para erros em runtime | Não explica ausência de chamadas a /api/withdraw/request; o app publicado nem chama esse endpoint. |
| SW/cache retendo JS antigo | Possível após um futuro deploy | VitePWA com precache e runtimeCaching; após commitar e deployar, alguns usuários podem ainda ver bundle antigo até o SW atualizar. |
| Branch/deploy diferente (ex.: preview vs prod) | Possível | origin/main e HEAD não contêm o patch; qualquer build a partir deles é antigo. |
| Ambiente/baseURL errado | Descartada para “qual URL” | baseURL em produção é Fly v2; o problema é qual **endpoint** o código chama (depósito vs saque), não o host. |

---

## D) Plano de correção com risco mínimo (sem executar)

1. **Commitar o patch**
   - Incluir no commit:
     - `goldeouro-player/src/services/withdrawService.js` (novo)
     - `goldeouro-player/src/config/api.js` (WITHDRAW_REQUEST, WITHDRAW_HISTORY)
     - `goldeouro-player/src/pages/Withdraw.jsx` (uso de withdrawService)
   - Mensagem sugerida (ex.): `fix(player): use withdraw endpoints for /withdraw (requestWithdraw, getWithdrawHistory)`

2. **Push para o branch usado no deploy**
   - Ex.: `git push origin main` (ou o branch que a Vercel usa para produção).

3. **Disparar deploy**
   - Deploy na Vercel a partir do branch atualizado (automático por push ou manual).

4. **Pós-deploy**
   - Verificar em produção (FASE 6) se o JS servido contém `withdrawService` e `/api/withdraw/request`.
   - Testar em aba anônima ou com “Disable cache” e, se possível, com SW desregistrado, para evitar cache antigo.
   - Na aba Network, confirmar que ao solicitar saque aparece POST para `https://goldeouro-backend-v2.fly.dev/api/withdraw/request`.

5. **Service Worker**
   - Se usuários reportarem comportamento antigo após o deploy, orientar a recarregar com “Hard reload” ou a desregistrar o SW (Application → Service Workers) e recarregar; considerar, no futuro, revisar estratégia de cache do SW para assets críticos (ex.: NetworkFirst para o chunk principal).

6. **Não alterar**
   - CORS no backend só se realmente necessário para o domínio de produção; não é a causa do “não chama o backend de saque” — a causa é o bundle antigo.

---

## Checklist técnico para redeploy seguro (ainda sem executar)

- [ ] Confirmar que os três arquivos do patch estão no working tree e que não há outros cambios indesejados (git status / git diff).
- [ ] Fazer commit apenas desses arquivos (e de documentação desejada), com mensagem clara.
- [ ] Verificar branch atual e para qual remote/branch será feito push (ex.: origin main).
- [ ] Fazer push e confirmar que o commit aparece no repositório remoto.
- [ ] Confirmar na Vercel qual branch e comando de build são usados para produção.
- [ ] Após o deploy, executar a verificação da FASE 6 (buscar `withdrawService`/`/api/withdraw/request` no JS de produção).
- [ ] Testar fluxo de saque em produção (solicitar saque e histórico) e inspecionar Network para POST/GET aos endpoints de withdraw no Fly.
- [ ] Opcional: anotar hash do chunk JS antes e depois do deploy para comparação.

---

## Comando de verificação (one-liner) para o futuro

Para garantir que o **código-fonte** no repo contém o patch (não substitui a verificação do bundle em produção):

```bash
git show HEAD:goldeouro-player/src/services/withdrawService.js >nul 2>&1 && git show HEAD:goldeouro-player/src/config/api.js | findstr "WITHDRAW_REQUEST" >nul 2>&1 && echo PATCH_PRESENTE || echo PATCH_AUSENTE
```

- **Windows (PowerShell):**  
  `if (git ls-tree -r HEAD --name-only | Select-String 'goldeouro-player/src/services/withdrawService.js') { git show HEAD:goldeouro-player/src/config/api.js | Select-String 'WITHDRAW_REQUEST'; if ($?) { 'PATCH_PRESENTE' } else { 'PATCH_AUSENTE' } } else { 'PATCH_AUSENTE' }`

- **Linux/macOS (bash):**  
  `(git show HEAD:goldeouro-player/src/services/withdrawService.js >/dev/null 2>&1 && git show HEAD:goldeouro-player/src/config/api.js | grep -q WITHDRAW_REQUEST && echo PATCH_PRESENTE) || echo PATCH_AUSENTE`

Interpretação: **PATCH_PRESENTE** = o commit atual tem withdrawService e endpoints de withdraw no api.js; **PATCH_AUSENTE** = não tem (bundle deployado a partir desse commit será o antigo).

---

## Conclusão final

**O bundle em produção parece antigo** porque:

1. O patch que faz a tela de saque usar os endpoints de withdraw (`/api/withdraw/request` e `/api/withdraw/history`) **nunca foi commitado**: o arquivo `withdrawService.js` é untracked e as alterações em `Withdraw.jsx` e `api.js` estão apenas como “modified”, não em nenhum commit.
2. No commit atual (HEAD) e em origin/main, a página Withdraw usa `paymentService.createPix` e `paymentService.getUserPix` para o fluxo de saque, ou seja, chama endpoints de **depósito** PIX, não os de **saque** do backend Fly.
3. Qualquer build gerado a partir do repositório (local HEAD ou origin/main) não inclui `withdrawService.js` nem as constantes `WITHDRAW_REQUEST`/`WITHDRAW_HISTORY` nem o uso delas em Withdraw.jsx; portanto o bundle é o antigo.
4. O Service Worker (VitePWA/Workbox) pode ainda servir cache antigo mesmo após um futuro deploy com o patch, até a atualização do SW e do precache — isso é um segundo fator a considerar após o primeiro deploy correto.

**Nenhum arquivo foi alterado nesta auditoria; apenas leitura e coleta de evidências.**
