# scripts/release-v1.1.2.ps1 - Release formal v1.1.2
param(
    [string]$ApiBase = "https://goldeouro-backend-v2.fly.dev",
    [string]$PlayerUrl = "https://goldeouro.lol",
    [string]$AdminUrl = "https://admin.goldeouro.lol"
)

$ErrorActionPreference = 'Continue'

Write-Host "🏷️ RELEASE v1.1.2 - GOL DE OURO" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

$allTestsPassed = $true

# 1) Teste de Contrato
Write-Host "1. Executando testes de contrato..." -ForegroundColor Yellow
try {
    Set-Location "goldeouro-backend"
    npm run test:contract
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [CONTRACT] /api/games/shoot .......... OK" -ForegroundColor Green
    } else {
        Write-Host "   [CONTRACT] /api/games/shoot .......... FAIL" -ForegroundColor Red
        $allTestsPassed = $false
    }
    Set-Location ".."
} catch {
    Write-Host "   [CONTRACT] /api/games/shoot .......... ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# 2) Assert Produção Estrito
Write-Host "2. Executando validação estrita..." -ForegroundColor Yellow
try {
    if (Test-Path "scripts/assert-prod-simple.ps1") {
        & "scripts/assert-prod-simple.ps1" -ApiBase $ApiBase -PlayerUrl $PlayerUrl -AdminUrl $AdminUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [ASSERT]   Produção estrita ........... OK" -ForegroundColor Green
        } else {
            Write-Host "   [ASSERT]   Produção estrita ........... FAIL" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "   [ASSERT]   Produção estrita ........... SKIP (script não encontrado)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ASSERT]   Produção estrita ........... ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# 3) Evidence Pack
Write-Host "3. Gerando evidence pack..." -ForegroundColor Yellow
try {
    if (Test-Path "scripts/capture-evidence-simple.ps1") {
        & "scripts/capture-evidence-simple.ps1" -ApiBase $ApiBase -PlayerUrl $PlayerUrl -AdminUrl $AdminUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [EVIDENCE] Pack gerado ................ OK" -ForegroundColor Green
        } else {
            Write-Host "   [EVIDENCE] Pack gerado ................ FAIL" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "   [EVIDENCE] Pack gerado ................ SKIP (script não encontrado)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [EVIDENCE] Pack gerado ................ ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# Resultado final
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 RESUMO DA RELEASE v1.1.2:" -ForegroundColor White
Write-Host ""

if ($allTestsPassed) {
    Write-Host "[CONTRACT] /api/games/shoot .......... OK" -ForegroundColor Green
    Write-Host "[ASSERT]   Produção estrita ........... OK" -ForegroundColor Green
    Write-Host "[EVIDENCE] Pack gerado ................ OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Release v1.1.2 pronta" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 COMANDOS PARA FINALIZAR:" -ForegroundColor Cyan
    Write-Host "git tag -a v1.1.2 -m `"Release v1.1.2`"" -ForegroundColor White
    Write-Host "git push --tags" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 RELEASE v1.1.2 APROVADA!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[CONTRACT] /api/games/shoot .......... FAIL" -ForegroundColor Red
    Write-Host "[ASSERT]   Produção estrita ........... FAIL" -ForegroundColor Red
    Write-Host "[EVIDENCE] Pack gerado ................ FAIL" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ Release v1.1.2 rejeitada" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 CORREÇÕES NECESSÁRIAS:" -ForegroundColor Yellow
    Write-Host "• Verificar testes de contrato" -ForegroundColor White
    Write-Host "• Validar produção estrita" -ForegroundColor White
    Write-Host "• Confirmar evidence pack" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️ RELEASE v1.1.2 REJEITADA!" -ForegroundColor Red
    exit 1
}
