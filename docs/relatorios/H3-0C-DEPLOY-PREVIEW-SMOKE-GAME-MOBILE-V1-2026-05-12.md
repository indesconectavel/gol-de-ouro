# H3.0C — DEPLOY PREVIEW + SMOKE /GAME MOBILE — V1

**Data:** 2026-05-15  
**Commit alvo (H3.0B):** `dac9f8b` — `fix: polir game mobile H3.0B`  
**Tag rollback:** `pre-h3-0b-game-mobile-2026-05-12`  
**Modo:** deploy preview controlado — **sem** `--prod` no projeto principal; **sem** alteração de backend, financeiro, admin, banco, `gameService`, `layoutConfig`, `handleShoot`; **sem** correção de código da app nesta etapa  

---

## 1. Resumo executivo

A **Missão 2 (build)** concluiu com **sucesso** em `dac9f8b`.

Foi realizada uma **alternativa técnica de deploy** sobre o **`dist`** já construído, usando apenas um `vercel.json` **mínimo de SPA fora do `goldeouro-player/vercel.json`** (`scripts/h3c-vercel-static-spa.json`, rotas `filesystem` → `index.html`). O primeiro link da CLI dentro de `dist/` criou automaticamente o projeto Vercel **`dist`** (nome genérico), com URL de deployment.

O **`npx vercel deploy` habitual a partir de `goldeouro-player/`** continuou **inviável**: o projeto remoto **`goldeouro-player`** tem **`rootDirectory: "goldeouro-player"`**, e com o CWD já em `.../goldeouro-backend/goldeouro-player` a CLI concatena um segundo `goldeouro-player` (caminho inexistente). Deploy a partir da **raiz** do repo tentou empacotar o monorepo inteiro e **excedeu 2 GiB** (mesmo explorando `.vercelignore`), não sendo concluído.

Os URLs obtidos responderam **`401 Unauthorized`** para acesso público (**`Invoke-WebRequest`** e browser MCP). O MCP abriu o **login da Vercel** (deployment protection / SSO à nível da organização), não o player. Logo, **Missões 5 e 6 (smoke autenticado `/game`, evidências visuais completas) não foram executáveis** nesta sessão sem alteração de política no dashboard Vercel ou deploy num projeto com preview público.

**Conclusão para “pode ir produção com segurança?”:** **Não** com o nível de evidência pedido — o bundle compila, mas **não há smoke visual autenticado em ambiente de browser real** validado aqui.

---

## 2. Estado Git

**Comandos:** `git status --short`, `git branch --show-current`, `git log -3 --oneline`, `git rev-parse HEAD`

| Item | Valor |
|------|--------|
| **Branch** | `fix/admin-financial-integrity-v1` |
| **HEAD** | `dac9f8ba012c13607116af7bf15d58a95d242c35` (`dac9f8b`) |
| **Últimos commits** | `dac9f8b` fix H3.0B; `079bfd6` docs pré-H3.0B; `b475647` docs H3.0A |
| **Working tree** | ` M goldeouro-player/vercel.json` (continua **fora** do commit H3.0B e **não** foi usado no deploy estático) |
| **Novos commits nesta etapa** | **Nenhum** (conforme regra) |

**Nota:** Pastas `goldeouro-player/dist` e `.vercel` eventualmente criadas pela CLI estão **gitignored**; não entram no repositório.

---

## 3. Build

**Diretório:** `goldeouro-player`  
**Comando:** `npm run build`  
**Resultado:** **SUCESSO** (2026-05-15, ~30s)

| Artefato (exemplo) | Observação |
|---------------------|------------|
| `dist/assets/index-*.js` | Bundle JS produção |
| `dist/assets/index-DMJTzLg7.css` | CSS (hash estável nesta execução) |
| PWA | `sw.js` + Workbox |

**Falha:** Não ocorreu — não se avançou para “parar sem deploy”.

---

## 4. Deploy preview Vercel

### 4.1 Tentativas no projeto `goldeouro-player` (falharam)

