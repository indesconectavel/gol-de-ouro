# 💰 API de Pagamentos PIX - Gol de Ouro

## 📋 Visão Geral

Sistema de pagamentos PIX integrado com Mercado Pago para recarga de saldo dos usuários do jogo Gol de Ouro.

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890abcdef-12345678-90abcdef1234567890abcdef12345678-12345678
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### Atualização do Banco de Dados

```bash
npm run db:update
```

## 🚀 Endpoints da API

### 1. Criar Pagamento PIX

**POST** `/api/payments/pix/criar`

Cria um novo pagamento PIX para recarga de saldo.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Body
```json
{
  "user_id": 1,
  "amount": 50.00,
  "description": "Recarga de saldo"
}
```

#### Response (201)
```json
{
  "success": true,
  "message": "Pagamento PIX criado com sucesso",
  "data": {
    "payment_id": 1,
    "mercado_pago_id": "1234567890",
    "amount": 50.00,
    "status": "pending",
    "pix_code": "00020126580014br.gov.bcb.pix...",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expires_at": "2025-01-02T15:30:00.000Z",
    "payment_url": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1234567890"
  }
}
```

### 2. Consultar Status do Pagamento

**GET** `/api/payments/pix/status/:payment_id`

Consulta o status atual de um pagamento PIX.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "payment_id": 1,
    "mercado_pago_id": "1234567890",
    "amount": 50.00,
    "status": "approved",
    "created_at": "2025-01-02T15:00:00.000Z",
    "expires_at": "2025-01-02T15:30:00.000Z",
    "paid_at": "2025-01-02T15:15:00.000Z"
  }
}
```

### 3. Listar Pagamentos do Usuário

**GET** `/api/payments/pix/usuario/:user_id`

Lista todos os pagamentos de um usuário específico.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
- `limit` (opcional): Número de resultados por página (padrão: 10)
- `offset` (opcional): Número de resultados para pular (padrão: 0)

#### Response (200)
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 1,
        "user_id": 1,
        "mercado_pago_id": "1234567890",
        "amount": 50.00,
        "status": "approved",
        "created_at": "2025-01-02T15:00:00.000Z",
        "paid_at": "2025-01-02T15:15:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 4. Webhook do Mercado Pago

**POST** `/api/payments/webhook`

Endpoint para receber notificações do Mercado Pago sobre mudanças de status dos pagamentos.

#### Body (enviado pelo Mercado Pago)
```json
{
  "id": "1234567890",
  "live_mode": true,
  "type": "payment",
  "date_created": "2025-01-02T15:00:00.000Z",
  "data": {
    "id": "1234567890"
  }
}
```

#### Response (200)
```json
{
  "message": "Webhook processado com sucesso"
}
```

### 5. Listar Todos os Pagamentos (Admin)

**GET** `/api/payments/admin/todos`

Lista todos os pagamentos do sistema (apenas para administradores).

#### Headers
```
Authorization: Bearer <jwt_token>
x-admin-token: <admin_token>
```

#### Query Parameters
- `status` (opcional): Filtrar por status (pending, approved, rejected, cancelled)
- `limit` (opcional): Número de resultados por página (padrão: 20)
- `offset` (opcional): Número de resultados para pular (padrão: 0)

#### Response (200)
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 1,
        "user_id": 1,
        "mercado_pago_id": "1234567890",
        "amount": 50.00,
        "status": "approved",
        "created_at": "2025-01-02T15:00:00.000Z",
        "paid_at": "2025-01-02T15:15:00.000Z",
        "user_name": "João Silva",
        "user_email": "joao@email.com"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

## 📊 Status dos Pagamentos

| Status | Descrição |
|--------|-----------|
| `pending` | Pagamento criado, aguardando pagamento |
| `approved` | Pagamento aprovado e saldo creditado |
| `rejected` | Pagamento rejeitado |
| `cancelled` | Pagamento cancelado |
| `refunded` | Pagamento estornado |

## 🔄 Fluxo de Pagamento

1. **Criação**: Usuário solicita recarga via API
2. **PIX Gerado**: Sistema cria preferência no Mercado Pago
3. **Pagamento**: Usuário paga via PIX
4. **Webhook**: Mercado Pago notifica o sistema
5. **Confirmação**: Sistema credita saldo automaticamente

## 🛡️ Segurança

- Todas as rotas (exceto webhook) requerem autenticação JWT
- Webhook validado pelo Mercado Pago
- Transações atômicas no banco de dados
- Rate limiting aplicado
- Logs detalhados para auditoria

## 🧪 Testes

### Teste de Criação de Pagamento
```bash
curl -X POST http://localhost:3000/api/payments/pix/criar \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 25.00,
    "description": "Teste de recarga"
  }'
```

### Teste de Consulta de Status
```bash
curl -X GET http://localhost:3000/api/payments/pix/status/1 \
  -H "Authorization: Bearer <jwt_token>"
```

## 📝 Logs

O sistema registra logs detalhados para:
- Criação de pagamentos
- Processamento de webhooks
- Erros de integração
- Transações de banco de dados

## 🚨 Tratamento de Erros

### Erros Comuns

| Código | Erro | Descrição |
|--------|------|-----------|
| 400 | Dados inválidos | Parâmetros obrigatórios ausentes |
| 401 | Não autorizado | Token JWT inválido ou ausente |
| 403 | Acesso negado | Token admin inválido |
| 404 | Não encontrado | Pagamento ou usuário não existe |
| 500 | Erro interno | Erro no servidor ou integração |

### Exemplo de Resposta de Erro
```json
{
  "error": "Dados inválidos",
  "message": "user_id e amount são obrigatórios e amount deve ser maior que 0"
}
```

## 🔧 Configuração do Webhook no Mercado Pago

1. Acesse o painel do Mercado Pago
2. Vá em "Desenvolvimento" > "Webhooks"
3. Configure a URL: `https://goldeouro-backend.onrender.com/api/payments/webhook`
4. Selecione os eventos: `payment`
5. Salve a configuração

## 📈 Monitoramento

- Use o endpoint `/api/payments/admin/todos` para monitorar pagamentos
- Verifique logs do servidor para erros
- Monitore webhooks não processados na tabela `mercado_pago_webhooks`
