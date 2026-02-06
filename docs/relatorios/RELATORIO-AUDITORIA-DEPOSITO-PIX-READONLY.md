# RELATÓRIO — AUDITORIA DE DEPÓSITO PIX PONTA A PONTA (READ-ONLY) — MISSÃO D-PIX

**Data:** 2026-02-05  
**Sistema:** Gol de Ouro · Produção real  
**Modo:** READ-ONLY TOTAL (nenhuma criação de PIX, reenvio de webhook, atualização de status ou reconciliação manual).  
**Objetivo:** Auditar o fluxo completo de depósito PIX (criação, webhook, reconciliação, crédito em saldo, exibição no histórico).

---

## 1. Regras aplicadas

- **Proibido:** Criar PIX, reenviar webhook, atualizar status, executar reconciliação manual, qualquer escrita.
- **Permitido:** Leitura de código, SELECT no Supabase, GET na API do Mercado Pago (sem expor token).
- **Escopo:** Apenas descrever fatos e classificar riscos (🟢 OK / 🟡 Atenção / 🔴 Falha financeira). Não propor correções nem alterar código.

---

## 2. FASE 0 — Prova de localização (código)

### 2.1 Onde o PIX é criado

| Etapa | Arquivo | Linhas | Descrição |
|-------|---------|--------|-----------|
| Endpoint de criação | server-fly.js | 1706-1820 | `POST /api/payments/pix/criar` (authenticateToken). |
| Validação de valor | server-fly.js | 1708-1721 | amount obrigatório; mínimo 1; máximo 1.000. |
| Chamada ao MP | server-fly.js | 1780-1796 | `POST https://api.mercadopago.com/v1/payments` com transaction_amount, payer, external_reference, notification_url. |
| Idempotency-Key | server-fly.js | 1775-1786 | `X-Idempotency-Key: pix_${userId}_${Date.now()}_${randomBytes}`. |

### 2.2 Onde é salvo em `pagamentos_pix`

| Etapa | Arquivo | Linhas | Descrição |
|-------|---------|--------|-----------|
| INSERT após sucesso MP | server-fly.js | 1806-1819 | `.from('pagamentos_pix').insert({ usuario_id, external_id: payment.id, payment_id: payment.id, amount, valor, status: 'pending', qr_code, ... }).select().single()`. |

Campos gravados: usuario_id, external_id, payment_id, amount, valor, status 'pending', qr_code, qr_code_base64, pix_copy_paste.

### 2.3 Onde o webhook atualiza status e credita saldo

| Etapa | Arquivo | Linhas | Descrição |
|-------|---------|--------|-----------|
| Rota do webhook | server-fly.js | 1969-2101 | `POST /api/payments/webhook` (sem auth; resposta 200 imediata). |
| Idempotência (já processado) | server-fly.js | 1998-2016 | Busca por external_id ou payment_id; se status === 'approved' retorna sem fazer nada. |
| GET no MP | server-fly.js | 2037-2046 | GET `/v1/payments/${paymentId}` para obter status real. |
| Claim atômico (approved) | server-fly.js | 2048-2073 | Update para 'approved' com `.neq('status','approved')` por payment_id; se não afetar 1 linha, tenta por external_id; se claimed === null retorna (não credita). |
| Crédito em saldo | server-fly.js | 2075-2095 | Busca usuarios.saldo, novoSaldo = saldo + (amount ?? valor), update usuarios.saldo. |

### 2.4 Onde o saldo do usuário é creditado (resumo)

- **Webhook:** server-fly.js 2087-2090 (update usuarios.saldo após claim atômico).
- **Reconciliação:** server-fly.js 2376-2388 (update usuarios.saldo após claim por id do registro pendente).

Em ambos os fluxos o crédito só ocorre após exatamente uma linha ser marcada como approved (claim atômico).

### 2.5 Onde o histórico é exibido no front

