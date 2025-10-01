# === VALIDACAO SIMPLES DE PRODUCAO ===

$PLAYER_DOMAIN = "https://www.goldeouro.lol"
$ADMIN_DOMAIN = "https://admin.goldeouro.lol"
$BACKEND = "https://goldeouro-backend-v2.fly.dev"

$PASS = @()
$FAIL = @()

Write-Host "`n=== VALIDACAO FINAL DE PRODUCAO ===" -ForegroundColor Yellow

# 1) Vercel.json
Write-Host "`n# 1) Vercel.json (player)" -ForegroundColor Cyan
try {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    if ($vercel.rewrites | Where-Object { $_.source -like "*/api/*" }) {
        Write-Host "✔ Rewrites /api" -ForegroundColor Green
        $PASS += "Rewrites /api"
    } else {
        Write-Host "✖ Rewrites /api" -ForegroundColor Red
        $FAIL += "Rewrites /api"
    }
} catch {
    Write-Host "✖ Rewrites /api" -ForegroundColor Red
    $FAIL += "Rewrites /api"
}

try {
    $vercel = Get-Content "player-dist-deploy/vercel.json" | ConvertFrom-Json
    if ($vercel.rewrites | Where-Object { $_.destination -eq "/index.html" }) {
        Write-Host "✔ SPA fallback" -ForegroundColor Green
        $PASS += "SPA fallback"
    } else {
        Write-Host "✖ SPA fallback" -ForegroundColor Red
        $FAIL += "SPA fallback"
    }
} catch {
    Write-Host "✖ SPA fallback" -ForegroundColor Red
    $FAIL += "SPA fallback"
}

# 2) PWA
Write-Host "`n# 2) PWA (player)" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/manifest.webmanifest" -Method Head -TimeoutSec 10
    if ($response.Headers["Content-Type"] -like "*application/manifest+json*") {
        Write-Host "✔ Manifest 200" -ForegroundColor Green
        $PASS += "Manifest 200"
    } else {
        Write-Host "✖ Manifest 200" -ForegroundColor Red
        $FAIL += "Manifest 200"
    }
} catch {
    Write-Host "✖ Manifest 200" -ForegroundColor Red
    $FAIL += "Manifest 200"
}

try {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/sw.js" -Method Head -TimeoutSec 10
    if ($response.Headers["Cache-Control"] -like "*no-cache*") {
        Write-Host "✔ SW 200 + no-cache" -ForegroundColor Green
        $PASS += "SW 200 + no-cache"
    } else {
        Write-Host "✖ SW 200 + no-cache" -ForegroundColor Red
        $FAIL += "SW 200 + no-cache"
    }
} catch {
    Write-Host "✖ SW 200 + no-cache" -ForegroundColor Red
    $FAIL += "SW 200 + no-cache"
}

# 3) API via proxy
Write-Host "`n# 3) API via proxy (player)" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/api/health" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    if ($json.status -eq "healthy") {
        Write-Host "✔ GET /api/health 200" -ForegroundColor Green
        $PASS += "GET /api/health 200"
    } else {
        Write-Host "✖ GET /api/health 200" -ForegroundColor Red
        $FAIL += "GET /api/health 200"
    }
} catch {
    Write-Host "✖ GET /api/health 200" -ForegroundColor Red
    $FAIL += "GET /api/health 200"
}

try {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN/api/games/shoot" -Method Post -Body '{"power":50,"direction":"center"}' -ContentType "application/json" -TimeoutSec 10
    if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
        Write-Host "✔ POST /api/games/shoot -> 401 sem token" -ForegroundColor Green
        $PASS += "POST /api/games/shoot -> 401 sem token"
    } else {
        Write-Host "✖ POST /api/games/shoot -> 401 sem token" -ForegroundColor Red
        $FAIL += "POST /api/games/shoot -> 401 sem token"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✔ POST /api/games/shoot -> 401 sem token" -ForegroundColor Green
        $PASS += "POST /api/games/shoot -> 401 sem token"
    } else {
        Write-Host "✖ POST /api/games/shoot -> 401 sem token" -ForegroundColor Red
        $FAIL += "POST /api/games/shoot -> 401 sem token"
    }
}

