# Auditoria forense financeira (READ-ONLY) — produção GoldeOuro V1

**Data:** 2026-03-28  
**Escopo:** código no repositório, evidência estática (sem execução em produção, sem alteração de código).  
**Entrada de produção assumida:** `Dockerfile` executa `node server-fly.js`; `fly.toml` aponta app `goldeouro-backend-v2`, `NODE_ENV=production`.

---

## 1. Resumo executivo

| Área | Achado principal |
|------|------------------|
| PIX (entrada) | Fluxo concentrado em `server-fly.js`: webhook e job de reconciliação chamam a mesma função `creditarPixAprovadoUnicoMpPaymentId`, com *claim* `pending` → `approved` e crédito em `usuarios.saldo` com `.eq('saldo', saldoAnt)`. |
| Duplicidade de crédito (mesmo pagamento MP) | **Mitigado no caminho feliz** pelo *claim* atômico na linha de `pagamentos_pix` + idempotência por status `approved`. |
| Consistência / atomicidade | **Risco relevante:** crédito em `saldo` ocorre **depois** do `UPDATE` que marca `approved`; falha entre os dois pode deixar pagamento “aprovado” localmente **sem** crédito, e o retorno `already_processed` **impede** novo crédito automático. |
| Saque | Débito otimista **antes** do `insert` em `saques`, com tentativa de rollback se o insert falhar. **Não** há, neste arquivo, idempotência HTTP (ex.: `X-Idempotency-Key`) nem worker de payout no mesmo processo. |
| Ledger | **`server-fly.js` não referencia `ledger_financeiro`.** Trilha contábil no app analisado = `pagamentos_pix` + `usuarios.saldo` (+ `chutes` para jogo). |
| Outros arquivos | `server-fly-deploy.js`, `services/pix-service*.js`, `routes/mpWebhook.js` e `controllers/paymentController.js` **não** são o comando do container de produção; citados apenas como risco de divergência se outro binário/roteamento fosse usado por engano. |

---

## 2. PIX (entrada) — fluxo completo

### 2.1 Criação do cobrança (MP + persistência local)

1. Cliente autenticado chama `POST /api/payments/pix/criar`.
2. Backend cria pagamento no Mercado Pago (`X-Idempotency-Key` na criação — idempotência **na API MP**, não no crédito de saldo).
3. Insere linha em `pagamentos_pix` com `external_id` e `payment_id` = `String(payment.id)`, `status: 'pending'`.

```1680:1696:e:\Chute de Ouro\goldeouro-backend\server-fly.js
      // Salvar no banco de dados
      if (dbConnected && supabase) {
        const { data: pixRecord, error: insertError } = await supabase
          .from('pagamentos_pix')
          .insert({
            usuario_id: req.user.userId,
            external_id: String(payment.id),
            payment_id: String(payment.id),
            amount: parseFloat(amount),
            valor: parseFloat(amount),
            status: 'pending',
            qr_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
            qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code || null
          })
          .select()
          .single();
```

**Risco:** se `insertError` ocorrer, o código apenas loga; a resposta ao cliente ainda pode ser sucesso com QR (trecho seguinte). Isso não gera **duplo crédito**, mas gera **PIX pago no MP sem linha local** → webhook/recon não encontram `pagamentos_pix` → `pix_not_found`. **Classificação: ALTO** (perda de correlação / suporte manual), não duplicidade.

### 2.2 Webhook → confirmação MP → crédito

1. `POST /api/payments/webhook` responde **200** imediatamente (`{ received: true }`), depois processa em *fire-and-forget* (assíncrono em relação à resposta).
2. Valida `type === 'payment'`, normaliza `paymentIdStr`, consulta `GET /v1/payments/{id}` no MP.
3. Só prossegue se `status === 'approved'`.
4. Chama `creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)`.

