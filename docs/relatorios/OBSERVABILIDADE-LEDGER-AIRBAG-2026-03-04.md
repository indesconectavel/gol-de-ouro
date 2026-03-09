# Observabilidade — Log do airbag ledger (details/hint)

**Data:** 2026-03-04  
**Objetivo:** Melhoria mínima de observabilidade no log do airbag em insertLedgerRow, para capturar causa exata do falha de INSERT em ledger_financeiro quando o 500 ainda ocorrer (sem alterar schema nem /game).

---

## Alteração realizada

**Arquivo:** src/domain/payout/processPendingWithdrawals.js  
**Função:** insertLedgerRow (linhas 11–45).

- **Antes:** o log do airbag incluía apenas step, code e message (message truncado a 80 caracteres).
- **Depois:** passou a incluir também details e hint do objeto de erro do Supabase/Postgrest, truncados a 120 caracteres cada, via helper safeErr(e) que retorna code, message, details, hint sem expor o objeto completo.

**Segurança:** Não se loga JWT, chave PIX completa nem email completo. Os campos details e hint do Postgrest costumam conter apenas nomes de coluna, constraints ou mensagens genéricas do PostgreSQL; o truncamento (80/120 chars) reduz risco de vazamento. Nenhum dado sensível do payload do saque é escrito no log.

**Resumo do trecho:** safeErr(e) retorna { code, message (slice 80), details (slice 120), hint (slice 120) }. Os dois console.warn do airbag passam a usar ...safeErr(res1.error) e ...safeErr(res2.error).

---

## Deploy

- **Escopo:** apenas backend (goldeouro-backend-v2). Nenhuma alteração em player, Vercel, workflows ou schema.
- **Rastreabilidade:** 1 commit (ex.: fix(ledger): log details/hint no airbag para diagnóstico), deploy via pipeline (push em main) ou release manual no Fly.

Com isso, em caso de novo 500 "Erro ao registrar saque", os logs do app no Fly passarão a exibir details e hint (quando existirem) na linha [LEDGER] insert falhou (airbag), permitindo identificar a causa sem expor dados sensíveis.
