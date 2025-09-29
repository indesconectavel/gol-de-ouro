# Script de Deploy para Fly.io - Gol de Ouro v1.1.1
Write-Host "=== DEPLOY GOL DE OURO v1.1.1 PARA FLY.IO ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se flyctl está instalado
Write-Host "1. Verificando flyctl..." -NoNewline
try {
    $flyVersion = flyctl version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "   Versão: $flyVersion" -ForegroundColor Gray
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        Write-Host "   Instale o flyctl: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Instale o flyctl: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# 2. Fazer login no Fly.io
Write-Host "2. Fazendo login no Fly.io..." -NoNewline
try {
    flyctl auth login
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 3. Criar app (se não existir)
Write-Host "3. Criando app no Fly.io..." -NoNewline
try {
    flyctl apps create goldeouro-backend --no-deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " JÁ EXISTE" -ForegroundColor Yellow
    }
} catch {
    Write-Host " JÁ EXISTE" -ForegroundColor Yellow
}

# 4. Configurar secrets (usar credenciais de produção reais)
Write-Host "4. Configurando secrets..." -NoNewline
try {
    # DATABASE_URL (Supabase pooler)
    flyctl secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST].supabase.co:6543/postgres" --app goldeouro-backend
    
    # Mercado Pago (produção)
    flyctl secrets set MP_ACCESS_TOKEN="[SEU_ACCESS_TOKEN_PROD]" --app goldeouro-backend
    flyctl secrets set MP_PUBLIC_KEY="[SUA_PUBLIC_KEY_PROD]" --app goldeouro-backend
    
    # Admin token
    flyctl secrets set ADMIN_TOKEN_PROD="admin-prod-token-2025" --app goldeouro-backend
    
    # Ambiente
    flyctl secrets set NODE_ENV="production" --app goldeouro-backend
    
    Write-Host " OK" -ForegroundColor Green
    Write-Host "   ⚠️  IMPORTANTE: Configure as credenciais reais de produção!" -ForegroundColor Yellow
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Configure manualmente: flyctl secrets set KEY=value --app goldeouro-backend" -ForegroundColor Yellow
}

# 5. Deploy
Write-Host "5. Fazendo deploy..." -NoNewline
try {
    flyctl deploy --app goldeouro-backend
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 6. Verificar status
Write-Host "6. Verificando status..." -NoNewline
try {
    flyctl status --app goldeouro-backend
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " FALHA" -ForegroundColor Red
}

# 7. Testar health check
Write-Host "7. Testando health check..." -NoNewline
try {
    $appUrl = "https://goldeouro-backend.fly.dev"
    $response = Invoke-WebRequest -Uri "$appUrl/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "   URL: $appUrl" -ForegroundColor Gray
    } else {
        Write-Host " FALHA (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " FALHA (Erro: $($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DEPLOY CONCLUÍDO ===" -ForegroundColor Green
Write-Host "URL do Backend: https://goldeouro-backend.fly.dev" -ForegroundColor White
Write-Host "Health Check: https://goldeouro-backend.fly.dev/health" -ForegroundColor White
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Atualizar VITE_API_URL no Admin Panel para: https://goldeouro-backend.fly.dev" -ForegroundColor White
Write-Host "2. Atualizar VITE_API_URL no Player Mode para: https://goldeouro-backend.fly.dev" -ForegroundColor White
Write-Host "3. Testar funcionalidades completas" -ForegroundColor White
