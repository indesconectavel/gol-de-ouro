# CIRURGIA — BLOCO A — FASE 1 — BLINDAGEM FINANCEIRA

**Data:** 2026-04-09  
**Escopo:** Crédito PIX no handler `POST /api/payments/webhook` em `server-fly.js` (tratamento numérico alinhado a `reconcilePendingPayments`).

---

## 1. Resumo executivo

Foi aplicada correção **mínima** no cálculo de `credit` e `novoSaldo` após o claim bem-sucedido no webhook de depósito: uso explícito de `Number()` para o valor creditado e para o saldo atual, no mesmo padrão já utilizado em `reconcilePendingPayments` (aprox. linhas 2454–2462 do mesmo arquivo). Nenhum contrato HTTP, payload ou rota adicional foi alterado. Não houve migração de banco nem mudança em saque, jogo, ranking ou reconciliação (exceto consistência conceitual do padrão numérico).

---

## 2. Arquivo alterado

| Arquivo | Observação |
|---------|------------|
| `server-fly.js` | Somente o bloco de crédito de saldo dentro de `POST /api/payments/webhook`. |

---

## 3. Correção aplicada

**Antes:**

- `credit` derivado de `pixRecord.amount ?? pixRecord.valor ?? 0` sem conversão numérica explícita.
- `novoSaldo = user.saldo + credit`, com risco de concatenação de strings se `saldo` ou parte do fluxo viessem como string.

**Depois:**

- `credit = Number(pixRecord.amount ?? pixRecord.valor ?? 0)` — alinhado a `const credit = Number(pixRecord.amount ?? pixRecord.valor ?? 0)` na reconciliação.
- `novoSaldo = Number(user.saldo || 0) + credit` — alinhado a `Number(userRow.saldo || 0) + credit` na reconciliação.

O fluxo de claim atômico, consulta ao MP, resposta HTTP imediata e `update` em `usuarios` permanecem inalterados.

---

## 4. Impacto da mudança

| Critério | Status |
|----------|--------|
| Contrato da rota (request/response) | **Inalterado** — apenas cálculo interno antes do `update`. |
| Migração de banco | **Não** |
| Expansão de escopo (ledger, outros blocos) | **Não** |
| Outros arquivos | **Nenhum** |

---

## 5. Testes executados

| Teste | Resultado |
|-------|-----------|
| `node --check server-fly.js` | **OK** — sintaxe válida. |
| `npm test` (script `test-supabase.js`) | **Não executado com sucesso** — falha por ausência de `SUPABASE_URL` / ambiente no ambiente local da execução. |
| Testes automatizados de webhook / integração | **Não executados** — dependem de servidor, credenciais e/ou Supabase. |

**Validação objetiva:** revisão do diff confirma que apenas duas expressões no bloco autorizado foram alteradas; comportamento esperado: soma numérica estável para crédito PIX no webhook principal.

---

## 6. Riscos eliminados

- Concatenação acidental de strings no cálculo de `novoSaldo` no webhook principal (ex.: `saldo` como string vinda do driver/API).
- Inconsistência de tratamento numérico entre o webhook principal e a função `reconcilePendingPayments` para o mesmo tipo de operação (crédito após claim).

---

## 7. Riscos remanescentes

- Valor creditado continua vindo de `pixRecord` (banco local), não revalidado contra `payment.data` do Mercado Pago no mesmo bloco (fora do escopo desta fase).
- Ambiente de produção não foi exercitado nesta validação; recomenda-se smoke pós-deploy se aplicável.
- Race ou concorrência em múltiplas instâncias não foi endereçada (fora do escopo).

---

## 8. Diagnóstico final da fase

**Classificação: APROVADA**

A intervenção cumpre o escopo aprovado (mínima, isolada, reversível via `git`), alinha o padrão numérico ao da reconciliação e não introduz dependências novas. Ressalva: testes automatizados completos e `npm test` não puderam ser validados neste ambiente por falta de credenciais.
