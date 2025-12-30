# Script para configurar GitHub CLI no PATH
# Executa: powershell -ExecutionPolicy Bypass -File scripts/configurar-github-cli-path.ps1

Write-Host "🔧 Configurando GitHub CLI no PATH..." -ForegroundColor Cyan

# Caminho padrão do GitHub CLI
$ghPath = "C:\Program Files\GitHub CLI"

# Verificar se o GitHub CLI existe
if (Test-Path "$ghPath\gh.exe") {
    Write-Host "✅ GitHub CLI encontrado em: $ghPath" -ForegroundColor Green
    
    # Obter PATH atual do usuário
    $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
    
    # Verificar se já está no PATH
    if ($currentPath -like "*$ghPath*") {
        Write-Host "✅ GitHub CLI já está no PATH do usuário" -ForegroundColor Green
    } else {
        # Adicionar ao PATH do usuário
        $newPath = $currentPath + ";$ghPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
        Write-Host "✅ GitHub CLI adicionado ao PATH do usuário" -ForegroundColor Green
        Write-Host "⚠️  Feche e reabra o terminal para aplicar as mudanças" -ForegroundColor Yellow
    }
    
    # Adicionar ao PATH da sessão atual
    $env:PATH += ";$ghPath"
    Write-Host "✅ GitHub CLI adicionado ao PATH da sessão atual" -ForegroundColor Green
    
    # Verificar se funciona
    Write-Host "`n🔍 Verificando GitHub CLI..." -ForegroundColor Cyan
    try {
        $version = & "$ghPath\gh.exe" --version 2>&1
        Write-Host "✅ GitHub CLI funcionando:" -ForegroundColor Green
        Write-Host $version -ForegroundColor White
        
        # Verificar autenticação
        Write-Host "`n🔍 Verificando autenticação..." -ForegroundColor Cyan
        $authStatus = & "$ghPath\gh.exe" auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ GitHub CLI autenticado" -ForegroundColor Green
            Write-Host $authStatus -ForegroundColor White
        } else {
            Write-Host "⚠️  GitHub CLI não autenticado" -ForegroundColor Yellow
            Write-Host "💡 Execute: gh auth login" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erro ao executar GitHub CLI: $_" -ForegroundColor Red
    }
} else {
    Write-Host "❌ GitHub CLI não encontrado em: $ghPath" -ForegroundColor Red
    Write-Host "💡 Instale via: winget install GitHub.cli" -ForegroundColor Yellow
}

Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green

