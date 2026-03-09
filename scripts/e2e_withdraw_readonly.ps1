# E2E Saque - Somente leitura (GET profile + GET history)
# Uso: defina $env:BEARER = "Bearer <JWT>" e execute: .\scripts\e2e_withdraw_readonly.ps1
# Ou: .\scripts\e2e_withdraw_readonly.ps1 (usa $env:BEARER da sessão)

$ErrorActionPreference = 'Stop'
$BaseUrl = 'https://goldeouro-backend-v2.fly.dev'

if (-not $env:BEARER) {
    Write-Host "AVISO: `$env:BEARER nao definido. Defina com: `$env:BEARER = 'Bearer <seu-jwt>'"
    $env:BEARER = $null
}

$headers = @{
    'Content-Type' = 'application/json'
    'Accept'       = 'application/json'
}
if ($env:BEARER) { $headers['Authorization'] = $env:BEARER }

Write-Host "=== E2E Withdraw READ-ONLY (GET only) ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl"
Write-Host ""

# 1) GET /api/user/profile
Write-Host "[1] GET /api/user/profile" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile" -Method GET -Headers $headers -UseBasicParsing
    $profile = $r.Content | ConvertFrom-Json
    Write-Host "  Status: $($r.StatusCode)"
    if ($profile.success -and $profile.data) {
        Write-Host "  User: $($profile.data.username) | Saldo: $($profile.data.saldo)"
    } else {
        Write-Host "  Body: $($r.Content)"
    }
} catch {
    Write-Host "  Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        Write-Host "  HTTP: $code"
    }
}
Write-Host ""

# 2) GET /api/withdraw/history
Write-Host "[2] GET /api/withdraw/history" -ForegroundColor Yellow
try {
    $r2 = Invoke-WebRequest -Uri "$BaseUrl/api/withdraw/history" -Method GET -Headers $headers -UseBasicParsing
    $history = $r2.Content | ConvertFrom-Json
    Write-Host "  Status: $($r2.StatusCode)"
    if ($history.success -and $history.data.saques) {
        $total = $history.data.saques.Count
        Write-Host "  Total saques: $total"
        foreach ($s in $history.data.saques | Select-Object -First 5) {
            Write-Host "    - id=$($s.id) valor=$($s.valor) status=$($s.status) created=$($s.created_at)"
        }
    } else {
        Write-Host "  Body (resumo): $($r2.Content.Substring(0, [Math]::Min(200, $r2.Content.Length)))..."
    }
} catch {
    Write-Host "  Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        Write-Host "  HTTP: $code"
    }
}

Write-Host ""
Write-Host "=== Fim (read-only) ===" -ForegroundColor Cyan
