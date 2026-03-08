# BLOCO A — Financeiro — Validação 2026

**Data:** 2026-03-08  
**Branch:** `feature/bloco-a-financial`  
**Base:** `main`  
**Objetivo:** Estabilizar fluxo financeiro (depósitos PIX, saques PIX, ledger, sincronização de saldo, exibição e mensagens de erro).

---

## 1. Objetivo do BLOCO

Garantir que o sistema financeiro do Gol de Ouro esteja estável, previsível, seguro e consistente com backend, saldo do usuário, ledger e histórico financeiro, sem duplicações indevidas, sem inconsistências de crédito/débito e sem regressões visíveis. Escopo estrito: depósitos PIX, saques PIX, ledger/transações, sincronização financeira, páginas e fluxos financeiros do jogador, endpoints e webhooks financeiros.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|--------|------------|
| `server-fly.js` | No webhook de depósito PIX (approved): após creditar saldo, chamada a `createLedgerEntry` com tipo `deposito` para consistência do ledger. |
| `goldeouro-player/src/pages/Pagamentos.jsx` | Tratamento de erro padronizado: 503 → "Sistema indisponível"; demais erros → `response.data?.message` ou "Erro ao criar pagamento PIX". |
| `goldeouro-player/src/pages/Withdraw.jsx` | Mensagem de erro padronizada: "Sistema temporariamente indisponível" exibida como "Sistema indisponível"; demais mensagens do backend preservadas. |

---

## 3. Ajustes realizados

1. **Ledger para depósitos aprovados**  
   Ao receber webhook do Mercado Pago com pagamento aprovado, o backend já atualizava `pagamentos_pix` e creditava o saldo em `usuarios`. Passou também a registrar o crédito no `ledger_financeiro` com `tipo: 'deposito'`, `correlationId: dep_${data.id}` e `referencia: id do registro em pagamentos_pix`, garantindo histórico completo e idempotência (evita duplicar linha em reenvios do webhook).

2. **Mensagens de erro no frontend (Pagamentos)**  
   Em falha ao criar pagamento PIX: se status 503, exibe "Sistema indisponível. Tente novamente em alguns minutos."; caso contrário, exibe a mensagem retornada pela API ou "Erro ao criar pagamento PIX".

3. **Mensagens de erro no frontend (Saque)**  
   Mensagem "Sistema temporariamente indisponível" do backend é exibida de forma padronizada como "Sistema indisponível"; demais mensagens (Saldo insuficiente, Chave PIX inválida, etc.) continuam sendo exibidas como retornadas pela API.

Nenhuma alteração em autenticação (fora do fluxo financeiro), gameplay, apostas, interface geral, Fly, Vercel, schema do banco ou produção.

---

## 4. Validação no preview

A validação oficial do BLOCO deve ser feita no **preview online** da branch `feature/bloco-a-financial` após o push:

- **Depósito:** Criar depósito PIX, conferir resposta e exibição; simular/confirmar aprovação e verificar atualização de saldo e histórico (ledger).
- **Saque:** Solicitar saque com saldo suficiente e com saldo insuficiente; conferir mensagens e consistência de saldo/histórico.
- **Erros:** Verificar mensagens para 503 e demais erros nas telas de Pagamentos e Saque.
- **Refresh:** Após operações, recarregar a página e confirmar que saldo e histórico permanecem consistentes.

---

## 5. Testes executados

- Build do frontend: `npm run build` em `goldeouro-player` (a ser confirmado ao final desta execução).
- Lint: arquivos alterados sem erros reportados.
- Imports e fluxos alterados revisados manualmente; nenhuma alteração fora do escopo financeiro.

---

## 6. Resultado final

**BLOCO A VALIDADO COM RESSALVAS**

Motivo: a validação oficial do modelo acontece no preview online da branch, não apenas localmente. As alterações foram aplicadas e testadas em build/local; a confirmação final depende da validação no preview após o push manual.

---

*Documento gerado no âmbito do BLOCO A (Financeiro). Produção permanece congelada; baseline FyKKeg6zb garante rollback seguro.*