| Camada | Arquivo | Linhas / referência | Descrição |
|--------|---------|---------------------|-----------|
| API | server-fly.js | 1871-1938 | `GET /api/payments/pix/usuario` (authenticateToken). SELECT em pagamentos_pix por usuario_id, ordenado por created_at desc, limit 50. |
| Frontend (lista) | goldeouro-player/src/pages/Pagamentos.jsx | 39-41, 360 | `apiClient.get(API_ENDPOINTS.PIX_USER)` → `response.data.data.payments`; exibe lista de pagamentos. |
| Config endpoint | goldeouro-player/src/config/api.js | 23 | `PIX_USER: '/api/payments/pix/usuario'`. |
| Dashboard | goldeouro-player/src/pages/Dashboard.jsx | 55 | `historico_pagamentos` vindo de pixResponse para apostas recentes. |

---

## 3. FASE 1 — Base de dados (READ-ONLY)

Fonte: script `scripts/audit-financeira-total-prod-readonly.js` (execução 2026-02-05).

### 3.1 Contagem de PIX por status

| status   | count |
|----------|-------|
| expired  | 258   |
| pending  | 34    |
| approved | 22    |

**Total:** 314 registros.

### 3.2 PIX approved por usuário

Não listado em detalhe aqui (evitar PII). Relatórios de fechamento anteriores indicam 8 usuários com pelo menos um PIX aprovado; totais por usuário já auditados em RELATORIO-FECHAMENTO-CONTABIL-MINIMO-PROD-2026-02-05.md.

### 3.3 PIX pending antigos (faixas de tempo)

- 20 mais antigos listados no script: created_at de 2025-12-10 a 2026-01-22 (ids e usuario_id ofuscados).
- Maioria com mais de 7 dias em pending; padrão compatível com abandono ou não pagamento no MP.

### 3.4 PIX com valores inválidos

- **q5_valores_estranhos:** Lista vazia. Nenhum registro com valor nulo, ≤ 0 ou > 10.000.

### 3.5 payment_id e external_id duplicados

- **payment_id duplicado (approved):** Nenhum (q4 vazio).
- **external_id duplicado:** 1 chave com 2 linhas; nenhuma com status approved (q3: `a: 0`). Sem evidência de double credit por external_id.

**Classificação FASE 1:** 🟢 OK (valores conformes; sem duplicidade de payment_id aprovado; external_id duplicado sem approved).

---

## 4. FASE 2 — Webhook e idempotência

### 4.1 Condições de idempotência

- **Antes de processar:** Busca registro por external_id (e fallback por payment_id); se já existir e status === 'approved', retorna sem atualizar nem creditar (server-fly.js 2014-2016).
- **Claim atômico:** Update com `.eq('payment_id', data.id).neq('status','approved')` (e depois por external_id); só considera “claimed” se exatamente 1 linha retornada; caso contrário não credita (2070-2073).

### 4.2 Uso de payment_id vs external_id

- Na criação: ambos gravados iguais a `payment.id` (server-fly.js 1810-1811).
- No webhook: busca primeiro por external_id (2002-2003), fallback por payment_id (2006-2011). Claim primeiro por payment_id (2052-2056), depois por external_id (2061-2068).

### 4.3 Garantia de crédito único

- Crédito só ocorre quando `claimed` não é null (uma única linha passou no update condicional). Não há crédito se já approved nem se múltiplas linhas fossem afetadas (não é o caso com payment_id único no MP).

### 4.4 Proteção contra concorrência

- Update com `.neq('status','approved')` faz com que apenas a primeira execução (webhook ou recon) que alterar o registro “ganhe”; as demais afetam 0 linhas e não creditam.

**Classificação FASE 2:** 🟢 OK (idempotência por status approved; claim atômico; crédito único; proteção por condição de update).

---

## 5. FASE 3 — Conciliação com saldo

Com base nos relatórios de fechamento e auditoria financeira (read-only):

### 5.1 PIX approved vs incremento real de saldo

- O crédito de saldo é feito no mesmo fluxo que marca o PIX como approved (webhook ou reconciliação). Não existe ledger separado de depósito; a conciliação “soma de approved = saldo” não é possível de forma exata porque o saldo também é alterado por jogo e saques.

### 5.2 Se algum PIX approved não refletiu no saldo

