# Baseline oficial frontend player — FyKKeg6zb

**Data:** 2026-03-06  
**Tipo:** Auditoria READ-ONLY (release/frontend)  
**Objetivo:** Congelar o deployment validado **FyKKeg6zb** como BASELINE OFICIAL do frontend do player Gol de Ouro.

---

## 1) Resumo executivo

Esta auditoria registra de forma auditável e definitiva que o **deployment FyKKeg6zb** é a **versão oficial validada** do frontend do player (www.goldeouro.lol), servindo como baseline para qualquer futuro preview, deploy ou promote. Nenhuma alteração de código, Vercel, Fly, banco ou pipeline foi realizada; apenas leitura de headers, HTML, fingerprints e dados públicos, e geração de relatórios e JSONs.

**Resultado:** FyKKeg6zb confirmado como baseline oficial. Fingerprint e bundles oficiais registrados. Rollback oficial definido. Regras operacionais documentadas.

---

## 2) Deployment atual / current

- **Deployment designado como baseline:** FyKKeg6zb (ID completo de referência: `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`).
- **Projeto:** goldeouro-player (Vercel).
- **Environment:** production.
- **Estado observado em produção na data da auditoria:** o site https://www.goldeouro.lol respondeu com status 200, server Vercel, e serviu o bundle **index-qIGutT6K.js** e CSS **index-lDOJDUAS.css**, consistentes com o build historicamente associado ao FyKKeg6zb (documentado em POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION e REVISAO-GERAL-V1-FINANCEIRO).
- **Limitação READ-ONLY:** Não foi possível acessar o dashboard ou API da Vercel para confirmar qual deployment está marcado como "Production Current"; a designação de FyKKeg6zb como baseline oficial é feita por convenção e documentação prévia.

Registro completo: `docs/relatorios/baseline-frontend-current.json`.

---

## 3) Confirmação do baseline oficial FyKKeg6zb

- **FyKKeg6zb é a baseline oficial validada do frontend do player.**  
- Qualquer novo deploy deve ser **comparado contra essa baseline** antes de promote.  
- O fingerprint e os bundles oficiais desta baseline estão registrados nos JSONs desta auditoria.  
- Em caso de regressão, o deployment a **re-promover** é **FyKKeg6zb** (ou um redeploy que sirva o mesmo bundle, se FyKKeg6zb não estiver disponível).

---

## 4) Fingerprint oficial do frontend

Capturado a partir de https://www.goldeouro.lol/ (e rotas /game e /dashboard):

| Item | Valor |
|------|--------|
| Status HTTP (/) | 200 |
| Server | Vercel |
| Cache | no-cache, no-store, must-revalidate |
| X-Vercel-Id | gru1::r9xhn-1772839044469-dd91d3a4bc53 |
| X-Vercel-Cache | HIT |
| Tamanho HTML (bytes) | 8985 |
| **SHA256 do HTML (raiz)** | **BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0** |
| Bundle JS principal | /assets/index-qIGutT6K.js |
| Bundle CSS principal | /assets/index-lDOJDUAS.css |
| Outros scripts | /registerSW.js |

Registro completo: `docs/relatorios/baseline-frontend-fingerprint.json`.

---

## 5) Rotas oficiais validadas

| Rota | Status | Carrega | Frontend correto |
|------|--------|--------|-------------------|
| / | 200 | Sim | Sim (login; bundle index-qIGutT6K.js) |
| /game | 200 | Sim | Sim (rota SPA; mesmo bundle) |
| /dashboard | 200 | Sim | Sim (rota SPA; mesmo bundle) |

O comportamento atual corresponde ao esperado: raiz exibe login; /game e /dashboard são rotas do mesmo bundle (React SPA), acessadas por navegação client-side.

Registro completo: `docs/relatorios/baseline-frontend-routes.json`.

---

## 6) Baseline oficial do /game

- **Path:** /game  
- **Bundle carregado:** /assets/index-qIGutT6K.js  
- **Estrutura:** SPA React; rota /game renderizada no cliente após carregar o app a partir de /.  
- **Elementos centrais esperados:** saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal.  
- **Indícios no bundle:** presença de referências a game e games/shoot; tamanho do bundle ~478 903 bytes.  
- **Layout validado:** O /game atual corresponde ao layout/experiência validada pelo usuário e é registrado como baseline oficial para comparação em futuros deploys.

