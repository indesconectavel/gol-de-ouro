# CIRURGIA - PIX / WEBHOOK / RECONCILE

**Data:** 2026-03-31  
**Escopo:** webhook MP + reconcile PIX + saneamento legado  
**Modo:** cirurgia mínima, sem expansão de bloco

---

## 1. Resumo executivo

Foi aplicada correção cirúrgica para:
1. aumentar robustez e rastreabilidade da validação de assinatura do webhook Mercado Pago;
2. reduzir degradação operacional do reconcile quando houver schema sem `reconcile_skip`;
3. adicionar saneamento SQL idempotente para pendências legadas sem ID MP numérico.

---

## 2. Baseline real utilizada

Tratamento de drift realizado por evidência operacional antes da cirurgia:
- Runtime Fly observado: app `goldeouro-backend-v2`, release `v340`, imagem `deployment-01KK9VY7DCVTESWZAS2ANDA5PP`.
- Baseline local usada na cirurgia: `git rev-parse --short HEAD` = `7d94d3a`.
- Evidência de drift: logs runtime com padrão antigo (`ID de pagamento inválido (não é número): deposito_...`) diferente da string no `server-fly.js` local.

Decisão aplicada:
- cirurgia feita na baseline local controlada, com foco em compatibilidade segura e logs diagnósticos;
- validação pós-deploy obrigatória para confirmar convergência local/runtime.

---

## 3. Arquivos alterados

1. `utils/webhook-signature-validator.js`
2. `server-fly.js`
3. `database/migrate-pagamentos-pix-legado-non-numeric-skip-2026-03-31.sql` (novo)

---

## 4. Correções aplicadas

### 4.1 Drift / baseline
- Drift foi explicitamente tratado como pré-condição e registrado na linha de base desta cirurgia.
- A correção foi preparada para manter comportamento fail-closed no webhook e reduzir ruído em reconcile mesmo em cenário de schema divergente.

### 4.2 Webhook
No `utils/webhook-signature-validator.js`:
- adicionados códigos de erro estruturados (`code`) para facilitar diagnóstico operacional;
- bloqueio explícito de formato legado `sha256=...` no fluxo MP (sem flexibilizar segurança);
- parse de chaves da assinatura com normalização de case (`toLowerCase`) e motivos de falha mais precisos.

No `server-fly.js`:
- logs de rejeição de webhook agora incluem `validation.code` (quando existir), mantendo rejeição 401 para inválidos.

### 4.3 Reconcile
No `server-fly.js`:
- adicionado fallback em memória (`reconcileSkipMemory`) quando coluna `reconcile_skip` não estiver disponível no schema ativo;
- evita reprocessar infinitamente o mesmo `id` legado em cada ciclo no mesmo runtime;
- mantém lógica de marcação oficial via `reconcile_skip` quando coluna existir.

### 4.4 Saneamento SQL
Novo arquivo SQL:
- `database/migrate-pagamentos-pix-legado-non-numeric-skip-2026-03-31.sql`

Conteúdo:
- garante coluna `reconcile_skip`;
- marca `reconcile_skip=true` apenas para `pending` com **ambos** `payment_id` e `external_id` não numéricos (critério estrito);
- idempotente e sem deletar histórico;
- reforça índice parcial de reconcile.

### 4.5 Logs
- melhorias pontuais para deixar explícito:
  - tipo de falha da assinatura (`code`),
  - classificação de legado no reconcile.
- nenhum segredo foi exposto em logs.

---

## 5. Como ficou o fluxo final

1. PIX é criado e salvo como `pending`.
2. Webhook MP chega.
3. Validador classifica falha com `code` (ou aceita quando válido).
4. Se válido e `approved` no MP, segue crédito idempotente existente.
5. Reconcile continua como fallback, ignorando legados não numéricos de forma segura/estável.
6. Legados podem ser saneados via migração idempotente para não poluir ciclos futuros.

---

## 6. Riscos eliminados

1. Ambiguidade operacional em falhas de assinatura (agora há códigos de erro explícitos).
2. Ruído infinito de reconcile no mesmo runtime sem `reconcile_skip`.
3. Falta de trilha SQL idempotente para isolar legados não numéricos.

---

## 7. Riscos remanescentes

1. Drift local x runtime só zera após deploy e conferência de comportamento em produção.
2. Necessidade de validação real com PIX pago após deploy para comprovar crédito fim-a-fim.
3. Registros legados exigem aplicação correta da migração em ambiente alvo.

---

## 8. Checklist de validação pós-cirurgia

1. Deploy da baseline cirurgiada para Fly.
2. Confirmar nos logs ausência de erro antigo repetitivo em reconcile para os mesmos IDs.
3. Criar PIX de teste (baixo valor) e pagar.
4. Verificar webhook aceito (sem `webhook_signature_invalid`).
5. Confirmar `pagamentos_pix` transita `pending -> approved`.
6. Confirmar crédito em `usuarios.saldo`.
7. Reenviar webhook duplicado e validar idempotência (sem crédito em duplicidade).

---

## 9. Classificação final

**PRONTO PARA VALIDAÇÃO**

---

## 10. Conclusão objetiva

A cirurgia foi aplicada com escopo estrito e menor mudança segura possível em webhook/reconcile/saneamento legado.  
Pode seguir para validação operacional em produção (pós-deploy), que é o gate final para confirmar crédito PIX automático.

