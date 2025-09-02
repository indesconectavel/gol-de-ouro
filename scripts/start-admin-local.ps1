# Script para iniciar admin local
Write-Host "=== INICIANDO ADMIN LOCAL ===" -ForegroundColor Green

Write-Host "`n🔍 Verificando diretório do admin..." -ForegroundColor Yellow
$adminPath = "..\goldeouro-admin"
if (Test-Path $adminPath) {
    Write-Host "✅ Diretório encontrado: $adminPath" -ForegroundColor Green
} else {
    Write-Host "❌ Diretório não encontrado: $adminPath" -ForegroundColor Red
    Write-Host "   Verifique se o projeto admin está na pasta correta" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🛑 Parando processos Node existentes..." -ForegroundColor Yellow
try {
    Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*vite*"} | Stop-Process -Force
    Write-Host "✅ Processos Node parados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Nenhum processo Node encontrado" -ForegroundColor Yellow
}

Write-Host "`n🔌 Verificando portas..." -ForegroundColor Yellow
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue

if ($port5173) {
    Write-Host "⚠️ Porta 5173 em uso" -ForegroundColor Yellow
} else {
    Write-Host "✅ Porta 5173 livre" -ForegroundColor Green
}

if ($port5174) {
    Write-Host "⚠️ Porta 5174 em uso" -ForegroundColor Yellow
} else {
    Write-Host "✅ Porta 5174 livre" -ForegroundColor Green
}

Write-Host "`n📦 Instalando dependências..." -ForegroundColor Yellow
Set-Location $adminPath
try {
    npm install
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Iniciando admin local..." -ForegroundColor Yellow
try {
    Start-Process "npm" -ArgumentList "run", "dev" -WindowStyle Normal
    Write-Host "✅ Admin iniciado!" -ForegroundColor Green
    Write-Host "`n🌐 URLs disponíveis:" -ForegroundColor Cyan
    Write-Host "   - http://localhost:5173" -ForegroundColor White
    Write-Host "   - http://localhost:5174 (se 5173 estiver ocupada)" -ForegroundColor White
    Write-Host "`n⏳ Aguarde 30-60 segundos para o Vite inicializar completamente" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro ao iniciar admin: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Aguarde o Vite inicializar (30-60 segundos)" -ForegroundColor White
Write-Host "2. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "3. Se não funcionar, tente: http://localhost:5174" -ForegroundColor White
Write-Host "4. Teste o login com as credenciais do admin" -ForegroundColor White
