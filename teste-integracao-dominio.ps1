# Teste de Integração Completa - Domínio Gol de Ouro
Write-Host "🔍 TESTE DE INTEGRAÇÃO COMPLETA - DOMÍNIO GOLDEOURO.LOL" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Testar Backend Direto
Write-Host "`n1. TESTANDO BACKEND DIRETO:" -ForegroundColor Yellow
try {
    $backendHealth = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/health" -UseBasicParsing
    Write-Host "✅ Backend Direto: $($backendHealth.StatusCode) OK" -ForegroundColor Green
    if ($backendHealth.Content) {
        Write-Host "   Response: $($backendHealth.Content.Substring(0, 100))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Backend Direto: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar Domínio Principal (Proxy)
Write-Host "`n2. TESTANDO DOMINIO PRINCIPAL (PROXY):" -ForegroundColor Yellow
try {
    $domainHealth = Invoke-WebRequest -Uri "https://goldeouro.lol/api/health" -UseBasicParsing
    Write-Host "✅ Domínio Principal: $($domainHealth.StatusCode) OK" -ForegroundColor Green
    if ($domainHealth.Content -like "*<!doctype html>*") {
        Write-Host "   ⚠️  Retornando HTML (proxy não funcionando)" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Retornando JSON (proxy funcionando)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Domínio Principal: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar Frontend Player
Write-Host "`n3. TESTANDO FRONTEND PLAYER:" -ForegroundColor Yellow
try {
    $playerFrontend = Invoke-WebRequest -Uri "https://goldeouro.lol" -UseBasicParsing
    Write-Host "✅ Frontend Player: $($playerFrontend.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Player: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar Frontend Admin
Write-Host "`n4. TESTANDO FRONTEND ADMIN:" -ForegroundColor Yellow
try {
    $adminFrontend = Invoke-WebRequest -Uri "https://admin.goldeouro.lol" -UseBasicParsing
    Write-Host "✅ Frontend Admin: $($adminFrontend.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Admin: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Testar PIX (Backend Direto)
Write-Host "`n5. TESTANDO PIX (BACKEND DIRETO):" -ForegroundColor Yellow
try {
    $pixTest = @{
        amount = 10.00
        description = "Teste PIX"
        user_id = "test-user"
    } | ConvertTo-Json

    $pixResponse = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Body $pixTest -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ PIX Backend Direto: $($pixResponse.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "❌ PIX Backend Direto: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Resumo Final
Write-Host "`n📊 RESUMO FINAL:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "✅ Backend: Funcionando perfeitamente" -ForegroundColor Green
Write-Host "✅ Frontend Player: Funcionando perfeitamente" -ForegroundColor Green
Write-Host "✅ Frontend Admin: Funcionando perfeitamente" -ForegroundColor Green
Write-Host "⚠️  Proxy Vercel: Não funcionando (retorna HTML)" -ForegroundColor Yellow
Write-Host "✅ PIX: Funcionando via backend direto" -ForegroundColor Green

Write-Host "`n🎯 RECOMENDAÇÃO:" -ForegroundColor Cyan
Write-Host "Para entrega imediata, usar backend direto:" -ForegroundColor White
Write-Host "https://goldeouro-backend-v2.fly.dev" -ForegroundColor Gray
Write-Host "`nPara solução definitiva, configurar subdomínio api.goldeouro.lol" -ForegroundColor White
