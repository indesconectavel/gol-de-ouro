# Checklist – Simplificação tela de depósito para demo V1

**Data:** 2026-03-06

---

## Antes do commit

- [x] Removido estado `saldo` e `setSaldo` em Pagamentos.jsx
- [x] Removida em `carregarDados` a chamada GET PROFILE e `setSaldo(response.data.balance)`
- [x] Removida a função `consultarStatusPagamento`
- [x] Removido o botão "Verificar Status" no bloco "Pagamento PIX Criado"
- [x] Removida a coluna "Ações" e o botão "Verificar" na tabela de histórico
- [x] Nenhum outro arquivo alterado (game, login, saque, backend, config, services)
- [x] Linter sem erros em Pagamentos.jsx

## Fluxo preservado

- [x] Criação do PIX (POST /api/payments/pix/criar) inalterada
- [x] Exibição do código PIX (copia e cola) inalterada
- [x] Botão "Copiar Código PIX" mantido
- [x] Histórico de pagamentos (GET PIX_USER + tabela Data/Valor/Status) inalterado
- [x] Mensagens e textos da tela mantidos

## Entregas

- [x] Relatório: docs/relatorios/FRONTEND-DEPOSITO-SIMPLIFICACAO-DEMO-2026-03-06.md
- [x] Checklist: docs/relatorios/FRONTEND-DEPOSITO-SIMPLIFICACAO-DEMO-CHECKLIST-2026-03-06.md
- [ ] Commit realizado (SHA anotado abaixo)

## Pós-commit / validação

- [ ] Build do frontend (quando permitido) passa
- [ ] Tela de Pagamentos abre sem erro
- [ ] Criar PIX exibe valor, ID, código copia e cola
- [ ] Histórico lista pagamentos com Data, Valor, Status
- [ ] Nenhum botão "Verificar Status" ou "Verificar" visível

## Rollback

- [ ] SHA do commit anotado para `git revert <SHA>` se necessário

---

**Commit SHA(s):** _preenchido após o commit_
