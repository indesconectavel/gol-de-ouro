# DIAGNÓSTICO READ-ONLY — CIRURGIA 1 — ROUTING SPA EM PRODUÇÃO

**Projeto:** Gol de Ouro — player (`goldeouro-player`)  
**Data:** 2026-04-05  
**Modo:** read-only (sem alteração de código, sem deploy, sem painéis externos)  
**Âmbito:** apenas deep links / refresh / sub-rotas da SPA em produção na Vercel.

---

## 1. Resumo executivo

A SPA usa **`react-router-dom` v6** com **`BrowserRouter`** e rotas declaradas em `App.jsx`. O repositório contém **`goldeouro-player/vercel.json`** com **rewrites** que, em teoria, enviam pedidos não estáticos para **`/index.html`** (incluindo `/(.*) → /index.html`), ou seja, o **modelo correto para SPA** está **versionado**.

Em produção (`www.goldeouro.lol`), relatório operacional já documentado (`VALIDACAO-FUNCIONAL-COMPLETA-JOGADOR-PRODUCAO-POS-PIPELINE-2026-04-04.md`) regista **`GET /` → 200** e **`GET /register`, `/dashboard`, `/game`, `/download`, etc. → 404** com **`X-Vercel-Error: NOT_FOUND`**.

**Conclusão central:** o sintoma é **típico de ausência de fallback SPA no edge** (ou de rewrites **não aplicados** ao deployment que serve o domínio). Como o **mesmo `vercel.json`** é descrito como **idêntico** entre a baseline Git e `origin/main`, a **causa mais provável** não é “falta de rewrite no Git”, mas **alinhamento entre o projeto Vercel real, o Root Directory, o ficheiro `vercel.json` efetivo e o deployment promovido** — matéria em parte **fora do diff Git**.

A **cirurgia mínima** deve focar-se em **garantir que o edge aplica fallback para `index.html`** (via configuração que o Vercel honre para esse projeto), **sem** misturar auth, jogo, saldo ou backend.

---

## 2. Baseline oficial considerada

| Campo | Valor referenciado pelo utilizador |
|--------|-------------------------------------|
| Deployment | `dpl_p3dBCTxRrmyHBnsovJaT5n2UpWfd` |
| Prefixo | `p3dBCTxRr` |
| Tag | `baseline-player-validada-p3dBCTxRr-2026-04-02` |
| Branch | `canonica/player-baseline-p3dBCTxRr` |
| Commit | `a3fff5ed93690f39e6083e0b78c921276ce2c57b` |

**Nota de método:** este documento foi elaborado sobre o **estado atual do workspace** (read-only). A equivalência byte-a-byte com o commit da baseline **não foi reprovada aqui** com `git show`; contudo, relatórios internos já afirmam que **`goldeouro-player/vercel.json` não difere** entre baseline e `main`.

---

## 3. Verdade atual do roteamento

### 3.1 Biblioteca e modo

- **Pacote:** `react-router-dom` `^6.8.1` (`package.json`).
- **Componente raiz:** `BrowserRouter` (alias `Router`) em `App.jsx`.
- **Entrada:** `main.jsx` monta `<App />` sem router adicional.

`BrowserRouter` depende de **histórico HTML5**: o servidor deve responder **200 com `index.html`** para caminhos como `/register`, para o cliente hidratar e o router assumir a rota.

### 3.2 Rotas declaradas (amostra alinhada ao pedido)

Ficheiro: `goldeouro-player/src/App.jsx`

