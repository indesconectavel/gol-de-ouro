# ROLLBACK — PATCH RECONCILIAÇÃO FINANCEIRA V1

**Data:** 2026-03-07  
**Arquivo:** server-fly.js  

---

## Quando usar

Use este rollback se, após aplicar o patch cirúrgico de reconciliação financeira, for necessário reverter:

- A escrita de ledger para depósito aprovado e para chutes (miss/goal).
- A atualização de total_apostas e total_ganhos no handler do chute.
- O retorno do id no insert de chutes.

O saldo continuará sendo creditado/debitado como hoje; apenas a trilha em `ledger_financeiro` e os totalizadores no Node serão revertidos ao comportamento anterior.

---

## Alterações a reverter

### 1. Webhook PIX (após creditar saldo)

**Remover** o bloco que chama `createLedgerEntry` com tipo `deposito_aprovado` (e o `if (!ledgerDep?.success)` com console.warn).

Deixar apenas:
```javascript
          console.log('💰 [WEBHOOK] Claim ganhou: pagamento aprovado e saldo creditado:', data.id);
```

### 2. reconcilePendingPayments (após creditar saldo)

**Remover** o bloco que chama `createLedgerEntry` com tipo `deposito_aprovado` (e o console.warn). Deixar apenas o `console.log` de sucesso do claim.

### 3. POST /api/games/shoot

**3.1 Select do usuário**  
Reverter de:
```javascript
.select('saldo, total_apostas, total_ganhos')
```
para:
```javascript
.select('saldo')
```

**3.2 Insert em chutes**  
Reverter de:
```javascript
const { data: chuteRow, error: chuteError } = await supabase
  .from('chutes')
  .insert({ ... })
  .select('id')
  .single();
if (chuteError) { ... }
const chuteId = chuteRow?.id;
```
para:
```javascript
const { error: chuteError } = await supabase
  .from('chutes')
  .insert({ ... });
if (chuteError) { ... }
```
(sem `.select('id').single()` e sem variável `chuteId`).

**3.3 Ajuste de saldo (bloco inteiro)**  
Reverter para a versão anterior ao patch de reconciliação:

- **GOAL:** um único UPDATE em `usuarios` com `saldo: novoSaldoVencedor` (sem total_apostas, total_ganhos) e sem chamadas a `createLedgerEntry`.
- **MISS:** UPDATE com `saldo` e `updated_at` (sem total_apostas), lock otimista mantido; sem chamada a `createLedgerEntry`.

Ou seja, remover:
- Uso de `totalApostasNovo` e `totalGanhosNovo`.
- Inclusão de `total_apostas` e `total_ganhos` nos updates.
- Todas as chamadas a `createLedgerEntry` para `chute_aposta`, `chute_premio` e `chute_miss` dentro do shoot.

**Texto do comentário a restaurar (ajuste de saldo):**
```javascript
    // Ajuste de saldo:
    // - GOAL: saldo = saldo_anterior - aposta + premio + premioGolDeOuro (único update no Node).
    // - MISS: em produção não existe trigger que debite em chutes; o débito é feito explicitamente no Node (patch Bloco D).
```

E o bloco GOAL deve voltar a:
```javascript
    if (isGoal) {
      const novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro;
      const { error: saldoWinnerError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoVencedor })
        .eq('id', req.user.userId);
      ...
    } else {
      // MISS: débito com lock otimista ...
      const novoSaldoPerdedor = user.saldo - amount;
      const { data: saldoPerdedorUpdated, error: saldoMissError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoPerdedor, updated_at: new Date().toISOString() })
        .eq('id', req.user.userId)
        .eq('saldo', user.saldo)
        .select('saldo')
        .single();
      ...
    }
```
(sem total_apostas/total_ganhos e sem createLedgerEntry).

---

## Aplicação manual do rollback

1. Abrir `server-fly.js`.
2. Webhook PIX: localizar o trecho após "Claim ganhou" e remover a chamada a `createLedgerEntry` (deposito_aprovado) e o console.warn associado.
3. reconcilePendingPayments: localizar o trecho após creditar saldo e remover a chamada a `createLedgerEntry` e o console.warn.
4. Handler `/api/games/shoot`: restaurar select do user (apenas `saldo`), insert em chutes (sem `.select('id').single()` e sem `chuteId`), e o bloco de ajuste de saldo sem totalizadores e sem ledger (conforme trechos acima).
5. Salvar e fazer deploy/reinício conforme processo do projeto.

Após o rollback, depósitos e chutes voltam a **não** gerar ledger; total_apostas e total_ganhos deixam de ser atualizados no Node no fluxo do chute.

---

## Dados já gravados

As linhas já inseridas em `ledger_financeiro` com tipos `deposito_aprovado`, `chute_miss`, `chute_aposta` e `chute_premio` **não** são apagadas pelo rollback. O rollback apenas deixa de criar novas linhas. Se for necessário limpar dados de teste, fazer com script ou SQL separado, com cuidado.
