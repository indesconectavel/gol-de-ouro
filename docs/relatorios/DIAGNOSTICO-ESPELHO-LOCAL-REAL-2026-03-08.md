# Diagnóstico do Espelho Local — Reancoragem Real

**Gol de Ouro — Diagnóstico read-only**  
**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, commit, build, produção, Vercel, banco ou env)

---

## 1. Commit produção

| Campo | Valor | Evidência |
|------|--------|-----------|
| **Deploy** | ez1oc96t1 | vercel-deployments-snapshot.json, INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md |
| **Commit SHA** | **7c8cf59** (7c8cf59bd7655cdf553cf54b541cd3900b9274ce) | INCIDENTE-REGRESSAO-GAME: "o deployment atual em produção é o build do main pós-merge do PR #30 (commit 7c8cf59)" |
| **Mensagem** | Merge pull request #30 from indesconectavel/hotfix/ledger-userid-fallback | git log 7c8cf59 -1 |
| **Data** | 2026-03-04 18:02:15 -0300 | Idem |
| **Branch** | main | Alias Vercel goldeouro-player-git-main-... |

Registro completo: **docs/relatorios/COMMIT-PRODUCAO-REAL.md**.

---

## 2. Commit local

| Campo | Valor | Evidência |
|------|--------|-----------|
| **Branch atual** | main | git branch --show-current |
| **HEAD (commit)** | 200b416a806508f441a2241686a19981d51b047a | git rev-parse HEAD |
| **Mensagem** | fix(deposito): simplificar tela Pagamentos para demo V1 - remove Verificar Status e leitura saldo não exibida | git log -1 --oneline |
| **Relação com origin/main** | main está **ahead 3** em relação a origin/main | git status -sb |
| **Working tree** | 5 arquivos modificados (não commitados): App.jsx, Navigation.jsx, config/api.js, AuthContext.jsx, ForgotPassword.jsx | git status |

**Conclusão:** O que está “rodando” no ambiente local (quem roda `npm run dev` ou usa o working tree) é o **código do commit 200b416 mais as modificações não commitadas** (saneamento do espelho). O último **commit** local é **200b416**, não 7c8cf59.

---

## 3. Comparação produção × local

### 3.1 Relação entre commits

- **7c8cf59 é ancestral de HEAD:** Sim (`git merge-base --is-ancestor 7c8cf59 HEAD` → sucesso). Ou seja, o commit de produção está na história do que está no main local.
- **Commits entre 7c8cf59 e HEAD (apenas commitados):**
  - 200b416 fix(deposito): simplificar tela Pagamentos para demo V1...
  - e9ef6ef docs: checklist withdraw fix - preencher SHA 258b0cd
  - b8a64b5 fix(player): tela de saque usa POST/GET withdraw/request e history

### 3.2 Arquivos divergentes (commit 7c8cf59 vs HEAD)

Lista completa de arquivos que **mudaram entre o commit de produção (7c8cf59) e o HEAD (200b416)** (apenas diferenças commitadas):

| Arquivo | Observação |
|---------|------------|
| docs/relatorios/FRONTEND-DEPOSITO-SIMPLIFICACAO-DEMO-2026-03-06.md | Doc |
| docs/relatorios/FRONTEND-DEPOSITO-SIMPLIFICACAO-DEMO-CHECKLIST-2026-03-06.md | Doc |
| docs/relatorios/FRONTEND-WITHDRAW-FIX-V1-2026-03-06.md | Doc |
| docs/relatorios/FRONTEND-WITHDRAW-FIX-V1-CHECKLIST-2026-03-06.md | Doc |
| **goldeouro-player/src/config/api.js** | Config |
| **goldeouro-player/src/pages/Pagamentos.jsx** | Página |
| **goldeouro-player/src/pages/Withdraw.jsx** | Página |
| **goldeouro-player/src/services/withdrawService.js** | Serviço |

Foco em **player (src/):** 4 arquivos: `config/api.js`, `pages/Pagamentos.jsx`, `pages/Withdraw.jsx`, `services/withdrawService.js`.

### 3.3 Modificações não commitadas (working tree)

Além disso, no working tree há **5 arquivos modificados** (saneamento do espelho), que também divergem do que está em 7c8cf59 (e do próprio 200b416):

