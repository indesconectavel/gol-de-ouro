# Script de Deploy Otimizado - Gol de Ouro v1.1.1
Write-Host "=== DEPLOY OTIMIZADO GOL DE OURO v1.1.1 ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar arquivos essenciais
Write-Host "1. Verificando arquivos essenciais..." -NoNewline
$essentialFiles = @("Dockerfile", "fly.toml", "server-fly.js", ".dockerignore")
$allEssentialExist = $true
foreach ($file in $essentialFiles) {
    if (!(Test-Path $file)) {
        $allEssentialExist = $false
        break
    }
}
if ($allEssentialExist) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Arquivos essenciais não encontrados" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar flyctl
Write-Host "2. Verificando flyctl..." -NoNewline
try {
    flyctl version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        Write-Host "   Instale: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Instale: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# 3. Login no Fly.io
Write-Host "3. Login no Fly.io..." -NoNewline
try {
    flyctl auth whoami 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " JA LOGADO" -ForegroundColor Yellow
    } else {
        flyctl auth login
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK" -ForegroundColor Green
        } else {
            Write-Host " FALHA" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 4. Criar app (se não existir)
Write-Host "4. Criando app..." -NoNewline
try {
    flyctl apps create goldeouro-backend-v2
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " JA EXISTE" -ForegroundColor Yellow
}

# 5. Configurar secrets
Write-Host "5. Configurando secrets..." -NoNewline
Write-Host ""
Write-Host "IMPORTANTE: Configure as credenciais reais!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute os comandos abaixo:" -ForegroundColor White
Write-Host "flyctl secrets set DATABASE_URL='[SUA_URL_SUPABASE]' --app goldeouro-backend-v2" -ForegroundColor Gray
Write-Host "flyctl secrets set MP_ACCESS_TOKEN='[SEU_TOKEN]' --app goldeouro-backend-v2" -ForegroundColor Gray
Write-Host "flyctl secrets set MP_PUBLIC_KEY='[SUA_KEY]' --app goldeouro-backend-v2" -ForegroundColor Gray
Write-Host "flyctl secrets set ADMIN_TOKEN_PROD='admin-prod-token-2025' --app goldeouro-backend-v2" -ForegroundColor Gray
Write-Host "flyctl secrets set NODE_ENV='production' --app goldeouro-backend-v2" -ForegroundColor Gray
Write-Host ""
$continue = Read-Host "Pressione Enter apos configurar os secrets"
Write-Host " OK" -ForegroundColor Green

# 6. Deploy otimizado
Write-Host "6. Fazendo deploy otimizado..." -NoNewline
try {
    flyctl deploy --app goldeouro-backend-v2 --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        Write-Host "   Verifique os logs acima" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 7. Testar deploy
Write-Host "7. Testando deploy..." -NoNewline
try {
    Start-Sleep -Seconds 10
    $response = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "   URL: https://goldeouro-backend-v2.fly.dev" -ForegroundColor Gray
    } else {
        Write-Host " FALHA (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DEPLOY CONCLUIDO ===" -ForegroundColor Green
Write-Host "Backend: https://goldeouro-backend-v2.fly.dev" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Atualizar URLs nos frontends" -ForegroundColor White
Write-Host "2. Deploy Admin Panel no Vercel" -ForegroundColor White
Write-Host "3. Deploy Player Mode no Vercel" -ForegroundColor White
Write-Host "4. Configurar dominios" -ForegroundColor White
