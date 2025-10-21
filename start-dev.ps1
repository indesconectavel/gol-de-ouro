# Script de Inicialização Completa - Gol de Ouro (Windows PowerShell)
# Desenvolvimento Local vs Produção

Write-Host "GOL DE OURO - INICIALIZACAO COMPLETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Função para verificar se uma porta está em uso
function Test-Port {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        Write-Host "Porta $Port está em uso" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Porta $Port está livre" -ForegroundColor Red
        return $false
    }
}

# Função para iniciar backend
function Start-Backend {
    Write-Host "Iniciando Backend..." -ForegroundColor Yellow
    
    # Verificar se arquivo .env existe
    if (-not (Test-Path ".env")) {
        Write-Host "Copiando arquivo de ambiente..." -ForegroundColor Cyan
        Copy-Item "env.development" ".env"
    }
    
    # Instalar dependências se necessário
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependências do backend..." -ForegroundColor Cyan
        npm install
    }
    
    # Iniciar backend
    Write-Host "Iniciando servidor backend na porta 8080..." -ForegroundColor Green
    Start-Process -FilePath "node" -ArgumentList "server-fly.js" -WindowStyle Hidden
    
    # Aguardar backend iniciar
    Start-Sleep -Seconds 3
    
    # Verificar se backend está rodando
    if (Test-Port -Port 8080) {
        Write-Host "Backend iniciado com sucesso!" -ForegroundColor Green
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
            Write-Host "Status: $($response.StatusCode)" -ForegroundColor Cyan
        }
        catch {
            Write-Host "Backend iniciado mas não respondeu ao health check" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Erro ao iniciar backend" -ForegroundColor Red
        return $false
    }
}

# Função para iniciar frontend player
function Start-Player {
    Write-Host "Iniciando Frontend Player..." -ForegroundColor Yellow
    
    Set-Location "goldeouro-player"
    
    # Instalar dependências se necessário
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependências do player..." -ForegroundColor Cyan
        npm install
    }
    
    # Iniciar player
    Write-Host "Iniciando player na porta 5173..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
    
    # Aguardar player iniciar
    Start-Sleep -Seconds 5
    
    # Verificar se player está rodando
    if (Test-Port -Port 5173) {
        Write-Host "Player iniciado com sucesso!" -ForegroundColor Green
        Write-Host "Acesse: http://localhost:5173" -ForegroundColor Cyan
    }
    else {
        Write-Host "Erro ao iniciar player" -ForegroundColor Red
        return $false
    }
    
    Set-Location ".."
}

# Função para mostrar status
function Show-Status {
    Write-Host ""
    Write-Host "STATUS DOS SERVICOS:" -ForegroundColor Blue
    Write-Host "=======================" -ForegroundColor Blue
    
    if (Test-Port -Port 8080) {
        Write-Host "Backend: http://localhost:8080" -ForegroundColor Green
    }
    else {
        Write-Host "Backend: Não está rodando" -ForegroundColor Red
    }
    
    if (Test-Port -Port 5173) {
        Write-Host "Player: http://localhost:5173" -ForegroundColor Green
    }
    else {
        Write-Host "Player: Não está rodando" -ForegroundColor Red
    }
}

# Função principal
function Main {
    param([string]$Command)
    
    switch ($Command) {
        "backend" {
            Start-Backend
        }
        "player" {
            Start-Player
        }
        "status" {
            Show-Status
        }
        "" {
            Write-Host "Iniciando todos os serviços..." -ForegroundColor Green
            Start-Backend
            Start-Player
            Show-Status
        }
        default {
            Write-Host "Comando inválido: $Command" -ForegroundColor Red
        }
    }
}

# Executar função principal
Main $args[0]
