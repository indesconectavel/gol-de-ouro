# 🚀 Analytics e Monitoramento - Guia Rápido

## Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Adicione ao seu arquivo `.env`:
```env
LOG_LEVEL=info
ADMIN_TOKEN=seu_token_admin_aqui
MONITORING_ENABLED=true
ANALYTICS_ENABLED=true
PROMETHEUS_ENABLED=true
```

### 3. Iniciar o Servidor
```bash
npm start
```

### 4. Acessar o Dashboard
- **Dashboard de Monitoramento**: http://localhost:3000/monitoring
- **Métricas Prometheus**: http://localhost:3000/api/analytics/metrics
- **Status do Sistema**: http://localhost:3000/api/analytics/status

## 📊 Endpoints Principais

### Dashboard e Monitoramento
- `GET /monitoring` - Interface web do dashboard
- `GET /api/monitoring/realtime` - Dados em tempo real
- `GET /api/analytics/dashboard` - Métricas do dashboard (requer admin token)

### Analytics e Relatórios
- `GET /api/analytics/reports/daily` - Relatório diário
- `GET /api/analytics/events` - Histórico de eventos
- `GET /api/analytics/users/stats` - Estatísticas de usuários
- `GET /api/analytics/games/stats` - Estatísticas de jogos

### Configuração e Saúde
- `GET /api/analytics/health` - Status de saúde do sistema
- `GET /api/analytics/alerts` - Alertas ativos
- `GET /api/analytics/thresholds` - Thresholds configurados

## 🔧 Configuração de Alertas

### Thresholds Padrão
- **CPU**: 80%
- **Memória**: 85%
- **Tempo de Resposta**: 2000ms
- **Taxa de Erro**: 5%

### Atualizar Thresholds
```bash
curl -X PUT http://localhost:3000/api/analytics/thresholds \
  -H "Content-Type: application/json" \
  -H "x-admin-token: seu_token_admin" \
  -d '{"type": "cpu", "value": 90}'
```

## 📈 Métricas Disponíveis

### Métricas de Negócio
- Total de jogos criados
- Total de apostas realizadas
- Usuários ativos
- Receita total
- Taxa de conversão

### Métricas de Performance
- Tempo de resposta HTTP
- Uso de CPU e memória
- Duração de consultas ao banco
- Taxa de erro

### Métricas de Sistema
- Uptime do servidor
- Conexões WebSocket
- Status de saúde geral

## 📝 Logs

### Arquivos de Log
- `logs/application.log` - Logs gerais
- `logs/error.log` - Logs de erro
- `logs/analytics.log` - Eventos de analytics
- `logs/performance.log` - Métricas de performance
- `logs/security.log` - Eventos de segurança

### Níveis de Log
- `error` - Erros críticos
- `warn` - Avisos
- `info` - Informações gerais
- `debug` - Informações de debug

## 🚨 Alertas

### Tipos de Alertas
- **Critical**: Problemas que requerem ação imediata
- **Warning**: Problemas que devem ser monitorados
- **Info**: Informações importantes

### Configuração de Notificações
Os alertas são logados no arquivo `logs/security.log` e podem ser integrados com:
- Slack
- Email
- Webhooks
- Sistemas de monitoramento externos

## 🔍 Troubleshooting

### Problemas Comuns

#### Dashboard não carrega
1. Verifique se o servidor está rodando
2. Confirme se a porta 3000 está disponível
3. Verifique os logs em `logs/application.log`

#### Métricas não aparecem
1. Verifique se `ANALYTICS_ENABLED=true` no .env
2. Confirme se o token admin está correto
3. Verifique os logs em `logs/analytics.log`

#### Alertas não funcionam
1. Verifique se `MONITORING_ENABLED=true` no .env
2. Confirme os thresholds configurados
3. Verifique os logs em `logs/security.log`

### Comandos Úteis

#### Ver logs em tempo real
```bash
# Windows PowerShell
Get-Content logs/application.log -Wait

# Linux/Mac
tail -f logs/application.log
```

#### Verificar status do sistema
```bash
curl http://localhost:3000/api/analytics/status
```

#### Obter métricas do Prometheus
```bash
curl http://localhost:3000/api/analytics/metrics
```

## 📚 Documentação Completa

Para documentação detalhada, consulte:
- `RELATORIO-ETAPA5-ANALYTICS.md` - Relatório completo
- `src/utils/logger.js` - Sistema de logging
- `src/utils/metrics.js` - Sistema de métricas
- `src/utils/analytics.js` - Coletor de analytics
- `src/utils/monitoring.js` - Monitor do sistema

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs em `logs/`
2. Consulte a documentação completa
3. Verifique as configurações no arquivo `.env`
4. Execute o script de configuração: `node scripts/setup-analytics.js`
