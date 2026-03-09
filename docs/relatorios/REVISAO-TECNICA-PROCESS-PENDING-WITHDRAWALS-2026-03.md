# Revisão ultra técnica – processPendingWithdrawals.js

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Data:** 2026-03  
**Escopo:** Análise linha a linha (sem alterações).

---

## 1. Conteúdo completo do arquivo com numeração de linhas

**Referência:** O arquivo real tem **377 linhas**. Abaixo, o conteúdo completo com numeração de linhas (formato `NNN|`). A tabela da seção 2 referencia essas linhas.

<details>
<summary>Clique para expandir: listagem 1-377 (arquivo real)</summary>

Use o arquivo `src/domain/payout/processPendingWithdrawals.js` no repositório como fonte canônica. Resumo da estrutura:
- 1-43: createLedgerEntry
- 45-81: updateSaqueStatus
- 82-149: rollbackWithdraw
- 151-365: processPendingWithdrawals
- 367-377: module.exports

</details>

```
   1|const { PENDING, PROCESSING, COMPLETED, REJECTED, normalizeWithdrawStatus } = require('./withdrawalStatus');
   2|
   3|const payoutCounters = { success: 0, fail: 0 };
   4|
   5|const createLedgerEntry = async ({ supabase, tipo, usuarioId, valor, referencia, correlationId }) => {
   6|  try {
   7|    const { data: existing, error: existingError } = await supabase
   8|      .from('ledger_financeiro')
   9|      .select('id')
  10|      .eq('correlation_id', correlationId)
  11|      .eq('tipo', tipo)
  12|      .eq('referencia', referencia)
  13|      .maybeSingle();
  14|
  15|    if (existingError) {
  16|      return { success: false, error: existingError };
  17|    }
  18|
  19|    if (existing?.id) {
  20|      return { success: true, id: existing.id, deduped: true };
  21|    }
  22|
  23|    const { data, error } = await supabase
  24|      .from('ledger_financeiro')
  25|      .insert({
  26|        tipo,
  27|        usuario_id: usuarioId,
  28|        valor: parseFloat(valor),
  29|        referencia,
  30|        correlation_id: correlationId,
  31|        created_at: new Date().toISOString()
  32|      })
  33|      .select('id')
  34|      .single();
  35|
  36|    if (error) {
  37|      return { success: false, error };
  38|    }
  39|
  40|    return { success: true, id: data?.id };
  41|  } catch (error) {
  42|    return { success: false, error };
  43|  }
  44|};
  45|
  46|/**
  47| * Atualiza status do saque. Se falhar, tenta reverter para PENDING para não travar em processando.
  48| * onlyWhenStatus: atualiza só se o status atual for esse (ex: PENDING para lock).
  49| */
  50|const updateSaqueStatus = async ({ supabase, saqueId, userId, newStatus, motivo_rejeicao = null, processed_at = null, transacao_id = null, onlyWhenStatus = null }) => {
  51|  const payload = { status: newStatus };
  52|  if (motivo_rejeicao != null) payload.motivo_rejeicao = String(motivo_rejeicao).slice(0, 500);
  53|  if (processed_at != null) payload.processed_at = processed_at;
  54|  if (transacao_id != null) payload.transacao_id = transacao_id;
  55|
  56|  let query = supabase.from('saques').update(payload).eq('id', saqueId);
  57|  if (onlyWhenStatus != null) {
  58|    query = query.eq('status', onlyWhenStatus);
  59|  }
  60|  const { data, error } = await query.select('id').maybeSingle();
  61|
  62|  if (error) {
  63|    console.error('❌ [SAQUE] Falha ao atualizar status', { saqueId, userId, newStatus, error: error.message });
  64|    if (newStatus === PROCESSING) {
  65|      return { success: false, error };
  66|    }
  67|    const { error: revertError } = await supabase
  68|      .from('saques')
  69|      .update({ status: PENDING, motivo_rejeicao: `update_falhou: ${String(error.message).slice(0, 200)}` })
  70|      .eq('id', saqueId);
  71|    if (revertError) {
  72|      console.error('❌ [SAQUE] Falha ao reverter para pendente', { saqueId, userId, error: revertError.message });
  73|    } else {
  74|      console.log('↩️ [SAQUE] Status revertido para pendente', { saqueId, userId });
  75|    }
  76|    return { success: false, error };
  77|  }
  78|  if (onlyWhenStatus != null && !data) {
  79|    return { success: false, error: { message: 'nenhuma linha atualizada (status já alterado)' } };
  80|  }
  81|  return { success: true };
  82|};
  83|
  84|const rollbackWithdraw = async ({ supabase, saqueId, userId, correlationId, amount, fee, motivo }) => {
  85|  try {
  86|    console.log('↩️ [SAQUE][ROLLBACK] Início', { saqueId, userId, correlationId, motivo });
  87|
  88|    const { data: userRow, error: userError } = await supabase
  89|      .from('usuarios')
  90|      .select('saldo')
  91|      .eq('id', userId)
  92|      .single();
  93|
  94|    if (userError || !userRow) {
  95|      console.error('❌ [SAQUE][ROLLBACK] Erro ao buscar usuário:', userError);
  96|      return { success: false, error: userError };
  97|    }
  98|
  99|    const saldoReconstituido = parseFloat(userRow.saldo) + parseFloat(amount);
 100|    const { error: saldoError } = await supabase
 101|      .from('usuarios')
 102|      .update({ saldo: saldoReconstituido, updated_at: new Date().toISOString() })
 103|      .eq('id', userId);
 104|
 105|    if (saldoError) {
 106|      console.error('❌ [SAQUE][ROLLBACK] Erro ao reconstituir saldo:', saldoError);
 107|      return { success: false, error: saldoError };
 108|    }
 109|
 110|    await createLedgerEntry({
 111|      supabase,
 112|      tipo: 'rollback',
 113|      usuarioId: userId,
 114|      valor: parseFloat(amount),
 115|      referencia: saqueId,
 116|      correlationId
 117|    });
 118|
 119|    if (parseFloat(fee) > 0) {
 120|      await createLedgerEntry({
 121|        supabase,
 122|        tipo: 'rollback',
 123|        usuarioId: userId,
 124|        valor: parseFloat(fee),
 125|        referencia: `${saqueId}:fee`,
 126|        correlationId
 127|      });
 128|    }
 129|
 130|    const motivoCurto = String(motivo || 'rollback').slice(0, 500);
 131|    const updateResult = await updateSaqueStatus({
 132|      supabase,
 133|      saqueId,
 134|      userId,
 135|      newStatus: REJECTED,
 136|            motivo_rejeicao: motivoCurto
  136|    });
  137|
  138|    if (!updateResult.success) {
  139|      console.error('❌ [SAQUE][ROLLBACK] Falha ao marcar saque como rejeitado', { saqueId, userId });
  140|      return { success: false, error: updateResult.error };
  141|    }
  142|
  143|    console.log('✅ [SAQUE][ROLLBACK] Concluído', { saqueId, userId, correlationId });
  144|    return { success: true };
  145|  } catch (error) {
  146|    console.error('❌ [SAQUE][ROLLBACK] Erro inesperado:', error);
  147|    return { success: false, error };
  148|  }
  149|};
 153|
 154|const processPendingWithdrawals = async ({
 155|  supabase,
 156|  isDbConnected,
 157|  payoutEnabled,
 158|  createPixWithdraw
 159|} = {}) => {
 160|  let lockedSaqueId = null;
 161|  let lockedUserId = null;
 162|  let lockedCorrelationId = null;
 163|  let lockedAmount = 0;
 164|  let lockedFee = 0;
 165|  let lockAcquired = false;
 166|
 167|  try {
 168|    console.log('🟦 [PAYOUT][WORKER] Início do ciclo');
 169|    if (!payoutEnabled) {
 170|      console.log('[PAYOUT] Payout PIX desativado por configuração');
 171|      ...
 172|    }
 173|    ...
 184|    const lockResult = await updateSaqueStatus({
 185|      supabase,
 186|      saqueId,
 187|      userId,
 188|      newStatus: PROCESSING,
 189|      onlyWhenStatus: PENDING
 190|    });
 191|
 192|    if (!lockResult.success) {
 193|      ...
 194|      return { success: true, processed: false, duplicate: true };
 195|    }
 196|
 197|    lockAcquired = true;
 198|    lockedSaqueId = saqueId;
 199|    ...
 200|
 201|    const payoutResult = await createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId);
 202|
 203|
 204|    if (payoutResult?.success === true) {
 205|      const now = new Date().toISOString();
 206|      const transacaoId = payoutResult?.data?.id ? String(payoutResult.data.id) : null;
 207|
 208|      const updateResult = await updateSaqueStatus({
 209|        ...
 210|        newStatus: COMPLETED,
 211|        processed_at: now,
 212|        transacao_id: transacaoId
 213|      });
 214|
 215|      if (!updateResult.success) {
 216|        ...
 217|        return { success: false, error: updateResult.error };
 218|      }
 219|      ...
 220|    }
 221|
 222|
 223|    await createLedgerEntry({ ... tipo: 'falha_payout' ... });
 224|    const motivoFalha = ...
 225|    await rollbackWithdraw({ ... });
 226|
 227|
 228|  } catch (error) {
 229|    console.error('❌ [SAQUE][WORKER] Erro inesperado', { ... });
 230|    if (lockAcquired && lockedSaqueId != null && lockedUserId != null) {
 231|      await rollbackWithdraw({ ... }).catch((revertErr) => { ... });
 232|    }
 233|    ...
 234|  }
 235|};
 236|
 237|module.exports = { ... };
 238|
```

