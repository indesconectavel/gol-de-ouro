# Execução de hoje — Cirurgia 01 do teste PIX real

**Documento:** registro operacional da tentativa de documentação do teste PIX com valor baixo.  
**Modo:** **nenhuma** alteração de código ou deploy nesta sessão.

---

## 1. Contexto do teste

| Campo | Valor registrado |
|-------|------------------|
| **Ambiente** | **Não definido nesta sessão** — execução completa (produção vs sandbox) depende do operador e das credenciais MP no Fly. |
| **Usuário de teste** | **Não aplicável** — nenhum `usuarios.id` foi utilizado; o agente não autenticou no app. |
| **Valor (R$)** | Planejado no READ-ONLY: **R$ 1,00** ou **R$ 2,00** — **não** foi enviado `POST /api/payments/pix/criar` nesta sessão. |
| **Hora de início do teste financeiro** | **Não iniciado** — não houve criação de cobrança nem pagamento pelo fluxo oficial nesta assistência. |

**Escopo desta sessão:** apenas leitura de **logs Fly** (`flyctl logs -a goldeouro-backend-v2 --no-tail`) para contexto; **não** substitui baseline de saldo nem confirmação em banco.

---

## 2. Estado inicial

| Item | Status |
|------|--------|
| **`usuarios.saldo` antes** | **Não consultado** — sem acesso ao Supabase a partir deste ambiente. |
| **`pagamentos_pix` antes** | **Não consultado** — idem. |

**Operador:** preencher com query no Supabase antes de qualquer execução real (conforme `EXEC-HOJE-PIX-READONLY.md`).

---

## 3. Criação do PIX

| Item | Status |
|------|--------|
| **`POST /api/payments/pix/criar`** | **Não executado** nesta sessão. |
| **Resposta (QR, `payment.id`, etc.)** | **N/A** |
| **Linha em `pagamentos_pix`** | **N/A** |

---

## 4. Pagamento executado

| Item | Status |
|------|--------|
| **Pagamento via banco/MP** | **Não realizado** nesta sessão. |
| **Hora aproximada** | **N/A** |

---

## 5. Processamento observado (webhook / reconcile / logs)

### 5.1 Logs Fly (amostra obtida com `flyctl logs -a goldeouro-backend-v2 --no-tail`)

**Não** há nesta amostra linhas de sucesso `💰 [PIX-CREDIT]` ou `✅ [RECON] ... credited` associadas a um teste desta sessão.

**Constatado (histórico recente no buffer de logs):**

- Repetição de erro de reconciliação ao processar um ID **não numérico** armazenado como referência de pagamento:

```text
❌ [RECON] ID de pagamento inválido (não é número): deposito_4ddf8330-ae94-4e92-a010-bdc7fa254ad5_1765383727057
```

- Esse padrão indica **linha pendente legada** (ou fluxo antigo) em que `external_id`/`payment_id` **não** é o ID numérico do Mercado Pago — o reconcile atual **rejeita** (comportamento esperado pelo código SSRF/validação). **Não** valida nem invalida um novo PIX criado com ID MP numérico.

- Antes do scale-down para 1 instância, apareciam **duas** máquinas `app` nos logs (`1850066f141908` e `e82d445ae76178`); por volta de **2026-03-28T01:52:53Z** a máquina `e82d445ae76178` registra **SIGINT** e encerramento — alinhado à cirurgia de instância única. Após isso, apenas `1850066f141908` continua o ruído de `[RECON]` acima.

### 5.2 Webhook

**Não** foi correlacionado nenhum evento de webhook a um pagamento de teste (sem ID MP nem timestamp de POST).

---

## 6. Estado final

| Item | Status |
|------|--------|
| **Saldo final** | **Não medido** |
| **Delta** | **N/A** |
| **Status final em `pagamentos_pix`** | **N/A** |

---

## 7. Evidências coletadas

| # | Evidência | Situação |
|---|-----------|----------|
| 1 | Saldo antes | **Não coletado** |
| 2 | Saldo depois | **Não coletado** |
| 3 | Linha `pagamentos_pix` antes/depois | **Não coletado** |
| 4 | ID do pagamento no MP | **Não coletado** |
| 5 | Trecho de log relevante ao **teste** | **Inexistente** — apenas ruído `[RECON]` com ID legado não numérico (secção 5). |
| 6 | Resultado final do teste | Ver secção 8. |

---

## 8. Resultado

**Classificação: INCONCLUSIVO — execução do teste financeiro PIX não realizada nesta sessão assistida.**

**Motivo:** o agente **não** dispõe de JWT do usuário de teste, **não** acessa o Supabase e **não** executa pagamento real. Sem baseline e sem pós-estado no banco, **não** é possível afirmar que o saldo subiu **uma vez**, nem que `pagamentos_pix` transitou para `approved` por este teste.

**O que **não** foi demonstrado neste documento:**

- Que o fluxo **criar → pagar → webhook/reconcile → crédito único** ocorreu com sucesso **hoje** com valor baixo.

**Próximo passo obrigatório para “SUCESSO” ou “FALHA” documentados:** o **operador humano** executar o roteiro em `docs/relatorios/EXEC-HOJE-PIX-READONLY.md`, preencher saldos, IDs MP e colar trecho de log contendo `💰 [PIX-CREDIT]` ou erro explícito do helper — **ou** anexar nova revisão deste arquivo com esses dados.

---

## 9. Observações

1. **Integridade:** não foram inventados IDs, saldos ou resultados positivos.
2. **Logs:** o erro repetido `[RECON] ID de pagamento inválido` merece **higienização de dados** no Supabase (corrigir ou arquivar pendências com referência não numérica) para reduzir ruído operacional — **fora do escopo** desta sessão (sem alteração de banco aqui).
3. **Multinstância:** os logs analisados cobrem o período em que ainda havia **duas** máquinas `app`; após **2026-03-28T01:52:53Z** só uma máquina `app` permanece nos eventos — coerente com `EXEC-HOJE-INSTANCIA-CIRURGIA-01.md`.
4. **Repetição de pagamento:** conforme regras do pedido, **não** se deve criar novo PIX enquanto o primeiro estiver em análise; nesta sessão **nenhum** primeiro pagamento foi iniciado.

---

*Fim do relatório. Atualizar este arquivo após execução real pelo operador, se desejado rastreabilidade única.*
