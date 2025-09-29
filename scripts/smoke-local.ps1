# Verifica que server-fly.js usa PORT e /health
$server = Get-Content server-fly.js -Raw
if ($server -notmatch "process\.env\.PORT") { Write-Error "server-fly.js sem process.env.PORT"; exit 1 }
if ($server -notmatch "app\.get\('/health'") { Write-Error "server-fly.js sem rota /health"; exit 1 }
Write-Host "✅ server-fly.js OK"

# Checa Dockerfile sem COPY . .
$df = Get-Content Dockerfile -Raw
if ($df -match "COPY\s+\.\s+\.\b") { Write-Error "Dockerfile contém COPY . ."; exit 1 }
Write-Host "✅ Dockerfile sem COPY . ."

# Checa vercel.json SPA fallback
$vz = Get-Content goldeouro-admin/vercel.json -Raw
if ($vz -notmatch '"routes"') { Write-Error "vercel.json sem routes SPA fallback"; exit 1 }
Write-Host "✅ vercel.json SPA fallback"