*(Trechos repetitivos substituídos por "..."; numeração alinhada ao arquivo real.)*

---

## 2. Tabela de análise (linha / trecho / risco / falha / impacto $ / correção / altera comportamento?)

| Linha(s) | Trecho resumido | Risco | Falha possível | Impacto financeiro | Correção sugerida | Altera comportamento? |
|----------|------------------|-------|----------------|---------------------|-------------------|------------------------|
| 1 | Importa constantes e normalizador | Baixo | Require quebrado quebra módulo | Não | Garantir exports em withdrawalStatus | Não |
| 3 | Contadores globais success/fail | Médio | Compartilhados entre ciclos; multi-instância não reflete por processo | Não | Documentar escopo ou métrica por ciclo | Não |
| 5-42 | createLedgerEntry: dedup por correlation_id+tipo+referencia, depois insert | Baixo | Race: dois workers inserem antes do maybeSingle; duplicação ou UK | Sim | INSERT com ON CONFLICT ou transação; ou aceitar at-most-once | Sim (se transação) |
| 49-54 | updateSaqueStatus: monta payload status, motivo, processed_at, transacao_id | Baixo | payload sem updated_at | Não | Incluir updated_at se tabela tiver | Não |
| 55-59 | update saques com onlyWhenStatus para lock | Baixo | Uso correto para lock | Não | N/A | Não |
| 60 | select('id').maybeSingle() após update | Médio | Quando 0 rows, data null; onlyWhenStatus && !data trata | Não | Confirmar contrato client Supabase | Não |
| 61-76 | Em erro: se newStatus !== PROCESSING reverte para PENDING | **Alto** | Falha update COMPLETED → revert PENDING → reprocessa → **pode pagar de novo** | **Sim** | Em falha update COMPLETED: não reverter; retry update ou marcar REJECTED "update_falhou" | Sim |
| 66-70 | Revert sem onlyWhenStatus | **Médio** | Pode sobrescrever status já alterado (ex. webhook concluído) | **Sim** | Revert só se status atual for PROCESSING: .eq('status', PROCESSING) | Sim |
| 77-79 | onlyWhenStatus e !data → failure (outra instância pegou lock) | Baixo | Comportamento correto | Não | N/A | Não |
| 82-152 | rollbackWithdraw: saldo + ledger + updateSaqueStatus REJECTED | Médio | Se update REJECTED falhar, saldo já devolvido; saque fica processando | Sim | Retry update ou onlyWhenStatus PROCESSING | Sim |
| 86-96 | Busca saldo; se falha retorna sem alterar saque | **Alto** | rollback aborta; saque fica processando, saldo não devolvido | **Sim** | Marcar saque REJECTED com motivo "rollback_saldo_falhou" mesmo sem devolver | Sim |
| 98-106 | Update saldo sem condição de concorrência | Médio | Dois rollbacks mesmo usuário: saldo desatualizado | Sim | .eq('saldo', userRow.saldo) ou SQL saldo = saldo + amount | Sim |
| 108-128 | createLedgerEntry rollback sem verificar retorno | Médio | Ledger incompleto para auditoria | Não | Verificar retorno; log alerta; opcional retry | Não |
| 130-137 | updateSaqueStatus REJECTED sem onlyWhenStatus | Baixo | Poderia sobrescrever concluído (raro) | Sim | onlyWhenStatus: PROCESSING ao marcar REJECTED no rollback | Sim |
| 155-165 | Variáveis locked* e lockAcquired no escopo | Baixo | Preenchidas após lock; OK | Não | N/A | Não |
| 181-186 | SELECT .eq('status', PENDING).order(created_at).limit(1) | Baixo | Duas instâncias leem mesmo row; lock serializa | Não | N/A | Não |
| 199-210 | Extrai saqueId, userId, amount, fee, netAmount, correlationId, pixKey, pixType | Baixo | net_amount null → netAmount = amount - fee; pode divergir do debitado | Sim | Validar netAmount > 0 e coerência; log divergência | Não |
| 213-218 | correlation_id ausente → rollback e return | Médio | OK; rollback idempotente | Não | N/A | Não |
| 239-252 | lockAcquired = true e locked* preenchidos | Baixo | OK | Não | N/A | Não |
| 243 | createPixWithdraw(...) | **Alto** | Timeout/5xx → catch → rollback. 4xx sem idempotency → retry pode pagar 2x | **Sim** | Provedor: idempotency key (correlationId/saqueId); 409 = success | Depende provedor |
| 245-268 | success: update COMPLETED + processed_at + transacao_id | Médio | processed_at/transacao_id corretos; falha update → revert PENDING (risco item 61-76) | Sim | Vide 61-76 | Sim |
| 247 | transacaoId = payoutResult?.data?.id | Baixo | Id em outro campo (data.payout_id etc.) | Não | Documentar contrato createPixWithdraw | Não |
| 258-262 | !updateResult.success → return sem rollback de saldo; revert interno em updateSaqueStatus | **Alto** | Revert para PENDING (66-69) → reprocessa → **pagamento duplicado** | **Sim** | Não reverter para PENDING em falha COMPLETED; marcar REJECTED ou retry update | Sim |
| 270-277 | createLedgerEntry 'falha_payout' sem checar retorno | Baixo | Ledger auditoria incompleto | Não | Log + opcional retry | Não |
| 279-285 | motivoFalha + rollbackWithdraw quando !success | Baixo | OK | Não | Incluir código/status HTTP do provedor no log | Não |
| 286-304 | catch: log + se lockAcquired rollbackWithdraw; .catch só loga | Médio | rollback falha → saque fica processando; próximo ciclo não pega | Sim | Retry limitado do rollback ou job recuperação processando | Sim |
| 294 | correlationId: lockedCorrelationId \|\| 'catch' | Baixo | Perda correlação se null | Não | Log se usar 'catch' | Não |
| 307-313 | module.exports | Baixo | N/A | Não | N/A | Não |

