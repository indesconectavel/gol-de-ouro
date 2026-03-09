# REANCORAGEM DO BASELINE FYKKEG6ZB — Relatório de Auditoria Read-Only

**Projeto:** Gol de Ouro  
**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, deploy, push, merge, banco, Fly ou Vercel)  
**Branch de auditoria:** audit/reanchor-fykkeg6zb (criada a partir de main)

---

## 1. Resumo executivo

A auditoria confirmou que existem **duas bases distintas**: (1) a **baseline validada** FyKKeg6zb (bundle index-qIGutT6K.js, commit inferido 0a2a5a1), designada como referência oficial e rollback; (2) a **base Git atual** que alimenta os previews (main em b66867f, feature branches à frente de 7c8cf59). O deploy FyKKeg6zb **não** está vinculado a um branch/commit Git visível na Vercel (origem provável: deploy manual ou build antigo); na listagem de produção o deployment atual é **ez1oc96t1** (commit 7c8cf59), e FyKKeg6zb não aparece na lista por ID curto (equivalente ao deployment m38czzm4q, id longo dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX). A branch **production-mirror/ez1oc96t1** espelha a **produção atual** (ez1oc96t1), **não** a baseline FyKKeg6zb. O repositório **não** está reancorado na baseline validada: main e as feature branches estão à frente do commit inferido da baseline. **Status final: REANCORAGEM NECESSÁRIA.**

---

## 2. O que é o FyKKeg6zb

