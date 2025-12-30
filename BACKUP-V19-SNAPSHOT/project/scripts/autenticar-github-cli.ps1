# Script para autenticar GitHub CLI
# Executa: powershell -ExecutionPolicy Bypass -File scripts/autenticar-github-cli.ps1

Write-Host "🔐 Autenticando GitHub CLI..." -ForegroundColor Cyan

$ghPath = "C:\Program Files\GitHub CLI"

# Verificar se GitHub CLI está instalado
if (-not (Test-Path "$ghPath\gh.exe")) {
    Write-Host "❌ GitHub CLI não encontrado em: $ghPath" -ForegroundColor Red
    Write-Host "💡 Instale via: winget install GitHub.cli" -ForegroundColor Yellow
    exit 1
}

# Adicionar ao PATH da sessão atual
$env:PATH += ";$ghPath"

# Verificar status atual
Write-Host "`n🔍 Verificando status atual..." -ForegroundColor Cyan
$authStatus = & "$ghPath\gh.exe" auth status 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHub CLI já está autenticado!" -ForegroundColor Green
    Write-Host $authStatus -ForegroundColor White
    exit 0
}

Write-Host "⚠️  GitHub CLI não está autenticado" -ForegroundColor Yellow
Write-Host "`n🚀 Iniciando processo de autenticação..." -ForegroundColor Cyan
Write-Host "`n📋 Instruções:" -ForegroundColor Yellow
Write-Host "1. Uma janela do navegador será aberta" -ForegroundColor White
Write-Host "2. Faça login na sua conta GitHub" -ForegroundColor White
Write-Host "3. Autorize o GitHub CLI" -ForegroundColor White
Write-Host "4. Copie o código de autorização" -ForegroundColor White
Write-Host "5. Cole o código aqui quando solicitado" -ForegroundColor White
Write-Host "`nPressione Enter para continuar..." -ForegroundColor Yellow
Read-Host

# Iniciar autenticação via web browser
Write-Host "`n🌐 Abrindo navegador para autenticação..." -ForegroundColor Cyan
& "$ghPath\gh.exe" auth login --web

# Verificar autenticação após login
Write-Host "`n🔍 Verificando autenticação..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
$newAuthStatus = & "$ghPath\gh.exe" auth status 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHub CLI autenticado com sucesso!" -ForegroundColor Green
    Write-Host $newAuthStatus -ForegroundColor White
} else {
    Write-Host "⚠️  Autenticação não concluída" -ForegroundColor Yellow
    Write-Host "💡 Execute manualmente: gh auth login" -ForegroundColor Yellow
}

