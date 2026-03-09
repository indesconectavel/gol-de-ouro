# RECUPERAÇÃO DO COMMIT — DEPLOY FyKKeg6zb

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, branch, config, Vercel, deploy ou aliases).  
**Objetivo:** Recuperar, com o máximo de evidência possível, o commit SHA exato associado ao deployment validado FyKKeg6zb (baseline oficial do frontend player) e definir a melhor referência técnica para restaurar a baseline no repositório.

---

## 1. Inventário de evidências

### 1.1 Arquivos/documentos que mencionam FyKKeg6zb

| Arquivo | Tipo de evidência | O que afirma sobre FyKKeg6zb |
|--------|-------------------|------------------------------|
| baseline-frontend-rollback.json | Rollback / baseline | Rollback deployment ID = FyKKeg6zb; redeploy a partir do commit que gera index-qIGutT6K.js / index-lDOJDUAS.css. |
| baseline-frontend-bundles.json | Bundle / baseline | deployment_baseline = FyKKeg6zb; bundle JS = index-qIGutT6K.js, CSS = index-lDOJDUAS.css. |
| baseline-frontend-game.json | Baseline /game | Bundle carregado = /assets/index-qIGutT6K.js; layout validado; não cita commit. |
| baseline-frontend-current.json | Identidade do deploy | deployment_id = FyKKeg6zb; id completo = dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX; designado como baseline oficial. |
| baseline-frontend-fingerprint.json | Fingerprint | bundle_js_principal = index-qIGutT6K.js, bundle_css_principal = index-lDOJDUAS.css; SHA256 HTML raiz registrado. |
| BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md | Baseline oficial | FyKKeg6zb = baseline oficial validada; rollback = FyKKeg6zb; bundle index-qIGutT6K.js / index-lDOJDUAS.css. |
| BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md | Commit de origem | Commit exato **não determinável**; inferido 0a2a5a1 ou 7dbb4ec; build date 16 Jan 2026; branch main inferida. |
| baseline-commit-origin.json | Commit inferido | commit_origin_inferido = 0a2a5a1; commit_origin_determinado = false; deployment_id_full = dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX; build_date_vercel = 2026-01-16T05:25:34Z. |
| baseline-repo-state.json | Estado do repo | commit_inferido_origem_fykkeg6zb = 0a2a5a1; commit_inferido_existe = true; tags_relevantes listadas. |
| baseline-build-info.json | Build / bundle | deployment_baseline = FyKKeg6zb; bundle_js_oficial = index-qIGutT6K.js; build_date_observed = 2026-01-16T05:25:34Z. |
| vercel-deployments-50.json | Deploy / alias | vercel_inspect_www = "deployment m38czzm4q, id dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX, aliases www/app/goldeouro.lol"; FyKKeg6zb_direct_url_status = 404. |
| vercel-deployments-snapshot.json | Lista prod | FyKKeg6zb_present = false; current_production_deployment_id = ez1oc96t1; conclusão: FyKKeg6zb não aparece na lista de prod. |
| INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md | Regressão / prod | Deploy estável = FyKKeg6zb; vercel inspect FyKKeg6zb = "Can't find"; produção atual = ez1oc96t1 (commit 7c8cf59). |
| INCIDENTE-FYKKeg6zb-NETWORK-ERROR-READONLY-2026-03-04.md | Rede / CORS | Build FyKKeg6zb = index-qIGutT6K.js, index-lDOJDUAS.css (Last-Modified 16 Jan 2026). |
| FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06.md | Produção atual | Produção = ez1oc96t1; FyKKeg6zb não aparece na lista de prod; rollback = promover FyKKeg6zb ou commit que gera mesmo bundle. |
| BACKUP-GAME-FYKKeg6zb-2026-03-04.md | Backup estático | Backup do build servido em www.goldeouro.lol; assets index-qIGutT6K.js, index-lDOJDUAS.css; hashes SHA256 registrados. |
| RELEASE-CHECKPOINT/POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION-2026-02-06_0431.md | Validação HTTP | Produção serve index-qIGutT6K.js, index-lDOJDUAS.css; Last-Modified HTML 16 Jan 2026 05:25:55 GMT; JS 16 Jan 2026 05:25:34 GMT; sem SHA git. |
| DIFF-PR29-vs-FyKKeg6zb-PAGAMENTOS-SALDO.md | Diff / estável | FyKKeg6zb = deploy Vercel (não SHA); build 16 Jan 2026; estável git para diff = d8ceb3b; "ex.: 0a2a5a1 ou anterior". |
| REVISAO-GERAL-V1-FINANCEIRO-E-FLUXO-2026-02-28.md | Baseline prod | FyKKeg6zb = baseline de produção; referência git estável = d8ceb3b. |
| HOTFIX-BARRA-VERSAO-AUDITORIA-2026-02-28.md | Produção estável | Produção estável = FyKKeg6zb (Vercel). |
| compare-preview-vs-baseline-risk.json | Comparação | Baseline = FyKKeg6zb; preview ez1oc96t1 com bundle diferente; não promover; rollback = FyKKeg6zb ou deployment com index-qIGutT6K.js. |
| AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE-LOCAL-VS-PRODUCAO-2026-03-08.md | Fonte de verdade | FyKKeg6zb = baseline oficial; alias www associado a m38czzm4q (id dpl_FyKKeg6zb...); commit inferido 0a2a5a1/7dbb4ec. |
| financeiro-v1-auditoria-final-producao.json | Produção | deployment_id = FyKKeg6zb. |