| Rota | Tipo |
|------|------|
| `/` | `Login` |
| `/register` | `Register` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password` | `ResetPassword` |
| `/terms`, `/privacy`, `/download` | páginas estáticas/legais/download |
| `/dashboard`, `/game`, `/gameshoot`, `/profile`, `/withdraw`, `/pagamentos` | protegidas (`ProtectedRoute`) |

*(Outras rotas de desenvolvimento/teste existem em imports mas não estão todas expostas em `Routes`; irrelevante para o 404 no edge antes de carregar JS.)*

### 3.3 Build e paths

- **Vite** `^5.0.8`, `build.outDir: 'dist'`, **sem `base`** explícito → base **`/`** (adequado a domínio na raiz).
- **`index.html`** na raiz do player; entrada Rollup: `index.html` apenas.
- **PWA** (`vite-plugin-pwa`): `workbox.navigateFallback: '/index.html'` — relevante **após** o SW estar ativo; **não substitui** resposta HTTP do primeiro pedido ao servidor para deep link em cenários onde o servidor devolve 404.

### 3.4 Configuração Vercel no repositório (player)

Ficheiro: `goldeouro-player/vercel.json`

- `framework: "vite"`, `outputDirectory: "dist"`, `buildCommand: "npm run build"`.
- **`rewrites`:**
  1. `"/download"` → `"/download.html"`
  2. `"/(.*)"` → `"/index.html"` (fallback SPA global)
- Existe **`public/download.html`** no projeto → após `vite build`, espera-se **`dist/download.html`** (ficheiro estático).

**Interpretação:** se este `vercel.json` for o **efetivamente aplicado** pelo projeto que serve `www.goldeouro.lol`, **não** se esperaria 404 Vercel em `/register` por falta de ficheiro físico.

---

## 4. Fatos confirmados

1. **`App.jsx` usa `BrowserRouter` e define rotas** para `/`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/game`, etc.
2. **`goldeouro-player/vercel.json` contém rewrite catch-all** `"/(.*)"` → `"/index.html"`.
3. **`vite.config.ts` não define `base` não trivial**; output em `dist`.
4. **`public/download.html` existe**; o primeiro rewrite aponta para `/download.html`.
5. **Não existe `vercel.json` na raiz do monorepo** (apenas em `goldeouro-player/`, `goldeouro-admin/`, `player-dist-deploy/`).
6. **Documentação interna** (`VALIDACAO-FUNCIONAL-COMPLETA-JOGADOR-PRODUCAO-POS-PIPELINE-2026-04-04.md`) confirma em produção: **`/` 200**, **rotas profundas 404** com **`X-Vercel-Error: NOT_FOUND`**.
7. **Documentação interna** (`PLANO-DE-RECONCILIACAO-SEGURA-BASELINE-P3DBCTXRr-POS-PIPELINE-2026-04-05.md`) indica **`vercel.json` idêntico** entre baseline e `origin/main` para o player.
8. **Workflow `frontend-deploy.yml`** faz deploy com `amondnet/vercel-action@v25`, **`vercel-version: '50.38.3'`**, **sem `working-directory`** no step da action (alinhado a correções documentadas para evitar duplicação de path com Root Directory).
9. **Smoke HTTP do pipeline** valida apenas **`/`** em `www` e apex — **não** inclui GET a rotas profundas.

---

## 5. Riscos reais

| Risco | Descrição |
|--------|-----------|
| **Manter como está** | Refresh e links diretos partidos; links de e-mail (`/reset-password?…`) inutilizáveis ao nível HTTP; SEO/partilha de URLs degradados. |
| **Corrigir “no escuro” só no código** | Alterar `App.jsx`/router **não resolve** 404 do edge se o servidor nunca servir `index.html`; risco de **mudanças inúteis** e conflitos com baseline visual. |
| **Quebrar baseline visual** | Qualquer mudança ampla em build, PWA, ou troca para `HashRouter` pode alterar URLs, caches ou comportamento percebido; deve evitar-se fora do mínimo. |
| **Regressão no player** | Erro em `vercel.json` (ordem de rewrites, destinos) pode quebrar assets, `/download.html`, ou headers; testes atuais **não** cobrem deep links em CI. |
| **Dois projetos / secrets errados** | Se o domínio apontar para deployment de **outro** projeto Vercel ou ID de projeto incorreto em CI, “o Git está certo” e produção continua errada. |

---

## 6. Hipóteses técnicas (por probabilidade — não são factos)

1. **Root Directory do projeto Vercel não é `goldeouro-player`** (ou está em path onde **não** se lê este `vercel.json`), pelo que o deployment corre **sem** os rewrites versionados → **404 em todas as rotas sem ficheiro físico**.
2. **Rotas / redirects / overrides no painel Vercel** entram em conflito ou substituem comportamento esperado do `vercel.json`.
3. **Domínio de produção associado a um deployment antigo ou a outro projeto** na conta/equipa, não ao artefacto gerado a partir deste repositório com este `vercel.json`.
4. **Diferença entre deploy via Git Integration vs CLI** (menos provável se ambos apontam ao mesmo projeto bem configurado, mas permanece como linha de auditoria).
5. **Bug ou limite específico de interpretação de rewrites** na combinação `cleanUrls` + `trailingSlash` + ordem de rewrites (menos provável que (1)–(3) dado o 404 uniforme documentado).

---

## 7. Arquivos e pontos de controle

### Alteração provável (futura cirurgia — quando autorizada)

- **`goldeouro-player/vercel.json`** — apenas se a pré-execução concluir que o ficheiro precisa ajuste (ex.: ordem, exclusões estáticas, compatibilidade com regras do painel) **ou** se for necessário duplicar política na raiz por decisão arquitetural (avaliar com cuidado).

