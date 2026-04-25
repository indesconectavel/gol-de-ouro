# RELATÓRIO — CIRURGIA DEPLOY RESILIENTE FLY (2026-04-25)

## Objetivo

Reduzir falhas transitórias de health-check durante rollout no Fly, sem mascarar erro real de deploy e sem alterar lógica financeira.

## Escopo aplicado

- `.github/workflows/backend-deploy.yml`
- este relatório

Nenhum outro arquivo de negócio foi alterado.

## Contexto da falha observada

No rollout anterior, o job de deploy falhou por timeout de health-check na máquina `app`:

- `timeout reached waiting for health checks to pass`
- `failed to get VM ... net/http: request canceled`

## Mudança realizada no workflow

### Antes

- Health check com `continue-on-error: true`
- 6 tentativas fixas com `sleep 10`
- Mesmo com falha de health, job podia seguir sem bloquear claramente.

### Depois

- Removido `continue-on-error` do health-check (erro não é mascarado)
- `5` tentativas com backoff progressivo:
  - 5s, 10s, 20s, 30s, 45s
- Em falha final:
  - `exit 1` explícito no job
  - instrução clara de rollback manual por imagem estável (`flyctl releases --image` + `flyctl deploy --image`)

## Garantias de segurança operacional

- Deploy principal continua oficial via `flyctl deploy`
- Sem `continue-on-error` no deploy principal
- `flyctl logs --no-tail` mantido para coleta de evidência
- Nenhuma alteração em:
  - lógica financeira
  - PIX
  - saque
  - worker
  - banco

## Risco financeiro

Baixo: mudança exclusiva em pipeline de entrega, sem alteração de regra de negócio, saldo, payout ou fluxo de cobrança.

## Resultado esperado

Menos falso-negativo por indisponibilidade transitória de health-check no Fly durante rollout, mantendo falha explícita quando o serviço realmente não estabiliza.