### 1.2 Respostas

- **Quais documentos apontam FyKKeg6zb como baseline?**  
  baseline-frontend-rollback.json, baseline-frontend-bundles.json, baseline-frontend-current.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, REVISAO-GERAL-V1-FINANCEIRO-E-FLUXO-2026-02-28.md, compare-preview-vs-baseline-risk.json, AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE-LOCAL-VS-PRODUCAO-2026-03-08.md.

- **Quais documentos mencionam commit relacionado?**  
  BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md, baseline-commit-origin.json, baseline-repo-state.json, DIFF-PR29-vs-FyKKeg6zb-PAGAMENTOS-SALDO.md, INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md (commit 7c8cf59 = produção atual, não FyKKeg6zb).

- **Quais documentos mencionam bundle relacionado?**  
  baseline-frontend-bundles.json, baseline-frontend-game.json, baseline-frontend-fingerprint.json, baseline-build-info.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION, BACKUP-GAME-FYKKeg6zb-2026-03-04.md, INCIDENTE-FYKKeg6zb-NETWORK-ERROR-READONLY-2026-03-04.md, compare-preview-vs-baseline-fingerprint.json, entre outros.

---

## 2. Identidade do deploy

### 2.1 O que é FyKKeg6zb?

- **Deployment ID (forma curta/sufixo):** FyKKeg6zb é usado na documentação como identificador do deployment (ex.: “rollback para FyKKeg6zb”, “deployment FyKKeg6zb”).
- **Deployment ID (forma longa Vercel):** **dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX** — registrado em baseline-frontend-current.json e baseline-commit-origin.json. O sufixo “FyKKeg6zb” compõe o ID longo.
- **Relação com lista de deployments:** No snapshot vercel-deployments-50.json, o comando que inspecionou o domínio **www** (ou aliases www/app/goldeouro.lol) retornou: deployment com **id** `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX` e **short id** (ou slug) **m38czzm4q** (age 49d). Ou seja, o deployment que tinha os aliases www/app/goldeouro.lol na data do snapshot é o de id longo dpl_FyKKeg6zb...; na lista por “id” curto aparece como **m38czzm4q**.
- **URL direta do deployment:** FyKKeg6zb_direct_url_status: **404** (vercel-deployments-50.json). A URL direta do tipo `...-FyKKeg6zb-...vercel.app` retorna 404 (deployment não encontrado ou expirado no contexto da requisição).
- **Produção atual:** FyKKeg6zb **não** aparece na lista de deployments de produção como “Production Current”; a lista (vercel-deployments-snapshot.json) tem current_production_deployment_id = **ez1oc96t1** e FyKKeg6zb_present = **false**.

### 2.2 Respostas

