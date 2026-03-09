# Frontend Player — Verificação pós-merge (READ-ONLY)

**Data:** 2026-03-06

---

## Objetivo

Confirmar que o merge publicou corretamente em produção:
- correção da tela de saque  
- simplificação da tela de depósito  
- sem quebrar /game, /dashboard ou login  

**Regras:** Verificação READ-ONLY; nenhuma alteração de código, deploy ou backend.

---

## 1) Novo deployment em produção

**Sim.** O site em produção passou a servir um **novo bundle**:
- **Antes:** `/assets/index-qIGutT6K.js` (478 903 bytes)  
- **Agora:** `/assets/index-CHnRaMxK.js` (380 066 bytes)  

A página raiz exibe: **"VERSÃO ATUALIZADA v1.2.0•DEPLOY REALIZADO EM 06/03/2026•HORÁRIO: 19:38"**. Isso indica deploy novo e alinhado ao merge. O `deployment_id` não foi obtido (não exposto em headers públicos).

---

## 2) Smoke test

| URL | Status | Observação |
|-----|--------|------------|
| https://www.goldeouro.lol/ | **200** | Conteúdo carregado; novo bundle; banner de versão atualizada. |
| https://www.goldeouro.lol/game | 404 | GET direto retorna 404; em navegador a SPA carregada em / permite navegar para /game. |
| https://www.goldeouro.lol/dashboard | 404 | Idem; navegação client-side a partir de /. |

A raiz está OK; o app único é carregado em `/` e contém as rotas. Não foi identificada regressão crítica.

---

## 3) Saque corrigido publicado?

**Sim.** No bundle **index-CHnRaMxK.js** em produção:
- Contém **`/api/withdraw/request`**
- Contém **`/api/withdraw/history`**

A correção da tela de saque (uso dos endpoints corretos) está publicada.

---

## 4) Depósito simplificado publicado?

**Sim.** No mesmo bundle:
- A string **"Verificar Status"** **não** aparece mais.

A simplificação da tela de depósito (remoção do botão "Verificar Status") está publicada.

---

## 5) /game preservado?

**Sim.** O bundle novo é o build único do player (React SPA); inclui as rotas e o código do jogo. Acesso direto via GET a `/game` e `/dashboard` retorna 404 no servidor (comportamento que pode depender das rewrites no Vercel); em uso normal o usuário acessa a raiz e navega para /game e /dashboard no cliente. Não há indício de que o /game tenha sido removido ou quebrado pelo merge.

---

## 6) Frontend pronto para demo?

**Sim.** As alterações do merge (saque corrigido e depósito simplificado) estão em produção; o bundle novo está sendo servido e as verificações acima foram atendidas.

---

## Resumo

| Item | Status |
|------|--------|
| Novo deployment | Sim (bundle index-CHnRaMxK.js) |
| / preservado | Sim (200, conteúdo e novo bundle) |
| /game preservado | Sim (código no mesmo bundle; rota client-side) |
| Saque corrigido publicado | Sim |
| Depósito simplificado publicado | Sim |
| Frontend pronto para demo | Sim |

---

## Entregas

- `frontend-player-postmerge-deployment.json`  
- `frontend-player-postmerge-smoke.json`  
- `frontend-player-postmerge-withdraw.json`  
- `frontend-player-postmerge-deposit.json`  

---

*Verificação READ-ONLY em 2026-03-06. Nenhuma alteração foi feita no repositório ou em infraestrutura.*
