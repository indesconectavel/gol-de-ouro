# Guia de Observabilidade - Gol de Ouro v1.1.1

## 📊 UPTIME MONITORING

### 1. UptimeRobot
1. Acessar [UptimeRobot](https://uptimerobot.com)
2. Criar conta gratuita
3. Adicionar monitor:
   - **URL:** `https://goldeouro-backend-v2.fly.dev/health`
   - **Tipo:** HTTP(s)
   - **Intervalo:** 1 minuto
   - **Timeout:** 30 segundos
   - **Regiões:** São Paulo, Rio de Janeiro

### 2. Configuração de Alertas
- **Email:** Notificar após 2 falhas consecutivas
- **SMS:** Notificar após 5 falhas consecutivas
- **Webhook:** Integrar com Slack/Discord (opcional)

## 📝 LOGS E MONITORAMENTO

### 1. Comandos Úteis do Fly.io
```bash
# Ver logs em tempo real
flyctl logs --app goldeouro-backend-v2

# Ver logs das últimas 2 horas
flyctl logs --app goldeouro-backend-v2 --since 2h

# Ver status da aplicação
flyctl status --app goldeouro-backend-v2

# Ver métricas de performance
flyctl metrics --app goldeouro-backend-v2
```

### 2. Logs Importantes
- **Health checks:** `/health` e `/readiness`
- **Webhooks:** Processamento do Mercado Pago
- **Erros:** 500, 503, timeouts
- **Rate limiting:** 429 (muitas requisições)

## 🔍 MONITORAMENTO DE PERFORMANCE

### 1. Métricas do Fly.io
- **CPU:** Uso de processamento
- **Memória:** Consumo de RAM
- **Rede:** Tráfego de entrada/saída
- **Latência:** Tempo de resposta

### 2. Alertas Recomendados
- **CPU > 80%** por mais de 5 minutos
- **Memória > 90%** por mais de 2 minutos
- **Latência > 2s** por mais de 1 minuto
- **Taxa de erro > 5%** por mais de 5 minutos

## 🚨 ALERTAS E NOTIFICAÇÕES

### 1. Configuração de Alertas
```bash
# Configurar webhook para alertas
flyctl secrets set ALERT_WEBHOOK_URL="<webhook_url>" --app goldeouro-backend-v2

# Configurar email para alertas
flyctl secrets set ALERT_EMAIL="admin@goldeouro.lol" --app goldeouro-backend-v2
```

### 2. Tipos de Alertas
- **Crítico:** Aplicação fora do ar
- **Alto:** Performance degradada
- **Médio:** Erros intermitentes
- **Baixo:** Avisos informativos

## 📈 DASHBOARD DE MONITORAMENTO

### 1. Métricas em Tempo Real
- Status da aplicação
- Taxa de sucesso das requisições
- Tempo de resposta médio
- Uso de recursos

### 2. Gráficos Importantes
- **Uptime:** % de tempo online
- **Response Time:** Latência das requisições
- **Error Rate:** % de erros
- **Throughput:** Requisições por minuto

## 🔧 MANUTENÇÃO PREVENTIVA

### 1. Verificações Diárias
- [ ] Status da aplicação
- [ ] Logs de erro
- [ ] Performance geral
- [ ] Uso de recursos

### 2. Verificações Semanais
- [ ] Análise de tendências
- [ ] Limpeza de logs antigos
- [ ] Atualização de dependências
- [ ] Backup do banco de dados

## 🚨 PROCEDIMENTOS DE EMERGÊNCIA

### 1. Aplicação Fora do Ar
```bash
# Verificar status
flyctl status --app goldeouro-backend-v2

# Ver logs de erro
flyctl logs --app goldeouro-backend-v2 --since 10m

# Restart da aplicação
flyctl restart --app goldeouro-backend-v2

# Rollback se necessário
flyctl releases rollback <version> --app goldeouro-backend-v2
```

### 2. Performance Degradada
```bash
# Ver métricas
flyctl metrics --app goldeouro-backend-v2

# Escalar recursos
flyctl scale count 2 --app goldeouro-backend-v2

# Verificar logs
flyctl logs --app goldeouro-backend-v2 --since 1h
```

## ✅ CHECKLIST DE OBSERVABILIDADE

- [ ] UptimeRobot configurado
- [ ] Alertas de email/SMS ativos
- [ ] Logs centralizados
- [ ] Métricas de performance
- [ ] Dashboard de monitoramento
- [ ] Procedimentos de emergência
- [ ] Manutenção preventiva
- [ ] Backup e recuperação