- **O que exatamente é FyKKeg6zb?**  
  É o **deployment** do projeto Vercel **goldeouro-player** com **id longo** `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`. Na listagem por “id” curto do Vercel aparece como **m38czzm4q** quando se inspeciona o domínio www. FyKKeg6zb é o identificador usado na documentação como baseline e alvo de rollback.

- **Há relação explícita com algum deployment longo do Vercel?**  
  **Sim.** A relação explícita está em baseline-frontend-current.json e baseline-commit-origin.json: **deployment_id_full**: "dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX". O vercel-deployments-50.json registra que o deployment com esse id longo tinha aliases www/app/goldeouro.lol.

- **Era produção, preview ou baseline de rollback?**  
  Era **produção** (servia www.goldeouro.lol / app.goldeouro.lol) na época da validação e é documentado como **baseline de rollback** em caso de regressão. Ou seja: produção validada e, ao mesmo tempo, alvo oficial de rollback.

---

## 3. Correlação com bundle

### 3.1 Associação FyKKeg6zb ↔ index-qIGutT6K.js / index-lDOJDUAS.css

- **Documentação local:** Vários arquivos confirmam que o build associado ao FyKKeg6zb (e ao estado de produção quando servia www) usa **index-qIGutT6K.js** e **index-lDOJDUAS.css**: baseline-frontend-bundles.json, baseline-frontend-game.json, baseline-frontend-fingerprint.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION (evidência HTTP: HTML e JS com esses paths; Last-Modified 16 Jan 2026), INCIDENTE-FYKKeg6zb-NETWORK-ERROR-READONLY-2026-03-04.md, BACKUP-GAME-FYKKeg6zb-2026-03-04.md.
- **Evidência de data do build:** Last-Modified do **HTML** em produção: **Fri, 16 Jan 2026 05:25:55 GMT**; do **bundle JS**: **Fri, 16 Jan 2026 05:25:34 GMT** (POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION, baseline-build-info.json).

### 3.2 Tabela

| Deployment        | Bundle JS           | Bundle CSS            | Status / observação |
|-------------------|---------------------|------------------------|---------------------|
| FyKKeg6zb (dpl_FyKKeg6zb...) | index-qIGutT6K.js   | index-lDOJDUAS.css    | Documentado como baseline; build 16 Jan 2026; URL direta 404 na data do snapshot. |
| m38czzm4q         | (não registrado)    | (não registrado)      | Mesmo id longo que FyKKeg6zb quando inspecionado www; age 49d na lista. |
| ez1oc96t1         | index-DVt6EjKW.js   | index-BplTpheb.css   | Produção atual (1d); bundle diferente da baseline. |

### 3.3 Respostas

- **Existe documentação local confirmando que FyKKeg6zb servia esse bundle?**  
  **Sim.** POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, baseline-frontend-bundles.json, BACKUP-GAME-FYKKeg6zb-2026-03-04.md e outros atestam que o build associado ao FyKKeg6zb (e ao que era servido em www na época) usa index-qIGutT6K.js e index-lDOJDUAS.css.

- **Esse bundle é o fingerprint confiável da baseline?**  
  **Sim.** Os relatórios de baseline (BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-fingerprint.json, baseline-frontend-game.json) definem o fingerprint da baseline pelos hashes **qIGutT6K** (JS) e **lDOJDUAS** (CSS) e pelo SHA256 do HTML raiz (BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0). Qualquer build que produza esses mesmos artefatos é considerado equivalente à baseline.

- **Há outro deployment servindo o mesmo bundle?**  
  Na documentação analisada não há registro de **outro** deployment ID servindo exatamente index-qIGutT6K.js / index-lDOJDUAS.css. O deployment **m38czzm4q** é o **mesmo** que FyKKeg6zb (id longo dpl_FyKKeg6zb...), não “outro” deployment com o mesmo bundle.

---

## 4. Correlação com commit

### 4.1 Commit SHA exato documentado?

- **Não.** Nenhum arquivo no escopo contém o campo **git commit SHA** (ou equivalente, ex.: gitSourceRevision) retornado pela API ou pelo dashboard do Vercel para o deployment FyKKeg6zb. BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md e baseline-commit-origin.json deixam explícito: “Commit SHA: **Não exposto** nas respostas HTTP nem no repositório”; “commit_origin_determinado”: false.

