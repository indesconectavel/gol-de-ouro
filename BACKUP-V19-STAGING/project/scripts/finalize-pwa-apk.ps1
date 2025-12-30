# scripts/finalize-pwa-apk.ps1 - Finalizar PWA + APK v1.1.2
Param(
  [string]$PlayerDir = "goldeouro-player",
  [string]$AdminDir = "goldeouro-admin"
)

$ErrorActionPreference = 'Stop'
function Step($name, $block){ 
  try { 
    Write-Host ">> $name" -ForegroundColor Cyan
    & $block
    Write-Host "[OK] $name" -ForegroundColor Green 
  } catch { 
    Write-Error "[FAIL] $name`: $($_.Exception.Message)"
    exit 1 
  }
}

Write-Host "=== FINALIZAR PWA + APK v1.1.2 ===" -ForegroundColor Cyan

# 1) Capacitor init/add (se necessário)
Step "Capacitor init/add (Player)" {
  Set-Location $PlayerDir
  if (!(Test-Path "android")) {
    if (!(Test-Path "capacitor.config.ts")) {
      npx cap init "Gol de Ouro" "com.goldeouro.app" --web-dir=dist
    }
    npx cap add android
  }
}

# 2) Build PWA Player
Step "Build PWA (Player)" { 
  npm run build 
}

# 3) Build PWA Admin
Step "Build PWA (Admin)" {
  Set-Location "..\$AdminDir"
  npm run build
}

# 4) Copy e abrir Android Studio
Step "Capacitor copy" {
  Set-Location "..\$PlayerDir"
  npx cap copy
}
Step "Abrir Android Studio" { 
  npx cap open android 
}

# 5) Verificações de PWA (manifest + SW) no Player dist
Step "Verificar manifest/SW (Player dist)" {
  $dist = Join-Path (Get-Location) "dist"
  if (!(Test-Path $dist)) { throw "dist não encontrado" }
  $index = Get-Content (Join-Path $dist "index.html") -Raw
  if ($index -notmatch "manifest" -or $index -notmatch "sw.js") {
    Write-Warning "Manifest/SW não detectados no HTML final. Se usa vite-plugin-pwa, confirme o inject/estratégia."
  }
}

Write-Host ""
Write-Host "[PWA Player] Build ...................... OK" -ForegroundColor Green
Write-Host "[PWA Admin]  Build ...................... OK" -ForegroundColor Green
Write-Host "[APK]        Android Studio aberto ...... OK" -ForegroundColor Green
Write-Host ""
Write-Host "✅ v1.1.2 pronto: gere o APK (Build APK) e valide no aparelho/emulador." -ForegroundColor Green

# Instruções finais no console:
Write-Host "`nApós gerar o APK:" -ForegroundColor Yellow
Write-Host "- Instale no dispositivo, abra e valide que carrega https://goldeouro.lol" -ForegroundColor Yellow
Write-Host "- No navegador, confirme manifest + service worker ativos (DevTools > Application)" -ForegroundColor Yellow
Write-Host "- Opcional: rode scripts/go-no-go.ps1 para GO final" -ForegroundColor Yellow
