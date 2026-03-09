# Comparação preview vs baseline FyKKeg6zb — Auditoria READ-ONLY

**Data:** 2026-03-06  
**Tipo:** Auditoria READ-ONLY (release/frontend)  
**Objetivo:** Comparar um novo preview/deployment do frontend do player contra a baseline oficial FyKKeg6zb e determinar se é idêntico, aceitável para promote ou não aceitável por risco de regressão.

---

## 1) Resumo executivo

Foi comparado o deployment **ez1oc96t1** (URL de preview direta do Vercel) contra a **baseline oficial FyKKeg6zb**. O preview utiliza **bundles diferentes** (index-DVt6EjKW.js / index-BplTpheb.css) e HTML com fingerprint distinto; contém VersionWarning ativo e barra de versão já reportada como regressão em documento anterior; **não** contém as correções de saque (/api/withdraw/request) nem a simplificação do depósito (ainda inclui "Verificar Status").  

**Conclusão:** O preview **não** é idêntico à baseline; há **risco alto** de regressão; **não** é aceitável promover este preview como substituição da baseline sem validação adicional e alinhamento de funcionalidades.

---

## 2) Preview analisado

| Campo | Valor |
|-------|--------|
| Deployment ID | **ez1oc96t1** |
| URL | https://goldeouro-player-ez1oc96t1-goldeouro-admins-projects.vercel.app |
| Branch / commit | Não informado (deployment listado no snapshot de produção) |
| Status | Ready |
| Identificação | Utilizado como alvo por ausência de URL de preview informada; corresponde ao deployment atualmente listado como produção em vercel-deployments-snapshot.json. |

Registro: `docs/relatorios/compare-preview-vs-baseline-meta.json`.

---

## 3) Comparação de fingerprint

| Item | Baseline (FyKKeg6zb) | Preview (ez1oc96t1) | Status |
|------|----------------------|---------------------|--------|
| Status HTTP (/) | 200 | 200 | Igual |
| Server | Vercel | Vercel | Igual |
| Tamanho HTML (/) | 8985 bytes | 1132 bytes | **Diferente** |
| SHA256 HTML (/) | BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0 | FD63C907FEB1F2A55C2E0970C39B88A4E8CE7ECFF607A7AC62CCAA48140A27F4 | **Diferente** |
| Bundle JS | index-qIGutT6K.js | index-DVt6EjKW.js | **Diferente** |
| Bundle CSS | index-lDOJDUAS.css | index-BplTpheb.css | **Diferente** |
| /game (GET direto) | 200 | 404 | Diferente (SPA) |
| /dashboard (GET direto) | 200 | 404 | Diferente (SPA) |

**Classificação:** **diferente preocupante** — bundles e HTML distintos; preview inclui banner "VERSÃO ATUALIZADA" e assets com hashes diferentes da baseline oficial.

Registro: `docs/relatorios/compare-preview-vs-baseline-fingerprint.json`.

---

## 4) Comparação das rotas

| Rota | Baseline | Preview | Impacto |
|------|----------|---------|---------|
| / | 200, SPA correta, login | 200, SPA correta, login + banner versão | Aceitável (comportamento funcional) |
| /game | 200 ou navegação SPA | 404 GET direto; navegação a partir de / carrega o jogo | Aceitável (SPA; conteúdo no bundle) |
| /dashboard | 200 ou navegação SPA | 404 GET direto; navegação a partir de / | Aceitável |

Carregamento, redirecionamento e SPA estão corretos no preview; não foi identificado fallback estranho nem tela errada. A diferença de status em GET direto para /game e /dashboard é de configuração/rewrite, não falha crítica.

Registro: `docs/relatorios/compare-preview-vs-baseline-routes.json`.

---

## 5) Comparação detalhada do /game

| Aspecto | Baseline | Preview | Status |
|---------|----------|---------|--------|
| Bundle | index-qIGutT6K.js (478903 bytes) | index-DVt6EjKW.js (379518 bytes) | **Diferente** |
| Elementos centrais (saldo, apostas, campo, goleiro, bola, chute, menu) | Presentes, layout validado | Presentes no código; layout/experiência podem diferir | **Não idêntico** |
| VersionWarning / barra de versão | Não (baseline validada sem isso) | Sim (ativo no bundle) | **Regressão** |
| /api/withdraw/request | Incluído na baseline documentada | Não presente no bundle do preview | **Regressão funcional** |
| "Verificar Status" (depósito) | Removido na baseline simplificada | Presente no preview | **Regressão funcional** |

