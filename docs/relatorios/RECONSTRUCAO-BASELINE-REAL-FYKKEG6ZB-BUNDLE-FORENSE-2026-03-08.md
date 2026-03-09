# Reconstrução da baseline real FyKKeg6zb pelo fingerprint do bundle — Forense

**Projeto:** Gol de Ouro  
**Data:** 2026-03-08  
**Modo:** READ-ONLY / FORENSE / DIAGNÓSTICO — Nenhuma alteração de código, deploy, push, merge, rebase, banco, Fly, Vercel ou env.

---

## 1. Resumo executivo

Foi realizada uma investigação forense para descobrir o estado real do código que gerou o deploy validado **FyKKeg6zb**, usando como fingerprint principal os bundles **index-qIGutT6K.js** e **index-lDOJDUAS.css**. Conclusões:

- **Fingerprints confiáveis:** index-qIGutT6K.js (478 903 bytes), index-lDOJDUAS.css; build date 2026-01-16T05:25:34Z; SHA256 HTML raiz BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0.
- **Commit candidato mais forte no Git:** **0a2a5a1** (ou **7dbb4ec**) — último commit que toca `goldeouro-player/` antes da lacuna 2025-11-15 a 2026-02-05; **não** reproduz o hash do bundle (build local gera index-CXrYbj39.js / index-sYayxj5X.css e tamanho ~379 kB vs 478 kB da baseline).
- **Banner verde:** No código do commit proxy (0a2a5a1/7dbb4ec), **Login.jsx já importa e renderiza VersionBanner**; a produção validada é descrita como “sem barra de versão”. A divergência é coerente com: (a) baseline ter sido build a partir de estado **anterior** à inclusão do VersionBanner no Login (ex.: **def1d3b**), ou (b) deploy manual/local com código diferente, ou (c) descrição “sem banner” referir-se apenas ao VersionWarning/spam, não ao VersionBanner visual.
- **Login:** No preview da baseline (branch baseline/fykkeg6zb em 0a2a5a1) o login falha porque o frontend em localhost usa **API_BASE_URL = http://localhost:8080** (environments.js); não há backend em 8080 → erro de rede → “Erro ao fazer login”. Na produção validada (FyKKeg6zb) o mesmo código era servido pelo Vercel com hostname goldeouro.lol → **production** → API_BASE_URL = https://goldeouro-backend-v2.fly.dev → login funcionava. A diferença é **apenas de ambiente (hostname/API_BASE_URL)**, não de contrato ou código de auth.
- **Baseline real pode ser reconstruída só com Git?** **Não de forma determinística.** Nenhum commit do repositório foi confirmado a produzir exatamente qIGutT6K/lDOJDUAS; o build local a partir de 0a2a5a1 gera hashes e tamanho diferentes. A reconstrução exata exigiria o SHA do commit associado ao deployment FyKKeg6zb (API/dashboard Vercel) e/ou o mesmo ambiente de build (Node, npm, Vite, lockfile) da Vercel em 16 Jan 2026.

**Status final da investigação:** **BASELINE REAL AINDA NÃO IDENTIFICADA** (estado exato do código que gerou qIGutT6K/lDOJDUAS não foi determinado com certeza; o melhor proxy documentado continua sendo 0a2a5a1/7dbb4ec).

---

## 2. Fingerprints confiáveis do FyKKeg6zb

| Item | Valor | Fonte |
|------|--------|--------|
| Deployment ID | FyKKeg6zb (dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX) | baseline-frontend-rollback.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL |
| Bundle JS | index-**qIGutT6K**.js, path /assets/index-qIGutT6K.js | baseline-frontend-bundles.json, baseline-frontend-fingerprint.json |
| Bundle CSS | index-**lDOJDUAS**.css, path /assets/index-lDOJDUAS.css | idem |
| Tamanho JS | 478 903 bytes | baseline-frontend-bundles.json, BACKUP-GAME-FYKKeg6zb |
| Build date | 2026-01-16T05:25:34Z (Last-Modified) | POST-ROLLBACK-VERCEL-FyKKeg6zb, baseline-build-info.json |
| SHA256 HTML (/) | BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0 | baseline-frontend-fingerprint.json |
| Outros assets | /registerSW.js | baseline-frontend-fingerprint.json |

