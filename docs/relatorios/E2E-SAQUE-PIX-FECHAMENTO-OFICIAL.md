# E2E Saque PIX — Fechamento Oficial

**Data:** 2026-03-04  
**Modo:** Execução controlada E2E financeiro (sem alterar código, Fly, secrets, banco).  
**Objetivo:** Executar 1 E2E completo de saque PIX usando JWT do usuário `free10signer` e gerar relatório detalhado.

---

## Regras respeitadas

- NÃO alterado: código, Fly, secrets, reinício de máquinas, banco.
- Apenas endpoints reais do produto: `https://goldeouro-backend-v2.fly.dev`.

---

## JWT utilizado

- **Usuário (decodificado):** `userId`: `4ddf8330-ae94-4e92-a010-bdc7fa254ad5`, `email`: `free10signer@gmail.com`, `username`: `free10signer`.
- **Header:** `Authorization: Bearer <token>` (token não exposto em texto completo no relatório).

---

## Passo 1 — Verificar saldo (GET /api/user/profile)

**Request:**

```http
GET https://goldeouro-backend-v2.fly.dev/api/user/profile
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Response:**

- **Status:** `200 OK`
- **Body:**

```json
{
  "success": true,
  "data": {
    "id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5",
    "email": "free10signer@gmail.com",
    "username": "free10signer",
    "nome": "free10signer",
    "saldo": 89,
    "tipo": "jogador",
    "total_apostas": 0,
    "total_ganhos": 0,
    "created_at": "2025-10-21T20:24:51.037919+00:00",
    "updated_at": "2026-03-03T23:54:56.996803+00:00"
  }
}
```

**Evidência:** Saldo atual **R$ 89,00** — suficiente para saque de valor mínimo R$ 10,00.

---

## Passo 2 — Criar solicitação de saque (POST /api/withdraw/request)

**Request:**

```http
POST https://goldeouro-backend-v2.fly.dev/api/withdraw/request
Authorization: Bearer <JWT>
Content-Type: application/json
x-idempotency-key: e2e-saque-pix-2026-03-04-001

