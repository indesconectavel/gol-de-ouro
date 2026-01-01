# 🧪 CHECKLIST OPERACIONAL DE VALIDAÇÃO — MISSÃO D

**Objetivo:** Validar manualmente todas as proteções implementadas na MISSÃO D  
**Ambiente:** Produção ou Staging  
**Tempo Estimado:** 30-45 minutos

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar os testes, certifique-se de:

- [ ] Ter acesso ao banco de dados (Supabase SQL Editor ou cliente PostgreSQL)
- [ ] Ter token de autenticação válido para um usuário de teste
- [ ] Ter ferramenta para fazer requisições HTTP (Postman, curl, Insomnia, etc.)
- [ ] Ter saldo suficiente no usuário de teste (recomendado: R$ 50,00+)
- [ ] Ter acesso aos logs do servidor (opcional, mas recomendado)

---

## ✅ TESTE 1: IDEMPOTÊNCIA — Requisição Duplicada

### Objetivo
Validar que requisições com a mesma `X-Idempotency-Key` retornam resposta idêntica sem processar novamente.

### Passos

1. **Preparação:**
   - [ ] Anotar saldo inicial do usuário de teste
   - [ ] Anotar quantidade inicial de registros na tabela `chutes` para este usuário

2. **Primeira Requisição:**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: test-idempotency-001
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição
   - [ ] Anotar resposta (status, body completo)
   - [ ] Anotar `shotId` ou `loteId` da resposta

3. **Verificação Intermediária:**
   - [ ] Verificar no banco: 1 novo registro na tabela `chutes`
   - [ ] Verificar no banco: 1 registro na tabela `idempotency_keys` com `idempotency_key = 'test-idempotency-001'`
   - [ ] Verificar saldo: debitado R$ 1,00

4. **Segunda Requisição (MESMA CHAVE):**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: test-idempotency-001  ← MESMA CHAVE
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição
   - [ ] Anotar resposta (status, body completo)

5. **Validação Final:**
   - [ ] ✅ Status HTTP: 200 (não 400, não 500)
   - [ ] ✅ Resposta é IDÊNTICA à primeira requisição
   - [ ] ✅ Banco de dados: Ainda apenas 1 registro na tabela `chutes` (não criou novo)
   - [ ] ✅ Banco de dados: Ainda apenas 1 registro na tabela `idempotency_keys` (não criou novo)
   - [ ] ✅ Saldo: NÃO foi debitado novamente (permanece igual ao após primeira requisição)
   - [ ] ✅ Logs: Contém mensagem `🔄 [SHOOT] Retornando resposta idempotente...`

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## ✅ TESTE 2: IDEMPOTÊNCIA — Requisição SEM Header

### Objetivo
Validar que requisições sem `X-Idempotency-Key` são rejeitadas.

### Passos

1. **Requisição SEM Header:**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     ← SEM X-Idempotency-Key
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição
   - [ ] Anotar resposta

2. **Validação:**
   - [ ] ✅ Status HTTP: 400
   - [ ] ✅ Body: `{ "success": false, "message": "Header X-Idempotency-Key é obrigatório" }`
   - [ ] ✅ Banco de dados: NENHUM novo registro na tabela `chutes`
   - [ ] ✅ Banco de dados: NENHUM novo registro na tabela `idempotency_keys`
   - [ ] ✅ Saldo: NÃO foi debitado

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## ✅ TESTE 3: CONCORRÊNCIA — Duas Requisições Simultâneas

### Objetivo
Validar que apenas uma requisição fecha o lote quando duas chegam simultaneamente.

### Passos

1. **Preparação:**
   - [ ] Identificar lote ativo com `total_arrecadado < 10.00` (ex: R$ 8,00)
   - [ ] Anotar `lote_id` deste lote
   - [ ] Anotar quantidade de lotes com `status = 'ativo'` para `valor_aposta = 1`

2. **Enviar Duas Requisições Simultâneas:**
   
   **Requisição A:**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: concurrent-test-a-{timestamp}
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   
   **Requisição B (enviar no mesmo segundo):**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: concurrent-test-b-{timestamp}
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Enviar ambas as requisições simultaneamente (mesmo segundo)
   - [ ] Aguardar ambas as respostas
   - [ ] Anotar respostas de ambas

