# Checklist — Correção tela de saque (frontend) V1

**Data:** 2026-03-06

---

## Commits

| Descrição | SHA |
|-----------|-----|
| *(preencher após git commit)* | |

---

## Checklist de implementação

- [x] Criar `withdrawService.js` com `requestWithdraw` e `getWithdrawHistory`
- [x] Adicionar `WITHDRAW_REQUEST` e `WITHDRAW_HISTORY` em `config/api.js`
- [x] Withdraw.jsx: submit chama `requestWithdraw` (não `paymentService.createPix`)
- [x] Withdraw.jsx: histórico chama `getWithdrawHistory` (não `paymentService.getUserPix`)
- [x] Manter UX (loading, erro, mensagens, layout)
- [x] Não alterar paymentService, /game, login, depósito, backend

---

## Validação pós-deploy

- [ ] Abrir tela de saque (logado)
- [ ] Solicitar saque (valor + chave PIX válida) e confirmar sucesso
- [ ] Verificar que o histórico lista saques (não depósitos)
- [ ] Confirmar que o saldo atualiza após o saque (loadUserData)
- [ ] Tela de depósito PIX continua gerando PIX normalmente

---

## Rollback

Em caso de problema: reverter commit(s) listados acima ou aplicar manualmente o plano em `FRONTEND-WITHDRAW-FIX-V1-2026-03-06.md` (seção 7).