### Revisão necessária (sem assumir edição)

- **Painel Vercel** do projeto ligado a `goldeouro.lol`: **Root Directory**, **Build & Output**, **Domains**, **Deployments** (qual deployment está em produção), secção **Routing** se existir overrides.
- **`.github/workflows/frontend-deploy.yml`**: confirmar que `VERCEL_PROJECT_ID` corresponde ao mesmo projeto que serve `www` (evidência histórica em relatórios de secrets).
- **`goldeouro-player/vite.config.ts`**: confirmar que nenhuma futura alteração introduz `base` incorreto (hoje OK).

### Não deveria precisar tocar (para resolver só o 404 de edge)

- **`App.jsx`** (rotas já corretas para SPA com histórico).
- **`main.jsx`**
- **Lógica de `ProtectedRoute`**, auth, saldo, PIX, jogo — **fora de escopo**; além disso, **404 atual ocorre antes** da app carregar, logo **não** é explicado por proteção de rota no cliente.

---

## 8. Dependências fora do Git

| Fonte | Relevância |
|--------|------------|
| **Painel Vercel** | **Alta** — Root Directory, domínios, deployment de produção, possíveis overrides de rotas. |
| **Secrets GitHub** (`VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, token) | **Alta** para garantir que o CI publica no **mesmo** projeto que serve o domínio. |
| **Variáveis de ambiente** | **Baixa** para este sintoma específico (404 de ficheiro/rota no edge); não alteram rewrites por si. |
| **Comportamento do host / DNS** | **Média-baixa** — o cabeçalho `X-Vercel-Error: NOT_FOUND` indica resposta **Vercel**, não um proxy arbitrário externo ao ecossistema Vercel. |

---

## 9. Escopo mínimo recomendado para cirurgia

1. **Confirmar** no painel qual projeto e qual **Root Directory** serve `www.goldeouro.lol`.
2. **Garantir** que o deployment de produção **aplica** o `vercel.json` de `goldeouro-player` (ou equivalente explícito no painel com o mesmo efeito: **fallback para `index.html`** para rotas da SPA).
3. **Validar** com GET (ou browser anónimo) pelo menos: `/register`, `/reset-password?token=test`, `/dashboard`, `/game`, `/download` — esperado **200** com documento HTML da SPA (ou redirecionamentos **aplicacionais** depois de carregar JS), **não** `NOT_FOUND` estático da Vercel.
4. **Estender smoke** do pipeline (futuro, governação) para **uma** rota profunda — opcional na mesma PR de correção de infra, mas recomendado para não regressar.

**Explícito:** não trocar `GameFinal`/`GameShoot`, não refatorar auth, não alterar backend.

---

## 10. Classificação final

### PRONTO PARA PRÉ-EXECUÇÃO

**Justificativa:** o repositório já permite fechar o **modelo técnico** (SPA + `vercel.json` com fallback) e contrapor ao **comportamento observado** em produção; a lacuna restante é **operacional/na plataforma** (painel + confirmação do projeto/deployment), que é **próprio** da fase de pré-execução/checklist, não de mais “código desconhecido”.

### AINDA NÃO PRONTO (se a pré-execução exigir fecho forense sem acesso ao painel)

**O que falta levantar:** screenshot ou export das definições **Root Directory**, **Production Deployment** ativo, e lista de **Redirects/Rewrites** no dashboard para o projeto que serve `www.goldeouro.lol`, mais confirmação de que **`VERCEL_PROJECT_ID`** no GitHub aponta para esse mesmo projeto.

---

## 11. Conclusão objetiva

- **Causa mais provável hoje:** os **rewrites SPA versionados não estão a ser aplicados** no edge do deployment que serve o domínio de produção — em geral por **desalinhamento de Root Directory / projeto Vercel / overrides**, não por ausência de rotas no React.
- **Risco principal:** “corrigir” React ou ficheiros de jogo **sem** corrigir o edge — **desperdício de risco** e possível **afastamento da baseline** sem resolver o 404.
- **Cirurgia pode ser pequena e isolada?** **Sim** — alvo típico é **configuração de deploy + verificação HTTP**, não rewrite da aplicação.
- **Seguro seguir para o Prompt Supremo — Pré-execução?** **Sim**, desde que a pré-execução inclua **checklist obrigatório do painel Vercel** e **smoke em rotas profundas** após qualquer alteração.

---

*Documento gerado em modo read-only; nenhuma alteração foi feita ao código ou à infraestrutura durante a sua elaboração.*