### 4.2 Commit mais fortemente inferido

- **0a2a5a1** (completo: 0a2a5a1effb18f78e6df7d7081cd9c04e657e800) — Merge PR #18, 2025-11-15.  
- **Alternativa:** **7dbb4ec** (7dbb4ec9aa24c29127cdf56855ea08bf7ae65676) — “fix: corrigir CSP para permitir scripts externos (PostHog e GTM)”, 2025-11-15.

**Motivo da inferência:** O build em produção (FyKKeg6zb) tem **Last-Modified 16 Jan 2026**. No histórico do repositório (path goldeouro-player/) **não há commits** entre **2025-11-15** e **2026-02-05** (BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md). Logo, o commit usado pelo Vercel para o build de 16 Jan deve ser um que já existia antes de 16 Jan 2026. Os últimos commits que tocam o player antes desse intervalo são **0a2a5a1** (merge PR #18) e **7dbb4ec** (fix CSP). DIFF-PR29-vs-FyKKeg6zb-PAGAMENTOS-SALDO.md cita “ex.: 0a2a5a1 ou anterior”. Entre 7dbb4ec/0a2a5a1 e **d8ceb3b** (checkpoint 2026-02-05) está o PR #29; o bundle index-qIGutT6K corresponde a um estado **anterior** a essas alterações, portanto consistente com 0a2a5a1 ou 7dbb4ec.

### 4.3 Força da inferência

- **B) Média.**  
  - **A favor:** (1) Lacuna de commits entre 2025-11-15 e 2026-02-05 torna 0a2a5a1/7dbb4ec os únicos candidatos por cronologia; (2) bundle da baseline é anterior ao PR #29 e ao d8ceb3b; (3) 0a2a5a1 é referência documental explícita (DIFF-PR29, baseline-commit-origin.json).  
  - **Contra:** (1) Não há SHA retornado pelo Vercel; (2) não há confirmação por build local (nunca se rodou `vite build` em 0a2a5a1 e comparou o hash com qIGutT6K); (3) o build de 16 Jan pode ter sido disparado por um redeploy ou por um commit ligeiramente diferente no mesmo estado de árvore.

---

## 5. Correlação com branch / PR

### 5.1 Branch associada?

- **Inferida: main.** BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md e baseline-commit-origin.json indicam “branch_origem_inferida”: "main". A documentação (POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION, INCIDENTE-REGRESSAO-GAME) descreve deploys de produção a partir de **main**. Nenhum documento associa FyKKeg6zb a uma branch que não seja main.

### 5.2 PR associada?

- **Não diretamente ao FyKKeg6zb.** O commit inferido **0a2a5a1** é o **merge do PR #18** (security/fix-ssrf-vulnerabilities). Ou seja, a PR associada ao commit mais provável é a **PR #18**; FyKKeg6zb seria o deployment gerado a partir de main nesse estado (ou estado anterior). Nenhum documento atribui FyKKeg6zb a uma PR específica além dessa inferência.

### 5.3 Merge commit mais provável?

