# Simplificação da tela de depósito para demo V1

**Data:** 2026-03-06  
**Escopo:** Ajuste cirúrgico em `Pagamentos.jsx` para reduzir riscos na demonstração.

---

## 1. Objetivo

Remover/ocultar apenas elementos de **risco baixo** identificados na auditoria:

1. Botão/ação **"Verificar Status"** (e duplicata na tabela).
2. Leitura de saldo em Pagamentos que usava **response.data.balance** e **não era renderizada** na UI.

---

## 2. Arquivos alterados

| Arquivo | Alterações |
|--------|-------------|
| **goldeouro-player/src/pages/Pagamentos.jsx** | Remoção de estado `saldo` e da chamada GET PROFILE em `carregarDados`; remoção da função `consultarStatusPagamento`; remoção do botão "Verificar Status" no bloco PIX; remoção da coluna "Ações" e do botão "Verificar" na tabela de histórico. |

Nenhum outro arquivo foi modificado (config, services, backend, game, login, saque intocados).

---

## 3. Diff resumido

- **Removido:** `const [saldo, setSaldo] = useState(0);`
- **Removido em carregarDados:** chamada `apiClient.get(API_ENDPOINTS.PROFILE)` e `setSaldo(response.data.balance || 0)`. Mantida apenas a chamada a `API_ENDPOINTS.PIX_USER` para popular `pagamentos`.
- **Removido:** função `consultarStatusPagamento(paymentId)` (inteira).
- **Removido:** bloco JSX do botão "🔄 Verificar Status" dentro do card "Pagamento PIX Criado".
- **Removido:** coluna "Ações" do cabeçalho da tabela de histórico e célula com botão "Verificar" em cada linha.

---

## 4. O que foi removido/ocultado

| Item | Motivo |
|------|--------|
| Estado `saldo` e leitura `response.data.balance` | Não eram exibidos na UI; backend retorna `data.saldo`, então o valor ficava 0. Remoção evita chamada desnecessária e contrato incorreto. |
| Função `consultarStatusPagamento` | Dependia de GET `/api/payments/pix/status`, que pode não existir no server-fly; risco de 404 na demo. |
| Botão "Verificar Status" (bloco PIX) | Acionava a função acima; removido para não expor ação que pode falhar. |
| Coluna "Ações" e botão "Verificar" (histórico) | Mesma ação; removidos para consistência e layout mais simples. |

---

## 5. Por que isso não afeta o fluxo principal de depósito

- **Criação do PIX:** inalterada (`apiClient.post('/api/payments/pix/criar', { amount, description })`).
- **Exibição do QR / código copia e cola:** inalterada (bloco com `pix_code` / `qr_code` / `pix_copy_paste` e botão "Copiar Código PIX").
- **Histórico:** inalterado (GET PIX_USER e tabela Data / Valor / Status); apenas a coluna de ação manual foi removida.
- **Saldo:** não era mostrado nesta tela; Dashboard e outras telas continuam usando seu próprio carregamento de saldo (`data.data.saldo`).

---

## 6. Por que isso reduz risco na demo

- **Sem botão "Verificar Status":** não há chamada a um endpoint que pode retornar 404 ou erro, evitando mensagem de falha durante a demonstração.
- **Sem leitura de `response.data.balance`:** não há dependência de um campo que o backend não envia (evita confusão e possível erro se no futuro alguém passar a exibir esse valor).
- **Menos superfície de falha:** menos ações e menos chamadas de API na tela de depósito.

---

## 7. Plano de rollback

Para reverter este ajuste:

1. **Reverter o commit** (após o SHA ser conhecido):
   ```bash
   git revert <SHA> --no-edit
   ```
   ou restaurar o arquivo a partir do commit anterior:
   ```bash
   git show <SHA>^:goldeouro-player/src/pages/Pagamentos.jsx > goldeouro-player/src/pages/Pagamentos.jsx
   ```

2. **Restauração manual** (se preferir reaplicar só algumas partes):
   - Recolocar estado: `const [saldo, setSaldo] = useState(0);`
   - Em `carregarDados`, após o try: chamar `apiClient.get(API_ENDPOINTS.PROFILE)` e `setSaldo(response.data.balance || 0)` (e manter a chamada PIX_USER).
   - Recolocar a função `consultarStatusPagamento` (conteúdo conforme auditoria em `AUDITORIA-FRONTEND-DEPOSITO-FUNCOES-PIX-STATUS.md`).
   - Recolocar o bloco do botão "Verificar Status" dentro do card de "Pagamento PIX Criado".
   - Recolocar na tabela a coluna `<th>Ações</th>` e em cada linha o `<td>` com o botão "Verificar" chamando `consultarStatusPagamento(pagamento.id)`.

3. **Validação pós-rollback:** abrir a tela de Pagamentos, criar um PIX, conferir QR/copia e cola e histórico; se tiver restaurado os botões, testar "Verificar Status" (com backend que exponha o endpoint).

---

## 8. Preservado (não alterado)

- Fluxo de criação do PIX (payload, endpoint, toasts).
- Render do QR Code e do código copia e cola.
- Histórico de pagamentos (lista e colunas Data, Valor, Status).
- Layout geral, mensagens e navegação (Voltar, etc.).
- Game, login, saque, backend, Vercel — não tocados.

---

*Relatório da simplificação para demo V1. Commit pequeno e rastreável.*
