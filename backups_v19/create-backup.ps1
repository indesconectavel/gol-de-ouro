# Script de Backup V19 - Gol de Ouro Backend
# Cria backups completos do código-fonte e Engine V19

$ErrorActionPreference = "Stop"

# Diretórios a excluir
$excludeDirs = @('node_modules', 'logs', '.vscode', 'dist', 'build', 'backups_v19', '.git', 'BACKUP-COMPLETO-GO-LIVE-v1.1.1-2025-10-15-19-15-02')

# ETAPA 0.2: Backup completo do código-fonte
Write-Host "=== ETAPA 0.2: Backup do código-fonte ===" -ForegroundColor Cyan

$items = @()
Get-ChildItem -Path . -Directory | Where-Object { $excludeDirs -notcontains $_.Name } | ForEach-Object {
    $items += $_.FullName
}
Get-ChildItem -Path . -File | Where-Object { $_.Name -ne '.env' } | ForEach-Object {
    $items += $_.FullName
}

if ($items.Count -gt 0) {
    Compress-Archive -Path $items -DestinationPath "backups_v19\staging\codigo_snapshot_v19.zip" -Force
    Write-Host "Backup criado com $($items.Count) itens" -ForegroundColor Green
    
    # Gerar MD5
    $zipFile = "backups_v19\staging\codigo_snapshot_v19.zip"
    if (Test-Path $zipFile) {
        $hash = Get-FileHash -Path $zipFile -Algorithm MD5
        $hash.Hash | Out-File -FilePath "backups_v19\staging\codigo_snapshot_v19.md5" -Encoding UTF8
        Write-Host "MD5 gerado: $($hash.Hash)" -ForegroundColor Green
    }
} else {
    Write-Host "Nenhum item encontrado" -ForegroundColor Yellow
}

# ETAPA 0.3: Backup da Engine V19
Write-Host "`n=== ETAPA 0.3: Backup da Engine V19 ===" -ForegroundColor Cyan

$engineItems = @()
$enginePaths = @('src\controllers', 'src\services', 'src\routes', 'src\db', 'database\migration_v19', 'patches\v19', 'env.example', 'server-fly.js', 'config\required-env.js')

foreach ($path in $enginePaths) {
    if (Test-Path $path) {
        $engineItems += $path
    }
}

if ($engineItems.Count -gt 0) {
    Compress-Archive -Path $engineItems -DestinationPath "backups_v19\staging\engine_v19_snapshot.zip" -Force
    Write-Host "Backup da Engine criado com $($engineItems.Count) itens" -ForegroundColor Green
    
    # Gerar MD5
    $zipFile = "backups_v19\staging\engine_v19_snapshot.zip"
    if (Test-Path $zipFile) {
        $hash = Get-FileHash -Path $zipFile -Algorithm MD5
        $hash.Hash | Out-File -FilePath "backups_v19\staging\engine_v19_hash.md5" -Encoding UTF8
        Write-Host "MD5 gerado: $($hash.Hash)" -ForegroundColor Green
    }
} else {
    Write-Host "Nenhum item da Engine encontrado" -ForegroundColor Yellow
}

Write-Host "`n=== Backup concluído ===" -ForegroundColor Green