```1956:1992:e:\Chute de Ouro\goldeouro-backend\server-fly.js
}, async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('📨 [WEBHOOK] PIX recebido:', { type, data });
    
    res.status(200).json({ received: true }); // Responder imediatamente
    
    if (type === 'payment' && data?.id != null) {
      const paymentIdStr = String(data.id).trim();
      // ... validações numéricas ...
      const payment = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { /* ... */ }
      );
      if (payment.data.status !== 'approved') {
        return;
      }
      const creditResult = await creditarPixAprovadoUnicoMpPaymentId(paymentIdStr);
      // ... logs ...
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro:', error);
  }
});
```

**Idempotência de evento webhook:** não há tabela `mp_events` nem deduplicação por `event_id` **neste** handler — o MP pode reenviar; a **proteção** contra duplo crédito está na função de crédito (abaixo), não em fila de eventos.

### 2.3 Função central: `creditarPixAprovadoUnicoMpPaymentId`

Comportamento (ordem real):

1. Localiza `pagamentos_pix` por `external_id` ou `payment_id`.
2. Se `status === 'approved'` → `{ ok: true, reason: 'already_processed' }` (**sem** novo crédito).
3. Se não `pending` → rejeita (`unexpected_status`).
4. **Claim:** `UPDATE pagamentos_pix SET status='approved' WHERE id=? AND status='pending'` com `.select()` — só um concorrente “ganha”.
5. Calcula `credit` de `amount`/`valor`; se `credit <= 0`, marca como aprovado e retorna `zero_credit` **sem** alterar saldo.
6. Lê `usuarios.saldo`, calcula `novoSaldo`, faz `UPDATE ... SET saldo = novoSaldo WHERE id=? AND saldo = saldoAnt`.
7. Se o lock otimista do saldo falhar, **reverte** `pagamentos_pix` para `pending` (tentativa).

```1847:1927:e:\Chute de Ouro\goldeouro-backend\server-fly.js
async function creditarPixAprovadoUnicoMpPaymentId(paymentIdStr) {
  if (!dbConnected || !supabase) {
    return { ok: false, reason: 'no_db' };
  }
  let { data: pix } = await supabase
    .from('pagamentos_pix')
    .select('id, usuario_id, amount, valor, status, external_id, payment_id')
    .eq('external_id', paymentIdStr)
    .maybeSingle();
  if (!pix) {
    const alt = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, amount, valor, status, external_id, payment_id')
      .eq('payment_id', paymentIdStr)
      .maybeSingle();
    pix = alt.data;
  }
  if (!pix) {
    return { ok: false, reason: 'pix_not_found' };
  }
  if (pix.status === 'approved') {
    return { ok: true, reason: 'already_processed' };
  }
  if (pix.status !== 'pending') {
    console.warn(`⚠️ [PIX-CREDIT] status inesperado em pagamentos_pix: ${pix.status} id=${pix.id}`);
    return { ok: false, reason: 'unexpected_status' };
  }
  const ts = new Date().toISOString();
  const { data: claimedRows, error: claimErr } = await supabase
    .from('pagamentos_pix')
    .update({ status: 'approved', updated_at: ts })
    .eq('id', pix.id)
    .eq('status', 'pending')
    .select('id, usuario_id, amount, valor');
  // ... credit <= 0 → approved sem saldo ...
  const { data: user, error: userErr } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', row.usuario_id)
    .single();
  // ... user not found → revert pending ...
  const { data: updUser, error: saldoErr } = await supabase
    .from('usuarios')
    .update({ saldo: novoSaldo })
    .eq('id', row.usuario_id)
    .eq('saldo', saldoAnt)
    .select('saldo')
    .maybeSingle();
  if (saldoErr || !updUser) {
    console.error('❌ [PIX-CREDIT] lock otimista saldo:', saldoErr);
    await supabase
      .from('pagamentos_pix')
      .update({ status: 'pending', updated_at: ts })
      .eq('id', row.id)
      .eq('status', 'approved');
    return { ok: false, reason: 'saldo_race' };
  }
  console.log(`💰 [PIX-CREDIT] +R$ ${credit} usuario ${row.usuario_id} mp ${paymentIdStr}`);
  return { ok: true, reason: 'credited' };
}
```