{
  "valor": 10,
  "chave_pix": "free10signer@gmail.com",
  "tipo_chave": "email"
}
```

- **Valor:** R$ 10,00 (mínimo permitido pelo backend).
- **Chave PIX:** email do próprio usuário (já válido no produto).

**Resposta obtida (primeira tentativa):**

- **Status:** `500` (inferido pelo corpo de erro).
- **Body:** `{"success":false,"message":"Erro ao registrar saque"}`

**Segunda tentativa (idempotency-key 002):**

- **Status:** `409 Conflict`
- **Body (esperado):** `{"success":false,"message":"Já existe um saque pendente em processamento"}`

**Conclusão passo 2:** O backend **não** retornou sucesso (200) ao cliente na criação do saque. A primeira chamada falhou com "Erro ao registrar saque"; a segunda retornou 409 por já existir saque pendente para o usuário.

---

## Passo 3 — Confirmar resposta do backend

- **Criação (POST):** Backend respondeu com **erro** na primeira tentativa e **409** na segunda.
- **Não houve** resposta `200 OK` com `success: true` e `data` do saque criado na sessão deste E2E.

---

## Passo 4 — Consultar tabela de saques (histórico usuário e admin)

### 4.1 GET /api/withdraw/history (usuário autenticado)

**Request:**

```http
GET https://goldeouro-backend-v2.fly.dev/api/withdraw/history
Authorization: Bearer <JWT>
```

**Response:**

- **Status:** `200 OK`
- **Body:**

```json
{
  "success": true,
  "data": {
    "saques": [
      {
        "id": "5cff6e2e-b188-4b8c-85e5-080aed465a21",
        "valor": 10,
        "amount": 10,
        "fee": 2,
        "net_amount": 8,
        "status": "pendente",
        "pix_key": "free10signer@gmail.com",
        "pix_type": "email",
        "created_at": "2026-03-04T05:01:40.119+00:00"
      },
      {
        "id": "2ad05942-3d86-4118-baa4-eb2085b72376",
        "valor": 10,
        "amount": 10,
        "fee": 2,
        "net_amount": 8,
        "status": "rejeitado",
        "pix_key": "free10signer@gmail.com",
        "pix_type": "email",
        "created_at": "2026-03-01T16:15:24.942+00:00"
      }
    ],
    "total": 2
  }
}
```

**Evidência:** Existe 1 saque **pendente** criado em **2026-03-04** (valor R$ 10, taxa R$ 2, líquido R$ 8), indicando que em algum momento o fluxo de criação inseriu o registro na base, mesmo que a resposta HTTP ao cliente tenha sido de erro na tentativa observada.

### 4.2 GET /api/admin/saques-presos (endpoint administrativo)

**Request:**

```http
GET https://goldeouro-backend-v2.fly.dev/api/admin/saques-presos
Authorization: Bearer <JWT>
```

(Sem header `x-admin-token`, conforme regra de não alterar secrets.)

**Response:**

- **Status:** `401` (ou equivalente).
- **Body:** `{"error":"Token de autenticação não fornecido","message":"Header x-admin-token é obrigatório"}`

**Conclusão:** Endpoint administrativo existe e exige `x-admin-token`; não foi usado token admin (sem alterar configurações).

---

## Passo 5 — Verificação de processamento (worker)

- **Estado do saque pendente (id `5cff6e2e-b188-4b8c-85e5-080aed465a21`):** `status: "pendente"`.
- **Evidência de worker:** Na consulta ao histórico durante este E2E, o saque continuava em **pendente**; não foi possível confirmar, nesta execução, se o worker alterou o status para `processing` ou `completed` sem acesso a admin nem banco.
- **Conclusão:** Registro existe e está aguardando processamento; não há evidência positiva de captura pelo worker dentro desta sessão de testes.

---

## Resumo das requisições e respostas

| Passo | Método | Endpoint | Status | Observação |
|-------|--------|----------|--------|------------|
| 1 | GET | /api/user/profile | 200 | Saldo R$ 89 |
| 2 (1ª) | POST | /api/withdraw/request | 500 | "Erro ao registrar saque" |
| 2 (2ª) | POST | /api/withdraw/request | 409 | Saque pendente já existe |
| 3 | — | — | — | Resposta do backend não foi sucesso (200) na criação |
| 4.1 | GET | /api/withdraw/history | 200 | 1 saque pendente (04/03), 1 rejeitado (01/03) |
| 4.2 | GET | /api/admin/saques-presos | 401 | x-admin-token obrigatório |
| 5 | — | — | — | Saque permanece "pendente"; worker não verificado |

---

## Status final

- **Perfil/saldo:** OK (200, saldo disponível).
- **Criação de saque (POST):** Falha na resposta ao cliente (erro 500 na primeira tentativa; 409 na segunda).
- **Histórico:** OK (200); mostra 1 saque pendente recente, indicando possível criação em tentativa anterior ou em passo interno do próprio POST que depois falhou.
- **Admin:** Endpoint presente; acesso não autorizado sem `x-admin-token`.
- **Worker:** Sem evidência de processamento dentro desta execução (saque ainda "pendente").

---

## Veredito

**NO-GO**

**Motivo:** O E2E completo de saque PIX exige que o cliente receba **sucesso (200)** ao solicitar o saque via `POST /api/withdraw/request`. Nesta execução, a criação retornou **"Erro ao registrar saque"** (status 5xx) na primeira tentativa e **409** na segunda. Embora o histórico mostre um saque em estado **pendente** (possível efeito colateral de tentativa anterior ou de passo interno), o fluxo E2E do ponto de vista do cliente **não** foi concluído com sucesso. Recomenda-se corrigir o tratamento de erro no backend para que, quando o saque for efetivamente registrado, a resposta seja 200 com `data` do saque, e investigar a causa do "Erro ao registrar saque" quando ocorrer.

---

*Relatório gerado em 2026-03-04. Sem alteração de código, Fly, secrets ou banco.*
