# Script para executar próximos passos após autenticação do GitHub CLI
# Executa: powershell -ExecutionPolicy Bypass -File scripts/executar-proximos-passos-apos-auth.ps1

Write-Host "🚀 Executando próximos passos após autenticação..." -ForegroundColor Cyan

$ghPath = "C:\Program Files\GitHub CLI"
$env:PATH += ";$ghPath"

# Verificar autenticação
Write-Host "`n🔍 Verificando autenticação..." -ForegroundColor Cyan
$authStatus = & "$ghPath\gh.exe" auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ GitHub CLI não está autenticado" -ForegroundColor Red
    Write-Host "💡 Execute: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI autenticado!" -ForegroundColor Green
Write-Host $authStatus -ForegroundColor White

# Verificar PR #18
Write-Host "`n📋 Verificando PR #18..." -ForegroundColor Cyan
$prInfo = & "$ghPath\gh.exe" pr view 18 --json state,merged,mergeable,reviewDecision,statusCheckRollup,url 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PR #18 encontrado:" -ForegroundColor Green
    Write-Host $prInfo -ForegroundColor White
    
    # Parse JSON (simples)
    $prJson = $prInfo | ConvertFrom-Json
    
    Write-Host "`n📊 Status do PR:" -ForegroundColor Cyan
    Write-Host "   Estado: $($prJson.state)" -ForegroundColor White
    Write-Host "   Mergeado: $($prJson.merged)" -ForegroundColor White
    Write-Host "   Mergeável: $($prJson.mergeable)" -ForegroundColor White
    Write-Host "   URL: $($prJson.url)" -ForegroundColor White
    
    if ($prJson.merged) {
        Write-Host "`n✅ PR já foi mergeado!" -ForegroundColor Green
    } elseif ($prJson.mergeable) {
        Write-Host "`n💡 PR está pronto para merge" -ForegroundColor Yellow
        Write-Host "   Execute: gh pr merge 18 --merge" -ForegroundColor Yellow
    } else {
        Write-Host "`n⚠️  PR não está mergeável" -ForegroundColor Yellow
        Write-Host "   Verifique os status checks" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Erro ao verificar PR #18: $prInfo" -ForegroundColor Yellow
}

# Verificar status checks
Write-Host "`n🔍 Verificando status checks do PR #18..." -ForegroundColor Cyan
$checks = & "$ghPath\gh.exe" pr checks 18 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $checks -ForegroundColor White
} else {
    Write-Host "⚠️  Erro ao verificar status checks: $checks" -ForegroundColor Yellow
}

# Mostrar informações do repositório
Write-Host "`n📊 Informações do repositório..." -ForegroundColor Cyan
$repoInfo = & "$ghPath\gh.exe" repo view --json name,description,url 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $repoInfo -ForegroundColor White
}

Write-Host "`n✅ Verificação concluída!" -ForegroundColor Green

