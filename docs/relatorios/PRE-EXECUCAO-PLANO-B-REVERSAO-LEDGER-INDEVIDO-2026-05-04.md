# Pré-execução — Plano B: reversão auditável de ledger indevido (`payout_manual_confirmado`)

**Data:** 2026-05-04  
**Saque:** `371ed41a-5053-411f-b7cc-414a2ee798ec`  
**Ledger indevido:** `f63765b0-3998-4549-87e4-9c3e42d80cba`  
**Fato operacional declarado:** **PIX não foi pago** (tesouraria/ops — não verificado por automação bancária neste documento).

**Regras desta fase:** nenhum `UPDATE` / `INSERT` / `DELETE` executado na elaboração; **não apagar** linha do ledger; sem deploy.

---

## 1. Confirmações read-only (snapshot REST — `2026-05-04T16:47:14.436Z` UTC)

| Verificação | Resultado |
|-------------|-----------|
| (1) Saque ainda **`pendente`** | **Sim** |
| (2) Ledger **`payout_manual_confirmado`** presente (`id` acima) | **Sim** |
| (3) **PIX = NÃO** (premissa operacional deste Plano B) | **Sim** *(aceite como premissa de negócio para este plano)* |
| `processed_at` | **`null`** |
| `ledger.valor` | **8** (= `net_amount` do saque) |
| `referencia` | **= `saques.id`** |
| `correlation_id` | **Alinhado** entre saque e ledger |

*(Dados sensíveis de chave PIX omitidos do relatório.)*

---

## 2. Princípio de auditoria

- **Não apagar** `ledger_financeiro` — trilho imutável.
- **Correção** = **novos** eventos no ledger (e eventual ajuste de `saques` / `usuarios.saldo`) **documentados**, com **motivo** rastreável.
- **Motivo sugerido (texto fixo para relatórios / `motivo_rejeicao` futuro):**  
  `confirmacao_manual_registrada_sem_pagamento_real_pix_plano_b_2026-05-04`

---

## 3. Bloqueio crítico do backend atual (cancel admin)

Enquanto existir linha em `ledger_financeiro` com:

- `tipo IN ('payout_confirmado','payout_manual_confirmado')`
- `referencia = String(saqueId)`
- mesmo `correlation_id`

o fluxo **`cancelWithdrawManualAdmin`** devolve **`ALREADY_PAID`** e **não** chama `rollbackWithdrawManualAdmin`:

```1009:1028:src/domain/payout/processPendingWithdrawals.js
  const { data: payoutLine } = await supabase
    .from('ledger_financeiro')
    .select('id')
    .eq('correlation_id', correlationId)
    .in('tipo', ['payout_confirmado', 'payout_manual_confirmado'])
    .eq('referencia', String(saqueId))
    .limit(1)
    .maybeSingle();

  if (payoutLine?.id) {
    logManualWithdraw('cancel_blocked_paid_ledger', {
      withdrawal_id: saqueRow.id,
      user_id: saqueRow.usuario_id,
      correlation_id: correlationId,
      status_previous: saqueRow.status,
      code: 'ALREADY_PAID',
      operation: 'cancel'
    });
    return { success: false, error: new Error('saque_ja_foi_pago'), code: 'ALREADY_PAID' };
  }
```

**Consequência:** **não** contar com o botão/API de cancel manual **neste estado**, até existir **estratégia** que remova ou neutralize logicamente o bloqueio (ver §6).

---

## 4. Tipos de ledger permitidos (CHECK — repositório)

Para qualquer **INSERT** futuro, o `tipo` deve permanecer dentro do `CHECK` vigente (exemplo da migração manual withdraw):

```7:21:database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql
ALTER TABLE public.ledger_financeiro
  ADD CONSTRAINT ledger_financeiro_tipo_check CHECK (
    tipo = ANY (
      ARRAY[
        'deposito'::text,
        'saque'::text,
        'taxa'::text,
        'rollback'::text,
        'payout_confirmado'::text,
        'falha_payout'::text,
        'payout_manual_confirmado'::text,
        'rollback_manual'::text
      ]
    )
  );
```

