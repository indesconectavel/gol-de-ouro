# Script de Configuração Completa de Produção - Gol de Ouro v1.2.0
Write-Host "Configuracao completa de producao..." -ForegroundColor Cyan

# 1. Verificar status atual
Write-Host "1. Verificando status atual..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Instalar dependências do banco
Write-Host "2. Instalando dependencias do banco..." -NoNewline
try {
    npm install @supabase/supabase-js jsonwebtoken bcryptjs
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERRO" -ForegroundColor Red
}

# 3. Atualizar router com banco real
Write-Host "3. Atualizando router com banco real..." -NoNewline
try {
    Copy-Item "router-database.js" "router.js" -Force
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERRO" -ForegroundColor Red
}

# 4. Criar arquivo de configuração de ambiente
Write-Host "4. Criando arquivo de configuração..." -NoNewline
try {
    $envContent = @"
# Configuração de Produção - Gol de Ouro v1.2.0
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-jwt-secret-key-2025
JWT_EXPIRES_IN=24h

# Admin
ADMIN_TOKEN=admin-prod-token-2025

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=your-access-token
PIX_WEBHOOK_URL=https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook

# CORS
CORS_ORIGIN=https://goldeouro.lol,https://admin.goldeouro.lol
"@
    $envContent | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERRO" -ForegroundColor Red
}

# 5. Testar endpoints
Write-Host "5. Testando endpoints..." -NoNewline
try {
    $endpoints = @(
        "https://goldeouro-backend-v2.fly.dev/health",
        "https://goldeouro.lol",
        "https://admin.goldeouro.lol"
    )
    
    $success = 0
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                $success++
            }
        } catch {
            # Ignorar erros de teste
        }
    }
    
    if ($success -eq $endpoints.Count) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " PARCIAL: $success/$($endpoints.Count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ERRO" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuracao de producao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASSOS CRITICOS:" -ForegroundColor Yellow
Write-Host "1. Configurar Supabase (criar projeto e executar schema.sql)" -ForegroundColor White
Write-Host "2. Configurar Mercado Pago (criar aplicacao e obter token)" -ForegroundColor White
Write-Host "3. Deploy no Fly.io (com variaveis de ambiente)" -ForegroundColor White
Write-Host "4. Deploy no Vercel (frontends)" -ForegroundColor White
Write-Host "5. Testar funcionalidades completas" -ForegroundColor White
Write-Host ""
Write-Host "APOS CONFIGURACAO:" -ForegroundColor Yellow
Write-Host "6. Implementar PWA (manifest.json, service worker)" -ForegroundColor White
Write-Host "7. Gerar APK (Capacitor + Android Studio)" -ForegroundColor White
Write-Host "8. Integrar WhatsApp (Business API)" -ForegroundColor White