**Classificação do /game:** **regressão** — bundle diferente, comportamento e layout não garantidos como idênticos à baseline; evidência de regressão visual/funcional já documentada para este build.

Registro: `docs/relatorios/compare-preview-vs-baseline-game.json`.

---

## 6) Risco de promote

| Critério | Avaliação |
|----------|-----------|
| Diferenças no /game | Sim (bundle, VersionWarning, layout) |
| Diferenças em /dashboard | Potencial (mesmo bundle diferente) |
| Diferenças de bundle | Sim (JS e CSS com hashes distintos) |
| Evidência de regressão visual/funcional | Sim (barra de versão e layout em INCIDENTE-REGRESSAO-GAME) |
| Mudanças esperadas vs inesperadas | Preview não contém correções de saque/depósito esperadas na baseline |

**Risco de promote:** **ALTO.**

**Recomendação:** Não promover o preview **ez1oc96t1** para produção como substituição da baseline FyKKeg6zb. Se a produção atual estiver neste deployment, considerar rollback para a baseline (FyKKeg6zb ou deployment que sirva index-qIGutT6K.js).

Registro: `docs/relatorios/compare-preview-vs-baseline-risk.json`.

---

## 7) Conclusão final

- **Pode promover?** **Não.**  
- **/game preservado em relação à baseline?** **Não** — bundle e comportamento não são idênticos; há regressão documentada.  
- **Diferença aceitável?** **Não** — diferenças de fingerprint, bundle, VersionWarning e ausência das correções de saque/depósito tornam o preview inaceitável para promote sem correções e nova validação.

---

## Tabela final

| Item | Baseline (FyKKeg6zb) | Preview (ez1oc96t1) | Status | Impacto |
|------|----------------------|---------------------|--------|---------|
| Deployment ID | FyKKeg6zb | ez1oc96t1 | Diferente | Identificação |
| Bundle JS | index-qIGutT6K.js | index-DVt6EjKW.js | Diferente | Alto |
| Bundle CSS | index-lDOJDUAS.css | index-BplTpheb.css | Diferente | Alto |
| SHA256 HTML (/) | BEBE03... | FD63C9... | Diferente | Médio |
| /game (bundle/layout) | Validado, sem barra versão | VersionWarning ativo, barra versão | Regressão | Alto |
| Saque (/api/withdraw/request) | Incluído | Ausente | Regressão | Alto |
| Depósito ("Verificar Status") | Removido | Presente | Regressão | Médio |
| Rotas /, /game, /dashboard | Carregam corretamente | / 200; /game e /dashboard 404 GET (SPA ok) | Parcial | Baixo |

---

## Arquivos gerados (caminhos exatos)

| Arquivo | Descrição |
|---------|-----------|
| `docs/relatorios/compare-preview-vs-baseline-meta.json` | Preview alvo e referência à baseline |
| `docs/relatorios/compare-preview-vs-baseline-fingerprint.json` | Comparação de fingerprint |
| `docs/relatorios/compare-preview-vs-baseline-routes.json` | Comparação das rotas |
| `docs/relatorios/compare-preview-vs-baseline-game.json` | Comparação detalhada do /game |
| `docs/relatorios/compare-preview-vs-baseline-risk.json` | Risco de promote |
| `docs/relatorios/COMPARE-PREVIEW-VS-BASELINE-FYKKeg6zb-2026-03-06.md` | Este relatório |

---

**SAÍDA FINAL**

- **Preview analisado:** ez1oc96t1 (https://goldeouro-player-ez1oc96t1-goldeouro-admins-projects.vercel.app).  
- **/game preservado em relação à baseline?** **Não.**  
- **Risco de promote:** **Alto.**  
- **Pode promover?** **Não.**  
- **Caminhos dos arquivos gerados:** listados na tabela acima.
