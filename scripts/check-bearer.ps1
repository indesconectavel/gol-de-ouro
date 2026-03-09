# check-bearer.ps1
# Valida $env:BEARER e imprime TOKEN_OK/TOKEN_BAD + LEN + HEAD/TAIL (sem vazar o segredo).

$ErrorActionPreference = "SilentlyContinue"
$full = $env:BEARER -as [string]
if (-not $full -or $full.Length -eq 0) {
    Write-Host "TOKEN_BAD" -ForegroundColor Red
    Write-Host "TOKEN_LEN 0"
    Write-Host "TOKEN_HEAD (vazio)"
    Write-Host "TOKEN_TAIL (vazio)"
    Write-Host "[CHECK] `$env:BEARER nao definido." -ForegroundColor Yellow
    exit 1
}
$token = $full.Trim()
if ($token.StartsWith("Bearer ")) { $token = $token.Substring(7).Trim() }
$ok = $full.StartsWith("Bearer ") -and $full.Length -gt 50 -and $token -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'
if ($ok) {
    Write-Host "TOKEN_OK" -ForegroundColor Green
} else {
    Write-Host "TOKEN_BAD" -ForegroundColor Red
}
Write-Host "TOKEN_LEN $($full.Length)"
$head = if ($full.Length -ge 12) { $full.Substring(0, 12) } else { $full }
$tail = if ($full.Length -ge 8) { $full.Substring($full.Length - 8, 8) } else { $full }
Write-Host "TOKEN_HEAD $head"
Write-Host "TOKEN_TAIL $tail"