#### Validações da missão (PIX)

| Requisito | Evidência | Avaliação |
|-----------|-----------|-----------|
| Idempotência por `mp_payment_id` | Correlato a `external_id` / `payment_id` + *claim* + `already_processed` | **Atende** (identificador MP na linha única esperada). |
| Webhook + reconcile sem duplo crédito | Ambos chamam a **mesma** função | **Atende** para concorrência entre caminhos. |
| Transição `pending` → `approved` | *Claim* condicional a `status='pending'` | **Atende** como trava de negócio. |
| Lock otimista no saldo | `.eq('saldo', saldoAnt)` | **Atende** no incremento de saldo. |
| Duplicidade de crédito (mesmo pagamento) | Dois processos: um falha no *claim* (`claim_lost`) ou vê `approved` | **Risco BAIXO** no modelo “uma linha por `payment.id`”. |
| Race / reprocessamento | Webhook idempotente por linha; `claim_lost` tratado nos logs | **BAIXO** para duplicar crédito. |

#### Pontos de risco (PIX) — classificação

| ID | Descrição | Classificação |
|----|-----------|---------------|
| P1 | **Janela não atômica:** `approved` em `pagamentos_pix` **antes** do `UPDATE` em `saldo`. Queda do processo entre os dois → linha `approved` sem crédito; próximas chamadas retornam `already_processed` → **crédito automático perdido**. | **CRÍTICO** (consistência / perda de crédito; **não** é duplicidade). |
| P2 | **`credit <= 0`:** mantém `approved` e não credita saldo (dados inválidos). | **ALTO** (inconsistência negócio vs saldo). |
| P3 | **`insert` de `pagamentos_pix` falha** mas fluxo de resposta ao cliente ainda pode seguir com QR válido no MP. | **ALTO** (rastreabilidade / suporte). |
| P4 | Dependência de **uma linha** por ID MP: `.maybeSingle()` assume no máximo uma linha por consulta; duplicatas só são impossíveis se o banco tiver **UNIQUE** em `external_id` (presente no SQL consolidado do repositório — **não** auditado em runtime neste relatório). | **MÉDIO** (duplicidade teórica se schema divergir). |

---

## 3. Reconciliação (PIX)

Função `reconcilePendingPayments`: flag `reconciling` evita sobreposição **no mesmo processo**; lista `pagamentos_pix` com `status === 'pending'` e `created_at` antigo; consulta MP; se `approved`, chama `creditarPixAprovadoUnicoMpPaymentId` — **mesma idempotência** do webhook.

```2025:2095:e:\Chute de Ouro\goldeouro-backend\server-fly.js
let reconciling = false;
async function reconcilePendingPayments() {
  if (reconciling) return;
  if (!dbConnected || !supabase || !mercadoPagoConnected) return;
  try {
    reconciling = true;
    // ... lista pending, idade mínima, limit ...
    for (const p of pendings) {
      const mpId = String(p.external_id || p.payment_id || '').trim();
      // ... validação SSRF / dígitos ...
      const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, { /* ... */ });
      const status = resp?.data?.status;
      if (status === 'approved') {
        const creditResult = await creditarPixAprovadoUnicoMpPaymentId(mpId);
        // ... logs ...
      }
    }
  } finally {
    reconciling = false;
  }
}
if (process.env.MP_RECONCILE_ENABLED !== 'false') {
  const intervalMs = parseInt(process.env.MP_RECONCILE_INTERVAL_MS || '60000', 10);
  setInterval(reconcilePendingPayments, Math.max(30000, intervalMs));
}
```

| Risco | Classificação |
|-------|---------------|
| Duplicidade por recon + webhook | **BAIXO** (mesma função de crédito). |
| Múltiplas **instâncias** Fly do mesmo app | **MÉDIO:** flag `reconciling` é **por processo**; duas VMs podem rodar ciclos em paralelo — o *claim* em banco ainda serializa, mas aumenta carga e repetição de chamadas MP. |