**Não há** hoje tipo dedicado “`estorno_payout_manual_indevido`” — compensações auditáveis devem usar **tipos já previstos** (p.ex. **`rollback_manual`**) ou exigir **nova migração** antes de INSERT.

---

## 5. Proposta de reversão auditável (alto nível — **não executar**)

### 5.1 Linha compensatória no ledger (sem apagar a indevida)

**Conceito:** inserir **`rollback_manual`** com:

- **`correlation_id`:** igual ao do saque (`30a9d56d-9689-458c-9dc7-531169bca521`).
- **`usuario_id` / `user_id`:** conforme coluna canónica do ambiente (hoje o ledger indevido usa `user_id`; alinhar ao padrão de `createLedgerEntry`).
- **`valor`:** **8** (espelha o valor líquido do lançamento indevido — ajustar só após trilha contábil interna).
- **`referencia`:** **obrigatoriamente distinta** da linha `payout_manual_confirmado` (índice único `(correlation_id, tipo, referencia)`). Sugestão canónica:  
  `371ed41a-5053-411f-b7cc-414a2ee798ec:estorno_payout_indevido_f63765b0`

**Semântica contábil:** o texto do motivo (§2) deve explicar que o **`payout_manual_confirmado`** foi **erro operacional** e que esta linha **compensa** no livro analítico, **sem** apagar a linha original.

### 5.2 `usuarios.saldo` (obrigatório validar antes de qualquer DML)

- Confirmar **read-only** se o lançamento indevido alterou saldo na prática (comparar extrato interno de movimentos / somatórios ledger por usuário).
- **Se** o saldo **não** foi debitado indevidamente pelo payout fantasma, o estorno pode ser **apenas ledger**.
- **Se** houve efeito em saldo, o ajuste deve seguir **política financeira** (pode coincidir com a lógica de crédito já usada em `rollbackWithdrawManualAdmin`, mas **esse fluxo não corre** enquanto §3 bloquear).

### 5.3 Estado final desejado em `saques` (contrato CHECK em produção)

Escolher **uma** linha de negócio (validar literal no `saques_status_check` **antes** do UPDATE):

| Opção | Quando usar |
|-------|-------------|
| **`cancelado_manual`** | Saque **não** será pago; reembolso ao saldo já previsto no cancelamento administrativo (após desbloquear §6). |
| **`rejeitado` / `falhou`** | Se a política interna classifica como falha operacional sem reprocessar (confirmar se literal existe no CHECK de produção). |
| **Manter `pendente`** | Só faz sentido se ainda se pretende **tentar pagamento real** depois — **mas** o cancel/approve atuais podem continuar conflituosos com a linha `payout_manual_confirmado` existente (**approve** devolve `INVARIANT_BROKEN`). **Não recomendado** como estado estável sem mitigação §6. |

**Recomendação técnica preliminar:** tende a **`cancelado_manual`** com motivo §2, **após** estorno ledger + política de saldo fechadas — **desde que** o caminho de cancelamento deixe de ser bloqueado (§6).

---

## 6. Desbloqueio controlado (pré-requisito de engenharia — fora do escopo de execução aqui)

Sem uma destas medidas, **cancel manual via API** permanece **inviável**:

1. **Cirurgia de produto (preferível):** alterar `cancelWithdrawManualAdmin` para permitir cancel quando existir **par documentado** (ex.: `rollback_manual` com `referencia` prefixada `:estorno_payout_indevido_*` **e** valor compatível) **ou** quando existir flag interna de “payout manual invalidado” — desenho a aprovar em PR separada.
2. **Procedimento DBA único (alto risco):** transação manual supervisionada que respeite imutabilidade — **não** apagar; possivelmente **INSERT** compensatório + **UPDATE** controlado de `tipo` da linha indevida **só** se política de imutabilidade do ledger permitir (muitas casas **proíbem** UPDATE em ledger).
3. **Novo `tipo` + migração** (ex.: `payout_manual_anulado`) + INSERT de compensação — maior lead time, máxima clareza semântica.

