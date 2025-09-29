Param(
  [Parameter(Mandatory=$true)][string]$AppName
)

Write-Host "== Releases ==" -ForegroundColor Cyan
flyctl releases --app $AppName --json | ConvertFrom-Json | Select-Object -ExpandProperty Releases | 
  Select-Object -First 5 | ForEach-Object { "$($_.Version) - $($_.Status) - $($_.User) - $($_.Description)" }

$target = Read-Host "Digite o número da release para rollback (ex.: v29)"
if (-not $target) { Write-Error "Release inválida"; exit 1 }

flyctl releases --app $AppName --json | ConvertFrom-Json | 
  Select-Object -ExpandProperty Releases | Where-Object { $_.Version -eq [int]$target.Substring(1) } | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "Release não encontrada"; exit 1 }

Write-Host "== Rolling back para $target ==" -ForegroundColor Yellow
flyctl releases rollback $target --app $AppName
flyctl status -a $AppName
flyctl logs -a $AppName --since 5m