---

## 4. Saque (saída)

Fluxo `POST /api/withdraw/request`:

1. Validação (`PixValidator`).
2. `select` saldo; checagem de valor.
3. **Débito** com lock otimista: `UPDATE usuarios SET saldo = novoSaldo WHERE id=? AND saldo = saldoAtual`.
4. **Depois**, `insert` em `saques`.
5. Se insert falha, tenta **rollback** de saldo com `.eq('saldo', usuarioDebitado.saldo)`.

```1459:1511:e:\Chute de Ouro\goldeouro-backend\server-fly.js
    const { data: usuarioDebitado, error: debitoError } = await supabase
      .from('usuarios')
      .update({ saldo: novoSaldo })
      .eq('id', userId)
      .eq('saldo', usuario.saldo)
      .select('saldo')
      .single();

    if (debitoError || !usuarioDebitado) {
      return res.status(409).json({
        success: false,
        message: 'Saldo insuficiente ou alterado. Tente novamente.'
      });
    }

    const { data: saque, error: saqueError } = await supabase
      .from('saques')
      .insert({
        usuario_id: userId,
        valor: parseFloat(valor),
        amount: parseFloat(valor),
        pix_key: validation.data.pixKey,
        pix_type: validation.data.pixType,
        chave_pix: validation.data.pixKey,
        tipo_chave: validation.data.pixType,
        status: 'pendente',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saqueError) {
      console.error('❌ [SAQUE] Erro ao criar saque:', saqueError);
      const { data: rollbackRow, error: rollbackError } = await supabase
        .from('usuarios')
        .update({ saldo: saldoAtual })
        .eq('id', userId)
        .eq('saldo', usuarioDebitado.saldo)
        .select('saldo')
        .single();
      if (rollbackError || !rollbackRow) {
        console.error('❌ [SAQUE] Falha crítica no rollback de saldo após erro no insert:', rollbackError);
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar saque'
      });
    }
```

| Requisito | Avaliação |
|-----------|-----------|
| Ordem débito → insert | **Correta** (débito antes). |
| Rollback em falha | **Presente**, com lock otimista no rollback. |
| Idempotência da requisição | **Ausente** neste handler (sem header de idempotência / `correlation_id` no insert). |
| Saque duplicado (duas requisições paralelas) | Segundo débito tende a **409** se o saldo já mudou — **BAIXO** para duplicar débito no mesmo saldo. |
| Falha parcial | Se rollback falhar após insert falhar, log “Falha crítica” — saldo pode ficar debitado **sem** linha em `saques`. **CRÍTICO** (inconsistência). |
| Processamento/payout após `pendente` | **Não implementado em `server-fly.js`** neste repositório (sem worker referenciado no `package.json` / mesmo processo). Liquidação externa ou outro deploy não auditado aqui. |

Resposta ao cliente declara `status: 'pending'` enquanto o insert usa `'pendente'` — possível divergência só de **contrato JSON** vs banco.

---

## 5. Consistência de saldo — operações que alteram `usuarios.saldo` em `server-fly.js`

| Operação | Lock otimista (`.eq('saldo', ...)`) | Nota |
|----------|-------------------------------------|------|
| Crédito PIX | **Sim** | Ver função acima. |
| `POST /api/withdraw/request` (débito + rollback) | **Sim** | |
| `POST /api/games/shoot` (aposta/prêmio) | **Sim** na reserva principal | |
| Rollback de shoot (validação/insert chute falhou) | **Não** — `update({ saldo: user.saldo }).eq('id', ...)` apenas | **MÉDIO/ALTO:** pode sobrescrever saldo concurrente (PIX/jogo/outro). |
| Login “saldo inicial” para usuário com saldo 0 | **Não** — `update({ saldo: calculateInitialBalance(...) }).eq('id', user.id)` | **MÉDIO:** corrida com outros créditos/débitos. |

