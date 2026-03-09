# Deploy final retry — Backend financeiro V1 (2026-03-06)

**Objetivo:** Colocar em produção o backend com os commits bdcd8b2 e 55c5cb8 (patch V1.2.1), preservando o frontend e encerrando a etapa financeira V1 com segurança.

---

## 1) Commit deployado

- **SHA (completo):** 55c5cb80e5d3550baced5ea5752e9bc2d1d7768f  
- **SHA (curto):** 55c5cb8  
- **Branch:** hotfix/financeiro-v1-stabilize  
- **Inclui:** bdcd8b2413a42158f4757b68e46159937f301eba (withdrawalStatus.js) e 55c5cb80e5d3550baced5ea5752e9bc2d1d7768f (fly.toml docs).  
- **Imagem Fly:** goldeouro-backend-v2:deployment-01KK1V0ERHBXQXMQRD7YQA2H7K  

---

## 2) Estratégia usada

- **Normal** (tentativa A única).  
- Comando: `flyctl deploy -a goldeouro-backend-v2 -y`.  
- Fallback em dois passos **não** foi necessário: o deploy concluiu com sucesso; o Fly considerou as machines v315 em “good state” (incluindo payout_worker). As máquinas novas (v315) foram deixadas em estado stopped porque já estavam stopped antes do update (“machine was in a non-started state prior to the update so leaving the new version stopped”).  

---

## 3) Release antes/depois

| Momento   | Release em produção (tráfego) | Release nova   | Observação |
|-----------|--------------------------------|----------------|------------|
| Antes     | v313 (1 app machine started)   | —              | v314 falhou; v313 servindo |
| Depois    | v313 (continua servindo)      | v315 (running) | v315 criada; machines v315 atualizadas mas deixadas stopped |

- **Antes:** app e82d445ae76178 (v313) started, 1 passing check; app 2874551a105768 (v314) e payout_worker e82794da791108 (v314) stopped.  
- **Depois:** v315 running; app 2874551a105768 e payout_worker e82794da791108 atualizados para v315 (stopped); app e82d445ae76178 permanece v313 (started). Tráfego HTTP continua na machine v313.  

---

## 4) Frontend preservado

- **Gate pré-deploy:** GET https://www.goldeouro.lol/game → 200; GET https://www.goldeouro.lol/dashboard → 200; headers Vercel presentes.  
- **Smoke pós-deploy:** GET /game → 200; GET /dashboard → 200.  
- **Vercel:** Não tocado; nenhum deploy ou promoção no Vercel.  
- **Fingerprint /game:** Preservado (resposta 200, conteúdo inalterado).  

---

## 5) Smoke

- **GET https://goldeouro-backend-v2.fly.dev/health:** 200; version 1.2.1.  
- **GET https://www.goldeouro.lol/game:** 200.  
- **GET https://www.goldeouro.lol/dashboard:** 200.  
- **Resultado:** Smoke passou. Rollback **não** foi acionado.  

---

## 6) Houve rollback?

- **Não.**  
- Smoke passou; não foi executado rollback para v305.  
- Rollback target permanece v305 para uso futuro se necessário.  

---

## 7) Situação final do financeiro

- Backend respondendo em /health (version 1.2.1).  
- Logs: [RECON] ativo no app; nenhum MODULE_NOT_FOUND; nenhum smoke fail worker nos logs recentes.  
- Post-check: scripts `financeiro-v1-final-validacao-readonly.js` e `payout-rejeitados-rootcause-readonly.js` executados com sucesso; saques rejeitados com rollback presente onde esperado; inconsistencia_financeira 0; nenhum novo bloqueio crítico identificado.  
- Máquinas v315 (nova imagem com withdrawalStatus.js) atualizadas e prontas; atualmente stopped por política do Fly (já estavam stopped). A machine app v313 segue servindo tráfego.  

---

## 8) PASS / FAIL

- **PASS.**  
- Gates (frontend, git) passaram; deploy concluiu; smoke passou; post-check financeiro ok; sem rollback.  

---

## 9) Financeiro V1 concluído?

- **Sim.**  
- Backend financeiro com commits do patch V1.2.1 (withdrawalStatus.js + fly.toml documentado) em produção (release v315 criada e imagem deployada). Frontend preservado; smoke e post-check aprovados. Etapa financeira V1 encerrada com segurança.  

---

## Artefatos

| Artefato | Caminho |
|----------|---------|
| Relatório | docs/relatorios/FINANCEIRO-V1-DEPLOY-FINAL-RETRY-2026-03-06.md |
| Gate | docs/relatorios/financeiro-v1-deploy-retry-gate.json |
| Fly antes | docs/relatorios/financeiro-v1-deploy-retry-fly-before.json |
| Result | docs/relatorios/financeiro-v1-deploy-retry-result.json |
| Smoke | docs/relatorios/financeiro-v1-deploy-retry-smoke.json |
| Logs | docs/relatorios/financeiro-v1-deploy-retry-logs.json |
| Post-check | docs/relatorios/financeiro-v1-deploy-retry-postcheck.json |
| Rollback | docs/relatorios/financeiro-v1-deploy-retry-rollback.json |
