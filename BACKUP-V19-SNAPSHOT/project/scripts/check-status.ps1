# Script para verificar status completo do sistema
Write-Host "=== VERIFICACAO COMPLETA DO SISTEMA ===" -ForegroundColor Cyan

# Verificar backend local
Write-Host "`n1. BACKEND LOCAL:" -ForegroundColor Yellow
try {
    $localBackend = Invoke-RestMethod -Uri "http://localhost:3000/api/public/dashboard" -Method GET -TimeoutSec 5
    Write-Host "   Status: ONLINE" -ForegroundColor Green
    Write-Host "   Dados: $($localBackend.users) usuarios, $($localBackend.games.total) jogos" -ForegroundColor Green
} catch {
    Write-Host "   Status: OFFLINE" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar admin local
Write-Host "`n2. ADMIN LOCAL:" -ForegroundColor Yellow
$admin5173 = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet
$admin5174 = Test-NetConnection -ComputerName localhost -Port 5174 -InformationLevel Quiet

if ($admin5173) {
    Write-Host "   Status: ONLINE (porta 5173)" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
} elseif ($admin5174) {
    Write-Host "   Status: ONLINE (porta 5174)" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5174" -ForegroundColor Cyan
} else {
    Write-Host "   Status: OFFLINE" -ForegroundColor Red
}

# Verificar backend producao
Write-Host "`n3. BACKEND PRODUCAO:" -ForegroundColor Yellow
try {
    $prodBackend = Invoke-RestMethod -Uri "https://goldeouro-backend.onrender.com/api/public/dashboard" -Method GET -TimeoutSec 10
    Write-Host "   Status: ONLINE" -ForegroundColor Green
    Write-Host "   Dados: $($prodBackend.users) usuarios, $($prodBackend.games.total) jogos" -ForegroundColor Green
} catch {
    Write-Host "   Status: OFFLINE" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar admin producao
Write-Host "`n4. ADMIN PRODUCAO:" -ForegroundColor Yellow
try {
    $prodAdmin = Invoke-WebRequest -Uri "https://goldeouro-admin.vercel.app" -Method GET -TimeoutSec 10
    if ($prodAdmin.StatusCode -eq 200) {
        Write-Host "   Status: ONLINE" -ForegroundColor Green
        Write-Host "   URL: https://goldeouro-admin.vercel.app" -ForegroundColor Cyan
    } else {
        Write-Host "   Status: ERRO ($($prodAdmin.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "   Status: OFFLINE" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== RESUMO ===" -ForegroundColor Cyan
Write-Host "Backend Local: $(if ($localBackend) { 'ONLINE' } else { 'OFFLINE' })" -ForegroundColor $(if ($localBackend) { 'Green' } else { 'Red' })
Write-Host "Admin Local: $(if ($admin5173 -or $admin5174) { 'ONLINE' } else { 'OFFLINE' })" -ForegroundColor $(if ($admin5173 -or $admin5174) { 'Green' } else { 'Red' })
Write-Host "Backend Producao: $(if ($prodBackend) { 'ONLINE' } else { 'OFFLINE' })" -ForegroundColor $(if ($prodBackend) { 'Green' } else { 'Red' })
Write-Host "Admin Producao: $(if ($prodAdmin -and $prodAdmin.StatusCode -eq 200) { 'ONLINE' } else { 'OFFLINE' })" -ForegroundColor $(if ($prodAdmin -and $prodAdmin.StatusCode -eq 200) { 'Green' } else { 'Red' })