**Confiabilidade:** Alta para deployment, nomes de bundle, tamanho e data; não há SHA do commit no repositório nem nos artefatos locais.

---

## 3. Evidências coletadas na Vercel

- **Fonte:** Documentação e relatórios existentes (sem acesso à API/dashboard Vercel).
- **Deploy:** Publicado via **vercel deploy**; **não** ligado a um branch Git visível na Vercel.
- **Build command:** `vite build` (goldeouro-player/package.json).
- **Package.json da Source page:** Não consultado (read-only).
- **Lista de assets:** index-qIGutT6K.js, index-lDOJDUAS.css, registerSW.js; documentados em baseline-frontend-bundles.json e GET em produção na época da auditoria.
- **Limitação:** Commit SHA associado ao deployment FyKKeg6zb não está disponível nos artefatos locais.

---

## 4. Diferenças críticas entre preview baseline e Current validado

### 4.1 UI / Banner

| Aspecto | Preview baseline (0a2a5a1 / branch baseline/fykkeg6zb) | FyKKeg6zb validado (documentado) |
|--------|-------------------------------------------------------|-----------------------------------|
| VersionBanner | **Presente** em Login.jsx (import + `<VersionBanner showTime={true} />`) no commit 0a2a5a1 | Descrito como “sem barra de versão” / “baseline validada sem esse comportamento” (compare-preview-vs-baseline-risk.json) |
| VersionWarning | Presente em App.jsx no commit 0a2a5a1 | “VersionWarning ativo no preview; baseline validada sem esse comportamento” |
| Bundle | Build local a partir de 0a2a5a1 → index-CXrYbj39.js, index-sYayxj5X.css (~379 kB) | index-qIGutT6K.js, index-lDOJDUAS.css (478 903 bytes) |

**Origem provável do banner divergente:** No histórico, **def1d3b** (Initial commit) tem Login **sem** import de VersionBanner; **a7561e7** (“feat: Finalização completa do projeto v1.2.0”) introduz build info e documentação; **1224d05** cria VersionBanner.jsx; **a7561e7** é o commit em que o Login passa a usar VersionBanner. Os commits **0a2a5a1** e **7dbb4ec** são **posteriores** a a7561e7, portanto em ambos o Login **já** inclui VersionBanner. Conclusão: o estado “sem banner” na baseline validada é coerente com (a) um build a partir de commit **anterior** a a7561e7 (ex.: def1d3b), ou (b) deploy a partir de outro estado (manual/local) sem VersionBanner no Login, ou (c) interpretação de “sem esse comportamento” apenas para VersionWarning/spam. O tamanho do bundle da baseline (478 kB) é **maior** que o build local em 0a2a5a1 (~379 kB), o que não apoia a hipótese de baseline = def1d3b (código mais enxuto); sugere antes diferença de ambiente de build (dependências, chunking, minificação) ou inclusão de mais código no bundle da Vercel.

### 4.2 Login

| Aspecto | Preview baseline em localhost | FyKKeg6zb em produção (documentado) |
|--------|-------------------------------|-------------------------------------|
| API_BASE_URL | development → **http://localhost:8080** (environments.js por hostname) | production → **https://goldeouro-backend-v2.fly.dev** |
| Comportamento | Sem backend em 8080 → erro de rede → “Erro ao fazer login” | Login funcional (rotas /, /game, /dashboard validadas) |
| Contrato | POST /api/auth/login, payload e respostas conforme server-fly.js | Idem |

**Origem provável da diferença de login:** **Ambiente de execução**, não código. Em localhost o frontend usa `getCurrentEnvironment()` (environments.js) → hostname localhost → `API_BASE_URL: 'http://localhost:8080'`. No domínio de produção (goldeouro.lol) o mesmo código usa production → `API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev'`. O login “quebrado” no preview da baseline deve-se apenas ao **alvo da API em localhost** (8080 sem serviço); não há evidência de que o bundle FyKKeg6zb tivesse lógica de auth ou endpoints diferentes.

