# Auditoria READ-ONLY: Fluxo de Depósito PIX — Gol de Ouro

**Data:** 2026-03-06  
**Escopo:** Contrato frontend/backend e prontidão para demonstração V1  
**Tipo:** Auditoria somente leitura (nenhuma alteração de código, deploy ou infraestrutura)

---

## 1. Resumo executivo

Foi realizada uma auditoria ponta a ponta do fluxo de depósito PIX (tela de depósito → backend → resposta com QR/código e histórico). O contrato de **criação de PIX** e a **estrutura de resposta** estão alinhados entre frontend e backend. Existem **ressalvas** pontuais: possível exibição incorreta do saldo na tela de Pagamentos (frontend usa `response.data.balance` enquanto o backend retorna `data.saldo` em `data.data`), e o endpoint **GET /api/payments/pix/status** não foi localizado no `server-fly.js`, o que pode fazer o botão "Verificar Status" falhar (404). O fluxo principal (criar PIX, exibir QR/copia e cola, listar histórico) está **pronto para demonstração com ressalvas**, desde que se evite depender do botão de status em tempo real e se verifique o Mercado Pago antes da demo.

---

## 2. Contrato do frontend

- **Tela:** `Pagamentos.jsx` (rota de pagamentos/depósito).
- **Criação de PIX:** A tela **não** utiliza `paymentService.createPix`; chama diretamente `apiClient.post('/api/payments/pix/criar', { amount, description })`.
- **Payload enviado:** `amount` (number) e `description` (string, ex.: "Recarga de saldo - R$ X.XX").
- **Validação na UI:** Valor mínimo 1 (toast "Valor mínimo de recarga é R$ 1,00"); input com `min="1"`; presets: 1, 5, 10, 25, 50, 100.
- **Consumo da resposta:** `setPagamentoAtual(response.data.data)`; a UI usa `id`, `pix_code` ou `qr_code` ou `pix_copy_paste`, opcionalmente `qr_code_base64` e `init_point`.
- **Histórico:** GET `API_ENDPOINTS.PIX_USER` → `response.data.data.payments`; espera itens com `id`, `created_at`, `amount`, `status`.
- **Saldo:** O frontend usa `response.data.balance` (GET `API_ENDPOINTS.PROFILE`). O backend retorna o saldo em `response.data.data.saldo`; portanto, o campo `balance` não existe na resposta e o saldo pode aparecer como 0 na tela de Pagamentos.

Detalhes estruturados: `docs/relatorios/deposito-final-contract-frontend.json`.

---

## 3. Contrato do backend

- **POST /api/payments/pix/criar** (em `server-fly.js`):
  - **Body esperado:** `amount` (obrigatório). Opcional: `cpf`. O campo `description` é ignorado (a descrição enviada ao Mercado Pago é fixa).
  - **Validações:** `amount >= 1`, `amount <= 1000`; token Mercado Pago configurado e conectado.
  - **Resposta de sucesso (200):** `{ success, message, data: { id, amount, qr_code, qr_code_base64, pix_copy_paste, pix_code, status: 'pending', created_at } }`.
  - **Erros:** 400 (valor inválido/máximo), 503 (sistema indisponível), 500 (erro ao criar PIX / Mercado Pago).

- **GET /api/payments/pix/usuario:** Retorna `{ success, data: { payments: [...], total } }`. Em erro de banco, retorna lista vazia.

- **GET /api/payments/pix/status:** Não foi encontrado no `server-fly.js` (apenas POST criar e GET usuario estão definidos nas rotas de PIX). Outros arquivos do projeto referenciam rota de status (ex.: `routes/paymentRoutes.js`), mas o servidor principal usado em produção (server-fly) não expõe essa rota.

Detalhes: `docs/relatorios/deposito-final-contract-backend.json`.

---

## 4. Compatibilidade entre frontend e backend

| Aspecto | Status | Observação |
|--------|--------|------------|
| Campos do request (amount, description) | Compatível | Backend usa apenas `amount`; ignora `description`. |
| Valor mínimo (1) | Compatível | Frontend e backend: 1. |
| Valor máximo | Compatível com ressalva | Backend 1000; frontend sem teto na validação (presets até 100). |
| Resposta (id, qr_code, pix_copy_paste, pix_code, status, created_at) | Compatível | Backend envia todos os campos que a UI usa para exibir código e ID. |
| Histórico (payments[], id, amount, status, created_at) | Compatível | Estrutura alinhada. |
| Saldo na tela Pagamentos | Compatível com ressalva | Frontend usa `response.data.balance`; backend retorna `response.data.data.saldo` → saldo pode aparecer 0. |
| Endpoint "Verificar Status" | Incompatível / ausente | UI chama GET pix/status; rota não encontrada no server-fly → risco de 404. |

Detalhes: `docs/relatorios/deposito-final-contract-compatibility.json`.

