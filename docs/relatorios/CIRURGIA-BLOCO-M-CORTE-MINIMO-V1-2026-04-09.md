# Cirurgia — BLOCO M, corte mínimo V1 (debug token)

**Data:** 2026-04-09  
**Objetivo:** remover a exposição útil de `GET /api/debug/token` em produção, sem tocar em financeiro, webhooks, métricas ou JWT.

---

## 1. Arquivo alterado

- `server-fly.js`

---

## 2. Trecho modificado

- Rota `GET /api/debug/token`: no início do handler, se `isProduction()` (de `config/required-env`, equivalente a `NODE_ENV === 'production'`), resposta **`404`** com `{ success: false, message: 'Not found' }` e **sem** executar lógica de debug nem `jwt.verify`.
- Fora de produção, o comportamento anterior mantém-se (logs e corpo com `debug`).

---

## 3. Impacto

| Área | Impacto |
|------|---------|
| Produção (`NODE_ENV=production`) | O endpoint deixa de expor decodificação de JWT e reflexo de headers; cliente recebe 404 genérico. |
| Desenvolvimento / local | Inalterado quando `NODE_ENV` não é `production`. |
| Webhook PIX, payout, métricas, jogo, saques | Não alterados. |
| JWT | Apenas deixa de ser usado nesta rota em produção; assinatura e payload globais inalterados. |
| Frontend | Nenhuma alteração; o player não consome esta rota no fluxo normal. |

---

## 4. Testes executados

1. `node --check server-fly.js` — **OK** (exit 0).
2. Revisão de diff — apenas o bloco da rota `/api/debug/token` e comentário.

---

## 5. Classificação final

**Corte mínimo V1 concluído** — redução de superfície de informação em produção, rollback simples (reverter o bloco `if (isProduction())`).

---

## 6. Nota operacional

Garantir que o deploy de produção define **`NODE_ENV=production`** (padrão usual no Fly/Node); caso contrário, o endpoint continuaria ativo.

---

*Relatório gerado na sequência da cirurgia autorizada.*
