# 🚀 SISTEMA DE MONITORAMENTO - GOL DE OURO v4.5

## 📋 **CONFIGURAÇÃO RÁPIDA**

### **1. Instalar Dependências**
```bash
npm install axios
```

### **2. Executar Monitoramento**
```bash
# Monitoramento contínuo (recomendado)
node sistema-monitoramento.js

# Ou em background (Linux/Mac)
nohup node sistema-monitoramento.js > monitoring.log 2>&1 &

# Ou com PM2 (recomendado para produção)
pm2 start sistema-monitoramento.js --name "goldeouro-monitor"
```

### **3. Verificar Logs**
```bash
# Logs de monitoramento
tail -f monitoring.log

# Alertas
tail -f alerts.log

# Estatísticas
cat monitoring-stats.json
```

---

## 📊 **FUNCIONALIDADES**

### **✅ Monitoramento Automático**
- **Intervalo:** 5 minutos
- **Serviços:** Backend, Frontend Player, Frontend Admin
- **Métricas:** Tempo de resposta, status, uptime

### **🚨 Sistema de Alertas**
- **Taxa de erro alta** (>10%)
- **Serviços offline**
- **Tempo de resposta lento** (>5s)
- **Logs de alerta** em `alerts.log`

### **📈 Relatórios**
- **Uptime** em tempo real
- **Estatísticas** detalhadas
- **Histórico** de verificações
- **Status** de cada serviço

---

## 🔧 **CONFIGURAÇÕES**

### **Arquivo: `sistema-monitoramento.js`**
```javascript
const MONITOR_CONFIG = {
    interval: 300000,        // 5 minutos
    logFile: 'monitoring.log',
    alertThresholds: {
        responseTime: 5000,  // 5 segundos
        errorRate: 0.1,      // 10%
        uptime: 0.99         // 99%
    }
};
```

### **Personalizar:**
- **Intervalo:** Altere `interval` (em milissegundos)
- **Thresholds:** Ajuste os limites de alerta
- **Serviços:** Adicione novos serviços no array

---

## 📱 **INTEGRAÇÃO COM NOTIFICAÇÕES**

### **Email (Futuro)**
```javascript
// Adicionar no método checkAlerts()
const nodemailer = require('nodemailer');
// Configurar envio de email
```

### **Discord/Slack (Futuro)**
```javascript
// Adicionar webhook
const webhook = 'https://discord.com/api/webhooks/...';
// Enviar notificação
```

### **Telegram (Futuro)**
```javascript
// Bot do Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
// Enviar mensagem
```

---

## 🎯 **STATUS ATUAL**

### **✅ Implementado:**
- Monitoramento básico
- Sistema de alertas
- Logs estruturados
- Estatísticas em tempo real

### **🔄 Próximos Passos:**
- Integração com notificações
- Dashboard web
- Métricas avançadas
- Integração com Supabase

---

## 📞 **SUPORTE**

**Em caso de problemas:**
1. Verificar logs: `tail -f monitoring.log`
2. Verificar alertas: `tail -f alerts.log`
3. Verificar estatísticas: `cat monitoring-stats.json`
4. Reiniciar: `pm2 restart goldeouro-monitor`

**Sistema pronto para produção!** 🚀