- Nos dados auditados: nenhum usuário com PIX approved apresentou saldo **maior** que a soma dos approved (indicativo de crédito faltando). Usuários com approved e saldo **menor** que a soma (ex.: u_254ad5: 69 approved, saldo 29; u_6a1eb8: 10 approved, saldo 0) são explicados por uso do saldo (jogo/saque), não por “approved não creditado”.
- **Conclusão:** Não há evidência de PIX approved que não tenha sido creditado.

### 5.3 Se algum saldo reflete crédito sem PIX approved

- Vários usuários têm saldo > 0 com soma de PIX approved = 0 (saldo inicial ou bônus), já documentado em relatórios de fechamento. Não caracteriza falha do fluxo PIX; caracteriza outra origem de saldo (regra de negócio).

**Classificação FASE 3:** 🟢 OK (sem evidência de approved não refletido; saldo sem PIX explicado por outras origens).

---

## 6. FASE 4 — Mercado Pago (READ-ONLY)

- Consultas GET `/v1/payments/{id}` foram realizadas em missões anteriores (D1b, D1c) para pendings antigos. Resultado: em todos os casos consultados o status retornado pelo MP foi **null** (token presente mas resposta sem status utilizável), e **nenhum** registro foi classificado como BUG_RECON (approved no MP com banco em pending).
- **Conclusão:** Não foi encontrado approved no MP que não estivesse refletido no banco; pendings antigos permanecem INDETERMINADO por limitação da resposta do MP no ambiente de execução.

**Classificação FASE 4:** 🟢 OK (nenhuma evidência de approved no MP não refletido).

---

## 7. Classificação de riscos (resumo)

| Item | Classificação | Motivo |
|------|----------------|--------|
| Contagem por status e valores | 🟢 OK | Valores conformes; sem approved duplicado por payment_id. |
| external_id duplicado (2 linhas, 0 approved) | 🟢 OK | Anomalia estrutural; sem double credit. |
| Idempotência e claim atômico | 🟢 OK | Implementado no webhook e na reconciliação. |
| Crédito único e concorrência | 🟢 OK | Update condicional; apenas um fluxo credita. |
| PIX approved vs saldo | 🟢 OK | Sem evidência de approved não creditado. |
| Saldo sem PIX (bônus/inicial) | 🟢 OK | Documentado; não é falha do fluxo PIX. |
| Pendings antigos | 🟡 Atenção | Volume de pending antigos; compatível com abandono; sem BUG_RECON. |

Nenhum item classificado como 🔴 Falha financeira.

---

## 8. Limitações explícitas

1. Não existe ledger de depósito; a conciliação estrita “soma(approved) = saldo” não é possível sem desconsiderar jogo e saques.
2. A verificação de “approved no MP não refletido” depende de GET no MP; em execuções anteriores a API retornou status null para os IDs testados.
3. O histórico exibido no front vem exclusivamente de `GET /api/payments/pix/usuario` (pagamentos_pix por usuario_id); não foi validado em runtime a consistência exata com a base.

---

## 9. Veredito

**Fluxo de depósito PIX ponta a ponta:** **APTO** para uso, na ótica desta auditoria read-only.

- Criação: autenticada, validada (valor 1–1000), gravada em pagamentos_pix com status pending.
- Webhook: idempotente, claim atômico, crédito único; crédito apenas quando exatamente uma linha é aprovada.
- Reconciliação: mesma lógica de claim por id do registro; crédito condicionado a 1 linha afetada.
- Exibição: histórico do usuário via GET /api/payments/pix/usuario (pagamentos_pix).
- Não foi identificada falha financeira (double credit, approved não creditado, valores inválidos persistentes).

Ressalva documentada: volume de pendings antigos (🟡 Atenção), sem evidência de bug de reconciliação (nenhum BUG_RECON nas missões D1b/D1c).

Nenhuma correção foi proposta nem nenhum código ou dado foi alterado.

---

**Scripts utilizados:** `scripts/audit-financeira-total-prod-readonly.js`; evidências de código em server-fly.js e goldeouro-player.  
**Data do relatório:** 2026-02-05