Trecho shoot rollback (sem lock no valor esperado):

```1302:1305:e:\Chute de Ouro\goldeouro-backend\server-fly.js
    if (!postShotValidation.valid) {
      console.error('❌ [SHOOT] Problema de integridade após chute:', postShotValidation.error);
      await supabase.from('usuarios').update({ saldo: user.saldo }).eq('id', req.user.userId);
```

Trecho login (quando aplicável):

```921:927:e:\Chute de Ouro\goldeouro-backend\server-fly.js
    if (user.saldo === 0 || user.saldo === null) {
      try {
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ saldo: calculateInitialBalance('regular') })
          .eq('id', user.id);
```

---

## 6. Banco de dados (evidência no repositório)

- **`SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql`:** `pagamentos_pix.external_id VARCHAR(255) UNIQUE NOT NULL`; `status` CHECK inclui `pending` / `approved`.
- **Índices** em `external_id`, `payment_id` em outros arquivos SQL do repo.
- **`ledger_financeiro`:** existe em scripts/`src/domain/ledger` no repositório, mas **não** é escrita pelo `server-fly.js` analisado — reconciliação saldo vs ledger, se usada, é **fora** deste binário ou legado.

**Ausência de unicidade em pagamentos (produção real):** o relatório **não** executou `information_schema` em produção; a mitigação de duplicata de linhas para o mesmo MP depende do schema efetivo do Supabase.

---

## 7. Arquivos alternativos (não são o CMD do Docker)

- **`server-fly-deploy.js`:** webhook atualiza `pagamentos_pix` e saldo com leitura/escrita **sem** o padrão *claim* + lock otimista descrito acima — **se** esse arquivo fosse o processo principal, o risco de duplicidade/concorrência seria **maior**. Não é o caso do `Dockerfile` atual.
- **`routes/mpWebhook.js`:** idempotência via `mp_events` em PostgreSQL direto — não integrado ao `server-fly.js` nesta leitura.
- **`controllers/paymentController.solicitarSaque`:** fluxo insert-centric sem o débito otimista visto em `server-fly.js` — risco se essa rota estivesse exposta na mesma API.

---

## 8. Veredito final

### SEGURO PARA PIX REAL: **NÃO**

**Motivação (alinhada ao critério e ao escopo financeiro):**

1. **Critério explícito:** “Se existir qualquer risco de duplicidade → NÃO”. Há **risco residual** de mais de uma linha `pagamentos_pix` para o mesmo pagamento se a **constraint UNIQUE** em `external_id` **não** existir em produção (não verificado em runtime aqui). Nesse cenário, `.maybeSingle()` pode falhar ou comportar-se de forma ambígua — **duplicidade de crédito não pode ser excluída só pelo código** sem o schema.
2. **Mesmo com uma linha por pagamento:** a ordem **aprovar antes de creditar saldo** (P1) introduz falha de **perda de crédito** com bloqueio de retry automático — inaceitável para “PIX real” sob visão forense de consistência.
3. **Saque:** risco de **falha parcial** (débito sem `saques` se rollback falhar) e ausência de pipeline de payout no mesmo artefato.

**Observação:** O desenho de *claim* `pending`→`approved` **mais** `UPDATE saldo ... WHERE saldo = antigo` **reduz fortemente** a chance de **dois créditos** para o mesmo `payment_id` quando há **exatamente uma** linha e o processo completa as duas etapas — isto é evidência positiva, mas **não** sustenta “seguro” isoladamente face aos itens acima.

---

## 9. Referências rápidas de arquivos

| Arquivo | Papel |
|---------|--------|
| `Dockerfile` | `CMD ["node", "server-fly.js"]` |
| `fly.toml` | App Fly.io, `NODE_ENV=production` |
| `server-fly.js` | Webhook PIX, reconciliação, crédito, saque, jogo |
| `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql` | UNIQUE `external_id`, CHECKs `pagamentos_pix` |

---

*Fim do relatório (READ-ONLY).*
