# Baseline FyKKeg6zb — Commit de origem (auditoria READ-ONLY)

**Data:** 2026-03-06  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, commit, deploy, Vercel ou pipeline).  
**Objetivo:** Identificar qual commit do repositório gerou o deployment FyKKeg6zb no Vercel (baseline oficial do frontend) e qual estado do repositório produz o bundle oficial index-qIGutT6K.js.

---

## 1) Deployment FyKKeg6zb no Vercel

As informações abaixo foram obtidas a partir de documentação existente e respostas HTTP; **não** houve acesso à API ou ao dashboard da Vercel.

| Item | Valor / conclusão |
|------|--------------------|
| **Deployment ID** | FyKKeg6zb (completo: dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX) |
| **Commit SHA** | **Não exposto** nas respostas HTTP nem no repositório. O Vercel associa o deployment a um commit no momento do deploy; essa associação não foi consultada (modo READ-ONLY, sem API). |
| **Branch** | Inferido **main** (documentação anterior indica deploy a partir de main). |
| **Build command** | `vite build` (fonte: goldeouro-player/package.json). |
| **Node version** | Não fixada no package.json do player; não verificada nesta auditoria. |
| **Environment** | Production (Vercel). |
| **Build date (evidência)** | 16 Jan 2026 05:25:34 UTC (Last-Modified do bundle JS em produção, relatório POST-ROLLBACK-VERCEL-FyKKeg6zb). |

**Limitação:** Sem API Vercel ou dashboard, não é possível obter o commit SHA exato vinculado ao deployment FyKKeg6zb. O snapshot vercel-deployments-50.json associa o alias www/app/goldeouro.lol ao deployment **m38czzm4q** com id `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`, sem campo de commit.

---

## 2) Bundle do baseline

| Item | Valor |
|------|--------|
| **Bundle JS oficial** | index-qIGutT6K.js |
| **Bundle CSS oficial** | index-lDOJDUAS.css |
| **Build que gera o bundle** | Vite (goldeouro-player), comando `vite build`. |
| **Hash de build** | O sufixo **qIGutT6K** é gerado pelo Rollup/Vite a partir do conteúdo dos módulos no momento do build; **não existe** metadado no repositório que indique qual commit produz esse hash. |
| **Como reproduzir** | Buildar o commit de origem (inferido abaixo) com as mesmas dependências e variáveis de ambiente; o hash de saída depende do conteúdo do projeto naquele commit. |

Registro: `docs/relatorios/baseline-build-info.json`.

---

## 3) Histórico Git

### 3.1 Commit correspondente ao FyKKeg6zb

- **Commit exato que gerou FyKKeg6zb:** **não determinável** apenas com o repositório local e a documentação consultada. O build em produção é de **16 Jan 2026**; no histórico do path `goldeouro-player/` **não há commits** entre **2025-11-15** e **2026-02-05**. Portanto, o commit que o Vercel usou para o build de 16 Jan não fica identificado por data no histórico atual.

### 3.2 Referências documentais e inferência

| Ref | Uso |
|-----|-----|
| **d8ceb3b** | “Referência git usada em docs para estável” (REVISAO-GERAL-V1-FINANCEIRO-E-FLUXO-2026-02-28). Commit: `chore: checkpoint pre-v1 stable`, **2026-02-05**. É um **checkpoint posterior** ao build de 16 Jan; não é o commit que gerou o build, e sim a referência estável documentada. |
| **0a2a5a1** | Citado em DIFF-PR29-vs-FyKKeg6zb como possível commit em main na época do build (“ex.: 0a2a5a1 ou anterior”). Merge PR #18, **2025-11-15**. |
| **7dbb4ec** | Último commit que altera `goldeouro-player/` antes do intervalo sem commits (2025-11-15). Mensagem: `fix: corrigir CSP para permitir scripts externos (PostHog e GTM)`. |

**Conclusão para “commit que gerou FyKKeg6zb”:**  
Com os dados disponíveis, o **melhor proxy** é **0a2a5a1** (ou um ancestral dele, ex.: **7dbb4ec**), por serem os últimos commits no repositório que tocam o player antes da data do build. **Equivalência exata** entre um SHA e o build de 16 Jan **não é verificável** sem o commit SHA retornado pela Vercel para esse deployment.

### 3.3 Alterações relevantes e branch/tag

- Entre **7dbb4ec/0a2a5a1** e **d8ceb3b** há a sequência do PR #29 (payments UI, etc.); o bundle index-qIGutT6K corresponde a um estado **anterior** a essas alterações (e anterior ao checkpoint d8ceb3b).
- **Branch de origem inferida:** main.  
- **Tag associada:** Nenhuma tag no repositório aponta especificamente ao “commit do FyKKeg6zb”; existem tags como v1.2.0, v1.2.1, v1.1.1 (lista em baseline-repo-state.json).

Registro: `docs/relatorios/baseline-commit-origin.json`.

---

## 4) Repositório atual

| Pergunta | Resposta |
|----------|----------|
| **O commit de referência (d8ceb3b) ainda existe no repositório?** | **Sim.** `git rev-parse d8ceb3b` retorna d8ceb3bb65a888069ab8f9d84e6561476b822568. |
| **O commit inferido (0a2a5a1) ainda existe?** | **Sim.** |
| **HEAD atual corresponde à baseline?** | **Não.** HEAD atual: b0448dc (fix(ci): frontend-deploy - nao bloquear PR por npm audit), branch hotfix/financeiro-v1-stabilize, 2026-03-06. A baseline FyKKeg6zb (index-qIGutT6K.js) corresponde a um estado anterior (main na época do build 16 Jan ou ao checkpoint d8ceb3b). |
| **Estado do repositório em relação à baseline** | O repositório está **à frente** da baseline: há commits de correção de saque, depósito e CI (ex.: 258b0cd, 8c020af, b0448dc). Para redeploy que reproduza o bundle oficial seria necessário buildar a partir de um commit anterior a esses (ex.: 0a2a5a1 ou 7dbb4ec, ou o SHA que a Vercel mostrar para FyKKeg6zb). |

Registro: `docs/relatorios/baseline-repo-state.json`.

---

## 5) Entregas (caminhos)

| Arquivo | Descrição |
|---------|-----------|
| `docs/relatorios/BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md` | Este relatório. |
| `docs/relatorios/baseline-commit-origin.json` | Commit de origem inferido, referências documentais, datas. |
| `docs/relatorios/baseline-build-info.json` | Build command, bundle oficial, data do build. |
| `docs/relatorios/baseline-repo-state.json` | Estado atual do repositório e existência dos commits. |

---

## SAÍDA FINAL

- **Commit que gerou FyKKeg6zb:** **Não identificado de forma inequívoca.** Inferido a partir de documentação: **0a2a5a1** (Merge PR #18, 2025-11-15) ou **7dbb4ec** (fix CSP, 2025-11-15) como últimos commits no player antes da data do build (16 Jan 2026). A referência estável documentada é **d8ceb3b** (checkpoint pre-v1 stable), que é posterior ao build.
- **Branch de origem:** **main** (inferido).  
- **Bundle associado:** **index-qIGutT6K.js** (CSS: index-lDOJDUAS.css).  
- **Commit ainda existe no repositório?** **Sim** — tanto d8ceb3b quanto 0a2a5a1 e 7dbb4ec existem.  
- **Estado do repositório atual em relação à baseline:** **À frente.** HEAD está em hotfix/financeiro-v1-stabilize com commits posteriores à baseline; para reproduzir o bundle oficial seria necessário buildar a partir de 0a2a5a1 (ou do SHA exato do deployment FyKKeg6zb, se obtido via Vercel).
