# Preflight final — Frontend player (READ-ONLY)

**Data:** 2026-03-06  
**Modo:** Somente leitura. Nenhuma alteração de código, commit, push, deploy ou Vercel.

---

## 1) Resumo executivo

- **Commit validado:** 8f51edc (ou 258b0cd), branch hotfix/financeiro-v1-stabilize, contém a correção da tela de saque (withdrawService.js, Withdraw.jsx, config/api.js).
- **Produção atual:** Estável; www.goldeouro.lol, /game e /dashboard respondem; servidor Vercel, bundle index-qIGutT6K.js.
- **Rotas críticas:** /, /game, /dashboard carregando (status 200, conteúdo SPA).
- **Tela de saque:** Código usa requestWithdraw → POST /api/withdraw/request e getWithdrawHistory → GET /api/withdraw/history; createPix não é usado para saque.
- **Rollback:** Deployment ez1oc96t1 preservado; pode ser promovido novamente para Production se necessário.
- **Decisão:** **GO PARA DEPLOY.**

---

## 2) Commit validado para deploy

| Item | Valor |
|------|--------|
| Branch | hotfix/financeiro-v1-stabilize |
| HEAD | 8f51edc04fa293ee06c25a21b499ca8e29b04ed3 |
| Commit da correção | 258b0cd624a251f6f64b0c8e7d9582c1ab41e888 |
| Commit recomendado | 8f51edc (inclui 258b0cd + docs) |

Arquivos da correção no commit 258b0cd:
- goldeouro-player/src/services/withdrawService.js
- goldeouro-player/src/pages/Withdraw.jsx
- goldeouro-player/src/config/api.js

Fluxo confirmado: POST /api/withdraw/request (submit), GET /api/withdraw/history (histórico). createPix e getUserPix não são usados para saque.

*Detalhes em preflight-final-frontend-commit.json.*

---

## 3) Estado atual da produção

| URL | Status | Servidor | Observação |
|-----|--------|----------|------------|
| https://www.goldeouro.lol | 200 | Vercel | Login (SPA) |
| https://www.goldeouro.lol/game | 200 | Vercel | SPA, redireciona para login sem auth |
| https://www.goldeouro.lol/dashboard | 200 | Vercel | SPA, redireciona para login sem auth |

Bundle principal: /assets/index-qIGutT6K.js. Headers: server Vercel, content-type text/html, x-vercel-cache HIT. Produção estável.

*Detalhes em preflight-final-frontend-production.json.*

---

## 4) Verificação das rotas críticas

| Rota | Status | Carregamento |
|------|--------|--------------|
| / | 200 | OK |
| /game | 200 | OK |
| /dashboard | 200 | OK |

Tempo de resposta não medido nesta auditoria. Erros de console não verificados (read-only). Rotas críticas funcionando.

*Detalhes em preflight-final-frontend-routes.json.*

---

## 5) Integração da tela de saque confirmada

- **Withdraw.jsx:** Usa `requestWithdraw(amount, formData.pixKey, formData.pixType)` no submit (linha 106) e `getWithdrawHistory()` no carregamento do histórico (linha 63).
- **withdrawService.js:** requestWithdraw chama `apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, ...)` → POST /api/withdraw/request; getWithdrawHistory chama `apiClient.get(API_ENDPOINTS.WITHDRAW_HISTORY)` → GET /api/withdraw/history.
- **config/api.js:** WITHDRAW_REQUEST e WITHDRAW_HISTORY definidos.
- **createPix:** Não é usado para saque (apenas paymentService.getConfig/minAmount e isSandboxMode para UI).

Tela de saque corrigida no código.

*Detalhes em preflight-final-frontend-withdraw.json.*

---

## 6) Deployment atual preservado para rollback

| Item | Valor |
|------|--------|
| Deployment ID | ez1oc96t1 |
| URL | https://goldeouro-player-ez1oc96t1-goldeouro-admins-projects.vercel.app |
| Pode ser promovido novamente | Sim |

Em caso de problema após o deploy do novo build, promover novamente ez1oc96t1 para Production no Vercel restaura o estado anterior. Nenhuma ação de promoção foi executada (read-only).

*Detalhes em preflight-final-frontend-rollback.json.*

---

## 7) Avaliação de risco

- **Regressão /game ou login:** Baixo — correção restrita a Withdraw, withdrawService e config; rotas críticas não alteradas.
- **Rollback:** Coberto — deployment ez1oc96t1 documentado e disponível para promoção.
- **Produção atual:** Estável — URLs respondendo, mesmo fingerprint de referência.

---

## 8) Conclusão

- Commit 8f51edc (ou 258b0cd) está validado e contém a correção da tela de saque sem alterar /game, login ou dashboard.
- Produção está estável; rotas críticas funcionando; integração da tela de saque confirmada no código; rollback disponível.

**Decisão final: GO PARA DEPLOY.**

---

*Preflight READ-ONLY. Nenhum deploy nem alteração em produção. JSONs em docs/relatorios/preflight-final-frontend-*.json.*
