# Script para testar sistema completo após configuração
Write-Host "=== TESTE COMPLETO DO SISTEMA ===" -ForegroundColor Green

Write-Host "`n🔍 VERIFICANDO ARQUIVO .ENV..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado!" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Execute: .\scripts\create-env.ps1" -ForegroundColor Yellow
}

Write-Host "`n🧪 TESTANDO BACKEND LOCAL..." -ForegroundColor Yellow
try {
    $localResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/public/dashboard" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend local funcionando!" -ForegroundColor Green
    Write-Host "   Usuários: $($localResponse.users)" -ForegroundColor White
    Write-Host "   Jogos: $($localResponse.games.total)" -ForegroundColor White
} catch {
    Write-Host "❌ Backend local offline: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Execute: node server.js" -ForegroundColor Yellow
}

Write-Host "`n🌐 TESTANDO BACKEND PRODUÇÃO..." -ForegroundColor Yellow
try {
    $prodResponse = Invoke-RestMethod -Uri "https://goldeouro-backend.onrender.com/api/public/dashboard" -Method GET -TimeoutSec 15
    Write-Host "✅ Backend produção funcionando!" -ForegroundColor Green
    Write-Host "   Usuários: $($prodResponse.users)" -ForegroundColor White
    Write-Host "   Jogos: $($prodResponse.games.total)" -ForegroundColor White
} catch {
    Write-Host "❌ Backend produção offline: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Configure variáveis no Render.com primeiro!" -ForegroundColor Yellow
}

Write-Host "`n🔐 TESTANDO AUTENTICAÇÃO ADMIN..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-RestMethod -Uri "https://goldeouro-backend.onrender.com/admin/lista-usuarios" -Method GET -Headers @{"x-admin-token"="adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d"} -TimeoutSec 15
    Write-Host "✅ Autenticação admin funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Autenticação admin falhou: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 RESUMO FINAL:" -ForegroundColor Cyan
Write-Host "1. Arquivo .env: $(if (Test-Path ".env") { '✅ OK' } else { '❌ FALTANDO' })" -ForegroundColor White
Write-Host "2. Backend local: $(try { Invoke-RestMethod -Uri "http://localhost:3000/api/public/dashboard" -Method GET -TimeoutSec 5 | Out-Null; '✅ OK' } catch { '❌ OFFLINE' })" -ForegroundColor White
Write-Host "3. Backend produção: $(try { Invoke-RestMethod -Uri "https://goldeouro-backend.onrender.com/api/public/dashboard" -Method GET -TimeoutSec 5 | Out-Null; '✅ OK' } catch { '❌ OFFLINE' })" -ForegroundColor White

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Configure variáveis no Render.com" -ForegroundColor White
Write-Host "2. Aguarde redeploy (2-3 minutos)" -ForegroundColor White
Write-Host "3. Execute este script novamente" -ForegroundColor White
Write-Host "4. Teste admin panel em https://goldeouro-admin.vercel.app" -ForegroundColor White
