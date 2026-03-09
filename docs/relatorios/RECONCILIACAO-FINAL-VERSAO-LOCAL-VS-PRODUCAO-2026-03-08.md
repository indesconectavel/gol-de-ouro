# Reconciliação Final de Versão — Local vs Produção

**Gol de Ouro — Auditoria Forense Read-Only**  
**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, build, deploy, branch ou env)

---

## 1. Escopo e método

### 1.1 Modo de execução

- **Read-only absoluto:** Nenhum arquivo, rota, componente, env, build ou deploy foi alterado. Apenas leitura de arquivos, grep, inspeção de git (branch, commit, status) e de relatórios existentes.
- **Fontes usadas:**
  - Documentação em `docs/relatorios/`: BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md, RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08.md, AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE-LOCAL-VS-PRODUCAO-2026-03-08.md, AUDITORIA-POR-BLOCOS-LOCAL-VS-PRODUCAO-2026-03-08.md, VALIDACAO-EXECUTIVA-BLOCO-C-AUTH-2026-03-08.md, VARREDURA-TOTAL-LOCAL-PRODUCAO-BASELINE-2026-03-08.md, vercel-deployments-snapshot.json, compare-preview-vs-baseline-risk.json, entre outros.
  - Git: branch atual, HEAD, status, commit em main.
  - Código: goldeouro-player/src (App.jsx, AuthContext, rotas, config), server-fly.js (rotas auth/profile).
- **Limitações:**
  - Não foi feita inspeção ao vivo do Vercel (dashboard/API) nem novo build; todas as conclusões sobre produção e baseline vêm de documentação e snapshots já existentes.
  - Commit SHA exato do deployment FyKKeg6zb não é exposto pela Vercel; apenas inferida (0a2a5a1 ou 7dbb4ec) conforme BASELINE-FYKKeg6zb-COMMIT-ORIGEM e RECUPERAÇÃO-COMMIT-FyKKeg6zb.
  - Componente exato montado em `/game` no build FyKKeg6zb não está documentado (Game vs GameShoot).

---

## 2. As três referências

### 2.1 Baseline validada

| Campo | Valor | Evidência |
|-------|--------|------------|
| **Deploy** | FyKKeg6zb (id longo: dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX) | baseline-frontend-current.json, RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08.md |
| **Bundle JS** | index-qIGutT6K.js | baseline-frontend-bundles.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md |
| **Bundle CSS** | index-lDOJDUAS.css | Idem |
| **Fingerprint** | SHA256 HTML e hashes dos assets registrados | baseline-frontend-fingerprint.json, BACKUP-GAME-FYKKeg6zb-2026-03-04.md |
| **Data do build** | 16 Jan 2026 (Last-Modified) | POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION, baseline-build-info.json |
| **Commit proxy** | Inferido 0a2a5a1 ou 7dbb4ec; **não determinável com exatidão** | BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md, baseline-commit-origin.json |
| **Status** | Baseline oficial e alvo de rollback; **não** é o deployment atual em produção | vercel-deployments-snapshot.json (FyKKeg6zb_present: false); AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE |

### 2.2 Produção atual