3. **Validação no Banco de Dados:**
   ```sql
   -- Verificar lotes
   SELECT id, status, total_arrecadado, posicao_atual
   FROM lotes
   WHERE valor_aposta = 1
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - [ ] ✅ Apenas 1 lote com `status = 'completed'` e `total_arrecadado = 10.00`
   - [ ] ✅ Nenhum lote com `status = 'ativo'` e `total_arrecadado >= 10.00`
   - [ ] ✅ 1 novo lote criado com `status = 'ativo'` e `total_arrecadado = 1.00` (ou próximo)
   - [ ] ✅ Nenhum lote com `total_arrecadado > 10.00`

4. **Validação nos Logs:**
   - [ ] ✅ Logs contêm mensagem `✅ [LOTE] Lote {id} fechado economicamente...` (apenas uma vez)
   - [ ] ✅ Logs contêm mensagem `🔄 [SHOOT] Lote {id} já foi fechado, buscando novo lote...` (na requisição que não fechou)

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## ✅ TESTE 4: INTEGRIDADE FINANCEIRA — Débito de Saldo

### Objetivo
Validar que saldo é debitado corretamente em chute normal (não gol).

### Passos

1. **Preparação:**
   - [ ] Verificar saldo inicial do usuário (ex: R$ 100,00)
   - [ ] Anotar quantidade inicial de registros na tabela `transacoes` para este usuário

2. **Requisição:**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: financial-test-debit-{timestamp}
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição (que NÃO resulta em gol)
   - [ ] Anotar resposta

3. **Validação:**
   ```sql
   -- Verificar saldo
   SELECT saldo FROM usuarios WHERE id = '{user_id}';
   
   -- Verificar transações
   SELECT tipo, valor, descricao
   FROM transacoes
   WHERE usuario_id = '{user_id}'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - [ ] ✅ Saldo final: R$ 99,00 (debitado R$ 1,00)
   - [ ] ✅ 1 novo registro na tabela `transacoes` com `tipo = 'debito'` e `valor = 1.00`
   - [ ] ✅ Nenhum registro com `tipo = 'credito'` para este chute
   - [ ] ✅ Resposta contém `result: 'miss'` (não é gol)

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## ✅ TESTE 5: INTEGRIDADE FINANCEIRA — Crédito de Prêmio

### Objetivo
Validar que prêmio é creditado corretamente quando há gol.

### Passos

1. **Preparação:**
   - [ ] Verificar saldo inicial do usuário (ex: R$ 100,00)
   - [ ] Identificar lote ativo próximo de fechar (ex: R$ 9,00 arrecadado)
   - [ ] Anotar quantidade inicial de registros na tabela `transacoes` para este usuário

2. **Requisição (que fecha o lote = gol):**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: financial-test-premio-{timestamp}
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição (que resulta em gol)
   - [ ] Anotar resposta

