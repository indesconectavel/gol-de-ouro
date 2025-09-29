# Guia de Configuração Mercado Pago - Gol de Ouro v1.1.1

## 🔧 CONFIGURAÇÃO DO WEBHOOK

### 1. No Painel do Mercado Pago
1. Acessar [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Selecionar aplicação
3. Ir em "Notificações" > "Webhooks"
4. Adicionar webhook:
   - **URL:** `https://goldeouro-backend-v2.fly.dev/webhook/mercadopago`
   - **Eventos:** `payment`, `plan`
   - **Versão:** v1

### 2. Configurar Variáveis de Ambiente
```bash
# Adicionar ao Fly.io
flyctl secrets set MP_ACCESS_TOKEN="<access_token>" --app goldeouro-backend-v2
flyctl secrets set MP_PUBLIC_KEY="<public_key>" --app goldeouro-backend-v2
flyctl secrets set MP_WEBHOOK_SECRET="<webhook_secret>" --app goldeouro-backend-v2
```

## 💰 LIMITES E VALORES

### Valores Permitidos
- **Mínimo:** R$ 1,00
- **Máximo:** R$ 500,00
- **Moeda:** BRL (Real Brasileiro)

### Tipos de Pagamento
- **PIX:** Instantâneo
- **Cartão:** Processamento imediato
- **Boleto:** Até 3 dias úteis

## 🔄 MAPEAMENTO DE STATUS

### Mercado Pago → Sistema
```
pending → pending
approved → completed
rejected → failed
cancelled → cancelled
refunded → refunded
```

### Webhook Events
- **payment:** Atualiza status da transação
- **plan:** Processa assinaturas (se aplicável)

## 🧪 TESTE E2E

### 1. Executar Teste
```bash
# Usar arquivo scripts/mp-e2e-test.http
# Substituir <API_URL> pela URL real
# Executar no VS Code com REST Client
```

### 2. Verificar Resultados
- [ ] Cobrança criada com sucesso
- [ ] Webhook processado
- [ ] Status atualizado no banco
- [ ] Idempotência funcionando

## 🔐 SEGURANÇA

### 1. Verificação de Assinatura
- Webhook verifica assinatura X-Signature
- Usar chave secreta do webhook
- Rejeitar requisições inválidas

### 2. Idempotência
- Tabela `mp_events` previne processamento duplo
- Eventos são identificados por `type_id`
- Logs de processamento mantidos

## 📊 MONITORAMENTO

### 1. Logs do Webhook
```bash
# Ver logs em tempo real
flyctl logs --app goldeouro-backend-v2

# Filtrar webhooks
flyctl logs --app goldeouro-backend-v2 | grep webhook
```

### 2. Métricas Importantes
- Taxa de sucesso dos webhooks
- Tempo de processamento
- Erros de idempotência
- Falhas de assinatura

## 🚨 TROUBLESHOOTING

### Webhook não recebido
- Verificar se a URL está acessível
- Confirmar se o SSL está válido
- Testar com ngrok para desenvolvimento

### Status não atualizado
- Verificar logs do webhook
- Confirmar se a assinatura está correta
- Verificar se o evento foi processado

### Erro de idempotência
- Verificar se o evento já foi processado
- Limpar tabela `mp_events` se necessário
- Verificar logs de processamento

## ✅ CHECKLIST FINAL

- [ ] Webhook configurado no MP
- [ ] Variáveis de ambiente definidas
- [ ] Teste E2E executado com sucesso
- [ ] Idempotência funcionando
- [ ] Logs de monitoramento ativos
- [ ] Tratamento de erros implementado
- [ ] Segurança de assinatura ativa