Registro completo: `docs/relatorios/baseline-frontend-game.json`.

---

## 7) Bundles oficiais

| Tipo | Nome | Path | Hash/sufixo |
|------|------|------|-------------|
| JS principal | index-qIGutT6K.js | /assets/index-qIGutT6K.js | qIGutT6K |
| CSS principal | index-lDOJDUAS.css | /assets/index-lDOJDUAS.css | lDOJDUAS |
| Outros | registerSW.js | /registerSW.js | — |

Estes são a referência objetiva para comparar futuros previews/deploys. Qualquer build que altere esses hashes deve ser validado contra esta baseline antes de promote.

Registro completo: `docs/relatorios/baseline-frontend-bundles.json`.

---

## 8) Rollback oficial

- **Deployment a promover novamente em caso de regressão:** **FyKKeg6zb**.  
- **Procedimento:** No Vercel Dashboard → projeto **goldeouro-player** → Deployments → localizar o deployment **FyKKeg6zb** → **Promote to Production**. Se FyKKeg6zb não estiver disponível (expirado/removido), fazer redeploy a partir do commit que gera o build com bundle index-qIGutT6K.js / index-lDOJDUAS.css e promover esse deployment.  
- **Regra:** Nenhum novo promote sem validar /game, /dashboard, login e bundle/fingerprint contra esta baseline.

Registro completo: `docs/relatorios/baseline-frontend-rollback.json`.

---

## 9) Regra operacional daqui pra frente

- **FyKKeg6zb** é a **baseline oficial validada** do frontend do player.  
- Qualquer **novo deploy** deve ser **comparado contra essa baseline** (rotas, bundle, fingerprint).  
- **Nenhum novo promote** deve acontecer sem validar:  
  - /game  
  - /dashboard  
  - login  
  - bundle/fingerprint  
- **Em caso de regressão,** promover novamente **FyKKeg6zb** (ou o deployment que sirva o mesmo bundle oficial).

---

## 10) Conclusão final

A auditoria READ-ONLY foi concluída. O deployment **FyKKeg6zb** está **confirmado como baseline oficial** do frontend do player. Fingerprint, rotas, baseline do /game, bundles e procedimento de rollback foram registrados nos arquivos listados abaixo. As regras operacionais para futuros deploys e para resposta a regressões ficam documentadas neste relatório e nos JSONs de baseline.

---

## Arquivos gerados (caminhos exatos)

| Arquivo | Descrição |
|---------|-----------|
| `docs/relatorios/baseline-frontend-current.json` | Deployment current/baseline e validação |
| `docs/relatorios/baseline-frontend-fingerprint.json` | Fingerprint oficial (headers, SHA256 HTML, bundles) |
| `docs/relatorios/baseline-frontend-routes.json` | Estado das rotas /, /game, /dashboard |
| `docs/relatorios/baseline-frontend-game.json` | Baseline oficial do /game |
| `docs/relatorios/baseline-frontend-bundles.json` | Bundles oficiais (JS/CSS) |
| `docs/relatorios/baseline-frontend-rollback.json` | Rollback oficial (FyKKeg6zb) |
| `docs/relatorios/BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md` | Este relatório |

---

**SAÍDA FINAL**

- **Caminhos exatos dos arquivos gerados:** listados na tabela acima.  
- **Deployment current oficial:** designado como **FyKKeg6zb** (baseline validada).  
- **FyKKeg6zb confirmado como baseline oficial?** **Sim.**  
- **Bundle oficial atual:** **index-qIGutT6K.js** (CSS: index-lDOJDUAS.css).  
- **/game preservado?** **Sim.**  
- **Rollback oficial definido?** **Sim** (FyKKeg6zb).  
- **Conclusão final resumida:** Baseline oficial do frontend player congelada como FyKKeg6zb; fingerprint e bundles registrados; rollback e regras operacionais documentados; auditoria READ-ONLY concluída sem alterações em código, Vercel, Fly ou pipeline.
