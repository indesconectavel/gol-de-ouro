# E2E Saque - Execução (GET profile + POST withdraw + GET history)
# Exige: $env:BEARER = "Bearer <JWT>"
# Uso: $env:BEARER = "Bearer <token>"; .\scripts\e2e_withdraw_execute.ps1

$ErrorActionPreference = 'Stop'
$BaseUrl = 'https://goldeouro-backend-v2.fly.dev'

if (-not $env:BEARER) {
    Write-Error "Defina `$env:BEARER antes de executar. Ex: `$env:BEARER = 'Bearer <JWT>'"
    exit 1
}

$idempotencyKey = "e2e-withdraw-" + (Get-Date -Format "yyyyMMdd-HHmmss") + "-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
$headers = @{
    'Content-Type'     = 'application/json'
    'Accept'           = 'application/json'
    'Authorization'     = $env:BEARER
    'x-idempotency-key' = $idempotencyKey
}

# Valor mínimo e chave PIX (ajuste se necessário; email do usuário é comum)
$body = @{
    valor      = 10
    chave_pix  = "free10signer@gmail.com"
    tipo_chave = "email"
} | ConvertTo-Json

Write-Host "=== E2E Withdraw EXECUTE ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl"
Write-Host "Idempotency-Key: $idempotencyKey"
Write-Host ""

# 1) GET profile
Write-Host "[1] GET /api/user/profile" -ForegroundColor Yellow
$profileStatus = $null
$profileSaldo = $null
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile" -Method GET -Headers @{ Authorization = $env:BEARER; Accept = 'application/json' } -UseBasicParsing
    $profileStatus = $r.StatusCode
    $profile = $r.Content | ConvertFrom-Json
    if ($profile.success -and $profile.data) { $profileSaldo = $profile.data.saldo }
    Write-Host "  Status: $profileStatus | Saldo: $profileSaldo"
} catch {
    $profileStatus = [int]$_.Exception.Response.StatusCode
    Write-Host "  Erro: $($_.Exception.Message) | HTTP: $profileStatus"
}
Write-Host ""

# 2) POST withdraw
Write-Host "[2] POST /api/withdraw/request (valor=10, chave=email)" -ForegroundColor Yellow
$postStatus = $null
$postSuccess = $null
$saqueId = $null
try {
    $r2 = Invoke-WebRequest -Uri "$BaseUrl/api/withdraw/request" -Method POST -Headers $headers -Body $body -UseBasicParsing
    $postStatus = $r2.StatusCode
    $resp = $r2.Content | ConvertFrom-Json
    $postSuccess = $resp.success -eq $true
    if ($resp.data) { $saqueId = $resp.data.id }
    Write-Host "  Status: $postStatus | success=$postSuccess | saqueId=$saqueId"
} catch {
    $postStatus = [int]$_.Exception.Response.StatusCode
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    Write-Host "  HTTP: $postStatus | Body: $errBody"
}
Write-Host ""

# 3) GET history
Write-Host "[3] GET /api/withdraw/history" -ForegroundColor Yellow
$histStatus = $null
$histTotal = $null
try {
    $r3 = Invoke-WebRequest -Uri "$BaseUrl/api/withdraw/history" -Method GET -Headers @{ Authorization = $env:BEARER; Accept = 'application/json' } -UseBasicParsing
    $histStatus = $r3.StatusCode
    $history = $r3.Content | ConvertFrom-Json
    if ($history.success -and $history.data.saques) { $histTotal = $history.data.saques.Count }
    Write-Host "  Status: $histStatus | Total saques: $histTotal"
} catch {
    $histStatus = [int]$_.Exception.Response.StatusCode
    Write-Host "  Erro: $($_.Exception.Message) | HTTP: $histStatus"
}
Write-Host ""

# Resumo (sem vazar token)
Write-Host "=== RESUMO ===" -ForegroundColor Cyan
Write-Host "Profile: $profileStatus | Saldo: $profileSaldo"
Write-Host "POST withdraw: $postStatus | success=$postSuccess | saqueId=$saqueId"
Write-Host "History: $histStatus | total=$histTotal"
$go = ($postStatus -eq 200 -or $postStatus -eq 201) -and $postSuccess -eq $true
Write-Host "E2E Saque (cliente): $(if ($go) { 'GO' } else { 'NO-GO' })"
Write-Host "=== Fim ===" -ForegroundColor Cyan
