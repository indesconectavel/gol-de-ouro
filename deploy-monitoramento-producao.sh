#!/bin/bash
# DEPLOY MONITORAMENTO PRODUÇÃO - GOL DE OURO v4.5
# ================================================
# Data: 19/10/2025
# Status: DEPLOY MONITORAMENTO EM PRODUÇÃO

echo "🚀 === DEPLOY MONITORAMENTO PRODUÇÃO - GOL DE OURO v4.5 ==="
echo "📅 Data: $(date)"
echo ""

# 1. Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# 2. Parar monitoramento anterior (se existir)
echo "🛑 Parando monitoramento anterior..."
pm2 stop goldeouro-monitor 2>/dev/null || true
pm2 delete goldeouro-monitor 2>/dev/null || true

# 3. Criar diretório de logs
echo "📁 Criando diretório de logs..."
mkdir -p logs
mkdir -p monitoring

# 4. Iniciar monitoramento com PM2
echo "🚀 Iniciando monitoramento em produção..."
pm2 start sistema-monitoramento.js \
    --name "goldeouro-monitor" \
    --log logs/monitoring.log \
    --error logs/monitoring-error.log \
    --out logs/monitoring-out.log \
    --time \
    --restart-delay 5000 \
    --max-restarts 10

# 5. Configurar PM2 para iniciar automaticamente
echo "⚙️ Configurando PM2 para iniciar automaticamente..."
pm2 startup
pm2 save

# 6. Verificar status
echo "📊 Verificando status do monitoramento..."
pm2 status goldeouro-monitor

# 7. Mostrar logs em tempo real (primeiros 10 segundos)
echo "📋 Logs do monitoramento (primeiros 10 segundos):"
timeout 10s pm2 logs goldeouro-monitor --lines 20 || true

echo ""
echo "✅ === MONITORAMENTO CONFIGURADO COM SUCESSO ==="
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "   Ver status: pm2 status goldeouro-monitor"
echo "   Ver logs: pm2 logs goldeouro-monitor"
echo "   Reiniciar: pm2 restart goldeouro-monitor"
echo "   Parar: pm2 stop goldeouro-monitor"
echo ""
echo "📁 ARQUIVOS DE LOG:"
echo "   Logs: logs/monitoring.log"
echo "   Alertas: alerts.log"
echo "   Estatísticas: monitoring-stats.json"
echo ""
echo "🎯 Monitoramento ativo e funcionando em produção!"