- **0a2a5a1** é um merge commit (“Merge pull request #18 …”). **7dbb4ec** é commit de fix (não merge). O “merge mais provável” associado ao estado que gerou o build de 16 Jan é **0a2a5a1** (main após PR #18). Não há evidência de que um merge posterior (ex.: PR #29 = 3ae3786) tenha sido o source do FyKKeg6zb; ao contrário, o bundle index-qIGutT6K é tratado como **anterior** ao PR #29.

---

## 6. Cadeia de evidência

Cadeia lógica montada apenas com documentação e artefatos locais:

1. **Deployment FyKKeg6zb** → ID longo **dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX**; designado como baseline oficial e alvo de rollback; na listagem Vercel aparece como **m38czzm4q** quando inspecionado via alias www; URL direta 404.
2. **Bundle** → FyKKeg6zb servia **index-qIGutT6K.js** e **index-lDOJDUAS.css**; Last-Modified **16 Jan 2026** (HTML e JS); fingerprint oficial registrado nos JSONs de baseline.
3. **Possível commit** → **Não recuperado**; **inferido 0a2a5a1** (ou 7dbb4ec) por cronologia (nenhum commit no player entre 2025-11-15 e 2026-02-05) e por referência documental (DIFF-PR29, baseline-commit-origin.json).
4. **Possível branch/PR** → Branch **main** (inferida); PR **#18** associada ao merge 0a2a5a1; FyKKeg6zb tratado como estado **anterior** ao PR #29.
5. **Relação com baseline oficial** → FyKKeg6zb é a **baseline oficial validada** do frontend player; rollback = re-promover FyKKeg6zb ou fazer redeploy a partir do commit que gera index-qIGutT6K.js / index-lDOJDUAS.css.

### Onde a cadeia está incompleta

- **Lacuna 1:** Não há **SHA git** retornado pelo Vercel para o deployment FyKKeg6zb (sem API/dashboard).  
- **Lacuna 2:** Nunca foi feita **confirmação por build**: rodar `vite build` no commit 0a2a5a1 (ou 7dbb4ec) e comparar o hash do bundle gerado com **qIGutT6K** / **lDOJDUAS**.  
- **Lacuna 3:** Não está documentado se o build de 16 Jan 2026 foi disparado por push em main, redeploy manual ou outro evento.

---

## 7. Melhor referência técnica para restauração

**Opção escolhida:** **E) Combinação das opções anteriores.**

Justificativa:

- **A) Commit SHA exato** — Não está disponível; não pode ser usado sozinho.
- **B) Commit inferido mais forte** — **0a2a5a1** (ou 7dbb4ec) é a melhor referência **no repositório** para tentar reproduzir o bundle: é documentado, existe no repo e é cronologicamente consistente com o build de 16 Jan. Deve ser usado como ponto de partida.
- **C) Fingerprint do bundle** — **Obrigatório** como critério de sucesso: qualquer restauração deve produzir (ou servir) **index-qIGutT6K.js** e **index-lDOJDUAS.css** (e, se possível, o mesmo SHA256 do HTML raiz). Se um build a partir de 0a2a5a1 gerar outro hash, é preciso ajustar o commit (ex.: 7dbb4ec ou outro ancestral) até o fingerprint coincidir, ou aceitar o commit mais próximo que exista no histórico.
- **D) Deployment do Vercel como única referência** — Insuficiente: a URL direta do FyKKeg6zb retorna 404; não há como “clonar” o deployment sem um source (commit ou artefato). O deployment é a referência de **o que** se quer restaurar (fingerprint), não **como** reproduzi-lo no repo.

**Recomendação técnica:**  
1) Usar **commit inferido 0a2a5a1** (ou 7dbb4ec se 0a2a5a1 falhar) como ponto de partida.  
2) Fazer **checkout** desse commit (em branch de trabalho, sem alterar main), rodar **vite build** no goldeouro-player com as mesmas variáveis de ambiente que a Vercel usa em produção.  
3) **Comparar** o hash do JS/CSS gerado com **qIGutT6K** / **lDOJDUAS**.  
4) Se coincidir: esse commit é o proxy de restauração da baseline. Se não coincidir: iterar com 7dbb4ec ou outros ancestrais e/ou, se no futuro houver acesso à API Vercel, obter o **meta.gitSourceRevision** (ou equivalente) do deployment FyKKeg6zb e usar esse SHA como referência definitiva.

---

## 8. Grau de confiança

**Classificação:** **MÉDIO.**

Justificativa com base na evidência real:

- **Pontos que aumentam a confiança:** (1) Associação FyKKeg6zb ↔ bundle index-qIGutT6K.js / index-lDOJDUAS.css é **bem documentada** e coerente entre vários relatórios e JSONs. (2) Data do build (16 Jan 2026) é **consistente** com a lacuna de commits (2025-11-15 a 2026-02-05). (3) O commit **0a2a5a1** é **citado explicitamente** como “ex.: 0a2a5a1 ou anterior” (DIFF-PR29) e registrado como commit_origin_inferido em baseline-commit-origin.json. (4) Os commits 0a2a5a1 e 7dbb4ec **existem** no repositório (baseline-repo-state.json).
- **Pontos que limitam a confiança:** (1) **Nenhum** documento contém o SHA retornado pelo Vercel para o deployment FyKKeg6zb. (2) A equivalência entre 0a2a5a1 e o bundle qIGutT6K **nunca foi verificada** por build local. (3) O deployment FyKKeg6zb não aparece na lista atual de produção e a URL direta retorna 404, então não é possível inspecionar metadados do deployment sem acesso ao dashboard/API. (4) O build de 16 Jan pode ter sido disparado por redeploy de um deployment anterior, não necessariamente por um push no mesmo dia.

