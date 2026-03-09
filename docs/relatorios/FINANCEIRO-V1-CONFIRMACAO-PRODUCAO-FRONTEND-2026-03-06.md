# Confirmação READ-ONLY final — Frontend financeiro V1 em produção

**Data:** 2026-03-06  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, commit, deploy, Vercel, Fly ou banco).  
**Objetivo:** Determinar se o frontend em produção em https://www.goldeouro.lol contém tela de saque corrigida, tela de depósito simplificada e se /game permanece preservado.

---

## 1) Resumo executivo

- **Verificação ao vivo:** As requisições a https://www.goldeouro.lol (HTML e bundle JS) a partir do ambiente de auditoria sofreram **timeout**. Não foi possível confirmar ao vivo qual bundle está sendo servido na data desta auditoria.
- **Documentação interna:** Há dois cenários documentados: (A) produção com bundle **index-qIGutT6K.js** (antigo, sem correções de saque/depósito); (B) produção com bundle **index-CHnRaMxK.js** (pós-merge, com saque e depósito corrigidos). A última verificação pós-merge (FRONTEND-PLAYER-POSTMERGE-VERIFICACAO-2026-03-06) registrou o bundle **CHnRaMxK** em produção e banner "VERSÃO ATUALIZADA v1.2.0".
- **Decisão:** **Condicional.** Se o bundle atual for **index-CHnRaMxK.js**, o frontend financeiro correto está em produção e o financeiro V1 pode ser considerado concluído no frontend. Se for **index-qIGutT6K.js**, o frontend correto **não** está em produção e é necessário promover o deployment que serve o build corrigido.
- **/game:** Documentação confirma que /game está preservado (mesmo bundle SPA; sem alteração de código em /game no ciclo V1).

---

## 2) Bundle atual em produção

| Item | Resultado |
|------|-----------|
| Nome do bundle (confirmado ao vivo) | **Inconclusivo** (timeout ao baixar HTML/bundle) |
| Bundle documentado (cenário antigo) | `/assets/index-qIGutT6K.js`, CSS `/assets/index-lDOJDUAS.css` |
| Bundle documentado (cenário pós-merge) | `/assets/index-CHnRaMxK.js` |
| Corresponde ao bundle corrigido | **qIGutT6K:** não. **CHnRaMxK:** sim. |
| Deployment/current associado | qIGutT6K: ez1oc96t1 (em relatórios anteriores). CHnRaMxK: não documentado por ID. |

Referência: `docs/relatorios/financeiro-v1-producao-bundle.json`.

---

## 3) Situação da tela de saque

- **Critérios:** Presença de `/api/withdraw/request`, `/api/withdraw/history`, `requestWithdraw`, `getWithdrawHistory` no código publicado.
- **Bundle qIGutT6K:** Ausente (não contém esses endpoints no bundle).
- **Bundle CHnRaMxK:** Presente (documentado em frontend-player-postmerge-withdraw.json).
- **Classificação ao vivo:** Inconclusivo (dependente do bundle servido).

Referência: `docs/relatorios/financeiro-v1-producao-withdraw.json`.

---

## 4) Situação da tela de depósito

- **Critérios:** Não contém "Verificar Status"; não usa GET `/api/payments/pix/status` para o fluxo principal; mantém criação de PIX, QR/copia e cola e histórico.
- **Bundle qIGutT6K:** Incorreto (contém "Verificar Status" e fluxo antigo).
- **Bundle CHnRaMxK:** Correto ("Verificar Status" não aparece; criação PIX, QR e histórico mantidos).
- **Classificação ao vivo:** Inconclusivo (dependente do bundle servido).

Referência: `docs/relatorios/financeiro-v1-producao-deposit.json`.

---

## 5) Estado do /game

| Pergunta | Resposta |
|----------|----------|
| /game continua preservado? | **Sim** (documentação: AUDITORIA-FINAL-GAME, FRONTEND-PLAYER-POSTMERGE). |
| Bundle do /game aceitável em relação à baseline? | **Sim** (SPA única; rotas e código do jogo no mesmo bundle; sem alteração de código em /game no ciclo V1). |
| Regressão visível documentada? | **Não** (após merge, /game preservado; GET direto /game pode retornar 404 dependendo de rewrites; navegação client-side a partir de / carrega o jogo). |

---

## 6) Decisão final

| Pergunta | Resposta |
|----------|----------|
| Frontend financeiro correto já está em produção? | **Condicional.** Sim se o bundle atual for **index-CHnRaMxK.js**; não se for **index-qIGutT6K.js**. Verificação ao vivo: inconclusivo. |
| Financeiro V1 pode ser considerado concluído? | **Condicional.** Sim no backend e no código do frontend; em produção depende do bundle servido (CHnRaMxK = sim). |
| Se não, qual deployment deve ser promovido? | Promover o deployment que serve o bundle **index-CHnRaMxK.js** (build pós-merge com correção de saque e depósito simplificado). Não promover ez1oc96t1 se este servir bundle sem as correções (ex.: DVt6EjKW ou qIGutT6K). |

Referência: `docs/relatorios/financeiro-v1-producao-decisao.json`.

---

## 7) Próxima ação mínima recomendada

1. **Confirmar bundle em produção:** Abrir https://www.goldeouro.lol no navegador, abrir DevTools (F12) > aba Network, recarregar a página e verificar qual arquivo **index-*.js** é carregado (ex.: `index-CHnRaMxK.js` ou `index-qIGutT6K.js`).
2. **Se for index-CHnRaMxK.js:** Considerar frontend financeiro correto em produção e financeiro V1 concluído no frontend; nenhuma ação de deploy necessária.
3. **Se for index-qIGutT6K.js (ou outro sem correções):** Promover para produção no Vercel o deployment que serve o build com bundle **index-CHnRaMxK.js** (build do merge com withdrawService, Withdraw.jsx e depósito simplificado), preservando o deployment atual como rollback se necessário.

---

## Entregas

| Artefato | Caminho |
|----------|---------|
| Relatório | docs/relatorios/FINANCEIRO-V1-CONFIRMACAO-PRODUCAO-FRONTEND-2026-03-06.md |
| JSON saque | docs/relatorios/financeiro-v1-producao-withdraw.json |
| JSON depósito | docs/relatorios/financeiro-v1-producao-deposit.json |
| JSON bundle | docs/relatorios/financeiro-v1-producao-bundle.json |
| JSON decisão | docs/relatorios/financeiro-v1-producao-decisao.json |

---

*Auditoria READ-ONLY. Nenhuma alteração de código, commit, deploy, Vercel, Fly ou banco foi realizada.*
