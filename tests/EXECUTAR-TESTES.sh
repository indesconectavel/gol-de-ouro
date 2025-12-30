#!/bin/bash
# Script para Executar Testes Automatizados
# FASE 2.5 - Testes Funcionais em Staging

echo "═══════════════════════════════════════════════════════"
echo "🧪 EXECUTANDO TESTES AUTOMATIZADOS - FASE 2.5"
echo "═══════════════════════════════════════════════════════"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js >= 18.0.0"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ requerida. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"
echo ""

# Verificar se dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Executar testes
echo "🚀 Iniciando execução dos testes..."
echo ""

node runner.js

EXIT_CODE=$?

echo ""
echo "═══════════════════════════════════════════════════════"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Testes concluídos com sucesso!"
    echo "📄 Relatório disponível em: tests/reports/latest-report.md"
else
    echo "❌ Alguns testes falharam. Verifique o relatório para detalhes."
    echo "📄 Relatório disponível em: tests/reports/latest-report.md"
fi

echo "═══════════════════════════════════════════════════════"

exit $EXIT_CODE