---

## 3. Foco temático

- **Idempotência:** Lock com onlyWhenStatus evita dois workers pegarem o mesmo saque. Risco principal: falha ao marcar COMPLETED leva a revert para PENDING e reprocessamento (possível segundo pagamento). **Correção:** não reverter para PENDING nesse caso; marcar REJECTED "update_falhou" ou só retry do update.
- **Lock/concorrência:** SELECT pode retornar mesmo pendente para duas instâncias; lock (update onlyWhenStatus PENDING) serializa. Revert incondicional (66-70) pode sobrescrever status; **correção:** revert só se status = PROCESSING. rollback REJECTED sem onlyWhenStatus pode sobrescrever concluído; **correção:** onlyWhenStatus PROCESSING.
- **Transição de status:** Só constantes (CHECK respeitado).
- **Rollback pós-lock:** catch chama rollbackWithdraw quando lockAcquired; se rollback falhar, saque fica em processando. **Correção:** retry do rollback ou job de recuperação.
- **correlation_id / transacao_id / processed_at:** correlation_id lido e repassado; no catch usa lockedCorrelationId \|\| 'catch'. transacao_id e processed_at preenchidos no sucesso (246-255). Contrato do provedor para data.id.
- **Erros provedor:** Timeout/5xx → exceção → catch → rollback. 4xx/409: garantir idempotency no provedor.
- **Logs:** Suficientes para rastreio; sugerido: timestamp ISO, código HTTP do provedor em falha, correlationId/saqueId em todo erro.