| Item | Valor / conclusão |
|------|-------------------|
| **Identidade** | Deployment do projeto Vercel **goldeouro-player** com id longo **dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX**. Na listagem por id curto aparece como **m38czzm4q** (vercel-deployments-50.json: inspeção de www retorna esse deployment para aliases www/app/goldeouro.lol). |
| **Origem** | **Não determinável com exatidão.** Commit SHA não é exposto pela Vercel na documentação local. **Commit inferido:** 0a2a5a1 (Merge PR #18, 2025-11-15) ou 7dbb4ec (fix CSP, 2025-11-15). Build date observado: **16 Jan 2026** (Last-Modified do bundle). |
| **Branch de origem inferida** | main. |
| **Rastreabilidade** | Não há evidência local de deploy manual (CLI) que tenha gerado FyKKeg6zb; a associação commit ↔ deployment só seria confirmada via API/dashboard Vercel. |
| **Bundle** | index-qIGutT6K.js, index-lDOJDUAS.css. |
| **Status na lista de produção** | FyKKeg6zb_present: **false** (vercel-deployments-snapshot.json); current_production_deployment_id: **ez1oc96t1**. Ou seja, o deployment “validado” não é o current em produção; o current é ez1oc96t1. |
| **URL direta** | FyKKeg6zb_direct_url_status: **404** (vercel-deployments-50.json). |

**Conclusão:** FyKKeg6zb é a **baseline oficial validada** pelos relatórios e o alvo de rollback; o código exato que a gerou existe localmente no commit **0a2a5a1** (ou 7dbb4ec), mas o Git atual (main e feature branches) está **à frente** dessa base.

---

## 3. O que está gerando os previews atuais

| Pergunta | Resposta |
|----------|----------|
| **Qual pasta/frontend gera os previews?** | **goldeouro-player** (dentro do repositório goldeouro-backend, path `goldeouro-player/`). O projeto Vercel está ligado ao repositório com **Root Directory = goldeouro-player**. |
| **É o mesmo frontend validado?** | **Sim**, é o mesmo projeto (goldeouro-player), mas **não** o mesmo **estado de código**. Os previews são builds a partir das branches (ex.: feature/bloco-c-auth, feature/bloco-d-balance-profile-payments, feature/bloco-a-financial); essas branches têm código **diferente** do commit inferido da baseline (0a2a5a1). |
| **Configuração Vercel** | vercel.json em goldeouro-player: buildCommand `npm run build`, outputDirectory `dist`, framework `vite`. Coerente com o build que gera os bundles. |
| **Concorrência** | Não há outro frontend concorrente no repositório que seja deployado no mesmo projeto Vercel. Existe `player-dist-deploy` (vercel.json no workspace) como candidato alternativo; os relatórios e o projeto vinculado à produção referem-se a **goldeouro-player**. |

**Conclusão:** Os previews atuais vêm do **mesmo** frontend (goldeouro-player), mas do **código** das branches de feature (e de main quando há deploy a partir de main). Esse código está **à frente** da baseline FyKKeg6zb.

---

## 4. Diferenças entre baseline e Git atual

### 4.1 Commits e branches

| Referência | Commit | Observação |
|------------|--------|------------|
| **Baseline FyKKeg6zb (inferido)** | 0a2a5a1 (ou 7dbb4ec) | Último commit no player antes da lacuna 2025-11-15 a 2026-02-05; build 16 Jan 2026. |
| **Produção atual (ez1oc96t1)** | 7c8cf59 | Merge PR #30 (hotfix/ledger-userid-fallback). |
| **main** | b66867f | Merge PR #31 (release/frontend-player-demo-2026-03-06). À frente de 7c8cf59. |
| **production-mirror/ez1oc96t1** | 7c8cf59 | Espelho exato da produção **atual** (ez1oc96t1), não da baseline. |
| **audit/reanchor-fykkeg6zb** | b66867f | Criada a partir de origin/main para esta auditoria. |
| **feature/bloco-c-auth** | 25587da | feat(auth): estabiliza fluxo do BLOCO C. |
| **feature/bloco-d-balance-profile-payments** | 5f4322c | feat(balance): estabiliza fluxo do BLOCO D. |
| **feature/bloco-a-financial** | 5c611fa | feat(financial): estabiliza fluxo do BLOCO A. |

### 4.2 Arquivos do player: 0a2a5a1 vs production-mirror/ez1oc96t1

Divergências no path `goldeouro-player/` entre o commit inferido da baseline e o espelho da produção atual:

- goldeouro-player/package-lock.json  
- goldeouro-player/package.json  
- goldeouro-player/src/pages/GameShoot.jsx  
- goldeouro-player/src/pages/Pagamentos.jsx  
- goldeouro-player/src/services/gameService.js  

### 4.3 Arquivos: production-mirror/ez1oc96t1 vs main

- .github/workflows/frontend-deploy.yml  
- goldeouro-player/src/config/api.js  
- goldeouro-player/src/pages/Pagamentos.jsx  
- goldeouro-player/src/pages/Withdraw.jsx  
- goldeouro-player/src/services/withdrawService.js  
- (e documentação em docs/relatorios)

**Conclusão:** Há diferenças de código e de dependências entre a baseline inferida, o espelho da produção atual e main; os previews das feature branches partem de bases que **não** coincidem com o código da baseline FyKKeg6zb.

---

## 5. Origem do banner / layout antigo

| Item | Conclusão |
|------|-----------|
| **Arquivos do banner** | **VersionBanner.jsx** (goldeouro-player/src/components/VersionBanner.jsx) e **VersionWarning.jsx** (goldeouro-player/src/components/VersionWarning.jsx). VersionBanner usa `import.meta.env.VITE_BUILD_VERSION/DATE/TIME`; não há condicional que desative em produção. |
| **Onde é usado** | VersionBanner: Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx, Dashboard.jsx, Profile.jsx, Pagamentos.jsx. VersionWarning: App.jsx (global). |
| **Por que aparece nos previews e não no Current validado?** | O “Current validado” a que o operador se refere é o **FyKKeg6zb** (bundle index-qIGutT6K.js). Na documentação, a **produção validada** é descrita com “login sem banner verde”. No código **atual** (main e feature branches), Login e outras páginas **sempre** montam VersionBanner; não há flag que o remova em produção. Portanto: ou (a) no build da baseline (0a2a5a1) o VersionBanner não estava presente ou não era exibido (ex.: variáveis de build não definidas), ou (b) a descrição “sem banner” refere-se a outro estado. Nos **previews** atuais o código inclui VersionBanner → o banner reaparece. |
| **Layout antigo** | O “layout antigo” nos previews pode vir de: (1) uso de **GameShoot** em `/game` no código atual, enquanto a baseline não documenta se `/game` era Game ou GameShoot; (2) diferenças de CSS/componentes entre o bundle index-qIGutT6K e os builds atuais (index-DVt6EjKW.js em ez1oc96t1). compare-preview-vs-baseline-risk.json registra “VersionWarning ativo no preview; baseline validada sem esse comportamento”. |

**Conclusão:** O banner verde vem de **VersionBanner.jsx** e **VersionWarning.jsx** no código que alimenta os previews; a baseline validada (FyKKeg6zb) é descrita sem esse comportamento, portanto a diferença é **código divergente** (e possivelmente env de build).

---

## 6. Possíveis causas da falha de login no preview

| Causa | Evidência / probabilidade |
|------|----------------------------|
| **Código divergente** | Contrato de login (POST /api/auth/login, payload, tratamento de erro) está alinhado entre frontend e backend (server-fly.js). Não há indício de bug de lógica que quebre login apenas em preview. |
| **Env divergente** | **Em localhost:** DIAGNOSTICO-LOGIN-BRANCH-ESPELHO-EZ1OC96T1: o frontend usa **environments.js**, que por **hostname** define API_BASE_URL: localhost → `http://localhost:8080`; produção → `https://goldeouro-backend-v2.fly.dev`. Em localhost, sem backend na 8080, a requisição falha por rede → “Erro ao fazer login”. **Em preview (URL Vercel):** o hostname é do tipo `*.vercel.app`, não `goldeouro.lol`; o código cai no `else` de environments.js e usa produção (`goldeouro-backend-v2.fly.dev`). Se no Vercel as variáveis de **Preview** forem diferentes das de **Production** (ex.: VITE_BACKEND_URL ou outro override), o preview poderia apontar para outro backend ou URL incorreta. |
| **CORS** | Se o backend (Fly) não permitir a origem do domínio de preview (ex.: `goldeouro-player-xxx-goldeouro-admins-projects.vercel.app`), o login falharia por CORS. Não foi feita verificação ao vivo de CORS nesta auditoria. |
| **Conclusão** | **Local:** falha de login por **env/local** (backend 8080 não disponível). **Preview (Vercel):** mais provável **env** (variáveis de Preview diferentes) ou **CORS**; menos provável apenas código. |

---

## 7. Situação real da branch mirror

| Pergunta | Resposta |
|----------|----------|
| **production-mirror/ez1oc96t1 representa a produção validada (FyKKeg6zb)?** | **Não.** Representa a **produção atual** (deploy ez1oc96t1, commit 7c8cf59). A baseline validada é FyKKeg6zb (commit inferido 0a2a5a1). |
| **O que a branch mirror espelha?** | O commit **7c8cf59** que gerou o deploy **ez1oc96t1** (documentado em CRIACAO-ESPELHO-EXATO-PRODUCAO-EZ1OC96T1-2026-03-08). |
| **Para espelhar a baseline FyKKeg6zb** | Seria necessário uma branch apontando para **0a2a5a1** (ou 7dbb4ec), por exemplo `baseline-mirror/fykkeg6zb` ou equivalente, **não** a production-mirror/ez1oc96t1. |

**Conclusão:** A branch **production-mirror/ez1oc96t1** está correta como espelho da **produção atual** (ez1oc96t1), mas **não** é espelho da baseline validada FyKKeg6zb.

---

## 8. Riscos atuais do projeto

| Risco | Gravidade | Descrição |
|-------|-----------|-----------|
| **Duas bases** | Alta | Baseline validada (FyKKeg6zb) e base Git que gera previews/main são diferentes; validação dos BLOCOs em preview não é feita sobre a mesma base que o operador validou. |
| **Previews não reancorados** | Alta | Previews nascem de feature branches (e main) que estão à frente da baseline; exibem banner, layout e possivelmente falha de login, impedindo validação confiável. |
| **Commit exato da baseline desconhecido** | Média | SHA do FyKKeg6zb não está na documentação; só existe inferência (0a2a5a1/7dbb4ec). Confirmação exigiria API Vercel ou build local comparado ao fingerprint. |
| **FyKKeg6zb fora da lista de produção** | Média | Rollback para FyKKeg6zb exige localizar o deployment (ex.: m38czzm4q) ou redeploy a partir do commit inferido e validar fingerprint. |
| **Login em preview** | Média | Falha pode ser CORS ou env de Preview no Vercel; sem correção, impossível validar fluxo de auth nos previews. |

---

## 9. Plano recomendado para reancoragem

*(Apenas recomendação; nenhuma ação foi executada.)*

1. **Definir a base de reancoragem**  
   - Opção A: usar o **commit inferido 0a2a5a1** (ou 7dbb4ec) como proxy da baseline.  
   - Opção B: obter o **git source revision** do deployment FyKKeg6zb via API/dashboard Vercel e usar esse SHA.

2. **Validar fingerprint**  
   - Fazer checkout do commit escolhido, rodar `vite build` em goldeouro-player com env de produção e comparar o hash do JS/CSS gerado com **qIGutT6K** e **lDOJDUAS**. Se não coincidir, testar 7dbb4ec ou ancestrais.

3. **Branch de baseline**  
   - Criar branch (ex.: `baseline/fykkeg6zb`) a partir do commit validado pelo fingerprint, para referência e para que novas features sejam branchadas a partir dela, se a decisão for “previews nascem da baseline”.

4. **Previews a partir da mesma base**  
   - Configurar o fluxo (e, se necessário, o Vercel) para que os previews das feature branches sejam buildados a partir da base validada (ex.: merge da feature em baseline/fykkeg6zb ou branch a partir dela), em vez de main atual.

5. **Variáveis de ambiente**  
   - Revisar no Vercel as variáveis de **Preview** vs **Production** (em especial VITE_BACKEND_URL ou qualquer override de API) e garantir que o backend permita origem dos domínios de preview (CORS).

6. **Banner**  
   - Se a decisão for “produção sem banner”: condicionar VersionBanner/VersionWarning a env (ex.: não exibir em produção) ou remover do Login em branch dedicada e validar em preview antes de promover.

7. **Documentação**  
   - Registrar o SHA definitivo da baseline (quando obtido) e a regra de “previews nascem da baseline” nos relatórios e no README ou CONTRIBUTING.

---

## 10. Conclusão final

- **O que é FyKKeg6zb:** deployment da baseline oficial validada do frontend player (id longo dpl_FyKKeg6zb...), bundle index-qIGutT6K.js / index-lDOJDUAS.css, commit inferido 0a2a5a1 ou 7dbb4ec.  
- **O que gera os previews:** o mesmo frontend (goldeouro-player), a partir do código das branches atuais (main e feature branches), que estão **à frente** da baseline.  
- **Correspondência com FyKKeg6zb:** os previews **não** correspondem ao baseline; o código que os gera é diferente.  
- **Banner:** origem em VersionBanner.jsx e VersionWarning.jsx; nos previews o código atual sempre os inclui; na baseline validada a descrição é “sem banner”.  
- **Login no preview:** causa provável **env** (variáveis de Preview) ou **CORS**; em local a causa é env (localhost → 8080).  
- **Branch mirror:** production-mirror/ez1oc96t1 espelha a **produção atual** (ez1oc96t1), **não** a baseline FyKKeg6zb.  
- **Reancoragem:** o repositório **não** está reancorado na baseline validada; main e feature branches estão à frente do commit inferido da baseline.

**Status final da auditoria: REANCORAGEM NECESSÁRIA.**

---

## Arquivos e fontes revisados

- docs/relatorios/BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md  
- docs/relatorios/BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md  
- docs/relatorios/RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08.md  
- docs/relatorios/RECONCILIACAO-FINAL-VERSAO-LOCAL-VS-PRODUCAO-2026-03-08.md  
- docs/relatorios/CRIACAO-ESPELHO-EXATO-PRODUCAO-EZ1OC96T1-2026-03-08.md  
- docs/relatorios/AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE-LOCAL-VS-PRODUCAO-2026-03-08.md  
- docs/relatorios/DIAGNOSTICO-LOGIN-BRANCH-ESPELHO-EZ1OC96T1-2026-03-08.md  
- docs/relatorios/compare-preview-vs-baseline-risk.json  
- docs/relatorios/vercel-deployments-snapshot.json  
- docs/relatorios/vercel-deployments-50.json  
- docs/relatorios/baseline-frontend-current.json  
- docs/relatorios/baseline-commit-origin.json  
- goldeouro-player/vercel.json  
- goldeouro-player/package.json  
- goldeouro-player/src/App.jsx  
- goldeouro-player/src/pages/Login.jsx  
- goldeouro-player/src/config/api.js  
- goldeouro-player/src/config/environments.js  
- goldeouro-player/src/components/VersionBanner.jsx  
- goldeouro-player/env.example  
- Git: branches main, production-mirror/ez1oc96t1, audit/reanchor-fykkeg6zb, feature/bloco-*; commits 0a2a5a1, 7c8cf59, 7dbb4ec, b66867f; diff entre branches.

---

*Auditoria realizada em modo read-only; nenhum código, deploy, push, merge, banco, Fly ou Vercel foi alterado.*
