# DIAGNÓSTICO TÉCNICO — HISTORICO_PAGAMENTOS

**Data:** 2026-03-08  
**Modo:** READ-ONLY — nenhuma alteração de código.  
**Base:** Relatório AUDITORIA-HISTORICO-PAGAMENTOS-2026-03-08.md.

---

## 1. Problema identificado

O bloco **“Apostas Recentes”** do Dashboard permanece sempre vazio porque:

- O **backend** (GET `/api/payments/pix/usuario`) retorna a lista de pagamentos em **`data.payments`**.
- O **Dashboard.jsx** lê **`pixResponse.data.data.historico_pagamentos`**, propriedade que **não existe** na resposta.
- O fallback `|| []` faz com que `recentBets` seja sempre `[]`, independentemente de haver ou não pagamentos PIX.

Ou seja: **inconsistência de nome de propriedade** — um único consumidor (Dashboard) espera `historico_pagamentos` enquanto o contrato da API é `payments`. Pagamentos.jsx já consome `payments` corretamente.

---

## 2. Camada afetada

**Frontend (goldeouro-player).**

- **Arquivo:** `src/pages/Dashboard.jsx`
- **Trecho:** na função `loadUserData`, dentro do `try` que chama GET PIX_USER, a linha que preenche `recentBets` usa a propriedade errada.

Não é necessário alterar backend nem criar camada intermediária: o contrato atual (`data.payments`) já é usado por Pagamentos.jsx e deve ser considerado a referência.

---

## 3. Correção mínima recomendada

**Ajustar apenas o consumo da resposta no Dashboard**, alinhando-o ao contrato já usado em Pagamentos.jsx:

- **Onde:** `src/pages/Dashboard.jsx`, na atribuição que usa a resposta do GET `/api/payments/pix/usuario`.
- **O quê:** trocar o acesso a **`historico_pagamentos`** por **`payments`** (mantendo o mesmo nível de `response.data.data` e o fallback `|| []`).

Em termos de edição: **uma única linha** — substituir a propriedade lida de `historico_pagamentos` para `payments`.

**Observação pós-correção:** Os itens de `data.payments` vêm do Supabase `pagamentos_pix` com campos como `id`, `amount`, `valor`, `status`, `created_at`, etc. O bloco “Apostas Recentes” hoje espera por item: `bet.valor`, `bet.data`, `bet.status`, `bet.tipo`. Após usar `payments`, a lista passará a ser preenchida; se o backend não enviar `valor` (apenas `amount`) ou não enviar `data` (apenas `created_at`), pode ser necessário um mapeamento leve no Dashboard (ex.: `valor = item.valor ?? item.amount`, `data = item.data ?? item.created_at`, rótulo para `status`/`tipo`). Esse mapeamento é **fora do escopo da correção mínima** (que se limita à propriedade da lista).

---

## 4. Risco da correção

- **Risco baixo:** alteração em um único ponto, sem mudança de contrato da API, sem impacto em Pagamentos.jsx nem em outras rotas.
- **Regressão:** improvável, pois hoje o bloco não exibe dados; passar a consumir `payments` apenas habilita a exibição.
- **Possível ajuste posterior:** se, após a troca, os campos exibidos (valor, data, status, tipo) aparecerem undefined ou em formato inadequado, tratar com mapeamento dos campos do item (valor/amount, data/created_at, status/tipo) apenas no Dashboard, sem alterar backend.

---

## 5. Impacto no sistema

- **Antes:** Lista “Apostas Recentes” sempre vazia (impacto apenas visual).
- **Depois da correção mínima:** A lista passa a ser alimentada pelos dados já retornados por GET `/api/payments/pix/usuario`; o usuário passa a ver os pagamentos PIX no Dashboard, desde que o formato dos itens seja compatível (ou após o mapeamento de campos citado acima).
- **Outros fluxos:** Nenhum impacto em depósito PIX, saque, jogo, saldo ou em outras telas; apenas o consumo da mesma resposta no Dashboard é corrigido.

---

**Resumo:** Ajustar a **camada frontend**, no **Dashboard.jsx**, trocando **`historico_pagamentos`** por **`payments`** na leitura da resposta de GET `/api/payments/pix/usuario`. Correção mínima segura, um ponto único, sem alteração de backend nem de service intermediário. Nenhuma implementação foi feita neste diagnóstico.
