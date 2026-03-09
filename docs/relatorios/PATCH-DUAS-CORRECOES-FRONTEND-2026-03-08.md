# PATCH CIRÚRGICO — DUAS CORREÇÕES FRONTEND

**Data:** 2026-03-08  
**Escopo:** goldeouro-player (frontend apenas).  
**Referência:** [AUDITORIA-DUAS-CORRECOES-FRONTEND-2026-03-08.md](AUDITORIA-DUAS-CORRECOES-FRONTEND-2026-03-08.md)

---

## 1. Estratégia aplicada

- Aplicar **apenas** as duas alterações mínimas já auditadas, sem refatoração nem mudança de comportamento além do corrigido.
- **Correção 1 (Dashboard):** Alinhar o consumo da resposta de GET `/api/payments/pix/usuario` ao contrato do backend — propriedade `payments` em vez de `historico_pagamentos`.
- **Correção 2 (AuthContext):** Alinhar o estado `user` após validação de sessão (GET profile) ao formato retornado pelo backend — usar `response.data.data` (objeto de perfil) em vez de `response.data` (envelope { success, data }).

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/Dashboard.jsx` | Linha 55: `historico_pagamentos` → `payments`. |
| `goldeouro-player/src/contexts/AuthContext.jsx` | Linha 36: `setUser(response.data)` → `setUser(response.data.data)`. |

Nenhum outro arquivo foi modificado. Backend, banco, payloads, saldo, PIX, saque e lógica do jogo permanecem inalterados.

---

## 3. Diff aplicado

### Dashboard.jsx

```diff
- setRecentBets(pixResponse.data.data.historico_pagamentos || [])
+ setRecentBets(pixResponse.data.data.payments || [])
```

### AuthContext.jsx

```diff
  apiClient.get(API_ENDPOINTS.PROFILE)
    .then(response => {
-     setUser(response.data)
+     setUser(response.data.data)
    })
```

---

## 4. Impacto esperado

- **Dashboard:** O bloco "Apostas Recentes" passa a ser preenchido com a lista retornada por GET `/api/payments/pix/usuario` (campo `data.payments`). Antes a lista ficava sempre vazia.
- **AuthContext:** Após refresh (ou reabrir aba) com token válido, o estado `user` passa a ser o objeto de perfil `{ id, email, username, nome, saldo, ... }`, alinhado ao login/register e a qualquer uso futuro de `user.id` / `user.email` no contexto.
- **Regressão:** Nenhuma alteração em rotas, autenticação, saldo, PIX, saque ou jogo. Apenas correção de leitura de resposta e formato de estado.

---

## 5. Rollback

Para reverter este patch, aplicar as alterações descritas em [ROLLBACK-DUAS-CORRECOES-FRONTEND-2026-03-08.md](ROLLBACK-DUAS-CORRECOES-FRONTEND-2026-03-08.md).

---

## 6. Validação recomendada

1. **Dashboard:** Com usuário logado e ao menos um pagamento PIX no histórico, abrir o Dashboard e confirmar que "Apostas Recentes" exibe itens (ou "Nenhuma transação encontrada" quando não houver pagamentos).
2. **AuthContext:** Fazer login, recarregar a página (F5) e confirmar que o nome/e-mail do usuário continuam visíveis no header/Dashboard (dados vindos do contexto).
3. Fluxo completo: login → depósito → jogo → saque → logout, sem erros de console relacionados a `historico_pagamentos` ou formato de `user`.

---

**Patch aplicado em 2026-03-08. Nenhuma alteração em backend ou banco.**
