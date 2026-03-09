# Validação E2E – Hotfix Ledger (Payout) em Produção

**Data:** 2026-03-04  
**Objetivo:** Validar E2E o hotfix do ledger em produção: criar 1 saque de teste e provar que o worker processa sem erro de coluna (user_id/usuario_id).

**Regras:** Não alterar schema; não reiniciar máquinas; apenas leitura + 1 saque de teste; registrar outputs.

---

## FASE 0 — Pré-check (read-only)

### 1) Health backend

```bash
curl -s -I https://goldeouro-backend-v2.fly.dev/health
```

**Output:**

```
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 162
...
server: Fly/bcc60f27 (2026-03-04)
```

**Resultado:** OK — backend respondendo 200.

---

### 2) Worker rodando

```bash
flyctl status -a goldeouro-backend-v2
```

**Output:**

```
App    Name     = goldeouro-backend-v2
       Hostname = goldeouro-backend-v2.fly.dev
       Image    = goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM

Machines
PROCESS       ID             VERSION  REGION  STATE    ROLE
app           2874551a105768 312      gru     started
app           e82d445ae76178 312      gru     stopped
payout_worker e82794da791108 312      gru     started
```

**Resultado:** OK — máquina `e82794da791108` (payout_worker) em **started**.

---

### 3) Saques pendentes (baseline)

```bash
node scripts/check-pending-saques-live-test.js
```

**Output:**

```json
{"pending":[],"count":0}
```

**Resultado:** OK — zero pendentes antes do teste.

---

## FASE 1 — Obter JWT (manual mínimo + registro)

### 4) Instruções para o operador

1. Abrir **www.goldeouro.lol** no browser e fazer login.
2. Abrir **DevTools** (F12) → aba **Console**.
3. Executar um dos seguintes, conforme o app usar Firebase compat ou modular:
   - **Compat:**  
     `await window.firebase?.auth?.().currentUser?.getIdToken()`
   - Se o app expuser outro método (ex.: `getToken()`), usar o que estiver disponível no contexto do app.
4. Copiar o **token** (string longa) e no terminal (PowerShell) exportar:
   ```powershell
   $env:BEARER="Bearer <COLAR_TOKEN_AQUI>"
   ```

**Registro no relatório:** Token obtido: [ ] OK *(não colar o token no relatório; apenas marcar OK quando o operador tiver definido `$env:BEARER`).*

---

## FASE 2 — Criar 1 saque de teste (exec)

### 5) Criar saque de teste

Com `BEARER` já definido no terminal (FASE 1):

```bash
node scripts/create-test-withdraw-live.js
```

**Execução sem BEARER (referência):**

```json
{"error":"BEARER ausente ou inválido. Defina BEARER=Bearer <jwt>","saqueId":null}
```

**Após operador definir BEARER e executar:** registrar abaixo o ID retornado.

**ID do saque de teste retornado:** _____________________ *(preencher após execução com BEARER)*

Exemplo de saída esperada em sucesso:

```json
{"success":true,"saqueId":"<UUID>","status":"pendente","message":"..."}
```

---

## FASE 3 — Provar processamento (read-only)

### 6) Snapshot dos logs do worker

```bash
flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail
```

**Trecho relevante (baseline, antes de criar saque):**

- Mensagens típicas: `[PAYOUT][WORKER] Início do ciclo`, `Nenhum saque pendente`, `Resumo { payouts_sucesso: 0, payouts_falha: 0 }`, `Fim do ciclo`.
- **Nenhuma** linha com erro de coluna (`user_id`, `usuario_id`, `column`, `undefined` em contexto de ledger).
- **Nenhum** stack trace de insert em `ledger_financeiro`.

### 7) Evidências a registrar após criar o saque (FASE 2)

- **Ausência de erro de coluna:** nos logs do worker após o ciclo que processar o saque, não deve aparecer `user_id`/`usuario_id` ou erro de coluna/ledger.
- **Logs de ledger (se houver):** anotar aqui qualquer linha que mencione ledger ou inserção no worker.
- **Status do saque:** após 1–2 minutos, rodar de novo:
  ```bash
  node scripts/check-pending-saques-live-test.js
  ```
  Se o saque tiver sido processado, não deve mais aparecer na lista de pendentes (e o histórico do saque deve refletir processamento/concluído conforme regra de negócio).

Opcional: novo snapshot de logs após o processamento:
```bash
flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail
```

---

## Conclusão

- **PASS:** Nenhum erro de ledger (coluna user_id/usuario_id) nos logs do worker e o saque de teste avança de pendente/processando (não fica preso em erro).
- **FAIL:** Se aparecer erro de coluna ou stack no worker: capturar stack completo e propor patch mínimo (sem alterar schema; apenas código).

**Status desta validação:**

- **FASE 0:** Concluída — health 200, worker started, 0 pendentes.
- **FASE 1:** Pendente — operador deve obter JWT e definir `$env:BEARER`.
- **FASE 2:** Pendente — após BEARER, executar `node scripts/create-test-withdraw-live.js` e registrar o `saqueId`.
- **FASE 3:** Parcial — baseline de logs já coletado (sem erros de ledger). Após FASE 2, repetir checagem de pendentes e logs para fechar evidência de processamento sem erro.

*(Atualizar conclusão final para PASS/FAIL após o operador completar FASE 1–3 e revisar os logs pós-saque.)*