**Nenhuma** destas opções é executada neste documento.

---

## 7. Ordem sugerida de execução futura (checklist — **não rodar ainda**)

1. **SELECT** saldo e somatório ledger do usuário (read-only) — evidência pré-DML.  
2. **SELECT** `pg_get_constraintdef` de `saques` e `ledger_financeiro` — confirmar literais de `status` e `tipo`.  
3. **Decisão escrita** tesouraria: PIX não pago (este plano).  
4. **INSERT** compensatório `rollback_manual` (§5.1) — janela controlada + log.  
5. **Ajuste `usuarios.saldo`** se e somente se §5.2 exigir.  
6. **UPDATE `saques`** para estado terminal escolhido (§5.3) + `motivo_rejeicao` / `processed_at` conforme contrato.  
7. **Re-teste** read-only: invariantes (`pendente`+`payout` sem estorno), approve/cancel, painel admin.

---

## 8. SQL futuro — **somente rascunho (não executar)**

### 8.1 Read-only (sempre seguro antes do DML)

```sql
select id, status, net_amount, amount, fee, correlation_id, processed_at, motivo_rejeicao
from public.saques
where id = '371ed41a-5053-411f-b7cc-414a2ee798ec';

select id, tipo, valor, referencia, correlation_id, user_id, usuario_id, created_at
from public.ledger_financeiro
where id = 'f63765b0-3998-4549-87e4-9c3e42d80cba'
   or (correlation_id = '30a9d56d-9689-458c-9dc7-531169bca521' and referencia like '371ed41a-5053-411f-b7cc-414a2ee798ec%')
order by created_at;
```

### 8.2 INSERT compensatório (modelo — **ajustar colunas ao schema real**)

```sql
-- RASCUNHO — validar nomes user_id vs usuario_id e CHECK antes de executar.
-- INSERT INTO public.ledger_financeiro (...)
-- VALUES (..., 'rollback_manual', 8, '371ed41a-5053-411f-b7cc-414a2ee798ec:estorno_payout_indevido_f63765b0', '30a9d56d-9689-458c-9dc7-531169bca521', ...);
```

### 8.3 UPDATE `saques` (modelo — **só após** §5.2 + desbloqueio §6)

```sql
-- RASCUNHO — substituir status alvo conforme CHECK de produção e política interna.
-- UPDATE public.saques SET status = 'cancelado_manual', motivo_rejeicao = '...', ...
-- WHERE id = '371ed41a-5053-411f-b7cc-414a2ee798ec' AND status IN ('pendente','pending');
```

---

## 9. Riscos remanescentes

| Risco | Mitigação |
|-------|-----------|
| Cancel API bloqueado (§3) | PR ou procedimento DBA §6 antes de depender do cancel. |
| Índice único `(correlation_id,tipo,referencia)` | `referencia` do estorno **deve** ser nova string. |
| Saldo duplo / incorreto | Read-only §8.1 + reconciliação com financeiro antes do DML. |
| Imutabilidade do ledger vs UPDATE em linha antiga | Preferir **INSERT** compensatório; evitar UPDATE na linha indevida salvo política explícita. |

---

## Referências

- `docs/relatorios/TRIAGEM-INCONSISTENCIA-HISTORICA-SAQUE-MANUAL-2026-05-04.md`
- `docs/relatorios/DECISAO-CONTROLADA-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `docs/relatorios/GATE-FINAL-READONLY-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `src/domain/payout/processPendingWithdrawals.js` — `cancelWithdrawManualAdmin`, `rollbackWithdrawManualAdmin`, `createLedgerEntry`