| Tentativa | Resultado |
|-----------|-----------|
| `cd goldeouro-player && npx vercel deploy --yes` | Erro: path `...\goldeouro-player\goldeouro-player` inexistente ( Root Directory remoto ) |
| `cd goldeouro-backend && npx vercel deploy` (com `.vercel` copiado para raiz) | Erro: tamanho do payload **> 2 GiB** (monorepo) |
| `.vercelignore` na raiz | Não reduziu de forma eficaz o tamanho calculado pela CLI (continuou **> 2 GiB**) |

### 4.2 Deploy estático a partir de `goldeouro-player/dist` (sucesso na CLI, bloqueio de acesso)

**Config local usada (não é `goldeouro-player/vercel.json`):** `scripts/h3c-vercel-static-spa.json` — apenas `filesystem` + fallback SPA.

**Comandos (resumo):**

```text
cd goldeouro-player/dist
npx vercel deploy --yes -A ../../scripts/h3c-vercel-static-spa.json
# redeploy com flag --public (deprecada; ver saída CLI)
npx vercel deploy --yes --public -A ../../scripts/h3c-vercel-static-spa.json
```

| Campo | Valor |
|-------|--------|
| **Projeto Vercel (criado/associado pela CLI)** | `goldeouro-admins-projects/dist` |
| **Organização** | `goldeouro-admins-projects` |
| **Branch Git** | N/A (deploy de pasta `dist` local, não integração Git) |
| **Commit usado (código fonte)** | `dac9f8b` (build gerado a partir deste HEAD) |
| **Horário (local)** | ~2026-05-15 17:00–17:10 -03:00 |
| **URL preview (última)** | `https://dist-b0tqoi7r5-goldeouro-admins-projects.vercel.app` |
| **URL inspect (última)** | `https://vercel.com/goldeouro-admins-projects/dist/5niV5rrDWwzujW6QE3veiFVHnFyw` |
| **URL deployment anterior (mesmo projeto)** | `https://dist-mt4t3f4tq-goldeouro-admins-projects.vercel.app` (inspect `852mT8aQukWrSLHitvP95tfy7Kxj`) |

**Importante:** A CLI reportou que a opção `--public` está **deprecada e ignorada**; proteção de build logs / paths especiais permanece. Na prática, **HTTP 401** para cliente sem cookie de org.

**Produção principal:** Não foi feito `vercel deploy --prod` no projeto **`goldeouro-player`** nem promoção para domínio principal `goldeouro.lol`.

---

## 5. Acesso ao preview

| Critério | Resultado |
|----------|-----------|
| App carrega (público) | **Não** — HTTP **401** |
| Erro USE_MOCKS em runtime | **Não verificável** — app não chegou a ser servida ao cliente anónimo |
| Login do player (`/`) | **Não verificável** idem |
| Tela branca | **Não verificável** idem |
| Console sem erro crítico no player | **Não verificável** idem |

**Evidência browser (MCP):** navegação para o host do deployment redirecionou para **`vercel.com/login`** (fluxo SSO / deployment protection).

**Evidência HTTP (PowerShell):** `Invoke-WebRequest` → **401 Unauthorized**.

---

## 6. Smoke desktop

| Item | Resultado |
|------|-----------|
| `/game` autenticado | **Não executado** (bloqueio 401 / sem sessão) |
| HUD, bola/zonas, botões | **Não observado** |

---

## 7. Smoke mobile portrait

| Item | Resultado |
|------|-----------|
| Overlay “Gire o celular” | **Não observado** |
| Palco não minúsculo / sem scroll indevido | **Não observado** |

---

## 8. Smoke mobile landscape

| Item | Resultado |
|------|-----------|
| Jogo, HUD compacto, botões inferiores, safe-area, alinhamento | **Não observado** |

---

## 9. Chute visual

| Item | Resultado |
|------|-----------|
| 1 chute em `/game` | **Não executado** — sem acesso à app |

---

## 10. Console e erros

