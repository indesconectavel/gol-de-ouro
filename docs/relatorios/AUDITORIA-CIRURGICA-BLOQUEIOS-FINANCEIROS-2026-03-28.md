# AUDITORIA CIRÚRGICA — BLOQUEIOS FINANCEIROS

**Escopo:** leitura estática do repositório (read-only). Processo de produção assumido: `node server-fly.js` (`Dockerfile`, `CMD ["node", "server-fly.js"]`). Data: 2026-03-28.

---

## 1. Resumo executivo

Os bloqueios reais para **PIX real seguro** e **saque sem perda de saldo** concentram-se em **`server-fly.js`**, por três mecanismos objetivos:

1. **PIX — janela `approved` antes do crédito em `usuarios.saldo`:** a função `creditarPixAprovadoUnicoMpPaymentId` faz **claim** que grava `pagamentos_pix.status = 'approved'` **antes** do `UPDATE` de saldo. Qualquer falha ou morte do processo **após** o claim e **antes** do crédito deixa a linha **aprovada localmente sem saldo**. Chamadas seguintes retornam **`already_processed`** e **não tentam creditar de novo** — crédito automático perdido até intervenção ou rotina de reparo.

2. **PIX — QR entregue sem linha local:** em `POST /api/payments/pix/criar`, falha no `insert` em `pagamentos_pix` só gera log; a resposta HTTP ainda pode ser **sucesso com QR**. O pagamento existe no Mercado Pago **sem** correlação estável no banco → webhook/reconcile tendem a **`pix_not_found`**.

3. **Saque — débito antes do registro, rollback condicionado ao saldo:** `POST /api/withdraw/request` debita saldo com lock otimista e **só depois** insere em `saques`. Se o `insert` falhar, o rollback restaura saldo com `.eq('saldo', usuarioDebitado.saldo)`. Se o saldo **mudou** entre o débito e o rollback (outra operação, corrida), o rollback **não aplica** → risco de **saldo debitado sem linha de saque** (estado crítico; compensação frágil).

Há ainda um sub-risco de **inconsistência lógica** em PIX: ramo `zero_credit` mantém `approved` sem creditar saldo (valor zero ou colunas vazias), o que reproduz “aprovado sem movimento de saldo” de forma **intencional no código**.

---

## 2. Fluxo real do PIX no código

### 2.1 Criação do pagamento (cliente → MP → persistência)

| Etapa | Onde | Função / rota |
|--------|------|----------------|
| Entrada HTTP | `server-fly.js` | `app.post('/api/payments/pix/criar', …)` — a partir da linha **1590** |
| Validação de valor | Mesma rota | `amount` mínimo 1, máximo 1000 (**1594–1605**) |
| Chamada MP | Mesma rota | `axios.post` `https://api.mercadopago.com/v1/payments` (**1658–1673**) |
| Persistência local | Mesma rota | `supabase.from('pagamentos_pix').insert({ … status: 'pending' …})` (**1682–1696**) |
| Resposta ao cliente | Mesma rota | `res.json({ success: true, data: { id: payment.id, … }})` (**1705–1717**) |

**Observação:** `external_reference` enviado ao MP é `goldeouro_${userId}_${Date.now()}` (**1648**); no banco, `external_id` e `payment_id` são **`String(payment.id)`** (**1686–1687**), alinhados ao que o webhook usa (`data.id`).

### 2.2 Webhook

| Etapa | Onde | Detalhe |
|--------|------|---------|
| Rota | `server-fly.js` | `app.post('/api/payments/webhook', …)` — **1935–1997** |
| Resposta antecipada | **1961** | `res.status(200).json({ received: true })` — MP considera entregue antes do trabalho pesado |
| Validação de tipo | **1963–1972** | `type === 'payment'`, `paymentIdStr` numérico |
| Confirmação no MP | **1974–1983** | `GET /v1/payments/:id` |
| Gate por status MP | **1984–1986** | Só prossegue se `payment.data.status === 'approved'` |
| Crédito | **1987** | `await creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)` |

### 2.3 `reconcilePendingPayments()`

| Etapa | Onde | Detalhe |
|--------|------|---------|
| Função | `server-fly.js` | **2027–2089** |
| Concorrência in-process | **2026–2028**, **2086–2088** | Flag `reconciling` evita sobreposição **no mesmo processo** |
| Seleção | **2036–2042** | `status === 'pending'`, `created_at` &lt; limite, `limit` configurável |
| Consulta MP | **2067–2070** | `GET /v1/payments/:id` |
| Crédito | **2072–2078** | Se MP `approved` → `creditarPixAprovadoUnicoMpPaymentId(mpId)` |
| Agendamento | **2092–2095** | `setInterval` se `MP_RECONCILE_ENABLED !== 'false'` |

