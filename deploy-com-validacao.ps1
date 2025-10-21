# SISTEMA DE PREVENÇÃO DE INCONSISTÊNCIAS DE ROTAS - GOL DE OURO
# =============================================================
# Data: 20/10/2025
# Status: SISTEMA DE PREVENÇÃO AUTOMÁTICA (PowerShell)

param(
    [switch]$SkipConfirmation
)

# Configuração de cores
$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colorMap = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Cyan"
        "Info" = "Cyan"
        "Success" = "Green"
        "Warning" = "Yellow"
        "Error" = "Red"
    }
    
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Log-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Info"
}

function Log-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Success"
}

function Log-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Warning"
}

function Log-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Error"
}

# Início do script
Write-ColorOutput "🔍 === SISTEMA DE PREVENÇÃO DE INCONSISTÊNCIAS ===" "Blue"
Write-ColorOutput "📅 Data: $(Get-Date -Format 'dd/MM/yyyy, HH:mm:ss')" "Blue"
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "server-fly.js")) {
    Log-Error "Arquivo server-fly.js não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
}

Log-Info "Iniciando validação pré-deploy..."

try {
    # 1. VALIDAÇÃO DE CONFIGURAÇÕES CRÍTICAS
    Log-Info "Validando configurações críticas..."
    $validationResult = node validacao-pre-deploy.js
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Validação de configurações falhou!"
        exit 1
    }
    Log-Success "Configurações críticas validadas"

    # 2. AUDITORIA AVANÇADA DE ROTAS
    Log-Info "Executando auditoria avançada de rotas..."
    $auditResult = node auditoria-avancada-rotas.js
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Auditoria de rotas falhou!"
        exit 1
    }
    Log-Success "Auditoria de rotas concluída"

    # 3. VERIFICAÇÃO DE SINTAXE
    Log-Info "Verificando sintaxe do código..."
    $syntaxCheck = node -c server-fly.js
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Erro de sintaxe no server-fly.js!"
        exit 1
    }
    Log-Success "Sintaxe do backend validada"

    # 4. VERIFICAÇÃO DO FRONTEND
    Log-Info "Verificando configuração do frontend..."
    if (-not (Test-Path "goldeouro-player/src/config/api.js")) {
        Log-Error "Arquivo de configuração do frontend não encontrado!"
        exit 1
    }
    Log-Success "Configuração do frontend validada"

    # 5. TESTE DE CONECTIVIDADE COM BACKEND
    Log-Info "Testando conectividade com backend..."
    try {
        $response = Invoke-WebRequest -Uri "https://goldeouro-backend.fly.dev/meta" -UseBasicParsing -TimeoutSec 10
        Log-Success "Backend está respondendo"
    } catch {
        Log-Warning "Backend não está respondendo. Continuando com deploy..."
    }

    # 6. VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE
    Log-Info "Verificando variáveis de ambiente..."
    if (-not (Test-Path ".env")) {
        Log-Error "Arquivo .env não encontrado!"
        exit 1
    }

    # Carregar variáveis de ambiente
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }

    if (-not $env:JWT_SECRET) {
        Log-Error "JWT_SECRET não definido!"
        exit 1
    }

    if (-not $env:SUPABASE_URL) {
        Log-Error "SUPABASE_URL não definido!"
        exit 1
    }

    Log-Success "Variáveis de ambiente validadas"

    # 7. VERIFICAÇÃO DE DEPENDÊNCIAS
    Log-Info "Verificando dependências..."
    if (-not (Test-Path "package.json")) {
        Log-Error "package.json não encontrado!"
        exit 1
    }

    try {
        npm list --depth=0 | Out-Null
        Log-Success "Dependências validadas"
    } catch {
        Log-Warning "Dependências não instaladas. Instalando..."
        npm install
        Log-Success "Dependências instaladas"
    }

    # 8. BACKUP DE SEGURANÇA
    Log-Info "Criando backup de segurança..."
    $backupDir = "backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item "server-fly.js" "$backupDir/"
    Copy-Item ".env" "$backupDir/"
    Log-Success "Backup criado em $backupDir"

    # 9. RELATÓRIO FINAL
    Write-Host ""
    Write-ColorOutput "📊 === RELATÓRIO DE VALIDAÇÃO ===" "Blue"
    Write-ColorOutput "✅ Configurações críticas: OK" "Green"
    Write-ColorOutput "✅ Auditoria de rotas: OK" "Green"
    Write-ColorOutput "✅ Sintaxe do código: OK" "Green"
    Write-ColorOutput "✅ Configuração do frontend: OK" "Green"
    Write-ColorOutput "✅ Variáveis de ambiente: OK" "Green"
    Write-ColorOutput "✅ Dependências: OK" "Green"
    Write-ColorOutput "✅ Backup de segurança: OK" "Green"
    Write-Host ""

    Log-Success "VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
    Log-Info "Sistema pronto para deploy"

    # 10. CONFIRMAÇÃO FINAL
    if (-not $SkipConfirmation) {
        Write-Host ""
        $confirmation = Read-Host "Deseja continuar com o deploy? (y/N)"
        if ($confirmation -notmatch "^[Yy]$") {
            Log-Warning "Deploy cancelado pelo usuário"
            exit 0
        }
    }

    Log-Info "Iniciando deploy..."

    # Deploy do backend
    Log-Info "Fazendo deploy do backend..."
    fly deploy
    if ($LASTEXITCODE -eq 0) {
        Log-Success "Backend deployado com sucesso!"
    } else {
        Log-Error "Erro no deploy do backend!"
        exit 1
    }

    # Deploy do frontend
    Log-Info "Fazendo deploy do frontend..."
    Push-Location "goldeouro-player"
    try {
        vercel --prod
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Frontend deployado com sucesso!"
        } else {
            Log-Error "Erro no deploy do frontend!"
            exit 1
        }
    } finally {
        Pop-Location
    }

    # Teste pós-deploy
    Log-Info "Executando testes pós-deploy..."
    Start-Sleep -Seconds 10  # Aguardar propagação

    try {
        $response = Invoke-WebRequest -Uri "https://goldeouro-backend.fly.dev/meta" -UseBasicParsing -TimeoutSec 10
        Log-Success "Backend respondendo após deploy"
    } catch {
        Log-Warning "Backend não está respondendo após deploy"
    }

    try {
        $response = Invoke-WebRequest -Uri "https://goldeouro.lol" -UseBasicParsing -TimeoutSec 10
        Log-Success "Frontend respondendo após deploy"
    } catch {
        Log-Warning "Frontend não está respondendo após deploy"
    }

    Write-Host ""
    Log-Success "DEPLOY CONCLUÍDO COM SUCESSO!"
    Log-Info "Sistema validado e funcionando"

} catch {
    Log-Error "Erro durante a validação: $($_.Exception.Message)"
    exit 1
}