---

## 5. Compatibilidade da resposta do PIX (QR, copia e cola, status)

- O backend retorna `qr_code`, `pix_copy_paste` e `pix_code` (mesmo valor). A UI usa `pix_code || qr_code || pix_copy_paste` para exibir o código e o botão copiar → **compatível**.
- `id`, `amount`, `status: 'pending'`, `created_at` estão presentes e são usados pela UI → **compatível**.
- `qr_code_base64` é retornado; a UI pode usá-lo para renderizar imagem do QR se já estiver implementado.
- `init_point` não foi verificado na resposta atual do backend; a UI tem fallback para link "Pagar com PIX" quando não há código/QR.

Detalhes: `docs/relatorios/deposito-final-contract-response.json`.

---

## 6. Riscos de demo

| Risco | Nível | Mitigação |
|-------|--------|------------|
| Atraso na confirmação do PIX (webhook/saldo) | Médio | Explicar que o crédito pode levar segundos a ~1 min; Plano B: mostrar só QR/código. |
| QR/código não retornado (falha Mercado Pago) | Alto | Checar health (Mercado Pago conectado) antes; mensagem amigável em 503/500. |
| Copy-paste ausente | Baixo | Backend envia múltiplos campos; UI tem fallback. |
| Valor min/máx | Baixo | Regras alinhadas; usar valor entre 1 e 1000. |
| Mensagens de erro | Médio | Frontend usa `response.data.message` ou genérica. |
| Webhook não demonstrável ao vivo | Médio | Não depender de PIX real; mostrar fluxo até QR/código. |
| Mercado Pago indisponível | Alto | Verificar health antes da demo; Plano B sem pagamento real. |
| Histórico/status não atualizando (GET status inexistente) | Médio | "Verificar Status" pode 404; usar recarregar da página ou listar histórico após webhook. |
| Saldo 0 na tela Pagamentos | Médio | Corrigir frontend para `response.data.data.saldo` ou exibir saldo vindo de outra fonte. |

Detalhes: `docs/relatorios/deposito-final-contract-risks.json`.

---

## 7. Conclusão final

**Status do fluxo de depósito:** **PRONTO COM RESSALVAS**

- O fluxo de **criar PIX**, **receber e exibir QR/código copia e cola** e **listar histórico** está contratualmente alinhado e pode ser demonstrado.
- Ressalvas: (1) saldo na tela de Pagamentos pode aparecer 0 por uso de `response.data.balance` em vez de `response.data.data.saldo`; (2) botão "Verificar Status" pode retornar 404 se o endpoint não existir no ambiente que serve a aplicação (server-fly).

---

## 8. Recomendação objetiva

- **Pode demonstrar o depósito agora?** **Sim**, com as ressalvas acima.
- **Ajuste mínimo recomendado (pós-auditoria, se permitido):**  
  - No frontend, na tela de Pagamentos, usar `response.data.data?.saldo` (ou equivalente) para exibir o saldo ao carregar o perfil.  
  - Confirmar se no ambiente de demo existe GET `/api/payments/pix/status` (ou equivalente); se não existir, evitar depender do botão "Verificar Status" na demo ou implementar a rota no server-fly.
- **Plano A para a demo:** Mostrar login → tela de depósito → valor (ex.: R$ 10) → criar PIX → exibir QR e código copia e cola → mostrar histórico de depósitos. Não prometer atualização de status em tempo real nem crédito instantâneo; explicar que o crédito vem após confirmação (webhook).
- **Plano B:** Se o Mercado Pago ou o backend estiverem indisponíveis, mostrar apenas a tela e o fluxo até a chamada de API (sem pagamento real) e explicar o comportamento com mock ou print.

---

## 9. Tabela final

| Item | Status | Impacto na demo | Ação recomendada |
|------|--------|------------------|-------------------|
| Payload criar PIX (amount, description) | Compatível | Nenhum | Nenhuma. |
| Valor mínimo/máximo | Compatível | Nenhum | Usar valor entre 1 e 1000. |
| Resposta PIX (QR, copia e cola, id, status) | Compatível | Nenhum | Nenhuma. |
| Histórico de depósitos | Compatível | Nenhum | Nenhuma. |
| Saldo na tela Pagamentos | Ressalva | Saldo pode aparecer 0 | Usar `data.data.saldo` no frontend (ou exibir saldo de outra fonte). |
| Endpoint Verificar Status | Ausente no server-fly | Botão pode 404 | Verificar ambiente; não depender do botão na demo ou implementar rota. |
| Webhook / crédito em tempo real | Depende de MP e rede | Atraso esperado | Comunicar na demo; Plano B sem PIX real. |
| Saúde Mercado Pago | Depende de config | Falha ao criar PIX | Checar health antes da demo. |

---

*Auditoria READ-ONLY. Nenhum código, deploy, banco ou configuração foi alterado.*