### 2.4 `creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)` — ordem exata das escritas

Arquivo: `server-fly.js`, função **1847–1927**.

| Ordem | Linhas | Ação |
|-------|--------|------|
| Leitura | **1851–1863** | Busca por `external_id`, depois `payment_id`; `pix_not_found` se ausente |
| Idempotência “curta” | **1867–1868** | Se `pix.status === 'approved'` → `{ ok: true, reason: 'already_processed' }` **sem** verificar saldo |
| Estados inválidos | **1870–1872** | Se não `pending` → `unexpected_status` |
| **Claim → `approved`** | **1875–1887** | `UPDATE pagamentos_pix SET status='approved' … WHERE id=? AND status='pending'`; se 0 linhas → `claim_lost` |
| Crédito zero | **1889–1892** | Se `credit <= 0`: **mantém `approved`**, retorna `zero_credit` |
| Leitura saldo | **1894–1898** | `usuarios.saldo` |
| Falha usuário | **1899–1906** | Reverte `pagamentos_pix` para `pending` |
| **Crédito saldo** | **1910–1916** | `UPDATE usuarios SET saldo = novoSaldo … .eq('saldo', saldoAnt)` |
| Falha lock saldo | **1917–1924** | Reverte `pagamentos_pix` para `pending` |
| Sucesso | **1926–1927** | Log + `credited` |

**Janela crítica (approved → saldo):** entre o **fim do `UPDATE` de claim bem-sucedido** (**1875–1880**, retorno com `claimedRows`) e o **commit efetivo** do `UPDATE` de `usuarios` (**1910–1916**). Não há transação SQL única entre as duas tabelas. Falhas **após** o claim e **antes** do crédito (crash, timeout de rede, erro não tratado fora dos ramos que revertem) deixam **`approved` sem saldo**.

**Reparo automático pelo fluxo atual:** **parcial.** Se o código executa os ramos **1899–1906** ou **1917–1924**, há **tentativa** de voltar para `pending`. Porém:

- Se o processo morre **entre** claim e esses `UPDATE` de reversão, não há reversão.
- Se já está `approved` e uma nova execução cai em **1867–1868**, **não há segunda chance** de crédito automático (`already_processed`).

**Reparo automático adicional:** exigiria **rotina** (job/admin) que identifique `approved` sem evidência de crédito (ex.: comparar saldo esperado, ledger, ou novo campo) ou **mudança de modelo de estado** (ver secção 5).

---

## 3. Fluxo real do saque no código

Único handler analisado no processo principal: **`POST /api/withdraw/request`** (`server-fly.js` **1401–1538**).

| Ordem | Linhas | Ação |
|-------|--------|------|
| Validação | **1403–1420** | `pixValidator.validateWithdrawData` |
| Leitura saldo | **1431–1435** | `usuarios.saldo` |
| Checagem suficiência | **1444–1448** | Só leitura; não debita ainda |
| Cálculo | **1451–1457** | `taxa`, `valorLiquido` (informativo); débito usa **valor integral** `valorSaque` |
| **Débito** | **1460–1466** | `UPDATE usuarios SET saldo = novoSaldo` com `.eq('saldo', usuario.saldo)` |
| Conflito débito | **1468–1472** | 409 “Saldo insuficiente ou alterado” |
| **Insert saque** | **1476–1494** | `insert` em `saques`, `status: 'pendente'` |
| Falha insert | **1496–1511** | Log; **rollback** `UPDATE usuarios SET saldo: saldoAtual` com `.eq('saldo', usuarioDebitado.saldo)` |
| Sucesso | **1518–1528** | 201; corpo expõe `status: 'pending'` (inglês) enquanto o banco gravou **`pendente`** |

**Pontos de falha parcial:**

- **Insert falha, rollback falha** (**1505–1506**): log “Falha crítica no rollback”; utilizador fica com saldo já debitado e **sem** linha em `saques`.
- **Idempotência:** não há chave de idempotência no pedido; dois envios rápidos competem pelo mesmo lock de saldo (um pode receber 409), mas não há garantia de nível produto além do lock otimista.

**Histórico:** `GET /api/withdraw/history` (**1541–1583**) — lista `saques` do usuário.

---

## 4. Mapa dos riscos críticos

### Risco P1 — `pagamentos_pix` fica `approved` antes do crédito; depois `already_processed` impede crédito

| Campo | Detalhe |
|--------|---------|
| **Origem** | Separação temporal entre claim em `pagamentos_pix` e `UPDATE` em `usuarios`; sem transação ACID cruzada. |
| **Arquivo** | `server-fly.js` |
| **Função** | `creditarPixAprovadoUnicoMpPaymentId` |
| **Linhas-chave** | Claim **`approved`:** **1875–1880**; crédito saldo: **1910–1916**; atalho **`already_processed`:** **1867–1868** |
| **Condição de falha** | Interrupção do processo ou falha de rede após claim e antes do crédito; ou reversão para `pending` que não chega a executar. |
| **Impacto** | Utilizador pago no MP; localmente **aprovado**; saldo **não** aumenta; retentativas webhook/reconcile tratam como **já processado**. |

