# ROLLBACK — PATCH BLOCO D (Débito de chute perdido no Node)

**Data:** 2026-03-07  
**Arquivo:** server-fly.js  

---

## Quando usar

Use este rollback se, após aplicar o patch cirúrgico do Bloco D, for necessário reverter o débito de MISS no Node (por exemplo: trigger passou a existir em produção e há risco de dupla escrita, ou validação identificou efeito colateral).

---

## Alteração a reverter

No handler de `POST /api/games/shoot`, remover o bloco `else` (MISS) que faz:
- cálculo de `novoSaldoPerdedor`
- UPDATE em `usuarios` com lock otimista
- retorno 409 em caso de conflito
- atribuição de `shootResult.novoSaldo`

E restaurar o comentário original do “Ajuste de saldo” (referência ao gatilho do banco para perdas).

---

## Código a remover (bloco else)

Remover desde o `} else {` até o `}` que fecha o else (incluindo o comentário “MISS: débito com lock otimista...” e todo o conteúdo do else).

---

## Código a restaurar no comentário

Substituir o comentário atual do “Ajuste de saldo” por:

```javascript
    // Ajuste de saldo:
    // - Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente
    // - Vitórias: gatilho do banco credita apenas o prêmio (premio + premioGolDeOuro)
    //   Para manter a economia esperada (todos pagam a aposta), subtrair manualmente
    //   o valor da aposta apenas quando houver gol (evita dupla cobrança nas derrotas).
```

Manter o bloco `if (isGoal) { ... }` exatamente como está (sem o `else`).

---

## Aplicação manual do rollback

1. Abrir `server-fly.js`.
2. Localizar o trecho que começa com `// Ajuste de saldo:` e o `if (isGoal)` no handler de `/api/games/shoot`.
3. Remover todo o bloco `else { ... }` (MISS) adicionado pelo patch.
4. Restaurar o comentário de “Ajuste de saldo” com as quatro linhas acima.
5. Salvar e fazer deploy/reinício conforme processo do projeto.

Após o rollback, chutes perdidos voltam a **não** debitar saldo no Node (comportamento anterior ao patch).
