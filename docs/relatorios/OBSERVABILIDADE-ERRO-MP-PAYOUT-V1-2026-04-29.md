# OBSERVABILIDADE ERRO MP PAYOUT V1 - 2026-04-29

## Objetivo
Adicionar observabilidade segura para capturar o erro bruto sanitizado retornado pelo Mercado Pago no fluxo de payout Pix, sem alterar regra financeira.

## Escopo aplicado
- `services/pix-mercado-pago.js`

## O que foi adicionado
No `catch` de `createPixWithdraw`, foi incluído log estruturado:
- `http_status`
- `code`
- `message`
- `cause` (sanitizado)
- `response_data` (sanitizado)
- `payout_external_reference`
- `saqueId`
- `correlation_id`

Também foram adicionados helpers locais para sanitização:
- remoção/redação de chaves sensíveis (`authorization`, `token`, `signature`, etc.)
- mascaramento de CPF/CNPJ/documento mantendo apenas os últimos 4 dígitos

## Exemplo de log esperado
```text
❌ [PIX][MP][PAYOUT][ERRO_BRUTO_SANITIZADO] {
  http_status: 400,
  code: "bad_request",
  message: "invalid identification",
  cause: [{ code: 1234, description: "owner.identification.number inválido: ***3663" }],
  response_data: { message: "invalid identification", cause: [...] },
  payout_external_reference: "wd_abcd1234",
  saqueId: "c16ced3d-1b83-4cc3-87b4-5af4741a89e7",
  correlation_id: "withdraw-real-v1-aca7aa98ab9f4c119a008885871559b8"
}
```

## Confirmação de não impacto financeiro
Nenhuma alteração foi feita em:
- payload enviado ao Mercado Pago
- decisão de sucesso/falha
- rollback
- ledger
- saldo
- regras de saque/deposito

Mudança restrita à observabilidade de erro no log.

## Validação técnica
- `node --check services/pix-mercado-pago.js`

## Risco final
Baixo. Alteração apenas de logging/sanitização no caminho de erro.
