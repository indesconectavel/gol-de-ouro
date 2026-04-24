# CIRURGIA — BLOCO V1–V (CORRECAO WORKFLOW LOGS)

**Data:** 2026-04-24  
**Modo:** correcao cirurgica de escopo minimo, sem deploy, sem alteracao de backend/financeiro.

## Objetivo

Remover falha operacional do workflow de deploy causada por comando de logs incompativel com a versao atual do `flyctl`.

## Escopo aplicado

**Arquivo alterado:** `.github/workflows/backend-deploy.yml`

**Troca realizada (linha unica):**

- Antes: `flyctl logs --app ${{ env.FLY_APP_NAME }} --lines 50`
- Depois: `flyctl logs --app ${{ env.FLY_APP_NAME }} --no-tail`

## Evidencia tecnica

- O run de deploy `24892635217` falhou no passo "Logs do deploy" com erro `unknown flag: --lines`.
- O comando `--no-tail` e suportado na versao atual do `flyctl` e mantem o objetivo de coletar snapshot de logs sem stream infinito.

## Nao alterado (garantia de escopo)

- Nenhum arquivo de backend de negocio.
- Nenhum arquivo de PIX/webhook/saldo/shoot/saque/banco.
- Nenhuma mudanca em SQL, controllers, services ou runtime financeiro.

## Risco

- **Risco financeiro:** BAIXO.
- **Risco operacional:** reduzido no pipeline (evita falha falsa pos-deploy por comando invalido).

## Status

- **PRONTO PARA COMMIT** (escopo minimo preservado).
