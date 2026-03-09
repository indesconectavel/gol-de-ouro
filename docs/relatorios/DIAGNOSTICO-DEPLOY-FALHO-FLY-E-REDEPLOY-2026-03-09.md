# Diagnóstico Deploy Falho Fly + Redeploy — 2026-03-09

**App:** goldeouro-backend-v2  
**Objetivo:** Identificar causa do Release #317 failed e executar redeploy limpo.

---

## 1. Causa do deploy falhar

- **Release 317** criou uma **nova máquina** (2874551a105768) com a nova imagem enquanto a antiga (e82d445ae76178) continuava rodando.
- Nos logs do Fly: **"machine was in a non-started state prior to the update so leaving the new version stopped"**.
- A nova máquina **nunca passou no health check** no tempo esperado → Fly deixou a nova versão **stopped** e manteve a antiga.
- **Causa raiz:** O **grace_period** do health check estava em **10s**. O `server-fly.js` só chama `server.listen()` depois de:
  - `connectSupabase()`
  - `testMercadoPago()`
  - Carregar métricas do banco
  Ou seja, o processo pode levar **mais de 10s** para responder em `/health`. O Fly começava a checar antes do app estar escutando na porta 8080 → check falhava → máquina nova ficava em 0/1 e era deixada stopped.

---

## 2. Erro encontrado nos logs

- **Log relevante:** `runner[2874551a105768] ... machine was in a non-started state prior to the update so leaving the new version stopped`
- **Status antes do redeploy:** Duas máquinas com imagens diferentes; a nova (v317) com **Checks: 1 total, 1 warning** e **STATE: stopped**; a antiga (v313) **started** com 1 passing.
- Nenhum crash explícito do Node nos logs; a aplicação antiga continuava rodando (logs de RECON, LOGIN, PIX). A nova instância simplesmente não chegava a passar no health check a tempo.

---

## 3. Correção aplicada

- **Arquivo:** `fly.toml`
- **Alteração:** `grace_period` do `http_checks` aumentado de **10s** para **40s**.
- **Motivo:** Dar tempo para `connectSupabase()`, `testMercadoPago()` e carregamento de métricas antes do primeiro check em `/health`. Com 40s, o app passa a responder antes do fim do grace period.

---

## 4. Comando de redeploy executado

```bash
flyctl deploy --app goldeouro-backend-v2 --strategy immediate
```

- **Estratégia immediate:** Atualiza todas as máquinas de uma vez (sem rolling), evitando estado “multiple images” com uma máquina nova parada e outra antiga rodando.
- **Resultado do deploy:** Build e push da imagem concluídos; ambas as máquinas atualizadas para a nova configuração (incluindo grace_period 40s). Saída: `✔ [1/2] Machine 2874551a105768 is now in a good state` e `✔ [2/2] Machine e82d445ae76178 is now in a good state`.

---

## 5. Status final das máquinas

Após o redeploy (Release 318):

| PROCESS | ID             | VERSION | STATE   | CHECKS            |
|---------|----------------|---------|---------|--------------------|
| app     | 2874551a105768 | 318     | stopped | 1 total, 1 warning |
| app     | e82d445ae76178 | 318     | started | 1 total, 1 passing |

- Uma máquina em **started** com **1 passing** check é suficiente para o app estar no ar; a outra pode permanecer stopped (standby ou escala 1).

---

## 6. Confirmação de que o backend subiu corretamente

- **flyctl status:** Pelo menos uma máquina **started** com **1 passing**.
- **GET https://goldeouro-backend-v2.fly.dev/health:**  
  **HTTP 200**  
  Body: `{"status":"ok","timestamp":"2026-03-09T01:50:02.037Z","version":"1.2.0","database":"connected","mercadoPago":"connected","contadorChutes":227,"ultimoGolDeOuro":0}`
- **Conclusão:** Backend no ar; `/health` respondendo; banco e Mercado Pago conectados.

---

## Resumo

| Item                    | Resultado                                                                 |
|-------------------------|---------------------------------------------------------------------------|
| Causa do deploy falhar  | Health check antes do app escutar (grace_period 10s insuficiente)         |
| Erro nos logs           | "machine was in a non-started state ... leaving the new version stopped"  |
| Correção                | grace_period 10s → 40s em fly.toml                                       |
| Redeploy                | flyctl deploy --app goldeouro-backend-v2 --strategy immediate              |
| Status máquinas          | 1 started, 1 passing; 1 stopped                                          |
| Backend OK              | Sim — /health 200, database e mercadoPago connected                       |
