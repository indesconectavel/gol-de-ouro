# Saque — Verificação final de contrato (READ-ONLY)

**Data:** 2026-03-06  
**Modo:** Somente leitura. Nenhuma alteração de código, deploy ou produção.

---

## 1) Resumo executivo

- **Payload:** O frontend envia exatamente `valor`, `chave_pix`, `tipo_chave`; o backend espera os mesmos campos. **Compatível.**
- **Validações:** Valor mínimo 10 no frontend e no backend; saldo e campos obrigatórios validados nos dois lados. **Compatível.**
- **Histórico:** O backend retorna `data.saques[]` com `id`, `amount`/`valor`, `status`, `pix_key`, `created_at`; o withdrawService normaliza para o formato que a UI usa (amount, method, pixKey, date, status em português). **Compatível.**
- **Riscos de demo:** Médio para chave PIX inválida ou mensagem técnica; baixo para saldo, valor mínimo, histórico vazio. Mitigação: usar chave válida, conta com saldo e sem saque pendente.
- **Conclusão:** **PRONTO COM RESSALVAS.** Contrato alinhado; ressalvas operacionais para a demonstração (chave PIX válida, conta preparada).

---

## 2) Contrato do frontend

- **Submit:** `requestWithdraw(amount, formData.pixKey, formData.pixType)` → body: `{ valor: parseFloat(amount), chave_pix: String(pixKey).trim(), tipo_chave: pixType || 'cpf' }`.
- **Nomes dos campos:** `valor`, `chave_pix`, `tipo_chave`.
- **Tipos:** valor number, chave_pix string, tipo_chave string (cpf | email | phone | random).
- **Valor mínimo no frontend:** 10 (exibido via `paymentService.getConfig().minAmount`, input `min="10"`); validação de saldo e amount > 0.
- **Mensagens:** Erros do backend via `result.error`; sucesso: modal "Saque Solicitado!".
- **Histórico na UI:** Lista com `withdrawal.id`, `withdrawal.amount.toFixed(2)`, `withdrawal.method`, `withdrawal.pixKey`, `withdrawal.date`, `withdrawal.status` (Processado | Pendente | Cancelado).

*Detalhes em saque-final-contract-frontend.json.*

---

## 3) Contrato do backend

**POST /api/withdraw/request**
- Body: `valor`, `chave_pix`, `tipo_chave`.
- Validações: PixValidator (valor 0,50–1000; chave e tipo); em seguida valor mínimo 10,00; saldo; sem saque pendente; valor líquido após taxa > 0.
- Resposta 201: `{ success, message, data: { id, amount, fee, net_amount, pix_key, pix_type, status: 'pending', created_at, correlation_id } }`.
- Erros: 400 (validação, saldo, valor mínimo), 409 (saque pendente, conflito de saldo), 503, 500.

**GET /api/withdraw/history**
- Resposta 200: `{ success, data: { saques: [ { id, valor, amount, fee, net_amount, status, pix_key, pix_type, created_at } ], total } }`.
- Ordenação: `created_at` desc; limit 50.

*Detalhes em saque-final-contract-backend.json.*

---

## 4) Compatibilidade entre frontend e backend

| Item | Status |
|------|--------|
| Nomes dos campos (valor, chave_pix, tipo_chave) | Compatível |
| Tipos (number, string) | Compatível |
| Valor mínimo (10) | Compatível |
| Tipos de chave (cpf, email, phone, random) | Compatível |
| Estrutura de resposta de sucesso/erro | Compatível |
| Uso de `message` em erros pelo frontend | Compatível |

Ressalva: no backend o PixValidator aceita valor entre 0,50 e 1000; o server aplica depois o mínimo 10. O frontend já valida 10, então no fluxo normal está alinhado.

*Detalhes em saque-final-contract-compatibility.json.*

---

## 5) Compatibilidade do histórico

- Backend devolve `saques[]` com `id`, `amount`/`valor`, `status`, `pix_key`/`chave_pix`, `created_at`.
- withdrawService converte para `id`, `amount` (number), `method: 'PIX'`, `pixKey`, `date` (formatada pt-BR), `status` (mapStatus → Processado | Pendente | Cancelado).
- A UI usa apenas esses campos; `amount` tem fallback 0; `date` e `pixKey` têm fallbacks. **Compatível.**

*Detalhes em saque-final-contract-history.json.*

---

## 6) Riscos de demo

- **Chave PIX inválida / mensagem técnica:** Médio — usar chave válida e testar antes.
- **Saldo insuficiente / valor mínimo:** Baixo — conta com saldo e mínimo R$ 10.
- **Histórico vazio / status não mapeado:** Baixo — aceitável; mapStatus cobre os status atuais.
- **Saque pendente (409):** Médio — usar conta sem saque pendente ou esperar processamento.
- **Conflito de saldo (409):** Baixo — evitar múltiplos envios rápidos.

*Detalhes em saque-final-contract-risks.json.*

---

## 7) Conclusão final

**PRONTO COM RESSALVAS**

- Contrato (payload, validações, respostas, histórico) está alinhado entre frontend e backend.
- Ressalvas: na demonstração usar chave PIX válida, conta com saldo e sem saque pendente; testar antes com conta de demo.

---

## 8) Recomendação objetiva

- **Pode fazer deploy da tela de saque agora?** **Sim.**
- **Se não, qual ajuste mínimo falta?** Nenhum ajuste de código necessário para o contrato. As ressalvas são operacionais (preparar conta e chave para a demo).

---

## Tabela final

| Item | Status | Impacto na demo | Ação recomendada |
|------|--------|------------------|-------------------|
| Payload request (valor, chave_pix, tipo_chave) | Compatível | Nenhum | — |
| Valor mínimo 10 | Compatível | Nenhum | Informar na demo |
| Tipos de chave (cpf, email, phone, random) | Compatível | Nenhum | Usar chave válida |
| Resposta sucesso/erro | Compatível | Nenhum | — |
| Formato histórico | Compatível | Nenhum | — |
| Chave PIX inválida | Mensagem backend | Médio | Testar antes; chave válida |
| Saque pendente (409) | Mensagem clara | Médio | Conta sem saque pendente |
| Saldo / conflito | Validado / mensagem | Baixo | Conta com saldo; não enviar duas vezes |

---

*Auditoria READ-ONLY. JSONs em docs/relatorios/saque-final-contract-*.json.*