Por isso o grau é **MÉDIO**: a inferência é bem fundamentada e utilizável para restauração, mas não há prova direta (SHA do Vercel ou reprodução do hash por build local).

---

## 9. Decisão final

### 9.1 O commit exato do FyKKeg6zb foi recuperado?

**Não.** Em nenhum artefato ou documento analisado aparece o commit SHA exato associado ao deployment FyKKeg6zb. A recuperação foi apenas **inferida** a partir de datas de build, histórico git e referências documentais.

### 9.2 Ou apenas inferido?

**Sim.** O commit **0a2a5a1** (e, como alternativa, **7dbb4ec**) é o **melhor proxy documentado** para o estado do repositório que gerou o build da baseline. A inferência é explícita em BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md e baseline-commit-origin.json.

### 9.3 Já há evidência suficiente para um prompt cirúrgico de alinhamento do local à baseline?

**Sim.** Há evidência suficiente para um prompt que: (a) use o **commit inferido 0a2a5a1** (ou 7dbb4ec) como referência; (b) faça **build** do player nesse commit e **compare** o hash do bundle com index-qIGutT6K.js / index-lDOJDUAS.css; (c) em caso de match, considere esse commit o proxy da baseline para alinhamento; (d) opcionalmente, documente que a confirmação definitiva exigiria o SHA do Vercel (dashboard/API) ou a reprodução do fingerprint por build local.

### 9.4 Próximo passo recomendado

- **B) Alinhar local ao commit inferido** — Fazer checkout de **0a2a5a1** (ou 7dbb4ec) em branch de trabalho, buildar o player, comparar hashes; se bater com qIGutT6K/lDOJDUAS, usar esse commit como baseline para alinhamento e reaplicar apenas mudanças aprovadas em cima dele.  
- **C) Investigar mais via metadados Vercel** — Se houver acesso ao dashboard ou à API do Vercel, obter o **git source revision** (ou equivalente) do deployment com id dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX e registrar esse SHA como commit exato da baseline; em seguida, preferir **A) Alinhar local ao commit exato**.  
- **D) Congelar bundle baseline como fonte de verdade** — Manter o fingerprint (index-qIGutT6K.js, index-lDOJDUAS.css e, se aplicável, SHA256 do HTML) como critério obrigatório para “baseline restaurada”; qualquer restauração (por commit ou por redeploy) deve ser validada contra esse fingerprint.

Recomendação prática: **B** + **D** (usar commit inferido como proxy e validar sempre pelo fingerprint do bundle); e **C** assim que houver acesso aos metadados do Vercel.

---

## Classificação final

**COMMIT FORTEMENTE INFERIDO**

- O **commit exato** do deployment FyKKeg6zb **não foi recuperado** (não existe em documentação nem em artefatos locais).
- O **commit 0a2a5a1** (e, em alternativa, 7dbb4ec) é **fortemente inferido** como o melhor proxy do estado do repositório que gerou o build da baseline, com base em: cronologia do build (16 Jan 2026), lacuna de commits no player (2025-11-15 a 2026-02-05), referências em DIFF-PR29 e baseline-commit-origin.json, e consistência com “estado anterior ao PR #29”.
- A **melhor referência técnica para restauração** é a **combinação**: commit inferido (0a2a5a1 ou 7dbb4ec) como ponto de partida + **fingerprint do bundle** (index-qIGutT6K.js, index-lDOJDUAS.css) como critério de sucesso; e, se possível, obtenção do SHA do Vercel para o deployment FyKKeg6zb para tornar a referência definitiva.

---

*Auditoria realizada em modo read-only; nenhum código, branch, configuração, Vercel, deploy ou alias foi alterado.*