---

## 5. Origem provável do banner

- **Código:** VersionBanner.jsx (e uso em Login, Register, ForgotPassword, ResetPassword, Profile, Pagamentos) e VersionWarning em App.jsx.
- **Histórico:** VersionBanner aparece em Login a partir de **a7561e7**; em **0a2a5a1/7dbb4ec** já está presente. O commit **8741bcc** (Mar 2026) introduz “gate version banner behind env flag” — **posterior** ao build da baseline (16 Jan 2026), portanto não explica “sem banner” na baseline.
- **Conclusão:** A baseline validada “sem barra de versão” é mais bem explicada por: (1) build a partir de estado **anterior** à inclusão do VersionBanner no Login (commit anterior a a7561e7), com ressalva do tamanho maior do bundle; ou (2) deploy a partir de fonte não refletida no histórico atual (build manual/local); ou (3) descrição documental referindo-se apenas ao comportamento de VersionWarning (spam/setInterval), não ao banner verde.

---

## 6. Origem provável do login funcional vs quebrado

- **Funcional em produção (FyKKeg6zb):** Hostname goldeouro.lol → ambiente production → API_BASE_URL = https://goldeouro-backend-v2.fly.dev → requisições atingem o backend → login OK.
- **Quebrado no preview da baseline em localhost:** Hostname localhost → environment development → API_BASE_URL = http://localhost:8080 → sem processo em 8080 → erro de rede → “Erro ao fazer login”.
- **Conclusão:** A diferença é **apenas de configuração de ambiente (hostname → API_BASE_URL)**; AuthContext, config/api.js e contrato da API estão alinhados. Não é necessário código nem env “diferente” no bundle para explicar o login em produção; é necessário apenas que o mesmo código rode no domínio de produção (ou que localhost use override para apontar para o backend de produção, conforme documentado em OVERRIDE-LOCAL-TEMPORARIO-BRANCH-ESPELHO-EZ1OC96T1-2026-03-08.md).

---

## 7. Commits candidatos encontrados

| Commit | Mensagem | Data | Relação com player | Observação |
|--------|----------|------|--------------------|------------|
| **0a2a5a1** | Merge PR #18 (security/fix-ssrf-vulnerabilities) | 2025-11-15 | Merge que inclui 7dbb4ec; último merge em main antes da lacuna de commits no player | Candidato principal documentado (BASELINE-FYKKeg6zb-COMMIT-ORIGEM, baseline-commit-origin.json). Build local **não** reproduz qIGutT6K/lDOJDUAS. |
| **7dbb4ec** | fix: corrigir CSP para permitir scripts externos (PostHog e GTM) | 2025-11-15 | Último commit que altera goldeouro-player/ antes da lacuna 2025-11-15 a 2026-02-05 | Alternativa ao 0a2a5a1; mesmo período; build local gera hash diferente (ex.: Du8_MyBi/sYayxj5X). |
| **d8ceb3b** | chore: checkpoint pre-v1 stable | 2026-02-05 | Posterior ao build de 16 Jan; referência estável em docs | **Não** candidato ao estado do FyKKeg6zb (é posterior). |
| **def1d3b** | Initial commit Gol de Ouro v1.2.0 | — | Login **sem** VersionBanner | Único estado no histórico com Login sem VersionBanner; bundle seria esperado menor; tamanho da baseline (478 kB) não apoia baseline = def1d3b. |
| **a7561e7** | feat: Finalização completa do projeto v1.2.0… build info automático | — | Introduz build info, VersionBanner em páginas | Ponto a partir do qual Login passa a exibir VersionBanner; anterior a 7dbb4ec/0a2a5a1. |

Nenhum outro commit no repositório foi identificado como gerador direto do par qIGutT6K/lDOJDUAS.

---

## 8. Resultado dos builds locais controlados

Conforme CONFIRMACAO-DEFINITIVA-BASELINE-GAME-2026-03-08:

- **Build a partir de 0a2a5a1:**  
  - JS: **index-CXrYbj39.js** (~379 519 bytes)  
  - CSS: **index-sYayxj5X.css** (~70 857 bytes)
- **Build a partir de 7dbb4ec:**  
  - JS: **index-Du8_MyBi.js** (~378 kB)  
  - CSS: **index-sYayxj5X.css** (igual)

**Nenhum** build local reproduziu index-**qIGutT6K**.js nem index-**lDOJDUAS**.css. O tamanho do JS da baseline (478 903 bytes) é ~100 kB maior que o gerado localmente, indicando diferença de ambiente (Node/npm/Vite, lockfile, variáveis, chunking ou conteúdo incluído no bundle).

**Conclusão:** Nenhum build local aproximou o fingerprint qIGutT6K/lDOJDUAS; a baseline real **não** foi reproduzida por build a partir dos commits candidatos no repositório atual.

---

## 9. Candidato mais provável ao estado real do FyKKeg6zb

- **Melhor proxy no Git:** **0a2a5a1** (ou **7dbb4ec**) — sustentado por cronologia (lacuna de commits no player entre 2025-11-15 e 2026-02-05), por documentação (DIFF-PR29, baseline-commit-origin.json, RECUPERACAO-COMMIT-FyKKeg6zb) e por consistência com “estado anterior ao PR #29”.
- **Confiança:** **Média.** Sobe para alta apenas com: (1) SHA do commit retornado pela Vercel para o deployment FyKKeg6zb, ou (2) build local (ou em pipeline idêntico ao da Vercel) que gere exatamente qIGutT6K/lDOJDUAS a partir de um commit conhecido.
- **Ressalva:** O estado de **código** (rotas, App.jsx, /game → GameShoot) no proxy 0a2a5a1/7dbb4ec é o mais próximo documentado da baseline; o **bundle exato** (hash e tamanho) não foi reproduzido, portanto o “estado real” que gerou o artefato servido em FyKKeg6zb permanece **não identificado de forma inequívoca**.

---

## 10. Nível de confiança da reconstrução

| Pergunta | Nível | Motivo |
|----------|--------|--------|
| Fingerprint (qIGutT6K/lDOJDUAS) é o da baseline? | **Alto** | Documentação e GET em produção na época. |
| Commit 0a2a5a1/7dbb4ec é o que a Vercel usou? | **Médio** | Inferência por cronologia e docs; sem SHA da Vercel. |
| Build a partir desse commit reproduz o bundle? | **Não** | Hashes e tamanho diferentes nos builds locais. |
| Baseline real pode ser reconstruída só com Git? | **Não** | Nenhum commit confirmado a gerar o bundle exato. |
| Dependemos de artefatos externos ao Git? | **Sim** | SHA do deployment (Vercel) ou cópia do bundle/cache de build ajudariam a fechar o elo. |

---

## 11. Próximo passo recomendado

1. **Obter o commit SHA do deployment FyKKeg6zb** via API ou dashboard da Vercel (ex.: meta.gitSourceRevision ou equivalente), se possível, para fixar o estado exato do código.
2. **Reproduzir o ambiente de build da Vercel** (Node, npm, lockfile, env) e executar `vite build` no commit retornado (ou em 0a2a5a1/7dbb4ec) para tentar igualar o hash e o tamanho do bundle.
3. **Manter 0a2a5a1 (e tag fykkeg6zb-baseline / branch baseline/fykkeg6zb)** como referência operacional de **código** da baseline, e **qIGutT6K/lDOJDUAS** como critério de **fingerprint** para rollback ou comparação de futuros deploys.
4. **Não alterar produção, deploy, push, merge, rebase, banco, Fly, Vercel ou env** até conclusão da análise ou decisão explícita de evoluir a partir da produção atual (ez1oc96t1).

---

## Arquivos de referência