| Contexto | Achado |
|----------|--------|
| Cliente público sobre URL preview | **401** — sem execução de JS do player |
| `vite preview` local (contexto H3.0B) | USE_MOCKS — **fora deste deploy**, já documentado em H3.0B |

---

## 11. Evidências

| Tipo | Descrição |
|------|-----------|
| **URLs** | Preview: `https://dist-b0tqoi7r5-goldeouro-admins-projects.vercel.app` • Inspect Vercel: link na secção 4.2 |
| **HTTP** | `Invoke-WebRequest` → 401 Unauthorized |
| **Browser MCP** | Redireccionamento para login Vercel (SSO); não há captura útil da UI Gol de Ouro |
| **Build log** | `npm run build` exit code 0; artefactos listados na secção 3 |
| **Emulação** | N/A (bloqueado antes da app) |

---

## 12. Problemas encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| **C1** | Alta | Projeto **`goldeouro-player`** na Vercel: `rootDirectory` incompatível com CWD típico do repo clone (`goldeouro-backend/goldeouro-player`). |
| **C2** | Alta | Deploy a partir da raiz do repo excede **limite de 2 GiB** empacotado pela CLI neste workspace. |
| **C3** | Alta | **Deployment Protection / SSO**: previews `*.vercel.app` retornam **401** para teste público; smoke automático/manual sem credenciais de org falha. |
| **C4** | Média | Deploy estático ligou projeto **`dist`** com nome não descritivo (risco de confusão operacional — considerar rename ou projeto dedicado tipo `player-h3-preview`). |
| **C5** | Info | `--public` na CLI está **deprecated** segundo output; não removeu protecção perceptível no teste HTTP. |

**Nenhuma evidência** nesta sessão de regressão específica H3.0B em `/game`; simplesmente **não houve observação**.

---

## 13. Classificação final

## **PRONTO COM RESSALVAS**

**Motivo:** build e empacotamento estão estáveis em `dac9f8b`, e existe deployment na Vercel (projeto **`dist`**), mas **o gate de segurança para produção definido pelo prompt (preview OK + smoke autenticado + critérios visuais) não foi cumprido** por **política de acesso Vercel (401)** e **limitações de deploy do projeto `goldeouro-player`**.

**Interpretação estrita dos critérios “PRONTO PARA DEPLOY PRODUÇÃO” do prompt:**

- **Não atingidos** nesta sessão (preview público KO; smoke KO).

Equivalente pragmático: **GO para produção principal só após** (a) resolver deploy preview acessível (ou usar dispositivo com sessão autorizada na org) **e** (b) repetir checklist H3.0C.

---

## 14. Próxima etapa recomendada

1. **Na Vercel (org `goldeouro-admins-projects`):** para o projeto usado para smoke (**`dist`** ou, preferível, projeto `goldeouro-player` corrigido), **ajustar Deployment Protection / SSO** para permitir previews **públicos** temporariamente OU testar **logado na org** num browser onde o SSO já exista.

2. **Corrigir configuração de projeto “oficial” (fora desta cirurgia, se aprovado):**  
   - Em **`goldeouro-player`** no dashboard Vercel, repor **`Root Directory`** vazio `.` **ou** alinhado ao modelo real do Git (mono vs subpasta única);  
   - Garantir **`.vercelignore` / inclusão apenas de `goldeouro-player`** no link Git, ou CI que publique apenas essa pasta.

3. **Repetir H3.0C:** `npm run build` → **`npx vercel deploy`** (preview) no projeto correto → smoke desktop + portrait + landscape + refresh + 1 chute visual (fluxo apenas visual).

4. **Limpeza opcional:** no dashboard Vercel, revisar projeto **`dist`** (nome e políticas) para evitar dispersão operacional.

5. **`goldeouro-player/vercel.json`:** continuar **sem** promoção até decisão explícita; não foi entrada no deploy estático aqui registrado.

---

**Registado por:** agente automatizado (Git + build + Vercel CLI + HTTP + browser MCP) • **Commits:** nenhum • **`--prod` no player principal:** não usado  
