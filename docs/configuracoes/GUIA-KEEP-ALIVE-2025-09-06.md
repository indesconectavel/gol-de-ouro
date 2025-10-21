# 🚀 GUIA COMPLETO - KEEP-ALIVE BACKEND
## Data: 06/09/2025

---

## 📋 **VISÃO GERAL**

O sistema de keep-alive foi implementado para evitar que o backend hospedado no Render entre em modo sleep após 15 minutos de inatividade. O sistema faz ping automático na rota `/api/health` a cada 5 minutos.

---

## 🛠️ **COMPONENTES IMPLEMENTADOS**

### ✅ **1. Rota de Health (`/api/health`)**
- **URL:** `https://goldeouro-backend.onrender.com/api/health`
- **Método:** GET
- **Resposta:** JSON com status detalhado
- **Tempo de resposta:** < 100ms

### ✅ **2. Scripts de Keep-Alive**
- **`keep-alive.js`** - Versão simples
- **`keep-alive-advanced.js`** - Versão avançada com configurações
- **`keep-alive-config.js`** - Configurações por ambiente

### ✅ **3. Scripts NPM**
- **`npm run keep-alive`** - Versão simples
- **`npm run keep-alive:prod`** - Produção (5 min)
- **`npm run keep-alive:local`** - Local (2 min)
- **`npm run keep-alive:test`** - Teste (1 min)

### ✅ **4. Scripts PowerShell**
- **`start-keepalive.ps1`** - Interface amigável para Windows

---

## 🚀 **COMO USAR**

### **Opção 1: NPM Scripts (Recomendado)**

```bash
# Produção (5 minutos entre pings)
npm run keep-alive:prod

# Desenvolvimento local (2 minutos entre pings)
npm run keep-alive:local

# Teste (1 minuto entre pings)
npm run keep-alive:test

# Versão simples
npm run keep-alive
```

### **Opção 2: PowerShell (Windows)**

```powershell
# Produção
.\start-keepalive.ps1 prod

# Local
.\start-keepalive.ps1 local

# Ajuda
.\start-keepalive.ps1 -Help
```

### **Opção 3: Node.js Direto**

```bash
# Produção
NODE_ENV=production node keep-alive-advanced.js

# Local
NODE_ENV=local node keep-alive-advanced.js

# Versão simples
node keep-alive.js
```

---

## ⚙️ **CONFIGURAÇÕES**

### **Ambiente de Produção:**
- **Intervalo:** 5 minutos
- **Timeout:** 30 segundos
- **Tentativas:** 3
- **Delay entre tentativas:** 30 segundos

### **Ambiente Local:**
- **Intervalo:** 2 minutos
- **Timeout:** 10 segundos
- **Tentativas:** 2
- **Delay entre tentativas:** 15 segundos

### **Ambiente de Teste:**
- **Intervalo:** 1 minuto
- **Timeout:** 15 segundos
- **Tentativas:** 1
- **Delay entre tentativas:** 10 segundos

---

## 📊 **MONITORAMENTO**

### **Logs Estruturados:**
```json
{
  "timestamp": "2025-09-06T03:45:00.000Z",
  "level": "INFO",
  "message": "Ping bem-sucedido",
  "environment": "production",
  "duration": "245ms",
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "rss": 73,
    "heapUsed": 10,
    "heapTotal": 11,
    "heapPercent": 91
  },
  "successRate": 100
}
```

### **Estatísticas:**
- Total de pings realizados
- Taxa de sucesso
- Tempo de resposta médio
- Uso de memória do backend
- Uptime do backend

---

## 🔧 **OPÇÕES DE EXECUÇÃO**

### **1. Execução Local (Recomendado para Desenvolvimento)**
```bash
# Terminal 1: Backend
npm run server:render

# Terminal 2: Keep-alive
npm run keep-alive:local
```

### **2. Execução em VPS/Servidor**
```bash
# Instalar PM2 para gerenciamento de processos
npm install -g pm2

# Executar keep-alive em background
pm2 start keep-alive-advanced.js --name "goldeouro-keepalive" --env production

# Ver logs
pm2 logs goldeouro-keepalive

# Parar
pm2 stop goldeouro-keepalive
```

### **3. Execução com Cron Job (Linux/Mac)**
```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada 5 minutos)
*/5 * * * * cd /path/to/goldeouro-backend && npm run keep-alive:prod
```

