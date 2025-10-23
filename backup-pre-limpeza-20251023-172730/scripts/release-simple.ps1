# Release simples v1.1.2
Write-Host "RELEASE v1.1.2 - GOL DE OURO" -ForegroundColor Cyan
Write-Host ""

# 1) Teste de Contrato
Write-Host "1. Testando contratos..." -ForegroundColor Yellow
try {
    Set-Location "goldeouro-backend"
    npm run test:contract
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [CONTRACT] /api/games/shoot .......... OK" -ForegroundColor Green
    } else {
        Write-Host "   [CONTRACT] /api/games/shoot .......... FAIL" -ForegroundColor Red
        exit 1
    }
    Set-Location ".."
} catch {
    Write-Host "   [CONTRACT] /api/games/shoot .......... ERROR" -ForegroundColor Red
    exit 1
}

# 2) Validação Estrita
Write-Host "2. Validando producao..." -ForegroundColor Yellow
try {
    & "scripts/check-prod.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [ASSERT]   Producao estrita ........... OK" -ForegroundColor Green
    } else {
        Write-Host "   [ASSERT]   Producao estrita ........... FAIL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [ASSERT]   Producao estrita ........... ERROR" -ForegroundColor Red
    exit 1
}

# 3) Evidence Pack
Write-Host "3. Gerando evidencias..." -ForegroundColor Yellow
try {
    & "scripts/capture-evidence-simple.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [EVIDENCE] Pack gerado ................ OK" -ForegroundColor Green
    } else {
        Write-Host "   [EVIDENCE] Pack gerado ................ FAIL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [EVIDENCE] Pack gerado ................ ERROR" -ForegroundColor Red
    exit 1
}

# Resultado
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "[CONTRACT] /api/games/shoot .......... OK" -ForegroundColor Green
Write-Host "[ASSERT]   Producao estrita ........... OK" -ForegroundColor Green
Write-Host "[EVIDENCE] Pack gerado ................ OK" -ForegroundColor Green
Write-Host ""
Write-Host "Release v1.1.2 pronta" -ForegroundColor Green
Write-Host ""
Write-Host "COMANDOS FINAIS:" -ForegroundColor Cyan
Write-Host "git tag -a v1.1.2 -m `"Release v1.1.2`"" -ForegroundColor White
Write-Host "git push --tags" -ForegroundColor White