| Arquivo | Tipo |
|---------|------|
| goldeouro-player/src/App.jsx | ToastContainer |
| goldeouro-player/src/components/Navigation.jsx | Saldo de user |
| goldeouro-player/src/config/api.js | logout redirect |
| goldeouro-player/src/contexts/AuthContext.jsx | Restauração de sessão |
| goldeouro-player/src/pages/ForgotPassword.jsx | Links para / |

**Resumo:** Em relação ao commit de produção (7c8cf59), o estado local efetivo (HEAD + working tree) diverge em **4 arquivos do player já commitados** e em **5 arquivos do player modificados** (saneamento). O arquivo `config/api.js` aparece nos dois conjuntos (mudou no commit e ainda tem alterações não commitadas).

---

## 4. Banner verde “VERSÃO ATUALIZADA”

### 4.1 Onde está no código

| Item | Valor |
|------|--------|
| **Arquivo** | goldeouro-player/src/components/VersionBanner.jsx |
| **Componente** | VersionBanner (default export) |
| **Texto** | "VERSÃO ATUALIZADA" na linha 29: `<span>VERSÃO ATUALIZADA {resolvedVersion}</span>` |
| **Condição de renderização** | Nenhuma: o componente sempre renderiza a barra. Não há `if` que esconda o banner; ele é exibido em toda página que o monta. |
| **Onde é usado** | Login, Register, ForgotPassword, ResetPassword, Dashboard, Profile, Pagamentos (import + `<VersionBanner showTime={true} />`). |

### 4.2 Estilo (barra verde)

- Classe da barra: `bg-green-600 text-white` (linha 25) — barra verde no topo.

### 4.3 Esse código existe em produção?

- **Sim.** O deploy ez1oc96t1 foi gerado a partir do commit **7c8cf59** (main). O arquivo VersionBanner.jsx já existia nesse commit e é importado em várias páginas (Login, Register, etc.). Portanto o **mesmo componente** (e portanto o banner verde) está no bundle de produção. O relatório de incidente (INCIDENTE-REGRESSAO-GAME) cita “barra de versão reapareceram”, ou seja, a barra de versão é visível em produção com o deploy atual.

**Conclusão:** O banner verde existe **tanto no código local quanto em produção**; é gerado por **VersionBanner.jsx** e não há condição que o desative em produção.

---

## 5. Bundle local (Vite, cache, dist)

- **dist/:** Não há pasta `dist` versionada no repositório em goldeouro-player; o build é gerado no deploy (Vercel) ou localmente com `npm run build`. Não foi executado build nesta auditoria.
- **Vite dev server:** Em desenvolvimento, o Vite serve o **código atual** do working tree (incluindo as 5 modificações do saneamento). Ou seja, quem roda `npm run dev` **não** está usando “build antigo” do player; está usando o código atual (200b416 + alterações não commitadas).
- **Cache / node_modules:** Não foi inspeccionado; em modo read-only não foi feita limpeza nem rebuild. Se houver cache ou build antigo em disco, o navegador pode estar servido por esse build antigo **somente** se o usuário abrir um `index.html` de uma pasta `dist` antiga; com `npm run dev`, o que vale é o código atual.
- **Conclusão:** Se o ambiente “local” for o **dev server (npm run dev)**, o navegador está usando **código atualizado** (HEAD + working tree), não código antigo. Se for uma abertura direta de `dist/index.html` de um build antigo, aí sim seria “código antigo”; isso não foi verificado.

---

## 6. Causa real da divergência

1. **Produção parou em um commit, o main local avançou.**  
   O deploy ez1oc96t1 foi gerado a partir do commit **7c8cf59**. O main local está no commit **200b416** (3 commits à frente). Portanto o **código em produção** é estritamente **anterior** ao último commit local.

2. **Há mudanças commitadas no player que não estão em produção.**  
   Entre 7c8cf59 e 200b416 foram alterados 4 arquivos no player: api.js, Pagamentos.jsx, Withdraw.jsx, withdrawService.js (correções de saque e simplificação de Pagamentos/demo). Essas alterações **não** estão no bundle de ez1oc96t1.

3. **Há mudanças não commitadas (saneamento).**  
   As 5 alterações do saneamento do espelho (App, Navigation, config/api, AuthContext, ForgotPassword) existem apenas no working tree; não estão em 7c8cf59 nem em 200b416. Ou seja, o “espelho” que a equipe validou (main + saneamento) é **ainda mais** diferente do que está em produção do que só “main vs produção”.

