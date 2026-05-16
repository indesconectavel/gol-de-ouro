# SMOKE TEST — SAQUE MANUAL — CIRURGIA 3 (OK)

**Data:** 2026-05-06  
**Ambiente:** Produção (Fly.io)  
**Escopo:** validação pós-deploy da Cirurgia 3 para approve/cancel de saque manual  
**Modo:** somente validação e documentação de evidências (sem alteração de backend/frontend/banco)

---

## 1. Release Fly validada

- **Aplicação:** `goldeouro-backend-v2` (Fly)
- **Release:** Cirurgia 3 do fluxo de saque manual, já deployada e validada em produção
- **Objetivo da validação:** confirmar comportamento correto em cenário de saque previamente compensado por rollback manual

---

## 2. Endpoints testados

- `POST /api/admin/withdraw/approve`
- `POST /api/admin/withdraw/cancel`

---

## 3. Saque usado no smoke test

- **Tipo de caso:** saque com compensação anterior vinculada a `rollback_manual` (não pagamento real)
- **Finalidade do caso:** validar proteção de integridade na operação de approve e idempotência no cancel

---

## 4. Resultado do APPROVE

- **HTTP:** `409`
- **Mensagem observada:** `"Saque já está compensado por rollback_manual; não representa pagamento real."`

### Interpretação técnica

- O endpoint bloqueou corretamente uma tentativa de approve em saque já compensado por rollback manual.
- O retorno `409` representa conflito de estado esperado para impedir dupla compensação ou pagamento indevido.

---

## 5. Resultado do CANCEL

- **HTTP:** `200`
- **Status retornado:** `cancelado`
- **Flag:** `deduped: true`

### Interpretação técnica

- O cancel operou com sucesso no mesmo saque.
- O campo `deduped: true` confirma tratamento idempotente do fluxo, sem gerar efeito financeiro duplicado.

---

## 6. Validação final de integridade

- A proteção contra approve indevido em cenário `rollback_manual` está ativa.
- O cancel mantém comportamento estável e deduplicado no mesmo registro.
- O comportamento combinado (`approve=409` + `cancel=200 deduped`) está consistente com hardening de segurança transacional da Cirurgia 3.

---

## 7. Conclusão GO/NO-GO

**Decisão:** **GO** para iniciar integração real do Painel Admin com os endpoints de saque manual.

### Condição de operação

- Prosseguir mantendo autenticação oficial (JWT + validação admin em banco) e execução controlada de smoke tests.
- Não há evidência, neste smoke test, de regressão bloqueadora nos endpoints administrativos de approve/cancel.

---

**Fim do relatório.**