### Risco P2 — QR / sucesso ao cliente sem linha em `pagamentos_pix`

| Campo | Detalhe |
|--------|---------|
| **Origem** | Tratamento de `insertError` não aborta o fluxo de resposta. |
| **Arquivo** | `server-fly.js` |
| **Função** | Handler `POST /api/payments/pix/criar` |
| **Linhas-chave** | Insert **1682–1696**; erro **1698–1700**; resposta sucesso **1705–1717** |
| **Condição de falha** | Erro RLS, UNIQUE, rede Supabase, coluna incompatível, etc. |
| **Impacto** | Pagamento criado no MP; webhook com `data.id` **não** encontra linha → `pix_not_found`; suporte / correção manual. |

### Risco P3 — inconsistência local intencional: `approved` com `zero_credit`

| Campo | Detalhe |
|--------|---------|
| **Origem** | Ramo que aprova sem creditar quando `credit <= 0`. |
| **Arquivo** | `server-fly.js` |
| **Função** | `creditarPixAprovadoUnicoMpPaymentId` |
| **Linhas-chave** | **1889–1892** |
| **Condição de falha** | `amount`/`valor` nulos, zero ou inválidos na linha. |
| **Impacto** | Estado **approved** sem movimento de saldo; confunde auditoria e reparo automático. |

### Risco S1 — débito de saldo com falha do `insert` em `saques` e rollback frágil

| Campo | Detalhe |
|--------|---------|
| **Origem** | Ordem **débito → insert**; rollback exige saldo ainda igual ao pós-débito. |
| **Arquivo** | `server-fly.js` |
| **Função** | Handler `POST /api/withdraw/request` |
| **Linhas-chave** | Débito **1460–1466**; insert **1476–1494**; rollback **1498–1506** |
| **Condição de falha** | `saqueError` **e** `UPDATE` de rollback sem linhas afetadas (saldo já alterado por outro fluxo). |
| **Impacto** | Saldo menor **sem** registro de saque; utilizador percebe perda de saldo sem histórico coerente. |

### Risco S2 — divergência schema vs insert (ambiente dependente)

| Campo | Detalhe |
|--------|---------|
| **Origem** | Script consolidado exige colunas NOT NULL que o handler opcionalmente não preenche. |
| **Arquivo (referência schema)** | `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql` — `saques` com `valor_liquido`, `taxa` NOT NULL (**92–103**); `pagamentos_pix` base sem `payment_id`/`valor` na definição mínima (**77–89**) enquanto o código insere **`payment_id`**, **`valor`**. |
| **Função** | Inserts em `server-fly.js` **1684–1694**, **1478–1491** |
| **Condição de falha** | Produção alinhada ao SQL consolidado “estrito” sem migrações que relaxem ou preencham defaults. |
| **Impacto** | **Insert recusado** — no PIX leva ao Risco P2; no saque ao Risco S1 (débito já feito + tentativa de rollback). |

### Risco C1 — `external_id` UNIQUE e `.maybeSingle()`

| Campo | Detalhe |
|--------|---------|
| **Origem** | Busca por `external_id` / `payment_id` com `.maybeSingle()`. |
| **Arquivo** | `server-fly.js` **1851–1862** |
| **Schema de referência** | `pagamentos_pix.external_id VARCHAR(255) UNIQUE NOT NULL` (**SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql** ~**80**) |
| **Condição de falha** | Ausência de UNIQUE em produção → múltiplas linhas para o mesmo MP id → comportamento ambíguo / erro Supabase. |
| **Impacto** | Idempotência e correlação quebram; risco de duplicidade ou falhas intermitentes. |

---

## 5. Correção mínima recomendada por risco

*(Apenas estratégia; sem patch neste documento.)*