| Campo | Valor | Evidência |
|-------|--------|------------|
| **Deployment** | ez1oc96t1 | vercel-deployments-snapshot.json (current_production_deployment_id) |
| **Bundle JS** | index-DVt6EjKW.js | INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04, compare-preview-vs-baseline-fingerprint.json |
| **Bundle CSS** | index-BplTpheb.css | Idem |
| **Origem do build** | main (commit 7c8cf59 no momento do deploy; main desde então avançou) | INCIDENTE-REGRESSAO-GAME (PR #30, 7c8cf59); git log main -1 → 200b416 |
| **Relação com baseline** | **Diferente:** bundle e fingerprint distintos; produção atual não é a baseline validada | compare-preview-vs-baseline-risk.json, VARREDURA-TOTAL-LOCAL-PRODUCAO-BASELINE-2026-03-08.md |

### 2.3 Local

| Campo | Valor | Evidência |
|-------|--------|------------|
| **Branch atual** | baseline-reconstruction-analysis | git branch (saída da auditoria) |
| **Commit atual (HEAD)** | 0a2a5a1 (Merge pull request #18 — security/fix-ssrf-vulnerabilities) | git rev-parse HEAD; git log baseline-reconstruction-analysis -1 |
| **Commit em main** | 200b416 (fix deposito…) | git log main -1 |
| **Arquivos** | 1 modificado (goldeouro-player/package-lock.json); muitos untracked (docs, scripts) | git status -sb |
| **Relação com baseline** | O **código** no commit 0a2a5a1 é o **commit inferido da baseline**; portanto o local (checkout atual) espelha a **baseline** em termos de código-fonte. | BASELINE-FYKKeg6zb-COMMIT-ORIGEM, baseline-commit-origin.json |
| **Relação com produção atual** | O local (branch atual @ 0a2a5a1) **não** espelha a produção atual: produção foi construída a partir de **main** (7c8cf59+), que está à frente de 0a2a5a1. | main ≠ baseline-reconstruction-analysis; ez1oc96t1 = build de main |

### 2.4 Tabela consolidada das três referências

| Referência | Deploy/Commit | Bundle | Status | Observação |
|------------|----------------|--------|--------|------------|
| **Baseline validada** | FyKKeg6zb (commit inferido 0a2a5a1) | index-qIGutT6K.js, index-lDOJDUAS.css | Referência de segurança; não é prod atual | Documentada como rollback; URL direta 404 em snapshot |
| **Produção atual** | ez1oc96t1 (build de main, ex. 7c8cf59) | index-DVt6EjKW.js, index-BplTpheb.css | Em uso em www.goldeouro.lol | Regressão reportada em relação à baseline |
| **Local (checkout atual)** | 0a2a5a1 (branch baseline-reconstruction-analysis) | Não buildado nesta auditoria | Alinhado ao **código** da baseline | 1 arquivo modificado, muitos untracked |
| **Local (main)** | 200b416 | Geraria bundle distinto do baseline | À frente da produção (main avançou após 7c8cf59) | Base do que está (ou esteve) em ez1oc96t1 |

---

## 3. Comparação estrutural

Comparação com base em relatórios existentes e leitura de código (goldeouro-player e server-fly.js), **sem** novo build.

| Área | Igual à produção atual? | Igual à baseline? | Diferente? | Tipo da diferença | Evidência |
|------|--------------------------|-------------------|------------|-------------------|-----------|
| **Rotas** | Parcial | Parcial | Sim (estrutura) | Estrutural / não confirmado | App.jsx local: /, /register, /forgot-password, /reset-password, /dashboard, /game, /gameshoot, /profile, /withdraw, /pagamentos. Baseline não documenta rota por rota. |
| **Login** | Sim (contrato) | Parcial | — | Nenhuma / dev-only | VALIDACAO-EXECUTIVA-BLOCO-C: POST /api/auth/login, localStorage authToken, redirect /dashboard; backend server-fly.js L837. |
| **Register** | Sim | Parcial | — | Nenhuma | AuthContext + API_ENDPOINTS.REGISTER; server-fly.js L677. |
| **Forgot/Reset** | Sim (endpoints) | Não confirmado | Sim (link) | Funcional | ForgotPassword.jsx usa to="/login"; App não define rota /login (login em "/"). config/api.js logout redireciona para /login. |
| **Dashboard** | Sim | Parcial | — | Nenhuma | Protegida por ProtectedRoute; carrega PROFILE e PIX. |
| **Game** | Sim (local = GameShoot) | Não confirmado | Sim (build) | Estrutural | App.jsx: /game → GameShoot. Baseline não identifica qual componente em /game (AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE). Produção atual (ez1oc96t1) = build de main → GameShoot inferido. |
| **Profile** | Sim | Parcial | — | Nenhuma | GET /api/user/profile; server-fly.js L943. Formato user no AuthContext após refresh: divergência (setUser(response.data) vs response.data.data). |
| **Pagamentos** | Sim | Parcial | — | Nenhuma | Rotas e endpoints documentados em blocos. |
| **Withdraw** | Sim | Parcial | — | Nenhuma | Endpoints e fluxo em relatórios financeiro/saque. |
| **Auth** | Sim | Parcial | Sim (detalhes) | Funcional | Token storage, Bearer, PROFILE; exceção: formato user na restauração (AuthContext L35) e link /login. |
| **Saldo** | Parcial | Parcial | Sim | Funcional | Sidebar com saldo fixo (não fonte única); PROFILE é fonte correta (AUDITORIA-POR-BLOCOS, BLOCO D). |
| **Integrações API** | Sim | Parcial | — | Env | api.js / environments.js: baseURL por ambiente; produção = goldeouro-backend-v2.fly.dev. |
| **Versionamento / banners / warnings** | Parcial | Parcial | Sim | Visual / dev-only | VersionWarning, PwaSwUpdater no App; relatórios citam divergência barra de versão entre baseline e build atual. |
| **Assets** | Não inspecionado | Fingerprint doc. | — | — | baseline-frontend-fingerprint.json; não comparado byte a byte nesta auditoria. |
| **Service worker / PWA** | Não confirmado | Não confirmado | — | — | PwaSwUpdater montado; comportamento não validado contra baseline. |
| **Layout global** | Parcial | Parcial | Sim | Visual | ToastContainer ausente; tema claro em Pagamentos; sidebar com saldo fixo (AUDITORIA-POR-BLOCOS, BLOCO F). |

---

## 4. Divergências indevidas

Lista objetiva do que **não deveria** diferir entre local e produção (ou entre local e referência oficial), com evidência.

| # | Divergência | Onde | Impacto | Evidência |
|---|-------------|------|---------|-----------|
| 1 | **Link "Voltar ao Login" em ForgotPassword aponta para /login** | ForgotPassword.jsx L56, L123 | Rota /login não existe no App (login em "/"); usuário pode cair em rota vazia/404. | App.jsx: path="/" para Login; nenhum path="/login". |
| 2 | **AuthContext setUser(response.data) na restauração de sessão** | AuthContext.jsx L35 | Backend retorna { success, data: {...} }; user fica com estrutura errada após refresh; useAuth().user.email/id podem ser undefined. | server-fly.js L966-979 retorna res.json({ success: true, data: {...} }); AuthContext setUser(response.data). |
| 3 | **config/api.js logout() redireciona para /login** | config/api.js L83 | Inconsistente com o resto do app (logout real usa navigate('/')); função pode não ser usada, mas contrato está errado. | Navigation.jsx e Dashboard fazem navigate('/'); api.js window.location.href = '/login'. |
| 4 | **Saldo na sidebar é valor fixo** | Componente(s) de sidebar/Navigation | Não serve como fonte de verdade para homologação de saldo; pode confundir equipe. | AUDITORIA-POR-BLOCOS, BLOCO D e F; relatórios de validação. |
| 5 | **ToastContainer ausente** | App / layout | Feedback por toasts não homologável; divergência de interface. | AUDITORIA-POR-BLOCOS, BLOCO F. |
| 6 | **Branch atual não é main** | Git | Se "local" for entendido como branch de trabalho (baseline-reconstruction-analysis), o repositório em main está à frente e é o que alimenta produção; há risco de confusão sobre qual código é "local". | git branch: * baseline-reconstruction-analysis; main em 200b416. |

Não foi atribuída como indevida nenhuma diferença que esteja **explicitamente** documentada como exceção de BLOCO (ex.: depósito não inserir em ledger, worker env, regra V1 vs engine).

---

## 5. Divergências legítimas por BLOCO

Divergências que existem porque são trabalho em desenvolvimento local ainda não deployado ou exceções já documentadas nos relatórios por bloco.

| Divergência | Bloco | Já deployada? | É legítima? | Impacta espelho local? | Observação |
|-------------|--------|----------------|------------|------------------------|------------|
| Depósito aprovado não insere em ledger_financeiro; worker depende de env; webhook payout URL | A — Financeiro | Não / Parcial | Sim (documentada) | Sim (não usar local para conferir ledger sem ressalva) | AUDITORIA-POR-BLOCOS, BLOCO A. |
| Engine aceita amount 2,5,10 e winnerIndex aleatório; regra V1 oficial = R$ 1 e gol 10º chute | B — Apostas | Não confirmado | Sim | Sim (não homologar "regra V1" só pelo local) | BLOCO B. |
| Baseline não documenta fluxo exato de auth no bundle; forgot/reset não validados contra prod/baseline | C — Auth | N/A | Sim (ressalva) | Parcial | VALIDACAO-EXECUTIVA-BLOCO-C. |
| Saldo sidebar fixo; depósito/chute não geram ledger; fonte única = PROFILE | D — Saldo/Perfil/Pagamentos | Parcial | Sim | Sim (não usar sidebar para saldo) | BLOCO D. |
| Componente /game na baseline não identificado; Game.jsx não está em rota; local/prod = GameShoot | E — Gameplay | Não confirmado | Sim | Sim (fixar referência baseline vs prod) | AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE, BLOCO E. |
| ToastContainer ausente; saldo fixo sidebar; VersionWarning/PwaSwUpdater; tema claro em Pagamentos | F — Interface | Parcial | Sim | Sim | BLOCO F. |
| Deployment de referência (FyKKeg6zb vs ez1oc96t1) não único; pontos de abandono e CTA pós-PIX | G — Fluxo do Jogador | N/A | Sim | Sim | BLOCO G. |

Critério aplicado: se a divergência está documentada como exceção ou trabalho em bloco e não foi promovida como "correção indevida", foi classificada como legítima para fins de espelho com exceções.

---

## 6. O que o local espelha hoje

- **Se "local" = checkout atual (branch baseline-reconstruction-analysis, commit 0a2a5a1):**  
  O local **espelha a baseline validada (FyKKeg6zb)** em termos de código-fonte (commit inferido da baseline). **Não** espelha a produção atual (ez1oc96t1), que é build a partir de main.

- **Se "local" = branch main (commit 200b416):**  
  O local (main) é a **base da produção atual** e está **à frente** do que está em ez1oc96t1 (pois main avançou após o deploy que gerou ez1oc96t1). Portanto o local (main) pode ser tratado como **espelho parcial da produção atual**, com exceções documentadas nos BLOCOs A–G e com as divergências indevidas listadas na seção 4.

Conclusão operacional: para a pergunta "o local já é espelho confiável da produção atual, exceto pelos BLOCOs não deployados?", a resposta depende da definição de "local":

- **Local = branch atual (0a2a5a1):** Não. Esse local espelha a **baseline**, não a produção atual.
- **Local = main:** Sim, **com ressalvas**: main espelha a produção atual (ez1oc96t1) com exceções documentadas nos BLOCOs e com **divergências indevidas** (link /login, formato user na restauração de sessão, redirect logout em api.js, saldo sidebar, ToastContainer) que reduzem a confiabilidade até serem corrigidas.

---

## 7. Matriz final de confiança

| Área/Bloco | Local espelha produção? | Exceção permitida? | Tipo de exceção | Risco | Pode seguir usando local? |
|------------|-------------------------|--------------------|------------------|-------|---------------------------|
| **Login** | Sim (contrato) | Sim | BLOCO C (forgot/reset não validados contra baseline) | Baixo | Sim |
| **Auth** | Parcial | Sim | Formato user na restauração (indevida); BLOCO C | Médio | Sim, com ressalva (não confiar em useAuth().user após refresh sem correção) |
| **Saldo** | Parcial | Sim | Sidebar fixo (não usar); fonte = PROFILE; BLOCO D | Médio | Sim (usar PROFILE, não sidebar) |
| **Financeiro** | Sim | Sim | BLOCO A (ledger, worker, webhook) | Médio | Sim |
| **Game** | Sim (GameShoot) | Sim | BLOCO E (baseline /game não identificado) | Médio | Sim |
| **Interface** | Parcial | Sim | BLOCO F (toasts, VersionWarning, tema, sidebar) | Médio | Sim, com ressalvas |
| **Fluxo** | Parcial | Sim | BLOCO G (referência FyKKeg6zb vs ez1oc96t1) | Médio | Sim |
| **Rotas** | Sim | — | — | Baixo | Sim |
| **API** | Sim | Env (baseURL por ambiente) | — | Baixo | Sim |
| **Assets** | Não confirmado | — | — | — | NÃO CONFIRMADO |
| **Banners/warnings** | Parcial | Sim | VersionWarning/PwaSwUpdater (BLOCO F) | Baixo | Sim |

"Produção" na tabela = produção atual (ez1oc96t1), salvo menção à baseline. "Local" = código no repositório (main ou branch atual conforme contexto dos relatórios por bloco).

---

## 8. Regra operacional oficial

### 8.1 Qual produção deve ser a referência operacional?

- **Produção atual (ez1oc96t1)** deve ser a referência operacional do **dia a dia**: é o que está em uso em www.goldeouro.lol e o que usuários e testes manuais enxergam.
- **Baseline validada (FyKKeg6zb)** deve continuar sendo a referência de **segurança e rollback**: em caso de regressão, o alvo de restauração é FyKKeg6zb (ou build que reproduza index-qIGutT6K.js / index-lDOJDUAS.css), conforme baseline-frontend-rollback.json e BASELINE-FRONTEND-FYKKeg6zb-OFICIAL.

### 8.2 Qual frase a equipe deve adotar?

Recomendação com base na evidência:

**"O local (branch main) é espelho parcial da produção atual (ez1oc96t1), com exceções documentadas nos BLOCOs A a G e com divergências indevidas que devem ser corrigidas antes de tratar o local como espelho totalmente confiável (link /login, formato do user na restauração de sessão, redirect de logout em api.js, saldo na sidebar, ToastContainer). A baseline validada (FyKKeg6zb) permanece como referência de segurança e rollback; não confundir com produção atual."**

Alternativa mais curta:

**"O local pode ser usado como referência da produção atual desde que se respeitem as exceções dos BLOCOs A–G e se corrijam as divergências indevidas listadas no relatório de reconciliação (RECONCILIACAO-FINAL-VERSAO-LOCAL-VS-PRODUCAO-2026-03-08)."**

### 8.3 Regra para exceções por BLOCO não deployado

- Qualquer diferença entre local e produção que esteja **documentada** como parte de um BLOCO (A–G) e ainda **não deployada** é **exceção permitida**: o local pode estar à frente nesses pontos.
- Qualquer diferença que **não** esteja vinculada a um BLOCO documentado e que cause comportamento diferente do esperado em produção (rotas quebradas, dados incorretos, UX quebrada) deve ser tratada como **divergência indevida** e corrigida antes de considerar o local espelho confiável.

---

## 9. Classificação final

**ESPELHO PARCIAL COM DIVERGÊNCIAS INDEVIDAS**

- O local (interpretado como código em **main**) **espelha em grande parte** a produção atual (ez1oc96t1), com exceções já documentadas nos BLOCOs A–G.
- Existem **divergências indevidas** (link /login, formato user na restauração de sessão, redirect logout em api.js, saldo sidebar, ToastContainer, e possível confusão de branch) que **impedem** tratar o local como espelho **totalmente** confiável até serem corrigidas.
- A baseline (FyKKeg6zb) **não** foi confundida com a produção atual; permanece como referência de segurança e rollback.

### Decisão operacional final (Opção A / B / C)

**Opção B — O LOCAL É ESPELHO PARCIAL DA PRODUÇÃO, MAS AINDA EXISTEM DIVERGÊNCIAS INDEVIDAS EM:**

1. **ForgotPassword e rota /login** — Links "Voltar ao Login" com to="/login" (App não define /login; login está em "/").
2. **AuthContext — restauração de sessão** — setUser(response.data) quando a API retorna { success, data }; deve ser setUser(response.data.data) para consistência com login.
3. **config/api.js — logout()** — window.location.href = '/login' inconsistente com o fluxo real (navigate('/')).
4. **Saldo na sidebar** — Valor fixo; não usar como fonte de verdade para homologação.
5. **ToastContainer ausente** — Impacta homologação de feedback de interface (BLOCO F).

Sustentação: arquivos e linhas citados na seção 4 (Divergências indevidas) e nos relatórios VALIDACAO-EXECUTIVA-BLOCO-C e AUDITORIA-POR-BLOCOS.

---

## 10. Próximo passo seguro

**Sem alterar código, build ou deploy**, a próxima ação recomendada antes de continuar os BLOCOs é:

1. **Definir oficialmente o que "local" significa para a equipe:** branch main como referência de desenvolvimento e de espelho da produção atual, ou branch dedicada alinhada ao commit da baseline (0a2a5a1) para trabalhos que exijam reproduzir a baseline. Documentar essa convenção em um único lugar (ex.: README ou doc de processo).
2. **Corrigir as divergências indevidas** em ordem de impacto: (a) ForgotPassword e api.js: usar "/" em vez de "/login" para "Voltar ao Login" e para redirect de logout; (b) AuthContext: na restauração de sessão, usar `setUser(response.data.data)` quando a API retornar `{ success: true, data: {...} }`; (c) registrar e, se desejado, corrigir saldo na sidebar e ToastContainer conforme BLOCO F.
3. **Manter a baseline FyKKeg6zb** como referência de rollback e não promover deploy para produção sem critério explícito de comparação com o fingerprint da baseline (ou com o que for definido como substituto oficial no futuro).

Nenhuma dessas ações foi executada nesta auditoria (modo read-only).

---

## Saída final obrigatória

1. **Qual produção deve ser a referência operacional daqui para frente?**  
   **Produção atual (ez1oc96t1)** para o dia a dia (o que está em www.goldeouro.lol). **Baseline validada (FyKKeg6zb)** para segurança e rollback (referência em caso de regressão).

2. **O local já espelha essa referência?**  
   **Parcialmente.** O código em **main** espelha a produção atual (ez1oc96t1) com exceções documentadas nos BLOCOs. O checkout atual (branch baseline-reconstruction-analysis @ 0a2a5a1) espelha a **baseline**, não a produção atual. Para "local" = main: sim, com ressalvas e divergências indevidas.

3. **Quais exceções por BLOCO são legítimas?**  
   Todas as listadas na seção 5: BLOCO A (ledger, worker, webhook), BLOCO B (regra V1 vs engine), BLOCO C (auth/baseline não documentada), BLOCO D (saldo sidebar, fonte PROFILE), BLOCO E (/game não identificado na baseline), BLOCO F (toasts, VersionWarning, tema), BLOCO G (referência de deployment e fluxo).

4. **Quais divergências ainda são indevidas?**  
   As cinco da seção 4 e da Opção B: (1) link /login em ForgotPassword e uso de /login em api.js logout; (2) formato do user na restauração de sessão no AuthContext; (3) redirect para /login em config/api.js; (4) saldo fixo na sidebar; (5) ToastContainer ausente. Mais a confusão possível entre branch atual e main.

5. **Qual frase oficial a equipe deve adotar para trabalhar com segurança?**  
   **"O local (main) é espelho parcial da produção atual (ez1oc96t1), com exceções documentadas nos BLOCOs A a G. As divergências indevidas (link /login, formato user na restauração de sessão, redirect logout, saldo sidebar, ToastContainer) devem ser corrigidas antes de tratar o local como espelho totalmente confiável. A baseline (FyKKeg6zb) é a referência de segurança e rollback; não confundir com produção atual."**

---

*Relatório gerado em modo READ-ONLY absoluto. Nenhum arquivo, build, deploy, branch ou configuração foi alterado.*
