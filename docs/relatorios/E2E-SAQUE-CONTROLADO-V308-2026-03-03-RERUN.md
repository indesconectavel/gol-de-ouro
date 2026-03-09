# E2E Saque PIX controlado V308 — RERUN (produção Fly)

**Data:** 2026-03-03  
**Artefato:** E2E-SAQUE-CONTROLADO-V308-2026-03-03-RERUN.md  
**Modo:** Validação E2E controlada; sem alteração de código, secrets, deploy ou reinício. Apenas chamada HTTP do saque + leitura DB + logs + relatório.

---

## Objetivo

Criar 1 saque real mínimo via endpoint oficial e provar, com DB + logs, a transição de status após 2 ciclos do payout_worker.

---

## Regras absolutas (respeitadas)

- NÃO alterar código  
- NÃO alterar secrets/env  
- NÃO deployar  
- NÃO reiniciar máquinas  
- NÃO escrever diretamente no banco (somente via endpoint do produto)  
- Apenas: chamada HTTP do saque + leitura DB + logs + relatório  

---

## PASSO 0 — Guardas (token obrigatório)

### Verificação executada

Foi verificado se o token estava disponível no ambiente (PowerShell):

```powershell
if ($env:BEARER) { Write-Output "BEARER_DEFINIDO" } else { Write-Output "BEARER_NAO_DEFINIDO" }
```

**Resultado:** `BEARER_NAO_DEFINIDO`

### Decisão

Conforme regras: **não prosseguir sem token**. Execução encerrada neste ponto. Nenhuma tentativa de saque foi feita.

---

## BEARER_NAO_DEFINIDO — Instruções para obter o JWT

O operador deve definir no PowerShell **antes** de reexecutar o E2E:

```powershell
$env:BEARER = "Bearer <JWT válido do usuário de teste>"
```

**Como obter o JWT (sem alterar nada):**

1. No navegador, com o usuário de teste logado em `/game`:
2. Abrir **DevTools** (F12) → aba **Application**.
3. Em **Local Storage** (ou **Session Storage**) do site, procurar chaves como:
   - `token`
   - `accessToken`
   - `jwt`
   - `firebase`
   - `idToken`
4. Copiar o **valor** do token.
5. Montar: `Bearer <valor_copiado>` (com espaço após "Bearer").
6. No PowerShell:  
   `$env:BEARER = "Bearer <valor_copiado>"`

**Pré-requisitos do usuário de teste:** saldo suficiente para o saque mínimo (R$ 10) e, se aplicável, chave PIX válida para o tipo usado no body.

---

## Passos NÃO executados (por falta de token)

Os passos abaixo **não foram executados** nesta rodada. Ficam documentados para a reexecução quando `$env:BEARER` estiver definido.

### PASSO 1 — Criar 1 saque controlado

- **Endpoint:** `POST https://goldeouro-backend-v2.fly.dev/api/withdraw/request`
- **Headers:** `Authorization: $env:BEARER`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "valor": 10,
    "chave_pix": "chave_pix_teste_valida",
    "tipo_chave": "random"
  }
  ```
- **Ações:** Executar a requisição; registrar status HTTP, response body completo; extrair SAQUE_ID (`id`, `saque_id` ou `data.id` conforme JSON real). Se status ≠ 200/201 ou sem ID → veredito E2E INCONCLUSIVO/NO-GO.

### PASSO 2 — Snapshot DB imediato (READ-ONLY)

- Usar `flyctl ssh` na máquina app healthy (descobrir com `flyctl status -a goldeouro-backend-v2`).
- Dentro do container: script Node READ-ONLY (ex.: via Base64) que conecta no Supabase com `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` do env, busca em `saques` por SAQUE_ID e imprime: `id`, `status`, `amount`/`valor`, `created_at`, `processed_at`, `transacao_id` (ou equivalente). Registrar saída como **DB_BEFORE**.

### PASSO 3 — Observar 2 ciclos do payout_worker (READ-ONLY)

- Aguardar **150 segundos**.
- Coletar logs do payout_worker no Fly, filtrando por: `[PAYOUT]`, `[SAQUE]`, PENDING, PROCESSING, COMPLETED, REJECTED, erro, fail, exception.
- Registrar trechos relevantes no relatório.

### PASSO 4 — Reconsulta DB (READ-ONLY)

- Reexecutar o mesmo script do PASSO 2 para o **mesmo SAQUE_ID**.
- Registrar como **DB_AFTER**.

**Critério E2E GO:**  
- Status mudou para `completed` OU `rejeitado`/`rejected`/`cancelado` (normalização aceita)  
- E `processed_at` preenchido OU `transacao_id` presente (se aplicável).

**E2E PARCIAL:** status ainda aberto (pendente/processando) após 2 ciclos, sem erros recorrentes no worker.  
**NO-GO:** erro recorrente Supabase/MP no worker.

### PASSO 5 — Relatório final (obrigatório)

- Contexto (Fly status, machine IDs, release, imagem)
- PASSO 1 (request/response + SAQUE_ID)
- DB_BEFORE (snapshot)
- Logs (2 ciclos)
- DB_AFTER (snapshot)
- Tabela de comparação
- Veredito final: **E2E GO** / **E2E PARCIAL** / **NO-GO** / **INCONCLUSIVO**
- Declaração: *"Nenhuma alteração de código, deploy, secrets ou restart foi feita."*

---

## Relatório desta execução (RERUN)

### Contexto

| Item        | Valor |
|------------|--------|
| Data/hora  | 2026-03-03 |
| PASSO 0    | Executado |
| Token      | BEARER_NAO_DEFINIDO |
| Passos 1–5 | Não executados (guard ativado) |

### Tabela de comparação

| Item              | Esperado                    | Nesta execução (RERUN)     |
|-------------------|-----------------------------|----------------------------|
| PASSO 0 token     | BEARER definido             | BEARER_NAO_DEFINIDO        |
| PASSO 1 POST      | HTTP 200/201; SAQUE_ID      | Não executado              |
| PASSO 2 DB_BEFORE | Snapshot do saque           | N/A                        |
| PASSO 3 logs      | 2 ciclos; trechos relevantes| N/A                        |
| PASSO 4 DB_AFTER  | Status final; processed_at | N/A                        |
| Veredito          | E2E GO / PARCIAL / NO-GO    | INCONCLUSIVO               |

### Veredito final

**E2E INCONCLUSIVO** — O pré-requisito **$env:BEARER** não foi atendido. Nenhuma tentativa de saque foi realizada. Nenhum dado de DB ou logs de worker foi coletado para este run.

### Declaração formal

**Nenhuma alteração de código, deploy, secrets ou restart foi feita.** Apenas foi verificada a presença do token no ambiente e produzido este relatório.

---

## Próxima ação do operador

1. Obter o JWT conforme a seção **BEARER_NAO_DEFINIDO — Instruções para obter o JWT**.
2. Definir no PowerShell: `$env:BEARER = "Bearer <JWT>"`.
3. Reexecutar o E2E completo (Passos 1 a 5) e gerar novo relatório com SAQUE_ID, DB_BEFORE, logs, DB_AFTER e veredito final (E2E GO / E2E PARCIAL / NO-GO).