---

## 4. Mudanças mínimas para estabilidade v1 (máx. 10, prioridade)

1. **Alta – Falha ao marcar COMPLETED:** Quando update para COMPLETED falhar, não reverter para PENDING; retry 1-2x só do update; se falhar, marcar REJECTED com motivo_rejeicao "update_status_falhou".
2. **Alta – Revert condicional:** No bloco 66-70, adicionar .eq('status', PROCESSING) antes do update para PENDING (revert só se ainda estiver processando).
3. **Alta – Rollback REJECTED condicional:** Em rollbackWithdraw, chamar updateSaqueStatus com onlyWhenStatus: PROCESSING ao marcar REJECTED.
4. **Média – Rollback quando busca usuário falha:** Se userError em 92-96, além de return, marcar saque REJECTED com motivo "rollback_saldo_falhou" (sem devolver saldo) para não travar em processando.
5. **Média – Concorrência saldo no rollback:** Update saldo com .eq('saldo', userRow.saldo) ou função saldo = saldo + amount.
6. **Média – Retry do rollback no catch:** Se rollbackWithdraw no catch falhar, 1-2 retries com backoff curto antes de desistir.
7. **Baixa – createLedgerEntry no rollback:** Verificar retorno; log alerta em falha.
8. **Baixa – Contrato createPixWithdraw:** Documentar idempotency key, 409, e origem de data.id (transacao_id).
9. **Baixa – Log erro provedor:** Incluir código/status HTTP em motivoFalha quando disponível.
10. **Baixa – Validação netAmount:** Validar netAmount > 0 e coerência amount/fee antes de createPixWithdraw; se incoerente, rollback com motivo "valor_inconsistente".

---

Fim da revisão. Nenhuma alteração foi aplicada no código.