# 4) CSP
Write-Host "`n# 4) CSP efetivo (player)" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN" -Method Head -TimeoutSec 10
    if ($response.Headers["Content-Security-Policy"]) {
        Write-Host "✔ Header CSP presente" -ForegroundColor Green
        $PASS += "Header CSP presente"
    } else {
        Write-Host "✖ Header CSP presente" -ForegroundColor Red
        $FAIL += "Header CSP presente"
    }
} catch {
    Write-Host "✖ Header CSP presente" -ForegroundColor Red
    $FAIL += "Header CSP presente"
}

try {
    $response = Invoke-WebRequest -Uri "$PLAYER_DOMAIN" -Method Head -TimeoutSec 10
    if ($response.Headers["Content-Security-Policy"] -like "*goldeouro-backend-v2.fly.dev*") {
        Write-Host "✔ CSP libera backend" -ForegroundColor Green
        $PASS += "CSP libera backend"
    } else {
        Write-Host "✖ CSP libera backend" -ForegroundColor Red
        $FAIL += "CSP libera backend"
    }
} catch {
    Write-Host "✖ CSP libera backend" -ForegroundColor Red
    $FAIL += "CSP libera backend"
}

# 5) Admin
Write-Host "`n# 5) Admin" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$ADMIN_DOMAIN/login" -Method Get -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✔ Admin /login 200" -ForegroundColor Green
        $PASS += "Admin /login 200"
    } else {
        Write-Host "✖ Admin /login 200" -ForegroundColor Red
        $FAIL += "Admin /login 200"
    }
} catch {
    Write-Host "✖ Admin /login 200" -ForegroundColor Red
    $FAIL += "Admin /login 200"
}

try {
    $response = Invoke-WebRequest -Uri "$BACKEND/health" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    if ($json.status -eq "healthy") {
        Write-Host "✔ Admin health via backend" -ForegroundColor Green
        $PASS += "Admin health via backend"
    } else {
        Write-Host "✖ Admin health via backend" -ForegroundColor Red
        $FAIL += "Admin health via backend"
    }
} catch {
    Write-Host "✖ Admin health via backend" -ForegroundColor Red
    $FAIL += "Admin health via backend"
}

# 6) Backend direto
Write-Host "`n# 6) Backend direto" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BACKEND/health" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    if ($json.status -eq "healthy") {
        Write-Host "✔ GET /health 200" -ForegroundColor Green
        $PASS += "GET /health 200"
    } else {
        Write-Host "✖ GET /health 200" -ForegroundColor Red
        $FAIL += "GET /health 200"
    }
} catch {
    Write-Host "✖ GET /health 200" -ForegroundColor Red
    $FAIL += "GET /health 200"
}

try {
    $response = Invoke-WebRequest -Uri "$BACKEND/meta" -Method Get -TimeoutSec 10
    $json = $response.Content | ConvertFrom-Json
    if ($json.ok -eq $true) {
        Write-Host "✔ GET /meta 200" -ForegroundColor Green
        $PASS += "GET /meta 200"
    } else {
        Write-Host "✖ GET /meta 200" -ForegroundColor Red
        $FAIL += "GET /meta 200"
    }
} catch {
    Write-Host "✖ GET /meta 200" -ForegroundColor Red
    $FAIL += "GET /meta 200"
}

# Resumo
Write-Host "`n--- RESUMO FINAL ---" -ForegroundColor Green
Write-Host "PASS: $($PASS.Count)" -ForegroundColor Green
$PASS | ForEach-Object { Write-Host " - $_" }
Write-Host "FAIL: $($FAIL.Count)" -ForegroundColor Red
$FAIL | ForEach-Object { Write-Host " - $_" }

if ($FAIL.Count -eq 0) {
    Write-Host "`n🎉 VALIDACAO 100% - STATUS: GO!" -ForegroundColor Green
} else {
    Write-Host "`n❌ VALIDACAO INCOMPLETA - STATUS: NO-GO" -ForegroundColor Red
}
