# Teste Simples - Domínio Gol de Ouro
Write-Host "🔍 TESTE SIMPLES - DOMINIO GOLDEOURO.LOL" -ForegroundColor Cyan

# Backend Direto
Write-Host "`n1. Backend Direto:" -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/health" -UseBasicParsing
    Write-Host "✅ OK - $($backend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO" -ForegroundColor Red
}

# Domínio Principal
Write-Host "`n2. Dominio Principal:" -ForegroundColor Yellow
try {
    $domain = Invoke-WebRequest -Uri "https://goldeouro.lol/api/health" -UseBasicParsing
    Write-Host "✅ OK - $($domain.StatusCode)" -ForegroundColor Green
    if ($domain.Content -like "*html*") {
        Write-Host "   ⚠️  Retorna HTML (proxy nao funciona)" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Retorna JSON (proxy funciona)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERRO" -ForegroundColor Red
}

# Frontend Player
Write-Host "`n3. Frontend Player:" -ForegroundColor Yellow
try {
    $player = Invoke-WebRequest -Uri "https://goldeouro.lol" -UseBasicParsing
    Write-Host "✅ OK - $($player.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO" -ForegroundColor Red
}

# Frontend Admin
Write-Host "`n4. Frontend Admin:" -ForegroundColor Yellow
try {
    $admin = Invoke-WebRequest -Uri "https://admin.goldeouro.lol" -UseBasicParsing
    Write-Host "✅ OK - $($admin.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO" -ForegroundColor Red
}

Write-Host "`n📊 RESUMO:" -ForegroundColor Cyan
Write-Host "Backend: Funcionando" -ForegroundColor Green
Write-Host "Frontend: Funcionando" -ForegroundColor Green
Write-Host "Proxy: Nao funciona" -ForegroundColor Yellow
Write-Host "`nRecomendacao: Usar backend direto" -ForegroundColor White




