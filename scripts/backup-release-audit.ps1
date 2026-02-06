# MAX SAFETY RELEASE AUDIT - Backup local (sem segredos)
# Compatível com Windows PowerShell. Nao inclui .env, *.pem, *.key, node_modules, .git, dist/build.

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupBase = "RELEASE-AUDIT-2026-02-05"
$backupsRoot = Join-Path $root "backups"
$suffix = Get-Date -Format "HHmm"
$backupFolderName = $backupBase + "-" + $suffix
$backupDir = Join-Path $backupsRoot $backupFolderName
$zipPath = Join-Path $backupsRoot ($backupFolderName + ".zip")

if (-not (Test-Path $backupsRoot)) { New-Item -ItemType Directory -Path $backupsRoot -Force | Out-Null }
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$included = [System.Collections.ArrayList]@()
$releaseAuditSrc = Join-Path $root (Join-Path "docs" (Join-Path "relatorios" "RELEASE-AUDIT"))
$releaseAuditDest = Join-Path $backupDir (Join-Path "docs" (Join-Path "relatorios" "RELEASE-AUDIT"))
if (Test-Path $releaseAuditSrc) {
    New-Item -ItemType Directory -Path $releaseAuditDest -Force | Out-Null
    Copy-Item -Path (Join-Path $releaseAuditSrc "*") -Destination $releaseAuditDest -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $releaseAuditDest -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $included.Add($_.FullName.Replace($backupDir, "").TrimStart("\", "/")) | Out-Null
    }
}
$scriptsDest = Join-Path $backupDir "scripts"
New-Item -ItemType Directory -Path $scriptsDest -Force | Out-Null
@("release-audit-pix-depositos-readonly.js", "release-audit-pix-saques-readonly.js", "release-audit-pix-consolidado-readonly.js", "backup-release-audit.ps1") | ForEach-Object {
    $src = Join-Path (Join-Path $root "scripts") $_
    if (Test-Path $src) {
        Copy-Item -LiteralPath $src -Destination (Join-Path $scriptsDest $_) -Force
        $included.Add("scripts\" + $_) | Out-Null
    }
}
$manifestPath = Join-Path $backupDir "MANIFEST.txt"
$manifest = "MAX SAFETY RELEASE AUDIT - Backup Manifest`r`n"
$manifest += "Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "`r`n"
$manifest += "Backup folder: " + $backupFolderName + "`r`n"
$manifest += "Included: docs/relatorios/RELEASE-AUDIT (all), scripts release-audit*.js and backup-release-audit.ps1`r`n"
$manifest += "Excluded: .env, *.pem, *.key, token-real.txt, node_modules, .git`r`n`r`n"
$manifest += "--- FILES INCLUDED ---`r`n"
foreach ($f in $included) { $manifest += $f + "`r`n" }
[System.IO.File]::WriteAllText($manifestPath, $manifest)

if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force
    Write-Output "[BACKUP] ZIP created"
}
Write-Output "[BACKUP] Dir: $backupDir"
Write-Output "[BACKUP] MANIFEST: $manifestPath"