3. **Validação:**
   ```sql
   -- Verificar saldo
   SELECT saldo FROM usuarios WHERE id = '{user_id}';
   
   -- Verificar transações
   SELECT tipo, valor, descricao
   FROM transacoes
   WHERE usuario_id = '{user_id}'
   ORDER BY created_at DESC
   LIMIT 5;
   
   -- Verificar auditoria
   SELECT tipo_evento, valor, payload
   FROM auditoria_eventos
   WHERE user_id = '{user_id}'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - [ ] ✅ Saldo final: R$ 104,00 (debitado R$ 1,00 + creditado R$ 5,00)
   - [ ] ✅ 1 registro na tabela `transacoes` com `tipo = 'debito'` e `valor = 1.00`
   - [ ] ✅ 1 registro na tabela `transacoes` com `tipo = 'credito'` e `valor = 5.00`
   - [ ] ✅ Resposta contém `result: 'goal'` e `premio: 5.00`
   - [ ] ✅ Evento `PREMIO_PAGO` registrado na tabela `auditoria_eventos` com `valor = 5.00`
   - [ ] ✅ Evento `LOTE_FECHADO` registrado na tabela `auditoria_eventos`

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## ✅ TESTE 6: OBSERVABILIDADE — Eventos de Auditoria

### Objetivo
Validar que todos os eventos críticos são registrados na tabela `auditoria_eventos`.

### Passos

1. **Fazer Requisição Normal:**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: audit-test-{timestamp}
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição
   - [ ] Anotar `loteId` e `shotId` da resposta

2. **Validação na Tabela de Auditoria:**
   ```sql
   SELECT tipo_evento, user_id, lote_id, shot_id, valor, payload, created_at
   FROM auditoria_eventos
   WHERE user_id = '{user_id}'
   ORDER BY created_at DESC
   LIMIT 10;
   ```
   - [ ] ✅ Evento `SHOOT_PROCESSED` registrado
   - [ ] ✅ Evento contém `user_id`, `lote_id`, `shot_id`, `valor`
   - [ ] ✅ Evento contém `payload` com informações do chute
   - [ ] ✅ Se foi gol: Evento `PREMIO_PAGO` registrado
   - [ ] ✅ Se fechou lote: Evento `LOTE_FECHADO` registrado

3. **Teste de Fail-Safe (Opcional):**
   - [ ] Simular falha na tabela `auditoria_eventos` (ex: renomear temporariamente)
   - [ ] Fazer requisição
   - [ ] ✅ Requisição completa com sucesso (não falha por erro de auditoria)
   - [ ] ✅ Logs contêm erro de auditoria, mas requisição não é interrompida

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## ✅ TESTE 7: IDEMPOTÊNCIA — Proteção Contra Débito Duplicado

### Objetivo
Validar que idempotência protege contra débito duplicado mesmo em caso de falha de rede.

### Passos

1. **Preparação:**
   - [ ] Verificar saldo inicial do usuário (ex: R$ 100,00)

2. **Primeira Requisição:**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: duplicate-protection-001
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição
   - [ ] Aguardar resposta completa
   - [ ] Anotar saldo após primeira requisição

3. **Simular Reenvio (Cliente Reenvia por Falha de Rede):**
   ```http
   POST /api/games/shoot
   Headers:
     Authorization: Bearer {token}
     X-Idempotency-Key: duplicate-protection-001  ← MESMA CHAVE
   Body:
     {
       "direction": "C",
       "amount": 1
     }
   ```
   - [ ] Fazer requisição novamente (simulando reenvio)
   - [ ] Anotar resposta

4. **Validação:**
   ```sql
   -- Verificar saldo
   SELECT saldo FROM usuarios WHERE id = '{user_id}';
   
   -- Verificar transações
   SELECT COUNT(*) as total_transacoes
   FROM transacoes
   WHERE usuario_id = '{user_id}'
   AND created_at >= NOW() - INTERVAL '5 minutes';
   ```
   - [ ] ✅ Saldo: Debitado apenas UMA vez (não foi debitado novamente)
   - [ ] ✅ Transações: Apenas 1 registro de débito para este chute
   - [ ] ✅ Resposta: Idêntica à primeira requisição
   - [ ] ✅ Banco: Apenas 1 registro na tabela `chutes` para este chute

### Resultado Esperado
✅ **PASSOU** se todas as validações acima estão corretas  
❌ **FALHOU** se alguma validação falhou

---

## 📊 RESUMO DOS TESTES

Preencha o resumo abaixo após executar todos os testes:

| Teste | Status | Observações |
|-------|--------|-------------|
| Teste 1: Idempotência — Requisição Duplicada | ⬜ | |
| Teste 2: Idempotência — Requisição SEM Header | ⬜ | |
| Teste 3: Concorrência — Duas Requisições Simultâneas | ⬜ | |
| Teste 4: Integridade Financeira — Débito de Saldo | ⬜ | |
| Teste 5: Integridade Financeira — Crédito de Prêmio | ⬜ | |
| Teste 6: Observabilidade — Eventos de Auditoria | ⬜ | |
| Teste 7: Idempotência — Proteção Contra Débito Duplicado | ⬜ | |

**Status Geral:** ⬜ ✅ PASSOU | ⬜ ❌ FALHOU

**Data de Execução:** _______________

**Executado por:** _______________

---

## 🚨 AÇÕES EM CASO DE FALHA

Se algum teste falhar:

1. **Documentar o Erro:**
   - [ ] Anotar qual teste falhou
   - [ ] Anotar qual validação específica falhou
   - [ ] Capturar logs do servidor
   - [ ] Capturar queries do banco de dados
   - [ ] Capturar resposta HTTP completa

2. **Investigar:**
   - [ ] Verificar se scripts SQL foram aplicados corretamente
   - [ ] Verificar se código foi deployado corretamente
   - [ ] Verificar logs de erro no servidor
   - [ ] Verificar estrutura das tabelas no banco

3. **Corrigir:**
   - [ ] Aplicar correções necessárias
   - [ ] Re-executar testes que falharam
   - [ ] Validar que correções não quebraram outros testes

---

**FIM DO CHECKLIST DE VALIDAÇÃO — MISSÃO D**

