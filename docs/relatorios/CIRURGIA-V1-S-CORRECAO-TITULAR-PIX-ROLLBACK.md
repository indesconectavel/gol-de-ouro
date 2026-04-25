# BLOCO V1-S — Correção titular Pix + rollback de saque (código)

**Data:** 2026-04-25  
**Modo:** cirurgia controlada no repositório (sem deploy automático, sem ativar worker, sem saque de teste no escopo do doc).

## 1) Problema

1. `buildOwnerIdentification` fazia `usuarios.cpf` fixo, mas em produção a coluna pode não existir, gerando falha de API PostgREST antes de qualquer chamada ao Mercado Pago.
2. Falha de titular ocorria **após** o lock `processando` e `ensurePayoutExternalReference`, com `rollbackWithdraw` que atualizava `status` sem checar retorno, permitindo saque “preso” em `processando` após rollback financeiro.

## 2) Correções

### Titular (ante do MP, sem coluna `cpf` suposta)

- CPF/CNPJ como chave: validação por tamanho (11/14) e derivação do titular a partir da própria chave.
- Chave email / telefone / aleatória: leitura do documento via **tentativa de colunas** (primeira existente e não nula), na ordem: `PAYOUT_USUARIOS_CPF_COLUMN` (opcional) + `PAYOUT_USUARIOS_CPF_CANDIDATES` (padrão: `cpf`, `documento`, `cpf_cnpj`, `documento_fiscal`, `nu_cpf`, `cnpj`). Coluna inexistente = tenta a próxima, sem exigir `cpf` em todo ambiente.
- Se não houver documento confiável: retorno explícito **antes** do lock, sem chamar MP e com saque em `pendente` (sem reverter saldo de brinde).

### Ordem do worker

- Validação de titular e **em seguida** lock + `payout_external_reference` + `createPixWithdraw`.

### Rollback

- Tenta, em ordem, `SAQUE_ROLLBACK_STATUS_LIST` padrão `cancelado,falhou` (override por env) até o banco aceitar o `UPDATE`.
- Exige resposta de `createLedgerEntry` (valor e taxa) antes de considerar a parte de ledger concluída.
- Revalida `saques.status` após o update: se ainda for `processando`, retorno `success: false` (rollback não concluído de ponta a ponta).

## 3) Risco financeiro

- **Médio** se um rollback deixar saldo corrigido porém status errado: mitigado com verificação pós-`UPDATE` e logs críticos. Operação ainda depende de `CHECK` real de `saques.status` no Supabase; use `SAQUE_ROLLBACK_STATUS_LIST` se `cancelado` não for permitido.

## 4) Próximos passos (operacionais, fora do código)

- Saque de teste que ficou `processando` com ledger de rollback: avaliar ajuste manual alinhado ao CHECK (fora do escopo desta cirurgia se política for “não tocar banco”).

## 5) Arquivos alterados

- `src/domain/payout/processPendingWithdrawals.js`
- `docs/relatorios/CIRURGIA-V1-S-CORRECAO-TITULAR-PIX-ROLLBACK.md` (este arquivo)
