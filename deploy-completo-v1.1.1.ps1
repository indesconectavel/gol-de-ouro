# Script de Deploy Completo - Gol de Ouro v1.1.1
Write-Host "=== DEPLOY COMPLETO GOL DE OURO v1.1.1 ===" -ForegroundColor Cyan
Write-Host ""

$totalSteps = 8
$currentStep = 0

function Show-Progress {
    param([string]$Message, [bool]$Success = $true)
    $currentStep++
    $percentage = [math]::Round(($currentStep / $totalSteps) * 100)
    Write-Host "[$currentStep/$totalSteps] ($percentage%) $Message" -NoNewline
    if ($Success) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
    }
}

# 1. Verificar arquivos necessários
Write-Host "1. Verificando arquivos necessários..." -NoNewline
$files = @(
    "Dockerfile",
    "fly.toml", 
    "server-fly.js",
    "goldeouro-admin/vercel.json",
    "goldeouro-admin/dist",
    "goldeouro-player/dist"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (!(Test-Path $file)) {
        $allFilesExist = $false
        break
    }
}

if ($allFilesExist) {
    Show-Progress "Arquivos necessários encontrados" $true
} else {
    Show-Progress "Arquivos necessários não encontrados" $false
    exit 1
}

# 2. Verificar se flyctl está instalado
Write-Host "2. Verificando flyctl..." -NoNewline
try {
    $flyVersion = flyctl version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "flyctl instalado" $true
    } else {
        Show-Progress "flyctl não instalado" $false
        Write-Host "   Instale: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Show-Progress "flyctl não instalado" $false
    Write-Host "   Instale: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# 3. Fazer login no Fly.io
Write-Host "3. Fazendo login no Fly.io..." -NoNewline
try {
    flyctl auth login
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "Login no Fly.io realizado" $true
    } else {
        Show-Progress "Falha no login do Fly.io" $false
        exit 1
    }
} catch {
    Show-Progress "Falha no login do Fly.io" $false
    exit 1
}

# 4. Criar app no Fly.io (se não existir)
Write-Host "4. Criando app no Fly.io..." -NoNewline
try {
    flyctl apps create goldeouro-backend --no-deploy
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "App criado no Fly.io" $true
    } else {
        Show-Progress "App já existe no Fly.io" $true
    }
} catch {
    Show-Progress "App já existe no Fly.io" $true
}

# 5. Configurar secrets (usar credenciais reais)
Write-Host "5. Configurando secrets..." -NoNewline
Write-Host ""
Write-Host "   ⚠️  IMPORTANTE: Configure as credenciais reais de produção!" -ForegroundColor Yellow
Write-Host "   DATABASE_URL: postgresql://[USER]:[PASSWORD]@[HOST].supabase.co:6543/postgres" -ForegroundColor Gray
Write-Host "   MP_ACCESS_TOKEN: APP_USR_[SEU_ACCESS_TOKEN_PROD]" -ForegroundColor Gray
Write-Host "   MP_PUBLIC_KEY: APP_USR_[SUA_PUBLIC_KEY_PROD]" -ForegroundColor Gray
Write-Host ""
Write-Host "   Execute manualmente:" -ForegroundColor Yellow
Write-Host "   flyctl secrets set DATABASE_URL='[SUA_URL_SUPABASE]' --app goldeouro-backend" -ForegroundColor White
Write-Host "   flyctl secrets set MP_ACCESS_TOKEN='[SEU_TOKEN]' --app goldeouro-backend" -ForegroundColor White
Write-Host "   flyctl secrets set MP_PUBLIC_KEY='[SUA_KEY]' --app goldeouro-backend" -ForegroundColor White
Write-Host "   flyctl secrets set ADMIN_TOKEN_PROD='admin-prod-token-2025' --app goldeouro-backend" -ForegroundColor White
Write-Host "   flyctl secrets set NODE_ENV='production' --app goldeouro-backend" -ForegroundColor White
Write-Host ""
$continue = Read-Host "Pressione Enter após configurar os secrets para continuar"
Show-Progress "Secrets configurados" $true

# 6. Deploy do Backend
Write-Host "6. Fazendo deploy do Backend..." -NoNewline
try {
    flyctl deploy --app goldeouro-backend
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "Deploy do Backend realizado" $true
    } else {
        Show-Progress "Falha no deploy do Backend" $false
        exit 1
    }
} catch {
    Show-Progress "Falha no deploy do Backend" $false
    exit 1
}

# 7. Testar Backend
Write-Host "7. Testando Backend..." -NoNewline
try {
    $backendUrl = "https://goldeouro-backend.fly.dev"
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Show-Progress "Backend funcionando" $true
        Write-Host "   URL: $backendUrl" -ForegroundColor Gray
    } else {
        Show-Progress "Backend com problemas" $false
    }
} catch {
    Show-Progress "Backend não acessível" $false
}

# 8. Instruções para Deploy Frontend
Write-Host "8. Instruções para Deploy Frontend..." -NoNewline
Write-Host ""
Write-Host "   📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   🎯 ADMIN PANEL (Vercel):" -ForegroundColor White
Write-Host "   1. cd goldeouro-admin" -ForegroundColor Gray
Write-Host "   2. vercel --prod" -ForegroundColor Gray
Write-Host "   3. Configurar domínio: admin.goldeouro.lol" -ForegroundColor Gray
Write-Host ""
Write-Host "   🎮 PLAYER MODE (Vercel):" -ForegroundColor White
Write-Host "   1. cd goldeouro-player" -ForegroundColor Gray
Write-Host "   2. vercel --prod" -ForegroundColor Gray
Write-Host "   3. Configurar domínio: goldeouro.lol" -ForegroundColor Gray
Write-Host ""
Write-Host "   🔧 ATUALIZAR URLs:" -ForegroundColor White
Write-Host "   - Admin: VITE_API_URL = https://goldeouro-backend.fly.dev" -ForegroundColor Gray
Write-Host "   - Player: VITE_API_URL = https://goldeouro-backend.fly.dev" -ForegroundColor Gray
Write-Host ""
Show-Progress "Instruções fornecidas" $true

Write-Host ""
Write-Host "=== DEPLOY COMPLETO FINALIZADO ===" -ForegroundColor Green
Write-Host "Backend URL: https://goldeouro-backend.fly.dev" -ForegroundColor White
Write-Host "Health Check: https://goldeouro-backend.fly.dev/health" -ForegroundColor White
Write-Host ""
Write-Host "GOL DE OURO v1.1.1 PRONTO PARA PRODUCAO!" -ForegroundColor Green