4. **Resumo.**  
   O ambiente local **não** reflete exatamente o mesmo código que está em produção porque:  
   - produção = **7c8cf59**;  
   - local (commit) = **200b416** (3 commits à frente);  
   - local (efetivo) = **200b416 + 5 arquivos modificados** (saneamento).  
   A divergência é **local à frente** (novos commits + alterações não commitadas), não “código antigo” no local.

---

## 7. Instrução segura para alinhar o espelho

Sem alterar produção, Vercel ou banco, as opções **seguras** (apenas no repositório local) são:

**Opção A — Alinhar o código local ao commit de produção (reproduzir exatamente o que está em ez1oc96t1):**

1. Fazer backup ou anotar o estado atual (branch, modificações).
2. `git checkout 7c8cf59 -- goldeouro-player/` (ou checkout da branch em 7c8cf59 e trabalhar a partir daí) para que a árvore do player fique igual ao commit que gerou ez1oc96t1.
3. Não fazer commit nem push sem critério explícito; usar branch de trabalho se necessário.
4. Rodar `npm run build` no player e conferir se o bundle gerado é equivalente ao de produção (fingerprint), se desejar validar.

**Opção B — Manter o local como “espelho à frente” (recomendado pela reconciliação):**

1. Manter main em 200b416 e as alterações do saneamento (ou commitá-las em main ou em branch).
2. Tratar o local como **espelho confiável da produção exceto** pelos BLOCOs e pelas diferenças já documentadas (commits 7c8cf59..200b416 + saneamento).
3. Quando quiser **reproduzir** exatamente o comportamento de ez1oc96t1, usar checkout do commit 7c8cf59 (ou branch que aponte para ele) apenas para comparação ou testes, sem sobrescrever o main de desenvolvimento.

**Nenhuma dessas ações foi executada nesta auditoria (read-only).**

---

## 8. Respostas diretas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | O local está rodando o mesmo commit da produção? | **Não.** Produção = 7c8cf59. Local (último commit) = 200b416. Local (efetivo) = 200b416 + 5 arquivos modificados. |
| 2 | Qual commit gerou o deploy ez1oc96t1? | **7c8cf59** (Merge pull request #30 — hotfix/ledger-userid-fallback). |
| 3 | Qual commit está rodando no local? | **200b416** (fix deposito: simplificar tela Pagamentos...). O que “roda” no dev server é 200b416 + working tree (5 arquivos do saneamento). |
| 4 | O banner verde existe em produção? | **Sim.** O componente VersionBanner.jsx está no código que gerou ez1oc96t1 (7c8cf59) e é montado em várias páginas; o relatório de incidente confirma que a barra de versão aparece em produção. |
| 5 | Qual arquivo gera esse banner? | **goldeouro-player/src/components/VersionBanner.jsx** (linha 29: "VERSÃO ATUALIZADA"; linha 25: barra verde `bg-green-600`). |
| 6 | O local está usando código antigo? | **Não.** O local está usando código **mais novo** que o de produção (3 commits à frente + alterações do saneamento). |
| 7 | O espelho local é confiável ou não? | **Divergente em relação ao “exatamente igual”.** Como espelho **estrito** do que está em ez1oc96t1, **não** (commit e arquivos diferentes). Como base de desenvolvimento “espelho com exceções documentadas” (reconciliação e validação do espelho), **sim**, desde que se aceite que o local está à frente (commits + saneamento) e que exceções são as dos BLOCOs e as já listadas. |

---

## 9. Classificação final

**B — ESPELHO DIVERGENTE**

- **Motivo:** O ambiente local **não** reflete **exatamente** o mesmo código que está em produção: produção = 7c8cf59; local = 200b416 + 5 arquivos modificados. Há diferença objetiva de commit e de conteúdo (arquivos divergentes listados acima).
- **Não significa** que o local seja “não confiável” para desenvolvimento: a reconciliação e a validação do espelho concluíram que a main (com saneamento) pode ser tratada como **espelho confiável da produção com exceções documentadas**. Esta classificação B refere-se apenas à pergunta “o local reflete **exatamente** o mesmo código que produção?” — e a resposta é **não**, por causa dos 3 commits e das 5 alterações não commitadas (e das 4 alterações já commitadas no player em 7c8cf59..200b416).

---

*Diagnóstico realizado em modo READ-ONLY. Nenhum código, commit, build, produção, Vercel, banco ou variável de ambiente foi alterado.*
