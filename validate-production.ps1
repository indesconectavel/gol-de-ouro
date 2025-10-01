# === VALIDACAO FINAL PRODUCAO (PLAYER + ADMIN + BACKEND) ===
# Requisitos: PowerShell + Invoke-WebRequest

$PLAYER_DOMAIN = "https://www.goldeouro.lol"
$ADMIN_DOMAIN = "https://admin.goldeouro.lol"
$BACKEND = "https://goldeouro-backend-v2.fly.dev"

function Write-Green { Write-Host $args -ForegroundColor Green }
function Write-Red { Write-Host $args -ForegroundColor Red }
function Write-Cyan { Write-Host $args -ForegroundColor Cyan }

$PASS = @()
$FAIL = @()

function Test-Check {
    param($Name, $ScriptBlock)
    try {
        if (& $ScriptBlock) {
            Write-Green "✔ $Name"
            $script:PASS += $Name
        } else {
            Write-Red "✖ $Name"
            $script:FAIL += $Name
        }
    } catch {
        Write-Red "✖ $Name"
        $script:FAIL += $Name
    }
}

Write-Cyan "`n=== VALIDACAO FINAL DE PRODUCAO ==="

Write-Cyan "`n# 1) Vercel.json (player) – rewrites + headers + CSP"
Test-Check "Rewrites /api" {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    $vercel.rewrites | Where-Object { $_.source -like "*/api/*" } | Measure-Object | Select-Object -ExpandProperty Count | Where-Object { $_ -gt 0 }
}

Test-Check "SPA fallback" {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    $vercel.rewrites | Where-Object { $_.destination -eq "/index.html" } | Measure-Object | Select-Object -ExpandProperty Count | Where-Object { $_ -gt 0 }
}

Test-Check "Headers manifest" {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    $vercel.headers | Where-Object { $_.source -eq "/manifest.webmanifest" } | Measure-Object | Select-Object -ExpandProperty Count | Where-Object { $_ -gt 0 }
}

Test-Check "Headers sw.js" {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    $swHeader = $vercel.headers | Where-Object { $_.source -eq "/sw.js" }
    $swHeader -and $swHeader.headers | Where-Object { $_.key -eq "Cache-Control" } | Measure-Object | Select-Object -ExpandProperty Count | Where-Object { $_ -gt 0 }
}

Test-Check "CSP inclui backend" {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    $cspHeader = $vercel.headers | Where-Object { $_.source -eq "/(.*)" }
    $cspHeader -and $cspHeader.headers | Where-Object { $_.key -eq "Content-Security-Policy" -and $_.value -like "*goldeouro-backend-v2.fly.dev*" } | Measure-Object | Select-Object -ExpandProperty Count | Where-Object { $_ -gt 0 }
}

Write-Cyan "`n# 2) PWA (player)"
Test-Check "Manifest 200" {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/manifest.webmanifest" -Method Head -TimeoutSec 10
    $response.Headers["Content-Type"] -like "*application/manifest+json*"
}

Test-Check "SW 200 + no-cache" {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/sw.js" -Method Head -TimeoutSec 10
    $response.Headers["Cache-Control"] -like "*no-cache*"
}

Write-Cyan "`n# 3) API via proxy (player)"
Test-Check "GET /api/health 200" {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/api/health" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    $json.status -eq "healthy"
}

Test-Check "POST /api/games/shoot -> 401 sem token" {
    try {
        $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/api/games/shoot" -Method Post -Body '{"power":50,"direction":"center"}' -ContentType "application/json" -TimeoutSec 10
        $response.StatusCode -eq 401 -or $response.StatusCode -eq 403
    } catch {
        $_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403
    }
}

Write-Cyan "`n# 4) CSP efetivo (player)"
Test-Check "Header CSP presente" {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN" -Method Head -TimeoutSec 10
    $response.Headers["Content-Security-Policy"]
}

Test-Check "CSP libera backend" {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN" -Method Head -TimeoutSec 10
    $response.Headers["Content-Security-Policy"] -like "*goldeouro-backend-v2.fly.dev*"
}

Write-Cyan "`n# 5) Admin"
Test-Check "Admin /login 200" {
    $response = Invoke-WebRequest -Uri "$ADMIN_DOMAIN/login" -Method Get -TimeoutSec 10
    $response.StatusCode -eq 200
}

Test-Check "Admin health via backend" {
    $response = Invoke-WebRequest -Uri "$BACKEND/health" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    $json.status -eq "healthy"
}

Write-Cyan "`n# 6) Backend direto"
Test-Check "GET /health 200" {
    $response = Invoke-WebRequest -Uri "$BACKEND/health" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    $json.status -eq "healthy"
}

Test-Check "GET /meta 200" {
    $response = Invoke-WebRequest -Uri "$BACKEND/meta" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    $json.ok -eq $true
}

Write-Cyan "`n--- RESUMO FINAL ---"
Write-Green "PASS: $($PASS.Count)"
$PASS | ForEach-Object { Write-Host " - $_" }
Write-Red "FAIL: $($FAIL.Count)"
$FAIL | ForEach-Object { Write-Host " - $_" }

if ($FAIL.Count -eq 0) {
    Write-Green "`n🎉 VALIDACAO 100% - STATUS: GO!"
    exit 0
} else {
    Write-Red "`n❌ VALIDACAO INCOMPLETA - STATUS: NO-GO"
    exit 1
}