| Risco | Estratégia mínima segura (ordem de preferência conceitual) |
|--------|---------------------------------------------------------------|
| **P1** | **Transação atômica** no Postgres (função RPC `SECURITY DEFINER` ou stored procedure): estender estado só após saldo atualizado **na mesma transação**, ou usar estado intermediário (`processing_credit`) + commit único. Alternativa menor mas mais frágil: **inverter ordem** não é segura sem estado extra (crédito duplicado se dois concorrentes). **Campo intermediário / status novo** reduz janela semanticamente. **Rotina de reparo** continua necessária para linhas legadas `approved` sem crédito. |
| **P2** | **Não** devolver sucesso com QR se `insert` falhar; ou **retry** controlado do insert antes da resposta; ou criar linha **antes** da chamada MP (com status inicial e id externo reservado) — exige desenho mínimo de idempotência com MP. |
| **P3** | Tratar `credit <= 0` como **erro** ou manter `pending` com log; nunca `approved` sem crédito válido. |
| **S1** | **Transação única** débito + insert; ou **insert primeiro** com status “reservado” + débito na mesma transação; na ausência de RPC, **rollback** deve restaurar por **`id` do utilizador** com leitura atual do saldo e compensação explícita, ou usar **saldo_reservado** / ledger. Mínimo incremental: em falha de rollback, **enqueue** de job de reconciliação + alerta (não elimina sozinho o risco, reduz MTTR). |
| **S2** | Alinhar **insert** aos NOT NULL reais de produção **ou** migrar schema para refletir colunas que o código já envia (`payment_id`, `valor`, `pix_key`, etc.). |
| **C1** | Garantir **`UNIQUE (external_id)`** (e idealmente `payment_id` se usado como chave alternativa) em produção; validar com query de catálogo antes de alterar código. |

---

## 6. Arquivos que precisarão ser alterados

| Arquivo | Motivo |
|---------|--------|
| **`server-fly.js`** | Único ponto de criação PIX, webhook, reconcile, `creditarPixAprovadoUnicoMpPaymentId`, saque e rollback. |
| **SQL / migrações Supabase** (novo patch ou script na pasta de schema do projeto) | Se adotar RPC/transação, status novos, colunas de reconciliação, ou ajuste de NOT NULL / UNIQUE. |
| **`SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql`** (ou documento de migração canônico que a equipa use) | Manter referência alinhada ao que produção aplica. |

**Provável sem alteração para o núcleo financeiro:** `Dockerfile` (já aponta para `server-fly.js`). Serviços em `services/pix-*.js` **não** aparecem no fluxo do `CMD` atual — apenas relevantes se outro entrypoint for usado.

---

## 7. Riscos de regressão

| Área | Risco |
|------|--------|
| **Webhook MP** | Alterar ordem de escritas sem estado intermediário pode reintroduzir **duplo crédito** em retries concorrentes; testes de concorrência são obrigatórios. |
| **Reconcile** | Depende de `status === 'pending'`; qualquer novo estado deve ser incluído nas queries ou fica **órfão**. |
| **Frontend** | `Pagamentos.jsx` e fluxos que assumem `status === 'approved'` na resposta de criação ou na lista; estados novos exigem mapeamento de UI. Página `Withdraw.jsx` usa `paymentService` ligado a endpoints de **depósito** para histórico — risco de **confusão funcional** independente do patch financeiro (awareness para QA). |
| **Logs / monitorização** | Novos motivos (`reason`) ou códigos HTTP (ex.: falha explícita se insert PIX falhar) alteram dashboards e alertas existentes. |
| **Dados existentes** | Linhas já **`approved` sem saldo** precisam **backfill** ou script de reparo antes ou em paralelo com deploy da lógica nova. |
| **RLS Supabase** | RPC com `SECURITY DEFINER` ou políticas novas devem ser revistas contra `VALIDACAO-RLS-SUPABASE-FINAL-v1.2.0.sql`. |

---

## 8. Ordem ideal de correção

1. **Confirmar schema real em produção** (NOT NULL, UNIQUE, colunas de `saques` e `pagamentos_pix`) — sem isso, correções de código podem **falhar no insert** e amplificar S1/P2.

2. **P1 (PIX approved vs saldo)** — maior impacto direto em “dinheiro entrando e não refletindo”; após fix, tratar **legado** com query + reparo.

3. **P2 (insert PIX)** — barreira simples para não prometer QR sem linha; reduz volume de `pix_not_found`.

4. **S1 (saque débito vs registro)** — depois que inserts forem previsíveis; idealmente **transação** ou modelo reserva+confirmação.

5. **P3 e C1** — correções rápidas e validação de constraint em paralelo ao rollout.

---

## 9. Veredito de preparação

**Classificação: PRONTO PARA CORREÇÃO CIRÚRGICA**

**Justificativa:** Os bloqueios estão **localizados** em funções e intervalos de linha identificáveis em `server-fly.js`; dependências externas (webhook, reconcile) convergem num **único** helper (`creditarPixAprovadoUnicoMpPaymentId`). O saque é um **único** handler com sequência clara débito → insert → rollback.

**Ressalva obrigatória:** Antes de codar, **uma verificação no banco de produção** (UNIQUE em `external_id`, colunas obrigatórias de `saques`, presença de `payment_id`/`valor` em `pagamentos_pix`) evita patch que passe no código e **quebre em runtime**. Essa checagem não exige mais exploração de código — exige **confirmação de catálogo** no Supabase.

---

*Fim do relatório.*