### **4. Execução com Task Scheduler (Windows)**
1. Abrir Task Scheduler
2. Criar tarefa básica
3. Configurar para executar a cada 5 minutos
4. Ação: `powershell -File "C:\path\to\start-keepalive.ps1" prod`

---

## 🚨 **TRATAMENTO DE ERROS**

### **Cenários de Erro:**
1. **Backend offline:** Tentativas automáticas com delay
2. **Timeout:** Nova tentativa após delay
3. **Erro de rede:** Retry com backoff
4. **Máximo de tentativas:** Aguarda próximo ciclo

### **Logs de Erro:**
```json
{
  "timestamp": "2025-09-06T03:45:00.000Z",
  "level": "ERROR",
  "message": "Erro no ping",
  "error": "Request timeout após 30000ms",
  "consecutiveFailures": 2,
  "totalFailures": 5
}
```

---

## 📈 **MÉTRICAS E ESTATÍSTICAS**

### **Estatísticas em Tempo Real:**
- **Tempo ativo:** Quanto tempo o keep-alive está rodando
- **Total de pings:** Número total de tentativas
- **Taxa de sucesso:** Percentual de pings bem-sucedidos
- **Último ping:** Timestamp do último ping bem-sucedido
- **Falhas consecutivas:** Número de falhas seguidas

### **Health Check do Backend:**
- **Status:** healthy/unhealthy
- **Uptime:** Tempo que o backend está rodando
- **Memória:** RSS, Heap usado, Heap total, Percentual
- **Versão:** Versão da API
- **Ambiente:** production/development

---

## 🔒 **SEGURANÇA E BOAS PRÁTICAS**

### **Headers de Segurança:**
- **User-Agent:** Identificação do keep-alive
- **Accept:** Apenas JSON
- **Connection:** keep-alive para eficiência

### **Rate Limiting:**
- **Intervalo mínimo:** 1 minuto entre pings
- **Timeout configurável:** Evita requisições longas
- **Retry limitado:** Evita spam em caso de erro

### **Monitoramento:**
- **Logs estruturados:** Facilita análise
- **Métricas detalhadas:** Acompanhamento de performance
- **Alertas configuráveis:** Notificação de problemas

---

## 🎯 **RECOMENDAÇÕES DE USO**

### **Para Desenvolvimento:**
- Use `npm run keep-alive:local`
- Execute em terminal separado
- Monitore logs para debug

### **Para Produção:**
- Use `npm run keep-alive:prod`
- Execute em VPS ou servidor dedicado
- Configure PM2 para gerenciamento
- Monitore logs regularmente

### **Para Teste:**
- Use `npm run keep-alive:test`
- Intervalo de 1 minuto para testes rápidos
- Verifique conectividade antes de usar

---

## 🏆 **BENEFÍCIOS IMPLEMENTADOS**

### ✅ **Evita Sleep do Render:**
- Backend sempre ativo
- Resposta rápida para usuários
- Sem cold start

### ✅ **Monitoramento Contínuo:**
- Health check automático
- Métricas de performance
- Alertas de problemas

### ✅ **Configuração Flexível:**
- Diferentes ambientes
- Intervalos configuráveis
- Timeouts ajustáveis

### ✅ **Robustez:**
- Tratamento de erros
- Retry automático
- Logs detalhados

---

## 📞 **SUPORTE E TROUBLESHOOTING**

### **Problemas Comuns:**

1. **"Backend não responde"**
   - Verificar se o backend está rodando
   - Testar URL manualmente
   - Verificar logs do Render

2. **"Muitas falhas consecutivas"**
   - Verificar conectividade de rede
   - Aumentar timeout se necessário
   - Verificar logs de erro

3. **"Script não inicia"**
   - Verificar se Node.js está instalado
   - Verificar se os arquivos existem
   - Verificar permissões de execução

### **Comandos de Diagnóstico:**
```bash
# Testar conectividade
curl https://goldeouro-backend.onrender.com/api/health

# Verificar logs do backend
# Acessar dashboard do Render

# Testar keep-alive localmente
npm run keep-alive:test
```

---

**Guia criado em:** 06/09/2025  
**Versão:** 1.0.0  
**Sistema:** Gol de Ouro - Keep-Alive  
**Status:** ✅ **IMPLEMENTADO E FUNCIONAL**
