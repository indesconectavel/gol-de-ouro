# Frontend Player — Publicação via Git (Vercel)

**Data:** 2026-03-06

---

## 1) Resumo executivo

- **Objetivo:** Publicar em produção (via fluxo Git conectado ao Vercel) a correção da tela de saque e a simplificação da tela de depósito para a demo.
- **Commits a publicar:** 8f51edc, 8c020af (e 258b0cd — fix do saque).
- **Gate do código:** PASS.
- **Estratégia:** Git conectado ao Vercel; branch de produção = **main** (push para main dispara deploy).
- **Publicação:** Push direto para **main** bloqueado (branch protegida — alterações via PR). Commits enviados para **release/frontend-player-demo-2026-03-06**; PR deve ser aberto e mergeado para concluir a publicação.
- **Deployment Vercel:** Pendente (será gerado após merge do PR em main).
- **Smoke test:** PASS na produção atual (/, /game, /dashboard — 200, conteúdo carregado).
- **Saque/Depósito em produção:** Ainda não (aguardando merge do PR).
- **Rollback:** Não necessário (nenhum novo deploy de produção foi publicado).
- **Resultado:** **PASS** para o fluxo Git (gate, estratégia, push para branch de release); **pendente** publicação em produção até o merge do PR.

---

## 2) Commits publicados (na branch de release)

- **b8a64b5** — fix(player): tela de saque usa POST/GET withdraw/request e history (cherry-pick 258b0cd)
- **e9ef6ef** — docs: checklist withdraw fix - preencher SHA 258b0cd (cherry-pick 8f51edc)
- **200b416** — fix(deposito): simplificar tela Pagamentos para demo V1 (cherry-pick 8c020af)

Branch remota: **release/frontend-player-demo-2026-03-06**.

---

## 3) Estratégia usada (Git conectado ao Vercel)

- Branch de produção identificada: **main** (origin/HEAD, frontend-deploy.yml).
- Plano: atualizar main com origin/main; cherry-pick dos commits apenas do player; push para main.
- Limitação: **main** está protegida (alterações via Pull Request; 5 status checks obrigatórios).
- Ajuste: push dos commits para a branch **release/frontend-player-demo-2026-03-06**; publicação em produção após merge do PR para main.

---

## 4) Branch remota usada

- **Branch para onde foi feito o push:** release/frontend-player-demo-2026-03-06  
- **Branch de produção (Vercel):** main  
- **PR para concluir publicação:** https://github.com/indesconectavel/gol-de-ouro/pull/new/release/frontend-player-demo-2026-03-06  

---

## 5) Deployment gerado

- **deployment_id:** — (pendente; será gerado após merge do PR em main)  
- **deployment_url:** — (pendente)  
- **Status do build:** — (pendente)  
- **Production/current:** Produção atual permanece **ez1oc96t1** até o merge.

---

## 6) Smoke test

- **URLs:** https://www.goldeouro.lol/ , /game , /dashboard  
- **Resultado:** Todas retornaram HTTP 200 e conteúdo (página de login quando não autenticado).  
- **Fingerprint:** "Gol de Ouro - Jogador", "GOL DE OURO", "Faça login para continuar".  
- **Regressão crítica:** Nenhuma observada.

---

## 7) Saque publicado

- **No código da branch de release:** Withdraw usa POST /api/withdraw/request e GET /api/withdraw/history (withdrawService). Confirmado.  
- **Em produção (www.goldeouro.lol):** Ainda não; aguardando merge do PR e deploy do Vercel.

---

## 8) Depósito publicado

- **No código da branch de release:** Criação de PIX, QR/copia e cola, histórico presentes; botão "Verificar Status" removido; sem GET /api/payments/pix/status. Confirmado.  
- **Em produção:** Ainda não; aguardando merge do PR e deploy do Vercel.

---

## 9) Houve rollback?

**Não.** Nenhum novo deployment de produção foi publicado. Rollback preservado: **ez1oc96t1**. Se após o merge do PR houver regressão, promover novamente ez1oc96t1 no Vercel.

---

## 10) PASS/FAIL

**PASS** — O fluxo de publicação via Git foi executado com sucesso (gate, estratégia, cherry-pick, push para branch de release). A publicação em produção está **pendente** do merge do PR em main.

---

## 11) Frontend pronto para demo?

**Não** — As alterações estão na branch **release/frontend-player-demo-2026-03-06** e ainda não estão em www.goldeouro.lol. Para deixar o frontend pronto para demo:

1. Abrir o PR: release/frontend-player-demo-2026-03-06 → main  
2. Garantir que os 5 status checks obrigatórios passem  
3. Fazer o merge em main  
4. Aguardar o Vercel concluir o deploy  
5. Executar smoke test e verificação funcional no novo deployment  

---

## Entregas

| Arquivo | Descrição |
|--------|-----------|
| frontend-player-publicacao-git-gate.json | Gate do código |
| frontend-player-publicacao-git-push.json | Push (branch release, PR URL) |
| frontend-player-publicacao-git-vercel.json | Deployment (pendente) |
| frontend-player-publicacao-git-smoke.json | Smoke test produção atual |
| frontend-player-publicacao-git-rollback.json | Plano de rollback |

---

*Relatório gerado em 2026-03-06. PR disponível para merge; após merge em main, o Vercel fará o deploy automaticamente.*
