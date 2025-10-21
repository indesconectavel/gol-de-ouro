# 🔧 Configuração do Mercado Pago - PIX

## 📋 Pré-requisitos

1. Conta no Mercado Pago (https://www.mercadopago.com.br)
2. Aplicação criada no painel de desenvolvedores
3. Access Token gerado

## 🚀 Passo a Passo

### 1. Criar Aplicação no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login na sua conta
3. Clique em "Criar aplicação"
4. Preencha os dados:
   - **Nome**: Gol de Ouro
   - **Descrição**: Sistema de pagamentos PIX para jogo
   - **Categoria**: Outros
5. Clique em "Criar aplicação"

### 2. Obter Access Token

1. Na sua aplicação, vá para "Credenciais"
2. Copie o **Access Token** (começa com `APP_USR-`)
3. Adicione ao arquivo `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu_token_aqui
```

### 3. Configurar Webhook

1. No painel da aplicação, vá para "Webhooks"
2. Clique em "Configurar webhook"
3. **URL**: `https://goldeouro-backend.onrender.com/api/payments/webhook`
4. **Eventos**: Selecione apenas `payment`
5. Clique em "Salvar"

### 4. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
# Mercado Pago - PIX
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu_token_aqui
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### 5. Atualizar Banco de Dados

Execute o comando para criar as tabelas necessárias:

```bash
npm run db:update
```

## 🧪 Testando a Integração

### 1. Teste de Criação de Pagamento

```bash
curl -X POST http://localhost:3000/api/payments/pix/criar \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 10.00,
    "description": "Teste de recarga"
  }'
```

### 2. Verificar Resposta

Você deve receber uma resposta com:
- `payment_id`: ID interno do pagamento
- `pix_code`: Código PIX para pagamento
- `qr_code`: QR Code em base64
- `payment_url`: URL para pagamento

### 3. Testar Pagamento

1. Use o `pix_code` ou `qr_code` para fazer um pagamento de teste
2. O webhook deve ser chamado automaticamente
3. O saldo do usuário deve ser creditado

## 🔍 Verificações

### 1. Logs do Servidor

Verifique se aparecem logs como:
```
✅ Servidor rodando na porta 3000
🔄 Webhook recebido: { type: 'payment', data: { id: '1234567890' } }
✅ Pagamento 1 processado com sucesso. Saldo adicionado: R$ 10.00
```

### 2. Banco de Dados

Verifique se as tabelas foram criadas:
```sql
SELECT * FROM pix_payments;
SELECT * FROM mercado_pago_webhooks;
```

### 3. Saldo do Usuário

Verifique se o saldo foi creditado:
```sql
SELECT id, name, balance FROM users WHERE id = 1;
```

## 🚨 Solução de Problemas

### Erro: "Access Token inválido"
- Verifique se o token está correto
- Confirme se a aplicação está ativa no Mercado Pago

### Erro: "Webhook não recebido"
- Verifique se a URL está correta
- Confirme se o webhook está ativo no painel
- Teste com ngrok em desenvolvimento

### Erro: "Pagamento não processado"
- Verifique logs do servidor
- Confirme se as tabelas foram criadas
- Verifique se o usuário existe

## 📱 Ambiente de Produção

### 1. Deploy no Render

1. Adicione as variáveis de ambiente no painel do Render
2. Faça o deploy do código
3. Configure o webhook com a URL de produção

### 2. Monitoramento

- Use `/api/payments/admin/todos` para monitorar pagamentos
- Verifique logs do Render
- Monitore webhooks não processados

## 🔐 Segurança

- Nunca commite o Access Token
- Use HTTPS em produção
- Configure CORS adequadamente
- Monitore tentativas de acesso não autorizado

## 📞 Suporte

- Documentação Mercado Pago: https://www.mercadopago.com.br/developers
- Suporte técnico: https://www.mercadopago.com.br/developers/support
- Logs do sistema: Verifique sempre os logs do servidor
