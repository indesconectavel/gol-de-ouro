#!/bin/bash
# Script de Inicialização Completa - Gol de Ouro
# Desenvolvimento Local vs Produção

echo "🚀 GOL DE OURO - INICIALIZAÇÃO COMPLETA"
echo "========================================"

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Porta $port está em uso"
        return 0
    else
        echo "❌ Porta $port está livre"
        return 1
    fi
}

# Função para iniciar backend
start_backend() {
    echo "🔧 Iniciando Backend..."
    
    # Verificar se arquivo .env existe
    if [ ! -f ".env" ]; then
        echo "📋 Copiando arquivo de ambiente..."
        cp env.development .env
    fi
    
    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências do backend..."
        npm install
    fi
    
    # Iniciar backend
    echo "🚀 Iniciando servidor backend na porta 8080..."
    node server-fly.js &
    BACKEND_PID=$!
    
    # Aguardar backend iniciar
    sleep 3
    
    # Verificar se backend está rodando
    if check_port 8080; then
        echo "✅ Backend iniciado com sucesso!"
        curl -s http://localhost:8080/health | head -1
    else
        echo "❌ Erro ao iniciar backend"
        return 1
    fi
}

# Função para iniciar frontend player
start_player() {
    echo "🎮 Iniciando Frontend Player..."
    
    cd goldeouro-player
    
    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências do player..."
        npm install
    fi
    
    # Iniciar player
    echo "🚀 Iniciando player na porta 5173..."
    npm run dev &
    PLAYER_PID=$!
    
    # Aguardar player iniciar
    sleep 5
    
    # Verificar se player está rodando
    if check_port 5173; then
        echo "✅ Player iniciado com sucesso!"
        echo "🌐 Acesse: http://localhost:5173"
    else
        echo "❌ Erro ao iniciar player"
        return 1
    fi
    
    cd ..
}

# Função para iniciar frontend admin
start_admin() {
    echo "👨‍💼 Iniciando Frontend Admin..."
    
    cd goldeouro-admin
    
    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências do admin..."
        npm install
    fi
    
    # Iniciar admin
    echo "🚀 Iniciando admin na porta 5174..."
    npm run dev &
    ADMIN_PID=$!
    
    # Aguardar admin iniciar
    sleep 5
    
    # Verificar se admin está rodando
    if check_port 5174; then
        echo "✅ Admin iniciado com sucesso!"
        echo "🌐 Acesse: http://localhost:5174"
    else
        echo "❌ Erro ao iniciar admin"
        return 1
    fi
    
    cd ..
}

# Função para mostrar status
show_status() {
    echo ""
    echo "📊 STATUS DOS SERVIÇOS:"
    echo "======================="
    
    if check_port 8080; then
        echo "✅ Backend: http://localhost:8080"
    else
        echo "❌ Backend: Não está rodando"
    fi
    
    if check_port 5173; then
        echo "✅ Player: http://localhost:5173"
    else
        echo "❌ Player: Não está rodando"
    fi
    
    if check_port 5174; then
        echo "✅ Admin: http://localhost:5174"
    else
        echo "❌ Admin: Não está rodando"
    fi
}

# Função para parar todos os serviços
stop_all() {
    echo "🛑 Parando todos os serviços..."
    
    # Parar processos Node.js
    pkill -f "node server-fly.js" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    
    echo "✅ Todos os serviços parados"
}

# Função para mostrar ajuda
show_help() {
    echo "📋 COMANDOS DISPONÍVEIS:"
    echo "======================="
    echo "  ./start-dev.sh          - Iniciar todos os serviços"
    echo "  ./start-dev.sh backend  - Iniciar apenas backend"
    echo "  ./start-dev.sh player   - Iniciar apenas player"
    echo "  ./start-dev.sh admin    - Iniciar apenas admin"
    echo "  ./start-dev.sh status   - Mostrar status"
    echo "  ./start-dev.sh stop     - Parar todos os serviços"
    echo "  ./start-dev.sh help     - Mostrar esta ajuda"
}

# Função principal
main() {
    case "$1" in
        "backend")
            start_backend
            ;;
        "player")
            start_player
            ;;
        "admin")
            start_admin
            ;;
        "status")
            show_status
            ;;
        "stop")
            stop_all
            ;;
        "help")
            show_help
            ;;
        "")
            echo "🚀 Iniciando todos os serviços..."
            start_backend
            start_player
            start_admin
            show_status
            ;;
        *)
            echo "❌ Comando inválido: $1"
            show_help
            ;;
    esac
}

# Executar função principal
main "$1"


