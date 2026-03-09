# Validação E2E Payout Ledger — ROUND 2 (EXEC)

**Data:** 2026-03-04  
**Objetivo:** Validar E2E o hotfix do ledger em produção: 1 saque de teste e prova de processamento sem erro de coluna (user_id/usuario_id).

**Regras de segurança:**
- NÃO colar JWT no relatório.
- NÃO imprimir o valor do token em logs.
- O token apenas como variável de ambiente no terminal (PowerShell).
- Após finalizar, remover a variável BEARER.

---

## FASE 1 — Preparação (manual mínimo, sem registro do token)

1. Operador obtém o JWT em DevTools > Network (header `Authorization: Bearer ...`) ou em Console (`await window.firebase?.auth?.()...getIdToken()`).
2. No PowerShell, definir o token **(NÃO colar no relatório):**
   ```powershell
   $env:BEARER="Bearer <COLE_O_TOKEN_AQUI>"
   ```
3. Confirmar que BEARER existe sem exibir conteúdo:
   ```powershell
   if ($env:BEARER) { "BEARER=OK" } else { "BEARER=MISSING" }
   ```

**Registro no relatório:**

**BEARER=MISSING** *(execução automática sem token no ambiente; operador deve definir no próprio terminal e re-executar FASE 2–4)*

*(Quando o operador executar no terminal com token definido, atualizar para: **BEARER=OK**.)*

---

## FASE 2 — Criar 1 saque de teste (exec)

4. Executar:
   ```bash
   node scripts/create-test-withdraw-live.js
   ```
5. Capturar o JSON de saída.

**Registro — saída do script:**

| Campo    | Valor |
|----------|--------|
| success  | false |
| saqueId  | null |
| status   | — |
| message  | BEARER ausente ou inválido. Defina BEARER=Bearer \<jwt\> |

**Resultado FASE 2:** **FAIL (sem token)** — parar aqui; criação de saque não realizada. Para obter PASS é necessário definir BEARER no terminal e re-executar a partir do passo 4.

---

## FASE 3 — Prova de processamento (read-only)

*Executada apenas quando FASE 2 retornar success=true e saqueId preenchido.*

6. Esperar 60–120 s e coletar logs:
   ```bash
   flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail
   ```
7. Procurar no output: ausência de erro de coluna (user_id/usuario_id), ausência de stack de INSERT no ledger, indicação de processamento do saqueId.
8. Checar pendentes:
   ```bash
   node scripts/check-pending-saques-live-test.js
   ```

**Registro (esta execução):** N/A — FASE 2 falhou por BEARER; sem saqueId para observar.

*(Após re-executar com BEARER e obter saqueId, preencher abaixo:)*  
- **Trecho relevante dos logs:** *(linhas de status/erro; sem dados sensíveis)*  
- **Resultado check pendentes:** *(JSON count/pending)*  

---

## FASE 4 — Limpeza

9. Remover variável do ambiente:
   ```powershell
   Remove-Item Env:BEARER
   ```

**Registro:** **BEARER removido**

---

## Conclusão

**PASS** se:
- não houve erro de coluna/ledger no worker;
- saqueId não permanece em pendente por múltiplos ciclos (ou aparece evolução).

**FAIL** se:
- qualquer erro de coluna/ledger ou saque preso.

**Resultado desta execução:** **FAIL** — BEARER não definido no ambiente; criação de saque não realizada. Nenhum dado sensível registrado; BEARER removido ao final.

---

## Como re-executar (operador com JWT)

1. No PowerShell (terminal do operador):  
   `$env:BEARER="Bearer <TOKEN>"`  
   *(não colar o token em nenhum documento.)*
2. Confirmar: `if ($env:BEARER) { "BEARER=OK" } else { "BEARER=MISSING" }` → deve exibir BEARER=OK.
3. Criar saque: `node scripts/create-test-withdraw-live.js` → registrar no relatório success, saqueId, status, message.
4. Aguardar 60–120 s.
5. Coletar logs: `flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail` → registrar trecho relevante (sem dados sensíveis); verificar ausência de erro de coluna/ledger.
6. Checar pendentes: `node scripts/check-pending-saques-live-test.js` → registrar resultado.
7. Limpeza: `Remove-Item Env:BEARER` → registrar "BEARER removido".
8. Atualizar conclusão: PASS se sem erro de ledger e saque processado; FAIL caso contrário.