- docs/relatorios/BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md  
- docs/relatorios/BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md  
- docs/relatorios/CONFIRMACAO-DEFINITIVA-BASELINE-GAME-2026-03-08.md  
- docs/relatorios/ELIMINACAO-FINAL-INCERTEZAS-BASELINE-GAME-2026-03-08.md  
- docs/relatorios/RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08.md  
- docs/relatorios/REANCORAGEM-BASELINE-FYKKEG6ZB-2026-03-08.md  
- docs/relatorios/DIAGNOSTICO-LOGIN-BRANCH-ESPELHO-EZ1OC96T1-2026-03-08.md  
- docs/relatorios/OVERRIDE-LOCAL-TEMPORARIO-BRANCH-ESPELHO-EZ1OC96T1-2026-03-08.md  
- docs/relatorios/baseline-frontend-fingerprint.json  
- docs/relatorios/baseline-frontend-bundles.json  
- docs/relatorios/baseline-commit-origin.json  
- docs/relatorios/baseline-build-info.json  
- docs/relatorios/compare-preview-vs-baseline-risk.json  

---

*Investigação realizada em modo READ-ONLY/FORENSE. Nenhum código, deploy, Git (push/merge/rebase), banco, Fly, Vercel ou env foi alterado.*

---

## SAÍDA FINAL OBRIGATÓRIA

1. **Fingerprints confirmados do FyKKeg6zb:** index-**qIGutT6K**.js (478 903 bytes), index-**lDOJDUAS**.css; build date 2026-01-16T05:25:34Z; SHA256 HTML raiz BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0.

2. **Origem provável do banner divergente:** No código do commit proxy (0a2a5a1/7dbb4ec) o Login já usa VersionBanner (desde a7561e7). A baseline validada é descrita como “sem barra de versão”. Origens plausíveis: (a) build a partir de commit **anterior** a a7561e7 (ex.: def1d3b, onde Login não importa VersionBanner), com ressalva do tamanho maior do bundle; (b) deploy manual/local com código diferente; (c) descrição referindo-se apenas ao VersionWarning (spam), não ao banner verde.

3. **Origem provável da diferença de login:** **Ambiente (hostname → API_BASE_URL).** Em localhost o frontend usa development → localhost:8080; sem backend em 8080 → “Erro ao fazer login”. Em produção (goldeouro.lol) o mesmo código usa production → goldeouro-backend-v2.fly.dev → login funcional. Não é diferença de código nem de contrato de auth.

4. **Commits candidatos encontrados:** **0a2a5a1** (Merge PR #18, 2025-11-15); **7dbb4ec** (fix CSP, 2025-11-15); **def1d3b** (Login sem VersionBanner, não compatível com tamanho do bundle); **d8ceb3b** (checkpoint posterior, não candidato).

5. **Algum build local aproximou o bundle qIGutT6K/lDOJDUAS?** **Não.** Builds a partir de 0a2a5a1 e 7dbb4ec geraram index-CXrYbj39/Du8_MyBi (JS) e index-sYayxj5X (CSS), com tamanho ~379 kB vs 478 kB da baseline.

6. **Candidato mais provável ao estado real:** **0a2a5a1** (ou **7dbb4ec**) como **proxy de código** da baseline; o **bundle exato** (qIGutT6K/lDOJDUAS) não foi reproduzido por nenhum build local documentado.

7. **A baseline real pode ser reconstruída só com Git?** **Não** de forma determinística. Nenhum commit foi confirmado a produzir exatamente esse fingerprint; depende do SHA do deployment (Vercel) e/ou do mesmo ambiente de build.

8. **Maior risco técnico restante:** Impossibilidade de rollback **exato** para o mesmo artefato (qIGutT6K/lDOJDUAS) sem o SHA do commit da Vercel ou sem reproduzir o ambiente de build; qualquer redeploy a partir do Git atual gera hashes diferentes.

9. **Próximo passo recomendado:** Obter o commit SHA do deployment FyKKeg6zb via API/dashboard Vercel; reproduzir ambiente de build (Node, npm, Vite, lockfile) e rodar `vite build` nesse commit; manter 0a2a5a1 e fingerprint qIGutT6K/lDOJDUAS como referência operacional até confirmação.

10. **Status final da investigação:** **BASELINE REAL AINDA NÃO IDENTIFICADA**
